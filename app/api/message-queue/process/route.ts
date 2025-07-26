import { NextRequest, NextResponse } from 'next/server'
import { getMessageProcessor } from '@/lib/message-processor'

// Manual trigger for message processing
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Manual message queue processing triggered')
    
    const processor = getMessageProcessor()
    
    // Process the queue immediately
    await processor.processQueue()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Message queue processed successfully',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error processing message queue:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Get queue status
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    // Get queue statistics
    const { data: queueStats, error } = await supabase
      .from('message_queue')
      .select('status')
    
    if (error) {
      throw error
    }
    
    const stats = {
      total: queueStats?.length || 0,
      pending: queueStats?.filter(m => m.status === 'pending').length || 0,
      sending: queueStats?.filter(m => m.status === 'sending').length || 0,
      sent: queueStats?.filter(m => m.status === 'sent').length || 0,
      failed: queueStats?.filter(m => m.status === 'failed').length || 0
    }
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error getting queue status:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}