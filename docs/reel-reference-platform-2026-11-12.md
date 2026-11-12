# Reference reel invitation platform

The homepage now opens with playable invitation references and a searchable 187-template library. The existing full-screen vertical viewer opens each complete film; **Use this reel** opens one complete, autosaved brief. The peach/coral public theme and warm dark creation workspace remain consistent on desktop and phone.

## Creation contract

- New briefs persist `creation.experience: reference-v2` through sign-in, saved projects and template selection. Old paid projects retain their source, duration and generation behaviour.
- Every active template resolves to its actual reference video. A source of 30 seconds or less goes directly to video editing; longer films use immutable, frame-aligned provider parts in source order. New films are at most 60 seconds. Three longer legacy references have separate 60-second editions.
- One form holds photos, names, heading, main schedule, family, invitation message, RSVP, clothing, movement, decorations, props and soundtrack. Longer films accept up to eight functions, each with its own date, time, venue and optional detail. Capacity is validated before credit reservation.
- Artwork uses uploaded photos for identity and the selected reference poster only for wardrobe/style. Automatic clothing adapts to the occasion; users can retain photo clothing or describe outfits. Ten category moments and the original movement option feed the actual edit prompt.
- AI removes sample lettering; the renderer places the saved invitation text, including every function schedule and closing RSVP. Text-only corrections reuse paid footage. Visual changes receive a fresh quote. Exact motion and likeness can vary; the review UI says this explicitly.
- Ownership, quote approval, reservation/refund, completed-asset reuse, private media and existing export/assembly safeguards are retained.

## Reference media

26 new Runway-generated sample reels: 21 catalogue designs, four previously still worlds, and one 14-second vintage save-the-date inspired by the supplied reference. The clips contain character movement, sample invitation text and the existing original music track. Sample lettering is composed locally for readability. Generated posters show the actual clip. Task IDs and provenance are in `reel-reference-assets-2026-11-12.json`; no signed download links or credentials are committed.

15 new long-film provider parts were uploaded to the existing private storage and hash-verified. The public route serves only allowlisted source/part combinations. No customer photo is added to the public library by this release.

## Validation

- 165 existing and new tests passed, including media duration checks for all 187 references, exact source binding, one-brief persistence, eight rendered function schedules, closing RSVP, pre-spend validation, ownership, failure/refund, assembly and footage reuse after text corrections. Royal Garden uses its measured 1194-frame duration and new immutable provider parts to avoid a short final segment.
- TypeScript and the native Render production build are checked separately before publication.
- Desktop and 393×852 phone review covered the homepage, library, full-screen playback, one-form navigation, repeatable functions and alternate character moments. The compact phone reel launcher does not cover form controls.
- AI sample contact sheets are visually reviewed; all catalogue video and poster paths are checked. Production media and health checks follow deployment.

Paid real-customer generation is not performed as a QA side effect. The provider request contract is integration-tested with isolated fixtures; the new public samples are actual completed Runway generations.
