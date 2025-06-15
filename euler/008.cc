#include <iostream>
#include <vector>
#include <cmath>
#include <cstdint>
#include <cstdlib>

#include "euler_help.h"

const std::string default_number = 
    "73167176531330624919225119674426574742355349194934"
    "96983520312774506326239578318016984801869478851843"
    "85861560789112949495459501737958331952853208805511"
    "12540698747158523863050715693290963295227443043557"
    "66896648950445244523161731856403098711121722383113"
    "62229893423380308135336276614282806444486645238749"
    "30358907296290491560440772390713810515859307960866"
    "70172427121883998797908792274921901699720888093776"
    "65727333001053367881220235421809751254540594752243"
    "52584907711670556013604839586446706324415722155397"
    "53697817977846174064955149290862569321978468622482"
    "83972241375657056057490261407972968652414535100474"
    "82166370484403199890008895243450658541227588666881"
    "16427171479924442928230863465674813919123162824586"
    "17866458359124566529476545682848912883142607690042"
    "24219022671055626321111109370544217506941658960408"
    "07198403850962455444362981230987879927244284909188"
    "84580156166097919133875499200524063689912560717606"
    "05886116467109405077541002256983155200055935729725"
    "71636269561882670428252483600823257530420752963450";

int main(int argc, char **argv) {
    if (argc > 1) {
        if (strcmp(argv[1], "-h") == 0 || strcmp(argv[1], "--help") == 0) {
            euler_help(8,
            "The four adjacent digits in the 1000-digit number that have the greatest product are 9 × 9 × 8 × 9 = 5832.\n"
            "Find the thirteen adjacent digits in the 1000-digit number that have the greatest product. What is the value of this product?",
            "008 [D] [N]\n"
            "  D - the number of adjacent digits to consider (default: 13)\n"
            "      D must be a positive integer\n"
            "  N - the number in which to search for the digits (default: " + default_number + ")\n");
        }
    }

    unsigned int ndigits = 13;
    if (argc > 1) {
        ndigits = std::strtoll(argv[1], nullptr, 10);
    }

    std::string number = default_number;
    if (argc > 2) {
        number = argv[2];
    }

    // Convert the number to a vector of integers.
    std::vector<int> digits;
    for (char c : number) {
        digits.push_back(c - '0');
    }

    if (digits.size() < ndigits) {
        std::cout << "Number has less than " << ndigits << " digits\n";
        return 1;
    }

    unsigned long long max_product = 0;
    int max_index = 0;
    for (unsigned int i = 0; i < digits.size() - ndigits + 1; i++) {
        unsigned long long product = 1;
        for (unsigned int j = 0; j < ndigits; j++) {
            product *= digits[i + j];
        }
        if (product > max_product) {
            max_product = product;
            max_index = i;
        }
    }

    std::cout << "Max product is " << max_product << " at position [" << max_index << ", " << max_index + ndigits -1 << "]\n";
    // Join digits max_index ... max_index+ndigits-1 into a string with 'x'
    std::string max_digits = std::to_string(digits[max_index]);
    for (unsigned int i = max_index + 1; i < max_index + ndigits; i++) {
        max_digits += " x " + std::to_string(digits[i]);
    }
    std::cout << "(" << max_digits << ")\n";
    return 0;
}
