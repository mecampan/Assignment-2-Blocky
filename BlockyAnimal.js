// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global Variables
let canvas, gl, a_Position, u_Size, u_ModelMatrix, u_GlobalRotateMatrix;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Enable rendering objects in front of others
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }  

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if(!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if(!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }  

  // Set an intial value for this matrix to identity
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

// Globals related to HTML UI elements
let g_selectedSegments = 10;
let g_globalAngle = 0;
let g_globaltiltAngle = 0;
let g_globalZoom = 1.0;
let g_upDownPiece = 0;
let g_inOutPiece = 0;
let g_forwardBackPiece = 0;
let g_faceAnimation = true;
let g_magentaAnimation = false;

let angleSlider, tiltSlider, zoomSlider;

function addActionsforHtmlUI() {
  angleSlider = document.getElementById('angleSlider');
  angleSlider.addEventListener('mousemove',  function() { g_globalAngle = this.value; renderAllShapes(); });
  tiltSlider = document.getElementById('tiltSlider');
  tiltSlider.addEventListener('mousemove',  function() { g_globaltiltAngle = this.value; renderAllShapes(); });
  zoomSlider = document.getElementById('zoomSlider');
  zoomSlider.addEventListener('mousemove',  function() { g_globalZoom = this.value / 100; renderAllShapes(); });

  document.getElementById('resetCamera').onclick = function() { 
    angleSlider.value = 0; 
    tiltSlider.value = 0; 
    zoomSlider.value = 80; 

    g_globalAngle = 0;
    g_globaltiltAngle = 0;
    g_globalZoom = 0.8;

    renderAllShapes(); 
  };

  document.getElementById('angleSlider').addEventListener('mouseup',  function() { g_globalAngle = this.value; renderAllShapes(); });
  document.getElementById('ForwardBackSlider').addEventListener('mousemove',  function() { g_forwardBackPiece = this.value; renderAllShapes(); });
  document.getElementById('ForwardBackSlider').addEventListener('mouseup',  function() { g_forwardBackPiece = this.value; renderAllShapes(); });
  document.getElementById('inOutSlider').addEventListener('mousemove',  function() { g_inOutPiece = this.value; renderAllShapes(); });
  document.getElementById('inOutSlider').addEventListener('mouseup',  function() { g_inOutPiece = this.value; renderAllShapes(); });
  document.getElementById('upDownSlider').addEventListener('mousemove',  function() { g_upDownPiece = this.value; renderAllShapes(); });
  document.getElementById('upDownSlider').addEventListener('mouseup',  function() { g_upDownPiece = this.value; renderAllShapes(); });

  document.getElementById('faceAnimationButtonOn').onclick = function() { g_faceAnimation = true; };
  document.getElementById('faceAnimationButtonOff').onclick = function() { g_faceAnimation = false; };

  document.getElementById('magentaAnimationButtonOn').onclick = function() { g_magentaAnimation = true; };
  document.getElementById('magentaAnimationButtonOff').onclick = function() { g_magentaAnimation = false; };
}

let startingMouseX = 0;
let startingMouseY = 0;
let dragging = false;

function setupMouseCamera() {
  canvas.onmousedown = function(ev) {
    startingMouseX = ev.clientX;
    startingMouseY = ev.clientY;
    dragging = true;
  }

  canvas.onmousemove = function(ev) {
    if (dragging) {
      let deltaX = ev.clientX - startingMouseX;
      let deltaY = ev.clientY - startingMouseY;
  
      let turnSpeed = 0.4; // Adjust sensitivity
      angleSlider.value = Math.max(-180, Math.min(180, Number(angleSlider.value) - deltaX * turnSpeed));
      g_globalAngle = angleSlider.value;  

      tiltSlider.value = Math.max(-180, Math.min(180, Number(tiltSlider.value) - deltaY * turnSpeed));
      g_globaltiltAngle = tiltSlider.value;  

      startingMouseX = ev.clientX;
      startingMouseY = ev.clientY;
    }
  }
  
  window.onmouseup = function() {
    dragging = false; // Stop tracking movement
  }
}

function main() {

  setupWebGL();
  connectVariablesToGLSL();
  addActionsforHtmlUI();
  setupMouseCamera();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.5, 0.5, 0.5, 1.0);
  //gl.clear(gl.COLOR_BUFFER_BIT);
  //renderAllShapes();

  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;

// Called by browser repeatedly whener its time
function tick() {
  // Print some debug information so we know we are running
  g_seconds = performance.now()/1000.0-g_startTime;
  //console.log(g_seconds);

  updateAnimationAngles();

  // Draw everything
  renderAllShapes();

  // Tell the browser to update again when it has time
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {

  if(g_magentaAnimation){
    g_magentaPiece = 45*Math.sin(g_seconds);    
  }

}

function drawTentacle(attachedMat, pos, rotation, segments, delay) {
  var prevSegment = attachedMat;
  var delayFactor = delay;
  var backDistance = pos[2] / 4;

  for (let i = 0; i < segments; i++) {
    var tentacle = new Cube();
    tentacle.color = [0.2 - (i * 0.05) + backDistance, 0.9 - (i * 0.05) + backDistance, 0.8 - (i * 0.05) + backDistance, 1.0];
    tentacle.matrix = prevSegment;
    if(i === 0) {
      tentacle.matrix.translate(pos[0], pos[1], pos[2]);
      tentacle.matrix.scale(0.15, 0.25, 0.15);
    }
    else {
      tentacle.matrix.translate(0.02, -0.8, 0.001);
      tentacle.matrix.scale(0.9, 0.9, 1.0);
    }

    if(g_faceAnimation) {
      var waveMotion = Math.sin(g_seconds - i * delayFactor) * 0.1;
      tentacle.matrix.rotate(rotation * Math.sin(g_seconds - i * delayFactor) * 0.1, 0, 0, 1);
      tentacle.matrix.translate(waveMotion / 2, 0, 0); 
    }

    tentacle.render();
    prevSegment = new Matrix4(tentacle.matrix);
    drawTentacleRing(prevSegment, tentacle.color);
  }
}

function drawTentacleRing(attachedMat, Color) {
  var tentacle = new Cube();
  tentacle.color = [Color[0] + 0.2, Color[1] + 0.2, Color[2] + 0.2, Color[3]];
  tentacle.matrix = new Matrix4(attachedMat);
  tentacle.matrix.translate(0.4, 0.2, 0.12);
  tentacle.matrix.scale(0.2, 0.2, 0.2);
  tentacle.render();
}

function renderAllShapes(ev) {
  var startTime = performance.now();

  // Pass the matrix to u_ModelMatrix attributes
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0).scale(g_globalZoom, g_globalZoom, g_globalZoom).translate(0.0, 0.0, 0.5);
  globalRotMat.rotate(g_globaltiltAngle, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Central Body
  var body = new Cube();
  body.color = [0.22, 0.58, 0.5, 1.0];
  body.matrix.scale(0.7, 0.7, 0.7);
  var bodyCoordinatesMat = new Matrix4(body.matrix);
  body.matrix.translate(-0.2, -0.51, -0.3);
  var bodyCoordinatesMatrix = new Matrix4(body.matrix);
  body.matrix.scale(1.0, 0.6, 1.0);
  body.render();

  // Middle Face Tentacles
  var noseBridgeLeft= new Cube();
  noseBridgeLeft.color = [0.1, 0.7, 0.6, 1.0];
  noseBridgeLeft.matrix = new Matrix4(bodyCoordinatesMat);
  noseBridgeLeft.matrix.translate(0.12, -0.25, -1.27);
  noseBridgeLeft.matrix.rotate(-65, 0, 0, 1);
  noseBridgeLeft.matrix.scale(0.05, 0.25, 0.11);
  noseBridgeLeft.matrix.scale(1.5, 0.8, 0.7);
  noseBridgeLeft.matrix.rotate(-10, 0, 0, 1);
  noseBridgeLeft.render();

  var noseBridgeRight = new Cube();
  noseBridgeRight.color = [0.1, 0.7, 0.6, 1.0];
  noseBridgeRight.matrix = new Matrix4(bodyCoordinatesMat);
  noseBridgeRight.matrix.scale(-1.0, 1.0, 1.0);
  noseBridgeRight.matrix.translate(-0.48, -0.25, -1.27);
  noseBridgeRight.matrix.rotate(-65, 0, 0, 1);
  noseBridgeRight.matrix.scale(0.05, 0.25, 0.11);
  noseBridgeRight.matrix.scale(1.5, 0.8, 0.7);
  noseBridgeRight.matrix.rotate(-10, 0, 0, 1);
  noseBridgeRight.render();

  drawTentacle(new Matrix4(bodyCoordinatesMatrix), [0.25, 0.0, -0.9], 15, 7, 0.2 + Math.sin(g_seconds) / 10);
  drawTentacle(new Matrix4(bodyCoordinatesMatrix), [0.6, 0.0, -0.9], 15, 7, 0.2 + Math.sin(g_seconds) / 10);

  // Beard Tentacles
  drawTentacle(new Matrix4(bodyCoordinatesMatrix), [0.37, -0.2, -0.88], 15, 8, 0.5 + Math.sin(g_seconds) / 10);
  drawTentacle(new Matrix4(bodyCoordinatesMatrix), [0.53, -0.2, -0.88], 15, 8, 0.5 + Math.sin(g_seconds) / 10);

  // Left beard Tentacles hieght decreasing
  drawTentacle(new Matrix4(bodyCoordinatesMatrix), [0.25, -0.25, -0.86], 15, 3, 0.4 + Math.sin(g_seconds) / 10);
  drawTentacle(new Matrix4(bodyCoordinatesMatrix), [0.15, -0.15, -0.86], 15, 3, 0.3 + Math.sin(g_seconds) / 10);
  drawTentacle(new Matrix4(bodyCoordinatesMatrix), [0.0, -0.1, -0.86], 15, 2, 0.2 + Math.sin(g_seconds) / 10);

  // Right beard Tentacles hieght decreasing
  drawTentacle(new Matrix4(bodyCoordinatesMatrix), [0.6, -0.25, -0.86], 15, 3, 0.4 + Math.sin(g_seconds) / 10);
  drawTentacle(new Matrix4(bodyCoordinatesMatrix), [0.75, -0.15, -0.86], 15, 3, 0.3 + Math.sin(g_seconds) / 10);
  drawTentacle(new Matrix4(bodyCoordinatesMatrix), [0.86, -0.1, -0.86], 15, 2, 0.2 + Math.sin(g_seconds) / 10);

  //Eyes
  var leftEye = new Cube();
  leftEye.color = [0.0, 0.0, 0.0, 1.0];
  leftEye.matrix = new Matrix4(bodyCoordinatesMat);
  leftEye.matrix.translate(0.05, -0.2, -1.21);
  leftEye.matrix.scale(0.1, 0.15, 0.1);
  leftEye.render();

  var leftEyebrow = new Cube();
  leftEyebrow.color = [0.12, 0.48, 0.4, 1.0];
  leftEyebrow.matrix = new Matrix4(bodyCoordinatesMat);
  leftEyebrow.matrix.translate(0.2, -0.12, -1.21);
  leftEyebrow.matrix.rotate(65, 0, 0, 1);
  leftEyebrow.matrix.scale(0.05, 0.25, 0.11);
  leftEyebrow.render();

  var leftEyeSunken = new Cube();
  leftEyeSunken.color = [0.3, 0.48, 0.37, 1.0];
  leftEyeSunken.matrix = new Matrix4(bodyCoordinatesMat);
  leftEyeSunken.matrix.translate(0.22, -0.27, -1.199);
  leftEyeSunken.matrix.rotate(30, 0, 0, 1);
  leftEyeSunken.matrix.scale(0.15, 0.25, 0.11);
  leftEyeSunken.matrix.rotate(65, 0, 0, 1);
  //leftEyeSunken.render();

  var rightEye = new Cube();
  rightEye.color = [0.0, 0.0, 0.0, 1.0];
  rightEye.matrix = new Matrix4(bodyCoordinatesMat);
  rightEye.matrix.translate(0.45, -0.2, -1.21);
  rightEye.matrix.scale(0.1, 0.15, 0.1);
  rightEye.render();  

  var rightEyebrow = new Cube();
  rightEyebrow.color = [0.12, 0.48, 0.4, 1.0];
  rightEyebrow.matrix = new Matrix4(bodyCoordinatesMat);
  rightEyebrow.matrix.scale(-1.0, 1.0, 1.0);  
  rightEyebrow.matrix.translate(-0.4, -0.12, -1.21);
  rightEyebrow.matrix.rotate(65, 0, 0, 1);
  rightEyebrow.matrix.scale(0.05, 0.25, 0.11);
  rightEyebrow.render();

  var rightEyeSunken = new Cube();
  rightEyeSunken.color = [0.3, 0.48, 0.37, 1.0];
  rightEyeSunken.matrix = new Matrix4(bodyCoordinatesMat);
  rightEyeSunken.matrix.scale(-1.0, 1.0, 1.0);  
  rightEyeSunken.matrix.translate(-0.4, -0.27, -1.199);
  rightEyeSunken.matrix.rotate(30, 0, 0, 1);
  rightEyeSunken.matrix.scale(0.15, 0.25, 0.11);
  rightEyeSunken.matrix.rotate(65, 0, 0, 1);
  //rightEyeSunken.render();

  // Mouth
  var mouthLeft = new Cube();
  mouthLeft.color = [0.0, 0.0, 0.0, 1.0];
  mouthLeft.matrix = new Matrix4(bodyCoordinatesMat);
  mouthLeft.matrix.translate(0.21, -0.32, -1.27);
  mouthLeft.matrix.rotate(-65, 0, 0, 1);
  mouthLeft.matrix.scale(0.05, 0.25, 0.11);
  mouthLeft.matrix.scale(0.4, 0.4, 0.4);
  mouthLeft.render();

  var mouthRight = new Cube();
  mouthRight.color = [0.0, 0.0, 0.0, 1.0];
  mouthRight.matrix = new Matrix4(bodyCoordinatesMat);
  mouthRight.matrix.scale(-1.0, 1.0, 1.0);  
  mouthRight.matrix.translate(-0.4, -0.32, -1.27);
  mouthRight.matrix.rotate(-65, 0, 0, 1);
  mouthRight.matrix.scale(0.05, 0.25, 0.11);
  mouthRight.matrix.scale(0.4, 0.4, 0.4);
  mouthRight.render();  

  // ----------------------------
  // Davy Jones Hat
  var hatColor = [0.08, 0.09, 0.15, 1.0];
  var hatBase = new Cube();
  hatBase.color = [0.67, 0.61, 0.44, 1.0];
  hatBase.matrix = new Matrix4(bodyCoordinatesMat);
  hatBase.matrix.translate(-0.201, 0.0, -0.27);
  hatBaseCoorMatrix = new Matrix4(hatBase.matrix);
  hatBase.matrix.scale(1.002, 0.311, 0.8);
  hatBase.matrix.translate(0.0, 0.1, -0.32);
  hatBase.render();

  var hatTop = new Cube();
  hatTop.color = hatColor;
  hatTop.matrix = new Matrix4(hatBaseCoorMatrix);
  hatTop.matrix.translate(-0.01, 0.35, -0.9);
  hatTop.matrix.rotate(138, 1, 0, 0);
  hatTop.matrix.scale(1.03, 1.1, 0.5)
  hatTop.render();

  var hatBottom = new Cube();
  hatBottom.color = hatColor;
  hatBottom.matrix = new Matrix4(hatBaseCoorMatrix);
  hatBottom.matrix.translate(0.00, 0.35, -0.9);
  hatBottom.matrix.rotate(138, 1, 0, 0);
  hatBottom.matrix.scale(1.03, 1.15, 0.4)
  hatBottom.matrix.rotate(17, 1, 0, 0);
  hatBottom.render();

  // ----------------------------
  var hatFront = new Tetrahedron();
  hatFront.color = hatColor;
  hatFront.matrix = new Matrix4(hatBaseCoorMatrix);
  hatFront.matrix.scale(-1.0, 1.0, 1.0)
  hatFront.matrix.translate(.39, 0.9, -1.05);
  hatFront.matrix.rotate(223, 1, 0, 0);
  hatFront.matrix.rotate(95, 0, 1, 0);
  hatFront.matrix.rotate(0, 0, 0, 1);
  hatFront.matrix.scale(1.5, 0.8, 1.8)
  hatFront.render();

  var hatFrontR = new Tetrahedron();
  hatFrontR.color = hatColor;
  hatFrontR.matrix = new Matrix4(hatBaseCoorMatrix);
  hatFrontR.matrix.translate(1.39, 0.9, -1.05);
  hatFrontR.matrix.rotate(223, 1, 0, 0);
  hatFrontR.matrix.rotate(95, 0, 1, 0);
  hatFrontR.matrix.rotate(0, 0, 0, 1);
  hatFrontR.matrix.scale(1.5, 0.8, 1.8)
  hatFrontR.render();

  // ----------------------------
  var hatBack = new Tetrahedron();
  hatBack.color = hatColor;
  hatBack.matrix = new Matrix4(hatBaseCoorMatrix);
  hatBack.matrix.translate(1.0, 0.25, -0.7);
  hatBack.matrix.rotate(292, 1, 0, 0);
  hatBack.matrix.rotate(341, 0, 1, 0);
  hatBack.matrix.rotate(244, 0, 0, 1);
  hatBack.matrix.scale(1.3, 1.2, 0.6)
  hatBack.render();

  var hatBack2 = new Tetrahedron();
  hatBack2.color = hatColor;
  hatBack2.matrix = new Matrix4(hatBaseCoorMatrix);
  hatBack2.matrix.scale(-1.0, 1.0, 1.0)
  hatBack2.matrix.translate(0.0, 0.25, -0.7);
  hatBack2.matrix.rotate(292, 1, 0, 0);
  hatBack2.matrix.rotate(341, 0, 1, 0);
  hatBack2.matrix.rotate(244, 0, 0, 1);
  hatBack2.matrix.scale(1.3, 1.2, 0.6)
  hatBack2.render();

  // Gold Trim
  // Ugly way to do it, but tired and can't think of a better way
  var trimColor = [0.85, 0.75, 0.46, 1.0];
  hatFrontL = new Tetrahedron();
  hatFrontL.color = trimColor;
  hatFrontL.matrix = new Matrix4(hatBaseCoorMatrix);
  hatFrontL.matrix.scale(-1.0, 1.0, 1.0)
  hatFrontL.matrix.translate(.41, 0.92, -1.08);
  hatFrontL.matrix.rotate(223, 1, 0, 0);
  hatFrontL.matrix.rotate(95, 0, 1, 0);
  hatFrontL.matrix.rotate(0, 0, 0, 1);
  hatFrontL.matrix.scale(1.5, 0.8, 1.8)
  hatFrontL.render();

  hatFrontL = new Tetrahedron();
  hatFrontL.color = hatColor;
  hatFrontL.matrix = new Matrix4(hatBaseCoorMatrix);
  hatFrontL.matrix.scale(-1.0, 1.0, 1.0)
  hatFrontL.matrix.translate(.42, 0.9, -1.09);
  hatFrontL.matrix.rotate(223, 1, 0, 0);
  hatFrontL.matrix.rotate(95, 0, 1, 0);
  hatFrontL.matrix.rotate(0, 0, 0, 1);
  hatFrontL.matrix.scale(1.5, 0.8, 1.8)
  hatFrontL.render();

  //----------------------------
  hatFrontR = new Tetrahedron();
  hatFrontR.color = trimColor;
  hatFrontR.matrix = new Matrix4(hatBaseCoorMatrix);
  hatFrontR.matrix.translate(1.41, 0.92, -1.08);
  hatFrontR.matrix.rotate(223, 1, 0, 0);
  hatFrontR.matrix.rotate(95, 0, 1, 0);
  hatFrontR.matrix.rotate(0, 0, 0, 1);
  hatFrontR.matrix.scale(1.5, 0.8, 1.8)
  hatFrontR.render();

  hatFrontR = new Tetrahedron();
  hatFrontR.color = hatColor;
  hatFrontR.matrix = new Matrix4(hatBaseCoorMatrix);
  hatFrontR.matrix.translate(1.42, 0.9, -1.09);
  hatFrontR.matrix.rotate(223, 1, 0, 0);
  hatFrontR.matrix.rotate(95, 0, 1, 0);
  hatFrontR.matrix.rotate(0, 0, 0, 1);
  hatFrontR.matrix.scale(1.5, 0.8, 1.8)
  hatFrontR.render();

  //----------------------------
  // Body if there is time

  var duration = performance.now() - startTime;
  sendToTextHTML(`ms: ${Math.floor(duration)} fps: ${Math.floor(10000/duration)}`, "numdot");
}

function drawHatBarnicle(attachedMat, pos, size, colorVariation) {
  var barnicle = new Cube();
  barnicle.color = [0.76 + colorVariation / 100, 0.89 + colorVariation / 100, 0.73 + colorVariation / 100, 1.0];
  barnicle.matrix = new Matrix4(attachedMat);
  barnicle.matrix.rotate(45, 1, 0, 0);
  barnicle.matrix.translate(pos[0], pos[1], pos[2]);
  barnicle.matrix.scale(0.05 + size / 100, 0.05 + size / 100, 0.05 + size / 100);
  barnicle.render();
}

function sendToTextHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm) {
    console.log(`Failed to get ${htmlID} from html.`);
    return;
  }

  htmlElm.innerHTML = text;
}