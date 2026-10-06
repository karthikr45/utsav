# Utsav — event marketplace

A working full-stack **Next.js 16 / React 19 / TypeScript / PostgreSQL** application for Hyderabad, Nellore and Wanaparthy. Editorial Cormorant Garamond headings, locally bundled DM Sans, a warm ivory/plum design system, responsive marketplace pages, and permission-controlled workspaces.

## Run locally

Node.js 22+ is recommended.

```sh
npm ci
cp .env.example .env.local
npm run dev -- --port 4317
```

Open **http://127.0.0.1:4317**. Set `APP_ORIGIN=http://127.0.0.1:4317` in `.env.local` when using this port. The current workspace already has that configuration.

With no `DATABASE_URL`, local development runs **PGlite**, an embedded PostgreSQL engine, persisted under `.data/postgres`. This is not an in-memory mock or browser localStorage database. Run only one application process against this embedded data directory.

For a normal PostgreSQL server, set:

```dotenv
DATABASE_URL=postgresql://utsav:YOUR_PASSWORD@localhost:5432/utsav
DEMO_MODE=false
APP_ORIGIN=https://your-domain.example
```

The same SQL schema, transactions and application services use the `pg` connection pool. Production without `DATABASE_URL` fails unless `ALLOW_EMBEDDED_DB=true` is explicitly set for a local build preview. Do not use embedded storage for a multi-instance deployment.

The application applies the idempotent bootstrap SQL on first connection. For a manual migration, export the environment variables and run `npm run db:migrate`; this script does not automatically load `.env.local`. Use tracked, numbered migrations for future production schema changes.

## Explore the roles

With `DEMO_MODE=true`, the sign-in page includes local preview account buttons. These use real password authentication and separate sessions, not a client-side role toggle.

| Role | Email |
| --- | --- |
| Customer | customer@utsav.local |
| Vendor | vendor@utsav.local |
| Planner | planner@utsav.local |
| City operations | operations@utsav.local |
| Listing/document reviewer | reviewer@utsav.local |
| Support | support@utsav.local |
| Finance | finance@utsav.local |
| Administrator | admin@utsav.local |

Local demo password: `UtsavDemo2026!`. These accounts are seeded only when demo mode is enabled. Never seed these credentials into a live customer database. All demo businesses, prices and events are fictional. Photos are illustrative Unsplash assets, not supplier portfolio claims.

## Implemented

- Responsive homepage, three-city selection, service/category search, price filtering and sorting.
- Vendor and planner profiles, package details, inclusion/exclusion lists, catering estimates.
- Account registration/login/logout, password hashing, opaque HTTP-only sessions, password updates and session revocation.
- Customer event creation, name/budget updates, closeout validation, service enquiries, checklists and event detail workspace.
- Private guest lists with party counts, dietary notes and manually recorded RSVP responses.
- Vendor/planner business applications, independent approval, corrections, rejection and suspension.
- Package publication restricted to approved businesses and authorized business managers.
- Private PDF/PNG/JPEG document uploads, authorized downloads, separate document reviews and audit records.
- Quote creation, revisions, expiry, line-item arithmetic validation and immutable accepted proposals.
- Quote acceptance tied to the exact version, supplier/date reservation conflicts and 30-minute deposit holds.
- Supplier blocked dates; the initial capacity model is **one event per supplier per day**.
- Booking deposit/balance records, staged delivery, customer completion, reviews linked to completed bookings.
- Supplier amendments requiring customer approval; original accepted quotes remain intact.
- Cancellation requests, support decisions, separate refund records and independent finance approvals.
- Simulated payment/payout adapters, duplicate-payment protection and 10% demonstration commission.
- Private proposal messages, support cases, replies, notifications and transaction CSV exports.
- Event invitations with viewer/contributor/planner/spending-approver permissions and acceptance/revocation.
- Business team invitations with manager/worker/accounts permissions, job assignment and revocation.
- Assigned worker booking visibility with monetary fields redacted.
- City-scoped operations, platform access management, role changes that revoke sessions, administrative audit history.
- Separate customer, vendor, planner, operations, review, support, finance and administrator navigation.

## Architecture / later API extraction

