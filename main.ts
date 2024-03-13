const canvas = document.getElementById('triangleCanvas') as HTMLCanvasElement;
const lCenterX = document.getElementById('centerX') as HTMLSpanElement;
const lCenterY = document.getElementById('centerY') as HTMLSpanElement;
const lEventX = document.getElementById('eventX') as HTMLSpanElement;
const lEventY = document.getElementById('eventY') as HTMLSpanElement;
const lX0 = document.getElementById('x0') as HTMLSpanElement;
const lY0 = document.getElementById('y0') as HTMLSpanElement;
const lX1 = document.getElementById('x1') as HTMLSpanElement;
const lY1 = document.getElementById('y1') as HTMLSpanElement;

const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 400;

let scale = 0.5;
let centerX = -0.5, centerY = 0;
let oldCenterX = centerX, oldCenterY = centerY;
let isPanning = false;
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
	drawMandelbrot();
    }
});

canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    if (event.deltaY < 0) { // zoom in
	scale *= zoomFactor;
    } else {
	scale /= zoomFactor;
    }
    updateURL();
    drawMandelbrot();
});

function updateLabels(event: MouseEvent) {
    lCenterX.textContent = centerX.toString();
    lCenterY.textContent = centerY.toString();
    lEventX.textContent = event.offsetX.toString(); 
    lEventY.textContent = event.offsetY.toString();
    lX0.textContent = ((0 - canvas.width / 2) / (scale * canvas.width) + centerX).toString();
    lY0.textContent = ((0 - canvas.height / 2) / (scale * canvas.height) + centerY).toString();
    lX1.textContent = ((canvas.width-1 - canvas.width / 2) / (scale * canvas.width) + centerX).toString();
    lY1.textContent = ((canvas.height-1 - canvas.height / 2) / (scale * canvas.height) + centerY).toString();
}

canvas.addEventListener('mousedown', (event) => {
    isPanning = true;
    startX = event.offsetX;
    startY = event.offsetY;
    oldCenterX = centerX;
    oldCenterY = centerY;
    updateLabels(event);
});

canvas.addEventListener('mousemove', (event) => {
    if (!isPanning) return;
    centerX = oldCenterX - (event.offsetX - startX) / (scale * canvas.width);
    centerY = oldCenterY - (event.offsetY - startY) / (scale * canvas.height);
    updateLabels(event);
    updateURL();
    drawMandelbrot();
});

canvas.addEventListener('mouseup', () => {
  isPanning = false;
});

function drawMandelbrot() {
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const maxIteration = 360; // Maximum number of iterations per point

    for (let cx = 0; cx < canvasWidth; cx++) {
	for (let cy = 0; cy < canvasHeight; cy++) {
	    let iteration = 0;
	    let x0 = (cx - canvasWidth / 2) / (scale * canvasWidth) + centerX;
	    let y0 = (cy - canvasHeight / 2) / (scale * canvasHeight) + centerY;
	    let x = 0, y = 0, x2 = 0, y2 = 0;
	    while (x2 + y2 < 4 && iteration < maxIteration) {
		y = (x+x)*y + y0;
		x = x2 - y2 + x0;
		x2 = x*x;
		y2 = y*y;
		iteration++;
	    }
	    // Coloring based on the number of iterations
	    if (iteration == maxIteration) {
		ctx.fillStyle = '#000';
	    } else {
		const hue = (250 - iteration) % 360;
		ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
	    }
	    ctx.fillRect(cx, cy, 1, 1); // Draw each pixel
	}
    }
}

drawMandelbrot();
