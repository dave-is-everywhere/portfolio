'use client';

import { useEffect, useRef } from 'react';
import { competencies, experiences, contact, header, hero, footerMeta } from '@/lib/content';

/* ── Vertex shader (identical to original) ─────────────── */
const VS = `
uniform float uTime;
uniform float uScroll;
uniform vec2 uMouse;
attribute vec3 aTarget;
attribute float aSize;
attribute float aRandom;
varying float vDistance;
varying float vScrollProgress;
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+2.0*C.xxx;
  vec3 x3=x0-1.0+3.0*C.xxx;
  i=mod(i,289.0);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=1.0/7.0;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  return 42.0*dot(vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)),vec4(1.0));
}
void main(){
  vScrollProgress=uScroll;
  vec3 pos=position;
  float distFromCenter=length(pos);
  vDistance=distFromCenter;
  vec3 mouse3D=vec3(uMouse.x*150.0,uMouse.y*150.0,0.0);
  float distToMouse=distance(pos,mouse3D);
  float noiseFreq=0.05;
  float rippleFactor=snoise(pos*noiseFreq+uTime*0.5)*(1.0-uScroll);
  float influence=smoothstep(100.0,0.0,distToMouse);
  pos+=normalize(pos)*(rippleFactor*2.0+influence*20.0*sin(uTime+aRandom*10.0));
  float easeScroll=pow(uScroll,1.5);
  vec3 finalPos=mix(pos,aTarget,easeScroll);
  finalPos.x+=sin(uTime*0.2+aRandom*10.0)*20.0*uScroll;
  finalPos.y+=cos(uTime*0.2+aRandom*10.0)*20.0*uScroll;
  vec4 mvPosition=modelViewMatrix*vec4(finalPos,1.0);
  gl_Position=projectionMatrix*mvPosition;
  gl_PointSize=min((aSize*300.0)/-mvPosition.z,15.0);
}`;

const FS = `
uniform vec3 uColorCenter;
uniform vec3 uColorEdge;
uniform vec3 uColorScatter;
varying float vDistance;
varying float vScrollProgress;
void main(){
  vec2 xy=gl_PointCoord.xy-vec2(0.5);
  float ll=length(xy);
  float alpha=smoothstep(0.5,0.1,ll);
  if(alpha<0.01)discard;
  float mixFactor=smoothstep(0.0,80.0,vDistance);
  vec3 planetColor=mix(uColorCenter,uColorEdge,mixFactor);
  vec3 finalColor=mix(planetColor,uColorScatter,vScrollProgress);
  float finalAlpha=alpha*mix(1.0,0.5,vScrollProgress);
  gl_FragColor=vec4(finalColor,finalAlpha);
}`;

