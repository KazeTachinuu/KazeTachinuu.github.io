+++
title = "Cool Install Script"
description= "Single File Install Config"
language = "bash"
date = 2024-06-13T17:41:36-04:00
+++


## One Liner
{{< copy_code >}}
{{< highlight bash "linenos=inline" >}}

sh -c "$(curl -fsSL https://raw.githubusercontent.com/KazeTachinuu/config/master/install.sh)"

{{< /highlight >}}
{{< /copy_code >}}

## Actual Script

{{< copy_code >}}
{{< highlight bash "linenos=inline" >}}

#!/bin/sh

# Define colors for colorful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# List of packages to be installed
PACKAGES="vim zsh"

install_packages() {
    package_manager=$1
    echo -e "${YELLOW}Installing packages using $package_manager...${NC}"
    case $package_manager in
        apk) sudo apk add --no-cache $packagesNeeded ;;
        apt-get) sudo apt-get update && sudo apt-get install -y $packagesNeeded ;;
        dnf) sudo dnf install -y $packagesNeeded ;;
        zypper) sudo zypper install -y $packagesNeeded ;;
        pacman) sudo pacman -Sy --noconfirm $packagesNeeded ;;
        *) echo -e "${RED}FAILED TO INSTALL PACKAGES: Unsupported package manager.${NC}" >&2; return 1 ;;
    esac
    echo -e "${GREEN}Packages installed successfully.${NC}"
}


# Function to change the default shell
change_default_shell() {
    shell=$1
    if command -v "$shell" >/dev/null 2>&1 && [ "$SHELL" != "$(command -v $shell)" ]; then
        echo -e "${YELLOW}Changing default shell to $shell...${NC}"
        chsh -s "$(command -v $shell)"
        echo -e "${GREEN}Default shell changed to $shell.${NC}"
    else
        echo -e "${RED}Shell $shell not found or already set as default.${NC}" >&2
    fi
}

# Function to fetch and install if not already present
fetch_and_install() {
    url=$1
    target=$2
    echo -e "${YELLOW}Fetching $url and installing to $target...${NC}"
    [ -d "$target" ] && rm -rf "$target"
    git clone --quiet "$url" "$target"
    echo -e "${GREEN}Installation to $target completed.${NC}"
}

# Main installation function
main() {
    # Check which package manager is available and install necessary packages
    for manager in apk apt-get dnf zypper pacman; do
        command -v "$manager" >/dev/null 2>&1 && install_packages "$manager" && break
    done

    # Change default shell to zsh
    change_default_shell zsh

    # Install Vundle Vim Plugin Manager
    fetch_and_install "https://github.com/VundleVim/Vundle.vim.git" "$HOME/.vim/bundle/Vundle.vim"

    # Download and update .vimrc
    echo -e "${YELLOW}Updating vimrc...${NC}"
    curl -fsSL "https://raw.githubusercontent.com/KazeTachinuu/config/master/.vimrc" -o "$HOME/.vimrc"
    echo -e "${GREEN}vimrc updated successfully.${NC}"

    # Create ~/.vimundo directory
    if [ ! -d "$HOME/.vimundo" ]; then
        echo -e "${YELLOW}Creating ~/.vimundo directory...${NC}"
        mkdir -p "$HOME/.vimundo"
        echo -e "${GREEN}~/.vimundo directory created successfully.${NC}"
    fi

    # Install Oh-My-Zsh
    echo -e "${YELLOW}Installing Oh-My-Zsh...${NC}"
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh | sed '/\s*exec\s\s*zsh\s*-l\s*/d')" --unattended --skip-chsh
    echo -e "${GREEN}Oh-My-Zsh installed successfully.${NC}"

    # Download and update .zshrc
    echo -e "${YELLOW}Updating zshrc...${NC}"
    curl -fsSL "https://raw.githubusercontent.com/KazeTachinuu/config/master/.zshrc" -o "$HOME/.zshrc"
    echo -e "${GREEN}zshrc updated successfully.${NC}"

    # Install zsh plugins (zsh-autosuggestions and zsh-syntax-highlighting)
    fetch_and_install "https://github.com/zsh-users/zsh-autosuggestions.git" "$HOME/.oh-my-zsh/custom/plugins/zsh-autosuggestions"
    fetch_and_install "https://github.com/zsh-users/zsh-syntax-highlighting.git" "$HOME/.local/share/zsh/plugins/zsh-syntax-highlighting"

    # Install useful aliases if not already installed
    if [ ! -f "$HOME/.my_aliases.txt" ]; then
        echo -e "${YELLOW}Installing useful aliases...${NC}"
        curl -fsSL "https://raw.githubusercontent.com/KazeTachinuu/config/master/.my_aliases.txt" -o "$HOME/.my_aliases.txt"
        echo -e "${GREEN}Aliases installed successfully.${NC}"
    fi

    # Create Vim plugin directory and clone vim-commentary plugin
    echo -e "${YELLOW}Installing vim-commentary plugin...${NC}"
    mkdir -p "$HOME/.vim/pack/tpope/start/commentary"
    fetch_and_install "https://tpope.io/vim/commentary.git" "$HOME/.vim/pack/tpope/start/commentary"
    echo -e "${GREEN}vim-commentary plugin installed successfully.${NC}"

    # Notify completion
    echo -e "${GREEN}All tasks completed successfully.${NC}"
    env zsh  # Start zsh shell
}

# Execute main function
main



{{< /highlight >}}
{{< /copy_code >}}

