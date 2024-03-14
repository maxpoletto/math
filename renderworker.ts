self.onmessage = function(e) {
    const stripe = e.data.stripe;
    console.log(`onmessage ${stripe.x1}, ${stripe.x0}`);
    const canvasHeight = e.data.canvasHeight;
    const [lx, ly] = [e.data.lx, e.data.ly];
    const [ldx, ldy] = [e.data.ldx, e.data.ldy];
    const iterMax = e.data.iterMax;

    // Each pixel's iteration count is a 16-bit int.
    const numPixels = (stripe.x1 - stripe.x0) * canvasHeight;
    const buf = new ArrayBuffer(numPixels * 2);
    const view = new Uint16Array(buf);

    let index = 0;
    let x0 = lx + stripe.x0 * ldx;
    for (let cx = stripe.x0; cx < stripe.x1; cx++) {
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
	    view[index++] = iter; // Store the iteration count in the ArrayBuffer
	    y0 += ldy;
	}
	x0 += ldx;
    }
    self.postMessage({ stripeId: stripe.id, buf: buf });
};
