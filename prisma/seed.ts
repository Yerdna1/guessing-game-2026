import { PrismaClient, MatchStage, TournamentStatus, UserRole } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Data imported from Excel file
const excelTeams = [
  { code: 'CAN', name: 'Canada', flagUrl: 'https://flagcdn.com/w80/ca.png' },
  { code: 'CZE', name: 'Czechia', flagUrl: 'https://flagcdn.com/w80/cz.png' },
  { code: 'DEN', name: 'Denmark', flagUrl: 'https://flagcdn.com/w80/dk.png' },
  { code: 'FIN', name: 'Finland', flagUrl: 'https://flagcdn.com/w80/fi.png' },
  { code: 'FRA', name: 'France', flagUrl: 'https://flagcdn.com/w80/fr.png' },
  { code: 'GER', name: 'Germany', flagUrl: 'https://flagcdn.com/w80/de.png' },
  { code: 'ITA', name: 'Italy', flagUrl: 'https://flagcdn.com/w80/it.png' },
  { code: 'LAT', name: 'Latvia', flagUrl: 'https://flagcdn.com/w80/lv.png' },
  { code: 'SUI', name: 'Switzerland', flagUrl: 'https://flagcdn.com/w80/ch.png' },
  { code: 'SVK', name: 'Slovakia', flagUrl: 'https://flagcdn.com/w80/sk.png' },
  { code: 'SWE', name: 'Sweden', flagUrl: 'https://flagcdn.com/w80/se.png' },
  { code: 'USA', name: 'United States', flagUrl: 'https://flagcdn.com/w80/us.png' },
]

