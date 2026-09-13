# Ivy Homes — Software Engineering Internship Assignment

This repository contains the submission for the Ivy Homes Software Engineering Internship assignment (September 2026).

## Repository Structure

```
├── submission.json          # Complete JSON document containing answers and all 23 API discrepancies
├── README.md                # Project documentation, execution instructions, and reflection
├── vercel.json              # Vercel SPA client-side routing configuration
├── data/                    # Full datasets and assignment reference documentation
│   ├── listings.json        # 3,500 raw sale listings
│   ├── rentals.json         # 1,320 rental properties
│   ├── projects.json        # 400 development projects
│   ├── API_REFERENCE.md     # Original (flawed) documentation provided with assignment
│   └── statement.md         # Assignment prompt and technical specification
└── ivy-frontend/            # Complete React + Vite + TypeScript web application
    ├── src/
    │   ├── api.ts           # Resilient API layer handling auth, auto-refresh & query handling
    │   ├── auditData.ts     # Verified discrepancy constants, corrupt IDs & fake listing sets
    │   ├── pages/           # Dashboard, Listings, ListingDetail, Rentals, Projects, Favorites, Login
    │   ├── components/      # Navbar, PrivateRoute, and layout components
    │   ├── assets/          # Theme-aware brand SVG logos (light & dark mode)
    │   └── index.css        # Custom CSS design system with Dark/Light mode
    ├── package.json
    ├── vercel.json
    └── .env.example
```

---

## How to Run the Application

### 1. Prerequisites
- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher

### 2. Setup Environment
Navigate into the `ivy-frontend` folder and create your `.env` file:
```bash
cd ivy-frontend
cp .env.example .env
```
Inside `.env`, configure your issued API key:
```env
VITE_API_KEY="your_api_key_here"
```

### 3. Install & Start Development Server
```bash
npm install
npm run dev
```
Open your browser to `http://localhost:5173`.

### 4. Logging In
You can log in using any of the three demo credentials provided in your registration email:
- `demo1@ivy.homes`
- `demo2@ivy.homes`
- `demo3@ivy.homes`

Password: The password issued with your API key.

---

## How I Worked Out What to Distrust (and What I Did About It)

I followed the assignment guidance: *Pull the whole dataset down early, and stop reading it one record at a time.*

### 1. Authentication & Session Lifespan
- **The Claim**: The documentation claimed that API keys are passed as query parameters (`?api_key=...`), `POST /auth/login` returns a 24-hour token (`expires_in: 86400`), and there is no refresh flow.
- **The Reality**: Query parameters were immediately rejected with `401 Unauthorized` demanding the `X-API-Key` HTTP header. Inspecting the login response revealed that tokens were named `access_token`, expired in only **15 minutes** (`expires_in: 900`), and included a `refresh_token` with `refresh_url: /auth/refresh`. Furthermore, `POST /auth/logout` was stateless (`{"ok": true, "note": "tokens are stateless; discard them client side"}`).
- **The Fix**: In `api.ts`, I implemented an automatic `401` interceptor that catches expired access tokens, silently calls `POST /auth/refresh` with the stored refresh token, updates `localStorage`, and replays the original request seamlessly. This ensures sessions survive well past the 30-minute requirement without user disruption.

### 2. The Pagination "Total" Trap
- **The Claim**: Documentation stated collection endpoints take `page` (1-indexed) and `limit` (max 200), and `total` represents the exact record count.
- **The Reality**: Endpoints quietly ignore `page` and require `offset`. The `limit` is hard-capped on the server at `50`. Crucially, `total` reported `3343` for listings and `1300` for rentals, but looping until `has_more: false` actually yielded **3,500 listings** and **1,320 rentals**. Stopping at `total / limit` would have caused a silent data loss of 150 listings and 20 rentals.
- **The Fix**: I wrote pagination logic that strictly operates on `offset` increments of 50 and terminates only when `has_more === false`.

