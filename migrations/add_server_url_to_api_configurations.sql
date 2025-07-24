-- Migração: Adicionar campo server_url à tabela api_configurations
-- Criado em: 2025-01-24
-- Descrição: Adiciona campo server_url obrigatório para configurações Evolution API

-- Adicionar coluna server_url
ALTER TABLE api_configurations 
ADD COLUMN server_url TEXT;

-- Atualizar registros existentes com valor padrão
UPDATE api_configurations 
SET server_url = 'https://evolution-ops.agencialendaria.ai'
WHERE api_type IN ('evolution_web', 'evolution_cloud') 
AND server_url IS NULL;

-- Para Meta Cloud API, definir como Graph API
UPDATE api_configurations 
SET server_url = 'https://graph.facebook.com/v23.0'
WHERE api_type = 'meta_cloud' 
AND server_url IS NULL;

-- Adicionar constraint NOT NULL após preencher valores existentes
ALTER TABLE api_configurations 
ALTER COLUMN server_url SET NOT NULL;

-- Adicionar comentário na coluna
COMMENT ON COLUMN api_configurations.server_url IS 'URL base do servidor da API (Evolution API ou Meta Graph API)';

-- Criar índice para otimizar consultas por server_url
CREATE INDEX idx_api_configurations_server_url ON api_configurations(server_url);

-- Verificar se a migração foi aplicada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'api_configurations' 
AND column_name = 'server_url';