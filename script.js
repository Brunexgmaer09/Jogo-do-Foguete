window.onload = function() {
    var canvas = document.getElementById('gameCanvas');
    var ctx = canvas.getContext('2d');
    
    var background = new Image();
    background.src = 'fundo.png';

    var rocket = new Image();
    rocket.src = 'foguete.png';

    var rocketAccelerating = new Image();
    rocketAccelerating.src = 'foguete_acelerando.png';

    var ship = new Image();
    ship.src = 'navio.png';

    var coletaX = Math.random() * canvas.width;
    var coletaY = Math.random() * canvas.height / 2;

    var coletaSpeedX = 1;
    var coletaSpeedY = 1;
    var coletaHitCount = 0;

    var rockets = [];
    for (var i = 0; i < 200; i++) {
        rockets.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speedX: 0,
            speedY: 0,
            angle: 0,
            isAccelerating: false
        });
    }

    var shipX = 90;
    var shipY = 1029 - ship.height;

    var gravity = 0.4;
    var drag = 0.99;

    window.onkeydown = function(e) {
        if (e.key == ' ') upPressed = true;
        if (e.key == 'a') leftPressed = true;
        if (e.key == 'd') rightPressed = true;
    }

    window.onkeyup = function(e) {
        if (e.key == ' ') upPressed = false;
        if (e.key == 'a') leftPressed = false;
        if (e.key == 'd') rightPressed = false;
    }

    background.onload = function() {
        ctx.drawImage(background, 0, 0, background.width, background.height, 0, 0, canvas.width, canvas.height);
    }

    rocket.onload = function() {
        ctx.drawImage(rocket, 50, 50, 100, 130);
    }

    ship.onload = function() {
        shipY = 1029 - ship.height;
        ctx.drawImage(ship, shipX, shipY, ship.width, ship.height);
    }
    
function controlRocketAI(rocket, rockets) {
    var deltaX = coletaX - (rocket.x + 50);
    var deltaY = coletaY - (rocket.y + 65);
    var targetAngle = Math.atan2(deltaY, deltaX) + Math.PI / 2;

    var angleDifference = targetAngle - rocket.angle;
    angleDifference = (angleDifference + Math.PI) % (2 * Math.PI) - Math.PI;

    // Limitar a diferença de ângulo para suavizar a rotação
    var maxAngleChange = 0.03; // Ajuste esse valor para suavizar mais ou menos
    angleDifference = Math.max(Math.min(angleDifference, maxAngleChange), -maxAngleChange);

    rocket.angle += angleDifference;

    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    var distanceForMaxThrust = 200;
    var distanceForCutOff = 100;

    if (distance > distanceForMaxThrust) {
        rocket.isAccelerating = true;
    } else if (distance < distanceForCutOff) {
        rocket.isAccelerating = false;
    } else {
        rocket.isAccelerating = (distance - distanceForCutOff) / (distanceForMaxThrust - distanceForCutOff) > 0;
    }

    rocket.speedX += rocket.isAccelerating ? Math.sin(rocket.angle) * 0.5 : 0;
    rocket.speedY += rocket.isAccelerating ? -Math.cos(rocket.angle) * 0.5 : 0;

    // Lógica de separação para evitar sobreposição (mantém-se inalterada)
    var separationDistance = 50;
    rockets.forEach(function(otherRocket) {
        if (otherRocket !== rocket) {
            var distX = rocket.x - otherRocket.x;
            var distY = rocket.y - otherRocket.y;
            var distanceBetween = Math.sqrt(distX * distX + distY * distY);
            if (distanceBetween > 0 && distanceBetween < separationDistance) {
                rocket.speedX += distX / distanceBetween * 0.001; // Força de separação mais suave
                rocket.speedY += distY / distanceBetween * 0.005;
            }
        }
    });

    // Restrições adicionais, se necessário (mantém-se inalteradas)
    if (rocket.y < 10) {
        rocket.speedY = 0;
    }
    // Lógica de separação para evitar sobreposição
    var separationDistance = 9;
    rockets.forEach(function(otherRocket) {
        if (otherRocket !== rocket) {
            var distX = rocket.x - otherRocket.x;
            var distY = rocket.y - otherRocket.y;
            var distanceBetween = Math.sqrt(distX * distX + distY * distY);
            if (distanceBetween > 0 && distanceBetween < separationDistance) {
                rocket.speedX += distX / distanceBetween * 0.5; // Força de separação mais suave
                rocket.speedY += distY / distanceBetween * 0.5;
            }
        }
    });
}

    var timer = 0;

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        var platformY = 948;

        coletaX += coletaSpeedX;
        coletaY += coletaSpeedY;

        if (coletaX < 50 || coletaX > canvas.width - 50) {
            coletaSpeedX = -coletaSpeedX;
        }
        if (coletaY < 50 || coletaY > canvas.height / 2 - 50) {
            coletaSpeedY = -coletaSpeedY;
        }

for (var i = 0; i < rockets.length; i++) {
    var rocket = rockets[i];

            rocket.speedX *= drag;
            rocket.speedY += gravity;
            rocket.x += rocket.speedX;
            rocket.y += rocket.speedY;

            if (rocket.x < 0) rocket.x = 0;
            if (rocket.y < 0) rocket.y = 0;
            if (rocket.x > canvas.width - 30) rocket.x = canvas.width - 30;
            if (rocket.y > canvas.height - 50) rocket.y = canvas.height - 50;

            ctx.save();
            ctx.translate(rocket.x + 50, rocket.y + 65);
            ctx.rotate(rocket.angle);
            controlRocketAI(rocket, rockets);

            var rocketImg = rocket.isAccelerating ? rocketAccelerating : rocket;
            if (rocketImg.complete && rocketImg.naturalHeight !== 0) {
                ctx.drawImage(rocketImg, -275, -150, 550, 300);
            }

            ctx.restore();

            if (Math.sqrt((rocket.x - coletaX) ** 2 + (rocket.y - coletaY) ** 2) < 50) {
                coletaHitCount++;
                if (coletaHitCount >= 180) {
                    coletaX = Math.random() * canvas.width;
                    coletaY = Math.random() * canvas.height / 2;
                    coletaHitCount = 0;
                }
            }
        }

        ctx.beginPath();
        ctx.arc(coletaX, coletaY, 50, 0, Math.PI * 2, false);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.closePath();

        ctx.drawImage(ship, shipX, shipY, ship.width, ship.height);

        for (var i = 0; i < rockets.length; i++) {
            var rocket = rockets[i];
            ctx.beginPath();
            ctx.moveTo(rocket.x + rocket.width / 2, rocket.y + rocket.height / 2);
            ctx.lineTo(coletaX, coletaY);
            ctx.stroke();

            if (Math.sqrt((rocket.x - coletaX) ** 2 + (rocket.y - coletaY) ** 2) < 50) {
                timer++;
            } else {
                timer = 0;
            }

            if (timer >= 60) {
                console.log('Você ganhou!');
            }
        }

        requestAnimationFrame(gameLoop);
    }

    gameLoop();
}


