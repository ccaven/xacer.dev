attribute vec4 aPosition;
attribute vec4 aVertexColor;

uniform mat4 uProjectionMatrix;

varying lowp vec4 vColor;

void main () {
    gl_Position = aPosition * uProjectionMatrix;
    vColor = aVertexColor;
}