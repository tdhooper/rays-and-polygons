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

// 1 x 1 x 1 Box
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
      // 1 x 1 x 1 Box
      float d = fBox(p, vec3(.5));

      p = mod(p, 1.) - .5;
      d = min(d, length(p) - .04);
      return d;
    }

    vec3 calcNormal(vec3 p) {
      vec3 eps = vec3(.001,0,0);
      vec3 n = vec3(
        map(p - eps.xyy) - map(p + eps.xyy),
        map(p - eps.yxy) - map(p + eps.yxy),
        map(p - eps.yyx) - map(p + eps.yyx)
      );
      return normalize(n);
    }

    const float ITER = 50.;

    void main() {
      float aspect = resolution.x / resolution.y;
      vec2 uv = (gl_FragCoord.xy / resolution - .5) * vec2(aspect, 1);

      if (uv.x > 0.) {
        discard;
      }

      vec4 translation = view[3];
      vec3 rayOrigin = (translation * view).xyz;

      float fov = projection[1].y * .5;
      vec3 rayDirection = vec4(vec4(-uv, fov, 1) * view).xyz;
      rayDirection = normalize(rayDirection);

      float distance;
      vec3 color = vec3(0);
      for (float i = 0.; i < ITER; i++) {
        distance = map(rayOrigin);
        rayOrigin += rayDirection * distance;
        color += .05;
        if (distance < .001) {
          color *= calcNormal(rayOrigin) * .5 + .5;
          break;
        }
      }
      gl_FragColor = vec4(color, 1);
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
  },
});

regl.frame(() => {
  camera.tick();
  setup(() => {
    drawPolygons();
    drawRaymarch();
  });
});
