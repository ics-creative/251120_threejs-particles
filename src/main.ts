import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';


const canvas = document.querySelector("#canvas");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0, 0, 50);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Curl Noiseの実装
const noise = new SimplexNoise();
function curlNoise(x, y, z) {
    const e = 0.0001;

    // Noise field F
    const F = (x, y, z) => new THREE.Vector3(
        noise.noise3d(y, z, x),
        noise.noise3d(z, x, y),
        noise.noise3d(x, y, z)
    );

    const F_x1 = F(x + e, y, z);
    const F_x2 = F(x - e, y, z);
    const F_y1 = F(x, y + e, z);
    const F_y2 = F(x, y - e, z);
    const F_z1 = F(x, y, z + e);
    const F_z2 = F(x, y, z - e);

    const curl = new THREE.Vector3(
        (F_y1.z - F_y2.z - (F_z1.y - F_z2.y)) / (2 * e),
        (F_z1.x - F_z2.x - (F_x1.z - F_x2.z)) / (2 * e),
        (F_x1.y - F_x2.y - (F_y1.x - F_y2.x)) / (2 * e)
    );
    return curl;
}

// ====== Particles ======
const count = 3000;
const positions = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
    positions[i*3] = THREE.MathUtils.randFloatSpread(30);
    positions[i*3+1] = THREE.MathUtils.randFloatSpread(30);
    positions[i*3+2] = THREE.MathUtils.randFloatSpread(30);
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
    color: 0x66ccff,
    size: 0.12,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
});

const points = new THREE.Points(geometry, material);
scene.add(points);

// ====== Animation ======
function animate() {
    const pos = geometry.attributes.position.array;

    for (let i = 0; i < count; i++) {
        const ix = i*3, iy = ix+1, iz = ix+2;

        const p = new THREE.Vector3(pos[ix], pos[iy], pos[iz]);
        const flow = curlNoise(p.x * 0.1, p.y * 0.1, p.z * 0.1);
        flow.multiplyScalar(0.03);

        pos[ix] += flow.x;
        pos[iy] += flow.y;
        pos[iz] += flow.z;

        if (p.length() > 25) {
            pos[ix] = THREE.MathUtils.randFloatSpread(20);
            pos[iy] = THREE.MathUtils.randFloatSpread(20);
            pos[iz] = THREE.MathUtils.randFloatSpread(20);
        }
    }

    geometry.attributes.position.needsUpdate = true;
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

// Resize
window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
