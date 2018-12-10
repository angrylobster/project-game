const FPS = 50;
var canvas = document.getElementById('game');
var context = canvas.getContext('2d');
var gameStarted = false;
var keyMap=[];
var enemies=[];
var enemiesInPlay = [];
var powerUps = [];
var frameNo = 0;
var PlayerChar, gameLoop, mousePosition;

addEventListeners();
introScreen();

function addEventListeners(){
    document.body.addEventListener("keydown", function(e){
        if(e.keyCode == 13 && !gameStarted){
            startGame();
        }
        if (gameStarted){
            keyMap[e.keyCode] = (e.type == "keydown");
        }
    });
    document.body.addEventListener("keyup", function(e){
        if (gameStarted){
            keyMap[e.keyCode] = (e.type == "keydown");
        }
    });
    document.body.addEventListener("mousedown", function(e){
        if (gameStarted){
            keyMap[32] = (e.type == "mousedown")
        }
    });
    document.body.addEventListener("mouseup", function(e){
        if (gameStarted){
            keyMap[32] = (e.type == "mousedown")
        }
    });
    document.body.addEventListener('mousemove', function(e){
        mousePosition = getMousePosition(canvas, e)
    });
}

function getMousePosition(canvas, e){
    let boundary = canvas.getBoundingClientRect();
    return {
        x: e.clientX - boundary.left,
        y: e.clientY - boundary.top
    }
}

function introScreen(){
    context.font = "50px Impact";
    context.fillStyle = "#0099CC";
    context.textAlign = "center";
    context.fillText("HTML5 Game", canvas.width/2, canvas.height/2);
    context.font = "20px Arial";
    context.fillText("Press Enter To Start", canvas.width/2, canvas.height/2 + 50);
}

function startGame(){
    clearCanvas();
    generatePlayerAndEnemies();
    putEnemiesInPlay();
    refreshHitsAndScore();
    drawCharacters();
    let countdown = 3
    let countdownInterval = setInterval(function(){
        if (countdown === 0){
            clearInterval(countdownInterval)
            gameStarted = true;
            gameLoop = setInterval(function(){
                frameNo++;
                clearCanvas();
                clearInactiveEnemiesAndBullets();
                moveCharacters();
                moveBullets();
                checkCollisions();
                checkWinOrLose();
                putEnemiesInPlay();
                drawCharacters();
                drawBullets();
            }, 1000/FPS);
        } else {
            gameEventText(countdown)
            countdown--
        }
    },1000)
}

function gameEventText(text){
    context.clearRect(canvas.width/2-100, canvas.height/2+150, 200, 80)
    context.font = "50px Railway";
    context.fillStyle = 'green'; // or whatever color the background is.
    context.fillText(text, canvas.width/2, canvas.height/2 + 200);
}

function refreshHitsAndScore(){
    let hits = document.body.querySelector("#hits")
    let score = document.body.querySelector("#score")
    hits.innerText = playerChar.hits
    score.innerText = playerChar.score
}

function generatePlayerAndEnemies(){
    playerChar = generatePlayerChar();
    for (let i = 0 ; i < 50; i++){
        enemies.push(generateEnemyChar());
    }
}

function allEnemiesDo(functionName){
    for (let enemy of enemiesInPlay){
        enemy[functionName]();
    }
}

function allBulletsDo(functionName){
    for (let bullet of playerChar.bullets){
        bullet[functionName]();
    }
}

function clearCanvas(){
    context.clearRect(0,0,canvas.width,canvas.height);
}

function clearInactiveEnemiesAndBullets(){
    playerChar.bullets = playerChar.bullets.filter(function(bullet){
        return bullet.active;
    });
    enemiesInPlay = enemiesInPlay.filter(function(enemy){
        return enemy.active;
    });
}

function putEnemiesInPlay(){
    while (enemiesInPlay.length < 13 && enemies.length !== 0){
        enemiesInPlay.push(enemies.splice(enemies.length-1, 1)[0]);
    }
}

