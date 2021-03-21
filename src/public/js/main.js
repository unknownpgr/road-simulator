import * as THREE from "./three.js-dev/build/three.module.js";
import { ShaderBlur } from "./shaders/ShaderBlur.js";
import { ShaderConcat } from "./shaders/ShaderConcat.js";
import { createThickLine, getPathFunction } from "./curves.js";

import { OBJLoader } from "./three.js-dev/examples/jsm/loaders/OBJLoader.js";
import { EffectComposer } from "./three.js-dev/examples/jsm/postprocessing/EffectComposer.js";
import { CopyShader } from "./three.js-dev/examples/jsm/shaders/CopyShader.js";
import { RenderPass } from "./three.js-dev/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "./three.js-dev/examples/jsm/postprocessing/ShaderPass.js";
import { SavePass } from "./three.js-dev/examples/jsm/postprocessing/SavePass.js";
import shaderPhongMask from "./shaders/ShaderPhongMask.js";

// Define constants
const IMG_WIDTH = 320;
const IMG_HEIGHT = 240;
const CAM_HEIGHT = 10; // Unit : cm
const CAM_ANGLE = -Math.PI / 8; // Unit : rad
const CAM_FOV = 45; // Unit : degree

let useSaveServer = false;

// Define scene, camera, renderer.
const scene = new THREE.Scene();
const camBox = new THREE.Object3D();
const camera = new THREE.PerspectiveCamera(
  CAM_FOV, // Field of view
  IMG_WIDTH / IMG_HEIGHT, // Aspect ratio
  0.1, // Near clipping plane
  1000 // Far clipping plane
);
{
  camera.position.y = CAM_HEIGHT;
  camera.rotation.x = CAM_ANGLE;
  camBox.add(camera);
  scene.add(camBox);
}

// ================================================================
//     Custom material (mask-able material)
// ================================================================

let customMaterials = [];

function setUseMask(use) {
  customMaterials.forEach(mat => {
    if (use)
      mat.uniforms.useMask.value = 1;
    else
      mat.uniforms.useMask.value = 0;
    mat.needsUpdate = true;
  });
}

function getCustomMaterial(color = '#ff0000', mask = '#000000') {
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.ShaderLib.phong.uniforms,
      {
        diffuse: { value: new THREE.Color(color) },
        emmisive: { value: new THREE.Color(0x000000) },
        specular: { value: new THREE.Color('#111111') },
        shineness: { value: 30 },
        opacity: { value: 1 },
        mask: { type: "c", value: new THREE.Color(mask) },
        useMask: { value: 0 }
      },
    ]),
    vertexShader: shaderPhongMask.vert,
    fragmentShader: shaderPhongMask.frag,
    lights: true,
    transparent: true,
  });
  customMaterials.push(mat);

  return mat;
}

// ================================================================
//     Geometry
// ================================================================

// Get 'geometry' of thick line. Parameter should be array of Vec2D generated from createThickLine.
function getThickLineGeometry([left, right]) {
  const n = left.length;
  let vertices = [];
  let faces = [];

  for (let i = 0; i < n; i++) {
    vertices.push(new THREE.Vector3(left[i].x, 0, left[i].y));
    vertices.push(new THREE.Vector3(right[i].x, 0, right[i].y));
  }

  for (let i = 0; i < n - 1; i++) {
    faces.push(new THREE.Face3(
      i * 2 + 2,
      i * 2 + 1,
      i * 2 + 0));
    faces.push(new THREE.Face3(
      i * 2 + 3,
      i * 2 + 1,
      i * 2 + 2));
  }

  const geometry = new THREE.Geometry();
  geometry.vertices = vertices;
  geometry.faces = faces;
  geometry.computeBoundingSphere();
  geometry.computeFaceNormals();
  geometry.computeVertexNormals();

  return geometry;
}

// Crate lane geometry
function getLaneGeometry(points, width = 2, thick = 0.1) {
  let [leftLanePoints, rightLanePoints] = createThickLine(points, width);
  let leftLane = createThickLine(leftLanePoints, thick);
  let rightLane = createThickLine(rightLanePoints, thick);
  let leftLaneGeometry = getThickLineGeometry(leftLane);
  let rightLaneGeometry = getThickLineGeometry(rightLane);
  return [leftLaneGeometry, rightLaneGeometry];
}

