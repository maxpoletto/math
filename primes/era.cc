#include <bitset>
#include <boost/dynamic_bitset.hpp>
#include <chrono>

#include <stdio.h>

bool verbose = true;

void sieve(int n) {
  auto start = std::chrono::system_clock::now();
  boost::dynamic_bitset<> notprime(n + 1);
  for (int p = 2; p * p <= n; p++) {
    if (notprime[p] == 0) {
      for (int i = p * 2; i <= n; i += p)
        notprime[i] = 1;
    }
  }
  auto end = std::chrono::system_clock::now();
  std::chrono::duration<double> elapsed_seconds = end - start;
  printf("Computation took %f sec\n", elapsed_seconds.count());

  if (!verbose)
    return;
  printf("Primes <= %d\n", n);
  for (int p = 2; p <= n; p++)
    if (notprime[p] == 0)
      printf("%d ", p);
  printf("\n");
}

int main(int argc, char *argv[]) {
  if (argc < 2) {
    printf("era [-quiet] <n>: computes primes <= n\n");
    return -1;
  }
  if (!strcmp(argv[1], "-quiet")) {
    verbose = false;
  }
  int n = std::stoi(argv[argc - 1]);
  sieve(n);
  return 0;
}
