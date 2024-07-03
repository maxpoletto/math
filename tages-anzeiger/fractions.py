#!/opt/local/bin/python3
"""This code computes the set of all irreducible fractions < 1 and
with both  numerator and denominator in [2, 49], and then finds
all 3-combinations with replacement (a, b, c) from that set for
which both a + b + c and 1/a + 1/b + 1/c are integers.
"""

import math
from itertools import combinations_with_replacement

f = set()
for a in range(2, 50):
    for b in range(a+1, 50):
        if math.gcd(a, b) != 1:
            continue
        f.add((a,b))

for f3 in combinations_with_replacement(f, 3):
    (a, b) = f3[0]
    (c, d) = f3[1]
    (e, f) = f3[2]
    mn = (a * d * f) + (c * b * f) + (e * b * d)
    md = b * d * f
    if mn % md != 0:
        continue
    nn = (b * c * e) + (d * a * e) + (f * a *c)
    nd = a * c * e
    if nn % nd != 0:
        continue
    print(f"{a}/{b} + {c}/{d} + {e}/{f}")
