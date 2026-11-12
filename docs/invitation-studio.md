# Original AI invitation studio

The public product is an invitation studio: personal video invitations, matching digital cards, and reusable character artwork. It retains the existing photo, template, voice, private library and creator-publishing flows.

## Original collection

Eight original directions live in `lib/invitation-directions.ts`: Sunehri Darwaze, A Letter for You, Rangon Ki Mehfil, Moonlit Promise, Garden of Little Wishes, The Birthday Express, Afterglow Celebration, and Painted Chapters. Each has a character-free original background and a complete 15-second three-scene showcase, created through the connected Runway workspace. Sample people and details are explicitly labeled. These are showcases; personalized films use the existing 30-second generation workflow.

Source artworks and films were generated on 2026-11-12. Text, dates, venue and original synthesized music were composed locally into the public showcase MP4s. No marketplace film or portfolio artwork was downloaded or republished. Provider task provenance is recorded in `docs/invitation-assets.json`; signed download URLs and private references are excluded.

## Creation and credits

- The creator offers video, card and character artwork. The selected output survives sign-in and draft reopening.
- Each occasion has ten existing subject-action presets, now wired into the full-film prompt together with camera direction. The three-scene storyboard supports bounded per-scene notes and an optional creative brief.
- Character treatment is selected explicitly. Its style contributes to the artwork cache key. Changing the template preserves the selected character treatment; changing treatment requires a fresh quote. The original watercolour cache remains reusable for legacy avatars.
- Names, written date, venue, family, message and RSVP are controlled overlays. Correcting these fields does not change the no-speech film cache key. Changing spoken wording, artwork style, scene direction, moment or setting can require generation and a new quote.
- Card PNG composition and download use no AI credits. A card can use the original character-free background with current event details and a regular uploaded photo. Optional AI character artwork costs one credit if it is not already cached. Card generation never submits video or speech jobs.
- Cards download at 1080 × 1920 and use the same saved draft. Long names, venues and function descriptions wrap and scale to fit. Source-film sample faces are never used as card backgrounds. Private photos use the existing authenticated media endpoint.
- Completed artwork, ownership checks, atomic reservations, quote approval, cached reuse and failure refunds remain in the existing generation service. No new payment provider or subscription was added.

## Design research

These primary portfolio and studio pages informed general visual techniques, not copied compositions. Some portfolio pages restrict embedded-film access; their descriptions and catalogues were used rather than claiming frame-by-frame inspection.

1. [Amarea Creative — Wedding Invite](https://www.behance.net/gallery/228571687/Wedding-Invite-Video-Invite-E-Invite): coordinated motifs and bilingual wedding identity.
2. [Shreya Paul — Wedding E-invite](https://www.behance.net/gallery/147441831/Wedding-E-invite): function-specific settings and animated people.
3. [Savi Rathi — Artisanal Invitation Suite](https://www.behance.net/gallery/227622933/Custom-Artisanal-Indian-Wedding-Invitation-Suite): hand-drawn motifs across a coordinated suite.
4. [Shalina Kishnani — Engagement Invitation](https://www.behance.net/gallery/135194441/Engagement-Invitation-Design): floral engagement stationery.
5. [Daria Halahuz — Birthday Animation](https://www.behance.net/gallery/233797893/Birthday-invitation-ANIMATION-DESIGN): birthday-specific motion presentation.
6. [Maurice Beasley — Baby Shower](https://www.behance.net/gallery/245728507/Jordons-Baby-Shower): expressive colour and readable event hierarchy.
7. [Metta Invitation — Pinterest](https://www.pinterest.com/pin/771100767481874950/): vertical personal invitation composition.
8. [Dil Se Invite](https://www.dilseinvite.in/work): consistent people across varied painted worlds.
9. [WedMyLove Animated Invitations](https://wedmylove.com/wedding-invitation-videos/animated): complete paper and garden worlds.
10. [WedMyLove Haldi](https://wedmylove.com/invitation-videos/haldi): ceremony-specific objects and materials.
11. [Nimantran Moving Cards](https://nimantran.page/wedding-card-design): architectural opening and physical reveal.
12. [Nimantran Hand-painted Invitation](https://nimantran.page/anime-wedding-invitation): story chapters and painted texture.
13. [MariFête Floral Sage](https://www.marifete.com/products/wedding-invitation-website-with-video-and-21651): envelope and botanical direction.
14. [Shaadi Aangan Wax Seal](https://www.shaadiaangan.com/templates/video-invites/wax-seal-vellum-unfold): tactile vellum opening.
15. [TwistInvite Birthday](https://www.twistinvite.com/kids-birthday-invitations): category-specific imaginative worlds.
16. [PixerInvite Golden Toast](https://pixerinvite.com/designs/golden-toast): restrained milestone celebration.
17. [Ceremo Minimal](https://jamandken.useceremo.com/templates/minimal): editorial typography and whitespace.

## Verification

`tests/creation-jobs.test.cjs` exercises every occasion action, prompt propagation, style isolation, card-only jobs, quote changes, free text corrections, cache reuse, ownership, reservations and refunds with isolated SQLite and mocked provider responses. Generated public Runway films are independently real assets; the backend tests do not claim a real paid personalized-film run. Render deployment and public asset checks are documented with the release.
