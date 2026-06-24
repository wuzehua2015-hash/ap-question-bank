#!/usr/bin/env node
/**
 * Run commands using cached environment paths.
 * Usage: node scripts/run_with_env.cjs <command> [args...]
 * Examples:
 *   node scripts/run_with_env.cjs npm run build
 *   node scripts/run_with_env.cjs npm run validate
 *   node scripts/run_with_env.cjs node scripts/data_validator.cjs
 */
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ENV_FILE = path.resolve(__dirname, 'env.json')

if (!fs.existsSync(ENV_FILE)) {
  console.error('❌ env.json not found. Run: node scripts/env_probe.cjs')
  process.exit(1)
}

const env = JSON.parse(fs.readFileSync(ENV_FILE, 'utf8'))

// Map command names to cached paths
const toolMap = {
  'node': env.node,
  'npm': env.npm,
  'npx': env.npx,
  'python': env.python,
  'python3': env.python,
}

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: node scripts/run_with_env.cjs <command> [args...]')
  process.exit(1)
}

const [cmd, ...cmdArgs] = args
const toolPath = toolMap[cmd.toLowerCase()] || cmd

// Build PATH with tool directories so subprocesses can find each other
const toolDir = path.dirname(toolPath)
const newPath = [toolDir, process.env.PATH].filter(Boolean).join(path.delimiter)

const result = spawnSync(toolPath, cmdArgs, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    PATH: newPath,
  }
})

process.exit(result.status || 0)
