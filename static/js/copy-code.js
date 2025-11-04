(function() {
  'use strict';

  window.copyCode = function(button) {
    const highlightedCode = button.parentElement.querySelector('.highlight code');
    if (!highlightedCode) return;

    const lines = highlightedCode.textContent.split('\n');
    const code = lines
      .map(line => line.replace(/^\s*\d+\s*/, ''))
      .join('\n')
      .trim();

    navigator.clipboard.writeText(code).then(() => {
      button.classList.add('copied');
      setTimeout(() => button.classList.remove('copied'), 2000);
    }).catch(err => console.error('Copy failed:', err));
  };

})();
