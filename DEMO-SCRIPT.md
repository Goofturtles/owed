# Owed — 3 minute demo script

Shot-by-shot. Every number and label below was checked against the real app and the real rulebook (445 rules, `data/coverage.json`), so what you say matches what appears on screen.

**Runtime:** 3:00. **Rule of the edit:** judges often stop at 90 seconds. By 1:30 they must have seen the problem, a real result, and the claim script. Everything after 1:30 is for the ones who stay.

---

## At a glance

| Time | Beat | What it proves |
|---|---|---|
| 0:00–0:20 | The broken thing | The problem, and who it happens to |
| 0:20–0:33 | Five places cover hides | The insight nobody else checks |
| 0:33–0:45 | Four questions, live | It's real and it's fast |
| 0:45–1:12 | Sony result: the card added a year | The core payoff |
| 1:12–1:32 | The words to say | The bit that makes people act |
| 1:32–1:52 | Lodge: the warranty you forgot | It finds wins you'd never look for |
| 1:52–2:10 | The shelf | Why you come back |
| 2:10–2:28 | Kept out of landfill | Earth Forward, no preaching |
| 2:28–2:48 | Where it's weak | Honesty, on screen, live |
| 2:48–3:00 | Close | Built solo in three days |

---

## Before you record

**Running the site**

- Start a local server in the `owed` folder. The app fetches `data/coverage.json`, so `file://` will not work.
  `python -m http.server 3510` then open `http://localhost:3510/`.
- Load every page once before you record, so fonts are cached and nothing pops in.

**Tabs to have open**

1. `http://localhost:3510/` — the landing page, scrolled to the top.
2. `http://localhost:3510/app.html?demo=1` — the four-item demo shelf. Open it once so it seeds, then leave it. It seeds Sony WH-1000XM4, Whirlpool, DeWalt and Lodge, and it opens on the **Lodge skillet** first.
3. Optional B-roll: `http://localhost:3510/data/coverage.json` for a two-second shot of the sourcing notes.

**Browser state**

- Clear site data for `localhost:3510` before Clip A. The landing → sign-up → wizard hand-off only looks clean on a fresh browser.
- Pick a theme and leave it. The button in the top bar cycles system → light → dark. Light reads better on a projector.
- Window at 1280×800 or 1440×900, zoom at 100%, bookmarks bar hidden, notifications off, no extension icons.

**Two-minute fixes worth doing first** (the claim script is your hero shot, and these are visible in it)

- In `assets/js/engine.js`, the script line reads *"I bought Sony headphones about about 1 year ago"* — the word "about" is added twice.
- Same file: the rule name gets lower-cased in the first line, so it reads *"the visa Signature / Visa Infinite extended warranty"*.
- In `assets/js/store.js`, the demo item named "Whirlpool dishwasher" matches a settlement whose title says **fridge**. Renaming the seed item to "Whirlpool fridge" makes that shot honest. Same category, same result count.

**Optional, 60 seconds of prep, worth it:** to show the "new rule landed" pill on the shelf, open the console on the demo shelf and run:

```js
const seen = JSON.parse(localStorage.getItem('owed:seen'));
Object.keys(seen).forEach(id => seen[id] = seen[id].slice(1));
localStorage.setItem('owed:seen', JSON.stringify(seen));
```

Reload. Items now carry a green "1 new" pill and a toast fires. The mechanism is real — this just simulates the rulebook having grown since your last visit.

**Record it as two clips.** Clip A is the landing page through the claim script (0:00–1:32). Clip B is the demo shelf (1:32–3:00). Cut between them on the line "Here's a shelf with a few things on it."

---

## The script

### 0:00–0:08 — Cold open

**Screen:** Landing hero, then let it settle into the fine-print panel just below the fold. The wall of small print is greyed out, one clause lights up mint, and the verdict card resolves beside it — Sony WH-1000XM4, two years old, UK: free repair from the shop. Wait for one full cycle (about four seconds) before scrolling on.

**Say:** "Your headphones stop charging. They're fourteen months old. The warranty was twelve, so you buy a new pair and these go in a drawer, then a bin."

---

### 0:08–0:20 — What it is, and who it's for

**Screen:** Slow scroll so the headline "Somebody already owes you a free repair." is centred.

**Say:** "Except the card you paid with quietly added a year to that warranty, and nobody told you. Owed finds everyone who still has to fix your thing for free, and writes the words to say when you ask."

**Watch:** This has to be done by 0:20. Practise it until it's tight.

---

### 0:20–0:33 — Five places cover hides

**Screen:** Scroll to "Five places cover hides". Let the five cards pass. Don't stop on each.

**Say:** "Cover hides in five places. The maker's warranty. The card you paid with. Payouts from settlements that mostly go unclaimed. Quiet repair programmes for known faults. And the law where you live. Nobody checks all five."

---

### 0:33–0:45 — Four questions, live

**Screen:** Back to the top. Type `Sony headphones` into the hero box, hit **Check it**, click **Check my headphones**, fill the sign-up (name, email, region stays United States), **Create account**. The wizard opens with the item and brand already filled. Click **Continue**, **Continue**, pick **A year or so ago**, pick **Visa credit card**, press **See what you are owed**.

**Say:** "So: my headphones. It reads the brand and the category from what I typed. Roughly when I bought it. How I paid. Four questions, no receipt, no model number."

