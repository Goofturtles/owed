# Owed

Your thing broke. Owed tells you who has to fix it for free, and gives you the exact words to say when you ask.

Built solo in three days for NextStep Hacks 2026 (theme: Earth Forward). No framework, no build step, no backend.

---

## The problem, with a name on it

Your fridge is just under three years old. The ice maker stopped, then the water dispenser went. You call a repair place, they quote you a few hundred dollars for a door, and you start pricing a new fridge instead.

Here is what you did not know. Whirlpool settled a class action over exactly that fault, a wire that breaks inside the freezer door on side-by-side fridges built between 2018 and 2021. The settlement covers breakdowns from year two to year seven. It pays for a new door, or 30% to 50% of what you paid for the fridge in cash, or 35% to 75% of a repair bill you already paid. Claims close on 2 November 2026. Nobody wrote to tell you.

Type that fridge into Owed and it comes back in one screen: the settlement first, marked **strong**, with the claim form link, the phone number, the deadline, and a short script you can read down the phone. Below it, three credit cards that each add a year of extended warranty on top of the maker's, and four consumer laws that outlive the warranty card.

That is the whole product. Not advice, not a chatbot. A rulebook, a matcher, and the words to say.

**Who it helps:** anyone holding something broken who is about to assume they are out of luck. That assumption is usually made three seconds after the printed warranty date passes, and it is wrong more often than people think, because cover hides in four other places they never check.

---

## The five places cover hides

This is the insight the whole thing is built on. Coverage is not one thing that expires. It is five separate systems that overlap, and almost nobody checks more than the first.

| # | Where | Why people miss it |
|---|---|---|
| 1 | **The maker's own warranty** | People know this one, but forget lifetime warranties they already own. Lodge, Le Creuset, Darn Tough, JanSport, Osprey, Patagonia, DeWalt hand tools and Stanley drinkware are all lifetime, and all in the rulebook. |
| 2 | **The credit card you paid with** | Many cards silently add a year of extended warranty on top of the maker's. You are never told at the till. The catch is the clock: some issuers give you only 60 days from the breakdown to phone. |
| 3 | **Open class-action settlements** | Money is set aside for a specific fault on a specific model, and most of it is never claimed because nobody knows they are a class member. These have hard deadlines and then they are gone. |
| 4 | **Quiet manufacturer service programmes** | A maker knows a batch is faulty and will repair it free, out of warranty, without announcing it. Apple runs several. You have to know the programme exists to ask for it. Recalls behave the same way. |
| 5 | **Consumer law where you live** | Frequently outlasts the printed warranty. In England, Wales and NI you get six years to bring a claim against the shop (five in Scotland) — that is a window to ask, not a promise the product lasts that long. Quebec's durability rule is the strongest in North America. The EU sets a two-year floor. In the US, Magnuson-Moss means third-party parts cannot void your warranty, and if you sue over a warranty and win, they pay your lawyer. |

Owed searches all five at once and ranks what comes back.

---

## Run it

Static site. Any static file server works. It must be served over HTTP, not opened as a file, because the rulebook is loaded with `fetch()` and `file://` will fail the request.

```bash
git clone <repo-url>
cd owed
python -m http.server 8000
```

Then open <http://localhost:8000/>.

Any equivalent works:

```bash
npx serve .
php -S localhost:8000
```

There is nothing to install and nothing to build. No `package.json`, no bundler, no dependencies. Scripts are plain classic scripts, not ES modules, so a bare `python -m http.server` is enough.

The only outbound request the site makes is to Google Fonts. Everything else is local.

---

## File structure