// Define ground
let ground;
{
  const geometry = new THREE.PlaneGeometry(1000, 1000);
  const material = getCustomMaterial('#101010', '#000000');
  ground = new THREE.Mesh(geometry, material);
  ground.position.set(0, -0.1, 0);
  ground.lookAt(0, 1, 0);
  scene.add(ground);
}

// Define lane. Scale unit : Centimeter
let lane;
{
  lane = getPathFunction([
    [0, 150],
    [40, Math.PI * 5 / 4],
    [50, - Math.PI * 6 / 4],
    [35, Math.PI * 3 / 4],
    [0, 100],
    [40, -Math.PI],
    [0, 200]]);
  let points = [];
  for (let t = 0; t < 1; t += 0.002) {
    points.push(lane(t));
  }
  let [leftLaneGeometry, rightLaneGeometry] = getLaneGeometry(points, 40, 1.8);
  const material = getCustomMaterial('#ffff40', '#ffffff');
  let leftLane = new THREE.Mesh(leftLaneGeometry, material);
  let rightLane = new THREE.Mesh(rightLaneGeometry, material);
  scene.add(leftLane);
  scene.add(rightLane);
}

// Define ambient light
{
  let light = new THREE.AmbientLight(0x202020); // soft white light
  scene.add(light);
}

// Define spot lights
{
  const dist = 200;
  const height = 100;
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      let light = new THREE.PointLight(
        0xffffff, // Color
        1, // Intensity
        600, // Distance (0=No limit)
        1 // Some factor
      );
      light.position.set(x * dist, height, y * dist);
      scene.add(light);

      // White sphare to check light position
      let sphere = new THREE.Mesh(new THREE.SphereGeometry(), new THREE.MeshBasicMaterial());
      sphere.position.set(x * dist, height, y * dist);
      scene.add(sphere);
    }
  }
}

// Load objects asynchronously 
(async () => {
  // instantiate a loader
  const loader = new OBJLoader();
  const customMaterial = getCustomMaterial('#404040', '#808080');

  function setMaterial(object, material) {
    object.traverse(function (child) {
      if (child.material) {
        child.material = material;
      }
    });
  }

  function loadObj(fileName) {
    return new Promise((res, rej) => {
      loader.load(
        fileName,
        res);
    });
  }

  let [human, laptop] = await Promise.all([loadObj('./objects/human.obj'), loadObj('./objects/laptop.obj')]);

  {
    human.position.set(250, 0, 0);
    setMaterial(human, customMaterial);
    scene.add(human);
  }

  {
    laptop.position.set(249, 9, 0);
    laptop.rotation.y = Math.PI;
    laptop.scale.set(0.2, 0.2, 0.2);
    setMaterial(laptop, customMaterial);
    scene.add(laptop);
  }

  {
    let buttonShow = document.createElement('button');
    let buttonSave = document.createElement('button');

    buttonShow.innerText = 'Just run simulation (available on GitHub)';
    buttonSave.innerText = 'Run simulation and save the result (Receiver server required, not available on GitHub.)';

    buttonShow.onclick = () => {
      useSaveServer = false;
      animate(0);
      document.body.removeChild(buttonSave);
      document.body.removeChild(buttonShow);
    };

    buttonSave.onclick = () => {
      useSaveServer = true;
      animate();
      document.body.removeChild(buttonSave);
      document.body.removeChild(buttonShow);
    };

    document.body.appendChild(buttonShow);
    document.body.appendChild(buttonSave);
  }
})();

// ================================================================
//     Renderers, Effect composers
// ================================================================


/**
 * Composers are used to implement post-processing effects in three.js.
 * The class manages a chain of post-processing passes to produce the final visual result.
 * Post-processing passes are executed in order of their addition/insertion.
 * The last pass is automatically rendered to screen.
 */

