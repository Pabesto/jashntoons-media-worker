# Jashntoons search and reels launch

Public origin: https://jashntoons.ai. Tagline: **Your people. Your story. Your invitation.**
The established outlined logo is preserved; SVG, PNG and a 1200 × 630 social card are in `public/brand/`.

## Published website features

Canonical metadata, Open Graph/Twitter previews, Organization/WebSite/WebApplication JSON-LD,
robots.txt, a dynamic sitemap with video entries, three substantive invitation guides,
the `/reels` library and one watch page per reel. The homepage mini player is muted by
default, advances after a reel ends, has pause/next/previous/close controls, respects
reduced motion and pauses when the tab is hidden or the studio/account dialog is open.
Existing studio samples are explicitly labelled as demos. Private customer media are
never automatically marketed. Brand videos come only from `marketing_reels`.

## Runtime connections still required

Secrets belong in Render service `srv-dbqiql6c6qcc73ffinug`, never client code or Git:

| Setting | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude API access; a Claude chat subscription is not an API key |
| `CLAUDE_MARKETING_MODEL` | An active model confirmed through the connected account's `/v1/models` |
| `HEYGEN_API_KEY` | HeyGen developer API access |
| `HEYGEN_AVATAR_ID` | Owner-approved private avatar look, find by name **Abhishake** after account connection |
| `HEYGEN_VOICE_ID` | Owner-approved voice ID; do not substitute a public voice |
| `INSTAGRAM_ACCESS_TOKEN` | Instagram Login professional account token with content publishing permission |
| `INSTAGRAM_USER_ID` | Verified professional account ID, not its display name |
| `INSTAGRAM_GRAPH_VERSION` | Supported Graph API version verified during connection |
| `MARKETING_AUTOMATION_SECRET` | Random bearer secret of at least 32 characters for private operations |
| `MARKETING_ENABLED` | `1` only after the above connections and first reel are verified; default off |
| `MARKETING_DAILY_CAMPAIGN` | `1` enables one daily campaign at 19:00 Asia/Kolkata; default off |

HeyGen and Metricool were suggested for account access, but a plugin connection alone
does not provide unattended server API credentials. The direct Instagram publishing
adapter is designed for Instagram Login; do not use a Facebook Login token with it.
Never ask for API secrets in chat. Configure them through the provider/Render secret UI.

The worker runs within the existing Render web service, starting with `start:render`.
It calls the private tick endpoint every minute after the previous request completes.
No additional paid service is created. Persistent jobs and leases live in D1, while
completed videos and posters are copied to R2 before being made public.

## Pipeline and controls

1. A daily seed brief (seven themes in `lib/marketing-campaigns.ts`) or explicit queued job.
2. Claude writes a bounded Hinglish script and caption from verified product facts.
3. HeyGen v3 renders the approved avatar and voice as a 9:16 subtitled video.
4. Poll until completion; download through an allowlisted HTTPS host, with size/type limits.
5. Publish brand media to `/reels` and the homepage feed automatically.
6. Create an Instagram REELS container, wait for FINISHED, then publish once and save its permalink.

Private endpoints use `Authorization: Bearer <MARKETING_AUTOMATION_SECRET>`:
`GET /api/marketing/jobs` reports missing configuration and jobs;
`POST /api/marketing/jobs` accepts an idempotent UUID, slug, title, description, caption,
script and scheduledAt timestamp; `POST /api/marketing/tick` advances one job.

There is a hard maximum of one new campaign start per India calendar day. Duplicate
queue requests do not create duplicate rows. Persisted leases prevent concurrent work.
An uncertain Claude write (`writing`), HeyGen submission (`submitting`) or Instagram
publication (`publishing`) stays stopped for operator reconciliation. Do not reset it
blindly: find the existing provider task/media ID first, then restore its known state.
HeyGen also receives the campaign UUID as its 24-hour idempotency key.

Set `MARKETING_ENABLED=0` to stop future ticks and restart/redeploy the service.
Hiding a brand reel is an operator database update `published=0`; this stops public
media access immediately and the homepage refreshes within a minute. Instagram posts
must be hidden/deleted separately in the connected account. Do not delete customer data.

## Verification and remaining launch actions

Automated tests exercise auth, queue idempotency, daily limits, concurrent workers,
Claude/HeyGen/Instagram contracts with mocks, public publication, and ambiguous-result
handling. Mocks are not a claim of live provider connectivity or completed Instagram posts.

Before activation, verify provider auth, exact avatar/voice, actual Instagram username,
supported Graph version and token permissions. Generate and inspect the first real
reel, including voice, captions, branding and mobile framing. API credits may be charged;
the website's two free standard credits do not imply free external API usage.

Google Search Console still requires the owner's connected property. Submit
`https://jashntoons.ai/sitemap.xml` and inspect the home and reel watch pages once access
is available. No ranking, index inclusion or rich-result guarantee is made.

Primary references checked 2026-11-12:
- https://developers.heygen.com/generate-avatar-video
- https://developers.heygen.com/reference/create-video
- https://developers.heygen.com/reference/get-video
- https://platform.claude.com/docs/en/api/messages/create
- https://developers.google.com/search/docs/appearance/structured-data/video
