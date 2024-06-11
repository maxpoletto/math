// Viewport represents the current logical view of the complex plane.
class Viewport {
    width = 0.0;
    height = 0.0;
    cx = 0.0;
    cy = 0.0;

    constructor(cx, cy, w, h) {
        this.cx = cx;
        this.cy = cy;
        this.width = w;
        this.height = h;
    }
    adjustAspect(heightToWidth) {
        this.height = this.width * heightToWidth;
    }
    // If amt > 1, zooms out; if amt < 1, zooms in.
    zoom(canvas, cx, cy, amt) {
        let [x, y] = this.pointFromCanvas(canvas, cx, cy);
        let [dx, dy] = [x - this.cx, y - this.cy];
        [this.width, this.height, dx, dy] = [this.width * amt, this.height * amt, dx * amt, dy * amt];
        [this.cx, this.cy] = [x - dx, y - dy];
    }
    pointFromCanvas(canvas, x, y) {
        return [this.width * (x / canvas.width - 0.5) + this.cx, this.cy - this.height * (y / canvas.height - 0.5)];
    }
    toString() {
        let [a, b, c, d] = [this.cx - this.width / 2, this.cy - this.height / 2,
                            this.cx + this.width / 2, this.cy + this.height / 2];
        return `Center ${complexStr(this.cx, this.cy)}, width ${this.width.toExponential(10)}`;
    }
}

// Renders (x, y) as "(x + iy)".
function complexStr(x, y) {
    return `(${x.toFixed(10)} ` + (y > 0 ? '+' : '-') + ` i${Math.abs(y).toFixed(10)})`;
}

//
// WebGL code.
//

// Vertex shader. Just passes through the (x, y) position.
const vsSource = `
    precision highp float;
    attribute vec2 a_pos;
    void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
    }
`;

