/**
 * ================================================================
 * Monitoramento de Acompanhamentos — SIGA Conecta+
 * Protótipo de interface · Angular v18 + Bootstrap 5
 *
 * Em produção os dados virão via WebSocket/polling do back-end.
 * ================================================================
 */

// ── MOCK DATA ──────────────────────────────────────────────────
// Modelo de dados:
//   chegada : vpiChegada (voo pai), origem, sta, eta, gateChegada
//   partida : vooConexao,           destino, std, etd, gateEmbarque
//   agentes : array de nomes (primeiro + último nome)
//   hitos   : workflow individual do voo — variável por aeroporto/tipo
//
// Status por hito: 'ok' | 'aguardando' | 'ignorado' | 'pax_nao_encontrado' | 'cancelado'
// Regra PAX: quando hito 1 = pax_nao_encontrado → demais ficam 'cancelado'
//
// Os horários são gerados dinamicamente em relação à hora atual
// para que o mock sempre apareça na janela de monitoramento.

/** Retorna uma string HH:mm com offset em minutos a partir de agora */
function hhmm(offsetMinutes) {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + offsetMinutes);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** Hora passada registrada pelo agente (offset negativo = no passado) */
function hhmmPast(offsetMinutes) { return hhmm(offsetMinutes); }

const MOCK_DATA = [
  // ── Em percurso — 1 agente ──────────────────────────────────
  {
    id: 1,
    tipo: 'RUN',
    vpiChegada: 'LA100',  vooConexao: 'LA3100',
    origem: 'GRU',        destino: 'MAO',
    sta: '09:30',         std: '10:45',
    eta: '09:35',         etd: '10:45',
    gateChegada: '25B',   gateEmbarque: '14C',
    agentes: ['Kate Austen'],
    hitos: [
      { id: 1, nome: 'Desembarque',  status: 'ok',         horario: '09:33' },
      { id: 2, nome: 'Em percurso',  status: 'ok',         horario: '09:41' },
      { id: 3, nome: 'Gate',         status: 'aguardando', horario: null    },
      { id: 4, nome: 'Embarque',     status: 'aguardando', horario: null    },
    ]
  },

  // ── PAX não encontrado no hito 1 → demais cancelados ────────
  {
    id: 2,
    tipo: 'Short',
    vpiChegada: 'G312',   vooConexao: 'G31200',
    origem: 'CGH',        destino: 'GIG',
    sta: '09:50',         std: '11:20',
    eta: '10:10',         etd: '11:20',
    gateChegada: '12A',   gateEmbarque: '8',
    agentes: ['Tony Stark'],
    hitos: [
      { id: 1, nome: 'Desembarque',      status: 'pax_nao_encontrado', horario: '09:52' },
      { id: 2, nome: 'Em percurso',      status: 'cancelado',          horario: null    },
      { id: 3, nome: 'Raio-X',          status: 'cancelado',          horario: null    },
      { id: 4, nome: 'Gate de Embarque', status: 'cancelado',          horario: null    },
      { id: 5, nome: 'Embarque',         status: 'cancelado',          horario: null    },
    ]
  },

  // ── Concluído ────────────────────────────────────────────────
  {
    id: 3,
    tipo: 'Short',
    vpiChegada: 'AD44',   vooConexao: 'AD4455',
    origem: 'BSB',        destino: 'FOR',
    sta: '09:55',         std: '11:00',
    eta: '09:50',         etd: '11:00',
    gateChegada: '7C',    gateEmbarque: '22',
    agentes: ['Peter Parker'],
    hitos: [
      { id: 1, nome: 'Desembarque', status: 'ok', horario: '09:52' },
      { id: 2, nome: 'Em percurso', status: 'ok', horario: '09:58' },
      { id: 3, nome: 'Gate',        status: 'ok', horario: '10:05' },
      { id: 4, nome: 'Embarque',    status: 'ok', horario: '10:12' },
    ]
  },

  // ── Em percurso — 7 hitos — 1 agente ────────────────────────
  {
    id: 4,
    tipo: 'RUN',
    vpiChegada: 'LA88',   vooConexao: 'LA8801',
    origem: 'GIG',        destino: 'SCL',
    sta: '10:00',         std: '11:30',
    eta: '10:00',         etd: '11:30',
    gateChegada: 'Rem. L', gateEmbarque: '201',
    agentes: ['Leia Organa'],
    hitos: [
      { id: 1, nome: 'Desembarque',         status: 'ok',         horario: '10:04' },
      { id: 2, nome: 'Em percurso',         status: 'ok',         horario: '10:11' },
      { id: 3, nome: 'Raio-X',             status: 'ok',         horario: '10:19' },
      { id: 4, nome: 'Saindo da Imigração', status: 'aguardando', horario: null    },
      { id: 5, nome: 'Escada Terminal 3',   status: 'aguardando', horario: null    },
      { id: 6, nome: 'Gate de Embarque',    status: 'aguardando', horario: null    },
      { id: 7, nome: 'Embarque',            status: 'aguardando', horario: null    },
    ]
  },

  // ── Aguardando — 3 hitos ─────────────────────────────────────
  {
    id: 5,
    tipo: 'RUN',
    vpiChegada: 'CM43',   vooConexao: 'CM430',
    origem: 'PTY',        destino: 'BOG',
    sta: '10:05',         std: '11:10',
    eta: '10:05',         etd: '11:10',
    gateChegada: '4F',    gateEmbarque: '19',
    agentes: ['Clark Kent'],
    hitos: [
      { id: 1, nome: 'Desembarque',      status: 'aguardando', horario: null },
      { id: 2, nome: 'Em percurso',      status: 'aguardando', horario: null },
      { id: 3, nome: 'Gate de Embarque', status: 'aguardando', horario: null },
    ]
  },

  // ── Em percurso — hito ignorado — 1 agente ──────────────────
  {
    id: 6,
    tipo: 'Short',
    vpiChegada: 'AV90',   vooConexao: 'AV903',
    origem: 'BOG',        destino: 'MDE',
    sta: '10:10',         std: '11:25',
    eta: '10:15',         etd: '11:30',
    gateChegada: '22',    gateEmbarque: '5B',
    agentes: ['Diana Prince'],
    hitos: [
      { id: 1, nome: 'Desembarque', status: 'ok',         horario: '10:17' },
      { id: 2, nome: 'Em percurso', status: 'ok',         horario: '10:23' },
      { id: 3, nome: 'Raio-X',     status: 'ignorado',   horario: '10:28' },
      { id: 4, nome: 'Gate',        status: 'ok',         horario: '10:35' },
      { id: 5, nome: 'Embarque',    status: 'aguardando', horario: null    },
    ]
  },

  // ── Em percurso — 9 hitos — 2 agentes ───────────────────────
  {
    id: 7,
    tipo: 'RUN',
    vpiChegada: 'LA45',   vooConexao: 'LA4530',
    origem: 'GRU',        destino: 'AEP',
    sta: '10:30',         std: '12:00',
    eta: '10:30',         etd: '12:00',
    gateChegada: '31',    gateEmbarque: '246',
    agentes: ['Bruce Wayne', 'Natasha Romanoff'],
    hitos: [
      { id: 1, nome: 'Desembarque',         status: 'ok',         horario: '10:33' },
      { id: 2, nome: 'Em percurso',         status: 'ok',         horario: '10:39' },
      { id: 3, nome: 'Raio-X',             status: 'ok',         horario: '10:47' },
      { id: 4, nome: 'Saindo da Imigração', status: 'ok',         horario: '10:58' },
      { id: 5, nome: 'Sala VIP',            status: 'ok',         horario: '11:05' },
      { id: 6, nome: 'Escada Terminal 3',   status: 'aguardando', horario: null    },
      { id: 7, nome: 'Gate de Embarque',    status: 'aguardando', horario: null    },
      { id: 8, nome: 'Embarque',            status: 'aguardando', horario: null    },
      { id: 9, nome: 'Concluído',           status: 'aguardando', horario: null    },
    ]
  },

  // ── Aguardando — 3 hitos — 1 agente ─────────────────────────
  {
    id: 8,
    tipo: 'RUN',
    vpiChegada: 'LA50',   vooConexao: 'LA5010',
    origem: 'SSA',        destino: 'GIG',
    sta: '11:00',         std: '12:15',
    eta: '11:05',         etd: '12:15',
    gateChegada: '14',    gateEmbarque: '9A',
    agentes: ['Carol Danvers'],
    hitos: [
      { id: 1, nome: 'Desembarque', status: 'aguardando', horario: null },
      { id: 2, nome: 'Em percurso', status: 'aguardando', horario: null },
      { id: 3, nome: 'Gate',        status: 'aguardando', horario: null },
    ]
  },

  // ── Em percurso — 5 hitos — 1 agente ────────────────────────
  {
    id: 9,
    tipo: 'Short',
    vpiChegada: 'LA22',   vooConexao: 'LA2210',
    origem: 'GRU',        destino: 'MVD',
    sta: '11:10',         std: '12:30',
    eta: '11:10',         etd: '12:30',
    gateChegada: '201',   gateEmbarque: '18B',
    agentes: ['Sam Wilson'],
    hitos: [
      { id: 1, nome: 'Desembarque',      status: 'ok',         horario: '11:13' },
      { id: 2, nome: 'Em percurso',      status: 'aguardando', horario: null    },
      { id: 3, nome: 'Raio-X',          status: 'aguardando', horario: null    },
      { id: 4, nome: 'Gate de Embarque', status: 'aguardando', horario: null    },
      { id: 5, nome: 'Embarque',         status: 'aguardando', horario: null    },
    ]
  },

  // ── Concluído — 4 hitos com ignorado ────────────────────────
  {
    id: 10,
    tipo: 'Short',
    vpiChegada: 'G315',   vooConexao: 'G31540',
    origem: 'SDU',        destino: 'REC',
    sta: '10:40',         std: '11:50',
    eta: '10:40',         etd: '11:50',
    gateChegada: '9B',    gateEmbarque: '3',
    agentes: ['Wanda Maximoff'],
    hitos: [
      { id: 1, nome: 'Desembarque', status: 'ok',      horario: '10:42' },
      { id: 2, nome: 'Em percurso', status: 'ok',      horario: '10:48' },
      { id: 3, nome: 'Gate',        status: 'ignorado', horario: '10:55' },
      { id: 4, nome: 'Embarque',    status: 'ok',      horario: '11:02' },
    ]
  },

  // ── Em percurso — 8 hitos — 3 agentes ───────────────────────
  {
    id: 11,
    tipo: 'RUN',
    vpiChegada: 'AA9',    vooConexao: 'AA901',
    origem: 'GRU',        destino: 'MIA',
    sta: '10:45',         std: '12:10',
    eta: '10:40',         etd: '12:10',
    gateChegada: '246',   gateEmbarque: '207',
    agentes: ['Scott Lang', 'Steve Rogers', 'Bucky Barnes'],
    hitos: [
      { id: 1, nome: 'Desembarque',         status: 'ok',         horario: '10:43' },
      { id: 2, nome: 'Em percurso',         status: 'ok',         horario: '10:49' },
      { id: 3, nome: 'Raio-X',             status: 'ok',         horario: '10:57' },
      { id: 4, nome: 'Saindo da Imigração', status: 'ok',         horario: '11:08' },
      { id: 5, nome: 'Corredor B',          status: 'ignorado',   horario: '11:10' },
      { id: 6, nome: 'Gate Internacional',  status: 'ok',         horario: '11:20' },
      { id: 7, nome: 'Embarque',            status: 'aguardando', horario: null    },
      { id: 8, nome: 'Concluído',           status: 'aguardando', horario: null    },
    ]
  },

  // ── Aguardando — 5 hitos ─────────────────────────────────────
  {
    id: 12,
    tipo: 'Short',
    vpiChegada: 'CM92',   vooConexao: 'CM920',
    origem: 'LIM',        destino: 'PTY',
    sta: '11:20',         std: '12:40',
    eta: '11:20',         etd: '12:40',
    gateChegada: '3A',    gateEmbarque: '11',
    agentes: ['Diana Fury'],
    hitos: [
      { id: 1, nome: 'Desembarque',      status: 'aguardando', horario: null },
      { id: 2, nome: 'Em percurso',      status: 'aguardando', horario: null },
      { id: 3, nome: 'Raio-X',          status: 'aguardando', horario: null },
      { id: 4, nome: 'Gate de Embarque', status: 'aguardando', horario: null },
      { id: 5, nome: 'Embarque',         status: 'aguardando', horario: null },
    ]
  },

  // ── Em percurso — 4 hitos — 2 agentes ───────────────────────
  {
    id: 13,
    tipo: 'RUN',
    vpiChegada: 'AV71',   vooConexao: 'AV711',
    origem: 'BOG',        destino: 'CTG',
    sta: '11:35',         std: '12:50',
    eta: '11:35',         etd: '12:50',
    gateChegada: '6',     gateEmbarque: '2A',
    agentes: ['Maria Hill', 'Nick Fury'],
    hitos: [
      { id: 1, nome: 'Desembarque', status: 'ok',         horario: '11:38' },
      { id: 2, nome: 'Em percurso', status: 'ok',         horario: '11:44' },
      { id: 3, nome: 'Gate',        status: 'aguardando', horario: null    },
      { id: 4, nome: 'Embarque',    status: 'aguardando', horario: null    },
    ]
  },
];

