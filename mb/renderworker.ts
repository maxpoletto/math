let debug = false;

self.onmessage = function (e) {
    const [id, canvas] = [e.data.id, e.data.canvas];
    const [width, height] = [e.data.width, e.data.height];
    const [lx, ly] = [e.data.lx, e.data.ly];
    const [ldx, ldy] = [e.data.ldx, e.data.ldy];
    const [iterMax, hueBase] = [e.data.iterMax, e.data.hueBase];
    const ctx = canvas.getContext('2d');

    let index = 0;
    let x0 = lx + (ldx * id * width);
    for (let cx = 0; cx < width; cx++) {
        let y0 = ly;
        for (let cy = 0; cy < height; cy++) {
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
                const hue = (hueBase - iter) % 360;
                ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            }
            ctx.fillRect(cx, cy, 1, 1);
            y0 += ldy;
        }
        x0 += ldx;
    }
    const bitmap = canvas.transferToImageBitmap();
    self.postMessage({ id: id, dsw: e.data.dsw, dch: e.data.dch, bitmap: bitmap },
        {transfer: [bitmap]});
};
