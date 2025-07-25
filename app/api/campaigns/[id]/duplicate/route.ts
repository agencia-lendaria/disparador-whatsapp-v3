import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
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

    // Buscar a campanha original com todas as suas dependências
    const { data: originalCampaign, error: fetchError } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_messages (*),
        campaign_contacts (*),
        sending_configurations (*)
      `)
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !originalCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Criar nova campanha
    const { data: newCampaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        user_id: user.id,
        name: `${originalCampaign.name} (Cópia)`,
        api_config_id: originalCampaign.api_config_id,
        google_sheets_url: originalCampaign.google_sheets_url,
        sheet_id_column: originalCampaign.sheet_id_column,
        status: 'draft'
      })
      .select()
      .single()

    if (campaignError) {
      console.error('Error creating duplicate campaign:', campaignError)
      return NextResponse.json(
        { error: 'Failed to duplicate campaign' },
        { status: 500 }
      )
    }

    // Duplicar mensagens
    if (originalCampaign.campaign_messages && originalCampaign.campaign_messages.length > 0) {
      const messagesToInsert = originalCampaign.campaign_messages.map((msg: any) => ({
        campaign_id: newCampaign.id,
        content_type: msg.content_type,
        content: msg.content,
        media_url: msg.media_url,
        order_index: msg.order_index
      }))

      const { error: messagesError } = await supabase
        .from('campaign_messages')
        .insert(messagesToInsert)

      if (messagesError) {
        console.error('Error duplicating messages:', messagesError)
      }
    }

    // Duplicar contatos
    if (originalCampaign.campaign_contacts && originalCampaign.campaign_contacts.length > 0) {
      const contactsToInsert = originalCampaign.campaign_contacts.map((contact: any) => ({
        campaign_id: newCampaign.id,
        external_id: contact.external_id,
        phone_number: contact.phone_number,
        name: contact.name,
        custom_fields: contact.custom_fields,
        status: 'pending'
      }))

      const { error: contactsError } = await supabase
        .from('campaign_contacts')
        .insert(contactsToInsert)

      if (contactsError) {
        console.error('Error duplicating contacts:', contactsError)
      }
    }

    // Duplicar configurações de envio
    if (originalCampaign.sending_configurations && originalCampaign.sending_configurations.length > 0) {
      const config = originalCampaign.sending_configurations[0]
      const { error: configError } = await supabase
        .from('sending_configurations')
        .insert({
          campaign_id: newCampaign.id,
          min_delay_seconds: config.min_delay_seconds,
          max_delay_seconds: config.max_delay_seconds,
          pause_after_messages: config.pause_after_messages,
          pause_duration_seconds: config.pause_duration_seconds,
          daily_limit: config.daily_limit,
          allowed_hours_start: config.allowed_hours_start,
          allowed_hours_end: config.allowed_hours_end
        })

      if (configError) {
        console.error('Error duplicating sending configuration:', configError)
      }
    }

    return NextResponse.json({
      success: true,
      campaign: newCampaign,
      message: 'Campaign duplicated successfully'
    })

  } catch (error) {
    console.error('Error in duplicate campaign API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}