// ── UTILITÁRIOS ────────────────────────────────────────────────

const STATUS_LABEL = {
  aguardando:         'Aguardando',
  em_percurso:        'Em percurso',
  concluido:          'Concluído',
  pax_nao_encontrado: 'PAX n/e',
};

const STATUS_ICON = {
  aguardando:         'fa-regular fa-clock',
  em_percurso:        'fa-solid fa-person-walking-arrow-right',
  concluido:          'fa-solid fa-circle-check',
  pax_nao_encontrado: 'fa-solid fa-person-circle-xmark',
};

// Ícones dos hitos — mesma linguagem visual do mobile
const HITO_STATUS_ICON = {
  ok:                 'fa-solid fa-check',
  aguardando:         null,                    // exibe só o número
  ignorado:           'fa-solid fa-xmark',
  pax_nao_encontrado: 'fa-solid fa-xmark',     // vermelho (cor diferencia do ignorado)
  cancelado:          'fa-solid fa-minus',     // cinza claro — hito não será executado
};

/** Calcula % de progresso */
function calcProgresso(hitos) {
  const total = hitos.length;
  if (total === 0) return 0;
  // PAX não encontrado: acompanhamento encerra em 100%
  if (hitos[0] && hitos[0].status === 'pax_nao_encontrado') return 100;
  const respondidos = hitos.filter(h =>
    h.status === 'ok' || h.status === 'ignorado'
  ).length;
  return Math.round((respondidos / total) * 100);
}

