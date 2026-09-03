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
