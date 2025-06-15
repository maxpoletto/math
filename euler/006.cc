#include <iostream>
#include <vector>
#include <cmath>
#include <cstdint>
#include <cstdlib>

#include "euler_help.h"

int main(int argc, char **argv) {
    if (argc > 1) {
        if (strcmp(argv[1], "-h") == 0 || strcmp(argv[1], "--help") == 0) {
            euler_help(6,
            "The sum of the squares of the first ten natural numbers is,\n"
            "1^2 + 2^2 + ... + 10^2 = 385\n"
            "The square of the sum of the first ten natural numbers is,\n"
            "(1 + 2 + ... + 10)^2 = 55^2 = 3025\n"
            "Hence the difference between the sum of the squares of the first ten natural numbers and the square of the sum is 3025 − 385 = 2640.\n"
            "Find the difference between the sum of the squares of the first one hundred natural numbers and the square of the sum.",
            "006 [N]\n"
            "  N - the number of numbers to sum (default: 100)\n"
            "  N must be a positive integer\n");
        }
    }
    uint64_t number = 100;
    if (argc > 1) {
        number = std::strtoll(argv[1], nullptr, 10);
    }

    unsigned long long sum_of_squares = 0;
    unsigned long long sum = 0;
    for (unsigned int i = 1; i <= number; i++) {
        sum_of_squares += i * i;
        sum += i;
    }
    unsigned long long result = sum * sum - sum_of_squares;
    std::cout << result << "\n";

    return 0;
}
