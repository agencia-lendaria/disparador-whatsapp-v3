# DADOS PARA TESTES

## Login e Senha
Login e senha da página com essas credenciais para acessar a plataforma:
Login: tuan.medeiros@gmail.com
Senha: 123456@Test


## Teste com Evolution API v2
Quando eu envio mensagem de texto via Evolution API v2, eu faço da seguinte forma usando endpoint "Send Message -> Send Plain Text:
```
curl --request POST \
  --url https://{server-url}/message/sendText/{instance} \
  --header 'Content-Type: application/json' \
  --header 'apikey: <api-key>' \
  --data '{
  "number": "<string>",
  "text": "<string>"
}'
```

Exemplo com variáveis preenchidas: 
```
curl --request POST \
  --url https://evolution-ops.agencialendaria.ai/message/sendText/agent_smith \
  --header 'Content-Type: application/json' \
  --header 'apikey: 299EBC6A332D-4E6C-BE9C-03191E417583' \
  --data '{
  "number": "5511950432826@s.whatsapp.net",
  "text": "Oiee Playwright! Como vai Tuan?"
}'
```

## Dados para Fluxo de teste "Criação de Campanha"
Os dados abaixo são para realizar teste de disparo ao criar campanha.

"""
# Fluxo Test criação de campanha (Exemplos to meu teste)
Para executar os testes eu usei as seguintes configurações da API "Whats Test 2":
URL do Servidor Evolution API: https://evolution-ops.agencialendaria.ai
Tipo de API: Evolution API (WhatsApp Web)
Número do WhatsApp: 5511942329919
Chave API Global (AUTHENTICATION_API_KEY): 299EBC6A332D-4E6C-BE9C-03191E417583
Nome da Instância: agent_smith

## Configuração Básica
Nome da Campanha: Test play
Configuração de API: Whats Test 2
Google Sheets URL (Opcional): https://docs.google.com/spreadsheets/d/1fm58NqH25YXcK8ZedmTJ9bNi4HQTFF93dI7gVuf7OIY/edit?usp=sharing
    Coluna ID: id

## Contatos
Colar CSV:
```
ID,Telefone,Nome,Empresa
1,5511950432826,Tuan,Tech Corp
```

## Mensagens
Tipo de Conteúdo: Texto
Conteúdo: Oiee Playwright! Como vai {{nome}}?

## Controles de Envio
Delay Mínimo (segundos): 5
Delay Máximo (segundos): 10
Pausar após X mensagens: 2
Duração da pausa (segundos): 5

## Agendamento
(deixei em branco para iniciar imediatamente)

## Revisão
Iniciar campanha

"""