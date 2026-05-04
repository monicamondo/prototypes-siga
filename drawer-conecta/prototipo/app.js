(function () {
  'use strict';

  const flightContext = {
    idConnection: 11955163,
    flightCode: 'LA3349',
    registration: 'PR-MHK',
    aircraft: 'A321',
    origin: 'GRU',
    destination: 'SCL',
    totalPax: 10,
    totalBag: 6,
    idAuthor: 114561,
    author: 'Gabriel Cardoso'
  };

  const initialPlans = [
    {
      id: 1,
      idConnection: 11955163,
      totalPax: 5,
      totalBag: 2,
      accommodationsItineraries: [
        {
          segment: 1,
          airlineCode: 'LA',
          flightNumber: 123,
          departureDate: '2026-04-29',
          departureAirport: 'GRU',
          arrivalAirport: 'BSB'
        },
        {
          segment: 2,
          airlineCode: 'LA',
          flightNumber: 456,
          departureDate: '2026-04-30',
          departureAirport: 'BSB',
          arrivalAirport: 'SCL'
        }
      ],
      createDate: 1777489676636,
      idAuthor: 114561,
      author: 'Gabriel Cardoso'
    },
    {
      id: 2,
      idConnection: 11955163,
      totalPax: 2,
      totalBag: 1,
      accommodationsItineraries: [
        {
          segment: 1,
          airlineCode: 'LA',
          flightNumber: 222,
          departureDate: '2026-04-29',
          departureAirport: 'GRU',
          arrivalAirport: 'FLN'
        },
        {
          segment: 2,
          airlineCode: 'LA',
          flightNumber: 444,
          departureDate: '2026-04-30',
          departureAirport: 'FLN',
          arrivalAirport: 'SCL'
        }
      ],
      createDate: 1777489676636,
      idAuthor: 114561,
      author: 'Gabriel Cardoso'
    }
  ];

  const backdrop = document.getElementById('drawer-backdrop');
  const drawer = document.getElementById('drawer-panel');
  const btnOpen = document.getElementById('btn-open-drawer');
  const btnClose = document.getElementById('btn-close-drawer');
  const tabItems = document.querySelectorAll('.drawer-tabs__item');
  const tabPanels = document.querySelectorAll('.drawer-tab-content');
  const segmentsList = document.getElementById('segments-list');
  const plansList = document.getElementById('plans-list');
  const btnAddSegment = document.getElementById('btn-add-segment');
  const btnSavePlan = document.getElementById('btn-save-plan');
  const btnFinishPlanning = document.getElementById('btn-finish-planning');
  const planPaxInput = document.getElementById('plan-pax');
  const planBagInput = document.getElementById('plan-bag');
  const validationMessage = document.getElementById('plan-validation');
  const footerActionHint = document.getElementById('footer-action-hint');
  const payloadOutput = document.getElementById('payload-output');

  const state = {
    savedPlans: initialPlans.slice(),
    currentSegments: [createBlankSegment()],
    hasPersistedChanges: false
  };

  function createBlankSegment() {
    return {
      departureAirport: flightContext.origin,
      arrivalAirport: '',
      departureDate: '',
      flightCode: ''
    };
  }

  function openDrawer() {
    backdrop.classList.add('show');
    drawer.classList.add('show');
    document.body.classList.add('drawer-open');
    btnClose.focus();
  }

  function closeDrawer() {
    backdrop.classList.remove('show');
    drawer.classList.remove('show');
    document.body.classList.remove('drawer-open');
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizeAirport(value) {
    return String(value).replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 3);
  }

  function normalizeFlightCode(value) {
    return String(value).replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 7);
  }

  function parseFlightCode(value) {
    const normalized = normalizeFlightCode(value);
    const match = normalized.match(/^([A-Z]{2})(\d{1,5})$/);

    if (!match) {
      return null;
    }

    return {
      airlineCode: match[1],
      flightNumber: toNumber(match[2])
    };
  }

  function toNumber(value) {
    return Number.parseInt(value, 10);
  }

  function formatDate(value) {
    if (!value) {
      return '--/--/----';
    }

    const parts = value.split('-');

    if (parts.length !== 3) {
      return value;
    }

    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function getTotals() {
    return state.savedPlans.reduce(function (totals, plan) {
      totals.pax += Number(plan.totalPax) || 0;
      totals.bag += Number(plan.totalBag) || 0;
      return totals;
    }, { pax: 0, bag: 0 });
  }

  function getRemaining() {
    const totals = getTotals();

    return {
      pax: Math.max(flightContext.totalPax - totals.pax, 0),
      bag: Math.max(flightContext.totalBag - totals.bag, 0)
    };
  }

  function hasDraftChanges() {
    return Boolean(
      planPaxInput.value ||
      planBagInput.value ||
      state.currentSegments.length > 1 ||
      state.currentSegments.some(function (segment) {
        return Boolean(segment.arrivalAirport || segment.departureDate || segment.flightCode);
      })
    );
  }

  function hasPanelChanges() {
    return state.hasPersistedChanges || hasDraftChanges();
  }

  function updateFooterAction() {
    if (!btnFinishPlanning) {
      return;
    }

    const hasChanges = hasPanelChanges();
    btnFinishPlanning.textContent = hasChanges ? 'Salvar e fechar' : 'Fechar';
    btnFinishPlanning.disabled = false;

    if (footerActionHint) {
      footerActionHint.textContent = hasChanges
        ? 'Salva as alterações e volta para a lista de voos.'
        : 'Sem alterações para salvar.';
    }
  }

  function syncSegmentOrigins() {
    let nextOrigin = flightContext.origin;

    state.currentSegments.forEach(function (segment, index) {
      segment.departureAirport = nextOrigin;
      nextOrigin = segment.arrivalAirport || '';

      const originInput = segmentsList.querySelector('[data-index="' + index + '"] .js-segment-origin');

      if (originInput) {
        originInput.value = segment.departureAirport;
      }
    });
  }

  function buildRoutePath(plan) {
    if (!plan.accommodationsItineraries.length) {
      return flightContext.origin + ' -> ' + flightContext.destination;
    }

    const airports = [plan.accommodationsItineraries[0].departureAirport];

    plan.accommodationsItineraries.forEach(function (segment) {
      airports.push(segment.arrivalAirport);
    });

    return airports.join(' -> ');
  }

  function renderFlightSummary() {
    const totals = getTotals();
    const remaining = getRemaining();

    document.getElementById('flight-code').textContent = flightContext.flightCode;
    document.getElementById('flight-registration').textContent = flightContext.registration;
    document.getElementById('flight-aircraft').textContent = flightContext.aircraft;
    document.getElementById('flight-route').textContent =
      'Origem: ' + flightContext.origin + ' - Destino final: ' + flightContext.destination;
    document.getElementById('destination-chip').textContent = 'Destino final: ' + flightContext.destination;
    document.getElementById('pax-counter').innerHTML =
      '<span class="counter-pill__done">' + totals.pax + '</span><span class="counter-pill__total">/' + flightContext.totalPax + '</span>';
    document.getElementById('bag-counter').innerHTML =
      '<span class="counter-pill__done">' + totals.bag + '</span><span class="counter-pill__total">/' + flightContext.totalBag + '</span>';
    document.getElementById('pax-remaining').textContent = remaining.pax + ' à acomodar';
    document.getElementById('bag-remaining').textContent = remaining.bag + ' à acomodar';

    updateFooterAction();
  }

  function renderSegments() {
    syncSegmentOrigins();

    segmentsList.innerHTML = state.currentSegments.map(function (segment, index) {
      const canRemove = state.currentSegments.length > 1;
      const flightCode = segment.flightCode || '';

      return [
        '<div class="segment-row" data-index="' + index + '">',
        '  <div class="segment-row__marker">',
        '    <span>' + (index + 1) + '</span>',
        '  </div>',
        '  <label class="form-field form-field--origin">',
        '    <span>Origem</span>',
        '    <input class="js-segment-origin" type="text" value="' + escapeHtml(segment.departureAirport) + '" readonly />',
        '  </label>',
        '  <label class="form-field">',
        '    <span>Destino *</span>',
        '    <input class="js-segment-input" data-field="arrivalAirport" type="text" maxlength="3" placeholder="' + flightContext.destination + '" value="' + escapeHtml(segment.arrivalAirport) + '" />',
        '  </label>',
        '  <label class="form-field">',
        '    <span>Data *</span>',
        '    <input class="js-segment-input" data-field="departureDate" type="date" value="' + escapeHtml(segment.departureDate) + '" />',
        '  </label>',
        '  <label class="form-field form-field--flight">',
        '    <span>Voo *</span>',
        '    <input class="js-segment-input" data-field="flightCode" type="text" inputmode="text" maxlength="7" placeholder="LA0000" value="' + escapeHtml(flightCode) + '" aria-label="Código e número do voo" />',
        '  </label>',
        '  <button class="row-action row-action--delete" type="button" title="Remover trecho" aria-label="Remover trecho" data-action="remove-segment" ' + (canRemove ? '' : 'disabled') + '>',
        '    <svg class="icon" viewBox="0 0 16 16" aria-hidden="true">',
        '      <path d="M3 4.2h10M6.4 4.2V3.1h3.2v1.1M5 6.2l.4 6.3h5.2l.4-6.3" />',
        '    </svg>',
        '  </button>',
        '</div>'
      ].join('\n');
    }).join('\n');
  }

  function renderPlans() {
    const countLabel = state.savedPlans.length === 1 ? '1 acomodação' : state.savedPlans.length + ' acomodações';
    document.getElementById('saved-count').textContent = countLabel;

    if (!state.savedPlans.length) {
      plansList.innerHTML = '<p class="empty-panel">Nenhum plano registrado para este voo.</p>';
      return;
    }

    plansList.innerHTML = state.savedPlans.map(function (plan, index) {
      const routePath = buildRoutePath(plan);
      const segments = plan.accommodationsItineraries.map(function (segment) {
        return [
          '<li>',
          '  <span class="segment-list__number">' + segment.segment + '</span>',
          '  <span class="segment-list__flight">' + escapeHtml(segment.airlineCode) + escapeHtml(segment.flightNumber) + '</span>',
          '  <span>' + formatDate(segment.departureDate) + '</span>',
          '  <span>' + escapeHtml(segment.departureAirport) + ' -> ' + escapeHtml(segment.arrivalAirport) + '</span>',
          '</li>'
        ].join('\n');
      }).join('\n');

      return [
        '<article class="plan-card">',
        '  <div class="plan-card__index">' + (index + 1) + '</div>',
        '  <div class="plan-card__content">',
        '    <div class="plan-card__header">',
        '      <div>',
        '        <strong>' + escapeHtml(routePath) + '</strong>',
        '        <p>PAX ' + plan.totalPax + ' / BAG ' + plan.totalBag + '</p>',
        '        <p class="plan-card__author">Acomodação planejada por: ' + escapeHtml(plan.author || flightContext.author) + '</p>',
        '      </div>',
        '      <button class="row-action row-action--delete" type="button" title="Remover plano" aria-label="Remover plano" data-action="remove-plan" data-id="' + plan.id + '">',
        '        <svg class="icon" viewBox="0 0 16 16" aria-hidden="true">',
        '          <path d="M3 4.2h10M6.4 4.2V3.1h3.2v1.1M5 6.2l.4 6.3h5.2l.4-6.3" />',
        '        </svg>',
        '      </button>',
        '    </div>',
        '    <ol class="segment-list">' + segments + '</ol>',
        '  </div>',
        '</article>'
      ].join('\n');
    }).join('\n');
  }

  function renderPayload() {
    if (!payloadOutput) {
      return;
    }

    payloadOutput.textContent = JSON.stringify({ data: state.savedPlans }, null, 2);
  }

  function validateCurrentPlan() {
    const rawPax = planPaxInput.value;
    const rawBag = planBagInput.value;
    const pax = rawPax === '' ? null : toNumber(rawPax);
    const bag = rawBag === '' ? null : toNumber(rawBag);
    const messages = [];

    syncSegmentOrigins();

    if (pax === null || Number.isNaN(pax) || pax <= 0) {
      messages.push('Informe a quantidade de PAX deste plano.');
    }

    if (bag === null || Number.isNaN(bag) || bag < 0) {
      messages.push('Informe a quantidade de BAG deste plano.');
    }

    state.currentSegments.forEach(function (segment, index) {
      const segmentNumber = index + 1;

      if (!segment.departureAirport) {
        messages.push('O trecho ' + segmentNumber + ' depende do destino do trecho anterior.');
      }

      if (!segment.arrivalAirport) {
        messages.push('Informe o destino do trecho ' + segmentNumber + '.');
      }

      if (!segment.departureDate) {
        messages.push('Informe a data do trecho ' + segmentNumber + '.');
      }

      if (!parseFlightCode(segment.flightCode)) {
        messages.push('Informe o voo do trecho ' + segmentNumber + ' no formato LA0000.');
      }
    });

    const lastSegment = state.currentSegments[state.currentSegments.length - 1];

    if (lastSegment && lastSegment.arrivalAirport && lastSegment.arrivalAirport !== flightContext.destination) {
      messages.push('O último destino precisa ser ' + flightContext.destination + ' para salvar.');
    }

    const isValid = messages.length === 0;
    btnSavePlan.disabled = !isValid;
    validationMessage.textContent = isValid
      ? 'Plano pronto para salvar com ' + state.currentSegments.length + ' trecho(s).'
      : messages[0];
    validationMessage.classList.toggle('validation-message--success', isValid);
    validationMessage.classList.toggle('validation-message--error', !isValid);
    updateFooterAction();

    return isValid;
  }

  function resetCurrentPlan() {
    planPaxInput.value = '';
    planBagInput.value = '';
    state.currentSegments = [createBlankSegment()];
  }

  function saveCurrentPlan() {
    if (!validateCurrentPlan()) {
      return false;
    }

    const nextId = state.savedPlans.reduce(function (highestId, plan) {
      return Math.max(highestId, Number(plan.id) || 0);
    }, 0) + 1;

    const newPlan = {
      id: nextId,
      idConnection: flightContext.idConnection,
      totalPax: toNumber(planPaxInput.value),
      totalBag: toNumber(planBagInput.value),
      accommodationsItineraries: state.currentSegments.map(function (segment, index) {
        const parsedFlight = parseFlightCode(segment.flightCode);

        return {
          segment: index + 1,
          airlineCode: parsedFlight.airlineCode,
          flightNumber: parsedFlight.flightNumber,
          departureDate: segment.departureDate,
          departureAirport: segment.departureAirport,
          arrivalAirport: segment.arrivalAirport
        };
      }),
      createDate: Date.now(),
      idAuthor: flightContext.idAuthor,
      author: flightContext.author
    };

    state.savedPlans.push(newPlan);
    state.hasPersistedChanges = true;
    resetCurrentPlan();
    renderAll();
    return true;
  }

  function finishPlanning() {
    if (hasDraftChanges() && !saveCurrentPlan()) {
      return;
    }

    closeDrawer();
  }

  function renderAll() {
    renderFlightSummary();
    renderSegments();
    renderPlans();
    renderPayload();
    validateCurrentPlan();
  }

  if (btnOpen) {
    btnOpen.addEventListener('click', openDrawer);
  }

  if (btnClose) {
    btnClose.addEventListener('click', closeDrawer);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeDrawer);
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && drawer.classList.contains('show')) {
      closeDrawer();
    }
  });

  tabItems.forEach(function (tab) {
    tab.addEventListener('click', function () {
      const targetTab = tab.getAttribute('data-tab');

      tabItems.forEach(function (item) {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
      });

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      drawer.setAttribute('data-active-tab', targetTab);

      tabPanels.forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-tab-panel') !== targetTab;
      });
    });
  });

  planPaxInput.addEventListener('input', validateCurrentPlan);
  planBagInput.addEventListener('input', validateCurrentPlan);

  btnAddSegment.addEventListener('click', function () {
    const lastSegment = state.currentSegments[state.currentSegments.length - 1];

    state.currentSegments.push({
      departureAirport: lastSegment.arrivalAirport || '',
      arrivalAirport: '',
      departureDate: lastSegment.departureDate || '',
      flightCode: ''
    });

    renderSegments();
    validateCurrentPlan();
  });

  btnSavePlan.addEventListener('click', saveCurrentPlan);

  if (btnFinishPlanning) {
    btnFinishPlanning.addEventListener('click', finishPlanning);
  }

  segmentsList.addEventListener('input', function (event) {
    const input = event.target.closest('.js-segment-input');

    if (!input) {
      return;
    }

    const row = input.closest('.segment-row');
    const index = Number(row.getAttribute('data-index'));
    const field = input.getAttribute('data-field');
    let value = input.value;

    if (field === 'arrivalAirport') {
      value = normalizeAirport(value);
      input.value = value;
    }

    if (field === 'flightCode') {
      value = normalizeFlightCode(value);
      input.value = value;
    }

    state.currentSegments[index][field] = value;
    syncSegmentOrigins();
    validateCurrentPlan();
  });

  segmentsList.addEventListener('click', function (event) {
    const button = event.target.closest('[data-action="remove-segment"]');

    if (!button || button.disabled) {
      return;
    }

    const row = button.closest('.segment-row');
    const index = Number(row.getAttribute('data-index'));
    state.currentSegments.splice(index, 1);

    if (!state.currentSegments.length) {
      state.currentSegments.push(createBlankSegment());
    }

    renderSegments();
    validateCurrentPlan();
  });

  plansList.addEventListener('click', function (event) {
    const button = event.target.closest('[data-action="remove-plan"]');

    if (!button) {
      return;
    }

    const id = Number(button.getAttribute('data-id'));
    state.savedPlans = state.savedPlans.filter(function (plan) {
      return plan.id !== id;
    });
    state.hasPersistedChanges = true;

    renderAll();
  });

  renderAll();
})();