```
owed/
├── index.html            Landing page. The pitch, the five places, how it works.
├── auth.html             Sign in / sign up. One card, two modes, no password field.
├── app.html              The app itself: shelf, four-question wizard, results, script.
├── favicon.svg           Inline SVG mark.
├── data/
│   └── coverage.json     The rulebook. 445 hand-collected rules, each with a source URL.
└── assets/
    ├── css/
    │   ├── base.css      Design tokens, palette, type scale, light and dark themes, shared elements.
    │   │                 Light is the default for everyone; dark is opt-in via the theme button
    │   │                 only, so prefers-color-scheme is deliberately not consulted.
    │   ├── landing.css   Landing page only.
    │   ├── auth.css      Auth page only.
    │   ├── app.css       Shelf, wizard, result cards, script sheet.
    │   └── motion.css    Every keyframe and transition, all behind prefers-reduced-motion.
    └── js/
        ├── theme.js      Light / dark / follow-system. Runs before paint so there is no flash.
        ├── catalog.js    Categories, brands, payment methods, regions, age buckets, and the guessers that read a typed product name.
        ├── store.js      localStorage layer: account, shelf, claim states, "seen" tracking, demo seed.
        ├── engine.js     The matcher. Filters, scores, labels, groups, and writes the claim script.
        ├── landing.js    Sticky nav, mobile menu, landing page interactions.
        ├── auth.js       Mode switching, validation, redirect into the app.
        ├── app.js        The app controller. Wizard state, rendering, claim marking.
        └── motion.js     IntersectionObserver reveals and scroll progress. Pure enhancement.
```

Three globals, no module system: `OwedCatalog`, `OwedStore`, `OwedEngine`. Load order matters and is set in each HTML file.

Asset URLs carry a `?v=` query string for cache busting.

---

## How the rule engine works

`assets/js/engine.js`, about 250 lines, no dependencies. It is a scored filter, not a model. Every output is traceable to a line in the rulebook, which is the point.

### Input

One item, one plain object:

```js
{
  name:      'Whirlpool side-by-side fridge',  // free text, used in the script
  brand:     'Whirlpool',
  category:  'appliance-large',                // an id from OwedCatalog.CATEGORIES
  ageMonths: 34,                               // from an age bucket, not an exact date
  payment:   'mastercard',                     // or 'unknown'
  region:    'US',                             // from the account, not per item
  broken:    true,
  faultNote: ''                                // optional, drops into the script verbatim
}
```

The user answers four questions: what broke, what brand, roughly when, how you paid. Region comes from the account. `catalog.js` guesses category and brand from the product name as it is typed, so "Lodge cast iron skillet" fills in both without the user picking from a list. Longest keyword wins, so "cast iron" beats "iron".

### Stage 1: hard filters

A rule is discarded outright if any of these fail. `evaluate()` returns `null`.

- **Category** must be in the rule's list. An empty list or `"*"` means unconstrained.
- **Region** must be in the rule's list. Same wildcard rule.
- **Brand** must match. Exact, or loose (a substring match in either direction, so a rule for `bosch tools` still catches an item branded `bosch`), or the rule is brand-agnostic (`"*"`). Anything else is a miss.
- **Payment** must match, where the rule cares. A rule listing `any-credit` accepts visa, mastercard, amex or discover. If the user picked "can't remember", payment resolves to `maybe` rather than failing.

### Stage 2: timing

`window_months` is compared against `ageMonths`. `999` is the sentinel for "no time limit" and the engine treats anything below 900 as a real window.

- Inside the window: `open`
- Past 80% of the window: `closing`
- Past the window: `closed`

A `closed` rule is dropped, **except** statutory rules, which survive on purpose. That is the whole argument for bucket five: the printed warranty running out is exactly when the law starts mattering.

Separately, any rule whose `deadline` is in the past is dropped unconditionally. Expired settlements never surface.

### Stage 3: scoring

| Signal | Effect |
|---|---|
| `confidence: certain` | base 3 |
| `confidence: likely` | base 2 |
| `confidence: possible` | base 1 |
| Brand matched exactly | +2 |
| Brand matched loosely | +1 |
| Rule names a specific payment method and it matched | +1.5 |
| Payment unknown | −0.5 |
| Window past 80% | −0.5 |
| `source_type: settlement` | +1 (real money, and it expires) |
| `source_type: program` | +0.5 |

Maximum reachable score is 7.5. Results sort by score, descending.

### Strength labels

The number is internal. The user sees a word.

| Score | Label |
|---|---|
| ≥ 5 | **strong** |
| ≥ 3.2 | **worth asking** |
| below | **long shot** |

Each match also carries a reason assembled from the signals that actually fired, in plain words: "it is a Whirlpool item and you are still inside the window". No match is shown without one.

### Grouping and the script

Matches are grouped by `source_type` in a fixed order (settlement, program, card, manufacturer, statutory, retailer) with human labels, so "Money set aside for this fault" sits above "Your legal cover".

`script()` builds a short call script: an opening line naming the specific rule, what you bought and when and how you paid, the rule's own `script_hint`, and a closing question asking what they need and what the deadline is. Deliberately four short paragraphs. A long script does not get read out loud.