/** Deriva statusGeral a partir dos hitos */
function deriveStatus(voo) {
  const h = voo.hitos;
  if (h[0] && h[0].status === 'pax_nao_encontrado') return 'pax_nao_encontrado';
  const p = calcProgresso(h);
  if (p === 100) return 'concluido';
  if (p > 0)     return 'em_percurso';
  return 'aguardando';
}

/** Formata hora atual HH:mm */
function horaAgora() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** Calcula hora a partir de offset em horas em relação a agora */
function horaComOffset(offsetH) {
  const d = new Date();
  d.setHours(d.getHours() + offsetH, 0, 0, 0);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ── RENDER DA FAIXA DE HITOS ───────────────────────────────────

function getFirstAguardandoIndex(hitos) {
  return hitos.findIndex(h => h.status === 'aguardando');
}

function renderHitosDot(hito, index, total, hitos) {
  const iconClass = HITO_STATUS_ICON[hito.status];

  // Hito "atual" = primeiro aguardando após algum ok
  const firstAguardando = getFirstAguardandoIndex(hitos);
  const isCurrent = hito.status === 'aguardando' && index === firstAguardando && firstAguardando > 0;

  const statusLabel = {
    ok:                 'Concluído',
    aguardando:         'Aguardando',
    ignorado:           'Ignorado',
    pax_nao_encontrado: 'PAX não encontrado',
    cancelado:          'Cancelado',
  }[hito.status];

  const tooltipHtml = `
    <div class="sg-hito-tooltip-content">
      <div class="hito-nome">${index + 1}. ${hito.nome}</div>
      <div class="hito-status">${statusLabel}</div>
      ${hito.horario ? `<div class="hito-time"><i class="fa-regular fa-clock"></i> ${hito.horario}</div>` : ''}
    </div>
  `.trim();

  const dotClass = [
    'sg-hito-dot',
    `sg-hito-dot--${hito.status}`,
    isCurrent ? 'sg-hito-dot--current' : '',
  ].filter(Boolean).join(' ');

  const inner = iconClass
    ? `<i class="${iconClass}"></i>`
    : `<span>${index + 1}</span>`;

  const connectorDone = hito.status === 'ok' ? 'sg-hito-connector--done' : '';
  const connector = index < total - 1
    ? `<span class="sg-hito-connector ${connectorDone}"></span>`
    : '';

  return `<span
    class="${dotClass}"
    data-bs-toggle="tooltip"
    data-bs-placement="top"
    data-bs-html="true"
    title="${tooltipHtml.replace(/"/g, '&quot;')}"
    aria-label="${hito.nome} — ${statusLabel}"
  >${inner}</span>${connector}`;
}

// ── RENDER CÉLULA DE AGENTES ───────────────────────────────────

function renderAgentes(agentes) {
  if (!agentes || agentes.length === 0) return '<span class="sg-agente text-muted">—</span>';

  if (agentes.length === 1) {
    return `<span class="sg-agente">${agentes[0]}</span>`;
  }

  if (agentes.length === 2) {
    return `
      <span class="sg-agente">${agentes[0]}</span>
      <span class="sg-agente sg-agente--secondary">${agentes[1]}</span>
    `;
  }

  // 3 ou mais: mostra o primeiro e um badge "+N" com tooltip listando todos
  const tooltipNomes = agentes.join('<br>');
  const extras = agentes.length - 1;
  return `
    <span class="sg-agente">${agentes[0]}</span>
    <span
      class="sg-agente-badge"
      data-bs-toggle="tooltip"
      data-bs-placement="top"
      data-bs-html="true"
      title="${tooltipNomes.replace(/"/g, '&quot;')}"
    >+${extras}</span>
  `;
}

// ── RENDER DE UMA LINHA DA TABELA ─────────────────────────────

function renderRow(voo) {
  const status     = deriveStatus(voo);
  const progresso  = calcProgresso(voo.hitos);
  const total      = voo.hitos.length;
  const respondidos = voo.hitos.filter(h =>
    h.status === 'ok' || h.status === 'ignorado' || h.status === 'pax_nao_encontrado'
  ).length;

  const etaAtrasado = voo.eta > voo.sta;
  const etdAtrasado = voo.etd > voo.std;

  const hitosHtml = voo.hitos
    .map((h, i) => renderHitosDot(h, i, voo.hitos.length, voo.hitos))
    .join('');

  // Legenda de progresso: PAX n/e mostra texto diferente
  const isPax = status === 'pax_nao_encontrado';
  const progressoLabel = isPax ? '1/1 hitos' : `${respondidos}/${total} hitos`;

  return `
    <tr
      class="sg-row--${status}"
      data-id="${voo.id}"
      data-tipo="${voo.tipo}"
      data-voo="${(voo.vooConexao + ' ' + voo.vpiChegada).toLowerCase()}"
      data-agentes="${voo.agentes.join(' ').toLowerCase()}"
      data-status="${status}"
      data-sta="${voo.sta}"
      data-progresso="${progresso}"
    >
      <!-- ── CHEGADA ─────────────────────────────────────── -->
      <td class="sg-col-chegada sg-col-voo-chegada">
        <span class="sg-voo-number"
          data-bs-toggle="tooltip" data-bs-placement="top"
          title="Voo de chegada (pai)"
        >${voo.vpiChegada}</span>
        <span class="sg-voo-airport">${voo.origem}</span>
      </td>

      <td class="sg-col-chegada">
        ${voo.eta !== voo.sta
          ? `<div class="sg-time-block">
               <span class="sg-time-value ${etaAtrasado ? 'sg-time-value--delayed' : ''}">${voo.eta}</span>
               <span class="sg-time-label">ETA</span>
             </div>`
          : `<div class="sg-time-block">
               <span class="sg-time-value">${voo.sta}</span>
               <span class="sg-time-label">STA</span>
             </div>`
        }
      </td>

      <td class="sg-col-chegada">
        <span class="sg-gate">${voo.gateChegada}</span>
        <span class="sg-gate-label">Gate</span>
      </td>

      <!-- ── PARTIDA ─────────────────────────────────────── -->
      <td class="sg-col-partida sg-col-voo-partida">
        <span class="sg-voo-number"
          data-bs-toggle="tooltip" data-bs-placement="top"
          title="Voo de conexão (partida)"
        >${voo.vooConexao}</span>
        <span class="sg-voo-airport">${voo.destino}</span>
      </td>

      <td class="sg-col-partida">
        ${voo.etd !== voo.std
          ? `<div class="sg-time-block">
               <span class="sg-time-value ${etdAtrasado ? 'sg-time-value--delayed' : ''}">${voo.etd}</span>
               <span class="sg-time-label">ETD</span>
             </div>`
          : `<div class="sg-time-block">
               <span class="sg-time-value">${voo.std}</span>
               <span class="sg-time-label">STD</span>
             </div>`
        }
      </td>

      <td class="sg-col-partida">
        <span class="sg-gate">${voo.gateEmbarque}</span>
        <span class="sg-gate-label">Gate</span>
      </td>

      <!-- ── TIPO ───────────────────────────────────────── -->
      <td>
        <span class="sg-badge-tipo sg-badge-tipo--${voo.tipo}">${voo.tipo}</span>
      </td>

      <!-- ── AGENTE ─────────────────────────────────────── -->
      <td class="sg-col-agente">
        ${renderAgentes(voo.agentes)}
      </td>

      <!-- ── HITOS ──────────────────────────────────────── -->
      <td>
        <div class="sg-hitos-strip" aria-label="${respondidos} de ${total} hitos concluídos">
          ${hitosHtml}
        </div>
      </td>

      <!-- ── PROGRESSO ──────────────────────────────────── -->
      <td>
        <div class="sg-progress-col">
          <div class="sg-progress-label">
            <span>${progressoLabel}</span>
            <strong>${progresso}%</strong>
          </div>
          <div class="sg-progress-bar-wrap">
            <div
              class="sg-progress-bar-fill sg-progress-bar-fill--${status}"
              style="width: ${progresso}%"
              role="progressbar"
              aria-valuenow="${progresso}"
              aria-valuemin="0" aria-valuemax="100"
            ></div>
          </div>
          <span class="sg-status-label sg-status-label--${status}">
            <i class="${STATUS_ICON[status]}"></i>
            ${STATUS_LABEL[status]}
          </span>
        </div>
      </td>
    </tr>
  `;
}

// ── PAGINAÇÃO ──────────────────────────────────────────────────

let currentPage = 1;
let pageSize    = 20;

function getPageSlice(data) {
  const start = (currentPage - 1) * pageSize;
  return data.slice(start, start + pageSize);
}

function totalPages(data) {
  return Math.max(1, Math.ceil(data.length / pageSize));
}

function renderPagination(data) {
  const list       = document.getElementById('pagination-list');
  const totalLabel = document.getElementById('pagination-total-label');
  const total      = totalPages(data);

  totalLabel.textContent = `${data.length} itens`;

  const delta = 2;
  let pages = [];
  for (let i = Math.max(1, currentPage - delta); i <= Math.min(total, currentPage + delta); i++) {
    pages.push(i);
  }

  const showFirstEllipsis = pages[0] > 2;
  const showLastEllipsis  = pages[pages.length - 1] < total - 1;

  let html = '';
  html += `<li class="sg-page-item ${currentPage === 1 ? 'disabled' : ''}">
    <button class="sg-page-link" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">Anterior</button>
  </li>`;
  if (pages[0] > 1) html += `<li class="sg-page-item"><button class="sg-page-link" data-page="1">1</button></li>`;
  if (showFirstEllipsis) html += `<li class="sg-page-item disabled"><span class="sg-page-link">…</span></li>`;
  pages.forEach(p => {
    html += `<li class="sg-page-item ${p === currentPage ? 'active' : ''}">
      <button class="sg-page-link" data-page="${p}">${p}</button></li>`;
  });
  if (showLastEllipsis) html += `<li class="sg-page-item disabled"><span class="sg-page-link">…</span></li>`;
  if (pages[pages.length - 1] < total) html += `<li class="sg-page-item"><button class="sg-page-link" data-page="${total}">${total}</button></li>`;
  html += `<li class="sg-page-item ${currentPage === total ? 'disabled' : ''}">
    <button class="sg-page-link" ${currentPage === total ? 'disabled' : ''} data-page="${currentPage + 1}">Próximo</button>
  </li>`;

  list.innerHTML = html;
  list.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page);
      if (!isNaN(page) && page >= 1 && page <= total) {
        currentPage = page;
        applyFilters();
      }
    });
  });
}

