import { useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Layers, Mail, Zap, BarChart3 } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useInView } from '@/hooks/useInView';
import { useCountUp } from '@/hooks/useCountUp';
import PageLayout from '@/components/PageLayout';
import * as THREE from 'three';

/* ─── Three.js Sphere ─── */
function HeroSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const reduced = useReducedMotion();

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, []);

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    const dpr = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 3.5);

    // Main sphere
    const geometry = new THREE.IcosahedronGeometry(1, 32);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#C8A45E'),
      emissive: new THREE.Color('#C8A45E'),
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.8,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Outer glow particles
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = window.innerWidth < 768 ? 2500 : 5000;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const r = 1.05 + Math.random() * 0.3;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color('#7B8E7B'),
      size: 0.008,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Lights
    const pointLight = new THREE.PointLight(0xffffff, 50, 5);
    pointLight.position.set(1.7, 1.3, 1.5);
    scene.add(pointLight);
    scene.add(new THREE.AmbientLight(0x1a1a2e, 0.8));

    // Effector state
    const effector = { x: 0, y: 0, z: 1 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const sphereBounds = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);

    // Entrance animation
    let entranceProgress = 0;
    const entranceDuration = 90; // frames

    // Cache original positions to avoid cloning every frame
    const originalPositions = new Float32Array(geometry.attributes.position.array);
    let frameCount = 0;

    // Animation
    let frame: number;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      frameCount++;

      // Entrance
      if (entranceProgress < 1) {
        entranceProgress += 1 / entranceDuration;
        const t = Math.min(entranceProgress, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        sphere.scale.setScalar(0.3 + 0.7 * ease);
        sphere.material.opacity = ease;
        particles.material.opacity = 0.6 * ease;
      }

      // Mouse effector
      mouse.set(mouseRef.current.x, mouseRef.current.y);
      raycaster.setFromCamera(mouse, camera);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectSphere(sphereBounds, intersectPoint);
      if (intersectPoint) {
        effector.x += (intersectPoint.x - effector.x) * 0.15;
        effector.y += (intersectPoint.y - effector.y) * 0.15;
        effector.z += (intersectPoint.z - effector.z) * 0.15;
      }

      // Deform vertices
      const posAttr = geometry.attributes.position;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < posArray.length; i += 3) {
        const vx = originalPositions[i];
        const vy = originalPositions[i + 1];
        const vz = originalPositions[i + 2];

        const dx = vx - effector.x;
        const dy = vy - effector.y;
        const dz = vz - effector.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        const radius = 0.35;
        const fadeWidth = 0.2;
        const strength = 0.5;

        let displacement = 0;
        if (dist < radius) {
          const t = dist / radius;
          displacement = strength * (1 - t);
        } else if (dist < radius + fadeWidth) {
          const t = (dist - radius) / fadeWidth;
          displacement = strength * (1 - t) * 0.3;
        }

        // Push outward along normal
        const len = Math.sqrt(vx * vx + vy * vy + vz * vz);
        if (len > 0) {
          const nx = vx / len;
          const ny = vy / len;
          const nz = vz / len;
          posArray[i] = vx + nx * displacement;
          posArray[i + 1] = vy + ny * displacement;
          posArray[i + 2] = vz + nz * displacement;
        }
      }
      posAttr.needsUpdate = true;
      // Only recompute normals every 6 frames (~10fps) to save CPU
      if (frameCount % 6 === 0) {
        geometry.computeVertexNormals();
      }

      // Auto rotation
      const mouseNearCenter = Math.abs(mouseRef.current.x) < 0.3 && Math.abs(mouseRef.current.y) < 0.3;
      sphere.rotation.y += mouseNearCenter ? 0.001 : 0.0003;
      particles.rotation.y = sphere.rotation.y;

      // Particle pulse
      const time = Date.now() * 0.001;
      particleMat.opacity = 0.6 + Math.sin(time * 0.5) * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    window.addEventListener('mousemove', handleMouseMove);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [reduced, handleMouseMove]);

  if (reduced) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-gradient-radial from-gold/20 via-gold/5 to-transparent blur-3xl" />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
}

/* ─── Scroll Indicator ─── */
function ScrollIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.4 }}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
    >
      <div className="relative w-px h-10 bg-white/20 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-white/60 animate-scroll-dot" />
      </div>
      <span className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/35">
        Explore
      </span>
    </motion.div>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.1)' }}
      transition={{ duration: 0.3 }}
      className="bg-surface border border-white/[0.06] rounded-2xl p-8 min-h-[280px]"
    >
      <div className="w-12 h-12 bg-gold/[0.08] rounded-xl flex items-center justify-center">
        <Icon className="w-6 h-6 text-gold" />
      </div>
      <h3 className="text-2xl font-medium tracking-[-0.01em] text-white mt-6">{title}</h3>
      <p className="text-base text-white/60 leading-relaxed mt-3">{description}</p>
    </motion.div>
  );
}

