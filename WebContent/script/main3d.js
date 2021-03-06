/* 
 * Copyright (C) 2015 Alberto Mercati
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// Stores all the celestial body added to the simulation
celestialBodies = [];

// bodies to be added at the beginning of the next simulation step
// (e. g. in case of a collision)
newCelestialBodies = [];

var INTERSECTED;
var elapsedTime = 0;
// Camera controls: they are initialized later
var controls;
var simulationRunning = true;
var addMode = false;

function threeApp(elementContainerId)
{
    initTreeApp(elementContainerId);
    animate();
}

function start(){
    simulationRunning = true;
}

function pause(){
    simulationRunning = false;
}

function initTreeApp(elementContainerId){
    scene = new THREE.Scene();

//	var height = width / ( window.innerWidth / window.innerHeight);
//	var camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 ); 
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 100000);

    renderer = new THREE.WebGLRenderer();

    clock = new THREE.Clock();

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.setClearColor(0x202020, 1.0);

//    scene.fog = new THREE.Fog( 0x111111, 4, 2500 );
    //Ligths
    var ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    var light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(200, 400, 500);

    var light2 = new THREE.DirectionalLight(0xFFFFFF, .6);
    light2.position.set(-400, 200, -300);

    scene.add(light);
    scene.add(light2);
    //Lights end

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById(elementContainerId).appendChild(renderer.domElement);

    addOriginMassiveBody(scene);
    //addSimpleTestBodies(scene);
    addSpiralOfBodies(scene)
    
    //drawAxes(scene);
    drawGalaxyBackground(scene);
    planes = drawHelperPlane(scene);
    
    camera.position.x = -30;
    camera.position.y = 30;
    camera.position.z = 80;
//	camera.rotation.x = - Math.PI / 8;
//	camera.rotation.y = - Math.PI / 8;
//	camera.rotation.z = - Math.PI / 24;

    // Camera controls initialization: the settings are taken from one of the THREE.js examples (webgl_interactive_draggable.html)
    if(Constants.CONTROLS_TYPE === "trackball"){
        var trackBallControls = new THREE.TrackballControls( camera );
        trackBallControls.rotateSpeed = 1.0;
        trackBallControls.zoomSpeed = 1.2;
        trackBallControls.panSpeed = 0.8;
        trackBallControls.noZoom = false;
        trackBallControls.noPan = false;
        trackBallControls.staticMoving = true;
        trackBallControls.dynamicDampingFactor = 0.3; 
        
        controls = trackBallControls;
    }
    else if(Constants.CONTROLS_TYPE === "fly"){
        var flyControls = new THREE.FlyControls(camera);
        flyControls.movementSpeed = 100;
        flyControls.domElement = renderer.domElement;
        flyControls.rollSpeed = Math.PI / 12;
        flyControls.autoForward = false;
        flyControls.dragToLook = false;
        
        controls = flyControls;
    }
    // Use of the Raycaster inspired by  webgl_interactive_cubes.html, in the THREE.js project examples directory
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2()
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousedown', onMouseDown, false);
//    document.addEventListener('keydown', onKeyDown, false);
//    document.addEventListener('keyup', onKeyUp, false);
}

// This function is basically the job of the game loop
// this is good enough, for the moment
function animate()
{
    var delta = clock.getDelta();
    elapsedTime += delta;
    requestAnimationFrame(animate);
    if(simulationRunning){
        updateObjects(delta);
    }
    render();
}

function updateObjects(delta){
       var nextArray = [];
    var bodiesCount = celestialBodies.length;
    for (var i = 0; i < bodiesCount; i++) {
        if (celestialBodies[i].markedForRemoval) {
            scene.remove(celestialBodies[i].mesh);
        }
        else {
            nextArray.push(celestialBodies[i]);
        }
    }

    celestialBodies = nextArray;

    for (var i = 0; i < newCelestialBodies.length; i++) {
        scene.add(newCelestialBodies[i].mesh);
        celestialBodies.push(newCelestialBodies[i]);
    }
    // important: empties the new bodies vector
    newCelestialBodies = [];

    for (var i = 0; i < celestialBodies.length; i++) {
        for (var j = 0; j < celestialBodies.length; j++) {
            if (celestialBodies[i] === celestialBodies[j]) {
                continue;
            }

            celestialBodies[i].addForceContribution(celestialBodies[j]);
        }
    }

    for (var i = 0; i < celestialBodies.length; i++) {
        // not passing delta here: before doing that
        // a problem, that arises when the browser tab is changed, should be fixed 
        celestialBodies[i].updatePosition();

        // check if the body is gone too far: if so, marks it for removal
        if (celestialBodies[i].getPosition().distanceTo(new THREE.Vector3(0, 0, 0)) > Constants.REMOVAL_DISTANCE_THRESHOLD) {
            celestialBodies[i].markedForRemoval = true;
        }
    }

    for (var i = 0; i < celestialBodies.length; i++) {
        for (var j = 0; j < celestialBodies.length; j++) {
            if (celestialBodies[i] === celestialBodies[j]) {
                continue;
            }
            resolveCollision(celestialBodies[i], celestialBodies[j]);
        }
    }
}

function render(){
    if (Constants.CONTROLS_TYPE === "trackball") {
        controls.update();
    }
    else if (Constants.CONTROLS_TYPE === "fly") {
        controls.update(Constants.DEFAULT_TIME_DELTA);
    }
    manageRaycasterIntersections(scene, camera);
    renderer.render(scene, camera);
}

function resolveCollision(firstBody, secondBody){
    // preconditions: checks if the bodies are relly colliding
    if(!firstBody.overlaps(secondBody)){
        return;
    }
    if (firstBody.markedForRemoval || secondBody.markedForRemoval){
        return;
    }
    // both bodies (and both meshes) will be removed, a new one, resulting from the sum
    // of the two, will be added to the scene
    firstBody.markedForRemoval = true;
    secondBody.markedForRemoval = true;
    // the most massive body retains its properties (color, radius, etc...)
    var prototypeBody;
    var disappearingBody;
    if(firstBody.mass >= secondBody.mass){
        prototypeBody = firstBody;
        disappearingBody = secondBody;
    }
    else{
        prototypeBody = secondBody;
        disappearingBody = firstBody;
    }
    
    var maxRadius = Math.max(firstBody.getRadius(), secondBody.getRadius());
    var unionGeometry = new THREE.SphereGeometry(maxRadius, 32, 32);
    var material = prototypeBody.mesh.material; // new THREE.MeshLambertMaterial({color: 0xFF0000});
    var unionMesh = new THREE.Mesh(unionGeometry, material);
    
    var position = prototypeBody.getPosition().clone();
    
    unionMesh.position.x = position.x;
    unionMesh.position.y = position.y;
    unionMesh.position.z = position.z;
    
    // TODO: compute the correct velocity
    
    // m[vx, vy, vz]+mv2[vx2, vy2, vz2]=M[Vx, Vy, Vz]
    // [Vx, Vy, Vz] = m1v1 + m2v2 / M
    var sumMass = firstBody.mass + secondBody.mass;
    var velocity = (firstBody.velocity.clone().multiplyScalar(firstBody.mass).add( secondBody.velocity.clone().multiplyScalar(secondBody.mass) ))
    velocity.divideScalar(sumMass);
    
    var unionBody = new CelestialBody(sumMass, velocity, unionMesh);
    
    newCelestialBodies.push(unionBody);
}

function customLog(message){
	if(Constants.LOG_ENABLED){
		console.log(message);
	}
} 

function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function manageRaycasterIntersections(scene, camera) {
    camera.updateMatrixWorld();
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
//        if (INTERSECTED !== intersects[0].object) {
//            if (INTERSECTED){
//                /INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
//            }
//            INTERSECTED = intersects[0].object;
//            //customLog(INTERSECTED);
//           
//            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
//            INTERSECTED.material.emissive.setHex(0xff0000);
//        }
    } 
    else {
//        if (INTERSECTED){
//            INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
//        }
//        INTERSECTED = null;
    }
}

function onMouseDown(event){
    if(event.ctrlKey || addMode){
        //customLog("mouse position: (" + mouse.x + ", "+ mouse.y + ")");
        /*
            distance – distance between the origin of the ray and the intersection
            point – point of intersection, in world coordinates
            face – intersected face
            faceIndex – index of the intersected face
            indices – indices of vertices comprising the intersected face
            object – the intersected object
         */
        var intersections = raycaster.intersectObjects(planes, false);
        if(intersections.length > 0){
            planeIntersection = intersections[0];
            
            var cameraPosition = camera.position.clone();
            var intersectionPoint = planeIntersection.point.clone();
            
            var velocityVersor = intersectionPoint.sub(cameraPosition).normalize();
            var velocityMagnitude = 20;
            var velocity = velocityVersor.multiplyScalar(velocityMagnitude);
            
            addDefaultCelestialBody(velocity, planeIntersection.point, scene);
//            addCelestialBody(1, 32, 0x00FF00, Constants.MOON_MASS * 10, velocity, planeIntersection.point, scene);
        }
    }
}

function onKeyPressed(event) {
//    var chCode = (event.charCode) ? event.charCode : event.keyCode;

    if (event.ctrlKey) {
        customLog("Control pressed");
    }
}

function onKeyDown(event) {
    // detecting WASD keys
    /*
     * W = 87
     * A = 65
     * S = 83
     * D = 68
     */
    var keyCode = event.keyCode;
}

function onKeyUp(event){
    
}

function toggleHelperPlanesVisibility(){
    for(var i = 0; i < planes.length; i++){
        planes[i].visible = !planes[i].visible;
    }
}