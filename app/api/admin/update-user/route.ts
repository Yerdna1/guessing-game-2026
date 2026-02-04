import { NextResponse } from 'next/server'
import { updateUser } from '@/app/actions'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    await updateUser(formData)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    )
  }
}
