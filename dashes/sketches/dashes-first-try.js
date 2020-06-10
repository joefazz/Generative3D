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

  // Setup a material
  const boxMat = new THREE.MeshNormalMaterial({
    wireframe: true
  });

  function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  const canvas = context.canvas;

  var mousePos = {};

  canvas.addEventListener(
    'mousemove',
    (evt) => {
      mousePos = getMousePos(canvas, evt);
      var message = 'Mouse position: ' + mousePos.x + ',' + mousePos.y;
      console.log(message);
    },
    false
  );

  console.log(mousePos);

  const vertexShader = glsl(/* glsl */ `
      varying vec3 vPosition;
      uniform vec2 mousePos;
      uniform float time;

      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition.xyz, 1.0);      }
    `);

  const fragmentShader = glsl(/* glsl */ `
    uniform vec3 color;
    varying vec3 vPosition;
    
    void main() {
      gl_FragColor = vec4(vec3(color), 1.0);
    }
  `);

  console.log(mousePos);

  var lineMat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      color: { value: new THREE.Color('white') },
      mousePos: { value: new THREE.Vector2() },
      time: { value: 0.0 }
    }
  });

  const points = boxGeo.vertices;

  const lines = [];
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const start = new THREE.Vector3(point.x, point.y, point.z);
    const end = new THREE.Vector3(point.x + 0.1, point.y + 0.1, point.z + 0.1);

    lines.push(new THREE.BufferGeometry().setFromPoints([start, end]));
  }

  for (let lineBuffer of lines) {
    let lineGeo = new THREE.Line(lineBuffer, lineMat);
    scene.add(lineGeo);
  }

  // Setup a mesh with geometry + material
  // const mesh = new THREE.Mesh(boxGeo, boxMat);
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
      lineMat.uniforms.time = time;
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
