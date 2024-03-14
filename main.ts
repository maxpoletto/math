const lViewport = document.getElementById('viewport') as HTMLSpanElement;
const lEvent = document.getElementById('event') as HTMLSpanElement;
const canvas = document.getElementById('mandelbrotCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

class Viewport {
    public width: number;
    public height: number;
    public cx: number;
    public cy: number;

    constructor(w: number, h: number, cx: number, cy: number) {
	this.width = w;
	this.height = h;
	this.cx = cx;
	this.cy = cy;
    }
    public upperLeft() : [number, number] {
	return [this.cx - this.width/2, this.cy - this.height/2];
    }
    public toString() : string {
	return `(${this.cx}, ${this.cy}) ` +
	    `[(${this.cx-this.width/2}, ${this.cy-this.height/2}),` +
	    ` (${this.cx+this.width/2}, ${this.cy+this.height/2})]`;
    }
}

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
const zoomFactor = 1.1;
const defaultLogicalWidth = 2.5;
const defaultLogicalCX = -0.75;
const defaultLogicalCY = 0;
let scale = canvas.clientWidth / defaultLogicalWidth;
let logical = new Viewport(defaultLogicalWidth, canvas.clientHeight / scale,
			   defaultLogicalCX, defaultLogicalCY);

let oldCX = logical.cx, oldCY = logical.cy;
let isPanning = false, isZooming = false;
let startX = 0, startY = 0;

function updateURL() {
    const hash = `#${logical.cx},${logical.cy},${scale}`;
    history.replaceState(null, '', hash);
}

function updateLabels(event: MouseEvent) {
    lViewport.textContent = logical.toString();
    lEvent.textContent = `(${event.offsetX}, ${event.offsetY})`;
}

/*
 * Window events (load, resize)
 */

window.addEventListener('load', () => {
    const hash = window.location.hash.substring(1); // Remove the '#'
    const parts = hash.split(',');
    if (parts.length === 3) {
	logical.cx = parseFloat(parts[0]);
	logical.cy = parseFloat(parts[1]);
	scale = parseFloat(parts[2]);
    }
    drawMandelbrot();
});

// TODO: handle resize events

/*
 * Zoom
 */

let zoomTimeout : number;
canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    if (event.deltaY < 0) { // zoom in
	scale *= zoomFactor;
	logical.width /= zoomFactor;
	logical.height /= zoomFactor;
    } else {
	scale /= zoomFactor;
	logical.width *= zoomFactor;
	logical.height *= zoomFactor;
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

/*
 * Panning with the mouse
 */

canvas.addEventListener('mousedown', (event) => {
    isPanning = true;
    startX = event.offsetX;
    startY = event.offsetY;
    oldCX = logical.cx;
    oldCY = logical.cy;
    fastMode();
    drawMandelbrot();
    updateLabels(event);
});

canvas.addEventListener('mousemove', (event) => {
    if (!isPanning) return;
    // changed canvas to client values
    logical.cx = oldCX - (event.offsetX - startX) / scale;
    logical.cy = oldCY - (event.offsetY - startY) / scale;
    updateLabels(event);
    updateURL();
    drawMandelbrot();
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
    preciseMode();
    drawMandelbrot();
});

/*
 * Panning with touch actions
 */

canvas.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    isPanning = true;
    startX = touch.pageX;
    startY = touch.pageY;
    oldCX = logical.cx;
    oldCY = logical.cy;
    fastMode();
    event.preventDefault(); // Prevent scrolling and zooming by the browser
}, { passive: false });

canvas.addEventListener('touchmove', (event) => {
    if (!isPanning) return;
    const touch = event.touches[0];
    logical.cx = oldCX - (touch.pageX - startX) / scale;
    logical.cy = oldCY - (touch.pageY - startY) / scale;
    updateURL();
    drawMandelbrot();
    event.preventDefault(); // Prevent scrolling and zooming by the browser
}, { passive: false });

canvas.addEventListener('touchend', () => {
    isPanning = false;
    preciseMode();
    drawMandelbrot();
});

let initialPinchDistance = -1;

function getDistanceBetweenTouches(event : TouchEvent) {
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    let dx = touch2.pageX - touch1.pageX;
    let dy = touch2.pageY - touch1.pageY;
    return Math.sqrt(dx * dx + dy * dy);
}

canvas.addEventListener('touchmove', (event) => {
    if (event.touches.length == 2) {
	// Prevent default to avoid page zooming and panning in the browser
	event.preventDefault();

	const distance = getDistanceBetweenTouches(event);
	if (initialPinchDistance < 0) {
	    initialPinchDistance = distance;
	} else {
	    const pinchScale = distance / initialPinchDistance;
	    scale *= pinchScale;
	    updateURL();
	    drawMandelbrot();
	    initialPinchDistance = distance;
	}
    }
}, { passive: false });

canvas.addEventListener('touchend', (event) => {
    initialPinchDistance = -1; // Reset initial distance on touch end
    if (!event.touches.length) {
	isPanning = false;
	preciseMode();
	drawMandelbrot();
    }
});

/*
 * Rendering logic
 */

function fastMode() {
    canvas.width = canvas.clientWidth / 10;
    canvas.height = canvas.clientHeight / 10;
}

function preciseMode() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

function drawMandelbrot() {
    if (!ctx) return;
    const iterMax = 360;
    const canvasWidth = canvas.width, canvasHeight = canvas.height;
    const hcw = canvas.width / 2, hch = canvas.height / 2;
    const scw = scale * canvas.width, sch = scale * canvas.height;
    let [lx, ly] = logical.upperLeft();
    let [ldx, ldy] = [logical.width / canvasWidth, logical.height / canvasHeight];
    let x0 = lx;
    for (let cx = 0; cx < canvasWidth; cx++) {
	let y0 = ly;
	for (let cy = 0; cy < canvasHeight; cy++) {
	    let iter = 0;
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
	    y0 += ldy;
	}
	x0 += ldx;
    }
}
