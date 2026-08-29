# KBI Schools Website — Editorial Notes (read before publishing)

This site was built by merging your three content drafts (`KBI_Schools_Website_Content.md`,
`KBI-Schools-Website-Copy.md`, `KBI_Schools_Website_Content_v2.md`) plus the live site's
existing navigation structure at kbischools.com.ng. Where the drafts agreed, that became the
copy. Where they disagreed or a fact was unconfirmed, I picked the most-corroborated version
and flagged it below (and, on a few pages, with an on-page "to confirm" callout).

## ✅ Confirmed facts used throughout
- Founded 2012 · Motto "Knowledge in Humility" · NAPPS-affiliated (Akinyele LGA)
- Address: 15, Okikiolu Haven, Opposite IDC Primary School, Apapa Area, Moniya, Ibadan
- Phone: 08126909498 / 08163086631 · Email: knowledgebaseschools@gmail.com
- Sections: Crèche → Playgroup 1&2 → Nursery 1&2 → Primary 1–5/6 → JSS1–3 → SSS1–3 (KBI College)
- STEM/Coding/Robotics launched 2023/2024 session; Computer Studies → Digital Technologies (compulsory)
- Board of Directors: Revd George Okikiolu, Funke Okikiolu-Fadesere; Consultant: Babatunde Awoyemi
- Learning Benefits list, Prevocational Skills programme (from the old site123.me microsite)

## ⚠️ One real conflict between your drafts — resolved by leaving content out
`KBI_Schools_Website_Content.md` listed a **football team state championship** and a
**debate club regional win** as confirmed (🟢). `KBI-Schools-Website-Copy.md` explicitly
flagged that same write-up as a **sample newsletter template drafted by Techbase — not a
real KBI result**. I did not publish either claim anywhere on the new site. If the football/
debate results are in fact real, let me know and I'll add them back with a source.

## 🔲 Needs your confirmation before publishing
- Administrator's and Bursar's real names/photos (Administrator name in use: Bukola
  Christiana Adebunmi — confirm title/spelling)
- Principal's exact title (Pearce Folorunsho appears repeatedly in secondary admin
  communications — confirm this is the correct title-holder)
- Whether Babatunde Awoyemi's public title is "Consultant" or "Lead Consultant" (both appear
  in your source material)
- Official Mission/Vision wording, if a board-approved version exists on paper
- Real founding story — who founded the school, starting pupil numbers, first location
- Facilities — confirm what's actually on campus; add real photographs
- Head Teacher/Coordinator names (Primary, Nursery/Crèche), Security Officer's name
- Full subject list per level, current timetables, confirmed term dates for this session
- Fee schedule, sibling-discount %, scholarship thresholds (these change by session)
- Which of E-Portal / E-Payments / CBT / E-Results are actually live vs. planned
- Real alumni testimonials and photos
- Whether "Prevocational Skills" is still active (only confirmed on the retired site123.me
  microsite, not the current live site)
- Consent from any named staff/students before publishing their name or photo

## Content deep-dive vs. the live site (this revision)
I re-fetched kbischools.com.ng page-by-page and corrected several things that were
factually wrong or outdated in the previous build:
- **Fixed a real misattribution**: the "classrooms are where character is built..."
  quote is from **Mrs Bukola Adebunmi (Administrator)**, not Pearce Folorunsho — it had
  the wrong name and title attached.
- **Fixed the staff table**: Pearce Folorunsho is the **School Consultant**, not the
  Principal. The real Principal, KBI College is **Ganiyat Okunloye Jamiu** (missing
  before). Removed two fabricated rows ("School Bursar", "Security Officer") that
  don't appear on the real site, and added the real Assistant School Administrator,
  Matron and PTA Chairman rows.
- **Facebook URL and social icons updated** to match the live site exactly
  (facebook.com/kbischoolsibadan; swapped the non-existent "Threads" link for WhatsApp,
  which is what the school actually links).
- **"Primary 1–5/6" corrected to "Primary 1–5"** — the real class list stops at 5.
- **Expanded Our Values, Prefects, and Management** with the real, detailed content
  from the live site (all 6 values with full descriptions; all 12 real prefect roles
  plus Head Boy/Head Girl; Board of Directors bios).
- **News & Events restructured**: the real site currently shows exactly two live posts
  ("Admission Open for 2026-2027 Academic Session", "School Resumption" — 14 Sept 2026).
  Added those with their real text, and clearly relabelled the other event-type items as
  "typical events throughout our year" rather than implying they're dated posts.
- Added the missing **CBT** quick link (the real homepage has 5 quick links, we had 4).
- Added a **Python** entry to the ICT tools list, and the real "Learning Beyond the
  Classroom" / "Environment Designed for Growth" sections to Facilities.
- Fixed a CSS bug this pass introduced: a generic `.icon` utility class (added for SVG
  icons) was colliding with the pre-existing `.icon` text-label class used inside
  `.callout` boxes, squashing labels like "TO CONFIRM" into a 1em box and causing text
  to overlap. Scoped `.callout .icon` to override width/height so both coexist safely.

Pages that were still Lorem Ipsum or empty on the live site (History, Prospectus,
Curriculum) were left as our own placeholder content, clearly flagged with "to confirm"
callouts rather than presented as verified fact.

## 🖼️ Template images — swap these for real photos
I couldn't pull real campus photography into this build (no live network access in my
working environment), so every photo slot on the site is a labelled placeholder frame:
a light sky-blue box with an image icon and a caption naming what should go there
(e.g. "School Main Block", "Graduation Day"). They're on the homepage ("A peek at our
campus") and every Facilities card. To swap one in, replace the whole
`<div class="photo-frame">...</div>` with a normal `<img src="assets/img/your-photo.jpg"
alt="...">` — the surrounding card/grid CSS doesn't need to change.
The live site (kbischools.com.ng) already has real photos in its homepage slider —
School Main Block, Graduation Day, the Auditorium, the Library, and a standard
classroom — matching the captions I used, so those are the natural first ones to add.

## What's in this delivery
- `index.html`, `about.html`, `admission.html`, `academics.html`, `facilities.html`,
  `ict.html`, `alumni.html`, `news.html`, `contact.html` — the full site, styled and linked
- `assets/style.css`, `assets/script.js` — shared design system + mobile nav
- `assets/img/logo.png` + generated favicons — the real school crest
- Contact form and admission form are front-end only (no backend) — wire them to
  kbischools.com.ng's existing SchoolsFocus portal, or a form service, before publishing
- Portal login / result checker / apply links point straight at the current live
  kbischools.com.ng SchoolsFocus endpoints, since that backend (student records, CBT,
  payments) isn't something a static rebuild can replace

## Design notes
Palette is now anchored on the school's own crest: light sky blue `#00CCFF` (text-safe
variant `#00748F`) plus white carry the page — hero, cards, tags, dividers, icons,
wayfinding. Amber `#FFB400` is reserved for action buttons (Apply Now, form submits);
a few other accents (coral/indigo/teal/violet) appear only on the four external "system"
cards (Portal Login, Check Result, etc.), which function as buttons rather than content.
Type: Sora (headlines), Inter (body), JetBrains Mono (tags, labels) — the small circuit-line
dividers are the site's signature motif, tying the visual language back to the school's own
coding identity. The old `kbi://about/values`-style monospace path labels have been removed
sitewide per feedback; the breadcrumb nav under each page's title is the only wayfinding text
that remains.
