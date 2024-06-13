+++
title = ".vimrc config file"
description = ""
language = "vimrc"
date = 2024-04-03T17:41:36-04:00
+++

{{< copy_code >}}
{{< highlight shell "linenos=inline" >}}

"""" Enable Vundle: vim plugin manager

    
    
" set the runtime path to include Vundle, and initialize
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()
Plugin 'VundleVim/Vundle.vim'
Plugin 'scrooloose/nerdtree'       " NerdTreeToggle avec Ctlr+N
Plugin 'vim-airline/vim-airline'   " Jolie barre en bas :)
Plugin 'jiangmiao/auto-pairs'      " Fais moi confiance c'est bien
Plugin 'w0rp/ale'                  " Syntax Analysis
Plugin 'honza/vim-snippets'        " Collection de snippets sympa
Plugin 'garbas/vim-snipmate'       " Auto Complete les snippets avec TAB
Plugin 'tomtom/tlib_vim'           " Pour snippets
Plugin 'MarcWeber/vim-addon-mw-utils' " Pour Snippets
Plugin 'sainnhe/sonokai'            " Good Theme
Plugin 'prabirshrestha/asyncomplete.vim'
Plugin 'prabirshrestha/vim-lsp'
Plugin 'mattn/vim-lsp-settings'
call vundle#end()

" INSTALL PLUGIN WITH :PluginInstall


"""" Basic Behavior

set number              " show line numbers
" set rnu
set wrap                " wrap lines
set encoding=utf-8      " set encoding to UTF-8 (default was "latin1")
set mouse=a             " enable mouse support (might not work well on Mac OS X)
set wildmenu            " visual autocomplete for command menu
set lazyredraw          " redraw screen only when we need to
set showmatch           " highlight matching parentheses / brackets [{()}]
set laststatus=2        " always show statusline (even with only single window)
set ruler               " show line and column number of the cursor on right side of statusline
set signcolumn=yes
" set visualbell          " blink cursor on error, instead of beeping
set clipboard+=unnamedplus


"""" Key Bindings

" move vertically by visual line (don't skip wrapped lines)
nmap j gj
nmap k gk


nmap <C-d> <C-d>zz
nmap <C-u> <C-u>zz

nmap Q <nop>

" Select All
nmap <C-a> gg<S-v>G

" Copy all
nmap <C-c> <cmd>%y+<CR>


" Affiche un arbre des fichiers
nnoremap <C-n> :NERDTreeToggle<CR>


"""" Vim Appearance
colorscheme sonokai
set termguicolors
autocmd vimenter * hi Normal guibg=NONE ctermbg=NONE

" use filetype-based syntax highlighting, ftplugins, and indentation
syntax enable
filetype plugin indent on


"""" Tab settings

set tabstop=4           " width that a <TAB> character displays as
set expandtab           " convert <TAB> key-presses to spaces
set shiftwidth=4        " number of spaces to use for each step of (auto)indent
set softtabstop=4       " backspace after pressing <TAB> will remove up to this many spaces

set autoindent          " copy indent from current line when starting a new line
set smartindent         " even better autoindent (e.g. add indent after '{')


"""" Search settings

set incsearch           " search as characters are entered
set hlsearch            " highlight matches

" turn off search highlighting with <CR> (carriage-return)
nnoremap <CR> :nohlsearch<CR><CR>


"""" Miscellaneous settings that might be worth enabling

" set cursorline         " highlight current line
set background=dark    " configure Vim to use brighter colors
set autoread           " autoreload the file in Vim if it has been changed outside of Vim

set scrolloff=8
set colorcolumn=80
set hidden
set undofile

set undodir=$HOME/.vimundo/

" Configure backspace so it acts as it should act
set backspace=eol,start,indent
set whichwrap+=<,>,h,l

" Don't redraw while executing macros (good performance config)
set lazyredraw

" For regular expressions turn magic on
set magic

" Show matching brackets when text indicator is over them
set showmatch

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" => Files, backups and undo
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Turn backup off, since most stuff is in SVN, git etc. anyway...
set nobackup
set nowb
set noswapfile

let g:snipMate = { 'snippet_version' : 1 }

let mapleader=" "

set ph=10

let g:lsp_diagnostics_enabled = 0         " disable diagnostics support

function! s:on_lsp_buffer_enabled() abort
    setlocal omnifunc=lsp#complete
    setlocal signcolumn=yes
    if exists('+tagfunc') | setlocal tagfunc=lsp#tagfunc | endif
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
    " refer to doc to add more commands
endfunction

augroup lsp_install
    au!
    " call s:on_lsp_buffer_enabled only for languages that has the server registered.
    autocmd User lsp_buffer_enabled call s:on_lsp_buffer_enabled()
augroup END




{{< /highlight >}}
{{< /copy_code >}}
