import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 ADMIN DEBUG: Testing admin client access...')
    
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'supabaseAdmin is null - service role key missing'
      })
    }
    
    // Test admin access to campaigns
    const { data: campaigns, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    console.log('📊 Admin campaigns query result:', { data: campaigns, error: campaignError })
    
    // Test admin access to message queue
    const { data: messageQueue, error: queueError } = await supabaseAdmin
      .from('message_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    console.log('📊 Admin message queue result:', { data: messageQueue, error: queueError })
    
    return NextResponse.json({
      success: true,
      adminClientExists: !!supabaseAdmin,
      campaignsCount: campaigns?.length || 0,
      messageQueueCount: messageQueue?.length || 0,
      campaigns: campaigns || [],
      messageQueue: messageQueue || [],
      errors: {
        campaignError: campaignError?.message || null,
        queueError: queueError?.message || null
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error in admin debug endpoint:', error)
    
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