// Fragment shader. Plots the Mandelbrot set in the current viewport.
const fsSource = `
    precision highp float;

    uniform vec2 u_canvasDim;
    uniform vec2 u_logicalDim;
    uniform vec2 u_center;
    uniform int u_maxIter;
    uniform float u_hueBase;
    uniform float u_hueMultiplier;
    uniform bool u_grid;
    uniform float u_gridSpacing;

    // The following library comes from
    // https://github.com/munrocket/double.js/blob/master/webgl/double.glsl
    // by @munrocket.
    //
    // MIT License. © 2021 munrocket

    // ===== BEGIN double.glsl library ===== //

    float add(float a, float b) { return (b != 0.) ? a + b : a; }
    float sub(float a, float b) { return (b != 0.) ? a - b : a; }
    float mul(float a, float b) { return (b != 1.) ? a * b : a; }
    float div(float a, float b) { return (b != 1.) ? a / b : a; }
    float fma(float a, float b, float c) { return a * b + c; }

    vec2 fastTwoSum(float a, float b) {
        float s = add(a, b);
        return vec2(s, sub(b, sub(s, a)));
    }

    vec2 twoSum(float a, float b) {
        float s = add(a, b);
        float b1 = sub(s, a);
        return vec2(s, add(sub(b, b1), sub(a, sub(s, b1))));
    }

    vec2 twoProd(float a, float b) {
        float ab = mul(a, b);
        return vec2(ab, fma(a, b, -ab));
    }

    vec2 add22(vec2 X, vec2 Y) {
        vec2 S = twoSum(X[0], Y[0]);
        vec2 T = twoSum(X[1], Y[1]);
        vec2 V = fastTwoSum(S[0], add(S[1], T[0]));
        return fastTwoSum(V[0], add(T[1], V[1]));
    }

    vec2 sub22(vec2 X, vec2 Y) {
        vec2 S = twoSum(X[0], -Y[0]);
        vec2 T = twoSum(X[1], -Y[1]);
        vec2 V = fastTwoSum(S[0], add(S[1], T[0]));
        return fastTwoSum(V[0], add(T[1], V[1]));
    }

    vec2 mul22(vec2 X, vec2 Y) {
        vec2 S = twoProd(X[0], Y[0]);
        float t = mul(X[0], Y[1]);
        float c = fma(X[1], Y[0], mul(X[0], Y[1]));
        return fastTwoSum(S[0], add(S[1], c));
    }

    vec2 div22(vec2 X, vec2 Y) {
        float s = div(X[0], Y[0]);
        vec2 T = twoProd(s, Y[0]);
        float c = add(sub(sub(X[0], T[0]), T[1]), X[1]);
        return fastTwoSum(s, div(sub(c, mul(s, Y[1])), Y[0]));
    }

    vec2 d(float a) { return vec2(a, 0); }

    // ===== END double.glsl library ===== //

    vec4 dd(vec2 a) { return vec4(d(a.x), d(a.y)); }
    vec4 ddadd(vec4 a, vec4 b) { return vec4(add22(a.xy, b.xy), add22(a.zw, b.zw)); }
    vec4 ddsub(vec4 a, vec4 b) { return vec4(sub22(a.xy, b.xy), sub22(a.zw, b.zw)); }
    vec4 ddmul(vec4 a, vec4 b) { return vec4(mul22(a.xy, b.xy), mul22(a.zw, b.zw)); }
    vec4 dddiv(vec4 a, vec4 b) { return vec4(div22(a.xy, b.xy), div22(a.zw, b.zw)); }

    vec4 dc(vec2 c) { return vec4(c.x, 0, c.y, 0); }

    vec4 dcadd(vec4 a, vec4 b){
        return vec4(add22(a.xy, b.xy), add22(a.zw, b.zw));
    }

    vec4 dcsub(vec4 a, vec4 b){
        return vec4(sub22(a.xy, b.xy), sub22(a.zw, b.zw));
    }

    vec4 dcmul(vec4 a, vec4 b){
        return vec4(sub22(mul22(a.xy, b.xy), mul22(a.zw, b.zw)),
                    add22(mul22(a.xy, b.zw), mul22(a.zw, b.xy)));
    }

    vec2 dclen(vec4 a) {
        return add22(mul22(a.xy, a.xy), mul22(a.zw, a.zw));
    }

    vec2 complexSquare(vec2 c) {
        return vec2(c.x * c.x - c.y * c.y, 2.0 * c.x * c.y);
    }

    // Converts (hue, saturation, brightness) to RGB for rendering.
    // See https://en.wikipedia.org/wiki/Hue for details.
    // Algorithm suggested by GPT-4o.
    vec3 hsb2rgb(float h, float s, float b) {
        // Chroma ("intensity of color")
        float c = b * s;
        // Chroma scaled by the position of the hue value within each of
        // six sections of the color wheel.
        float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
        // Brightness "adjustment factor".
        float m = b - c;
        vec3 rgb;
        if (h < 1.0 / 6.0) {
            rgb = vec3(c, x, 0.0); // Red to Yellow
        } else if (h < 2.0 / 6.0) {
            rgb = vec3(x, c, 0.0); // Yellow to Green
        } else if (h < 3.0 / 6.0) {
            rgb = vec3(0.0, c, x); // Green to Cyan
        } else if (h < 4.0 / 6.0) {
            rgb = vec3(0.0, x, c); // Cyan to Blue
        } else if (h < 5.0 / 6.0) {
            rgb = vec3(x, 0.0, c); // Blue to Magenta
        } else {
            rgb = vec3(c, 0.0, x); // Magenta to Red
        }
        // Adjust the brightness.
        return rgb + m;
    }

    int single_precision() {
        vec2 uv = (gl_FragCoord.xy / u_canvasDim - vec2(0.5)) * u_logicalDim;
        vec2 c = u_center + uv;
        vec2 z = vec2(0.0);
        int nIter = 0;
        for (int i = 0; i < 20000; i++) {
            if (i > u_maxIter) break; // Required because limits in a WebGL for-loop must be constants.
            z = complexSquare(z) + c;
            nIter = i;
            if (dot(z, z) > 4.0) break;
        }
        return nIter;
    }

    int double_precision() {
        vec4 d_fragCoord = dd(vec2(float(gl_FragCoord.x), float(gl_FragCoord.y)));
        vec4 d_canvasDim = dd(u_canvasDim);
        vec4 d_logicalDim = dd(u_logicalDim);
        vec4 d_center = dd(u_center);
        vec4 d_half = dd(vec2(0.5));
        vec4 d_uv = ddmul(ddsub(dddiv(d_fragCoord, d_canvasDim), d_half), d_logicalDim);
        vec4 d_c = ddadd(d_center, d_uv);
        vec4 d_z = dd(vec2(0.0));
        int nIter = 0;
        for (int i = 0; i < 20000; i++) {
            if (i > u_maxIter) break; // Required because limits in a WebGL for-loop must be constants.
            d_z = dcadd(dcmul(d_z, d_z), d_c);
            nIter = i;
            if (dclen(d_z).x > 4.0) break;
        }
        return nIter;
    }
    void main() {
        if (u_grid) { // Draw grid lines.
            // Calculate the line thickness in canvas coordinates.
            float lineThicknessCanvas = 1.0; // Line thickness in pixels
            float vLineThicknessLogical = lineThicknessCanvas * (u_logicalDim.x / u_canvasDim.x);
            float hLineThicknessLogical = lineThicknessCanvas * (u_logicalDim.y / u_canvasDim.y);
            
            vec2 uv = (gl_FragCoord.xy / u_canvasDim - vec2(0.5)) * u_logicalDim;
            vec2 c = u_center + uv;
            vec2 absC = abs(c);
            vec2 modC = mod(absC, vec2(u_gridSpacing));

            // Make the x,y axes twice as thick as the other lines.
            if (modC.x < vLineThicknessLogical || modC.y < hLineThicknessLogical) {
                gl_FragColor = vec4(1.0);
                return;
            }
        }

        bool high_precision = u_logicalDim.x < 1e-4;
        int nIter = high_precision ? double_precision() : single_precision();        
        float hue = mod(u_hueBase - float(nIter) * u_hueMultiplier, 360.0) / 360.0;
        float brightness = nIter < u_maxIter ? 1.0 : 0.0;
        vec3 color = hsb2rgb(hue, 1.0, brightness);

        gl_FragColor = vec4(color, 1.0);
    }
`;

