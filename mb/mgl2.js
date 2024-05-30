class Viewport {
    width = 0.0;
    height = 0.0;
    cx = 0.0;
    cy = 0.0;

    constructor(w, h, cx, cy) {
        this.width = w;
        this.height = h;
        this.cx = cx;
        this.cy = cy;
    }
    adjustAspect(heightToWidth) {
        this.height = this.width * heightToWidth;
    }
    zoom(out) {
        this.width *= out ? 1.1 : 0.9;
        this.height *= out ? 1.1 : 0.9;
    }
    pointFromCanvas(c, x, y) {
        return [this.width * (x / c.width - 0.5) + this.cx, this.cy - this.height * (y / c.height - 0.5)];
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

    // Set up the vertex buffer based on the aspect ratio.
    function setupVertices() {
        const aspect = canvas.clientWidth / canvas.clientHeight;
        // Vertices describe two triangles that cover the entire WebGL canvas ([-aspect,-1] -> [aspect,1]).
        const vertices = new Float32Array([
            -aspect, -1.0,
            aspect, -1.0,
            -aspect,  1.0,
            -aspect,  1.0,
            aspect, -1.0,
            aspect,  1.0
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
    let logical = new Viewport(4.0, 4.0, 0.0, 0.0);
    let maxIter = 250;
    let hueBase = 200.0;
    let hueMultiplier = 3.0;

    let grid = false;
    let gridSpacing = 0.25;

    let startX, startY;
    let startCenter = [logical.cx, logical.cy];
    let isPanning = false;

    function setupCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        logical.adjustAspect(canvas.height / canvas.width);
        gl.viewport(0, 0, canvas.width, canvas.height);
        setupVertices();
    }

    function render() {
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
        logical.zoom(event.deltaY > 0);
        viewCoords.textContent = logical.toString();
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
        viewCoords.textContent = logical.toString();
        render();
    });
    canvas.addEventListener('mouseup', (event) => {
        isPanning = false;
    });
    canvas.addEventListener('mouseout', (event) => {
        isPanning = false;
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

    setupCanvas();
    render();
}

main();
