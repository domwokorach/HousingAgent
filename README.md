# Housing Agent

A property search application for finding homes to rent or buy across the UK and
connecting with housing agents. Built with Next.js 16 (App Router, Turbopack),
React 19, TypeScript, Tailwind CSS v4 and Zod.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # eslint
npm test           # vitest (unit + integration)
npm run test:watch # vitest in watch mode
```

## Routes

| Route | What it does |
| --- | --- |
| `/` | Home: hero search (rent/buy, location or postcode, price range, bedrooms, property type), featured properties, popular areas, agent preview |
| `/properties` | Postcode search across both rent and sale, with a radius selector |
| `/properties/[propertyId]` | Full listing: gallery, key facts, description, affordability, map, agent panel, contact form |
| `/properties/create` | Create a listing (landlord, seller or agent accounts) |
| `/properties/edit/[propertyId]` | Edit a listing's details and manage its photos |
| `/rent` · `/buy` | The same search experience with the intent locked |
| `/agents` | Find an agent by name, postcode, town, distance and specialisation |
| `/agents/[agentId]` | Agent profile: contact details, areas covered, current listings, reviews, branch map |
| `/saved` | Your shortlist, split by rent and sale |
| `/account` | Dashboard: shortlist, listing and enquiry counts, plus enquiry history |
| `/account/profile` | View and edit your details |
| `/account/my-properties` | Your listings, with the photo manager |
| `/account/settings` | Account summary and change password |
| `/account/delete` | The permanent account deletion flow |
| `/auth/login` · `/auth/register` | Sign in and sign up |
| `/auth/forgot-password` · `/auth/reset-password` | Password recovery |
| `/terms` | Terms and conditions, including the privacy section |
| `/properties/live` | Live UK listings from the Homedata feed, with a map |
| `/api/geocode` | Server route: forward-geocodes a postcode to coordinates |
| `/api/properties` | Server route: proxies the Homedata live-listings search |

Routes from the previous layout (`/login`, `/register`, `/search`,
`/property/:id`, `/account/properties`) are kept working with permanent
redirects in `next.config.ts`.

## Architecture

The app is layered so the storage decision is contained in one place.

```
components  →  hooks  →  services  →  lib/db.ts
```

- **`src/components`** never touch storage. They call hooks.
- **`src/hooks`** subscribe to the store through `useSyncExternalStore` for
  reads, and call services for writes.
- **`src/services`** are `async` and return a `Result<T>` envelope — the same
  shape a `fetch` would give back. They own validation and authorisation.
- **`src/lib/db.ts`** is the data layer: one in-memory object mirrored into
  `localStorage`, exposed as an external store.

Giving this app a real backend means rewriting the six files in `src/services`
to call HTTP endpoints. Nothing above that layer changes.

### Search

`src/lib/search.ts` filters on intent, price range, bedrooms and property type,
then scores each result by text relevance and proximity. A full or partial
postcode (`SW11 3AB`, `SW11`, `SW1`) resolves through the outward-code table in
`src/lib/postcode.ts` to a point, and results are filtered by great-circle
distance within the chosen radius. Town names fall back to text matching.
Results sort by relevance, newest, or price in either direction. All search
state lives in the URL, so results are linkable and the back button works.

### Prices

`src/lib/mortgage.ts` holds the money maths, kept away from the UI so it can be
tested on its own:

- **Rentals** — monthly rent, weekly equivalent (`rent × 12 ÷ 52`), deposit at
  the Tenant Fees Act cap (5 weeks, or 6 where annual rent reaches £50,000), an
  estimate of monthly household bills, and the total due before move-in.
- **Sales** — an interactive calculator over deposit percentage, interest rate
  and term, producing the loan amount, LTV, monthly repayment on the standard
  capital-and-interest formula, total interest, and stamp duty at current
  England & NI residential rates with a first-time-buyer option.

These are illustrations, not quotes or financial advice, and the UI says so.

### Validation

Every form is validated by a Zod schema in `src/validation`, shared between the
component and the service that receives the data. `validate()` turns a schema
failure into a `field → message` map that drops straight into form state.

### Maps and geocoding

Mapbox GL JS renders the interactive maps: a single marker with a popup on a
property page and an agent's branch page (`PropertyMap`), and every result with
a price/bedroom card and a **View Property** link on the search page
(`PropertiesMap`), inside a dashed ring showing the search radius.

**Mapbox is optional.** With no token the app falls back to `SchematicMap` — the
SVG map that plots markers in true relative position over a stylised grid — so a
fresh clone still runs and still shows where things are. The components also
fall back at runtime if GL JS fails to load or the token is rejected, rather
than leaving a broken grey box.

To turn it on, create a free account at
[account.mapbox.com](https://account.mapbox.com) and put the tokens in
`.env.local` (git-ignored):

```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="pk.…"   # public token, URL-restricted
MAPBOX_SERVER_TOKEN="pk.…"               # optional, separate server-side token, not URL-restricted
```

Two distinct tokens, deliberately. GL JS authenticates from the browser, so
the public token is readable by anyone who loads the page — create a
dedicated public token and restrict it to your domains in the Mapbox
dashboard. The geocoding route prefers the server one: also a public-scope
(`pk.`) token (Mapbox's geocoding v6 endpoint has no separate "geocoding"
scope), but deliberately *not* URL-restricted, since server-side requests
don't carry the browser Referer that URL restrictions check — a restricted
token would get rejected there. Splitting them gets separate per-token usage
stats and limits the blast radius if one leaks, isn't billed against a token
strangers can lift out of the bundle, and doesn't create separate billing —
both still bill the same Mapbox account.

`mapbox-gl` is proprietary (Mapbox TOS) and billed per map load above the free
tier, so it is a commercial dependency, not just a technical one.

Map overlays follow the theme: controls, attribution and popups are restyled,
and properties are marked with rounded cream price pills that invert to dark
brown when selected, rather than Mapbox's default pins. The basemap defaults to
`light-v11` — override it with `NEXT_PUBLIC_MAPBOX_STYLE`.

Live listings carry their own `geopoint`, so they go straight onto the map
without being geocoded.

**Coordinate order.** Mapbox follows GeoJSON and orders coordinates
`[longitude, latitude]` — the reverse of how a `Property` stores them. Rather
than rename the model, every hand-off goes through `toLngLat()` / `fromLngLat()`
in `src/lib/mapbox.ts`, so the swap happens in exactly one place and is covered
by tests.

**Geocoding happens once, at write time.** When a landlord or agent enters a
postcode on the listing form, it is resolved on blur — the form shows the place
it found so they can check it before saving — and the coordinates are stored on
the property. Rendering a map never calls the geocoder. `/api/geocode`
validates the postcode shape before spending a request, caches results for the
life of the process under a canonical key (`SW11 3AB` and `sw113ab` are one
entry), and falls back to the local outward-code table if Mapbox errors.

The search flow is the one this enables:

```
postcode → geocode → coordinates → radius filter → cards + map markers
```

### Live listings (Homedata)

`/properties/live` searches properties currently on the market through the
[Homedata](https://homedata.co.uk) feed. It is **optional**: with no key the
page explains that the feature is off and the rest of the app is unaffected.

```bash
# .env.local — server-side only, never NEXT_PUBLIC_
HOMEDATA_API_KEY="prefix.secret"
```

All traffic goes through `src/app/api/properties/route.ts` so the key stays on
the server. That route turns a place name into a boundary id, searches
listings, and maps the response onto `LiveListing`.

**Cost.** Measured against the live API, one uncached search costs **6 tokens
before any listings**: the boundary lookup is 1 and the listings search is 5,
on top of Homedata's per-listing charge. The published spec describes the
boundary lookup as free and open — it is neither.

So the route caps `page_size` at 50 (default 12), caches boundary lookups for
the process lifetime and searches for five minutes, and the UI only searches
when somebody asks — never on mount. When the account runs out of credit the
provider answers `402 insufficient_tokens`; that is logged with the top-up link
and the visitor sees a neutral "temporarily unavailable" instead. No provider
message — API key prefixes, balances, billing links — is ever forwarded to the
browser.

**Live listings are not `Property`.** The feed carries no description, floor
area, EPC, availability date or postcode. Rather than pad those out with
placeholders and show invented facts as real, `LiveListing` is its own narrower
type with its own card, and the shared map takes a minimal `MapPin` shape that
both satisfy.

Things found by probing the live API that differ from its documentation:

- The OpenAPI document calls `/boundaries/autocomplete/` "open access — no API
  key required". The deployed endpoint returns **403** without a key and
  **charges 1 token** with one. Both calls send the key.
- `transaction_type` is `Sale` | **`Rental`** — not "Rent".
- `bedrooms` is a **minimum**, not an exact match.

The document also carries no response schemas, so field names could not be
verified ahead of a live call. `src/lib/homedata.ts` therefore *parses* rather
than assumes: unknown fields are ignored, missing ones become `null` instead of
leaking `undefined` into the UI, non-https image URLs are dropped, and a
listing that cannot be parsed is skipped rather than taking the page down.

### Images

Property photography is a set of first-party SVG illustrations in
`public/images/properties/`, covering exterior, living room, kitchen, bedroom,
bathroom, garden, parking and other spaces in three coordinated palettes. They
are vector and a couple of KB each, so they are served with a plain `<img>` —
`next/image` would add nothing, and its optimiser refuses SVG unless
`dangerouslyAllowSVG` is enabled, which isn't worth doing for assets that need
no optimisation. Landlords and agents can also upload their own photos.

### Proxy

`src/proxy.ts` sets security headers (CSP, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy`) on every page response. The CSP explicitly allows
`api.mapbox.com`, `events.mapbox.com` and `worker-src blob:` — without those,
GL JS fails silently.

