# Pricing rules and workbook mapping

## Source of truth

The initial service catalogue, rates, included quantities, complexity adjustments,
rush/express fees, add-on rates, and quotation terms were extracted from:

`Kenvas_Kreative_Pricing_Quotation_FIXED.xlsx`

The workbook itself is intentionally **not** committed to this repository. Its
data is represented in `src/data/pricing.ts`. The public UI does not render a
complete rate table, but because this is a static client-side calculator, the
configured rates are present in the production JavaScript bundle. If the rate
values must remain secret, move the pricing calculation behind a server/API.

## Workbook sheets reviewed

- `Quotation Calculator`
- `Pricing Settings`
- `Client Quotation`
- `Quotation History`
- `Quick Guide`

The formulas in `Quotation Calculator` were inspected directly rather than
relying on worksheet labels.

## Service catalogue

The workbook contains **23 services**:

1. Logo Design
2. Brand Identity Design
3. Business Card Design
4. Social Media Graphics
5. Pubmats and Promotional Posters
6. Facebook Cover Design
7. YouTube Thumbnail Design
8. Menu Design
9. Flyer Design
10. Brochure Design
11. Tarpaulin and Banner Layout
12. Product Label and Packaging Design
13. Wedding Invitation Design
14. Birthday Invitation Design
15. Certificate Design
16. Resume and CV Layout
17. Calendar Design
18. Lanyard Design
19. Sublimation Design
20. T-Shirt and Uniform Design
21. Presentation and PowerPoint Design
22. Photo Editing
23. Other Custom Design

The example list in the brief included “Publication and Editorial Layout” and
“Magazine or Literary Folio Layout”. Those two categories are **not** in the
actual workbook, so they were not invented for the initial catalogue. Work of
that kind can be requested through `Other Custom Design`.

## Calculation order

All calculations are implemented in `src/pricing/engine.ts`.

1. **Base fee** — the configured starting fee for the selected service.
2. **Additional quantity** — only for per-unit services:
   `max(0, requested quantity - included quantity) × unit rate`.
   Fixed-price services never multiply the base fee by quantity.
3. **Variations / sizes** — `max(0, variations - 1) × service unit rate`.
4. **Complexity adjustment** — exactly one of Basic, Standard, or Complex,
   using the service-specific amounts from the workbook. The amounts are not
   cumulative.
5. **Content and photo charges** — copywriting, formatting, or photo editing
   from the configured status fields.
6. **Additional services** — extra revisions, variations, and publicly
   selectable add-ons at their configured rates.
7. **Rush or Express** — exactly one urgency fee, using the selected service’s
   configured amount. Standard urgency adds zero.
8. **Subtotal** — sum of the above.
9. **Discount** — fixed amount or percentage, capped so the total cannot become
   negative.
10. **Estimated total** — `max(0, subtotal - discount)`, rounded to cents.

## Included quantities and revisions

- Every per-unit service has an `includedQuantity`. Units within that allowance
  add no quantity charge.
- `includedRevisions` comes from the workbook and is displayed on the quotation.
- Extra revisions are charged at the configured extra-revision rate and added to
  the total revision count.

## Pricing methods

- **Fixed price** — one base package. A requested quantity above one is shown as
  a warning; it is not silently multiplied into the price.
- **Per unit** — base fee plus billable units beyond the included quantity.
- **Custom price** — no automatic price is presented. The project is flagged for
  manual review and the UI asks the client to submit the scope.

## Documented workbook inconsistencies and corrections

### 1. Copywriting and formatting could be charged twice

The workbook adds a content-status charge and also allows matching add-ons.

**Correction:** content status is the single source for copywriting/formatting.
The matching add-ons are not shown in the public add-on picker. If one is passed
programmatically, it is ignored with a warning and charged once through the
content status.

### 2. Photo editing could be charged twice

The same duplication existed between the photo status and the Photo Editing
add-on. The Photo Editing service also includes editing already.

**Correction:** photo status is the single source for photo editing on other
services. For `Photo Editing`, the photo status is ignored and no separate photo
charge is added.

### 3. Extra revisions existed as both a field and an add-on

**Correction:** the dedicated extra-revisions field is the only path. The
“Extra Revisions” add-on is configured for traceability but is not publicly
selectable.

### 4. Multiple design sizes duplicated the variations formula

The workbook charges `(variations - 1) × unit rate` in the main formula and also
offers a “Multiple Design Sizes” add-on at 100 per size.

**Correction:** the variations field is the single path, using the workbook’s
main-formula unit rate. The add-on is not publicly selectable.

### 5. Fixed-price services accepted a quantity without explaining the effect

**Correction:** fixed services ignore quantity multiplication and show a clear
message that additional items may require a separate quotation.

### 6. Custom-price services still showed a calculated base amount

**Correction:** `Other Custom Design` is treated as a manual-review project. The
engine returns no total, no line items, and a personalized-review message. No
arbitrary amount is presented as confirmed.

### 7. The add-on lookup excluded Formatting in one formula

**Correction:** Formatting has a configured rate (100/project) and is charged
through the content status. No formula relies on a partial lookup range.

### 8. Discounts could theoretically exceed the subtotal

**Correction:** fixed discounts are capped at the subtotal. Percentages are
limited to 0–100. Invalid or negative values are rejected or ignored with a
warning, and the final total is never negative.

### 9. Missing rates were not consistently blocked

**Correction:** if a service has no usable base or unit rate, the engine treats it
as requiring manual review rather than showing a zero or partial price.

## Quotation rules

- Payment terms: **50% deposit, 50% upon completion** (from the workbook).
- Quotation validity: **14 days** (application default; configurable in
  `QUOTE_TERMS`).
- Quotation reference: `KK-YYYYMMDD-XXXX`, generated in the browser.
- Format: A4 print layout with itemized Charge / Description / Amount columns.
- The quotation is explicitly labeled an estimate and not a confirmed booking
  or final invoice.
- Design-only scope disclaimer matches the workbook intent: printing,
  production, paid assets, delivery, and other services are excluded unless
  listed.

## Rate configuration warning

The workbook rates may be placeholders. They are preserved exactly as
configurable settings and are **not** presented as verified market prices. Review
and update them before relying on the public calculator for commercial quotes.

## Updating pricing

1. Edit rates, included quantities, complexity amounts, urgency fees, revisions,
   add-on rates, and terms in `src/data/pricing.ts`.
2. Keep `includedQuantity` at `1` for fixed and custom services unless the
   workbook meaning changes.
3. If a new add-on should be client-selectable, set
   `publiclySelectable: true` and give it a `scope`.
4. Do not add a second control for copywriting, formatting, photo editing, extra
   revisions, or design sizes — those are handled by dedicated fields to avoid
   double-charging.
5. Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
6. Check the itemized preview in the browser and re-run
   `npm run test:responsive` if layout changed.

## Known limitations

- No backend, database, email delivery, or submission storage is included.
- Quotation numbers are unique enough for a client-side reference, but they are
  not centrally issued or guaranteed collision-free.
- The site works as a static Vite SPA; no login or admin pricing console is
  exposed.
