/* ────────────────────────────────────────────────────
   x86-64 (AT&T / GAS syntax) instruction reference.

   Source order:  source, destination
   Size suffix:   b = byte, w = word (16), l = long (32), q = quad (64)
   Registers:     %rax, %rdi, %rsi, %rdx, %rcx, %rsp, %rbp, ...
   Immediates:    $42, $0x10
   Memory:        offset(base, index, scale)   →   base + index*scale + offset
   ──────────────────────────────────────────────────── */

export type Kind =
  | 'basics'
  | 'arith'
  | 'logic'
  | 'memory'
  | 'control'
  | 'stack'
  | 'io';

export interface Op {
  slug: string;       // URL identifier and stable key
  mnemonic: string;   // shown on the chip
  name: string;       // human-readable name
  kind: Kind;
  summary: string;    // one-liner shown under the title
  body: string[];     // detail paragraphs (may contain `inline` backticks)
  syntax: string[];   // AT&T operand forms
  example: string;    // full snippet, rendered with Shiki `asm`
  moreHref?: string;  // external deep-dive link
  moreLabel?: string; // label for the link
}

const cloutier = (mnemonic: string) =>
  `https://www.felixcloutier.com/x86/${mnemonic}`;

export const KINDS: { key: Kind; label: string }[] = [
  { key: 'basics',  label: 'Basics' },
  { key: 'arith',   label: 'Arithmetic' },
  { key: 'logic',   label: 'Logic' },
  { key: 'memory',  label: 'Memory' },
  { key: 'control', label: 'Control flow' },
  { key: 'stack',   label: 'Stack & calls' },
  { key: 'io',      label: 'I/O' },
];

