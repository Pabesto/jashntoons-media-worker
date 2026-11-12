# Render application hosting

Status: production live on Render; DNS switched on 2026-11-12.

- Public origin: `https://jashntoons.ai` (www redirects to apex).
- Production: `srv-dbqiql6c6qcc73ffinug`, `jashntoons-production`;
  `https://jashntoons-production.onrender.com`, `1c-2g` (2 GB, $25/month).
- Existing encoder: `srv-dbqh58gn74is73c693a0`, `jashntoons-media`.
- Storage/auth: `appgprj_6af3f4ef61c88191898a796de5195662`,
  `https://jashntoons.jocoseavocet1.chatgpt.site`.
- DNS: apex A `216.24.57.1`; www CNAME `jashntoons-production.onrender.com`.
  Keep the existing verification TXT records. The previous DNS is documented below.

Reuse production for future releases; do not create another paid web service.
The approved web hosting charge is additional to the existing encoder bill.

## Architecture

The homepage, studio, bundled template media, and application API run in a Render
Node web service. The active service builds an immutable private source archive from
R2, avoiding the Sites 256 MiB uploaded-archive limit for future application releases.

Existing D1 records and private R2 objects remain in the managed Sites project.
`services/render-web/storage-client.mjs` sends server-only authenticated requests to
`/api/hosting/storage` on the stable native Site origin. Queries retain their existing
ownership conditions and atomic credit reservations. The adapter never automatically
retries a mutation. Incoming reel streams are capped at 80 MB and buffered on the
2 GB Node host to supply Content-Length, then stream through the edge storage pipe;
private playback retains byte ranges. No SQL or credentials are returned on errors.

Do not delete the old Site, its D1/R2 storage, or its authentication configuration:
they are live dependencies after this application-hosting migration. This is not a
database migration or a claim that Render has unlimited memory, disk or bandwidth.

## Sign-in

Google sign-in keeps the original owner mapping and session table. Existing Sites
users can sign in through a state-bound, one-use transfer code. The code expires in
60 seconds, contains no personal data, and is consumed atomically. Only the configured
Render origin can receive its redirect. A new secure HttpOnly cookie on the public
host references the same account owner and wallet.

The Node server rejects caller-supplied Sites identity headers. Those headers are
trusted only inside the Sites identity boundary. The storage bridge is disabled on
Render itself and returns 404 everywhere until its private secret is configured.

## Migration sequence (already completed)

1. Push the reviewed source, without ignored local files, to a private repository
   accessible to the existing Render workspace. The media worker's separate repository
   and running deployment should remain intact.
2. Generate a private random secret of at least 32 bytes. Store the same
   `STORAGE_BRIDGE_SECRET` as an encrypted runtime value in Sites and Render. Keep it
   out of source, command arguments, browser bundles and logs.
3. Publish the storage/auth routes to the existing Site. Set its
   `RENDER_SITE_ORIGIN` to the new Render service's HTTPS origin for initial testing.
4. Create the Node web service using `render-web.yaml`. The blueprint selects the
   paid `1c-2g` plan; inspect the current price and the user's hosting authorization
   before creation. Copy the existing required AI, Google, custom-design and media-worker
   runtime settings securely. Do not transfer the one-time `CREDIT_GRANT_ONCE` setting.
5. Initially set `PUBLIC_SITE_ORIGIN` to the service's actual onrender.com origin.
   Configure Google's exact callback for that origin if testing direct Google login
   there. Existing Sites sign-in can be tested through its one-use transfer instead.
6. Check `/api/health`, anonymous requests, sign-in, the existing credit balance,
   saved projects, private media/range downloads, and a draft save. Test AI generation
   only with the user's authorized paid-provider budget; a passing build is not an
   AI-provider success claim.
7. Add both custom domains in Render. Set `PUBLIC_SITE_ORIGIN` and the Site's
   `RENDER_SITE_ORIGIN` to `https://jashntoons.ai`. Apply only the exact DNS records
   supplied by Render after staging checks pass; retain the old host for rollback.
