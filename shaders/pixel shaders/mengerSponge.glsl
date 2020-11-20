precision mediump float;
    
uniform float uTime;
uniform vec2 uScale;

vec3 cameraPosition = vec3(1.0, -0.5, -3.0);

mat3 cameraMatrix = mat3(
    1, 0, 0, 
    0, 1, 0, 
    0, 0, 1);

float rA = uTime * 0.25;

mat3 rotationA = mat3(
    cos(rA), 0, -sin(rA), 
    0, 1, 0, 
    sin(rA), 0, cos(rA));

float rB = 4.5;
float rC = 2.0;

mat3 rotationB = mat3(
    cos(rB), 0, -sin(rB), 
    0, 1, 0, 
    sin(rB), 0, cos(rB)
) * mat3(
    cos(rC), -sin(rC), 0,
    sin(rC), cos(rC), 0,
    0, 0, 1
);

float inf = 10000000.0;

float sdBox(vec3 z, vec3 b1, vec3 b2) {
    return length(z - clamp(z, b1, b2));
}

float distanceEstimator(vec3 z) {
    z = z * rotationA;
    float d = sdBox(z, vec3(-2), vec3(2));
    float s = 1.0;
    for (int m = 0; m < 7; m ++) {
        vec3 a = mod(z * s, 2.0) - 1.0;
        s *= 3.0;
        vec3 r = abs(1.0 - 3.0 * abs(a));
        float da = max(r.x, r.y);
        float db = max(r.y, r.z);
        float dc = max(r.z, r.x);
        float c = (min(da, min(db, dc))-1.0)/s;
        d = max(d, c);
        z = z * rotationB;
    }
    return d - 0.001;
}

vec3 lightDirection = normalize(vec3(0.5, 0.5, -1.0));

vec3 surfaceNormal (vec3 pos) {
    vec3 xDir = vec3(0.0001, 0, 0);
    vec3 yDir = vec3(0, 0.0001, 0);
    vec3 zDir = vec3(0, 0, 0.0001);
    vec3 normal = vec3(
        distanceEstimator(pos + xDir) - distanceEstimator(pos - xDir),
        distanceEstimator(pos + yDir) - distanceEstimator(pos - yDir),
        distanceEstimator(pos + zDir) - distanceEstimator(pos - zDir)
    );
    return normalize(normal);
}

vec3 trace (vec3 origin, vec3 direction) {
    float totalDistance = 0.0;
    for (float steps = 0.0; steps < 200.0; steps ++) {
        vec3 pos = origin + direction * totalDistance;
        float distance = distanceEstimator(pos);
        totalDistance += distance;
        if (distance < 0.001) {
            vec3 normal = surfaceNormal(pos);
            float diffuse = max(dot(normal, lightDirection), 0.0);
            float specular = dot(reflect(direction, normal), lightDirection);
            specular = pow(max(specular, 0.0), 1.0);
            float shade = 0.7 * diffuse + 0.3 * specular + 0.1;
            vec3 tint = vec3(1.0, 1.0, 1.0);
            return shade * tint;
        }
    }
    return 0.2 * vec3(232.0, 0.0, 14.0) / 255.0;
}

void main () {
    vec2 uv = 1.0 - uScale * gl_FragCoord.xy;
    
    vec3 ray = normalize(vec3(uv.xy, 1.0)) * cameraMatrix;
    
    vec3 col = trace(cameraPosition, ray);

    gl_FragColor = vec4(col.rgb, 1.0);
}