const excelMatches = [
  { homeTeam: 'SVK', awayTeam: 'FIN', date: '2026-02-11', time: '16:40', venue: 'Milan Ice Palace' },
  { homeTeam: 'SWE', awayTeam: 'ITA', date: '2026-02-11', time: '16:40', venue: 'Milan Ice Palace' },
  { homeTeam: 'SUI', awayTeam: 'FRA', date: '2026-02-12', time: '12:10', venue: 'Cortina Olympic Stadium' },
  { homeTeam: 'CZE', awayTeam: 'CAN', date: '2026-02-12', time: '12:10', venue: 'Cortina Olympic Stadium' },
  { homeTeam: 'LAT', awayTeam: 'USA', date: '2026-02-12', time: '16:40', venue: 'Milan Ice Palace' },
  { homeTeam: 'GER', awayTeam: 'DEN', date: '2026-02-12', time: '21:10', venue: 'Milan Ice Palace' },
  { homeTeam: 'FIN', awayTeam: 'SWE', date: '2026-02-13', time: '12:10', venue: 'Cortina Olympic Stadium' },
  { homeTeam: 'ITA', awayTeam: 'SVK', date: '2026-02-13', time: '12:10', venue: 'Cortina Olympic Stadium' },
  { homeTeam: 'FRA', awayTeam: 'CZE', date: '2026-02-13', time: '16:40', venue: 'Milan Ice Palace' },
  { homeTeam: 'CAN', awayTeam: 'SUI', date: '2026-02-13', time: '16:40', venue: 'Milan Ice Palace' },
  { homeTeam: 'SWE', awayTeam: 'SVK', date: '2026-02-14', time: '12:10', venue: 'Cortina Olympic Stadium' },
  { homeTeam: 'GER', awayTeam: 'LAT', date: '2026-02-14', time: '12:10', venue: 'Cortina Olympic Stadium' },
  { homeTeam: 'FIN', awayTeam: 'ITA', date: '2026-02-14', time: '16:40', venue: 'Milan Ice Palace' },
  { homeTeam: 'USA', awayTeam: 'DEN', date: '2026-02-14', time: '16:40', venue: 'Milan Ice Palace' },
  { homeTeam: 'SUI', awayTeam: 'CZE', date: '2026-02-15', time: '12:10', venue: 'Cortina Olympic Stadium' },
  { homeTeam: 'CAN', awayTeam: 'FRA', date: '2026-02-15', time: '12:10', venue: 'Cortina Olympic Stadium' },
  { homeTeam: 'DEN', awayTeam: 'LAT', date: '2026-02-15', time: '16:40', venue: 'Milan Ice Palace' },
  { homeTeam: 'USA', awayTeam: 'GER', date: '2026-02-15', time: '19:10', venue: 'Milan Ice Palace' },
  // Playoff TBD matches
  { homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-02-17', time: '12:10', venue: 'Milan Ice Palace', stage: 'QUARTERFINAL' as MatchStage, playoff: true },
  { homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-02-17', time: '12:10', venue: 'Milan Ice Palace', stage: 'QUARTERFINAL' as MatchStage, playoff: true },
  { homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-02-17', time: '16:40', venue: 'Milan Ice Palace', stage: 'QUARTERFINAL' as MatchStage, playoff: true },
  { homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-02-17', time: '16:40', venue: 'Milan Ice Palace', stage: 'QUARTERFINAL' as MatchStage, playoff: true },
  { homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-02-18', time: '12:10', venue: 'Cortina Olympic Stadium', stage: 'SEMIFINAL' as MatchStage, playoff: true },
  { homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-02-18', time: '12:10', venue: 'Cortina Olympic Stadium', stage: 'SEMIFINAL' as MatchStage, playoff: true },
  { homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-02-18', time: '16:40', venue: 'Milan Ice Palace', stage: 'SEMIFINAL' as MatchStage, playoff: true },
  { homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-02-18', time: '18:10', venue: 'Milan Ice Palace', stage: 'FINAL' as MatchStage, playoff: true },
  { homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-02-20', time: '16:40', venue: 'Milan Ice Palace', stage: 'BRONZE_MATCH' as MatchStage, playoff: true },
  { homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-02-20', time: '16:40', venue: 'Milan Ice Palace', stage: 'FINAL' as MatchStage, playoff: true },
  { homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-02-21', time: '00:00', venue: 'Cortina Olympic Stadium', stage: 'FINAL' as MatchStage, playoff: true },
]

const excelUsers = [
  { name: 'Peter Niroda', email: 'peter.niroda@sk.ibm.cm', country: 'Slovakia' },
  { name: 'Marek Kramara', email: 'marek.kramara@sk.ibm.com', country: 'Slovakia' },
  { name: 'Daniel Stransky', email: 'daniel.stransky@ib.com', country: 'Slovakia' },
  { name: 'Peter Juhas', email: 'peter.juhas@ibm.com', country: 'Slovakia' },
  { name: 'Tomas Uhrin', email: 'TomasUhrin1@sk.ibm.com', country: 'Slovakia' },
  { name: 'Filip Oscipovsky', email: 'filip.oscipovsky@sk.ibm.com', country: 'Slovakia' },
  { name: 'Petra Jankurová', email: 'petra.jankurova@ibm.com', country: 'Slovakia' },
  { name: 'Martin Kopka', email: 'martin.kopka1@ibm.com', country: 'Slovakia' },
  { name: 'Andrej Galad', email: 'andrej.galad@ibm.com', country: 'Slovakia' },
]

// User guesses from Excel: {userEmail, homeTeam, awayTeam, homeScore, awayScore}
const excelGuesses = [
  // Peter Niroda
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'SVK', awayTeam: 'FIN', homeScore: 0, awayScore: 4 },
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'SWE', awayTeam: 'ITA', homeScore: 6, awayScore: 0 },
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'SUI', awayTeam: 'FRA', homeScore: 5, awayScore: 1 },
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'CZE', awayTeam: 'CAN', homeScore: 1, awayScore: 4 },
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'LAT', awayTeam: 'USA', homeScore: 0, awayScore: 4 },
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'GER', awayTeam: 'DEN', homeScore: 3, awayScore: 2 },
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'FIN', awayTeam: 'SWE', homeScore: 2, awayScore: 3 },
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'ITA', awayTeam: 'SVK', homeScore: 1, awayScore: 3 },
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'FRA', awayTeam: 'CZE', homeScore: 1, awayScore: 4 },
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'CAN', awayTeam: 'SUI', homeScore: 3, awayScore: 2 },
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'SWE', awayTeam: 'SVK', homeScore: 4, awayScore: 0 },
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'GER', awayTeam: 'LAT', homeScore: 3, awayScore: 0 },
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'FIN', awayTeam: 'ITA', homeScore: 5, awayScore: 0 },
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'USA', awayTeam: 'DEN', homeScore: 3, awayScore: 0 },
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'SUI', awayTeam: 'CZE', homeScore: 3, awayScore: 1 },
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'CAN', awayTeam: 'FRA', homeScore: 5, awayScore: 0 },
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'DEN', awayTeam: 'LAT', homeScore: 1, awayScore: 2 },
  { userEmail: 'peter.niroda@sk.ibm.cm', homeTeam: 'USA', awayTeam: 'GER', homeScore: 4, awayScore: 1 },
  // Daniel Stransky
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'SVK', awayTeam: 'FIN', homeScore: 2, awayScore: 1 },
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'SWE', awayTeam: 'ITA', homeScore: 5, awayScore: 1 },
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'SUI', awayTeam: 'FRA', homeScore: 3, awayScore: 0 },
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'CZE', awayTeam: 'CAN', homeScore: 1, awayScore: 3 },
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'LAT', awayTeam: 'USA', homeScore: 0, awayScore: 3 },
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'GER', awayTeam: 'DEN', homeScore: 2, awayScore: 1 },
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'FIN', awayTeam: 'SWE', homeScore: 3, awayScore: 2 },
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'ITA', awayTeam: 'SVK', homeScore: 1, awayScore: 2 },
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'FRA', awayTeam: 'CZE', homeScore: 0, awayScore: 3 },
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'CAN', awayTeam: 'SUI', homeScore: 2, awayScore: 1 },
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'SWE', awayTeam: 'SVK', homeScore: 3, awayScore: 1 },
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'GER', awayTeam: 'LAT', homeScore: 2, awayScore: 0 },
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'FIN', awayTeam: 'ITA', homeScore: 5, awayScore: 1 },
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'USA', awayTeam: 'DEN', homeScore: 4, awayScore: 0 },
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'SUI', awayTeam: 'CZE', homeScore: 2, awayScore: 3 },
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'CAN', awayTeam: 'FRA', homeScore: 6, awayScore: 0 },
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'DEN', awayTeam: 'LAT', homeScore: 2, awayScore: 3 },
  { userEmail: 'daniel.stransky@ib.com', homeTeam: 'USA', awayTeam: 'GER', homeScore: 3, awayScore: 0 },
  // Tomas Uhrin
  { userEmail: 'TomasUhrin1@sk.ibm.com', homeTeam: 'SVK', awayTeam: 'FIN', homeScore: 2, awayScore: 2 },
  { userEmail: 'TomasUhrin1@sk.ibm.com', homeTeam: 'SWE', awayTeam: 'ITA', homeScore: 4, awayScore: 1 },
  { userEmail: 'TomasUhrin1@sk.ibm.com', homeTeam: 'SUI', awayTeam: 'FRA', homeScore: 3, awayScore: 1 },
  // Filip Oscipovsky
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'SVK', awayTeam: 'FIN', homeScore: 1, awayScore: 3 },
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'SWE', awayTeam: 'ITA', homeScore: 7, awayScore: 1 },
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'SUI', awayTeam: 'FRA', homeScore: 5, awayScore: 0 },
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'CZE', awayTeam: 'CAN', homeScore: 4, awayScore: 6 },
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'LAT', awayTeam: 'USA', homeScore: 1, awayScore: 4 },
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'GER', awayTeam: 'DEN', homeScore: 5, awayScore: 3 },
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'FIN', awayTeam: 'SWE', homeScore: 2, awayScore: 4 },
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'ITA', awayTeam: 'SVK', homeScore: 1, awayScore: 4 },
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'FRA', awayTeam: 'CZE', homeScore: 1, awayScore: 6 },
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'CAN', awayTeam: 'SUI', homeScore: 5, awayScore: 3 },
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'SWE', awayTeam: 'SVK', homeScore: 5, awayScore: 2 },
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'GER', awayTeam: 'LAT', homeScore: 3, awayScore: 2 },
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'FIN', awayTeam: 'ITA', homeScore: 4, awayScore: 0 },
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'USA', awayTeam: 'DEN', homeScore: 5, awayScore: 3 },
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'SUI', awayTeam: 'CZE', homeScore: 4, awayScore: 3 },
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'CAN', awayTeam: 'FRA', homeScore: 7, awayScore: 0 },
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'DEN', awayTeam: 'LAT', homeScore: 3, awayScore: 1 },
  { userEmail: 'filip.oscipovsky@sk.ibm.com', homeTeam: 'USA', awayTeam: 'GER', homeScore: 5, awayScore: 2 },
  // Martin Kopka
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'SVK', awayTeam: 'FIN', homeScore: 1, awayScore: 2 },
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'SWE', awayTeam: 'ITA', homeScore: 8, awayScore: 1 },
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'SUI', awayTeam: 'FRA', homeScore: 5, awayScore: 1 },
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'CZE', awayTeam: 'CAN', homeScore: 1, awayScore: 4 },
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'LAT', awayTeam: 'USA', homeScore: 1, awayScore: 6 },
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'GER', awayTeam: 'DEN', homeScore: 5, awayScore: 2 },
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'FIN', awayTeam: 'SWE', homeScore: 1, awayScore: 2 },
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'ITA', awayTeam: 'SVK', homeScore: 1, awayScore: 5 },
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'FRA', awayTeam: 'CZE', homeScore: 1, awayScore: 5 },
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'CAN', awayTeam: 'SUI', homeScore: 3, awayScore: 2 },
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'SWE', awayTeam: 'SVK', homeScore: 4, awayScore: 2 },
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'GER', awayTeam: 'LAT', homeScore: 4, awayScore: 1 },
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'FIN', awayTeam: 'ITA', homeScore: 5, awayScore: 0 },
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'USA', awayTeam: 'DEN', homeScore: 5, awayScore: 1 },
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'SUI', awayTeam: 'CZE', homeScore: 2, awayScore: 3 },
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'CAN', awayTeam: 'FRA', homeScore: 7, awayScore: 0 },
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'DEN', awayTeam: 'LAT', homeScore: 1, awayScore: 3 },
  { userEmail: 'martin.kopka1@ibm.com', homeTeam: 'USA', awayTeam: 'GER', homeScore: 3, awayScore: 2 },
  // Andrej Galad
  { userEmail: 'andrej.galad@ibm.com', homeTeam: 'SVK', awayTeam: 'FIN', homeScore: 1, awayScore: 4 },
  { userEmail: 'andrej.galad@ibm.com', homeTeam: 'SWE', awayTeam: 'ITA', homeScore: 6, awayScore: 1 },
  { userEmail: 'andrej.galad@ibm.com', homeTeam: 'SUI', awayTeam: 'FRA', homeScore: 3, awayScore: 2 },
  { userEmail: 'andrej.galad@ibm.com', homeTeam: 'CZE', awayTeam: 'CAN', homeScore: 2, awayScore: 4 },
  { userEmail: 'andrej.galad@ibm.com', homeTeam: 'LAT', awayTeam: 'USA', homeScore: 1, awayScore: 5 },
  { userEmail: 'andrej.galad@ibm.com', homeTeam: 'GER', awayTeam: 'DEN', homeScore: 3, awayScore: 2 },
  { userEmail: 'andrej.galad@ibm.com', homeTeam: 'FIN', awayTeam: 'SWE', homeScore: 2, awayScore: 3 },
  { userEmail: 'andrej.galad@ibm.com', homeTeam: 'ITA', awayTeam: 'SVK', homeScore: 1, awayScore: 4 },
  { userEmail: 'andrej.galad@ibm.com', homeTeam: 'FRA', awayTeam: 'CZE', homeScore: 2, awayScore: 5 },
]

