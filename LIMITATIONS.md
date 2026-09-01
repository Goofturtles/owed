# Limitations

Owed tells you who might owe you a free repair. This file is the honest account of where it is thin, where it can be wrong, and what it deliberately does not claim.

Everything below was checked against the code and the rulebook in this repo, not written from memory. Counts come from `data/coverage.json` (445 rules, `generated: 2026-08-26`). Behaviour comes from `assets/js/engine.js`, `assets/js/catalog.js`, `assets/js/store.js` and `assets/js/app.js`.

---

## 1. What is actually in the rulebook

| | Count |
|---|---|
| Rules total | 445 |
| The maker's own warranty | 29 |
| Consumer law | 19 |
| Credit card benefits | 15 |
| Class-action settlements | 5 |
| Marked `certain` (term read in a primary source) | 49 |
| Marked `likely` (verified with a caveat) | 19 |
| Brands named | 39 |
| Rules with a hard claim deadline | 3 |
| Rules with no phone number or contact link | 15 |
| Rules with no time window at all | 24 |

Region coverage, counted by rule (a rule can list more than one region):

| Region | Rules |
|---|---|
| United States | 50 |
| Canada | 14 |
| United Kingdom | 3 |
| European Union | 3 |
| Worldwide | 3 |

That table is the single most important thing on this page. Read it before the rest.

## 2. How the rulebook was bounded

The book is hand-collected. It was built by reading primary sources: the brand's own warranty page or PDF, the card issuer's benefit guide, the settlement administrator's own site, the statute text on a government domain. Aggregator blogs were used to find candidates and never used as a source.

That bound is the reason for the gaps. Things were left out on purpose when a primary source could not be reached:

- **Craftsman lifetime hand-tool warranty.** The terms sit in collapsed accordions that could not be read, and the warranty changed owner from Sears to Stanley Black & Decker. Left out rather than guessed.
- **iRobot / Roomba one-year warranty.** iRobot's own page states it, but there were 2026 references to bankruptcy proceedings. A warranty from a company in bankruptcy may not pay out, and sending someone to chase it could waste their time.
- **Nintendo Joy-Con drift free repair.** Widely reported and probably real. Nintendo's own support page for it now returns "This answer is no longer available", so there was nothing to link to.
- **Honda/Acura DENSO fuel pump settlement.** Only a proposed settlement as of April 2026, with no final approval and no claim site found. Publishing a deadline that might not exist is worse than publishing nothing.
- **Wells Fargo card benefits.** Widely reported to have none. No Wells Fargo document was found saying so, so no rule was written in either direction.
- **Washington state's repair law, Saskatchewan and New Brunswick direct-manufacturer claims.** Real, promising, not verified to primary-source level.
- **Price protection.** Verified as discontinued across Visa, Mastercard and Citi. Deliberately not built.

Whole categories were never researched: Sony, HP, Lenovo, Shark, Anker, console makers, mattress brands and bike brands. They are absent for lack of time, not for any negative finding. If your thing is one of those, Owed will look like it found nothing wrong with the world. It just did not look.

The rulebook's own research notes ship inside `data/coverage.json` under `notes`. That is the raw, longer version of this section, including the specific documents read for each batch.

## 3. Regional thinness, stated as numbers

The landing page FAQ says "the maker and card rules are broad". That sentence overstates what is in the file and should be corrected.

- There are **zero** card rules outside the US and Canada.
- There are **zero** manufacturer warranty rules scoped to the EU, and one scoped to the UK (an Apple plug adapter recall).
- The UK has **two** general rules: the 30-day right to reject, and the six-year claim window.
- The EU has **three**: the two-year legal guarantee, the Right to Repair Directive, the phone and tablet spare-parts rules.

Run through the engine, a UK user with a broken Samsung phone bought about a year ago, paid on Visa, gets exactly two results, both labelled "long shot". An EU user with a three-year-old Bosch dishwasher gets two. A US user with the same dishwasher-shaped problem gets seven or more. Owed is a US and Canada tool with a UK and EU stub attached.

