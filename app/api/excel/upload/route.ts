import { NextRequest, NextResponse } from 'next/server'
import { syncFromExcelUpload } from '@/app/actions'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const result = await syncFromExcelUpload(formData)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('API upload error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred while processing the file'
      },
      { status: 500 }
    )
  }
}
