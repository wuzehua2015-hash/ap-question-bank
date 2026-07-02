#!/usr/bin/env node

const { execFileSync, spawnSync } = require('node:child_process')
const https = require('node:https')

function run(cmd, args, options = {}) {
  return execFileSync(cmd, args, {
    encoding: options.encoding || 'utf8',
    stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
    input: options.input,
  }).trim()
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

function githubRequest({ path, token }) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'LynkEdu-stable-push-status',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: 'api.github.com', method: 'GET', path, headers }, res => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        let data = null
        try {
          data = text ? JSON.parse(text) : null
        } catch {
          data = { raw: text }
        }
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(data)
        else reject(new Error(`GET ${path} failed: ${res.statusCode} ${text.slice(0, 1000)}`))
      })
    })
    req.on('error', reject)
    req.end()
  })
}

async function main() {
  const branch = process.argv[2] || git(['branch', '--show-current']) || 'main'
  const remoteUrl = git(['remote', 'get-url', 'origin'])
  const { owner, repo } = parseRemote(remoteUrl)
  const token = getToken()
  if (!token) throw new Error('No GitHub token found. Set GITHUB_TOKEN/GH_TOKEN or log in via Git Credential Manager.')

  const localHead = git(['rev-parse', 'HEAD'])
  const localTree = git(['rev-parse', 'HEAD^{tree}'])
  const localStatus = git(['status', '--short', '--branch'])
  const workingTreeStatus = git(['status', '--porcelain'])

  const ref = await githubRequest({
    token,
    path: `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
  })
  const remoteHead = ref.object.sha
  const remoteCommit = await githubRequest({
    token,
    path: `/repos/${owner}/${repo}/git/commits/${remoteHead}`,
  })
  const remoteTree = remoteCommit.tree.sha

  console.log(`Stable push status for ${owner}/${repo}:${branch}`)
  console.log(`Local HEAD:  ${localHead}`)
  console.log(`Local tree:  ${localTree}`)
  console.log(`Remote HEAD: ${remoteHead}`)
  console.log(`Remote tree: ${remoteTree}`)
  console.log('')
  console.log(localStatus)
  console.log('')

  if (workingTreeStatus) {
    console.log('Working tree has uncommitted changes. Commit them before treating the published site as fully synced.')
    process.exitCode = 1
  } else if (localTree === remoteTree) {
    console.log('Remote tree matches local HEAD tree. Published content is in sync even if git status shows ahead/behind due to API fallback commits.')
  } else {
    console.log('Remote tree differs from local HEAD tree. Run validate/build before pushing, then use npm run stable:push.')
    process.exitCode = 1
  }
}

main().catch(error => {
  console.error(error.message || error)
  process.exit(1)
})
