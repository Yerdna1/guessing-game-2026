import { PrismaClient, MatchStage, TournamentStatus, UserRole } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create tournament
  const tournament = await prisma.tournament.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'IBM & Olympic Games 2026 - Ice Hockey Guessing Game',
      description: 'Predict the scores of ice hockey matches during the IBM & Olympic Games 2026',
      location: 'Milan & Cortina, Italy',
      startDate: new Date('2026-02-06'),
      endDate: new Date('2026-02-22'),
      status: TournamentStatus.UPCOMING,
    },
  })
  console.log('Created tournament:', tournament.name)

  // Create teams with flag URLs
  const teams = [
    { code: 'SVK', name: 'Slovakia', flagUrl: 'https://flagcdn.com/w80/sk.png' },
    { code: 'SWE', name: 'Sweden', flagUrl: 'https://flagcdn.com/w80/se.png' },
    { code: 'FIN', name: 'Finland', flagUrl: 'https://flagcdn.com/w80/fi.png' },
    { code: 'CAN', name: 'Canada', flagUrl: 'https://flagcdn.com/w80/ca.png' },
    { code: 'CZE', name: 'Czechia', flagUrl: 'https://flagcdn.com/w80/cz.png' },
    { code: 'USA', name: 'United States', flagUrl: 'https://flagcdn.com/w80/us.png' },
    { code: 'GER', name: 'Germany', flagUrl: 'https://flagcdn.com/w80/de.png' },
    { code: 'SUI', name: 'Switzerland', flagUrl: 'https://flagcdn.com/w80/ch.png' },
    { code: 'LAT', name: 'Latvia', flagUrl: 'https://flagcdn.com/w80/lv.png' },
    { code: 'NOR', name: 'Norway', flagUrl: 'https://flagcdn.com/w80/no.png' },
    { code: 'AUT', name: 'Austria', flagUrl: 'https://flagcdn.com/w80/at.png' },
    { code: 'DEN', name: 'Denmark', flagUrl: 'https://flagcdn.com/w80/dk.png' },
    { code: 'GBR', name: 'Great Britain', flagUrl: 'https://flagcdn.com/w80/gb.png' },
  ]

  const createdTeams: Record<string, string> = {}
  for (const team of teams) {
    const created = await prisma.team.upsert({
      where: { code: team.code },
      update: {},
      create: team,
    })
    createdTeams[team.code] = created.id
    console.log('Created team:', team.name)
  }

  // Create matches based on typical Olympic schedule
  const matches = [
    // Group Stage matches
    { home: 'CAN', away: 'SWE', time: '2026-02-06T14:00:00Z', venue: 'Milan Ice Palace' },
    { home: 'FIN', away: 'CZE', time: '2026-02-06T18:00:00Z', venue: 'Milan Ice Palace' },
    { home: 'USA', away: 'SVK', time: '2026-02-07T14:00:00Z', venue: 'Cortina Olympic Stadium' },
    { home: 'GER', away: 'SUI', time: '2026-02-07T18:00:00Z', venue: 'Cortina Olympic Stadium' },
    { home: 'LAT', away: 'NOR', time: '2026-02-08T14:00:00Z', venue: 'Milan Ice Palace' },
    { home: 'AUT', away: 'DEN', time: '2026-02-08T18:00:00Z', venue: 'Milan Ice Palace' },
    { home: 'GBR', away: 'CAN', time: '2026-02-09T14:00:00Z', venue: 'Cortina Olympic Stadium' },
    { home: 'SWE', away: 'FIN', time: '2026-02-09T18:00:00Z', venue: 'Cortina Olympic Stadium' },
    { home: 'CZE', away: 'USA', time: '2026-02-10T14:00:00Z', venue: 'Milan Ice Palace' },
    { home: 'SVK', away: 'GER', time: '2026-02-10T18:00:00Z', venue: 'Milan Ice Palace' },
    { home: 'SUI', away: 'LAT', time: '2026-02-11T14:00:00Z', venue: 'Cortina Olympic Stadium' },
    { home: 'NOR', away: 'AUT', time: '2026-02-11T18:00:00Z', venue: 'Cortina Olympic Stadium' },
    { home: 'DEN', away: 'GBR', time: '2026-02-12T14:00:00Z', venue: 'Milan Ice Palace' },
    { home: 'CAN', away: 'CZE', time: '2026-02-12T18:00:00Z', venue: 'Milan Ice Palace' },
    { home: 'FIN', away: 'USA', time: '2026-02-13T14:00:00Z', venue: 'Cortina Olympic Stadium' },
    { home: 'SWE', away: 'SVK', time: '2026-02-13T18:00:00Z', venue: 'Cortina Olympic Stadium' },
    { home: 'GER', away: 'SUI', time: '2026-02-14T14:00:00Z', venue: 'Milan Ice Palace' },
    { home: 'NOR', away: 'DEN', time: '2026-02-14T18:00:00Z', venue: 'Milan Ice Palace' },
    { home: 'AUT', away: 'GBR', time: '2026-02-15T14:00:00Z', venue: 'Cortina Olympic Stadium' },
    { home: 'LAT', away: 'CAN', time: '2026-02-15T18:00:00Z', venue: 'Cortina Olympic Stadium' },
    // Additional group matches
    { home: 'USA', away: 'GER', time: '2026-02-16T14:00:00Z', venue: 'Milan Ice Palace' },
    { home: 'SVK', away: 'FIN', time: '2026-02-16T18:00:00Z', venue: 'Milan Ice Palace' },
    { home: 'CZE', away: 'SWE', time: '2026-02-17T14:00:00Z', venue: 'Cortina Olympic Stadium' },
    { home: 'SUI', away: 'NOR', time: '2026-02-17T18:00:00Z', venue: 'Cortina Olympic Stadium' },
    // Playoff matches
    { home: 'TBD', away: 'TBD', time: '2026-02-18T14:00:00Z', venue: 'Milan Ice Palace', stage: 'QUARTERFINAL' as MatchStage, playoff: true },
    { home: 'TBD', away: 'TBD', time: '2026-02-18T18:00:00Z', venue: 'Milan Ice Palace', stage: 'QUARTERFINAL' as MatchStage, playoff: true },
    { home: 'TBD', away: 'TBD', time: '2026-02-19T14:00:00Z', venue: 'Cortina Olympic Stadium', stage: 'QUARTERFINAL' as MatchStage, playoff: true },
    { home: 'TBD', away: 'TBD', time: '2026-02-19T18:00:00Z', venue: 'Cortina Olympic Stadium', stage: 'QUARTERFINAL' as MatchStage, playoff: true },
    { home: 'TBD', away: 'TBD', time: '2026-02-20T18:00:00Z', venue: 'Milan Ice Palace', stage: 'SEMIFINAL' as MatchStage, playoff: true },
    { home: 'TBD', away: 'TBD', time: '2026-02-21T14:00:00Z', venue: 'Cortina Olympic Stadium', stage: 'SEMIFINAL' as MatchStage, playoff: true },
    { home: 'TBD', away: 'TBD', time: '2026-02-22T14:00:00Z', venue: 'Milan Ice Palace', stage: 'BRONZE_MATCH' as MatchStage, playoff: true },
    { home: 'TBD', away: 'TBD', time: '2026-02-22T18:00:00Z', venue: 'Milan Ice Palace', stage: 'FINAL' as MatchStage, playoff: true },
  ]

  for (const match of matches) {
    const homeTeamId = createdTeams[match.home] || createdTeams['CAN'] // Default to CAN for TBD
    const awayTeamId = createdTeams[match.away] || createdTeams['USA'] // Default to USA for TBD

    await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homeTeamId,
        awayTeamId,
        scheduledTime: new Date(match.time),
        venue: match.venue,
        stage: match.stage || MatchStage.GROUP_STAGE,
        isPlayoff: match.playoff || false,
      },
    })
    console.log(`Created match: ${match.home} vs ${match.away}`)
  }

  // Create rules
  await prisma.rule.create({
    data: {
      tournamentId: tournament.id,
      title: 'Standard Scoring Rules',
      description: 'Points for correct predictions in group stage and playoff matches',
      pointsExact: 4,
      pointsWinner: 1,
      pointsOneTeam: 2,
      playoffBonus: 1,
    },
  })
  console.log('Created scoring rules')

  // Create admin user (password: admin123)
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@guessing-game.com' },
    update: {},
    create: {
      email: 'admin@guessing-game.com',
      name: 'Game Admin',
      role: UserRole.ADMIN,
    },
  })
  console.log('Created admin user:', admin.email)

  // Create test users
  const testUsers = [
    { email: 'john@example.com', name: 'John Doe', country: 'USA' },
    { email: 'jane@example.com', name: 'Jane Smith', country: 'GBR' },
    { email: 'peter@example.com', name: 'Peter Novák', country: 'SVK' },
  ]

  for (const user of testUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    })
    console.log('Created test user:', user.email)
  }

  console.log('Database seed completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
