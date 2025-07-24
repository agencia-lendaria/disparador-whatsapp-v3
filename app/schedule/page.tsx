'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  Trash2,
  Edit,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils'

interface ScheduledCampaign {
  id: string
  name: string
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed'
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  api_configuration?: {
    name: string
    api_type: string
  } | null
  _count?: {
    campaign_contacts: number
    campaign_messages: number
  }
}

export default function SchedulePage() {
  const [campaigns, setCampaigns] = useState<ScheduledCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchScheduledCampaigns()
  }, [])

  const fetchScheduledCampaigns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          api_configurations!inner(name, api_type),
          campaign_contacts(count),
          campaign_messages(count)
        `)
        .eq('user_id', user.id)
        .in('status', ['scheduled', 'running', 'paused'])
        .order('scheduled_at', { ascending: true })

      if (error) throw error

      // Transform the data to include counts
      const transformedData = data?.map(campaign => ({
        ...campaign,
        api_configuration: campaign.api_configurations,
        _count: {
          campaign_contacts: campaign.campaign_contacts?.length || 0,
          campaign_messages: campaign.campaign_messages?.length || 0
        }
      })) || []

      setCampaigns(transformedData)
    } catch (error) {
      console.error('Error fetching scheduled campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCampaignAction = async (campaignId: string, action: 'start' | 'pause' | 'resume' | 'cancel') => {
    setActionLoading(campaignId)
    try {
      let newStatus: string
      let updateData: any = {}

      switch (action) {
        case 'start':
          newStatus = 'running'
          updateData = { 
            status: newStatus, 
            started_at: new Date().toISOString() 
          }
          break
        case 'pause':
          newStatus = 'paused'
          updateData = { status: newStatus }
          break
        case 'resume':
          newStatus = 'running'
          updateData = { status: newStatus }
          break
        case 'cancel':
          newStatus = 'draft'
          updateData = { 
            status: newStatus, 
            scheduled_at: null,
            started_at: null 
          }
          break
        default:
          return
      }

      const { error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', campaignId)

      if (error) throw error

      await fetchScheduledCampaigns()
    } catch (error) {
      console.error(`Error ${action}ing campaign:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  const getTimeUntilScheduled = (scheduledAt: string) => {
    const now = new Date()
    const scheduled = new Date(scheduledAt)
    const diff = scheduled.getTime() - now.getTime()

    if (diff <= 0) return 'Agora'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />
      case 'running':
        return <Play className="h-4 w-4" />
      case 'paused':
        return <Pause className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas campanhas agendadas e em execução
          </p>
        </div>
        <Button 
          onClick={() => window.location.href = '/campaigns/new'}
          className="gradient-primary text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Agendadas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {campaigns.filter(c => c.status === 'scheduled').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Executando</p>
                <p className="text-2xl font-bold text-green-600">
                  {campaigns.filter(c => c.status === 'running').length}
                </p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pausadas</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {campaigns.filter(c => c.status === 'paused').length}
                </p>
              </div>
              <Pause className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Contatos</p>
                <p className="text-2xl font-bold text-purple-600">
                  {campaigns.reduce((acc, c) => acc + (c._count?.campaign_contacts || 0), 0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma campanha agendada
              </h3>
              <p className="text-gray-600 mb-6">
                Suas campanhas agendadas e em execução aparecerão aqui
              </p>
              <Button 
                onClick={() => window.location.href = '/campaigns/new'}
                className="gradient-primary text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Campanha
              </Button>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {campaign.name}
                      </h3>
                      <Badge 
                        variant="outline"
                        className={getStatusColor(campaign.status)}
                      >
                        {getStatusIcon(campaign.status)}
                        <span className="ml-1">{getStatusText(campaign.status)}</span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {campaign.scheduled_at 
                            ? `Agendado: ${formatDate(campaign.scheduled_at)}`
                            : 'Sem agendamento'
                          }
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {campaign.status === 'scheduled' && campaign.scheduled_at
                            ? `Em ${getTimeUntilScheduled(campaign.scheduled_at)}`
                            : campaign.started_at
                            ? `Iniciado: ${formatDate(campaign.started_at)}`
                            : 'Não iniciado'
                          }
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span>{campaign._count?.campaign_contacts || 0} contatos</span>
                        <span>•</span>
                        <span>{campaign._count?.campaign_messages || 0} mensagens</span>
                      </div>
                    </div>

                    {campaign.api_configuration && (
                      <div className="mt-2 text-sm text-gray-500">
                        API: {campaign.api_configuration.name} ({campaign.api_configuration.api_type})
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {campaign.status === 'scheduled' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleCampaignAction(campaign.id, 'start')}
                          disabled={actionLoading === campaign.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Iniciar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCampaignAction(campaign.id, 'cancel')}
                          disabled={actionLoading === campaign.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </>
                    )}

                    {campaign.status === 'running' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCampaignAction(campaign.id, 'pause')}
                        disabled={actionLoading === campaign.id}
                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pausar
                      </Button>
                    )}

                    {campaign.status === 'paused' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleCampaignAction(campaign.id, 'resume')}
                          disabled={actionLoading === campaign.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Retomar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCampaignAction(campaign.id, 'cancel')}
                          disabled={actionLoading === campaign.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `/campaigns/${campaign.id}/edit`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}