#!/usr/bin/python

import sys


def usage():
    print "gcd <a> <b>"
    sys.exit(-1)

# Euclidean algorithm
def gcd(a, b):
    while b != 0:
        t = b
        b = a % b
        a = t
    return a

def main():
    try:
        a, b = int(sys.argv[1]), int(sys.argv[2])
    except ValueError:
        usage()
    except IndexError:
        usage()

    if a < b:
        a, b = b, a
    print gcd(a, b)

if __name__ == "__main__":
    main()
