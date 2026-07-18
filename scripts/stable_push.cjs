#!/usr/bin/env node

const { execFileSync, spawnSync } = require('node:child_process')
const https = require('node:https')

const BANNED_PATH_RE = /(^|\/)(01-exams|local-audit|webbridge-req)(\/|$)|\.pdf$/i
const BANNED_TEXT_RE = /local-audit|LocalAudit|本地验收|local audit|webbridge-req/

function run(cmd, args, options = {}) {
  return execFileSync(cmd, args, {
    encoding: options.encoding || 'utf8',
    stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
    input: options.input,
    maxBuffer: 64 * 1024 * 1024,
  }).trim()
}

function runBuffer(cmd, args) {
  return execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 })
}

function git(args, options = {}) {
  return run('git', args, options)
}

function parseRemote(url) {
  const httpsMatch = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/.]+)(?:\.git)?$/i)
  if (httpsMatch) return { owner: httpsMatch[1], repo: httpsMatch[2] }

  const sshMatch = url.match(/^git@github\.com:([^/]+)\/([^/.]+)(?:\.git)?$/i)
  if (sshMatch) return { owner: sshMatch[1], repo: sshMatch[2] }

  throw new Error(`Unsupported GitHub remote URL: ${url}`)
}

function tokenFromCredentialManager() {
  const result = spawnSync('git', ['credential', 'fill'], {
    input: 'protocol=https\nhost=github.com\n\n',
    encoding: 'utf8',
  })
  if (result.status !== 0) return ''
  const password = result.stdout
    .split(/\r?\n/)
    .find(line => line.startsWith('password='))
  return password ? password.slice('password='.length).trim() : ''
}

function getToken() {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || tokenFromCredentialManager()
}

function githubRequest({ method = 'GET', path, token, body }) {
  const payload = body === undefined ? undefined : JSON.stringify(body)
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'LynkEdu-stable-push',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  if (payload !== undefined) {
    headers['Content-Type'] = 'application/json'
    headers['Content-Length'] = Buffer.byteLength(payload)
  }

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      method,
      path,
      headers,
    }, res => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        const data = parseJsonResponse(text)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data)
        } else {
          reject(new Error(`${method} ${path} failed: ${res.statusCode} ${text.slice(0, 1000)}`))
        }
      })
    })
    req.on('error', reject)
    if (payload !== undefined) req.write(payload)
    req.end()
  })
}

function parseJsonResponse(text) {
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return { raw: text }
  }
}

function ensureCleanWorktree() {
  const status = git(['status', '--porcelain'])
  if (status) {
    throw new Error('Working tree is not clean. Commit changes before stable push.')
  }
}

function ensureNoBannedTrackedFiles() {
  const files = git(['ls-files']).split(/\r?\n/).filter(Boolean)
  const bannedFiles = files.filter(file => BANNED_PATH_RE.test(file.replace(/\\/g, '/')))
  if (bannedFiles.length) {
    throw new Error(`Refusing to push banned tracked files:\n${bannedFiles.join('\n')}`)
  }

  const grep = spawnSync('git', ['grep', '-n', '-I', '-E', BANNED_TEXT_RE.source, '--', 'src', 'public', 'package.json'], {
    encoding: 'utf8',
  })
  if (grep.status === 0 && grep.stdout.trim()) {
    throw new Error(`Refusing to push internal-audit markers:\n${grep.stdout.trim()}`)
  }
  if (grep.status !== 0 && grep.status !== 1) {
    throw new Error(`git grep failed:\n${grep.stderr}`)
  }
}

function localTreeEntries() {
  const raw = runBuffer('git', ['ls-tree', '-r', '-z', 'HEAD'])
  const parts = raw.toString('utf8').split('\0').filter(Boolean)
  return parts.map(part => {
    const match = part.match(/^(\d{6}) (\w+) ([0-9a-f]{40})\t(.+)$/)
    if (!match) throw new Error(`Could not parse git ls-tree entry: ${part}`)
    return {
      mode: match[1],
      type: match[2],
      sha: match[3],
      path: match[4],
    }
  })
}