The region picker also has only four values, and it is country-level. Several of the strongest US rules are state-level: California's Song-Beverly repair-replace-refund duty, the right-to-repair parts laws live in five states, the parts-pairing ban in Oregon and Colorado. A user in Texas is shown all of them as matches. The only thing stopping that from misleading them is that each rule's title starts with the state name. That is a copywriting mitigation, not a matching one.

## 4. "This rule exists" is not "you qualify"

This is the failure mode most likely to waste a real person's time.

Owed matches on five things: brand, category, country, rough age, and payment method. Real coverage rules turn on things Owed never asks: the model, the model year, the serial number, whether the item was bought new or refurbished, whether it came from an authorised seller, whether the fault is a defect or damage, and whether you can produce proof of purchase.

**At least ten rules in the book apply only to named models, model years or serial ranges** and the engine cannot check any of them:

- Apple's Mac mini (2023) no-power programme, the iPhone 14 Plus rear camera programme, the 15-inch MacBook Pro (Mid 2015) battery recall, the three-prong plug adapter recall.
- The Whirlpool fridge wire-harness settlement (side-by-side fridges made 2018 to 2021).
- The Hyundai/Kia airbag settlement and both engine settlements (specific models, specific years).
- The BMW shark-fin antenna settlement (2019 and 2020 X3, X4, X5, X6, X7).
- The Takata airbag recall.

A worked example from the actual engine: a US user with any Apple phone bought about a year ago is shown **"Apple iPhone 14 Plus rear camera service programme"** ranked **strong**. If their phone is an iPhone 12, that rule is worth nothing to them. The model restriction is written in plain words in the rule's timing note, one tap away, but the ranking on the surface says "strong" and the ranking is what people read.

The same happens with cars. A Hyundai from eight years ago returns two settlements ranked strong, whichever Hyundai it is.

There are smaller versions of the same problem everywhere:

- Card benefits exclude motor vehicles, software, consumables, used and refurbished goods, and anything bought for resale. Owed does not ask, so it does not filter.
- Nike's two-year window runs from the manufacture date printed on the tag, not from when you bought it. Owed asks when you bought it.
- Dyson starts the clock 90 days after manufacture if you have no receipt, and rejects claims on machines from unauthorised sellers, which includes most third-party Amazon listings.
- Dell's warranty length genuinely varies from 90 days to five years and is printed on your invoice. The rule uses 12 months as the common default and says so in the note.
- Nearly every rule assumes the fault is a defect. If you dropped it, most of the book does not apply and Owed will still show it to you.

Owed produces leads, not eligibility decisions. A "strong" match means the rule is strong, not that you are covered by it.

## 5. Why card benefits are the least reliable category

Card rules are the shakiest part of the book, and they are shaky in a way that cannot be fixed by better research.

**Visa and Mastercard write the standard terms. Each issuing bank decides whether to include them.** So a verified Visa Signature extended-warranty document tells you what the benefit says, not whether your Visa has it. That is why ten of the fifteen card rules are marked `likely` rather than `certain`. Amex is the exception because Amex is both network and issuer, and even Amex only covers "eligible cards".

Owed asks which network you paid with. It never asks which product you hold, and the difference between two Visa cards from two banks can be total. This is the one category where the correct instruction is "go read your own Guide to Benefits", and the app should say that louder than it does.

The ground also moved a lot between 2018 and 2024, all of it verified during research:

- Discover ended extended warranty, purchase protection and its return guarantee on 28 February 2018. Owed offers Discover as a payment option and has no Discover rules, so a Discover user sees an empty card section with no explanation. The honest answer, which the app does not currently give, is "your card dropped this in 2018, try the maker or the law instead".
- Citi cut most of these benefits on 22 September 2019, then added a 24-month extended warranty back to some cards in November 2024, and removed it from the Costco card around early 2023. Citi is close to unmodellable at network granularity.
- Capital One's QuickSilver Mastercard lost extended warranty from 1 September 2021.
- Chase dropped price and return protection in 2018 but kept purchase protection and extended warranty.
- Amex halved its extended warranty from two extra years to one for purchases made from 1 October 2020. Owed does not model that split by purchase date.

