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

regl.frame(() => {
  camera.tick();
  setup(() => {
    drawPolygons();
  });
});
