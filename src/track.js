// 赛道与经典场景生成（QQ飞车风格：十一城/秋名山经典弯道融合）
// 包含宽阔直道、90度直角弯、发卡大U弯、起伏高架桥、草坪/护栏/指示牌/终点拱门

class TrackBuilder {
    constructor(scene) {
        this.scene = scene;
        this.trackPoints = [];
        this.trackWidth = 22; // 赛道宽度
        this.checkpoints = [];
        this.curve = null;
    }

    buildTrack() {
        // 定义具有 QQ 飞车经典特色的赛道控制点（包含直道、起伏桥、双发卡弯、连续S弯）
        const rawPoints = [
            // 起跑大直道
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -150),
            new THREE.Vector3(0, 0, -300),
            // 第一个右缓弯接急弯 (大右弯)
            new THREE.Vector3(30, 0, -420),
            new THREE.Vector3(120, 0, -480),
            new THREE.Vector3(220, 0, -450),
            // 爬坡高架桥段
            new THREE.Vector3(280, 15, -350),
            new THREE.Vector3(300, 25, -200),
            new THREE.Vector3(300, 20, -80),
            // 下坡经典左U弯 (发卡弯 1 - 考验经典漂移)
            new THREE.Vector3(260, 5, 20),
            new THREE.Vector3(180, 0, 50),
            new THREE.Vector3(120, 0, -20),
            // 中段高速直道与连续S弯
            new THREE.Vector3(100, 0, -120),
            new THREE.Vector3(50, 0, -180),
            new THREE.Vector3(-40, 0, -180),
            // 经典大U弯 (发卡弯 2)
            new THREE.Vector3(-140, 0, -120),
            new THREE.Vector3(-180, 0, 0),
            new THREE.Vector3(-140, 0, 120),
            // 归程长坡与弯道连接终点
            new THREE.Vector3(-60, 0, 180),
            new THREE.Vector3(0, 0, 120)
        ];

        this.curve = new THREE.CatmullRomCurve3(rawPoints, true, 'centripetal', 0.5);
        const segments = 400;
        this.trackPoints = this.curve.getSpacedPoints(segments);

        // 生成路面网格与护栏
        this.createRoadGeometry(segments);
        // 生成起终点拱门
        this.createStartGate();
        // 生成路标、加速带指示牌、两旁路灯与风景
        this.createScenery();
        // 生成地面与环境网格
        this.createEnvironment();