```text
src/app/                       Next.js pages and HTTP adapters
src/app/api/[...path]/route.ts Authentication and command/query HTTP transport
src/app/api/documents/         Multipart upload and authorized download transport
src/components/               Marketplace, workspaces and shared UI
src/lib/                      Shared types and presentation constants
src/server/service.ts         Business commands and workspace/catalog queries
src/server/policy.ts          Resource-scoped authorization
src/server/db.ts              PostgreSQL/PGlite repository adapter and transactions
src/server/schema.sql         Relational schema and indexes
src/server/auth.ts            Next.js cookie/session adapter
src/server/password.ts        Password hashing and verification
tests/workflows.test.ts       Stateful API/security integration tests
tests/browser.spec.ts         Desktop/mobile browser smoke tests
```

Business services accept an authenticated user and validated data; they do not import Next.js. To separate the backend later, move `src/server` and shared types to the API service, replace the cookie transport, and point the frontend `api()` client at the new origin. PostgreSQL remains the source of truth. Use a BFF or a properly configured same-site session/CORS arrangement rather than exposing database credentials to the browser.

### API surface

- `GET /api/catalog`: published listings, packages, completed-booking reviews.
- `GET /api/auth/me`: current session identity and local demo flag.
- `POST /api/auth/register`, `/api/auth/login`, `/api/auth/logout`.
- `GET /api/workspace`: a permission-filtered workspace projection.
- `POST /api/commands`: `{ "action": "quote.accept", "data": { "id": "...", "version": 2 } }`.
- `POST /api/documents`: authorized multipart upload.
- `GET /api/documents/:id`: authenticated attachment download.

Command families: `event`, `business`, `offering`, `quote`, `booking`, `change`, `task`, `message`, `ticket`, `invite`, `availability`, `finance`, `review`, `document`, `account`, `admin`, `notification`. See the service switch for exact Zod-validated inputs.

## Validation

```sh
npm run typecheck
npm run build
# Keep the local demo server running in a separate terminal.
npm test
# Optional automated browser suite, outside restricted environments:
npx playwright install chromium
npm run test:e2e
```

API tests require an isolated local `DEMO_MODE=true` database and create clearly named test records. Override `TEST_BASE_URL` to target a separate test server. Do not run against a live customer database. Browser tests use `PLAYWRIGHT_BASE_URL` or the local port 4317.

Tests cover the complete quote-to-payout lifecycle, forbidden cross-user access, invitation acceptance/revocation, planner spending boundaries, worker financial redaction, independent finance approval, role escalation prevention, city scope, itemized totals, cancellations/refunds, document permissions, and supplier availability.

## Production integration boundary — read before launch

This is a functional local v1, **not a production-certified, fully integrated payment marketplace**.

1. **Payments:** no real payment gateway, webhook signature handling, chargebacks, settlements or bank changes are connected. Financial actions are explicitly simulated only in demo mode; live payment commands fail closed. Refunds in this preview use a full-refund policy after support approval.
2. **Identity/authentication:** email/phone verification, password recovery delivery, MFA and an external identity/KYC provider are not connected. Document approval is a human listing-review record, not a government identity claim. Privileged staff must not be exposed publicly before MFA and operational controls are implemented.
3. **Notifications:** in-app records work; email/SMS/WhatsApp delivery is not connected. Invitations are accepted through the recipient's matching account. No messages are sent outside this application.
4. **Uploads:** private local files are supported. Production needs durable object storage, malware scanning, retention rules, provider-specific document requirements, and backups. File signatures/type/size checks alone are not a malware scanner.
5. **Operations:** support/finance roles are platform-wide internal roles; operations is city-scoped. Per-agent support ticket assignment, business-owner transfers, emergency access and multi-party policy exceptions are not yet implemented.
6. **Advanced marketplace:** atomic multi-supplier checkout, multi-day/time-slot capacity, rental stock tracking, public RSVP invitation links/seating, multilingual translations, policy/tax engines, promotions/subscriptions, advanced analytics, supplier refunds after payout and live location tracking are future modules. Current packages belong to one supplier and can contain several included services.
7. **Scale:** add pagination, production rate limiting, background queues, scheduled hold expiry, telemetry, retries, backups/restore exercises and load tests. Currently expired holds are reclaimed when a workspace is loaded or a command runs. No external PostgreSQL server was available in this workspace; integration tests ran against the embedded PostgreSQL engine.
8. **Content/legal:** finalize real supplier contracts, cancellation schedules, privacy/retention practices, invoices/tax treatment and customer terms for the operating entity. The Help/Policies page explains preview behavior and is not a substitute for these documents.

Keep production and demo databases separate. Disable demo mode, replace sample photos/content, and connect/test the required providers before accepting real bookings or money.
