const lCenterX = document.getElementById('centerX') as HTMLSpanElement;
const lCenterY = document.getElementById('centerY') as HTMLSpanElement;
const lEventX = document.getElementById('eventX') as HTMLSpanElement;
const lEventY = document.getElementById('eventY') as HTMLSpanElement;
const lX0 = document.getElementById('x0') as HTMLSpanElement;
const lY0 = document.getElementById('y0') as HTMLSpanElement;
const lX1 = document.getElementById('x1') as HTMLSpanElement;
const lY1 = document.getElementById('y1') as HTMLSpanElement;

const canvas = document.getElementById('mandelbrotCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 800;
let canvasWidth = canvas.width;
let canvasHeight = canvas.height;

let scale = 0.5;
let centerX = -0.5, centerY = 0;
let oldCenterX = centerX, oldCenterY = centerY;
let isPanning = false, isZooming = false;
let startX = 0, startY = 0;
const zoomFactor = 1.1;

function updateURL() {
    const hash = `#${centerX},${centerY},${scale}`;
    history.replaceState(null, '', hash);
}

window.addEventListener('load', () => {
    const hash = window.location.hash.substring(1); // Remove the '#'
    const parts = hash.split(',');
    if (parts.length === 3) {
	centerX = parseFloat(parts[0]);
	centerY = parseFloat(parts[1]);
	scale = parseFloat(parts[2]);
    }
    drawMandelbrot();
});

let zoomTimeout : number;
canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    if (event.deltaY < 0) { // zoom in
	scale *= zoomFactor;
    } else {
	scale /= zoomFactor;
    }    
    updateURL();
    if (!isZooming) {
	isZooming = true;
	fastMode();
    }
    drawMandelbrot();
    clearTimeout(zoomTimeout);

    zoomTimeout = setTimeout(() => {
	isZooming = false;
	preciseMode();
	drawMandelbrot();
    }, 100 /* ms */);
});

function updateLabels(event: MouseEvent) {
    lCenterX.textContent = centerX.toString();
    lCenterY.textContent = centerY.toString();
    lEventX.textContent = event.offsetX.toString(); 
    lEventY.textContent = event.offsetY.toString();
    lX0.textContent = ((0 - canvasWidth / 2) / (scale * canvasWidth) + centerX).toString();
    lY0.textContent = ((0 - canvasHeight / 2) / (scale * canvasHeight) + centerY).toString();
    lX1.textContent = ((canvasWidth-1 - canvasWidth / 2) / (scale * canvasWidth) + centerX).toString();
    lY1.textContent = ((canvasHeight-1 - canvasHeight / 2) / (scale * canvasHeight) + centerY).toString();
}

canvas.addEventListener('mousedown', (event) => {
    isPanning = true;
    startX = event.offsetX;
    startY = event.offsetY;
    oldCenterX = centerX;
    oldCenterY = centerY;
    fastMode();
    drawMandelbrot();
    updateLabels(event);
});

canvas.addEventListener('mousemove', (event) => {
    if (!isPanning) return;
    centerX = oldCenterX - (event.offsetX - startX) / (scale * canvasWidth);
    centerY = oldCenterY - (event.offsetY - startY) / (scale * canvasHeight);
    updateLabels(event);
    updateURL();
    drawMandelbrot();
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
    preciseMode();
    drawMandelbrot();
});

function fastMode() {
    canvas.width = 200;
    canvas.height = 200;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
}

function preciseMode() {
    canvas.width = 800;
    canvas.height = 800;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
}

function drawMandelbrot() {
    if (!ctx) return;
    const iterMax = 360;
    const hcw = canvasWidth / 2, hch = canvasHeight / 2;
    const scw = scale * canvasWidth, sch = scale * canvasHeight;
    for (let cx = 0; cx < canvasWidth; cx++) {
	for (let cy = 0; cy < canvasHeight; cy++) {
	    let iter = 0;
	    let x0 = (cx - hcw) / scw + centerX;
	    let y0 = (cy - hch) / sch + centerY;
	    let x = 0, y = 0, x2 = 0, y2 = 0;
	    while (x2 + y2 < 4 && iter < iterMax) {
		y = (x + x) * y + y0;
		x = x2 - y2 + x0;
		x2 = x * x;
		y2 = y * y;
		iter++;
	    }
	    if (iter == iterMax) {
		ctx.fillStyle = '#000';
	    } else {
		const hue = (250 - iter) % iterMax;
		ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
	    }
	    ctx.fillRect(cx, cy, 1, 1);
	}
    }
}
