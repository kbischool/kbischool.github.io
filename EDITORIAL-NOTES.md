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

## What's in this delivery
- `index.html`, `about.html`, `admission.html`, `academics.html`, `facilities.html`,
  `ict.html`, `alumni.html`, `news.html`, `contact.html` — the full site, styled and linked
- `assets/style.css`, `assets/script.js` — shared design system + mobile nav
- Contact form and admission form are front-end only (no backend) — wire them to
  kbischools.com.ng's existing SchoolsFocus portal, or a form service, before publishing
- Portal login / result checker / apply links point straight at the current live
  kbischools.com.ng SchoolsFocus endpoints, since that backend (student records, CBT,
  payments) isn't something a static rebuild can replace

## Design notes
Palette: deep navy `#132038`, warm gold `#E3A430`, forest green `#2B6E4E`, warm paper
`#F7F8F3`. Type: Fraunces (headlines), Inter (body), IBM Plex Mono (nav paths, tags, labels)
— the monospace "kbi://about/values" breadcrumb and the small circuit-line dividers are the
site's signature motif, tying the visual language back to the school's own coding identity.
