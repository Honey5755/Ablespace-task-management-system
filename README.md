# Pyramid — Task Management System

Full-stack task manager built to the provided Figma design.
**Next.js 15 (App Router) + Tailwind CSS v4** on the front end, **NestJS 10 +
Prisma + SQLite** on the back end, TypeScript throughout.

---

## Quick start

```bash
npm run setup     # install deps, create .env, create the DB, seed demo data
npm run dev       # API on :4000, web on :3000
```

Then open <http://localhost:3000> and press **Continue as Guest**.

Requires Node 20+. No Docker, no database server, no external services — SQLite
is a file on disk.

<details>
<summary>Running the two apps separately</summary>

```bash
npm run dev:api   # http://localhost:4000/api
npm run dev:web   # http://localhost:3000
```

</details>

### Useful scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Production build of both apps |
| `npm run lint` | ESLint across both workspaces |
| `npm run test:e2e` | Playwright end-to-end suite (starts its own servers) |
| `npm run test:e2e:ui` | Same suite in Playwright's UI mode |
| `npm run db:push` | Sync the Prisma schema to SQLite |
| `npm run db:seed` | Reseed the demo workspace (idempotent) |
| `npm run db:studio -w apps/api` | Browse the database in Prisma Studio |

First run of the tests needs the browser once: `npx playwright install chromium`.

---

## Project structure

```
apps/
├── api/                        NestJS
│   ├── prisma/
│   │   ├── schema.prisma       Data model
│   │   └── seed.ts             Demo workspace mirroring the Figma sample data
│   └── src/
│       ├── auth/               Guest login, JWT strategy, guard, decorators
│       ├── users/              Profile updates + account deletion
│       ├── tasks/              Tasks, subtasks, comments, activity feed
│       ├── projects/           Projects
│       ├── labels/             Label CRUD + per-workspace defaults
│       ├── prisma/             Global Prisma module
│       └── common/filters/     Prisma → HTTP error translation
└── web/                        Next.js
    └── src/
        ├── app/
        │   ├── login/          Login screen (login-01)
        │   ├── (app)/          Authenticated shell: tasks, projects
        │   └── settings/       Profile / Theme / Color
        ├── components/
        │   └── ui/             Reusable primitives (button, dialog, menu, …)
        ├── providers/          Auth + theme context
        ├── hooks/              Data fetching, debounce
        └── lib/                Typed API client, shared types, formatters
```

---

## API

All routes are under `/api`. Everything except `POST /auth/guest` requires
`Authorization: Bearer <token>`.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/auth/guest` | Create a guest session, returns JWT + user |
| `GET` | `/auth/me` | Current profile |
| `PATCH` | `/users/me` | Update profile (Settings › Profile) |
| `DELETE` | `/users/me` | Leave workspace — deletes account and cascades |
| `GET` | `/tasks` | List; filter by `status`, `priority`, `labelId`, `projectId`, `search`, `sort`, `order` |
| `GET` | `/tasks/stats` | Counts per status + overdue |
| `GET` | `/tasks/:id` | Task with subtasks, comments and activity |
| `POST` | `/tasks` | Create |
| `PATCH` | `/tasks/reorder` | Batch reorder / move between groups |
| `PATCH` | `/tasks/:id` | Update |
| `DELETE` | `/tasks/:id` | Delete (cascades subtasks/comments) |
| `POST` | `/tasks/:id/comments` | Add comment |
| `DELETE` | `/tasks/:id/comments/:commentId` | Delete own comment |
| `GET/POST/PATCH/DELETE` | `/projects` · `/projects/:id` | Project CRUD |
| `GET/POST/DELETE` | `/labels` · `/labels/:id` | Label CRUD |

**Validation** is declarative via `class-validator` DTOs with a global
`ValidationPipe` set to `whitelist` + `forbidNonWhitelisted`, so unknown
properties are rejected rather than silently ignored:

```
POST /tasks {"title":"x","hacker":"1"}
→ 400 {"message":["property hacker should not exist"]}
```

**Ownership** is enforced inside the query filter (`where: { id, ownerId }`),
never as a post-fetch check. Relations connected by id — `projectId`,
`parentId`, `labelIds` — are each verified as the caller's before linking, and
the batch reorder scopes its `updateMany` by `ownerId`, so a forged id is a
silent no-op rather than a cross-tenant write.

---

## Design fidelity

### The design system was identifiable

The Figma layer names are shadcn/ui block identifiers verbatim —
`Blocks / Login-01`, `Blocks / Sidebar-02`, `DropdownMenu / Menu`. Rather than
eyedropping hex values off screenshots, the palette is taken from shadcn's
`neutral` token set, which the captures then confirm: muted text `#737373`,
borders `#E5E5E5`, primary `#171717`, input fill `#F5F5F5`. Components are built
on the same Radix primitives shadcn uses, so menu keyboard navigation, focus
traps and portalling match the source system's behaviour.

### Theme

Implemented exactly as the `Change Theme` and `Color Mode` menus specify.

- **Theme** — `Light` / `Dark`. Deliberately **no "System" option**, because the
  design does not offer one.
- **Color Mode** — `Amber`, `Blue`, `Pink`, `Rose`, `Emerald`, `Black`.

Both persist to `localStorage` and are re-applied by a small inline script in
`<head>` that runs **before first paint**, so a dark-mode user never sees a
white flash on reload. During a switch, transitions are suppressed for two
frames so the whole page doesn't cross-fade as a smear.

