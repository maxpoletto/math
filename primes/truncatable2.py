#!/usr/bin/python

import pprint
import sys

knownPrimes = [2,3,5,7]

def hasKnownPrimeDivisor(n, start = 0):
    for i in knownPrimes[start:]:
        if n % i == 0:
            return True, i
        if i * i > n:
            return False, i
    return False, i

def extendKnownPrimes(i, n):
    global knownPrimes
    ins = False
    j = i
    while not (ins and i*i > n):
        r, _ = hasKnownPrimeDivisor(i)
        if not r:
            knownPrimes.append(i)
            ins = True
        i += 2

def isOddPrime(n):
    r, i = hasKnownPrimeDivisor(n)
    if r:
        return False
    if i * i > n:
        return True
    l = len(knownPrimes)
    # Invariant: i*i < n
    extendKnownPrimes(i+2, n)
    r, _ = hasKnownPrimeDivisor(n, l)
    return not r

def truncatable(length):
    q = [1, 3, 5, 7]
    r = []
    while len(q) > 0:
        n, q = q[0], q[1:]
        if not isOddPrime(n):
            continue
        # If n is prime of desired length, add it to result set.
        l = len(str(n))
        if l == length:
            r.append(n)
            continue
        
        # N is prime but too short. Test N with digits 1..9 prepended.
        m = 10**l
        for j in xrange(1, 10):
            q.append((j*m)+n)
    return sorted(r)

def main():
    try:
        pprint.pprint(truncatable(int(sys.argv[1])))
    except ValueError:
        print "Usage: truncatable2 <integer>"
    except IndexError:
        print "Usage: truncatable2 <integer>"


if __name__ == "__main__":
    main()
