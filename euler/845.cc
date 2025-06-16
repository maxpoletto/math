#include <iostream>
#include <vector>
#include <cmath>
#include <cstdlib>

#include "euler_help.h"

const unsigned int MAX = 200;
std::vector<bool> sieve(MAX + 1, true);

void compute_sieve() {
    sieve[0] = sieve[1] = false;
    for (unsigned int i = 2; i * i <= MAX; ++i) {
        if (sieve[i]) {
            for (unsigned int j = i + i; j <= MAX; j += i) {
                sieve[j] = false;
            }
        }
    }
}

unsigned int sum_of_digits(unsigned int n) {
    unsigned int sum = 0;
    while (n > 0) {
        sum += n % 10;
        n /= 10;
    }
    return sum;
}

inline bool is_sum_of_digits_prime(unsigned int n) {
    return sieve[sum_of_digits(n)];
}

// Counts the number of n-digit numbers whose digit sum is q.
unsigned long long digit_sums(unsigned int n, unsigned int q) {
    if (n == 1) {
        return 1;
    }
    if (q > (9*n+1)/2) {
        return digit_sums(n, 9*n+1-q);
    }
    unsigned long long sum = 0;
    for (unsigned int i = std::max(1u, q-9); i <= q; i++) {
        sum += digit_sums(n-1, i);
    }
    return sum;
}

int main(int argc, char **argv) {
    if (argc > 1) {
        if (strcmp(argv[1], "-h") == 0 || strcmp(argv[1], "--help") == 0) {
            euler_help(845,
            "Let D(n) be the nth positive integer that has the sum of its digits prime.\n"
            "For example, D(61) = 157 and D(10^8) = 403539364.\n"
            "Find D(10^16).",
            "00845 [N]\n"
            "  N - the nth positive integer that has the sum of its digits prime (default: 10^16)\n");
        }
    }

    unsigned long long n = 10000000000000000;
    if (argc > 1) {
        n = std::stoull(argv[1]);
    }

    compute_sieve();

    unsigned long long count = 0;
    unsigned long long i = 0;
    while (count < n) {
        i++;
        if (is_sum_of_digits_prime(i)) {
            count++;
        }
    }
    std::cout << "D(" << n << ") = " << i << "\n";
}
