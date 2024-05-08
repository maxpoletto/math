#include <iostream>

int main(int argc, char **argv)
{   // o1 o2 e  o1 o2 e
    // 1, 1, 2, 3, 5, 8, 13, 21, 34
    int lim = atoi(argv[1]);
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
