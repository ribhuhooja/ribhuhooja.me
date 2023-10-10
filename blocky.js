var canvasWidth = 600;
var canvasHeight = 400;

var player;
var playerY = 200;
var fallSpeed = 1;
var interval = setInterval(updateCanvas, 20);

var isJumping = true;

function startGame() {
    gameCanvas.start();
    player = new Player(30,30,10);
}

var gameCanvas = {
    canvas: document.createElement("canvas"),
    start: function() {
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    }
}

class Player {
    constructor(width, height, x) {        
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = playerY;

    }

    draw() {
        ctx = gameCanvas.context;
        ctx.fillStyle = "green";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    updatePosition() {
        this.y += fallSpeed;
        fallSpeed += 0.1;
        
        if (this.y > (canvasHeight - this.height)) {
            fallSpeed = 0;
            isJumping = false;
        }
    }
}

function updateCanvas() {
    ctx = gameCanvas.context;
    ctx.clearRect(0,0,canvasWidth,canvasHeight);

    player.updatePosition();
    player.draw();
}

document.addEventListener("keyup", (event) => {
    if (event.key == " "){
        if (!isJumping) {
            isJumping = true;
            fallSpeed = -5;
        }
    }
}, false);