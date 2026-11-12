# Jashntoons media worker

Prepared for Render; not enabled until its account and runtime secrets are connected.
The website, Google login, D1 records and R2 files stay on the existing edge host.
This worker converts finished uploads to 30 fps H.264/AAC MP4 with front-loaded metadata.
It does not invoke an AI provider, debit credits, or recover motion already missing from an old recording.
Old jerky recordings should be exported again from their saved draft using the new frame encoder.

## Deployment

1. Deploy the root `render.yaml` through the connected Render account from a private source repository.
2. Review the recurring price for `1c-2g` before creating the paid Singapore background worker.
3. Generate a cryptographically random secret of at least 32 bytes; store the identical `MEDIA_WORKER_SECRET` in Render and the Site runtime secrets. Never commit it.
4. Keep `SITE_ORIGIN=https://jashntoons.ai` on Render. Set Site `MEDIA_WORKER_ENABLED=1` only after the worker is running, then deploy the Site with those runtime settings.
5. Export a test reel. Verify queued → processing → ready, byte-range playback, download, private access and zero additional AI credits.

The worker polls every five seconds, takes one job at a time, and uses expiring leases.
Outputs use a lease-specific object key so stale jobs cannot overwrite newer results.
Originals remain available during processing and after failures. Failed jobs can be retried from My reels.
To stop new jobs, set `MEDIA_WORKER_ENABLED=0` and redeploy the Site; existing originals and optimized files remain available.

Local build: `docker build -t jashntoons-media-worker:local services/media-worker`.
No local disk needs to persist: temporary files are removed after each job, and successful outputs are stored in R2.
