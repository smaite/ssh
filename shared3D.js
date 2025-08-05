// 3D AMOLED Theme - Shared JavaScript

// Initialize Three.js scene
let scene, camera, renderer, particles;
let mouseX = 0, mouseY = 0;

// Setup and init Three.js scene
function initThreeScene() {
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
  if (container) {
    container.appendChild(renderer.domElement);
  } else {
    // If no container exists, create one
    const newContainer = document.createElement('div');
    newContainer.id = 'canvas-container';
    document.body.prepend(newContainer);
    newContainer.appendChild(renderer.domElement);
  }
  
  // Create particle system
  createParticles();
  
  // Add event listeners
  window.addEventListener('resize', onWindowResize);
  document.addEventListener('mousemove', onMouseMove);
  
  // Start animation loop
  animate();
}

// Create 3D particle system
function createParticles() {
  const particleCount = window.innerWidth < 768 ? 750 : 1500; // Reduce particles on mobile
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
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
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
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Initialize 3D card effects
function initCardEffects() {
  // Find all elements with the appropriate classes
  const cards = document.querySelectorAll('.topic-card, .card');
  
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
      
      this.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) translateY(-5px)`;
      
      // Add lighting effect if card has content element
      const content = this.querySelector('.card-content') || this;
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
      
      const content = this.querySelector('.card-content') || this;
      if (content && !content.hasAttribute('data-preserve-bg')) {
        content.style.background = 'rgba(15, 15, 20, 0.85)';
      }
    });
    
    // Add slight scale effect on click
    card.addEventListener('mousedown', function() {
      this.style.transform = 'scale(0.98) translateY(-2px)';
    });
    
    // Reset on mouse up
    card.addEventListener('mouseup', function() {
      this.style.transform = 'scale(1) translateY(-5px)';
    });
  });
}

// Add scroll animations
function initScrollAnimations() {
  // Only initialize if IntersectionObserver is available
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
        }
      });
    }, { threshold: 0.1 });
    
    // Observe headings and cards
    document.querySelectorAll('.section-title, h1, h2, .topic-card, .card, table, form').forEach(el => {
      observer.observe(el);
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    document.querySelectorAll('.section-title, h1, h2, .topic-card, .card, table, form').forEach(el => {
      el.classList.add('fade-in');
    });
  }
}

// Add glow effect to buttons and links
function initGlowEffects() {
  document.querySelectorAll('a, button, .btn').forEach(element => {
    element.addEventListener('mouseenter', function() {
      this.classList.add('glow-effect');
      this.style.boxShadow = '0 0 15px rgba(80, 80, 255, 0.8)';
    });
    
    element.addEventListener('mouseleave', function() {
      this.classList.remove('glow-effect');
      this.style.boxShadow = 'none';
    });
  });
}

// Initialize everything
function init3DTheme() {
  // Create the theme toggle button if needed
  createThemeControls();
  
  // Initialize ThreeJS (if available)
  if (typeof THREE !== 'undefined') {
    initThreeScene();
  } else {
    console.log('Three.js not loaded, skipping 3D background');
  }
  
  // Initialize other effects
  initCardEffects();
  initScrollAnimations();
  initGlowEffects();
  
  // Make sure all elements with "fade-in" class are properly animated
  setTimeout(() => {
    document.querySelectorAll('.fade-in').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }, 100);
}

// Create theme toggle controls
function createThemeControls() {
  // Check if controls already exist
  if (document.getElementById('theme-controls')) return;
  
  // Create controls
  const controls = document.createElement('div');
  controls.id = 'theme-controls';
  controls.style.position = 'fixed';
  controls.style.bottom = '70px';
  controls.style.right = '20px';
  controls.style.zIndex = '999';
  
  // Performance toggle
  const perfToggle = document.createElement('button');
  perfToggle.textContent = '🚀';
  perfToggle.title = 'Toggle Performance Mode';
  perfToggle.className = 'theme-control-btn';
  perfToggle.style.width = '40px';
  perfToggle.style.height = '40px';
  perfToggle.style.borderRadius = '50%';
  perfToggle.style.border = 'none';
  perfToggle.style.background = 'rgba(30, 30, 50, 0.7)';
  perfToggle.style.color = '#fff';
  perfToggle.style.fontSize = '20px';
  perfToggle.style.cursor = 'pointer';
  perfToggle.style.marginBottom = '10px';
  perfToggle.style.display = 'block';
  
  // Event listener
  let performanceMode = false;
  perfToggle.addEventListener('click', function() {
    performanceMode = !performanceMode;
    const container = document.getElementById('canvas-container');
    
    if (performanceMode) {
      // Enable performance mode
      this.style.background = 'rgba(255, 60, 60, 0.7)';
      if (container) container.style.display = 'none';
    } else {
      // Disable performance mode
      this.style.background = 'rgba(30, 30, 50, 0.7)';
      if (container) container.style.display = 'block';
    }
  });
  
  controls.appendChild(perfToggle);
  document.body.appendChild(controls);
}

// Initialize when the page is fully loaded
window.addEventListener('load', init3DTheme); 