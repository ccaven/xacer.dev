precision highp float;
	
uniform vec2 uScale;

const float uAtmosphereRadius = 1.2;
const float uDensityFalloff = 2.0;

const float uNumScatteringSteps = 10.0;

const float PI = 3.1415926353;

const float MAXFLOAT = pow(2.0, 8.0) - 1.0;

float saturate (float x) {
    return clamp(x, 0.0, 1.0);
}

vec2 raySphere (vec3 sphereCenter, float sphereRadius, vec3 origin, vec3 ray) {
    vec3 offset = origin - sphereCenter;
    float a = 1.0;
    float b = 2.0 * dot(offset, ray);
    float c = dot(offset, offset) - sphereRadius * sphereRadius;
    float d = b * b - 4.0 * a * c;
    
    if (d > 0.0) {
        float s = sqrt(d);
        float dstToSphereNear = max(0.0, (-b - s) / (2.0 * a));
        float dstToSphereFar = (-b + s) / (2.0 * a);
        if (dstToSphereFar >= 0.0) {
            return vec2(dstToSphereNear, dstToSphereFar - dstToSphereNear);
        }
        
    }
    return vec2(MAXFLOAT, 0.0);
}

float densityAtPoint (vec2 densitySamplePoint) {
    float heightAboveSurface = length(densitySamplePoint) - 1.0;
    float height01 = saturate(heightAboveSurface / (uAtmosphereRadius - 1.0));
    return exp(-height01 * uDensityFalloff) * (1.0 - height01);
}

float opticalDepth (vec2 ro, vec2 rd, float rl) {
    vec2 sp = ro.xy;
    float ss = rl / (uNumScatteringSteps - 1.0);
    float od = 0.0;
    for (float i = 0.0; i < uNumScatteringSteps; i += 1.0) {
        float localDensity = densityAtPoint(sp);
        od += localDensity * ss;
        sp += rd * ss;
    }
    return od;
}

float lerp (float start, float end, float t) {
    return start + t * (end - start);
}

void main () {
    vec2 uv = uScale * gl_FragCoord.xy;
    
    float height01 = uv.y;
    float angle = uv.x * PI;
    
    float y = -2.0 * uv.x + 1.0;
    float x = sin(acos(y));
    
    vec2 dir = vec2(x, y);
    
    vec2 inPoint = vec2(0.0, lerp(1.0, uAtmosphereRadius, height01));
    
    float dst = raySphere(vec3(0, 0, 0), uAtmosphereRadius, vec3(inPoint, 0), vec3(dir, 0)).y;
    
    float dep = opticalDepth (inPoint + dir * 0.0001, dir, dst - 0.0002);
    
    float R = 100.0;

    dep = floor(dep * R * R * R);
    
    float b = mod(dep, R);
    float g = mod((dep - b) / R, R);
    float r = ((dep - b) / R / R) - g / R;
    
    
    
    gl_FragColor = vec4(r / R, g / R, b / R, 1.0);
}