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
  MessageSquare
} from 'lucide-react'
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

  useEffect(() => {
    fetchCampaigns()
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
        api_configuration: campaign.api_configurations
      })) || []

      setCampaigns(campaignsWithStats)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
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
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Campanhas</h1>
          <p className="text-gray-600 mt-1">
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
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ativas</p>
                <p className="text-2xl font-bold">
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
                <p className="text-sm font-medium text-gray-600">Agendadas</p>
                <p className="text-2xl font-bold">
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
                <p className="text-sm font-medium text-gray-600">Contatos</p>
                <p className="text-2xl font-bold">
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
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma campanha encontrada
              </h3>
              <p className="text-gray-600 mb-6">
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
                        <h3 className="text-lg font-semibold text-gray-900">
                          {campaign.name}
                        </h3>
                        <p className="text-sm text-gray-600">
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
                    
                    <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
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
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4 mr-1" />
                        Pausar
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4 mr-1" />
                        Retomar
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <MoreHorizontal className="h-4 w-4" />
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