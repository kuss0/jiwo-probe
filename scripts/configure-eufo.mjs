import { readFileSync, writeFileSync } from 'node:fs'

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
console.log('Configured mmwx-probe for eufo.eu.org; existing runtime variables and secrets will be retained.')
