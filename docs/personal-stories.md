# Persistent personal stories

- Personal avatars and uploaded portraits now use people-free settings across every scene, including complete-film and older illustrated templates. The renderer never loads stock-character footage for a personal story. Scene backgrounds, character framing, typography, timing and effects remain editable.
- The story planner assigns different, occasion-related backgrounds and layouts. This composition is local and does not call a paid AI service for each scene. Changing a template keeps the saved character.
- Drafts automatically sync to the signed-in account. A local account-scoped cache protects recent unsynced edits; the server remains the durable source across devices. AI jobs have a project reference and can resume after the editor closes.
- The avatar library is independent of rendered videos. Legacy ready/completed generation records are imported on read. Exports no longer overwrite the generation payload.
- Matching photo/style generation requests share one job, including concurrent requests. Identical uploaded bytes reuse an account-owned photo record. Explicitly creating a new AI version uses another credit.
- A saved project with a completed paid export or ready paid generation can export edited versions for zero additional credits. Reusing a saved avatar in a separate new project does not call AI; that project's first export uses one reel credit.
- Public template previews remain available. Anonymous visitors cannot open the editor, save, upload, generate or export. Google sign-in activation requires the owner's OAuth credentials; see google-login.md.

Validation: account isolation, avatar persistence, duplicate-request billing, all-scene personal rendering, Google token/PKCE/state validation, TypeScript and browser QA. A real 12-second MP4 with six backgrounds was exported from an existing avatar without another provider call or credit. Browser checks cover reload, close/reopen and 320/390px layouts.
