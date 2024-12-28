//Debug Functions
function updateDebugInfo(info) {
    const debugDiv = document.getElementById('debugInfo');
    debugDiv.innerHTML += info;
}

function setDebugInfo(info){
    const debugDiv = document.getElementById('debugInfo');
    debugDiv.innerHTML = info;
}


// Constants
const G = 1500; 
const timeStep = 0.1;
const grav = 0.5;

//Class declarations
class Particle {
    constructor(x, y, mass, radius) {
        this.x = x;
        this.y = y;
        this.mass = mass;
        this.radius = radius;
        this.vX = 0;
        this.vY = 0;
        this.aX = 0;
        this.aY = 0;
        this.color = this.generateColor();
    }

    generateColor(){
        const randomColor = () => Math.floor(Math.random() * 156) + 100; 
        const r = randomColor();
        const g = randomColor();
        const b = randomColor();
        return "rgb("+r+","+g+","+b+")";
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

class Projectile{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.vX = 0;
        this.vY = 0;
        this.radius = 5;
        this.outline = this.generateColor();
        this.isLaunched = false;
        this.trail = [];
        this.hasHit = false;
    }
    generateColor(){
        const randomColor = () => Math.floor(Math.random() * 156) + 100; 
        const r = randomColor();
        const g = randomColor();
        const b = randomColor();
        return "rgb("+r+","+g+","+b+")";
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.shadowColor = this.outline;
        ctx.fillStyle = '#333';
        ctx.fill();
        ctx.closePath();
        for (let i = 0; i < this.trail.length; i++) {
            const segment = this.trail[i];
            ctx.beginPath();
            ctx.arc(segment.x, segment.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = segment.color;
            ctx.fill();
            ctx.closePath();
        }
    }
    updatePosition(){
        if(this.isLaunched){
            this.vY += grav*timeStep;
            this.x += this.vX*timeStep;
            this.y += this.vY*timeStep;
            this.trail.push({ x: this.x, y: this.y, color: this.outline });
            if (this.trail.length > 40) {
                this.trail.shift();
            }
        }
    }
    launch(vX, vY){
        this.isLaunched = true;
            this.vX = vX;
        this.vY = vY;
    }
}

class Target{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.smallR = 10;
        this.mediumR = 20;
        this.bigR = 30;
        this.color = '#f7ff00'
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.smallR, 0, Math.PI * 2);
        ctx.lineWidth = 2;  
        ctx.strokeStyle = this.color;  
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.mediumR, 0, Math.PI * 2);
        ctx.lineWidth = 2;  
        ctx.strokeStyle = this.color;  
        ctx.stroke();
        ctx.closePath();

        // Draw big circle outline
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.bigR, 0, Math.PI * 2);
        ctx.lineWidth = 2;  
        ctx.strokeStyle = this.color;  
        ctx.stroke();
        ctx.closePath();
    }
    shuffle(){
        target.x = Math.random()*100 + 670;
        target.y = Math.random()*400 + 100
    }
}


//Global Attributes
let proj = null; 
let bodies = []; 
let simulationType = null; 
let editingBody = null;
let simulationRunning = false;
let isProjectileAnimation = false;

// HTML General DIVS
const titleCard = document.getElementById('titleCard');
const menu = document.getElementById('menu');
const simulationCanvas = document.getElementById('simulationCanvas');


//Multiple Body Problem DIVS
const bodyProblemMenu = document.getElementById('bodyProblemMenu');
const ctx = simulationCanvas.getContext('2d');
const bodyProblemButton = document.getElementById('bodyProblemButton');
const saveButton = document.getElementById('saveButton');
const massInput = document.getElementById('massInput');
const radiusInput = document.getElementById('radiusInput');
const closeButton = document.getElementById('closeButton');
const specWindow = document.getElementById('specWindow');

//Projectile Motion DIVS
const projectileMotionButton = document.getElementById('projectileMotionButton');
const projectileMotionMenu = document.getElementById('projectileMotionMenu');

