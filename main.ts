let scale = 1;
const zoomSensitivity = 0.0001;
const zoomFactor = 1.11;
let originX = 0;
let originY = 0;

const canvas = document.getElementById('triangleCanvas') as HTMLCanvasElement;
canvas.width = 500;
canvas.height = 500;
const ctx = canvas.getContext('2d');
canvas.addEventListener('wheel', (event) => {
    event.preventDefault();

    if (event.deltaY < 0) {
	// Zoom in
	scale *= zoomFactor;
//	originX = (1 - zoomFactor) * x + zoomFactor * originX;
//	originY = (1 - zoomFactor) * y + zoomFactor * originY;
    } else {
	// Zoom out
	scale /= zoomFactor;
//	originX = (1 - (1 / zoomFactor)) * x + (1 / zoomFactor) * originX;
//	originY = (1 - (1 / zoomFactor)) * y + (1 / zoomFactor) * originY;
    }

    drawMandelbrot();
});

let isPanning = false;
let startX = 0, startY = 0;

canvas.addEventListener('mousedown', (event) => {
  isPanning = true;
  startX = event.offsetX - originX;
  startY = event.offsetY - originY;
});

canvas.addEventListener('mousemove', (event) => {
  if (!isPanning) return;

  originX = (startX - event.offsetX)/1000/scale;
  originY = (startX - event.offsetY)/1000/scale;
  drawMandelbrot();
});

canvas.addEventListener('mouseup', () => {
  isPanning = false;
});

canvas.addEventListener('mouseleave', () => {
  isPanning = false;
});


function drawMandelbrot() {
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const maxIteration = 360; // Maximum number of iterations per point
    let panX = originX;
    let panY = originY;

    for (let x = 0; x < canvasWidth; x++) {
	for (let y = 0; y < canvasHeight; y++) {
//	    let mx = (x - canvasWidth / 2) / (0.5 * scale * canvasWidth) + panX - 0.5 * scale;
//	    let my = (y - canvasHeight / 2) / (0.5 * scale * canvasHeight) + panY - 0.5 * scale;
	    let mx = (x - canvasWidth / 2) / (0.5 * scale * canvasWidth) + panX;
	    let my = (y - canvasHeight / 2) / (0.5 * scale * canvasHeight) + panY;
	    let iteration = 0;
	    let zx = 0;
	    let zy = 0;
	    while (zx * zx + zy * zy < 4 && iteration < maxIteration) {
		let xtemp = zx * zx - zy * zy + mx;
		zy = 2 * zx * zy + my;
		zx = xtemp;
		iteration++;
	    }
	    // Coloring based on the number of iterations
	    if (iteration == maxIteration) {
		ctx.fillStyle = '#000';
	    } else {
		const hue = (250 - iteration) % 360;
		ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
	    }
	    ctx.fillRect(x, y, 1, 1); // Draw each pixel
	}
    }
}

drawMandelbrot();
