+++
title = "Cool Install Script"
description= "Single File Install Config"
language = "bash"
date = 2024-06-06T17:41:36-04:00
+++


## One Liner
{{< copy_code >}}
{{< highlight bash "linenos=inline" >}}

sh -c "$(curl -fsSL https://gist.githubusercontent.com/KazeTachinuu/a9901b76d8b23116ff24fe4a81ddddc0/raw/71ca155ebefd8d6a00b919c5a7a286bab81ff01d/install.sh)"

{{< /highlight >}}
{{< /copy_code >}}

## Actual Script

{{< copy_code >}}
{{< highlight bash "linenos=inline" >}}

#!/bin/sh

packagesNeeded="vim zsh git curl"

check_root() {
    if [ "$(id -u)" -ne 0 ]; then
        echo "This script must be run as root." >&2
        exit 1
    fi
}

install_packages() {
    package_manager=$1
    echo "Installing packages using $package_manager..."
    case $package_manager in
        apk)
            apk add --no-cache $packagesNeeded
            ;;
        apt-get)
            apt-get update && apt-get install -y $packagesNeeded
            ;;
        dnf)
            dnf install -y $packagesNeeded
            ;;
        zypper)
            zypper install -y $packagesNeeded
            ;;
        pacman)
            pacman -Syu --noconfirm $packagesNeeded
            ;;
        *)
            echo "FAILED TO INSTALL PACKAGES: Unsupported package manager." >&2
            return 1
            ;;
    esac
    echo "Packages installed successfully."
}

change_default_shell() {
    shell=$1
    if command -v $shell >/dev/null 2>&1; then
        echo "Changing default shell to $shell..."
        chsh -s "$(which $shell)"
        echo "Default shell changed to $shell."
    else
        echo "Shell $shell not found." >&2
        return 1
    fi
}

install_vundle() {
    echo "Installing Vundle Vim Plugin Manager..."
    if git clone https://github.com/VundleVim/Vundle.vim.git ~/.vim/bundle/Vundle.vim; then
        echo "Vundle installed successfully."
    else
        echo "Failed to install Vundle." >&2
        return 1
    fi
}

update_vimrc() {
    echo "Updating vimrc..."
    mkdir -p "$HOME/.vimundo"
    if curl -fsSL https://gist.githubusercontent.com/KazeTachinuu/44a958c0f53b8f7663b3de0d2d720ea3/raw/a2eeb2ddd6e172864202ac10d346a96d33449b60/.vimrc -o "$HOME/.vimrc"; then
        echo "vimrc updated successfully."
    else
        echo "Failed to update vimrc." >&2
        return 1
    fi
}

install_oh_my_zsh() {
    echo "Installing Oh-My-Zsh..."
    if sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh | sed '/\s*exec\s\s*zsh\s*-l\s*/d')" --unattended --skip-chsh; then
        echo "Oh-My-Zsh installed successfully."
    else
        echo "Failed to install Oh-My-Zsh." >&2
        return 1
    fi
}

update_zshrc() {
    echo "Updating zshrc..."
    if curl -fsSL https://gist.githubusercontent.com/KazeTachinuu/fa1e2fa3e6c1a2979e54a7cda8cc2cd8/raw/798eebfef72873c7caf35a07aa793cfcbd9550d2/.zshrc -o "$HOME/.zshrc"; then
        echo "zshrc updated successfully."
    else
        echo "Failed to update zshrc." >&2
        return 1
    fi
}

install_zsh_plugins() {
    ZSH_CUSTOM=${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}
    echo "Installing zsh-autosuggestions..."
    if git clone https://github.com/zsh-users/zsh-autosuggestions "$ZSH_CUSTOM/plugins/zsh-autosuggestions"; then
        echo "zsh-autosuggestions installed successfully."
    else
        echo "Failed to install zsh-autosuggestions." >&2
        return 1
    fi

    echo "Installing zsh-syntax-highlighting..."
    if git clone https://github.com/zsh-users/zsh-syntax-highlighting.git "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting"; then
        echo "source $ZSH_CUSTOM/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" >> "${ZDOTDIR:-$HOME}/.zshrc"
        echo "zsh-syntax-highlighting installed successfully."
    else
        echo "Failed to install zsh-syntax-highlighting." >&2
        return 1
    fi
}

main() {
    check_root

    if [ -x "$(command -v apk)" ]; then
        install_packages apk
    elif [ -x "$(command -v apt-get)" ]; then
        install_packages apt-get
    elif [ -x "$(command -v dnf)" ]; then
        install_packages dnf
    elif [ -x "$(command -v zypper)" ]; then
        install_packages zypper
    elif [ -x "$(command -v pacman)" ]; then
        install_packages pacman
    else
        echo "FAILED TO INSTALL PACKAGES: Package manager not found. You must manually install: $packagesNeeded" >&2
        exit 1
    fi

    change_default_shell zsh || exit 1
    install_vundle || exit 1
    update_vimrc || exit 1
    install_oh_my_zsh || exit 1
    update_zshrc || exit 1
    install_zsh_plugins || exit 1

    echo "All tasks completed successfully."
}

main

{{< /highlight >}}
{{< /copy_code >}}

