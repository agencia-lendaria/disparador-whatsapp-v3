-- Migração: Otimizações de performance para api_configurations
-- Criado em: 2025-01-24
-- Descrição: Adiciona índices para melhorar performance das consultas

-- Criar índice composto para user_id (consulta mais comum)
CREATE INDEX IF NOT EXISTS idx_api_configurations_user_id ON api_configurations(user_id);

-- Criar índice composto user_id + is_active para consultas filtradas
CREATE INDEX IF NOT EXISTS idx_api_configurations_user_active ON api_configurations(user_id, is_active);

-- Criar índice user_id + api_type para consultas por tipo de API
CREATE INDEX IF NOT EXISTS idx_api_configurations_user_type ON api_configurations(user_id, api_type);

-- Criar índice user_id + created_at para ordenação por data
CREATE INDEX IF NOT EXISTS idx_api_configurations_user_created ON api_configurations(user_id, created_at DESC);

-- Adicionar constraint para melhorar integridade dos dados
ALTER TABLE api_configurations 
ADD CONSTRAINT chk_api_type CHECK (api_type IN ('evolution_web', 'evolution_cloud', 'meta_cloud'));

-- Adicionar constraint para phone_number_id obrigatório para meta_cloud
ALTER TABLE api_configurations 
ADD CONSTRAINT chk_meta_phone_id CHECK (
  (api_type != 'meta_cloud') OR 
  (api_type = 'meta_cloud' AND phone_number_id IS NOT NULL)
);

-- Adicionar constraint para instance_name obrigatório para evolution APIs
ALTER TABLE api_configurations 
ADD CONSTRAINT chk_evolution_instance CHECK (
  (api_type = 'meta_cloud') OR 
  (api_type IN ('evolution_web', 'evolution_cloud') AND instance_name IS NOT NULL)
);

-- Atualizar estatísticas da tabela para otimizar planos de consulta
ANALYZE api_configurations;

-- Verificar os índices criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'api_configurations'
ORDER BY indexname;