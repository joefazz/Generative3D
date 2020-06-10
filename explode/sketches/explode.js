// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');

const glsl = require('glslify');

const canvasSketch = require('canvas-sketch');

const settings = {
  // Make the loop animated
  animate: true,
  dimensions: [720, 720],
  fps: 60,
  duration: 20,
  // Get a WebGL canvas rather than 2D
  context: 'webgl'
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas
  });

  // WebGL background color
  renderer.setClearColor('#000', 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 100);
  camera.position.set(1, 1, 2);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);
  // controls.autoRotate = true;

  // Setup your scene
  const scene = new THREE.Scene();

  // Setup a geometry
  const geometry = new THREE.IcosahedronBufferGeometry(1, 2);
  const secondGeo = new THREE.IcosahedronGeometry(0.2, 0);

  const positions = geometry.getAttribute('position');
  const vertexCount = positions.count;
  const triangleCount = vertexCount / 3;

  console.log(positions);

  let randomDirections = [];
  let randomStrengths = [];

  // For each triangle
  for (let i = 0; i < triangleCount; i++) {
    // Create a random direction to travel in
    const dir = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    )
      .normalize() // make it a unit vector
      .toArray();

    const directions = [dir, dir, dir].flat(); // This means that every 3 vertices this is applied to will have the same direction attr

    // Create a random strength to propel the triangle with
    const strength = Math.random() * 10;

    randomDirections.push(...directions);
    randomStrengths.push(strength, strength, strength);
  }

  // Create a buffer attribute that will apply each array value to 3 vertex before going to the next element
  const randomDirectionsAttribute = new THREE.BufferAttribute(
    new Float32Array(randomDirections),
    3
  );

  const randomStrengthAttribute = new THREE.BufferAttribute(new Float32Array(randomStrengths), 1);

  geometry.addAttribute('randDirection', randomDirectionsAttribute);
  geometry.addAttribute('randStrength', randomStrengthAttribute);

  const vertexShader = glsl(/* glsl */ `
    varying vec3 vPosition;
    uniform float time;
    attribute vec3 randDirection;
    attribute float randStrength;

    void main() {
      vPosition = position * 0.8;

      // Logic for calculating the position of each vertex based on it's attr's and time
      vPosition.xyz *= (abs(randDirection) * abs(sin(time) * 0.1) * 2.0 * randStrength * 0.5) + 1.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition.xyz, 1.0);
    }
  `);

  const fragmentShader = glsl(/* glsl */ `
    varying vec3 vPosition;
    uniform vec3 color;
    uniform float time;

    void main() {
      // Change the colour because why not
      gl_FragColor = vec4(vec3(color + vPosition.xyz * abs(sin(time))), 1.0);
    }
  `);

  // Setup a material
  const material = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color('tomato') },
      time: { value: 0.0 }
    },
    vertexShader,
    fragmentShader,
    wireframe: false,
    side: THREE.DoubleSide
  });

  const smallMat = new THREE.MeshNormalMaterial();

  // Setup a mesh with geometry + material
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const smallMesh = new THREE.Mesh(secondGeo, smallMat);
  scene.add(smallMesh);

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ time, playhead }) {
      material.uniforms.time.value = Math.sin(playhead) * Math.PI * 1.22;

      // Camera animation logic
      if (camera.position.z > -2.5) {
        camera.position.setZ(-(Math.abs(Math.sin(playhead) * Math.PI) - 1.5) * 2);
      }

      // Spin that D20
      smallMesh.rotateX(Math.sin(time * 0.001));
      smallMesh.rotateY(Math.sin(time * 0.001));

      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose();
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