function main() {
    const canvas = document.getElementById('mandelbrotCanvas');
    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.error("Your browser does not support WebGL, falling back to experimental-webgl");
        gl = canvas.getContext('experimental-webgl');
    }
    if (!gl) {
        alert("Your browser does not support WebGL");
        return;
    }

    //
    // WebGL initialization.
    //

    function compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function setupVertices() {
        // Vertices describe two triangles that cover the entire WebGL canvas.
        const vertices = new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            -1.0, 1.0,
            1.0, -1.0,
            1.0, 1.0
        ]);
        // Create buffer to store data on GPU.
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // Upload vertex data to the vertexBuffer.
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(shaderProgram, 'a_pos');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    }

    // Compile and link shaders into a WebGL program, then initialize vertex buffers.
    const vertexShader = compileShader(gl, vsSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error("Unable to initialize the shader program: " + gl.getProgramInfoLog(shaderProgram));
        return;
    }
    gl.useProgram(shaderProgram);
    setupVertices();

    // Uniform locations (I/O ports between Javascript and WebGL).
    const canvasDimLocation = gl.getUniformLocation(shaderProgram, 'u_canvasDim');
    const logicalDimLocation = gl.getUniformLocation(shaderProgram, 'u_logicalDim');
    const centerLocation = gl.getUniformLocation(shaderProgram, 'u_center');
    const maxIterLocation = gl.getUniformLocation(shaderProgram, 'u_maxIter');
    const hueBaseLocation = gl.getUniformLocation(shaderProgram, 'u_hueBase');
    const hueMultiplierLocation = gl.getUniformLocation(shaderProgram, 'u_hueMultiplier');
    const gridLocation = gl.getUniformLocation(shaderProgram, 'u_grid');
    const gridSpacingLocation = gl.getUniformLocation(shaderProgram, 'u_gridSpacing');

    //
    // Core Javascript drawing logic.
    //

    // Parameters that control plot appearance.
    let logical, maxIter, hueBase, hueMultiplier, grid;
    let startX, startY, startCenter;
    let isPanning;
    const gridSpacing = 0.1;
    const zoomOutDefault = 1.1, zoomInDefault = 0.9, zoomInFast = 0.7, zoomInSlow = 0.96, zoomOutSlow = 1.04;
    const inputTimeoutMs = 200, touchTimeoutMs = 100;

    // Resets parameters to default values.
    function reset() {
        logical = new Viewport(0, 0, 4, 4);
        maxIter = 250;
        hueBase = 200.0;
        hueMultiplier = 3.0;
        grid = false;
        startCenter = [logical.cx, logical.cy];
        isPanning = false;
    }

    // Encodes parameters as a URL hash.
    function setURL() {
        const h = `#${logical.cx},${logical.cy},${logical.width},${logical.height},${maxIter},${hueBase},${hueMultiplier},${grid}`;
        history.replaceState(null, '', h);
    }
    // Decodes parameters from the URL.
    function getURL() {
        const h = window.location.hash.substring(1).split(','); // Remove the '#', split on comma.
        if (h.length != 8) {
            reset();
            render();
            return;
        }
        for (i = 0; i < 7; i++) {
            n = parseFloat(h[i]);
            if (n !== n) { // NaN is the only value not equal to itself
                reset();
                render();
                return;
            }
        }
        logical = new Viewport(parseFloat(h[0]), parseFloat(h[1]), parseFloat(h[2]), parseFloat(h[3]));
        maxIter = +h[4];
        hueBase = parseFloat(h[5]);
        hueMultiplier = parseFloat(h[6]);
        grid = (h[7] == "true");
    }
    // Displays current parameter values in UI controls (sliders, etc.).
    function setControls() {
        viewCoords.textContent = logical.toString();
        hueBaseSlider.value = hueBase;
        hueBaseStr.textContent = `${hueBase}`;
        hueMultiplierSlider.value = hueMultiplier;
        hueMultiplierStr.textContent = `${hueMultiplier}`;
        maxIterSlider.value = maxIter;
        maxIterStr.textContent = `${maxIter}`;
        gridCheck.checked = grid;
    }
    // Displays pointer position in UI.
    function updatePointer(ex, ey) {
        let [x, y] = logical.pointFromCanvas(canvas, ex, ey);
        pointerCoords.textContent = complexStr(x, y);
    }
    // Adjusts canvas dimensions and viewports (e.g., in response to a resize event).
    function setupCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        logical.adjustAspect(canvas.height / canvas.width);
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    // Sets up all rendering parameters and passes control to WebGL.
    function render() {
        setControls();

        gl.uniform2f(canvasDimLocation, canvas.clientWidth, canvas.clientHeight);
        gl.uniform2f(logicalDimLocation, logical.width, logical.height);
        gl.uniform2f(centerLocation, logical.cx, logical.cy);
        gl.uniform1i(maxIterLocation, maxIter);
        gl.uniform1f(hueBaseLocation, hueBase);
        gl.uniform1f(hueMultiplierLocation, hueMultiplier);
        gl.uniform1i(gridLocation, grid);
        gl.uniform1f(gridSpacingLocation, gridSpacing);

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function panStart(ex, ey) {
        isPanning = true;
        [startX, startY] = [ex, ey];
        startCenter = [logical.cx, logical.cy];
    }
    function pan(ex, ey) {
        const dx = (ex - startX) / canvas.width * logical.width;
        const dy = (ey - startY) / canvas.height * logical.height;
        logical.cx = startCenter[0] - dx;
        logical.cy = startCenter[1] + dy;
        render();
    }
    function panEnd() {
        isPanning = false;
        setURL();
    }
    function zoom(ex, ey, amt) {
        logical.zoom(canvas, ex, ey, amt);
        render();
    }

    //
    // Event handlers for metadata controls.
    //

    viewCoords = document.getElementById('viewCoords');
    pointerCoords = document.getElementById('pointerCoords');
    gridCheck = document.getElementById('gridCheck');
    gridCheck.addEventListener('change', (event) => {
        grid = gridCheck.checked;
        render();
    });
    hueBaseStr = document.getElementById('hueBaseStr');
    hueBaseSlider = document.getElementById('hueBaseSlider');
    hueBaseSlider.addEventListener('input', (event) => {
        hueBase = +event.target.value;
        hueBaseStr.textContent = event.target.value;
        render();
    });
    hueMultiplierStr = document.getElementById('hueMultiplierStr');
    hueMultiplierSlider = document.getElementById('hueMultiplierSlider');
    hueMultiplierSlider.addEventListener('input', (event) => {
        hueMultiplier = +event.target.value;
        hueMultiplierStr.textContent = event.target.value;
        render();
    });
    maxIterStr = document.getElementById('maxIterStr');
    maxIterSlider = document.getElementById('maxIterSlider');
    maxIterSlider.addEventListener('input', (event) => {
        maxIter = +event.target.value;
        maxIterStr.textContent = event.target.value
        render();
    });

    //
    // Event handlers for mouse and keyboard controls.
    //

    let wheelTimeout = null;
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
            // Only update the URL if the wheel pauses for a while.
            setURL();
        }, inputTimeoutMs)
        zoom(event.offsetX, event.offsetY, event.deltaY > 0 ? zoomOutDefault : zoomInDefault);
    });
    let clickTimeout = null, lastClickMs = 0, mouseUp = false;
    const doubleClickDelay = 250;
    canvas.addEventListener('mousedown', (event) => {
        const now = Date.now();
        const delta = now - lastClickMs;
        updatePointer(event.offsetX, event.offsetY);
        if (delta < doubleClickDelay) { // Double-click.
            clearTimeout(clickTimeout); // Prevent single-click action just in case.
            lastClickMs = 0;
            zoom(event.offsetX, event.offsetY, zoomInFast);
        } else { // Single click or first of a double-click.
            lastClickMs = now;
            mouseUp = false;
            let [x, y] = [event.offsetX, event.offsetY];
            clickTimeout = setTimeout(() => {
                if (!mouseUp) {
                    // If this is still the first click after doubleClickDelay,
                    // and the user is still holding the button, start panning.
                    panStart(x, y);
                }
            }, doubleClickDelay);
        }
    });
    canvas.addEventListener('mousemove', (event) => {
        updatePointer(event.offsetX, event.offsetY);
        if (!isPanning) return;
        pan(event.offsetX, event.offsetY);
    });
    canvas.addEventListener('mouseup', (event) => {
        mouseUp = true;
        panEnd();
    });
    canvas.addEventListener('mouseout', (event) => {
        pointerCoords.textContent = "outside viewport"
        panEnd();
    });
    let keydownTimeout = null;
    canvas.addEventListener('keydown', (event) => {
        clearTimeout(keydownTimeout);
        keydownTimeout = setTimeout(() => {
            // Only update the URL if keystrokes pause for a while.
            setURL();
        }, inputTimeoutMs)
        const d = 20; // Pan around by 1/20th of the current axis length.
        switch (event.key) {
            case 'ArrowUp':
                logical.cy += logical.height / d;
                break;
            case 'ArrowDown':
                logical.cy -= logical.height / d;
                break;
            case 'ArrowLeft':
                logical.cx -= logical.width / d;
                break;
            case 'ArrowRight':
                logical.cx += logical.width / d;
                break;
            case '=':
            case '+': // Some keyboards may require this
                zoom(canvas.width / 2, canvas.height / 2, zoomInDefault);
                return;
            case '-':
                zoom(canvas.width / 2, canvas.height / 2, zoomOutDefault);
                return;
            default:
                return;
        }
        render();
    });

    //
    // Event handlers for touch controls.
    //

    let firstPinchDist = -1;
    let recentTouchEnd = false;
    function touchDist(event) {
        const [t1, t2] = [event.touches[0], event.touches[1]];
        const [dx, dy] = [t2.clientX - t1.clientX, t2.clientY - t1.clientY];
        return Math.sqrt(dx * dx + dy * dy);
    }

    canvas.addEventListener('touchstart', (event) => {
        event.preventDefault();
        if (recentTouchEnd) return;
        if (event.touches.length == 1) {
            const t = event.touches[0];
            panStart(t.clientX, t.clientY);
        } else if (event.touches.length == 2) {
            firstPinchDist = touchDist(event);
        }
    }, { passive: false });
    canvas.addEventListener('touchmove', (event) => {
        event.preventDefault();
        if (recentTouchEnd) return;
        if (event.touches.length == 1) {
            const t = event.touches[0];
            updatePointer(t.clientX, t.clientY);
            pan(t.clientX, t.clientY);
        }if (event.touches.length == 2) {
            const distance = touchDist(event);
            if (firstPinchDist > 0) { // Zoom around the midpoint of the pinch.
                let [t0, t1] = [event.touches[0], event.touches[1]];
                let [x, y] = [(t0.clientX + t1.clientX) / 2, (t0.clientY + t1.clientY) / 2];
                zoom(x, y, firstPinchDist > distance ? zoomOutSlow : zoomInSlow);
            }
            firstPinchDist = distance;
        }
    }, { passive: false });
    canvas.addEventListener('touchend', () => {
        event.preventDefault();
        panEnd();
        firstPinchDist = -1;
        recentTouchEnd = true;
        setTimeout(() => {
            // Ignore touches briefly to avoid spurious random jumps when
            // fingers do not leave the screen at exactly the same time.
            recentTouchEnd = false;
        }, touchTimeoutMs)
    });

    //
    // Event handlers for window events.
    //

    window.addEventListener('load', () => {
        getURL();
        setupCanvas();
        render();
    });
    window.addEventListener('hashchange', () => {
        getURL();
        setupCanvas();
        render();
    });
    window.addEventListener('resize', () => {
        setupCanvas();
        render();
    });

    //
    // Help pop-up.
    //

    const helpLink = document.getElementById('helpLink');
    const helpPopup = document.getElementById('helpPopup');
    const closeButton = document.querySelector('.popup .close');

    helpLink.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior
        helpPopup.style.display = 'block';
    });
    closeButton.addEventListener('click', () => {
        helpPopup.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
        if (event.target == helpPopup) {
            helpPopup.style.display = 'none';
        }
    });
    window.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'Escape':
                if (helpPopup.style.display != 'none') {
                    helpPopup.style.display = 'none';
                }
        }
    });
}

main();
