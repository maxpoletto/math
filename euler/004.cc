#include <iostream>
#include <vector>
#include <cmath>
#include <cstdint>
#include <cstdlib>

#include "euler_help.h"

inline bool is_palindrome(int64_t n) {
    int64_t rev = 0, n2 = n;
    while (n2 > 0) {
        rev = rev * 10 + n2 % 10;
        n2 /= 10;
    }
    return n == rev;
}

int main(int argc, char **argv) {
    if (argc > 1) {
        if (strcmp(argv[1], "-h") == 0 || strcmp(argv[1], "--help") == 0) {
            euler_help(4,
            "A palindromic number reads the same both ways.\n"
            "The largest palindrome made from the product of two 2-digit numbers is 9009 = 91 × 99.\n"
            "Find the largest palindrome made from the product of two 3-digit numbers.",
            "004 [DIGITS]\n"
            "  DIGITS - the number of digits in the numbers (default: 3)\n"
            "  DIGITS must be a positive integer\n");
        }
    }
    int digits = 3;
    if (argc > 1) {
        digits = std::strtoll(argv[1], nullptr, 10);
    }

    int64_t min = 10;
    for (int i = 0; i < digits-2; i++) {
        min = min * 10;
    }
    int64_t max = min * 10 - 1;
    int64_t best_i = 0, best_j = 0, max_palindrome = 0;

    for (int64_t i = max; i >= min; i--) {
        for (int64_t j = i; j >= min; j--) {
            int64_t p = i * j;
            if (p <= max_palindrome) {
                break;
            }
            if (is_palindrome(p)) {
                max_palindrome = p;
                best_i = i;
                best_j = j;
                break;
            }
        }
    }

    if (max_palindrome > 0) {
        std::cout << max_palindrome << " = " << best_i << " * " << best_j << "\n";
    } else {
        std::cout << "No palindrome found\n";
    }
    return 0;
}
