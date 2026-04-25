#!/usr/bin/env bash
# Extract three named disassembly regions from liblzma_la-crc64-fast.o
# (the malicious object shipped in smx-smx/xzre).
# Output: xz-artifacts/analysis/disasm/{name}.s — AT&T syntax, used by §4.
#
# Determinism: re-runnable; output is git-ignored.
#
# Function-name choices
# ---------------------
# The plan originally asked for `_get_cpuid`, `_resolve` (GOT walker), and
# `RSA_public_decrypt` (the hook). Only `_get_cpuid` exists as a named
# function in the .o — by design. The malicious backdoor in liblzma 5.6.1
# blobs the GOT walker, the RSA_public_decrypt hook stub, the x86
# disassembler, and the rest of the runtime payload into a single opaque
# function `.Lx86_code.part.0` (2719 bytes, ~745 disasm lines), invoked
# indirectly from the obfuscated entry. The "RE-friendly" names like
# `_resolve` and `RSA_public_decrypt` only appear *at runtime*, after the
# IFUNC has installed the hooks into the live process. So this script
# extracts the three best-available slices from the on-disk .o:
#
#   1. _get_cpuid           — the IFUNC resolver entry point.
#   2. _cpuid               — the CPUID-feature-check helper called by it.
#   3. .Lx86_code.part.0    — the opaque payload blob containing the
#                             GOT walker, hook installation, and
#                             RSA_public_decrypt stub (pre-extraction).
#
# Symbol scrambling note: many local symbols in this .o have a one-char
# suffix shift (e.g. `_get_cpuia` → `_get_cpuid`). That's part of the
# malware's build-system trickery and is not a disassembly bug.

set -euo pipefail

OBJ="xz-artifacts/analysis/xzre/liblzma_la-crc64-fast.o"
OUT_DIR="xz-artifacts/analysis/disasm"
EXPECTED_SHA="b418bfd34aa246b2e7b5cb5d263a640e5d080810f767370c4d2c24662a274963"

# 1. Verify input
if [ ! -f "$OBJ" ]; then
  echo "ERROR: $OBJ not found. Re-clone smx-smx/xzre into xz-artifacts/analysis/." >&2
  exit 1
fi
ACTUAL_SHA=$(shasum -a 256 "$OBJ" | awk '{print $1}')
if [ "$ACTUAL_SHA" != "$EXPECTED_SHA" ]; then
  echo "ERROR: $OBJ hash mismatch. Expected $EXPECTED_SHA, got $ACTUAL_SHA." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

# 2. Full disassembly to a temp file (AT&T syntax, with sym names)
TMP=$(mktemp)
trap "rm -f $TMP" EXIT
objdump -d -M att "$OBJ" > "$TMP"

# 3. Slice named regions.
extract_fn() {
  local fn="$1"
  local out="$2"
  # Match `<fn>:` allowing the leading address column from objdump.
  if ! grep -qE "<${fn}>:" "$TMP"; then
    echo "WARN: function <${fn}> not found in $OBJ — skipping ${out}" >&2
    return 0
  fi
  awk -v fn="$fn" '
    $0 ~ ("<"fn">:") { capture=1 }
    capture && /^$/   { capture=0 }
    capture           { print }
  ' "$TMP" > "$OUT_DIR/$out"
  echo "wrote $OUT_DIR/$out ($(wc -l < "$OUT_DIR/$out") lines)"
}

# Three regions for the §4 code blocks. See header comment for naming.
extract_fn "_get_cpuid"            "get_cpuid.s"
extract_fn "_cpuid"                "got_walker.s"               # CPUID helper; see header
extract_fn "\\.Lx86_code\\.part\\.0" "rsa_public_decrypt_hook.s"  # opaque payload blob; see header

# 4. Summary
echo ""
echo "Disassembly snippets ready in $OUT_DIR/:"
ls -la "$OUT_DIR/"
