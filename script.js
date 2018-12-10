var playerChar, testEnemy
var mousePosition = {
    x: 300,
    y: 0
}
var enemies = []
var playerBullets = []

function startIntro() {
    playerChar = new gameObject(25, 25, "red", 300, 300, "player")
    playerChar.lives = 3
    playerChar.score = 0
    // for (let i = 0; i < 3; i++){
    //     enemies.push(new gameObject(20,20,"blue", 300 + i * 50, 300, "enemy"))
    // }
    gameWindow.intro();
}

var gameWindow = {
    canvas : document.createElement("canvas"),
    intro : function(){
        this.gameStarted = false;
        this.canvas.height = 600;
        this.canvas.width = 600
        this.context = this.canvas.getContext("2d");
        this.context.font = "50px Impact";
        this.context.fillStyle = "#0099CC";
        this.context.textAlign = "center";
        this.context.fillText("Shoot 'Em Up!", this.canvas.width/2, this.canvas.height/2);
        this.context.font = "20px Arial";
        this.context.fillText("Press Enter To Start", this.canvas.width/2, this.canvas.height/2 + 50)
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        window.addEventListener('keydown', function (e) {
            e.preventDefault();
            gameWindow.keys = (gameWindow.keys || []);
            gameWindow.keys[e.keyCode] = (e.type == "keydown");
            if(event.keyCode == 13 && !this.gameStarted){
                console.log("start")
                gameWindow.start();
                this.gameStarted = true;
            }
        });
    },
    start : function() {
        displayLivesAndScore();
        this.clear();
        this.frameNo = 0;
        this.interval = setInterval(redrawGameArea, 20);
        window.addEventListener('keyup', function (e) {
            gameWindow.keys[e.keyCode] = (e.type == "keydown");
        });
        window.addEventListener('mousedown', function(e){
            playerChar.shoot()
        });
        window.addEventListener('mousemove', function(e){
            mousePosition = this.window.gameWindow.getMousePosition(this.window.gameWindow.canvas, e);
        })
        spawnEnemies();
    },
    stop : function() {
        clearInterval(this.interval);
    },
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    getMousePosition : function(canvas, event){
        let rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        }
    }
}

function spawnEnemies(){
    let enemy = new gameObject(25, 25, "blue", 300, 100)
    enemy.rotate = ""
    enemies.push(enemy)
}

function displayLivesAndScore(){
    let div = document.createElement("div");
    let p = document.createElement("p");
    let pTwo = document.createElement("p");

    div.id = "stats-div"
    p.id = "lives"
    p.innerText = "Lives: " + playerChar.lives
    pTwo.id = "score"
    pTwo.innerText = "Score: " + playerChar.score

    div.appendChild(p)
    div.appendChild(pTwo)
    document.body.appendChild(div)
}

function gameObject(width, height, color, x, y, type){
    this.type = type;
    this.width = width;
    this.height = height;
    this.color = color;
    this.x = x;
    this.xSpeed = 0;
    this.y = y;
    this.ySpeed = 0;
    this.active = true;
    this.angle = 0;

    // use this code for images
    // this.image = new Image();
    // this.image.src = "character.png"

    this.redraw = function() {
        ctx = gameWindow.context;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle)
        ctx.fillStyle = color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        //use this code to draw images
        // ctx.drawImage(this.image, -this.width/2, -this.height/2, this.width, this.height);
        ctx.restore();
    };

    this.move = function() {
        this.x += this.xSpeed;
        this.y += this.ySpeed;
        this.rotate();
        this.limitBoundary();
    };

    this.rotate = function(){
        if (gameWindow.frameNo > 40){
            this.angle = Math.atan((mousePosition.y - playerChar.y)/(mousePosition.x - playerChar.x))
        }
    }

    this.shoot = function(){
        playerBullets.push(createNewPlayerBullet());
    };

    this.inBounds = function(){
        return this.x - this.width/2 >= 0 && this.x + this.width/2 <= gameWindow.canvas.width && this.y - this.height/2 >= 0 && this.y + this.height/2 <= gameWindow.canvas.height;
    };

    this.limitBoundary = function(){
        let maxX = gameWindow.canvas.width - this.width/2;
        let maxY = gameWindow.canvas.height - this.height/2;

        if (this.x > gameWindow.canvas.width - this.width/2){
            this.x = maxX;
        }

        if (this.y > gameWindow.canvas.height - this.height/2){
            this.y = maxY;
        }

        if (this.x - this.width/2< 0){
            this.x = this.width/2;
        }

        if (this.y - this.height/2< 0){
            this.y = this.height/2;
        }
    };

    this.hasCollided = function(otherGameObject){
        if (this.x + this.width/2 > otherGameObject.x -otherGameObject.width/2 &&
            this.x - this.width/2 < otherGameObject.x + otherGameObject.width/2 &&
            this.y + this.height/2 > otherGameObject.y - otherGameObject.height/2 &&
            this.y - this.height/2 < otherGameObject.y + otherGameObject.height/2){
            //this object has collided with another game object
            return true;
        }
    };
}

function createNewPlayerBullet(){
    let mouseDx = mousePosition.x - playerChar.x
    let mouseDy = mousePosition.y - playerChar.y
    let mousePlayerDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy)
    let bullet = new gameObject(3,3,"green",playerChar.x, playerChar.y, "bullet")

    bullet.ySpeed = 7 * (mouseDy/mousePlayerDistance)
    bullet.xSpeed = 7 * (mouseDx/mousePlayerDistance)
    bullet.move = function (){
        this.x += this.xSpeed;
        this.y += this.ySpeed;
        this.active = this.active && this.inBounds();
    }
    return bullet
}

function redrawGameArea(){
    gameWindow.clear();
    handlePlayerInput();
    redrawAllGameObjects();
    gameWindow.frameNo++
}

function handlePlayerInput(){
    if (gameWindow.keys && gameWindow.keys[68]) {
        playerChar.x += 2;
    }
    if (gameWindow.keys && gameWindow.keys[65]) {
        playerChar.x -= 2;
    }
    if (gameWindow.keys && gameWindow.keys[87]) {
        playerChar.y -= 2;
    }
    if (gameWindow.keys && gameWindow.keys[83]) {
        playerChar.y += 2;
    }
}

function redrawAllGameObjects(){
    handlePlayerBulletHits();
    handlePlayerCollisions();
    enemies.forEach(function(enemy){
        enemy.move()
        enemy.redraw()
    });

    enemies = enemies.filter(function(enemy){
        return enemy.active
    });

    playerBullets.forEach(function(bullet){
        bullet.move()
        bullet.redraw()
    })

    playerBullets = playerBullets.filter(function(bullet){
        return bullet.active
    })

    playerChar.move()
    playerChar.redraw()
}

function handlePlayerBulletHits(){
    for (let enemy of enemies){
        for (let bullet of playerBullets){
            if (enemy.hasCollided(bullet)){
                console.log("enemy removed!")
                enemy.active = false;
                bullet.active = false;
            }
        }
    }
}

function handlePlayerCollisions(){
    for (let enemy of enemies){
        if (playerChar.hasCollided(enemy)){
            console.log("collided!")
        }
    }
}