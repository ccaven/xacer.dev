
/**
 * Resize a canvas to match the window
 * @param {HTMLCanvasElement} canvas
 */
export function refreshCanvasSize(canvas) {
    const targetWidth = window.innerWidth;
    const targetHeight = window.innerHeight;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
}
