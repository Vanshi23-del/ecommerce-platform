# Marketstall — Role-Based E-Commerce Platform

A full-stack e-commerce app with three roles (Admin, Sales Person, User), built for the
Full Stack Developer Internship one-day assessment.

## Stack

|Layer|Technology|
|-|-|
|Frontend|React (Vite), React Router, Axios|
|Backend|Node.js, Express|
|Database|PostgreSQL|
|Auth|JWT + bcrypt|
|Images|Cloudinary (direct upload, URL-only storage)|
|Payments|Razorpay (test mode, signature-verified)|
|Deploy|Backend → Render, Frontend → Vercel|

## Repository structure

```
ecommerce-platform/
├── backend/     Express API, PostgreSQL schema, migrations, seed script
└── frontend/    React (Vite) client
```

## Setup \& installation

### 1\. Database

Create a PostgreSQL database (locally, or a free instance on Render/Neon/Supabase),
then apply the schema:

```bash
cd backend
cp .env.example .env       # fill in DATABASE\_URL and the other keys below
npm install
npm run db:migrate         # creates all tables from src/db/schema.sql
node src/db/seed.js        # creates one test login per role (see credentials below)
npm run dev                # starts the API on http://localhost:5000
```

### 2\. Frontend

```bash
cd frontend
cp .env.example .env       # set VITE\_API\_URL to your backend URL
npm install
npm run dev                # starts the app on http://localhost:5173
```

## Environment variables

**`backend/.env.example`**

```
PORT=5000
NODE\_ENV=development
CLIENT\_URL=http://localhost:5173

DATABASE\_URL=postgresql://username:password@localhost:5432/ecommerce\_db
PGSSL=false

JWT\_SECRET=replace\_with\_a\_long\_random\_string
JWT\_EXPIRES\_IN=7d

CLOUDINARY\_CLOUD\_NAME=
CLOUDINARY\_API\_KEY=
CLOUDINARY\_API\_SECRET=

RAZORPAY\_KEY\_ID=
RAZORPAY\_KEY\_SECRET=
```

**`frontend/.env.example`**

```
VITE\_API\_URL=http://localhost:5000
```

Get Cloudinary keys from your Dashboard → Account Details. Get Razorpay **test** keys
from Dashboard → Settings → API Keys.

## Test login credentials

Created by `node src/db/seed.js`:

|Role|Email|Password|
|-|-|-|
|Admin|admin@example.com|Admin@123|
|Sales Person|sales@example.com|Sales@123|
|User|user@example.com|User@123|

Public signup (`/register`) only allows creating **User** or **Sales Person** accounts —
Admin accounts are provisioned via the seed script or promoted by an existing Admin
from the dashboard's "Users \& roles" tab.

## Screenshots

## *!\[Browse page](1.png)*

## *!\[Product management](2.png)*

## *!\[Checkout](3.png)*

## *!\[Admin dashboard](4.png)*Live URLs

* Frontend (Vercel): https://ecommerce-platform-kappa-nine.vercel.app
* Backend (Render): https://ecommerce-backend-ys4j.onrender.com

> **Note:** The backend is hosted on Render's free tier, which spins down after periods of inactivity. If the app hasn't been used recently, the first request (e.g. loading products, logging in) may take 30–50 seconds while the server wakes up. Subsequent requests will be fast.

## Feature Completion Summary

|Feature|Implementation|
|-|-|
|Authentication|JWT-based auth with bcrypt password hashing (10 salt rounds). Token carries `id` and `role`, verified on every protected request.|
|Role-Based Access|Express middleware (`requireAuth` + `requireRole`) rejects disallowed requests with 401/403 before any controller logic runs. Admin has full access; Sales Person is additionally checked against `owner\_id` on update/delete; User has no product-management routes at all.|
|Product CRUD|Full CRUD with search/filter/pagination on the public list endpoint. Ownership enforced server-side — a Sales Person cannot edit or delete another seller's product even by guessing the product ID.|
|Cloudinary Upload|Images are received in memory (`multer.memoryStorage()`) and streamed directly to Cloudinary; only the returned `secure\_url` is saved to Postgres, never a local file path.|
|Wishlist|Add/remove backed by a unique `(user\_id, product\_id)` constraint to prevent duplicates; "move to cart" transfers and removes in one action.|
|Cart|Add/update quantity/remove/clear; quantity is clamped server-side (`CHECK (quantity > 0)`); cart badge in the navbar reflects live count.|
|Razorpay Checkout|Backend recomputes the order total from the DB cart (never trusts a client-sent amount), creates a Razorpay order, and after checkout verifies the HMAC-SHA256 signature of `order\_id|
|Order History \& Dashboards|User sees only their own orders; Sales Person sees order line-items containing their products (joined via `order\_items.seller\_id`); Admin sees every paid order plus aggregate stats (total sales, total orders, total users, top products).|
|Deployment|Backend deployed on Render (Node web service), frontend deployed on Vercel (static Vite build), frontend pointed at the live Render API URL via `VITE\_API\_URL`.|

## Deploying

**Backend → Render**

1. Push this repo to GitHub.
2. New → Web Service → connect the repo, set root directory to `backend`.
3. Build command: `npm install`. Start command: `npm start`.
4. Add all variables from `backend/.env.example` as environment variables (real values), plus `DATABASE\_URL` from your Postgres instance and `PGSSL=true` if it's a hosted DB.
5. After the first deploy, run `npm run db:migrate` and `node src/db/seed.js` once (Render Shell, or a one-off job) to create tables and test accounts.

**Frontend → Vercel**

1. New Project → import the repo → set root directory to `frontend`.
2. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
3. Add environment variable `VITE\_API\_URL` = your live Render backend URL.
4. Update `CLIENT\_URL` on the backend to your Vercel URL (for CORS) and redeploy the backend.

## Git workflow used

* Feature-by-feature commits (setup → schema → auth → products → cart/wishlist →
payments → orders/dashboard → frontend pages → deployment config → docs).
* One feature branch (e.g. `feature/razorpay-checkout`) merged into `main` via Pull Request.

See `IMPLEMENTATION\_REPORT.md` for a narrative walkthrough of what was built, how, and
any known limitations.

