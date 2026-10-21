// QQ飞车经典车型【剃刀 / 雷诺】几何造型构建
// 具备车身、车轮转向动画、尾翼、四喷口涡轮引擎、氮气喷射火焰特效、漂移车辙与火花

class CarModel {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.wheels = [];
        this.frontWheels = [];
        this.flames = [];
        this.boostFlames = [];
        this.skidmarks = [];
        this.sparks = [];

        this.buildCarMesh();
        this.buildExhaustEffects();
        this.buildSparks();
        this.scene.add(this.group);
    }

    buildCarMesh() {
        // 主车身 (流线型超跑底盘与驾驶舱)
        // 经典白蓝/银红相间（雷诺/剃刀经典撞色）
        const carBodyGroup = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x2255ee,
            metalness: 0.8,
            roughness: 0.2,
            clearcoat: 0.8,
            clearcoatRoughness: 0.1
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.5,
            roughness: 0.3
        });

        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.9,
            roughness: 0.1
        });

        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x00d2d3,
            transmission: 0.7,
            opacity: 1,
            transparent: true,
            roughness: 0.1,
            ior: 1.5
        });

        // 1. 底盘大块
        const chassisGeo = new THREE.BoxGeometry(2.4, 0.6, 5.0);
        const chassis = new THREE.Mesh(chassisGeo, bodyMat);
        chassis.position.y = 0.6;
        chassis.castShadow = true;
        carBodyGroup.add(chassis);

        // 2. 前铲车头 (尖锐低趴)
        const noseGeo = new THREE.ConeGeometry(1.2, 1.8, 4);
        const nose = new THREE.Mesh(noseGeo, bodyMat);
        nose.rotation.y = Math.PI / 4;
        nose.rotation.x = Math.PI / 2;
        nose.position.set(0, 0.45, -2.6);
        nose.scale.set(1.4, 1.2, 0.4);
        carBodyGroup.add(nose);

        // 3. 驾驶舱风挡玻璃
        const cabinGeo = new THREE.BoxGeometry(1.6, 0.7, 2.2);
        const cabin = new THREE.Mesh(cabinGeo, glassMat);
        cabin.position.set(0, 1.15, 0.2);
        carBodyGroup.add(cabin);

        // 驾驶舱车顶盖
        const roofGeo = new THREE.BoxGeometry(1.4, 0.1, 1.8);
        const roof = new THREE.Mesh(roofGeo, accentMat);
        roof.position.set(0, 1.55, 0.2);
        carBodyGroup.add(roof);

        // 4. 车身侧翼进气道
        const sideGeo = new THREE.BoxGeometry(0.3, 0.4, 3.2);
        const lSide = new THREE.Mesh(sideGeo, accentMat);
        lSide.position.set(-1.25, 0.65, 0.2);
        const rSide = new THREE.Mesh(sideGeo, accentMat);
        rSide.position.set(1.25, 0.65, 0.2);
        carBodyGroup.add(lSide, rSide);

        // 5. 霸气高尾翼 (QQ飞车特色双层大尾翼)
        const wingPillarGeo = new THREE.BoxGeometry(0.12, 0.8, 0.2);
        const lWingP = new THREE.Mesh(wingPillarGeo, darkMat);
        lWingP.position.set(-0.8, 1.2, 2.0);
        const rWingP = new THREE.Mesh(wingPillarGeo, darkMat);
        rWingP.position.set(0.8, 1.2, 2.0);

        const wingBladeGeo = new THREE.BoxGeometry(2.6, 0.1, 0.7);
        const wingBlade = new THREE.Mesh(wingBladeGeo, accentMat);
        wingBlade.position.set(0, 1.6, 2.0);
        wingBlade.rotation.x = -0.1;

        carBodyGroup.add(lWingP, rWingP, wingBlade);

        // 6. 前大灯 (LED发光条)
        const lightMat = new THREE.MeshBasicMaterial({ color: 0x00f7ff });
        const lHeadlight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.1), lightMat);
        lHeadlight.position.set(-0.8, 0.6, -2.5);
        const rHeadlight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.1), lightMat);
        rHeadlight.position.set(0.8, 0.6, -2.5);
        carBodyGroup.add(lHeadlight, rHeadlight);

        // 7. 车轮 (4个宽胎带有轮毂)
        const wheelGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.45, 24);
        wheelGeo.rotateZ(Math.PI / 2);
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.9 });
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });

        const wheelPositions = [
            { x: -1.25, y: 0.52, z: -1.6, isFront: true },
            { x: 1.25, y: 0.52, z: -1.6, isFront: true },
            { x: -1.3, y: 0.52, z: 1.7, isFront: false },
            { x: 1.3, y: 0.52, z: 1.7, isFront: false }
        ];

        wheelPositions.forEach((pos) => {
            const wheelAnchor = new THREE.Group();
            wheelAnchor.position.set(pos.x, pos.y, pos.z);

            const tire = new THREE.Mesh(wheelGeo, tireMat);
            tire.castShadow = true;
            // 轮毂装饰
            const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.46, 12), rimMat);
            rim.rotateZ(Math.PI / 2);
            tire.add(rim);

            wheelAnchor.add(tire);
            this.group.add(wheelAnchor);

            this.wheels.push(tire);
            if (pos.isFront) {
                this.frontWheels.push(wheelAnchor);
            }
        });

        this.group.add(carBodyGroup);
        this.carBodyGroup = carBodyGroup;
    }

    buildExhaustEffects() {
        // QQ飞车后置双大口径排气喷管 + 尾焰
        const exhaustGroup = new THREE.Group();
        exhaustGroup.position.set(0, 0.55, 2.5);

        const pipeMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 });
        const pipeGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.4, 16);
        pipeGeo.rotateX(Math.PI / 2);

        const lPipe = new THREE.Mesh(pipeGeo, pipeMat);
        lPipe.position.x = -0.55;
        const rPipe = new THREE.Mesh(pipeGeo, pipeMat);
        rPipe.position.x = 0.55;
        exhaustGroup.add(lPipe, rPipe);

        // 喷火圆锥粒子 (小喷火与大喷N2O火)
        const flameMatSmall = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending
        });

        const flameMatBig = new THREE.MeshBasicMaterial({
            color: 0x00bfff, // 经典冰蓝大喷
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending
        });

        [-0.55, 0.55].forEach(x => {
            // 小喷火焰
            const smallF = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.4, 8), flameMatSmall);
            smallF.rotation.x = -Math.PI / 2;
            smallF.position.set(x, 0, 0.8);
            exhaustGroup.add(smallF);
            this.flames.push(smallF);

            // 大喷冰蓝光束
            const bigF = new THREE.Mesh(new THREE.ConeGeometry(0.35, 3.2, 12), flameMatBig);
            bigF.rotation.x = -Math.PI / 2;
            bigF.position.set(x, 0, 1.8);
            exhaustGroup.add(bigF);
            this.boostFlames.push(bigF);
        });

        this.group.add(exhaustGroup);
    }

    buildSparks() {
        // 漂移摩擦火花系统
        const pCount = 60;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(pCount * 3);
        const velocities = [];

        for (let i = 0; i < pCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            velocities.push(new THREE.Vector3());
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xffe066,
            size: 0.35,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        this.sparkPoints = new THREE.Points(geo, mat);
        this.sparkPoints.frustumCulled = false;
        this.scene.add(this.sparkPoints);
        this.sparkVelocities = velocities;
    }

    update(speed, steerAngle, isDrifting, isSmallBoost, isN2OBoost) {
        // 1. 车轮转动
        this.wheels.forEach(w => {
            w.rotation.x += speed * 0.15;
        });

        // 2. 前轮转向角
        this.frontWheels.forEach(fw => {
            fw.rotation.y = steerAngle * 0.7;
        });

        // 3. 车身倾斜（漂移动态侧倾与转向离心力倾角）
        if (isDrifting) {
            this.carBodyGroup.rotation.z = THREE.MathUtils.lerp(this.carBodyGroup.rotation.z, -steerAngle * 0.15, 0.2);
            this.carBodyGroup.position.y = 0.05 * Math.sin(Date.now() * 0.02);
        } else {
            this.carBodyGroup.rotation.z = THREE.MathUtils.lerp(this.carBodyGroup.rotation.z, -steerAngle * 0.05, 0.1);
            this.carBodyGroup.position.y = 0;
        }

        // 4. 喷焰状态与颤动
        const sOpacity = isSmallBoost ? 0.9 + Math.random() * 0.2 : 0;
        this.flames.forEach(f => {
            f.material.opacity = sOpacity;
            f.scale.set(1 + (Math.random() - 0.5) * 0.2, 1 + (Math.random() - 0.5) * 0.3, 1);
        });

        const bOpacity = isN2OBoost ? 1.0 : 0;
        this.boostFlames.forEach(bf => {
            bf.material.opacity = bOpacity;
            bf.scale.set(1 + (Math.random() - 0.5) * 0.3, 1 + (Math.random() - 0.5) * 0.4, 1);
        });

        // 5. 漂移火花粒子更新
        const posAttr = this.sparkPoints.geometry.attributes.position;
        if (isDrifting && Math.abs(speed) > 5) {
            const carWorldPos = new THREE.Vector3();
            this.group.getWorldPosition(carWorldPos);

            for (let i = 0; i < this.sparkVelocities.length; i++) {
                if (Math.random() < 0.25) {
                    const side = Math.random() > 0.5 ? 1 : -1;
                    posAttr.setXYZ(i,
                        carWorldPos.x + side * 1.2,
                        carWorldPos.y + 0.1,
                        carWorldPos.z + 1.2
                    );
                    this.sparkVelocities[i].set(
                        (Math.random() - 0.5) * 4,
                        Math.random() * 3 + 1,
                        (Math.random() - 0.5) * 4
                    );
                } else {
                    const x = posAttr.getX(i) + this.sparkVelocities[i].x * 0.02;
                    const y = Math.max(0, posAttr.getY(i) + this.sparkVelocities[i].y * 0.02);
                    const z = posAttr.getZ(i) + this.sparkVelocities[i].z * 0.02;
                    posAttr.setXYZ(i, x, y, z);
                }
            }
            posAttr.needsUpdate = true;
            this.sparkPoints.material.opacity = 0.9;
        } else {
            this.sparkPoints.material.opacity = 0.0;
        }
    }
}

window.CarModel = CarModel;
