import { NextResponse } from 'next/server'
import { deleteUser } from '@/app/actions'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    await deleteUser(formData)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    )
  }
}
