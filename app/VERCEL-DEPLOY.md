# Deploy SellScout AI to Vercel

## What You Need

| Requirement | Where to Get It |
|-------------|----------------|
| Vercel account | [vercel.com](https://vercel.com) (free) |
| Cloud MySQL database | [TiDB Cloud](https://tidbcloud.com) (free tier) or any MySQL provider |
| OAuth app (optional) | [platform.kimi.ai](https://platform.kimi.ai) (for login) |

---

## Step 1: Set Up the Database

The app needs a MySQL database. The easiest free option is **TiDB Cloud**:

1. Go to [tidbcloud.com](https://tidbcloud.com) and sign up
2. Create a new cluster (Serverless Tier is free)
3. Go to **Clusters** → your cluster → **Connect**
4. Copy the connection string. It looks like:
   ```
   mysql://username:password@host:4000/database?ssl={"rejectUnauthorized":true}
   ```
5. Save this — you'll need it in Step 3

---

## Step 2: Push Code to GitHub

Vercel deploys from Git. Push your project:

```bash
# In your project folder
git init
git add .
git commit -m "Initial commit"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/sellscout-ai.git
git push -u origin main
```

---

## Step 3: Deploy on Vercel

### 3a. Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect the Vite framework

### 3b. Configure Build Settings

Make sure these match:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist/public` |
| Root Directory | `./` |

### 3c. Add Environment Variables

Add these in the Vercel dashboard (Settings → Environment Variables):

```
DATABASE_URL=mysql://your-user:your-password@your-host:4000/your-db?ssl={"rejectUnauthorized":true}
```

> Replace with your actual TiDB Cloud connection string.

---

## Step 4: Push Database Schema

After the first deploy, push the schema to your database:

```bash
# Install Vercel CLI if you haven't:
npm i -g vercel

# Pull env vars locally:
vercel env pull .env.local

# Install deps:
npm install

# Push schema:
npm run db:push
```

Or run it via Vercel's CLI:
```bash
vercel --prod
# Then locally:
DATABASE_URL=your-db-url npm run db:push
```

---

## Step 5: Seed Demo Data (Optional)

After the schema is pushed, seed the database:

```bash
DATABASE_URL=your-db-url npx tsx db/seed.ts
```

Or manually seed with the SQL from the project.

---

## Step 6: Add OAuth Login (Optional)

The app works without login (shows demo data). To add real authentication:

1. Go to [platform.kimi.ai](https://platform.kimi.ai) → Applications
2. Create a new app
3. Set redirect URI to: `https://your-app.vercel.app/api/oauth/callback`
4. Copy the **App ID** and **App Secret**
5. Add to Vercel environment variables:
   ```
   VITE_APP_ID=your_app_id
   VITE_APP_SECRET=your_app_secret
   KIMI_AUTH_URL=https://platform.kimi.ai
   REDIRECT_URI=https://your-app.vercel.app/api/oauth/callback
   JWT_SECRET=any-random-string-at-least-32-chars
   ```

---

## Architecture on Vercel

```
User Request
    |
    v
+------------------+     +------------------+
| Vercel Edge CDN  |     | Vercel Function  |
| (Static files)   |     | (api/index.ts)   |
| - index.html     |     | - tRPC API       |
| - JS/CSS assets  |     | - OAuth callback |
| - Images         |     | - DB queries     |
+--------+---------+     +--------+---------+
         |                          |
         | /api/*                   | SQL queries
         v                          v
   /api/index (serverless)    TiDB Cloud (MySQL)
```

---

## Troubleshooting

### "Database connection refused"
- Check `DATABASE_URL` is correct in Vercel env vars
- Make sure TiDB Cloud allows connections from Vercel IPs
- TiDB Cloud: go to **Security** → **Trusted IPs** → Add `0.0.0.0/0` (allow all)

### "Table not found" errors
- Run `npm run db:push` to sync the schema
- Check the database actually exists

### "Build failed"
- Make sure `Output Directory` is `dist/public`
- Check Vercel logs for specific errors

### API routes return 404
- Make sure `vercel.json` has the rewrites section
- Check that `api/index.ts` exists and exports the handler

---

## Local Preview Before Deploy

```bash
npm install

# Create .env with your DATABASE_URL
cp .env.example .env
# Edit .env with your database URL

npm run db:push
npm run dev
```

App opens at **http://localhost:3000**

---

## Files Added for Vercel

| File | Purpose |
|------|---------|
| `api/index.ts` | Vercel serverless function entry point |
| `vercel.json` | Vercel routing & build configuration |
| `.env.example` | Document all required environment variables |
| `VERCEL-DEPLOY.md` | This guide |
