# Marketstall — Role-Based E-Commerce Platform

A full-stack e-commerce app with three roles (Admin, Sales Person, User), built for the
Full Stack Developer Internship one-day assessment.

## Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React (Vite), React Router, Axios |
| Backend   | Node.js, Express |
| Database  | PostgreSQL |
| Auth      | JWT + bcrypt |
| Images    | Cloudinary (direct upload, URL-only storage) |
| Payments  | Razorpay (test mode, signature-verified) |
| Deploy    | Backend → Render, Frontend → Vercel |

## Repository structure

```
ecommerce-platform/
├── backend/     Express API, PostgreSQL schema, migrations, seed script
└── frontend/    React (Vite) client
```

## Setup & installation

### 1. Database

Create a PostgreSQL database (locally, or a free instance on Render/Neon/Supabase),
then apply the schema:

```bash
cd backend
cp .env.example .env       # fill in DATABASE_URL and the other keys below
npm install
npm run db:migrate         # creates all tables from src/db/schema.sql
node src/db/seed.js        # creates one test login per role (see credentials below)
npm run dev                # starts the API on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env       # set VITE_API_URL to your backend URL
npm install
npm run dev                # starts the app on http://localhost:5173
```

## Environment variables

**`backend/.env.example`**
```
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DATABASE_URL=postgresql://username:password@localhost:5432/ecommerce_db
PGSSL=false

JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

**`frontend/.env.example`**
```
VITE_API_URL=http://localhost:5000
```

Get Cloudinary keys from your Dashboard → Account Details. Get Razorpay **test** keys
from Dashboard → Settings → API Keys.

## Test login credentials

Created by `node src/db/seed.js`:

| Role         | Email                | Password    |
|--------------|-----------------------|-------------|
| Admin        | admin@example.com     | Admin@123   |
| Sales Person | sales@example.com     | Sales@123   |
| User         | user@example.com      | User@123    |

Public signup (`/register`) only allows creating **User** or **Sales Person** accounts —
Admin accounts are provisioned via the seed script or promoted by an existing Admin
from the dashboard's "Users & roles" tab.

## Screenshots

_Add 2–3 screenshots here after running the app locally or against the deployed URLs:
the product browse page, the seller's "My Products" management view, and the admin
dashboard are good choices._

## Live URLs

- Frontend (Vercel): `<add after deployment>`
- Backend (Render): `<add after deployment>`

## Feature Completion Summary

| Feature | Implementation |
|---|---|
| Authentication | JWT-based auth with bcrypt password hashing (10 salt rounds). Token carries `id` and `role`, verified on every protected request. |
| Role-Based Access | Express middleware (`requireAuth` + `requireRole`) rejects disallowed requests with 401/403 before any controller logic runs. Admin has full access; Sales Person is additionally checked against `owner_id` on update/delete; User has no product-management routes at all. |
| Product CRUD | Full CRUD with search/filter/pagination on the public list endpoint. Ownership enforced server-side — a Sales Person cannot edit or delete another seller's product even by guessing the product ID. |
| Cloudinary Upload | Images are received in memory (`multer.memoryStorage()`) and streamed directly to Cloudinary; only the returned `secure_url` is saved to Postgres, never a local file path. |
| Wishlist | Add/remove backed by a unique `(user_id, product_id)` constraint to prevent duplicates; "move to cart" transfers and removes in one action. |
| Cart | Add/update quantity/remove/clear; quantity is clamped server-side (`CHECK (quantity > 0)`); cart badge in the navbar reflects live count. |
| Razorpay Checkout | Backend recomputes the order total from the DB cart (never trusts a client-sent amount), creates a Razorpay order, and after checkout verifies the HMAC-SHA256 signature of `order_id|payment_id` before marking the order `paid` and clearing the cart. A forged success callback fails verification and the order is marked `failed`. |
| Order History & Dashboards | User sees only their own orders; Sales Person sees order line-items containing their products (joined via `order_items.seller_id`); Admin sees every paid order plus aggregate stats (total sales, total orders, total users, top products). |
| Deployment | Backend deployed on Render (Node web service), frontend deployed on Vercel (static Vite build), frontend pointed at the live Render API URL via `VITE_API_URL`. |

## Deploying

**Backend → Render**
1. Push this repo to GitHub.
2. New → Web Service → connect the repo, set root directory to `backend`.
3. Build command: `npm install`. Start command: `npm start`.
4. Add all variables from `backend/.env.example` as environment variables (real values), plus `DATABASE_URL` from your Postgres instance and `PGSSL=true` if it's a hosted DB.
5. After the first deploy, run `npm run db:migrate` and `node src/db/seed.js` once (Render Shell, or a one-off job) to create tables and test accounts.

**Frontend → Vercel**
1. New Project → import the repo → set root directory to `frontend`.
2. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
3. Add environment variable `VITE_API_URL` = your live Render backend URL.
4. Update `CLIENT_URL` on the backend to your Vercel URL (for CORS) and redeploy the backend.

## Git workflow used

- Feature-by-feature commits (setup → schema → auth → products → cart/wishlist →
  payments → orders/dashboard → frontend pages → deployment config → docs).
- One feature branch (e.g. `feature/razorpay-checkout`) merged into `main` via Pull Request.

See `IMPLEMENTATION_REPORT.md` for a narrative walkthrough of what was built, how, and
any known limitations.
