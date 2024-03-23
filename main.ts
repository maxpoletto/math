const lViewport = document.getElementById('viewport') as HTMLSpanElement;
const canvas = document.getElementById('mandelbrotCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

var hueSlider = document.getElementById('hue') as HTMLInputElement;
var hueVal = document.getElementById('hueval') as HTMLSpanElement;
let hueBase = +hueSlider.value;

hueSlider.onchange = function () {
    hueBase = +hueSlider.value;
    hueVal.innerHTML = hueSlider.value;
    drawMandelbrot();
}

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
    console.log("****************");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const hash = window.location.hash.substring(1); // Remove the '#'
    const parts = hash.split(',');
    let [x, y] = [defaultLogicalCX, defaultLogicalCY];
    if (parts.length === 3) {
	scale = parseFloat(parts[2]);
	[x, y] = [parseFloat(parts[0]), parseFloat(parts[1])];
	logical = new Viewport(canvas.width / scale, canvas.height / scale, x, y);
    } else {
	scale = canvas.width / defaultLogicalWidth;
	logical = new Viewport(defaultLogicalWidth, canvas.clientHeight / scale, x, y);
    }
    initWorkers(true);
    drawMandelbrot();
    isPanning = isZooming = false;
});

window.addEventListener('resize', () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    scale = canvas.width / logical.width;
    logical.height = canvas.height / scale;
    initWorkers(true);
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
    clearTimeout(zoomTimeout);
    console.log('wheel');
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

    zoomTimeout = setTimeout(() => {
	console.log('wheel timeout');
	isZooming = false;
	preciseMode();
	drawMandelbrot();
    }, 300 /* ms */);
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
    isZooming = false;
    initialPinchDistance = -1;
});

/*
 * Rendering logic
 */

const iterMax = 360;
const defaultNumWorkers = 4;
let workers: Worker[] = [];
let numWorkers: number = defaultNumWorkers;

function fastMode() {
    canvas.width = canvas.clientWidth / 10;
    canvas.height = canvas.clientHeight / 10;
    initWorkers(false);
}

function preciseMode() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    initWorkers(true);
}

function initWorkers(multi: boolean) {
    if (workers.length > 0) {
	workers.forEach(w => w.terminate());
	workers.length = 0;
    }
    numWorkers = multi ? defaultNumWorkers : 1;
    const [canvasWidth, canvasHeight] = [canvas.width, canvas.height];
    for (let i = 0; i < numWorkers; i++) {
	const worker = new Worker('renderworker.js');
	workers.push(worker);
	worker.onmessage = function(e) {
	    const id = e.data.id;
	    const view = new Uint16Array(e.data.buf);

	    console.log(`main ${id}/${numWorkers}, cw=${canvasWidth}, ch=${canvasHeight}`);

	    let index = 0;
	    for (let cx = id; cx < canvasWidth; cx += numWorkers) {
		for (let cy = 0; cy < canvasHeight; cy++) {
		    const iter = view[index++];
		    if (iter == iterMax) {
			ctx.fillStyle = '#000';
		    } else {
			const hue = (hueBase - iter) % iterMax;
			ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
		    }
		    ctx.fillRect(cx, cy, 1, 1);
		}
	    }
	};
    }
}

function drawMandelbrot() {
    if (!ctx) return;
    updateMetadata();
    const [ldx, ldy] = [logical.width / canvas.width, logical.height / canvas.height];
    let [lx, ly] = logical.upperLeft();
    for (let i = 0; i < numWorkers; i++) {
	workers[i].postMessage({
	    id: i,
	    numWorkers: numWorkers,
	    canvasWidth: canvas.width,
	    canvasHeight: canvas.height,
	    lx: lx,
	    ly: ly,
	    ldx: ldx,
	    ldy: ldy,
	    iterMax: iterMax
	});
    }
}
