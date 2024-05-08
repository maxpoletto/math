#include <iostream>
#include <vector>
#include <cmath>

const int MAX = 1000;
std::vector<bool> sieve(MAX + 1, true);

// Function to pre-compute primes using Sieve of Eratosthenes
void sieve() {
  sieve[0] = sieve[1] = false;
  for (int i = 2; i * i <= MAX; ++i)    {
    if (sieve[i])        {
      for (int j = i * i; j <= MAX; j += i)            {
	sieve[j] = false;
      }
    }
  }
}

// Function to get the sum of digits of a number
int sumOfDigits(int n) {
  int sum = 0;
  while (n > 0)    {
    sum += n % 10;
    n /= 10;
  }
  return sum;
}

// Function to check if the sum of digits of a number is prime
bool isSumOfDigitsPrime(int n) {
    int sum = sumOfDigits(n);
    return sieve[sum];
}

int main(int argc, char **argv) {
  sieve();
  int n = atoi(argv[1]);
  int count = 0;
  int num = 1;
  while (true)    {
    if (isSumOfDigitsPrime(num))        {
      ++count;
      if (count == n)
	break;
    }
    ++num;
  }
  std::cout << "The " << n << "th number with a prime digit-sum is " << num << ".\n";
  return 0;
}
