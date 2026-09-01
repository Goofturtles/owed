# Owed

**Your thing broke. Owed tells you who has to fix it for free, and gives you the exact words to say when you ask.**

## Inspiration

Fourteen months after the headphones were bought, they stopped charging. The one-year warranty had ended two months earlier. A replacement pair was already sitting in a cart, and that would have been the end of it. Nothing about the old ones was unfixable. They just looked unfixable, because the warranty had run out.

The card they were paid for with quietly adds a second year of warranty on top of the maker's. One call, and they got repaired. Nothing went in the bin. Nothing new got bought.

The cover was never hidden. It was published. It was just published somewhere nobody reads.

Here is a fact anyone can check. In the US, 15 U.S.C. 2302(c) makes it illegal for a company to tie your warranty to their own parts or their own repair shop. The "warranty void if this sticker is removed" sticker has no legal force, and in 2018 the FTC sent warning letters to companies for using it. Most people who see that sticker stop right there, and then buy a new one.

Owed is for the person standing over something that just broke, who has no idea that a warranty, a credit card benefit, an open settlement, a quiet repair programme, or the law where they live already covers it. That is most people, most of the time.

I am in high school. I built this alone in three days for NextStep Hacks 2026.

## What it does

You answer four questions: what broke, what brand, roughly when you bought it, and how you paid.

Owed runs that against a hand-collected rulebook of real coverage rules and returns everyone who might owe you a free repair, a replacement, a refund, or a payout. Every match is ranked **strong**, **worth asking**, or **long shot**, and carries a plain-words reason it matched, like "it is a Dyson item and you are still inside the window."

Pick a match and you get a short claim script you can read out loud. It names the specific rule, because naming the rule is what stops the "sorry, out of warranty" reply. You also get the contact, the deadline, and a link to the published source so you can read the rule yourself before you call.

Cover hides in five places, and the rulebook covers all five:

1. The maker's own warranty, including the lifetime warranties people forget they have.
2. The credit card you paid with, which often silently adds a year of extended warranty.
3. Open class-action settlements, where money is set aside and mostly goes unclaimed.
4. Quiet manufacturer service programmes that repair a known fault free, out of warranty, without announcing it.
5. Consumer law where you live, which regularly outlasts the printed warranty.

Version 1 of the rulebook holds 445 rules: 176 manufacturer warranties, 130 statutory rules, 67 card benefits, 18 settlements, 18 retailer policies and 3 service programmes. All 445 link to the page they came from. Every rule carries a confidence value, and 54 are marked "likely" rather than "certain" because I could only confirm them from a secondary source. The app shows that instead of hiding it.

Your shelf saves what you own. When the rulebook grows, everything on the shelf is re-checked and new matches are flagged as new. A counter tracks items kept out of landfill, and it only moves when you mark a claim actually won.

## How this fits Earth Forward

Broken electronics are the fastest-growing household waste stream, and a lot of that gear dies over a fixable fault while somebody was contractually required to fix it for nothing. The cheapest repair in the world is the one somebody else already agreed to pay for. Owed's job is to make that repair the easy option instead of the obscure one. Regulators have already done the hard part: the EU now requires phone and tablet spare parts to stay on sale for seven years after a model stops being sold, plus at least five years of operating system updates. Rules like that only reduce waste if the person holding the broken thing knows they exist. That gap is where Owed sits. It is also why the landfill counter only counts confirmed wins. An invented CO2 figure would have looked better on the page and meant nothing.

## What it does not do

Saying this plainly is part of the design.

- The rulebook is hand-collected, so it is deep rather than complete. Unusual brands and models return nothing, and the app says "nothing matched this one" rather than inventing a match.
- Coverage is strongest for the US and Canada. UK and EU rules are in there but thinner.
- This is an information tool, not legal advice. Every rule links to its published source so you can check it.
- Card benefits changed a lot between 2018 and 2025, and many issuers dropped extended warranty entirely. A card match is a prompt to open your own benefits guide, not a promise.
- Settlement deadlines pass. A rule with an expired deadline hides itself, but the rulebook needs maintaining.
- There is no server, so there is no real authentication. The account is a name in your browser. That is a deliberate privacy choice for a hackathon build, not production auth. Nothing about what you own leaves the browser.
- Matching uses the brand and category you type. A typo or an unusual product name can miss.