async function main() {
  console.log('Starting database seed from Excel data...')

  // Clear existing data (optional - comment out if you want to keep existing data)
  // await prisma.guess.deleteMany({})
  // await prisma.match.deleteMany({})
  // await prisma.team.deleteMany({})
  // await prisma.user.deleteMany({})

  // Create tournament
  const tournament = await prisma.tournament.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'IBM & Olympic Games 2026 - Ice Hockey Guessing Game',
      description: 'Predict the scores of ice hockey matches during the IBM & Olympic Games 2026',
      location: 'Milan & Cortina, Italy',
      startDate: new Date('2026-02-11'),
      endDate: new Date('2026-02-22'),
      status: TournamentStatus.UPCOMING,
    },
  })
  console.log('✓ Created tournament:', tournament.name)

  // Create teams
  const teamsMap: Record<string, string> = {}
  for (const team of excelTeams) {
    const created = await prisma.team.upsert({
      where: { code: team.code },
      update: {},
      create: team,
    })
    teamsMap[team.code] = created.id
    console.log(`✓ Created team: ${team.name} (${team.code})`)
  }

  // Create TBD team for playoff matches
  const tbdTeam = await prisma.team.upsert({
    where: { code: 'TBD' },
    update: {},
    create: {
      code: 'TBD',
      name: 'To Be Determined',
      flagUrl: 'https://flagcdn.com/w80/eu.png',
    },
  })
  teamsMap['TBD'] = tbdTeam.id
  console.log('✓ Created team: TBD')

  // Create matches
  const matchesMap: Record<string, {homeTeam: string, awayTeam: string, matchId: string}> = {}
  for (const match of excelMatches) {
    const homeTeamId = teamsMap[match.homeTeam]
    const awayTeamId = teamsMap[match.awayTeam]

    if (homeTeamId && awayTeamId) {
      const scheduledTime = new Date(`${match.date}T${match.time}:00`)

      const created = await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          homeTeamId,
          awayTeamId,
          scheduledTime,
          venue: match.venue,
          stage: match.stage || MatchStage.GROUP_STAGE,
          isPlayoff: match.playoff || false,
          status: 'SCHEDULED',
        },
      })

      const matchKey = `${match.homeTeam}_${match.awayTeam}_${match.date}`
      matchesMap[matchKey] = {
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        matchId: created.id,
      }
      console.log(`✓ Created match: ${match.homeTeam} vs ${match.awayTeam} on ${match.date}`)
    }
  }

  // Create users
  for (const user of excelUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        country: user.country,
        role: UserRole.USER,
      },
    })
    console.log(`✓ Created user: ${user.name}`)
  }

  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@guessing-game.com' },
    update: {},
    create: {
      name: 'Game Admin',
      email: 'admin@guessing-game.com',
      country: 'Unknown',
      role: UserRole.ADMIN,
    },
  })
  console.log('✓ Created admin user')

  // Create user guesses
  let guessCount = 0
  for (const guess of excelGuesses) {
    const user = await prisma.user.findUnique({
      where: { email: guess.userEmail },
    })

    if (user) {
      // Find the matching match
      const matchDateKey = Object.keys(matchesMap).find(key => {
        const [home, away, date] = key.split('_')
        return home === guess.homeTeam && away === guess.awayTeam
      })

      if (matchDateKey && matchesMap[matchDateKey]) {
        const matchId = matchesMap[matchDateKey].matchId

        await prisma.guess.upsert({
          where: {
            userId_matchId: {
              userId: user.id,
              matchId: matchId,
            },
          },
          update: {
            homeScore: guess.homeScore,
            awayScore: guess.awayScore,
          },
          create: {
            userId: user.id,
            matchId: matchId,
            homeScore: guess.homeScore,
            awayScore: guess.awayScore,
          },
        })
        guessCount++
      }
    }
  }
  console.log(`✓ Created ${guessCount} user guesses`)

  console.log('\n✅ Database seed completed from Excel data!')
  console.log(`   - ${excelTeams.length + 1} teams (including TBD)`)
  console.log(`   - ${excelMatches.length} matches`)
  console.log(`   - ${excelUsers.length + 1} users (including admin)`)
  console.log(`   - ${guessCount} user guesses`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
