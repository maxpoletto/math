FLAGS=-Wall -std=c++1y -Ofast
CPPFLAGS=-I/opt/local/include
LDDFLAGS=-L/opt/local/lib

era : era.cc
	@clang $(FLAGS) $(CPPFLAGS) $< -o $@ -lstdc++ $(LDDFLAGS)

clean:
	@rm -f era *~
