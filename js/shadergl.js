var XGL;

(function() {	
	
	XGL = {};
	
	var gl, canvas;
	
	function loadGL (c) {
		XGL.canvas = c;
		XGL.width = c.width;
		XGL.height = c.height;
		
		var glArgs = {
			preserveDrawingBuffer: true,
			failIfMajorPerformanceCaveat: true
		};
		
		XGL.gl = XGL.canvas.getContext("webgl", glArgs);
		
		gl = XGL.gl;
		canvas = XGL.canvas;
	}
	
	function loadShader (type, source) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		
		var compileStatus = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if (!compileStatus) {
			gl.deleteShader(shader);
		}
		
		return shader;
    }
    
    function bakeTexture (fsSource, width, height) {
        var bakedCanvas = document.createElement("canvas");
        bakedCanvas.width = width;
        bakedCanvas.height = height;
        
        var bgl = bakedCanvas.getContext("webgl", {
            preserveDrawingBuffer: true,
            failIfMajorPerformanceCaveat: true
        });

        var vsSource = "attribute vec2 a_position;void main() { gl_Position = vec4(a_position.xy, 0.0, 1.0); }";

        var vertexShader = bgl.createShader(bgl.VERTEX_SHADER);
		bgl.shaderSource(vertexShader, vsSource);
		bgl.compileShader(vertexShader);
		
		var fragmentShader = bgl.createShader(bgl.FRAGMENT_SHADER);
		bgl.shaderSource(fragmentShader, fsSource);
		bgl.compileShader(fragmentShader);
		
		var bprogram = bgl.createProgram();
		bgl.attachShader(bprogram, vertexShader);
		bgl.attachShader(bprogram, fragmentShader);
		bgl.linkProgram(bprogram);
		
		bgl.viewport(0, 0, bgl.drawingBufferWidth, bgl.drawingBufferHeight);
		
		var triBuffer = bgl.createBuffer();
		bgl.bindBuffer(bgl.ARRAY_BUFFER, triBuffer);
		bgl.bufferData(bgl.ARRAY_BUFFER, 
			new Float32Array([-1, -1, +1, -1, -1, +1, -1, +1, +1, -1, +1, +1]),
			bgl.STATIC_DRAW);
		var positionLocation = bgl.getAttribLocation(bprogram, "a_position");
		bgl.enableVertexAttribArray(positionLocation);
		bgl.vertexAttribPointer(positionLocation, 2, bgl.FLOAT, false, 0, 0);
		
		bgl.useProgram(bprogram);
		
		var scaleUniform = bgl.getUniformLocation(bprogram, "uScale");
		
        bgl.uniform2f(scaleUniform, 1 / width, 1 / height);	
        	
		bgl.drawArrays(bgl.TRIANGLES, 0, 6);

        var bakedImageData = new Uint8Array(width * height * 4);
        bgl.readPixels(0, 0, width, height, bgl.RGBA, bgl.UNSIGNED_BYTE, bakedImageData);
        bakedCanvas.remove();

        return bakedImageData;
    }
	
	var Shader = function(fsSource) {
		this.vsSource = "attribute vec2 a_position;void main() { gl_Position = vec4(a_position.xy, 0.0, 1.0); }";
		this.fsSource = fsSource;
		this.vertexShader = loadShader(gl.VERTEX_SHADER, this.vsSource);
		this.fragmentShader = loadShader(gl.FRAGMENT_SHADER, this.fsSource);
		this.program = gl.createProgram();
		gl.attachShader(this.program, this.vertexShader);
		gl.attachShader(this.program, this.fragmentShader);
		gl.linkProgram(this.program);
		this.uniformLocations = {};
	}
	
	Shader.prototype.setUniform = function(uniformName, type, o1, o2, o3, o4) {
		var loc = this.uniformLocations[uniformName];
		if (type[type.length - 1] === "v") {
			gl["uniform" + type](loc, o1);
		} else if (type[0] === "1") {
			gl["uniform" + type](loc, o1);
		} else if (type[0] === "2") {
			gl["uniform" + type](loc, o1, o2);
		} else if (type[0] === "3") {
			gl["uniform" + type](loc, o1, o2, o3);
		} else {
			gl["uniform" + type](loc, o1, o2, o3, o4);
		}
	}
	
	Shader.prototype.addUniformLocation = function(name, id) {
		this.uniformLocations[name] = gl.getUniformLocation(this.program, id);
	}
	
	Shader.prototype.injectTexture2D = function(uniformName, n, textureObject) {
		var tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.activeTexture(gl.TEXTURE0 + n);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureObject.width, textureObject.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, textureObject.data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		this.setUniform(uniformName, "1i", n);
	}
	
	Shader.prototype.initialize = function() {
		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		var triBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, triBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, +1, -1, -1, +1, -1, +1, +1, -1, +1, +1]), gl.STATIC_DRAW);
		var positionLocation = gl.getAttribLocation(this.program, "a_position");
		gl.enableVertexAttribArray(positionLocation);
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
		gl.useProgram(this.program);
	}
	
	Shader.prototype.display = function(deltaTime) {
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	XGL.Shader = Shader;
    XGL.loadGL = loadGL;
})();