precision highp float;

uniform vec2 uScale;

uniform vec2 uCornerA;
uniform vec2 uCornerB;

vec2 cAdd (vec2 u, vec2 v) {
    return u + v;
}

vec2 cLn (vec2 z) {
    return vec2(0.5 * log(dot(z, z)), atan(z.y, z.x));
}

vec2 cMul (vec2 z, vec2 w) {
    return vec2(z.x * w.x - w.y * z.y, z.x * w.y + w.x * z.y);
}

vec2 cExp (vec2 z) {
    return exp(z.x) * vec2(cos(z.y), sin(z.y));
}

vec2 cPow (vec2 z, vec2 w) {
    return cExp(cMul(w, cLn(z)));
}

vec3 hue2rgb (float hue) {
    return (vec3(
        cos(hue * 3.1415 * 2.0), 
        cos(hue * 3.1415 * 2.0 + 2.0 * 3.1415 / 3.0), 
        cos(hue * 3.1415 * 2.0 + 4.0 * 3.1415 / 3.0)) + 1.0) / 2.0;
}

void main() {
    highp vec2 uv = uScale * gl_FragCoord.xy - 1.0;
    
    uv = (uCornerA + uCornerB) / 2.0 + uv * (uCornerB - uCornerA) * 0.5;
    
    highp vec2 res = cPow(uv, uv);
    
    for (int i = 0; i < 412; i ++) {
        res = cPow(uv, res);
    }
    
    float hue = (atan(res.y, res.x) + 3.1415) / 6.283;
    
    vec3 col = dot(res, res) * 1.0 * hue2rgb(hue);
    
    gl_FragColor = vec4(col.rgb, 1.0);
}