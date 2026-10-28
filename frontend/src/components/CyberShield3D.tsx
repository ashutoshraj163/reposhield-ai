import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  state?: "idle" | "scanning" | "threat" | "clean";
  threatCount?: number;
  interactive?: boolean;
}

export function CyberShield3D({ state = "idle", threatCount = 0, interactive = true }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 340;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group for mouse rotation
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Color definitions based on state
    let primaryColor = 0x06b6d4; // Cyan
    let secondaryColor = 0x6366f1; // Indigo
    let particleColor = 0x38bdf8;

    if (state === "scanning") {
      primaryColor = 0xa855f7; // Purple
      secondaryColor = 0x06b6d4;
      particleColor = 0xc084fc;
    } else if (state === "threat" || threatCount > 0) {
      primaryColor = 0xf43f5e; // Rose / Red
      secondaryColor = 0xf97316; // Orange
      particleColor = 0xfb7185;
    } else if (state === "clean") {
      primaryColor = 0x10b981; // Emerald
      secondaryColor = 0x06b6d4;
      particleColor = 0x34d399;
    }

    // 1. Core Shield Polyhedron (Icosahedron)
    const coreGeo = new THREE.IcosahedronGeometry(1.6, 1);
    const coreMat = new THREE.MeshPhongMaterial({
      color: primaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
      shininess: 100,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    mainGroup.add(coreMesh);

    // Inner glowing core
    const innerGeo = new THREE.OctahedronGeometry(0.9, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: secondaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    mainGroup.add(innerMesh);

    // 2. Orbital Defense Rings
    const ringGeo1 = new THREE.TorusGeometry(2.3, 0.02, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.45,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    mainGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(2.7, 0.02, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: secondaryColor,
      transparent: true,
      opacity: 0.35,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = Math.PI / 6;
    mainGroup.add(ring2);

    // 3. Orbiting Data Nodes
    const nodeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const nodeCount = 6;
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(Math.cos(angle) * 2.3, Math.sin(angle) * 2.3, 0);
      ring1.add(node);
    }

    // 4. Particle Cloud
    const particleCount = 200;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const r = 2.0 + Math.random() * 2.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      posArray[i] = r * Math.sin(phi) * Math.cos(theta);
      posArray[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      posArray[i + 2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: particleColor,
      transparent: true,
      opacity: 0.7,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    mainGroup.add(particleSystem);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(primaryColor, 4, 20);
    pointLight.position.set(4, 4, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(secondaryColor, 3, 20);
    pointLight2.position.set(-4, -4, -3);
    scene.add(pointLight2);

    // Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 1.5;
      targetY = y * 1.5;
    };

    if (interactive) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const speedMultiplier = state === "scanning" ? 2.8 : 1.0;

      // Rotations
      coreMesh.rotation.y = elapsedTime * 0.3 * speedMultiplier;
      coreMesh.rotation.x = elapsedTime * 0.15 * speedMultiplier;

      innerMesh.rotation.y = -elapsedTime * 0.5 * speedMultiplier;
      innerMesh.rotation.z = elapsedTime * 0.25 * speedMultiplier;

      ring1.rotation.z = elapsedTime * 0.4 * speedMultiplier;
      ring2.rotation.y = elapsedTime * 0.3 * speedMultiplier;
      ring2.rotation.x = Math.sin(elapsedTime * 0.5) * 0.5;

      particleSystem.rotation.y = elapsedTime * 0.08;

      // Pulse scaling
      const pulse = 1 + Math.sin(elapsedTime * 2.5) * (state === "scanning" ? 0.08 : 0.03);
      coreMesh.scale.set(pulse, pulse, pulse);

      // Smooth mouse tilt
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;
      mainGroup.rotation.y = mouseX;
      mainGroup.rotation.x = -mouseY;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 340;
      const h = container.clientHeight || 340;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (interactive) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [state, threatCount, interactive]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full min-h-[300px] flex items-center justify-center relative cursor-grab active:cursor-grabbing"
    />
  );
}