        return {
            curve: this.curve,
            points: this.trackPoints,
            width: this.trackWidth
        };
    }

    createRoadGeometry(segments) {
        const roadGeo = new THREE.BufferGeometry();
        const positions = [];
        const normals = [];
        const uvs = [];
        const indices = [];

        // 护栏网格
        const leftBarrierPos = [];
        const rightBarrierPos = [];
        const barrierIndices = [];

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const pt = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t).normalize();
            // 计算垂直向外的法向向量 (水平路面)
            const up = new THREE.Vector3(0, 1, 0);
            const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

            const halfW = this.trackWidth / 2;

            const leftPt = new THREE.Vector3().copy(pt).addScaledVector(normal, -halfW);
            const rightPt = new THREE.Vector3().copy(pt).addScaledVector(normal, halfW);

            // 存入路面顶点
            positions.push(leftPt.x, leftPt.y, leftPt.z);
            positions.push(rightPt.x, rightPt.y, rightPt.z);

            normals.push(0, 1, 0, 0, 1, 0);
            uvs.push(0, i * 0.2, 1, i * 0.2);

            // 生成护栏红白相间沿线
            const barrierH = 2.0;
            const leftTop = new THREE.Vector3().copy(leftPt).add(new THREE.Vector3(0, barrierH, 0));
            const rightTop = new THREE.Vector3().copy(rightPt).add(new THREE.Vector3(0, barrierH, 0));

            const bIdx = i * 4;
            leftBarrierPos.push(leftPt.x, leftPt.y, leftPt.z);
            leftBarrierPos.push(leftTop.x, leftTop.y, leftTop.z);
            rightBarrierPos.push(rightPt.x, rightPt.y, rightPt.z);
            rightBarrierPos.push(rightTop.x, rightTop.y, rightTop.z);

            if (i < segments) {
                const base = i * 2;
                indices.push(base, base + 1, base + 2);
                indices.push(base + 1, base + 3, base + 2);

                const bBase = i * 2;
                barrierIndices.push(bBase, bBase + 1, bBase + 2);
                barrierIndices.push(bBase + 1, bBase + 3, bBase + 2);
            }
        }

        roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        roadGeo.setIndex(indices);
        roadGeo.computeVertexNormals();

        // 柏油沥青路面材质 (Canvas动态绘制纹理：双黄线+两侧白线)
        const roadCanvas = document.createElement('canvas');
        roadCanvas.width = 512;
        roadCanvas.height = 512;
        const ctx = roadCanvas.getContext('2d');
        ctx.fillStyle = '#22252a';
        ctx.fillRect(0, 0, 512, 512);

        // 噪点质感
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        for (let j = 0; j < 5000; j++) {
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
        }

        // 两侧白线
        ctx.fillStyle = '#e8ecf2';
        ctx.fillRect(20, 0, 16, 512);
        ctx.fillRect(476, 0, 16, 512);

        // 中间黄色虚线 / 双黄线
        ctx.fillStyle = '#f5c518';
        ctx.fillRect(250, 0, 12, 512);

        const roadTex = new THREE.CanvasTexture(roadCanvas);
        roadTex.wrapS = THREE.RepeatWrapping;
        roadTex.wrapT = THREE.RepeatWrapping;
        roadTex.repeat.set(1, 40);

        const roadMat = new THREE.MeshStandardMaterial({
            map: roadTex,
            roughness: 0.8,
            metalness: 0.1
        });

        const roadMesh = new THREE.Mesh(roadGeo, roadMat);
        roadMesh.receiveShadow = true;
        this.scene.add(roadMesh);

        // 护栏材质 (红白条纹)
        const barrierCanvas = document.createElement('canvas');
        barrierCanvas.width = 128;
        barrierCanvas.height = 128;
        const bCtx = barrierCanvas.getContext('2d');
        bCtx.fillStyle = '#e74c3c';
        bCtx.fillRect(0, 0, 128, 128);
        bCtx.fillStyle = '#ffffff';
        bCtx.fillRect(0, 0, 64, 128);

        const barrierTex = new THREE.CanvasTexture(barrierCanvas);
        barrierTex.wrapS = THREE.RepeatWrapping;
        barrierTex.wrapT = THREE.RepeatWrapping;
        barrierTex.repeat.set(100, 1);

        const barrierMat = new THREE.MeshStandardMaterial({
            map: barrierTex,
            roughness: 0.4,
            side: THREE.DoubleSide
        });

        const lBarrierGeo = new THREE.BufferGeometry();
        lBarrierGeo.setAttribute('position', new THREE.Float32BufferAttribute(leftBarrierPos, 3));
        lBarrierGeo.setIndex(barrierIndices);
        lBarrierGeo.computeVertexNormals();
        const lBarrier = new THREE.Mesh(lBarrierGeo, barrierMat);
        this.scene.add(lBarrier);

        const rBarrierGeo = new THREE.BufferGeometry();
        rBarrierGeo.setAttribute('position', new THREE.Float32BufferAttribute(rightBarrierPos, 3));
        rBarrierGeo.setIndex(barrierIndices);
        rBarrierGeo.computeVertexNormals();
        const rBarrier = new THREE.Mesh(rBarrierGeo, barrierMat);
        this.scene.add(rBarrier);
    }

    createStartGate() {
        // QQ飞车经典拱门 (START / FINISH)
        const gateGroup = new THREE.Group();
        gateGroup.position.set(0, 0, -10);

        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e3799, metalness: 0.6, roughness: 0.3 });
        const beamMat = new THREE.MeshStandardMaterial({ color: 0xeb2f06, metalness: 0.4, roughness: 0.2 });

        // 左右两根立柱
        const pillarGeo = new THREE.CylinderGeometry(1.2, 1.5, 14, 16);
        const pLeft = new THREE.Mesh(pillarGeo, pillarMat);
        pLeft.position.set(-13, 7, 0);
        const pRight = new THREE.Mesh(pillarGeo, pillarMat);
        pRight.position.set(13, 7, 0);
        gateGroup.add(pLeft, pRight);

        // 顶梁
        const beamGeo = new THREE.BoxGeometry(28, 3.5, 2.5);
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(0, 13, 0);
        gateGroup.add(beam);

        // 拱门大标牌看板 (START/QQ SPEED)
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 512;
        signCanvas.height = 128;
        const sCtx = signCanvas.getContext('2d');
        sCtx.fillStyle = '#0a3d62';
        sCtx.fillRect(0, 0, 512, 128);
        sCtx.fillStyle = '#f6b93b';
        sCtx.font = 'bold 44px sans-serif';
        sCtx.textAlign = 'center';
        sCtx.textBaseline = 'middle';
        sCtx.fillText('QQ SPEED ★ 十一城', 256, 64);
        sCtx.strokeStyle = '#fff';
        sCtx.lineWidth = 4;
        sCtx.strokeRect(10, 10, 492, 108);

        const signTex = new THREE.CanvasTexture(signCanvas);
        const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
        const signGeo = new THREE.PlaneGeometry(22, 5.5);
        const signMesh = new THREE.Mesh(signGeo, signMat);
        signMesh.position.set(0, 13, 1.3);
        gateGroup.add(signMesh);

        // 起跑黑白格子线
        const gridCanvas = document.createElement('canvas');
        gridCanvas.width = 256;
        gridCanvas.height = 64;
        const gCtx = gridCanvas.getContext('2d');
        const size = 16;
        for (let x = 0; x < 256; x += size) {
            for (let y = 0; y < 64; y += size) {
                gCtx.fillStyle = (x / size + y / size) % 2 === 0 ? '#ffffff' : '#111111';
                gCtx.fillRect(x, y, size, size);
            }
        }
        const gridTex = new THREE.CanvasTexture(gridCanvas);
        const gridMat = new THREE.MeshBasicMaterial({ map: gridTex });
        const gridGeo = new THREE.PlaneGeometry(this.trackWidth, 6);
        const gridMesh = new THREE.Mesh(gridGeo, gridMat);
        gridMesh.rotation.x = -Math.PI / 2;
        gridMesh.position.set(0, 0.05, 0);
        gateGroup.add(gridMesh);

        this.scene.add(gateGroup);
    }

    createScenery() {
        // 在弯道外侧布置霓虹广告牌、轮胎墙、指示牌、棕榈树
        const signMaterials = [
            0x00d2d3, 0xff9f43, 0xee5253, 0x10ac84
        ];

        for (let i = 20; i < this.trackPoints.length; i += 25) {
            const pt = this.trackPoints[i];
            const tangent = this.curve.getTangentAt(i / this.trackPoints.length);
            const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

            // 广告牌/弯道箭头指示灯
            const signGroup = new THREE.Group();
            const poleGeo = new THREE.CylinderGeometry(0.3, 0.3, 8);
            const poleMat = new THREE.MeshStandardMaterial({ color: 0x576574 });
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.y = 4;
            signGroup.add(pole);

            const boardGeo = new THREE.BoxGeometry(6, 3, 0.4);
            const boardMat = new THREE.MeshStandardMaterial({
                color: signMaterials[i % signMaterials.length],
                emissive: signMaterials[i % signMaterials.length],
                emissiveIntensity: 0.3
            });
            const board = new THREE.Mesh(boardGeo, boardMat);
            board.position.y = 6.5;
            signGroup.add(board);

            // 摆在路沿外侧
            const dist = (this.trackWidth / 2) + 4;
            const signPos = new THREE.Vector3().copy(pt).addScaledVector(normal, i % 2 === 0 ? dist : -dist);
            signGroup.position.copy(signPos);
            signGroup.lookAt(pt);
            this.scene.add(signGroup);
        }

        // 沿途城市高楼剪影与现代建筑
        const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
        const buildingMat = new THREE.MeshStandardMaterial({
            color: 0x2c3e50,
            roughness: 0.7,
            metalness: 0.2
        });

        for (let b = 0; b < 40; b++) {
            const mesh = new THREE.Mesh(buildingGeo, buildingMat);
            const angle = (b / 40) * Math.PI * 2;
            const radius = 260 + Math.random() * 100;
            const h = 40 + Math.random() * 80;
            const w = 20 + Math.random() * 30;
            const d = 20 + Math.random() * 30;

            mesh.scale.set(w, h, d);
            mesh.position.set(
                Math.cos(angle) * radius + 50,
                h / 2 - 10,
                Math.sin(angle) * radius - 100
            );
            this.scene.add(mesh);
        }
    }

    createEnvironment() {
        // 绿地草坪大底盘
        const groundGeo = new THREE.PlaneGeometry(1200, 1200);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x1b4332,
            roughness: 0.9,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
}

window.TrackBuilder = TrackBuilder;
