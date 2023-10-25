+++
categories = ["prog","projects"]
coders = ["kazetachinuu"]
date = 2023-10-01T00:00:00Z
description = "A simple BrainFuck Interpreter written in C"
github = ["https://github.com/kazetachinuu/brainfuck-interpreter"]
image = "/project/brainfuck/BrainFuck.png"
title = "BrainFuck Interpreter"
type = "post"
[[tech]]
logo = "/project/C.svg"
name = "C"
+++
<div style="max-width: 900px; margin: 0 auto;">

# Brainfuck Interpreter

This is a simple Brainfuck interpreter written in C.

## Table of Contents

- [Brainfuck Interpreter](#brainfuck-interpreter)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Usage](#usage)
  - [Building](#building)
  - [Adding the Executable to PATH](#adding-the-executable-to-path)


## Introduction

Brainfuck is an esoteric programming language created in 1993 by Urban Müller. It is known for its extreme minimalism, with the language using only eight simple commands, an instruction pointer, and an array of memory cells, each initialized to zero.

This project provides a basic Brainfuck interpreter that can execute Brainfuck programs.

## Usage

To run a Brainfuck program:

```bash
./bf <filename>
```
Replace `<filename>` with the path to the Brainfuck program file you want to execute.

You can also run a Brainfuck program directly from the command line using the `-c` option:

```bash
./bf -c "++++++++++[>+++++++>++++++++>+++<<<-]>+."
```

## Building

To build the Brainfuck interpreter, use the provided `Makefile`:

```bash
make
```
This will generate the executable named `bf`.

## Adding the Executable to PATH 

To use the Brainfuck interpreter globally and access it from anywhere, you can add the executable to your system's PATH.

You can move the executable in /bin:

```bash
sudo mv bf /bin/
```

</div>




