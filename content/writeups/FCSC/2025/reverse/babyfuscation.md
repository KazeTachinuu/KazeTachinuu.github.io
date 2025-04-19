---
title: "babyfuscation"
categories: "Reverse"
cat: "chal"
solved: true
date: 2025-04-19T00:00:00Z
draft: false
description: "Reverse engineering challenge involving a binary with obfuscated function names and custom string comparison."
---

{{< section type="info" title="Initial Recon" icon="info-circle" >}}
We ran the binary and saw it prompts for a flag:

```
Enter the flag:
```

If the flag is wrong, it prints:

```
Wrong flag. Try again!
```
{{< /section >}}

{{< section type="note" title="Static Analysis with radare2" icon="search" >}}

### **a. Load and Analyze the Binary**

```sh
r2 ./babyfuscation
[0x00001080]> aaa
```
- `aaa` runs full analysis, finding functions, strings, and code references.

### **b. List Functions**

```sh
[0x00001080]> afl
```
**Output:**
```
0x00001204    5     83 sym.faubPTXHmhV4vfgEpzjqfMRjJ3qunsq9
0x00001344    4     81 sym.VakkEeHbtHMpNqXPMkadR4v7K
0x00001395   10    209 main
...
```
- We note the function at `0x1204` (obfuscated name) and `main` at `0x1395`.
{{< /section >}}

{{< section type="note" title="Finding the Flag Check" icon="lightbulb" >}}

### **a. Disassemble the Suspect Function**

```sh
[0x00001080]> pdf @ 0x1204
```
**Output:**
- Shows a loop comparing two buffers byte by byte, returning 0 if equal.
- This is a custom `strcmp`.

### **b. Find the Call Site**

```sh
[0x00001080]> pdf @ 0x1344
```
**Output:**
```
0x134c: lea rax, obj.jMunhwoW4bRqeCdJfXvfNrRm ; 0x4020
0x1353: mov rsi, rax
0x1356: lea rax, obj.U94y77bvL3HfcnwcAc3UA9MJTvcwjP4j ; 0x4220
0x135d: mov rdi, rax
0x1360: call sym.faubPTXHmhV4vfgEpzjqfMRjJ3qunsq9
```
- The function at `0x1344` compares the contents of `0x4220` and `0x4020`.
{{< /section >}}

{{< section type="note" title="Finding How User Input is Handled" icon="cogs" >}}

### **a. Find Input Reading Function**

```sh
[0x00001344]> axt sym.imp.fgets
```
**Output:**
```
sym.VsvYbpipYYgRoCeFtoxhtAmdFuNu3WvV 0x1318 [CALL:--x] call sym.imp.fgets
```
- Only one call to `fgets`, in function at `0x12e8`.

### **b. Disassemble Input Function**

```sh
[0x00001344]> pdf @ 0x12e8
```
**Output:**
- Reads input into buffer at `0x41c0` using `fgets`.
- Calls another function to remove the newline.
{{< /section >}}

{{< section type="note" title="Finding Input Transformation" icon="code" >}}

### **a. Find What Happens After Input**

From `main`'s disassembly:
- After reading input, the program calls `sym.wKtyPoT4WdyrkVzhvYUfvqo3M9iPVMd3` at `0x1257`.

### **b. Disassemble the Transformation Function**

```sh
[0x00001344]> pdf @ 0x1257
```
**Output:**
- For each byte of input, a series of bitwise and arithmetic operations are performed.
- The result is stored at `0x4220`.
{{< /section >}}

{{< section type="note" title="Finding the Target Buffer" icon="database" >}}

### **a. Dump the Target Buffer**

```sh
[0x00001344]> px 80 @ 0x4020
```
**Output:**
```
2d 38 bf 32 f0 05 a8 b5 04 9b 8c 53 ca e7 f0 67
f6 59 c4 f1 50 e7 7a a5 74 ab dc d9 50 f7 5a bd
b6 2b 9e 31 90 37 08 1d 3e a9 2c 69 0a 67 38 9f
0e 2b 24 93 72 1f 40 6d d4 7b ee 51 1a 4f ca 6d
ec f1 24 cb 72 05 f1
```
- This is the buffer your transformed input must match.
{{< /section >}}

{{< section type="note" title="Reversing the Transformation" icon="key" >}}


```python
target = [
    0x2d, 0x38, 0xbf, 0x32, 0xf0, 0x05, 0xa8, 0xb5, 0x04, 0x9b, 0x8c, 0x53, 0xca, 0xe7, 0xf0, 0x67,
    0xf6, 0x59, 0xc4, 0xf1, 0x50, 0xe7, 0x7a, 0xa5, 0x74, 0xab, 0xdc, 0xd9, 0x50, 0xf7, 0x5a, 0xbd,
    0xb6, 0x2b, 0x9e, 0x31, 0x90, 0x37, 0x08, 0x1d, 0x3e, 0xa9, 0x2c, 0x69, 0x0a, 0x67, 0x38, 0x9f,
    0x0e, 0x2b, 0x24, 0x93, 0x72, 0x1f, 0x40, 0x6d, 0xd4, 0x7b, 0xee, 0x51, 0x1a, 0x4f, 0xca, 0x6d,
    0xec, 0xf1, 0x24, 0xcb, 0x72, 0x05, 0xf1
]

def inv_transform_byte(i, out_byte):
    for b in range(0x20, 0x7f):  # printable ASCII
        edx = b * 8
        eax = b >> 5
        edx |= eax
        ecx = i
        eax2 = ecx
        eax2 += eax2
        eax2 += ecx
        eax2 += 0x1f
        eax2 ^= edx
        if (eax2 & 0xff) == out_byte:
            return b
    return ord('?')

flag = bytes([inv_transform_byte(i, b) for i, b in enumerate(target)])
print(flag.decode())
```

### **b. Run the Script**

**Output:**
```
FCSC{e30f46b147e7a25a7c8b865d0d895c7c7315f69582f432e9405b6d093b6fb8d3}
```
{{< /section >}}

{{< section type="success" title="Final Flag" icon="flag" >}}
{{< flag "FCSC{e30f46b147e7a25a7c8b865d0d895c7c7315f69582f432e9405b6d093b6fb8d3}" >}}
{{< /section >}}

{{< section type="info" title="Summary Table" icon="table" >}}
| Command                        | Purpose                                 | Key Output/Info Gained                                 |
|--------------------------------|-----------------------------------------|--------------------------------------------------------|
| `r2 ./babyfuscation` + `aaa`   | Analyze binary                          | Found function addresses and symbols                   |
| `afl`                          | List functions                          | Located main, check, and input functions               |
| `pdf @ 0x1204`                 | Disassemble check function              | Custom strcmp, compares 0x4220 and 0x4020              |
| `pdf @ 0x1344`                 | Disassemble caller                      | Shows which buffers are compared                       |
| `axt sym.imp.fgets`            | Find input reading                      | Only one call, in function at 0x12e8                   |
| `pdf @ 0x12e8`                 | Disassemble input function              | Input read into 0x41c0                                 |
| `pdf @ 0x1257`                 | Disassemble transformation function     | Revealed per-byte transformation logic                 |
| `px 80 @ 0x4020`               | Dump target buffer                      | Got the bytes our transformed input must match         |
| Python script                  | Invert transformation                   | Recovered the printable flag                           |
{{< /section >}}