function moveCharacters(){
    playerChar.move();
    allEnemiesDo("move");
}

function moveBullets(){
    allBulletsDo("move");
}

function checkCollisions(){
    for (let enemy of enemiesInPlay){
        for (let bullet of playerChar.bullets){
            if (enemy.collided(bullet)){
                bullet.active = false;
                enemyHit(enemy);
                checkEnemyDead(enemy);
            }
        }
        if (playerChar.collided(enemy) && playerChar.immuneFrames === 0){
            playerChar.hits--;
            playerChar.immuneFrames = 50;
        }
    }
    for (let powerUp of powerUps){
        if (playerChar.collided(powerUp)){
            powerUps.splice(powerUps.indexOf(powerUp), 1)
            powerUp.effect();
        }
    }
    refreshHitsAndScore();
}

function enemyHit(enemy){
    enemy.hits--;
    enemy.color = "#00cdcd";
}

function checkEnemyDead(enemy){
    if (enemy.hits === 0){
        enemy.active = false;
        playerChar.score++;
        if (Math.random() > 0.8){
            powerUps.push(generatePowerUp(enemy.x, enemy.y));
        }
    }
}

function checkWinOrLose(){
    if (playerChar.hits === 0){
        lose();
    }
    if (enemiesInPlay.length === 0 && enemies.length ===0){
        win();
    }
}

function lose(){
    clearInterval(gameLoop);
    gameStarted = false;
    gameEventText("YOU DIED!")
}

function win(){
    clearInterval(gameLoop);
    gameStarted = false;
    gameEventText("YOU WIN!")
}

function drawCharacters(){
    playerChar.draw();
    allEnemiesDo("draw");
    for (let powerUp of powerUps){
        powerUp.draw();
    }
}

function drawBullets(){
    allBulletsDo("draw");
}

function gameObject(width, height, color, startingX, startingY, type){
    var generatedGameObject = {
        "width": width,
        "height": height,
        "color": color,
        "x": startingX,
        "y": startingY,
        "type": type,
        "angle": 0,
        "active": true,
        draw: function(){
            context.save();
            context.translate(this.x, this.y);
            context.rotate(this.angle);
            context.fillStyle = this.color;
            context.fillRect(-this.width/2, -this.height/2, this.width, this.height);
            context.restore();
        },
        collided: function(otherGameObject){
            if (this.x + this.width/2 > otherGameObject.x - otherGameObject.width/2 &&
                this.x - this.width/2 < otherGameObject.x + otherGameObject.width/2 &&
                this.y + this.height/2 > otherGameObject.y - otherGameObject.height/2 &&
                this.y - this.height/2 < otherGameObject.y + otherGameObject.height/2){
                return true;
            }
        },
        move: function(){
        }
    }
    return generatedGameObject;
}

function generatePlayerChar(){
    let generatedPlayerChar = new gameObject(25, 25, "red", 300, 300, "player");
    generatedPlayerChar.bullets = [];
    generatedPlayerChar.lastShot = 0;
    generatedPlayerChar.hits = 3;
    generatedPlayerChar.immuneFrames = 0;
    generatedPlayerChar.score = 0;
    generatedPlayerChar.shotCooldown = 20;
    generatedPlayerChar.shotColor = "green"
    generatedPlayerChar.move = function(){
        if (playerChar.immuneFrames > 0){
            playerChar.immuneFrames--;
        }
        playerInput();
        //rotate player
        playerBoundary();
    };
    generatedPlayerChar.shoot = function(){
        if (frameNo - this.lastShot > this.shotCooldown){
            playerShoot();
        }
    }
    generatedPlayerChar.powerUp = function(powerType){

    }
    return generatedPlayerChar;
}

