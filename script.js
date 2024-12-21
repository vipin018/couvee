
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfefdfd);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
});

renderer.setClearColor(0xffffff, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
renderer.tonMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.5;
document.querySelector(".model").appendChild(renderer.domElement);


// add lights if needed

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
directionalLight.position.set(10, 10, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffffff, 3, 200);
pointLight.position.set(-10, 10, 10);
scene.add(pointLight);

const spotLight = new THREE.SpotLight(0xffffff, 4);
spotLight.position.set(5, 15, 5);
spotLight.castShadow = true;
scene.add(spotLight);

// Helpers (optional)
scene.add(new THREE.DirectionalLightHelper(directionalLight, 5));
scene.add(new THREE.PointLightHelper(pointLight, 5));
scene.add(new THREE.SpotLightHelper(spotLight));

// Renderer and bloom effect
renderer.toneMappingExposure = 3.5;
renderer.physicallyCorrectLights = true;


function basicAnimate() {
    renderer.render(scene, camera);
    requestAnimationFrame(basicAnimate);
}

basicAnimate();

let model;
const loader = new THREE.GLTFLoader();
loader.load(
    "./assets/coke_light.glb",
    function (gltf) {
        model = gltf.scene;
        model.traverse((node) => {
            if (node.isMesh) {
                if (node.material) {
                    node.material.metalness = 0.3;
                    node.material.roughness = 0.4;
                    node.material.envMapIntensity = 1.5;
                }
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        scene.add(model);

        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        camera.position.z = maxDim * 1.5;

        playInitialAnimation();

        cancelAnimationFrame(basicAnimate);
        animate();
    });

const floatAmplitude = 0.2;
const floatSpeed = 1.5;
const rotationSpeed = 0.3;
let isFloating = true;
let currentScroll = 0;

const stickyHeight = window.innerHeight;
const scannerSection = document.querySelector(".scanner");
const scannerPosition = scannerSection.offsetTop;
const scanContainer = document.querySelector(".scan-container");
// const scanSound = new Audio("./assets/scan-sfx.mp3");
gsap.set(scanContainer, { scale: 0 });

function playInitialAnimation() {
    if (model) {
        gsap.to(model.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 1,
            ease: "power2.out",
        });
    }
    gsap.to(scanContainer, {
        scale: 1,
        duration: 1,
        ease: "power2.out",
    })
}

ScrollTrigger.create({
    trigger: "body",
    start: "top top",
    end: "top -10",
    onEnterBack: () => {
        if (model) {
            gsap.to(model.scale, {
                x: 1,
                y: 1,
                z: 1,
                duration: 1,
                ease: "power2.out",
            });
            isFloating = true;
        }
        gsap.to(scanContainer, {
            scale: 1,
            duration: 1,
            ease: "power2.out",
        });
    }
});

ScrollTrigger.create({
    trigger: ".scanner",
    start: "top top",
    end: `${stickyHeight}px`,
    pin: true,
    onEnter: () => {
        if (model) {
            isFloating = false;
            model.position.y = 0;

            gsap.to(model.rotation, {
                y: model.rotation.y + Math.PI * 2,
                duration: 1,
                ease: "power2.inOut",
                onComplete: () => {
                    gsap.to(model.scale, {
                        x: 0,
                        y: 0,
                        z: 0,
                        duration: 0.5,
                        ease: "power2.in",
                        onComplete: () => {
                            gsap.to(scanContainer, {
                                scale: 0,
                                duration: 0.5,
                                ease: "power2.in"
                            })
                        }
                    })
                }
            })
        }
    },
    onLeaveBack: () => {
        gsap.set(scanContainer, { scale: 0 });
        gsap.to(scanContainer, {
            scale: 1,
            duration: 1,
            ease: "power2.out",
        });
    }

})

lenis.on("scroll", (e) => {
    currentScroll = e.scroll;
});

function animate() {
    if (model) {
        if (isFloating) {
            const floatOffset = Math.sin(Date.now() * 0.001 * floatSpeed) * floatAmplitude;
            model.position.y = floatOffset;
        }
        const scrollProgress = Math.min(currentScroll / scannerPosition, 1);

        if (scrollProgress < 1) {
            model.rotation.x = scrollProgress * Math.PI * 2;
        }
        if (scrollProgress < 1) {
            model.rotation.y = 0.001 * rotationSpeed;
        }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}