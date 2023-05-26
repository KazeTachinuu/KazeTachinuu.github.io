---
title: "Message Integrity"
date: 2022-10-22T14:15:02-04:00
description: "Methods to protect message integrity online"
author: "Baichuan Li"
---

## Threat Model
- Alice computes `v=f(m)`, where `v` is a verifier of the message `m`.
- Alice sends the message to Bob via Mallory.
- Bob verifies that `v'=f(m')`.

## Random Function (RF)

Set up a random map `f: {Fixed size input}->{Fixed size output}`. This function is only known by Alice and Bob, but unknown to Mallory.

**Provably secure**:  Mallory cannot find out the verifier of a message that he has never seen (he cannot do it better than guessing).

**Completely impractical**: Suppose that the input and output are both 32 bits (which is too small for production use), there will be `2^32` entries in the function map table and therefore, it will eat up `2^37` bits of memory every time you load it.

## Pseudo-Random Function (PRF)

We want to construct a series of functions that takes `k`, a key only known to Alice and Bob, and `m`, the message itself. This function should "look like" a random function so that Mallory can hardly find any patterns.

### One way to construct PRFs: Cryptographic Hash Function

A cryptographic hash function `H(x)` is a hash function that:

- **Preimage Resistance**: Given output `h`, hard to any `x` s.t. `h=H(x)`.
- **Second Preimage Resistance**: Given output `m1`, hard to find any different `m2`, such that `H(m1) = H(m2)`.
- **Collision Resistance**: Hard to find any pair of inputs `m1` and `m2` such that `H(m1) = H(m2)`.

Examples of cryptographic hash functions: ~~MD5~~, ~~SHA-1~~, SHA256, SHA-512, SHA-3.

Suppose that Alice and Bob use the verifier `v=SHA-256(k||m)`, it is vulnerable to length extension attack.

#### HMAC

An HMAC function is defined to be `HMAC(k, m) = H(k xor c1 || H(k xor c2 || m))`, where `c1` and `c2` are two fixed constants. Note that HMAC is no longer vulnerable to length extension attacks.