function getBlurComposer(renderer, renderTarget, clearColor) {
  /**
   * This composer Implements motion blur by blending renderTarget and current frame.
   * The processed result will NOT be rendered on canvas, and will be rendered on renderTarget.
   * Therefore, this composer can be thought that updates render target by blending it with
   * current frame from camera.
   */
  const composer = new EffectComposer(renderer);

  // Render pass
  const renderPass = new RenderPass(scene, camera);

  // Save pass
  const savePass = new SavePass(renderTarget);

  // Blend Pass
  const customPass = new ShaderPass(ShaderBlur, 'tDiffuse1');
  customPass.uniforms['tDiffuse2'].value = renderTarget;
  customPass.uniforms['mixRatio'].value = 0.3;
  customPass.uniforms['amount'].value = 0;

  // Compose passes
  composer.addPass(renderPass);
  composer.addPass(customPass);
  composer.addPass(savePass);

  return (randomSeed) => {
    // Add texture noise
    renderer.setClearColor(clearColor);
    customPass.uniforms['amount'].value = randomSeed % 1;
    composer.render();
  };
}

function getConcatComposer(renderer, secondImage, clearColor) {
  /**
   * This composer just concatenates two diffrent image vertically.
   * The first one is frame from camera, and the second one is secondImage.
   */

  const composer = new EffectComposer(renderer);

  // Render pass
  const renderPass = new RenderPass(scene, camera);

  // Concat Pass
  const customPass = new ShaderPass(ShaderConcat, 'tDiffuse1');
  customPass.uniforms['tDiffuse2'].value = secondImage;

  // Output pass
  const outputPass = new ShaderPass(CopyShader);
  outputPass.renderToScreen = true;

  // Compose passes
  composer.addPass(renderPass);
  composer.addPass(customPass);
  composer.addPass(outputPass);

  return () => {
    renderer.setClearColor(clearColor);
    composer.render();
  };
}

let renderer, blurComposerRender, concatComposerRender;
{
  const devicePixelRatio = 2;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(
    IMG_WIDTH * devicePixelRatio,
    IMG_HEIGHT * 2 * devicePixelRatio,
    document.body.appendChild(renderer.domElement)
  );

  let renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    stencilBuffer: false
  });
  blurComposerRender = getBlurComposer(renderer, renderTarget, 0xf0f0d0);
  concatComposerRender = getConcatComposer(renderer, renderTarget, 0x404040);
}

// ================================================================
//     Real time render processes
// ================================================================

const rand = [Math.random(), Math.random(), Math.random(), Math.random()];
const posNoise = t => Math.sin(t * (40 + rand[0] * 20) * 7) * 4 + Math.cos(t * (65 + rand[1] * 25) * 3) * 3; // Max = 7
const angleNoise = t => (Math.sin(t * (20 + rand[2] * 10) * 3) + Math.cos(t * (20 + rand[3] * 20) * 3)) * Math.PI / 24;
const angleNoise2 = t => (Math.sin(t * (20 + rand[3] * 10) * 3) + Math.cos(t * (20 + rand[2] * 20) * 3)) * Math.PI / 48;

// Generate dataset
let time = 0;
let baseTime = -1;
function animate(t_) {
  if (baseTime <= 0) baseTime = t_;
  if (!useSaveServer) time = (t_ - baseTime) / 40000;
  const pos1 = lane(time);
  const pos2 = lane(time + 0.02);

  // Follow main path
  camBox.position.set(pos2.x, 0, pos2.y);
  camBox.lookAt(pos1.x, 0, pos1.y);

  // Add noise on position and angle
  let pN = posNoise(time);
  let aN = angleNoise(time);
  camera.position.x = pN;
  camBox.rotation.y += aN;
  camera.rotation.x = CAM_ANGLE + angleNoise2(time);

  setUseMask(false);
  blurComposerRender(time);
  setUseMask(true);
  concatComposerRender();

  // Send rendered image to server
  if (useSaveServer) {
    let data = renderer.domElement.toDataURL('image/png');
    data = data.replace('data:image/png;base64', pN + '_' + aN + '.png');
    fetch("save/",
      {
        body: data,
        headers: { 'content-type': 'text/html' },
        method: "POST"
      }).then(() => {
        if (time < 0.9) {
          time += 0.001;
          requestAnimationFrame(animate, 0);
        } else {
          document.body.innerHTML = '<h1>Simulation Finished</h1>';
        }
      });
  } else {
    if (time < 0.9) { requestAnimationFrame(animate, 0); }
    else {
      document.body.innerHTML = '<h1>Simulation Finished</h1>';
    }
  }
}