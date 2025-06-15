#include <iostream>
#include <vector>
#include <cmath>
#include <cstdint>
#include <cstdlib>

#include "euler_help.h"

unsigned long long nth_prime_naive(unsigned int n) {
    std::vector<unsigned long long> p;
    p.reserve(n);
    p.push_back(2);
    unsigned long long i = 3;
    while (p.size() < n) {
        bool is_prime = true;
        for (unsigned int j = 0; j < p.size(); j++) {
            if (i % p[j] == 0) {
                is_prime = false;
                break;
            }
        }
        if (is_prime) {
            p.push_back(i);
        }
        i += 2;
    }
    return p[n-1];
}

bool is_odd_greater_than_3_prime(unsigned long long n) {
    // All primes >3 can be written as 6k +/- 1.
    if (n % 3 == 0) {
        return false;
    }
    unsigned long long sq = std::sqrt(n);
    unsigned long long f = 5;
    while (f <= sq) {
        if (n % f == 0 || n % (f + 2) == 0) {
            return false;
        }
        f += 6;
    }
    return true;
}

unsigned long long nth_prime_optimized(unsigned int n) {
    if (n == 1) {
        return 2;
    } else if (n == 2) {
        return 3;
    }
    unsigned int m = 2;
    unsigned long long r = 3;
    while (m < n) {
        r += 2;
        if (is_odd_greater_than_3_prime(r)) {
            m++;
        }
    }
    return r;
}

int main(int argc, char **argv) {
    if (argc > 1) {
        if (strcmp(argv[1], "-h") == 0 || strcmp(argv[1], "--help") == 0) {
            euler_help(7,
            "By listing the first six prime numbers: 2, 3, 5, 7, 11, and 13, we can see that the 6th prime is 13.\n"
            "What is the 10 001st prime number?",
            "007 [N] [-t / --time]\n"
            "  N - the number of the prime number to find (default: 10001)\n"
            "      N must be a positive integer\n"
            "  -t / --time: compare runtimes for different algorithms");
        }
    }
    uint64_t number = 10001;
    if (argc > 1) {
        number = std::strtoll(argv[1], nullptr, 10);
    }

    bool time_execution = false;
    if (argc > 2) {
        if (strcmp(argv[2], "-t") == 0 || strcmp(argv[2], "--time") == 0) {
            time_execution = true;
        }
    }

    if (time_execution) {
        // Time the execution of the two functions.
        std::cout << "Naive test of divisibility against smaller primes:\n";
        auto start = std::chrono::high_resolution_clock::now();
        unsigned long long result = nth_prime_naive(number);
        std::cout << result << "\n";
        auto end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double> duration = end - start;
        std::cout << "Time taken: " << duration.count() << " seconds\n\n";

        std::cout << "6k ± 1 test:\n";
        start = std::chrono::high_resolution_clock::now();
        result = nth_prime_optimized(number);
        std::cout << result << "\n";
        end = std::chrono::high_resolution_clock::now();
        duration = end - start;
        std::cout << "Time taken: " << duration.count() << " seconds\n";
    } else {
        std::cout << nth_prime_optimized(number) << "\n";
    }

    return 0;
}
