#include <cassert>
#include <cmath>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <vector>

#include "euler_help.h"

std::vector<bool> sieve;

typedef long long int128_t;

// Computes the sieve of Eratosthenes for values up to n.
void compute_sieve(int n) {
    sieve.resize(n + 1, true);
    sieve[0] = sieve[1] = false;
    for (int i = 2; i * i <= n; ++i) {
        if (sieve[i]) {
            for (int j = i + i; j <= n; j += i) {
                sieve[j] = false;
            }
        }
    }
}

// Computes the binomial coefficient C(n, k).
int128_t binomial(int n, int k) {
    if (n < 0 || k < 0 || k > n) {
        return 0;
    }
    if (k == 0 || k == n) {
        return 1;
    }
    if (k > n - k) k = n - k;  // Take advantage of symmetry
    
    int128_t result = 1;
    for (int i = 0; i < k; ++i) {
        result = result * (n - i) / (i + 1);
    }
    return result;
}

int64_t naive_k_digit_sums_n(int k, int n) {
    int64_t start = pow(10, k-1);
    int64_t end = pow(10, k);
    int count = 0;
    
    for (int64_t num = start; num < end; num++) {
        int64_t temp = num;
        int sum = 0;
        while (temp > 0) {
            sum += temp % 10;
            temp /= 10;
        }
        if (sum == n) {
            count++;
        }
    }
    return count;
}

// Counts the number of k-digit numbers with sum of digits n.
// The algorithm comes from:
// https://math.stackexchange.com/questions/1125070/counting-the-numbers-with-certain-sum-of-digits
int128_t k_digit_sums_n(int k, int n) {
    std::cout << "k_digit_sums_n(" << k << ", " << n << ") = ";
    assert(k > 0 && n > 0);
    if (k == 1) {
        if (n >= 1 && n <= 9) {
            return 1;
        }
        return 0;
    }
    int128_t total = 0;
    int kk = k - 1;
    for (int d1 = 1; d1 <= 9; d1++) {
        int nn = n - d1;
        if (nn < 0) {
            continue;
        }
        int max_i = std::min(kk, nn / 10);
        assert(max_i >= 0);
        for (int i = 0; i <= max_i; i++) {
            int128_t term = binomial(kk, i) * binomial(nn + kk - 1 - 10*i, kk - 1);
            if (i % 2 == 0) {
                total += term;
            } else {
                total -= term;
            }
        }
    }
//    std::cout << "k_digit_sums_n(" << k << ", " << n << ") = " << static_cast<long long>(total) << "\n";
    assert(total >= 0);
    std::cout << total << "\n";
    return total;
}

int test_k_digit_sums_n() {
    // Test with small values of k and n
    for (int k = 1; k <= 5; k++) {
        for (int n = 1; n <= 9 * k; n++) {
            int64_t naive_result = naive_k_digit_sums_n(k, n);
            int64_t result = k_digit_sums_n(k, n);
            if (naive_result != result) {
                std::cout << "Mismatch for k = " << k << " and n = " << n << ": naive = " << naive_result << ", result = " << result << "\n";
            }
        }
    }
    return 0;
} 

// Return the i-th k-digit number with digit sum n.
int128_t i_th_k_digit_sum_n(int128_t i, int128_t k, int n) {
    std::cout << "i_th_k_digit_sum_n(" << (long long)i << ", " << (long long)k << ", " << (long long)n << ")\n";
    assert(n >= 1 && n <= 9*k);
    if (k == 1) {
        assert(n >= 1 && n <= 9);
        return 1;
    }
    int128_t total = 0;
    for (int d1 = 1; d1 <= 9; d1++) {
        int nn = n - d1;
        if (nn <= 0) break;
        int128_t nsums = k_digit_sums_n(k-1, nn);
        std::cout << "  d1=" << (long long)d1 << " nn=" << (long long)nn << " nsums=" << (long long)nsums << " total=" << (long long)total << "\n";
        if (total + nsums >= i) {
            return d1 * std::pow(10, k-1) + i_th_k_digit_sum_n(i - total, k-1, nn);
        }
        total += nsums;
    }
    return total;
}

// Return the input-th positive integer that has the sum of its digits prime.
long long D(long long input) {
    std::cout << "\nD(" << input << ")\n";
    int128_t n = input, nprimes = 0, ndigits = 1;
    for (;;) {
        for (int p = 2; p < static_cast<int>(sieve.size()) && p <= 9*ndigits; p++) {
            if (!sieve[p]) {
                continue;
            }
            int128_t i = k_digit_sums_n(ndigits, p);
            std::cout << "  k_digit_sums_n(" << (long long)ndigits << ", " << (long long)p << ") = " << (long long)i << "\n";
            std::cout << "   i=" << (long long)i << " nprimes=" << (long long)nprimes << " n=" << (long long)n << "\n";
            if (i + nprimes == n) {
                int128_t r = i_th_k_digit_sum_n(i, ndigits, p);
                std::cout << "     i_th_k_digit_sum_n(" << (long long)i << ", " << (long long)ndigits << ", " << (long long)p << ") = " << (long long)r << "\n";
                return static_cast<long long>(r);
            }
            if (i + nprimes > n) {
                std::cout << "     i=" << (long long)i << " nprimes=" << (long long)nprimes << " n=" << (long long)n << "\n";
                int128_t r = i_th_k_digit_sum_n(n - nprimes, ndigits, p);
                std::cout << "     i_th_k_digit_sum_n(" << (long long)n - (long long)nprimes << ", " << (long long)ndigits << ", " << (long long)p << ") = " << (long long)r << "\n";
                return static_cast<long long>(r + nprimes);
            }
            nprimes += i;
        }
        std::cout << "ndigits: " << (long long)ndigits << " nprimes: " << (long long)nprimes << "\n";
        ndigits++;
    }
    return -1;
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

    unsigned long long input = 10000000000000000;
    if (argc > 1) {
        input = std::stoull(argv[1]);
    }
    std::cout << (long long)k_digit_sums_n(16, input) << "\n";

    // For Euler 845, the maximum digit sum of a 16-digit number is 144,
    // so a sieve up to 1000 is plenty.
    compute_sieve(1000);

    std::cout << "D(" << input << ") = " << D(input) << "\n";
}

