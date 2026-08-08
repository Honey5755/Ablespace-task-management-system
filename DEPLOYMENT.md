# Deployment

Three free-tier services:

| Piece | Host | Why |
| --- | --- | --- |
| PostgreSQL | **Neon** | Serverless Postgres, generous free tier |
| NestJS API | **Render** | Runs a long-lived Node process |
| Next.js web | **Netlify** | First-class Next.js runtime |

**The API cannot go on Netlify.** Netlify Functions are serverless — cold starts,
short timeouts, and no persistent database pool. That suits Next.js but not a
Nest server. The two deploy separately and talk over HTTPS.

Do the steps in order; each needs a URL from the one before it.

---

## Step 1 · Database — Neon

1. Sign up at **[neon.tech](https://neon.tech)** (GitHub login is fastest)
2. **Create project** — name it `pyramid`, pick the region closest to you
3. On the dashboard, find **Connection string**
4. Toggle **Pooled connection** ON
5. Copy it — it looks like:

```
postgresql://neondb_owner:npg_xxxx@ep-cool-name-12345-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

> **Use the pooled string** — the host contains `-pooler`. Render's free tier
> opens more connections than a direct endpoint allows, and you'll hit
> `too many connections` under any real use.

Keep this tab open.

---

## Step 2 · API — Render

1. Sign up at **[dashboard.render.com](https://dashboard.render.com)** with GitHub
2. **New +** → **Blueprint**
3. Connect the repo `Ablespace-task-management-system`
4. Render reads [`render.yaml`](render.yaml) and shows a service named `pyramid-api`
5. It prompts for the two `sync: false` variables:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | the pooled Neon string from Step 1 |
| `CORS_ORIGIN` | `http://localhost:3000` — a placeholder, corrected in Step 4 |

6. **Apply** / **Create**

Don't set `JWT_SECRET` — the blueprint generates one.

The build runs `npm ci && npm run build -w apps/api && npm run db:deploy`.
That last command applies the committed migrations in
`apps/api/prisma/migrations/`, so the schema is created automatically. First
build takes ~3–5 minutes.

When it goes live, copy the URL, e.g. `https://pyramid-api.onrender.com`.

**Verify before continuing:**

```bash
curl https://pyramid-api.onrender.com/api/health
# expect: {"status":"ok","uptime":42}

curl -i https://pyramid-api.onrender.com/api/auth/me
# expect: HTTP/2 401

curl -X POST https://pyramid-api.onrender.com/api/auth/guest \
     -H 'Content-Type: application/json' -d '{}'
# expect: {"accessToken":"eyJ...","user":{...}}
```

The first is the same route Render's own health check hits. A **401 is correct**
for the second — it proves the route is mounted and the JWT guard is active. If
the third returns a token, the database is connected and migrated. Don't move on
until all three work.

---

## Step 3 · Web — Netlify

1. Sign up at **[app.netlify.com](https://app.netlify.com)** with GitHub
2. **Add new site** → **Import an existing project** → **GitHub**
3. Pick `Ablespace-task-management-system`
4. Netlify detects the monorepo and reads [`netlify.toml`](netlify.toml).
   Confirm the settings show:

   | Field | Value |
   | --- | --- |
   | Base directory | `apps/web` |
   | Build command | `npm run build` |
   | Publish directory | `apps/web/.next` |

   If the UI asks you to select a package for the monorepo, choose **`apps/web`**.

5. Before deploying, open **Add environment variables** and set:

   | Key | Value |
   | --- | --- |
   | `NEXT_PUBLIC_API_URL` | `https://pyramid-api.onrender.com/api` |

   The **`/api` suffix is required** — the Nest app sets that global prefix.

6. **Deploy**

> This variable is inlined into the JavaScript bundle at build time, so setting
> it afterwards does nothing until you redeploy. The build **fails loudly** if
> it's missing or points at localhost, rather than shipping a broken bundle —
> if you see that error, add the variable and trigger **Deploys → Trigger
> deploy → Clear cache and deploy site**.

Copy the site URL, e.g. `https://pyramid-tasks.netlify.app`.

---

## Step 4 · Close the CORS loop

The API currently rejects the browser's requests, because it only trusts
`localhost:3000`.

1. Render → `pyramid-api` → **Environment**
2. Edit `CORS_ORIGIN` → set it to your Netlify URL, no trailing slash:

```
https://pyramid-tasks.netlify.app
```

3. **Save changes** — Render redeploys automatically (~2 min)

To allow Netlify's branch previews too, comma-separate them:

```
https://pyramid-tasks.netlify.app,https://deploy-preview-1--pyramid-tasks.netlify.app
```

**Skipping this step is the single most common failure.** The site loads, looks
perfect, and every action fails silently — the browser console shows
`blocked by CORS policy` while the API itself is completely healthy.

---

## Step 5 · Verify it actually works

Open the Netlify URL and walk through:

- [ ] Login screen renders with correct fonts, spacing and the pill buttons
- [ ] **Continue as Guest** lands on the task list
- [ ] Create a task — it appears in **To Do**
- [ ] **Reload the page. The task is still there** ← *proves the database persists*
- [ ] Switch to dark via the sidebar user menu → **Change Theme** → **Dark**
- [ ] **Reload. Still dark** ← *proves theme persistence*
- [ ] Settings → Color → pick Emerald → reload → still Emerald
- [ ] Open on a phone — the sidebar collapses to a drawer
- [ ] Open a **private window** — a fresh guest sees an **empty** board, not yours

The two reload checks are the ones that matter. A deployment backed by a
non-persistent store passes every other check and still fails a reviewer.

---

## Keeping it alive for 45 days

The brief requires the deployment stay reachable for **45 days**.

**Render's free tier sleeps after ~15 minutes idle** and cold-starts in ~50
seconds. A reviewer opening a sleeping instance sees a hanging login button and
may score it as a non-working URL.

Pick one:

- **Free uptime pinger** — [cron-job.org](https://cron-job.org) or UptimeRobot,
  hitting `https://pyramid-api.onrender.com/api/health` every 10 minutes.
  Cheapest fix, and the endpoint returns `200` so the monitor stays green.
- **Use Railway or Fly.io for the API instead** — neither sleeps on the free
  tier. The blueprint is Render-specific, but the build and start commands are
  identical.

Netlify does not sleep, so only the API needs this.

---

## Optional · Seed the production database

Guests start with an empty workspace by design. To populate the demo account:

```bash
DATABASE_URL="<your-neon-pooled-string>" npm run db:seed
```

Run from your machine — it writes straight to Neon.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Build fails: `NEXT_PUBLIC_API_URL must point at the deployed API` | Variable unset on Netlify | Add it, then redeploy with cache cleared |
| Site loads, every action fails; console shows `blocked by CORS policy` | `CORS_ORIGIN` still on localhost | Step 4 |
| Login button hangs ~50s then works | Render free tier cold start | Add an uptime pinger |
| `too many connections` | Using Neon's direct, not pooled, string | Swap for the `-pooler` host |
| Render build fails on `prisma generate` | Cached `node_modules` | The `postinstall` hook handles this; clear build cache and retry |
| Tasks vanish on reload | API pointing at the wrong database | Check `DATABASE_URL` on Render |

## Rolling out schema changes

```bash
npm run db:migrate -- --name what_changed   # creates the migration locally
git add apps/api/prisma/migrations && git commit && git push
```

Render applies it via `db:deploy` on the next build. Never edit a migration
that has already been deployed.
