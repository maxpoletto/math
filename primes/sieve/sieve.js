const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const dpi = window.devicePixelRatio;

function fix_dpi() {
    function styleValue(attr) {
	return getComputedStyle(canvas).getPropertyValue(attr).slice(0,-2);
    }
    canvas.setAttribute('width',  dpi * styleValue('width'));
    canvas.setAttribute('height', dpi * styleValue('height'));
}

var cols, rows, side;
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function initCanvas(n) {
    cols = Math.floor(Math.sqrt(n)+0.5);
    rows = cols
    side = canvas.width / cols;
    makeColor(0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function mark(i) {
    var col = i % cols, row = Math.floor(i / rows);
    var x = col * side, y = row * side;
    ctx.fillRect(x, y, side, side)
}

function makeColor(n) {
    n *= 7919;			// Shift things out of blue.
    n >>>= 0;
    var b = n & 0xFF,
        g = (n & 0xFF00) >>> 8,
        r = (n & 0xFF0000) >>> 16;
    ctx.fillStyle = "rgb(" + [r, g, b].join(",") + ")";
}

var delay;			// Can be updated dynamically.
var color;
async function sieve(n) {
    initCanvas(n);
    console.log(ctx.fillStyle);
    var np = Array(n).fill(0);
    for (var p = 2; p*p <= n; p++) {
	if (np[p] == 0) {
	    if (color) {
		makeColor(p);
	    }
	    for (var i = 2*p; i <= n; i += p) {
		np[i] = 1;
		mark(i);
		if (delay > 0) {
		    await sleep(delay);
		}
	    }
	}
    }
}

function runSieve() {
    var n = parseInt(document.getElementById('num').value);
    delay = document.getElementById('delay').value;
    color = document.getElementById('color').checked;
    sieve(n);
}

function init() {
    fix_dpi();
    document.getElementById('delay').onchange = function() {
	delay = this.value;
    }
}

init();
