CXX = clang++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2

SRC = $(wildcard [0-9]*.cc)
EXE = $(SRC:.cc=)
LIB = libeuler.a
INC = euler_help.h

all: $(EXE)

%: %.cc $(INC) $(LIB)
	$(CXX) $(CXXFLAGS) -o $@ $< -L. -leuler

%.o: %.cc $(INC)
	$(CXX) $(CXXFLAGS) -c $<

$(LIB): euler_help.o
	ar rcs $@ $^

clean:
	rm -f $(EXE) $(LIB) *.o

.PHONY: all clean
