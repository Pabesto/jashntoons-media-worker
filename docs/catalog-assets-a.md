# Celebration catalog backgrounds A

Generated 2026-11-11 for Jashntoons using the OpenAI **built-in image_gen tool** (built-in mode), one new generation per asset. No input/reference images were used in the tool calls. The written art direction follows the requested Indian storybook invitation style.

## Deliverables

All final WebP files are **720 x 1280**, vertical 9:16, opaque backgrounds. Original PNGs are retained in `outputs/catalog-assets-a/`. Built-in originals remain at their generated location as well. Only resizing/format conversion was applied with Sharp: `resize(720, 1280, { fit: 'cover' }).webp({ quality: 86, effort: 6 })`. No content edits, overlays, text, people, or character compositing were applied.

| Asset | Final path | Bytes | Original path |
| --- | --- | ---: | --- |
| jungle-birthday | `public/catalog/jungle-birthday.webp` | 305112 | `outputs/catalog-assets-a/jungle-birthday.png` |
| candy-carnival | `public/catalog/candy-carnival.webp` | 204092 | `outputs/catalog-assets-a/candy-carnival.png` |
| disco-birthday | `public/catalog/disco-birthday.webp` | 200394 | `outputs/catalog-assets-a/disco-birthday.png` |
| blush-engagement | `public/catalog/blush-engagement.webp` | 185286 | `outputs/catalog-assets-a/blush-engagement.png` |
| lotus-engagement | `public/catalog/lotus-engagement.webp` | 204212 | `outputs/catalog-assets-a/lotus-engagement.png` |
| candle-anniversary | `public/catalog/candle-anniversary.webp` | 182210 | `outputs/catalog-assets-a/candle-anniversary.png` |
| golden-anniversary | `public/catalog/golden-anniversary.webp` | 274040 | `outputs/catalog-assets-a/golden-anniversary.png` |

## Visual validation

Every generated PNG and every optimized WebP was visually inspected. All seven are distinct complete scenes, contain no people or text, and leave an open upper region for invitation names plus a central lower area for a separately generated avatar. Birthday worlds use jungle, candy carnival, and dark disco staging. Engagement scenes use an airy lakeside floral gazebo and Indian lotus-pavilion architecture. Anniversary scenes use a midnight candle terrace and an illuminated rose garden. No unresolved asset issues.

The source PNGs are 941 x 1672, except blush-engagement at 940 x 1672. The tiny aspect difference is normalized during the final resize.

## Exact prompts

### jungle-birthday

Tool: `image_gen.imagegen`; `transparent_background: false`; no referenced images.

Source: `C:\Users\hacker\.codex\generated_images\01a1c9db-e398-73a0-9359-47341750bbf9\exec-55c3adff-22c4-4a99-a2b4-4922b33c242d.png`

```text
Use case: illustration-story. Asset type: premium vertical 9:16 animated invitation background for a birthday reel, single complete image. Primary request: a sunny whimsical jungle birthday clearing with delightful illustrated baby elephant, giraffe, lion cub and monkeys arranged only around the side edges; clusters of sage, ochre and cream balloons tied to tropical trees. Rich hand-painted storybook watercolor with fine gouache detail, luxury Indian children's invitation artistry, layered banana leaves and palms, tiny flowers and soft sunbeams. Composition: portrait 9:16, expansive pale warm blue sky through the canopy in upper third reserved clean for a name overlay; broad inviting sunlit grass clearing occupying central lower half reserved for an added avatar. Animals and balloons frame this empty center, not filling it. Deep layered background, exquisite leaves and gentle realistic textures, joyful premium visual. No humans. No text, letters, digits, signage, logos, watermarks, panels or borders. Not a collage. Fully opaque background.
```

### candy-carnival

Tool: `image_gen.imagegen`; `transparent_background: false`; no referenced images.

Source: `C:\Users\hacker\.codex\generated_images\01a1c9db-e398-73a0-9359-47341750bbf9\exec-f6b801b7-39ba-4b07-b723-e33d28200dc5.png`

```text
Use case: illustration-story. Asset type: premium vertical 9:16 birthday invitation background, single complete scene. Primary request: a dreamy pastel candy carnival with a jewel-like ornate carousel at lower left, a delicate Ferris wheel far right, striped candy stalls at the distant edges, lollipop trees, cotton-candy clouds and tiny glowing bulbs. Sophisticated hand-painted watercolor and gouache storybook art with intricate Indian invitation craftsmanship, layered theatrical perspective and luminous candy-glass details. Palette: peach, lavender, pistachio, strawberry pink and warm cream. Composition: portrait 9:16; open soft pastel sky across upper third for a name overlay; an empty creamy curved promenade in central lower half for a future avatar; all large carnival structures frame the sides and background without blocking center. Charming, luxurious, abundant yet carefully composed. No people. No text, letters, digits, signs, logos, watermarks or collage. Fully opaque background.
```

### disco-birthday

Tool: `image_gen.imagegen`; `transparent_background: false`; no referenced images.

Source: `C:\Users\hacker\.codex\generated_images\01a1c9db-e398-73a0-9359-47341750bbf9\exec-940660ad-b6d7-4b04-a7de-c032bfcb95c0.png`