Two further honesty flags on this batch. The Citi numbers come from a mirrored copy of Citi's May 2024 guide because Citi's own link returned "item not found", so the rule is marked `likely` and points at Citi's live site rather than the mirror. The Amex US purchase-protection notice deadline of 30 days was carried across from the extended-warranty guide because that clause was garbled in the purchase-protection PDF.

Card benefits also carry short reporting deadlines that Owed shows but does not track: 60 days to call on Visa, 90 days on Chase, 45 days on Scotiabank, and 48 hours on Amex Canada's purchase protection. The 48-hour one is the most missable deadline in the entire rulebook. Nothing in the app counts down.

## 6. Settlement deadlines decay, and the decay is not automatic

Three rules carry a hard deadline: 27 August 2026, 2 November 2026, 8 April 2027. The engine hides any rule whose deadline has passed. That is the right default and it is also the whole mechanism. There is no scheduled re-check, no alert, and no per-rule freshness date. The file carries one `generated` date for all 445 rules.

Two consequences worth stating plainly:

**The BMW shark-fin settlement deadline is 27 August 2026, one day after the rulebook was compiled.** By the time anyone reads this, that rule has almost certainly vanished from every result. That is the system working. It is also a demonstration of how fast this data rots.

**The deadline is stored per rule, not per remedy, so hiding a rule can hide something still alive.** The BMW settlement has two parts: cash back for repairs you already paid for, which dies on 27 August 2026, and an extended warranty that keeps covering future leaks with no claim form at all. When the deadline passes, Owed hides both. The same shape appears in the Hyundai and Kia engine settlements, where the cash windows have closed but a 15-year, 150,000-mile free engine repair is still live and needs no paperwork. Those are the most valuable rules in the book, and the data model nearly threw them away. Remedies need their own deadlines.

Settlements that closed before compilation were dropped for the same reason: the Mitsubishi airbag settlement closed 23 May 2026, the Shimano crankset settlement on 4 August 2026.

## 7. Matching failures

**Typos do not produce an obvious failure. They produce a quieter, wrong answer.** Searched for a US phone bought nine months ago on a Visa:

- Brand `Samsung`: the Samsung one-year warranty appears.
- Brand `Sasmung`: nine matches still come back, none of them Samsung's warranty, none of them strong.

The user does not see an error. They see a shorter list that looks like a real answer. Every US user gets a floor of five or six statutory rules regardless of what they typed, so a failed brand match never bottoms out at zero. The empty-state copy, which is honest and well written, almost never fires.

**Brand matching is exact or substring.** No fuzzy matching, no aliases, no spelling correction. `Stanley` matches `stanley 1913`, which is intended. Nothing catches `Sasmung`, `Dewalt Tools`, `iphone` typed into the brand box, or a sub-brand the book does not list.

**Age is seven buckets, and one of them sits right on a cliff.** The options are roughly 3, 9, 14, 22, 34, 60 and 96 months. Most manufacturer warranties are 12 months. Someone who bought a phone eleven months ago and picks "A year or so ago" is scored at 14 months, and every one-year warranty is dropped from their results before they see it. The same person picking "About 6 months to a year" gets the warranty. A dropdown choice decides whether they claim.

**Skipped fields silently become assumptions.** No age selected becomes 14 months. No payment selected becomes "can't remember", which keeps card rules in the list at a small penalty rather than removing them. No category becomes "Something else".

