(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const config = {
      itemSelector: searchInput.dataset.items || '.filter-item',
      titleSelector: searchInput.dataset.title || '.uk-card-title',
      extraSelector: searchInput.dataset.extra || null
    };

    const items = document.querySelectorAll(config.itemSelector);
    const filterButtons = document.querySelectorAll('.filter-nav li');
    const noResults = document.getElementById('noResults');
    let currentFilter = 'all';

    function filterItems() {
      const searchTerm = searchInput.value.toLowerCase();
      let visibleCount = 0;

      items.forEach(item => {
        const title = item.querySelector(config.titleSelector)?.textContent.toLowerCase() || '';
        const extra = config.extraSelector ?
          (item.querySelector(config.extraSelector)?.textContent.toLowerCase() || '') : '';
        const tags = item.dataset.tags?.toLowerCase() || '';

        const matchesSearch = !searchTerm ||
          title.includes(searchTerm) ||
          extra.includes(searchTerm) ||
          tags.includes(searchTerm);

        const matchesFilter = currentFilter === 'all' || tags.includes(currentFilter);

        if (matchesSearch && matchesFilter) {
          item.style.display = '';
          visibleCount++;
        } else {
          item.style.display = 'none';
        }
      });

      if (noResults) noResults.classList.toggle('uk-hidden', visibleCount > 0);
      if (typeof UIkit !== 'undefined') UIkit.update(document, 'grid');
    }

    searchInput.addEventListener('input', filterItems);

    filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        filterButtons.forEach(btn => btn.classList.remove('uk-active'));
        button.classList.add('uk-active');
        currentFilter = button.dataset.filter || 'all';
        filterItems();
      });
    });

    const snippetLanguages = document.querySelectorAll('.snippet-language');
    if (snippetLanguages.length > 0) {
      const colors = [
        "#A37FAA", "#7DA9B3", "#E57373", "#D46A97", "#FF8C8C",
        "#FFA1A1", "#FFBB9E", "#FFD878", "#7FAF9D", "#6B7BCB",
        "#FFDAB9", "#FFA769", "#B06969", "#8FAEC4", "#DAA691",
        "#A6816C", "#E6E682", "#5967A8", "#FFB84D", "#67ACA6"
      ];

      snippetLanguages.forEach(lang => {
        const name = lang.textContent.trim().toLowerCase();
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color = colors[Math.abs(hash) % colors.length];
        lang.style.backgroundColor = color;
        lang.style.color = '#ffffff';
      });
    }
  });
})();