export const OPS: Op[] = [
  // ── Basics ────────────────────────────────────────
  {
    slug: 'mov',
    mnemonic: 'mov',
    name: 'Move',
    kind: 'basics',
    summary: 'Copy data from source to destination.',
    body: [
      'The workhorse of assembly. `mov` copies a value — it does not move it; the source is left unchanged.',
      'In AT&T syntax the source comes first: `movq $25, %rax` puts the constant `25` into `%rax`.',
      'The size suffix (`b`, `w`, `l`, `q`) must match the operand width. Memory-to-memory is not allowed — one side has to be a register or an immediate.',
    ],
    syntax: [
      'movq $imm, %reg',
      'movq %src, %dst',
      'movq (%base), %dst       # load',
      'movq %src, (%base)       # store',
    ],
    example: `movq  $25, %rax          # rax = 25
movq  %rax, %rdi         # rdi = rax
movq  (%rsi), %rcx       # rcx = *rsi
movq  %rcx, 8(%rdi)      # *(rdi+8) = rcx`,
    moreHref: cloutier('mov'),
    moreLabel: 'on felixcloutier.com',
  },

  // ── Arithmetic ────────────────────────────────────
  {
    slug: 'add',
    mnemonic: 'add',
    name: 'Add',
    kind: 'arith',
    summary: 'Add source into destination.',
    body: [
      '`addq %rbx, %rax` computes `rax = rax + rbx`. The destination is also one of the inputs.',
      'Updates the status flags (ZF, SF, CF, OF), which conditional jumps can then read.',
    ],
    syntax: ['addq $imm, %dst', 'addq %src, %dst'],
    example: `movq  $10, %rax
addq  $5, %rax           # rax = 15
addq  %rbx, %rax         # rax = rax + rbx`,
    moreHref: cloutier('add'),
  },
  {
    slug: 'sub',
    mnemonic: 'sub',
    name: 'Subtract',
    kind: 'arith',
    summary: 'Subtract source from destination.',
    body: [
      '`subq %rbx, %rax` computes `rax = rax - rbx`. Order matters in AT&T — source is subtracted from destination.',
      'Also the common way to reserve stack space: `subq $32, %rsp` grows the stack by 32 bytes.',
    ],
    syntax: ['subq $imm, %dst', 'subq %src, %dst'],
    example: `movq  $20, %rax
subq  $3, %rax           # rax = 17
subq  $32, %rsp          # allocate 32 bytes on the stack`,
    moreHref: cloutier('sub'),
  },
  {
    slug: 'imul',
    mnemonic: 'imul',
    name: 'Signed multiply',
    kind: 'arith',
    summary: 'Signed integer multiply.',
    body: [
      'Two-operand form: `imulq %src, %dst` does `dst *= src`. Three-operand form takes an immediate: `imulq $3, %rax, %rbx` puts `rax*3` into `rbx`.',
      'For small multiplications by a constant (×2, ×3, ×4, ×5, ×8, ×9), `lea` is often faster and doesn\'t touch flags.',
      'Unsigned multiply is `mul` — it always writes the full product across `%rdx:%rax`.',
    ],
    syntax: [
      'imulq %src, %dst',
      'imulq $imm, %src, %dst',
    ],
    example: `movq  $6, %rax
imulq $7, %rax           # rax = 42
imulq $3, %rdi, %rsi     # rsi = rdi * 3`,
    moreHref: cloutier('imul'),
  },
  {
    slug: 'idiv',
    mnemonic: 'idiv',
    name: 'Signed divide',
    kind: 'arith',
    summary: 'Signed integer divide; quotient in %rax, remainder in %rdx.',
    body: [
      'Divides the 128-bit value `%rdx:%rax` by the operand. After the instruction, `%rax` holds the quotient and `%rdx` the remainder.',
      'Before dividing, sign-extend `%rax` into `%rdx` with `cqto` (AT&T) / `cqo` (Intel). Without it, garbage in `%rdx` gives wrong answers or a trap.',
    ],
    syntax: ['idivq %src'],
    example: `movq  $-17, %rax
cqto                     # sign-extend rax → rdx:rax
movq  $5, %rcx
idivq %rcx               # rax = -3 (quotient), rdx = -2 (remainder)`,
    moreHref: cloutier('idiv'),
  },
  {
    slug: 'inc',
    mnemonic: 'inc',
    name: 'Increment',
    kind: 'arith',
    summary: 'Add 1 to operand.',
    body: [
      'Equivalent to `add $1, op`, but shorter. Updates ZF, SF, OF — but **not** CF. Use `add` inside loops that rely on carry.',
    ],
    syntax: ['incq %dst', 'incq (%addr)'],
    example: `movq  $0, %rcx
incq  %rcx               # rcx = 1
incq  %rcx               # rcx = 2`,
    moreHref: cloutier('inc'),
  },
  {
    slug: 'dec',
    mnemonic: 'dec',
    name: 'Decrement',
    kind: 'arith',
    summary: 'Subtract 1 from operand.',
    body: [
      'Like `inc`, but subtracts. Updates ZF, SF, OF — not CF. Common loop pattern: `decq %rcx; jnz loop`.',
    ],
    syntax: ['decq %dst', 'decq (%addr)'],
    example: `movq  $5, %rcx
loop:
    decq  %rcx
    jnz   loop           # repeat until rcx == 0`,
    moreHref: cloutier('dec'),
  },
  {
    slug: 'neg',
    mnemonic: 'neg',
    name: 'Negate',
    kind: 'arith',
    summary: 'Two\'s-complement negation (dst = -dst).',
    body: [
      'Flips the sign of the operand. Equivalent to `sub %dst, $0` but a single instruction.',
    ],
    syntax: ['negq %dst'],
    example: `movq  $42, %rax
negq  %rax               # rax = -42`,
    moreHref: cloutier('neg'),
  },

  // ── Logic ─────────────────────────────────────────
  {
    slug: 'and',
    mnemonic: 'and',
    name: 'Bitwise AND',
    kind: 'logic',
    summary: 'Bitwise AND of source and destination.',
    body: [
      'Clears bits in `dst` that are zero in `src`. Common for masking: `andq $0xff, %rax` keeps only the low byte.',
      'Clears CF and OF, updates ZF and SF.',
    ],
    syntax: ['andq $imm, %dst', 'andq %src, %dst'],
    example: `movq  $0x1234, %rax
andq  $0xff, %rax        # rax = 0x34  (keep low byte)`,
    moreHref: cloutier('and'),
  },
  {
    slug: 'or',
    mnemonic: 'or',
    name: 'Bitwise OR',
    kind: 'logic',
    summary: 'Bitwise OR of source and destination.',
    body: [
      'Sets bits in `dst` that are one in `src`. Common for setting flags: `orq $0x40, %rax` turns on bit 6.',
    ],
    syntax: ['orq $imm, %dst', 'orq %src, %dst'],
    example: `movq  $0x01, %rax
orq   $0x40, %rax        # rax = 0x41  (turn on bit 6)`,
    moreHref: cloutier('or'),
  },
  {
    slug: 'xor',
    mnemonic: 'xor',
    name: 'Bitwise XOR',
    kind: 'logic',
    summary: 'Bitwise exclusive OR.',
    body: [
      'Sets bits that differ between the two operands.',
      'The idiomatic way to zero a register is `xorq %rax, %rax` — shorter and faster than `movq $0, %rax`, and the CPU recognises it as a dependency-breaker.',
    ],
    syntax: ['xorq $imm, %dst', 'xorq %src, %dst'],
    example: `xorq  %rax, %rax         # rax = 0  (zero-idiom)
movq  $0b1100, %rbx
xorq  $0b1010, %rbx      # rbx = 0b0110`,
    moreHref: cloutier('xor'),
  },
  {
    slug: 'not',
    mnemonic: 'not',
    name: 'Bitwise NOT',
    kind: 'logic',
    summary: 'One\'s-complement: flip every bit.',
    body: [
      'Inverts all bits of the operand. Does not touch flags.',
    ],
    syntax: ['notq %dst'],
    example: `movq  $0, %rax
notq  %rax               # rax = 0xffffffffffffffff`,
    moreHref: cloutier('not'),
  },
  {
    slug: 'shl',
    mnemonic: 'shl',
    name: 'Shift left',
    kind: 'logic',
    summary: 'Logical shift left by N bits.',
    body: [
      '`shlq $3, %rax` shifts `rax` left by 3 — same as multiplying by 8. Fills vacated bits with zero.',
      '`sal` is the arithmetic alias; for left shifts they behave identically.',
    ],
    syntax: ['shlq $imm, %dst', 'shlq %cl, %dst'],
    example: `movq  $1, %rax
shlq  $3, %rax           # rax = 8   (1 << 3)`,
    moreHref: cloutier('sal:sar:shl:shr'),
  },
  {
    slug: 'shr',
    mnemonic: 'shr',
    name: 'Logical shift right',
    kind: 'logic',
    summary: 'Shift right, filling with zeros.',
    body: [
      'Divides unsigned values by powers of two. Fills vacated high bits with zero.',
      'For signed values, use `sar` — it preserves the sign bit.',
    ],
    syntax: ['shrq $imm, %dst', 'shrq %cl, %dst'],
    example: `movq  $32, %rax
shrq  $2, %rax           # rax = 8   (32 >> 2)`,
    moreHref: cloutier('sal:sar:shl:shr'),
  },
  {
    slug: 'sar',
    mnemonic: 'sar',
    name: 'Arithmetic shift right',
    kind: 'logic',
    summary: 'Shift right preserving the sign bit.',
    body: [
      'Like `shr`, but the vacated high bits are filled with the original sign bit. Equivalent to integer division by 2ⁿ for signed values.',
    ],
    syntax: ['sarq $imm, %dst', 'sarq %cl, %dst'],
    example: `movq  $-8, %rax
sarq  $1, %rax           # rax = -4   (−8 / 2)`,
    moreHref: cloutier('sal:sar:shl:shr'),
  },

  // ── Memory ────────────────────────────────────────
  {
    slug: 'lea',
    mnemonic: 'lea',
    name: 'Load effective address',
    kind: 'memory',
    summary: 'Compute an address expression without accessing memory.',
    body: [
      'Despite the name, `lea` never touches memory — it computes the address the operand *would* resolve to and writes it to a register.',
      'Programmers abuse it for fast arithmetic. The memory form `offset(base, index, scale)` evaluates to `base + index*scale + offset` in a single instruction — and without touching flags.',
      '`leaq (%rdi, %rdi, 4), %rax` gives `rax = rdi * 5`.',
    ],
    syntax: ['leaq offset(base, index, scale), %dst'],
    example: `leaq  (%rdi, %rdi, 2), %rax   # rax = rdi * 3
leaq  (%rdi, %rdi, 4), %rax   # rax = rdi * 5
leaq  1(%rdi), %rax           # rax = rdi + 1
leaq  (%rdi, %rsi), %rax      # rax = rdi + rsi`,
    moreHref: cloutier('lea'),
  },

  // ── Control flow ──────────────────────────────────
  {
    slug: 'cmp',
    mnemonic: 'cmp',
    name: 'Compare',
    kind: 'control',
    summary: 'Subtract without storing — just set flags.',
    body: [
      '`cmpq %rbx, %rax` evaluates `rax - rbx` and updates flags, but discards the result. Pair it with a conditional jump.',
      'Note the AT&T operand order: `cmpq %rbx, %rax` then `jg label` jumps when `%rax > %rbx`. Read it as "compare rax to rbx".',
    ],
    syntax: ['cmpq $imm, %dst', 'cmpq %src, %dst'],
    example: `cmpq  $10, %rax
jg    bigger             # jump if rax > 10
jmp   smaller`,
    moreHref: cloutier('cmp'),
  },
  {
    slug: 'test',
    mnemonic: 'test',
    name: 'Test bits',
    kind: 'control',
    summary: 'Bitwise AND, discarded — sets flags only.',
    body: [
      '`testq %rax, %rax` sets ZF if `%rax == 0`. The classic zero-check before a branch.',
      'You can also test individual bits: `testq $0x10, %rax` sets ZF iff bit 4 is clear.',
    ],
    syntax: ['testq $imm, %src', 'testq %a, %b'],
    example: `testq %rax, %rax
jz    is_zero            # taken if rax == 0
testq $0x10, %rbx
jnz   bit4_set`,
    moreHref: cloutier('test'),
  },
  {
    slug: 'jmp',
    mnemonic: 'jmp',
    name: 'Unconditional jump',
    kind: 'control',
    summary: 'Go to a label — always.',
    body: [
      'Transfers control unconditionally. The operand can be a label, a register (indirect), or a memory location.',
    ],
    syntax: ['jmp label', 'jmp *%reg', 'jmp *(%addr)'],
    example: `jmp   end                # skip over
    # ... unreachable ...
end:`,
    moreHref: cloutier('jmp'),
  },
  {
    slug: 'je',
    mnemonic: 'je / jz',
    name: 'Jump if equal',
    kind: 'control',
    summary: 'Branch when the previous compare was equal (ZF=1).',
    body: [
      '`je` and `jz` are aliases — both jump when ZF is set. Natural after `cmp` (equal) or `test` (zero).',
    ],
    syntax: ['je label', 'jz label'],
    example: `cmpq  %rbx, %rax
je    same               # taken if rax == rbx`,
    moreHref: cloutier('jcc'),
  },
  {
    slug: 'jne',
    mnemonic: 'jne / jnz',
    name: 'Jump if not equal',
    kind: 'control',
    summary: 'Branch when ZF=0.',
    body: [
      '`jne` and `jnz` are aliases. Jumps when the last compare was not equal, or the last test was non-zero.',
    ],
    syntax: ['jne label', 'jnz label'],
    example: `testq %rax, %rax
jnz   not_zero           # taken if rax != 0`,
    moreHref: cloutier('jcc'),
  },
  {
    slug: 'jg',
    mnemonic: 'jg / jl / jge / jle',
    name: 'Signed conditional jumps',
    kind: 'control',
    summary: 'Branch on signed comparison.',
    body: [
      'After `cmpq %b, %a`: `jg` taken if `a > b`, `jl` if `a < b`, `jge` / `jle` for the inclusive versions.',
      'For unsigned comparisons use `ja` / `jb` / `jae` / `jbe` — "above" and "below" instead of "greater" and "less".',
    ],
    syntax: ['jg label', 'jl label', 'jge label', 'jle label'],
    example: `cmpq  $0, %rax
jl    negative           # rax < 0
jg    positive           # rax > 0
# fallthrough: rax == 0`,
    moreHref: cloutier('jcc'),
  },

  // ── Stack & calls ─────────────────────────────────
  {
    slug: 'push',
    mnemonic: 'push',
    name: 'Push onto stack',
    kind: 'stack',
    summary: 'Decrement %rsp, then store operand at (%rsp).',
    body: [
      'The stack grows *downward*. `pushq %rax` subtracts 8 from `%rsp` and writes `%rax` there.',
      'Commonly used to save callee-saved registers at the top of a function.',
    ],
    syntax: ['pushq %src', 'pushq $imm'],
    example: `pushq %rbx               # rsp -= 8; *rsp = rbx
pushq $42`,
    moreHref: cloutier('push'),
  },
  {
    slug: 'pop',
    mnemonic: 'pop',
    name: 'Pop from stack',
    kind: 'stack',
    summary: 'Load (%rsp) into destination, then increment %rsp.',
    body: [
      'The inverse of `push`. Reads 8 bytes from the top of the stack, then adjusts `%rsp` upward.',
    ],
    syntax: ['popq %dst'],
    example: `pushq %rbx
# ... work ...
popq  %rbx               # restore`,
    moreHref: cloutier('pop'),
  },
  {
    slug: 'call',
    mnemonic: 'call',
    name: 'Call subroutine',
    kind: 'stack',
    summary: 'Push return address, then jump to the target.',
    body: [
      '`call func` pushes the address of the next instruction onto the stack, then jumps to `func`.',
      'On entry, `%rsp` is misaligned by 8 — the System V ABI requires 16-byte alignment *before* a `call`, so your prologue usually adjusts with `subq $8, %rsp` or a `push`.',
    ],
    syntax: ['call label', 'call *%reg'],
    example: `movq  $5, %rdi           # arg 1 (System V ABI)
call  factorial
# return value now in %rax`,
    moreHref: cloutier('call'),
  },
  {
    slug: 'ret',
    mnemonic: 'ret',
    name: 'Return from subroutine',
    kind: 'stack',
    summary: 'Pop return address into %rip and jump there.',
    body: [
      'Undoes `call`. The return value (if any) is conventionally in `%rax`.',
      'Every `call` must be balanced by exactly one `ret` on every path — otherwise the next `ret` pops the wrong address.',
    ],
    syntax: ['ret'],
    example: `add_one:
    addq  $1, %rdi
    movq  %rdi, %rax     # return value
    ret`,
    moreHref: cloutier('ret'),
  },

  // ── I/O ───────────────────────────────────────────
  {
    slug: 'syscall',
    mnemonic: 'syscall',
    name: 'System call',
    kind: 'io',
    summary: 'Invoke the Linux kernel.',
    body: [
      'On Linux x86-64, put the syscall number in `%rax`, arguments in `%rdi`, `%rsi`, `%rdx`, `%r10`, `%r8`, `%r9`, then `syscall`. The return value comes back in `%rax`.',
      'Common numbers: `0` = read, `1` = write, `2` = open, `3` = close, `60` = exit. Full table: `/usr/include/asm/unistd_64.h`.',
      'The kernel clobbers `%rcx` and `%r11` — treat them as trashed across the call.',
    ],
    syntax: ['syscall'],
    example: `# write(1, "hi\\n", 3)
movq  $1, %rax           # syscall: write
movq  $1, %rdi           # fd: stdout
leaq  msg(%rip), %rsi    # buf
movq  $3, %rdx           # count
syscall

# exit(0)
movq  $60, %rax
xorq  %rdi, %rdi
syscall`,
    moreHref: 'https://filippo.io/linux-syscall-table/',
    moreLabel: 'on Linux syscall table',
  },
];
