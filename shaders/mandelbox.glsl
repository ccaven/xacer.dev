precision lowp float;

uniform float uTime;
uniform vec2 uScale;

vec3 cameraPosition = vec3(cos(uTime) * 16.0, 0, sin(uTime) * 16.0);

mat3 cameraMatrix = mat3(
    cos(uTime + 3.14 / 2.0), 0, -sin(uTime + 3.14 / 2.0), 
    0, 1, 0, 
    sin(uTime + 3.14 / 2.0), 0, cos(uTime + 3.14 / 2.0));

const int iterations = 7;

const float Scale = 2.48;
const float foldingLimit = 1.50;
const float fixedRadius2 = 4.0;
const float minRadius2 = 0.0;

const vec3 boxCorner1 = vec3(-8.0, 9.0, -8.0);
const vec3 boxCorner2 = vec3(8.0, 20.0, 8.0);

float distanceEstimatorBox(vec3 z, vec3 c1, vec3 c2) {
    vec3 closestPoint = clamp(z, c1, c2);
    return length(z - closestPoint);
}

float distanceEstimator1(vec3 z) {
    return min(distanceEstimatorBox(z, boxCorner1, boxCorner2), distanceEstimatorBox(z, boxCorner1-vec3(0.0, 28.0, 0.0), boxCorner2-vec3(0.0, 28.0, 0.0)));
}

float distanceEstimator2(vec3 z) {
    vec3 offset = z;
    
    float dr = 1.0;
    
    for (int n = 0; n < iterations; n ++) {
        z = clamp(z, -foldingLimit, foldingLimit) * 2.0 - z;
        float r2 = dot(z,z);
        float temp = r2 < minRadius2 ? (fixedRadius2/minRadius2) : (r2 < fixedRadius2 ? (fixedRadius2 / r2) : 1.0);
        z *= temp;
        dr *= temp;
        z = z * Scale + offset;
        dr = dr * abs(Scale) + 1.0;
    }	
    return length(z) / abs(dr);
}

float distanceEstimator(vec3 z) {
    return min(distanceEstimator1(z), distanceEstimator2(z));
}

float whichObject(vec3 z) {
    return distanceEstimator1(z) > distanceEstimator2(z) ? 1.0 : 0.0;
}

const vec3 xDir = vec3(0.0001, 0, 0);
const vec3 yDir = vec3(0, 0.0001, 0);
const vec3 zDir = vec3(0, 0, 0.0001);

vec3 lightDirection = vec3(-cos(uTime + 3.14), 0, -sin(uTime + 3.14));


vec3 surfaceNormal (vec3 pos) {
    vec3 normal = vec3(
        distanceEstimator(pos + xDir) - distanceEstimator(pos - xDir),
        distanceEstimator(pos + yDir) - distanceEstimator(pos - yDir),
        distanceEstimator(pos + zDir) - distanceEstimator(pos - zDir)
    );
    return normalize(normal);
}

vec3 trace (vec3 origin, vec3 direction) {
    float totalDistance = 0.0;
    
    for (float steps = 0.0; steps < 100.0; steps ++) {
        vec3 pos = origin + direction * totalDistance;
        float distance = distanceEstimator(pos);
        totalDistance += distance;
        if (distance < 0.03) {
            vec3 normal = surfaceNormal(pos);
            float diffuse = max(dot(normal, lightDirection), 0.0);
            float specular = dot(reflect(direction, normal), lightDirection);
            
            specular = pow(max(specular, 0.0), 10.0);
                
            float shade = 0.7 * diffuse + 0.3 * specular + 0.1;
            vec3 tint = vec3(1.0, 1.0, 1.0);
            if (whichObject(pos) == 1.0) {
                tint = vec3(1.0, 0.5, 0.1);
            }
            return shade * tint;
            
            
        }
    }
    return 0.2 * vec3(232.0, 159.0, 14.0) / 255.0;
}

void main () {
    vec2 uv = 1.0 - uScale * gl_FragCoord.xy;
    
    vec3 ray = normalize(vec3(uv.xy, 1.0)) * cameraMatrix;
    
    vec3 col = trace(cameraPosition, ray);

    gl_FragColor = vec4(col.rgb, 1.0);
}