**Category vocabulary is fuzzy at the edges.** Free text is mapped to a category by longest matching keyword, so "cast iron" beats "iron", but "stove" appears in the keyword lists for both big appliances and outdoor gear. The rulebook uses a `monitor` category that the app's own picker does not offer: a monitor user picks "TV or monitor", which maps to `tv`, so the Dell rule tagged `laptop, monitor` never fires for a Dell monitor. There is no `vehicle` category at all, so ten car rules are filed under "Something else".

**Statutory rules are never time-filtered.** Manufacturer, card and settlement rules disappear once you are past their window. Consumer-law rules deliberately do not, because the printed warranty running out is exactly when they matter. The side effect is a wrong result: a UK user with a fourteen-month-old phone is shown "UK: 30 days to hand it straight back for all your money", labelled long shot, with the reason "the printed warranty has run out, but this may still apply". The 30-day right to reject genuinely expires. That reason line is wrong for that rule, and it is the clearest bug in the engine.

## 8. The risk that "long shot" reads as a promise

Three labels appear on results: **strong**, **worth asking**, **long shot**. They are produced by a small scoring function, not by any model of your odds. Base score is 3 for a `certain` rule and 2 for a `likely` one, plus 2 for an exact brand hit, plus 1.5 when a card rule matches your card network, plus 1 for a settlement, minus half a point when you cannot remember how you paid. Five or more is strong, 3.2 or more is worth asking, below that is long shot. Those thresholds were tuned by hand until results looked sensible. They are not calibrated against any real claim outcomes, because there are none.

What the interface does right:

- Rules are ranked, and the top of the list is where the strongest sit.
- Every rule shows the plain-words reason it matched, so a thin reason reads as thin.
- Weaker rules past the third in a group are collapsed behind a "Show N weaker ones" button.
- Every rule shows its published source link, so the user can check the claim themselves.
- When nothing matches, the copy says so and says why, instead of inventing something.
- Scripts ask the company to confirm the deadline rather than asserting one.

What it still gets wrong:

- The results summary reads "N places worth asking" even when every one of the N is a long shot. A US user with a three-year-old blender on a debit card sees "7 places worth asking" over seven generic consumer-law entries. The headline number should count strong and worth-asking matches, not everything.
- The shelf badge and the "claims open" stat count every match, so the same generic law floor inflates both.
- Nothing in the app explains what the three labels mean. A legend belongs next to the first result.
- The words "not legal advice" appear on the landing page footer and FAQ, and nowhere inside the app. Anyone who opens the demo link directly never sees them.

## 9. There is no real account

Sign-in is a name in your browser. Stated plainly on the sign-up page, and stated again here because it has consequences beyond the demo.

- No password, no server, no verification. Any valid-looking email creates or adopts an account.
- The shelf is stored under one key for the whole browser, not per account. Sign out, sign in as someone else, and the previous person's shelf is still there. Two people sharing a laptop share a shelf.
- Signing out removes the account record and leaves the shelf behind.
- Everything lives in `localStorage`. A private window, a cleared cache, a different browser or a different device means an empty shelf. There is no sync, no backup, and no export.

The trade is deliberate and it is a real one: because there is no server, nothing about what you own ever leaves your machine. A tool that asks people to list their possessions and how they paid for them is a tempting database. This build cannot leak one, because it does not have one. That is a hackathon-appropriate choice, not production authentication, and the two should never be confused.

## 10. The landfill counter

The counter labelled "kept out of landfill" counts items on your shelf where you have marked at least one claim as won. That is it.

- It is entirely self-reported. Nothing verifies that a claim was made, let alone won.
- Any user can inflate it by clicking. There is no undo in the interface, so it only goes up.
- It counts items, not repairs, not weight, not carbon.
- The example figure on the landing page (four items, with a filled progress bar) is illustration, not data.

The counter deliberately does not convert to CO2, kilograms of e-waste, or money saved. Those numbers would have been easy to invent and impossible to defend.

