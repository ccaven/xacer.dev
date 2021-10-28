
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

function calculatePercentile (value) {
    let sigma = 1;
    let z = value / Math.sqrt(2) / sigma;
    let t = 1 / (1 + 0.3275911 * Math.abs(z));
    let a1 =  0.254829592;
    let a2 = -0.284496736;
    let a3 =  1.421413741;
    let a4 = -1.453152027;
    let a5 =  1.061405429;
    let erf = 1-(((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-z*z);
    let sign = 1;
    if(z < 0) sign = -1;
    return (1/2)*(1+sign*erf);
}

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

        shaderInputs = voiceprint[0].map(calculatePercentile);
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
    const fragmentSource = await fetch("./shaders/fragment3.glsl").then(r => r.text());

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

        /*
        camera.position[0] = Math.cos(r) * 2.4;
        camera.position[1] = 0.5;
        camera.position[2] = Math.sin(r) * 2.4;

        mat4.fromRotation(
            mat4.fromRotation(camera.viewMatrix, Math.PI / 4, [1, 0, 0]), Math.PI / 2 + r, [0, 1, 0]);
        */

        camera.position[1] = 2;
        camera.position[2] = -3;
    }


    /*
    camera.position[0] = 0;
    camera.position[1] = 1;
    camera.position[2] = -5;
    */

    generateButton.onclick = async (_) => {


        orbitCamera(Math.random() * Math.PI * 2);

        /*
        if (!shaderInputs) {
            alert("You need to enter a JSON file before making the image.");
            return;
        }

        for (let i = 0; i < 64; i ++) {
            const n = [
                shaderInputs[i * 8 + 0] * 2 - 1,
                shaderInputs[i * 8 + 1] * 2 - 1,
                shaderInputs[i * 8 + 2] * 2 - 1,
                shaderInputs[i * 8 + 3] * 0.1,
            ];

            const n_loc = gl.getUniformLocation(program, `u_normals[${i}]`);
            gl.uniform4fv(n_loc, n);

            const r = [
                shaderInputs[i * 8 + 4] * 2 - 1,
                shaderInputs[i * 8 + 5] * 2 - 1,
                shaderInputs[i * 8 + 6] * 2 - 1,
                shaderInputs[i * 8 + 7] * 2 - 1,
            ];

            const rl = Math.hypot(...r);

            const r_loc = gl.getUniformLocation(program, `u_rotations[${i}]`);

            gl.uniform4fv(r_loc, r.map(v => v / rl));
        }
        */

        gl.uniform3fv(locations.u_camera, camera.position);
        gl.uniformMatrix4fv(locations.u_view, false, camera.viewMatrix);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

}) ();
