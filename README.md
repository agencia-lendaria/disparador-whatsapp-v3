# 🚀 Disparador WhatsApp Pro V3

Sistema avançado de disparos em massa para WhatsApp com integração múltipla de APIs e controles anti-spam inteligentes.

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Como Usar](#-como-usar)
- [Estrutura do Banco](#-estrutura-do-banco)
- [APIs Suportadas](#-apis-suportadas)
- [Contribuição](#-contribuição)

## ✨ Funcionalidades

### 🎯 Gestão de Campanhas
- **Criação de Campanhas**: Interface intuitiva com wizard de 6 etapas
- **Múltiplas Mensagens**: Suporte a texto, imagem, vídeo, áudio e documentos
- **Agendamento**: Sistema de agendamento com controle de horários
- **Status em Tempo Real**: Acompanhamento detalhado do progresso

### 🛡️ Controles Anti-Spam
- **Delays Inteligentes**: Intervalos aleatórios entre mensagens
- **Pausas Automáticas**: Sistema de pausas após X mensagens
- **Limites Diários**: Controle de volume por dia
- **Horários Permitidos**: Restrição de envios por horário

### 🔗 Integrações
- **Evolution API**: Suporte completo v1 e v2
- **Meta Cloud API**: API oficial do WhatsApp Business
- **Google Sheets**: Importação direta de contatos
- **Supabase**: Banco de dados em tempo real

### 📊 Monitoramento
- **Dashboard Completo**: Métricas e estatísticas detalhadas
- **Histórico de Envios**: Log completo de todas as operações
- **Gestão de Erros**: Sistema de retry e tratamento de falhas

## 🛠️ Tecnologias

- **Frontend**: Next.js 14 + App Router
- **UI**: Tailwind CSS + Shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **TypeScript**: Tipagem completa
- **Deploy**: Vercel Ready

## 📚 Pré-requisitos

- Node.js 18+ 
- NPM ou Yarn
- Conta no Supabase
- API do WhatsApp (Evolution ou Meta Cloud)

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/agencia-lendaria/disparador-whatsapp-v3.git
cd disparador-whatsapp-v3
```

### 2. Instale as dependências
```bash
npm install
# ou
yarn install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
```

### 4. Configure o Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Execute o script SQL do banco (ver seção [Estrutura do Banco](#-estrutura-do-banco))
4. Configure as credenciais no `.env.local`

### 5. Execute o projeto
```bash
npm run dev
# ou
yarn dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuração

### Variáveis de Ambiente

Edite o arquivo `.env.local` com suas credenciais:

```env
# Supabase (OBRIGATÓRIO)
NEXT_PUBLIC_SUPABASE_URL=https://seuprojetoid.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# APIs WhatsApp (OPCIONAL)
EVOLUTION_API_BASE_URL=https://sua-evolution-api.com
META_CLOUD_API_BASE_URL=https://graph.facebook.com/v23.0

# Google Sheets (OPCIONAL)
GOOGLE_SHEETS_API_KEY=sua_chave_google_sheets
```

### Como obter as credenciais Supabase:
1. Dashboard do Supabase → Seu Projeto
2. Settings → API
3. Copie a **Project URL** e **API Keys**

## 💻 Como Usar

### 1. Configurar APIs
- Acesse `/apis`
- Adicione suas configurações de API (Evolution ou Meta Cloud)
- Teste a conectividade

### 2. Criar Campanha
- Acesse `/campaigns/new`
- Siga o wizard de 6 etapas:
  1. **Configuração Básica**: Nome e API
  2. **Contatos**: Upload CSV ou Google Sheets
  3. **Mensagens**: Criar sequência de mensagens
  4. **Controles**: Configurar anti-spam
  5. **Agendamento**: Definir quando enviar
  6. **Revisão**: Confirmar e executar

### 3. Monitorar Envios
- Dashboard com métricas em tempo real
- Status individual de cada contato
- Logs detalhados de erros

## 🗄️ Estrutura do Banco

Execute este script SQL no seu Supabase:

```sql
-- Configurações de API
CREATE TABLE api_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  api_type TEXT CHECK (api_type IN ('evolution_web', 'evolution_cloud', 'meta_cloud')),
  instance_name TEXT,
  access_token TEXT NOT NULL,
  phone_number TEXT,
  phone_number_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campanhas
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  api_config_id UUID REFERENCES api_configurations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'failed')),
  google_sheets_url TEXT,
  sheet_id_column TEXT DEFAULT 'id',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mensagens da campanha
CREATE TABLE campaign_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  content_type TEXT CHECK (content_type IN ('text', 'image', 'video', 'audio', 'document')),
  content TEXT NOT NULL,
  media_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contatos da campanha
CREATE TABLE campaign_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  external_id TEXT,
  phone_number TEXT NOT NULL,
  name TEXT,
  custom_fields JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações de envio
CREATE TABLE sending_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  min_delay_seconds INTEGER DEFAULT 5,
  max_delay_seconds INTEGER DEFAULT 10,
  pause_after_messages INTEGER DEFAULT 50,
  pause_duration_seconds INTEGER DEFAULT 300,
  daily_limit INTEGER,
  allowed_hours_start TIME,
  allowed_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fila de mensagens
CREATE TABLE message_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sending_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;

-- Políticas para api_configurations
CREATE POLICY "Users can view own api_configurations" ON api_configurations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own api_configurations" ON api_configurations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own api_configurations" ON api_configurations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own api_configurations" ON api_configurations FOR DELETE USING (auth.uid() = user_id);

-- Políticas para campaigns
CREATE POLICY "Users can view own campaigns" ON campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON campaigns FOR DELETE USING (auth.uid() = user_id);

-- Políticas para campaign_messages
CREATE POLICY "Users can view campaign_messages" ON campaign_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_messages.campaign_id AND campaigns.user_id = auth.uid())
);
CREATE POLICY "Users can insert campaign_messages" ON campaign_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_messages.campaign_id AND campaigns.user_id = auth.uid())
);
CREATE POLICY "Users can update campaign_messages" ON campaign_messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_messages.campaign_id AND campaigns.user_id = auth.uid())
);
CREATE POLICY "Users can delete campaign_messages" ON campaign_messages FOR DELETE USING (
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_messages.campaign_id AND campaigns.user_id = auth.uid())
);

-- Políticas similares para outras tabelas...
```

## 🔌 APIs Suportadas

### Evolution API v2
- **Web**: Para uso local/dedicado
- **Cloud**: SaaS oficial da Evolution
- **Recursos**: Envio de mídia, status, webhooks

### Meta Cloud API
- **Oficial**: API oficial do WhatsApp Business
- **Recursos**: Máxima entregabilidade e recursos avançados
- **Requisitos**: Conta business verificada

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua feature branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Add nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🔧 Suporte

- **Issues**: [GitHub Issues](https://github.com/agencia-lendaria/disparador-whatsapp-v3/issues)
- **Documentação**: [Wiki do Projeto](https://github.com/agencia-lendaria/disparador-whatsapp-v3/wiki)
- **Contato**: suporte@agencialendaria.ai

---

⭐ **Desenvolvido pela [Agência Lendária](https://agencialendaria.ai)** ⭐