// ── RENDER DA TABELA COMPLETA ──────────────────────────────────

function renderTable(data) {
  const tbody = document.getElementById('monitoring-tbody');
  const empty = document.getElementById('empty-state');

  renderPagination(data);

  if (!data.length) {
    tbody.innerHTML = '';
    empty.classList.remove('d-none');
    return;
  }
  empty.classList.add('d-none');

  const pageData = getPageSlice(data);
  tbody.innerHTML = pageData.map(renderRow).join('');

  // Inicializa todos os tooltips do Bootstrap
  tbody.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
    new bootstrap.Tooltip(el, { html: true, trigger: 'hover' });
  });
  document.querySelectorAll('.sg-hitos-legend [data-bs-toggle="tooltip"]').forEach(el => {
    bootstrap.Tooltip.getOrCreateInstance(el);
  });
}

// ── CONTADORES DE RESUMO ───────────────────────────────────────

function updateSummary(data) {
  document.getElementById('count-total').textContent   = data.length;
  document.getElementById('count-waiting').textContent = data.filter(v => deriveStatus(v) === 'aguardando').length;
  document.getElementById('count-pax').textContent     = data.filter(v => deriveStatus(v) === 'pax_nao_encontrado').length;
}

// ── FILTROS ────────────────────────────────────────────────────

