'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  MessageSquare, 
  Users, 
  Clock, 
  TrendingUp, 
  Activity,
  Send,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils'

interface DashboardStats {
  totalCampaigns: number
  activeCampaigns: number
  messagesSent: number
  successRate: number
}

interface RecentCampaign {
  id: string
  name: string
  status: string
  created_at: string
  contacts_count: number
  sent_count: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    messagesSent: 0,
    successRate: 0
  })
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch campaigns stats
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select(`
          id,
          name,
          status,
          created_at,
          campaign_contacts(id, status)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (campaignsError) throw campaignsError

      // Calculate stats
      const totalCampaigns = campaigns?.length || 0
      const activeCampaigns = campaigns?.filter(c => 
        ['running', 'scheduled'].includes(c.status)
      ).length || 0

      let totalContacts = 0
      let totalSent = 0

      const recentCampaignsData = campaigns?.map(campaign => {
        const contacts = campaign.campaign_contacts || []
        const contactsCount = contacts.length
        const sentCount = contacts.filter(c => c.status === 'sent').length
        
        totalContacts += contactsCount
        totalSent += sentCount

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          created_at: campaign.created_at,
          contacts_count: contactsCount,
          sent_count: sentCount
        }
      }) || []

      const successRate = totalContacts > 0 ? (totalSent / totalContacts) * 100 : 0

      setStats({
        totalCampaigns,
        activeCampaigns,
        messagesSent: totalSent,
        successRate: Math.round(successRate)
      })

      setRecentCampaigns(recentCampaignsData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral das suas campanhas e estatísticas
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Última atualização: {formatDate(new Date())}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Campanhas</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              +2 novos esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              Em execução ou agendadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
            <Send className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messagesSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <Progress value={stats.successRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Campanhas Recentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentCampaigns.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma campanha encontrada</p>
                <p className="text-sm">Crie sua primeira campanha para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-3 bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">
                        {campaign.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(campaign.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          {campaign.sent_count}/{campaign.contacts_count}
                        </div>
                        <p className="text-xs text-muted-foreground">enviadas</p>
                      </div>
                      <Badge 
                        className={getStatusColor(campaign.status)}
                        variant="outline"
                      >
                        {getStatusText(campaign.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Ações Rápidas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 rounded-lg transition-colors text-left border border-blue-200 dark:border-blue-800">
                  <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
                  <div className="text-sm font-medium text-foreground">Nova Campanha</div>
                  <div className="text-xs text-muted-foreground">Criar disparo</div>
                </button>
                
                <button className="p-4 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/30 rounded-lg transition-colors text-left border border-green-200 dark:border-green-800">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
                  <div className="text-sm font-medium text-foreground">Importar Contatos</div>
                  <div className="text-xs text-muted-foreground">CSV ou planilha</div>
                </button>
                
                <button className="p-4 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-950/30 rounded-lg transition-colors text-left border border-orange-200 dark:border-orange-800">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400 mb-2" />
                  <div className="text-sm font-medium text-foreground">Agendar Envio</div>
                  <div className="text-xs text-muted-foreground">Data e hora</div>
                </button>
                
                <button className="p-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/30 rounded-lg transition-colors text-left border border-purple-200 dark:border-purple-800">
                  <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
                  <div className="text-sm font-medium text-foreground">Ver Relatórios</div>
                  <div className="text-xs text-muted-foreground">Analytics</div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Status do Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="status-dot success"></div>
              <div>
                <div className="font-medium text-foreground">APIs WhatsApp</div>
                <div className="text-sm text-muted-foreground">Todas conectadas</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="status-dot success"></div>
              <div>
                <div className="font-medium text-foreground">Sistema de Filas</div>
                <div className="text-sm text-muted-foreground">Operacional</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="status-dot success"></div>
              <div>
                <div className="font-medium text-foreground">Google Sheets</div>
                <div className="text-sm text-muted-foreground">Sincronizado</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}