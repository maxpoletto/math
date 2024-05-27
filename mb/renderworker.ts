let debug = false;

self.onmessage = function (e) {
    const [id, numWorkers] = [e.data.id, e.data.numWorkers];
    const [canvasWidth, canvasHeight] = [e.data.canvasWidth, e.data.canvasHeight];
    const [lx, ly] = [e.data.lx, e.data.ly];
    const [ldx, ldy] = [e.data.ldx, e.data.ldy];
    const iterMax = e.data.iterMax;

    if (typeof window === 'undefined') {
        console.log("worker render");
    } else {
        console.log("main render");
    }

    // Each pixel's iteration count is a 16-bit int.
    const numPixels = Math.floor(canvasWidth / numWorkers) * canvasHeight;
    const buf = new ArrayBuffer(numPixels * 2);
    const view = new Uint16Array(buf);

    let index = 0;
    let x0 = lx + ldx * id;
    for (let cx = id; cx < canvasWidth; cx += numWorkers) {
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
            view[index++] = iter;
            y0 += ldy;
        }
        x0 += ldx * numWorkers;
    }
    if (debug) {
        console.log(`worker ${id}/${numWorkers}, ldx=${ldx}, x0=${x0} np=${index}/${numPixels} cw=${canvasWidth} ch=${canvasHeight}`);
    }
    self.postMessage({ id: id, buf: buf }, {transfer: [buf]});
};
