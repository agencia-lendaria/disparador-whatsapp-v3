'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  FileText, 
  MessageSquare,
  Settings,
  Calendar,
  Users,
  Play,
  Save,
  Eye
} from 'lucide-react'
import { FileDropzone } from '@/components/ui/file-dropzone'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type ApiConfiguration = Database['public']['Tables']['api_configurations']['Row']

interface ContactData {
  external_id: string
  phone_number: string
  name: string
  custom_fields?: Record<string, any>
}

interface MessageData {
  content_type: 'text' | 'image' | 'video' | 'audio' | 'document'
  content: string
  media_url?: string
  order_index: number
}

interface SendingConfig {
  min_delay_seconds: number
  max_delay_seconds: number
  pause_after_messages: number
  pause_duration_seconds: number
  daily_limit?: number
  allowed_hours_start?: string
  allowed_hours_end?: string
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [apiConfigurations, setApiConfigurations] = useState<ApiConfiguration[]>([])
  
  // Dados da campanha
  const [campaignData, setCampaignData] = useState({
    name: '',
    api_config_id: '',
    google_sheets_url: '',
    sheet_id_column: 'id',
    scheduled_at: ''
  })
  
  const [contacts, setContacts] = useState<ContactData[]>([])
  const [messages, setMessages] = useState<MessageData[]>([])
  const [csvText, setCsvText] = useState('')
  const [importMode, setImportMode] = useState<'file' | 'text'>('file')
  const [sendingConfig, setSendingConfig] = useState<SendingConfig>({
    min_delay_seconds: 5,
    max_delay_seconds: 10,
    pause_after_messages: 50,
    pause_duration_seconds: 300
  })

  const steps = [
    { id: 1, title: 'Configuração Básica', icon: Settings },
    { id: 2, title: 'Contatos', icon: Users }, 
    { id: 3, title: 'Mensagens', icon: MessageSquare },
    { id: 4, title: 'Controles de Envio', icon: Settings },
    { id: 5, title: 'Agendamento', icon: Calendar },
    { id: 6, title: 'Revisão', icon: Eye }
  ]

  useEffect(() => {
    fetchApiConfigurations()
  }, [])

  const fetchApiConfigurations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('api_configurations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (error) throw error
      setApiConfigurations(data || [])
    } catch (error) {
      console.error('Error fetching API configurations:', error)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const parseCSVText = (text: string) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []
    
    const headers = lines[0].split(',').map(h => h.trim())
    const contactsData: ContactData[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length >= 3 && values[1] && values[2]) {
        const contact: ContactData = {
          external_id: values[0] || `contact_${i}`,
          phone_number: values[1] || '',
          name: values[2] || '',
          custom_fields: {}
        }
        
        // Adicionar campos personalizados
        for (let j = 3; j < values.length && j < headers.length; j++) {
          if (values[j] && headers[j]) {
            contact.custom_fields![headers[j]] = values[j]
          }
        }
        
        contactsData.push(contact)
      }
    }
    
