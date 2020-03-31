const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const dpi = window.devicePixelRatio;
const depth_max = 12, depth_min = 0

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
	let x = midpoint(a, b), y = midpoint(b, c), z = midpoint(c, a);    
	triangle(x, y, z);
	sierp(x, b, y, n-1);
	sierp(z, y, c, n-1);
	sierp(a, x, z, n-1);
    }
}

function depth() {
    let p = new URLSearchParams(window.location.href.split('?',2)[1]);
    if (!p.has('depth')) {
	return 8;
    }
    let depth = parseInt(p.get('depth'), 10);
    if (isNaN(depth)) {
	return 8;
    }
    if (depth < depth_min) {
	return depth_min;
    }
    if (depth > depth_max) {
	return depth_max;
    }
    return depth;
}

function draw() {
    let w = canvas.width, h = canvas.height, l = w;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    sierp([(w+l)/2, (h+l)/2], [w/2, (h-l)/2], [(w-l)/2,(h+l)/2], depth());
}

fix_dpi();
draw();
