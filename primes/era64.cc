#include <bitset>
#include <boost/dynamic_bitset.hpp>
#include <chrono>
#include <vector>

#include <stdio.h>

bool verbose = true;
const int bits = 30;
const int64_t mask = (1<<30) - 1;

void sieve(int64_t n) 
{ 
  auto start = std::chrono::system_clock::now();
  std::vector<boost::dynamic_bitset<>> notprime(1+(n>>bits), boost::dynamic_bitset<>((1LL<<bits)+1));
  printf("constructed %lld %lld\n", 1+(n>>bits), (1LL<<bits)+1);
  for (int64_t p = 2; p*p <= n; p++) {
    if (notprime[p>>bits][p&mask] == 0) {
      for (int64_t q = p*2; q <= n; q += p)
	notprime[q>>bits][q&mask] = 1;
    }
  }
  auto end = std::chrono::system_clock::now();
  std::chrono::duration<double> elapsed_seconds = end-start;
  printf("Computation took %f sec\n", elapsed_seconds.count());
  
  int64_t k = 0;
  printf("Primes <= %lld\n", n);
  for (int64_t p = 2; p <= n; p++) 
    if (notprime[p>>bits][p&mask] == 0) {
      ++k;
      if (verbose) {
	printf("%lld ", p);
      }
    }
  if (verbose)
    printf("\n");
  printf("%lld primes\n", k);
} 
  
int main(int argc, char* argv[]) { 
  if (argc < 2) {
    printf("era [-quiet] <n>: computes primes <= n\n");
    return -1;
  }
  if (!strcmp(argv[1], "-quiet")) {
    verbose = false;
  }
  int64_t n = std::stoll(argv[argc-1]);
  sieve(n); 
  return 0; 
} 