function generateEnemyChar(){
    let randomX = Math.random() * 800 - 100;
    let randomY = Math.random() * 800 - 100;

    while (randomX < 600 && randomX > 0){
        randomX = Math.random() * 800 - 100;
    }
    while (randomY < 600 && randomY > 0){
        randomY = Math.random() * 800 - 100;
    }
    let generatedEnemyChar = new gameObject(25, 25, "blue", randomX, randomY, "melee");
    generatedEnemyChar.speed = Math.random() + 1.5;
    generatedEnemyChar.randomizer = Math.random();
    generatedEnemyChar.hits = 2;
    generatedEnemyChar.move = function(){
        if (frameNo % 30 > 4){
            if (generatedEnemyChar.randomizer > 0.5){
                if (Math.abs(generatedEnemyChar.x - playerChar.x) <100){
                    gapCloseX(this, 0.2);
                    gapCloseY(this, 0.85);
                } else {
                    gapCloseX(this,1);
                }
            } else {
                if (Math.abs(generatedEnemyChar.y - playerChar.y) <100){
                    gapCloseX(this, 0.85);
                    gapCloseY(this, 0.2);
                } else {
                    gapCloseY(this, 1);
                }
            }
        } else {
            generatedEnemyChar.randomizer = Math.random()
        }
    }
    return generatedEnemyChar;
}

function generatePowerUp(x, y){
    let generatedPowerUp = new gameObject(10,10, "", x, y, "fastShot");
    generatedPowerUp.effect = function(){
        if (this.type === "fastShot"){
            this.color = "green"
            playerChar.shotCooldown = 8;
            playerChar.color = "DarkMagenta";
            setTimeout(function(){
                playerChar.shotCooldown = 20;
                playerChar.color = "red";
            },5000)
        }
    }
    return generatedPowerUp;
}

function gapCloseX(enemy, factor){
    if (enemy.x > playerChar.x){
        enemy.x -= enemy.speed * factor;
    } else {
        enemy.x += enemy.speed * factor;
    }
}

function gapCloseY(enemy, factor){
    if (enemy.y > playerChar.y){
        enemy.y -= enemy.speed * factor;
    } else {
        enemy.y += enemy.speed * factor;
    }
}

function playerInput(){
    if (keyMap[68]) {
        playerChar.x += 2;
    }
    if (keyMap[65]) {
        playerChar.x += -2;
    }
    if (keyMap[87]) {
        playerChar.y += -2;
    }
    if (keyMap[83]) {
        playerChar.y += 2;
    }
    if (keyMap[32]){
        playerChar.shoot()
    }
}

function playerBoundary(){
    let canvasXMax = canvas.width - playerChar.width/2;
    let canvasYMax = canvas.height - playerChar.height/2;

    if (playerChar.x > canvasXMax){
        playerChar.x = canvasXMax;
    }
    if (playerChar.y > canvasYMax){
        playerChar.y = canvasYMax;
    }
    if (playerChar.x - playerChar.width/2< 0){
        playerChar.x = playerChar.width/2;
    }
    if (playerChar.y - playerChar.height/2< 0){
        playerChar.y = playerChar.height/2;
    }
}

function playerShoot(){
    let mouseDx = mousePosition.x - playerChar.x;
    let mouseDy = mousePosition.y - playerChar.y;
    let mousePlayerDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
    let bullet = new gameObject(3, 3, playerChar.shotColor, playerChar.x, playerChar.y, "bullet");
    playerChar.lastShot = frameNo;
    bullet.inBounds = function(){
        return this.x - this.width/2 >= 0 && this.x + this.width/2 <= canvas.width && this.y - this.height/2 >= 0 && this.y + this.height/2 <= canvas.height;
    };
    bullet.move = function(){
        this.x += 7 * (mouseDx/mousePlayerDistance);
        this.y += 7 * (mouseDy/mousePlayerDistance);
        this.active = this.active && this.inBounds();
    };
    playerChar.bullets.push(bullet)
}