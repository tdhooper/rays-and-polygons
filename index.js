const regl = require('regl')();
const createCamera = require('canvas-orbit-camera');
const { mat4 } = require('gl-matrix');
const createCube = require('primitive-cube');


const camera = createCamera(regl._gl.canvas);
camera.distance = 5;

const setup = regl({
  uniforms: {
    projection: ({ viewportWidth, viewportHeight }) => mat4.perspective(
      [],
      Math.PI / 5,
      viewportWidth / viewportHeight,
      0.01,
      1000,
    ),
    view: () => camera.view(),
  },
});

const mesh = createCube();

const drawPolygons = regl({
  vert: `
    precision mediump float;
    attribute vec3 position, normal;
    uniform mat4 model, view, projection;
    varying vec3 vnormal;
    void main() {
      vnormal = normal;
      gl_Position = projection * view * model * vec4(position, 1);
    }
  `,
  frag: `
    precision mediump float;
    varying vec3 vnormal;
    void main() {
      gl_FragColor = vec4(vnormal * .5 + .5, 1);
    }
  `,
  attributes: {
    position: mesh.positions,
    normal: mesh.normals,
  },
  elements: mesh.cells,
  uniforms: {
    model: mat4.identity([]),
  },
});

const drawRaymarch = regl({
  vert: `
    precision mediump float;
    attribute vec2 position;
    void main() {
      gl_Position = vec4(2.0 * position - 1.0, 0, 1);
    }
  `,
  frag: `
    precision mediump float;
    uniform vec2 resolution;
    uniform mat4 projection;
    uniform mat4 view;

    float fBox(vec3 p, vec3 s) {
      p = abs(p) - s;
      return max(p.x, max(p.y, p.z));
    }

    float map(vec3 p) {
      float d = length(p) - .1;
      d = fBox(p, vec3(.5));
      p = mod(p, 1.) - .5;
      d = min(d, length(p) - .2);
      return d;
    }

    const float ITER = 100.;

    void main() {
      float fovy = resolution.x / resolution.y;
      vec2 uv = (gl_FragCoord.xy / resolution - .5) * vec2(fovy, 1);
      if (uv.x > 0.) {
        discard;
      }

      // vec3 rayOrigin = vec3(0, 0, -1);
      // vec3 rayDirection = vec3(uv, 1);

      vec3 rayOrigin = vec4(vec4(0, 0, 3.333, 1) * view).xyz;
      vec3 rayDirection = vec4(vec4(uv, -1, 1) * view).xyz;
      rayDirection = normalize(rayDirection);

      float distance;
      float accumilate = 0.;
      for (float i = 0.; i < ITER; i++) {
        distance = map(rayOrigin);
        rayOrigin += rayDirection * distance;
        accumilate += .01;
        if (distance < .00001) {
          break;
        }
      }
      gl_FragColor = vec4(vec3(accumilate), 1);
    }
  `,
  attributes: {
    position: [
      [-2, 0],
      [0, -2],
      [2, 2],
    ],
  },
  count: 3,
  uniforms: {
    model: mat4.identity([]),
    resolution: context => [context.viewportWidth, context.viewportHeight],
    // projection: ({ viewportWidth, viewportHeight }) => {
    //   const p = mat4.perspective(
    //     [],
    //     Math.PI / 5,
    //     viewportWidth / viewportHeight,
    //     0.01,
    //     1000,
    //   );
    //   return mat4.invert(p, p);
    // },
  },
});

regl.frame(() => {
  camera.tick();
  setup(() => {
    drawPolygons();
    drawRaymarch();
  });
});
