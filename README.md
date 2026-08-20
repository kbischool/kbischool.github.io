# Knowledge Base International Schools — Website

**Live:** https://kbischool.github.io/

The public website for **Knowledge Base International Schools (KBI)**,
Moniya, Ibadan — a NAPPS-affiliated school (Crèche through SSS3 / KBI
College) founded in 2012. This repo is the org's special `<org>.github.io`
GitHub Pages site: pushing to `main` publishes automatically, with no
Settings → Pages configuration needed.

> ⚠️ **Before this goes live:** read [`EDITORIAL-NOTES.md`](./EDITORIAL-NOTES.md)
> first. A number of facts on this site (staff names/titles, fee schedule,
> which student portals are actually live, real photography, testimonials)
> are still placeholders pending confirmation from the school. That file
> lists every open item.

## Tech stack

Plain static HTML/CSS/JavaScript — no framework, no build step, no
dependencies beyond Google Fonts.

- **Fonts:** Fraunces (headlines), Inter (body), IBM Plex Mono (nav
  breadcrumbs like `kbi://about/values`, tags, labels — the site's
  recurring "coding identity" motif)
- **Palette:** deep navy `#132038`, warm gold `#E3A430`, forest green
  `#2B6E4E`, warm paper `#F7F8F3`
- `assets/style.css` — the full design system, shared across every page
- `assets/script.js` — mobile nav (hamburger toggle, tap-to-expand
  dropdowns on screens ≤960px)

## Site structure

```
index.html          Home
about.html           History, mission/values, board & leadership
admission.html        Admissions process + enquiry form (front-end only)
academics.html         Sections (Crèche → SSS3), subjects, STEM/Coding programme
facilities.html         Campus & facilities
ict.html                 Digital Technologies / STEM / Robotics programme
alumni.html               Alumni page
news.html                  News & updates
contact.html                Contact details + enquiry form (front-end only)
assets/style.css             Design system, shared by every page
assets/script.js               Mobile nav behaviour
EDITORIAL-NOTES.md               Open items — read before publishing
```

## Forms have no backend

The **Contact** and **Admission** enquiry forms are front-end only —
`onsubmit` currently just resets the form and shows a confirmation alert;
nothing is sent anywhere. Wire them up to the school's existing
SchoolsFocus portal (used for the live "Apply", "Portal Login" and
"Result Checker" links elsewhere on the site) or to a third-party form
service (Formspree, Getform, etc.) before treating enquiries as real.

## Editing content

There's no templating system — each page is a standalone HTML file that
repeats the same header/nav/footer markup. To change shared chrome (nav
links, footer), update it in **every** page. To change page copy, edit the
relevant section directly; sections are grouped in clearly readable blocks
matching the page's visual sections.

## Related

- Org profile: [github.com/kbischool](https://github.com/kbischool) — see
  [`kbischool/.github`](https://github.com/kbischool/.github) for the org
  README linking every KBI repo
- [`kbischool/school-fee-portal`](https://github.com/kbischool/school-fee-portal) — internal fee management portal
- [`kbischool/kbis-records`](https://github.com/kbischool/kbis-records) — internal student records tooling

---
*Built by [Babatunde Awoyemi](https://github.com/babatundeawo) / Techbase Consultant Services for Knowledge Base International Schools.*
