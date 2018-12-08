const FirstPersonCamera = require('first-person-camera');
const mouseChange = require('mouse-change');
const pressed = require('key-pressed');


function Camera(canvas, options) {
  if (!(this instanceof Camera)) return new Camera(canvas, options);
  FirstPersonCamera.call(this, options);

  this.mouse = [0, 0, false, 0];
  this.lastMouse = undefined;
  this.lastTime = undefined;

  mouseChange(canvas, (buttons, x, y) => {
    const lmbPressed = buttons === 1;
    if (lmbPressed) {
      this.mouse = [x, y, true, 0];
    } else {
      this.mouse[2] = false;
    }
  });
}

Camera.prototype = Object.create(FirstPersonCamera.prototype);
Camera.prototype.constructor = Camera;

Camera.prototype.tick = function() {
  this.lastMouse = this.lastMouse || this.mouse;

  const down = this.mouse[2] && ! this.lastMouse[2];

  if (down) {
    this.lastMouse = this.mouse;
  }

  const realTime = performance.now();
  const elapsed = this.lastTime ? realTime - this.lastTime : 0;
  this.lastTime = realTime;
  this.control(
    elapsed,
    [
      pressed('W'), pressed('S'),
      pressed('A'), pressed('D'),
    ],
    this.mouse,
    this.lastMouse,
  );
  this.lastMouse = this.mouse;
};


module.exports = Camera;
