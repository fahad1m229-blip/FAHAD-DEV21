/**
 * FAHAD DEV — Three.js 3D Particle Field & Floating Cyber Geometry
 * Optimized for mobile devices, Lighthouse performance, and prefers-reduced-motion.
 */

export async function initThreeBackground(canvas) {
  if (!canvas) return null;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.innerWidth < 768;

  let THREE;
  try {
    THREE = await import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js");
  } catch (err) {
    console.warn("Three.js CDN unavailable (offline or blocked); falling back to CSS atmosphere.", err);
    return null;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !isMobile,
      powerPreference: "high-performance"
    });
  } catch (err) {
    console.warn("WebGL context creation failed; falling back to CSS atmosphere.", err);
    return null;
  }

  const pixelRatio = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / Math.max(window.innerHeight, 1),
    0.1,
    100
  );
  camera.position.z = 16;

  // Floating Particle Cloud (responsive particle count)
  const particleCount = isMobile ? 240 : 620;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const palette = [
    new THREE.Color("#3B6CFF"),
    new THREE.Color("#6C8CFF"),
    new THREE.Color("#8B5CF6"),
    new THREE.Color("#22D3EE")
  ];

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 34;
    positions[i3 + 1] = (Math.random() - 0.5) * 24;
    positions[i3 + 2] = (Math.random() - 0.5) * 22;

    const c = palette[i % palette.length];
    colors[i3] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const particleMat = new THREE.PointsMaterial({
    size: isMobile ? 0.095 : 0.085,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // 3D Floating Geometric Wireframes
  const geoGroup = new THREE.Group();
  scene.add(geoGroup);

  const wireShapes = [];

  const icosa = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.1, 0),
    new THREE.MeshBasicMaterial({
      color: "#3B6CFF",
      wireframe: true,
      transparent: true,
      opacity: 0.28
    })
  );
  icosa.position.set(isMobile ? 2.4 : 6.2, 2.2, -3);
  geoGroup.add(icosa);
  wireShapes.push({ mesh: icosa, rx: 0.0028, ry: 0.0042, baseY: 2.2, phase: 0 });

  const octa = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.5, 0),
    new THREE.MeshBasicMaterial({
      color: "#22D3EE",
      wireframe: true,
      transparent: true,
      opacity: 0.25
    })
  );
  octa.position.set(isMobile ? -2.6 : -6.4, -2.0, -2);
  geoGroup.add(octa);
  wireShapes.push({ mesh: octa, rx: -0.0035, ry: 0.003, baseY: -2.0, phase: 2.1 });

  const torus = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.05, 0.28, 56, 8),
    new THREE.MeshBasicMaterial({
      color: "#8B5CF6",
      wireframe: true,
      transparent: true,
      opacity: 0.22
    })
  );
  torus.position.set(0, 4.4, -6.5);
  geoGroup.add(torus);
  wireShapes.push({ mesh: torus, rx: 0.002, ry: -0.0032, baseY: 4.4, phase: 4.2 });

  // Pointer parallax state
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  const onPointerMove = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    targetX = (clientX / window.innerWidth - 0.5) * 1.4;
    targetY = -(clientY / window.innerHeight - 0.5) * 1.0;
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("touchmove", onPointerMove, { passive: true });

  const onResize = () => {
    const w = window.innerWidth;
    const h = Math.max(window.innerHeight, 1);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  window.addEventListener("resize", onResize, { passive: true });

  // Render once immediately
  renderer.render(scene, camera);

  if (prefersReducedMotion) {
    return {
      destroy: () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("touchmove", onPointerMove);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
      }
    };
  }

  let rafId = null;
  let elapsed = 0;

  const animate = () => {
    if (document.hidden) {
      rafId = null;
      return;
    }

    elapsed += 0.016;
    currentX += (targetX - currentX) * 0.04;
    currentY += (targetY - currentY) * 0.04;

    particles.rotation.y += 0.00075;
    particles.rotation.x += 0.00025;

    camera.position.x = currentX;
    camera.position.y = currentY;
    camera.lookAt(0, 0, 0);

    for (const item of wireShapes) {
      item.mesh.rotation.x += item.rx;
      item.mesh.rotation.y += item.ry;
      item.mesh.position.y = item.baseY + Math.sin(elapsed + item.phase) * 0.45;
    }

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  };

  const onVisibilityChange = () => {
    if (!document.hidden && rafId === null) {
      rafId = requestAnimationFrame(animate);
    }
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  rafId = requestAnimationFrame(animate);

  return {
    destroy: () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("resize", onResize);
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    }
  };
}
