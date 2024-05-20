window.onload = function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const background = new Image();
    background.src = 'fundo.png';

    const rocketImage = new Image();
    rocketImage.src = 'foguete.png';

    const rocketAcceleratingImage = new Image();
    rocketAcceleratingImage.src = 'foguete_acelerando.png';

    const ship = new Image();
    ship.src = 'navio.png';

    const collectibleImage = new Image();
    collectibleImage.src = 'coleta.png';

    class Collectible {
        constructor() {
            this.width = 40;
            this.height = 40;
            this.reset();
        }

        reset() {
            this.x = Math.random() * (canvas.width - this.width);
            this.y = Math.random() * (canvas.height / 4);
        }

        draw(ctx) {
            ctx.drawImage(collectibleImage, this.x, this.y, this.width, this.height);
        }
    }

    class Rocket {
        constructor(brain) {
            this.x = shipX + ship.width / 2 - 50;
            this.y = shipY - 130;
            this.width = 340;
            this.height = 190;
            this.speedX = 0;
            this.speedY = 0;
            this.angle = 0;
            this.isAccelerating = false;
            this.brain = brain || new neataptic.architect.Random(6, 10, 2);
            this.fitness = 0;
        }

        updatePosition(gravity, drag) {
            const deltaX = (collectible.x + collectible.width / 2 - (this.x + this.width / 2)) / canvas.width;
            const deltaY = (collectible.y + collectible.height / 2 - (this.y + this.height / 2)) / canvas.height;

            const inputs = [
                (this.x + this.width / 2) / canvas.width,
                (this.y + this.height / 2) / canvas.height,
                deltaX,
                deltaY,
                Math.sin(this.angle),
                Math.cos(this.angle)
            ];

            const output = this.brain.activate(inputs);

            if (output[0] > 0.5) {
                this.isAccelerating = true;
                this.speedY -= 0.05 * Math.cos(this.angle);
                this.speedX += 0.05 * Math.sin(this.angle);
            } else {
                this.isAccelerating = false;
            }

            this.angle += (output[1] - 0.5) * 0.05;

            this.speedX *= drag;
            this.speedY += gravity;

            this.x += this.speedX;
            this.y += this.speedY;

            // Prevent the rocket from going out of the canvas
            if (this.y <= 0) {
                this.y = 0;
                this.speedY = Math.max(this.speedY, 0);
            }
            if (this.y >= canvas.height - this.height) {
                this.y = canvas.height - this.height;
                this.speedY = Math.min(this.speedY, 0);
            }
            if (this.x <= 0) {
                this.x = 0;
                this.speedX = Math.max(this.speedX, 0);
            }
            if (this.x >= canvas.width - this.width) {
                this.x = canvas.width - this.width;
                this.speedX = Math.min(this.speedX, 0);
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.angle);
            const image = this.isAccelerating ? rocketAcceleratingImage : rocketImage;
            ctx.drawImage(image, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        }

        calculateFitness(collectible) {
            const dx = this.x - (collectible.x + collectible.width / 2 - this.width / 2);
            const dy = this.y - (collectible.y + collectible.height / 2 - this.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const anglePenalty = Math.abs(Math.sin(this.angle));
            this.fitness = Math.max(0, 1000 - distance - anglePenalty * 500);
        }
    }

    let shipX = 90;
    let shipY = 0;
    const gravity = 0.03;
    const drag = 0.99;

    const collectible = new Collectible();

    const NEAT_POPULATION = 1200;
    const neat = new neataptic.Neat(6, 2, null, {
        mutation: [
            neataptic.methods.mutation.ADD_NODE,
            neataptic.methods.mutation.SUB_NODE,
            neataptic.methods.mutation.ADD_CONN,
            neataptic.methods.mutation.SUB_CONN,
            neataptic.methods.mutation.MOD_WEIGHT,
            neataptic.methods.mutation.MOD_BIAS,
            neataptic.methods.mutation.MOD_ACTIVATION,
            neataptic.methods.mutation.ADD_SELF_CONN,
            neataptic.methods.mutation.ADD_GATE,
            neataptic.methods.mutation.SUB_GATE,
            neataptic.methods.mutation.ADD_BACK_CONN
        ],
        popsize: NEAT_POPULATION,
        mutationRate: 0.3,
        elitism: Math.round(0.2 * NEAT_POPULATION),
        network: new neataptic.architect.Random(6, 20, 2)
    });

    let rockets = [];
    let frameCount = 0;
    let bestFitness = 0;
    let bestScoreOfGeneration = 0;
    let displayBestScoreOfLastGen = 0;

    function initNeat() {
        rockets = neat.population.map(brain => new Rocket(brain));
        frameCount = 0;
        neat.sort();
        bestFitness = neat.population[0].fitness;
        bestScoreOfGeneration = 0;
    }

    function updateNeat() {
        rockets.forEach(rocket => {
            rocket.calculateFitness(collectible);
            if (rocket.fitness > bestFitness) {
                bestFitness = rocket.fitness;
            }
            if (rocket.fitness > bestScoreOfGeneration) {
                bestScoreOfGeneration = rocket.fitness;
            }
        });

        displayBestScoreOfLastGen = bestScoreOfGeneration;

        neat.sort();
        bestFitness = neat.population[0].fitness;

        const newPopulation = [];

        for (let i = 0; i < neat.elitism; i++) {
            newPopulation.push(neat.population[i]);
        }

        for (let i = 0; i < neat.popsize - neat.elitism; i++) {
            newPopulation.push(neat.getOffspring());
        }

        neat.population = newPopulation;
        neat.mutate();
        neat.generation++;
        rockets = neat.population.map(brain => new Rocket(brain));
        collectible.reset();

        bestScoreOfGeneration = 0;
    }

    background.onload = function() {
        ctx.drawImage(background, 0, 0, background.width, background.height, 0, 0, canvas.width, canvas.height);
    };

    ship.onload = function() {
        shipY = canvas.height - ship.height;
        initNeat();
        requestAnimationFrame(gameLoop);
    };

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        rockets.forEach(rocket => {
            rocket.updatePosition(gravity, drag);
            rocket.draw(ctx);
        });

        ctx.drawImage(ship, shipX, shipY, ship.width, ship.height);
        collectible.draw(ctx);

        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(`Generation: ${neat.generation}`, 10, 20);

        if (typeof bestFitness === 'number') {
            ctx.fillText(`Best Fitness: ${bestFitness.toFixed(2)}`, 10, 40);
        }

        let bestRocket = rockets.reduce((best, rocket) => (rocket.fitness > best.fitness ? rocket : best), rockets[0]);
        if (bestRocket) {
            ctx.fillText(`Best X: ${bestRocket.x.toFixed(2)}`, 10, 60);
            ctx.fillText(`Best Y: ${bestRocket.y.toFixed(2)}`, 10, 80);
        }

        if (typeof displayBestScoreOfLastGen === 'number') {
            ctx.fillText(`Best Score of Last Gen: ${displayBestScoreOfLastGen.toFixed(2)}`, 10, 100);
        }

        frameCount++;
        if (frameCount >= 500 || rockets.every(rocket => rocket.y + rocket.height < 0 || rocket.y > canvas.height || rocket.x + rocket.width < 0 || rocket.x > canvas.width)) {
            frameCount = 0;
            updateNeat();
        }

        requestAnimationFrame(gameLoop);
    }
};