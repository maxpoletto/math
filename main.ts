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
let startX = 0, startY = 0;

function updateURL() {
    const hash = `#${logical.cx},${logical.cy},${scale}`;
    history.replaceState(null, '', hash);
}

// TODO: clean up
function updateLabels(/*event: MouseEvent*/) {
    lViewport.textContent = logical.toString();
//    lEvent.textContent = `(${event.offsetX}, ${event.offsetY})`;
}

function updateMetadata() {
    updateURL();
    updateLabels();
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
 * Zooming
 */

/* Zooming with the mouse wheel */

let isPanning = false, isZooming = false;
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

/* Zooming with touch actions */

let initialPinchDistance = -1;

function getDistanceBetweenTouches(event : TouchEvent) {
    const [touch1, touch2] = [event.touches[0], event.touches[1]];
    const [dx, dy] = [touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY];
    return Math.sqrt(dx * dx + dy * dy);
}

canvas.addEventListener('touchmove', (event) => {
    if (event.touches.length == 2) {
	event.preventDefault();
	const distance = getDistanceBetweenTouches(event);
	if (initialPinchDistance < 0) {
	    initialPinchDistance = distance;
	} else {
	    const pinchScale = distance / initialPinchDistance;
	    scale *= pinchScale;
	    logical.width /= pinchScale;
	    logical.height /= pinchScale;
	    updateMetadata();
	    drawMandelbrot();
	    initialPinchDistance = distance;
	}
    }
}, { passive: false });

canvas.addEventListener('touchend', (event) => {
    initialPinchDistance = -1; // Reset initial distance on touch end
/* // TODO: check if unnecessary
    if (!event.touches.length) {
	isPanning = false;
	preciseMode();
	drawMandelbrot();
    }
*/
});

/*
 * Panning
 */

function panStart(x: number, y: number) {
    isPanning = true;
    [startX, startY] = [x, y];
    [oldCX, oldCY] = [logical.cx, logical.cy];
    fastMode();
    drawMandelbrot();
    updateMetadata();
}

function pan(x: number, y: number) {
    if (!isPanning) return;
    logical.cx = oldCX - (x - startX) / scale;
    logical.cy = oldCY - (y - startY) / scale;
    updateMetadata();
    drawMandelbrot();
}

function panEnd() {
    isPanning = false;
    preciseMode();
    drawMandelbrot();
}

/* Panning with the mouse */

canvas.addEventListener('mousedown', (event) => {
    panStart(event.offsetX, event.offsetY);
});

canvas.addEventListener('mousemove', (event) => {
    pan(event.offsetX, event.offsetY);
});

canvas.addEventListener('mouseup', () => {
    panEnd();
});

/* Panning with touch actions */

canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    const touch = event.touches[0];
    panStart(touch.pageX, touch.pageY);
}, { passive: false });

canvas.addEventListener('touchmove', (event) => {
    event.preventDefault();
    const touch = event.touches[0];
    pan(touch.pageX, touch.pageY);
}, { passive: false });

canvas.addEventListener('touchend', () => {
    panEnd();
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
