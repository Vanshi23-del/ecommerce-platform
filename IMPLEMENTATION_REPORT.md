# Implementation Report

## What was completed

All 11 tasks in the assessment brief are implemented:

1. **Project setup** — single repo, `frontend/` + `backend/` split, `.gitignore` excluding
   `node_modules` and env files, `.env.example` in both folders listing every required key.
2. **Database design** — PostgreSQL schema covering Users (with `role` enum), Products
   (with `owner_id` referencing the seller/admin), Cart, Wishlist, Orders, and a separate
   `order_items` table that snapshots price/seller at purchase time.
3. **Auth & RBAC** — JWT + bcrypt, with role restrictions enforced in Express middleware,
   not just hidden in the UI.
4. **Product CRUD + Cloudinary** — public search/filter listing; protected create/update/delete
   with ownership checks; images streamed to Cloudinary from memory, only the URL persisted.
5. **Frontend product listing** — responsive grid, search bar, category filter, role-aware nav.
6. **Wishlist & cart** — add/remove, adjustable quantity, live cart count in the navbar.
7. **Razorpay checkout** — order creation from the server-computed cart total, followed by
   HMAC signature verification before an order is marked paid.
8. **Order history & dashboards** — role-scoped views (buyer/seller/admin) plus admin stats.
9. **Git workflow** — structured for incremental commits and a feature-branch PR (see README).
10. **Deployment** — backend configured for Render, frontend for Vercel, with exact steps
    in the README.
11. **README & submission docs** — this report plus the main README.

## How each feature was implemented

**Authentication & RBAC.** Registration hashes passwords with bcrypt (10 rounds) and issues
a JWT containing `{ id, role }`. Every protected route runs `requireAuth` (verifies the
token, attaches `req.user`) followed by `requireRole(...allowed)` where needed. Product
update/delete additionally call `assertCanModify`, which loads the product's `owner_id`
and rejects the request with 403 unless `req.user.role === 'admin'` or
`req.user.id === product.owner_id`. This check happens purely server-side against the
database — the frontend hiding an "Edit" button is a UX nicety, not the security boundary.

**Product CRUD + Cloudinary.** Uploads use `multer.memoryStorage()`, so the file buffer
never touches the server's filesystem. It's piped straight into Cloudinary's
`upload_stream`, and only `result.secure_url` is written to the `products.image_url`
column. Listing supports `q` (name/description search), `category`, `minPrice`/`maxPrice`,
and pagination.

**Cart & wishlist.** Both use a `UNIQUE (user_id, product_id)` constraint with
`ON CONFLICT` upserts, so adding an item already in the cart increments quantity instead
of creating a duplicate row.

**Razorpay.** `POST /api/payments/create-order` reads the caller's cart from the database,
sums it server-side, and creates a Razorpay order for that exact amount — the client
never gets to submit its own total. After the Razorpay checkout modal completes,
`POST /api/payments/verify` recomputes `HMAC-SHA256(order_id|payment_id, key_secret)`
and compares it to the signature Razorpay returned. Only a match flips the order to
`paid` and clears the cart; a mismatch (or a fabricated callback) marks the order
`failed` and returns a 400, so a fake "success" message from the frontend can't create
a paid order on its own.

**Order history & dashboards.** `order_items.seller_id` is stored at purchase time, so a
Sales Person's "My sales" view is a simple `WHERE seller_id = $1` join — it stays correct
even if the product is later edited or deleted. Admin's `/orders/stats` aggregates total
sales, order count, user count, and top products directly in SQL.

## Challenges faced and how they were solved

- **Keeping ownership checks race-free between roles.** Since Admin and Sales Person
  share the same CRUD routes, ownership logic was pulled into one shared
  `assertCanModify` helper used by both update and delete, so the rule can't drift
  between the two.
- **Preventing a forged payment success.** The naive approach (frontend calls "create
  order" then just tells the backend "it worked") is not what's implemented — the backend
  independently verifies Razorpay's cryptographic signature before trusting the payment,
  per the brief's explicit warning about this.
- **Order history staying accurate after catalog changes.** Storing `name`, `price`, and
  `seller_id` directly on `order_items` (rather than only a foreign key to `products`)
  means a seller's order history and an admin's stats stay correct even if a product is
  later renamed, repriced, or deleted.

## Pending features or known limitations

- No automated test suite (unit/integration tests) was included given the one-day scope;
  manual verification steps are covered in the README.
- Password reset / email verification flows are out of scope for this assessment and
  were not built.
- The admin "promote/demote user role" action has no audit log — it's a direct update,
  suitable for this assessment's scope but not production-hardened.
- Search is a simple `ILIKE` match rather than full-text ranking; adequate for the
  assessment's product volume.
- Live URLs, screenshots, and the merged PR link are placeholders in the README until
  the repo is pushed to GitHub and deployed to Render/Vercel by the candidate.
