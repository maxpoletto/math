CXX = clang++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2

SRC = $(wildcard *.cc)
EXE = $(SRC:.cc=)

all: $(EXE)

%: %.cc
	$(CXX) $(CXXFLAGS) -o $@ $<

clean:
	rm -f $(EXE)

.PHONY: all clean
