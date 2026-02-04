import { NextRequest, NextResponse } from 'next/server'
import { deleteMatch } from '@/app/actions'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    await deleteMatch(formData)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete match error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete match' },
      { status: 500 }
    )
  }
}
