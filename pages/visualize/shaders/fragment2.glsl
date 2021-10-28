precision highp float;

#define PI 3.1415926353
#define ITERATIONS 2000
#define EPSILON 0.0001

uniform vec2 u_resolution;

uniform vec3 u_camera;
uniform mat4 u_view;

uniform vec4 u_normals[64];
uniform vec4 u_rotations[64];

float smin( float a, float b, float k ) {
    float h = max(k-abs(a-b),0.0);
    return min(a, b) - h*h*0.25/k;
}

// http://iquilezles.org/www/articles/smin/smin.htm
float smax( float a, float b, float k ) {
    float h = max(k-abs(a-b),0.0);
    return max(a, b) + h*h*0.25/k;
}

float hash (vec3 i, vec3 c) {
    vec3  p = 17.0 * fract( (i+c) * 0.3183099 + vec3(0.11,0.17,0.13) );
    float w = fract( p.x*p.y*p.z*(p.x+p.y+p.z) );
   return 0.7*w*w;
}

// https://iquilezles.org/www/articles/fbmsdf/fbmsdf.htm
float sph( vec3 i, vec3 f, vec3 c ) {
    // random radius at grid vertex i+c (please replace this hash by
    // something better if you plan to use this for a real application)
    vec3  p = 17.0 * fract( (i+c) * 0.3183099 + vec3(0.11,0.17,0.13) );
    float w = fract( p.x*p.y*p.z*(p.x+p.y+p.z) );
    float r = hash(i, c);
    // distance to sphere at grid vertex i+c
    return length(f-c)-r;
}

// https://iquilezles.org/www/articles/fbmsdf/fbmsdf.htm
float sdBase( in vec3 p ) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    return min(min(min(sph(i, f, vec3(0, 0, 0)),
                       sph(i, f, vec3(0, 0, 1))),
                   min(sph(i, f, vec3(0, 1, 0)),
                       sph(i, f, vec3(0, 1, 1)))),
               min(min(sph(i, f, vec3(1, 0, 0)),
                       sph(i, f, vec3(1, 0, 1))),
                   min(sph(i, f, vec3(1, 1, 0)),
                       sph(i, f, vec3(1, 1, 1)))));
}

float de ( vec3 p) {
    const mat3 m = mat3( 0.00,  1.60,  1.20,
                        -1.60,  0.72, -0.96,
                        -1.20, -0.96,  1.28 );

    float d = max(-p.y, length(p) - 1.0);
    float n = 1.0;

    vec3 q = p;
    float s = 1.0;

    const int iters = 15;

    for (int i = 0; i < iters; i ++) {
        d += s * sdBase(q);

        q *= m;
        s *= 0.415;
    }

    float rd = 0.6 * d / float(iters) + max(-p.y, 0.0) * 0.4;

    return rd;
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