import { NextResponse } from 'next/server'
import { getMessageProcessor } from '@/lib/message-processor'

export async function POST() {
  try {
    const processor = getMessageProcessor()
    
    // Start the processor if not already running
    processor.start(5000) // Check every 5 seconds
    
    return NextResponse.json({
      success: true,
      message: 'Message processor started'
    })
  } catch (error) {
    console.error('Error starting message processor:', error)
    return NextResponse.json(
      { error: 'Failed to start message processor' },
      { status: 500 }
    )
  }
}