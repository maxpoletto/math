#!/usr/local/bin/python3

# Simple code to solve the NYT Digits game, https://www.nytimes.com/games/digits

import argparse
import functools

@functools.cache
def generate_sets(numbers):
    l = list(numbers)
    new_sets = []
    for i in range(len(l)):
        for j in range(i+1, len(l)):
            operations = []
            operations.append(("%d+%d" % (l[i], l[j]), l[i] + l[j]))
            if l[i] - l[j] > 0:
                operations.append(("%d-%d" % (l[i], l[j]), l[i] - l[j]))
            if l[j] - l[i] > 0:
                operations.append(("%d-%d" % (l[j], l[i]), l[j] - l[i]))
            if l[i] != 1 and l[j] != 1 and l[i] != 0 and l[j] != 0:
                operations.append(("%dx%d" % (l[i], l[j]), l[i] * l[j]))
            if l[j] != 0 and l[i] % l[j] == 0 and l[j] != 1 and l[i] // l[j] != l[j]:
                operations.append(("%d÷%d" % (l[i], l[j]), l[i] // l[j]))
            elif l[i] != 0 and l[j] % l[i] == 0 and l[i] != 1 and l[j] // l[i] != l[i]:
                operations.append(("%d÷%d" % (l[j], l[i]), l[j] // l[i]))

            for op, res in operations:
                new_set = {l[k] for k in range(len(l)) if k != i and k != j}
                new_set.add(res)
                new_sets.append((frozenset(new_set), "%s=%d" % (op, res)))
    return new_sets

def solve(path, numbers, target):
    global results
    for n in numbers:
        if n == target:
            results.append(path)
    new_sets = generate_sets(numbers)
    for numbers2, path2 in new_sets:
        solve(path + [path2], numbers2, target)

parser = argparse.ArgumentParser()
parser.add_argument("-t", "--Target", type=int, required=True, help = "Target")
parser.add_argument("-n", "--Numbers", nargs='+', type=int, required=True, help = "List of numbers")
args = parser.parse_args()
numbers = frozenset(args.Numbers)
target = args.Target
results = []
solve([], numbers, target)
if len(results) == 0:
    print("Cannot combine the given numbers to produce the target")
else:
    results.sort()
    results.sort(key=len)
    for r in results:
        print(" ".join(r))
