#include <iostream>
#include <cstring>

#include "euler_help.h"


int main(int argc, char **argv) {
    // Parse -h / --help
    if (argc > 1) {
        if (strcmp(argv[1], "-h") == 0 || strcmp(argv[1], "--help") == 0) {
            euler_help(2, "Find the sum of the even-valued terms in the Fibonacci sequence whose values do not exceed four million.",
            "002 [LIMIT]\n"
            "  LIMIT - the limit of the Fibonacci sequence (default: 4000000)\n"
            "  LIMIT must be a positive integer\n");
        }
    }
    int lim = 4000000;
    if (argc > 1) {
        lim = atoi(argv[1]);
    }

    // o1 o2  e o1 o2  e o1 o2  e ...
    //  1  1  2  3  5  8 13 21 34 ...
    int o1 = 1, o2 = 1, e;
    int s = 0;    
    while (o1 <= lim) {
        e = o1 + o2;
        s += e;
        o1 = o2 + e;
        o2 = e + o1;
    }
    std::cout << s << "\n";
    return 0;
}
