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

float line_de ( vec3 p, vec3 a, vec3 b ) {
    vec3 ba = b - a;
    vec3 pa = p - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - h * ba);
}

mat3 transpose(mat3 m) {
  return mat3(m[0][0], m[1][0], m[2][0],
              m[0][1], m[1][1], m[2][1],
              m[0][2], m[1][2], m[2][2]);
}

mat3 axis_angle(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c         );
}

void rotate (inout vec3 p, vec3 b) {
    b = normalize(b);

    vec3 axisOfRotation = normalize(cross(b, vec3(1, 0, 0)));
    float angleBetween = acos(dot(b, axisOfRotation)) * 0.25;

    mat3 m = axis_angle(axisOfRotation, angleBetween);

    p *= m;
}

void fold (inout vec3 p, vec3 n) {
    p -= 2.0 * min(dot(p, n), 0.0) * n;
}

float de ( vec3 p) {
    float m_dist = 999.0;

    float s = 1.0;
    float e = 1.5;

    vec3 b = vec3(1.0, 1.0, 1.0);

    vec3 f = normalize(vec3(1, 0, 0));

    mat3 m = axis_angle(
        normalize(-cross(b, f)),
        0.5 * acos(dot(normalize(b), f)));

    p *= transpose(m);
    p *= transpose(m);

    float l_dist = line_de(p, vec3(0, 0, 0), b) - 0.1;
    m_dist = min(m_dist, l_dist / s);

    p -= b;

    p *= m;

    for (int i = 0; i < 5; i ++) {

        // Scale
        p *= e;
        s *= e;
        p *= m;

        // Flip snapshot
        fold(p, vec3(1, 0, 0));
        fold(p, vec3(0, 0, 1));

        // Take snapshot
        l_dist = line_de(p, vec3(0, 0, 0), b) - 0.1 * sqrt(s);
        m_dist = min(m_dist, l_dist / s);

        // Reset to origin
        p -= b;

        // Rotate
        //rotate(p, b);


    }

    return m_dist - 0.001;
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