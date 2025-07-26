// Note: For production, implement proper encryption
function decrypt(text: string): string {
  return text // Simplified for now
}

interface EvolutionAPIConfig {
  serverUrl: string
  apiKey: string
  instanceName: string
  apiType: 'evolution_web' | 'evolution_cloud' | 'whatsapp_cloud'
}

interface SendMessageParams {
  number: string
  text: string
  mediaUrl?: string
  mediaType?: 'image' | 'video' | 'audio' | 'document'
}

interface SendMessageResponse {
  success: boolean
  messageId?: string
  error?: string
  details?: any
}

export class EvolutionAPI {
  private config: EvolutionAPIConfig

  constructor(config: EvolutionAPIConfig) {
    this.config = config
  }

  async sendTextMessage(params: SendMessageParams): Promise<SendMessageResponse> {
    try {
      const { number, text } = params
      
      // Ensure number has @s.whatsapp.net suffix
      const formattedNumber = number.includes('@') ? number : `${number}@s.whatsapp.net`
      
      const response = await fetch(`${this.config.serverUrl}/message/sendText/${this.config.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify({
          number: formattedNumber,
          text: text
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Evolution API Error:', errorData)
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorData}`
        }
      }

      const result = await response.json()
      console.log('Evolution API Success:', result)
      
      return {
        success: true,
        messageId: result.key?.id,
        details: result
      }
    } catch (error) {
      console.error('Evolution API Request Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async sendMediaMessage(params: SendMessageParams): Promise<SendMessageResponse> {
    try {
      const { number, text, mediaUrl, mediaType } = params
      
      if (!mediaUrl || !mediaType) {
        return {
          success: false,
          error: 'Media URL and type are required for media messages'
        }
      }
      
      const formattedNumber = number.includes('@') ? number : `${number}@s.whatsapp.net`
      
      const response = await fetch(`${this.config.serverUrl}/message/sendMedia/${this.config.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify({
          number: formattedNumber,
          mediatype: mediaType,
          media: mediaUrl,
          caption: text || ''
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Evolution API Media Error:', errorData)
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorData}`
        }
      }

      const result = await response.json()
      console.log('Evolution API Media Success:', result)
      
      return {
        success: true,
        messageId: result.key?.id,
        details: result
      }
    } catch (error) {
      console.error('Evolution API Media Request Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.config.serverUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      })

      if (!response.ok) {
        return {
          success: false,
          error: `Connection test failed: HTTP ${response.status}`
        }
      }

      const instances = await response.json()
      const instanceExists = instances.some((instance: any) => 
        instance.instance_name === this.config.instanceName
      )

      if (!instanceExists) {
        return {
          success: false,
          error: `Instance '${this.config.instanceName}' not found`
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }
}

// Factory function to create API instance from database config
export async function createEvolutionAPIInstance(apiConfigId: string): Promise<EvolutionAPI | null> {
  try {
    console.log('Fetching API configuration for ID:', apiConfigId)
    
    // Import supabase here to avoid circular dependency
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available')
      return null
    }
    
    const { data: config, error } = await supabaseAdmin
      .from('api_configurations')
      .select('*')
      .eq('id', apiConfigId)
      .single()

    if (error) {
      console.error('Supabase error fetching API configuration:', error)
      return null
    }
    
    if (!config) {
      console.error('No API configuration found for ID:', apiConfigId)
      return null
    }

    console.log('Found API configuration:', {
      id: config.id,
      name: config.name,
      api_type: config.api_type,
      server_url: config.server_url,
      instance_name: config.instance_name,
      is_active: config.is_active
    })

    if (!config.is_active) {
      console.error('API configuration is not active:', apiConfigId)
      return null
    }

    // Decrypt sensitive data (simplified for testing)
    const decryptedApiKey = config.access_token // Remove decrypt() for now
    
    console.log('Creating Evolution API instance with config:', {
      serverUrl: config.server_url,
      instanceName: config.instance_name,
      apiType: config.api_type
    })
    
    const apiInstance = new EvolutionAPI({
      serverUrl: config.server_url,
      apiKey: decryptedApiKey,
      instanceName: config.instance_name,
      apiType: config.api_type
    })
    
    console.log('Evolution API instance created successfully')
    return apiInstance
    
  } catch (error) {
    console.error('Error creating Evolution API instance:', error)
    return null
  }
}