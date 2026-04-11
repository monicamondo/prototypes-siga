Briefing de Desenvolvimento: Tela de Acompanhamento Conecta+
1. Visão Geral do Projeto
Desenvolver a área de conteúdo para uma nova tela de acompanhamento no sistema legado. O foco é a gestão de conexões e monitoramento de agentes em tempo real, priorizando uma interface enxuta e de alta densidade de informação.

2. Requisitos de Design (UI/UX)
Design System: Seguir rigorosamente os padrões do diretório ds-siga (Storybook).

Componentização: É permitida a criação de novos componentes caso os existentes no Storybook não suportem a densidade de informações necessária.

Aproveitamento de Tela: * Utilizar cards pequenos para representar as conexões.

O layout deve ser otimizado para visualização sem scroll, permitindo uma visão macro das operações em uma única tela.

Escopo de Construção: Desenvolver apenas o corpo da página. O header e o footer seguem o padrão atual do produto e não devem ser alterados.

3. Estrutura e Elementos do Card
Cada conexão deve ser representada por um card contendo:

Identificação de Voo: Origem e Destino.

Localização: Exibir o Portão (Gate) de forma clara. O número do voo "Pai" (VPI) deve permanecer oculto ou disponível apenas para filtragem interna.

Tempos de Voo: Exibir STA (Horário Estimado de Chegada) e ETA (Horário Real de Chegada).

Gestão de Agentes: Exibir os agentes alocados. Para múltiplos agentes, utilizar ícones com pop-up ou indicação de reticências para economizar espaço.

Progresso do Workflow:

Representação visual das etapas ("itos"). O fluxo é variável e configurável, podendo chegar a até 9 etapas em voos internacionais.

Exibir o percentual (%) total de conclusão.

Registrar o horário de conclusão de cada etapa realizada.

4. Regras de Negócio e Comportamento
Contexto: A tela operará com foco detalhado por aeroporto. Se um filtro global de aeroporto estiver ativo, a informação do nome do aeroporto não deve ser repetida nos cards.

Gatilho de Exibição: A interface deve listar apenas conexões que já possuam o status "alocado não iniciado" (quando um agente aceitou a tarefa).

Simplificação: * Remover campos de ID técnico da visualização do usuário.

Suprimir a caixa de "integração de bagagens verificadas" presente em versões anteriores.

Não exibir campos de tempo de conexão (short time/run time) se houver risco de impacto na performance da tela.

Funcionalidade: A tela é estritamente para visualização e acompanhamento, sem necessidade de inputs ou ações de edição neste primeiro momento.

Instrução para o Agente de IA:
"Com base neste briefing e consultando o Storybook no diretório ds-siga, gere o código da interface priorizando a performance e a visibilidade dos 9 marcos (hitos) de workflow dentro de componentes compactos."