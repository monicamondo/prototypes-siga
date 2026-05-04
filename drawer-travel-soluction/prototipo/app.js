(function () {
  'use strict';

  const backdrop = document.getElementById('drawer-backdrop');
  const drawer = document.getElementById('drawer-panel');
  const btnOpen = document.getElementById('btn-open-drawer');
  const btnClose = document.getElementById('btn-close-drawer');
  const btnClearFilters = document.getElementById('btn-clear-filters');
  const searchForm = document.getElementById('solution-search-form');
  const searchInput = document.getElementById('solution-search');
  const emptySearch = document.getElementById('solution-empty-search');
  const cards = Array.from(document.querySelectorAll('[data-solution-card]'));

  function openDrawer() {
    resetPanelView();
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

  function resetPanelView() {
    searchInput.value = '';
    cards.forEach(function (card) {
      card.hidden = false;
      closeCardEditor(card);
    });
    emptySearch.hidden = true;
  }

  function normalizeSearch(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function getCardSearchValue(card) {
    const storedSearch = card.getAttribute('data-search') || '';
    const treatment = card.querySelector('[data-bag-summary]').textContent || '';

    return normalizeSearch(storedSearch + ' ' + treatment);
  }

  function applySearch() {
    const query = normalizeSearch(searchInput.value);
    let visibleCount = 0;

    cards.forEach(function (card) {
      const shouldShow = !query || getCardSearchValue(card).includes(query);
      card.hidden = !shouldShow;

      if (shouldShow) {
        visibleCount += 1;
      } else {
        closeCardEditor(card);
      }
    });

    emptySearch.hidden = visibleCount > 0;
  }

  function clearFilters() {
    searchInput.value = '';
    applySearch();
    searchInput.focus();
  }

  function getClosedActionLabel(card) {
    return card.getAttribute('data-bag-treatment-value') ? 'Editar tratativa' : 'Tratar bagagens';
  }

  function closeCardEditor(card) {
    const editor = card.querySelector('[data-bag-editor]');
    const editButton = card.querySelector('[data-action="edit-card"]');

    syncEditorFromSaved(card);
    card.removeAttribute('data-editing');
    editor.hidden = true;
    editButton.setAttribute('aria-expanded', 'false');
    editButton.textContent = getClosedActionLabel(card);
  }

  function syncEditorFromSaved(card) {
    const treatmentSelect = card.querySelector('[data-bag-treatment]');
    const quantityInput = getQuantityInput(card);

    treatmentSelect.value = card.getAttribute('data-bag-treatment-value') || '';
    treatmentSelect.removeAttribute('aria-invalid');
    quantityInput.value = card.getAttribute('data-bag-quantity-value') || '0';
  }

  function openCardEditor(card) {
    cards.forEach(function (item) {
      if (item !== card) {
        closeCardEditor(item);
      }
    });

    const editor = card.querySelector('[data-bag-editor]');
    const editButton = card.querySelector('[data-action="edit-card"]');
    const treatmentSelect = card.querySelector('[data-bag-treatment]');

    syncEditorFromSaved(card);
    card.setAttribute('data-editing', 'true');
    editor.hidden = false;
    editButton.setAttribute('aria-expanded', 'true');
    editButton.textContent = 'Fechar';
    treatmentSelect.focus();
  }

  function toggleCardEditor(card) {
    if (card.getAttribute('data-editing') === 'true') {
      closeCardEditor(card);
      return;
    }

    openCardEditor(card);
  }

  function getQuantityInput(card) {
    return card.querySelector('[data-bag-quantity]');
  }

  function normalizeQuantity(value) {
    const normalizedValue = String(value || '').replace(/\D/g, '').slice(0, 2);
    const quantity = Number.parseInt(normalizedValue, 10);

    if (Number.isNaN(quantity) || quantity < 0) {
      return 0;
    }

    return Math.min(quantity, 99);
  }

  function saveBagTreatment(card) {
    const treatmentSelect = card.querySelector('[data-bag-treatment]');
    const quantityInput = getQuantityInput(card);
    const summary = card.querySelector('[data-bag-summary]');
    const quantitySummary = card.querySelector('[data-bag-quantity-summary]');
    const treatment = treatmentSelect.value;

    if (!treatment) {
      treatmentSelect.setAttribute('aria-invalid', 'true');
      treatmentSelect.focus();
      return;
    }

    const quantity = normalizeQuantity(quantityInput.value);

    treatmentSelect.removeAttribute('aria-invalid');
    quantityInput.value = quantity;
    card.setAttribute('data-bag-treatment-value', treatment);
    card.setAttribute('data-bag-quantity-value', quantity);
    summary.textContent = treatment;
    summary.removeAttribute('data-state');
    quantitySummary.textContent = quantity;
    closeCardEditor(card);
    applySearch();
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

  if (btnClearFilters) {
    btnClearFilters.addEventListener('click', clearFilters);
  }

  if (searchForm) {
    searchForm.addEventListener('submit', function (event) {
      event.preventDefault();
      applySearch();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', applySearch);
  }

  cards.forEach(function (card) {
    const editor = card.querySelector('[data-bag-editor]');
    const treatmentSelect = card.querySelector('[data-bag-treatment]');
    const quantityInput = getQuantityInput(card);

    card.addEventListener('click', function (event) {
      const interactiveTarget = event.target.closest('a, button, input, label, select, textarea');

      if (interactiveTarget) {
        return;
      }

      openCardEditor(card);
    });

    treatmentSelect.addEventListener('change', function () {
      treatmentSelect.removeAttribute('aria-invalid');
    });

    quantityInput.addEventListener('input', function () {
      quantityInput.value = normalizeQuantity(quantityInput.value);
    });

    card.addEventListener('click', function (event) {
      const actionButton = event.target.closest('[data-action]');

      if (!actionButton) {
        return;
      }

      const action = actionButton.getAttribute('data-action');

      if (action === 'edit-card') {
        toggleCardEditor(card);
      }

      if (action === 'cancel-card') {
        closeCardEditor(card);
      }

    });

    editor.addEventListener('submit', function (event) {
      event.preventDefault();
      saveBagTreatment(card);
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && drawer.classList.contains('show')) {
      const editingCard = document.querySelector('[data-solution-card][data-editing="true"]');

      if (editingCard) {
        closeCardEditor(editingCard);
        return;
      }

      closeDrawer();
    }
  });
})();
