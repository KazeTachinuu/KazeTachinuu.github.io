(function() {
  'use strict';

  let searchIndex = null;
  let searchInput = null;
  let searchResults = null;
  let searchModal = null;
  let isOpen = false;

  const config = {
    indexPath: '/index.json',
    minChars: 1,
    maxResults: 10
  };

  function init() {
    searchModal = document.getElementById('fastSearch');
    searchInput = document.getElementById('searchInput');
    searchResults = document.getElementById('searchResults');

    if (!searchModal || !searchInput || !searchResults) return;

    setupEventListeners();
    loadSearchIndex();
  }

  function setupEventListeners() {
    document.addEventListener('keydown', handleGlobalKeydown);
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keydown', handleSearchKeydown);
    searchModal.addEventListener('click', function(e) {
      if (e.target === searchModal) closeSearch();
    });
  }

  function handleGlobalKeydown(e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === '/')) {
      e.preventDefault();
      openSearch();
    }
  }

  function handleSearchKeydown(e) {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        closeSearch();
        break;
      case 'ArrowDown':
        e.preventDefault();
        focusNextResult();
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusPreviousResult();
        break;
      case 'Enter':
        e.preventDefault();
        const firstResult = searchResults.querySelector('a');
        if (firstResult) firstResult.click();
        break;
    }
  }

  async function loadSearchIndex() {
    try {
      const response = await fetch(config.indexPath);
      if (!response.ok) throw new Error('Failed to load search index');
      searchIndex = await response.json();
    } catch (error) {
      showMessage('Failed to load search index. Please refresh.');
    }
  }

  function handleSearch(e) {
    const query = e.target.value.trim().toLowerCase();

    if (query.length === 0) {
      clearResults();
      return;
    }

    if (!searchIndex) {
      showMessage('Loading...');
      return;
    }

    performSearch(query);
  }

  function performSearch(query) {
    const results = [];

    searchIndex.forEach(item => {
      let score = 0;
      const title = item.title.toLowerCase();
      const content = (item.content || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      const section = (item.section || '').toLowerCase();
      const tags = (Array.isArray(item.tags) ? item.tags : []).join(' ').toLowerCase();
      const categories = (Array.isArray(item.categories) ? item.categories : []).join(' ').toLowerCase();
      const language = (item.language || '').toLowerCase();

      if (title === query) score += 100;
      else if (title.startsWith(query)) score += 50;
      else if (title.includes(query)) score += 30;

      if (description.includes(query)) score += 25;
      if (categories.includes(query)) score += 20;
      if (tags.includes(query)) score += 15;
      if (content.includes(query)) score += 10;
      if (section.includes(query)) score += 8;
      if (language.includes(query)) score += 5;

      if (score > 0) results.push({...item, score});
    });

    results.sort((a, b) => b.score - a.score);
    displayResults(results.slice(0, config.maxResults), query);
  }

  function displayResults(results, query) {
    if (results.length === 0) {
      showMessage(`No results for "${query}"`);
      return;
    }

    searchResults.innerHTML = results.map(item => {
      const categories = Array.isArray(item.categories) && item.categories.length > 0
        ? `<span class="search-result-categories">${item.categories.slice(0, 2).map(c => escapeHtml(c)).join(', ')}</span>`
        : '';

      const tags = Array.isArray(item.tags) && item.tags.length > 0
        ? `<span class="search-result-tags">${item.tags.slice(0, 3).map(tag => `#${escapeHtml(tag)}`).join(' ')}</span>`
        : '';

      return `
        <li>
          <a href="${escapeHtml(item.permalink)}">
            <div class="search-result-title">${highlightMatch(item.title, query)}</div>
            <div class="search-result-meta">
              <span class="search-result-section">${escapeHtml(item.section)}</span>
              ${categories}
              ${item.date ? `<span class="search-result-date">${escapeHtml(item.date)}</span>` : ''}
            </div>
            ${item.description ? `<div class="search-result-summary">${highlightMatch(item.description, query)}</div>` : ''}
            ${tags ? `<div class="search-result-tags-row">${tags}</div>` : ''}
          </a>
        </li>
      `;
    }).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function highlightMatch(text, query) {
    const safeText = escapeHtml(text);
    const safeQuery = escapeRegex(query);
    const regex = new RegExp(`(${safeQuery})`, 'gi');
    return safeText.replace(regex, '<mark>$1</mark>');
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function showMessage(message) {
    searchResults.innerHTML = `<li class="search-message">${message}</li>`;
  }

  function clearResults() {
    searchResults.innerHTML = '';
  }

  function openSearch() {
    if (isOpen) return;
    isOpen = true;
    searchModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => searchInput.focus(), 100);
  }

  function closeSearch() {
    if (!isOpen) return;
    isOpen = false;
    searchModal.classList.remove('is-open');
    document.body.style.overflow = '';
    searchInput.value = '';
    clearResults();
  }

  function focusNextResult() {
    const links = searchResults.querySelectorAll('a');
    const activeElement = document.activeElement;

    for (let i = 0; i < links.length; i++) {
      if (links[i] === activeElement && i < links.length - 1) {
        links[i + 1].focus();
        return;
      }
    }

    if (links.length > 0) links[0].focus();
  }

  function focusPreviousResult() {
    const links = searchResults.querySelectorAll('a');
    const activeElement = document.activeElement;

    for (let i = 0; i < links.length; i++) {
      if (links[i] === activeElement && i > 0) {
        links[i - 1].focus();
        return;
      }
    }

    searchInput.focus();
  }

  window.openSearchModal = openSearch;
  window.closeSearchModal = closeSearch;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
