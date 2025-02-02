// Global Variables
var movementDirection = [0.0, 0.0];
var previousKey;
var playerCharacter = [];
var playerPoint;
var playerScore = 0;
var highScore = 0;

// Inside game space
let gameArea1 = new Triangle();
let gameArea2 = new Triangle();
gameArea1.set_color([0.0, 0.0, 0.0, 1.0]);
gameArea1.set_points([-0.95, -0.95, -0.95, 0.95, 0.95, -0.95]);
gameArea2.set_color([0.0, 0.0, 0.0, 1.0]);
gameArea2.set_points([-0.95, 0.95, 0.95, 0.95, 0.95, -0.95]);

function startGame(){
    gameActive = true;
    clearCanvas();
    gl.clearColor(1.0, 0.0, 0.0, 1.0);

    createSegment();

    playerPoint = new Point();
    playerPoint.set_size(19);
    playerPoint.set_color([0.0, 1.0, 0.0, 1.0]);
    movePointPos();
    playerPoint.render();

    requestAnimationFrame(gameLoop);
}

// Main Animation Loop
let lastTime = 0;
let seconds = 0;
function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000; // Delta time in seconds
    lastTime = timestamp;
    seconds += deltaTime;
    
    // Move and render screen every 1.5 seconds
    if(timestamp - seconds >= 150) {
        moveCharacter();
        renderGameScreen();
        seconds = timestamp;
    }

    // Check if point intersects with the head
    if(checkBodyIntersect(playerPoint.position, [playerCharacter[0]])) {
        movePointPos();
        createSegment();
        playerScore += 500;
        sendToTextHTML(`Score: ${playerScore}`, "gameScore");
    }

    // Check head collision with the body
    const headPosition = playerCharacter[0].position;
    const body = playerCharacter.slice(1);
    if(checkBodyIntersect(headPosition, body)) {
        gameOver();
    };

    // Check if colliding with walls
    checkOutOfBounds();

    if(gameActive) {
        requestAnimationFrame(gameLoop);
    }
}

function renderGameScreen() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Render the game play area, player snake and points
    gameArea1.render()
    gameArea2.render();
    for(let i = 0; i < playerCharacter.length; i++) {
        playerCharacter[i].set_color(g_selectedColor.slice());

        playerCharacter[i].render();
    }
    playerPoint.render();
}

function createSegment() {
    segment = new Point();
    segment.set_size(20);
    if(playerCharacter.length != 0)
    {
        let prev = playerCharacter[playerCharacter.length -1].previousPos;
        segment.set_position(prev.slice());  
    }
    playerCharacter.push(segment);
    segment.render();
}

let canChangeDirection = true;

function changeDirection(ev) {
    if (!canChangeDirection) return; // Ignore input if locked

    switch (ev.key) {
        case "w":
            if (previousKey !== "s") {
                previousKey = ev.key;
                movementDirection = [0.0, 0.1];
                canChangeDirection = false;
            }
            break;
        case "a":
            if (previousKey !== "d") {
                previousKey = ev.key;
                movementDirection = [-0.1, 0.0];
                canChangeDirection = false;
            }
            break;
        case "s":
            if (previousKey !== "w") {
                previousKey = ev.key;
                movementDirection = [0.0, -0.1];
                canChangeDirection = false;
            }
            break;
        case "d":
            if (previousKey !== "a") {
                previousKey = ev.key;
                movementDirection = [0.1, 0.0];
                canChangeDirection = false;
            }
            break;
    }
}

function moveCharacter() {
    // Update the position with rounding to avoid floating-point precision issues
    playerCharacter[0].set_position([
        Math.round((playerCharacter[0].position[0] + movementDirection[0]) * 100000) / 100000,
        Math.round((playerCharacter[0].position[1] + movementDirection[1]) * 100000) / 100000    
    ]);

    // Move the previous segments to the one in front
    for(let i = 1; i < playerCharacter.length; i++) {
        let previous = playerCharacter[i-1].previousPos;
        playerCharacter[i].set_position(previous.slice());
    }

    canChangeDirection = true;
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}
function movePointPos() {
    let newPosition;
    let isValid = false;

    while (!isValid) {
        // Generate a new random position within the grid
        newPosition = [
            getRndInteger(-9, 9) / 10,
            getRndInteger(-9, 9) / 10,
        ];

        // Check if the new position is occupied by any segment of the playerCharacter
        isValid = !checkBodyIntersect(newPosition, playerCharacter.slice())
    }

    // Set the playerPoint to the new valid position
    playerPoint.set_position(newPosition);
}

function checkBodyIntersect(point, group) {
    // Check if the point intersects with any position in the group
    for (let i = 0; i < group.length; i++) {
        const segmentPos = group[i].position;
        if (
            point[0] === segmentPos[0] &&
            point[1] === segmentPos[1]
        ) {
            return true; // Intersection found
        }
    }
    return false; // No intersection
}

function checkOutOfBounds() {
    if(playerCharacter.length > 0) {
        if(playerCharacter[0].position[0] <= -1.0 || playerCharacter[0].position[0] >= 1.0 ) {
            gameOver();
        }
        else if(playerCharacter[0].position[1] <= -1.0 || playerCharacter[0].position[1] >= 1.0 ) {
            gameOver();
        }   
    }
}
function gameOver() {
    console.log("GAME OVER");
    gameActive = false;
    
    // Render Character Head to Show Collision
    playerCharacter[0].set_color([1.0, 0.0, 0.0, 1.0]);
    playerCharacter[0].render();

    if(playerScore > highScore) {
        highScore = playerScore;
    }

    sendToTextHTML(`High Score: ${highScore}`, "gameScore");
    // Reset values for next game
    movementDirection = [0.0, 0.0];
    previousKey = "";
    playerCharacter = [];
    playerScore = 0;

    // Reset background color to black for drawing
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
}