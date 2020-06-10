// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');
const random = require('canvas-sketch-util/random');
const palettes = require('nice-color-palettes');

const canvasSketch = require('canvas-sketch');

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  dimensions: [512, 512],
  fps: 60,
  duration: 8,
  attributes: { antialias: true }
};

//635623
// 784537
// 988180
// 106354
random.setSeed(random.getRandomSeed());

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas
  });

  console.log(random.getSeed());

  const palette = random.pick(palettes);
  // WebGL background color
  renderer.setClearColor(`hsl(0, 0%, 85%)`, 1);

  // Setup a camera
  const camera = new THREE.OrthographicCamera();

  // Setup camera controller
  // const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  // Setup a geometry

  // Setup a material

  // Setup a mesh with geometry + material
  const geometry = new THREE.BoxGeometry(1, 1, 1);

  const boxes = [];

  for (let i = 0; i < 50; i++) {
    const material = new THREE.MeshStandardMaterial({
      color: random.pick(palette),
      wireframe: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(random.range(-1, 1), random.range(-0.5, 0.5), random.range(-1, 1));
    mesh.scale.set(random.range(-0.8, 0.8), random.range(-1, 1), random.range(-0.8, 0.8));
    mesh.scale.multiplyScalar(0.5);
    boxes.push(mesh);
  }

  boxes.sort((a, b) => a.scale.y - b.scale.y).forEach((mesh) => scene.add(mesh));

  scene.add(new THREE.AmbientLight(`hsl(0, 0%, 40%)`));

  const light = new THREE.DirectionalLight('white', 1);
  light.position.set(0, 1, 4);
  scene.add(light);

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);

      const aspect = viewportWidth / viewportHeight;

      // Ortho zoom
      const zoom = 2;

      // Bounds
      camera.left = -zoom * aspect;
      camera.right = zoom * aspect;
      camera.top = zoom;
      camera.bottom = -zoom;

      // Near/Far
      camera.near = -100;
      camera.far = 100;

      // Set position & look at world center
      camera.position.set(zoom, zoom, zoom);
      camera.lookAt(new THREE.Vector3());

      // Update the camera
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ playhead }) {
      scene.rotation.y = playhead * Math.PI * 2;
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
