var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var dpi = window.devicePixelRatio;

function fix_dpi() {
    function styleValue(attr) {
        return getComputedStyle(canvas).getPropertyValue(attr).slice(0, -2);
    }
    canvas.setAttribute('width', dpi * styleValue('width'));
    canvas.setAttribute('height', dpi * styleValue('height'));
}

function poly(zx, zy, r, nvert) {
    a = 0
    d = 2 * Math.PI / nvert;
    x = zx + r*Math.cos(a);
    y = zy + r*Math.sin(a);
    ctx.moveTo(x, y);
    ctx.beginPath();
    for (i = 0; i < nvert; i++) {
        x = zx + r*Math.cos(a)
        y = zy + r*Math.sin(a)
        ctx.lineTo(x, y)
        a += d
    }
    ctx.closePath();
    ctx.stroke();
}

var nvert;
function draw() {
    var w = canvas.width, h = canvas.height;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    poly(w / 2, h / 2, w / 3, nvert);
}

function init() {
    fix_dpi();
    var s = document.getElementById('nvert');
    var sv = document.getElementById('nv');
    s.onchange = function () {
        nvert = this.value;
        sv.innerHTML = nvert;
        draw();
    }
    s.onchange();
}

init();
