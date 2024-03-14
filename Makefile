all: main.js renderworker.js

%.js: %.ts
	@npx tsc $<

clean:
	@rm -f main.js *~
