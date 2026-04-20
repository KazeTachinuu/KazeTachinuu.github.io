import { defineEcConfig } from 'astro-expressive-code';
import codeDark from './themes/josh-dark.json' with { type: 'json' };
import codeLight from './themes/josh-light.json' with { type: 'json' };

export default defineEcConfig({
  themes: [codeLight, codeDark],
  themeCssSelector: (theme) => `.${theme.type}`,
  defaultProps: {
    wrap: true,
    preserveIndent: true,
    frame: 'none',
  },
  styleOverrides: {
    borderRadius: '8px',
    borderWidth: '1px',
    borderColor: 'var(--code-border)',
    codeBackground: 'var(--code-bg)',
    codeFontFamily: 'JetBrains Mono, ui-monospace, monospace',
    codeFontSize: '1rem',
    codeLineHeight: '1.7',
    codePaddingBlock: '1.25rem',
    codePaddingInline: '1.25rem',
    frames: {
      shadowColor: 'transparent',
      editorBackground: 'var(--code-bg)',
      terminalBackground: 'var(--code-bg)',
      frameBoxShadowCssValue: 'none',
    },
  },
});