Alongside it the app shows the contact, the deadline, the claiming steps, and a link to the published source so you can read the rule yourself.

### Worked example, verified against the shipped rulebook

Input: `Whirlpool`, `appliance-large`, 34 months, `mastercard`, `US`.

Output: 11 matches.

```
[strong]        6.00  settlement    Whirlpool broken-wire fridge settlement
[worth asking]  4.50  card          Chase extended warranty protection (US)
[worth asking]  3.50  card          Mastercard extended warranty (US)
[worth asking]  3.50  card          Citi extended warranty (US)
...
```

The settlement scores 6.00: base 3 for `certain`, +2 for the exact brand, +1 for being a settlement. Grouped as "Money set aside for this fault" and "Cover from the card you paid with".

Change the item to a Sony product 14 months old and the maker's warranty vanishes from the results, because the window closed and it is not statutory. Three card rules and four consumer-law rules remain. That is the engine doing the thing the product exists to do.

---

## The rulebook

`data/coverage.json`. One version field, one generated date, one flat array of rules. Flat on purpose: the engine walks all 445 rules on every match, which at this size is instant and keeps the file readable by a human.

```json
{
  "version": 1,
  "generated": "2026-08-26",
  "rules": [ ... ]
}
```

### A real rule, copied from the file

```json
{
  "id": "whirlpool-fridge-wire-harness-settlement",
  "source_type": "settlement",
  "title": "Whirlpool broken-wire fridge settlement (Whirlpool, Maytag, KitchenAid, JennAir)",
  "applies_to": {
    "brands": ["whirlpool", "maytag", "kitchenaid", "jennair"],
    "categories": ["appliance-large", "kitchen"],
    "regions": ["US"],
    "payment_methods": ["*"]
  },
  "window_months": 84,
  "window_note": "Covers side-by-side fridges made by Whirlpool from 2018 to 2021, for breakdowns from year 2 up to year 7 after you bought it. If it already broke, you must file by 2 November 2026. If it breaks after 5 May 2026, you instead have 90 days from the day you notice it.",
  "what_you_get": "A free new freezer door (with free labour in the earlier years), or cash instead: 30% to 50% of what you paid for the fridge. If you already paid someone to fix it, you get 35% to 75% of that repair bill back. If you gave up and bought a new fridge, you get 25% to 50% of the old one's price back.",
  "confidence": "certain",
  "how_to_claim": "Find the model and serial number inside your fridge, then fill in the claim form at RefrigeratorSettlement.com before 2 November 2026. If it breaks after 5 May 2026, phone Whirlpool on 1-844-667-2929 within 90 days instead of filing.",
  "contact": "1-844-667-2929",
  "script_hint": "My side-by-side fridge has the broken wire problem in the freezer door, the ice maker and water dispenser stopped working. I am a class member in the Costa v. Whirlpool settlement and I want the free replacement door.",
  "source_url": "https://www.refrigeratorsettlement.com/",
  "deadline": "2026-11-02"
}
```

### Field reference

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique, kebab-case. Used as the key for claim state, so never reuse or rename one after release. |
| `source_type` | enum | `manufacturer`, `card`, `settlement`, `statutory`, `program`, `retailer`. Drives grouping and part of the score. |
| `title` | string | Shown as the card heading and used in the script's opening line. |
| `applies_to.brands` | string[] | Lowercase. `["*"]` for brand-agnostic rules such as card benefits. |
| `applies_to.categories` | string[] | Category ids from `catalog.js`. `["*"]` for anything. |
| `applies_to.regions` | string[] | `US`, `CA`, `UK`, `EU`, or `["*"]`. |
| `applies_to.payment_methods` | string[] | `visa`, `mastercard`, `amex`, `discover`, `debit`, `cash`, the alias `any-credit`, or `["*"]`. |
| `window_months` | number | How long the cover lasts. Use `999` for no time limit, including lifetime warranties. |
| `window_note` | string | Plain-words explanation of the window, including any secondary clocks. |
| `what_you_get` | string | The actual remedy. Be concrete: door, cash, percentage, cap. |
| `confidence` | enum | `certain`, `likely`, `possible`. Sets the base score. |
| `how_to_claim` | string | The steps, in order, with the real URL or number. |
| `contact` | string | Phone number or URL. Rendered as a link when it is a URL. |
| `script_hint` | string | One sentence dropped into the middle of the generated script. Write it as the user would say it. |
| `source_url` | string | The published source. Required in practice. A rule without one renders a warning telling the user to treat it as a lead, not a promise. |
| `deadline` | string | ISO date, or `""`. A past date removes the rule from all results. |