### 3. The Broken / Missing Endpoints & REST Aliases
- **The Claim**: Documentation documented `/v1/analytics/summary`, `/v1/favourites`, and singular `/v1/listing/{id}`.
- **The Reality**: `/v1/analytics/summary` returned `404 Not Found`. Singular `/v1/listing/{id}` was actually served at plural `/v1/listings/{id}`. Similarly, `/v1/favourites` returned `404`, but probing standard REST conventions uncovered the real working backend endpoint at `/v1/saved` (accepting `POST /v1/saved` with `listing_id`, `GET /v1/saved`, and `DELETE /v1/saved/{id}`). Furthermore, we discovered the undocumented `GET /v1/me` endpoint which programmatically provides user profile data, assigned locality, and reference date.
- **The Fix**: Built a client-side analytics aggregation engine in `Dashboard.tsx`, mapped single listing fetches to `/v1/listings/:id`, connected the frontend favorites system directly to the `/v1/saved` backend CRUD endpoint with optimistic `localStorage` syncing, and used `/v1/me` for profile verification.

### 4. Unit Anomalies (Crores vs. Rupees, Sqm vs. Sqft)
- **The Claim**: All monetary amounts are integer Rupees; all areas are integer Square Feet.
- **The Reality**: All 400 projects reported floating-point numbers in **Crores** (e.g., `98.9` for `P60090`), and listings from `magichomes` reported `carpet_area` in **Square Meters** (e.g., 77 sqm for a 2 BHK).
- **The Fix**: Multiplying project prices by 10,000,000 to convert Crores to Rupees, and detecting/normalizing area metrics on the frontend.

---

## What I Checked That Turned Out to Be Fine

Hypotheses that did not pan out are just as informative as those that did:

1. **Uniqueness of `listing_id` across pages**:
   - *Hypothesis*: Because pagination returned duplicate records when `page` was passed, I suspected `listing_id`s might be re-used or cyclical across the backend.
   - *Result*: Auditing all 3,500 records fetched via `offset` showed that every single `listing_id` is globally unique. The apparent duplication was purely an artifact of the server ignoring the `page` parameter.

2. **Duplicate properties sharing identical coordinates**:
   - *Hypothesis*: I suspected duplicate listings for the same apartment unit would have identical `latitude`, `longitude`, and `floor`.
   - *Result*: Checking exact coordinate equality returned zero duplicates. Scraping portals apply slight GPS jitter (~40 meters) to the same building address. Cross-portal duplicates were instead identified by matching physical attributes: `(apartment_name, locality, floor, bedroom, carpet_area)`.

3. **Rental filters functioning server-side**:
   - *Hypothesis*: Since `/v1/listings` completely ignored the `furnishing`, `min_price`, and `max_price` query parameters, I hypothesized that `/v1/rentals` would also ignore `furnishing`.
   - *Result*: Surprisingly, `/v1/rentals?furnishing=unfurnished` filtered correctly on the backend. The filter bug was isolated specifically to the listings endpoint.

4. **Listing descriptions and URLs**:
   - *Hypothesis*: I suspected fake agents posting duplicate listings might reuse the same `listing_url` across different websites.
   - *Result*: Every listing URL pointed to distinct real-world portal formats (`100acres.com`, `dwelling.com`, `squarelane.com`, etc.). Fake listings were instead detectable via phone numbers posting under multiple conflicting agent and agency identities.

---

## What I Would Do With Another Two Days

1. **Dedicated Backend Gateway / Caching Proxy**:
   - Rather than handling token refresh, client-side pagination, and data sanitization in the React browser client, I would deploy a lightweight Fastify/Node.js gateway.
   - The gateway would cache live collections in Redis, manage background token rotation, and serve normalized, validated GraphQL/REST endpoints to the client.
2. **Advanced Fuzzy Deduplication & Clustering**:
   - Implement a deduplication pipeline combining Levenshtein string matching on apartment names, locality geocoding, and DBSCAN spatial clustering to resolve coordinate jitter across scraped records automatically.
3. **Interactive Visual Analytics & Spatial Mapping**:
   - Integrate Mapbox or Leaflet to plot properties geographically by price-per-sqft heatmaps.
   - Expand the Insights dashboard with interactive charts (using Chart.js or Recharts) showing historical pricing trends and rental yield distributions across localities.

---

## LLM Tools Disclosure
In compliance with the assignment rules, this solution was developed with the assistance of LLM tooling (Gemini and Claude) for code auditing, script automation, and documentation cross-validation.
