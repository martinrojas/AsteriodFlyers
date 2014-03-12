var fogExp2 = true;

var container, stats;

var camera, controls, scene, renderer;

var mesh, mat, data = [];

var worldWidth = 400, worldDepth = 400,
worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
// data = generateHeight( worldWidth, worldDepth );

var clock = new THREE.Clock();

// init();
// animate();

function mineCraftInit(rotation) {

	container = document.getElementById( 'gameArea' );

	//Perspective camera set up
	camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 50000 );
	camera.position.y = getY( worldHalfWidth, worldHalfDepth ) * 100 + 100;
	camera.rotation.y = rotation;

	
	// controls = new THREE.FirstPersonControls( camera );
	controls = new THREE.FlyControls( camera );

	controls.movementSpeed = 1000;
	controls.lookSpeed = 0.125;
	controls.lookVertical = true;
	controls.constrainVertical = true;
	controls.verticalMin = 1.1;
	controls.verticalMax = 2.2;

	scene = new THREE.Scene();
	// scene.fog = new THREE.FogExp2( 0xffffff, 0.00015 );

	// sides
	
	var light = new THREE.Color( 0xffffff );
	var shadow = new THREE.Color( 0x505050 );

	var matrix = new THREE.Matrix4();

	var pxGeometry = new THREE.PlaneGeometry( 100, 100 );
	pxGeometry.faceVertexUvs[ 0 ][ 0 ][ 0 ].y = 0.5;
	pxGeometry.faceVertexUvs[ 0 ][ 0 ][ 2 ].y = 0.5;
	pxGeometry.faceVertexUvs[ 0 ][ 1 ][ 2 ].y = 0.5;
	pxGeometry.applyMatrix( matrix.makeRotationY( Math.PI / 2 ) );
	pxGeometry.applyMatrix( matrix.makeTranslation( 50, 0, 0 ) );

	var nxGeometry = new THREE.PlaneGeometry( 100, 100 );
	nxGeometry.faceVertexUvs[ 0 ][ 0 ][ 0 ].y = 0.5;
	nxGeometry.faceVertexUvs[ 0 ][ 0 ][ 2 ].y = 0.5;
	nxGeometry.faceVertexUvs[ 0 ][ 1 ][ 2 ].y = 0.5;
	nxGeometry.applyMatrix( matrix.makeRotationY( - Math.PI / 2 ) );
	nxGeometry.applyMatrix( matrix.makeTranslation( - 50, 0, 0 ) );

	var pyGeometry = new THREE.PlaneGeometry( 100, 100 );
	pyGeometry.faceVertexUvs[ 0 ][ 0 ][ 1 ].y = 0.5;
	pyGeometry.faceVertexUvs[ 0 ][ 1 ][ 0 ].y = 0.5;
	pyGeometry.faceVertexUvs[ 0 ][ 1 ][ 1 ].y = 0.5;
	pyGeometry.applyMatrix( matrix.makeRotationX( - Math.PI / 2 ) );
	pyGeometry.applyMatrix( matrix.makeTranslation( 0, 50, 0 ) );

	var pzGeometry = new THREE.PlaneGeometry( 100, 100 );
	pzGeometry.faceVertexUvs[ 0 ][ 0 ][ 0 ].y = 0.5;
	pzGeometry.faceVertexUvs[ 0 ][ 0 ][ 2 ].y = 0.5;
	pzGeometry.faceVertexUvs[ 0 ][ 1 ][ 2 ].y = 0.5;
	pzGeometry.applyMatrix( matrix.makeTranslation( 0, 0, 50 ) );

	var nzGeometry = new THREE.PlaneGeometry( 100, 100 );
	nzGeometry.faceVertexUvs[ 0 ][ 0 ][ 0 ].y = 0.5;
	nzGeometry.faceVertexUvs[ 0 ][ 0 ][ 2 ].y = 0.5;
	nzGeometry.faceVertexUvs[ 0 ][ 1 ][ 2 ].y = 0.5;
	nzGeometry.applyMatrix( matrix.makeRotationY( Math.PI ) );
	nzGeometry.applyMatrix( matrix.makeTranslation( 0, 0, -50 ) );

	//

	var geometry = new THREE.Geometry();
	var dummy = new THREE.Mesh();

	for ( var z = 0; z < worldDepth; z ++ ) {

		for ( var x = 0; x < worldWidth; x ++ ) {

			var h = getY( x, z );

			dummy.position.x = x * 100 - worldHalfWidth * 100;
			dummy.position.y = h * 100;
			dummy.position.z = z * 100 - worldHalfDepth * 100;

			var px = getY( x + 1, z );
			var nx = getY( x - 1, z );
			var pz = getY( x, z + 1 );
			var nz = getY( x, z - 1 );

			dummy.geometry = pyGeometry;
			THREE.GeometryUtils.merge( geometry, dummy );

			if ( ( px != h && px != h + 1 ) || x == 0 ) {

				dummy.geometry = pxGeometry;
				THREE.GeometryUtils.merge( geometry, dummy );

			}

			if ( ( nx != h && nx != h + 1 ) || x == worldWidth - 1 ) {

				dummy.geometry = nxGeometry;
				THREE.GeometryUtils.merge( geometry, dummy );

			}

			if ( ( pz != h && pz != h + 1 ) || z == worldDepth - 1 ) {

				dummy.geometry = pzGeometry;
				THREE.GeometryUtils.merge( geometry, dummy );

			}

			if ( ( nz != h && nz != h + 1 ) || z == 0 ) {

				dummy.geometry = nzGeometry;
				THREE.GeometryUtils.merge( geometry, dummy );

			}

		}

	}

	var texture = THREE.ImageUtils.loadTexture( 'textures/minecraft/atlas.png' );
	texture.magFilter = THREE.NearestFilter;
	texture.minFilter = THREE.LinearMipMapLinearFilter;

	////////////
	// SKYBOX //
	////////////

	var imagePrefix = "textures/skybox/skybox-";
	var directions  = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"];
	var imageSuffix = ".png";
	var skyGeometry = new THREE.CubeGeometry( 50000, 50000, 50000 );	
	
	var materialArray = [];
	for (var i = 0; i < 6; i++)
		materialArray.push( new THREE.MeshBasicMaterial({
			map: THREE.ImageUtils.loadTexture( imagePrefix + directions[i] + imageSuffix ),
			side: THREE.BackSide
		}));
	var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
	var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
	scene.add( skyBox );

	var mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { map: texture, ambient: 0x18A9DC } ) );
	scene.add( mesh );

	var ambientLight = new THREE.AmbientLight( 0xcdcdcd );
	scene.add( ambientLight );

	var directionalLight = new THREE.DirectionalLight( 0xffffff, 2 );
	directionalLight.position.set( 1, 1, 0.5 ).normalize();
	scene.add( directionalLight );

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0xbfd1e5, 1 );
	renderer.setSize( window.innerWidth, window.innerHeight );

	container.innerHTML = "";

	container.appendChild( renderer.domElement );

	window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	controls.handleResize();

}

function loadTexture( path, callback ) {

	var image = new Image();

	image.onload = function () { callback(); };
	image.src = path;

	return image;

}

function generateHeight( width, height ) {

	var perlin = new ImprovedNoise(),
	size = width * height, quality = 2, z = Math.random() * 100;

	for ( var j = 0; j < 4; j ++ ) {

		if ( j == 0 ) for ( var i = 0; i < size; i ++ ) data[ i ] = 0;

		for ( var i = 0; i < size; i ++ ) {

			var x = i % width, y = ( i / width ) | 0;
			data[ i ] += perlin.noise( x / quality, y / quality, z ) * quality;

		}

		quality *= 4

	}

	// return data;

}

function getY( x, z ) {

	return ( data[ x + z * worldWidth ] * 0.2 ) | 0;

}

//

function animate() {

	requestAnimationFrame( animate );

	render();

}

function render() {

	controls.update( clock.getDelta() );
	renderer.render( scene, camera );

}