**Watch:** Picking the age auto-advances to the payment step. Don't click twice. Real demo is now on screen at about 0:45.

---

### 0:45–1:12 — The result

**Screen:** Results view. Summary reads "7 places worth asking." Groups: "Cover from the card you paid with" (3), "Your legal cover" (4). Expand **Visa Signature / Visa Infinite extended warranty (US)**.

**Say:** "Seven places worth asking, ordered by how likely they are to say yes. The maker's year is gone. But I paid with a Visa card, so three card benefits come back — and this one adds a whole year on top of the maker's warranty. Read the timing: once it breaks you get sixty days to phone and ninety to send the paperwork. That deadline is what kills most of these claims."

**Watch:** The pill says **worth asking**, not strong. That's deliberate — say so: "It doesn't promise. Whether your particular Visa carries this depends on your bank, so Owed tells you to check, not that you're covered."

---

### 1:12–1:32 — The words to say

**Screen:** Click **Get the words to say**. Script view. Scroll so "Who to contact", "Before you call" and "Read it yourself" are visible.

**Say:** "This is the part that actually matters. Knowing you're covered isn't the hard bit. Phoning is. So it writes the call for you, with the rule named out loud, and a question about the deadline. There's the number. And there's Visa's own document, so you can read the rule yourself."

**Watch:** Hover the source link so judges see it's a real usa.visa.com PDF, not a made-up citation.

---

### 1:32–1:52 — The warranty you forgot you had

**Screen:** Cut to Clip B — the demo shelf. Click the **Lodge cast iron skillet**. Result: "6 places worth asking, 1 of them strong". Expand **Lodge cast iron lifetime warranty**, then click **Mark as won**.

**Say:** "Here's a shelf with a few things on it. This cast iron pan is five years old, bought with cash. No card, no receipt, nothing to claim under. Except Lodge guarantees it for life. That one's marked strong, because it's the maker's own published promise — and it's the kind of thing you'd never think to look up."

**Watch:** The toast fires and the "kept out of landfill" number ticks to 1. Leave it on screen.

---

### 1:52–2:10 — The shelf, and why you come back

**Screen:** Whole shelf visible with the pills. Click the Whirlpool item and point at the settlement card in "Money set aside for this fault" — "Claim by 2026-11-02".

**Say:** "Everything you check stays on the shelf. The rulebook grows — a payout opens, a repair programme appears — and everything on the shelf gets checked again. This one's a payout that closes on the second of November. That's the kind of thing you find too late, or never."

---

### 2:10–2:28 — Why it matters beyond the money

**Screen:** Back on the shelf, the three counters visible: things, claims open, kept out of landfill.

**Say:** "When a claim actually works, I mark it won, and that's the only number this counts. Not an invented carbon figure. Things that didn't get replaced. Broken electronics are the fastest-growing household waste there is, and a lot of it gets binned over a fault somebody was already required to fix for free."

**Watch:** Say it flat. No music swell, no speech.

---

### 2:28–2:48 — Where it's weak

**Screen:** Click the Sony item on the demo shelf, then change the region dropdown in the top bar from United States to **United Kingdom**. The result collapses from 7 to 2, both long shots.

**Say:** "Here's where it's thin. Same headphones, same card, switch to the UK — two results, both just the law. The rulebook is collected by hand, so it's deep, not complete. Card benefits changed a lot in the last few years, so it says worth asking, never you're covered. Every rule links to its source, and it's an information tool, not legal advice."

**Watch:** This beat is the one that buys you trust. Don't rush it and don't apologise for it.

---

### 2:48–3:00 — Close

**Screen:** Back to the landing page, bottom CTA: "Before you buy a new one, check who owes you the old one." Optional two-second cut to the raw `coverage.json` notes.

**Say:** "Three days, on my own. No framework and no backend — one JSON rulebook and a matching engine that runs in your browser, so nothing about what you own ever leaves it. Everything I couldn't verify from a primary source, I left out and wrote down why. That's Owed."

---

## 30-second cut-down

For anyone who stops early, or a gallery clip. Four shots, one take if you can.

| Time | Screen | Say |
|---|---|---|
| 0:00–0:07 | Landing hero, then the fine-print panel finding the Sony clause | "Your headphones die at fourteen months. The warranty was twelve. So you buy new ones." |
| 0:07–0:14 | The four questions, fast cuts | "Owed asks four things: what broke, what brand, roughly when, how you paid." |
| 0:14–0:24 | Sony results, Visa card benefit expanded | "The card you paid with quietly added a year. It finds that, names the rule, and gives you the deadline." |
| 0:24–0:30 | Claim script view | "Then it writes the phone call for you. One repair that happens instead of one thing in the bin." |

---

## Things not to say

- Don't say "guaranteed", "you're covered", or "you will get". The app never claims that, and neither should you.
- Don't put a dollar figure or a percentage in your voice-over that isn't on screen and sourced. No made-up e-waste tonnage, no "average person is owed $X".
- Don't call the sign-in real authentication. If it comes up: it's a name in your browser, and that's on purpose — there's no server, so there's nothing collecting what you own.
- Don't say the app found the maker's warranty had expired on the Sony. Sony isn't in the rulebook yet, so it doesn't check for one. Say "the maker's year is gone" — that's the user's situation, not a claim about a result.
- Don't over-explain the engine. If asked, one line: it scores each rule on brand match, payment match, timing and confidence, and shows the reason it matched.
