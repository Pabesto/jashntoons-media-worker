# Application source and recovery

The website releases from an exact local Git commit uploaded to private R2 and
built by Render. Every tracked file, including videos, artwork and fonts, is in
that immutable archive. Checksums protect each part and the complete archive.

The private GitHub repository `Pabesto/jashntoons-media-worker` also has a dedicated
`jashntoons-web-source` branch for the application code. Its root is the website
source; the repository's `main` branch remains the independent media worker.
This application branch is a reviewed code snapshot, not a copy of the original
Git history. Images, video and other binary files are recorded by path, size and
Git blob ID in `.release/source-release.json`; their actual bytes are retained in
the complete private archive recorded in the same file. No customer uploads,
runtime credentials or local test output are included in either source snapshot.

## Publishing a snapshot

1. Review and commit the application in the primary checkout. Merge other reviewed
   work first. Run the relevant tests and TypeScript.
2. Upload `git archive --format=tar.gz <commit>` through the existing bounded R2
   release upload. The local `outputs/render-release-manifest.json` must name the
   exact same commit and verified archive hash.
3. Run `node scripts/prepare-source-snapshot.mjs`. It refuses dirty source, a
   mismatching release, non-text code entries or private/generated tracked paths.
   It emits an ignored payload under `outputs/`, with no credentials.
4. Use the connected GitHub API to create a tree from the payload's `tree_elements`
   and a commit whose message names `applicationCommit`. For the first snapshot,
   use the reviewed worker main commit as the parent and create only
   `jashntoons-web-source`. For later snapshots, use that application branch's
   current head as parent and update with an expected-head check. Never force-push
   or update the worker branch for an application release.
5. Read back `.release/source-release.json` and changed code files. Verify their
   content against the prepared snapshot before updating Render's release settings.

The `--emit <character-offset>` option outputs 80,000 characters at a time so a
tool can transfer the prepared payload without truncation. Do not log that payload
or embed credentials in command arguments.

## Restoring all files

Read `.release/source-release.json` on the application branch. The existing Linux
bootstrap `services/render-web/bootstrap.cjs` accepts `STORAGE_ORIGIN`,
`STORAGE_BRIDGE_SECRET`, `APP_RELEASE_MANIFEST` and `APP_RELEASE_SHA256` from secure
runtime settings. Use its recorded manifest key and hash in a fresh recovery
directory. It downloads and verifies the complete archive and extracts it into
`.render-release-app`. That directory contains the complete source and binary
assets for the recorded application commit. Keep the storage secret outside Git,
chat and command history. The original primary checkout also retains Git history.

## Sites connection

On 12 November 2026 the Sites write-credential endpoint returned
`project_not_found` for the existing project even though `get_site` could read it.
The owner confirmed the account had not changed. Repeated credential calls did
not repair it. Application source publication now has the independent private
GitHub path above; this is not a claim that the Sites endpoint was repaired.

Retain `.openai/hosting.json` and the native Sites storage/auth service. Its
database, uploaded media and sign-in bridge remain production dependencies.
Changes to that native backend still require restoring its Sites write access;
do not replace its identity, create a duplicate Site or move customer data as a
workaround. Ordinary Render application releases use the private archive flow.
