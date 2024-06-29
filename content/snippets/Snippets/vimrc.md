+++
title = ".vimrc config file"
description = ""
language = "vimrc"
date = 2024-06-13T17:41:36-04:00
+++


{{< copy_code >}}
{{< highlight shell "linenos=inline" >}}
sh -c "$(curl -fsSL https://raw.githubusercontent.com/KazeTachinuu/config/master/installvim.sh)"
{{< /highlight >}}
{{< /copy_code >}}



{{< copy_code >}}
{{< highlight shell "linenos=inline" >}}

" Enable Vundle: Vim plugin manager
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()

" Basic plugins
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

" Conditionally load coc.nvim
let g:use_coc = 0 " Set to 1 to enable coc.nvim

if g:use_coc
    Plugin 'neoclide/coc.nvim' " Intellisense engine
endif

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
set clipboard=unnamedplus  " Use system clipboard

" Key Bindings
nnoremap j gj           " Move down by visual line (don't skip wrapped lines)
nnoremap k gk           " Move up by visual line (don't skip wrapped lines)
nnoremap <C-d> <C-d>zz  " Scroll down half screen
nnoremap <C-u> <C-u>zz  " Scroll up half screen
nnoremap Q <nop>        " Disable Ex mode
nnoremap <C-a> ggVG     " Select all text
nnoremap <C-c> <cmd>%y<CR> " Copy all text

vnoremap J :m '>+1<CR>gv=gv
vnoremap K :m '<-2<CR>gv=gv

" Toggle NERDTree file tree
nnoremap <C-n> :NERDTreeToggle<CR>

" Find and replace in all files with CTRL+S in normal mode
nnoremap <C-s> :%s/\<<C-r><C-w>\>/<C-r><C-w>/gI<Left><Left><Left>

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
nnoremap <SPACE> <Nop>
let mapleader=" "
set ph=10               " Max height of windows appearing

if g:use_coc
    " CoC.nvim configuration
    " Autocomplete and diagnostics settings
    inoremap <silent><expr> <CR> coc#pum#visible() ? coc#pum#confirm() : "\<CR>"
    inoremap <silent><expr> <C-j> coc#pum#visible() ? coc#pum#next(1) : "\<C-j>"
    inoremap <silent><expr> <C-k> coc#pum#visible() ? coc#pum#prev(1) : "\<C-k>"

    " GoTo code navigation.
    nmap <silent> gd <Plug>(coc-definition)
    nmap <silent> gy <Plug>(coc-type-definition)
    nmap <silent> gi <Plug>(coc-implementation)
    nmap <silent> gr <Plug>(coc-references)

    " Use K to show documentation in preview window.
    nnoremap <silent> K :call <SID>show_documentation()<CR>

    function! s:show_documentation()
      if CocAction('hasProvider', 'hover')
        call CocActionAsync('doHover')
      else
        call feedkeys('K', 'in')
      endif
    endfunction

    " Highlight the symbol and its references when holding the cursor.
    " autocmd CursorHold * silent call CocActionAsync('highlight')

    " Symbol renaming.
    nmap <leader>rn <Plug>(coc-rename)

    " Formatting selected code.
    xmap <leader>f  <Plug>(coc-format-selected)
    nmap <leader>f  <Plug>(coc-format-selected)
    nnoremap <silent> <C-f> :call CocAction('format')<CR>

    " Update signature help on jump placeholder.
    autocmd User CocJumpPlaceholder call CocActionAsync('showSignatureHelp')

    " Applying code actions to the selected code block.
    nmap <leader>ac  <Plug>(coc-codeaction-selected)
    xmap <leader>ac  <Plug>(coc-codeaction-selected)
    " Remap keys for applying code actions at the current cursor position.
    nmap <leader>ca  <Plug>(coc-codeaction)

    " Remap keys for applying code actions for the current buffer.
    nmap <leader>cA  <Plug>(coc-codeaction-all)

    " Use `[g` and `]g` to navigate diagnostics
    " Use `:CocDiagnostics` to get all diagnostics of current buffer in location list.
    nmap <silent> [g <Plug>(coc-diagnostic-prev)
    nmap <silent> ]g <Plug>(coc-diagnostic-next)
endif


{{< /highlight >}}
{{< /copy_code >}}
