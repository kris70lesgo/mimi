'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { decodeModelResponse } from './model-download';
import { SYSTEMS, type Atlas, type Part } from './anatomy';

type Props = { atlas: Atlas; parts: Part[]; name: string; stage?: boolean; fullScreen?: boolean };

/**
 * A focused renderer for the exact BodyParts3D meshes selected in the large
 * Atlas. It intentionally shares the catalogue/chunk format with AnatomyScene
 * rather than substituting a representative organ or a stock illustration.
 */
export default function AtlasPartPreview({ atlas, parts, name, stage = false, fullScreen = false }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [rotating, setRotating] = useState(true);
  const [reset, setReset] = useState(0);
  const rotatingRef = useRef(rotating);
  rotatingRef.current = rotating;

  useEffect(() => {
    const element = host.current;
    if (!element || !parts.length) return;
    const controller = new AbortController();
    let disposed = false;
    let frame = 0;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', `Interactive preview of ${name}. Drag to rotate and scroll to zoom.`);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.001, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.01;
    controls.maxDistance = 50;
    const pivot = new THREE.Group();
    scene.add(pivot);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x7d8892, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.8);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xb8d9e7, 1.4);
    rim.position.set(-3, 2, -4);
    scene.add(rim);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshBasicMaterial({ color: 0xe8efef, transparent: true, opacity: 0.55 }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const box = new THREE.Box3();
    const chunkIds = [...new Set(parts.map((part) => part.chunk))];
    const resize = () => {
      const width = Math.max(1, element.clientWidth);
      const height = Math.max(1, element.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();

    const load = async () => {
      await Promise.all(chunkIds.map(async (chunkId) => {
        const chunk = atlas.chunks[chunkId];
        const compressed = Boolean(chunk.gzip && typeof DecompressionStream !== 'undefined');
        const response = await fetch(compressed ? chunk.gzip! : chunk.url, { signal: controller.signal });
        const buffer = await decodeModelResponse(response, chunk.bytes, compressed);
        if (disposed) return;
        parts.filter((part) => part.chunk === chunkId).forEach((part) => {
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buffer, part.positions, part.vertexCount * 3), 3));
          geometry.setAttribute('normal', new THREE.BufferAttribute(new Int16Array(buffer, part.normals, part.vertexCount * 3), 3, true));
          geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer, part.indices, part.indexCount), 1));
          geometry.computeBoundingBox();
          geometry.computeBoundingSphere();
          const material = new THREE.MeshStandardMaterial({ color: SYSTEMS.find((system) => system.id === part.system)?.color ?? '#7fa99d', roughness: 0.45, metalness: 0.05, side: THREE.DoubleSide });
          const mesh = new THREE.Mesh(geometry, material);
          pivot.add(mesh);
          geometries.push(geometry);
          materials.push(material);
          box.union(geometry.boundingBox!);
        });
      }));
      if (disposed || box.isEmpty()) return;
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      pivot.position.copy(center).multiplyScalar(-1);
      ground.position.y = -size.y / 2 - 0.03;
      const span = Math.max(size.x, size.y, size.z, 0.01);
      const distance = span / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.25;
      camera.position.set(distance * 0.22, distance * 0.08, distance);
      controls.target.set(0, 0, 0);
      controls.update();
    };
    void load().catch(() => {});
    const clock = new THREE.Clock();
    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      if (rotatingRef.current) pivot.rotation.y += clock.getDelta() * 0.35;
      else clock.getDelta();
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      disposed = true;
      controller.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [atlas, parts, name, reset]);

  return <div className={`atlas-part-preview ${stage ? 'atlas-part-preview-stage' : ''} ${fullScreen ? 'atlas-part-preview-fullscreen' : ''}`}>
    <div ref={host} className="atlas-part-canvas" />
    <div className="atlas-preview-controls">
      <button onClick={() => setRotating((value) => !value)}>{rotating ? <Pause size={13} /> : <Play size={13} />}{rotating ? 'Pause rotation' : 'Rotate model'}</button>
      <button onClick={() => { setRotating(false); setReset((value) => value + 1); }}><RotateCcw size={14} /> Reset</button>
    </div>
  </div>;
}
