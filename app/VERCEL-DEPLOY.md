# Deploy SellScout AI to Vercel (with Supabase)

## What You Need

| Requirement | Where to Get It |
|-------------|----------------|
| Vercel account | [vercel.com](https://vercel.com) (free) |
| Supabase account | [supabase.com](https://supabase.com) (free tier) |
| OAuth app (optional) | [platform.kimi.ai](https://platform.kimi.ai) (for login) |

---

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **"New Project"**
3. Choose an organization, give it a name (e.g., `sellscout-ai`)
4. Set a database password (save this!)
5. Wait ~2 minutes for the project to be ready
6. Go to **Project Settings** → **Database**
7. Scroll down to **"Connection string"** section
8. Click the **URI** tab
9. Copy the connection string — it looks like:
   ```
   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
10. **Save this string** — you'll need it in Step 4

---

## Step 2: Push Code to GitHub

```bash
# In your project folder
cd ~/sellscout-ai

git init
git add .
git commit -m "SellScout AI with Supabase"

# Create a new empty repo on GitHub (no README, no license)
# Then:
git remote add origin https://github.com/YOUR_USERNAME/sellscout-ai.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect **Vite**

**Configure these settings:**

| Setting | Value |
|---------|-------|
| Framework Preset | `Vite` |
| Build Command | `npm run build` |
| Output Directory | `dist/public` |

Click **Deploy**.

---

## Step 4: Add the Database URL

After the first deploy (frontend will work, API won't yet):

1. In Vercel dashboard, go to **Settings** → **Environment Variables**
2. Add:

```
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

> Replace `[PROJECT_REF]`, `[PASSWORD]`, `[REGION]` with your actual values.

3. Click **Save**
4. Go to **Deployments** → Click **...** on latest → **Redeploy**

---

## Step 5: Push the Database Schema

```bash
cd ~/sellscout-ai

# Install Vercel CLI
npm install -g vercel

# Login and pull env vars
vercel login
vercel env pull .env.local

# Rename to .env (drizzle-kit reads .env by default)
cp .env.local .env

# Install deps
npm install

# Push the schema to Supabase
npm run db:push
```

You'll see:
```
[✓] Changes applied
```

---

## Step 6: Seed Demo Data

```bash
cd ~/sellscout-ai

# Run the seed script
npx tsx db/seed.ts
```

You should see:
```
Created demo user: 1
Created playbook: SellScout Platform
...
Created 8 prospects
✅ Database seeded successfully!
```

---

## Step 7: Verify

Open your Vercel URL: `https://sellscout-ai.vercel.app`

- Homepage should show the **3D sphere**
- **Playbooks** page should show 6 seeded playbooks from Supabase
- **Campaigns**, **Analytics**, **Pricing** should all work

---

## Add OAuth Login (Optional)

The app works perfectly without login. To add real authentication:

1. Go to [platform.kimi.ai](https://platform.kimi.ai)
2. Sign in → **Applications** → **Create Application**
3. Set redirect URI to: `https://your-app.vercel.app/api/oauth/callback`
4. Copy **App ID** and **App Secret**
5. Add to Vercel environment variables:
   ```
   VITE_APP_ID=your_app_id
   VITE_APP_SECRET=your_app_secret
   KIMI_AUTH_URL=https://platform.kimi.ai
   REDIRECT_URI=https://your-app.vercel.app/api/oauth/callback
   JWT_SECRET=any-random-string-32-chars-or-more
   ```
6. Redeploy

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Database connection refused" | Check `DATABASE_URL` in Vercel env vars. Make sure password is correct. |
| "SSL required" | Supabase connection strings include SSL by default. If using local Postgres, add `?sslmode=require` |
| "Relation does not exist" | Run `npm run db:push` to create tables |
| "Build failed" | Check Vercel logs. Make sure Output Directory is `dist/public` |
| Blank page | Check browser console for JS errors |

---

## Your Stack on Vercel + Supabase

```
User → Vercel Edge CDN (static frontend) → Browser renders React app
                                    ↓
                           API calls to /api/trpc/*
                                    ↓
                           Vercel Serverless Function
                           (Hono + tRPC + Drizzle ORM)
                                    ↓
                           Supabase (PostgreSQL)
```
