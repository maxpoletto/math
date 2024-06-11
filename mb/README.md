# Mandelbrot set explorer

You can see this code live at https://maxp.net/math/mb.

It provides a Google Maps-like interface to the Mandelbrot set. Mouse, keyboard, and touch controls work just as in Google Maps.

For performance, rendering is done with WebGL. However, WebGL's 32-bit float precision leads to visible blockiness once the viewport width falls below 1e-5.

A pure Javascript implementation (see slow/) uses 64-bit floats and provides higher resolution but is less reponsive despite aggressive parallelism (N-1 Web Workers on a machine with N virtual cores).

Using double-float arithmetic in WebGL slightly improves resolution, but the image quickly becomes noisy (scattered dots rather than blocky pixels). Not sure yet whether this is a bug in the double-float implementation or GPUs not fully implementing IEEE 754 (there are reports of this online).

A promising approach might be to use perturbation theory, possibly in combination with double-floats.

## References

### Mandelbrot / fractals general background

- https://www.math.univ-toulouse.fr/~cheritat/wiki-draw/index.php/Mandelbrot_set
- https://theses.liacs.nl/pdf/2018-2019-JonckheereLSde.pdf
- Perturbation theory 1-pager: http://www.science.eclipse.co.uk/sft_maths.pdf

### WebGL

- https://www.khronos.org/opengl/wiki/Main_Page
  - https://www.khronos.org/opengl/wiki/Data_Type_(GLSL)
- https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
- https://gpfault.net/posts/mandelbrot-webgl.txt.html
- https://blog.logrocket.com/using-typescript-webgl-render-web-graphics/

### Double-float and double-double arithmetic

- https://github.com/munrocket/double.js
- [Implementation of float-float operators on graphics hardware](https://hal.science/hal-00021443)
- [Library for double-double and quad-double arithmetic](https://web.mit.edu/tabbott/Public/quaddouble-debian/qd-2.3.4-old/docs/qd.pdf)
- [Extended-precision floating-point numbers for
GPU computation](https://andrewthall.org/papers/df64_qf128.pdf)

### Other implementations

- https://github.com/charto/fracts
- https://github.com/munrocket/deep-mandelbrot
