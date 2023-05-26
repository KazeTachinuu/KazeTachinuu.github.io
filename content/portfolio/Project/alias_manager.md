+++
categories = ["linux","rust"]
coders = ["kazetachinuu"]
date = 2023-05-26T00:00:00Z
description = "A simple alias manager for linux shells written in Rust"
github = ["https://github.com/kazetachinuu/alias_manager"]
image = "Bash.png"
title = "Alias Manager Project"
type = "post"
[[tech]]
logo = "/Rust.png"
name = "Rust"
url = "https://www.rust-lang.org/"
+++

# Alias Manager Project

## Why this project

I wanted to learn Rust and I needed a simple project to start with. I also reset my computer and changes OS from time to time, so I wanted to have a simple way to manage my aliases. Thus I created this project.



## Features

- Add new aliases with custom commands
- List existing aliases
- Remove aliases by name

## Requirements

- Rust programming language (https://www.rust-lang.org/)
- Cargo package manager (usually bundled with Rust)

## Installation


1. Clone this repository to your local machine:


```shell
git clone https://github.com/kazetachinuu/alias_manager.git
cd alias_manager
```

2. Install the Alias Manager binary by running the install script:

```shell
sudo ./install.sh
```



## Usage

Alias Manager provides several subcommands for managing aliases. Here's a summary of the available subcommands:



```sh
aliasmanager [SUBCOMMAND] [OPTIONS] [ARGS]```
```


### Subcommands:

- `add`: Add a new alias with a custom command.


```sh
aliasmanager add -n <ALIAS_NAME> -c <COMMAND>
```


- `list`: List all existing aliases.


```sh
aliasmanager list
```

- `rm`: Remove an alias by name.

```sh
aliasmanager rm -n <ALIAS_NAME>
```
### Example

```sh
aliasmanager add -n am -c aliasmanager
```
### Options:

- `-n, --name <ALIAS_NAME>`: Specifies the name of the alias.
- `-c, --command <COMMAND>`: Specifies the command associated with the alias.
- `-h, --help`: Prints help information for the subcommand.



Note: The alias names are case-sensitive, so make sure to provide the correct case when using alias names.