> Next.js 16 renamed Middleware to Proxy — the file is `proxy.ts`, not
> `middleware.ts`. See `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.

## Data and accounts: read this before deploying

**This application has no backend.** Everything is client-side:

- Listings and agents are sample data in `src/lib/seed.ts`.
- Accounts, sessions, shortlists, user listings and enquiries live in the
  browser's `localStorage`, behind `src/lib/db.ts`. Nothing is sent anywhere.
- Passwords are reduced to a short, non-reversible-looking digest purely so they
  aren't sitting in storage as plain text. **This is not password security** —
  the digest is fast, unsalted per user and computed in the browser. A real
  deployment must authenticate on a server, hash with bcrypt or argon2, and
  never hold credentials in the browser at all.
- `RequireAuth` is a UI affordance, not a security boundary. There is no
  server-side session for `proxy.ts` to check.
- "Send reset link" shows the confirmation a real flow would, but sends nothing;
  `resetPassword` accepts only a hard-coded demo token and says so.
- Live listings from Homedata are real when a key is configured. Everything
  else on this page — the 24 seed properties, the agents, the accounts — is
  sample data.
- Without a Mapbox token the map is a schematic SVG, and postcodes resolve from
  a local table of ~34 outward codes rather than the real thing. With a token,
  maps and geocoding are real; everything else on this list still applies.

Consequences worth knowing: accounts don't follow you between browsers or
devices, clearing site data wipes everything, and uploaded photos are capped at
400KB each because they are stored as data URLs inside a ~5MB storage quota.

To make this production-ready: rewrite `src/services/*` against a real API, move
`src/lib/seed.ts` behind a database, add a hosted auth provider, swap the
schematic map for a mapping SDK, and move uploads to object storage.

## Project layout

```
public/
  images/{properties,agents,users,logo}/   illustrations, logos, avatars
  icons/                                   app icons
src/
  app/                                     routes — thin files that compose components
    api/geocode/                           postcode -> coordinates
    api/properties/                        Homedata live-listings proxy
  components/
    layout/      Header, Navbar, Footer, Sidebar
    properties/  cards, grid, gallery, details, form, filters, map, image manager
    agents/      card, profile, directory search, contact form
    search/      search bar, postcode search, price and location filters, results
    mortgage/    rent and mortgage calculators
    auth/        login, register, password and delete-account forms, route guard
    account/     dashboard, profile, password, listings, enquiries
    maps/        PropertyMap, PropertiesMap, SchematicMap (the no-token fallback)
    ui/          one component per file: Button, Input, Modal, Card, Alert, …
  hooks/         useAuth, useProperties, useAgents, useSearch, useFavourites
  services/      property, agent, auth, user, postcode, favourite, geocode,
                 live-listings
  lib/           db, auth, postcode, mortgage, mapbox, homedata, search, seed,
                 upload, utils
  types/         property, agent, user, search, listing, api
  validation/    zod schemas: auth, property, agent, account
  constants/     propertyTypes, accountTypes, navigation
  proxy.ts       security headers
tests/
  unit/          mortgage, postcode, search, validation
  integration/   auth, property and favourite services
```

## Tests

170 tests covering the parts where a mistake is expensive: the money maths,
postcode parsing and formatting, coordinate order, search filtering and
sorting, the validation schemas, the geocoding route (both the Mapbox and
fallback branches, with `fetch` stubbed), the Homedata normaliser and proxy
route (auth on both calls, the rent/Rental mapping, the page-size cap, caching,
and every failure mode), and the service layer end to end
(registration, sign-in, listing CRUD, shortlists, and the account-deletion
cascade).

```bash
npm test
```

There is no `tests/e2e` suite yet — Playwright would be the natural fit, and the
flows worth covering are search → property → enquiry, and register → list a
property → delete the account.

Not covered: that Mapbox tiles actually draw, and that real Homedata listings
come back correctly. Both need real credentials. Each was verified as far as it
could be — requests reach the provider, a rejected key degrades cleanly, and
the UI renders correctly against a stubbed response.

## Theme

A cream and white palette, defined entirely as tokens at the top of
`src/app/globals.css`. Components reference token names (`bg-surface`,
`text-ink-muted`, `border-line`) rather than raw hex, so the whole look can be
retuned from that one block.

| Role | Token | Value |
| --- | --- | --- |
| Page background | `canvas` | `#FFFDF7` |
| Cards, inputs, nav | `surface` | `#FFFFFF` |
| Secondary background | `surface-2` | `#F7F1E8` |
| Soft cream fills, badges | `cream` | `#F3E8D7` |
| Footer | `footer` | `#EEE4D5` |
| Headings, prices | `ink` | `#2F2A24` |
| Body copy | `ink-body` | `#514A43` |
| Secondary text | `ink-muted` | `#6F665C` |
| Card metadata | `ink-subtle` | `#6B6157` |
| Borders | `line` | `#E7DED1` |
| Control borders | `line-strong` | `#B9A180` |
| Primary button | `brand` / `brand-strong` | `#D8C3A5` / `#C8AE8B` |
| Links, focus ring | `link` / `focus` | `#74614E` |

Type is [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans),
self-hosted by `next/font`. Radii come from `--radius-control` (10px) and
`--radius-card` (16px); depth from `--shadow-soft`, `--shadow-lift` and
`--shadow-pop`, all built on `rgba(70, 55, 40, …)` so shadows stay warm.

**The theme is light only.** The palette is a single cream scheme, so
`color-scheme: light` is set and there is no dark variant — a cream-on-dark
inversion would be a different design, not a translation of this one.

### Accessibility notes

Text and status colours were measured against their real backgrounds and all
clear WCAG AA (4.5:1), including the muted status colours and the secondary
text on cream. The focus ring is `#74614E` rather than the beige brand colour,
which only reaches 1.7:1 on white and would be invisible as an indicator.

Two deliberate adjustments to the supplied palette:

- Placeholder text moved from `#A79D92` to `#9A8F82` (2.7:1 → 3.2:1).
- Secondary detail text moved from `#756B61` to `#6B6157` so it clears 4.5:1 on
  cream card backgrounds as well as white.

One known gap: form control borders sit at **2.5:1** against white, below the
3:1 that WCAG 1.4.11 asks of a component boundary. Reaching 3:1 needs roughly
`#8C7F6E`, which is visibly greyer than the soft cream the design calls for.
The compromise here keeps the border clearly perceptible (it was 1.7:1 as
originally specified) and pairs it with a strong focus ring and a permanent
visible label on every field. To go fully compliant, change one line:

```css
--color-line-strong: #8c7f6e;
```

### Deliberate exceptions

- **EPC ratings** keep their green-to-red scale, desaturated to sit calmly in
  the palette. A to G is a statutory rating and the progression carries meaning,
  like a traffic light.
- **Error, success and warning** are muted sage, amber and red rather than
  cream, so a failed form is still unmistakable.

## Notes

- Forms validate on submit, show a summary plus per-field messages, mark fields
  with `aria-invalid`, and move focus to the first problem.
- The account deletion flow is deliberately slow: it explains what will be
  removed, requires the password, then asks for a final confirmation, with
  Cancel available at every step.
# HousingAgent
