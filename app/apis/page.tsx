'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, 
  Settings, 
  Trash2, 
  Edit,
  CheckCircle,
  XCircle,
  Database,
  Smartphone,
  Cloud
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ApiConfiguration {
  id: string
  name: string
  api_type: 'evolution_web' | 'evolution_cloud' | 'meta_cloud'
  server_url: string
  instance_name: string | null
  phone_number: string | null
  phone_number_id: string | null
  is_active: boolean
  created_at: string
}

export default function ApisPage() {
  const [configurations, setConfigurations] = useState<ApiConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ApiConfiguration | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    api_type: 'evolution_web' as 'evolution_web' | 'evolution_cloud' | 'meta_cloud',
    server_url: '',
    instance_name: '',
    access_token: '',
    phone_number: '',
    phone_number_id: ''
  })
  const [testing, setTesting] = useState<string | null>(null)

  useEffect(() => {
    fetchConfigurations()
  }, [])

  const fetchConfigurations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('api_configurations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setConfigurations(data || [])
    } catch (error) {
      console.error('Error fetching configurations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        user_id: user.id,
        name: formData.name,
        api_type: formData.api_type,
        server_url: formData.server_url,
        instance_name: formData.instance_name || null,
        access_token: formData.access_token,
        phone_number: formData.phone_number || null,
        phone_number_id: formData.phone_number_id || null,
        is_active: true
      }

      let error
      if (editingConfig) {
        const { error: updateError } = await supabase
          .from('api_configurations')
          .update(payload)
          .eq('id', editingConfig.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('api_configurations')
          .insert(payload)
        error = insertError
      }

      if (error) throw error

      resetForm()
      fetchConfigurations()
    } catch (error) {
      console.error('Error saving configuration:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      api_type: 'evolution_web',
      server_url: '',
      instance_name: '',
      access_token: '',
      phone_number: '',
      phone_number_id: ''
    })
    setShowForm(false)
    setEditingConfig(null)
  }

  const handleEdit = (config: ApiConfiguration) => {
    setFormData({
      name: config.name,
      api_type: config.api_type,
      server_url: config.server_url || '',
      instance_name: config.instance_name || '',
      access_token: '', // Don't pre-fill for security
      phone_number: config.phone_number || '',
      phone_number_id: config.phone_number_id || ''
    })
    setEditingConfig(config)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta configuração?')) return

    try {
      const { error } = await supabase
        .from('api_configurations')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchConfigurations()
    } catch (error) {
      console.error('Error deleting configuration:', error)
    }
  }

  const testConnection = async (config: ApiConfiguration) => {
    setTesting(config.id)
    try {
      let isConnected = false
      let errorMessage = ''

      switch (config.api_type) {
        case 'evolution_web':
        case 'evolution_cloud':
          isConnected = await testEvolutionApi(config)
          break
        case 'meta_cloud':
          isConnected = await testMetaCloudApi(config)
          break
        default:
          throw new Error('Tipo de API não suportado')
      }
      
      // Update configuration status
      const { error } = await supabase
        .from('api_configurations')
        .update({ is_active: isConnected })
        .eq('id', config.id)

      if (error) throw error
      
      if (isConnected) {
        alert('✅ Conexão com a API estabelecida com sucesso!\n\n' +
              `Servidor: ${config.server_url}\n` +
              (config.instance_name ? `Instância: ${config.instance_name}\n` : '') +
              'Todas as credenciais estão funcionando corretamente.')
      } else {
        alert('❌ Falha na conexão com a API.\n\n' +
              'Verifique:\n' +
              '• URL do servidor está correta\n' +
              '• Token de acesso é válido\n' +
              '• Nome da instância existe (Evolution API)\n' +
              '• Phone Number ID está correto (Meta Cloud API)')
      }
      
      fetchConfigurations()
    } catch (error) {
      console.error('Error testing connection:', error)
      alert(`❌ Erro ao testar conexão: ${error.message}\n\n` +
            'Dicas de solução:\n' +
            '• Verifique se a URL do servidor está acessível\n' +
            '• Confirme se o token tem as permissões necessárias\n' +
            '• Teste a conectividade com a internet')
      
      // Mark as inactive on error
      await supabase
        .from('api_configurations')
        .update({ is_active: false })
        .eq('id', config.id)
      
      fetchConfigurations()
    } finally {
      setTesting(null)
    }
  }

  const testEvolutionApi = async (config: ApiConfiguration): Promise<boolean> => {
    try {
      const baseUrl = config.server_url || 'https://evolution-ops.agencialendaria.ai'
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10s timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Check if instance exists in the response
      if (config.instance_name) {
        const instanceExists = data.some((instance: any) => 
          instance.instance?.instanceName === config.instance_name
        )
        
        if (!instanceExists) {
          throw new Error(`Instância '${config.instance_name}' não encontrada`)
        }
      }

      return true
    } catch (error) {
      console.error('Evolution API test failed:', error)
      return false
    }
  }

  const testMetaCloudApi = async (config: ApiConfiguration): Promise<boolean> => {
    try {
      if (!config.phone_number_id) {
        throw new Error('Phone Number ID é obrigatório para Meta Cloud API')
      }

      const baseUrl = config.server_url || 'https://graph.facebook.com/v23.0'
      const response = await fetch(`${baseUrl}/${config.phone_number_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10s timeout
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token de acesso inválido')
        } else if (response.status === 404) {
          throw new Error('Phone Number ID não encontrado')
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }

      const data = await response.json()
      
      // Check if we got valid phone number data
      if (!data.id) {
        throw new Error('Resposta inválida da API')
      }

      return true
    } catch (error) {
      console.error('Meta Cloud API test failed:', error)
      return false
    }
  }

  const getApiTypeInfo = (type: string) => {
    switch (type) {
      case 'evolution_web':
        return {
          name: 'Evolution API (WhatsApp Web)',
          icon: Smartphone,
          color: 'bg-blue-500'
        }
      case 'evolution_cloud':
        return {
          name: 'Evolution API (Cloud API)',
          icon: Cloud,
          color: 'bg-green-500'
        }
      case 'meta_cloud':
        return {
          name: 'WhatsApp Cloud API (Meta)',
          icon: Database,
          color: 'bg-purple-500'
        }
      default:
        return {
          name: 'Desconhecido',
          icon: Database,
          color: 'bg-gray-500'
        }
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
          <h1 className="text-3xl font-bold text-gray-900">Configurações de API</h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas conexões com as APIs do WhatsApp
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="gradient-primary text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Configuração
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingConfig ? 'Editar Configuração' : 'Nova Configuração de API'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Configuração</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: WhatsApp Principal"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_type">Tipo de API</Label>
                  <select
                    id="api_type"
                    value={formData.api_type}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      api_type: e.target.value as any,
                      server_url: e.target.value === 'meta_cloud' 
                        ? 'https://graph.facebook.com/v23.0' 
                        : e.target.value.includes('evolution') 
                        ? 'https://evolution-ops.agencialendaria.ai' 
                        : ''
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="evolution_web">Evolution API (WhatsApp Web)</option>
                    <option value="evolution_cloud">Evolution API (Cloud API)</option>
                    <option value="meta_cloud">WhatsApp Cloud API (Meta)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="server_url">
                    {formData.api_type === 'meta_cloud' ? 'URL da API Meta' : 'URL do Servidor Evolution API'}
                  </Label>
                  <Input
                    id="server_url"
                    value={formData.server_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, server_url: e.target.value }))}
                    placeholder={
                      formData.api_type === 'meta_cloud' 
                        ? 'https://graph.facebook.com/v23.0'
                        : 'https://sua-evolution-api.com'
                    }
                    required
                  />
                  <p className="text-sm text-gray-500">
                    {formData.api_type === 'meta_cloud' 
                      ? 'URL base da API oficial do Meta/Facebook'
                      : 'URL onde sua instância da Evolution API está hospedada'
                    }
                  </p>
                </div>

                {(formData.api_type === 'evolution_web' || formData.api_type === 'evolution_cloud') && (
                  <div className="space-y-2">
                    <Label htmlFor="instance_name">Nome da Instância</Label>
                    <Input
                      id="instance_name"
                      value={formData.instance_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, instance_name: e.target.value }))}
                      placeholder="Ex: instance01"
                      required
                    />
                    <p className="text-sm text-gray-500">
                      Nome da instância configurada na sua Evolution API
                    </p>
                  </div>
                )}

                {formData.api_type === 'evolution_web' && (
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Número do WhatsApp</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="+55 11 99999-9999"
                    />
                  </div>
                )}

                {formData.api_type === 'meta_cloud' && (
                  <div className="space-y-2">
                    <Label htmlFor="phone_number_id">Phone Number ID</Label>
                    <Input
                      id="phone_number_id"
                      value={formData.phone_number_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number_id: e.target.value }))}
                      placeholder="ID fornecido pela Meta"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="access_token">Token de Acesso</Label>
                <Textarea
                  id="access_token"
                  value={formData.access_token}
                  onChange={(e) => setFormData(prev => ({ ...prev, access_token: e.target.value }))}
                  placeholder="Cole aqui seu token de acesso..."
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" className="gradient-primary text-white">
                  {editingConfig ? 'Atualizar' : 'Salvar'} Configuração
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Configurations List */}
      <div className="space-y-4">
        {configurations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma configuração encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                Configure suas APIs do WhatsApp para começar a enviar mensagens
              </p>
              <Button 
                onClick={() => setShowForm(true)}
                className="gradient-primary text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Primeira Configuração
              </Button>
            </CardContent>
          </Card>
        ) : (
          configurations.map((config) => {
            const apiInfo = getApiTypeInfo(config.api_type)
            const IconComponent = apiInfo.icon
            
            return (
              <Card key={config.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 ${apiInfo.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {config.name}
                        </h3>
                        <p className="text-sm text-gray-600">{apiInfo.name}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Servidor: {config.server_url}</span>
                          {config.instance_name && (
                            <span>Instância: {config.instance_name}</span>
                          )}
                          {config.phone_number && (
                            <span>Número: {config.phone_number}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Badge
                        variant="outline"
                        className={config.is_active 
                          ? 'text-green-600 bg-green-50 border-green-200'
                          : 'text-red-600 bg-red-50 border-red-200'
                        }
                      >
                        {config.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inativo
                          </>
                        )}
                      </Badge>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testConnection(config)}
                          disabled={testing === config.id}
                        >
                          {testing === config.id ? 'Testando...' : 'Testar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(config)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(config.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}