async function normalGitPush(branch) {
  const result = spawnSync('git', ['push', 'origin', `HEAD:${branch}`], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.status === 0) {
    process.stdout.write(result.stdout)
    process.stderr.write(result.stderr)
    return true
  }
  process.stderr.write(result.stdout)
  process.stderr.write(result.stderr)
  return false
}

async function apiPush({ owner, repo, branch, token }) {
  const ref = await githubRequest({
    token,
    path: `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
  })
  const remoteHead = ref.object.sha
  const remoteCommit = await githubRequest({
    token,
    path: `/repos/${owner}/${repo}/git/commits/${remoteHead}`,
  })
  const remoteTreeSha = remoteCommit.tree.sha
  const remoteTree = await githubRequest({
    token,
    path: `/repos/${owner}/${repo}/git/trees/${remoteTreeSha}?recursive=1`,
  })
  if (remoteTree.truncated) {
    throw new Error('Remote tree is truncated; refusing API push because diff safety cannot be guaranteed.')
  }

  const remoteByPath = new Map(
    remoteTree.tree
      .filter(entry => entry.type === 'blob')
      .map(entry => [entry.path, entry])
  )
  const localEntries = localTreeEntries().filter(entry => entry.type === 'blob')
  const localByPath = new Map(localEntries.map(entry => [entry.path, entry]))
  const updates = []

  for (const entry of localEntries) {
    const remoteEntry = remoteByPath.get(entry.path)
    if (remoteEntry && remoteEntry.sha === entry.sha && remoteEntry.mode === entry.mode) continue

    const content = runBuffer('git', ['cat-file', '-p', entry.sha]).toString('base64')
    const blob = await githubRequest({
      method: 'POST',
      token,
      path: `/repos/${owner}/${repo}/git/blobs`,
      body: { content, encoding: 'base64' },
    })
    updates.push({ path: entry.path, mode: entry.mode, type: 'blob', sha: blob.sha })
  }

  for (const [path] of remoteByPath) {
    if (!localByPath.has(path)) {
      updates.push({ path, mode: '100644', type: 'blob', sha: null })
    }
  }

  if (updates.length === 0) {
    console.log(`Remote ${branch} already matches local HEAD tree.`)
    return remoteHead
  }

  const tree = await githubRequest({
    method: 'POST',
    token,
    path: `/repos/${owner}/${repo}/git/trees`,
    body: { base_tree: remoteTreeSha, tree: updates },
  })
  const localSubject = git(['log', '-1', '--pretty=%s'])
  const localBody = git(['log', '-1', '--pretty=%b'])
  const localHead = git(['rev-parse', 'HEAD'])
  const message = [
    localSubject,
    localBody,
    '',
    `Stable-push snapshot of local HEAD ${localHead}.`,
  ].filter(Boolean).join('\n')

  const commit = await githubRequest({
    method: 'POST',
    token,
    path: `/repos/${owner}/${repo}/git/commits`,
    body: {
      message,
      tree: tree.sha,
      parents: [remoteHead],
    },
  })

  await githubRequest({
    method: 'PATCH',
    token,
    path: `/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
    body: {
      sha: commit.sha,
      force: false,
    },
  })

  console.log(`API pushed ${updates.length} tree update(s) to ${owner}/${repo}:${branch}`)
  console.log(`Remote commit: ${commit.sha}`)
  return commit.sha
}

async function main() {
  const branch = process.argv[2] || git(['branch', '--show-current']) || 'main'
  const remoteUrl = git(['remote', 'get-url', 'origin'])
  const { owner, repo } = parseRemote(remoteUrl)
  const token = getToken()
  if (!token) {
    throw new Error('No GitHub token found. Set GITHUB_TOKEN/GH_TOKEN or log in via Git Credential Manager.')
  }

  ensureCleanWorktree()
  ensureNoBannedTrackedFiles()

  console.log(`Stable push target: ${owner}/${repo}:${branch}`)
  console.log('Trying normal git push first...')
  if (await normalGitPush(branch)) {
    console.log('Normal git push succeeded.')
    return
  }

  console.log('Normal git push failed; falling back to GitHub API push.')
  await apiPush({ owner, repo, branch, token })
}

main().catch(err => {
  console.error(err.message || err)
  process.exit(1)
})
