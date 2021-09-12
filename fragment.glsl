precision highp float;

uniform vec2 u_resolution;

uniform vec3 u_camera;
uniform mat4 u_view;

struct light {
    vec3 position;
    vec3 color;
    float intensity;
};

uniform light u_lights[5];

uniform float u_time;
uniform float u_anim;

uniform sampler2D u_skybox;

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
vec4 qsqr (vec4 a) {
    return qmul(a, a);
}
vec4 qsqrt (vec4 a) {
    return qpow(a, 0.5);
}

vec4 f (vec4 z, vec4 c) {
    return qpow(z, 4.0) - 1.0 * qsqr(z) - qmul(z, c) - c;
}
vec4 df (vec4 z, vec4 c) {
    vec4 e = vec4(0.01, 0.0, 0.0, 0.0);
    return qdiv(f(z, c) - f(z + e, c), e);
}

float getDistanceIndividual (vec3 p) {
    const vec4 c = vec4(0.1, 0.5, -0.2, 0.0);
    vec4 z = vec4(p, 0.0);
    vec4 dz = vec4(1.0, 0.0, 0.0, 0.0);

    for (int i = 0; i < 20; i ++) {
        if (dot(z, z) > 4.0) break;
        dz = qmul(dz, df(z, c));
        z = f(z, c);
    }
    float h = 0.0125 * log(dot(z, z)) * sqrt(dot(z, z) / dot(dz, dz));
    return h - 0.001;
}

float getDistance (vec3 p) {
    /*
    float md = 999.0;

    float fr = 15.0;

    for (int id = 0; id < 15; id ++) {

        float angle = float(id) / 15.0 * PI * 2.0 + u_anim;

        vec3 origin = vec3(cos(angle), 0, sin(angle)) * fr;

        float ld = getDistanceIndividual(p - origin, id - 3 * (id / 3));

        md = min(md, ld);
    }
    return md;
    */

    return getDistanceIndividual(p);
}

vec3 getColor (vec3 p) {
    return vec3(1, 1, 1);
}

vec3 getNormal (vec3 p) {
    const float h = 0.01;
    const vec2 k = vec2(1,-1);
    return normalize(
        k.xyy * getDistance( p + k.xyy*h ) +
        k.yyx * getDistance( p + k.yyx*h ) +
        k.yxy * getDistance( p + k.yxy*h ) +
        k.xxx * getDistance( p + k.xxx*h ) );
}

float raytrace (vec3 origin, vec3 direction, float minDistance, float maxDistance) {
    float totalDistance = 0.0;
    for (int i = 0; i < ITERATIONS; i ++) {
        float localDistance = max(minDistance, getDistance(origin + direction * totalDistance));
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
        // Hit nothing, grab from skybox

        float x = atan(camera_ray.z, camera_ray.x) / (PI * 2.0) + 0.5;
        float y = acos(camera_ray.y) / PI;

        gl_FragColor = texture2D(u_skybox, vec2(x, y));
        return;
    } else {
    }

    vec3 hit = camera_position + camera_ray * d;

    vec3 color = getColor(hit);
    vec3 normal = getNormal(hit);

    /*

    vec3 added_light;

    for (int i = 0; i < 5; i ++) {
        vec3 light_position = u_lights[i].position;
        vec3 light_color = u_lights[i].color;
        float light_intensity = u_lights[i].intensity;

        vec3 light_direction = normalize(light_position - hit);

        float light_ray_distance = raytrace(
            hit + light_direction * EPSILON * 2.0,
            light_direction, 0.01, distance(light_position, hit));

        if (light_ray_distance < 0.0) {
            // Nothing in between
            float diffuse = max(dot(normal, light_direction), 0.0);
            float specular = max(dot(reflect(camera_ray, normal), light_direction), 0.0);

            specular = pow(specular, 16.0);

            float l = diffuse + specular * 1.0;

            float intensity = l * light_intensity * dot(normal, light_direction) / dot(light_position - hit,light_position - hit);

            float mapped_intensity = 1.0 - exp(-intensity);

            added_light += color * light_color * mapped_intensity;

        }
    }

    gl_FragColor = vec4(added_light, 1);


    */

    vec3 light_dir = normalize(vec3(-1, -1, -1));
    float diffuse = max(dot(normal, -light_dir) * 0.5 + 0.5, 0.0);

    gl_FragColor = vec4(color * diffuse, 1);

}