import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Apply this site's deployment settings in the build checkout, keeping the
// upstream wrangler.jsonc unchanged in Git so future merges remain possible.
const filename = new URL('../wrangler.jsonc', import.meta.url)
const source = readFileSync(filename, 'utf8')
const withoutComments = source.replace(
  /("(?:\\.|[^"\\])*")|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,
  (match, quotedString) => quotedString ?? '',
)
const config = JSON.parse(withoutComments)
const account = process.env.CLOUDFLARE_ACCOUNT_ID
if (!account || !/^[a-f0-9]{32}$/.test(account)) {
  throw new Error('CLOUDFLARE_ACCOUNT_ID is missing or invalid; deployment stopped.')
}
if (config.main !== 'worker/index.ts' || config.assets?.binding !== 'ASSETS') {
  throw new Error('Upstream Worker configuration changed; review before deploying.')
}
Object.assign(config, {
  name: 'mmwx-probe',
  account_id: account,
  workers_dev: false,
  preview_urls: false,
  keep_vars: true,
  routes: [{ pattern: 'eufo.eu.org', custom_domain: true }],
})
writeFileSync(filename, `${JSON.stringify(config, null, 2)}\n`)
// Record the checked-out revision, including workflow_call deployments whose
// GITHUB_SHA can refer to the workflow's caller rather than the built commit.
const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8',
}).trim()
if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Invalid source revision.')
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8')
const mainAsset = html.match(/\/assets\/main-[\w-]+\.js/)?.[0]
if (!mainAsset) throw new Error('Built main asset is missing; deployment stopped.')
writeFileSync(new URL('../dist/deployment.json', import.meta.url), `${JSON.stringify({
  schema: 1, repository: 'kuss0/jiwo-probe', commit, main_asset: mainAsset,
})}\n`)
console.log('Configured mmwx-probe for eufo.eu.org; existing runtime variables and secrets will be retained.')
