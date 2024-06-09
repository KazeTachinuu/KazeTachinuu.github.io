+++
title = ".zshrc config file"
description = ""
language = "zshrc"
date = 2024-04-03T17:41:36-04:00
+++

{{< copy_code >}}
{{< highlight shell "linenos=inline" >}}
export ZSH="/$HOME/.oh-my-zsh"

prompt default &> /dev/null

export EDITOR='vim'

# Load version control information

autoload -Uz vcs_info
precmd() { vcs_info }

# Format the vcs*info_msg_0* variable

zstyle ':vcs_info:git:\*' formats '%b'

# Set up the prompt (with git branch name)

setopt PROMPT_SUBST

plugins=(
zsh-autosuggestions
git
history
sudo
web-search
copyfile
copybuffer
dirhistory
);

source $ZSH/oh-my-zsh.sh

source $HOME/.local/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

PROMPT='%{$fg_bold[cyan]%}>%{$fg_bold[green]%}>%{$fg_bold[magenta]%}>% %{$fg_bold[cyan]%} %c %{$fg_bold[yellow]%}$(git_prompt_info) %{$fg_bold[gray]%}%{$reset_color%}'

ZSH_THEME_GIT_PROMPT_PREFIX="%{$fg[green]%}[%{$fg[yellow]%}"
ZSH_THEME_GIT_PROMPT_SUFFIX="%{$reset_color%}"
ZSH_THEME_GIT_PROMPT_DIRTY="%{$fg[green]%}]"
ZSH_THEME_GIT_PROMPT_CLEAN="%{$fg[green]%}]"
{{< /highlight >}}
{{< /copy_code >}}