let tiposAtivos = new Set(['RUN', 'Short']);

function getFilteredData() {
  const fVoo     = document.getElementById('filter-voo').value.trim().toLowerCase();
  const fDeVal   = document.getElementById('filter-hora-de').value;
  const fAteVal  = document.getElementById('filter-hora-ate').value;
  const fAgente  = document.getElementById('filter-agente').value.trim().toLowerCase();
  const fStatus  = document.getElementById('filter-status').value;
  const fTipo    = document.getElementById('filter-tipo').value;
  const fOrigem  = document.getElementById('filter-origem').value.trim().toLowerCase();
  const fDestino = document.getElementById('filter-destino').value.trim().toLowerCase();

  let data = [...MOCK_DATA];

  // Apenas RUN e Short são monitorados nesta tela
  data = data.filter(v => v.tipo === 'RUN' || v.tipo === 'Short');

  if (fVoo) {
    data = data.filter(v =>
      v.vooConexao.toLowerCase().includes(fVoo) ||
      v.vpiChegada.toLowerCase().includes(fVoo)
    );
  }

  // Período: só aplica se o campo estiver preenchido
  if (fDeVal !== '') {
    const horaIni = horaComOffset(parseInt(fDeVal));
    data = data.filter(v => v.sta >= horaIni);
  }
  if (fAteVal !== '') {
    const horaFim = horaComOffset(parseInt(fAteVal));
    data = data.filter(v => v.sta <= horaFim);
  }

  if (fAgente) {
    data = data.filter(v => v.agentes.join(' ').toLowerCase().includes(fAgente));
  }
  if (fStatus) {
    data = data.filter(v => deriveStatus(v) === fStatus);
  }
  if (fTipo) {
    data = data.filter(v => v.tipo === fTipo);
  }
  if (fOrigem) {
    data = data.filter(v => v.origem.toLowerCase().includes(fOrigem));
  }
  if (fDestino) {
    data = data.filter(v => v.destino.toLowerCase().includes(fDestino));
  }

  // Ordenação padrão por STA
  data.sort((a, b) => a.sta.localeCompare(b.sta));

  return data;
}

