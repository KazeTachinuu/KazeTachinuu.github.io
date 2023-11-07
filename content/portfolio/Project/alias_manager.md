+++
categories = ["linux","prog","projects"]
coders = ["kazetachinuu"]
date = 2023-05-26T00:00:00Z
description = "A simple alias manager for linux shells written in C"
github = ["https://github.com/kazetachinuu/alias_manager"]
image = "/project/Bash.png"
title = "Alias Manager"
type = "post"
[[tech]]
logo = "/Home/C_Logo.png"
name = "C"
url = "https://en.wikipedia.org/wiki/C_(programming_language)"
[[tech]]
logo = "/project/Bash.png"
name = "Shell"
url = "https://en.wikipedia.org/wiki/Bash_(Unix_shell)"
+++
<div style="max-width: 900px; margin: 0 auto;">

Alias Manager is a simple alias manager for Linux shells written in C. It provides an easy way to manage aliases, which can be useful for users who frequently change operating systems or need to manage multiple aliases.


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
./install.sh
```



## Usage

Alias Manager provides several subcommands for managing aliases. Here's a summary of the available subcommands:



```sh
aliasmanager [SUBCOMMAND] [ARGS]
```


### Subcommands:

- `add`: Add a new alias with a custom command.


```sh
aliasmanager add <ALIAS_NAME> <COMMAND>
```


- `ls`: List all existing aliases.


```sh
aliasmanager ls
```

- `rm`: Remove an alias by name.

```sh
aliasmanager rm  <ALIAS_NAME> [-f|--force]
```
### Example

```sh
aliasmanager add  am  aliasmanager
aliasmanager add bonjour "echo 'Hello World!'"
```
### Options:

- `-V, --version`: Prints version information
- `-h, --help`: Prints help information for the subcommand.



Note: The alias names are case-sensitive, so make sure to provide the correct case when using alias names.

</div>
