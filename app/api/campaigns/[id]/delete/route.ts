import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(
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

    // Verificar se a campanha pode ser deletada
    if (['running', 'processing'].includes(campaign.status)) {
      return NextResponse.json(
        { error: 'Cannot delete running campaigns. Pause or cancel it first.' },
        { status: 400 }
      )
    }

    // Deletar dependências em ordem
    // 1. Deletar da fila de mensagens
    await supabase
      .from('message_queue')
      .delete()
      .eq('campaign_id', campaignId)

    // 2. Deletar configurações de envio
    await supabase
      .from('sending_configurations')
      .delete()
      .eq('campaign_id', campaignId)

    // 3. Deletar contatos da campanha
    await supabase
      .from('campaign_contacts')
      .delete()
      .eq('campaign_id', campaignId)

    // 4. Deletar mensagens da campanha
    await supabase
      .from('campaign_messages')
      .delete()
      .eq('campaign_id', campaignId)

    // 5. Deletar a campanha
    const { error: deleteError } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting campaign:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    })

  } catch (error) {
    console.error('Error in delete campaign API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}