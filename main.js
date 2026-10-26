import * as THREE from "three";

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Three.js background ---------- */
const canvas = document.getElementById("bg");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x07070f, 0.035);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.z = 12;

// Particle field
const COUNT = innerWidth < 800 ? 900 : 2200;
const pos = new Float32Array(COUNT * 3);
for (let i = 0; i < COUNT * 3; i++) pos[i] = (Math.random() - 0.5) * 60;
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
const particles = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ size: 0.05, color: 0x9d8bff, transparent: true, opacity: 0.8, depthWrite: false })
);
scene.add(particles);

// Floating wireframe shapes
const shapes = [];
const geos = [
    new THREE.IcosahedronGeometry(1.6, 1),
    new THREE.TorusKnotGeometry(0.9, 0.28, 90, 12),
    new THREE.OctahedronGeometry(1.2),
    new THREE.TorusGeometry(1.1, 0.35, 12, 32),
];
const colors = [0x7c5cff, 0x22d3ee, 0x7c5cff, 0x22d3ee];
geos.forEach((g, i) => {
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: colors[i], wireframe: true, transparent: true, opacity: 0.45 }));
    const side = i % 2 === 0 ? 1 : -1;
    m.position.set(side * (4 + Math.random() * 3), 3 - i * 4.5, -2 - Math.random() * 4);
    m.userData = { speed: 0.2 + Math.random() * 0.3, base: m.position.y, phase: Math.random() * 6 };
    scene.add(m);
    shapes.push(m);
});

// Pointer + scroll
const pointer = { x: 0, y: 0 };
addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / innerWidth - 0.5) * 2;
    pointer.y = (e.clientY / innerHeight - 0.5) * 2;
});
let scrollY = 0;
addEventListener("scroll", () => (scrollY = window.scrollY), { passive: true });

addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();
function animate() {
    const t = clock.getElapsedTime();
    particles.rotation.y = t * 0.02;
    particles.rotation.x = t * 0.01;
    shapes.forEach((m) => {
        m.rotation.x += 0.003 * m.userData.speed * 3;
        m.rotation.y += 0.004 * m.userData.speed * 3;
        m.position.y = m.userData.base + Math.sin(t * m.userData.speed + m.userData.phase) * 0.5;
    });
    // camera drifts down with the page and eases toward the pointer
    const targetY = -scrollY * 0.004 + -pointer.y * 0.6;
    camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.04;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.lookAt(0, camera.position.y * 0.6, 0);
    renderer.render(scene, camera);
    if (!reduceMotion) requestAnimationFrame(animate);
}
animate();

/* ---------- Typing effect ---------- */
const typed = document.getElementById("typed");
const words = ["Developer", "Django Engineer", "React Developer", "Problem Solver"];
let w = 0, c = 0, del = false;
function type() {
    const word = words[w];
    typed.textContent = word.slice(0, c);
    if (!del && c === word.length) { del = true; return setTimeout(type, 1400); }
    if (del && c === 0) { del = false; w = (w + 1) % words.length; }
    c += del ? -1 : 1;
    setTimeout(type, del ? 40 : 90);
}
reduceMotion ? (typed.textContent = words[0]) : type();

/* ---------- Scroll reveal + counters ---------- */
function countUp(el) {
    const target = +el.dataset.count, suffix = el.dataset.suffix || "";
    const start = performance.now();
    const step = (now) => {
        const p = Math.min((now - start) / 1200, 1);
        el.textContent = Math.round(target * p) + (p === 1 ? suffix : "");
        if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}
const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        const n = e.target.querySelector("[data-count]");
        if (n) countUp(n);
        io.unobserve(e.target);
    });
}, { threshold: 0.2 });
document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
    io.observe(el);
});

/* ---------- 3D tilt on cards ---------- */
if (!reduceMotion) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
        card.addEventListener("pointermove", (e) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            card.style.transition = "transform 0.05s";
            card.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(10px)`;
        });
        card.addEventListener("pointerleave", () => {
            card.style.transition = "transform 0.5s";
            card.style.transform = "";
        });
    });
}

/* ---------- Contact form (opens Gmail compose) ---------- */
document.getElementById("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const body = `${f.get("message")}\n\n- ${f.get("name")} (${f.get("email")})`;
    const q = new URLSearchParams({
        view: "cm", fs: "1", to: "aromalek20@gmail.com",
        su: "Portfolio enquiry from " + f.get("name"), body,
    });
    window.open("https://mail.google.com/mail/?" + q, "_blank", "noopener");
});

document.getElementById("year").textContent = new Date().getFullYear();
