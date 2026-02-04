# Excel Sync Documentation

## Overview

The Excel sync feature allows you to synchronize match data and user predictions from an Excel file to the database. The Excel file (`The_OG_2026_Guessing_Game.xlsx`) is considered the single source of truth for:

- Match schedules (dates, times, teams)
- User predictions/guesses

## Running the Sync

To sync data from Excel to the database, run:

```bash
npm run sync:excel
```

## What Gets Synced

### Matches
- Team matchups
- Schedule dates and times
- Venue information
- Tournament stage

### User Predictions
- Score predictions for each match
- Updates existing predictions if they've changed
- Creates new predictions from Excel

## Excel File Structure

The Excel file must follow this structure:

### Row 1: Dates
- Contains match dates in format: "11-Feb-2026"

### Row 2: Times
- Contains match times in format: "16:40" (24-hour format)

### Row 3: Home Teams
- Team codes (e.g., SVK, SWE, FIN)

### Row 5: Away Teams
- Team codes for opposing teams

### Row 7+: User Data
- Column A: ID
- Column B: Name
- Column C: Email
- Column D: Country
- Columns J+: Match predictions in format "homeScore:awayScore"

## Sync Behavior

1. **Matches**: Updates existing matches or creates new ones based on team matchups
2. **Teams**: Automatically creates teams if they don't exist
3. **Predictions**: Updates existing predictions only if the scores have changed
4. **Users**: Does not create new users (users must be created separately)

## Important Notes

- The sync script will not delete any data, only create or update
- Match times are stored in UTC
- Users must exist in the database before their predictions can be synced
- Run the sync whenever the Excel file is updated to keep the database current

## Troubleshooting

If the sync fails:
1. Check that the Excel file exists at the root directory
2. Ensure all team codes in the Excel match valid teams
3. Verify that user emails in Excel match database users
4. Check the console output for specific error messages