# Editing the selected source film

Reference films and the original invitation collection use actual video-to-video
editing. The selected movie is never substituted with the generic 30-second
image-to-video director. The 140 editable studio templates use their existing
scene renderer and original five-scene animation, replacing stock artwork with
the saved personal cast. They need an avatar only, with no AI video charge.
Explicit new-film designs retain their separate generation path.

`reference-edit-contract.ts` binds each template to its source movie, measured
30-fps frame count and contiguous parts of at most 28 seconds. Prepared H.264
720p parts live under `reference-source/v1/<source>/` in R2. The public read route
allows only catalogued source IDs and part filenames; it cannot expose uploads.
The original full samples remain in `public/reference-films` and
`public/invitation-studio`. These are not generated customer results.

The service sends each part to Runway `POST /v1/video_to_video`, model `kling_4`,
with `videoUri`, the saved cast in `references`, and `ratio: auto_720p`.
There is no `duration` override. Instructions preserve the original scenery,
camera, movement and timing, replace protagonists, and remove old sample text.
Names and event details are composited by the existing editable renderer, so
correcting written details does not need another AI request. Generative edits
can vary; source editing does not promise pixel-identical backgrounds or faces.

The full-layout Shaadi Ka Ghar edit has measured parchment text panels in
`reference-text.ts`. They cover residual AI lettering at the original invitation
locations, use the current event fields and scene text edits, and share one drawing
path between preview and export. Their opaque bases do not fade or move away from
the old lettering. Other source films retain the standard text treatment and need
their own visual verification; these coordinates are not applied indiscriminately.

The 12 November 2026 live verification reused a saved avatar and completed both
26-second video edits without regenerating the avatar. The assembled H.264 output
decoded to 1,560 frames at 30 fps, 720 by 1280, exactly 52 seconds. Reopening the
saved project retained its source and avatar; correcting names/venue quoted zero
new AI credits. Actual clip frames exposed residual invitation lettering, leading
to the measured text treatment above. This is distinct from mocked API tests.

Every clip is cached by source version, source range, saved cast, editing prompt
and explicit regeneration ID. Completed parts survive a later failure. One
reviewed quote reserves the complete creation cost; retries reuse saved work.
Never automatically replace a rejected video edit with a new imagined film.

The authenticated creation library includes owned source photos and completed
avatar jobs, including avatars from failed parent films. A selected avatar is
resolved again on the server and its original photos are verified. Reusing it
does not start a new avatar request. Unsupported or ambiguous historical rows
are not guessed from nearby timestamps.

The Render Node runtime starts `creation-scheduler.mjs` when
`MEDIA_WORKER_ENABLED=1`. It advances persisted creations and leases deterministic
assembly tasks through authenticated local endpoints. FFmpeg/ffprobe validate
part lengths before joining; they do not stretch, loop or reorder footage.
The same `MEDIA_WORKER_SECRET` protects the endpoints. Existing encoder hosting
and storage/auth services remain in place; no extra service is required.

Source-film voice lip-sync is currently unavailable. Runway has no dedicated
audio-to-existing-video lip-sync endpoint. The source workflow rejects that
option before reserving credits, rather than falling back to a different film.
Other newly generated speaking-film templates retain their existing voice flow.

Production checks must distinguish mocked contract tests from an actual paid
provider result. A saved avatar preview is never displayed as a completed movie.
Only a result with matching source ID, source photos and reference-edit metadata
unlocks finishing for a selected source film.

API contracts: https://dev.runwayml.com/learn/kling-4-0-api and
https://docs.dev.runwayml.com/guides/pricing/ . Native runtime support:
https://render.com/docs/native-runtimes .