## How we built it

No framework, no build step, no backend. Three pages: a landing page, a sign-in page, and the app. About 1,900 lines of plain JavaScript, and the only external request on the whole site is Google Fonts.

- `data/coverage.json` is the rulebook. One schema for four very different kinds of rule. Each rule has an `applies_to` block (brands, categories, regions, payment methods, with `*` as a wildcard), a window in months, what you actually get, how to claim, a contact, a source URL, a confidence value, and a script hint.
- `engine.js` is the matcher. It hard-filters first: wrong category, wrong region, wrong payment method, an expired deadline, or a closed window on a non-statutory rule, and the rule is gone. What survives gets scored. Confidence is worth 3, 2 or 1. An exact brand match adds 2, a loose one adds 1. A rule that specifically matches how you paid adds 1.5. A window more than 80 percent used loses half a point. Settlements get a bump because the money is real and time-limited. Above 5 is "strong", above 3.2 is "worth asking", the rest are "long shot".
- The reason string is built from the same facts the score was built from, so the explanation cannot drift away from the ranking.
- `store.js` is localStorage: user, shelf, and a seen-rules set per item so a re-check can tell you what is genuinely new.
- The motion layer is CSS animation plus IntersectionObserver, with a full `prefers-reduced-motion` branch in every stylesheet and a `matchMedia` check in the JavaScript.
- Warm paper grounds with warm near-black ink and one green that reads as money coming back, plus a soft mint pill for anything you press. Instrument Serif carries the display headlines (real italic, not a synthetic slant), Instrument Sans the UI, IBM Plex Mono the fine-print voice. Light is the default for every visitor; dark is an explicit choice, and each theme ships its own product screenshot.
- The landing page opens into a scroll-driven WebGL flythrough of the paperwork: a corridor of pages of fine print the camera travels down, until the one clause that means a free repair lights up. It is raw WebGL in about 8KB — no Three.js — because a 600KB library would have outweighed the entire rest of the site.
- A black interlude sits mid-page: one headline hands over to the next word by word as you scroll, while the five places cover hides name themselves one at a time underneath. Scrolling down plays it through over about four and a half seconds — paced so the words can be read on the way past; scrolling up releases it at any point. The ambient clip behind the closing call to action was generated on a local RTX 4090 with ComfyUI + LTX-Video rather than bought from an API; `tools/generate_video.py` reproduces it from the prompt committed in the repo.
- An initial visit is 11 requests and 148KB uncompressed (45KB gzipped). Everything heavy is deferred: the ambient clip and both product screenshots load only when you scroll to them, and there are no poster images, so an initial load fetches none of it. The video, the 3D and the product screenshots are all lazy, and every one of them is switched off entirely under `prefers-reduced-motion` — which also collapses the pinned scroll sections back to normal page flow instead of leaving empty scroll traps.
- The landing page's centrepiece is the product's actual job rendered literally: a wall of the small print nobody finishes, with the single clause that means a free repair lit up and lifted out as a verdict beside it. It cycles three real examples drawn from `data/coverage.json` — a UK six-year retailer liability, a card's extra year of extended warranty, and Quebec's legal guarantee on appliances.

The research took longer than the code. Rules were read off primary or issuer-published documents: Apple's warranty pages, Visa's benefit PDFs, American Express benefit guides, settlement administrator sites, legislation.gov.uk, Cornell LII for the US code, leginfo.legislature.ca.gov, BC Laws, Educaloi for Quebec, and the EU's Your Europe portal.

## Challenges we ran into

**Real rules are prose, not data.** "Lifetime" is not a number of months. A settlement can have a cash deadline that has already passed and a warranty extension that has not. The Hyundai and Kia engine settlements are exactly that: the money window closed, the free-repair window runs fifteen years. The schema had to carry that instead of flattening it into one date.

**Knowing when to drop a rule.** Craftsman's lifetime hand-tool warranty is famous and probably still real, but the terms live inside collapsed accordions I could not extract, and the warranty changed hands from Sears to Stanley Black & Decker. Cut. The Joy-Con drift free-repair policy is all over the internet, but Nintendo's own support answer page now returns "This answer is no longer available." Cut. iRobot's one-year warranty is on iRobot's own pages, but a warranty from a company in bankruptcy proceedings may not pay out, and sending someone to spend an afternoon on it is worse than saying nothing. Cut. Every one of those was a rule I wanted, and leaving them out made the product better.