One environmental claim is made in prose on the landing page: that broken electronics are the fastest-growing kind of household waste. That sentence does not carry a source link in this repo. It should, and until it does it should be read as a claim the project has not evidenced to the same standard as the rulebook.

## 11. What this project deliberately does not claim

- **No invented environmental numbers.** No CO2 figures, no tonnes diverted, no "equivalent to X trees". The only environmental number in the app is a count of items a user said they got fixed.
- **No legal advice.** Owed points at published rules and suggests words to say. It does not tell you what your rights are in your situation, and it is not written or reviewed by a lawyer.
- **No guarantee of payout.** Not one rule in the book means a company will say yes. Several mean only that a rule exists which might apply to a product like yours.
- **No claim of completeness.** 445 rules is not the world. It is what one person could verify to primary-source standard in three days.
- **No verification of your specific item.** Owed never sees your serial number, your receipt, or your card product, so it cannot confirm eligibility and never says it has.
- **No revenue.** No affiliate links, no cut of claims, no warranty upsell. Nothing in the ranking is paid for.
- **No data collection.** No analytics, no accounts on a server, no telemetry.

## 12. What would have to be true to make this production-ready

Roughly in order of how much each one matters:

1. **Per-rule provenance and freshness.** Every rule needs `checked_at`, `checked_by` and a re-check interval, replacing the single file-level date. Settlement sites and Apple programme pages publish key dates and are cheap to re-scrape on a schedule.
2. **Model, year and serial fields.** Until the data model can express "2019 to 2020 X3 only", ten of the highest-value rules will keep being shown to people they cannot help. This is the single biggest correctness fix.
3. **Per-remedy deadlines.** One settlement can hold a dead cash window and a live free-repair window. Modelling them as one date throws away the better half.
4. **State and province granularity**, plus a vehicle category, plus reconciling the app's category picker with the rulebook's vocabulary.
5. **Card product resolution.** Asking "which card product" instead of "which network", backed by a maintained issuer-and-product benefit table, or accepting that this category can only ever prompt people to read their own guide.
6. **Legal review** of the statutory rules and the claim scripts, per jurisdiction.
7. **Real accounts with server sync**, which then requires taking the privacy promise seriously: encryption, retention limits, deletion, and a policy that says what happens to a list of everything a person owns.
8. **An outcome feedback loop.** Whether a claim actually succeeded is the only thing that could calibrate the strength labels. Right now they are a hand-tuned guess.
9. **Fuzzy brand matching** with an alias table, and a visible "we did not recognise that brand" state so a typo fails loudly instead of quietly.
10. **Deadline reminders**, since the most valuable thing the tool knows is often that you have 48 hours.
11. **Operational basics**: monitoring, an offline fallback (there is no service worker, and the app needs an HTTP server because it fetches the rulebook at runtime), and accessibility and translation review for every region it claims to cover.

## 13. The maintenance burden

A hand-collected rulebook is a promise to keep reading. This is the part that does not scale on its own.

Inside this one file, all of the following change at their own pace: settlement claim deadlines; service programmes, which get retired without announcement; manufacturer warranty terms; card benefits, which changed at least six times across major issuers between 2018 and 2024; and consumer law, which has three separate live dates already sitting in the book. Colorado's parts-pairing ban started 1 January 2026. The EU Right to Repair Directive transposition deadline was 31 July 2026 and several member states had not finished, which is exactly why that rule is marked `likely`. Quebec's warranty of good working order does not begin until 5 October 2026, about six weeks after the book was written.

Every one of the 445 rules has a `source_url`, so re-verification is possible by hand. Nothing automates it. There is no diffing, no alerting when a source page changes, and no queue of rules due for re-check. A rulebook that is not re-read becomes a list of confident-sounding statements about a world that has moved on, and that is worse than no rulebook, because it costs the user a phone call to find out.

The honest summary: the depth here is real, and it is real because it was checked by hand. The same fact is the ceiling. Owed is deep, not complete, and it decays unless someone keeps reading.
