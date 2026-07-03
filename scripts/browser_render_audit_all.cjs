#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const BASE_PORT = Number(process.env.AUDIT_RENDER_PORT || 9340)

main().catch((error) => {
  console.error(error.stack || error.message || String(error))
  process.exit(1)
})

async function main() {
  const subjects = readJson(path.join(PUBLIC, 'data', 'subjects.json')).subjects
    .filter(subject => subject.active)
    .map(subject => subject.id)

  if (subjects.length === 0) {
    throw new Error('No active subjects found in public/data/subjects.json')
  }

  console.log(`Running browser render audit for ${subjects.length} active subjects.`)
  for (let index = 0; index < subjects.length; index += 1) {
    const subject = subjects[index]
    const port = BASE_PORT + index
    console.log(`\n[${index + 1}/${subjects.length}] ${subject} on CDP port ${port}`)
    await run('node', ['scripts/browser_render_audit.cjs', '--subject', subject, '--port', String(port)])
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: 'inherit',
      env: process.env,
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))
      }
    })
  })
}
