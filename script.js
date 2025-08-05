// Initialize Three.js scene
let scene, camera, renderer, particles;
let mouseX = 0, mouseY = 0;

// Setup and init Three.js scene
function init() {
  // Create scene
  scene = new THREE.Scene();
  
  // Setup camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.z = 750;
  
  // Setup renderer
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Append canvas to the container
  const container = document.getElementById('canvas-container');
  container.appendChild(renderer.domElement);
  
  // Create particle system
  createParticles();
  
  // Add event listeners
  window.addEventListener('resize', onWindowResize);
  document.addEventListener('mousemove', onMouseMove);
  
  // Initialize card effects
  initCardEffects();
  
  // Start animation loop
  animate();
}

// Create 3D particle system
function createParticles() {
  const particleCount = 1500;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const colors = new Float32Array(particleCount * 3);
  
  const colorPalette = [
    new THREE.Color(0x0066ff), // Blue
    new THREE.Color(0x8610f2), // Purple
    new THREE.Color(0x00e1ff)  // Cyan
  ];
  
  for (let i = 0; i < particleCount; i++) {
    // Position particles in 3D space
    positions[i * 3] = (Math.random() - 0.5) * 2000;     // x
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2000; // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2000; // z
    
    // Random size between 1 and 5
    sizes[i] = Math.random() * 4 + 1;
    
    // Assign colors from palette
    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  
  // Add attributes to geometry
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  // Create particle material
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
      pixelRatio: { value: window.devicePixelRatio }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      uniform float time;
      uniform float pixelRatio;
      
      void main() {
        vColor = color;
        vec3 pos = position;
        pos.y += sin(time * 0.2 + position.x * 0.01) * 20.0;
        pos.x += cos(time * 0.2 + position.y * 0.01) * 20.0;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        
        // Soft circle effect
        float strength = 1.0 - d * 2.0;
        gl_FragColor = vec4(vColor, strength);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false
  });
  
  // Create points and add to scene
  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Track mouse movement
function onMouseMove(event) {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Rotate particles based on mouse position
  if (particles) {
    particles.rotation.x += 0.0003;
    particles.rotation.y += 0.0005;
    
    // Slightly move particles based on mouse
    particles.rotation.x += mouseY * 0.0005;
    particles.rotation.y += mouseX * 0.0005;
    
    // Update shader time uniform
    particles.material.uniforms.time.value += 0.05;
  }
  
  renderer.render(scene, camera);
}

// Initialize 3D card effects
function initCardEffects() {
  const cards = document.querySelectorAll('.topic-card');
  
  cards.forEach(card => {
    // Add tilt effect on mouse move
    card.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const angleX = (y - centerY) / 15;
      const angleY = -(x - centerX) / 15;
      
      this.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) translateY(-10px)`;
      
      // Add lighting effect
      const content = this.querySelector('.card-content');
      if (content) {
        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;
        content.style.background = `
          radial-gradient(
            circle at ${percentX}% ${percentY}%, 
            rgba(35, 35, 45, 0.9),
            rgba(15, 15, 20, 0.85)
          )
        `;
      }
    });
    
    // Reset on mouse out
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
      
      const content = this.querySelector('.card-content');
      if (content) {
        content.style.background = 'rgba(15, 15, 20, 0.85)';
      }
    });
    
    // Add slight scale effect on click
    card.addEventListener('mousedown', function() {
      this.style.transform = 'scale(0.95) translateY(-5px)';
    });
    
    // Reset on mouse up
    card.addEventListener('mouseup', function() {
      this.style.transform = 'scale(1) translateY(-10px)';
    });
  });
  
  // Add scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
      }
    });
  }, { threshold: 0.1 });
  
  // Observe all section titles and cards
  document.querySelectorAll('.section-title, .topic-card').forEach(el => {
    observer.observe(el);
  });
  
  // Add glow effect to nav links on hover
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('mouseenter', function() {
      this.style.boxShadow = '0 0 15px rgba(80, 80, 255, 0.8)';
    });
    
    link.addEventListener('mouseleave', function() {
      this.style.boxShadow = 'none';
    });
  });
}

// Initialize on page load
window.addEventListener('load', init); 