Two notes an engineer will spot. `confidence: "possible"` is supported by the engine but unused by the current corpus, which is all `certain` or `likely`. The `program` and `retailer` source types are likewise implemented, scored and labelled but hold zero rules today: the seven service-programme and recall rules in the corpus are currently filed under `manufacturer` (Apple's programmes) or `statutory` (CPSC and vehicle recalls). Both are live extension points, not dead code, but the README should not claim the data uses them.

---

## How to add a rule

1. Find the rule at its **published source**. A news article about a settlement is not the source; the settlement administrator's site is. If there is no citable page, do not add it.
2. Append an object to `rules` in `data/coverage.json`. Copy the shape above.
3. Give it an `id` nothing else uses.
4. Set `window_months` honestly. Use `999` only when there genuinely is no clock.
5. Write `what_you_get` as a concrete remedy, not a category. "A free replacement door, or 30% to 50% of the purchase price in cash" beats "compensation".
6. Write `script_hint` in the first person, the way a person would say it on a call.
7. Set `confidence`. `certain` means you read it on the official page and it says exactly this. `likely` means it is the general policy but varies by issuer, model or state. Card benefits are usually `likely`, because issuers cut them at different times.
8. Set `deadline` for anything with a filing cut-off. The engine hides it automatically once the date passes.
9. Reload. There is no build step and no index to regenerate.

Sanity check with the engine directly:

```bash
node -e "
global.window = global;
require('./assets/js/engine.js');
OwedEngine.setRules(require('./data/coverage.json').rules);
console.log(OwedEngine.match({
  brand: 'Whirlpool', category: 'appliance-large',
  ageMonths: 34, payment: 'mastercard', region: 'US'
}).map(m => m.strength + ' ' + m.score + ' ' + m.rule.title));
"
```

The engine is written to run in Node with only a `global.window` shim, which makes rules testable without a browser.

---

## What is in the rulebook today

445 rules, every one with a source URL.

| By where the cover comes from | Count |
|---|---|
| Manufacturer warranties, service programmes and recalls | 29 |
| Consumer law | 19 |
| Credit card benefits | 15 |
| Class-action settlements | 5 |

| By region (rules list more than one, so these overlap) | Count |
|---|---|
| United States | 50 |
| Canada | 14 |
| United Kingdom | 3 |
| European Union | 3 |
| Region-agnostic | 3 |

Confidence: 49 `certain`, 19 `likely`. Three rules carry a hard filing deadline. Seven are service programmes or recalls.

---

## Privacy model

There is no server. There is no analytics, no tracking, no telemetry, and no network request other than Google Fonts.

Everything lives in `localStorage` under four keys:

| Key | Holds |
|---|---|
| `owed:user` | Name, email, region, created timestamp. |
| `owed:shelf` | Your items and their claim states. |
| `owed:seen` | Which rule ids have been shown for each item, so new ones can be flagged later. |
| `owed:theme` | `light` or `dark`. Light is the default for every visitor — the site deliberately does not follow `prefers-color-scheme`, so dark is only ever an explicit choice made with the theme button. |

**Passwords are never collected or stored.** There is no password field. The email is a label on your shelf and nothing is ever sent to it. What you own never leaves your browser, because there is nowhere for it to go.

The re-match loop uses `owed:seen`: when the rulebook grows, an item's fresh match list is compared against the ids it was last shown, and anything new is flagged. That is the reason to come back, and it costs nothing in privacy because the comparison happens locally.

---

## Honest limitations

Stated plainly, because a tool about fine print should not have any.

- **The rulebook is hand-collected, so it is deep rather than complete.** 445 rules is a real corpus, not a stub, but it is not the world. Unusual brands or models can return nothing. When that happens the app says so plainly and keeps the item on your shelf for re-matching. It does not invent a match to fill the screen.
- **Coverage is strongest for the US and Canada.** UK and EU rules are present but thin. A UK user with an unusual item will often see only the two or three statutory rules.
- **This is an information tool, not legal advice.** Every rule links to its published source so you can read it yourself and decide.
- **Card benefits changed a lot between 2018 and 2025.** Many issuers removed extended warranty entirely. A card rule is a prompt to check your own benefit guide, not a guarantee that your specific card still has it. This is why almost all card rules are marked `likely` rather than `certain`.
- **Settlement deadlines pass.** The engine hides a rule the moment its `deadline` is in the past, which is correct behaviour but means the rulebook needs maintaining. An unmaintained copy of this repo slowly loses its most valuable bucket.
- **There is no server, so there is no real authentication.** The account is a name in your browser. Signing in on a different browser gives you a different empty shelf. That is a deliberate privacy choice for a three-day build, not production auth, and it should not be mistaken for one.
- **Matching uses the brand and category you type.** A typo, an unusual product name, or a sub-brand the catalog does not know can miss. The brand guesser helps but it is keyword matching, not search.
- **Age is a bucket, not a date.** "About three years ago" becomes 34 months. Near a window boundary that approximation can be wrong in either direction, which is part of why rules in the last 20% of their window are labelled as closing rather than open.

---

## The Earth Forward angle

Electronics and appliances are among the fastest-growing streams of household waste. Plenty of what goes out has one fixable fault, and in a real share of those cases somebody was contractually or legally required to fix it for free. The barrier is not the repair. The barrier is that finding out who owes you is tedious, scattered across five systems, and written in language designed to be skimmed past.

Owed makes the free repair the easy option by removing the research step.

**On the counter, deliberately:** the app shows "kept out of landfill" and it only counts items where you marked a claim as actually won. It is a count of outcomes you confirmed. There is no CO2 estimate and no invented multiplier, because a made-up number would undercut the one honest thing the app measures.

---

## Built during the hackathon vs brought in

**Built during the three days:** all of it, apart from the two lines below. Every HTML file, every stylesheet, the design system, the motion layer, the rule engine, the local store, the catalog and its guessers, the auth flow, the app controller, and all 445 rules in `coverage.json`.

**Libraries: none.** No framework, no bundler, no CSS library, no polyfills, no `node_modules`. There is no `package.json` because there is nothing to install. Everything is vanilla HTML, CSS and ES5-compatible JavaScript in IIFEs.

**Weight.** An initial visit is 9 requests and 119KB uncompressed — 36KB gzipped. The two generated clips and both product screenshots (617KB together) load only when you scroll to them, and there are no poster frames, so none of it is fetched up front.

**3D: no library.** The scroll flythrough in `assets/js/scene.js` is raw WebGL, about 8KB. A library would have cost ~600KB — more than the entire rest of the site — and added a second external origin, so the scene is hand-written: one quad, a procedurally drawn page of fine print, and a camera driven by scroll position. If WebGL is missing or the context is lost, a static fallback takes over.

**Video: generated locally.** The two ambient clips were produced on the author's own GPU with ComfyUI + LTX-Video — no API, no cloud, no per-second billing. `tools/generate_video.py` regenerates them from the prompts in the repo. They are deliberately abstract (ink in water, drifting particles): generated footage of objects or people reads as fake immediately, while fluid and particle motion is both what the model is good at and what Owed is about. Neither clip is fetched until you scroll to it — there are no poster images either, so an initial visit downloads none of it — and `prefers-reduced-motion` removes the `src` outright so they are never downloaded at all.

**Fonts: Google Fonts.** Instrument Serif for display headlines (with a real italic, used for the emphasised phrase), Instrument Sans for UI and body, IBM Plex Mono for the fine-print voice (claim scripts, metadata). This is the only external request the site makes.

**Data: hand-collected from public sources.** Every rule in the rulebook was read from a manufacturer warranty page, an issuer benefit guide PDF, a settlement administrator's site, or a government or statutory source, and every rule carries the `source_url` it came from. Nothing was generated, and nothing was copied from another dataset. This was the slowest part of the build by a wide margin and it is the part that makes the rest worth using.

**Accessibility and motion:** every animation lives in `motion.css` and `motion.js` behind `prefers-reduced-motion`. With motion reduced, the reveal system is skipped entirely, the auth card redirects without its transition, and every page is fully readable and usable. `motion.js` is pure progressive enhancement: if it never runs, nothing breaks.

**Themes:** light and dark, plus follow-system. `theme.js` applies the stored choice before the body paints, so there is no flash of the wrong theme.
