# Arcwind: precision coil manufacturer website + CMS/CRM

A bilingual (English / 简体中文) B2B website for a precision coil manufacturer, with a built-in content management system and a sales CRM in one Next.js app. The manufacturer makes VCM coils (≈10% of global shipments), air-core coils, bobbin coils, wireless charging coils, linear motors and wireless chargers.

> **Arcwind is a placeholder brand.** The company name, figures, certifications, part numbers, customers and contacts are illustrative. Replace them in `lib/site.ts` and the seed files before using this for a real client.

![Home page](docs/screenshots/home.jpg)

## What's inside

### Public website (`/en`, `/zh`)

| Page | What it does |
|---|---|
| **Home** | An animated orthocyclic winding cross-section. Turns are laid layer by layer, then every tenth turn lights up to show the ≈10% VCM share. Followed by product families, the drawing-to-production path, applications, recent articles and a supplier-assessment band. |
| **Products** | Parametric finder: filter by outline, height, wire diameter and resistance, sort by column, and add parts to a **quote list**. |
| **Product detail** | Generated dimensioned drawing (third-angle, title block), spec table, customization options, buyer FAQ, documents, related articles. Includes a **printable datasheet** (print or save as PDF). |
| **Applications** | Seven industries, each with what matters there, how it's handled, and parts to start from. |
| **Engineering** | Capability envelope (wire, outline and turns ranges), OEM / ODM / platform models, development timeline. |
| **Manufacturing** | Written for supplier-qualification teams: facts, plants, equipment, quality system, 12-month metrics, certifications. |
| **Resources** | Technical notes, case studies and news. |
| **Request a quote** | Quote, sample, drawing review or general question. Includes the quote list with quantities, drag-and-drop drawing upload (kept private), and an NDA option. |

**SEO / GEO (AI search) built in:** canonical + `hreflang` on every page, `sitemap.xml` with language alternates, `robots.txt`, JSON-LD (Organization, Product with spec properties, FAQPage, BreadcrumbList, TechArticle / NewsArticle), plain "key facts" blocks, and an [`llms.txt`](https://llmstxt.org) summary that AI assistants can read and cite.

### Admin (`/admin`)

![CRM dashboard](docs/screenshots/dash.jpg)

**CRM**
- **Inquiries inbox:** every form submission is captured automatically with its channel (Google, *AI search*, LinkedIn, Baidu, email campaign…), referrer, landing page, files and quote-list items.
- **Auto-routing:** inquiries are assigned to the rep whose regions include the buyer's country, linked to an existing customer by email domain, and given a follow-up task due within one working day.
- **First-response tracking**, with SLA highlighting.
- **Convert** an inquiry into customer + contact + opportunity (and a sample request) in one step.
- **Customers** with contacts, communication history (calls, emails, meetings, notes), follow-up reminders, quotes, samples and linked inquiries.
- **Pipeline** board (qualifying → sampling → quoted → negotiation → won/lost) with weighted value.
- **Quotes** with an editable line-item table, printable quotation document, and status that moves the deal forward when it's sent.
- **Samples** tracked from request to production, shipment (courier/tracking) and customer feedback.
- **Analytics:** inquiries per week, conversion funnel, lead sources with conversion rate and pipeline created per channel, top countries, most requested parts, response time by owner.

**CMS**
- Products and articles edited side by side in English and Chinese, with draft → preview → publish, unpublish, and delete.
- Spec-table editor, product photos and PDF datasheets, parametric filter values, drawing geometry, application tags.
- Search-result preview with title/description length guidance per language.

**Permissions**

| Role | Can do |
|---|---|
| Administrator | Everything, including users and roles |
| Sales manager | All CRM records, assigns inquiries, edits website content |
| Sales rep | Own customers and deals plus unassigned inquiries; receives inquiries from their regions |
| Content editor | Products and articles only, no customer data |

<p>
  <img src="docs/screenshots/pipe.jpg" width="49%" alt="Pipeline board" />
  <img src="docs/screenshots/analytics.jpg" width="49%" alt="Analytics" />
</p>
<p>
  <img src="docs/screenshots/product.jpg" width="49%" alt="Product page" />
  <img src="docs/screenshots/zh.jpg" width="49%" alt="Chinese home page" />
</p>

## Design notes

- **Concept:** the orthocyclic winding cross-section, the image a coil engineer recognises instantly, is the one bold element. Everything around it stays quiet and precise, like a spec sheet.
- **Palette:** magnet-wire enamel green (`#12332f`) and copper (`#b8612a`) on cool paper (`#f3f4f1`). Copper appears where the material appears.
- **Type:** Archivo variable (self-hosted). The width axis carries the hierarchy: expanded for headlines and model numbers, normal width for reading. Chinese falls back to PingFang SC / Noto Sans SC.
- **Product imagery** is generated from each part's real dimensions (line illustrations and dimensioned drawings), so the catalogue looks complete before any photography exists. Uploaded photos appear alongside.
- The admin uses the same brand at a denser working scale. Charts are single-series and directly labelled.

## Tech

- Next.js 15 (App Router, Server Actions), React 19, TypeScript
- SQLite via `better-sqlite3`: one file, no database server to run
- No UI framework; hand-written CSS
- Auth: scrypt password hashes and HTTP-only session cookies
- Uploads are stored on disk. Customer drawings are private and only downloadable by signed-in CRM users.

## Getting started

```bash
npm install
npm run dev            # http://localhost:3000  →  /en, /zh, /admin
```

The database (`data/arcwind.db`) is created and filled with demo content on first start. To start over: `npm run seed` (deletes the database; it is re-seeded on next start).

**Demo accounts** (password `arcwind-demo`, or whatever you set in `ADMIN_PASSWORD` before first start):

| Email | Role |
|---|---|
| admin@arcwind.example | Administrator |
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
| `DATA_DIR` | `./data` | Where the SQLite file and uploads live |
| `INSECURE_COOKIES` | unset | Set to `1` to allow sign-in over plain HTTP in production (local testing only) |

## Deploying on your own server

```bash
npm ci
SITE_URL=https://www.example.com ADMIN_PASSWORD='change-me-now' npm run build
SITE_URL=https://www.example.com npm start -- -p 3000
```

Put it behind nginx or Caddy with HTTPS (session cookies are `Secure` in production), and keep it running with a process manager such as pm2 or systemd. **Back up the `data/` directory**: it holds the database and all uploads. Change every demo password from *Team & permissions* after the first sign-in.

## Making it a real client's site

1. `lib/site.ts`: name, contacts, address, plants, headline figures, certifications.
2. `lib/catalog-seed.ts`, `lib/articles-seed.ts`, `lib/applications.ts`: starting catalogue, articles and industries (or delete the seed data and add content from the admin).
3. `lib/i18n.ts`: all interface copy in both languages.
4. `public/icon.svg` and the `BrandMark` component: the logo.

## Project structure

```
app/
  [locale]/            public site (en, zh)
  admin/(auth)/login   sign-in
  admin/(app)/…        CRM + CMS screens
  admin/actions.ts     all server actions (permission-checked)
  api/inquiry          form capture → CRM
  api/media, api/files public media / private customer files
  sitemap.ts, robots.ts, llms.txt
components/site        header, footer, winding hero, drawings, finder, inquiry form
components/admin       shell, tables, charts, editors
lib/                   db + schema, seed data, auth, i18n, SEO helpers, CRM rules
```

## License

MIT
