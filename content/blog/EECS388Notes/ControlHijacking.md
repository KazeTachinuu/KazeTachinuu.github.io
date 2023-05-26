---
title: "Control Hijacking"
date: 2022-11-01T00:09:30-04:00
description: "Hijack a built computer program"
---

# Basic Knowledge
## Registers 
### General Purpose Registers
- EAX: Used to store return values
- EBX
- ECX
- EDX
- ESI

### Special Purpose Registers
- EIP: Instruction Pointer
- ESP: Stack Pointer, indicate the top of the function 
- EBP: Frame / Base Pointer, indicate the bottom of the function

## CPU Instructions (Intel Syntax)

- Move a value to a register: `mov eax, 0x34`
- Add a value to a register: `add eax 10`
- Jump to a line of code: `jmp 0x123`
- Call a function (returns to the next line): `call 0x1234`

## Stack
```asm
push    0x0a
push    0x6c
push    0xff
pop     eax
pop     eax
push    0x88 overwrite the original value
```

Note that the `pop` does not eliminate the value of the stack. The value will remain but the stack pointer will move.

# Example: Buffer Overflow

```c
void foo(char * str) {
    char buffer[4];
    strcpy(buffer, str);
}

int main() {
    char *str = "1234567890A";
    foo(str)
}
```
The `strcpy` does not check the size of the allocated string. It just copies the thing and then it might overwrite the return address, causing the function to return to an unknown instruction.

## Shellcode caveats:
- Hard to guess the address
