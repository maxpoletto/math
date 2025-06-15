#include <iostream>
#include <vector>
#include <cmath>
#include <cstdint>
#include <cstdlib>

#include "euler_help.h"

std::vector<unsigned int> primes_below(unsigned int n) {
    std::vector<unsigned int> p;
    p.reserve(n/2);
    for (unsigned int i = 2; i < n; i++) {
        bool is_prime = true;
        for (unsigned int j = 0; j < p.size(); j++) {
            if (i % p[j] == 0) {
                is_prime = false;
                break;
            }
        }
        if (is_prime) {
            p.push_back(static_cast<unsigned int>(i));
        }
    }
    return p;
}

int main(int argc, char **argv) {
    if (argc > 1) {
        if (strcmp(argv[1], "-h") == 0 || strcmp(argv[1], "--help") == 0) {
            euler_help(5,
            "2520 is the smallest number that can be divided by each of the numbers from 1 to 10 without any remainder.\n"
            "What is the smallest positive number that is evenly divisible by all of the numbers from 1 to 20?",
            "005 [NUMBER]\n"
            "  NUMBER - the number to analyze (default: 20)\n"
            "  NUMBER must be a positive integer\n");
        }
    }
    uint64_t number = 20;
    if (argc > 1) {
        number = std::strtoll(argv[1], nullptr, 10);
    }

    const std::vector<unsigned int> p = primes_below(number);
    std::vector<unsigned int> a(p.size(), 1);
    unsigned long long result = 1;
    unsigned int lim = static_cast<unsigned int>(std::sqrt(number));
    for (unsigned int i = 0; i < p.size(); i++) {
        unsigned int ai = 1;
        if (p[i] <= lim) {
            ai = static_cast<unsigned int>(std::log(number) / std::log(p[i]));
        }
        result *= std::pow(p[i], ai);
    }
    std::cout << result << "\n";

    return 0;
}
