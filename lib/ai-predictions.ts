import { spawnSync } from 'child_process'
import * as fs from 'fs'

export interface PredictionResult {
  homeScore: number
  awayScore: number
  confidence: 'low' | 'medium' | 'high'
  reasoning: string
}

/**
 * Find Claude CLI path
 */
function findClaudePath(): string {
  const claudePath = process.env.CLAUDE_PATH || '/Users/andrejpt/.local/bin/claude'

  if (fs.existsSync(claudePath)) {
    return claudePath
  }

  throw new Error('Claude CLI not found. Install with: npm install -g @anthropic-ai/claude-code')
}

/**
 * Call Claude CLI for FREE using OAuth subscription
 */
function callClaude(prompt: string): string {
  const claudePath = findClaudePath()

  // CRITICAL: Remove ANTHROPIC_API_KEY to force OAuth (FREE with subscription)
  const cleanEnv = { ...process.env }
  delete cleanEnv.ANTHROPIC_API_KEY

  const result = spawnSync(claudePath, ['-p', '--output-format', 'text'], {
    input: prompt,
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024, // 50MB buffer
    timeout: 300000, // 5 min timeout
    env: {
      ...cleanEnv,
      HOME: process.env.HOME,
      USER: process.env.USER,
      PATH: process.env.PATH,
    },
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(`Claude CLI failed: ${result.stderr || result.stdout}`)
  }

  return result.stdout
}

/**
 * Generate AI prediction for a match using Claude CLI (FREE with subscription)
 */
export async function generatePrediction(
  homeTeam: string,
  awayTeam: string,
  stage: string
): Promise<PredictionResult> {
  try {
    const prompt = `You are a hockey prediction expert. Predict the score for an upcoming ice hockey match.

Match Details:
- Home Team: ${homeTeam}
- Away Team: ${awayTeam}
- Stage: ${stage}

Provide your prediction in the following JSON format:
{
  "homeScore": <predicted home score>,
  "awayScore": <predicted away score>,
  "confidence": "low" or "medium" or "high",
  "reasoning": "<brief explanation of your prediction>"
}

Consider:
- Both teams' historical performance in international hockey
- Current form and momentum
- Head-to-head records
- Importance of the match stage
- Typical score ranges in ${stage} matches

Return ONLY the JSON, no other text.`

    const responseText = callClaude(prompt)
    // Use RegExp constructor to avoid parsing issues
    const jsonMatch = responseText.match(new RegExp('\\{[\\s\\S]*\\}', 'g'))
    const prediction = jsonMatch && jsonMatch.length > 0 ? JSON.parse(jsonMatch[0]) : {}

    return {
      homeScore: prediction.homeScore || 2,
      awayScore: prediction.awayScore || 1,
      confidence: prediction.confidence || 'medium',
      reasoning: prediction.reasoning || 'AI prediction based on team analysis',
    }
  } catch (error) {
    console.error('Error generating AI prediction:', error)
    return {
      homeScore: 2,
      awayScore: 1,
      confidence: 'low',
      reasoning: 'Error generating prediction - using default values',
    }
  }
}

/**
 * Generate predictions for multiple matches
 */
export async function generateMultiplePredictions(
  matches: Array<{ homeTeam: string; awayTeam: string; stage: string }>
): Promise<PredictionResult[]> {
  const predictions: PredictionResult[] = []

  for (const match of matches) {
    const prediction = await generatePrediction(match.homeTeam, match.awayTeam, match.stage)
    predictions.push(prediction)
  }

  return predictions
}