function smoothstep(min: number, max: number, value: number) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export default function PortfolioClient() {
  const webglRef = useRef<HTMLDivElement>(null);

  /* ── Three.js init ─────────────────────────────────────── */
  useEffect(() => {
    let animId = 0;
    let THREE: typeof import('three');
    let renderer: import('three').WebGLRenderer;
    let material: import('three').ShaderMaterial;
    let particles: import('three').Points;
    let scene: import('three').Scene;
    let camera: import('three').PerspectiveCamera;

    async function init() {
      THREE = await import('three');
      const container = webglRef.current;
      if (!container) return;

      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x020203, 0.001);

      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
      camera.position.z = 400;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x020203, 1);
      container.appendChild(renderer.domElement);

      const PARTICLE_COUNT = 25000;
      const PLANET_RADIUS  = 80;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(PARTICLE_COUNT * 3);
      const targets   = new Float32Array(PARTICLE_COUNT * 3);
      const sizes     = new Float32Array(PARTICLE_COUNT);
      const randoms   = new Float32Array(PARTICLE_COUNT);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const r     = PLANET_RADIUS * Math.pow(Math.random(), 0.5);
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        positions[i3]     = r * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = r * Math.cos(phi);
        const sr = 1500;
        targets[i3]     = (Math.random() - 0.5) * sr;
        targets[i3 + 1] = (Math.random() - 0.5) * sr;
        targets[i3 + 2] = (Math.random() - 0.5) * sr - Math.random() * 500;
        sizes[i]   = Math.random() * 2.0 + 0.5;
        randoms[i] = Math.random();
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('aTarget',  new THREE.BufferAttribute(targets, 3));
      geometry.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute('aRandom',  new THREE.BufferAttribute(randoms, 1));

      material = new THREE.ShaderMaterial({
        uniforms: {
          uTime:         { value: 0 },
          uMouse:        { value: new THREE.Vector2(0, 0) },
          uScroll:       { value: 0 },
          uColorCenter:  { value: new THREE.Color('#FFFFFF') },
          uColorEdge:    { value: new THREE.Color('#3A86FF') },
          uColorScatter: { value: new THREE.Color('#8338EC') },
        },
        vertexShader:   VS,
        fragmentShader: FS,
        transparent: true,
        blending:    THREE.AdditiveBlending,
        depthWrite:  false,
      });

      particles = new THREE.Points(geometry, material);
      scene.add(particles);
    }

    /* ── DOM refs ──────────────────────────────────────────── */
    const heroText  = document.getElementById('hero-text')!;
    const scrollUI  = document.getElementById('scroll-ui')!;
    const footerUI  = document.getElementById('footer-ui')!;
    const compSec   = document.getElementById('competencies')!;
    const compItems = document.querySelectorAll<HTMLElement>('.competency-item');
    const expSec    = document.getElementById('experience')!;
    const expCards  = document.querySelectorAll<HTMLElement>('.exp-card');
    const expIdx    = document.querySelectorAll<HTMLElement>('.exp-index-item');
    const contactSec = document.getElementById('contact')!;

    /* ── State ─────────────────────────────────────────────── */
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    let scrollY = 0, targetScrollY = 0;
    let startTime = 0;
    let wh = window.innerHeight;

    let maxScroll       = wh * 1.5;
    let compStart       = wh * 1.2;
    let compEnd         = wh * 3.5;
    let experienceStart = wh * 4.0;
    let experienceEnd   = wh * 11.0;
    let contactStart    = wh * 11.5;

    const recalcBreakpoints = () => {
      wh = window.innerHeight;
      maxScroll       = wh * 1.5;
      compStart       = wh * 1.2;
      compEnd         = wh * 3.5;
      experienceStart = wh * 4.0;
      experienceEnd   = wh * 11.0;
      contactStart    = wh * 11.5;
    };

    const onScroll = () => { targetScrollY = window.scrollY; };
    const onMouse  = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const onResize = () => {
      recalcBreakpoints();
      if (renderer && camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('scroll',    onScroll,  { passive: true });
    window.addEventListener('mousemove', onMouse,   { passive: true });
    window.addEventListener('resize',    onResize);

    /* ── Animation loop ────────────────────────────────────── */
    function loop(timestamp: number) {
      animId = requestAnimationFrame(loop);
      if (!startTime) startTime = timestamp;
      const time = (timestamp - startTime) / 1000;

      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      scrollY += (targetScrollY - scrollY) * 0.08;

      if (material) {
        const scrollProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1.0);
        material.uniforms.uTime.value  = time;
        material.uniforms.uMouse.value.set(mouseX, mouseY);
        material.uniforms.uScroll.value = scrollProgress;

        particles.rotation.y = time * 0.05 + mouseX * 0.2;
        particles.rotation.x = mouseY * 0.5 * (1.0 - scrollProgress * 0.5);

        renderer.render(scene, camera);
      }

      /* Hero */
      const scrollProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1.0);
      const uiOpacity = 1.0 - smoothstep(0.1, 0.4, scrollProgress);
      heroText.style.opacity = String(uiOpacity);
      scrollUI.style.opacity = String(uiOpacity);
      heroText.style.transform = `translate(-50%, calc(-50% + ${scrollY * 0.2}px))`;

      /* Competencies */
      const compProgress = Math.max(0, Math.min(1, (scrollY - compStart) / (compEnd - compStart)));
      const expFadeInStart = experienceStart - wh;
      const compFadeOut  = Math.max(0, Math.min(1, (scrollY - expFadeInStart) / (wh * 0.8)));

      if (compProgress > 0 && compFadeOut < 1) {
        compSec.classList.add('section-active');
        compSec.style.opacity  = String(1 - compFadeOut);
        compSec.style.pointerEvents = 'auto';
        heroText.style.opacity = String(1 - compProgress * 2);
      } else if (compProgress >= 1 && compFadeOut < 1) {
        compSec.classList.add('section-active');
        compSec.style.opacity  = String(1 - compFadeOut);
        compSec.style.pointerEvents = 'auto';
        heroText.style.opacity = '0';
      } else {
        compSec.classList.remove('section-active');
        compSec.style.opacity  = '0';
        compSec.style.pointerEvents = 'none';
      }

      compItems.forEach((item, index) => {
        const threshold = (index + 1) * 0.15;
        if (compProgress > threshold) {
          item.classList.add('revealed');
        } else {
          item.classList.remove('revealed');
        }
      });

      /* Experience — section fade-out runs DURING last card's exit phase */
      const totalCards    = expCards.length;
      const cardScrollStep = (experienceEnd - experienceStart) / totalCards;
      // Last card exit phase: dist 0.7 → 1.1 (i.e. card fading from 1 → 0)
      const lastCardExitStart = experienceStart + (totalCards - 1 + 0.7) * cardScrollStep;
      const lastCardExitEnd   = experienceStart + (totalCards - 1 + 1.1) * cardScrollStep;

      if (scrollY > expFadeInStart && scrollY < lastCardExitStart) {
        // Fade in / fully visible while cards are alive
        expSec.style.opacity = String(Math.min(1, (scrollY - expFadeInStart) / (wh * 0.5)));
        expSec.style.pointerEvents = 'auto';
        expSec.classList.add('section-active');
      } else if (scrollY >= lastCardExitStart) {
        // Fade out synchronized with last card's exit
        const expFadeOut = Math.max(0, 1 - (scrollY - lastCardExitStart) / (lastCardExitEnd - lastCardExitStart));
        expSec.style.opacity = String(expFadeOut);
        expSec.style.pointerEvents = expFadeOut > 0.5 ? 'auto' : 'none';
        if (expFadeOut <= 0) expSec.classList.remove('section-active');
      } else {
        expSec.style.opacity = '0';
        expSec.style.pointerEvents = 'none';
        expSec.classList.remove('section-active');
      }

      let activeIndex = -1;

      expCards.forEach((card, index) => {
        const cardActiveScrollStart = experienceStart + index * cardScrollStep;
        const dist = (scrollY - cardActiveScrollStart) / cardScrollStep;

        let yOffset = 0, opacity = 0, zIndex = 0, scale = 1;

        if (dist < -0.3) {
          yOffset = 80; opacity = 0; zIndex = index; scale = 0.95;
        } else if (dist >= -0.3 && dist < 0) {
          const p = (dist + 0.3) / 0.3;
          yOffset = (1 - p) * 60; opacity = p; zIndex = index + 10; scale = 0.95 + p * 0.05;
        } else if (dist >= 0 && dist <= 0.7) {
          yOffset = dist * -15; opacity = 1; zIndex = index + 20; scale = 1;
        } else if (dist > 0.7 && dist < 1.1) {
          const p = (dist - 0.7) / 0.4;
          yOffset = -10 - p * 80; opacity = 1 - p * p; zIndex = index; scale = 1 - p * 0.05;
        } else {
          yOffset = -100; opacity = 0; zIndex = index; scale = 0.95;
        }

        card.style.transform  = `translateY(${yOffset}px) scale(${scale})`;
        card.style.opacity    = String(Math.max(0, Math.min(1, opacity)));
        card.style.zIndex     = String(zIndex);
        card.style.pointerEvents = opacity > 0.3 ? 'auto' : 'none';

        if (dist > 0.5 && dist < 1.2 && opacity > 0 && opacity < 1) {
          card.classList.add('exiting');
        } else {
          card.classList.remove('exiting');
        }

        if (opacity > 0.5 && dist >= -0.2 && dist <= 0.9) activeIndex = index;
      });

      expIdx.forEach((item, idx) => {
        if (idx === activeIndex) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      /* Contact */
      // Contact fade-in begins right when experience fade-out ends (no gap)
      const contactFadeStart = lastCardExitEnd;
      if (scrollY > contactFadeStart) {
        const cp = Math.min(1, Math.max(0, (scrollY - contactFadeStart) / (wh * 0.5)));
        contactSec.style.opacity = String(cp);
        if (cp > 0) {
          contactSec.classList.add('section-active');
          contactSec.style.pointerEvents = cp > 0.5 ? 'auto' : 'none';
        }
        footerUI.style.opacity = String(1 - cp);
      } else {
        contactSec.style.opacity = '0';
        contactSec.classList.remove('section-active');
        contactSec.style.pointerEvents = 'none';
        footerUI.style.opacity = '1';
      }
    }

    init().then(() => {
      animId = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll',    onScroll);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize',    onResize);
      if (renderer) {
        renderer.dispose();
        webglRef.current?.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <>
      {/* WebGL */}
      <div id="webgl-container" ref={webglRef} />

      {/* ── Competencies ─────────────────────────────────── */}
      <section className="competencies-section" id="competencies">
        <h2 className="vertical-title micro-data">Core Competencies</h2>
        <div className="competencies-container">
          <h2 className="section-title micro-data">Core Competencies</h2>
          <div className="competencies-list">
            {competencies.map((item) => (
              <div key={item.number} className="competency-item">
                <span className="competency-number micro-data">{item.number}</span>
                <div className="competency-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Experience ───────────────────────────────────── */}
      <section className="experience-section" id="experience">
        <h2 className="vertical-title micro-data">Experience</h2>
        <div className="exp-container">
          <div className="exp-left">
            <h2 className="section-title micro-data">Experience</h2>
            <div className="exp-index-list">
              {experiences.map((exp, idx) => (
                <div
                  key={exp.number}
                  className={`exp-index-item${idx === 0 ? ' active' : ''}`}
                  data-step={`${exp.number} / ${String(experiences.length).padStart(2, '0')}`}
                >
                  {exp.indexLabel}
                </div>
              ))}
            </div>
          </div>

          <div className="exp-right" id="cards-wrapper">
            {experiences.map((exp) => (
              <div key={exp.number} className="exp-card has-backdrop">
                <div className="exp-card-header">
                  <span className="exp-card-number">{exp.number}</span>
                  <h3 className="exp-card-title">{exp.title}</h3>
                </div>
                <p className="exp-card-subtitle">{exp.subtitle}</p>
                <ul className="exp-card-list">
                  {exp.bullets.map((bullet, bi) => (
                    <li key={bi}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────── */}
      <section className="contact-section" id="contact">
        <h2 className="vertical-title micro-data">Connect</h2>
        <div className="contact-content-wrapper">
          <h3 className="contact-slogan">
            {contact.sloganLine1}
            <br />
            {contact.sloganLine2}
          </h3>
          <div className="contact-links-container">
            {contact.links.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                {link.icon === 'x' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 3.934H5.051z" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                )}
                <span>{link.handle}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="footer-meta-row micro-data">
          <span>{footerMeta.copyright}</span>
          <div className="coordinates">
            Location: {footerMeta.location}
          </div>
        </div>
      </section>

      {/* ── UI Layer (always on top) ──────────────────────── */}
      <div className="ui-layer">
        <div className="header">
          <div className="logo micro-data">{header.logo}</div>
          <div className="nav-items micro-data">
            <span>{header.version}</span>
            <span>{header.language}</span>
          </div>
        </div>
        <div />
        <div className="footer" id="footer-ui">
          <div className="micro-data">
            STATUS: {footerMeta.status}<br />
            PARTICLES: {footerMeta.particles}<br />
            PHYSICS: {footerMeta.physics}
          </div>
          <div className="scroll-indicator micro-data fade-on-scroll" id="scroll-ui">
            <span>{footerMeta.scrollCta}</span>
            <div className="scroll-line" />
          </div>
          <div className="coordinates micro-data">
            Location: {footerMeta.location}
          </div>
        </div>
      </div>

      {/* ── Hero Text ─────────────────────────────────────── */}
      <div className="hero-content fade-on-scroll" id="hero-text">
        <div className="hero-text-wrapper">
          <h1>
            <span className="slogan-top">{hero.taglineTop}</span>
            <span className="slogan-bottom">{hero.taglineBottom}</span>
          </h1>
        </div>
      </div>
    </>
  );
}