**Card benefits are a minefield.** Discover ended extended warranty and purchase protection on 28 February 2018. American Express halved its extended warranty from two extra years to one for purchases made from 1 October 2020. Citi cut its benefits in 2019 and added a 24-month extended warranty back to some cards in November 2024. Visa and Mastercard write the standard terms, but each bank decides whether to include them at all. So a card rule cannot promise anything. It has to send you to your own guide, and that had to be true in the visible copy, not buried in a footnote.

**Scoring with no training data.** There is no labelled dataset of correct coverage matches. I tuned the weights and both thresholds by hand against test items where I already knew the right answer, watching for the one failure I cared about most: a "strong" badge on something that was not strong.

**Writing a UI that admits it does not know.** A confident app is much easier to design. Making an empty state, a "long shot" label and a "likely" confidence tag feel useful instead of broken took more passes than the results page did.

## Accomplishments that we're proud of

- Zero matches says zero. The empty state does not pad itself with vaguely relevant rules to look busy.
- All 445 rules link to their source. If Owed is wrong, you can catch it in one click.
- Blank fields stayed blank. Two rules have no contact number, because I never saw one on a page I trusted and would not paste one from memory.
- The scripts are short. A long script does not get read out loud, so they run about four sentences and end by asking for the deadline.
- Rules police their own deadlines. One settlement in the book had a claim deadline one day after I wrote it, and it removes itself when that date passes.
- Nothing about what you own leaves the browser, and there is nothing for it to leave to.
- Three days, alone, no framework, no dependencies, and a rulebook I would actually use myself.

## What we learned

Most of this was new ground for me.

**Writing a scoring engine instead of a filter.** Everything I had built before answered yes or no. This one had to answer "how likely", rank the results, and be honest about the ranking. The shape I learned: hard-filter the impossible first, score only the survivors, then map the score to words a person understands. And the score has to be built out of facts you can also print as a sentence, or the badge and the explanation drift apart and people catch you.

**Modelling messy reality as data.** Designing one schema that fits an Apple warranty, an Amex benefit guide, a class-action settlement and Quebec's civil code without lying about any of them. I got parts of it wrong and had to live with it: the category list has no "vehicle", so six car rules sit under "other". That was a day-one data decision I could not cleanly undo on day three, which is its own lesson about how fast a schema hardens.

**Designing for honest uncertainty.** Confidence ended up as a field in the data and a visible label in the interface, not a comment in the source. Once uncertainty is a first-class value, everything downstream changes: the sort order, the badges, the copy, the empty state. I now think an app that cannot say "I do not know" is not finished.

**prefers-reduced-motion as a constraint, not a cleanup.** I had used that media query before as a few lines at the bottom of a stylesheet. Here both branches were written from the start, and I hit the trap: when reveal animations are driven by IntersectionObserver, a CSS-only reduced-motion rule is not enough, because elements start hidden in JavaScript and the observer may never fire. The script has to check `matchMedia` itself and render everything visible up front.

**Reading primary sources.** Statutes, warranty PDFs and benefit guides instead of articles about them. On one settlement, aggregator sites disagreed about the claim deadline by ten days. The administrator's own site printed one date in four separate places. Going to the source was the only way to settle it, and it is a habit now.

## What's next for Owed

- Add a real "vehicle" category and re-tag the six car rules currently filed under "other". Car rules carry the biggest money in the book.
- Thicken UK, EU and Canadian coverage. The statutory layer there is strong and the rulebook barely uses it yet.
- Freshness. Every rule stores its source URL, so a scheduled re-check against those pages is the obvious next build. Settlement sites publish key-dates pages that are cheap to re-read.
- Community submissions with a mandatory source link, held behind review. The rulebook only scales if other people can add to it, and it only stays trustworthy if the link is required.
- A retailer layer. The engine already has a bucket for shop-level return and repair policies, and it is empty.
- A "they said no" path that suggests the next-strongest rule to name when the first claim gets refused.

## Built With

html, css, javascript, json, localstorage, fetch, intersection-observer, css-animations, css-custom-properties, svg, google-fonts, vanilla-js

No framework, no build step, no backend, no dependencies.
