+++
categories = ["linux","rust"]
coders = ["kazetachinuu"]
date = 2023-05-26T00:00:00Z
description = "A simple alias manager for linux shells written in Rust"
github = ["https://github.com/kazetachinuu/alias_manager"]
image = "/project/Bash.png"
title = "Alias Manager"
type = "post"
[[tech]]
logo = "/Home/Rust.png"
name = "Rust"
url = "https://www.rust-lang.org/"
+++
<div style="max-width: 900px; margin: 0 auto;">
Alias Manager is a simple alias manager for Linux shells written in Rust. It provides an easy way to manage aliases, which can be useful for users who frequently change operating systems or need to manage multiple aliases.

I wanted to learn Rust thus I created this project.

## Features

- Add new aliases with custom commands
- List existing aliases
- Remove aliases by name


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
aliasmanager [SUBCOMMAND] [OPTIONS] [ARGS]
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

</div>




