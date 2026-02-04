import { NextResponse } from 'next/server'
import { createUser } from '@/app/actions'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    await createUser(formData)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    )
  }
}
