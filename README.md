# Arcwind: precision coil manufacturer website + CMS/CRM

A bilingual (English / 简体中文) B2B website for a precision coil manufacturer, with a built-in content management system and a sales CRM in one Next.js app. The manufacturer makes VCM coils (≈10% of global shipments), air-core coils, bobbin coils, wireless charging coils, linear motors and wireless chargers.

> **Arcwind is a placeholder brand.** The company name, figures, certifications, part numbers, customers and contacts are illustrative. Replace them in `lib/site.ts` and the seed files before using this for a real client.

**Live preview (public website, static copy):** https://hunterlinhk.github.io/precision-coil-website-crm/
**Full app with CRM/CMS, one click:** [Open in GitHub Codespaces](https://codespaces.new/hunterlinhk/precision-coil-website-crm) and sign in at `/HunterLin` (username `HunterLin`, password `arcwind-demo`).

![Home page](docs/screenshots/home.jpg)

![Macro section](docs/screenshots/macro.jpg)

## What's inside

### Public website (`/en`, `/zh`)

| Page | What it does |
|---|---|
| **Home** | An animated orthocyclic winding cross-section. Turns are laid layer by layer, then every tenth turn lights up to show the ≈10% VCM share. Followed by product families, the drawing-to-production path, applications, recent articles and a supplier-assessment band. |
| **Products** | Parametric finder: filter by outline, height, wire diameter and resistance, sort by column, and add parts to a **quote list**. |
| **Product detail** | Generated dimensioned drawing (third-angle, title block), spec table, customization options, buyer FAQ, documents, related articles. Includes a **printable datasheet** (print or save as PDF). |
| **Applications** | Seven application groups (19 uses, from phone-camera AF/OIS coils to hearing aids and EV charging), each with what matters there and parts to start from. |
| **Engineering** | Capability envelope (wire, outline and turns ranges), OEM / ODM / platform models, development timeline. |
| **Manufacturing** | Written for supplier-qualification teams: workshop facts, winding and supporting machines, quality system, certifications. |
| **Resources** | Technical notes, case studies and news. |
| **Request a quote** | Quote, sample, drawing review or general question. Includes the quote list with quantities, drag-and-drop drawing upload (kept private), and an NDA option. |

**SEO / GEO (AI search) built in:** canonical + `hreflang` on every page, `sitemap.xml` with language alternates, `robots.txt`, JSON-LD (Organization, Product with spec properties, FAQPage, BreadcrumbList, TechArticle / NewsArticle), plain "key facts" blocks, and an [`llms.txt`](https://llmstxt.org) summary that AI assistants can read and cite.

### Admin (`/HunterLin`)

The admin is fully bilingual: each person switches between **中文** and **EN** at the bottom of the sidebar (or on the sign-in page), and the choice is remembered per person.

![Dashboard](docs/screenshots/dash.jpg)

Navigation is deliberately short:

| Section | Pages |
|---|---|
| Overview | **Dashboard**: inquiries waiting for a reply, unread email, your follow-ups (add and tick them off here), website visitors, Google search snapshot, lead sources |
| Sales | **Inbox** (website inquiries + email) · **Customers** · **Deals** |
| Website | **Products** · **News & articles** · **Customer logos** · **Analytics** |
| Settings | **Email accounts** · **Google Search Console** · **Team & permissions** |

**Sales**
- **Inbox:** every website inquiry, captured with its channel (Google, *AI search*, LinkedIn, Baidu, email campaign…), referrer, landing page, files and quote-list items. A second tab shows customer email.
- **Auto-routing:** inquiries go to the rep whose regions include the buyer's country, are linked to an existing customer by email domain, and get a follow-up due within one working day.
- **Email inside the CRM:** connect company mailboxes (Tencent Exmail, Alibaba Mail, NetEase, Google Workspace, Microsoft 365 or any SMTP/IMAP server). Reply to an inquiry or a customer with attachments; replies are threaded, copied to the mailbox's Sent folder, and incoming mail from known contacts is filed under the right customer automatically. Passwords are stored encrypted.
- **Customers:** one page per company with its **deals** (stage, value, decision date, and the quotes and samples for each deal, all edited in place), email, notes and call log, contacts, follow-ups and linked inquiries.
- **Deals** board (qualifying → sampling → quoted → negotiation → won/lost) with weighted value; cards open the deal on the customer page.
- **Quotes:** editable line items and a printable quotation (print or save as PDF).

**Website**
- **News & articles editor:** English and 中文 tabs, formatting toolbar, live preview, a *short answer* box (shown as “Key points” and the text AI assistants quote most), FAQ editor (published with FAQ structured data), cover photo, author and date, related products and applications, a Google result preview, and a live **search & AI checklist** per language.
- **Products:** both languages side by side, spec table, datasheets, filter values, drawing geometry, and **photos** (drag and drop, reorder, replace, remove; the main photo replaces the 3D render everywhere).
- **Customer logos:** the brand strip under the homepage banner. Add, rename, upload or replace a logo file, reorder, hide or delete. Without a file the name is shown as text.
- **Analytics:** three tabs.
  - *Website visitors* — built in, cookie-free and privacy-friendly in the style of the open-source tools [Plausible](https://github.com/plausible/analytics) and [Umami](https://github.com/umami-software/umami): visitors per day, top pages, channels (including AI assistants), referrers, countries, devices. No IP addresses or personal data are stored; bots and “Do Not Track” are skipped.
  - *Google search* — clicks, impressions, CTR, average position, top search terms, pages and countries from the Google Search Console API (read-only service account; setup steps are on the settings page).
  - *Sales* — inquiries per week, inquiry → order funnel, lead sources with conversion, top countries and parts, reply time by owner.

**Permissions**

| Role | Can do |
|---|---|
| Administrator | Everything, including users, permissions and integrations |
| Sales manager | All customers and deals, assigns inquiries, edits website content |
| Sales rep | Own customers and deals plus unassigned inquiries; receives inquiries from their regions; can add their own mailbox |
| Content editor | Products, articles, logos and website analytics; no customer data |

<p>
  <img src="docs/screenshots/customer.jpg" width="49%" alt="Customer page with deals" />
  <img src="docs/screenshots/article-editor-zh.jpg" width="49%" alt="Article editor in Chinese" />
</p>

![Analytics](docs/screenshots/analytics.jpg)

## Design notes

**Direction: "Magnified".** The company's story has two scales: wire six times finer than a hair, and hundreds of millions of parts a year. The site shows both. Studio-lit product shots and a macro view of the turns carry the precision; a production tray, the winding head and a cut-away cross-section carry the volume and the process.

- **The product is the imagery.** Every product, and every manufacturing scene, is a physically based 3D render of the real part geometry (enamelled copper, litz wire, ferrite, brushed steel, polyimide), lit in a virtual softbox studio. Uploaded photography replaces a render automatically when a product has photos in the CMS.
- **Monochrome interface, copper product.** Neutral studio paper (`#f2f2f0`), a darker sweep (`#e6e6e2`) for product stages, true black type, and a dark studio (`#0c0d0e`) for the macro and manufacturing sections. The only colour on the page comes from the products themselves.
- **Type.** Barlow, a DIN-lineage grotesk: the same family of lettering used on engineering drawings and industrial signage. Hairline 200 weight for display (a nod to fine wire), DIN numerals for specifications. Chinese falls back to PingFang SC / Noto Sans SC.
- **Rhythm.** Light and dark sections alternate. Each screen makes one statement. Measurement conventions (dimension lines, specimen captions, a to-scale hair/wire comparison, a development timeline drawn in weeks) are the graphic language.
- **Interaction.** Product pages have Photo / 3D / Drawing views. The 3D view loads only when opened, and is drag-to-rotate and scroll-to-zoom. The catalogue switches between an image grid and a sortable table, with parametric filters.
- **Tones.** The renders are transparent, so every product family and industry sits on its own muted backdrop (clay, fog, sand, sage, graphite, lilac, steel, mint). The catalogue reads by colour at a glance; the products stay true to life.

### Motion and interaction

All motion is CSS and small, dependency-free client components (`components/site/motion.tsx`, `app/flair.css`), driven by `data-*` attributes so server components stay server components. Everything switches off under `prefers-reduced-motion`, and content is fully visible without JavaScript.

| Where | What it does |
|---|---|
| Hero | Headline rises word by word, "One in ten" in moving copper; a **magnifying loupe** follows the cursor over the coil; a live counter of coils wound today (600M/yr ≈ 19 per second); a rotating seal |
| Macro | Figure counts down from 1.000 to 0.012 mm, image zooms with scroll, a **measuring reticle** reads out X/Y in mm under the cursor, hair ring draws itself |
| Manufacturing | A **vision-inspection scan** sweeps the production tray and each coil it passes reports PASS with its resistance; facts count up; a machine-floor diagram of the 50+ winding and 30+ supporting machines |
| Timeline | Gantt bars grow in sequence on graph paper |
| Exploded view | Callouts pop in one by one; hovering a layer highlights its callout |
| Applications | Home: a floating preview follows the cursor down the list. Index: a **scroll story**, the sticky stage changes colour and product per industry |
| Product pages | Loupe on the photo, dimensioned drawing draws itself, key figures count up; adding to the quote list sends a copper bead to the header counter |
| Quote form | Five turns of wire fill in copper as the required answers are completed; confirmation bursts |
| Everywhere | Scroll-progress copper line under the header, magnetic buttons, spotlight cards, marquee of families, wire that winds itself on scroll at the end of the page, footer wordmark lit by the cursor, local time at the Dongguan plant |

<p>
  <img src="docs/screenshots/families.jpg" width="49%" alt="Product families" />
  <img src="docs/screenshots/stack.jpg" width="49%" alt="Exploded Qi2 module" />
</p>
<p>
  <img src="docs/screenshots/products.jpg" width="49%" alt="Catalogue" />
  <img src="docs/screenshots/product.jpg" width="49%" alt="Product page" />
</p>
<p>
  <img src="docs/screenshots/applications.jpg" width="49%" alt="Applications scroll story" />
  <img src="docs/screenshots/resources.jpg" width="49%" alt="Resources with covers" />
</p>
<p>
  <img src="docs/screenshots/zh.jpg" width="49%" alt="Chinese home page" />
  <img src="docs/screenshots/mobile.jpg" width="24%" alt="Mobile home page" />
</p>

### Product renders

The images in `public/renders/` are generated from code, not photographed:

```bash
npm run render                       # all shots (needs Playwright's Chromium)
node scripts/render/run.mjs aw-vcm-af0806 && node scripts/render/reframe.mjs   # one shot
```

- `lib/coil3d/models.ts`: procedural models for every product type, in millimetres, driven by each product's `dims`. Modelled on the manufacturer's real parts: autofocus coils wound on octagonal lens carriers, AF + OIS carriers with flat drive coils, receiver coils on nanocrystalline sheet, two- and three-coil transmitters on ferrite with Kapton-taped leads, SMD linear-motor drive coils, and bonded copper air-core coils
- `lib/coil3d/studio.ts`: softbox environment, key light, contact shadow and framing
- `lib/coil3d/scenes.ts`: the product and manufacturing shots
- `scripts/render/reframe.mjs`: crops every studio render to the same visual scale

The same models drive the live 3D viewer on product pages, so a product added in the CMS with a known shape gets a 3D view immediately.

## Tech

- Next.js 15 (App Router, Server Actions), React 19, TypeScript
- Three.js for the product renders and the 3D viewer
- SQLite via `better-sqlite3`: one file, no database server to run
- No UI framework; hand-written CSS, self-hosted Barlow
- Auth: scrypt password hashes and HTTP-only session cookies
- Uploads are stored on disk. Customer drawings and email attachments are private and only downloadable by signed-in CRM users.
- Email: [Nodemailer](https://nodemailer.com) (SMTP), [ImapFlow](https://imapflow.com) (IMAP) and mailparser
- Visitor analytics: own cookie-free counter with [ua-parser-js](https://github.com/faisalman/ua-parser-js); search data from the Google Search Console API

## Getting started

```bash
npm install
npm run dev            # http://localhost:3000  →  /en, /zh, /HunterLin
```

The database (`data/arcwind.db`) is created and filled with demo content on first start. To start over: `npm run seed` (deletes the database; it is re-seeded on next start).

The admin lives at **`/HunterLin`** (any capitalisation redirects there). Sign in with a username or a work email.

**Demo accounts** (password `arcwind-demo`, or whatever you set in `ADMIN_PASSWORD` before first start):

| Sign in as | Role |
|---|---|
| `HunterLin` (or admin@arcwind.example) | Administrator |
| daniel.wu@arcwind.example | Sales manager |
| kevin.zhang@arcwind.example | Sales rep (CN, TW, HK, KR, JP) |
| laura.martin@arcwind.example | Sales rep (Americas & Europe) |
| anh.nguyen@arcwind.example | Sales rep (South & Southeast Asia, AU) |
| grace.liu@arcwind.example | Content editor |

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `SITE_URL` | `https://www.arcwind.example` | Absolute URLs in canonical tags, sitemap, JSON-LD, llms.txt |
| `ADMIN_PASSWORD` | `arcwind-demo` | Password for the seeded accounts (only read when the database is first created) |
| `DEMO_DATA` | on | Set to `0` for a real installation: only the administrator, catalogue, articles and logos are created; no sample customers, deals, email or traffic |
| `APP_SECRET` | generated | Key that encrypts stored mail passwords and the Search Console key. If unset, a random key is kept in `DATA_DIR/.secret`; either way, keep it with your backups |
| `DATA_DIR` | `./data` | Where the SQLite file, uploads and the generated secret live |
| `INSECURE_COOKIES` | unset | Set to `1` to allow sign-in over plain HTTP in production (local testing only) |
| `MAIL_ALLOW_SELF_SIGNED` | unset | Set to `1` to accept self-signed certificates on mail servers (test servers only) |

## Deploying on your own server

The admin needs a running Node server and a disk for the database, so it can't run on GitHub Pages. Any small VPS or cloud VM works (1 vCPU / 1 GB RAM is enough). For a site aimed at buyers in mainland China, a host in Hong Kong or an ICP-registered mainland host keeps the Chinese pages fast.

**With Docker** (recommended):

```bash
# edit docker-compose.yml first: SITE_URL, ADMIN_PASSWORD, APP_SECRET
docker compose up -d
```

The database and uploads live in the `arcwind-data` volume. Put Caddy or nginx with HTTPS in front of port 3000.

**Without Docker:**

```bash
npm ci
SITE_URL=https://www.example.com ADMIN_PASSWORD='change-me-now' DEMO_DATA=0 npm run build
SITE_URL=https://www.example.com APP_SECRET='a-long-random-string' npm start -- -p 3000
```

Keep it running with pm2 or systemd behind nginx or Caddy with HTTPS (session cookies are `Secure` in production).

**After the first start:** sign in at `/HunterLin`, change every password under *Team & permissions*, connect your mailboxes under *Email accounts*, and connect *Google Search Console*. **Back up `DATA_DIR`** (database, uploads and `.secret`).

## Static preview (GitHub Pages)

The public website can also be exported as a static, read-only copy:

```bash
NEXT_PUBLIC_BASE_PATH=/precision-coil-website-crm SITE_URL=https://hunterlinhk.github.io/precision-coil-website-crm npm run preview:static
```

This builds with the base path, crawls every page in both languages into `preview-out/`, and puts the quote form in preview mode (it shows the confirmation without sending anything). That folder is what the `gh-pages` branch serves. The CRM/CMS needs the Node server and database, so it is not part of the static copy; use Codespaces or your own server for that.

## Making it a real client's site

1. `lib/site.ts`: name, contacts, address, headline figures, certifications.
2. `lib/catalog-seed.ts`, `lib/articles-seed.ts`, `lib/applications.ts`: starting catalogue, articles and industries (or delete the seed data and add content from the admin).
3. `lib/i18n.ts`: all interface copy in both languages.
4. `public/icon.svg` and the `BrandMark` component: the logo.

## Project structure

```
app/
  [locale]/            public site (en, zh)
  HunterLin/(auth)/login   sign-in (username or email)
  HunterLin/(app)/…        CRM + CMS screens
  HunterLin/actions.ts     all server actions (permission-checked)
  api/inquiry          form capture → CRM
  api/media, api/files public media / private customer files
  sitemap.ts, robots.ts, llms.txt
components/site        header, footer, product stage, 3D viewer, drawings, finder, inquiry form
lib/coil3d             3D models, studio lighting and scenes for renders and the viewer
scripts/render         headless render pipeline → public/renders/*.webp
components/admin       shell, tables, charts, editors
lib/                   db + schema, seed data, auth, i18n, SEO helpers, CRM rules
```

## License

MIT