/* ─── Stat Item ─── */
function StatItem({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const { ref, value: displayValue } = useCountUp(value, 1200);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-light tracking-[-0.02em] text-white font-mono">
        {displayValue.toLocaleString()}{suffix}
      </div>
      <p className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/35 mt-2">{label}</p>
    </div>
  );
}

/* ─── Homepage ─── */
export default function Home() {
  const featuresRef = useInView();
  const statsRef = useInView();
  const ctaRef = useInView();

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative w-screen h-screen overflow-hidden">
        <HeroSphere />

        {/* Text Overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
          <motion.h1
            className="text-[40px] md:text-[56px] font-light tracking-[-0.03em] leading-[1.1] text-white text-center max-w-[700px]"
            style={{ textShadow: '0 2px 40px rgba(0,0,0,0.8)' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            AI-Powered Outbound
            <br />
            That Converts
          </motion.h1>

          <motion.p
            className="text-lg text-white/60 leading-relaxed text-center max-w-[560px] mt-6"
            style={{ textShadow: '0 1px 20px rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Create product playbooks, generate hyper-personalized emails, and run multi-step campaigns — all powered by AI. Turn cold outreach into warm conversations.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center gap-4 mt-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Link
              to="/pricing"
              className="flex items-center gap-2 bg-gold text-[#050505] px-6 py-3 rounded-xl text-[13px] font-medium tracking-[0.06em] uppercase hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(200,164,94,0.25)] transition-all duration-200"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="flex items-center gap-2 border border-white/[0.06] text-white/60 px-6 py-3 rounded-xl text-[13px] font-medium tracking-[0.06em] uppercase hover:bg-surface-elevated hover:border-white/[0.12] transition-all duration-200">
              <Play className="w-4 h-4" />
              Watch Demo
            </button>
          </motion.div>
        </div>

        <ScrollIndicator />
      </section>

      {/* Features Band */}
      <section className="relative z-10 bg-surface/50 backdrop-blur-lg border-y border-white/[0.06]">
        <div
          ref={featuresRef.ref}
          className="max-w-[1200px] mx-auto px-[8vw] py-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Layers, title: 'AI Playbooks', description: 'Document your product, value props, and ICP. Our AI learns your playbook and never forgets it.' },
              { icon: Mail, title: 'Smart Outreach', description: 'Generate personalized emails for every prospect. AI researches and crafts messages that feel human.' },
              { icon: Zap, title: 'Campaign Sequences', description: 'Build multi-step follow-up sequences with smart timing. A/B test and optimize automatically.' },
              { icon: BarChart3, title: 'Real-time Analytics', description: 'Track opens, clicks, replies, and conversions. AI-powered insights show you what works.' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                animate={featuresRef.isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Band */}
      <section className="bg-surface-elevated border-b border-white/[0.06]">
        <div ref={statsRef.ref} className="max-w-[1200px] mx-auto px-[8vw] py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value={2400} label="Emails Sent" suffix="K+" />
            <StatItem value={34} label="Avg. Reply Rate" suffix="%" />
            <StatItem value={12000} label="Active Users" suffix="+" />
            <div className="text-center">
              <div className="text-4xl font-light tracking-[-0.02em] text-white font-mono">4.9&#9733;</div>
              <p className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/35 mt-2">User Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        ref={ctaRef.ref}
        className="py-24 px-[8vw]"
        style={{ background: 'radial-gradient(ellipse at center, rgba(200,164,94,0.03) 0%, transparent 70%)' }}
      >
        <div className="max-w-[600px] mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={ctaRef.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-[48px] font-normal tracking-[-0.02em] leading-[1.15] text-white"
          >
            Ready to Transform Your Outreach?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={ctaRef.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-white/60 leading-relaxed mt-4 max-w-[500px] mx-auto"
          >
            Join 12,000+ sales professionals using SellScout to book more meetings and close more deals.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={ctaRef.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-9"
          >
            <Link
              to="/pricing"
              className="flex items-center gap-2 bg-gold text-[#050505] px-8 py-3.5 rounded-xl text-[13px] font-medium tracking-[0.06em] uppercase hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(200,164,94,0.25)] transition-all duration-200"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/pricing"
              className="flex items-center gap-2 border border-white/[0.06] text-white/60 px-8 py-3.5 rounded-xl text-[13px] font-medium tracking-[0.06em] uppercase hover:bg-surface-elevated hover:border-white/[0.12] transition-all duration-200"
            >
              View Pricing
            </Link>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={ctaRef.isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/35 mt-5"
          >
            No credit card required &middot; 14-day free trial &middot; Cancel anytime
          </motion.p>
        </div>
      </section>
    </PageLayout>
  );
}
