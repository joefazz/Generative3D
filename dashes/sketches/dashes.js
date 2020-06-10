// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');
const glsl = require('glslify');
const canvasSketch = require('canvas-sketch');

const settings = {
  // Make the loop animated
  animate: true,
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
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, 0, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  // Setup a geometry
  const boxGeo = new THREE.BoxGeometry(1, 1, 1, 5, 5, 5);

  const raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();

  const points = boxGeo.vertices;

  const lineMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('red') });

  let lineBuffers = [];
  for (let point of points) {
    const start = new THREE.Vector3(point.x, point.y, point.z);
    const midpoint = new THREE.Vector3(point.x + mouse.x, point.y, point.z).addScalar(0.05);
    const end = new THREE.Vector3(point.x + mouse.x, point.y + mouse.y, point.z).addScalar(0.1);

    lineBuffers.push(new THREE.BufferGeometry().setFromPoints([start, midpoint, end]));
  }

  const lineMeshes = lineBuffers.map((buffer) => new THREE.Line(buffer, lineMat));
  lineMeshes.forEach((mesh) => {
    new THREE.Box3().setFromObject(mesh).getCenter(mesh.position);
    mesh.position.multiplyScalar(-0.1);
  });

  const pivot = new THREE.Group();
  lineMeshes.forEach((mesh) => pivot.add(mesh));
  scene.add(pivot);

  function onMouseMove(event) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  // Setup a material
  const boxMat = new THREE.MeshNormalMaterial({
    wireframe: true
  });

  // Setup a mesh with geometry + material
  const mesh = new THREE.Mesh(boxGeo, boxMat);
  // scene.add(mesh);

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
    render({ time }) {
      window.addEventListener('mousemove', onMouseMove, false);

      pivot.rotation.y = mouse.x;

      raycaster.setFromCamera(mouse, camera);
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
