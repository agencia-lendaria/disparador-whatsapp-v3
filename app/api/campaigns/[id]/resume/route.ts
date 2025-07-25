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

    // Verificar se a campanha pode ser retomada
    if (campaign.status !== 'paused') {
      return NextResponse.json(
        { error: 'Only paused campaigns can be resumed' },
        { status: 400 }
      )
    }

    // Retomar a campanha
    const { data, error } = await supabase
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
      return NextResponse.json(
        { error: 'Failed to resume campaign' },
        { status: 500 }
      )
    }

    // Reativar mensagens na fila que foram canceladas
    const { data: contacts } = await supabase
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

      await supabase
        .from('message_queue')
        .insert(queueEntries)
    }

    return NextResponse.json({
      success: true,
      campaign: data
    })

  } catch (error) {
    console.error('Error in resume campaign API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}