# Personal creation and reel packs

## Available now

- Six original illustrated worlds with different fictional casts and environments.
- Two original, genuinely animated 10-second character demos in the Film Room.
- Private account photos, editable scenes, event details, music, saved drafts and video export.
- Two reel credits per account, enforced by atomic database reservations. Failed or cancelled standard exports release their reservation. Re-downloading a completed reel is free.
- One-time packs: Little Jashn ₹299 / 3 reels; Celebration Box ₹799 / 10 reels; Creator Studio ₹1,499 / 25 reels. Cart quantities, totals and account persistence are implemented. Prices are validated on the server.

## Owner connection required for personal AI generation

Set `RUNWAY_API_KEY` as a **secret** in this Site's runtime environment settings, then redeploy the current version. Never put the key in source, browser code or chat. The website uses the Runway Developer API; the connected ChatGPT Runway account used to create demo assets does not automatically supply a website API key.

The AI scene flow checks the connection before reserving a credit. It sends the user's explicit creative brief and up to two selected reference photos to Runway `gpt_image_2`. Optional motion then uses `gen4_turbo` for a 10-second vertical scene. Results are copied into private account-owned storage. User content is never exposed as a public image URL by this app. Reference photos for this flow must be under 3.5 MB each.

A successful AI scene uses one credit, including its final invitation export. Its ready scene is recoverable from AI scene after reopening the studio. Provider failures return the credit. Generation is limited to six attempts per account per 24 hours. Unconfigured generation is disabled and described honestly in the interface.

The external runtime generation must receive a real end-to-end check after the owner connects the key. Current automated verification uses a provider mock at that boundary; the two public animation demos were generated successfully through the connected Runway tool.

## Payments deferred by owner

Checkout is deliberately disabled. Adding a pack does not take payment or grant credits. No payment credentials are needed for this release. A later payment integration must verify successful payment server-side and add an idempotent `credit_grants` record. The current app has no public endpoint that grants credits.

## Storage and media

The `reel_jobs`, `credit_grants` and `carts` tables are added by migration `0001_careless_champions.sql`. Reel/video access checks ownership and supports byte ranges for reliable MP4 metadata and seeking. Finished downloads remain private to the signed-in account.

Original art prompts and demo provenance are recorded in `generated-worlds.md`.
