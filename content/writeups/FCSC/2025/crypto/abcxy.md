---
title: Problèmeuh
categories: Crypto
cat: "chal"
solved: true
date: 2025-04-19T00:00:00Z
draft: false
description: "A Diophantine puzzle involving linear equations, perfect squares, and a Pell equation."
---

{{< section type="info" title="Problem Statement" icon="info-circle" >}}
We are given this verification script:

```python
import sys
from hashlib import sha256
sys.set_int_max_str_digits(31337)

try:
    # Read five positive integers
    a, b, c, x, y = [int(input(f"{x} = ")) for x in "abcxy"]
    
    # Check constraints
    assert a > 0
    assert a == 487 * c
    assert 159 * a == 485 * b
    assert x ** 2 == a + b
    assert y * (3 * y - 1) == 2 * b
    
    # Generate flag
    h = sha256(str(a).encode()).hexdigest()
    print(f"FCSC{{{h}}}")
except:
    print("Nope!")
```

In other words, find five positive integers $a,b,c,x,y$ satisfying:

$$a = 487c$$
$$159a = 485b$$
$$x^2 = a + b$$
$$y(3y-1) = 2b$$

The flag will be `FCSC{sha256(str(a))}`.
{{< /section >}}

{{< section type="note" title="Step 1: Linear System Analysis" icon="search" >}}
From equations (1) and (2):

$$ a = 487c \quad \text{and} \quad 159a = 485b $$

Substituting the first equation into the second:

$$ 159(487c) = 485b \implies b = \frac{159 \cdot 487}{485}c $$

Since $b$ must be an integer and $\gcd(159,485) = 1$, we need:

$$ c = 485n, \quad n \in \mathbb{N} $$

This gives us:

$$c = 485n$$
$$a = 487 \cdot 485n$$
$$b = 159 \cdot 487n$$

{{< /section >}}

{{< section type="note" title="Step 2: Perfect Square Analysis" icon="calculator" >}}
Using $x^2 = a + b$:

$$x^2 = 487 \cdot 485n + 159 \cdot 487n$$
$$x^2 = 487(485 + 159)n$$
$$x^2 = 487 \cdot 644n$$
$$x^2 = 313\,628n$$

Factor $313\,628 = 4 \cdot 7 \cdot 23 \cdot 487$

For $x^2$ to be a perfect square, $n$ must absorb the non-square factors:

$$ n = 7 \cdot 23 \cdot 487 \cdot w^2 = 78\,407w^2, \quad w \in \mathbb{N} $$

Now we can derive $A_0$:

$$a = 487 \cdot 485 \cdot (78\,407w^2) = 18\,519\,341\,365w^2$$

Therefore $A_0 = 487 \cdot 485 \cdot 78\,407 = 18\,519\,341\,365$
{{< /section >}}

{{< section type="note" title="Step 3: Pell Equation" icon="cogs" >}}
From $y(3y-1) = 2b$:

1. Rewrite as quadratic in $y$:
   $$ 3y^2 - y - 2b = 0 $$

2. For integer solutions, discriminant must be perfect square:
   $$ \Delta = 1 + 24b = 1 + 24 \cdot 159 \cdot 487 \cdot 78\,407 \cdot w^2 $$

3. Let $D = 1 + 24 \cdot 159 \cdot 487 \cdot 78\,407 = 145\,710\,941\,544$

4. We need to solve the Pell equation:
   $$ t^2 - Dw^2 = 1 $$
   where $y = \frac{1 + t}{6}$ must be integer
{{< /section >}}

{{< section type="note" title="Implementation" icon="code" >}}
```python
#!/usr/bin/env python3
import sys
import math
from hashlib import sha256

# allow HUGE ints → str
sys.set_int_max_str_digits(10**6)

def fundamental_pell(D: int):
    """Find minimal (t,n) > (1,0) solving t^2 - D n^2 = 1"""
    a0 = a = math.isqrt(D)
    if a * a == D:
        raise ValueError("D is square!")
    m, d = 0, 1
    h1, h = 1, a    # convergents h[-2], h[-1]
    k1, k = 0, 1    # convergents k[-2], k[-1]
    while True:
        m = d * a - m
        d = (D - m*m) // d
        a = (a0 + m) // d
        h2, k2 = h1, k1
        h1, k1 = h, k
        h = a * h1 + h2
        k = a * k1 + k2
        if h*h - D*k*k == 1:
            return h, k

def main():
    # Constants from our reduction
    A0 = 487 * 485 * 78407        # = 18,519,341,365
    D = 145710941544             # From discriminant equation

    # 1) Find fundamental Pell solution
    t1, n1 = fundamental_pell(D)

    # 2) Generate solutions until (t + 1) ≡ 0 (mod 6)
    t, n = t1, n1
    while (t + 1) % 6 != 0:
        t, n = (t*t1 + n*n1*D,    # Next t_k
               t*n1 + n*t1)       # Next n_k

    # 3) Recover variables
    y = (1 + t) // 6
    a = A0 * n * n
    b = (159 * a) // 485
    c = a // 487
    x = math.isqrt(a + b)

    # 4) Generate flag
    flag = "FCSC{" + sha256(str(a).encode()).hexdigest() + "}"
    print(flag)

if __name__ == "__main__":
    main()
```

The code:
1. Uses continued fractions to find fundamental Pell solution
2. Generates solutions until $y = \frac{1 + t}{6}$ is integer
3. Recovers all variables from the solution
4. Computes flag from $a$
{{< /section >}}

{{< section type="success" title="Final Flag" icon="flag" >}}
{{< flag "FCSC{b313c611e23a09e5479b10793705fb40a7a32dbcbd8c4bc2b1a33e42c4579cae}" >}}
{{< /section >}}

{{< section type="info" title="Summary" icon="table" >}}
Key steps:
1. Linear analysis → parametrize by $n$
2. Perfect square → $n = 78\,407w^2$ and $A_0 = 487 \cdot 485 \cdot 78\,407$
3. Pell equation → $t^2 - Dw^2 = 1$
4. Solve via continued fractions
5. Compute $a = A_0n^2$ for flag
{{< /section >}} 