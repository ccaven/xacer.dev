precision lowp float;
uniform vec2 uScale;
uniform float uTime;

vec2 c = vec2(cos(uTime), sin(uTime)) * 0.5;

void main () {
    vec2 uv = 1.0 - uScale * gl_FragCoord.xy;    
    vec2 z = (uv - 0.5) * 2.0;    
    float n = 0.0;    
    for (int i = 0; i < 40; i ++) {
        z = vec2(z.x * z.x - z.y * z.y, z.x * z.y * 2.0) + c;
        n ++;        
        if (dot(z, z) > 4.0) {
            break;
        }        
    }    
    gl_FragColor = vec4(vec3(n / 40.0), 1.0);
}