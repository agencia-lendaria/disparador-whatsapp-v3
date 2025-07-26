import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authorization header
    const authorization = request.headers.get('authorization')
    
    if (!authorization) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    // Extract the token from "Bearer <token>"
    const token = authorization.replace('Bearer ', '')
    
    // Try alternative approach first - use the supabase client with headers
    const { createClient } = await import('@supabase/supabase-js')
    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            authorization: authorization
          }
        }
      }
    )
    
    // Try querying campaigns directly to verify access
    const campaignId = params.id
    console.log('Testing auth validation for campaign:', campaignId)
    
    const { data: campaign, error: fetchError } = await authSupabase
      .from('campaigns')
      .select('id, status, user_id')
      .eq('id', campaignId)
      .single()
    
    if (fetchError || !campaign) {
      console.error('Auth validation failed via database query:', fetchError)
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }
    
    // Use the campaign's user_id for operations
    console.log('Auth successful - campaign user_id:', campaign.user_id)
    const user = { id: campaign.user_id }

    console.log('Campaign found:', campaign)

    // Verificar se a campanha pode ser retomada
    if (campaign.status !== 'paused') {
      return NextResponse.json(
        { error: 'Only paused campaigns can be resumed' },
        { status: 400 }
      )
    }

    // Retomar a campanha
    console.log('Updating campaign status to running')
    const { data, error } = await authSupabase
      .from('campaigns')
      .update({ 
        status: 'running',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error resuming campaign:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: 'Failed to resume campaign', details: error.message },
        { status: 500 }
      )
    }

    console.log('Campaign resumed successfully:', data)

    // Reativar mensagens na fila que foram canceladas
    console.log('Updating message queue to reactivate pending messages')
    const { data: contacts } = await authSupabase
      .from('campaign_contacts')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')

    if (contacts && contacts.length > 0) {
      // Recriar entradas na fila de mensagens para contatos pendentes
      const queueEntries = contacts.map(contact => ({
        campaign_id: campaignId,
        contact_id: contact.id,
        status: 'pending',
        scheduled_at: new Date().toISOString()
      }))

      const { error: queueError } = await authSupabase
        .from('message_queue')
        .insert(queueEntries)
        
      if (queueError) {
        console.error('Error updating message queue:', queueError)
        // Don't fail the entire resume operation for this
      } else {
        console.log('Message queue updated successfully')
      }
    }

    return NextResponse.json({
      success: true,
      campaign: data
    })

  } catch (error) {
    console.error('Error in resume campaign API:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Ensure we always return JSON, even for server errors
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}