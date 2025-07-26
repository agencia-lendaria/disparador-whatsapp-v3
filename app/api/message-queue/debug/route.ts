import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 DEBUG: Fetching all message queue entries...')
    
    // Check current user first
    const { data: user, error: userError } = await supabase.auth.getUser()
    console.log('👤 Current user:', user?.user?.id || 'No user')
    if (userError) console.error('❌ User error:', userError)
    
    // Get all message queue entries (with error details)
    const { data: allMessages, error: allError } = await supabase
      .from('message_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    console.log('📊 All messages query result:', { data: allMessages, error: allError })
    
    // Get only pending messages
    const { data: pendingMessages, error: pendingError } = await supabase
      .from('message_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    console.log('📊 Pending messages query result:', { data: pendingMessages, error: pendingError })
    
    // Get campaign stats (with error details)
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    console.log('📊 Campaigns query result:', { data: campaigns, error: campaignError })
    
    // Get API configurations to test another table
    const { data: apiConfigs, error: apiError } = await supabase
      .from('api_configurations')
      .select('id, name, is_active')
      .limit(5)
    
    console.log('📊 API configs query result:', { data: apiConfigs, error: apiError })
    
    const debugInfo = {
      user: user?.user?.id || 'No user',
      userError: userError?.message || null,
      totalMessages: allMessages?.length || 0,
      pendingMessages: pendingMessages?.length || 0,
      allMessages: allMessages || [],
      pendingOnly: pendingMessages || [],
      recentCampaigns: campaigns || [],
      apiConfigs: apiConfigs || [],
      errors: {
        allError: allError?.message || null,
        pendingError: pendingError?.message || null,
        campaignError: campaignError?.message || null,
        apiError: apiError?.message || null
      },
      timestamp: new Date().toISOString()
    }
    
    console.log('📊 Debug info:', debugInfo)
    
    return NextResponse.json({
      success: true,
      ...debugInfo
    })
    
  } catch (error) {
    console.error('❌ Error in debug endpoint:', error)
    
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