    return contactsData
  }

  const handleContactsUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const contactsData = parseCSVText(text)
      setContacts(contactsData)
    }
    
    reader.readAsText(file)
  }

  const handleDropzoneFileSelect = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const contactsData = parseCSVText(text)
      setContacts(contactsData)
    }
    
    reader.readAsText(file)
  }

  const handleCSVTextChange = (text: string) => {
    setCsvText(text)
    if (text.trim()) {
      const contactsData = parseCSVText(text)
      setContacts(contactsData)
    } else {
      setContacts([])
    }
  }

  const addMessage = () => {
    const newMessage: MessageData = {
      content_type: 'text',
      content: '',
      order_index: messages.length
    }
    setMessages([...messages, newMessage])
  }

  const updateMessage = (index: number, updates: Partial<MessageData>) => {
    const updatedMessages = messages.map((msg, i) => 
      i === index ? { ...msg, ...updates } : msg
    )
    setMessages(updatedMessages)
  }

  const removeMessage = (index: number) => {
    const updatedMessages = messages.filter((_, i) => i !== index)
      .map((msg, i) => ({ ...msg, order_index: i }))
    setMessages(updatedMessages)
  }

  const saveCampaign = async (isDraft = true) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Criar campanha
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          name: campaignData.name,
          api_config_id: campaignData.api_config_id || null,
          google_sheets_url: campaignData.google_sheets_url || null,
          sheet_id_column: campaignData.sheet_id_column || null,
          scheduled_at: campaignData.scheduled_at || null,
          status: isDraft ? 'draft' : (campaignData.scheduled_at ? 'scheduled' : 'running')
        })
        .select()
        .single()

      if (campaignError) throw campaignError

      // Salvar mensagens
      if (messages.length > 0) {
        const { error: messagesError } = await supabase
          .from('campaign_messages')
          .insert(
            messages.map(msg => ({
              campaign_id: campaign.id,
              ...msg
            }))
          )

        if (messagesError) throw messagesError
      }

      // Salvar contatos
      if (contacts.length > 0) {
        const { error: contactsError } = await supabase
          .from('campaign_contacts')
          .insert(
            contacts.map(contact => ({
              campaign_id: campaign.id,
              ...contact
            }))
          )

        if (contactsError) throw contactsError
      }

      // Salvar configurações de envio
      const { error: configError } = await supabase
        .from('sending_configurations')
        .insert({
          campaign_id: campaign.id,
          ...sendingConfig
        })

      if (configError) throw configError

      // Criar fila de mensagens para campanhas que não são rascunho
      if (!isDraft && contacts.length > 0 && messages.length > 0) {
        console.log('Creating message queue for campaign:', campaign.id)
        
        // Get saved contacts and messages with IDs
        const { data: savedContacts } = await supabase
          .from('campaign_contacts')
          .select('id, phone_number, name')
          .eq('campaign_id', campaign.id)

        const { data: savedMessages } = await supabase
          .from('campaign_messages')
          .select('id, content, media_url, content_type, order_index')
          .eq('campaign_id', campaign.id)
          .order('order_index')

        if (savedContacts && savedMessages) {
          // Create message queue entries for each contact-message combination
          const messageQueueEntries = []
          const baseScheduledTime = campaignData.scheduled_at 
            ? new Date(campaignData.scheduled_at) 
            : new Date()

          // For now, use the first message (later can implement sequence logic)
          const primaryMessage = savedMessages[0]
          
          for (let i = 0; i < savedContacts.length; i++) {
            const contact = savedContacts[i]
            
            // Calculate scheduled time with delays
            const delay = i * ((sendingConfig.min_delay_seconds + sendingConfig.max_delay_seconds) / 2) * 1000
            const scheduledAt = new Date(baseScheduledTime.getTime() + delay)

            messageQueueEntries.push({
              campaign_id: campaign.id,
              contact_id: contact.id,
              contact_phone: contact.phone_number,
              contact_name: contact.name,
              message_content: primaryMessage.content,
              media_url: primaryMessage.media_url,
              media_type: primaryMessage.content_type,
              status: 'pending',
              scheduled_at: scheduledAt.toISOString(),
              retry_count: 0
            })
          }

          // Insert message queue entries
          const { error: queueError } = await supabase
            .from('message_queue')
            .insert(messageQueueEntries)

          if (queueError) {
            console.error('Error creating message queue:', queueError)
            throw queueError
          }

          console.log(`Created ${messageQueueEntries.length} message queue entries`)

          // Start message processor automatically
          try {
            await fetch('/api/message-queue/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            })
            console.log('Message processor started')
            
            // Also trigger immediate processing
            await fetch('/api/message-queue/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            })
            console.log('Message processor triggered')
          } catch (processorError) {
            console.warn('Failed to start/trigger message processor:', processorError)
            // Don't fail the campaign creation for this
          }
        }
      }

      router.push('/campaigns')
    } catch (error) {
      console.error('Error saving campaign:', error)
      alert('Erro ao salvar campanha')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Nome da Campanha</Label>
              <Input
                id="name"
                value={campaignData.name}
                onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                placeholder="Ex: Promoção Black Friday"
                required
              />
            </div>

            <div>
              <Label htmlFor="api_config">Configuração de API</Label>
              <select
                id="api_config"
                value={campaignData.api_config_id}
                onChange={(e) => setCampaignData({ ...campaignData, api_config_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione uma configuração</option>
                {apiConfigurations.map(config => (
                  <option key={config.id} value={config.id}>
                    {config.name} ({config.api_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="sheets_url">Google Sheets URL (Opcional)</Label>
              <Input
                id="sheets_url"
                value={campaignData.google_sheets_url}
                onChange={(e) => setCampaignData({ ...campaignData, google_sheets_url: e.target.value })}
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />
            </div>

            {campaignData.google_sheets_url && (
              <div>
                <Label htmlFor="id_column">Coluna ID</Label>
                <Input
                  id="id_column"
                  value={campaignData.sheet_id_column}
                  onChange={(e) => setCampaignData({ ...campaignData, sheet_id_column: e.target.value })}
                  placeholder="id"
                />
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label>Método de Importação</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="importMode"
                    value="file"
                    checked={importMode === 'file'}
                    onChange={(e) => setImportMode(e.target.value as 'file' | 'text')}
                    className="mr-2"
                  />
                  Upload de Arquivo
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="importMode"
                    value="text"
                    checked={importMode === 'text'}
                    onChange={(e) => setImportMode(e.target.value as 'file' | 'text')}
                    className="mr-2"
                  />
                  Colar CSV
                </label>
              </div>
            </div>

            {importMode === 'file' ? (
              <div>
                <Label>Upload de Contatos (CSV)</Label>
                <div className="mt-2">
                  <FileDropzone
                    onFileSelect={handleDropzoneFileSelect}
                    accept=".csv,.txt"
                    maxSize={5}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Formato: ID, Telefone, Nome, Campos Personalizados...
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="csv_text">Cole o conteúdo CSV</Label>
                <Textarea
                  id="csv_text"
                  value={csvText}
                  onChange={(e) => handleCSVTextChange(e.target.value)}
                  placeholder="ID,Telefone,Nome,Campo1,Campo2&#10;1,5511999999999,João Silva,valor1,valor2&#10;2,5511888888888,Maria Santos,valor3,valor4"
                  rows={8}
                  className="mt-2 font-mono text-sm"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Cole aqui o conteúdo do seu CSV. Primeira linha deve conter os cabeçalhos.
                </p>
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800 font-semibold mb-1">Exemplo:</p>
                  <code className="text-xs text-blue-700">
                    ID,Telefone,Nome,Empresa<br />
                    1,5511999999999,João Silva,Tech Corp<br />
                    2,5511888888888,Maria Santos,Design Ltd
                  </code>
                </div>
              </div>
            )}

            {contacts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Contatos Carregados ({contacts.length})
                </h3>
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">ID</th>
                        <th className="p-2 text-left">Telefone</th>
                        <th className="p-2 text-left">Nome</th>
                        <th className="p-2 text-left">Campos Extras</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.slice(0, 10).map((contact, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{contact.external_id}</td>
                          <td className="p-2">{contact.phone_number}</td>
                          <td className="p-2">{contact.name}</td>
                          <td className="p-2 text-xs text-gray-500">
                            {Object.keys(contact.custom_fields || {}).length > 0
                              ? Object.keys(contact.custom_fields || {}).join(', ')
                              : '-'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {contacts.length > 10 && (
                    <p className="p-2 text-gray-500 bg-gray-50 text-center">
                      ... e mais {contacts.length - 10} contatos
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Mensagens da Campanha</h3>
              <Button onClick={addMessage} size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Adicionar Mensagem
              </Button>
            </div>

            {messages.map((message, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">Mensagem {index + 1}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeMessage(index)}
                      >
                        Remover
                      </Button>
                    </div>

                    <div>
                      <Label>Tipo de Conteúdo</Label>
                      <select
                        value={message.content_type}
                        onChange={(e) => updateMessage(index, { 
                          content_type: e.target.value as any 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="text">Texto</option>
                        <option value="image">Imagem</option>
                        <option value="video">Vídeo</option>
                        <option value="audio">Áudio</option>
                        <option value="document">Documento</option>
                      </select>
                    </div>

                    <div>
                      <Label>Conteúdo</Label>
                      <Textarea
                        value={message.content}
                        onChange={(e) => updateMessage(index, { content: e.target.value })}
                        placeholder="Digite sua mensagem... Use {{nome}} para personalizar"
                        rows={4}
                      />
                    </div>

                    {message.content_type !== 'text' && (
                      <div>
                        <Label>URL da Mídia</Label>
                        <Input
                          value={message.media_url || ''}
                          onChange={(e) => updateMessage(index, { media_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma mensagem adicionada</p>
                <p className="text-sm">Clique em "Adicionar Mensagem" para começar</p>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Configurações Anti-Spam</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="min_delay">Delay Mínimo (segundos)</Label>
                <Input
                  id="min_delay"
                  type="number"
                  value={sendingConfig.min_delay_seconds}
                  onChange={(e) => setSendingConfig({ 
                    ...sendingConfig, 
                    min_delay_seconds: parseInt(e.target.value) 
                  })}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="max_delay">Delay Máximo (segundos)</Label>
                <Input
                  id="max_delay"
                  type="number"
                  value={sendingConfig.max_delay_seconds}
                  onChange={(e) => setSendingConfig({ 
                    ...sendingConfig, 
                    max_delay_seconds: parseInt(e.target.value) 
                  })}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="pause_after">Pausar após X mensagens</Label>
                <Input
                  id="pause_after"
                  type="number"
                  value={sendingConfig.pause_after_messages}
                  onChange={(e) => setSendingConfig({ 
                    ...sendingConfig, 
                    pause_after_messages: parseInt(e.target.value) 
                  })}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="pause_duration">Duração da pausa (segundos)</Label>
                <Input
                  id="pause_duration"
                  type="number"
                  value={sendingConfig.pause_duration_seconds}
                  onChange={(e) => setSendingConfig({ 
                    ...sendingConfig, 
                    pause_duration_seconds: parseInt(e.target.value) 
                  })}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="daily_limit">Limite diário (opcional)</Label>
                <Input
                  id="daily_limit"
                  type="number"
                  value={sendingConfig.daily_limit || ''}
                  onChange={(e) => setSendingConfig({ 
                    ...sendingConfig, 
                    daily_limit: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  min="1"
                />
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Agendamento da Campanha</h3>
            
            <div>
              <Label htmlFor="scheduled_at">Data e Hora de Início (opcional)</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={campaignData.scheduled_at}
                onChange={(e) => setCampaignData({ 
                  ...campaignData, 
                  scheduled_at: e.target.value 
                })}
              />
              <p className="text-sm text-gray-500 mt-2">
                Deixe em branco para iniciar imediatamente
              </p>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Revisão da Campanha</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuração Básica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Nome:</strong> {campaignData.name}</p>
                  <p><strong>API:</strong> {
                    apiConfigurations.find(c => c.id === campaignData.api_config_id)?.name
                  }</p>
                  {campaignData.google_sheets_url && (
                    <p><strong>Google Sheets:</strong> Configurado</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contatos e Mensagens</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Contatos:</strong> {contacts.length}</p>
                  <p><strong>Mensagens:</strong> {messages.length}</p>
                  <p><strong>Delay:</strong> {sendingConfig.min_delay_seconds}-{sendingConfig.max_delay_seconds}s</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={() => saveCampaign(true)}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar como Rascunho
              </Button>
              <Button
                onClick={() => saveCampaign(false)}
                disabled={loading}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                {campaignData.scheduled_at ? 'Agendar Campanha' : 'Iniciar Campanha'}
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Campanha</h1>
          <p className="text-gray-600">Configure sua campanha de disparo de mensagens</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= step.id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs mt-2 text-center max-w-20">{step.title}</p>
              </div>
            )
          })}
        </div>
        <Progress value={(currentStep / steps.length) * 100} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1]?.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        
        {currentStep < steps.length && (
          <Button onClick={nextStep}>
            Próximo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}