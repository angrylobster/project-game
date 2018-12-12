var canvas = document.getElementById('game');
var context = canvas.getContext('2d');
var gameStarted = false;
var keyMap=[], enemies=[], enemiesInPlay = [], powerUps = [];
var playerChar, gameLoop, mousePosition;
var frameNo = 0;

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
    gameStarted = true;
    clearCanvas();
    generatePlayerAndEnemies();
    drawCharacters();
    let countdown = 3
    let countdownInterval = setInterval(function(){
        if (countdown === 0){
            clearInterval(countdownInterval)
            gameStarted = true;
            mainLoop();
        } else {
            gameEventText(countdown)
            countdown--
        }
    },1000)
}

function mainLoop(){
    if (gameStarted){
        frameNo++;
        clearCanvas();
        clearInactiveEnemiesAndBullets();
        putEnemiesInPlay();
        moveCharacters();
        moveBullets();
        checkCollisions();
        drawCharacters();
        drawBullets();
        if(enemiesInPlay.length === 0 && enemies.length ===0){
            win();
        }
        if (playerChar.hits === 0 ){
            lose();
        }
        requestAnimationFrame(mainLoop);
    }
}

function gameWon(){
    if (enemiesInPlay.length === 0 && enemies.length ===0){
        return true;
    }
}