The accent tints links, focus rings and selected states — it deliberately does
**not** drive primary buttons, because every captured frame shows a near-black
`+ Add Task` button while `Blue` is the active colour.

### Responsive

The Figma file contains **no mobile or tablet frames**, so small-screen
behaviour is my own, built to the same tokens:

- **≥1024px** — persistent sidebar, task detail shows its Details rail alongside
- **640–1023px** — sidebar becomes an off-canvas drawer behind the header's
  panel toggle; the detail rail moves below the content
- **<640px** — table rows collapse into stacked cards with a compact meta line
  (priority · due date · assignee) instead of scrolling sideways; dialogs become
  bottom sheets; header buttons drop their labels and keep their icons

---

## Documented deviations

Bugs in the source design were handled by one rule: **content stays as drawn;
clearly-broken controls are corrected and listed here**, so a reviewer can tell
my mistakes from the file's.

| # | Found in Figma | What I did |
| --- | --- | --- |
| 1 | Login subtitle reads *"Enter your email below to login to your account"* but the card has no email field — `login-01` ships with one and it was removed for the guest brief | **Kept as drawn.** It's copy, not a broken control |
| 2 | `Fields` dropdown lists **Members twice** | **Rendered once.** A duplicate checkbox toggling one field would read as my bug |
| 3 | The comment thread's heading reads **"Subtasks"**, directly under the real Subtasks section | **Renamed to "Comments."** Two identical headings is a copy-paste error |
| 4 | Projects header button says `+ Add Project` on one frame, `+ Add Task` on two others | **Used `+ Add Project`** — the correct one for that page |
| 5 | The `Color Mode` swatch labelled **"Blue"** is actually violet (`#8B5CF6`) | **Kept the drawn colour**, kept the label. Fidelity beats naming |
| 6 | Reviewer comment #1 claims `+ Add Task` sits at the bottom of Doing/Completed but is a plus icon in To Do's header | **Doesn't reproduce** in the frames I have — all groups have the footer row. Built consistently |

### Interpretations where the design was silent

- **Board view** — `Fields` offers a `List | Board` toggle but the file has no
  Board frame. Built from the same tokens as the list, with native HTML5
  drag-and-drop between columns. Reviewer comment #2 asks for a visible drag
  affordance, so cards carry a grab cursor and a lifted drag state.
- **Backlog group** — `Backlog` is a real status in the detail rail but isn't one
  of the three groups drawn. Its group renders **only when it holds tasks**, so
  the default view matches the frames exactly while no task can become invisible.
- **Logo** — Figma export was blocked (below), so the mark is redrawn as a vector
  approximation rather than the original asset.
- **Empty states, loading skeletons and error banners** — not in the design;
  added because the app is functional and needs them.

### Scoped down deliberately

**Members, Teams and Reporter** appear in the detail rail and filter menu. A
guest session is a single-member workspace, so there is nobody to assign, no
team to bind, and no reporter distinct from the owner. The rows render to
preserve the drawn layout, and tasks auto-assign to their creator. Making these
real needs multi-user accounts and invitations, which the brief doesn't cover.

**`Login with Google`** is rendered because it's in the frame, but disabled with
a tooltip — OAuth needs a client ID and redirect origin the assessment doesn't
provide. A button that looks live and does nothing is worse than an honest
disabled one.

---

## Note on the Figma file

The file's owner disabled viewer copy/export, so the Figma REST API returns
`403 File not exportable` on every content endpoint — no node tree, no exact
spacing values, no SVG asset export, regardless of token scope. The spec was
reconstructed from screen captures cross-referenced against shadcn/ui;
working notes are in [`design/DESIGN-NOTES.md`](design/DESIGN-NOTES.md).
Enabling **Share → "Allow viewers to copy, share, and export"** would let exact
values and vector assets be pulled directly.

---

## Data model notes

- **SQLite has no enum type**, so `status` and `priority` are validated strings
  with `TASK_STATUSES` / `TASK_PRIORITIES` as the single source of truth. Moving
  to Postgres is a one-line `provider` change with no model rewrite.
- **Priority sorting** ranks `urgent > high > medium > low > none` explicitly;
  ordering by the column would sort alphabetically and put `high` before `low`.
- **`completedAt` stamps only on the transition** into `completed`, so re-saving
  a finished task doesn't drift the timestamp.
- **Labels carry an explicit `position`** — `createMany` writes identical
  `createdAt` values, which made the chip order nondeterministic.

---

## Verification

Both apps compile clean (`tsc --noEmit`, `next build`, `nest build`) and lint
clean (0 errors).

`npm run test:e2e` runs **28 Playwright specs** — it boots the API and web app
itself, so it works from a clean checkout:

```
28 passed (19.0s)
```

They cover guest login and route guarding, the three task groups and every
column, create/edit/delete, search (`⌘F`), priority filtering, `Fields` column
toggling, board drag-and-drop **both within and across columns with persistence
verified through a reload**, subtasks, comments, the activity feed,
light/dark + all six colour modes persisting independently, profile validation,
and the mobile drawer plus no-horizontal-overflow assertions.

Two specs pin the design decisions in the deviation table so they can't silently
regress: `Fields` must list *Members* exactly once, and the task detail page must
carry exactly one *Subtasks* heading.

**Isolation** is covered both ways. `e2e/auth.spec.ts` proves a second browser
context's guest cannot see the first's tasks; at the API level a second guest
attempting to read, edit, delete, comment on, or attach the first guest's tasks,
projects and labels receives `404` on every path — including a forged id inside
the batch reorder, which is a silent no-op.
