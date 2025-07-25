import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Verificar se a campanha pertence ao usuário
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('id, status, user_id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Verificar se a campanha pode ser pausada
    if (campaign.status !== 'running') {
      return NextResponse.json(
        { error: 'Only running campaigns can be paused' },
        { status: 400 }
      )
    }

    // Pausar a campanha
    const { data, error } = await supabase
      .from('campaigns')
      .update({ 
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error pausing campaign:', error)
      return NextResponse.json(
        { error: 'Failed to pause campaign' },
        { status: 500 }
      )
    }

    // Pausar mensagens pendentes na fila
    await supabase
      .from('message_queue')
      .update({ status: 'cancelled' })
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')

    return NextResponse.json({
      success: true,
      campaign: data
    })

  } catch (error) {
    console.error('Error in pause campaign API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}