# Jashntoons

A dedicated AI invitation studio with a Next.js/React frontend on Render, private Cloudflare D1/R2 storage, and the existing authentication bridge.

## What works
- Original AI invitation films and matching digital cards for weddings, engagement, haldi/mehendi, birthdays, baby showers and parties, alongside the existing wider occasion catalogue.
- Eight original Runway art directions and complete three-scene showcase films, plus the earlier supplied reference films, 140 photo-style templates, avatar library and backgrounds.
- A guided brief: select a world, upload up to eight private reference photos, add event details, select one of ten occasion-specific moments, direct three scenes and optionally add a voice.
- Real selected subject actions and camera instructions reach the film prompt. Character treatments include watercolour, realistic, 3D, miniature, storybook, clay and paper styles.
- A complete personal AI film uses the existing 30-second provider workflow. Generated people and voices are reused where appropriate; changed generation inputs require an explicit credit quote. Exact written invitation details remain editable without another AI generation.
- Digital cards download as 1080 × 1920 PNGs with current names, date, time, venue, family, functions and RSVP. Standard photo/card composition uses no AI credits; optional new character art starts at one credit.
- Private autosaved drafts, owned media, resumable jobs, atomic credit reservations, retained completed assets and failed-generation refunds.
- Completed film export, download, and explicit creator-community publishing with selected before/after media.

See [the invitation studio notes](docs/invitation-studio.md) for design research, original asset provenance and credit behavior. The public showcase contains fictional sample people and event details; users create a new film from their own references.

## AI writing
The optional server-only `/api/compose` integration uses OpenAI Responses with structured outputs and a per-account quota. It is unavailable without an owner-configured server key. The main invitation scene prompts are assembled from the selected brief and work independently of that optional writing connection. Never put keys in source or browser code.

## Develop
`npm run dev -- --port 5179 --hostname 127.0.0.1`

For local development only, `/signin-with-chatgpt?return_to=/` provides the starter's loopback test account. Hosted identity is owned by Sites.

`node node_modules/typescript/bin/tsc --noEmit`

`npm run db:generate` after schema edits. Apply new SQL migrations locally with Wrangler D1 using the generated `dist/server/wrangler.json` and `.wrangler/state`.

## Privacy and storage
All project and media endpoints require authenticated identity. Every read/update/delete is constrained to the requesting owner; writes validate Origin. Photos accept JPEG/PNG/WebP signatures up to 8 MB. Saved invitations are limited to 50 per account and stored photos to 100. Removing a photo from one draft does not delete its account asset or break other drafts. Draft data in sessionStorage supports sign-in return; it is not used as cloud persistence.

## Hosting
The public website runs on Render at https://jashntoons.ai; www redirects to the apex.
Production service: `srv-dbqiql6c6qcc73ffinug` (`jashntoons-production`), paid `1c-2g`
plan, 2 GB, always on. The user approved the additional $25/month hosting fee on
2026-11-12. The existing `jashntoons-media` service remains the background encoder.

Publish website updates to the existing Render production service using the immutable
private source-release workflow in `docs/render-hosting.md`. Publishing only to Sites
does not update the public Render website. Automatic GitHub deploys are disabled.
The private application source snapshot and complete-asset recovery process are
documented in [source sync](docs/source-sync.md). The latest consolidation and
remaining external integrations are recorded in [the completion audit](docs/completion-audit-2026-11-12.md).
`render-web.yaml` is the direct-repository configuration; the active service uses the
private R2 bootstrap described in the guide to avoid the Sites archive upload limit.

The canonical storage/auth project identifier remains in `.openai/hosting.json`.
Its D1, R2, native hostname and sign-in configuration are live dependencies and must
be retained. This project is public; preserve that audience. Build/publish backend
changes there through the Sites workflow when its storage or identity routes change.

## Packages and custom design connections

The three existing reel packs retain their prices and credit counts. Custom Designing is a separate INR 99 connection booking with no reel credits; design work is quoted and paid separately. A cart accepts all four offers, with at most one custom connection.

Set `CUSTOM_DESIGN_PAYMENT_URL` to the owner-approved HTTPS checkout link charging exactly INR 99, and `CUSTOM_DESIGN_CONTACT_NUMBER` to the business WhatsApp/call number including country code. These are public customer-facing values, not gateway secret keys. With both configured, the connection dialog opens the payment link and asks customers to share their receipt on WhatsApp for manual verification and scheduling. It does not automatically verify payment or confirm a booking. Without both values, the UI clearly shows bookings opening soon and lets customers save the connection fee to their cart. Existing reel-cart checkout remains unavailable.

Run `node --test tests/packages.test.cjs` for the fee, credit, cart and connection-link checks.
