#include <iostream>
#include <vector>
#include <cmath>
#include <cstdint>
#include <cstdlib>

#include "euler_help.h"

int main(int argc, char **argv) {
    if (argc > 1) {
        if (strcmp(argv[1], "-h") == 0 || strcmp(argv[1], "--help") == 0) {
            euler_help(3,
            "The prime factors of 13195 are 5, 7, 13, and 29.\n"
            "What is the largest prime factor of the number 600851475143.",
            "003 [NUMBER]\n"
            "  NUMBER - the number to analyze (default: 600851475143)\n"
            "  NUMBER must be a positive integer\n");
        }
    }
    int64_t n = 600851475143;
    if (argc > 1) {
        n = std::strtoll(argv[1], nullptr, 10);
    }

    int64_t lastFactor = 1;
    while (n % 2 == 0) {
        n /= 2;
        lastFactor = 2;
    }
    int64_t maxFactor = static_cast<int64_t>(sqrt(n));
    for (int64_t f = 3; f <= maxFactor; f += 2) {
        while (n % f == 0) {
            n /= f;
            lastFactor = f;
            maxFactor = static_cast<int64_t>(sqrt(n));
        }
    }
    if (n == 1) {
        std::cout << lastFactor << "\n";
    } else {
        std::cout << n << "\n";
    }
    return 0;
}
