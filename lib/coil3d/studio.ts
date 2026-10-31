// A small photographic studio: softbox environment, key light, soft contact shadow, framing.
import * as THREE from 'three';

export type Mode = 'light' | 'dark';
export type View = { az?: number; el?: number; fov?: number; fill?: number; target?: [number, number, number]; roll?: number; dist?: number; ground?: boolean };

// Reflection environment: a dark room with large softboxes, so copper shows crisp highlights and deep tone.
function studioEnvironment(renderer: THREE.WebGLRenderer, mode: Mode) {
  const env = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 40), new THREE.MeshBasicMaterial({ color: mode === 'light' ? 0x3a3a3a : 0x0b0b0c, side: THREE.BackSide }));
  env.add(room);
  const panel = (w: number, h: number, intensity: number, pos: [number, number, number], look: [number, number, number] = [0, 0, 0], color = 0xffffff) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(...look); env.add(m);
  };
  if (mode === 'light') {
    panel(12, 5, 4.0, [0, 9.5, 2], [0, 0, 0]);           // overhead softbox
    panel(1.8, 16, 9.0, [-15, 3, 5]);                    // left strip
    panel(1.8, 16, 6.0, [15, 3, -5]);                    // right strip
    panel(1.4, 12, 5.0, [-6, 6, 15]);                    // front kicker
    panel(18, 7, 1.4, [0, 2, 19]);                       // front fill
    panel(36, 36, 1.3, [0, -9.8, 0], [0, 0, 0], 0xf4f2ee); // white sweep under the subject
    panel(36, 12, 0.9, [0, 0, -19.5], [0, 0, 0], 0xf4f2ee); // sweep behind
  } else {
    panel(2.2, 16, 4.5, [-14, 3, 6]);
    panel(2.2, 16, 3.4, [14, 4, -6]);
    panel(10, 6, 1.6, [0, 9.5, -6]);
    panel(26, 1.2, 0.35, [0, -9.5, 0], [0, 0, 0], 0xffd2b0);
    panel(8, 5, 1.1, [4, 3, 19]);                         // soft front fill for faces toward camera
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.02).texture;
  pmrem.dispose();
  env.traverse((o: any) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  return tex;
}

function blobTexture() {
  const s = 128, data = new Uint8Array(s * s * 4);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const dx = (x - s / 2) / (s / 2), dy = (y - s / 2) / (s / 2);
    const r = Math.sqrt(dx * dx + dy * dy);
    const a = Math.max(0, 1 - r);
    const i = (y * s + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = 0; data[i + 3] = Math.round(Math.pow(a, 2.2) * 255);
  }
  const t = new THREE.DataTexture(data, s, s); t.needsUpdate = true;
  return t;
}

export function createStudio(canvas: HTMLCanvasElement, opts: { mode: Mode; alpha?: boolean; pixelRatio?: number; exposure?: number }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: opts.alpha ?? true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(opts.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = (globalThis as any).__toneMapping ?? THREE.NeutralToneMapping;
  renderer.toneMappingExposure = opts.exposure ?? (globalThis as any).__exposure ?? (opts.mode === 'light' ? 1.22 : 1.35);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer, opts.mode);
  const camera = new THREE.PerspectiveCamera(24, 1, 0.01, 5000);

  const key = new THREE.DirectionalLight(0xffffff, opts.mode === 'light' ? 1.6 : 2.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 8;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  scene.add(key.target);
  const rim = new THREE.DirectionalLight(0xffe2cc, opts.mode === 'light' ? 0.5 : 1.6);
  scene.add(rim);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: opts.mode === 'light' ? 0.16 : 0.5 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, opacity: opts.mode === 'light' ? 0.32 : 0.6, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2;
  scene.add(blob);

  let subject: THREE.Object3D | null = null;
  const pivot = new THREE.Group();
  scene.add(pivot);
  let radius = 1;
  let center = new THREE.Vector3();
  let view: View = {};

  function frame(v: View = view) {
    view = v;
    const az = THREE.MathUtils.degToRad(v.az ?? 35), el = THREE.MathUtils.degToRad(v.el ?? 28);
    camera.fov = v.fov ?? 24;
    const fill = v.fill ?? 0.72;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const fitH = radius / Math.sin(vfov / 2);
    const fitW = radius / Math.sin(Math.atan(Math.tan(vfov / 2) * camera.aspect));
    const dist = (v.dist ?? Math.max(fitH, fitW)) / fill;
    const t = new THREE.Vector3(...(v.target || [0, 0, 0])).add(center);
    camera.position.set(t.x + dist * Math.cos(el) * Math.sin(az), t.y + dist * Math.sin(el), t.z + dist * Math.cos(el) * Math.cos(az));
    camera.up.set(Math.sin(v.roll || 0), Math.cos(v.roll || 0), 0);
    camera.lookAt(t);
    camera.near = dist / 100; camera.far = dist * 20;
    camera.updateProjectionMatrix();
    // key light from upper left-front, sized to the subject
    key.position.set(center.x - radius * 2.2, center.y + radius * 4.5, center.z + radius * 2.2);
    key.target.position.copy(center);
    const sc = key.shadow.camera as THREE.OrthographicCamera;
    sc.left = sc.bottom = -radius * 2; sc.right = sc.top = radius * 2; sc.near = 0.01; sc.far = radius * 12;
    sc.updateProjectionMatrix();
    rim.position.set(center.x + radius * 3, center.y + radius * 1.5, center.z - radius * 3);
    ground.visible = blob.visible = v.ground !== false;
  }

  function setSubject(obj: THREE.Object3D, v: View = {}) {
    if (subject) pivot.remove(subject);
    subject = obj;
    pivot.add(obj);
    const box = new THREE.Box3().setFromObject(obj);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    radius = sphere.radius;
    center = sphere.center.clone();
    ground.position.y = box.min.y - radius * 0.002;
    ground.scale.setScalar(radius * 12);
    blob.position.set(center.x, box.min.y + radius * 0.001, center.z);
    const size = box.getSize(new THREE.Vector3());
    blob.scale.set(size.x * 1.25, size.z * 1.25, 1);
    frame(v);
  }

  function resize(w: number, h: number) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    frame();
  }

  return {
    renderer, scene, camera, pivot, key, ground, blob,
    setSubject, frame, resize,
    render: () => renderer.render(scene, camera),
    get radius() { return radius; }, get center() { return center; },
    dispose() {
      scene.traverse((o: any) => { o.geometry?.dispose?.(); if (o.material) [].concat(o.material).forEach((m: any) => m.dispose?.()); });
      scene.environment?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
