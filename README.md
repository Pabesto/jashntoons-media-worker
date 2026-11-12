# Jashntoons media worker

Private Render worker for finished video delivery. The website, login, D1 records,
and R2 media remain on the existing Jashntoons edge host.

Deploy the Dockerfile as one Singapore background worker, plan 1c-2g.
Set SITE_ORIGIN=https://jashntoons.ai and a private MEDIA_WORKER_SECRET
shared with the website. The secret must never be committed.

The worker polls every five seconds, claims an expiring lease, and prepares
30 fps H.264/AAC MP4 with fast-start metadata. Already compliant exports are
reused without a second lossy encoding. Original files are retained.
It does not invoke AI providers or charge AI credits.

Source: Jashntoons services/media-worker. Keep this deployment mirror in sync
when changing the worker. No persistent disk is required.
