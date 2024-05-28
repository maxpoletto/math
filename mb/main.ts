const dispCanvas = document.getElementById('mandelbrotCanvas') as HTMLCanvasElement;
const ctx = dispCanvas.getContext('2d');

const lViewport = document.getElementById('viewport') as HTMLSpanElement;
const lCurPos = document.getElementById('curlogical') as HTMLSpanElement;

var hueSlider = document.getElementById('hue') as HTMLInputElement;
var hueVal = document.getElementById('hueval') as HTMLSpanElement;
let hueBase = +hueSlider.value;
hueSlider.addEventListener('input', () => {
    hueBase = +hueSlider.value;
    hueVal.textContent = hueSlider.value;
});
hueSlider.addEventListener('change', () => {
    drawMandelbrot();
});

var iterSlider = document.getElementById('iter') as HTMLInputElement;
var iterVal = document.getElementById('iterval') as HTMLSpanElement;
let iterMax = +iterSlider.value;
iterSlider.addEventListener('input', () => {
    iterMax = +iterSlider.value;
    iterVal.textContent = iterSlider.value;
});
iterSlider.addEventListener('change', () => {
    drawMandelbrot();
});

const zoomFactor = 1.1;
const defaultLogicalWidth = 2.5;
const defaultLogicalCX = -0.75;
const defaultLogicalCY = 0;

let debug = false;

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
    public pointFromCanvas(c: HTMLCanvasElement, x: number, y: number): [number, number] {
        let z = c.clientWidth / this.width;
        return [x / z + this.cx - this.width / 2, y / z + this.cy - this.height / 2];
    }
    public upperLeft(): [number, number] {
        return [this.cx - this.width / 2, this.cy - this.height / 2];
    }
    public toString(): string {
        return `[(${(this.cx - this.width / 2).toFixed(4)}, ${(this.cy - this.height / 2).toFixed(4)}),` +
            ` (${(this.cx + this.width / 2).toFixed(4)}, ${(this.cy + this.height / 2).toFixed(4)})]`;
    }
}

let scale: number;
let oldCX: number;
let oldCY: number;
let startX: number;
let startY: number;
let logical: Viewport;

function showPos(xy: [number, number]) {
    lCurPos.textContent = `(${xy[0].toFixed(4)}, ${xy[1].toFixed(4)})`;
}
function updateMetadata() {
    // Update URL
    const hash = `#${logical.cx},${logical.cy},${scale},${iterMax},${hueBase}`;
    history.replaceState(null, '', hash);
    // Update viewport information
    lViewport.textContent = logical.toString();
}

/*
 * Window events (load, resize)
 */

window.addEventListener('load', () => {
    dispCanvas.width = dispCanvas.clientWidth;
    dispCanvas.height = dispCanvas.clientHeight;
    const hash = window.location.hash.substring(1); // Remove the '#'
    const parts = hash.split(',');
    let [x, y] = [defaultLogicalCX, defaultLogicalCY];
    if (parts.length === 5) {
        [x, y] = [parseFloat(parts[0]), parseFloat(parts[1])];
        scale = parseFloat(parts[2]);
        logical = new Viewport(dispCanvas.width / scale, dispCanvas.height / scale, x, y);
        iterMax = parseFloat(parts[3]);
        iterSlider.value = iterMax.toString();
        iterVal.textContent = iterMax.toString();
        hueBase = parseFloat(parts[4]);
        hueSlider.value = hueBase.toString();
        hueVal.textContent = hueBase.toString();
    } else {
        scale = dispCanvas.width / defaultLogicalWidth;
        logical = new Viewport(defaultLogicalWidth, dispCanvas.clientHeight / scale, x, y);
    }
    initWorkers(10);
    drawMandelbrot();
    isPanning = isZooming = false;
});

window.addEventListener('resize', () => {
    dispCanvas.width = dispCanvas.clientWidth;
    dispCanvas.height = dispCanvas.clientHeight;
    scale = dispCanvas.width / logical.width;
    logical.height = dispCanvas.height / scale;
    initWorkers(10);
    drawMandelbrot();
    isPanning = isZooming = false;
});

/*
 * Zooming (with the mouse wheel)
 */

let isZooming: boolean;
let zoomTimeout: number;
dispCanvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    clearTimeout(zoomTimeout);
    let [x, y] = logical.pointFromCanvas(dispCanvas, event.offsetX, event.offsetY);
    let [dx, dy] = [x - logical.cx, y - logical.cy];
    if (event.deltaY < 0) { // zoom in
        scale *= zoomFactor;
        logical.width /= zoomFactor;
        logical.height /= zoomFactor;
        dx /= zoomFactor;
        dy /= zoomFactor;
    } else {
        scale /= zoomFactor;
        logical.width *= zoomFactor;
        logical.height *= zoomFactor;
        dx *= zoomFactor;
        dy *= zoomFactor;
    }
    [logical.cx, logical.cy] = [x - dx, y - dy];
    if (!isZooming) {
        isZooming = true;
        fastMode();
    }
    drawMandelbrot();

    zoomTimeout = setTimeout(() => {
        isZooming = false;
        preciseMode();
        drawMandelbrot();
    }, 300 /* ms */);
});

/*
 * Zooming (with doubleclick)
 */

