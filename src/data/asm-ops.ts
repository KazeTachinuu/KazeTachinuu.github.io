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
  {
    slug: 'nop',
    mnemonic: 'nop',
    name: 'No operation',
    kind: 'basics',
    summary: 'Do nothing — just advance %rip.',
    body: [
      'Assembles to a single byte (`0x90`). Used for alignment padding, disabling a branch during debugging, or reserving a slot for live-patching.',
    ],
    syntax: ['nop'],
    example: `nop
nop                      # harmless filler`,
    moreHref: cloutier('nop'),
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
      'Unsigned multiply is `mul` — it always writes the full 128-bit product across `%rdx:%rax`.',
    ],
    syntax: [
      'imulq %src, %dst',
      'imulq $imm, %src, %dst',
    ],
    example: `movq  $6, %rax
imulq $7, %rax           # rax = 42
imulq $3, %rdi, %rsi     # rsi = rdi * 3  (result in a different register)`,
    moreHref: cloutier('imul'),
  },
  {
    slug: 'mul',
    mnemonic: 'mul',
    name: 'Unsigned multiply',
    kind: 'arith',
    summary: 'Unsigned integer multiply; 128-bit result in %rdx:%rax.',
    body: [
      '`mulq %src` multiplies `%rax` by src and writes the full 128-bit product across `%rdx:%rax`: the low 64 bits land in `%rax`, the high 64 bits in `%rdx`.',
      'Only the one-operand form exists. For ordinary same-register multiplication, prefer `imul` — it has 2- and 3-operand forms and doesn\'t clobber `%rdx`.',
    ],
    syntax: ['mulq %src'],
    example: `movq  $0x100000000, %rax
movq  $3, %rbx
mulq  %rbx               # rdx:rax = 0x3_00000000
                         # rdx = 0, rax = 0x300000000`,
    moreHref: cloutier('mul'),
  },
  {
    slug: 'idiv',
    mnemonic: 'idiv',
    name: 'Signed divide',
    kind: 'arith',
    summary: 'Signed integer divide; quotient in %rax, remainder in %rdx.',
    body: [
      'Divides the 128-bit value `%rdx:%rax` by the operand. After the instruction, `%rax` holds the quotient and `%rdx` the remainder.',
      'Before dividing, sign-extend `%rax` into `%rdx` with `cqto`. Without it, garbage in `%rdx` gives wrong answers or a `#DE` trap.',
    ],
    syntax: ['idivq %src'],
    example: `movq  $-17, %rax
cqto                     # sign-extend rax → rdx:rax  (rdx now all-1s)
movq  $5, %rcx
idivq %rcx               # rax = -3 (quotient), rdx = -2 (remainder)`,
    moreHref: cloutier('idiv'),
  },
  {
    slug: 'div',
    mnemonic: 'div',
    name: 'Unsigned divide',
    kind: 'arith',
    summary: 'Unsigned integer divide; quotient in %rax, remainder in %rdx.',
    body: [
      'Divides the 128-bit value `%rdx:%rax` by the operand. `%rax` gets the quotient, `%rdx` the remainder.',
      '**Before dividing, zero `%rdx`** with `xorq %rdx, %rdx` — leftover bits in `%rdx` make the dividend huge and give wildly wrong results (or a trap).',
      'For signed values, use `idiv` together with `cqto`.',
    ],
    syntax: ['divq %src'],
    example: `movq  $100, %rax
xorq  %rdx, %rdx         # REQUIRED: zero rdx
movq  $7, %rcx
divq  %rcx               # rax = 14 (100 / 7)
                         # rdx = 2  (100 % 7)`,
    moreHref: cloutier('div'),
  },
  {
    slug: 'cqto',
    mnemonic: 'cqto / cdq / cdqe',
    name: 'Sign-extend (for divide)',
    kind: 'arith',
    summary: 'Sign-extend a register into the wider pair — the companion to idiv.',
    body: [
      '`cqto` copies the sign bit of `%rax` across all of `%rdx`, producing a 128-bit signed dividend in `%rdx:%rax`. Always pair it with `idivq`.',
      '32-bit sibling: `cdq` sign-extends `%eax` into `%edx:%eax` (before `idivl`). `cdqe` sign-extends `%eax` into the full `%rax`.',
      'Intel spells `cqto` as `cqo` — same instruction, different assembler name.',
    ],
    syntax: ['cqto', 'cdq', 'cdqe'],
    example: `movq  $-42, %rax
cqto                     # rax is negative  →  rdx = 0xFFFFFFFFFFFFFFFF
movq  $5, %rcx
idivq %rcx               # rax = -8, rdx = -2`,
    moreHref: cloutier('cwd:cdq:cqo'),
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
    example: `# walk to the end of a C string: while (*s) s++;
walk:
    cmpb  $0, (%rdi)
    je    done
    incq  %rdi               # s++ (advance one byte)
    jmp   walk
done:`,
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
      'Flips the sign of the operand. Equivalent to `0 - %dst`, but a single instruction.',
      'Handy for turning a negative syscall error code (e.g. `-EBADF = -9`) into the positive errno.',
    ],
    syntax: ['negq %dst'],
    example: `# syscall returned -EBADF in rax; recover the positive errno
movq  $-9, %rax          # imagine: rax = -EBADF
negq  %rax               # rax = 9   (EBADF)`,
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
      'Classic trick: swap two registers with three XORs, no temporary — `a^=b; b^=a; a^=b`.',
    ],
    syntax: ['xorq $imm, %dst', 'xorq %src, %dst'],
    example: `# swap rax and rbx without a temporary (XOR swap)
movq  $3, %rax           # rax = 3
movq  $7, %rbx           # rbx = 7
xorq  %rbx, %rax         # rax = 3 ^ 7 = 4
xorq  %rax, %rbx         # rbx = 7 ^ 4 = 3  (old rax)
xorq  %rbx, %rax         # rax = 4 ^ 3 = 7  (old rbx)
                         # rax and rbx are now swapped`,
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
      'Common trick: build a mask that clears specific bits — `not` the mask first, then `and` it with the target.',
    ],
    syntax: ['notq %dst'],
    example: `# clear bit 4 of rax  (rax &= ~0x10)
movq  $0x10, %rbx
notq  %rbx               # rbx = 0xFFFFFFFFFFFFFFEF
andq  %rbx, %rax         # rax now has bit 4 cleared`,
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
  {
    slug: 'movz',
    mnemonic: 'movz / movzbq / movzwq / movzlq',
    name: 'Zero-extend move',
    kind: 'memory',
    summary: 'Load a narrower value into a wider register, filling high bits with 0.',
    body: [
      '`movzbq (%rdi), %rax` reads one byte from memory and zero-extends it to 64 bits — the canonical way to walk a C string one character at a time.',
      'Suffix pair spells the widths: `bq` = byte→quad, `wq` = word→quad, `bl`/`wl` = byte/word → long (32-bit). Intel calls it `movzx`.',
      'Writing a 32-bit register (`movl`) already zeroes the upper 32 bits of its 64-bit parent, so `movzlq` is rarely needed — plain `movl` does the job.',
    ],
    syntax: ['movzbq src, %dst', 'movzwq src, %dst', 'movzbl src, %dst'],
    example: `# strlen loop: len = 0; while (*s) { len++; s++; }
    xorq  %rax, %rax
loop:
    movzbq (%rdi), %rcx      # rcx = *s as an unsigned byte
    testq  %rcx, %rcx
    jz     done              # null terminator → stop
    incq   %rax              # len++
    incq   %rdi              # s++
    jmp    loop
done:                        # rax = strlen(s)`,
    moreHref: cloutier('movzx'),
  },
  {
    slug: 'movs',
    mnemonic: 'movs / movsbq / movswq / movslq',
    name: 'Sign-extend move',
    kind: 'memory',
    summary: 'Load a narrower value into a wider register, filling high bits with the sign bit.',
    body: [
      'Mirror of `movz`, but preserves the sign of the smaller value. Use it when reading signed fields — `int8_t`, `int16_t`, `int32_t` — into a 64-bit register.',
      'Intel calls it `movsx` / `movsxd`. Don\'t confuse it with the string-move `movsb` / `movsw` / `movsq` (no operands), which are different instructions that copy from `%rsi` to `%rdi`.',
    ],
    syntax: ['movsbq src, %dst', 'movswq src, %dst', 'movslq src, %dst'],
    example: `# read an int32_t from memory into a signed 64-bit register
movslq (%rdi), %rax       # rax = *(int32_t *)rdi, sign-extended
                          # so e.g. -1 stays -1, not 0x00000000FFFFFFFF`,
    moreHref: cloutier('movsx:movsxd'),
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
      'Note the AT&T operand order: write `cmpq %rbx, %rax` and read it as "compare rax to rbx". Then `jg label` jumps when `%rax > %rbx`.',
    ],
    syntax: ['cmpq $imm, %dst', 'cmpq %src, %dst'],
    example: `# return the larger of two signed values in rdi, rsi
    cmpq  %rsi, %rdi         # flags := rdi - rsi
    jg    rdi_wins           # rdi > rsi → take rdi
    movq  %rsi, %rax
    ret
rdi_wins:
    movq  %rdi, %rax
    ret`,
    moreHref: cloutier('cmp'),
  },
  {
    slug: 'test',
    mnemonic: 'test',
    name: 'Test bits',
    kind: 'control',
    summary: 'Bitwise AND, discarded — sets flags only.',
    body: [
      '`testq %rax, %rax` sets ZF if `%rax == 0`. The canonical zero-check before a branch — shorter and faster than `cmpq $0, %rax`.',
      'You can also test a single bit: `testq $0x10, %rax` sets ZF iff bit 4 is clear.',
    ],
    syntax: ['testq $imm, %src', 'testq %a, %b'],
    example: `# if (ptr == NULL) goto null_case;
testq %rdi, %rdi         # flags := rdi AND rdi  (no store)
jz    null_case          # taken when rdi == 0`,
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
      'Indirect `jmp *%rax` is how jump tables and computed gotos are implemented.',
    ],
    syntax: ['jmp label', 'jmp *%reg', 'jmp *(%addr)'],
    example: `# a simple do { ... } while (--n) loop
loop:
    # ... loop body ...
    decq  %rcx
    jnz   loop               # conditional back-edge
    jmp   done               # break out unconditionally
done:`,
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
    example: `# if (a == b) return 1; else return 0;
    cmpq  %rsi, %rdi
    je    equal
    xorq  %rax, %rax         # rax = 0
    ret
equal:
    movq  $1, %rax
    ret`,
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
    example: `# count n down to 0
    movq  $5, %rcx
loop:
    # ... body ...
    decq  %rcx
    jnz   loop               # keep going while rcx != 0`,
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
      'Use these when your values are signed integers (`int`, `long`). For addresses, counts or unsigned values use `ja` / `jb` / `jae` / `jbe` — "above" and "below" instead of "greater" and "less".',
    ],
    syntax: ['jg label', 'jl label', 'jge label', 'jle label'],
    example: `# classify the sign of rdi
    cmpq  $0, %rdi
    jl    negative           # rdi < 0
    jg    positive           # rdi > 0
    # fall-through: rdi == 0
zero:
    ret`,
    moreHref: cloutier('jcc'),
  },
  {
    slug: 'ja',
    mnemonic: 'ja / jb / jae / jbe',
    name: 'Unsigned conditional jumps',
    kind: 'control',
    summary: 'Branch on unsigned comparison.',
    body: [
      'After `cmpq %b, %a`: `ja` taken if `a > b`, `jb` if `a < b`, `jae` / `jbe` for the inclusive versions.',
      '"Above"/"below" is AT&T\'s naming convention to distinguish unsigned comparisons from signed (`jg` / `jl`). Use these for addresses, sizes, and unsigned integers.',
    ],
    syntax: ['ja label', 'jb label', 'jae label', 'jbe label'],
    example: `# bounds check: if (idx >= len) fault;
    cmpq  %rsi, %rdi         # flags := rdi - rsi  (both unsigned)
    jae   out_of_bounds      # rdi >= rsi → fault
    # ... safe to index here ...`,
    moreHref: cloutier('jcc'),
  },
  {
    slug: 'js',
    mnemonic: 'js / jns',
    name: 'Jump on sign',
    kind: 'control',
    summary: 'Branch when the last result was negative (SF=1).',
    body: [
      '`js` jumps when SF is 1 — the previous flag-setting instruction produced a negative result. `jns` is the inverse.',
      'The idiomatic syscall error check: a Linux syscall returns a negative value on failure, so `testq %rax, %rax; js error` catches every error case in two instructions.',
    ],
    syntax: ['js label', 'jns label'],
    example: `# syscall error check
    syscall                  # result in rax; negative = error
    testq %rax, %rax
    js    syscall_failed
    # ... success path ...
syscall_failed:
    # ... handle errno in -rax ...`,
    moreHref: cloutier('jcc'),
  },

  // ── Stack & calls ─────────────────────────────────
  {
    slug: 'push',
    mnemonic: 'push',
    name: 'Push onto stack',
    kind: 'stack',
    summary: 'Decrement %rsp by 8, then store operand at (%rsp).',
    body: [
      'The stack grows *downward*. `pushq %rax` subtracts 8 from `%rsp` and writes `%rax` at the new top.',
      'Two everyday uses: saving a callee-saved register at the top of a function, and realigning `%rsp` to 16 bytes before a `call` (an odd number of pushes does both).',
    ],
    syntax: ['pushq %src', 'pushq $imm'],
    example: `# function prologue: save rbx and align the stack for a call
my_fn:
    pushq %rbx               # rsp -= 8; *rsp = rbx  (also aligns rsp to 16)
    # ... body that may clobber rbx ...
    call  other_fn
    popq  %rbx
    ret`,
    moreHref: cloutier('push'),
  },
  {
    slug: 'pop',
    mnemonic: 'pop',
    name: 'Pop from stack',
    kind: 'stack',
    summary: 'Load (%rsp) into destination, then increment %rsp by 8.',
    body: [
      'The inverse of `push`. Reads 8 bytes from the top of the stack, then adjusts `%rsp` upward.',
      'Pushes and pops must balance on every path — a stray push without a matching pop leaks 8 bytes of stack and will usually break the next `ret`.',
    ],
    syntax: ['popq %dst'],
    example: `# swap rax and rbx via the stack
pushq %rax
pushq %rbx
popq  %rax               # rax = (old) rbx
popq  %rbx               # rbx = (old) rax`,
    moreHref: cloutier('pop'),
  },
  {
    slug: 'call',
    mnemonic: 'call',
    name: 'Call subroutine',
    kind: 'stack',
    summary: 'Push return address, then jump to the target.',
    body: [
      '`call func` pushes the address of the next instruction onto the stack, then jumps to `func`. The callee later returns via `ret`, which pops that address back into `%rip`.',
      'The System V ABI requires `%rsp` to be **16-byte-aligned *before*** the `call`. On entry to the callee, `%rsp % 16 == 8` — the return address took up one slot. Your prologue (a single `pushq %rbx`, or `subq $8, %rsp`) restores alignment before any further calls.',
      'For libc or other external functions, use `call func@PLT`.',
    ],
    syntax: ['call label', 'call func@PLT', 'call *%reg'],
    example: `# call factorial(5) and stash the result
    movq  $5, %rdi           # arg 1 (System V ABI: rdi, rsi, rdx, rcx, r8, r9)
    call  factorial          # rax = 120
    movq  %rax, %rbx         # keep it around`,
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
      'Every `call` must be balanced by exactly one `ret` on every path — otherwise a later `ret` pops the wrong address and the program jumps into the weeds.',
    ],
    syntax: ['ret'],
    example: `# int square(int x) { return x * x; }
square:
    imulq %rdi, %rdi
    movq  %rdi, %rax         # return value in rax
    ret`,
    moreHref: cloutier('ret'),
  },
  {
    slug: 'leave',
    mnemonic: 'leave',
    name: 'Leave stack frame',
    kind: 'stack',
    summary: 'Undo a frame-pointer prologue in one instruction.',
    body: [
      '`leave` is exactly `movq %rbp, %rsp; popq %rbp`. It tears down the stack frame that `pushq %rbp; movq %rsp, %rbp; subq $N, %rsp` built — no matter how much space `N` was.',
      'Pair it with `ret` at the end of a function that uses a frame pointer.',
    ],
    syntax: ['leave'],
    example: `# function with locals at -8(%rbp) and -16(%rbp)
my_fn:
    pushq %rbp
    movq  %rsp, %rbp
    subq  $16, %rsp          # 16 bytes of locals (keeps rsp 16-aligned)
    # ... body ...
    leave                    # rsp := rbp; pop rbp
    ret`,
    moreHref: cloutier('leave'),
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
