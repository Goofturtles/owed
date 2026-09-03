# Design references

Every section of the landing page and every view of the app was built from real product UI found on Mobbin, plus named motion systems for timing and easing. This ledger says which. Colours and words are Owed's; the structure, proportions and behaviour come from the references. Standing rule: match a reference's craft level, never lift its signature idea — Owed's own signature is the lit clause in the small print.

Research method: for each part, 4–20 Mobbin queries (sections, screens, flows), every returned image examined, ≥5 references recorded with measurable specifics, patterns stated only when ≥3 references share them, then an independent completeness critic and a synthesised spec. Raw notes and the spec live with the September 2026 work log; the merge and count audit is in `LIMITATIONS.md`.

Motion systems named throughout: Material 3 motion tokens and easings; Framer Motion's default spring (stiffness 100, damping 10, mass 1); Emil Kowalski's guidance on UI animation; Apple HIG Motion (Reduce Motion honoured everywhere).

## Interaction finish, measured on award-winning sites (2 September 2026)

Hover and press states cannot be read from Mobbin stills, so they were measured live, in the browser, on the sites Awwwards had just awarded (verified on awwwards.com the same day):

- **Aardvark Book Club** — Site of the Day, 30 Aug 2026 ([awwwards.com/sites/aardvark-book-club](https://www.awwwards.com/sites/aardvark-book-club), live at aardvarkbookclub.com). Primary buttons: the pill's fill scales up on hover (`scale .15s cubic-bezier(.4,0,.2,1)` on the anchor; the fill span runs `transform .35s cubic-bezier(.34, 2.27, …)`, an overshoot), and the label nudges 3px with a 4° tilt. → Owed's `.btn-accent:hover` scales to 1.025 on `cubic-bezier(.34, 1.56, .64, 1)` over 320ms and settles to .98 on press; the tilt was left out for the older audience.
- **Sharplink** — Site of the Day, 27 Aug 2026 ([awwwards.com/sites/sharplink](https://www.awwwards.com/sites/sharplink)). Every nav word and CTA is rendered twice, stacked; on hover the visible copy slides up and the second takes its place. → Owed's nav links (`.nav-links a.swap`) carry the same two-copy slide, 350ms `cubic-bezier(.65, 0, .35, 1)`, disabled under Reduce Motion.
- **Squarespace Foundations** — Site of the Day, 1 Sep 2026 ([awwwards.com/sites/squarespace-foundations](https://www.awwwards.com/sites/squarespace-foundations)). Utility controls fade (`opacity .3s`) rather than move. → Owed's icon buttons keep their fill-only hover.
- **Opal Tadpole** — Site of the Day, 11 Jan 2024, on the Sites of the Year list ([awwwards.com/sites/opal-tadpole](https://www.awwwards.com/sites/opal-tadpole)); the product page now redirects to a story page, so nothing was measured.

Cards on both pages (`.rcard`, `.tile`, `.hw-tile`) rise 1px with a soft shadow on hover; footer and script links draw an underline in from the left (250ms). Result cards and tiles only animate under `@media (hover: hover)`.

### Buttons and colour fields, measured on nine big brands (2 September 2026, live in the browser)

apple.com (via Mobbin sections), stripe.com, notion.com, airbnb.com, revolut.com, figma.com, shopify.com, nike.com, dyson.com — primary call-to-action computed styles read from each live page:

| Brand | Fill | Gradient | Shadow | Radius | Height | Label | Hover transition |
|---|---|---|---|---|---|---|---|
| Apple | flat blue | none | none | pill | ~40 | 17/400 | colour |
| Stripe | flat #533AFD | none | none | 4px | 48 | 16/400 | bg/colour 300ms cubic-bezier(.25,1,.5,1) |
| Notion | flat #0075DE | none | none | 8px | 36–38 | 16/500 | bg/colour 200ms |
| Airbnb | flat | none | none | pill | 40 | 14/500 | shadow/transform 250ms cubic-bezier(.2,0,0,1) |
| Revolut | flat white / #1F1F1F | none | none | pill | 42 | 16/500 | bg/colour/opacity 300ms cubic-bezier(.15,.5,.5,1) |
| Figma | flat black | none | none (secondary: 1px inset hairline) | 8px | 46 | 16–18/330–400 | bg/shadow 180ms ease-out |
| Shopify | flat white | none | none | pill | 44–56 | 16–18/550 | 150ms cubic-bezier(.4,0,.2,1) |
| Nike | flat white | none | none | pill | 36 | 16/500 | colour |
| Dyson | flat #333 | none | none | 4px | 66 | 18/500 | colour |

Nine of nine: one flat colour, no gradient, no drop shadow; hover is a colour change (Airbnb adds a press transform). → Owed's `.btn` is a flat pill at 44/52px, label 16px weight 500, hover lightens and press darkens over 220ms on Stripe's curve; the earlier sheen, inner light, lift and spring were removed. Colour fields (the script panel, the closing card) are flat with at most one broad soft wash, after Apple Health's mood screens; the Owed nav keeps its blur glass and hairline border like Apple's.

## Landing page

### The white page (3 September 2026, second pass — the live one)

The owner rejected the cream ground, the light uppercase heads and the first SaaS pass, and set three rules: pure white with black type and black buttons, bolder type, and every part copied directly from a different brand's Mobbin section (no brand twice), with Owed's own app images in every part. A later round the same evening cut the copy hard ("images that overpower the text"), added colour, removed the paper flythrough, the Notion bento and the ToDesktop steps, and made the nav float. Eight Mobbin studies (~90 sections examined, white/black references only) plus live computed styles from vercel.com, notion.com and attio.com set the system, and a consistency critic reconciled them:

- **Type**: Notion's scale re-set in Geist — section heads 54px / 700 / −0.035em / 1.04 (Notion live 54/700/−1.875px/56; Attio 52–56/700; Framer 56/700), FAQ head 72/700 (OpenPhone), closing 44, card titles 22–24/700, body 16/24, greys #666 (body) and #767676 (dim, 4.5:1). Buttons: black #000, radius 8, 40px in the bar (Attio), 48 in sections (Vercel/Attio), 56 at the close (Contra). Hairlines #EAEAEA (plurality across Vercel, Attio, Notion, Cursor). Container 1200px.
- **Colour**: Apple blue #0071E3 (apple.com's button and link blue, 4.7:1 on white; the owner: "lots of the companies use apple blue") is the one interactive colour — links, focus rings, the script card's pin, arrow and active pill icon, the environment bar, the closing mark and the closing's white-to-pale-blue ground. Four more pale tints with a deep ink each — mint #DDF3E6/#0B5C3A, sky #E8F2FC/#0071E3, sand #F5EBD6/#B45309, teal #D8EFF0/#0E7490, rose #FBE4E4/#B42318 — are used only as 40px icon tiles (`.t-*`) and coloured figures (`.c-*`); the ground stays white, the buttons stay black.
- **Nav — Attio** ([07bc478d](https://mobbin.com/sites/sections/07bc478d-e98c-4b12-b956-62afd8a3e811)): 72px, 15px/500 links, outlined Sign in + solid black Start free at 40px/r8; fixed and fully transparent over the film at the top, and from 8px of scroll a floating glass bar (white at 42%, 22px blur, a 6% hairline) that the film and the page show through — the owner rejected the first 72% version as "a white slab"; phone sheet of 56px rows.
- **The film — Owed's own**, every frame of the 24 fps clip (241 WebP at 1920×1080, quality 88, 13 MB, drawn with high-quality smoothing) on desktop and every second frame at 960×540 on phones and under Save-Data (the owner: "increase the quality"; the source is 1080p, so quality and frame count were the only levers), painted to a canvas at the nearest frame to a smoothed scroll position; the mp4 seeking that stuttered is gone. The track is 700vh (560 on phones): the frames play over its first 72% and then hold the last frame, so the third chapter (the headline and the field) stays on screen for about three screens of scroll before the dissolve — it rose and vanished within one screen when the film and the text ended together (the owner: "this disappears way too fast"). The headlines are set in Apple's face — the system stack (SF Pro on Apple devices, Inter from Google Fonts elsewhere), 700, sentence case, −.025em (the owner: "bold the text and make it the Apple font"). The nav has no background at all while the film is under it and turns to glass only once the film's bottom edge has passed the bar. The hand-off from the film to the page is Apple's curtain, chosen after a three-angle research pass that read Apple's built CSS (Vision Pro `portal-content` with `margin-top: calc(-spacer - 10px)`, MacBook Pro's `sticky-container` with a negative block-end margin, iPhone Air's `garage-container` at −365px): the last frame HOLDS, and the whole white page — an opaque sheet, `position: relative; z-index: 4` on everything after the film, `margin-top: calc(-100svh - 8px)` on the first section — rides up over it under native scroll while a black scrim dims the frame to 50%; the chapter controls go inert the moment the sheet enters, and the nav turns to glass only when the sheet's top crosses the bar. One extra screen was added to the track (700vh + 100svh) so the third chapter's hold is untouched. The white cross-fade that preceded it ("fades too fast, then a void") is gone: there is no clean midpoint between a dark frame and a white page at any duration.
- **Rhythm**: every section carries the same air (120px, 72 on phones) and a hairline on top; two sections sit on Emergent's near-black band (#0A0A0A) with the faint character grid at the edges (a tiled SVG of monospace glyphs, masked to the outer thirds) — the script showcase and the closing, the two roles Emergent gives its own dark blocks in the owner's capture of app.emergent.sh/landing ("add different backgrounds to separate parts") — and the environment cards sit on a quiet inset panel (#F5F5F7, radius 20, Apple's tint; the cards lose their borders on it, Emergent's video-panel move). A grounds research pass (Emergent measured headless; Apple, Stripe, Vercel, Notion, Attio, Ramp, Linear computed live; Mobbin stills for direction) set the rules: one tint value per page, white between every tone change, hairlines only where white meets white, no more than two dark beats, black buttons stay black on grey and invert to white on black. On a dark band: white heads, #A1A1AA body, cards stay white; the nav turns white-on-dark over the film's sea chapter and the bands. Scroll-in motion is one rise (32px, .9–1.1s, cubic-bezier(.16,1,.3,1), staggered 90ms by position in the row) on every section, none under reduced motion.
- **Read from — Linear's faded marquee** ([756cc178](https://mobbin.com/sites/sections/756cc178-11d3-4389-810a-ee22b7f0131a)) under Coda's one grey sentence ([75b6afeb](https://mobbin.com/sites/sections/75b6afeb-b611-4194-8681-938618c2d379)): 42 names moving right-to-left on a 140s loop, masked 96px at each end, paused on hover and by a 28px pause button (WCAG 2.2.2), a static wrapped list under Reduce Motion. Every name is a `source_url` host in `data/coverage.json`; Wells Fargo is left out on purpose (LIMITATIONS).
- **The script — Vercel "Centralized feedback"** ([892a4a8f](https://mobbin.com/sites/sections/892a4a8f-55b5-4bad-84b3-c77a538bcfb2)), matched part for part after the owner compared the two: 48px/700 two-line head, 18/32 grey body with the key clause in black, one 48px black button; a white 12px card holding a pure grey wireframe (sidebar bars, a top bar, three blocks, a panel, three lines in #E4–#F3 greys — no screenshot; the owner rejected the faded-screenshot version) so only the 300px dark callout panel reads — head row with a green check mark and "just now", one line naming the Amex benefit, two thumbnail chips (real crops), a "No replies / 30 days to tell them" foot row, a dark composer field with a blue arrow — a blue numbered pin beside the panel's top-left corner, and a 52px black pill toolbar (blue active icon, card icon, four tinted source marks, a divider, share and more) hanging 26px off the card's foot.
- **In numbers — Ramp** ([b3c99307](https://mobbin.com/sites/sections/b3c99307-fd22-4b51-8d0b-11bc1d750391), [d7b8268c](https://mobbin.com/sites/sections/d7b8268c-d948-4fd8-b80d-951b2e7c337e)): four 64px/600 numbers, 16px grey labels, no heading, no rules; the counts are rounded (300+ rules, 190+ brands) because the owner found "318" oddly specific for a public page.
- **Five places — Square "A little peace of mind"** ([b6639492](https://mobbin.com/sites/sections/b6639492-77d4-4be2-9525-2eeb42d9f1e3)): columns with a tinted 40px icon tile, a short bold title, a 13px link with ↗; the grey sentences were cut.
- **Environment — Norma** ([cc6fe797](https://mobbin.com/sites/sections/cc6fe797-f3aa-4a78-a283-bde7fb1df9ae)): matched part for part after the owner compared the two: a 10px hairline card of four cells (40/600 BLACK number, 15/600 label, 13px grey source line) with a white strip under them (18/600 line + a 34px black pill), then a second card split 50/50 — a title and two pill selects on the left (where you live, how old it is), two 34/600 figures on the right (rules that could still cover it, the share with no end date, over a 4px black bar). The figures are counts from `data/coverage.json` by region × age bucket (window still open; no end date = 999 months), inlined as a data attribute, so every reader gets their own numbers; the coloured numbers, the mint strip, the phone schematic and the fixed "276 of 318" are gone. Cells: 80% after 800 charges and 7 years of parts (EU 2023/1670 and ecodesign), +12 months for choosing repair (EU right to repair), 3–6 years in Quebec; no CO₂ or tonnage.
- **FAQ — OpenPhone** ([16077091](https://mobbin.com/sites/sections/16077091-516c-4e22-b6d2-c6ad86b01432)): 72px/700 centred head, 18px sub, 100px to the list, 90px hairline rows with a 20/600 question and a chevron, first open; five questions, one- or two-line answers.
- **Closing — Contra** ([66f6354b](https://mobbin.com/sites/sections/66f6354b-428e-435a-9878-c46e38c9c249)): 64px mark, 44px head, 17px grey line, one 56px black button, a 13px line with an underlined link, on flat white above a hairline (the pale-blue gradient's seam into the footer was rejected).
- **Footer — Portrait** ([80af72e7](https://mobbin.com/sites/sections/80af72e7-d5b7-4a68-94c2-1626b76112bf)): wordmark and a status line, three link columns at 14px, a dashed hairline, one 12px line.

Gone from this page, all at the owner's request: the paper flythrough (scene.js/scroll.js are no longer loaded), the Notion "Try for free" bento ([73408d02](https://mobbin.com/sites/sections/73408d02-de80-4628-9e76-4ce1c1b5e701)), the ToDesktop step cards ([a52dff05](https://mobbin.com/sites/sections/a52dff05-8f33-4ec6-92ce-ab2fdd3c550b)), the full-width product shot and the Twenty screenshot cards ([a29b4352](https://mobbin.com/sites/sections/a29b4352-c6a5-4065-afd5-cd1af1cf2079)) — the rule since: no screenshots of the app on the landing; graphics are drawn like the references' own. The storyboard the owner approved before the build (the Mobbin stills stacked in page order) is `storyboard/index.html`, local only.

### The SaaS page under the film (3 September 2026, first pass — replaced the same day)

Everything below `#film` was rebuilt in one pass as a light SaaS page after seven Mobbin section studies (≈60 sections examined; specs and the corpus-fact audit are in the 3 September work log). The entries below this one describe the earlier sections they replaced and are kept as history. Shared rules the studies agreed on: white cards with one hairline, radius 16, no shadow (Notion bento, Vercel, Miro, Twenty, Klarna, Attio, Cursor, Deel); a 2–4 word title at 20/500 and exactly one sentence at 16; product crops that bleed off a card edge and fade into the card (Notion, Linear, Twenty, Klarna, Vercel); section heads left-aligned with the lede to the right; 112–176px between sections; no button inside feature grids.

- **The product** (`#product`): the whole app at reading size in one hairline card right under the hero — Attio "A CRM created to be your own" ([mobbin.com/sites/sections/8fa276bd-351b-4988-bdb2-dd8b84661988](https://mobbin.com/sites/sections/8fa276bd-351b-4988-bdb2-dd8b84661988)), Sequence "Go live in days" ([27bf1023-ba04-4af0-ae50-5fad11815613](https://mobbin.com/sites/sections/27bf1023-ba04-4af0-ae50-5fad11815613)), Notion 5-card strip above a product shot ([b2bc7d7b-fb64-4de5-97fc-c8c73f7c8d07](https://mobbin.com/sites/sections/b2bc7d7b-fb64-4de5-97fc-c8c73f7c8d07)). Bare rounded crop, 1px hairline, no browser chrome (1 of ~35 sections used device chrome).
- **Read from** (`.sources`): the credibility strip without customers — Notion's trust line ([590675e3-3657-40b8-86ae-7898f1422af5](https://mobbin.com/sites/sections/590675e3-3657-40b8-86ae-7898f1422af5)), Legora's law-firm names set as type ([466b730c-eb87-4806-aa4a-15ffe507d2e2](https://mobbin.com/sites/sections/466b730c-eb87-4806-aa4a-15ffe507d2e2)), Hilos' marquee of names ([5b24734a-552f-4515-9a9e-be759f1db8e2](https://mobbin.com/sites/sections/5b24734a-552f-4515-9a9e-be759f1db8e2)), Linear's faded marquee ([756cc178-11d3-4389-810a-ee22b7f0131a](https://mobbin.com/sites/sections/756cc178-11d3-4389-810a-ee22b7f0131a)), Amie's honesty footnote ([596167b7-8faf-433d-a89d-62c50034a1d5](https://mobbin.com/sites/sections/596167b7-8faf-433d-a89d-62c50034a1d5)), Spade's mono micro-labels ([516e88e7-e986-4750-8637-1c262200000e](https://mobbin.com/sites/sections/516e88e7-e986-4750-8637-1c262200000e)). Caption left, names in one grey, 110s loop, a Pause button (WCAG 2.2.2), static wrapped list under Reduce Motion. Every name is a `source_url` host in `data/coverage.json`, grouped by `source_type`; no site count is printed because two independent tallies disagreed (178 vs 180).
- **The problem** (`#problem`): three white sentence cards with the figure inside the sentence — Apple "iPhone 17 Pro and the environment" ([3f1939f3-9ce0-4843-9f68-f4aac35eafa8](https://mobbin.com/sites/sections/3f1939f3-9ce0-4843-9f68-f4aac35eafa8)); the footnote line under a hairline is Samara's in-card qualifier ([657ce048-adc8-4069-861f-5654023f8e36](https://mobbin.com/sites/sections/657ce048-adc8-4069-861f-5654023f8e36)).
- **Inside Owed** (`#features`): the bento — Notion "Try for free" ([73408d02-de80-4628-9e76-4ce1c1b5e701](https://mobbin.com/sites/sections/73408d02-de80-4628-9e76-4ce1c1b5e701)), Linear 2/3 + 1/3 ([8b3beefe-4449-4b8c-a498-d6633521e8a8](https://mobbin.com/sites/sections/8b3beefe-4449-4b8c-a498-d6633521e8a8)) and 3×2 features ([2754727c-0d9b-426e-8f87-f3bf560afda4](https://mobbin.com/sites/sections/2754727c-0d9b-426e-8f87-f3bf560afda4)), Vercel collaboration cards ([5dbae9cb-19d9-4e78-a89d-75c27ffb5e55](https://mobbin.com/sites/sections/5dbae9cb-19d9-4e78-a89d-75c27ffb5e55)), Twenty screenshot cards ([a29b4352-c6a5-4065-afd5-cd1af1cf2079](https://mobbin.com/sites/sections/a29b4352-c6a5-4065-afd5-cd1af1cf2079)), Klarna benefit cards ([29e45c95-6779-419b-924a-4ed76f78e9f5](https://mobbin.com/sites/sections/29e45c95-6779-419b-924a-4ed76f78e9f5)), Attio 3×2 ([9038df26-d13c-4c95-98d5-62ba4fd5fad3](https://mobbin.com/sites/sections/9038df26-d13c-4c95-98d5-62ba4fd5fad3)), Miro ([5cac9637-e51a-42a3-a848-05352428ce91](https://mobbin.com/sites/sections/5cac9637-e51a-42a3-a848-05352428ce91)). One hero card across two columns (never more than one), crops bleed right and fade at the foot, 20px gutters, hover moves the crop 4px.
- **How it works** (`#how`): Sequence's stepper rail with dots ([27bf1023](https://mobbin.com/sites/sections/27bf1023-ba04-4af0-ae50-5fad11815613)), Runway's onboarding card ([bcbe23c6-95ea-467d-abc5-d913d2bc3667](https://mobbin.com/sites/sections/bcbe23c6-95ea-467d-abc5-d913d2bc3667)), Attio's tab stepper over one screenshot ([8fa276bd](https://mobbin.com/sites/sections/8fa276bd-351b-4988-bdb2-dd8b84661988)), Grammarly's numbered badges on the shot ([1db9aea8-a59f-4359-9e58-d46d4d73b84a](https://mobbin.com/sites/sections/1db9aea8-a59f-4359-9e58-d46d4d73b84a)), Mailchimp's light "01" numerals at 4× body ([a6c1b329-324c-430b-b72e-a6220c1a9ceb](https://mobbin.com/sites/sections/a6c1b329-324c-430b-b72e-a6220c1a9ceb)), Clay's black pill under the heading ([28c16d19-1b1c-4c38-b06e-660c77901cbc](https://mobbin.com/sites/sections/28c16d19-1b1c-4c38-b06e-660c77901cbc)), Loom's stepped text ([199a8621-7958-4339-ae38-12adc2439654](https://mobbin.com/sites/sections/199a8621-7958-4339-ae38-12adc2439654)). Three steps (the norm), one shared shot with three accent callouts placed in % of the image on the real UI; phones get the crop under each step.
- **What we check** (`#checks`): hairline columns, no cards — Vercel "Dynamic at the speed of static" ([ea59dfe9-3cc5-4536-972a-82cb838897f3](https://mobbin.com/sites/sections/ea59dfe9-3cc5-4536-972a-82cb838897f3)), Stripe's four-column benefits with a left rule ([6aa0864b-575a-40ac-9972-20a01167c8c4](https://mobbin.com/sites/sections/6aa0864b-575a-40ac-9972-20a01167c8c4)), Square's warranty row ([b6639492-77d4-4be2-9525-2eeb42d9f1e3](https://mobbin.com/sites/sections/b6639492-77d4-4be2-9525-2eeb42d9f1e3)), Trawelt's five numbered columns ([6549855f-e76b-4660-ba6a-1d1898e21546](https://mobbin.com/sites/sections/6549855f-e76b-4660-ba6a-1d1898e21546)). Bare 24px line icon (7 of 7 premium grids), 0 of 12 grids carry a button. No per-place counts: the book has six source types and the page says five (open owner decision).
- **The script** (`#script`): captions beside the figure — Vercel "Centralized feedback" ([892a4a8f-55b5-4bad-84b3-c77a538bcfb2](https://mobbin.com/sites/sections/892a4a8f-55b5-4bad-84b3-c77a538bcfb2)), Grammarly's markers repeated as caption headers, Linear's FIG. cards ([ac08f1c7-d536-4996-91cc-85da059dcade](https://mobbin.com/sites/sections/ac08f1c7-d536-4996-91cc-85da059dcade)), Notion Mail's drafted-reply card ([09e2269d-3adb-45c4-b6e3-d5067dff9748](https://mobbin.com/sites/sections/09e2269d-3adb-45c4-b6e3-d5067dff9748)), Mistral's segmented control above the shot ([53b5ae79-fb60-4129-a797-f2f3e58f6763](https://mobbin.com/sites/sections/53b5ae79-fb60-4129-a797-f2f3e58f6763)). The figure is the live script card (three real, sourced scenarios), not a picture; the three numbers are pinned to who / the rule / the deadline; the ground is one step deeper than paper; the green Charma field is gone.
- **Beyond money** (`#earth`, the environment section): Apple environment cards ([3f1939f3](https://mobbin.com/sites/sections/3f1939f3-9ce0-4843-9f68-f4aac35eafa8)), Stripe Climate's diagram with an honest caption and citations ([53bce219-5209-46d1-8aa5-77462be2cb0d](https://mobbin.com/sites/sections/53bce219-5209-46d1-8aa5-77462be2cb0d)), YLLW's measured-sustainability cells ([0d46242a-8fae-4e37-8baf-c13ac408bd2e](https://mobbin.com/sites/sections/0d46242a-8fae-4e37-8baf-c13ac408bd2e)), Samara's in-card baseline ([657ce048](https://mobbin.com/sites/sections/657ce048-adc8-4069-861f-5654023f8e36)), Impossible's baseline-in-the-sentence ([71a3b9bb-aba9-4cad-b993-d16d706a3a83](https://mobbin.com/sites/sections/71a3b9bb-aba9-4cad-b993-d16d706a3a83)); live pages: Patagonia Worn Wear (one sourced figure with agency and year), Back Market, iFixit (the claim phrase is the link), Ecosia (count only what you yourself did), Fairphone. Three figures, each with its baseline and its source beside it; the third figure is Owed's own count read from the shelf in this browser; the schematic carries "not to scale"; twelve chips are verbatim titles from the current book; no CO₂, tonnage or e-waste growth figure (LIMITATIONS §10–11).
- **What's in the rulebook** (`.statband`): equal hairline cells, light numerals, label under — YLLW ([0d46242a](https://mobbin.com/sites/sections/0d46242a-8fae-4e37-8baf-c13ac408bd2e)), Sana ([6ab74ca3-c6b1-4b6c-b10b-a7ee6050158c](https://mobbin.com/sites/sections/6ab74ca3-c6b1-4b6c-b10b-a7ee6050158c)), Ramp ([d7b8268c-d948-4fd8-b80d-951b2e7c337e](https://mobbin.com/sites/sections/d7b8268c-d948-4fd8-b80d-951b2e7c337e)), Amplemarket ([7630befa-a79e-459c-bacc-77d9ee066b5b](https://mobbin.com/sites/sections/7630befa-a79e-459c-bacc-77d9ee066b5b)). Four figures from the data (318 / 194 / 4 / $0), no "+" inflators.
- **FAQ** (`#faq`): Harvest ([0c073171-fb09-4b13-b140-937acb761f2c](https://mobbin.com/sites/sections/0c073171-fb09-4b13-b140-937acb761f2c)), Wix ([18fba4cd-6780-4dcc-9194-9c489635759c](https://mobbin.com/sites/sections/18fba4cd-6780-4dcc-9194-9c489635759c)), Teak ([71b84103-e862-4f0f-adaf-a6260f899849](https://mobbin.com/sites/sections/71b84103-e862-4f0f-adaf-a6260f899849)), Relume ([46c35afd-06bf-41fc-bb0b-83cb1494e5ef](https://mobbin.com/sites/sections/46c35afd-06bf-41fc-bb0b-83cb1494e5ef)). Heading left, list right at ~1:2, first answer open (12 of 19 references), plus that turns into a cross, an escape hatch beside the heading (to LIMITATIONS.md), any number open at once.
- **Closing card** (`.cta`): Intercom's rounded card ([a27d1861-ec2f-4b71-9aa8-041294e6e908](https://mobbin.com/sites/sections/a27d1861-ec2f-4b71-9aa8-041294e6e908)), Aboard, Homerun; Wix's black pill on a pale band ([dae5ebe8-79b3-42b4-9728-a0dc12008df3](https://mobbin.com/sites/sections/dae5ebe8-79b3-42b4-9728-a0dc12008df3)). A pale tint of the accent so the black pill reads; one headline, one line, two pills; the footer 24px under it.

### The film (the opening: one sticky scene, three chapters)

Ported on 3 September 2026 from the owner's `owed-cinematic` build (React + Tailwind + WebCodecs) into this page's vanilla stack, replacing the earlier hero and the WebGL document flythrough. A scroll-scrubbed film over a 500vh track (400vh on phones): the `<video>` is seeked towards a smoothed scroll position on every frame (exponential smoothing, tau 8, snap at 2ms) and never played; three text compositions fade in and out on the original's curves (chapter 1 fades 0.20–0.28, chapter 2 lives 0.32–0.63, chapter 3 rises 0.67–0.75); children enter on a 0.8s ease-out stagger (0 / 150 / 300 / 400ms) once a chapter is 30% in, and reset in 0.2s on the way out so scrolling back replays them. The film's four colours (navy #1D3045 on cloud, white on the dark sea) are fixed and do not follow the page theme. The type is the film's own voice — Geist 300 uppercase, tracked — used nowhere else on the page. Chapter three carries the working "what broke?" field as glass over the sea; the chapter rail (next, three dots, back up) sits bottom-right and turns white over the sea, as does the nav's glass. Reduced motion: no stagger, one still per chapter. The film ends by dissolving into the page ground over the last tenth of the track (a paper layer whose opacity follows the scroll, smoothed), while the fine-print section rises over it, so the page arrives with no seam. (A WebGL paper-burn ending was built and verified on 3 September 2026, then withdrawn at the owner's request; `assets/js/burn.js` stays on disk, unreferenced.)

### Cinematic chapters (the problem, the statement, the closing)

Three chapters of real footage between the readable sections, built from twelve Mobbin references studied on 2 September 2026. What they share, and what Owed copies: mid-page chapters are inset rounded cards, never a full-bleed 100vh (Zoox, Titan, Lightship, Fauna Robotics, Loom, Zipline, Blue Apron); bands run 45–75vh (Blue Apron ~45, Dropbox ~58, IKEA and Zoox ~60, Dropbox Paper ~70); copy on footage is white, light, two lines, and legible because the footage is dark where the type sits (Lightship, Waabi, Daylight), with at most a gradient under the text block (Rivian) and never a text shadow; the hand-off is a hard edge onto the page colour with generous top padding (Blue Apron, IKEA, Dropbox Paper); phones keep real video with cover framing (Lightship, Zoox, Waabi, Oura, Rivian). Owed's card: margin 12–24px, radius 20px, height clamp(480px, 68vh, 760px) (phones clamp(420px, 72svh, 640px)), a poster under a looping muted video that attaches within one viewport, fades in on play and settles from a 4% enlargement over six seconds, a 12% wash plus a bottom gradient under the text only, mono eyebrow, Geist 300 uppercase heading (the film's voice, the owner's call) at clamp(32px, 4.2vw, 56px) bottom-left, one plain sentence, one white pill where there is an action, a small footage credit top-right. Reduced motion and save-data: poster only with a centred play ring that starts the film with native controls (Blue Apron, Dropbox Paper). Footage, free and real, from Pexels: the problem = a cracked phone macro (Tima Miroshnichenko, 6754827); the statement = a slow macro across a printed page in lamplight (K, 5283822); the closing = hands at a repair bench (M 511, 7030718). Optional replacements rendered on the owner's GPU are specified in `RENDERS.md`.

- [Blue Apron](https://mobbin.com/sites/sections/6ec6fe52-1942-4fd5-94ed-b1c88c8a692b) — inset video band ~45vh, white two-line headline, light haze not a scrim
- [Zoox](https://mobbin.com/sites/sections/20682e5f-c100-420a-9fa4-c903409d30ed) — inset rounded video card ~60vh, portrait cut on phones
- [Lightship](https://mobbin.com/sites/sections/a5fa6838-ff45-42cc-8e90-b513fd69a5e7) — 12px inset, 16px radius, white light headline over dusk footage, dark-glass pill
- [Waabi](https://mobbin.com/sites/sections/0345226a-541f-4607-89b7-b6e0923cb872) — type over the dark half of the frame, no scrim; phone gets its own cut
- [Daylight](https://mobbin.com/sites/sections/f9f781dc-03d5-4372-bd1e-56415d63a1bf) — mono eyebrow, light headline, legibility from the grade
- [Rivian](https://mobbin.com/sites/sections/bf0f7a92-09c8-4358-8108-5af7ef657836) — the one explicit gradient-to-dark under the text
- [Dropbox Paper](https://mobbin.com/sites/sections/10e69996-df8c-4a86-bfb9-03693d9323f3) — hard edge, then the readable section resumes on white
- [IKEA](https://mobbin.com/sites/sections/53a34728-f3c4-46e0-81b5-2daf235a5dc5) — media pure image, type pure page

### Buttons, second pass (2 September 2026)

Owner's rule: no green buttons. The primary button is now ink on paper (black in the light theme, white in the dark one), after the white and black pills measured on Revolut, Shopify, Nike and Figma. The green remains the status and link colour only.

### Hero and WebGL flythrough

Frozen at the owner's request; not part of the September pass.

### Finder (the fine print with one line marked)

Owed's own signature idea. Its typography follows the document-facsimile pattern: grotesque sans at ~0.8× UI size, two tones, ragged right, never cropped; the marked line at ≥14px with a tint behind the run and Owed's margin bar. Motion: Material 3 `medium4` 400ms emphasized-decelerate fill, `medium1` 250ms bar.

- [Stripe (invoice PDF preview)](https://mobbin.com/screens/2a141402-f3a4-4faa-a838-e3884921b3a5) — The canonical premium invoice facsimile: a white sheet in a right-hand preview pane with a 2px blue 
- [Midday (invoice)](https://mobbin.com/screens/328c47b5-51d9-4e71-ac3a-ee46f4c65304) — A designer-grade invoice document centred on a light grey ground: regular-weight title, two-tone lab
- [Mercury (invoice preview)](https://mobbin.com/screens/32882676-91fa-4afb-88e6-7306bfff6dbf) — Fintech invoice preview: light-weight large 'Invoice', three-column From/To/Details header, table, a
- [Wave (Statement of Account)](https://mobbin.com/screens/5db5bbad-dc14-4305-8f4f-786e8e0bcac6) — A customer statement rendered in-app as a paper sheet: dark-red top bar, large monogram, right-align
- [illoca (An Open Letter hero)](https://mobbin.com/sites/sections/6820d250-c387-46cc-ba01-61933152a6e5) — A landing-page LETTER facsimile: cream sheet emerging from an envelope on a navy ground, six short p
- [Dovetail (transcript highlight)](https://mobbin.com/screens/9fd5fd65-a2fc-4218-8725-c49a35988746) — Long-form text in white cards with two sentence-spans highlighted for a comment thread in the right 
- [Strut (highlighted paragraph)](https://mobbin.com/screens/1301bdca-619b-47d0-b3d3-821a20eab5b2) — A document editor with one 4-line paragraph marked by a highlighter fill.
- [Figma (Terms of Service)](https://mobbin.com/sites/sections/ee216299-6ed2-4fa9-8e95-c2c9850d7821) — Real legal text as a product company sets it: effective date, version dropdown, body paragraphs, and

### Showcase (the app on the page)

Intercom's hairline index beside a cropped product shot (section study, Aug 2026); reduced to one lede + one visual per the image-led density research. Re-shot 2 September 2026 from the rebuilt three-pane shell: 1500×1000 at 2×, no browser chrome, one file per theme (`assets/img/app-shot.webp`, `app-shot-dark.webp`), run past the container's right edge from 900px and clipped by the section.

- [Linear](https://mobbin.com/sites/sections/91b1d7ce-42f5-45bb-a46d-d639dc04f9f4) — Dark 2-col feature section: 2-word heading left, two bold-lead micro-paragraphs, two overlapping app
- [Craft](https://mobbin.com/sites/sections/58c31ff2-407c-4d33-933f-3b0a08528728) — Centered 6-word headline, two pill CTAs, then a laptop photo with the product UI filling the bottom 
- [Front](https://mobbin.com/sites/sections/ba4ff47e-3460-4256-b2fb-0e0948cd8eb9) — Single centered 6-word heading followed directly by a full app screenshot on a pastel gradient panel
- [Vercel](https://mobbin.com/sites/sections/892a4a8f-55b5-4bad-84b3-c77a538bcfb2) — 2-col feature: heading + one paragraph with a bolded phrase + one black CTA on the left; a cropped U
- [Intercom](https://mobbin.com/sites/sections/9c26abac-3024-4d9e-8948-527d49d46d12) — Abstract UI wireframe (skeleton bars, no real text) on a pale-blue card left; 4-word heading and one
- [Descript](https://mobbin.com/sites/sections/e24b2a5a-b2f9-44c6-945d-5c06d32462d2) — Dark section: icon + 3-word serif heading + one paragraph + one CTA left; app crop right showing a t
- [Wise](https://mobbin.com/sites/sections/5913d254-146e-49b6-bc26-caaee21e868e) — 3-step how-it-works: numbered circles, a flat illustration per step, a single-sentence caption, one 
- [Zipline](https://mobbin.com/sites/sections/7b0ca7a7-caf2-42a6-b315-53b86c8cd190) — 3 tall illustrated cards; each card is ~80% image with a small "01/02/03" and a one-line caption at 

### Problem ledger (1 year / 90 days / 6 years)

Instrument's ruled ledger (section study, Aug 2026); figure + ≤4-word label + mono footnote per the density research's stat pattern (Amplemarket, Legora, Spade, Klarna); single ink after the round-1 review.

- [Linear](https://mobbin.com/sites/sections/91b1d7ce-42f5-45bb-a46d-d639dc04f9f4) — Dark 2-col feature section: 2-word heading left, two bold-lead micro-paragraphs, two overlapping app
- [Craft](https://mobbin.com/sites/sections/58c31ff2-407c-4d33-933f-3b0a08528728) — Centered 6-word headline, two pill CTAs, then a laptop photo with the product UI filling the bottom 
- [Front](https://mobbin.com/sites/sections/ba4ff47e-3460-4256-b2fb-0e0948cd8eb9) — Single centered 6-word heading followed directly by a full app screenshot on a pastel gradient panel
- [Vercel](https://mobbin.com/sites/sections/892a4a8f-55b5-4bad-84b3-c77a538bcfb2) — 2-col feature: heading + one paragraph with a bolded phrase + one black CTA on the left; a cropped U
- [Intercom](https://mobbin.com/sites/sections/9c26abac-3024-4d9e-8948-527d49d46d12) — Abstract UI wireframe (skeleton bars, no real text) on a pale-blue card left; 4-word heading and one
- [Descript](https://mobbin.com/sites/sections/e24b2a5a-b2f9-44c6-945d-5c06d32462d2) — Dark section: icon + 3-word serif heading + one paragraph + one CTA left; app crop right showing a t

### How it works (four white tiles with real app crops, 2×2)

Light section under the heading "Four questions, then a phone call.", header stack left, then a 2×2 grid of near-square (4:3) tiles told apart from the paper by fill alone, each with a small mono numeral, a 2–4-word title (Answer four questions · See who owes you · Read the script · Keep it on your shelf), ≤12 words of body and a real crop of the rebuilt app in a well filling the bottom half of the tile, bleeding off its bottom and right edges. The crops are 2× exports (`assets/img/how-01..04.webp`, each with a `-dark` twin) shown at about half their pixel width, so the UI sits at ~1:1 on a 2× screen; the two tall phone crops are narrowed to 78% and 56% of the well. Two-up rather than four-up because four 273px tiles could not keep one element of real UI legible. No connector line. Motion: Material 3 `medium2` 300ms emphasized-decelerate rise from 16px, `short1` 50ms stagger; hover lifts the crop 12px; one column under 720px.

- [Norma](https://mobbin.com/sites/sections/96f4183b-7eb5-437c-90ad-95d1306d320c) — Left-aligned 'How it works.' heading and a 2-line lede, then 3 equal hairline-bordered cards, each w
- [Airtasker](https://mobbin.com/sites/sections/c8ad31ec-26b9-4c52-9f86-0ddb568bb5e8) — Left-aligned 'What is Airtasker?' heading, then 3 solid-blue rounded tiles each holding a phone-scre
- [Braintrust](https://mobbin.com/sites/sections/3269321e-bdad-48fc-a49b-c1126a3fed77) — Large centred 'How it works', three pastel-gradient tiles each containing a UI crop that bleeds off 
- [Sequence](https://mobbin.com/sites/sections/27bf1023-ba04-4af0-ae50-5fad11815613) — Eyebrow chip, 2-line headline, then a 4-step horizontal timeline (dots joined by a hairline) with th
- [Wise](https://mobbin.com/sites/sections/5913d254-146e-49b6-bc26-caaee21e868e) — Centred one-line headline 'Order a card in just 5 minutes.', three flat illustrations inside pale pa
- [Zipline](https://mobbin.com/sites/sections/7b0ca7a7-caf2-42a6-b315-53b86c8cd190) — Centred 'How It Works', three tall pastel illustrated cards (sky, pink, green); the first holds a ph
- [Fruitful](https://mobbin.com/sites/sections/b6807166-b6b4-44f5-9040-1bfdf61ceb43) — Eyebrow 'How it works' and headline, a horizontal timeline with 4 labelled dots (Today / Day 1 / Day
- [Ramp](https://mobbin.com/sites/sections/329c945f-4a02-48ca-ab03-3a668e4e4d47) — Split layout: left column with a 2-line heading 'Four simple steps to get started on Ramp.' and a ye

### What we check (five places)

Tines' bento (section study, Aug 2026) re-skinned per the density research: white hairline cards, one single-stroke ink icon, mono numeral, ≤12-word body (Retool, Daylight, ClickUp, Figma icon grids). Pastel is reserved for the earth pills.

- [Linear](https://mobbin.com/sites/sections/91b1d7ce-42f5-45bb-a46d-d639dc04f9f4) — Dark 2-col feature section: 2-word heading left, two bold-lead micro-paragraphs, two overlapping app
- [Craft](https://mobbin.com/sites/sections/58c31ff2-407c-4d33-933f-3b0a08528728) — Centered 6-word headline, two pill CTAs, then a laptop photo with the product UI filling the bottom 
- [Front](https://mobbin.com/sites/sections/ba4ff47e-3460-4256-b2fb-0e0948cd8eb9) — Single centered 6-word heading followed directly by a full app screenshot on a pastel gradient panel
- [Vercel](https://mobbin.com/sites/sections/892a4a8f-55b5-4bad-84b3-c77a538bcfb2) — 2-col feature: heading + one paragraph with a bolded phrase + one black CTA on the left; a cropped U
- [Intercom](https://mobbin.com/sites/sections/9c26abac-3024-4d9e-8948-527d49d46d12) — Abstract UI wireframe (skeleton bars, no real text) on a pale-blue card left; 4-word heading and one
- [Descript](https://mobbin.com/sites/sections/e24b2a5a-b2f9-44c6-945d-5c06d32462d2) — Dark section: icon + 3-word serif heading + one paragraph + one CTA left; app crop right showing a t

### Statement beat (Nobody reads it. / Owed reads all of it.)

A dark statement as an inset rounded card (Aboard's card variant) with two lines at 5–6vw, one italic phrase in the accent, and the five chips all visible at once (no reference cycles tags). Reveal line by line: rise + fade, no blur (Emil Kowalski: ease-out for entrances, ≤300ms). Chips at 28px, sans, near-transparent fill + hairline (chip height ≈63% of the primary button in the reference set).

- [Aboard (homepage closer)](https://mobbin.com/sites/sections/7abec472-d4cf-4019-a6b0-7f971371a740) — Black full-bleed closing section: one two-line bold sans statement, one pill button, then footer.
- [Cosmos (intro beat)](https://mobbin.com/sites/sections/5262f136-e0e1-4d69-bb6b-19673552612f) — Black full-screen section with a single one-line sentence over dim 3D flowers.
- [FLORA (CTA band)](https://mobbin.com/sites/sections/34d18078-910f-46c9-8c6d-291d5b260440) — Compact black band between sections holding one sentence and one button.
- [Nike After Dark Tour](https://mobbin.com/sites/sections/a7d81051-1ae6-44b0-8069-adebc2aff07f) — Full-screen black statement in all-caps condensed type with a colour glow.
- [Grok (xAI) mission beat](https://mobbin.com/sites/sections/30ab578c-5e08-4070-905a-146bc41a8e12) — Black full-screen with a 3-word statement split across two corners over a line starburst.
- [Varo Bank blog header](https://mobbin.com/sites/sections/789f3d78-ac9e-4336-9008-b06fc838bb87) — the closest match to 'st
- [TinyWins homepage](https://mobbin.com/sites/sections/eb379572-6bc5-4f91-8ad9-ef6a2ff09f11) — Split-corner statement in condensed caps with a row of three tiny fact lines under it.
- [Function (pricing beat)](https://mobbin.com/sites/sections/a4e3f14f-e77d-4c33-b31c-54b6c4cadf54) — Serif headline where exactly one phrase is set in italic serif and coloured for emphasis; marquee wi

### Script showcase (the words to say)

Charma's colour panel with a white card floating inside (section study, Aug 2026); the script body set in the document face (Geist 16px) per the facsimile research; the panel sits on paper as an inset card (Tailscale, Homerun, TravelPerk).

- [Figma](https://mobbin.com/sites/sections/81a9826a-afe2-41fa-b4c9-540a62865af5) — Three grounds stacked in one viewport: periwinkle feature strip, pure-black CTA band, then white sec
- [Dropbox](https://mobbin.com/sites/sections/233bd963-d5a3-48c9-b83c-5a91eda1e6c2) — Cream disclaimer section → dark-charcoal CTA band → pure-black footer
- [Clockwise](https://mobbin.com/sites/sections/631080cf-56d2-4a37-bfa0-a3c079c78eab) — White content → pale-mint CTA band → dark-green footer
- [Wise](https://mobbin.com/sites/sections/2ab68571-bb36-4ac5-ad2d-d849d92521ca) — Dark forest-green header block with lime display type, then a white section
- [Wise](https://mobbin.com/sites/sections/30aeab8b-e5a9-4677-ac01-d547a6de6dcd) — Tail of dark-green section → white 4-column photo feature row → start of faint grey strip
- [Tailscale](https://mobbin.com/sites/sections/e72d1d36-a761-4557-b655-d2797beb7abb) — Dark CTA rendered as two inset rounded cards on a white page

### Earth (twelve rule pills that fall, bounce and settle)

Copilot Money's depth-of-field pills (owner's reference) specified from the floating-objects research: three tiers (scale first, blur only on the far tier — Cosmos), a shallow heap along the bottom with the near tier never covered (Clay, Inkwell, Revolut, Daydream). Fall: Material 3 `long2` 500ms emphasized-accelerate; settle: Framer Motion default spring (stiffness 100, damping 10, mass 1); then a linear scroll slide.

- [Copilot Money (hero)](https://mobbin.com/screens/329f7238-3f47-43b7-a226-ca7186181443) — Glossy 3D category pills scattered around a centred three-line headline on a navy ground - the close
- [Cosmos (hero)](https://mobbin.com/screens/ae48f6fa-6cd5-471c-8fde-8c453de05cc3) — About thirty tilted rounded-square photo tiles scattered full-bleed around a small centred headline,
- [Revolut (mission section)](https://mobbin.com/sites/sections/481d7e3c-d983-486f-a906-e8f003e52831) — A loose pile of seven glossy 3D coins sitting below a centred headline and intro paragraph on a whit
- [Daydream (method section)](https://mobbin.com/sites/sections/b9ea8bf7-0cd1-4d5c-93e7-b6c379ab5263) — Seven pastel cards fanned in a slight arc under a headline, each rotated a little and overlapping th
- [Inkwell (hero, settled orbs)](https://mobbin.com/sites/sections/409f023a-42b3-41f6-953f-7cdec40b00a5) — Five soft-edged circular image orbs resting on the bottom edge of a full-height gradient section, li
- [Inkwell (talents section, depth bubbles)](https://mobbin.com/sites/sections/d3d530a1-2a62-4ccf-8fec-ac7f8427f6e4) — About thirteen circular portrait bubbles floating at different depths around a centred two-line sent
- [Clay (hero)](https://mobbin.com/screens/f57bf23b-4bd1-40c8-8d74-14def5382948) — Two stacks of 3D pastel toy blocks resting in the bottom-left and bottom-right corners of the hero c
- [Shop (home)](https://mobbin.com/screens/b7eb92dd-7046-4712-bacf-c337eb9cc4a7) — About twelve product cards and cut-out products scattered around a centred wordmark and search bar, 

### Materials diagram (what a repair saves)

A layered exploded view with an adjacent labelled list — T1 Energy's layered stack with its parts list, FREITAG's callout drawing with a numbered legend — drawn in the hero sprite's hand.

- [T1 Energy](https://mobbin.com/sites/sections/d768b5c8-b3a1-49c6-aff9-df1e13e4a440) — layered 3D solar-cell stack with a parts list beside it
- [FREITAG](https://mobbin.com/sites/sections/3ccd68f1-5142-422c-b972-8009dc78c366) — isometric process drawing with numbered callouts and a legend list

### Rulebook register (four figures)

Four figures in a row with vertical hairline dividers, number over a short label over a grey note.

- [Fluz](https://mobbin.com/sites/sections/2cd277b3-579b-4d9d-8a70-bc882293c9e7) — four stats in a row with vertical dividers and two-line grey notes
- [Wise](https://mobbin.com/sites/sections/7dfcd207-47ec-4cf2-9988-85371589abc4) — four figures with dividers and short labels
- [Klarna](https://mobbin.com/sites/sections/3cd1f36b-d3d2-494b-953c-a7fcd9087451) — four figures with small labels on one ground
- [Slack](https://mobbin.com/sites/sections/53c33050-78c8-43d5-ba24-92277cedeaa4) — four coloured figures with bold labels
- [Revolut](https://mobbin.com/sites/sections/b5d03099-8332-47e5-bd72-ed80d0d9756b) — stat tiles: number, label, grey note

### FAQ

Farm Minerals' two-column accordion (section study, Aug 2026): heading left, questions right, one open at a time; capped at six questions, ≤35 words each (Titan's collapsed detail).

- [Farm Minerals](https://mobbin.com/sites/sections/82a675c9-a7cd-4930-9fb2-d94fcefe242f) — two-column FAQ accordion

### Closing CTA

The green field as an inset rounded card on the page ground (Tailscale, Homerun, TravelPerk; Aboard's card variant), one filled pill and one text link.

- [Figma](https://mobbin.com/sites/sections/81a9826a-afe2-41fa-b4c9-540a62865af5) — Three grounds stacked in one viewport: periwinkle feature strip, pure-black CTA band, then white sec
- [Dropbox](https://mobbin.com/sites/sections/233bd963-d5a3-48c9-b83c-5a91eda1e6c2) — Cream disclaimer section → dark-charcoal CTA band → pure-black footer
- [Clockwise](https://mobbin.com/sites/sections/631080cf-56d2-4a37-bfa0-a3c079c78eab) — White content → pale-mint CTA band → dark-green footer
- [Wise](https://mobbin.com/sites/sections/2ab68571-bb36-4ac5-ad2d-d849d92521ca) — Dark forest-green header block with lime display type, then a white section
- [Wise](https://mobbin.com/sites/sections/30aeab8b-e5a9-4677-ac01-d547a6de6dcd) — Tail of dark-green section → white 4-column photo feature row → start of faint grey strip

### Footer

Structured's split of brand and link columns with a cropped wordmark (section study, Aug 2026), the wordmark capped after the round-1 review.

- Section study, August 2026 (Mobbin; site named above).

### Section rhythm and ground plan

One paper ground; coloured beats as inset cards; hairline seams between same-ground sections; symmetric section padding. Sixteen of sixteen reference ground changes are hard cuts — the inset-card plan avoids the switch altogether.

- [Figma](https://mobbin.com/sites/sections/81a9826a-afe2-41fa-b4c9-540a62865af5) — Three grounds stacked in one viewport: periwinkle feature strip, pure-black CTA band, then white sec
- [Dropbox](https://mobbin.com/sites/sections/233bd963-d5a3-48c9-b83c-5a91eda1e6c2) — Cream disclaimer section → dark-charcoal CTA band → pure-black footer
- [Clockwise](https://mobbin.com/sites/sections/631080cf-56d2-4a37-bfa0-a3c079c78eab) — White content → pale-mint CTA band → dark-green footer
- [Wise](https://mobbin.com/sites/sections/2ab68571-bb36-4ac5-ad2d-d849d92521ca) — Dark forest-green header block with lime display type, then a white section
- [Wise](https://mobbin.com/sites/sections/30aeab8b-e5a9-4677-ac01-d547a6de6dcd) — Tail of dark-green section → white 4-column photo feature row → start of faint grey strip
- [Tailscale](https://mobbin.com/sites/sections/e72d1d36-a761-4557-b655-d2797beb7abb) — Dark CTA rendered as two inset rounded cards on a white page
- [Homerun](https://mobbin.com/sites/sections/367ac760-ee9f-4f90-b8ae-5e75be7fd5e0) — Two stacked full-width inset cards (gradient stats card, dark-charcoal team card) on a white page
- [TravelPerk](https://mobbin.com/sites/sections/1415123f-0bb7-4803-93b7-0aa8dbc5dd8b) — Black inset CTA card between two cream sections

## App

### App shell (sidebar)

Copilot Money and ChatGPT sidebars (owner's references) specified from the shell research: 14–19% width, icon + label rows, soft-tint selected row, grouped headers with counts, pinned bottom utilities; mobile dissolves into bottom tabs and in-page collapsible groups.

As built (2 September 2026): a 272px sidebar — brand row, a full-width accent "Check something" button, a collapsible "My things" group with its count and one ≥56px row per item carrying a status dot and "N to ask" or "N long shots" ("Show N more" past six), and the utilities pinned to the foot: region select, theme toggle, Help, Sign out, the rulebook count. Under 900px the sidebar dissolves into a brand-only top bar, the shelf as an in-page collapsible group, and a bottom tab bar (My things · Check · Help) with the utilities under Help. From 1200px a third pane, `clamp(380px, 32vw, 480px)` wide, holds the selected rule or its script and opens on the top lead.

- [Copilot Money (web)](https://mobbin.com/screens/a5d06373-d04c-4d20-aefc-6f41a1bae3c1) — Sidebar + accounts + detail panel
- [Mercury (web)](https://mobbin.com/screens/c73a79d3-53e3-4a55-ab8f-51227cf36e63) — Banking shell
- [Origin (web)](https://mobbin.com/screens/1eb1f32e-30c0-4fa3-aa69-2e5aaacb70c6) — Net-worth page
- [YNAB (web)](https://mobbin.com/screens/417f3c31-1f5a-46d6-94fd-382e694ca69c) — Dark navy sidebar
- [ChatGPT (web)](https://mobbin.com/screens/eebd03db-a802-47aa-a61b-8d68a5fe78f7) — Chat shell
- [Claude (web)](https://mobbin.com/screens/7f488e21-04bc-4523-8ac5-b2038e7977fd) — Chat shell
- [Gemini (web)](https://mobbin.com/screens/cee4870c-d114-431c-8ac9-4051fc3ba8d1) — Chat shell
- [Notion AI (web)](https://mobbin.com/screens/176a7fae-1de4-4d50-a28b-cb14eef8b18b) — Chat shell

### Start screen (question 1 inline)

A question as the headline, one large input with an example placeholder, 4–6 icon chips beneath, body copy ≤2 lines.

As built: question 1 is the start screen — "What broke?" at ≥28px, one 56px input with the placeholder "e.g. Sony headphones", six category rows in two columns plus "Something else", one line of help, no Back and no Skip.

- [OpenAI Platform (web)](https://mobbin.com/screens/6134cdad-e9ac-41c3-8419-455cc17f7e83) — Empty "Chat prompts"
- [WRITER (web)](https://mobbin.com/screens/f2b6ccd0-e81b-41b4-8f8d-fa9969f74a2d) — New session
- [Wrangle (web)](https://mobbin.com/screens/81cdf5c6-e48b-4fed-afab-05fe938f5af3) — Sourcing start
- [Juicebox (web)](https://mobbin.com/screens/04fde659-d71e-4081-ae32-7996e7b5ba52) — Agent start
- [Fabric (web)](https://mobbin.com/screens/99b7f2db-c4bb-46ae-9fe8-a047a6d3b431) — New smart collection
- [Notion AI (web)](https://mobbin.com/screens/176a7fae-1de4-4d50-a28b-cb14eef8b18b) — Home
- [Alan "My coverage" (iOS)](https://mobbin.com/flows/1dd99a8e-7167-477f-b1e0-3c8bc2dd3aa7) — Coverage search start
- [Tiimo (iOS)](https://mobbin.com/screens/da18f710-765d-4312-8be3-23d9c0a25b92) — One-question onboarding

### Wizard (one question per screen)

Monzo, Monese, N26, Opal, Liven: question ≤9 words at ≥28px, full-width option rows ≥56px with the radio on the right, 'Can't remember' last, progress bar + 'Question N of 4', Continue dimmed until answered, Skip as a text link under it.

As built: four questions (What broke? · Who made it? · When did you get it? · How did you pay?), "Question N of 4" over a progress bar, full-width option rows ≥56px with the radio on the right, "Can't remember — that's fine" as the last row on both the date and the payment questions, Continue dimmed (not disabled) until question 1 has an answer, "Skip this question" as a text link on the brand question only, and the last button reading "See what you are owed". Picking a date advances by itself.

- [Monzo (iOS)](https://mobbin.com/screens/c0b40079-b472-403c-bdbd-12112553820f) — One question per screen, options in a white card with checkbox on the right, single pinned Next.
- [Monese (iOS)](https://mobbin.com/flows/8d8c40df-0e61-4d79-8ccf-ca7a1571067c) — Counted progress ('Question 5 of 5'), single-select radio rows, selected state = green check, intro 
- [N26 (iOS)](https://mobbin.com/flows/fc7b54bc-18d1-4755-94eb-e81914511561) — Vertical step checklist between question screens, then one question with radio rows.
- [Plenty of Fish (iOS)](https://mobbin.com/flows/8181f889-f1f9-40e7-ab3a-3d9a5f83aff4) — One question per screen with big outlined pill options; single-select auto-advances, multi-select sh
- [Opal (iOS)](https://mobbin.com/flows/7b6dc8e9-56e3-4db3-a898-cfdddc9b1e8a) — Question + one-line reason, 7 range options as full-width pills, Skip in the corner, Continue disabl
- [Brilliant (iOS)](https://mobbin.com/flows/7ffbd4f0-78d1-49be-bf0d-9c90cac00e8c) — Option labels written as a bold lead phrase plus a plain-language tail.
- [Liven (iOS)](https://mobbin.com/screens/40979156-6cee-4070-a387-2ba5cfedd075) — Long text made read-aloud-able: text-size control, listen toggle, numbered steps, bold key phrases.
- [UNIQLO (iOS)](https://mobbin.com/screens/a5850c1f-d709-481b-8bcd-15bf31ec0458) — Results list where status is shown three ways at once (shape icon + colour + words) and each row has

### Results (visual cards)

Status is a coloured pill with the word — no per-row bar anywhere in 20 queries; rows lead with an icon tile, carry ≤20 visible words and one labelled action; the summary is stat tiles with a proportion bar; the recommended card gets a tint and a 'Start here' label.

As built: a header with a 48px category tile and "Edit details"; a summary strip — one line ("N places to ask and M long shots"), three stat tiles each with a one-sentence key, a proportion bar; filter chips All · Strong · Worth asking · Long shots with counts; groups by source with a count, open on their first three leads, long shots folded behind "Show N long shots"; each card a 48px source tile, the title, a 14px status pill (word + glyph: filled check, half disc, empty ring), facts (Window · Date · Deadline · Ask), Details and "Get the words to say"; the top lead tinted 7% accent with a "Start here" label, never a long shot. From 1200px the card's button turns quiet and the panel carries the primary.

- [Credit Karma cards (iOS)](https://mobbin.com/screens/fd6ed637-c487-4210-8bd9-2674714fb742) — Offer card: ribbon, title, card thumbnail, facts row, promo box
- [Cleo AI Benefits (iOS)](https://mobbin.com/screens/d482b3d1-13b1-4d30-b9cc-c4690d1ee82f) — 8 benefit rows in one card
- [CVS Health visit checklist (iOS)](https://mobbin.com/screens/5367bf1b-68be-434d-825e-33fa368bfd42) — 5 stacked task cards
- [Zocdoc Well Guide (iOS)](https://mobbin.com/screens/86529650-4ea4-42ec-ad0e-a1d14a9c9fb0) — 4 checkup rows with summary
- [Superpower biomarkers (iOS)](https://mobbin.com/screens/e0abf867-3161-4008-be8e-1229e68cb175) — 14 health categories
- [Mercedes-Benz Services (iOS)](https://mobbin.com/screens/155f60ad-ee02-4383-8de4-80f7f999eeb6) — Car health list under a photo
- [Apple Health Checklist (iOS)](https://mobbin.com/screens/0420e040-cdba-419e-a764-21d85beffdd5) — "Inactive" section of cards
- [Vanta Tests (web)](https://mobbin.com/screens/7b3e98c2-b1fd-4c66-b4f4-51fbbb0a346f) — Summary tiles above a status table

## What was deliberately not copied

- Copilot Money: the blue-on-light-blue selection, dollar-amount rows, the orange 'Start here'.
- ChatGPT / Codex: 'New chat', the 'Projects / Your chats' pair, plain-text recents, the floating chat pill.
- Linear: the gradient card behind a crop; FLORA: the giant numeral over an image; Descript: blurred UI stand-ins; Intercom: abstract wireframes — Owed's crops are real product pixels.
- Kiwi's 'Top Pick' ribbon and Credit Karma's offer ribbon — Owed uses its own 'Start here' label in the accent.