8. Verify the custom domain's certificate, homepage, sign-in routing, credit wallet
   storage and saved media after cutover. Keep automatic deploys disabled when using
   immutable release settings rather than a dedicated application repository.

## Commands

```text
npm run build:render
npm run start:render
node --test tests/render-hosting.test.cjs tests/creation-jobs.test.cjs tests/creator-community.test.cjs tests/media-worker.test.cjs
```

`build:render` uses native Next.js and a server-only Cloudflare binding adapter.
The normal `build` command still builds the current Sites worker. `.next-render`
is ignored. Render listens on its injected `PORT` through `next start`; source and
bundled public files live in the deployed immutable checkout. Uploaded files are
never stored on Render's ephemeral local filesystem.

## Existing repository bootstrap

When access to a separate private application repository is unavailable, the web
service can use the already connected `Pabesto/jashntoons-media-worker` repository
as a build trigger. No files or settings in that repository or its running worker
are changed. A custom Node build command runs `services/render-web/bootstrap.cjs`,
then installs and builds the application in `.render-release-app`.

The full source release is made with `git archive` from a reviewed commit, so local
secrets, Git credentials, node_modules and ignored runtime data are excluded. Upload
it in bounded chunks to private R2 under `releases/<commit>/`; write the manifest
last. Set `APP_RELEASE_MANIFEST` and `APP_RELEASE_SHA256` in the web service. The
bootstrap verifies each chunk and the complete archive against the hash in the
deployment configuration before extracting or executing anything. It uses a fixed
HTTPS storage origin, forbids redirects, and never prints the authentication secret.

This path also bypasses the Sites deployment-archive upload limit: large application
releases are streamed to object storage and built by Render. Future releases upload
new immutable keys and update only this web service's release settings. Keep the
previous release until rollback is no longer required. A regular private application
repository can replace this bootstrap later without moving account data.

## Updating the live application

1. Validate the edited source with TypeScript and the tests above. Include both native
   Node Request/Response and streamed reel upload paths in hosting regression checks.
2. Commit the exact reviewed source. When Sites write access is available, use its
   source helper; otherwise use the dedicated private GitHub application snapshot
   described in `source-sync.md` after the immutable upload. Do not include ignored
   `.dev.vars`, credentials or outputs. Keep native storage/auth identity unchanged.
3. Create `outputs/render-source-release.tar.gz` with
   `git archive --format=tar.gz --output=outputs/render-source-release.tar.gz HEAD`.
   Upload chunks of at most 60,000,000 bytes via the authenticated private storage
   endpoint; record each SHA-256 and size. Write `releases/<commit>/manifest.json`
   last, containing the commit, whole archive SHA-256/size, and ordered chunk records.
4. Update only `APP_RELEASE_MANIFEST` and `APP_RELEASE_SHA256` on production service
   `srv-dbqiql6c6qcc73ffinug`, then trigger its Render deployment. The active build
   command already bootstraps the source and runs `npm run build:render`.
   Keep the bridge secret and provider keys in runtime settings; never print them.
5. Wait for `live`, check custom-domain HTTPS and `/api/health`, then test anonymous
   identity, private route authorization, public video ranges and sign-in redirects.
   Use the existing native storage origin for storage health/data checks. Avoid
   re-running one-time credit grants or paid AI jobs merely to verify hosting.

The checkout-local `outputs/render-ops.cjs` helper accepts private task JSON on hidden
stdin for bounded uploads and Render API operations. It reads the authenticated
Render CLI profile without logging its key. It is an operational helper, not a
runtime dependency; use the same documented API flow if it is unavailable.

## Rollback

Keep the previously recorded DNS values and native Site deployment. Restore the
custom domain's previous DNS and continue serving the original Site. Because both
runtimes use the same records and object keys, a rollback does not restore an old
wallet snapshot or discard new saved reels. Remove the Render service only after
confirming it is no longer receiving traffic.

Previous DNS: apex A `162.159.143.30` and `172.66.3.26`; www CNAME
`custom-domains.chatgpt.site`. TTL was 300 seconds. For application-only rollback,
restore the preceding immutable release settings and redeploy the same Render service.
