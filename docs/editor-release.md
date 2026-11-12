# Creator studio and editable template catalog

The catalog now has 30 active styles across 12 occasion categories. Twenty-one new people-free backgrounds support independent avatar, text, background and effect layers. The three complete wedding films and six existing illustrated worlds remain available. Original image prompts and provider provenance are in catalog-assets-a.md, catalog-assets-b.md and catalog-assets-c.md.

The full-screen editor includes a scene timeline, reorder/add/remove controls, per-scene text and timing, undo/redo, account draft saving, music and volume, filters, animated particles, vignette and resolution settings. Editable catalog templates additionally support per-scene backgrounds, title size/position/colour, transitions and separate avatar positioning/scaling. Existing animated film footage has baked artwork; its editable controls do not promise to move objects inside that footage.

Upload & create avatar uploads private reference photos, prepares smaller JPEG references and starts generation from the selected template, illustration style and pose. A custom prompt and event details are optional for avatar creation. The live server uses Runway image generation; new layered templates request transparent PNG characters. Existing film styles can request a complete illustrated scene with optional 10-second motion. No uploaded photo is labelled a generated avatar before provider success. Failed provider jobs refund credits. One generation credit includes its first final export; editing an already exported generated reel requests a new render instead of returning the old video silently.

Incomplete drafts can now be saved. Export still validates names and date, and the editor requires a venue. Server-side schemas constrain all layer settings and allow only known catalog background IDs. Private media ownership checks remain enforced.

Validation on 2026-11-11:

- TypeScript passes.
- Twelve server/catalog tests pass, including reference ownership, provider failure refunds, transparent avatar request contracts, invalid editor overrides, the 30-style/12-category catalog and existing film timelines.
- Browser QA passes at 1440, 1024, 768, 390 and 320 px. Draft saving, filters, per-scene background changes, scene selection/reorder, undo, category filtering and the disconnected-AI state were exercised.
- Browser fixture test verifies that photo upload starts generation without a custom prompt or names/date, the completed avatar is placed automatically, and resizing changes rendered pixels.
- A real browser export with fixture artwork produced a playable 720×1280 MP4, 11.9873 seconds, 6,831,299 bytes, including music and effects. The provider response was mocked only in this test; it is not evidence of live photo conversion.

Production Runway connection was still absent (environment revision 0) at the last check. The owner said they are configuring RUNWAY_API_KEY in secure Site settings. Recheck environment keys and publish to apply the new revision, then verify a live photo-to-avatar job. Do not copy secrets into source, logs or chat. Pack prices and the two-free-reel server limit are preserved; actual reel-pack payment remains deferred.
