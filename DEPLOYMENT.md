# Deployment Guide - IBM & Olympic Games 2026 Guessing Game

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

Create a Neon PostgreSQL database at https://neon.tech and get the connection string.

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Database - Get this from Neon
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"

# NextAuth - Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth (Optional - leave empty if not using)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Anthropic Claude (Optional - for AI predictions)
ANTHROPIC_API_KEY="sk-ant-xxx"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Initialize Database

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 5. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/guessing-game.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Add environment variables:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your Vercel domain (e.g., `https://your-app.vercel.app`) |
| `ANTHROPIC_API_KEY` | Your Claude API key (optional) |

5. Click "Deploy"

### 3. Set Up Admin User

After deployment, access your database and run:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@guessing-game.com';
```

Or create a new admin through the UI and update their role.

---

## Database Management

### View Database in Prisma Studio

```bash
npm run db:studio
```

### Reset Database

```bash
npm run db:push -- --force-reset
npm run db:seed
```

### Create Migration

```bash
npm run db:migrate
```

---

## Testing Checklist

### Local Testing

- [ ] Landing page loads
- [ ] Registration works
- [ ] Login works
- [ ] Dashboard displays user info
- [ ] Can submit guesses
- [ ] Standings page shows rankings
- [ ] Admin dashboard loads (for admin users)
- [ ] AI predictions work (if API key configured)

### Production Testing

- [ ] All authentication flows work
- [ ] Database connections work
- [ ] Images load (team flags)
- [ ] Mobile responsive design works
- [ ] All routes are accessible

---

## Troubleshooting

### Database Connection Errors

- Verify `DATABASE_URL` is correct
- Ensure SSL mode is enabled (`sslmode=require`)
- Check Neon dashboard for database status

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

### Build Errors

- Delete `.next` folder and rebuild: `rm -rf .next && npm run dev`
- Verify all dependencies are installed: `npm install`
- Check TypeScript errors: `npx tsc --noEmit`

### Images Not Loading

- Team flags use CDN (flagcdn.com) - should work automatically
- If issues, check `next.config.js` image domains

---

## Features Implemented

✅ User authentication (email, Google, GitHub)
✅ Tournament and team management
✅ Match prediction system
✅ Scoring algorithm with playoff bonuses
✅ Real-time rankings leaderboard
✅ AI-powered predictions (Claude)
✅ Admin dashboard for match management
✅ Responsive design (mobile, tablet, desktop)
✅ shadcn/ui component library

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/guesses` | Get user's guesses |
| POST | `/api/guesses` | Create/update guess |
| GET | `/api/rankings` | Get rankings |
| POST | `/api/rankings` | Recalculate rankings |
| POST | `/api/ai-predict` | Get AI prediction |
| GET | `/api/matches` | Get all matches |
| PATCH | `/api/matches` | Update match (admin) |

---

## Support

For issues or questions:
1. Check the README.md
2. Review this deployment guide
3. Check Vercel deployment logs
4. Verify database connection in Neon dashboard
