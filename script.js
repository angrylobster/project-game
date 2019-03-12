var canvas = document.getElementById('game');
var context = canvas.getContext('2d');
var gameStarted = false;
var gameEnded = false;
var keyMap=[], enemies=[], enemiesInPlay = [], powerUps = [];
var playerChar, gameLoop, mousePosition, audio, audioIntro, audioMain;
var frameNo = 0;

window.onload = function(){
    introScreen();
    addEventListeners();
    canvas.selection = false;
}

function addEventListeners(){
    document.body.addEventListener("keydown", function(e){
        if(e.keyCode == 13 && !gameStarted && !gameEnded){
            if (audioIntro){
                audioIntro.pause();
            }
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
        if (!gameStarted && !gameEnded && audioIntro ==null){
            audioIntro = new Audio("media/intro.mp3");
            audioIntro.play();
        }
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
    context.font = "60px VT323";
    context.fillStyle = "#FFFFFF";
    context.textAlign = "center";
    context.fillText("Zombie Killer", canvas.width/2, canvas.height/2);
    context.font = "20px Arial";
    context.fillText("Press Enter To Start", canvas.width/2, canvas.height/2 + 250);
}

function startGame(){
    gameStarted = true;
    clearCanvas();
    generatePlayerAndEnemies();
    let countdown = 3;
    let countdownInterval = setInterval(function(){
        if (countdown === 0){
            clearInterval(countdownInterval)
            gameStarted = true;
            audioGame = new Audio("media/game.mp3");
            audioGame.loop = true;
            audioGame.play();
            mainLoop();
        } else {
            drawCharacters();
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
            audioGame.pause();
            win();
        }
        if (playerChar.hits === 0 ){
            audioGame.pause();
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
    context.font = "50px Playfair Display";
    context.fillStyle = 'rgb(230,230,230)'; // or whatever color the background is.
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
    var enemyArray = [];
    for (let i = 0 ; i < 5; i++){
        enemyArray.push(generateMeleeEnemy())
    }
    enemies.push(enemyArray);
    enemyArray = [];
    for (let i = 0; i < 12; i ++){
        enemyArray.push(generateMeleeEnemy())
    }
    enemies.push(enemyArray);
    enemyArray = [];
    for (let i = 0; i < 8; i++){
        enemyArray.push(generateMeleeEnemy())
    }
    for (let i = 0; i < 5; i++){
        enemyArray.push(generateRangedEnemy())
    }
    enemies.push(enemyArray);

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
    for (let enemy of enemiesInPlay){
        enemy.bullets = enemy.bullets.filter(function(bullet){
            return bullet.active;
        });
    }
}

function putEnemiesInPlay(){
    var enemiesToPush;
    if (enemiesInPlay.length === 0 && enemies.length > 0){
        enemiesToPush = enemies.splice(0,1)[0];
        for (let enemy of enemiesToPush){
            enemiesInPlay.push(enemy);
        }
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
        for (let enemyBullet of enemy.bullets){
            if (playerChar.collided(enemyBullet)){
                enemyBullet.active = false;
                playerChar.checkHit();
            }
        }
        if (playerChar.collided(enemy) && playerChar.immuneFrames === 0){
            playerChar.checkHit();
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
        let deathSound = new Audio("media/zombie-death" + Math.floor(Math.random()*3) + ".wav");
        deathSound.volume = 0.2;
        deathSound.play();
        enemy.active = false;
        rollForPowerUps(enemy);
        playerChar.score++;
    }
}

function rollForPowerUps(enemy){
    let ranNum = Math.random();
    if (ranNum > 0.88){
        powerUps.push(generatePowerUp(enemy.x, enemy.y));
    }
}

function lose(){
    gameStarted = false;
    gameEnded = true;
    context.font = "50px Press Start 2P";
    context.fillStyle = 'rgb(255,30,0)'; // or whatever color the background is.
    context.fillText("YOU DIED!", canvas.width/2, canvas.height/2 + 200);
    audioGame = new Audio("media/lose.mp3")
    audioGame.play()
}

function win(){
    gameStarted = false;
    gameEnded = true;
    context.font = "50px Press Start 2P";
    context.fillStyle = "#90EE90"; // or whatever color the background is.
    context.fillText("YOU WON!", canvas.width/2, canvas.height/2 + 200);
    audioGame = new Audio("media/win.mp3")
    audioGame.play()
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
        if (typeof this.angle !== 'undefined'){
            context.rotate(this.angle);
        }
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
    let playerCharObj = new gameObject(34, 70, "images/knight.png", 300, 300);
    playerCharObj.bullets = [];
    playerCharObj.hits = 3;
    playerCharObj.immuneFrames = 0;
    playerCharObj.score = 0;
    playerCharObj.shotCooldown = 30;
    playerCharObj.lastShot = 0;
    playerCharObj.shotImage = new Image();
    playerCharObj.shotImage.src = "images/bullet-pink.png"
    playerCharObj.animationFrames = [];
    playerCharObj.animationFrames.push([24,0])
    playerCharObj.animationFrames.push([276,0])
    playerCharObj.animationFrames.push([106,0])
    playerCharObj.move = function(){
        if (this.immuneFrames > 0){
            this.immuneFrames--;
        }
        this.input();
        this.boundary();
    };

    playerCharObj.draw = function(){
        context.save();
        context.translate(this.x, this.y);
        if (this.immuneFrames !== 0 && frameNo % 5 === 0){
            context.drawImage(this.image, this.animationFrames[2][0], this.animationFrames[2][1], 34, 86, Math.floor(-this.width/2), Math.floor(-this.height/2), this.width, this.height);
        } else {
            if (frameNo % 100 < 50){
                context.drawImage(this.image, this.animationFrames[0][0],this.animationFrames[0][1], 34,86,Math.floor(-this.width/2), Math.floor(-this.height/2), this.width, this.height);
            } else {
                context.drawImage(this.image, this.animationFrames[1][0],this.animationFrames[1][1], 34,86,Math.floor(-this.width/2), Math.floor(-this.height/2), this.width, this.height);
            }
        }
        context.restore();
    }
    playerCharObj.shoot = function(){
        if (frameNo - this.lastShot > this.shotCooldown){
            audio = new Audio("media/playerShot.mp3");
            audio.volume = 0.4
            audio.play();
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

    playerCharObj.checkHit = function(){
        if (this.immuneFrames === 0){
            this.hits--;
            this.immuneFrames = 50;
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
    meleeEnemy.speed = Math.random() + 1.4;
    meleeEnemy.randomizer = Math.random();
    meleeEnemy.hits = 2;
    meleeEnemy.width = 30;
    meleeEnemy.height = 45;
    meleeEnemy.image.src = "images/zombie-alt.png";
    meleeEnemy.bullets = [];
    meleeEnemy.move = function(){
        if (this.hits === 1){
            this.image.src = "images/zombie-damaged-alt.png"
        }
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
    rangedEnemy.width = 22;
    rangedEnemy.height = 40;
    rangedEnemy.switchPosition = true;
    rangedEnemy.lastShot = 0;
    rangedEnemy.shotCooldown = 70;
    rangedEnemy.image.src = "images/skeleton.png";
    rangedEnemy.shotImage = new Image();
    rangedEnemy.shotImage.src = "images/bone.png"
    rangedEnemy.bullets = [];
    rangedEnemy.move = function(){
        if (frameNo - this.lastShot > this.shotCooldown){
            this.shoot();
        }
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
            this.switchFrame = frameNo + 120;
        }
        if (frameNo === this.switchFrame){
            determineSnipePosition(this);
        }
    }

    rangedEnemy.shoot = function(){
        this.bullets.push(enemyShoot(this, playerChar.x, playerChar.y));
        this.lastShot = frameNo;
    }
    return rangedEnemy;
}

function enemyShoot(sourceObject, targetX, targetY){
    let targetDx = targetX - sourceObject.x;
    let targetDy = targetY - sourceObject.y;
    let targetDistance = Math.sqrt(targetDx * targetDx + targetDy * targetDy);

    let bullet = new gameObject(5, 15, sourceObject.shotImage.src, sourceObject.x, sourceObject.y);
    bullet.angle = Math.random()*Math.PI*2;

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
                randomY = (Math.random() * (canvas.height/2 + canvas.height/6)) + canvas.height/2 - canvas.height/6;
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
    
}

function generatePowerUp(x, y){
    let ranNum = Math.random()
    let powerUp = new gameObject(20,20, "", x, y);

    if(ranNum > 0.3){
        powerUp.type = "lifeUp"
        powerUp.image.src = "images/life-up.png";
    } else {
        powerUp.type = "fastShot";
        powerUp.image.src = "images/fast-shot.png";
    }

    powerUp.effect = function(){
        if (this.type === "fastShot"){
            playerChar.shotCooldown = 10;
            clearInterval(playerChar.powerUp);
            audio = new Audio("media/shotgun.mp3")
            audio.play();
            playerChar.powerUp = setTimeout(function(){
                playerChar.shotCooldown = 30;
            },5000)
        }
        if (this.type === "lifeUp"){
            playerChar.hits++;
            audio = new Audio("media/heart.wav")
            audio.volume = 0.3
            audio.play();
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





