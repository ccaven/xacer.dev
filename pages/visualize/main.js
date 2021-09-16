
import * as vec3 from "https://cdn.jsdelivr.net/gh/ccaven/xacer3d/src/gl-matrix/vec3.js";
import * as mat4 from "https://cdn.jsdelivr.net/gh/ccaven/xacer3d/src/gl-matrix/mat4.js";

let width = 400;
let height = 400;

/**
 * @type {HTMLCanvasElement}
 */
const canvas = document.getElementById("output");

canvas.width = width;
canvas.height = height;

const gl = canvas.getContext("webgl");

/**
 * @type {HTMLInputElement}
 */
const fileInput = document.getElementById("data-input");

/**
 * @type {HTMLInputElement[]}
 */
const resolutions = [
    document.getElementById("select-tiny"),
    document.getElementById("select-medium"),
    document.getElementById("select-large")
];

/**
 * @type {HTMLButtonElement}
 */
const generateButton = document.getElementById("generate-button");

/**
 * @type {HTMLButtonElement[]}
 */
const saveButtons = [
    document.getElementById("save-png"),
    document.getElementById("save-jpeg"),
    document.getElementById("save-ico"),
];

const resolutionSizes = [
    [ 20, 20 ],
    [ 50, 50 ],
    [ 100, 100]
];

let shaderInputs;

fileInput.addEventListener("change", (event) => {
    const files = fileInput.files;

    if (!files.length) return;

    const file = files[0];

    if (!file.type.startsWith("application/json")) {
        alert("Please enter a JSON file!");
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        const json = JSON.parse(reader.result);

        const voiceprint = json.voiceprint;

        if (!voiceprint) {
            alert("Your JSON file didn't have a `voiceprint` property!");
        }

        console.log(voiceprint.length);

        let inx = 1;

        let min = Math.min(...voiceprint[inx]);
        let max = Math.max(...voiceprint[inx]);

        shaderInputs = voiceprint[inx].map(v => (v - min) / (max - min) * 2 - 1);

        /*
        shaderInputs = json.L.map(f => parseFloat(f.N)*10.0);

        let min = Math.min(...shaderInputs);
        let max = Math.max(...shaderInputs);

        shaderInputs = shaderInputs.map(v => (v - min) / (max - min) * 2 - 1);

        console.log(shaderInputs);
        */

    };

    reader.readAsText(files[0]);

    console.log(`There are ${files.length} files.`);
});

(async () => {
    if (!gl) {
        alert("Your browser does not support WebGL!\nPlease update your browser, use a different one, or try a different computer.");
        return;
    }

    gl.clearColor(1, 0.9, 0.9, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const vertexSource = await fetch("./shaders/vertex.glsl").then(r => r.text());
    const fragmentSource = await fetch("./shaders/fragment.glsl").then(r => r.text());

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);

    const vertexCompileSuccess = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);

    if (!vertexCompileSuccess) {
        console.error(gl.getShaderInfoLog(vertexShader));
        return;
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);

    const fragmentCompileSuccess = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);

    if (!fragmentCompileSuccess) {
        console.error(gl.getShaderInfoLog(fragmentShader));
        return;
    }

    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    gl.useProgram(program);

    gl.viewport(0, 0, width, height);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positionData = [-1, -1, +1, -1, -1, +1, -1, +1, +1, -1, +1, +1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionData), gl.STATIC_DRAW);

    const locations = {
        "a_position": gl.getAttribLocation(program, "a_position"),
        "u_resolution": gl.getUniformLocation(program, "u_resolution"),
        "u_camera": gl.getUniformLocation(program, "u_camera"),
        "u_view": gl.getUniformLocation(program, "u_view"),
        "u_time": gl.getUniformLocation(program, "u_time"),
        "u_anim": gl.getUniformLocation(program, "u_anim")
    };

    gl.enableVertexAttribArray(locations.a_position);
    gl.vertexAttribPointer(locations.a_position, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(locations.u_resolution, width, height);

    const camera = {
        position: vec3.create(),
        viewMatrix: mat4.identity(mat4.create())
    };

    function orbitCamera (r) {
        camera.position[0] = Math.cos(r) * 2.5;
        camera.position[2] = Math.sin(r) * 2.5;

        mat4.fromRotation(camera.viewMatrix, Math.PI / 2 + r, [0, 1, 0]);
    }

    orbitCamera(Math.PI / 4);

    generateButton.onclick = async (_) => {

        if (!shaderInputs) {
            alert("You need to enter a JSON file before making the image.");
            return;
        }

        for (let i = 0; i < shaderInputs.length; i ++) {
            const loc = gl.getUniformLocation(program, `u_input[${i}]`);
            gl.uniform1f(loc, shaderInputs[i]);
        }

        gl.uniform3fv(locations.u_camera, camera.position);
        gl.uniformMatrix4fv(locations.u_view, false, camera.viewMatrix);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

}) ();
