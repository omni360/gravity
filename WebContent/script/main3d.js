Constants = {
		"G" : 6.673E-11,
		"EARTH_MASS" : 	5.972E+24,
		"MOON_MASS" : 7.348E+22,
		"JUPITER_MASS" : 1.8986E+27,
		"EARTH_MOON_DISTANCE" : 384400000, //384,400 Km
		"EARTH_MOON_SCREEN_DISTANCE" : 50,
		"DISTANCE_SCALE_FACTOR" :  undefined
}

Constants.DISTANCE_SCALE_FACTOR = Constants.EARTH_MOON_DISTANCE / Constants.EARTH_MOON_SCREEN_DISTANCE;

function threeApp()
{
	var scene = new THREE.Scene();
	var width = 40;
	
//	var height = 40 / ( window.innerWidth / window.innerHeight);
//	var camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 ); 
	var camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 1, 1000);
	
	// Camera controls: they are initialized later
	var controls;
	var renderer = new THREE.WebGLRenderer();
	
	var elapsedTime = 0;
    var cameraDirection = 1;
    var direction = 1;
	
	var clock = new THREE.Clock();
	var cameraControls; /*, effectController;*/
	
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setClearColor( 0xffffff, 1.0 );
	
//	scene.fog = new THREE.Fog( 0x111111, 4, 25 );
	//Ligths
	var ambientLight = new THREE.AmbientLight( 0x000000 );
	var light = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light.position.set( 200, 400, 500 );

	var light2 = new THREE.DirectionalLight( 0x00FF00, 1.0 );
	light2.position.set( -400, 200, -300 );

	scene.add(ambientLight);
	scene.add(light);
//	scene.add(light2);
	//Lights end
	
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

//	var geometry = new THREE.CubeGeometry(1, 1, 1);
////	var material = new THREE.MeshBasicMaterial( {color : 0x00f233} );
//	material = new THREE.MeshLambertMaterial( {color : 0xfff233} );
//	var cube = new THREE.Mesh(geometry, material);
//	cube.position.x = -2;
//	scene.add(cube);
	
//	geometry = new THREE.CubeGeometry(1,3,1);
//	material = new THREE.MeshLambertMaterial({ color : 0xff44ff});
//	var parall = new THREE.Mesh(geometry, material);
//	parall.position.x = 2;
//	scene.add(parall);

    var planetGeometry = new THREE.SphereGeometry( .5, 64, 64);
    material = new THREE.MeshPhongMaterial( {color: 0xffff00} );
    planetSphere = new THREE.Mesh( planetGeometry, material );
    scene.add( planetSphere );

    var moonGeometry = new THREE.SphereGeometry( .5, 64, 64);
    material = new THREE.MeshPhongMaterial( {color: 0xff0000} );
    moonSphere = new THREE.Mesh( moonGeometry, material );
    scene.add( moonSphere );
    
    //
	drawAxis(scene);
    //
    
    moonSphere.position.x = 25;
    moonSphere.position.y = 0;
    moonSphere.position.z = -4.5;
    
	camera.position.z = 25;
	camera.position.x = 2;
	camera.position.y = 4;
//	camera.rotation.x = - Math.PI / 8;
//	camera.rotation.y = - Math.PI / 8;
//	camera.rotation.z = - Math.PI / 24;

	// Camera controls initialization: the settings are taken from one of the THREE.js examples (webgl_interactive_draggable.html)
	controls = new THREE.TrackballControls( camera );
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;
	controls.noZoom = false;
	controls.noPan = false;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3; 
	
	// this is obsolete code
//	cameraControls = new THREE.Camera();
//	cameraControls = new THREE.OrbitAndPanControls(camera, renderer.domElement);
//	console.log("cameraControls.target = " + cameraControls.target);
//	cameraControls.target.set(0,15,0);
	
	function render()
	{	
		var delta = clock.getDelta();
		elapsedTime += delta;
		requestAnimationFrame(render);
		
		var squareElapsedTime = elapsedTime * elapsedTime

		var moonX = 25 * Math.cos(elapsedTime);
		var moonY = Math.sin(elapsedTime * 6);
		var moonZ = -4.5 * Math.sin(elapsedTime);
		
//		console.log(moonX + ", " + moonY);
		
		moonSphere.position.x = moonX;
		moonSphere.position.y = moonY;
		moonSphere.position.z = moonZ;
        
		controls.update();
		
		renderer.render(scene, camera);
	}
	
	render();
}

