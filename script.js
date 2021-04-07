var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 17;

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
light.position.set(0, 100, 200);
scene.add(light);

var sphereRes = 7;
var oldSphereRes = sphereRes;
var geometry = new THREE.IcosahedronGeometry(10, sphereRes);
var material = new THREE.MeshLambertMaterial();
var materialColor = new THREE.Color();
materialColor.setRGB(0.2, 0.8, 0.1);
material.color = materialColor;

var phongMaterial = createShaderMaterial("phongDiffuse", light);
phongMaterial.uniforms.uMaterialColor.value.copy(materialColor);
phongMaterial.side = THREE.DoubleSide;
phongMaterial.wireframe = false;

var sphere = new THREE.Mesh(geometry, phongMaterial);
scene.add(sphere);
sphere.position.x = 0;
sphere.position.y = 0;
sphere.rotation.x = 1.0;

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.zoomSpeed = 0.2;
var clock = new THREE.Clock();

var rx, ry, rz;

var color1 = new THREE.Color(255, 90.0, 0.0);
var color2 = new THREE.Color(0.0, 175, 154.0);
var color3 = new THREE.Color(58.0, 0.0, 164);

var uKd = 1.0;
var waveSpeed = 0.3;
var rotationSpeed = 1.0;
var lighting = true;
var modulation = true;


// MODULATION VARIABLES

var yAmp1 = 2.0;
var yAmp2 = 1.0;
var yFreq1 = 1.0;
var yFreq2 = 1.0;

var xAmp1 = 2.2;
var xAmp2 = 1.2;
var xFreq1 = 1.0;
var xFreq2 = 1.0;

var zAmp1 = 2.7;
var zAmp2 = 1.2;
var zFreq1 = 1.1;
var zFreq2 = 3.8;


// USER INTERFACE

var gui = new dat.GUI({ load: presets });
gui.remember(this);
gui.remember(phongMaterial);

var globalControl = gui.addFolder("Globals");
var sphereResControl = globalControl.add(this, "sphereRes", 0, 7).step(1);
globalControl.add(this, "uKd", 0.1, 3.0);
globalControl.add(this, "waveSpeed", 0.0, 1.0);
globalControl.add(this, "rotationSpeed", 0.0, 5.0);
globalControl.add(this, "lighting");
globalControl.add(this, "modulation");
globalControl.add(phongMaterial, "wireframe");
globalControl.open();

var yModControl = gui.addFolder("Y Modulation");
yModControl.add(this, "yAmp1", 0.0, 5.0);
yModControl.add(this, "yFreq1", 0.0, 5.0);
yModControl.add(this, "yAmp2", 0.0, 5.0);
yModControl.add(this, "yFreq2", 0.0, 5.0);
yModControl.open();

var xModControl = gui.addFolder("X Modulation");
xModControl.add(this, "xAmp1", 0.0, 5.0);
xModControl.add(this, "xFreq1", 0.0, 5.0);
xModControl.add(this, "xAmp2", 0.0, 5.0);
xModControl.add(this, "xFreq2", 0.0, 5.0);
xModControl.open();

var zModControl = gui.addFolder("Z Modulation");
zModControl.add(this, "zAmp1", 0.0, 5.0);
zModControl.add(this, "zFreq1", 0.0, 5.0);
zModControl.add(this, "zAmp2", 0.0, 5.0);
zModControl.add(this, "zFreq2", 0.0, 5.0);
zModControl.open();

var colorControl = gui.addFolder("Colors");
colorControl.addColor(this, "color1");
colorControl.addColor(this, "color2");
colorControl.addColor(this, "color3");
colorControl.open();

gui.close();

sphereResControl.onChange(function(value) {
  if (sphereRes != oldSphereRes) {
  	updateSphereRes();
  	oldSphereRes = sphereRes;
  }
});


function updateSphereRes() {
	sphere.geometry = new THREE.IcosahedronGeometry(10, sphereRes);
}


function loadShader(shadertype) {
	return document.getElementById(shadertype).textContent;
}