```text
Use case: illustration-story. Asset type: premium vertical 9:16 animated birthday invitation background, single complete scene. Primary request: a dazzling midnight disco party stage, giant faceted mirror disco ball suspended at the very top, shimmering emerald velvet curtains gathered at the side edges, hot pink and mint neon geometric accents along the side walls, elegant black lacquer tiled stage floor reflecting colored light, tiny confetti at the edges. Sophisticated hand-painted gouache and watercolor concept illustration with jewel-like details, lively theatrical depth and tasteful contemporary Indian celebration luxury. Composition: portrait 9:16; upper-middle third is open deep midnight teal with a subtle soft light wash for future white name text, no obstructions; central lower half is an empty broad stage for a future added character. Decor, light beams and small speakers restricted to edges; depth at back. Palette midnight teal, emerald, magenta, chrome silver and champagne highlights. No humans, no text, letters, digits, logos, signs, watermarks or collage. Fully opaque background.
```

### blush-engagement

Tool: `image_gen.imagegen`; `transparent_background: false`; no referenced images.

Source: `C:\Users\hacker\.codex\generated_images\01a1c9db-e398-73a0-9359-47341750bbf9\exec-4b83300b-dacf-4380-9d98-7ab9647d982a.png`

```text
Use case: illustration-story. Asset type: premium vertical 9:16 romantic engagement invitation background, single complete scene. Primary request: an enchanting lakeside ivory wrought-iron gazebo wrapped in blush roses and trailing ivory jasmine, set slightly behind the center on a rosy marble terrace, still lake and soft distant hills in glowing golden dusk. Painterly luxurious watercolor with fine Indian wedding invitation illustration craftsmanship, layered roses at lower corners and soft petals framing edges. Composition: portrait 9:16 with a broad luminous apricot and pale rose sky in upper third left open for names; gazebo frame surrounds but does not fill the middle; broad central lower terrace empty for added couple avatar, floral urns only at far sides. Tender airy garden atmosphere, detailed rose blooms, fine golden metalwork and soft reflections. Palette blush, ivory, peach-gold and muted sage. No people. No text, letters, digits, logos, watermark, signs, collage or visible invitation card border. Fully opaque background.
```

### lotus-engagement

Tool: `image_gen.imagegen`; `transparent_background: false`; no referenced images.

Source: `C:\Users\hacker\.codex\generated_images\01a1c9db-e398-73a0-9359-47341750bbf9\exec-b4ee1286-a9a6-4124-be29-09fcf088cd4f.png`

```text
Use case: illustration-story. Asset type: premium vertical 9:16 Indian engagement invitation background, one complete illustrated scene. Primary request: a serene Indian lotus garden at peach sunset, wide pond filled with dusty pink lotus flowers and blue-green pads framing a cream sandstone pavilion with elegant cusped arches and delicately carved columns, a small graceful curved bridge on one distant side. Painterly Indian miniature art blended with luxurious watercolor storybook realism; very fine stonework, layered botanical details and quiet reflected light. Composition: portrait 9:16; pale apricot sky and a small veil of wispy clouds fill the open upper third for future names; pavilion sits at middle distance; a broad empty cream stone platform in the central lower foreground allows a couple avatar to be added, with lotus ponds around its sides and few blooms at lower corners. Balanced Indian architectural scene, gentle ceremonial atmosphere. Palette warm cream, peach, pink lotus and blue-green water. No people. No text, lettering, digits, signs, logos, watermarks, collage or borders. Fully opaque background.
```

### candle-anniversary

Tool: `image_gen.imagegen`; `transparent_background: false`; no referenced images.

Source: `C:\Users\hacker\.codex\generated_images\01a1c9db-e398-73a0-9359-47341750bbf9\exec-f2a7707f-d404-41e0-917e-1616313af29c.png`

```text
Use case: illustration-story. Asset type: premium vertical 9:16 romantic anniversary invitation background, single complete scene. Primary request: an intimate regal candlelit terrace overlooking a moonlit lake, burgundy silk drapes tied at the outer edges, clusters of tall gold candlesticks and glowing glass votives along both sides, deep crimson roses in antique brass urns, warm ivory marble balustrade and distant palace lights reflected in navy water. Rich hand-painted watercolor and gouache illustration with luxury Indian celebration artistry, fine fabric and metal details, glowing cinematic candlelight. Composition: portrait 9:16; broad open deep ink-blue sky across upper third for future gold name text, tiny crescent moon off to one side; terrace floor at central lower half stays empty for a future couple avatar; candles and roses remain at side edges, no furniture in center. Dramatic burgundy, antique gold, cream and midnight blue, romantic elegant depth. No people, no tables, no bottles. No text, letters, digits, logos, signs, watermark, collage or borders. Fully opaque background.
```

### golden-anniversary

Tool: `image_gen.imagegen`; `transparent_background: false`; no referenced images.

Source: `C:\Users\hacker\.codex\generated_images\01a1c9db-e398-73a0-9359-47341750bbf9\exec-115d4a5f-9664-4f63-b91e-bce523b0280e.png`

```text
Use case: illustration-story. Asset type: premium vertical 9:16 anniversary invitation background, one complete scene. Primary request: an opulent golden rose garden at blue hour with a graceful oval champagne-gold metal arch covered in cream roses and pale golden climbing flowers, countless tiny fairy lights woven overhead between distant garden trees, warm glowing stone lanterns along a curving garden walk, beautifully manicured flowering borders. Luxury hand-painted storybook watercolor and gouache illustration with fine Indian invitation artistry, delicate botanical detail and luminous bokeh, a soft golden glow under a dusky lavender sky. Composition: portrait 9:16; open softly graded lavender upper third for future names, fairy lights close to edges; arch in the middle distance, broad central lower garden walk and pale stone landing empty for a future couple avatar; dense roses at lower left and right only. Emphasize an elegant anniversary celebration with no alcoholic drinks, bottles or furniture. Different from a lakeside gazebo: a private lush rose garden with a slim oval metal arch and winding paths. No people, text, letters, digits, signs, logos, watermarks, collage or graphic borders. Fully opaque background.
```


