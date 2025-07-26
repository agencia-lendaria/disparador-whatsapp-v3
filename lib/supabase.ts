import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Client for frontend (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for backend/API routes (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

export type Database = {
  public: {
    Tables: {
      api_configurations: {
        Row: {
          id: string
          user_id: string
          name: string
          api_type: 'evolution_web' | 'evolution_cloud' | 'meta_cloud'
          server_url: string
          instance_name: string | null
          access_token: string
          phone_number: string | null
          phone_number_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          api_type: 'evolution_web' | 'evolution_cloud' | 'meta_cloud'
          server_url: string
          instance_name?: string | null
          access_token: string
          phone_number?: string | null
          phone_number_id?: string | null
          is_active?: boolean
        }
        Update: {
          name?: string
          api_type?: 'evolution_web' | 'evolution_cloud' | 'meta_cloud'
          server_url?: string
          instance_name?: string | null
          access_token?: string
          phone_number?: string | null
          phone_number_id?: string | null
          is_active?: boolean
        }
      }
      campaigns: {
        Row: {
          id: string
          user_id: string
          api_config_id: string | null
          name: string
          status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed'
          google_sheets_url: string | null
          sheet_id_column: string | null
          scheduled_at: string | null
          started_at: string | null
          completed_at: string | null
          sent_count: number
          failed_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          api_config_id?: string | null
          name: string
          status?: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed'
          google_sheets_url?: string | null
          sheet_id_column?: string | null
          scheduled_at?: string | null
          sent_count?: number
          failed_count?: number
        }
        Update: {
          name?: string
          api_config_id?: string | null
          status?: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed'
          google_sheets_url?: string | null
          sheet_id_column?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          sent_count?: number
          failed_count?: number
        }
      }
      campaign_messages: {
        Row: {
          id: string
          campaign_id: string
          content_type: 'text' | 'image' | 'video' | 'audio' | 'document'
          content: string
          media_url: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          campaign_id: string
          content_type: 'text' | 'image' | 'video' | 'audio' | 'document'
          content: string
          media_url?: string | null
          order_index?: number
        }
        Update: {
          content_type?: 'text' | 'image' | 'video' | 'audio' | 'document'
          content?: string
          media_url?: string | null
          order_index?: number
        }
      }
      campaign_contacts: {
        Row: {
          id: string
          campaign_id: string
          external_id: string | null
          phone_number: string
          name: string | null
          custom_fields: any
          status: 'pending' | 'sent' | 'failed'
          sent_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          external_id?: string | null
          phone_number: string
          name?: string | null
          custom_fields?: any
          status?: 'pending' | 'sent' | 'failed'
        }
        Update: {
          external_id?: string | null
          phone_number?: string
          name?: string | null
          custom_fields?: any
          status?: 'pending' | 'sent' | 'failed'
          sent_at?: string | null
          error_message?: string | null
        }
      }
      sending_configurations: {
        Row: {
          id: string
          campaign_id: string
          min_delay_seconds: number
          max_delay_seconds: number
          pause_after_messages: number
          pause_duration_seconds: number
          max_retries: number
          daily_limit: number | null
          allowed_hours_start: string | null
          allowed_hours_end: string | null
          created_at: string
        }
        Insert: {
          campaign_id: string
          min_delay_seconds?: number
          max_delay_seconds?: number
          pause_after_messages?: number
          pause_duration_seconds?: number
          max_retries?: number
          daily_limit?: number | null
          allowed_hours_start?: string | null
          allowed_hours_end?: string | null
        }
        Update: {
          min_delay_seconds?: number
          max_delay_seconds?: number
          pause_after_messages?: number
          pause_duration_seconds?: number
          max_retries?: number
          daily_limit?: number | null
          allowed_hours_start?: string | null
          allowed_hours_end?: string | null
        }
      }
      message_queue: {
        Row: {
          id: string
          campaign_id: string
          contact_id: string
          contact_phone: string
          contact_name: string | null
          message_content: string
          media_url: string | null
          media_type: string | null
          status: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled'
          scheduled_at: string
          sent_at: string | null
          error_message: string | null
          retry_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          contact_id: string
          contact_phone: string
          contact_name?: string | null
          message_content: string
          media_url?: string | null
          media_type?: string | null
          status?: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled'
          scheduled_at?: string
          sent_at?: string | null
          error_message?: string | null
          retry_count?: number
        }
        Update: {
          contact_phone?: string
          contact_name?: string | null
          message_content?: string
          media_url?: string | null
          media_type?: string | null
          status?: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled'
          scheduled_at?: string
          sent_at?: string | null
          error_message?: string | null
          retry_count?: number
        }
      }
    }
  }
}