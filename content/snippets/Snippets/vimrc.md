+++
title = ".vimrc config file"
description = ""
language = "vimrc"
date = 2024-04-13T17:41:36-04:00
+++

{{< copy_code >}}
{{< highlight shell "linenos=inline" >}}

" Enable Vundle: Vim plugin manager
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()
Plugin 'VundleVim/Vundle.vim'
Plugin 'scrooloose/nerdtree'       " File tree explorer with Ctrl+N
Plugin 'vim-airline/vim-airline'   " Stylish status bar
Plugin 'jiangmiao/auto-pairs'      " Automatic insertion of brackets, quotes, etc.
Plugin 'w0rp/ale'                  " Syntax checking and linting
Plugin 'honza/vim-snippets'        " Collection of useful snippets
Plugin 'garbas/vim-snipmate'       " Snippet management (deprecated, consider using UltiSnips or vim-snippets instead)
Plugin 'tomtom/tlib_vim'           " Required for some plugins
Plugin 'MarcWeber/vim-addon-mw-utils' " More utilities for Vim
Plugin 'sainnhe/sonokai'           " Beautiful colorscheme
Plugin 'prabirshrestha/asyncomplete.vim'   " Async completion framework
Plugin 'prabirshrestha/vim-lsp'     " Language Server Protocol support
Plugin 'mattn/vim-lsp-settings'    " Settings for LSP plugins
call vundle#end()

" INSTALL PLUGINS WITH :PluginInstall

" Basic Behavior and Interface
set number              " Show line numbers
set wrap                " Wrap lines
set encoding=utf-8      " Use UTF-8 encoding
set mouse=a             " Enable mouse support
set wildmenu            " Visual autocomplete for command menu
set lazyredraw          " Redraw screen only when needed
set showmatch           " Highlight matching parentheses / brackets [{()}]
set laststatus=2        " Always show statusline
set ruler               " Show line and column number of the cursor
set signcolumn=yes      " Show sign column for LSP diagnostics
set clipboard+=unnamedplus  " Use system clipboard

" Key Bindings
nnoremap j gj           " Move down by visual line (don't skip wrapped lines)
nnoremap k gk           " Move up by visual line (don't skip wrapped lines)
nnoremap <C-d> <C-d>zz  " Scroll down half screen
nnoremap <C-u> <C-u>zz  " Scroll up half screen
nnoremap Q <nop>        " Disable Ex mode
nnoremap <C-a> ggVG     " Select all text
nnoremap <C-c> <cmd>%y+<CR> " Copy all text
" Remap <leader>y in normal and visual mode to yank to system clipboard
nnoremap <leader>y "+y
vnoremap <leader>y "+y

" Remap <leader>Y in normal mode to yank to system clipboard from current line
nnoremap <leader>Y "+Y

" Toggle NERDTree file tree
nnoremap <C-n> :NERDTreeToggle<CR>

" Remap CTRL+F in insert mode for file path completion
inoremap <C-f> <C-x><C-f>

" Find and replace in all files with CTRL+S in normal mode
nnoremap <C-s> :bufdo %s///g<left><left>

" Vim Appearance
colorscheme sonokai     " Set colorscheme
set termguicolors       " Enable true colors support
autocmd vimenter * hi Normal guibg=NONE ctermbg=NONE  " Set background to transparent

" Use filetype-based settings
syntax enable           " Enable syntax highlighting
filetype plugin indent on  " Enable filetype-specific plugins and indentation

" Tab Settings
set tabstop=4           " Set tab width to 4 spaces
set expandtab           " Use spaces instead of <TAB>
set shiftwidth=4        " Number of spaces to use for (auto)indent
set softtabstop=4       " Backspace deletes up to 4 spaces

" Search Settings
set incsearch           " Highlight matches as characters are entered
set hlsearch            " Highlight all matches

" Turn off search highlighting with <CR> (carriage-return)
nnoremap <CR> :nohlsearch<CR><CR>

" Miscellaneous Settings
set background=dark     " Use dark background
set autoread            " Autoread files changed outside Vim
set scrolloff=8         " Minimum lines to keep above/below cursor
set colorcolumn=80      " Highlight column 80
set hidden              " Allow hiding buffers with unsaved changes
set undofile            " Save undo history to file
set undodir=$HOME/.vimundo/  " Directory for undo files
set backspace=eol,start,indent  " Allow backspace in insert mode
set whichwrap+=<,>,h,l  " Allow <BS>, <Del>, etc. in insert mode
set lazyredraw          " Don't redraw while executing macros
set magic               " Enable magic in regular expressions
set showmatch           " Show matching brackets when text indicator is over them

" Files, Backups, and Undo
set nobackup            " No backup files
set nowb                " No write backup files
set noswapfile          " No swap files

let g:snipMate = { 'snippet_version' : 1 }
let mapleader=" "
set ph=10               " Max height of windows appearing

let g:lsp_diagnostics_enabled = 0   " Disable LSP diagnostics by default

function! s:on_lsp_buffer_enabled() abort
    setlocal omnifunc=lsp#complete
    setlocal signcolumn=yes
    if exists('+tagfunc')
        setlocal tagfunc=lsp#tagfunc
    endif
    nmap <buffer> gd <plug>(lsp-definition)
    nmap <buffer> gs <plug>(lsp-document-symbol-search)
    nmap <buffer> gS <plug>(lsp-workspace-symbol-search)
    nmap <buffer> gr <plug>(lsp-references)
    nmap <buffer> gi <plug>(lsp-implementation)
    nmap <buffer> gt <plug>(lsp-type-definition)
    nmap <buffer> <leader>rn <plug>(lsp-rename)
    nmap <buffer> [g <plug>(lsp-previous-diagnostic)
    nmap <buffer> ]g <plug>(lsp-next-diagnostic)
    nmap <buffer> K <plug>(lsp-hover)
    nmap <buffer> <leader>f :LspDocumentFormatSync<CR>
endfunction

augroup lsp_install
    au!
    " Call s:on_lsp_buffer_enabled only for languages that have the server registered.
    autocmd User lsp_buffer_enabled call s:on_lsp_buffer_enabled()
augroup END


{{< /highlight >}}
{{< /copy_code >}}
