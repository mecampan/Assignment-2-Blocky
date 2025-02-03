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
let g_globalAngle = 0;
let g_globaltiltAngle = 0;
let g_globalZoom = 0.5;

let g_faceAnimation = false;
let g_bodyAnimationOn = false;

let g_headAnimation = 0;
let g_bodyAnimation = 0;
let g_armSwipeAnimation = 0;
var g_eyeBlink = 1;

let g_upperArmAngle = 0;
let g_lowerArmAngle = 0;

let angleSlider, tiltSlider, zoomSlider, upperArmSlider, lowerArmSlider;

const musicPlayer = new Audio("hes_a_pirate.ogg");
if(musicPlayer === null) {
  console.log('Failed to get the music file.');
}
else
{
  console.log(musicPlayer);
}
// Variable to track music state
let musicPlaying = false;

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
    zoomSlider.value = 50; 

    g_globalAngle = 0;
    g_globaltiltAngle = 0;
    g_globalZoom = 0.5;

    renderAllShapes(); 
  };

  upperArmSlider = document.getElementById('upperArmSlider');
  upperArmSlider.addEventListener('mousemove',  function() { g_upperArmAngle = this.value; renderAllShapes(); });
  upperArmSlider.addEventListener('mouseup',  function() { g_upperArmAngle = this.value; renderAllShapes(); });

  lowerArmSlider = document.getElementById('lowerArmSlider');
  lowerArmSlider.addEventListener('mousemove',  function() { g_lowerArmAngle = this.value; renderAllShapes(); });
  lowerArmSlider.addEventListener('mouseup',  function() { g_lowerArmAngle = this.value; renderAllShapes(); });

  document.getElementById('faceAnimationButtonOn').onclick = function() { g_faceAnimation = true; };
  document.getElementById('faceAnimationButtonOff').onclick = function() { g_faceAnimation = false; };

  document.getElementById('bodyAnimationButtonOn').onclick = function() { g_bodyAnimationOn = true; };
  document.getElementById('bodyAnimationButtonOff').onclick = function() { g_bodyAnimationOn = false; };

  document.getElementById('pirateMusicButton').onClick = function() { 
    if (musicPlaying) {
      musicPlayer.pause();
    } 
    else {
      console.log("startingMusic");
      musicPlayer.play();
    }
    musicPlaying = !musicPlaying;
  };
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
    dragging = false;
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

  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;

