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
    //drawMandelbrot();
});

var iterSlider = document.getElementById('iter') as HTMLInputElement;
var iterVal = document.getElementById('iterval') as HTMLSpanElement;
let iterMax = +iterSlider.value;
iterSlider.addEventListener('input', () => {
    iterMax = +iterSlider.value;
    iterVal.textContent = iterSlider.value;
});
iterSlider.addEventListener('change', () => {
    //    drawMandelbrot();
});

function setupHelp() : void {
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

const vsSource = `
    precision highp float;
    attribute vec2 a_pos;
    void main() {
        gl_Position = vec4(a_pos.x, a_pos.y, 0.0, 1.0);
    }
`;

const fsSource = `
    precision highp float;

    uniform vec2 u_center;
    uniform int u_maxIter;

    vec2 f(vec2 x, vec2 c) {
        return mat2(x, -x.y, x.x) * x + c;
    }
    vec3 hsb2rgb(vec3 c){
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    void main() {
        vec2 uv = gl_FragCoord.xy / vec2(800.0, 800.0);
        vec2 c = u_center + uv * 4.0 - vec2(2.0);
        vec2 x = vec2(0.0);
        bool escaped = false;
        int iterations = 0;    
        for (int i = 0; i < 10000; i++) {
            if (i > u_maxIter) break;
            iterations = i;
            x = f(x, c);
            if (length(x) > 2.0) {
                escaped = true;
                break;
            }
        }
        gl_FragColor = escaped ? vec4(hsb2rgb(vec3(float(iterations), 1.0, 0.5)), 1.0) : vec4(vec3(0.0), 1.0);
    }
`;

function main() {
    console.log('main');
    setupHelp();

    if (window.WebGLRenderingContext) {
        console.log('browser supports WebGL');
    }
    var dispCanvas = document.getElementById('mandelbrotCanvas') as HTMLCanvasElement;
    console.log(dispCanvas);
    var gl = dispCanvas.getContext('webgl');
    if (!gl) {
        throw new Error("Could not get WebGL context");
    }

    var vshader = gl.createShader(gl.VERTEX_SHADER);
    var fshader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vshader, vsSource);
    gl.shaderSource(fshader, fsSource);
    gl.compileShader(vshader);
    gl.compileShader(fshader);
    var prog = gl.createProgram();
    gl.attachShader(prog, vshader);
    gl.attachShader(prog, fshader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    /* create a vertex buffer for a full-screen triangle ??? */
    var vertex_buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    
    /* set up the position attribute */
    var position_attrib_location = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(position_attrib_location);
    gl.vertexAttribPointer(position_attrib_location, 2, gl.FLOAT, false, 0, 0);

    var center_uniform = gl.getUniformLocation(prog, "u_center");
    var max_iterations_uniform = gl.getUniformLocation(prog, "u_maxIter");
    
    var center = [0.0, 0.0];
    var max_iterations = 500;
        
    var renderFrame = function () {
        console.log(`renderframe (${logical.cx}, ${logical.cy})`);
        gl.uniform2f(center_uniform, logical.cx, logical.cy);
        gl.uniform1i(max_iterations_uniform, max_iterations);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

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

    let lastClickMs = 0;
    let doubleClickDelay = 250;
    let clickTimeout : number = null;
    let isPanning: boolean;
    function panStart(x: number, y: number): void {
        isPanning = true;
        [startX, startY] = [x, y];
        [oldCX, oldCY] = [logical.cx, logical.cy];
        renderFrame();
    }
    
    function pan({ x, y }: { x: number; y: number; }): void {
        logical.cx = oldCX - (x - startX) / scale;
        logical.cy = oldCY - (y - startY) / scale;
        renderFrame();
    }
    
    function panEnd(): void {
        renderFrame();
        isPanning = false;
    }

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
    
    function startup() : void {
        console.log('window.load');
//        dispCanvas.width = dispCanvas.clientWidth;
//        dispCanvas.height = dispCanvas.clientHeight;
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
        isPanning = false; //also isZooming
        renderFrame();
    }
    
    window.addEventListener('resize', () => {
        dispCanvas.width = dispCanvas.clientWidth;
        dispCanvas.height = dispCanvas.clientHeight;
        scale = dispCanvas.width / logical.width;
        logical.height = dispCanvas.height / scale;
        isPanning = false; //also isZooming
        renderFrame();
    });
   startup();
}

main();
