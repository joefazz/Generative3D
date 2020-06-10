// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');

const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const glsl = require('glslify');

const settings = {
  // Make the loop animated
  animate: true,
  duration: 4,
  fps: 60,
  dimensions: [1080, 1080],
  // Get a WebGL canvas rather than 2D
  context: 'webgl'
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas
  });

  // WebGL background color
  renderer.setClearColor('white', 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, 0, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  // Setup a geometry
  const geometry = new THREE.SphereGeometry(1, 32, 16);

  const baseGeom = new THREE.IcosahedronGeometry(1, 1);
  const points = baseGeom.vertices;

  // DRAW CIRCLES ON ALL THE POINTS
  // const circleGeom = new THREE.CircleGeometry(1, 32);
  // points.forEach((point) => {
  //   const mesh = new THREE.Mesh(
  //     circleGeom,
  //     new THREE.MeshBasicMaterial({ color: 'red', wireframe: false, side: THREE.BackSide })
  //   );
  //   mesh.position.copy(point);
  //   mesh.scale.setScalar(0.25 * Math.random());
  //   mesh.lookAt(new THREE.Vector3());
  //   scene.add(mesh);
  // });

  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vPosition;

    void main () {
      vUv = uv; // UV Coordinates
      vPosition = position; // Actual x, y, z coordinate of the pixel
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
    }
  `;

  const fragmentShader = glsl(` 
    #pragma glslify: noise = require('glsl-noise/simplex/3d');
    #pragma glslify: aastep = require('glsl-aastep');

    varying vec2 vUv;
    varying vec3 vPosition;
    uniform vec3 color;
    uniform float time;
    uniform vec3 points[POINT_COUNT];

    uniform mat4 modelMatrix;

    float sphereRim (vec3 spherePosition) {
      vec3 normal = normalize(spherePosition.xyz);
      vec3 worldNormal = normalize(mat3(modelMatrix) * normal.xyz);
      vec3 worldPosition = (modelMatrix * vec4(spherePosition, 1.0)).xyz;
      vec3 V = normalize(cameraPosition - worldPosition);
      float rim = 1.0 - max(dot(V, worldNormal), 0.0);
      return pow(smoothstep(0.0, 1.0, rim), 0.5);
    }

    void main () {
      float dist = 10000.0;

      vec3 pos = mod(vPosition * 10.0, 1.0);

      // For each point on the Icosohedren
      for (int i = 0; i < POINT_COUNT; i++) {
        vec3 p = points[i];
        // Get the distance from the pixel to the point
        float d = distance(vPosition, p);
        // Set dist to be the smaller value between d and dist
        dist = min(d, dist);
      }

      float mask = aastep(0.15 + sin(0.5 * time) * 0.01, dist);
      mask = 1.0 - mask;

      
      vec3 fragColor = mix(color, vec3(1.0), mask);
      float rim = sphereRim(vPosition);
      
      fragColor += rim * 0.2;
      gl_FragColor = vec4(vec3(fragColor), 1.0);
    }
  `);

  // Setup a material
  const material = new THREE.ShaderMaterial({
    defines: {
      POINT_COUNT: points.length
    },
    uniforms: {
      color: { value: new THREE.Color('rebeccapurple') },
      time: { value: 0 },
      points: { value: points }
    },
    extensions: {
      derivatives: true
    },
    vertexShader,
    fragmentShader
  });

  const secondMaterial = material.clone();
  secondMaterial.uniforms.color.value = new THREE.Color('tomato');

  // Setup a mesh with geometry + material
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  const secondMesh = mesh.clone();
  secondMesh.position.setScalar(1);
  secondMesh.scale.setScalar(0.7);
  secondMesh.material = secondMaterial;
  scene.add(secondMesh);

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
      mesh.rotation.y = playhead * Math.PI;
      secondMesh.rotation.y = -(playhead * Math.PI * 2) * 0.5;
      material.uniforms.time.value = time;
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