//Canvas Mouse Movements
simulationCanvas.addEventListener('click', (event) => {
    if(simulationType === 'MBP'){
        if (simulationRunning) return; 
        const rect = simulationCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check if we are editing a body
        if (editingBody === null) {
            for (let i = 0; i < bodies.length; i++) {
                const body = bodies[i];
                const distance = Math.sqrt((x - body.x) ** 2 + (y - body.y) ** 2);
                if (distance <= body.radius) {
                    editingBody = body;
                    massInput.value = body.mass;
                    radiusInput.value = body.radius;
                    specWindow.style.display = 'block';  
                    break;  
                }
            }

            if (editingBody === null) {
                if (canPlaceBody(x, y, 20)) {
                    const newParticle = new Particle(x, y, 1, 20);
                    bodies.push(newParticle);
                    newParticle.draw();
                } else {
                    alert('Cannot place body here. The space is too close to another body.');
                }
            }
        } else {
            alert("You are already editing a body. Please save or cancel before adding a new body.");
        }
    }
    else if (simulationType === 'PROJ') {
        const rect = simulationCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (!proj) {
            try {
                proj = new Projectile(Math.min(x, 300), y);
            } catch (error) {
                updateDebugInfo(`Error: ${error.message}`);
            }
            target.color = '#f7ff00'
            animateProjectile();
        } else if(!proj.isLaunched){
            const dx = x - proj.x;
            const dy = y - proj.y;
            const distance = Math.sqrt(dx ** 2 + dy ** 2);
            const angle = Math.atan2(dy, dx);
            const speed = distance / 10;
            proj.launch(speed*Math.cos(angle), speed*Math.sin(angle));
        }
    }
});

//end simulation
const endSimulation = document.createElement('button');
endSimulation.textContent = 'End Simulation';
endSimulation.style.display = 'none';
document.body.appendChild(endSimulation);

endSimulation.addEventListener('click', () => {
    if(simulationType==='MBP'){
        simulationRunning = false;
        bodies = [];
        drawAllBodies();
        ctx.clearRect(0, 0, simulationCanvas.width, simulationCanvas.height);
    }
    else if (simulationType==='PROJ'){
        proj = null;
        animateProjectile();
        ctx.clearRect(0, 0,  simulationCanvas.width, simulationCanvas.height);
    }
    bodyProblemMenu.style.display = 'none';
    projectileMotionMenu.style.display = 'none';
    menu.style.display = 'flex';
    simulationCanvas.style.display = 'none';
    endSimulation.style.display = 'none';
    titleCard.style.display = 'block';
    simulationType = 'none';
});

//Body Problem Selection
bodyProblemButton.addEventListener('click', () => {
    simulationType = 'MBP';
    bodyProblemMenu.style.display = 'block';
    menu.style.display = 'none';
    titleCard.style.display = 'none';
    runSimulation.style.display = 'block'
    simulationCanvas.style.display = 'block';
});

//Run Simulation Button
const runSimulation = document.createElement('button');
runSimulation.textContent = 'Run Simulation';
runSimulation.style.display = 'none';
document.body.appendChild(runSimulation);
runSimulation.style.alignSelf = 'center';

runSimulation.addEventListener('click', () => {
    if (!simulationRunning && simulationType==='MBP') {
        simulationRunning = true;
        menu.style.display = 'none';        
        runSimulation.style.display = 'none';     
        simulationCanvas.style.display = 'block'; 
        endSimulation.style.display = 'block';  
        animateBodies();
    }
});




//Math and animations
function calculateForces() {
    bodies.forEach(body => {
        let fX = 0;
        let fY = 0;

        bodies.forEach(otherBody => {
            if (body !== otherBody) {
                const dx = otherBody.x - body.x;
                const dy = otherBody.y - body.y;
                const distance = Math.sqrt(dx ** 2 + dy ** 2);

                if (distance > body.radius + otherBody.radius) {
                    const force = (G * body.mass * otherBody.mass) / (distance ** 2);
                    const angle = Math.atan2(dy, dx);

                    fX += force * Math.cos(angle);
                    fY += force * Math.sin(angle);
                }
            }
        });

        body.aX = fX / body.mass;
        body.aY = fY / body.mass;
    });
}

