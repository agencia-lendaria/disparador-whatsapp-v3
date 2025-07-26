import { supabaseAdmin } from '@/lib/supabase'
import { createEvolutionAPIInstance } from '@/lib/evolution-api'

interface MessageQueueItem {
  id: string
  campaign_id: string
  contact_id: string
  contact_phone: string
  contact_name: string
  message_content: string
  media_url?: string
  media_type?: string
  status: 'pending' | 'sending' | 'sent' | 'failed'
  scheduled_at?: string
  sent_at?: string
  error_message?: string
  retry_count: number
  created_at: string
  updated_at: string
}

interface CampaignConfig {
  id: string
  api_configuration_id: string
  delay_min: number
  delay_max: number
  pause_after: number
  pause_duration: number
  max_retries: number
}

export class MessageProcessor {
  private isProcessing = false
  private processingInterval: NodeJS.Timeout | null = null

  constructor() {
    // Bind methods to preserve context
    this.processQueue = this.processQueue.bind(this)
    this.processSingleMessage = this.processSingleMessage.bind(this)
  }

  // Start the queue processor
  start(intervalMs: number = 5000) {
    console.log('Starting message processor...')
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
    }
    
    this.processingInterval = setInterval(this.processQueue, intervalMs)
    // Process immediately on start
    this.processQueue()
  }

  // Stop the queue processor
  stop() {
    console.log('Stopping message processor...')
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
  }

  // Main queue processing logic
  async processQueue() {
    if (this.isProcessing) {
      console.log('Already processing, skipping...')
      return
    }

    this.isProcessing = true
    console.log('🔄 Processing message queue...')
    console.log('📅 Current time:', new Date().toISOString())

    try {
      // Get pending messages that are ready to be sent using a simpler approach
      const { data: rawMessages, error } = await supabaseAdmin
        .from('message_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(10)

      let pendingMessages = null
      
      if (!error && rawMessages && rawMessages.length > 0) {
        // Enrich with campaign data manually
        const campaignIds = [...new Set(rawMessages.map(m => m.campaign_id))]
        
        const { data: campaignsData } = await supabaseAdmin
          .from('campaigns')
          .select(`
            id,
            api_config_id,
            sending_configurations (
              min_delay_seconds,
              max_delay_seconds,
              pause_after_messages,
              pause_duration_seconds,
              max_retries
            )
          `)
          .in('id', campaignIds)
        
        pendingMessages = rawMessages.map(message => {
          const campaign = campaignsData?.find(c => c.id === message.campaign_id)
          return {
            ...message,
            campaigns: campaign
          }
        })
      }

      if (error) {
        console.error('❌ Error fetching pending messages:', error)
        return
      }

      if (!pendingMessages || pendingMessages.length === 0) {
        console.log('ℹ️ No pending messages to process')
        return
      }

      console.log(`📬 Found ${pendingMessages.length} messages to process`)
      console.log('📋 Messages preview:', pendingMessages.map(m => ({
        id: m.id,
        campaign_id: m.campaign_id,
        contact_phone: m.contact_phone,
        scheduled_at: m.scheduled_at,
        has_campaigns: !!m.campaigns
      })))

      // Process each message
      for (const message of pendingMessages) {
        await this.processSingleMessage(message)
        
        // Add delay between messages based on campaign settings
        const campaign = message.campaigns
        const config = campaign.sending_configurations
        
        if (config && config.min_delay_seconds && config.max_delay_seconds) {
          const delay = Math.random() * (config.max_delay_seconds - config.min_delay_seconds) + config.min_delay_seconds
          console.log(`Waiting ${delay * 1000}ms before next message...`)
          await this.sleep(delay * 1000)
        }
      }

    } catch (error) {
      console.error('Error in queue processor:', error)
    } finally {
      this.isProcessing = false
    }
  }

  // Process a single message
  async processSingleMessage(message: any) {
    console.log(`🔄 Processing message ${message.id} for ${message.contact_phone}`)

    try {
      // Mark as sending
      console.log(`⏳ Marking message ${message.id} as 'sending'`)
      await supabaseAdmin
        .from('message_queue')
        .update({ 
          status: 'sending',
          updated_at: new Date().toISOString()
        })
        .eq('id', message.id)

      // Get API instance
      console.log('🔧 Creating API instance for config ID:', message.campaigns.api_config_id)
      const apiInstance = await createEvolutionAPIInstance(
        message.campaigns.api_config_id
      )

      if (!apiInstance) {
        console.error('❌ Failed to create API instance for config:', message.campaigns.api_config_id)
        throw new Error('Failed to create API instance')
      }
      
      console.log('✅ API instance created successfully')

      // Replace variables in message content
      console.log('🔤 Processing message content with variables')
      const processedContent = this.replaceVariables(
        message.message_content,
        {
          nome: message.contact_name,
          telefone: message.contact_phone
        }
      )
      console.log('📝 Original content:', message.message_content)
      console.log('📝 Processed content:', processedContent)

      // Send message
      console.log('📤 Sending message via Evolution API...')
      let result
      if (message.media_url && message.media_type) {
        console.log('📷 Sending media message with URL:', message.media_url)
        result = await apiInstance.sendMediaMessage({
          number: message.contact_phone,
          text: processedContent,
          mediaUrl: message.media_url,
          mediaType: message.media_type as any
        })
      } else {
        console.log('💬 Sending text message to:', message.contact_phone)
        result = await apiInstance.sendTextMessage({
          number: message.contact_phone,
          text: processedContent
        })
      }

      console.log('📡 Evolution API response:', result)

      if (result.success) {
        // Mark as sent
        await Promise.all([
          supabaseAdmin
            .from('message_queue')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', message.id),
          
          // Update campaign contact status
          supabaseAdmin
            .from('campaign_contacts')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', message.contact_id)
        ])

        console.log(`✅ Message sent successfully to ${message.contact_phone}`)
        
        // Update campaign progress
        await this.updateCampaignProgress(message.campaign_id)
        
      } else {
        throw new Error(result.error || 'Failed to send message')
      }

    } catch (error) {
      console.error(`❌ Error processing message ${message.id}:`, error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const newRetryCount = (message.retry_count || 0) + 1
      const maxRetries = message.campaigns?.sending_configurations?.max_retries || 3

      if (newRetryCount <= maxRetries) {
        // Schedule retry with exponential backoff
        const retryDelay = Math.pow(2, newRetryCount) * 60 * 1000 // 2, 4, 8 minutes
        const scheduledAt = new Date(Date.now() + retryDelay).toISOString()
        
        await supabaseAdmin
          .from('message_queue')
          .update({ 
            status: 'pending',
            retry_count: newRetryCount,
            scheduled_at: scheduledAt,
            error_message: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', message.id)
        
        console.log(`📅 Scheduled retry ${newRetryCount}/${maxRetries} for message ${message.id}`)
      } else {
        // Mark as failed
        await Promise.all([
          supabaseAdmin
            .from('message_queue')
            .update({ 
              status: 'failed',
              error_message: errorMessage,
              updated_at: new Date().toISOString()
            })
            .eq('id', message.id),
          
          // Update campaign contact status
          supabaseAdmin
            .from('campaign_contacts')
            .update({ 
              status: 'failed',
              error_message: errorMessage,
              updated_at: new Date().toISOString()
            })
            .eq('id', message.contact_id)
        ])
        
        console.log(`💀 Message ${message.id} failed permanently after ${maxRetries} retries`)
        
        // Update campaign progress
        await this.updateCampaignProgress(message.campaign_id)
      }
    }
  }

  // Replace variables in message content
  private replaceVariables(content: string, variables: Record<string, string>): string {
    let processedContent = content
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi')
      processedContent = processedContent.replace(regex, value || '')
    }
    
    return processedContent
  }

  // Update campaign progress and status
  private async updateCampaignProgress(campaignId: string) {
    try {
      // Get campaign stats
      const { data: stats } = await supabaseAdmin
        .from('campaign_contacts')
        .select('status')
        .eq('campaign_id', campaignId)

      if (!stats) return

      const totalContacts = stats.length
      const sentCount = stats.filter(s => s.status === 'sent').length
      const failedCount = stats.filter(s => s.status === 'failed').length
      const pendingCount = stats.filter(s => s.status === 'pending').length

      // Determine campaign status
      let campaignStatus = 'running'
      if (pendingCount === 0) {
        campaignStatus = failedCount === totalContacts ? 'failed' : 'completed'
      }

      // Update campaign
      await supabaseAdmin
        .from('campaigns')
        .update({
          status: campaignStatus,
          sent_count: sentCount,
          failed_count: failedCount,
          updated_at: new Date().toISOString(),
          ...(campaignStatus !== 'running' && { completed_at: new Date().toISOString() })
        })
        .eq('id', campaignId)

      console.log(`📊 Campaign ${campaignId} progress: ${sentCount}/${totalContacts} sent, status: ${campaignStatus}`)
      
    } catch (error) {
      console.error('Error updating campaign progress:', error)
    }
  }

  // Utility function for delays
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Global instance
let messageProcessor: MessageProcessor | null = null

// Get or create global processor instance
export function getMessageProcessor(): MessageProcessor {
  if (!messageProcessor) {
    messageProcessor = new MessageProcessor()
  }
  return messageProcessor
}

// Auto-start processor in development and production
if (typeof window === 'undefined') {
  const processor = getMessageProcessor()
  const interval = process.env.NODE_ENV === 'production' ? 10000 : 30000 // 30 seconds in dev, 10 in prod
  
  console.log(`🚀 Auto-starting message processor (${process.env.NODE_ENV}) with ${interval}ms interval...`)
  processor.start(interval)
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down message processor...')
    processor.stop()
    process.exit(0)
  })
}