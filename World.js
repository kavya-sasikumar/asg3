let canvas, gl;
let a_Position, a_UV;
let u_ModelMatrix, u_ViewMatrix, u_ProjectionMatrix, u_FragColor, u_whichTexture;
let u_Sampler0, u_Sampler1;
let camera;

let showGoal = true;

const VERTEX_SHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  varying vec2 v_UV;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;
  varying vec2 v_UV;
  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else {
      gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); // error magenta
    }
  }
`;

function main() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.5, 0.8, 0.92, 1.0);

  connectVariablesToGLSL();
  initTextures(() => {
    camera = new Camera();
    renderWorld();
  });

  document.addEventListener("keydown", handleKeydown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("click", handleMouseClick);
}

function connectVariablesToGLSL() {
  const program = createProgramFromSources(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
  gl.useProgram(program);
  gl.program = program;

  a_Position = gl.getAttribLocation(program, "a_Position");
  a_UV = gl.getAttribLocation(program, "a_UV");
  u_ModelMatrix = gl.getUniformLocation(program, "u_ModelMatrix");
  u_ViewMatrix = gl.getUniformLocation(program, "u_ViewMatrix");
  u_ProjectionMatrix = gl.getUniformLocation(program, "u_ProjectionMatrix");
  u_FragColor = gl.getUniformLocation(program, "u_FragColor");
  u_whichTexture = gl.getUniformLocation(program, "u_whichTexture");
  u_Sampler0 = gl.getUniformLocation(program, "u_Sampler0");
  u_Sampler1 = gl.getUniformLocation(program, "u_Sampler1");
}

function createProgramFromSources(gl, vsSource, fsSource) {
  const vShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);
  return program;
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function initTextures(callback) {
  let count = 0;
  const skyImg = new Image();
  const dirtImg = new Image();

  skyImg.onload = () => { loadTexture(skyImg, 0); if (++count === 2) callback(); };
  dirtImg.onload = () => { loadTexture(dirtImg, 1); if (++count === 2) callback(); };

  skyImg.src = "textures/sky.jpg";
  dirtImg.src = "textures/dirt.jpg";
}

function loadTexture(image, unit) {
  const texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(unit === 0 ? u_Sampler0 : u_Sampler1, unit);
}

let worldMap = Array.from({ length: 32 }, () =>
  Array.from({ length: 32 }, () => Math.floor(Math.random() * 5))
);

function renderWorld() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

  // Ground
  const ground = new Cube();
  ground.textureNum = -2;
  ground.color = [0.2, 0.6, 0.2, 1.0];
  ground.matrix = new Matrix4().setTranslate(0, -1, 0).scale(32, 0.1, 32);
  ground.render();

  // Sky
  const sky = new Cube();
  sky.textureNum = 0;
  sky.matrix = new Matrix4().setTranslate(0, 0, 0).scale(1000, 1000, 1000);
  sky.render();

  // Blocks
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      let height = worldMap[x][z];
      for (let y = 0; y < height; y++) {
        const block = new Cube();
        block.textureNum = 1;
        block.matrix = new Matrix4().setTranslate(x - 16, y, z - 16);
        block.renderfast();
      }
    }
  }

  // 🐾 Animal — now bigger and clearer
  for (let i = 0; i < 4; i++) {
    const leg = new Cube();
    leg.color = [0.4, 0.2, 0, 1];
    leg.textureNum = -2;
    let dx = (i % 2 === 0) ? 0.1 : 0.7;
    let dz = (i < 2) ? 0.1 : 0.7;
    leg.matrix = new Matrix4().setTranslate(2 + dx, 0, 2 + dz).scale(0.2, 0.5, 0.2);
    leg.renderfast();
  }

  const body = new Cube();
  body.color = [1.0, 0.5, 0.3, 1.0];
  body.textureNum = -2;
  body.matrix = new Matrix4().setTranslate(2, 0.5, 2).scale(1, 0.5, 1);
  body.renderfast();

  const head = new Cube();
  head.color = [1.0, 0.8, 0.6, 1.0];
  head.textureNum = -2;
  head.matrix = new Matrix4().setTranslate(2.35, 1, 2).scale(0.3, 0.3, 0.3);
  head.renderfast();

  const earLeft = new Cube();
  earLeft.color = [0.8, 0.4, 0.4, 1.0];
  earLeft.textureNum = -2;
  earLeft.matrix = new Matrix4().setTranslate(2.3, 1.3, 2).scale(0.1, 0.1, 0.1);
  earLeft.renderfast();

  const earRight = new Cube();
  earRight.color = [0.8, 0.4, 0.4, 1.0];
  earRight.textureNum = -2;
  earRight.matrix = new Matrix4().setTranslate(2.55, 1.3, 2).scale(0.1, 0.1, 0.1);
  earRight.renderfast();

  // ✨ Magic cube
  const magicCube = new Cube();
  magicCube.color = [1.0, 0.2, 0.8, 0.7];
  magicCube.textureNum = -2;
  magicCube.matrix = new Matrix4().setTranslate(2, 2.5 + Math.sin(Date.now() * 0.005), 2).scale(0.5, 0.5, 0.5);
  magicCube.renderfast();

  // Story pop-up
  if (showGoal) {
    alert("Your animal is stuck on the tower! Build stairs to reach it.");
    showGoal = false;
  }

  // Win detection
  const cam = camera.eye.elements;
  if (Math.abs(cam[0] - 2) < 1.5 && Math.abs(cam[2] - 2) < 1.5 && cam[1] < 2) {
    alert("You reached your animal! 🐾 Mission Complete!");
  }
}

function handleKeydown(e) {
  const key = e.key.toLowerCase();
  const speed = 0.5;
  if (key === 'w') camera.moveForward(speed);
  if (key === 's') camera.moveBackward(speed);
  if (key === 'a') camera.moveLeft(speed);
  if (key === 'd') camera.moveRight(speed);
  if (key === 'q') camera.panLeft(5);
  if (key === 'e') camera.panRight(5);
  renderWorld();
}

let lastX = null;
function handleMouseMove(e) {
  if (!camera) return;
  if (lastX !== null) {
    let dx = e.clientX - lastX;
    camera.panRight(-dx * 0.5);
    renderWorld();
  }
  lastX = e.clientX;
}

function handleMouseClick(e) {
  if (!camera || typeof camera.getGridCoordsInFront !== 'function') return;
  const [x, z] = camera.getGridCoordsInFront();
  if (e.shiftKey) {
    if (worldMap[x] && worldMap[x][z] > 0) worldMap[x][z]--;
  } else {
    if (worldMap[x]) worldMap[x][z] = Math.min(4, worldMap[x][z] + 1);
  }
  renderWorld();
}
