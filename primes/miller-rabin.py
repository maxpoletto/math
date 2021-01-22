#!/opt/local/bin/python

# Reference:
# https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test

import math
import random
import sys

def usage():
    print("miller-rabin <n>")
    sys.exit(-1)

def is_probably_prime(n, k):
    if n % 2 == 0:
        return False

    d = n-1
    r = 0
    while r % 2 == 0:
        r += 1
        d /= 2

    for i in range(0, k):
        a = random.randint(2, n-2)
        x = (a**d) % n
        if x == 1 or x == n-1:
            continue
        comp = True
        for j in range(1, r):
            x = (x*x) % n
            if x == n-1:
                comp = False
                break
        if comp:
            return False
    return True

# Miller-Rabin primality test
def is_prime(n):
    if n % 2 == 0:
        return False

    w = [ 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 73, 1662803 ]
    d = n-1
    s = 0
    while d % 2 == 0:
        s += 1
        d /= 2

    lim = min(n-1, math.floor(2*math.log(n)**2))
    for a in w:
        if a > lim:
            break
        if (a**d) % n == 1:
            continue
        comp = True
        for r in range(0, s):
            if (a**(d*2**r)) % n == n-1:
                comp = False
                break
        if comp:
            return False
    return True

def main():
    try:
        a = int(sys.argv[1])
    except ValueError:
        usage()
    except IndexError:
        usage()
    print(is_probably_prime(a, 3))
    print(is_prime(a))

if __name__ == "__main__":
    main()
