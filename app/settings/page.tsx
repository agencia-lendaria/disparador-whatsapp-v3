'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database,
  Save,
  LogOut,
  Key,
  Globe,
  Clock,
  AlertTriangle,
  Download,
  Trash2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

interface AppSettings {
  default_delay_min: number
  default_delay_max: number
  default_daily_limit: number | null
  timezone: string
  notifications_enabled: boolean
  email_reports: boolean
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: ''
  })

  const [settingsData, setSettingsData] = useState<AppSettings>({
    default_delay_min: 5,
    default_delay_max: 10,
    default_daily_limit: null,
    timezone: 'America/Sao_Paulo',
    notifications_enabled: true,
    email_reports: false
  })

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      
      if (user) {
        setUser(user as any)
        setProfileData({
          full_name: user.user_metadata?.full_name || '',
          email: user.email || ''
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.full_name
        }
      })

      if (error) throw error
      
      alert('✅ Perfil atualizado com sucesso!')
      await fetchUserData()
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('❌ Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('As senhas não coincidem')
      return
    }

    if (passwordData.new_password.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      })

      if (error) throw error
      
      alert('✅ Senha atualizada com sucesso!')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (error) {
      console.error('Error updating password:', error)
      alert('❌ Erro ao atualizar senha')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    if (!confirm('Tem certeza que deseja sair?')) return

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: User },
    { id: 'app', name: 'Aplicação', icon: Settings },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'security', name: 'Segurança', icon: Shield },
    { id: 'data', name: 'Dados', icon: Database }
  ]

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="h-64 bg-muted rounded"></div>
            <div className="lg:col-span-3 h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas preferências e configurações da conta
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-none transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Informações do Perfil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        O email não pode ser alterado
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="full_name">Nome Completo</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          full_name: e.target.value
                        })}
                        placeholder="Seu nome completo"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="gradient-primary text-white"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* App Settings Tab */}
          {activeTab === 'app' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Configurações da Aplicação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="delay_min">Delay Mínimo (segundos)</Label>
                    <Input
                      id="delay_min"
                      type="number"
                      min="1"
                      value={settingsData.default_delay_min}
                      onChange={(e) => setSettingsData({
                        ...settingsData,
                        default_delay_min: parseInt(e.target.value)
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="delay_max">Delay Máximo (segundos)</Label>
                    <Input
                      id="delay_max"
                      type="number"
                      min="1"
                      value={settingsData.default_delay_max}
                      onChange={(e) => setSettingsData({
                        ...settingsData,
                        default_delay_max: parseInt(e.target.value)
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="daily_limit">Limite Diário Padrão</Label>
                    <Input
                      id="daily_limit"
                      type="number"
                      min="1"
                      value={settingsData.default_daily_limit || ''}
                      onChange={(e) => setSettingsData({
                        ...settingsData,
                        default_daily_limit: e.target.value ? parseInt(e.target.value) : null
                      })}
                      placeholder="Sem limite"
                    />
                  </div>

                  <div>
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <select
                      id="timezone"
                      value={settingsData.timezone}
                      onChange={(e) => setSettingsData({
                        ...settingsData,
                        timezone: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                      <option value="America/New_York">Nova York (GMT-5)</option>
                      <option value="Europe/London">Londres (GMT+0)</option>
                      <option value="Europe/Madrid">Madrid (GMT+1)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="gradient-primary text-white">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Configurações de Notificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Notificações Push</h3>
                      <p className="text-sm text-muted-foreground">
                        Receba notificações sobre o status das campanhas
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsData.notifications_enabled}
                        onChange={(e) => setSettingsData({
                          ...settingsData,
                          notifications_enabled: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Relatórios por Email</h3>
                      <p className="text-sm text-muted-foreground">
                        Receba relatórios semanais por email
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsData.email_reports}
                        onChange={(e) => setSettingsData({
                          ...settingsData,
                          email_reports: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="gradient-primary text-white">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Notificações
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="current_password">Senha Atual</Label>
                      <Input
                        id="current_password"
                        type="password"
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          current_password: e.target.value
                        })}
                        placeholder="Digite sua senha atual"
                      />
                    </div>

                    <div>
                      <Label htmlFor="new_password">Nova Senha</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          new_password: e.target.value
                        })}
                        placeholder="Digite a nova senha"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          confirm_password: e.target.value
                        })}
                        placeholder="Confirme a nova senha"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="gradient-primary text-white"
                    >
                      <Key className="mr-2 h-4 w-4" />
                      {saving ? 'Atualizando...' : 'Alterar Senha'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Gerenciamento de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Zona de Perigo
                      </h3>
                      <p className="mt-2 text-sm text-yellow-700">
                        As ações abaixo são irreversíveis. Certifique-se antes de prosseguir.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-md">
                    <div>
                      <h3 className="text-sm font-medium">Exportar Dados</h3>
                      <p className="text-sm text-muted-foreground">
                        Baixe todos os seus dados em formato JSON
                      </p>
                    </div>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-md">
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Excluir Conta</h3>
                      <p className="text-sm text-red-600">
                        Remove permanentemente sua conta e todos os dados
                      </p>
                    </div>
                    <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir Conta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sign Out */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Sessão</h3>
                  <p className="text-sm text-muted-foreground">
                    Desconecte-se da sua conta
                  </p>
                </div>
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}