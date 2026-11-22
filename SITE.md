# eufo.eu.org deployment

This fork follows `chnnic/jiwo-probe`. GitHub Actions checks for upstream changes
daily at 03:23 UTC (11:23 Asia/Shanghai); GitHub can delay scheduled runs.
The sync workflow merges upstream and explicitly calls deployment when code
changes. Its manual Run workflow action also deploys when already up to date,
so it can be used for the first deployment or to retry a failed deployment.
Pushes to this fork's main branch also deploy.

Deployment installs dependencies, typechecks, runs the project tests, and builds
on the GitHub runner before using the project's native deployment helper to
update the existing `mmwx-probe` Cloudflare Worker. It then verifies that the
public homepage references the expected main JavaScript asset.

`scripts/configure-eufo.mjs` applies this site's Worker name and custom domain
only in the build checkout. It keeps workers.dev and preview URLs disabled.
The project helper retains existing runtime variables, secrets and ProbeHub
bindings; the 5-second polling interval remains a runtime setting.

Required repository secrets are `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID`. The read-only origin probe token stays in the existing
Cloudflare Worker secret and is not copied into GitHub or committed to Git.

If upstream merging conflicts, synchronization stops and deployment does not
run. Resolve the conflict in this fork and rerun Sync upstream. Avoid modifying
upstream files when site-specific behavior can live in added files instead.
