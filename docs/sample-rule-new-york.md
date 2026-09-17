# How one rule works in Owed

For Gay Gordon-Byrne, The Repair Association

Arjun Sharma, September 2026, goofturtles.github.io/owed

---

Gay,

You asked to see a sample of how a rule is actually written up, so here is one,
start to finish.

I picked New York on purpose. It is the rule your page helped me get right, and
it is also the one where I found out I had been wrong. That felt like the honest
choice for a sample.

I should say plainly where this came from. Owed started as a project, the kind
of thing you build because you want to build something. It stopped being that
somewhere along the way. What kept me at it is a small and annoying fact: these
rights already exist, and almost nobody finds out in time to use them. The law
gets written for people who will never read it. That gap is the reason I kept
going, and it is why I care whether the sentences in this file are true rather
than just convincing.

It is free. No account, no tracking, no money in it. I mention that only so you
know what you are looking at.

---

## 1. The rule as it is stored

Every rule is one record in one public file, `data/coverage.json`. Nothing is
generated when someone loads the page and nothing is written by a language
model. If a sentence is wrong, it is wrong because I wrote it wrong, and it gets
fixed in one place.

    id           law-us-ny-right-to-repair
    source_type  statutory
    title        New York: makers must hand over parts, tools and repair manuals
    applies to   New York only (US-NY), any brand
    categories   phone, laptop, tablet, headphones, tv, watch, camera, monitor, printer, toy, other
    confidence   certain
    source       https://www.nysenate.gov/legislation/laws/GBS/399-NN
    explainer    The Repair Association, New York
                 https://www.repair.org/newyork

## 2. What the reader actually sees

Word for word, as it appears on the page:

> **What you get**
> The parts, tools and repair information you or a local shop need to fix your device. The manual and the tools have to be free, apart from the real cost of posting a physical copy, and parts have to be offered at a reasonable cost and on reasonable terms. A maker cannot use its contracts with its own approved shops to get out of this.
>
> **Window**
> In force since 28 December 2023. Covers gear first made, and first sold or used in New York, on or after 1 July 2023. Home appliances are left out, including fridges, ovens, microwaves, heating and cooling units and home alarm systems, and so are cars, medical devices, farm and off-road gear, power tools, yard and garden equipment, e-bikes and industrial electrical gear. No deadline tied to when you bought it.
>
> **How to claim**
> Ask the maker's support for the part and the repair manual, in writing. If they refuse, file a complaint with the New York Attorney General, who enforces this section.
>
> **Source**  Read the rule (links to the statute above)
> **Explainer**  The Repair Association: New York

## 3. Where every sentence comes from

This is the part I would most like you to pull apart. Each line was checked
against the text at nysenate.gov, and then again independently against the
newyork.public.law mirror. The two agree word for word.

| What the reader is told | GBL 399-nn |
|---|---|
| Parts, tools and documentation must be made available | 2, "shall make available to any independent repair provider and owner" |
| The manual is free | 1(d)(i), documentation "at no charge" |
| Apart from the real cost of posting a physical copy | 1(d)(i), "reasonable actual costs of preparing and sending the copy" |
| The tools are free | 1(d)(ii), tools "at no charge" |
| Parts at a reasonable cost and on reasonable terms | 1(d)(iii), "at reasonable costs and terms" |
| A maker cannot use its contracts with its approved shops to get out of it | 3(b), a provision that "purports to waive, avoid, restrict, or limit" the duty is "void and unenforceable" |
| Covers gear first made and first sold or used in NY on or after 1 July 2023 | 1(b) and 2 |
| Home appliances left out, including fridges, ovens, microwaves, heating and cooling units, home alarm systems | 3(g), "any home appliance that has a digital electronic product embedded within it ... refrigerators, ovens, microwaves, air conditioning, heating units, and security devices or alarm systems" |
| Cars left out | 4(a) |
| Medical devices left out | 4(b) |
| Farm and off-road gear, power tools, yard and garden equipment left out | 4(c) |
| Industrial electrical gear left out | 4(d) |
| E-bikes left out | 4(e) |
| Complain to the Attorney General | 7, "Enforcement by the attorney general" |

Two things in that rule are **not** taken from the statute, and I would rather
tell you than have you find them:

- **"In force since 28 December 2023."** The section gives no calendar date at
  all. I am relying on the Key Dates block on your New York page, which is also
  the page the rule links out to.
- **"No deadline tied to when you bought it."** That is an absence rather than a
  provision. There is no limitation period in the section, so the claim is that
  nothing is there.

## 4. The words it puts in someone's hands

Owed never contacts anyone on a person's behalf. It writes something they send
themselves, in their own name:

> Hello, I hope you can help me with something.
>
> I bought a laptop about two years ago. It has stopped charging.
>
> I think this may still be covered. The rule I am going by is: New York: makers must hand over parts, tools and repair manuals.
>
> New York's Digital Fair Repair Act, General Business Law 399-nn, says you have to make the parts, tools and documentation available to owners and independent shops on fair and reasonable terms. Please send them.
>
> Could you let me know what you need from me, and whether there is a deadline
> I should keep in mind? Thank you for your help.

That is the whole product, really. Everything else is working out which rule
belongs in that middle paragraph.

## 5. What this rule deliberately does not claim

Getting this list right matters more to me than the rest of the document.

- It does not say anyone will win. It says which rule may apply.
- It does not say parts must be sold at the price authorised shops pay. New York
  says only "reasonable costs and terms". California and Oregon genuinely do
  require parity and their rules say so. New York's does not, because the
  statute does not.
- It does not promise a repair. 399-nn is about access to parts, tools and
  documentation, not about anyone fixing the thing for you.
- It does not hint that a reader can sue. Only the Attorney General enforces
  this section.
- It does not treat 3(f) as a flat ban on games consoles. That paragraph is a
  federal-law conflict carve-out that happens to mention them, so I left it out
  of the plain-English list rather than overstate it.
- It is not legal advice, and the page says so.
- It reads nothing about the person using it. No account, nothing uploaded,
  everything stays in their browser.

## 6. Two things that changed because of your email

**I link to you now instead of restating you.** Every US state repair rule
carries a link out to your state page next to the statute, labelled as yours.
Seven rules have it: California, New York, Oregon, Minnesota and both Colorado
rules. I only used the seven pages that have real summaries on them. The other
state URLs resolve but are empty, and sending someone to a blank page seemed
worse than not linking at all.

**Your page caught a mistake of mine.** This is the part I would rather not
write, which is probably why it should be in here.

I had two New York rules for one statute and they disagreed with each other. I
had not noticed. Reading 399-nn properly, against your page:

- both of them overstated the parts duty as price parity with authorised shops,
  when 1(d)(iii) says only "reasonable costs and terms"
- one wrongly included power tools, which 4(c) excludes
- one wrongly included home appliances, which 3(g) excludes

They are one rule now, rewritten against the primary text. The rulebook went
from 318 rules to 317. I then went looking for the same failure everywhere else,
and New York turned out to be the only state where two rules contradicted each
other. California and Oregon were already right.

I am telling you this because of what you said about not wanting to monitor
someone else's pages. You should be able to judge whether I am the sort of
person who finds his own mistakes. That seems like a fair thing to want to know
before your name goes anywhere near this.

---

Thank you for the time you have already given me. Everything above can be
checked against `data/coverage.json` in the repository, and if any line in
section 3 is wrong, I would genuinely rather hear it than not.

Arjun
