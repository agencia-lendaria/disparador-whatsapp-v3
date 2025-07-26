'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Filter, 
  Play, 
  Pause, 
  MoreHorizontal,
  Calendar,
  Users,
  MessageSquare,
  Copy,
  Edit,
  Trash2,
  StopCircle
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils'

interface Campaign {
  id: string
  name: string
  status: string
  created_at: string
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  contacts_count: number
  sent_count: number
  api_configuration: {
    name: string
    api_type: string
  }
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchCampaigns()
    
    // Configurar realtime subscription para campanhas
    const subscription = supabase
      .channel('campaigns_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns'
        },
        (payload) => {
          console.log('Campaign change received:', payload)
          
          if (payload.eventType === 'UPDATE') {
            setCampaigns(prev => 
              prev.map(campaign => 
                campaign.id === payload.new.id
                  ? { ...campaign, ...payload.new }
                  : campaign
              )
            )
          } else if (payload.eventType === 'INSERT') {
            fetchCampaigns() // Recarregar para pegar dados completos
          } else if (payload.eventType === 'DELETE') {
            setCampaigns(prev => 
              prev.filter(campaign => campaign.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    // Configurar subscription para contatos (para atualizar contadores)
    const contactsSubscription = supabase
      .channel('campaign_contacts_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaign_contacts'
        },
        (payload) => {
          // Atualizar contador de mensagens enviadas quando status do contato muda
          if (payload.new.status === 'sent' && payload.old.status !== 'sent') {
            setCampaigns(prev => 
              prev.map(campaign => 
                campaign.id === payload.new.campaign_id
                  ? { ...campaign, sent_count: campaign.sent_count + 1 }
                  : campaign
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      contactsSubscription.unsubscribe()
    }
  }, [])

  const fetchCampaigns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          id,
          name,
          status,
          created_at,
          scheduled_at,
          started_at,
          completed_at,
          api_configurations!campaigns_api_config_id_fkey (
            name,
            api_type
          ),
          campaign_contacts (
            id,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const campaignsWithStats = data?.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        created_at: campaign.created_at,
        scheduled_at: campaign.scheduled_at,
        started_at: campaign.started_at,
        completed_at: campaign.completed_at,
        contacts_count: campaign.campaign_contacts?.length || 0,
        sent_count: campaign.campaign_contacts?.filter(c => c.status === 'sent').length || 0,
        api_configuration: Array.isArray(campaign.api_configurations) 
          ? campaign.api_configurations[0] 
          : campaign.api_configurations
      })) || []

      setCampaigns(campaignsWithStats)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCampaignAction = async (campaignId: string, action: 'pause' | 'resume' | 'cancel' | 'duplicate' | 'delete') => {
    setActionLoading(campaignId)
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (session?.access_token) {
        headers['authorization'] = `Bearer ${session.access_token}`
      }

      let response
      
      switch (action) {
        case 'pause':
          response = await fetch(`/api/campaigns/${campaignId}/pause`, { method: 'PUT', headers })
          break
        case 'resume':
          response = await fetch(`/api/campaigns/${campaignId}/resume`, { method: 'PUT', headers })
          break
        case 'cancel':
          response = await fetch(`/api/campaigns/${campaignId}/cancel`, { method: 'PUT', headers })
          break
        case 'duplicate':
          response = await fetch(`/api/campaigns/${campaignId}/duplicate`, { method: 'POST', headers })
          break
        case 'delete':
          if (!confirm('Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.')) {
            return
          }
          response = await fetch(`/api/campaigns/${campaignId}/delete`, { method: 'DELETE', headers })
          break
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao executar ação')
      }

      const result = await response.json()
      
      if (action === 'delete') {
        // Remover campanha da lista
        setCampaigns(prev => prev.filter(c => c.id !== campaignId))
      } else if (action === 'duplicate') {
        // Recarregar lista para mostrar nova campanha
        await fetchCampaigns()
      } else {
        // Atualizar status da campanha
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, status: result.campaign.status }
            : campaign
        ))
      }
      
    } catch (error) {
      console.error(`Error ${action} campaign:`, error)
      alert(`Erro ao ${action === 'pause' ? 'pausar' : action === 'resume' ? 'retomar' : action === 'cancel' ? 'cancelar' : action === 'duplicate' ? 'duplicar' : 'excluir'} campanha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
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
          <h1 className="text-3xl font-bold text-foreground">Campanhas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas campanhas de disparo de mensagens
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button className="gradient-primary text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campanhas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="scheduled">Agendada</option>
          <option value="running">Executando</option>
          <option value="paused">Pausada</option>
          <option value="completed">Concluída</option>
          <option value="failed">Falhou</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{campaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold text-foreground">
                  {campaigns.filter(c => ['running', 'scheduled'].includes(c.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Agendadas</p>
                <p className="text-2xl font-bold text-foreground">
                  {campaigns.filter(c => c.status === 'scheduled').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Contatos</p>
                <p className="text-2xl font-bold text-foreground">
                  {campaigns.reduce((sum, campaign) => sum + campaign.contacts_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhuma campanha encontrada
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Nenhuma campanha corresponde aos filtros aplicados.'
                  : 'Comece criando sua primeira campanha de disparo.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href="/campaigns/new">
                  <Button className="gradient-primary text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Campanha
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {campaign.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {campaign.api_configuration?.name} • {formatDate(campaign.created_at)}
                        </p>
                      </div>
                      <Badge 
                        className={getStatusColor(campaign.status)}
                        variant="outline"
                      >
                        {getStatusText(campaign.status)}
                      </Badge>
                    </div>
                    
                    <div className="mt-4 flex items-center space-x-6 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {campaign.contacts_count} contatos
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {campaign.sent_count} enviadas
                      </div>
                      {campaign.scheduled_at && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(campaign.scheduled_at)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {campaign.status === 'running' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCampaignAction(campaign.id, 'pause')}
                        disabled={actionLoading === campaign.id}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pausar
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCampaignAction(campaign.id, 'resume')}
                        disabled={actionLoading === campaign.id}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Retomar
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled={actionLoading === campaign.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => window.location.href = `/campaigns/${campaign.id}/edit`}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleCampaignAction(campaign.id, 'duplicate')}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        {['running', 'paused', 'scheduled'].includes(campaign.status) && (
                          <DropdownMenuItem 
                            onClick={() => handleCampaignAction(campaign.id, 'cancel')}
                            className="text-orange-600"
                          >
                            <StopCircle className="h-4 w-4 mr-2" />
                            Cancelar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleCampaignAction(campaign.id, 'delete')}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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