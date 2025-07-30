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

var points, angle, color;
const colors = [];

function init_colors() {
    colors.length = 256*6;
    /*
        https://stackoverflow.com/questions/29229713/iterating-over-rgb-continuously
        Start from 255 0 0, then count up g to 255 255 0,
        then count down red to 0 255 0,
        then count up blue to 0 255 255,
        then count down green to 0 0 255,
        then count up red to 255 0 255,
        then count down blue to 255 0 0.
    */    
    var i = 0;
    for (var j = 0; j <= 255; j++) {
        colors[i] = 'rgb(255,' + j + ',0)';
        i++;
    }
    for (var j = 255; j >= 0; j--) {
        colors[i] = 'rgb(' + j + ',255,0)';
        i++;
    }
    for (var j = 0; j <= 255; j++) {
        colors[i] = 'rgb(0,255,' + j + ')';
        i++;
    }
    for (var j = 255; j >= 0; j--) {
        colors[i] = 'rgb(0,' + j + ',255)';
        i++;
    }
    for (var j = 0; j <= 255; j++) {
        colors[i] = 'rgb(' + j + ',0,255)';
        i++;
    }
    for (var j = 255; j >= 0; j--) {
        colors[i] = 'rgb(255,0,' + j + ')';
        i++;
    }
}

// Inspired by https://aminyakubu.github.io/flower.html
function draw() {
    var w = canvas.width, h = canvas.height;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var x = w/2, y = h/2;
    for (i = 1; i < points; i++) {
        ctx.beginPath();
        if (color) {
            ctx.strokeStyle = colors[i % colors.length];
        }
        var j = i - 1, a = angle/180*Math.PI;
        ctx.moveTo(x + j*Math.sin(j*a), y + j*Math.cos(j*a));
        ctx.lineTo(x + i*Math.sin(i*a), y + i*Math.cos(i*a));
        ctx.stroke();
    }
}

function init() {
    fix_dpi();
    init_colors();
    var a_in = document.getElementById('angle');
    var p_in = document.getElementById('points');
    var c_in = document.getElementById('color');
    var a_out = document.getElementById('angle_span');
    var p_out = document.getElementById('points_span');
    f = function () {
        angle = a_in.value;
        points = p_in.value;
        color = c_in.checked;
        a_out.innerHTML = angle;
        p_out.innerHTML = points;
        draw();
    }
    a_in.oninput = f;
    p_in.oninput = f;
    c_in.oninput = f;
    f();
}

init();
