'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Calendar,
  Filter,
  Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils'

interface CampaignStats {
  id: string
  name: string
  status: string
  total_contacts: number
  sent_count: number
  failed_count: number
  pending_count: number
  success_rate: number
  created_at: string
  completed_at: string | null
}

interface OverallStats {
  total_campaigns: number
  total_contacts: number
  total_sent: number
  total_failed: number
  overall_success_rate: number
  active_campaigns: number
}

export default function ReportsPage() {
  const [campaignStats, setCampaignStats] = useState<CampaignStats[]>([])
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchReports()
  }, [dateRange, statusFilter])

  const fetchReports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Calculate date filter
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange))

      // Fetch campaign statistics
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select(`
          id,
          name,
          status,
          created_at,
          completed_at,
          campaign_contacts(id, status)
        `)
        .eq('user_id', user.id)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false })

      if (campaignsError) throw campaignsError

      // Process campaign statistics
      const processedStats: CampaignStats[] = campaigns?.map(campaign => {
        const contacts = campaign.campaign_contacts || []
        const total_contacts = contacts.length
        const sent_count = contacts.filter((c: any) => c.status === 'sent').length
        const failed_count = contacts.filter((c: any) => c.status === 'failed').length
        const pending_count = contacts.filter((c: any) => c.status === 'pending').length
        const success_rate = total_contacts > 0 ? (sent_count / total_contacts) * 100 : 0

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          total_contacts,
          sent_count,
          failed_count,
          pending_count,
          success_rate,
          created_at: campaign.created_at,
          completed_at: campaign.completed_at
        }
      }) || []

      // Filter by status if needed
      const filteredStats = statusFilter === 'all' 
        ? processedStats 
        : processedStats.filter(stat => stat.status === statusFilter)

      setCampaignStats(filteredStats)

      // Calculate overall statistics
      const overall: OverallStats = {
        total_campaigns: processedStats.length,
        total_contacts: processedStats.reduce((sum, stat) => sum + stat.total_contacts, 0),
        total_sent: processedStats.reduce((sum, stat) => sum + stat.sent_count, 0),
        total_failed: processedStats.reduce((sum, stat) => sum + stat.failed_count, 0),
        overall_success_rate: processedStats.length > 0 
          ? processedStats.reduce((sum, stat) => sum + stat.success_rate, 0) / processedStats.length 
          : 0,
        active_campaigns: processedStats.filter(stat => 
          ['running', 'scheduled', 'paused'].includes(stat.status)
        ).length
      }

      setOverallStats(overall)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    const csvData = campaignStats.map(stat => ({
      'Campanha': stat.name,
      'Status': getStatusText(stat.status),
      'Total de Contatos': stat.total_contacts,
      'Enviados': stat.sent_count,
      'Falharam': stat.failed_count,
      'Pendentes': stat.pending_count,
      'Taxa de Sucesso (%)': stat.success_rate.toFixed(2),
      'Criada em': formatDate(stat.created_at),
      'Concluída em': stat.completed_at ? formatDate(stat.completed_at) : 'Em andamento'
    }))

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_campanhas_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSuccessRateIcon = (rate: number) => {
    if (rate >= 80) return <TrendingUp className="h-4 w-4" />
    if (rate >= 60) return <BarChart3 className="h-4 w-4" />
    return <TrendingDown className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe o desempenho das suas campanhas
          </p>
        </div>
        <Button 
          onClick={exportReport}
          variant="outline"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="365">Último ano</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os status</option>
                <option value="completed">Concluídas</option>
                <option value="running">Em execução</option>
                <option value="scheduled">Agendadas</option>
                <option value="paused">Pausadas</option>
                <option value="failed">Falharam</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Campanhas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {overallStats.total_campaigns}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contatos</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {overallStats.total_contacts.toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mensagens Enviadas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {overallStats.total_sent.toLocaleString()}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                  <p className={`text-2xl font-bold ${getSuccessRateColor(overallStats.overall_success_rate)}`}>
                    {overallStats.overall_success_rate.toFixed(1)}%
                  </p>
                </div>
                {getSuccessRateIcon(overallStats.overall_success_rate)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaign Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Campanha</CardTitle>
        </CardHeader>
        <CardContent>
          {campaignStats.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma campanha encontrada
              </h3>
              <p className="text-gray-600">
                Crie campanhas para ver relatórios detalhados aqui
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campanha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contatos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enviados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Falhas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taxa Sucesso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criada em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaignStats.map((stat) => (
                    <tr key={stat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {stat.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant="outline"
                          className={getStatusColor(stat.status)}
                        >
                          {getStatusText(stat.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.total_contacts.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {stat.sent_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {stat.failed_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getSuccessRateColor(stat.success_rate)}`}>
                          {stat.success_rate.toFixed(1)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              stat.success_rate >= 80 ? 'bg-green-600' :
                              stat.success_rate >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${Math.min(stat.success_rate, 100)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(stat.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `/campaigns/${stat.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}