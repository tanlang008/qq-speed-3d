// 主渲染与游戏循环驱动 (Three.js 核心集成与摄像机第三人称跟随、动态速度线与镜头FOV拉伸)

let scene, camera, renderer;
let trackBuilder, carModel, physicsController;
let lastTime = performance.now();
let raceStartTime = 0;
let isStarted = false;

function init() {
    const canvas = document.getElementById('webgl-canvas');

    // 1. 场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x74b9ff); // 蓝天
    scene.fog = new THREE.FogExp2(0x74b9ff, 0.002);

    // 2. 摄像机
    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.5, 2000);
    camera.position.set(0, 5, 12);

    // 3. 渲染器
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. 光照 (阳光明媚的飞车世界)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    dirLight.position.set(100, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 600;
    const d = 150;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // 5. 赛道与经典场景构建
    trackBuilder = new TrackBuilder(scene);
    const trackInfo = trackBuilder.buildTrack();

    // 6. 车辆模型与物理控制器
    carModel = new CarModel(scene);
    // 起跑线初始摆放位置
    carModel.group.position.set(0, 0, 10);
    physicsController = new PhysicsController(carModel, trackInfo);
    physicsController.position.set(0, 0, 10);

    // 7. 速度线效果系统 (高速/大喷时出现经典速度拉线)
    initSpeedLines();

    // 事件绑定
    window.addEventListener('resize', onWindowResize);

    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', () => {
        document.getElementById('start-overlay').style.display = 'none';
        if (window.soundManager) {
            window.soundManager.init();
            window.soundManager.playStart();
        }
        isStarted = true;
        raceStartTime = performance.now();
    });

    animate(performance.now());
}

let speedLinesMesh;
function initSpeedLines() {
    const count = 100;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 6);

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 20;
        const y = Math.random() * 8;
        const z = -Math.random() * 30;
        positions[i * 6] = x;
        positions[i * 6 + 1] = y;
        positions[i * 6 + 2] = z;
        positions[i * 6 + 3] = x;
        positions[i * 6 + 4] = y;
        positions[i * 6 + 5] = z - 6;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
    });
    speedLinesMesh = new THREE.LineSegments(geo, mat);
    camera.add(speedLinesMesh);
    scene.add(camera);
}

function updateCamera(dt) {
    // QQ飞车经典第三人称跟车视角
    // 带有轻微延迟平滑与加速动态拉远 (FOV 动态变焦)
    const carPos = physicsController.position;
    const heading = physicsController.heading;
    const speed = physicsController.currentSpeed;

    // 根据车速动态扩大视野与后视距
    const speedRatio = Math.min(Math.max(speed / 200, 0), 1.5);
    const targetDist = 7.5 + speedRatio * 2.5;
    const targetHeight = 3.2 + speedRatio * 0.8;

    const offsetBack = new THREE.Vector3(
        Math.sin(heading) * targetDist,
        targetHeight,
        -Math.cos(heading) * targetDist
    );

    const desiredCamPos = new THREE.Vector3().copy(carPos).add(offsetBack);
    camera.position.lerp(desiredCamPos, 0.15);

    // 观察目标稍微偏向前机盖前方
    const lookTarget = new THREE.Vector3(
        carPos.x - Math.sin(heading) * 6,
        carPos.y + 1.2,
        carPos.z + Math.cos(heading) * 6
    );
    camera.lookAt(lookTarget);

    // 动态视角 FOV (大喷时强烈的速度冲击感)
    let targetFov = 65 + (speed / 250) * 25;
    if (physicsController.isN2OBoosting) targetFov += 10;
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.1);
    camera.updateProjectionMatrix();

    // 速度线透明度
    if (speedLinesMesh) {
        const targetOpacity = speed > 180 ? Math.min((speed - 180) / 100, 0.6) : 0;
        speedLinesMesh.material.opacity = THREE.MathUtils.lerp(speedLinesMesh.material.opacity, targetOpacity, 0.15);
    }
}

function updateHUD() {
    const speedEl = document.getElementById('speed-text');
    if (speedEl) {
        speedEl.innerText = Math.round(Math.abs(physicsController.currentSpeed));
    }

    const nitroFill = document.getElementById('nitro-fill');
    if (nitroFill) {
        nitroFill.style.width = Math.min(physicsController.nitroGauge, 100) + '%';
    }

    const slot0 = document.getElementById('slot-0');
    const slot1 = document.getElementById('slot-1');
    if (slot0 && slot1) {
        if (physicsController.nitroCount >= 1) slot0.classList.add('ready');
        else slot0.classList.remove('ready');

        if (physicsController.nitroCount >= 2) slot1.classList.add('ready');
        else slot1.classList.remove('ready');
    }

    // 比赛时间
    if (isStarted) {
        const elapsed = (performance.now() - raceStartTime) / 1000;
        const mins = Math.floor(elapsed / 60);
        const secs = Math.floor(elapsed % 60);
        const millis = Math.floor((elapsed % 1) * 100);
        const timeEl = document.getElementById('time-display');
        if (timeEl) {
            timeEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(currentTime) {
    requestAnimationFrame(animate);

    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (physicsController) {
        physicsController.update(dt);
        updateCamera(dt);
        updateHUD();
    }

    renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', init);
