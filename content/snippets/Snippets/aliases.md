+++
title = "Useful Aliases"
description = "A list of useful aliases I use everyday"
language = "bash"
date = 2024-04-10T17:41:36-04:00

+++

{{< copy_code >}}
{{< highlight shell "linenos=inline" >}}
# Sytem Shortcuts
alias config='cd $HOME/.config/'
alias zshalias='$EDITOR $HOME/.my_aliases.txt'
alias vimrc='$EDITOR ~/.vimrc'
alias zshrc='$EDITOR $HOME/.zshrc'
alias tmif='tmux attach -t $1 || tmux new -s $1'

# clang-format all files in subdirectories
alias cfa='if clang-format-all .; then echo "All Files Formatted"; fi'

# Check Current IP Address
alias checkip='curl http://api.ipify.org/'

# Git Aliases
alias gpt='git push --follow-tags'
alias gt='git tag -ma'
alias gca='git commit -a -m'
alias gpl='git pull'
alias gcl='git clean -f -d -x'
alias gl='git log'
alias gs='git status'
alias gp='git push'
{{< /highlight >}}
{{< /copy_code >}}
