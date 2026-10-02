# Rehan CRM Agency

A multi-tenant SaaS CRM for agencies, built on Next.js 16, Tailwind CSS v4 and Firebase.
It ships with a marketing funnel, Google and email authentication, workspaces with five
roles, and full CRUD for leads, contacts, companies, deals, tasks and activity — all of it
backed by Firestore. **There is no sample or seeded data anywhere**: every record in the app
is one you or a teammate creates.

## What is included

**Marketing funnel (`/`, `/pricing`)**
Hero, capability strip, problem/solution comparison, eight feature cards, three-step
workflow, role explainer, pricing with a monthly/yearly toggle, FAQ, closing CTA and footer.

**Authentication**
- Email and password sign-up and sign-in
- Sign in with Google (Firebase popup flow)
- Password reset by email
- Invitation acceptance at `/join`
- A profile document is created in Firestore on first sign-in

**Workspaces (tenants)**
- Create a workspace at `/onboarding`, with name, website, industry, currency and plan
- A default "Sales pipeline" with five stages is created with it
- One user can belong to several workspaces and switch between them from the header
- Owner-only workspace deletion, which cascades through every scoped collection

**Roles**

| Role | Records | Delete | Pipelines | Team | Billing | Delete workspace |
|---|---|---|---|---|---|---|
| Owner | read/write | yes | yes | yes | yes | yes |
| Admin | read/write | yes | yes | yes | — | — |
| Manager | read/write | yes | yes | read | — | — |
| Sales rep | read/write | — | — | — | — | — |
| Viewer | read | — | — | — | — | — |

Permissions are defined once in [lib/roles.ts](lib/roles.ts), used to gate the interface, and
mirrored in [firestore.rules](firestore.rules) so the database enforces them independently.

**CRM modules**
- **Leads** — create, edit, delete, filter by status/owner/source, sort, lead scoring, and
  one-click conversion into a contact plus an optional open deal
- **Contacts** — list and detail pages with company link, related deals, related tasks and a
  live timeline
- **Companies** — list and detail pages with their contacts, their deals and open/won value
- **Deals** — drag-and-drop kanban across pipeline stages, list view with won/lost/open tabs,
  weighted forecast, mark won, mark lost with a reason, reopen
- **Tasks** — types, priorities, due date and time, assignee, link to any record, overdue and
  due-today views
- **Activity** — append-only timeline of every create, update, stage change, win, loss and
  logged call, email, meeting or note
- **Reports** — closed revenue by month, pipeline by stage, leads by source, team
  leaderboard, table views and CSV export
- **Team** — invite by email with a role, change roles, suspend, remove, transfer ownership,
  revoke invitations, seat limits enforced against the plan
- **Settings** — workspace details, your own profile, and a pipeline/stage editor
- **Billing** — plan comparison, live usage against seat and contact limits, plan switching
  and cancellation written to the workspace record

**Throughout**
Global search (`Ctrl`/`Cmd` + `K`), toasts, confirm dialogs, empty states, realtime
subscriptions, and cascade handling so deleting a company or contact unlinks rather than
orphans its related records.

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a Firebase project

1. Open [console.firebase.google.com](https://console.firebase.google.com) and create a project.
2. Add a **Web app**, then open **Project settings → General → Your apps → SDK setup and
   configuration → Config**.
3. Open [.env](.env) and replace each `REPLACE_ME` with the matching value:

```ini
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Until these are filled in, the app renders a setup notice instead of the sign-in screens.

**`.env` is committed to git on purpose.** Firebase web config values are not secrets — they
ship inside the client bundle of every Firebase web app, so anyone can read them from the
browser. Your data is protected by [firestore.rules](firestore.rules) and the **Authorized
domains** list in Firebase Authentication, not by hiding these values. Real secrets (service
account keys, admin SDK credentials, third-party API secrets) belong in `.env.local`, which
stays gitignored and overrides `.env` locally.

### 3. Enable Authentication

In **Build → Authentication → Sign-in method**, enable:
- **Email/Password**
- **Google** (pick a support email)

Add your deployment domain under **Settings → Authorized domains**. `localhost` is already there.

### 4. Create Firestore and deploy the rules

Create a Firestore database (production mode), then deploy the rules and indexes:

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # select your project
firebase deploy --only firestore:rules,firestore:indexes
```

Or paste [firestore.rules](firestore.rules) into **Firestore → Rules** in the console and
publish. The rules are what stop one workspace reading another, so deploy them before
inviting anyone.

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then **Start free** to create an account
and your first workspace.

## Data model

All CRM collections are top-level and carry an `orgId`, which is what the security rules and
every query filter on.

```
users/{uid}                              profile, orgIds[], defaultOrgId
organizations/{orgId}                    name, plan, planStatus, currency, ownerId, memberCount
organizations/{orgId}/members/{uid}       role, status, name, email   ← the tenancy check
invitations/{id}                          orgId, email, role, status
pipelines/{id}                            orgId, name, isDefault, stages[]
leads/{id}        contacts/{id}           orgId, …
companies/{id}    deals/{id}              orgId, …
tasks/{id}        activities/{id}         orgId, …
```

Writes go through typed helpers in [lib/db/](lib/db/) — `createRecord`, `updateRecord`,
`deleteRecord` stamp `orgId`, `createdBy`, `createdAt` and `updatedAt`, and most mutations
also append to the activity timeline.

Reads are realtime: [components/providers/DataProvider.tsx](components/providers/DataProvider.tsx)
holds one `onSnapshot` subscription per collection for the active workspace, and every page
reads from that shared state. For very large workspaces, move those subscriptions behind
paginated queries per page.

## Project layout

```
app/
  page.tsx                  marketing funnel
  pricing/                  plan comparison
  login/ signup/            authentication
  forgot-password/ join/    password reset, invitation acceptance
  onboarding/               create a workspace or accept an invite
  (workspace)/              signed-in app: guard + sidebar + topbar
    dashboard/ leads/ contacts/ companies/ deals/
    tasks/ activity/ reports/ team/ billing/ settings/
components/
  providers/                AuthProvider, DataProvider, ToastProvider
  ui/                       buttons, fields, modal, table, badges, dropdown
  forms/                    lead, contact, company, deal, task, convert, log activity
  app/                      sidebar, topbar, search, charts, timelines
  marketing/ auth/          funnel and sign-in presentation
lib/
  firebase/client.ts        SDK initialisation
  db/                       one typed CRUD module per collection
  types.ts roles.ts         domain model and the permission matrix
  metrics.ts format.ts      derived numbers and formatting
firestore.rules             multi-tenant security rules
firestore.indexes.json      composite indexes for the queries above
```

## Notes

- **Charts** use a palette validated for colour-vision deficiency against this app's dark
  surface; see the comment at the top of [components/app/Charts.tsx](components/app/Charts.tsx)
  before changing the colours.
- **Invitations** are records in Firestore, not emails. A teammate accepts by signing in with
  the invited address and opening `/join`. To send the email too, add a Cloud Function on
  create, or wire a transactional email provider.
- **Billing** stores the plan on the workspace document and enforces its seat and contact
  limits. No payment provider is connected and no card details are collected anywhere; adding
  Stripe Checkout is the one remaining step to charge for it.
- **Deleting a workspace** runs batched client-side deletes. Past a few thousand documents per
  collection, move that to a Cloud Function.

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm start        # serve the production build
npm run lint     # eslint
```
