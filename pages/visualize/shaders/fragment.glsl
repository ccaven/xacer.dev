precision highp float;

uniform vec2 u_resolution;

uniform vec3 u_camera;
uniform mat4 u_view;

uniform float u_input[512];

#define PI 3.1415926353
#define ITERATIONS 1000
#define EPSILON 0.002

vec4 qadd (vec4 a, float s) {
    return vec4(a.x + s, a.y, a.z, a.w);
}
vec4 qmul(vec4 q1, vec4 q2) {
    return vec4(q1.x * q2.x - dot(q1.yzw, q1.yzw),
        q1.x * q2.yzw + q2.x * q1.yzw + cross(q1.yzw, q2.yzw));
}
vec4 qconj (vec4 a) {
    return vec4(a.x, -a.yzw);
}
vec4 qinv (vec4 a) {
    return qconj(a) / dot(a, a);
}
vec4 qdiv (vec4 a, vec4 b) {
    return qmul(a, qinv(b));
}
vec4 qexp (vec4 a) {
    float l = length(a.yzw);
    return exp(a.x) * vec4(cos(l), sin(l) / l * a.yzw);
}
vec4 qln (vec4 a) {
    float l2 = length(a);
    return vec4(log(l2), a.yzw / length(a.yzw) * acos(a.x / l2));
}
vec4 qpow (vec4 a, float p) {
    return qexp(p*qln(a));
}
vec4 qpow (vec4 a, vec4 b) {
    return qexp(qmul(b, qln(a)));
}
vec4 qsqr (vec4 a) {
    return qmul(a, a);
}
vec4 qsqrt (vec4 a) {
    return qpow(a, 0.5);
}

vec4 f (vec4 z, vec4 c) {
    const int iters = 32;

    vec4 l = qln(z);
    for (int i = 0; i < iters; i += 4) {
        vec4 offset = vec4(u_input[i], u_input[i + 1], u_input[i + 2], u_input[i + 3]) + vec4(2, 0, 0, 0);
        z += qpow(offset, z) / float(iters);
        z -= c / float(iters);
    }

    return qsqr(z) + c;
}

vec4 df (vec4 z, vec4 c) {
    vec4 e = vec4(0.01, 0.0, 0.0, 0.0);
    return qdiv(f(z, c) - f(z + e, c), e);
}

float de (vec3 p) {
    const vec4 c = vec4(0.1, 0.5, -0.2, 0.0);
    vec4 z = vec4(p, 0.0);
    vec4 dz = vec4(1.0, 0.0, 0.0, 0.0);

    for (int i = 0; i < 20; i ++) {
        if (dot(z, z) > 4.0) break;
        dz = qmul(dz, df(z, c));
        z = f(z, c);
    }

    float h = 0.0125 * log(dot(z, z)) * sqrt(dot(z, z) / dot(dz, dz));

    float d2 = length(p) - 1.0;

    float k = 0.01;

    return h + min(d2 - h, 0.0) * k;
}

vec3 de_normal (vec3 p) {
    const float h = 0.01;
    const vec2 k = vec2(1,-1);
    return normalize(
        k.xyy * de( p + k.xyy*h ) +
        k.yyx * de( p + k.yyx*h ) +
        k.yxy * de( p + k.yxy*h ) +
        k.xxx * de( p + k.xxx*h ) );
}

float raytrace (vec3 origin, vec3 direction, float minDistance, float maxDistance) {
    float totalDistance = minDistance;
    for (int i = 0; i < ITERATIONS; i ++) {
        float localDistance = de(origin + direction * totalDistance);
        totalDistance += localDistance;
        if (localDistance < EPSILON) {
            return totalDistance;
        }
        if (totalDistance > maxDistance) {
            return -1.0;
        }
    }
    return -1.0;
}

void main () {
    vec2 screen_uv = (gl_FragCoord.xy / u_resolution) * 2.0 - 1.0;

    vec2 camera_uv = screen_uv * u_resolution.xy / u_resolution.yy;

    vec3 camera_position = u_camera;
    vec3 camera_ray = normalize(vec3(camera_uv, 1.0)) * mat3(u_view);

    float d = raytrace(camera_position, camera_ray, 0.0, 100.0);

    if (d < 0.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }

    vec3 hit = camera_position + camera_ray * d;
    vec3 nor = de_normal(hit);

    vec3 ld = normalize(vec3(1, 1, -1));

    float diffuse = dot(nor, ld) * 0.5 + 0.5;

    gl_FragColor = vec4(vec3(1, 1, 1) * diffuse, 1);
}