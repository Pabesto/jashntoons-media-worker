# AI connections

The Avatar panel creates illustrations automatically. The studio routes requests to a configured image provider (OpenAI, Runway or Google) without exposing provider selection to customers. Runway and Google Omni can also animate a complete scene into a 10-second clip inside the full invitation reel. Template animation, text, transitions, effects and export work independently of AI motion.

## Keys

Configure the selected provider as a secret in the site's production runtime environment using Sites `update_environment_variables`, then deploy the site version with the updated environment revision. Never put a key in source code, `public/`, the photo uploader or a browser form.

| Provider | Canonical secret | Developer account |
| --- | --- | --- |
| Runway | `RUNWAY_API_KEY` | https://dev.runway.com/ |
| OpenAI | `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| Google | `GEMINI_API_KEY` | https://aistudio.google.com/apikey |

`RUNWAYML_API_SECRET` and `GOOGLE_API_KEY` are accepted aliases. A ChatGPT connector login does not supply these website credentials. API billing and model access belong to each developer account.

For this local checkout, the owner can paste the key into the ignored `.dev.vars` file, save it, and ask Codex to synchronize that exact value to the site's secret environment. The local file is not deployed. No key values should be printed. Restart the local dev server after a local secret changes. The production environment requires a deployment; checking `.dev.vars` alone does not establish a live connection.

## Editor behaviour

- The server chooses a configured image provider in order: OpenAI, Runway, Google. This preserves movable characters when a capable provider is available. Legacy provider selections in customer drafts are ignored. Motion is also routed by the server, with Runway preferred when available. Failed requests do not silently start a second provider job.
- “Key configured” describes presence of a secret, not a successful charge or unlimited access. Provider authentication, model access and quota errors are shown when a request fails.
- OpenAI and Runway support transparent character generation for movable template layers. Google returns a complete illustrated scene; it is never presented as a transparent cutout. The canvas and exported video use the same scene composition.
- Complete scenes can use either configured motion provider. Transparent characters use the existing template motion. One generation, including its motion and first final export, consumes one reel credit. Failed and expired jobs return that credit.
- Photos remain private application media. Only the first two uploaded references are sent to the selected image provider when creation is requested. If motion is selected, the generated scene is sent to that provider. Provider-side retention applies to stored background tasks; see their documentation.
- Availability refreshes when Avatar opens. No visitor can edit global secrets or choose a provider. The How to use guide explains the workflow in Hinglish and English, with contextual tool hints and a pre-export checklist.

## API contracts verified 2026-11-11

- [OpenAI image tool](https://developers.openai.com/api/docs/guides/tools-image-generation): Responses API, `gpt-5.4-mini` orchestrator, `gpt-image-2.5-flare` image tool, explicit PNG/transparent setting for cutouts. [Background mode](https://developers.openai.com/api/docs/guides/background) gives durable response IDs for polling.
- [Google Nano Banana](https://aistudio.google.com/docs/image-generation): Interactions API, `gemini-nano-banana-2.1`, image references, PNG 9:16 output.
- [Google Omni](https://aistudio.google.com/docs/omni): `gemini-omni-1.2-flash`, image-to-video, 720p 9:16, 10-second URI delivery. Retired Veo preview endpoints are not used.
- [Google background jobs](https://aistudio.google.com/docs/background-execution): stored interactions, GET polling, terminal status handling. Raw REST image/video outputs are extracted from `model_output` steps.
- [Runway](https://docs.dev.runwayml.com/api/): version `2024-11-06`, `gpt_image_2_6_flare` for cutouts, `gpt_image_2` for scenes and `gen4_turbo` for motion.

## Validation

Automated tests cover dispatch, private result storage, reference ownership, one-credit image/motion jobs, missing keys, refunds, duplicate polling, timeout recovery and rejecting untrusted Google download URLs. OpenAI and Google contract tests use mock responses because those credentials are not configured.

A real Runway API connection returned HTTP 200. A browser test uploaded the owner's supplied wedding portrait, generated a new blush illustration through Runway, retrieved the private result and displayed it in the editor without JavaScript errors. This test used the local QA account, not the owner's production reel credits. Provider image generation was real. Desktop and 390px mobile previews were inspected.

The real generated character was exported in a 720 × 1280 MP4 (12.02 seconds, 6.75 MB). Provider controls, 320px/390px layouts, missing-key rejection and full-scene canvas composition passed browser checks. The automated suite includes 18 tests, including authenticated provider downloads without credential forwarding; packaging also runs TypeScript validation.
