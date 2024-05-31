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
        return `[${complexStr(a, b)}, ${complexStr(c, d)}] centered at ${complexStr(this.cx, this.cy)}`;
    }
}

// Renders (x, y) as "(x + iy)".
function complexStr(x, y) {
    return `(${x.toFixed(4)} ` + (y > 0 ? '+' : '-') + ` i${Math.abs(y).toFixed(4)})`;
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

    uniform vec2 u_canvas_dim;
    uniform vec2 u_logical_dim;
    uniform vec2 u_center;
    uniform int u_maxIter;
    uniform float u_hueBase;
    uniform float u_hueMultiplier;
    uniform bool u_grid;
    uniform float u_gridSpacing;


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

    void main() {
        vec2 uv = (gl_FragCoord.xy / u_canvas_dim - vec2(0.5)) * u_logical_dim;
        vec2 c = u_center + uv;

        // Draw grid lines.
        if (u_grid) {
            // Calculate the line thickness in canvas coordinates.
            float lineThicknessCanvas = 1.0; // Line thickness in pixels
            float vLineThicknessLogical = lineThicknessCanvas * (u_logical_dim.x / u_canvas_dim.x);
            float hLineThicknessLogical = lineThicknessCanvas * (u_logical_dim.y / u_canvas_dim.y);
            
            vec2 absC = abs(c);
            vec2 modC = mod(absC, vec2(u_gridSpacing));
            
            // Make the x,y axes twice as thick as the other lines.
            if (modC.x < vLineThicknessLogical || modC.y < hLineThicknessLogical) {
                gl_FragColor = vec4(1.0);
                return;
            }
        }    
        vec2 z = vec2(0.0);
        int nIter = 0;
        for (int i = 0; i < 10000; i++) {
            if (i > u_maxIter) break; // Required because limits in a WebGL for-loop must be constants.
            z = complexSquare(z) + c;
            nIter = i;
            if (dot(z, z) > 4.0) break;
        }

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
    const canvasDimLocation = gl.getUniformLocation(shaderProgram, 'u_canvas_dim')
    const logicalDimLocation = gl.getUniformLocation(shaderProgram, 'u_logical_dim');
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
            clickTimeout = setTimeout(() => {
                if (!mouseUp) {
                    // If this is still the first click after doubleClickDelay,
                    // and the user is still holding the button, start panning.
                    panStart(event.offsetX, event.offsetY);
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
        const [dx, dy] = [t2.pageX - t1.pageX, t2.pageY - t1.pageY];
        return Math.sqrt(dx * dx + dy * dy);
    }

    canvas.addEventListener('touchstart', (event) => {
        event.preventDefault();
        if (recentTouchEnd) return;
        if (event.touches.length == 1) {
            const t = event.touches[0];
            panStart(t.pageX, t.pageY);
        } else if (event.touches.length == 2) {
            firstPinchDist = touchDist(event);
        }
    }, { passive: false });
    canvas.addEventListener('touchmove', (event) => {
        event.preventDefault();
        if (recentTouchEnd) return;
        if (event.touches.length == 1) {
            const t = event.touches[0];
            updatePointer(t.pageX, t.pageY);
            pan(t.pageX, t.pageY);
        }if (event.touches.length == 2) {
            const distance = touchDist(event);
            if (firstPinchDist > 0) { // Zoom around the midpoint of the pinch.
                let [t0, t1] = [event.touches[0], event.touches[1]];
                let [x, y] = [(t0.pageX + t1.pageX) / 2, (t0.pageY + t1.pageY) / 2];
                zoom(x, y, firstPinchDist > distance ? zoomOutSlow : zoomInSlow);
            }
            firstPinchDist = distance;
        }
    }, { passive: false });
    canvas.addEventListener('touchend', () => {
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