function updateBodies() {
    bodies = bodies.filter(body => {
        body.vX += body.aX * timeStep;
        body.vY += body.aY * timeStep;

        body.x += body.vX * timeStep;
        body.y += body.vY * timeStep;

        const isOutOfBounds =
            body.x + body.radius < 0 ||
            body.x - body.radius > simulationCanvas.width ||
            body.y + body.radius < 0 ||
            body.y - body.radius > simulationCanvas.height;

        if (isOutOfBounds) {
            removalEffects.push({ x: body.x, y: body.y, radius: body.radius, alpha: 1 });
        }

        return !isOutOfBounds;
    });
}

function animateRemovals() {
    removalEffects = removalEffects.filter(effect => {
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 0, 0, ${effect.alpha})"; 
        ctx.fill();
        ctx.closePath();

        effect.radius *= 0.95; 
        effect.alpha -= 0.05; 
        return effect.alpha > 0;
    });
}

function animateBodies() {
    if (!simulationRunning) return; 
    ctx.clearRect(0, 0, simulationCanvas.width, simulationCanvas.height);

    calculateForces();
    updateBodies();
    bodies.forEach(body => body.draw());

    requestAnimationFrame(animateBodies);
}

function canPlaceBody(x, y, radius) {
    return bodies.every(body => {
        const distance = Math.sqrt((x - body.x) ** 2 + (y - body.y) ** 2);
        return distance > body.radius + radius;
    });
}


function drawAllBodies() {
    ctx.clearRect(0, 0, simulationCanvas.width, simulationCanvas.height);
    bodies.forEach(body => body.draw());
}

//Popup menu details
saveButton.addEventListener('click', () => {
    if (editingBody !== null) {
        const newRadius = parseFloat(radiusInput.value);
        const newMass = parseFloat(massInput.value);

        const isWithinBounds = 
            editingBody.x - newRadius >= 0 && 
            editingBody.x + newRadius <= simulationCanvas.width &&
            editingBody.y - newRadius >= 0 && 
            editingBody.y + newRadius <= simulationCanvas.height;

        const noOverlap = bodies.every(body => {
            if (body === editingBody) return true;
            const distance = Math.sqrt((editingBody.x - body.x) ** 2 + (editingBody.y - body.y) ** 2);
            return distance >= body.radius + newRadius;
        });

        if (!isWithinBounds) {
            alert("The radius is too large and would exceed the canvas boundaries.");
        } else if (!noOverlap) {
            alert("The radius is too large and would overlap with another body.");
        } else {
            editingBody.radius = newRadius;
            editingBody.mass = newMass;

            specWindow.style.display = 'none';
            editingBody = null;

            ctx.clearRect(0, 0, simulationCanvas.width, simulationCanvas.height);
            bodies.forEach(body => body.draw());
        }
    }
});

closeButton.addEventListener('click', () => {
    specWindow.style.display = 'none';
    editingBody = null;
});


//Projectile Motion
projectileMotionButton.addEventListener('click', () => {
    simulationType = 'PROJ';
    projectileMotionMenu.style.display = 'block';
    menu.style.display = 'none';
    titleCard.style.display = 'none';
    simulationCanvas.style.display = 'block';
    endSimulation.style.display = 'block';
    isProjectileAnimation = true;
    target.shuffle();  
});


let target = new Target(300, 200);;
let dragging = false;
let dragStartX, dragStartY;


function animateProjectile(){
    ctx.clearRect(0, 0, simulationCanvas.width, simulationCanvas.height); 
    if(!proj || !isProjectileAnimation) return;
    proj.updatePosition();
    const dx = proj.x - target.x;
    const dy = proj.y - target.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);
    if (distance <= target.bigR && !proj.hasHit) {
        proj.hasHit = true;
        target.color = 'green'; // Hit the target
    } else if (proj.y > simulationCanvas.height && !proj.hasHit) {
        proj.hasHit = true;
        target.color = 'red'; // Missed the target
    }
    target.draw(); 
    proj.draw();
    requestAnimationFrame(animateProjectile);
}



