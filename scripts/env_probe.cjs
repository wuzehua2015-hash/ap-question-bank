#!/usr/bin/env node
/**
 * Environment Probe — Auto-detect tool locations and cache them.
 * Run once at project setup, or whenever tools move.
 * All other scripts read env.json instead of relying on PATH.
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ENV_FILE = path.resolve(__dirname, 'env.json')

function findExecutable(name) {
  const candidates = []
  
  // Try PATH first
  try {
    const which = process.platform === 'win32' ? 'where' : 'which'
    const result = execSync(`${which} ${name}`, { encoding: 'utf8', timeout: 3000 })
    const lines = result.trim().split('\n').filter(Boolean)
    if (lines.length > 0) candidates.push(lines[0].trim())
  } catch {}
  
  // Windows-specific: check common locations
  if (process.platform === 'win32') {
    const home = process.env.USERPROFILE || process.env.HOME
    const commonPaths = [
      'C:\\Program Files\\nodejs',
      'C:\\Program Files (x86)\\nodejs',
      path.join(home, 'AppData', 'Local', 'Programs', 'kimi-desktop', 'resources', 'resources', 'runtime'),
      // Daimon Python runtime
      path.join(home, 'AppData', 'Roaming', 'kimi-desktop', 'daimon-bundle', 'runtime', 'python', 'cpython-3.12'),
      path.join(home, 'AppData', 'Roaming', 'kimi-desktop', 'daimon-share', 'daimon', 'runtime', 'python'),
    ]
    for (const dir of commonPaths) {
      const exe = path.join(dir, name + (name.endsWith('.exe') || name.endsWith('.cmd') ? '' : '.exe'))
      if (fs.existsSync(exe)) candidates.push(exe)
      const cmd = path.join(dir, name + '.cmd')
      if (fs.existsSync(cmd)) candidates.push(cmd)
    }
  }
  
  // Also check for python.exe in Daimon runtime directory structure
  if (name === 'python' || name === 'python3') {
    try {
      const daimonPaths = [
        path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming', 'kimi-desktop', 'daimon-bundle', 'runtime', 'python', 'cpython-3.12', 'python.exe'),
        path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming', 'kimi-desktop', 'daimon-share', 'daimon', 'runtime', 'python', 'python.exe'),
      ]
      for (const p of daimonPaths) {
        if (fs.existsSync(p)) candidates.push(p)
      }
    } catch {}
  }
  
  return candidates[0] || null
}

function main() {
  const env = {
    node: findExecutable('node'),
    npm: findExecutable('npm'),
    python: findExecutable('python') || findExecutable('python3') || findExecutable('py'),
    npx: findExecutable('npx'),
    platform: process.platform,
    detectedAt: new Date().toISOString(),
  }
  
  fs.writeFileSync(ENV_FILE, JSON.stringify(env, null, 2))
  
  console.log('=== Environment Probe ===')
  for (const [k, v] of Object.entries(env)) {
    if (k === 'platform' || k === 'detectedAt') continue
    console.log(`  ${k}: ${v || 'NOT FOUND'}`)
  }
  console.log(`\nCached to: ${ENV_FILE}`)
  
  // Exit with error if critical tools missing
  const missing = []
  if (!env.node) missing.push('node')
  if (!env.npm) missing.push('npm')
  if (!env.python) missing.push('python')
  
  if (missing.length > 0) {
    console.error(`\n❌ Missing critical tools: ${missing.join(', ')}`)
    process.exit(1)
  }
  
  console.log('\n✅ All critical tools found')
}

main()