function drawAxis(scene){
	
	var AXIS_EXTREME = 100; 
	
	var geometry = new THREE.Geometry();
	var lineMaterial = new THREE.LineBasicMaterial({ color: 0xFF0000, opacity: 0.9 });
	
	geometry.vertices.push(new THREE.Vector3(-AXIS_EXTREME, 0, 0));
	geometry.vertices.push(new THREE.Vector3(AXIS_EXTREME, 0, 0));
	var xAxis =  new THREE.Line(geometry, lineMaterial);
	scene.add(xAxis);
	
	lineMaterial = new THREE.LineBasicMaterial({ color: 0x00FF00, opacity: 0.9 });
	geometry = new THREE.Geometry();
	geometry.vertices.push(new THREE.Vector3(0, -AXIS_EXTREME, 0));
	geometry.vertices.push(new THREE.Vector3(0, AXIS_EXTREME, 0));
	var yAxis = new THREE.Line(geometry, lineMaterial);
	scene.add(yAxis);
	
	geometry = new THREE.Geometry();
	geometry.vertices.push(new THREE.Vector3(0, 0, -AXIS_EXTREME));
	geometry.vertices.push(new THREE.Vector3(0, 0, AXIS_EXTREME));
	var zAxis = new THREE.Line(geometry, lineMaterial);
	scene.add(zAxis);
	
	geometry = new THREE.Geometry();
	geometry.vertices.push(new THREE.Vector3(-AXIS_EXTREME, 0, -AXIS_EXTREME));
	geometry.vertices.push(new THREE.Vector3(AXIS_EXTREME, 0, -AXIS_EXTREME));
	var controlLine = new THREE.Line(geometry, lineMaterial);
	scene.add(controlLine);
}

function CelestialBody(mass, velocity, mesh){
	this.mass = mass;
	this.velocity = velocity;
	this.acceleration = new THREE.Vector3(0, 0, 0);
	this.mesh = mesh;
	
	this.getPosition = function(){
		return mesh.position;
	};
	
	this.getVelocity = function(){
		return this.velocity;
	};
	
	this.squareDistanceFrom = function(body){
		myPosition = this.getPosition();
		var squareDistance = body.getPosition().distanceToSquared(myPosition);
	};
	
	this.distanceFrom = function(body){
		return this.getPosition().distanceTo(body.getPosition());
	};
	
	this.forceBetween = function(body){
		var squareDistance = this.squareDistanceFrom(body);
		var force = G * (this.mass * body.mass) / squareDistance;
		return -1 * force;
	};
	
	this.addForceContribution = function(body){
		var forceMagnitude = this.forceBetween(body);
		var distance = this.distanceFrom(body);
		
		var xDiff = body.getPosition().x - this.getPosition().x;
		var yDiff = body.getPosition().y - this.getPosition().y;
		var zDiff = body.getPosition().z - this.getPosition().z;
		
		var xRatio = xDiff / distance;
		var yRatio = yDiff / distance;
		var zRatio = zDiff / distance;
		
		var fx = forceMagnitude * xRatio;
		var fy = forceMagnitude * yRatio;
		var fz = forceMagnitude * zRatio;
		
		var forceVector = new THREE.Vector3(fx, fy, fz);
		
		this.acceleration = this.acceleration.add( forceVector.divideScalar(this.mass) );
	};
	
	this.updatePosition = function(delta){
		this.velocity = this.velocity.add(this.acceleration.multiplyScalar(delta));
		
		this.mesh.position = this.getPosition().add( this.velocity.multiplyScalar(delta) );
		
		this.acceleration = new THREE.Vector3(0, 0, 0);
	};
}
















