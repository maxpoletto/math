const lViewport = document.getElementById('viewport') as HTMLSpanElement;
const canvas = document.getElementById('mandelbrotCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

const zoomFactor = 1.1;
const defaultLogicalWidth = 2.5;
const defaultLogicalCX = -0.75;
const defaultLogicalCY = 0;

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
	return `(${this.cx.toFixed(5)}, ${this.cy.toFixed(5)}) ` +
	    `[(${(this.cx-this.width/2).toFixed(5)}, ${(this.cy-this.height/2).toFixed(5)}),` +
	    ` (${(this.cx+this.width/2).toFixed(5)}, ${(this.cy+this.height/2).toFixed(5)})]`;
    }
}

let scale: number;
let oldCX: number;
let oldCY: number;
let startX: number;
let startY: number;
let logical: Viewport;

function updateMetadata() {
    // Update URL
    const hash = `#${logical.cx},${logical.cy},${scale}`;
    history.replaceState(null, '', hash);
    // Update viewport information
    lViewport.textContent = logical.toString();
}

/*
 * Window events (load, resize)
 */

window.addEventListener('load', () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const hash = window.location.hash.substring(1); // Remove the '#'
    const parts = hash.split(',');
    let [x, y] = [defaultLogicalCX, defaultLogicalCY];
    if (parts.length === 3) {
	scale = parseFloat(parts[2]);
	[x, y] = [parseFloat(parts[0]), parseFloat(parts[1])];
    } else {
	scale = canvas.width / defaultLogicalWidth;
    }
    logical = new Viewport(defaultLogicalWidth, canvas.clientHeight / scale, x, y);
    drawMandelbrot();
    isPanning = isZooming = false;
});

window.addEventListener('resize', () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    scale = canvas.width / logical.width;
    logical.height = canvas.height / scale;
    drawMandelbrot();
    isPanning = isZooming = false;
});

/*
 * Zooming (with the mouse wheel)
 */

let isZooming: boolean;
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
 * Panning logic
 */

let isPanning: boolean;
function panStart(x: number, y: number) {
    isPanning = true;
    [startX, startY] = [x, y];
    [oldCX, oldCY] = [logical.cx, logical.cy];
    fastMode();
    drawMandelbrot();
}

function pan(x: number, y: number) {
    if (!isPanning) return;
    logical.cx = oldCX - (x - startX) / scale;
    logical.cy = oldCY - (y - startY) / scale;
    drawMandelbrot();
}

function panEnd() {
    isPanning = false;
    preciseMode();
    drawMandelbrot();
}

/* 
 * Panning with the mouse
 */

canvas.addEventListener('mousedown', (event) => {
    panStart(event.offsetX, event.offsetY);
});

canvas.addEventListener('mousemove', (event) => {
    pan(event.offsetX, event.offsetY);
});

canvas.addEventListener('mouseup', () => {
    panEnd();
});

/*
 * Panning and zooming with touch actions
 */

let initialPinchDistance = -1;
function getDistanceBetweenTouches(event : TouchEvent) {
    const [touch1, touch2] = [event.touches[0], event.touches[1]];
    const [dx, dy] = [touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY];
    return Math.sqrt(dx * dx + dy * dy);
}

canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    if (event.touches.length == 1) {
	const touch = event.touches[0];
	panStart(touch.pageX, touch.pageY);
    } else if (event.touches.length == 2) {
	isZooming = true;
    }
}, { passive: false });

canvas.addEventListener('touchmove', (event) => {
    event.preventDefault();
    if (event.touches.length == 1) {
	const touch = event.touches[0];
	pan(touch.pageX, touch.pageY);
    } else if (event.touches.length == 2) {
	const distance = getDistanceBetweenTouches(event);
	if (initialPinchDistance < 0) {
	    initialPinchDistance = distance;
	} else {
	    const pinchScale = distance / initialPinchDistance;
	    scale *= pinchScale;
	    logical.width /= pinchScale;
	    logical.height /= pinchScale;
	    drawMandelbrot();
	    initialPinchDistance = distance;
	}
    }
}, { passive: false });

canvas.addEventListener('touchend', () => {
    panEnd();
    isZooming = true;
    initialPinchDistance = -1;
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
    updateMetadata();
    const iterMax = 360;
    const canvasWidth = canvas.width, canvasHeight = canvas.height;
    const [ldx, ldy] = [logical.width / canvasWidth, logical.height / canvasHeight];
    let [lx, ly] = logical.upperLeft();
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