function applyFilters() {
  const data = getFilteredData();
  renderTable(data);
  updateSummary(data);

  // Atualiza label da janela de período
  const fDeVal  = document.getElementById('filter-hora-de').value;
  const fAteVal = document.getElementById('filter-hora-ate').value;
  if (fDeVal !== '' || fAteVal !== '') {
    const ini = fDeVal  !== '' ? horaComOffset(parseInt(fDeVal))  : '—';
    const fim = fAteVal !== '' ? horaComOffset(parseInt(fAteVal)) : '—';
    document.getElementById('window-label').textContent = `${ini} – ${fim}`;
  } else {
    document.getElementById('window-label').textContent = 'todos os horários';
  }
}

function filterAndReset() { currentPage = 1; applyFilters(); }

// ── EVENTOS DE FILTRO ──────────────────────────────────────────

document.getElementById('filter-voo').addEventListener('input', filterAndReset);
document.getElementById('filter-agente').addEventListener('input', filterAndReset);
document.getElementById('filter-status').addEventListener('change', filterAndReset);
document.getElementById('filter-tipo').addEventListener('change', filterAndReset);
document.getElementById('filter-hora-de').addEventListener('change', filterAndReset);
document.getElementById('filter-hora-ate').addEventListener('change', filterAndReset);
document.getElementById('filter-origem').addEventListener('input', filterAndReset);
document.getElementById('filter-destino').addEventListener('input', filterAndReset);

