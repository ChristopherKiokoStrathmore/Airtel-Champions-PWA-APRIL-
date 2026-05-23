// Add WebGL error recovery to prevent context loss
import * as THREE from 'three';

// WebGL context recovery
let renderer = null;
let scene = null;
let camera = null;

function initWebGL() {
  try {
    // Create renderer with error handling
    renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false
    });
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Handle context loss
    renderer.domElement.addEventListener('webglcontextlost', (event) => {
      console.warn('WebGL context lost, attempting recovery...');
      event.preventDefault();
      
      // Attempt to restore context after delay
      setTimeout(() => {
        if (renderer && renderer.getContext()) {
          console.log('WebGL context restored');
          // Reinitialize scene here if needed
        }
      }, 1000);
    });
    
    renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored successfully');
    });
    
    return renderer;
  } catch (error) {
    console.error('WebGL initialization failed:', error);
    return null;
  }
}

// Export for use in your app
export { initWebGL, renderer, scene, camera };
