import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ParticleFieldProps {
    particleCount?: number;
    particleColor?: string;
    connectionDistance?: number;
    speed?: number;
}

export function ParticleField({
    particleCount = 100,
    particleColor = '#8B5CF6',
    connectionDistance = 150,
    speed = 0.0005,
}: ParticleFieldProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const particlesRef = useRef<THREE.Points | null>(null);
    const velocitiesRef = useRef<THREE.Vector3[]>([]);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 500;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Particles
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities: THREE.Vector3[] = [];

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 1000;
            positions[i + 1] = (Math.random() - 0.5) * 1000;
            positions[i + 2] = (Math.random() - 0.5) * 500;

            velocities.push(
                new THREE.Vector3(
                    (Math.random() - 0.5) * speed,
                    (Math.random() - 0.5) * speed,
                    (Math.random() - 0.5) * speed
                )
            );
        }

        velocitiesRef.current = velocities;
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: particleColor,
            size: 2,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
        });

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);
        particlesRef.current = particles;

        // Lines for connections
        const lineMaterial = new THREE.LineBasicMaterial({
            color: particleColor,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending,
        });

        const lineGeometry = new THREE.BufferGeometry();
        const linePositions = new Float32Array(particleCount * particleCount * 6);
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lines);

        // Animation
        let animationId: number;
        const animate = () => {
            animationId = requestAnimationFrame(animate);

            if (particlesRef.current) {
                const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

                // Update particle positions
                for (let i = 0; i < particleCount; i++) {
                    const i3 = i * 3;
                    positions[i3] += velocitiesRef.current[i].x;
                    positions[i3 + 1] += velocitiesRef.current[i].y;
                    positions[i3 + 2] += velocitiesRef.current[i].z;

                    // Boundary check
                    if (Math.abs(positions[i3]) > 500) velocitiesRef.current[i].x *= -1;
                    if (Math.abs(positions[i3 + 1]) > 500) velocitiesRef.current[i].y *= -1;
                    if (Math.abs(positions[i3 + 2]) > 250) velocitiesRef.current[i].z *= -1;
                }

                particlesRef.current.geometry.attributes.position.needsUpdate = true;

                // Update connections
                const linePositions = lines.geometry.attributes.position.array as Float32Array;
                let lineIndex = 0;

                for (let i = 0; i < particleCount; i++) {
                    for (let j = i + 1; j < particleCount; j++) {
                        const i3 = i * 3;
                        const j3 = j * 3;

                        const dx = positions[i3] - positions[j3];
                        const dy = positions[i3 + 1] - positions[j3 + 1];
                        const dz = positions[i3 + 2] - positions[j3 + 2];
                        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                        if (distance < connectionDistance) {
                            linePositions[lineIndex++] = positions[i3];
                            linePositions[lineIndex++] = positions[i3 + 1];
                            linePositions[lineIndex++] = positions[i3 + 2];
                            linePositions[lineIndex++] = positions[j3];
                            linePositions[lineIndex++] = positions[j3 + 1];
                            linePositions[lineIndex++] = positions[j3 + 2];
                        }
                    }
                }

                lines.geometry.setDrawRange(0, lineIndex / 3);
                lines.geometry.attributes.position.needsUpdate = true;
            }

            // Slow rotation
            scene.rotation.y += 0.0002;

            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        const container = containerRef.current;
        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            if (container && renderer.domElement) {
                container.removeChild(renderer.domElement);
            }
            geometry.dispose();
            material.dispose();
            lineGeometry.dispose();
            lineMaterial.dispose();
            renderer.dispose();
        };
    }, [particleCount, particleColor, connectionDistance, speed]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 -z-10 pointer-events-none"
            style={{ opacity: 0.4 }}
        />
    );
}
