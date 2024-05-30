TARGETS = slow.js renderworker.js

all: $(TARGETS)

%.js: %.ts
	npx tsc $<

clean:
	rm -f $(TARGETS) *~
