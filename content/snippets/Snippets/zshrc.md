+++
title = ".zshrc config file"
description = ""
language = "zshrc"
date = 2024-06-13T17:41:36-04:00
+++

{{< copy_code >}}
{{< highlight shell "linenos=inline" >}}
sh -c "$(curl -fsSL https://raw.githubusercontent.com/KazeTachinuu/config/master/installzsh.sh)"
{{< /highlight >}}
{{< /copy_code >}}


{{< copy_code >}}
{{< highlight shell "linenos=inline" >}}

# Enable extended globbing, ignore duplicates in history, and enable prompt substitutions
setopt extended_glob hist_ignore_all_dups prompt_subst


# Aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'

# Prompt configuration
autoload -Uz vcs_info
precmd() { vcs_info }
zstyle ':vcs_info:*' enable git
zstyle ':vcs_info:*' formats '%b'

# Function to include Git info in the prompt
git_prompt_info() {
  [[ -n "$vcs_info_msg_0_" ]] && echo " [%F{yellow}$vcs_info_msg_0_%f]"
}

# Enhanced prompt with Git info
PROMPT=$'%F{%(#.blue.green)}┌──${debian_chroot:+($debian_chroot)──}(%B%F{%(#.red.blue)}%n%(#.💀.㉿)%m%b%F{%(#.blue.green)})-[%B%F{reset}%(6~.%-1~/…/%4~.%5~)%b%F{%(#.blue.green)}] $(git_prompt_info)\n└─%B%(#.%F{red}#.%F{blue}$)%b%F{reset} '
RPROMPT=$'%(?.. %? %F{red}%B⨯%b%F{reset})%(1j. %j %F{yellow}%B⚙%b%F{reset}.)'

# Tab completion
autoload -Uz compinit && compinit

# History settings
HISTSIZE=10000
SAVEHIST=10000
HISTIGNORE="ls:cd:exit"

plugins=(
    zsh-autosuggestions
    git
    history
    sudo
    web-search
    copyfile
    copybuffer
    dirhistory
)

# Editor
export EDITOR='vim'

# Load oh-my-zsh if available
[[ -d "$HOME/.oh-my-zsh" ]] && source "$HOME/.oh-my-zsh/oh-my-zsh.sh"

# Load additional plugins if available
[[ -f "$HOME/.local/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" ]] && source "$HOME/.local/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"

# Load custom aliases if available
[[ -f "$HOME/.my_aliases.txt" ]] && source "$HOME/.my_aliases.txt"

# Load ZSH profile if available
[[ -f "$HOME/.zsh_profile" ]] && source "$HOME/.zsh_profile"

# Custom functions
# function example_function() {
#     echo "This is an example function."
# }
{{< /highlight >}}
{{< /copy_code >}}