document.getElementById('btn-filtrar').addEventListener('click', applyFilters);

document.getElementById('btn-limpar').addEventListener('click', () => {
  document.getElementById('filter-voo').value      = '';
  document.getElementById('filter-hora-de').value  = '';
  document.getElementById('filter-hora-ate').value = '';
  document.getElementById('filter-agente').value   = '';
  document.getElementById('filter-status').value   = '';
  document.getElementById('filter-tipo').value     = '';
  document.getElementById('filter-origem').value   = '';
  document.getElementById('filter-destino').value  = '';
  currentPage = 1;
  applyFilters();
});

document.getElementById('pagination-page-size').addEventListener('change', (e) => {
  pageSize = parseInt(e.target.value);
  currentPage = 1;
  applyFilters();
});

// ── SIMULAÇÃO TEMPO REAL ───────────────────────────────────────

function simularAtualizacao() {
  const emPercurso = MOCK_DATA.filter(v => deriveStatus(v) === 'em_percurso');
  if (!emPercurso.length) return;
  const voo = emPercurso[Math.floor(Math.random() * emPercurso.length)];
  const aguardando = voo.hitos.filter(h => h.status === 'aguardando');
  if (!aguardando.length) return;
  aguardando[0].status  = 'ok';
  aguardando[0].horario = horaAgora();
  document.getElementById('last-update-label').textContent = `Última atualização: ${horaAgora()}`;
  applyFilters();
}

setInterval(simularAtualizacao, 12000);

// ── RELÓGIO DO HEADER ──────────────────────────────────────────

const DIAS_PT = ['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO'];

function updateHeaderClock() {
  const now = new Date();
  document.getElementById('header-weekday').textContent    = DIAS_PT[now.getDay()];
  document.getElementById('header-date').textContent       = now.toLocaleDateString('pt-BR');
  document.getElementById('header-time-local').textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('header-time-utc').textContent   = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

// ── INICIALIZAÇÃO ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  updateHeaderClock();
  setInterval(updateHeaderClock, 30000);
  applyFilters();
  document.getElementById('last-update-label').textContent = `Última atualização: ${horaAgora()}`;
});
