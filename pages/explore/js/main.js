
import { initializeGame } from "./game";
import { refreshCanvasSize } from "./utils";

/**
 * The output canvas
 * @type {HTMLCanvasElement}
 */
const canvas = document.getElementById("three-output");

refreshCanvasSize(canvas);

initializeGame(canvas);