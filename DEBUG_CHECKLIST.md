# DEBUG CHECKLIST - Campanha WhatsApp Dispatcher Pro v3

## 🎯 OBJETIVO
Investigar e corrigir o problema onde campanhas ficam no status "Executando" sem enviar mensagens.

## 📋 PLANO DE AÇÃO

### ✅ FASE 1: PREPARAÇÃO E SETUP
- [ ] **1.1** Criar este arquivo de checklist para tracking
- [ ] **1.2** Iniciar servidor de desenvolvimento (`npm run dev`)
- [ ] **1.3** Verificar se aplicação está rodando corretamente

### 🔍 FASE 2: INVESTIGAÇÃO INICIAL
- [ ] **2.1** Usar Playwright para navegar até aplicação
- [ ] **2.2** Fazer login com credenciais: `tuan.medeiros@gmail.com` / `123456@Test`
- [ ] **2.3** Acessar seção de campanhas
- [ ] **2.4** Verificar se API "Whats Test 2" está configurada

### 🧪 FASE 3: TESTE DO FLUXO DE CAMPANHA
- [ ] **3.1** Criar nova campanha com dados de teste:
  - Nome: "Test play"
  - API: "Whats Test 2"
  - Google Sheets: `https://docs.google.com/spreadsheets/d/1fm58NqH25YXcK8ZedmTJ9bNi4HQTFF93dI7gVuf7OIY/edit`
- [ ] **3.2** Importar contatos CSV:
  ```
  ID,Telefone,Nome,Empresa
  1,5511950432826,Tuan,Tech Corp
  ```
- [ ] **3.3** Configurar mensagem: "Oiee Playwright! Como vai {{nome}}?"
- [ ] **3.4** Definir controles de envio (delays 5-10s, pausa após 2 msgs)
- [ ] **3.5** Iniciar campanha e monitorar

### 🔧 FASE 4: ANÁLISE DE LOGS E ERROS
- [ ] **4.1** Monitorar console do browser durante criação da campanha
- [ ] **4.2** Verificar Network tab para requests falhando
- [ ] **4.3** Analisar logs do servidor Node.js
- [ ] **4.4** Identificar onde o processo de envio está travando

### 📚 FASE 5: REVISÃO DA DOCUMENTAÇÃO
- [ ] **5.1** Consultar documentação Evolution API v2 via Context7
- [ ] **5.2** Verificar formato correto para envio de mensagens
- [ ] **5.3** Validar endpoint: `POST /message/sendText/{instance}`
- [ ] **5.4** Confirmar headers e estrutura de dados

### 🧪 FASE 6: TESTE DIRETO DA API
- [ ] **6.1** Testar chamada direta para Evolution API:
  ```bash
  curl --request POST \
    --url https://evolution-ops.agencialendaria.ai/message/sendText/agent_smith \
    --header 'Content-Type: application/json' \
    --header 'apikey: 299EBC6A332D-4E6C-BE9C-03191E417583' \
    --data '{
    "number": "5511950432826@s.whatsapp.net",
    "text": "Teste direto da API"
  }'
  ```
- [ ] **6.2** Verificar se API responde corretamente
- [ ] **6.3** Comparar com implementação no código

### 🔍 FASE 7: ANÁLISE DO CÓDIGO
- [ ] **7.1** Revisar código de criação de campanhas
- [ ] **7.2** Analisar processo de envio de mensagens
- [ ] **7.3** Verificar atualização de status das campanhas
- [ ] **7.4** Identificar onde o processo está falhando

### 🛠️ FASE 8: CORREÇÕES
- [ ] **8.1** Implementar fixes identificados
- [ ] **8.2** Corrigir integração com Evolution API
- [ ] **8.3** Ajustar atualização de status das campanhas
- [ ] **8.4** Implementar tratamento de erros adequado

### ✅ FASE 9: VALIDAÇÃO
- [ ] **9.1** Testar novamente criação de campanha
- [ ] **9.2** Verificar se mensagens são enviadas
- [ ] **9.3** Confirmar atualização correta do status
- [ ] **9.4** Validar logs e feedback visual

## 📊 DADOS DE TESTE

### API Configuration "Whats Test 2"
- **URL**: https://evolution-ops.agencialendaria.ai
- **Tipo**: Evolution API (WhatsApp Web)  
- **Número**: 5511942329919
- **API Key**: 299EBC6A332D-4E6C-BE9C-03191E417583
- **Instância**: agent_smith

### Contato de Teste
- **ID**: 1
- **Telefone**: 5511950432826 (formato WhatsApp: 5511950432826@s.whatsapp.net)
- **Nome**: Tuan
- **Empresa**: Tech Corp

### Credenciais de Login
- **Email**: tuan.medeiros@gmail.com
- **Senha**: 123456@Test

## 🚨 PONTOS DE ATENÇÃO
- Verificar se tokens estão sendo descriptografados corretamente
- Validar formato dos números de telefone
- Confirmar se instância Evolution API está ativa
- Checar se há rate limiting ou bloqueios
- Verificar se RLS policies estão corretas no Supabase

## 📝 NOTAS
- Status atual: Campanhas ficam em "Executando" sem enviar
- Problema provável: Falha na integração com Evolution API
- Foco: Sistema de dispatch de mensagens e atualização de status