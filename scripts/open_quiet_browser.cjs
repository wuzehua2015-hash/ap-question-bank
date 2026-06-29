#!/usr/bin/env node
/**
 * Open the local app in Chrome with background Google services disabled.
 *
 * This prevents noisy Chromium stderr lines such as:
 * google_apis\gcm\engine\connection_factory_impl.cc ... net error: -2
 */
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const DEFAULT_URL = 'http://127.0.0.1:5173/ap-question-bank/'
const url = process.argv[2] || DEFAULT_URL

function findChrome() {
  const candidates = []

  if (process.env.CHROME_PATH) candidates.push(process.env.CHROME_PATH)

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || ''
    const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files'
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)'

    candidates.push(
      path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    )
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    )
  } else {
    candidates.push('google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge')
  }

  for (const candidate of candidates) {
    if (!candidate) continue
    if (path.isAbsolute(candidate) && fs.existsSync(candidate)) return candidate
    if (!path.isAbsolute(candidate)) return candidate
  }

  return null
}

const browser = findChrome()
if (!browser) {
  console.error('Chrome/Edge not found. Set CHROME_PATH to chrome.exe and retry.')
  process.exit(1)
}

const userDataDir = path.resolve(__dirname, '..', '.workspace', 'quiet-browser-profile')
fs.mkdirSync(userDataDir, { recursive: true })

const args = [
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-networking',
  '--disable-sync',
  '--disable-component-update',
  '--disable-domain-reliability',
  '--disable-notifications',
  '--disable-features=PushMessaging,MediaRouter,OptimizationHints,AutofillServerCommunication',
  '--disable-gcm',
  '--log-level=3',
  '--silent',
  url,
]

const child = spawn(browser, args, {
  detached: true,
  stdio: 'ignore',
  windowsHide: true,
})

child.unref()
console.log(`Opened quiet browser: ${url}`)