dispCanvas.addEventListener('dblclick', (event) => {
    event.preventDefault();
    clearTimeout(clickTimeout); // Prevent single-click action just in case
    lastClickMs = 0;
    let [x, y] = logical.pointFromCanvas(dispCanvas, event.offsetX, event.offsetY);
    let [dx, dy] = [x - logical.cx, y - logical.cy];
    dx /= zoomFactor;
    dy /= zoomFactor;
    scale *= zoomFactor;
    logical.width /= zoomFactor;
    logical.height /= zoomFactor;
    [logical.cx, logical.cy] = [x - dx, y - dy];
    drawMandelbrot();
});

/*
 * Panning logic
 */

let isPanning: boolean;
function panStart(x: number, y: number): void {
    isPanning = true;
    [startX, startY] = [x, y];
    [oldCX, oldCY] = [logical.cx, logical.cy];
    fastMode();
    drawMandelbrot();
}

function pan({ x, y }: { x: number; y: number; }): void {
    logical.cx = oldCX - (x - startX) / scale;
    logical.cy = oldCY - (y - startY) / scale;
    drawMandelbrot();
}

function panEnd(): void {
    isPanning = false;
    preciseMode();
    drawMandelbrot();
}

/* 
 * Panning with the mouse
 */

let lastClickMs = 0;
let doubleClickDelay = 250;
let clickTimeout : number = null;
dispCanvas.addEventListener('mousedown', (event) => {
    const now = Date.now();
    const delta = now - lastClickMs;
    if (delta < doubleClickDelay) {
        // Handle as a double-click
        clearTimeout(clickTimeout);
        lastClickMs = 0;
    } else {
        lastClickMs = now;
        clickTimeout = setTimeout(() => {
            panStart(event.offsetX, event.offsetY);
            lastClickMs = 0; // Reset after action
        }, doubleClickDelay);
    }
});

dispCanvas.addEventListener('mousemove', (event) => {
    showPos(logical.pointFromCanvas(dispCanvas, event.offsetX, event.offsetY));
    if (!isPanning) return;
    pan({ x: event.offsetX, y: event.offsetY });
});

dispCanvas.addEventListener('mouseup', () => {
    if (!isPanning) return;
    panEnd();
});

/*
 * Panning and zooming with touch actions
 */

let initialPinchDistance = -1;
function getDistanceBetweenTouches(event: TouchEvent): number {
    const [touch1, touch2] = [event.touches[0], event.touches[1]];
    const [dx, dy] = [touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY];
    return Math.sqrt(dx * dx + dy * dy);
}

dispCanvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    if (event.touches.length == 1) {
        const touch = event.touches[0];
        panStart(touch.pageX, touch.pageY);
    } else if (event.touches.length == 2) {
        isZooming = true;
    }
}, { passive: false });

dispCanvas.addEventListener('touchmove', (event) => {
    event.preventDefault();
    if (event.touches.length == 1) {
        const touch = event.touches[0];
        pan({ x: touch.pageX, y: touch.pageY });
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

dispCanvas.addEventListener('touchend', () => {
    panEnd();
    isZooming = false;
    initialPinchDistance = -1;
});

/*
 * Rendering logic
 *
 * We have a display canvas with dimensions dcw x dch and
 * an off-screen canvas with dimensions ocw x och.
 * ocw and och may be much smaller than dcw and dch to speed up
 * panning and zooming.
 * 
 * With N workers, the off-screen canvas is divided into stripes of
 * dimension osw x och, where osw = ocw / N. Each strip is mapped
 * to a corresponding strip of dimension dsw x dch in the display
 * canvas.
 */

let fast : boolean = false;
let workers: Worker[] = [];
let numWorkers: number = Math.min(10, Math.max(navigator.hardwareConcurrency - 1, 2));

function fastMode(): void {
    console.log("fast mode");
    initWorkers(numWorkers);
    fast = true;
}

function preciseMode(): void {
    console.log("precise mode");
    initWorkers(numWorkers);
    fast = false;
}

function initWorkers(n : number): void {
    if (workers.length > 0) {
        workers.forEach(w => w.terminate());
        workers.length = 0;
    }
    for (let i = 0; i < n; i++) {
        const worker = new Worker('renderworker.js');
        worker.onmessage = function (e) {
            if (!ctx) return;
            ctx.drawImage(e.data.bitmap, e.data.dx0, 0, e.data.dx1 - e.data.dx0, e.data.dch);
        };
        workers.push(worker);
    }
}

function drawMandelbrot() {
    if (!ctx) return;
    updateMetadata();
    let [ocw, och] = [dispCanvas.width, dispCanvas.height];
    if (fast) {
        [ocw, och] = [Math.round(ocw/10), Math.round(och/10)];
    }
    const nw = workers.length
    const [ldx, ldy] = [logical.width / ocw, logical.height / och];
    let [lx, ly] = logical.upperLeft();
    const dsw = Math.round(dispCanvas.width / nw);
    for (let i = 0; i < nw; i++) {
        const [dx0, dx1] = [dsw * i, dsw * (i + 1)];
        let [ox0, ox1] = [dx0, dx1];
        if (fast) {
            [ox0, ox1] = [Math.round(ox0/10), Math.round(ox1/10)];
        }
        const osw = ox1 - ox0;
        const stripe = new OffscreenCanvas(osw, och);
        workers[i].postMessage({
            canvas: stripe,
            ox0: ox0,
            ox1: ox1,
            och: och,
            dx0: dx0,
            dx1: dx1,
            dch: dispCanvas.height,
            lx: lx,
            ly: ly,
            ldx: ldx,
            ldy: ldy,
            iterMax: iterMax,
            hueBase: hueBase
        }, [stripe]);
    }
}
