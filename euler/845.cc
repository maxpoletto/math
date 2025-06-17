#include <cassert>
#include <cmath>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <vector>

#include "euler_help.h"

const unsigned int MAX = 200;
std::vector<bool> sieve(MAX + 1, true);

// Computes the sieve of Eratosthenes for values up to MAX.
// For Euler 845, the maximum digit sum of a 16-digit number is 144, so MAX = 200 is ample.
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

// Computes the binomial coefficient C(n, k).
unsigned long long binomial(unsigned int n, unsigned int k) {
    if (k > n - k) k = n - k;  // Take advantage of symmetry
    if (k == 0) return 1;
    
    unsigned long long result = 1;
    for (unsigned int i = 0; i < k; ++i) {
        result = result * (n - i) / (i + 1);
    }
    return result;
}

// Counts the number of n-digit numbers with sum of digits q.
// The algorithm comes from:
// https://math.stackexchange.com/questions/1125070/counting-the-numbers-with-certain-sum-of-digits
unsigned long long n_digit_sums_q(int n, int q) {
    if (n == 1) {
        return static_cast<unsigned long long>(q >= 1 && q <= 9);
    }
    unsigned long long total = 0;
    for (int d1 = 1; d1 <= 9; d1++) {
        int qq = q - d1;
        int max_k = std::min(n-1, qq / 10);    
        for (int k = 0; k <= max_k; ++k) {
            unsigned long long term = binomial(n-1, k) * binomial(q - 10*k + n - 2, n - 2);
            if (k % 2 == 0) {
                total += term;
            } else {
                total -= term;
            }
        }
    }
    return total;
}

unsigned long long kth_n_digit_sum_q(unsigned long long k, unsigned long long n, int q) {
    std::cout << "kth_n_digit_sum_q(" << k << ", " << n << ", " << q << ")\n";
    if (n == 1) {
        assert(q >= 1 && q <= 9);
        return 1;
    }
    unsigned long long total = 0;
    for (int d1 = 1; d1 <= 9; d1++) {
        int qq = q - d1;
        unsigned long long nn = n_digit_sums_q(n-1, qq);
        std::cout << "                   d1: " << d1 << " qq: " << qq << " nn: " << nn << " total: " << total << " k: " << k << "\n";
        if (total + nn >= k) {
            return d1 * std::pow(10, n-1) + kth_n_digit_sum_q(k - total, n-1, qq);
        }
        total += nn; 
    }
    std::cout << "      kth_n_digit_sum_q(" << k << ", " << n << ", " << q << ") = 0\n";
    return total;
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

    unsigned long long nprimes = 0;
    unsigned long long ndigits = 1;

    while (true) {
        for (unsigned int p = 2; p < sieve.size() && p <= 9*ndigits; p++) {
            if (!sieve[p]) {
                continue;
            }
            unsigned long long k = n_digit_sums_q(ndigits, p);
            if (k + nprimes > n) {
                std::cout << "k: " << k << " nprimes: " << nprimes << " n: " << n << "\n";
                std::cout << "Calling kth_n_digit_sum_q(" << n - nprimes << ", " << ndigits << ", " << p << ")\n";
                unsigned long long r = kth_n_digit_sum_q(n - nprimes, ndigits, p);
                std::cout << std::right << std::setw(10) << "ndigits: " << std::setw(20) << ndigits << "\n"
                    << std::right << std::setw(10) << "p: " << std::setw(20) << p << "\n"
                    << std::right << std::setw(10) << "k: " << std::setw(20) << k << "\n"
                    << std::right << std::setw(10) << "nprimes: " << std::setw(20) << nprimes << "\n"
                    << std::right << std::setw(10) << "n: " << std::setw(20) << n << "\n"
                    << std::right << std::setw(10) << "r: " << std::setw(20) << r << "\n"
                    << std::right << std::setw(10) << "result: " << std::setw(20) << r + nprimes << "\n";
                return 0;
            }
            nprimes += k;
        }
        ndigits++;
    }
    std::cout << "D(" << nprimes << ") = " << ndigits << "\n";
}