// Called by browser repeatedly whenever its time
function tick() {
  // Print some debug information so we know we are running
  g_seconds = performance.now()/1000.0-g_startTime;
  //console.log(g_seconds);

  updateAnimationAngles();
  
  // Update eye blinking animation
  if(g_faceAnimation){
    updateBlink();
  }
  // Draw everything
  renderAllShapes();

  // Tell the browser to update again when it has time
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {

  if(g_bodyAnimationOn){
    g_bodyAnimation = 15*Math.sin(g_seconds);    
    g_armSwipeAnimation = 45*Math.sin(g_seconds);    
    g_headAnimation = 5*Math.sin(g_seconds);

    g_upperArmAnimation = 15*Math.sin(g_seconds);
    g_lowerArmAnimation = 30*Math.sin(g_seconds);

    // Update sliders to match animation
    upperArmSlider.value = (g_upperArmAnimation + 15) / 30 * 100;
    lowerArmSlider.value = (g_lowerArmAnimation + 30) / 60 * 100;
  }
  else
  {
    // Set up the maximum angles to match the slider value of 0 to 100
    g_upperArmAnimation = -15 + upperArmSlider.value / 100 * 30;
    g_lowerArmAnimation = -30 + lowerArmSlider.value / 100 * 60;
  }
}

function updateBlink() {
  const blinkPeriod = 5;  // Time between blinks
  const blinkDuration = 0.5; // Blink lasts 0.5 seconds

  // Get time since the last blink started
  let blinkTime = g_seconds % blinkPeriod;

  if (blinkTime < blinkDuration) {
      // Normalized progress (0 → 1 during blink duration)
      let t = blinkTime / blinkDuration;

      // Smooth blink transition using quadratic ease-in-out
      g_eyeBlink = 1 - (4 * t * (1 - t)); // Creates a smooth curve 1 → 0 → 1
  } else {
      g_eyeBlink = 1; // Keep eyes fully open outside the blink
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
    //drawTentacleRing(prevSegment, tentacle.color);
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

  var darkerColor = 0.05;
  var clothesColor = [0.16 - darkerColor, 0.11 - darkerColor, 0.05 - darkerColor, 1.0];  

  // Body if there is time
  upperBody = new Pyramid();
  upperBody.color = clothesColor;
  var bodyCoordinatesMat = new Matrix4(upperBody.matrix);
  upperBody.matrix.translate(1.15, -0.5, -0.3);
  upperBody.matrix.rotate(180, 0, 0, 1);
  upperBody.matrix.scale(1.8, 2.6, 0.5);
  upperBody.render();

  neck = new Pyramid();
  neck.color = clothesColor;
  neck.matrix.matrix = new Matrix4(bodyCoordinatesMat)
  neck.matrix.translate(-0.5, -0.7, -0.33);
  neck.matrix.scale(1.5, 1.0, 0.5);
  neck.render();  
  
  var upperBodyAbdomen = new Cube();
  upperBodyAbdomen.color = clothesColor;
  upperBodyAbdomen.matrix = new Matrix4(bodyCoordinatesMat)
  upperBodyAbdomen.matrix.translate(-0.25, -1.8, -0.3);
  upperBodyAbdomen.matrix.scale(1.0, 1.3, 0.5);
  upperBodyAbdomen.render();

  // -------------------------
  var leftUpperArm = new Cube();
  leftUpperArm.color = clothesColor;
  leftUpperArm.matrix = new Matrix4(bodyCoordinatesMat)
  leftUpperArm.matrix.translate(-0.9, -1.5, -0.35);
  leftUpperArm.matrix.rotate(-20, 0, 0, 1);
  leftUpperArm.matrix.rotate(g_upperArmAnimation, 1, 1, 0);
  leftArmMatrixCoor = new Matrix4(leftUpperArm.matrix)
  leftUpperArm.matrix.scale(0.4, 1.0, 0.4);
  leftUpperArm.render();

  var leftForearm = new Cube();
  leftForearm.color = clothesColor;
  leftForearm.matrix = new Matrix4(leftArmMatrixCoor)
  leftForearm.matrix.rotate(g_lowerArmAnimation, 1, 0, 0);
  leftForearm.matrix.translate(0.0, 0.3, -0.2);
  leftForearm.matrix.rotate(-120, 1, 0, 0);
  leftForearmMatrixCoor = new Matrix4(leftForearm.matrix);
  leftForearm.matrix.scale(0.4, 1.0, 0.4);
  leftForearm.render();

  var sword = new Tetrahedron();
  sword.color = [0.71, 0.71, 0.71, 1.0];
  sword.matrix = new Matrix4(leftForearmMatrixCoor)
  sword.matrix.translate(0.1, 1.0, 0.0);
  sword.matrix.rotate(90, 1, 0, 0);
  sword.matrix.scale(0.1, 3.0, 0.1);
  sword.render();
  
  // -------------------------
  var rightUpperArm = new Cube();
  rightUpperArm.color = clothesColor;
  rightUpperArm.matrix = new Matrix4(bodyCoordinatesMat)
  rightUpperArm.matrix.scale(-1.0, 1.0, 1.0);
  rightUpperArm.matrix.translate(-1.4, -1.5, -0.35);
  rightUpperArm.matrix.rotate(-20, 0, 0, 1);
  rightUpperArm.matrix.rotate(g_upperArmAnimation, 1, 1, 0);
  rightArmMatrixCoor = new Matrix4(rightUpperArm.matrix)
  rightUpperArm.matrix.scale(0.4, 1.0, 0.4);
  rightUpperArm.render();

  var rightForearm = new Cube();
  rightForearm.color = clothesColor;
  rightForearm.matrix.rotate(g_lowerArmAnimation, 0, 1, 0);
  rightForearm.matrix = new Matrix4(rightArmMatrixCoor)
  rightForearm.matrix.translate(0.0, 0.3, -0.2);
  rightForearm.matrix.rotate(-120, 1, 0, 0);
  rightForearm.matrix.scale(0.4, 1.0, 0.4);
  rightForearm.render();

  // ------------------------
  var lowerBody = new Pyramid();
  lowerBody.color = clothesColor;
  var lowerBodyCoordinatesMat = new Matrix4(lowerBody.matrix);
  lowerBody.matrix.translate(-0.5, -2.2, -0.1);
  lowerBody.matrix.scale(1.5, 2.6, 0.7);
  lowerBody.render();
  
  var rightUpperLeg = new Cube();
  rightUpperLeg.color = clothesColor;
  rightUpperLeg.matrix = new Matrix4(bodyCoordinatesMat)
  rightUpperLeg.matrix.scale(-1.0, 1.0, 1.0);
  rightUpperLeg.matrix.translate(-0.8, -2.9, -0.35);
  rightUpperLeg.matrix.rotate(0, 0, 0, 1);
  rightLegMatrixCoor = new Matrix4(rightUpperLeg.matrix)
  rightUpperLeg.matrix.scale(0.5, 1.0, 0.4);
  rightUpperLeg.render();

  var rightLowerLeg = new Cube();
  rightLowerLeg.color = clothesColor;
  rightLowerLeg.matrix = new Matrix4(rightLegMatrixCoor)
  rightLowerLeg.matrix.translate(0.0, 0.3, -0.4);
  rightLowerLeg.matrix.rotate(-180, 1, 0, 0);
  rightLowerLeg.matrix.scale(0.5, 1.0, 0.4);
  rightLowerLeg.render();

  var leftUpperLeg = new Cube();
  leftUpperLeg.color = clothesColor;
  leftUpperLeg.matrix = new Matrix4(bodyCoordinatesMat)
  leftUpperLeg.matrix.translate(-0.3, -2.9, -0.35);
  leftUpperLeg.matrix.rotate(0, 0, 0, 1);
  leftLegMatrixCoor = new Matrix4(leftUpperLeg.matrix)
  leftUpperLeg.matrix.scale(0.5, 1.0, 0.4);
  leftUpperLeg.render();

  var leftLowerLeg = new Cube();
  leftLowerLeg.color = clothesColor;
  leftLowerLeg.matrix = new Matrix4(leftLegMatrixCoor)
  leftLowerLeg.matrix.translate(0.0, 0.3, -0.4);
  leftLowerLeg.matrix.rotate(-180, 1, 0, 0);
  leftLowerLeg.matrix.scale(0.5, 1.0, 0.4);
  leftLowerLeg.render();  

  // Head
  var head = new Cube();
  head.color = [0.22, 0.58, 0.5, 1.0];
  head.matrix = new Matrix4(bodyCoordinatesMat);
  head.matrix.scale(0.7, 0.7, 0.7);
  head.matrix.rotate(-g_headAnimation, 0, 1, 1);
  var headCoordinatesMat = new Matrix4(head.matrix);
  head.matrix.translate(-0.2, -0.51, -0.3);
  var headCoordinatesMatrix = new Matrix4(head.matrix);
  head.matrix.scale(1.0, 0.6, 1.0);
  head.render();

  // Middle Face Tentacles
  var noseBridgeLeft= new Cube();
  noseBridgeLeft.color = [0.1, 0.7, 0.6, 1.0];
  noseBridgeLeft.matrix = new Matrix4(headCoordinatesMat);
  noseBridgeLeft.matrix.translate(0.12, -0.25, -1.27);
  noseBridgeLeft.matrix.rotate(-65, 0, 0, 1);
  noseBridgeLeft.matrix.scale(0.05, 0.25, 0.11);
  noseBridgeLeft.matrix.scale(1.5, 0.8, 0.7);
  noseBridgeLeft.matrix.rotate(-10, 0, 0, 1);
  noseBridgeLeft.render();

  var noseBridgeRight = new Cube();
  noseBridgeRight.color = [0.1, 0.7, 0.6, 1.0];
  noseBridgeRight.matrix = new Matrix4(headCoordinatesMat);
  noseBridgeRight.matrix.scale(-1.0, 1.0, 1.0);
  noseBridgeRight.matrix.translate(-0.48, -0.25, -1.27);
  noseBridgeRight.matrix.rotate(-65, 0, 0, 1);
  noseBridgeRight.matrix.scale(0.05, 0.25, 0.11);
  noseBridgeRight.matrix.scale(1.5, 0.8, 0.7);
  noseBridgeRight.matrix.rotate(-10, 0, 0, 1);
  noseBridgeRight.render();

  drawTentacle(new Matrix4(headCoordinatesMatrix), [0.25, 0.0, -0.9], 15, 7, 0.2 + Math.sin(g_seconds) / 10);
  drawTentacle(new Matrix4(headCoordinatesMatrix), [0.6, 0.0, -0.9], 15, 7, 0.2 + Math.sin(g_seconds) / 10);

  // Beard Tentacles
  drawTentacle(new Matrix4(headCoordinatesMatrix), [0.37, -0.2, -0.88], 15, 8, 0.5 + Math.sin(g_seconds) / 10);
  drawTentacle(new Matrix4(headCoordinatesMatrix), [0.53, -0.2, -0.88], 15, 8, 0.5 + Math.sin(g_seconds) / 10);

  // Left beard Tentacles hieght decreasing
  drawTentacle(new Matrix4(headCoordinatesMatrix), [0.25, -0.25, -0.86], 15, 3, 0.4 + Math.sin(g_seconds) / 10);
  drawTentacle(new Matrix4(headCoordinatesMatrix), [0.15, -0.15, -0.86], 15, 3, 0.3 + Math.sin(g_seconds) / 10);
  drawTentacle(new Matrix4(headCoordinatesMatrix), [0.0, -0.1, -0.86], 15, 2, 0.2 + Math.sin(g_seconds) / 10);

  // Right beard Tentacles hieght decreasing
  drawTentacle(new Matrix4(headCoordinatesMatrix), [0.6, -0.25, -0.86], 15, 3, 0.4 + Math.sin(g_seconds) / 10);
  drawTentacle(new Matrix4(headCoordinatesMatrix), [0.75, -0.15, -0.86], 15, 3, 0.3 + Math.sin(g_seconds) / 10);
  drawTentacle(new Matrix4(headCoordinatesMatrix), [0.86, -0.1, -0.86], 15, 2, 0.2 + Math.sin(g_seconds) / 10);

  //Eyes
  var leftEye = new Cube();
  leftEye.color = [0.0, 0.0, 0.0, 1.0];
  leftEye.matrix = new Matrix4(headCoordinatesMat);
  leftEye.matrix.translate(0.05, -0.2, -1.21);
  leftEye.matrix.scale(0.1, 0.15, 0.1);
  leftEye.matrix.scale(1.0, g_eyeBlink, 1.0);
  leftEye.render();

  var leftEyebrow = new Cube();
  leftEyebrow.color = [0.12, 0.48, 0.4, 1.0];
  leftEyebrow.matrix = new Matrix4(headCoordinatesMat);
  leftEyebrow.matrix.translate(0.2, -0.12, -1.21);
  leftEyebrow.matrix.rotate(65, 0, 0, 1);
  leftEyebrow.matrix.scale(0.05, 0.25, 0.11);
  leftEyebrow.render();

  var leftEyeSunken = new Cube();
  leftEyeSunken.color = [0.3, 0.48, 0.37, 1.0];
  leftEyeSunken.matrix = new Matrix4(headCoordinatesMat);
  leftEyeSunken.matrix.translate(0.22, -0.27, -1.199);
  leftEyeSunken.matrix.rotate(30, 0, 0, 1);
  leftEyeSunken.matrix.scale(0.15, 0.25, 0.11);
  leftEyeSunken.matrix.rotate(65, 0, 0, 1);
  //leftEyeSunken.render();

  var rightEye = new Cube();
  rightEye.color = [0.0, 0.0, 0.0, 1.0];
  rightEye.matrix = new Matrix4(headCoordinatesMat);
  rightEye.matrix.translate(0.45, -0.2, -1.21);
  rightEye.matrix.scale(0.1, 0.15, 0.1);
  rightEye.matrix.scale(1.0, g_eyeBlink, 1.0);
  rightEye.render();  

  var rightEyebrow = new Cube();
  rightEyebrow.color = [0.12, 0.48, 0.4, 1.0];
  rightEyebrow.matrix = new Matrix4(headCoordinatesMat);
  rightEyebrow.matrix.scale(-1.0, 1.0, 1.0);  
  rightEyebrow.matrix.translate(-0.4, -0.12, -1.21);
  rightEyebrow.matrix.rotate(65, 0, 0, 1);
  rightEyebrow.matrix.scale(0.05, 0.25, 0.11);
  rightEyebrow.render();

  var rightEyeSunken = new Cube();
  rightEyeSunken.color = [0.3, 0.48, 0.37, 1.0];
  rightEyeSunken.matrix = new Matrix4(headCoordinatesMat);
  rightEyeSunken.matrix.scale(-1.0, 1.0, 1.0);  
  rightEyeSunken.matrix.translate(-0.4, -0.27, -1.199);
  rightEyeSunken.matrix.rotate(30, 0, 0, 1);
  rightEyeSunken.matrix.scale(0.15, 0.25, 0.11);
  rightEyeSunken.matrix.rotate(65, 0, 0, 1);
  //rightEyeSunken.render();

  // Mouth
  var mouthLeft = new Cube();
  mouthLeft.color = [0.0, 0.0, 0.0, 1.0];
  mouthLeft.matrix = new Matrix4(headCoordinatesMat);
  mouthLeft.matrix.translate(0.21, -0.32, -1.27);
  mouthLeft.matrix.rotate(-65, 0, 0, 1);
  mouthLeft.matrix.scale(0.05, 0.25, 0.11);
  mouthLeft.matrix.scale(0.4, 0.4, 0.4);
  mouthLeft.render();

  var mouthRight = new Cube();
  mouthRight.color = [0.0, 0.0, 0.0, 1.0];
  mouthRight.matrix = new Matrix4(headCoordinatesMat);
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
  hatBase.matrix = new Matrix4(headCoordinatesMat);
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