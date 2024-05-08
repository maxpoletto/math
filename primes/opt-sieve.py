#!/opt/local/bin/python

from typing import List

def is_prime(n: int) -> bool:
    """Primality test using 6k+-1 optimization."""
    if n <= 3:
        return n > 1
    if n % 2 == 0 or n % 3 == 0:
        return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            return False
        i += 6
    return True

def sieve(n: int) -> List[bool]:
    prime = [True]*(n+1)
    prime[1] = False

    return [False]

t = 0
for i in range(1, int(100)):
    x = i*i - i + 41
    if is_prime(x):
        t += 1

print(t)
print(sieve(3))
