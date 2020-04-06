var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var dpi = window.devicePixelRatio;

function fix_dpi() {
    function styleValue(attr) {
	return getComputedStyle(canvas).getPropertyValue(attr).slice(0,-2);
    }
    canvas.setAttribute('width',  dpi * styleValue('width'));
    canvas.setAttribute('height', dpi * styleValue('height'));
}

function sierp(a, b, c, n) {
    function midpoint(x, y) {
	return [(x[0]+y[0])/2, (x[1]+y[1])/2];
    }
    function triangle(a, b, c) {
	ctx.beginPath();
	ctx.moveTo(a[0], a[1]);
	ctx.lineTo(b[0], b[1]);
	ctx.lineTo(c[0], c[1]);
	ctx.closePath();
	ctx.stroke();
    }
    triangle(a, b, c);
    if (n > 0) {
	var x = midpoint(a, b), y = midpoint(b, c), z = midpoint(c, a);    
	triangle(x, y, z);
	sierp(x, b, y, n-1);
	sierp(z, y, c, n-1);
	sierp(a, x, z, n-1);
    }
}

var depth;
function draw() {
    var w = canvas.width, h = canvas.height, l = w;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sierp([(w+l)/2, (h+l)/2], [w/2, (h-l)/2], [(w-l)/2,(h+l)/2], depth);
}

function init() {
    fix_dpi();
    var d = document.getElementById('depth');
    var dv = document.getElementById('dv');
    d.onchange = function() {
	depth = this.value;
	dv.innerHTML = depth;
	draw();
    }
    d.onchange();
}

init();
