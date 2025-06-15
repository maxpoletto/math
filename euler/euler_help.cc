#include <iostream>
#include <string>

void euler_help(int n, const std::string& msg, const std::string& usage) {
    std::cout << "Euler Problem " << n << " (https://projecteuler.net/problem=" << n << "):\n"
    << msg << "\n\n"
    << "Usage: " << usage << "\n";
    exit(0);
}
