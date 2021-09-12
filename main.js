// Import vec3 module
import * as vec3 from "https://cdn.jsdelivr.net/gh/ccaven/xacer3d/src/gl-matrix/vec3.js";

// Import vec4 module
import * as vec4 from "https://cdn.jsdelivr.net/gh/ccaven/xacer3d/src/gl-matrix/vec4.js";

// Import mat3 module
import * as mat3 from "https://cdn.jsdelivr.net/gh/ccaven/xacer3d/src/gl-matrix/mat3.js";

// Import mat4 module
import * as mat4 from "https://cdn.jsdelivr.net/gh/ccaven/xacer3d/src/gl-matrix/mat4.js";

console.log("Hello world!");

(async () => {

    /**
     * @type {HTMLCanvasElement}
     */
    const canvas = document.getElementById("background-canvas");

    let width = window.innerWidth;
    let height = window.innerHeight;

    let m = 500;

    if (width > m || height > m) {
        let r = m / width;
        if (width > height) r = m / height;
        width *= r;
        height *= r;
    }

    canvas.width = width;
    canvas.height = height;

    const gl = canvas.getContext("webgl");

    if (!gl) {
        console.error("WebGL not valid!");
        return;
    }

    const vertexSource = await fetch("./vertex.glsl").then(r => r.text());
    const fragmentSource = await fetch("./fragment.glsl").then(r => r.text());

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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(
        [-1, -1, +1, -1, -1, +1, -1, +1, +1, -1, +1, +1]), gl.STATIC_DRAW);

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

    function resize (s) {
        width = window.innerWidth;
        height = window.innerHeight;

        if (width > s || height > s) {
            let r = s / width;
            if (width > height) r = s / height;
            width *= r;
            height *= r;
        }

        canvas.width = width;
        canvas.height = height;

        gl.viewport(0, 0, width, height);
        gl.uniform2f(locations.u_resolution, width, height);
    }

    // Load in skybox
    (async () => {
        const image = new Image();
        image.src = "./skybox.png";
        image.onload = () => {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Set the parameters so we can render any size image.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        };
    }) ();


    const lights = [
        {
            position: vec3.create(),
            color: vec3.fromValues(1, 1, 1),
            intensity: 20
        },
        {
            position: vec3.create(),
            color: vec3.fromValues(1, 1, 1),
            intensity: 20
        },
        {
            position: vec3.create(),
            color: vec3.fromValues(1, 1, 1),
            intensity: 1
        },
        {
            position: vec3.create(),
            color: vec3.fromValues(1, 1, 1),
            intensity: 1
        },
        {
            position: vec3.create(),
            color: vec3.fromValues(1, 1, 1),
            intensity: 1
        },
    ];

    lights[0].position[0] = -13;
    lights[0].position[2] = 2;
    lights[0].color[0] = 0;

    lights[1].position[1] = 5;
    lights[1].position[2] = -1;

    lights[2].intensity = 20;
    lights[2].position[2] = 5;

    const camera = {
        position: vec3.create(),
        viewMatrix: mat4.identity(mat4.create())
    };

    mat4.rotate(camera.viewMatrix, camera.viewMatrix, 0.5, [0, 0, 1]);

    camera.position[0] = 0;
    camera.position[2] = -5;

    function orbitCamera (r) {
        camera.position[0] = Math.cos(r) * 4.0;
        camera.position[2] = Math.sin(r) * 4.0;

        mat4.fromRotation(camera.viewMatrix, Math.PI / 2 + r, [0, 1, 0]);
    }

    function setCamera (anim) {
        orbitCamera(anim / 300.0);

        // Send camera data to the shader
        gl.uniformMatrix4fv(locations.u_view, false, camera.viewMatrix);
        gl.uniform3fv(locations.u_camera, camera.position);

        for (let i = 0; i < 5; i ++) {
            const pl = gl.getUniformLocation(program, `u_lights[${i}].position`);
            const cl = gl.getUniformLocation(program, `u_lights[${i}].color`);
            const il = gl.getUniformLocation(program, `u_lights[${i}].intensity`);

            gl.uniform3fv(pl, lights[i].position);
            gl.uniform3fv(cl, lights[i].color);
            gl.uniform1f(il, lights[i].intensity);
        }

        // Send animation time to the shader
        //gl.uniform1f(locations.u_time, time);
        gl.uniform1f(locations.u_anim, anim);

        draw();
    }

    document.body.onscroll = (e) => {
        // Set position and view matrix
        let anim = document.body.getBoundingClientRect().top;
        setCamera(anim);

    };

    let lastTime = Date.now();
    let frameStreak = 0;

    if (window.lastAnimationFrameId) {
        cancelAnimationFrame(window.lastAnimationFrameId);
    }

    function draw () {
        let d = (Date.now() - lastTime) / 1000;
        lastTime = Date.now();
        if (d > 1 / 30) {
            frameStreak ++;
        } else {
            frameStreak = 0;
        }

        if (frameStreak > 1000 && m > 100) {
            m -= 50;
            resize(m);
            frameStreak = 0;
        }

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    window.lastAnimationFrameId = setInterval(requestAnimationFrame, 1000 / 30, draw);

    setCamera(0);


}) ();