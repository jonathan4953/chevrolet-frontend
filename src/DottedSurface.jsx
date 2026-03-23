import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function DottedSurface() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // A MÁGICA ESTÁ AQUI: Limpa qualquer "lixo" que o React Strict Mode possa ter deixado
    // Isso garante que teremos apenas UMA animação rodando na tela.
    containerRef.current.innerHTML = '';

    const SEPARATION = 150;
    const AMOUNTX = 40;
    const AMOUNTY = 60;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xE8EAED, 2000, 10000);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );
    camera.position.set(0, 355, 1220);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    containerRef.current.appendChild(renderer.domElement);

    const positions = [];
    const colors = [];
    const geometry = new THREE.BufferGeometry();

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        const y = 0; 
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

        positions.push(x, y, z);
        colors.push(1.0, 0.37, 0.0); // Laranja Forte (#FF5E00)
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 14, 
      vertexColors: true,
      transparent: false, 
      opacity: 1.0, 
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let count = 0;
    let animationId;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      const positionAttribute = geometry.attributes.position;
      const posArray = positionAttribute.array;

      let i = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const index = i * 3;
          // AUMENTAMOS A ALTURA DA ONDA AQUI (* 80 em vez de * 50)
          posArray[index + 1] = Math.sin((ix + count) * 0.3) * 80 + Math.sin((iy + count) * 0.5) * 80;
          i++;
        }
      }

      positionAttribute.needsUpdate = true;
      renderer.render(scene, camera);
      
      // AUMENTAMOS A VELOCIDADE DA ANIMAÇÃO AQUI (0.1 em vez de 0.05)
      count += 0.1; 
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    
    // Dispara a animação
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      
      scene.traverse((object) => {
        if (object instanceof THREE.Points) {
          object.geometry.dispose();
          object.material.dispose();
        }
      });
      
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.innerHTML = ''; // Limpa ao sair da tela
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0, 
        pointerEvents: 'none', 
      }}
    />
  );
}