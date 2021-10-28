
import * as THREE from "../three/three.module";

/**
 * @returns {THREE.PerspectiveCamera}
 */
function createPerspectiveCamera ({ fov, aspect, near, far }) {
    return new THREE.PerspectiveCamera(fov, aspect, near, far);
}

/**
 * Create and start running the game
 * @param {HTMLCanvasElement} canvas
 */
export function initializeGame (canvas) {

    const renderer = new THREE.WebGLRenderer({ canvas });

    const camera = createPerspectiveCamera({
        fov: 75,
        aspect: canvas.width / canvas.height,
        near: 0.01,
        far: 100.0
    });
}
