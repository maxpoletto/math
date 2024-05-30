// - fix help page
// - deal with mobile scrolling

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
    zoom(canvas, cx, cy, out) {
        let [x, y] = this.pointFromCanvas(canvas, cx, cy);
        let [dx, dy] = [x - this.cx, y - this.cy];
        let z = out ? 1.1 : 0.9;
        [this.width, this.height, dx, dy] = [this.width * z, this.height * z, dx * z, dy * z];
        [this.cx, this.cy] = [x - dx, y - dy];
    }
    pointFromCanvas(canvas, x, y) {
        return [this.width * (x / canvas.width - 0.5) + this.cx, this.cy - this.height * (y / canvas.height - 0.5)];
    }
    toString() {
        return `[(${(this.cx - this.width / 2).toFixed(4)}, ${(this.cy - this.height / 2).toFixed(4)}),` +
            ` (${(this.cx + this.width / 2).toFixed(4)}, ${(this.cy + this.height / 2).toFixed(4)})]`;
    }
}

const vsSource = `
    precision highp float;
    attribute vec2 a_pos;
    void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
    }
`;

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

        // Draw grid lines
        if (u_grid) {
            // Calculate the line thickness in canvas coordinates
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
            if (i > u_maxIter) break;
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

    // Compile and link shaders.
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
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(shaderProgram, 'a_pos');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    }

    // Uniform locations
    const canvasDimLocation = gl.getUniformLocation(shaderProgram, 'u_canvas_dim')
    const logicalDimLocation = gl.getUniformLocation(shaderProgram, 'u_logical_dim');
    const centerLocation = gl.getUniformLocation(shaderProgram, 'u_center');
    const maxIterLocation = gl.getUniformLocation(shaderProgram, 'u_maxIter');
    const hueBaseLocation = gl.getUniformLocation(shaderProgram, 'u_hueBase');
    const hueMultiplierLocation = gl.getUniformLocation(shaderProgram, 'u_hueMultiplier');
    const gridLocation = gl.getUniformLocation(shaderProgram, 'u_grid');
    const gridSpacingLocation = gl.getUniformLocation(shaderProgram, 'u_gridSpacing');

    // Initial values
    let logical, maxIter, hueBase, hueMultiplier, grid;
    let gridSpacing = 0.1;
    let startX, startY, startCenter;
    let isPanning;

    function reset() {
        logical = new Viewport(0, 0, 4, 4);
        maxIter = 250;
        hueBase = 200.0;
        hueMultiplier = 3.0;
        grid = false;
        startCenter = [logical.cx, logical.cy];
        isPanning = false;
    }
    function setURL() {
        const h = `#${logical.cx},${logical.cy},${logical.width},${logical.height},${maxIter},${hueBase},${hueMultiplier},${grid}`;
        history.replaceState(null, '', h);
    }
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

    function setupCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        logical.adjustAspect(canvas.height / canvas.width);
        gl.viewport(0, 0, canvas.width, canvas.height);
        setupVertices();
    }

    function render() {
        setURL();
        viewCoords.textContent = logical.toString();
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

    // Handle interaction (zooming, panning, etc.)
    viewCoords = document.getElementById('viewCoords');
    pointerCoords = document.getElementById('pointerCoords');
    gridCheck = document.getElementById('gridCheck');

    gridCheck.addEventListener('change', (event) => {
        grid = gridCheck.checked;
        render();
    });
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        logical.zoom(canvas, event.offsetX, event.offsetY, event.deltaY > 0);
        render();
    });
    canvas.addEventListener('mousedown', (event) => {
        isPanning = true;
        [startX, startY] = [event.offsetX, event.offsetY];
        startCenter = [logical.cx, logical.cy];
    });
    canvas.addEventListener('mousemove', (event) => {
        let p = logical.pointFromCanvas(canvas, event.offsetX, event.offsetY);
        pointerCoords.textContent = `(${p[0].toFixed(4)}, ${p[1].toFixed(4)})`;
        if (!isPanning) return;
        const dx = (event.offsetX - startX) / canvas.width * logical.width;
        const dy = (event.offsetY - startY) / canvas.height * logical.height;
        logical.cx = startCenter[0] - dx;
        logical.cy = startCenter[1] + dy;
        render();
    });
    canvas.addEventListener('mouseup', (event) => {
        isPanning = false;
    });
    canvas.addEventListener('mouseout', (event) => {
        isPanning = false;
        pointerCoords.textContent = "outside viewport"
    });

    // Handle hue and iteration changes
    hueBaseVal = document.getElementById('hueBaseVal');
    document.getElementById('hueBase').addEventListener('input', (event) => {
        hueBase = +event.target.value;
        hueBaseVal.textContent = event.target.value;
        render();
    });
    hueMultiplierVal = document.getElementById('hueMultiplierVal')
    document.getElementById('hueMultiplier').addEventListener('input', (event) => {
        hueMultiplier = +event.target.value;
        hueMultiplierVal.textContent = event.target.value;
        render();
    });
    maxIterVal = document.getElementById('maxIterVal')
    document.getElementById('maxIter').addEventListener('input', (event) => {
        maxIter = +event.target.value;
        maxIterVal.textContent = event.target.value
        render();
    });
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

    // Help pop-up
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
}

main();
