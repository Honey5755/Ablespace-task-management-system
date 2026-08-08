# Design spec extracted from Figma

Figma REST export is blocked on this file (`403 File not exportable` — the owner
disabled viewer copy/export), so values below are read off screen captures and
cross-referenced against shadcn/ui, whose blocks the file is built from
(`Blocks / Login-01`, `Blocks / Sidebar-02`, `DropdownMenu / Menu` are shadcn
identifiers verbatim). Sampled values match the `neutral` base:
muted `#737373`, border `#E5E5E5`, primary `#171717`, input fill `#F5F5F5`.

App name: **Pyramid**.

---

## ⚠️ It is a grouped table, not a Kanban board

The single most important correction. The main view is a **list of collapsible
status groups, each rendering its own table** — not columns of draggable cards.

Per group: a disclosure caret + group name (`To Do`, `Doing`, `Completed`), a
header row, task rows, and a `+ Add Task` footer row.

Columns: **Task · Priority · Members · Due Date · Actions**

Sample rows repeat across all groups:

| Task | Priority | Members | Due Date |
| --- | --- | --- | --- |
| Design Homepage | High | avatar | 12 Sep 2026 |
| Develop Login Feature | Low | `CN` initials | 15 Sep 2026 |
| Test Payment Gateway | Medium | `+` add button | 18 Sep 2026 |

Reviewer comment #1 (`+ Add Task` inconsistent between groups) does **not**
reproduce in the frames I have — every group has `+ Add Task` as a footer row.
Comment #2 ("are these board cards draggable") refers to a Board view that has a
toggle but no captured frame — see Open questions.

## Page header

`Tasks` title left; right cluster: search icon, `Fields` button, filter icon,
`+ Add Task` (primary, dark). A panel-collapse icon sits above-left, and some
frames show a breadcrumb `Projects › Design Homepage`.

## Sidebar (`sidebar-02`)

User switcher (avatar + `Dexter` + up/down chevrons) → `Workspace` section label
with caret → nav items **Tasks** (grid icon) and **Projects** (archive icon).
Active item gets a `--muted` rounded fill.

## Priority — five values, not three

From the priority dropdown: **No Priority · Urgent · High · Medium · Low**.
Rendered as Linear-style ascending bar-chart glyphs plus a label.
Urgent/High/Medium are warm (red → orange → amber); Low and No Priority are muted.

## Status — includes Backlog

The detail panel shows `Status: ● Backlog`, so the set is larger than the three
groups drawn: **Backlog · To Do · Doing · Completed**.

## Search

The search icon expands to an inline input with a `⌘F` badge. Filtering narrows
to matching rows and hides groups that end up empty (frame shows only `To Do`
with one row remaining).

## `Fields` dropdown

A **List | Board** segmented toggle at top, then column-visibility checkboxes:
Priority ✓, Members ✓, Due Date ✓, Members ✓ *(duplicated — design bug)*,
Labels ☐, Status ☐, Reporter ☐.

## Filter dropdown

Menu of facets: Status ▸ · Priority ▸ · Members ▸ · Due Date ▸ · Teams ▸ ·
Labels ▸ · Reporter ▸. The Priority submenu lists the five priorities with a
check on the active one.

## Task detail page

- Title `Write API Documentation` + description paragraph
- Action icons top-right: lock, eye `1`, share, `⋯`, panel toggle
- `Properties` — assignee chip `A Designer`, date chip `31 Jul` (red)
- `Labels` — tag chips: Research, Design, Development, Testing, Deployment
- `Resources` — `Add document or link…`
- `▾ Subtasks` — same 5-column table, rows `Subtask 1..3`, `+ Add Subtasks` footer
- A comment thread (heading reads `Subtasks` again — **design bug**, it's comments):
  author + `just now`, body, emoji/`⋯` actions, `Leave a reply…`, `Add a comment…`
- Right rail `▾ Details`: Status, Priority, Members, Dates, Labels, Teams, Reporter
- `▾ Updates` activity feed: "You changed priority from No priority to Ur…"
- `Dates` opens a month calendar popover (`‹ January 2026 ›`, Su–Sa, day 10 selected)

## Projects page

Same shell; columns **Projects · Priority · Lead · Due Date · Actions**, footer
`+ Add Projects`. Project names are link-coloured. Header button reads
`+ Add Project` in one frame and `+ Add Task` in two others — **design bug**.

## Theming — confirmed

User menu (avatar → dropdown): header shows avatar, `Dexter`,
`Dexter@gmail.com`, then **Change Theme ▸**, **Color Mode ▸**, **Settings**.

- **Change Theme** → `Light` ✓ / `Dark`. **Only two options — no System.**
- **Color Mode** → `Amber` · `Blue` ✓ · `Pink` · `Rose` · `Emerald` · `Black`

⚠️ The `Blue` swatch renders violet (~`#8B5CF6`), not blue. Matching the drawn
swatch since fidelity is graded; noted in README.

## Settings (separate full-page view)

`← Back to app`, a search field, and nav **Profile · Theme · Color**.
Profile page: card of hairline-divided rows — Profile picture (avatar), Email
(value + pencil), Full name, Title (sublabel "Your job title or role"), Username
(sublabel "One word, like a nickname or first name") — then a `Workspace access`
section with `Remove yourself from the workspace` + destructive `Leave Workspace`.

## Login (`login-01`)

Brand lockup, ~430px card, title "Let's get back on track", subtitle
"Enter your email below to login to your account.", pill `Continue as Guest`
(primary) and `Login with Google` (outline), then a ToS/Privacy footnote.

⚠️ Subtitle promises an email field the card doesn't have — `login-01` ships with
one and it was removed for the guest brief without updating the copy.

---

## Open questions

1. **No Board frame was captured** though `Fields` offers a Board toggle and a
   reviewer asks about draggable cards. Building List (fully drawn) first.
2. **No dark-theme frame captured** — dark palette comes from shadcn `neutral`
   dark tokens, which the light values already corroborate.
3. **No mobile/tablet frames** — responsive behaviour is my own, documented.

## Design bugs found (implementing as drawn, noted in README)

- Login subtitle references a non-existent email field
- `Fields` lists **Members** twice
- Comment thread heading reads **Subtasks**
- Projects header button label flips between `+ Add Project` and `+ Add Task`
- `Blue` colour swatch is violet
