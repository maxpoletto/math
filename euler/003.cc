// The prime factors of 13195 are 5, 7, 13, and 29.
// What is the largest prime factor of the number 600851475143.

#include <iostream>
#include <vector>
#include <cmath>
#include <cstdint>
#include <cstdlib>

int main(int argc, char **argv)
{
    if (argc < 2) {
        std::cerr << "Please provide a number to analyze.\n";
        return -1;
    }
    char* end;
    int64_t n = std::strtoll(argv[1], &end, 10);
    if (*end) {
        std::cerr << "Failed to parse input.\n";
        return -1;
    }

    int64_t lastFactor = 0;
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