function gameLost(){
    if (playerChar.hits === 0){
        return false;
    }
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
    for (let i = 0 ; i < 20; i++){
        enemies.push(generateRangedEnemy());
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
    for (let enemy of enemiesInPlay){
        for (let enemyBullet of enemy.bullets){
            enemyBullet[functionName]();
        }
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
    if (enemy.hits === 0){
        enemy.active = false;
        rollForPowerUps(enemy);
        playerChar.score++;
    }
}

function rollForPowerUps(enemy){
    let ranNum = Math.random();
    if (ranNum > 0.84){
        powerUps.push(generatePowerUp(enemy.x, enemy.y));
    }
}

function lose(){
    gameStarted = false;
    gameEventText("YOU DIED!")
}

function win(){
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

function gameObject(width, height, imageSource, startingX, startingY){
    let obj = {
        "width": width,
        "height": height,
        "x": startingX,
        "y": startingY,
        "active": true
    };
    obj.image = new Image();
    obj.image.src = imageSource;
    obj.draw = function(){
        context.save();
        context.translate(this.x, this.y);
        context.drawImage(this.image, Math.floor(-this.width/2), Math.floor(-this.height/2), this.width, this.height);
        context.restore();
    }
    obj.collided = function(otherGameObject){
        if (this.x + this.width/2 > otherGameObject.x - otherGameObject.width/2 &&
            this.x - this.width/2 < otherGameObject.x + otherGameObject.width/2 &&
            this.y + this.height/2 > otherGameObject.y - otherGameObject.height/2 &&
            this.y - this.height/2 < otherGameObject.y + otherGameObject.height/2){
            return true;
        }
    }
    return obj;
}

function generatePlayerChar(){
    let playerCharObj = new gameObject(35, 60, "images/player-front.png", 300, 300);
    playerCharObj.bullets = [];
    playerCharObj.hits = 3;
    playerCharObj.immuneFrames = 0;
    playerCharObj.score = 0;
    playerCharObj.shotCooldown = 30;
    playerCharObj.lastShot = 0;
    playerCharObj.shotImage = new Image();
    playerCharObj.shotImage.src = "images/bullet-pink.png"
    playerCharObj.move = function(){
        if (this.immuneFrames > 0){
            this.immuneFrames--;
        }
        this.input();
        this.boundary();
    };
    playerCharObj.shoot = function(){
        if (frameNo - this.lastShot > this.shotCooldown){
            this.bullets.push(shoot(this, mousePosition.x, mousePosition.y));
            this.lastShot = frameNo;
        }
    }
    playerCharObj.powerUp;

    playerCharObj.input = function(){
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

    playerCharObj.boundary = function(){
        let canvasXMax = Math.floor(canvas.width - this.width/2);
        let canvasYMax = Math.floor(canvas.height - this.height/2);

        if (this.x > canvasXMax){
            this.x = canvasXMax;
        }
        if (this.y > canvasYMax){
            this.y = canvasYMax;
        }
        if (this.x - playerChar.width/2< 0){
            this.x = playerChar.width/2;
        }
        if (this.y - playerChar.height/2< 0){
            this.y = playerChar.height/2;
        }
    }
    return playerCharObj;
}

function shoot(sourceObject, targetX, targetY){
    let targetDx = targetX - sourceObject.x;
    let targetDy = targetY - sourceObject.y;
    let targetDistance = Math.sqrt(targetDx * targetDx + targetDy * targetDy);

    let bullet = new gameObject(11, 11, sourceObject.shotImage.src, sourceObject.x, sourceObject.y);
    bullet.inBounds = function(){
        return this.x - this.width/2 >= 0 && this.x + this.width/2 <= canvas.width && this.y - this.height/2 >= 0 && this.y + this.height/2 <= canvas.height;
    };
    bullet.move = function(){
        this.x += 7 * (targetDx/targetDistance);
        this.y += 7 * (targetDy/targetDistance);
        this.active = this.active && this.inBounds();
    };
    return bullet;
}

function generateEnemyObj(){
    let randomX = Math.random() * 700 - 50;
    let randomY = Math.random() * 700 - 50;

    if (randomX < 600 && randomX > 0){
        while (randomY > 0 && randomY < 600){
           randomY = Math.random() * 700 - 50;
        }
    }

    let enemyObj = new gameObject(0, 0, "", randomX, randomY);

    return enemyObj;
}

function generateMeleeEnemy(){
    let meleeEnemy = generateEnemyObj();
    meleeEnemy.speed = Math.random() + 1.5;
    meleeEnemy.randomizer = Math.random();
    meleeEnemy.hits = 2;
    meleeEnemy.width = 24;
    meleeEnemy.height = 36;
    meleeEnemy.image.src = "images/zombie.png";
    meleeEnemy.move = function(){
        if (frameNo % 30 > 4){
            if (this.randomizer > 0.5){
                if (Math.abs(this.x - playerChar.x) <100){
                    gapCloseX(this, 0.2);
                    gapCloseY(this, 0.85);
                } else {
                    gapCloseX(this,1);
                }
            } else {
                if (Math.abs(this.y - playerChar.y) <100){
                    gapCloseX(this, 0.85);
                    gapCloseY(this, 0.2);
                } else {
                    gapCloseY(this, 1);
                }
            }
        } else {
            this.randomizer = Math.random()
        }
    }
    return meleeEnemy;
}

function generateRangedEnemy(){
    let rangedEnemy = generateEnemyObj();
    // rangedEnemy.snipeSpotX, rangedEnemy.snipeSpotY;

    if (rangedEnemy.x > canvas.width){
        rangedEnemy.snipeSpotX = rangedEnemy.x - 100;
    }

    if (rangedEnemy.y > canvas.height){
        rangedEnemy.snipeSpotY = rangedEnemy.y - 100;
    }

    if (rangedEnemy.x < 0){
        rangedEnemy.snipeSpotX = rangedEnemy.x + 100;
    }

    if (rangedEnemy.y < 0){
        rangedEnemy.snipeSpotY = rangedEnemy.y + 100;
    }

    if (rangedEnemy.x > 0 && rangedEnemy.x < canvas.width){
        rangedEnemy.snipeSpotX = rangedEnemy.x;
    }

    if (rangedEnemy.y > 0 && rangedEnemy.y < canvas.height){
        rangedEnemy.snipeSpotY = rangedEnemy.y;
    }

    rangedEnemy.speed = Math.random() + 1.5;
    rangedEnemy.hits = 1;
    rangedEnemy.width = 24;
    rangedEnemy.height = 36;
    rangedEnemy.switchPosition = true;
    rangedEnemy.image.src = "images/zombie.png";
    rangedEnemy.shotImage = new Image();
    rangedEnemy.shotImage.src = "images/bullet.png"
    rangedEnemy.bullets = [];
    rangedEnemy.move = function(){
        if (this.switchPosition){
            if (this.x > this.snipeSpotX){
                this.x -= this.speed;
            }
            if (this.x < this.snipeSpotX){
                this.x += this.speed;
            }
            if (this.y > this.snipeSpotY){
                this.y -= this.speed;
            }
            if (this.y < this.snipeSpotY){
                this.y += this.speed;
            }
        }

        if (Math.abs(this.x - this.snipeSpotX) < 10 && Math.abs(this.y - this.snipeSpotY) < 10 && this.switchPosition){
            this.switchPosition = false;
            this.switchFrame = frameNo + 150;
            this.shoot();
        }
        if (frameNo === this.switchFrame){
            determineSnipePosition(this);
        }
    }

    rangedEnemy.shoot = function(){
        console.log("shoot!")
        this.bullets.push(enemyShoot(this, playerChar.x, playerChar.y));
    }
    return rangedEnemy;
}

function enemyShoot(sourceObject, targetX, targetY){
    let targetDx = targetX - sourceObject.x;
    let targetDy = targetY - sourceObject.y;
    let targetDistance = Math.sqrt(targetDx * targetDx + targetDy * targetDy);

    let bullet = new gameObject(11, 11, sourceObject.shotImage.src, sourceObject.x, sourceObject.y);
    bullet.inBounds = function(){
        return this.x - this.width/2 >= 0 && this.x + this.width/2 <= canvas.width && this.y - this.height/2 >= 0 && this.y + this.height/2 <= canvas.height;
    };
    bullet.move = function(){
        this.x += 4 * (targetDx/targetDistance);
        this.y += 4 * (targetDy/targetDistance);
        this.active = this.active && this.inBounds();
    };
    return bullet;
}

function determineSnipePosition(enemy){
    let randomX, randomY;
    if ((playerChar.x <= canvas.width/2 && playerChar.y <= canvas.height/2) ||
        (playerChar.x <= canvas.width/2 && playerChar.y > canvas.height/2)){
        randomX = (Math.random() * canvas.width / 2) + canvas.width/2;
        if (enemy.y <= canvas.height/2){
            if (randomX <= 500){
                randomY = Math.random() * 100;
            } else {
                randomY = Math.random() * (canvas.height/2 + canvas.height/6);
            }
        }
        if (enemy.y > canvas.height/2){
            if (randomX <= 500){
                randomY = Math.random() * (canvas.height/6) + (canvas.height*5/6);
            } else {
                randomY = (Math.random() * (canvas.height/2 - canvas.height/6)) + canvas.height/2 + canvas.height/6;
            }
        }
    }
    if ((playerChar.x > canvas.width/2 && playerChar.y > canvas.height/2) ||
        (playerChar.x > canvas.width/2 && playerChar.y <= canvas.height/2)){
        randomX = Math.random() * canvas.width / 2;
        if (enemy.y <= canvas.height/2){
            if (randomX > 100){
                randomY = Math.random() * 100;
            } else {
                randomY = Math.random() * canvas.height/2 + canvas.height/6;
            }
        }
        if (enemy.y > canvas.height/2){
            if (randomX > 100){
                randomY = Math.random() * (canvas.height/6) + (canvas.height * 5/6);
            } else {
                randomY = (Math.random() * (canvas.height/2 + canvas.height/6)) + canvas.height/2 - canvas.height/6;
            }
        }
    }
    enemy.snipeSpotX = randomX;
    enemy.snipeSpotY = randomY;
    enemy.switchPosition = true;
}

function distanceFromPlayer(enemy){
    console.log(enemy.x)
}

function generatePowerUp(x, y){
    let ranNum = Math.random()
    let powerUp = new gameObject(20,20, "", x, y);

    if(ranNum >= 0){
        powerUp.type = "fastShot";
        powerUp.image.src = "images/fast-shot.png";
    } else {
        powerUp.type = "scatterShot";
    }

    powerUp.effect = function(){
        if (this.type === "fastShot"){
            playerChar.shotCooldown = 10;
            clearInterval(playerChar.powerUp);
            playerChar.powerUp = setTimeout(function(){
                playerChar.shotCooldown = 30;
            },5000)
        }
    }
    return powerUp;
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