function createShaderMaterial(id, light) {

	// could be a global, defined once, but here for convenience
	var shaderTypes = {
		'phongDiffuse' : {

			uniforms: {

				"uDirLightPos":	{ type: "v3", value: new THREE.Vector3() },
				"uDirLightColor": { type: "c", value: new THREE.Color( 0xFFFFFF ) },
				"uMaterialColor": { type: "c", value: new THREE.Color( 0xFFFFFF ) },
				"time" : {type: "f", value: 0.0},
				"color1" : {type: "c", value: new THREE.Color("rgb(0,0,255)")},
				"color2" : {type: "c", value: new THREE.Color("rgb(0,0,255)")},
				"color3" : {type: "c", value: new THREE.Color("rgb(0,0,255)")},

				doesLighting:{type: "i", value:1},
				modulation:{type: "i", value:1},

				uKd: {
					type: "f",
					value: 0.7
				},
				uBorder: {
					type: "f",
					value: 0.4
				},

				yAmp1:{type:"f", value:yAmp1},
				yAmp2:{type:"f", value:yAmp2},
				yFreq1:{type:"f", value:yFreq1},
				yFreq2:{type:"f", value:yFreq2},
				xAmp1:{type:"f", value:xAmp1},
				xAmp2:{type:"f", value:xAmp2},
				xFreq1:{type:"f", value:xFreq1},
				xFreq2:{type:"f", value:xFreq2},
				zAmp1:{type:"f", value:zAmp1},
				zAmp2:{type:"f", value:zAmp2},
				zFreq1:{type:"f", value:zFreq1},
				zFreq2:{type:"f", value:zFreq2}
			}
		}
	};

	var shader = shaderTypes[id];

	var u = THREE.UniformsUtils.clone(shader.uniforms);

	// this line will load a shader that has an id of "vertex" from the .html file
	var vs = loadShader("vertex");
	// this line will load a shader that has an id of "fragment" from the .html file
	var fs = loadShader("fragment");
	var material = new THREE.ShaderMaterial({ uniforms: u, vertexShader: vs, fragmentShader: fs });

	material.uniforms.uDirLightPos.value = light.position;
	material.uniforms.uDirLightColor.value = light.color;

	return material;

}


function render()
{
	requestAnimationFrame(render);
	update();
	renderer.render(scene, camera);
}
render();

function update()
{
	// material.color = materialColor;
	phongMaterial.uniforms.uMaterialColor.value.copy(materialColor);
	phongMaterial.uniforms.time.value += clock.getDelta() * waveSpeed;

	phongMaterial.uniforms.uKd.value = uKd;
	phongMaterial.uniforms.doesLighting.value = lighting;
	phongMaterial.uniforms.modulation.value = modulation;

	phongMaterial.uniforms.color1.value.r = color1.r/255;
	phongMaterial.uniforms.color1.value.g = color1.g/255;
	phongMaterial.uniforms.color1.value.b = color1.b/255;

	phongMaterial.uniforms.color2.value.r = color2.r/255;
	phongMaterial.uniforms.color2.value.g = color2.g/255;
	phongMaterial.uniforms.color2.value.b = color2.b/255;

	phongMaterial.uniforms.color3.value.r = color3.r/255;
	phongMaterial.uniforms.color3.value.g = color3.g/255;
	phongMaterial.uniforms.color3.value.b = color3.b/255;

	phongMaterial.uniforms.yAmp1.value = yAmp1;
	phongMaterial.uniforms.yAmp2.value = yAmp2;
	phongMaterial.uniforms.yFreq1.value = yFreq1;
	phongMaterial.uniforms.yFreq2.value = yFreq2;

	phongMaterial.uniforms.xAmp1.value = xAmp1;
	phongMaterial.uniforms.xAmp2.value = xAmp2;
	phongMaterial.uniforms.xFreq1.value = xFreq1;
	phongMaterial.uniforms.xFreq2.value = xFreq2;

	phongMaterial.uniforms.zAmp1.value = zAmp1;
	phongMaterial.uniforms.zAmp2.value = zAmp2;
	phongMaterial.uniforms.zFreq1.value = zFreq1;
	phongMaterial.uniforms.zFreq2.value = zFreq2;
	
	sphere.rotation.x += 0.001 * rotationSpeed;
	sphere.rotation.y += 0.002 * rotationSpeed;
	sphere.rotation.z += 0.0006 * rotationSpeed;
}

window.addEventListener('resize', function() 
{
	var WIDTH = window.innerWidth,
	HEIGHT = window.innerHeight;
	renderer.setSize(WIDTH, HEIGHT);
	camera.aspect = WIDTH / HEIGHT;
	camera.updateProjectionMatrix();
});

