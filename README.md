# IBM & Olympic Games 2026 - Ice Hockey Guessing Game

A Next.js 16 application for predicting ice hockey match scores during the Olympic Games.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Neon PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **AI**: Anthropic Claude API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Neon recommended)
- Anthropic API key (optional, for AI predictions)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your environment variables:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..." # Optional
```

3. Initialize the database:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
guessing-game/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected pages
│   ├── (public)/          # Public pages
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── MatchCard.tsx     # Match display component
│   ├── StandingsTable.tsx # Rankings table
│   └── ...
├── lib/                   # Utility functions
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # NextAuth config
│   ├── scoring.ts        # Scoring logic
│   └── ai-predictions.ts # Claude integration
├── prisma/               # Database files
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
└── public/               # Static assets
```

## Scoring System

Points are awarded based on prediction accuracy:

- **Exact Score**: 4 points
- **Winner + One Team Correct**: 2 points
- **Correct Winner Only**: 1 point
- **Playoff Bonus**: +1 point for each scenario

## Features

- **User Authentication**: Sign up with email or OAuth (Google/GitHub)
- **Match Predictions**: Submit score predictions before matches start
- **Live Rankings**: Real-time leaderboard with point breakdowns
- **AI Predictions**: Get intelligent score predictions using Claude AI
- **Admin Dashboard**: Manage matches and update scores
- **Responsive Design**: Works on mobile, tablet, and desktop

## Database Seeding

The seed script creates:
- 1 tournament (IBM & Olympic Games 2026)
- 13 teams with flag URLs
- 30+ matches (group stage + playoffs)
- 1 admin user (email: admin@guessing-game.com)
- 3 test users

Run with:
```bash
npm run db:seed
```

## API Routes

- `POST /api/guesses` - Create/update a guess
- `GET /api/guesses` - Get user's guesses
- `GET /api/rankings` - Get tournament rankings
- `POST /api/rankings` - Recalculate rankings (admin)
- `POST /api/ai-predict` - Get AI prediction for a match
- `GET /api/matches` - Get all matches
- `PATCH /api/matches` - Update match score (admin)

## Deployment

### Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

Make sure to set `NEXTAUTH_URL` to your production URL.

### Environment Variables for Production

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://your-domain.vercel.app"
ANTHROPIC_API_KEY="sk-ant-..." # Optional
```

## Admin Access

To access the admin dashboard:

1. Create a user with email `admin@guessing-game.com`
2. Set their role to `ADMIN` in the database:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@guessing-game.com';
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own guessing games!
