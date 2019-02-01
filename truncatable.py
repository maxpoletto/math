#!/usr/bin/python

import sys
import pprint

def isPrime(n):
    for i in plist:
        if n % i == 0:
            return False
        if i*i > n:
            return True
    while i*i <= n:
        if n % i == 0:
            return False
        i += 2
    return True

def truncatable(length):
    q = [3, 5, 7]
    r = [2]
    while len(q) > 0:
        n, q = q[0], q[1:]
        if not isPrime(n):
            continue

        # If n is prime of desired length, add it to result set.
        l = len(str(n))
        if l > length:
            continue
        r.append(n)
        
        # N is prime but too short. Test N with digits 1..9 prepended.
        m = 10**l
        for j in xrange(1, 10):
            q.append((j*m)+n)
    return sorted(r)

def main():
    try:
        ndigits = int(sys.argv[1])
        if ndigits > 10:
            execfile("./p1m.py", globals())
        else:
            execfile("./p10k.py", globals())
        tt = truncatable(ndigits)
        i = 1
        for t in tt:
            print i, t
            i += 1
    except ValueError:
        print "Usage: truncatable <integer>"
    except IndexError:
        print "Usage: truncatable <integer>"


if __name__ == "__main__":
    main()
