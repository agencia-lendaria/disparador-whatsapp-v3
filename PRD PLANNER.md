quero criar um disparador de mensagens no WhatsApp. vi a aplicação chamada "WA Workflow" e gostei muito das funcionalidades.
quero que o usuário consiga escolher qual API usará para disparo, por exemplo: Evolution API v2, Cloud API (da Meta). E que consiga salvar essas informações para usar ou alterar depois
    Exemplo caso ele queria usar a Evolution: Para isso o usuário terá que fornecer o nome da Instância, o Token e o número do telefone (formatado com DDD + DDI + nono dígito se for o caso + número de telefone)
     Pontos importantes:
    - A Evolution API Permite conectar a API Oficial da Meta, então é preciso inserir o Nome da Instância, Token de acesso e ID do número fornecido pela Meta.


Taks: 
- 1. PRD -> Preciso de um Product Requirements Document (PRD) bem estruturado e detalhado para criar uma ferramenta com essas funcionalidades.
- 2. Plano estruturado com checklist


### **2. Funcionalidades Detalhadas**

#### **2.1. Transmissões de Mensagens (Disparo em Massa)**

**Descrição:** Capacidade de enviar mensagens para múltiplos contatos simultaneamente, com opções de personalização e controle para evitar bloqueios.

**Requisitos Funcionais:**

*   **Seleção de Contatos:**
    *   **Um a Um:** Selecionar manualmente contatos individuais da lista de conversas.
    *   **Grupos:** Enviar a mesma mensagem para múltiplos grupos selecionados.
    *   **Etiquetas:** Filtrar e selecionar contatos a partir das etiquetas do WhatsApp Business.
    *   **Quadro Kanban:** Selecionar contatos baseados em sua posição em um funil de vendas visual.
    *   **Extração de Contatos de Grupo:** Exportar os contatos de um grupo específico para realizar envios individuais para cada membro.
*   **Configuração de Mensagem:**
    *   **Tipos de Mídia:** Suporte para envio de texto, imagens, vídeos, áudios e documentos.
    *   **Múltiplas Mensagens:** Adicionar várias mensagens (texto, mídia ou combinadas) em uma única transmissão para serem enviadas em sequência.
    *   **Variações de Mensagem:** Possibilidade de criar e adicionar múltiplas versões de uma mesma mensagem. O sistema deve enviar uma versão aleatória para cada contato, reduzindo a chance de ser marcado como spam.
*   **Controle de Envio:**
    *   **Atraso Entre Envios:** Definir um intervalo de tempo mínimo e máximo (em segundos) entre cada mensagem enviada para simular um comportamento humano.
    *   **Configuração de Pausa:** Programar pausas automáticas após um número específico de envios (ex: a cada 10 envios, pausar por 120 segundos).
*   **Agendamento:**
    *   **Início Imediato:** Opção para iniciar a transmissão assim que configurada.
    *   **Cronograma:** Agendar a transmissão para uma data e hora futuras. A interface deve apresentar um calendário interativo para fácil seleção.
    *   **Envio Automático Pós-Horário:** Se o usuário não estiver online no momento agendado, a ferramenta deve iniciar a transmissão automaticamente assim que o WhatsApp Web for conectado.
    *   **Recorrência:** Programar transmissões para serem repetidas (diariamente, semanalmente, etc.).

#### **2.2. Ferramentas de Gerenciamento e CRM**

**Descrição:** Funcionalidades para organizar contatos e gerenciar o fluxo de atendimento e vendas.

**Requisitos Funcionais:**

*   **Respostas Rápidas:**
    *   Criar e salvar modelos de mensagens para perguntas e situações frequentes.
    *   Acessar e enviar essas respostas com poucos cliques, através de atalhos.
*   **CRM Kanban:**
    *   Visualizar e organizar os contatos em colunas que representam estágios de um processo (ex: "Lead", "Contato Feito", "Proposta Enviada").
    *   Arrastar e soltar contatos entre as colunas.
*   **Gerenciamento de Grupos:**
    *   **Clonador de Grupos:** Criar um novo grupo com os mesmos participantes de um grupo existente.
    *   **Destruidor de Grupos:** Ferramenta para remover todos os participantes de um grupo de uma só vez antes de sair.
    *   **Adicionar em Massa:** Adicionar uma lista de contatos a um grupo de forma automatizada.
*   **Exportação de Dados:**
    *   Exportar listas de contatos (de grupos, etiquetas, etc.) para formatos como Excel e CSV, incluindo nome e número de telefone.

#### **2.3. Automação e Inteligência Artificial**

**Descrição:** Utilização de automação e IA para interações mais inteligentes e eficientes.

**Requisitos Funcionais:**

*   **Automação por Palavras-Chave:**
    *   Configurar fluxos de mensagens que são disparados automaticamente quando um contato envia uma mensagem contendo uma palavra-chave específica.
*   **Integração com Modelos de Linguagem (Gemini/ChatGPT):**
    *   **API Key:** Permitir que o usuário insira sua própria chave de API para conectar a ferramenta aos serviços de IA.
    *   **Assistente de Escrita:**
        *   **Sugestões e Correções:** Oferecer sugestões de texto e corrigir a ortografia em tempo real.
        *   **Ajuste de Tom:** Reescrever uma mensagem para torná-la mais amigável, formal ou com outro tom desejado.
        *   **Resumo e Prolongamento:** Resumir textos longos ou expandir ideias curtas.

# OBSERVAÇÕES

- inicialmente não teremos funcionalidade de pagamento pois será usado pelo nosso time interno
- vamos utilizar o Supabase como backend, banco de dados, authorization para fazer o login na aplicação e não será necessário a verificação de email (pode desabilitar)
- Quero que, quando  o disparo seja realizado, atualize a planila do google sheets que o usuário enviar o link (link público da planilha), fazendo a identificação da linha pela coluna ID.


Sugestões: 
Para as sugestões abaixo, avalie a viabilidade e se são sugestões viáveis
- QUERO que o usuário tenha a possibilidade de interromper ou paussar o disparo, pensei em utilizar coisas como Queue do Supabase
- quero que o usuário consiga agendar disparos, pensei na possibilidade de usar as CRON Job do Supabase.