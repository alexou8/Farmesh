# 🌱 Farmesh

> **AI-assisted coordination dashboard for Canadian local food networks.**  
> Connecting local farmers, market vendors, and Canadian buyers through intelligent supply and demand matching — powered by [Backboard.io](https://backboard.io) AI agents.

Farmesh is a lightweight coordination platform built to strengthen Canadian local food systems. It helps nearby farms and businesses coordinate produce supply and demand more efficiently — reducing food waste, helping Canadian farmers sell more of their harvest, and making it easier for local businesses to source fresh, nearby food.

> **Not a marketplace.** Farmesh is an AI coordination layer with transparent reasoning — every match shows *why* it was proposed, *what preferences* were used, and *what tradeoffs* were made.

---

## 🗺️ Three Main Surfaces

| Surface | Who it's for | What it does |
|---|---|---|
| **Farmer Dashboard** | Farms, market growers, greenhouse operators, orchards | Post supply listings, view matches, track listing status |
| **Buyer Dashboard** | Restaurants, grocers, cafes, caterers, food co-ops | Post demand requests, confirm split orders, view ranked matches |
| **Admin / Demo Dashboard** | Admins, judges, demo viewers | Live system state, AI agent timeline, memory insights, regional stats |

---

## ✨ Key Features

- **Free-text or structured input** — farmers and buyers can submit in plain language; AI agents parse and normalize it
- **AI parsing preview** — before saving, users see the structured interpretation of their input
- **Exact & split matching** — one vendor or two-vendor split fulfillment with scored proposals
- **Product family substitutions** — e.g. "salad greens" → baby greens, spinach, mixed greens, arugula
- **Local-first matching** — prioritizes nearby Canadian suppliers by province, city, and delivery radius
- **Buyer memory** — the Demand Interpretation Agent remembers preferences (e.g. organic preference, substitution policy)
- **Transparent AI reasoning** — every match shows parsed data, match rationale, memory used, locality logic, and tradeoffs
- **Live coordination** — status transitions from PROPOSED → CONFIRMED → FULFILLED with buyer/vendor notifications
- **Admin timeline** — visualizes every AI agent action and system event in real time

---

## 🤖 AI Agent Pipeline

All AI orchestration is handled by **Backboard.io** agents:

| Agent | Role |
|---|---|
| **Intake Agent** | Converts raw farmer/buyer free text into rough structured JSON |
| **Normalization Agent** | Standardizes product names, units, dates, organic flags, quality terms, and local region info |
| **Demand Interpretation Agent** | Reads normalized request + buyer memory → outputs hard constraints, soft preferences, substitution allowance, locality preference |
| **Matching Agent** | Finds candidate listings, scores them, proposes one best exact or split match with explanation |
| **Coordination Agent** | Handles status transitions, notifies buyer/vendors, updates match/listing/request records |

### Product Family Substitutions

| Requested | Accepted Substitutes |
|---|---|
| Salad greens | Baby greens, spinach, mixed greens, arugula |
| Cooking onions | Yellow onions, white onions |
| Tomatoes | Roma, San Marzano, heirloom |
| Apples | Gala, Honeycrisp, Ambrosia, McIntosh |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router, full-stack) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via [Supabase](https://supabase.com) |
| Auth | [Supabase](https://supabase.com) (SSR, role-based auth) |
| AI Orchestration | [Backboard.io](https://backboard.io) |
| Icons | [Lucide React](https://lucide.dev) |

---

## 📁 Project Structure

This is a monorepo with separate `frontend` and `backend` packages.

```
farmesh/
├── frontend/                   # Next.js application
│   ├── app/                    # Next.js App Router — pages and API routes
│   │   ├── actions/            # Server actions
│   │   ├── api/                # API route handlers
│   │   ├── auth/               # Auth pages
│   │   ├── buyer/              # Buyer dashboard pages
│   │   ├── farmer/             # Farmer dashboard pages
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Landing / home page
│   ├── components/             # Shared UI components
│   ├── data/                   # Seed data (Canadian vendors, buyers, listings, requests)
│   ├── lib/                    # Utilities and service clients
│   │   ├── auth.ts             # Auth helpers
│   │   ├── db.ts               # Database access layer
│   │   ├── listings.ts         # Listing helpers
│   │   ├── matchingPipeline.ts # AI matching logic
│   │   ├── requests.ts         # Request helpers
│   │   ├── supabase.ts         # Supabase client
│   │   └── supabase/           # Supabase SSR helpers
│   ├── types/                  # TypeScript type definitions
│   ├── middleware.ts            # Role-based route protection (Supabase SSR)
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   └── eslint.config.mjs
├── backend/                    # Backend services (AI agents, data, SQL)
│   ├── src/
│   │   └── agents/             # AI agent implementations
│   ├── data/                   # Backend seed / reference data
│   ├── sql/                    # SQL migrations and schema
│   └── README.md
├── package.json                # Root workspace package
└── package-lock.json
```

---

## 🗄️ Data Model

| Model | Description |
|---|---|
| `User` | Farmer, Buyer, or Admin role |
| `VendorProfile` | Farm details, location, organic cert, reliability score, delivery radius |
| `BuyerProfile` | Business type, location, preferences, substitution policy, local preference level |
| `Listing` | Vendor supply — product, quantity, unit, price (CAD), availability, status |
| `Request` | Buyer demand — product, quantity, required by date, preferences, status |
| `Match` | Proposed fulfillment — type (EXACT/SUBSTITUTE/SPLIT), score, explanation, status |
| `MatchLine` | Individual allocation lines within a match (one per vendor in a split) |
| `Notification` | Per-user notifications for match proposals and status updates |
| `MemoryFact` | Persistent buyer/vendor memory signals used by AI agents |

**Listing statuses:** `OPEN` → `PARTIALLY_MATCHED` → `MATCHED` → `EXPIRED`

**Request statuses:** `OPEN` → `PARTIALLY_FILLED` → `FULFILLED` → `CANCELLED`

**Match statuses:** `PROPOSED` → `AWAITING_CONFIRMATION` → `CONFIRMED` → `REJECTED` → `FULFILLED`

---

## 🌾 Key Demo Scenario

> An Ontario restaurant requests **100 lbs of salad greens, organic preferred**.

1. Buyer submits free-text request → **Intake Agent** parses it
2. **Normalization Agent** standardizes product, unit, and region
3. **Demand Interpretation Agent** reads buyer memory: *organic preference: high, allows substitutions: yes*
4. **Matching Agent** finds:
   - 🥬 Green Valley Farm (Ontario) — 60 lbs mixed baby greens
   - 🌿 Riverbend Produce (Ontario) — 40 lbs certified organic spinach
   - Proposes a **split match** from two nearby Ontario vendors with full explanation
5. Buyer confirms in the Buyer Dashboard
6. **Coordination Agent** updates all statuses, notifies both vendors
7. Admin Dashboard shows the live match, agent actions, and memory signals

### Seeded Demo Data

**Vendors (Ontario)**
- Green Valley Farm
- Riverbend Produce
- Maple Leaf Organics

**Buyers**
- Toronto Bistro
- Waterloo Corner Grocer
- Hamilton Community Food Hub

---

## 🔌 API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/demo/login` | Demo role-based login |
| `POST` | `/api/demo/logout` | Demo logout |
| `POST` | `/api/listings` | Create a new supply listing |
| `GET` | `/api/listings` | List all active listings |
| `PATCH` | `/api/listings/:id` | Update a listing |
| `DELETE` | `/api/listings/:id` | Delete a listing |
| `POST` | `/api/requests` | Create a new demand request |
| `GET` | `/api/requests` | List all active requests |
| `PATCH` | `/api/requests/:id` | Update a request |
| `DELETE` | `/api/requests/:id` | Delete a request |
| `GET` | `/api/matches` | List all matches |
| `POST` | `/api/matches/run/:requestId` | Trigger AI matching for a request |
| `POST` | `/api/matches/:id/confirm` | Buyer confirms a match |
| `POST` | `/api/matches/:id/reject` | Buyer rejects a match |
| `GET` | `/api/notifications` | Get user notifications |
| `POST` | `/api/notifications/:id/read` | Mark notification as read |
| `GET` | `/api/dashboard/metrics` | Aggregate system metrics |
| `GET` | `/api/dashboard/timeline` | Agent action timeline |
| `POST` | `/api/ai/parse-listing` | Run Intake + Normalization agents on listing text |
| `POST` | `/api/ai/parse-request` | Run Intake + Demand Interpretation agents on request text |
| `POST` | `/api/ai/run-matching` | Run Matching agent for a request |
| `POST` | `/api/ai/coordinate-match` | Run Coordination agent for a confirmed match |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/MizuPanda/farmesh.git
cd farmesh
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file inside the `frontend/` directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Backboard.io
BACKBOARD_API_KEY=your_backboard_api_key
BACKBOARD_WORKFLOW_URL=your_backboard_workflow_endpoint
```

> See the Keys document for full details on obtaining these values.

### 4. Run the development server

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🇨🇦 Canadian Regional Context

- **Currency:** CAD
- **Supported units:** `lb`, `kg`, `bunch`, `case`, `tray`, `basket`
- **Supported provinces:** All Canadian provinces and territories
- **Matching priority:** Local and nearby suppliers first — province → city → delivery radius
- **Buyer types:** Independent restaurants, small grocery stores, food co-ops, cafes, caterers, community organizations
- **Vendor types:** Farms, market growers, greenhouse operators, orchard vendors, local produce sellers
- **Seasonal produce examples:** Leafy greens, root vegetables, berries, apples, herbs, greenhouse vegetables, onions

---

## 📄 License

Private repository — all rights reserved.
