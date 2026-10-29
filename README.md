# KKquotation

A client-facing design pricing and quotation calculator for **KENVAS KREATIVE** — *Every idea deserves a canvas.*

The app turns the KENVAS KREATIVE Excel quotation workbook into a responsive web calculator. Clients can choose a design service, configure the scope, see an itemized estimate update live, complete their details, preview a professional quotation, print or save it as A4 PDF, copy the summary, or open a prefilled email draft.

> This repository does **not** contain the private Excel workbook. The website has not been deployed to Vercel by the project author; the deployment steps below are for the repository owner to run.

- GitHub repository: <https://github.com/IvanKenChua/KKquotation>
- Brand contact: `kenvaskreative@gmail.com` · [Facebook](https://www.facebook.com/KenvasKreative)
- No account, login, payment, or backend is required for the calculator.

---

## Features

- 23 actual workbook services with fixed, per-unit, and custom pricing methods
- Searchable and filterable service cards, with no full public rate table
- Conditional project controls for quantity, variations, complexity, content,
  photos, urgency, revisions, add-ons, and discounts
- Live itemized price summary with warnings and manual-review states
- Client details, project brief, special instructions, and preferred deadline
- Dynamic quotation preview with quotation number, date, validity, project
  specifications, Charge/Description/Amount table, terms, notes, and disclaimers
- A4 print / Save-as-PDF layout
- Copy quotation summary and prefilled email handoff
- Honest request flow: no fake submission, email sending, or server storage
- Responsive desktop, tablet, and mobile layouts with a compact mobile total bar
- Accessible labels, keyboard-friendly controls, focus-trapped dialog, reduced
  motion support, and print-only quotation output
- Separate, deterministic, unit-tested pricing engine

## Technology

- React 19 + TypeScript + Vite 7
- Tailwind CSS v4 plus a small component/token CSS layer
- Lucide React icons
- Vitest for pricing, quotation, and validation tests
- Playwright Core with installed Chrome/Edge for responsive and print checks
- Vercel-ready static Vite build

## Project structure

```text
KK_Quotation_Calculator/
├─ public/
│  ├─ brand/                    # wordmark and monogram
│  └─ favicon.svg
├─ src/
│  ├─ components/               # UI, form, summary, quotation, dialog
│  ├─ config/business.ts        # verified public contact details
│  ├─ data/pricing.ts           # workbook-derived service/add-on configuration
│  ├─ hooks/useCopy.ts
│  ├─ lib/validation.ts         # client and pricing input validation
│  ├─ pricing/
│  │  ├─ engine.ts              # deterministic pricing rules
│  │  ├─ quote.ts               # quotation and share-summary builder
│  │  ├─ format.ts
│  │  ├─ labels.ts
│  │  └─ types.ts
│  ├─ App.tsx
│  ├─ index.css                 # brand tokens, layout, responsive and print CSS
│  └─ main.tsx
├─ scripts/responsive-check.mjs # Playwright desktop/tablet/mobile + PDF checks
├─ docs/pricing-rules.md        # workbook mapping and corrections
├─ index.html
├─ vercel.json
└─ README.md
```

The existing `Kenvas_Kreative_Pricing_Quotation_FIXED.xlsx` file remains in the
local project folder for reference but is excluded from Git by `.gitignore`.
Do not place it in `public/` or upload it to a public repository.

## Local development

Requirements:

- Node.js 20 or newer
- npm

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually <http://localhost:5173>.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run build` | Type-check and create the production `dist/` build |
| `npm run preview` | Preview the production build locally |
| `npm run test:responsive` | Build-dependent Playwright checks for desktop, tablet, mobile, and A4 PDF |

### Responsive / print checks

`npm run test:responsive` starts a Vite preview server, uses an installed
Chrome or Edge, and writes screenshots plus `quotation-a4.pdf` to `artifacts/`
(ignored by Git).

It expects a production build first:

```bash
npm run build
npm run test:responsive
```

If Chrome/Edge is installed in a non-standard location, set `CHROME_PATH` to the
executable path before running the command.

## Updating services and pricing

All public pricing configuration lives in **`src/data/pricing.ts`**:

- `SERVICES` — 23 services with category, pricing method, base fee, unit rate,
  included quantity, included revisions, complexity amounts, rush/express fees,
  and whether photo editing is already included.
- `ADD_ONS` — configured add-on rates and whether each is publicly selectable.
- `QUOTE_TERMS` — payment terms, validity period, and disclaimers.
- `src/config/business.ts` — email, Facebook, tagline, and location.

The calculation itself is in `src/pricing/engine.ts`. Do not duplicate formulas
in React components.

### Important pricing safeguards

The following are deliberate corrections to workbook double-charging paths:

- Copywriting and formatting are charged through **content status** only.
- Photo editing is charged through **photo status** only, except on the Photo
  Editing service where it is already included.
- Extra revisions use the dedicated **Extra revisions** field only.
- Additional variations/sizes use the dedicated **variations** field only.
- Fixed-price services do not multiply the base fee by quantity.
- Custom-price projects require manual review and show no automatic total.
- Discounts are capped at the subtotal and cannot make the total negative.

Read [docs/pricing-rules.md](docs/pricing-rules.md) for the full workbook mapping,
the exact correction list, and known limitations.

### Before changing rates

1. Confirm the change against the private workbook.
2. Update `src/data/pricing.ts` only.
3. Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
4. Run `npm run test:responsive` if layout changed.
5. Confirm the quotation preview reflects the new values.

The workbook rates may be placeholders; they are preserved as configurable
settings rather than presented as verified market prices.

## Privacy and request workflow

- All calculation and quotation generation happen in the browser.
- Nothing is sent, stored, or emailed automatically.
- The request flow provides an email draft, Facebook link, copy-summary action,
  and print/Save-as-PDF path.
- The prefilled email uses the verified business email from
  `src/config/business.ts`.
- Client details remain in the browser until the client chooses to share them.

A backend or form service can be added later without rewriting the pricing
engine. Replace the handoff step in `RequestDialog` with an API form submission
and keep the same quotation data object.

## Production build

```bash
npm run build
npm run preview
```

The production output is `dist/`. The app has no runtime dependency on local
Windows paths, environment variables, or a backend.

## Manual Vercel deployment

The project is prepared for manual deployment by the repository owner. It has
not been deployed automatically.

1. Push the completed project to the `main` branch of
   `IvanKenChua/KKquotation`.
2. Log in to Vercel.
3. Import the `IvanKenChua/KKquotation` repository.
4. Confirm the Vite settings:
   - Framework preset: **Vite**
   - Build command: **`npm run build`**
   - Output directory: **`dist`**
   - Install command: **`npm install`**
   - Node.js: 20 or newer
5. Deploy the project.
6. Open the generated Vercel URL and verify:
   - the service list and search filters load;
   - selecting a fixed and a per-unit service updates the total;
   - a custom service shows manual review instead of a fake total;
   - the quotation preview updates with client/project details;
   - Print / Save PDF produces a readable A4 document;
   - the request dialog does not claim anything was sent automatically;
   - mobile layout has no horizontal scroll.

`vercel.json` already declares the Vite framework, build command, output
directory, install command, and an SPA fallback rewrite.

No deployment URL is provided because deployment has not been performed.

## Known limitations

- Static client-side pricing means the configured rates are present in the
  production JavaScript bundle, even though the UI does not expose the complete
  rate table.
- Quotation numbers are generated locally (`KK-YYYYMMDD-XXXX`) and are not
  centrally issued.
- There is no login, admin panel, submission database, email delivery, or
  payment handling.
- The workbook contains 23 services; example categories in the original brief
  that are absent from the workbook were not invented.

## License / ownership

Internal project for KENVAS KREATIVE. Pricing content and brand assets belong to
KENVAS KREATIVE.
