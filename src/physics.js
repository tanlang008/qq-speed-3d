// QQ飞车核心物理引擎与经典操作技巧：
// 1. 经典键位：↑ 加速, ↓ 刹车/倒车, ← / → 转向, Shift 漂移, Ctrl 氮气(N2O)
// 2. 核心手感：起步小喷、经典漂移(Shift+转向)、双喷(Double Boost)、CWW喷(漂移后大喷+两次小喷极限爆发)、CW喷、点漂集气

class PhysicsController {
    constructor(carModel, trackInfo) {
        this.carModel = carModel;
        this.trackInfo = trackInfo;

        // 车辆运动学状态
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.heading = 0; // 朝向角 (弧度, 0 为 -Z 方向)
        this.currentSpeed = 0; // 标量速度 (km/h)

        // 物理常数配置
        this.MAX_NORMAL_SPEED = 210;  // 基础平跑极速 (km/h)
        this.ACCELERATION = 75;       // 平跑加速度
        this.BRAKE_FORCE = 120;       // 刹车阻力
        this.NATURAL_DECEL = 25;      // 自然滑行衰减
        this.STEER_SENSITIVITY = 1.8; // 转向灵敏度

        // 漂移与集气物理
        this.isDrifting = false;
        this.driftAngle = 0;          // 漂移横摆角
        this.driftDirection = 0;      // -1 左, 1 右
        this.nitroGauge = 0;          // 氮气蓄气槽 [0, 100]
        this.nitroCount = 1;          // 初始赠送1个大喷
        this.MAX_NITRO = 2;

        // 小喷与喷气系统 (双喷、CWW)
        this.canSmallBoost1 = false;
        this.canSmallBoost2 = false;
        this.smallBoostTimer1 = 0;
        this.smallBoostTimer2 = 0;
        this.isSmallBoosting = false;
        this.smallBoostRemaining = 0;

        // 大喷系统 (N2O)
        this.isN2OBoosting = false;
        this.n2oRemaining = 0;

        // 漂移判定计时器
        this.driftStartTime = 0;
        this.driftDuration = 0;

        // 输入控制状态
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            shift: false,
            ctrl: false
        };

        this.initInput();
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            if (window.soundManager) window.soundManager.init();

            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.up = true;
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = true;
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = true;
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = true;
                    e.preventDefault();
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.keys.shift = true;
                    e.preventDefault();
                    break;
                case 'ControlLeft':
                case 'ControlRight':
                case 'Space':
                    this.keys.ctrl = true;
                    this.triggerN2O();
                    e.preventDefault();
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.up = false;
                    // 起步/小喷触发检测
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = false;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.keys.shift = false;
                    this.endDrift();
                    break;
                case 'ControlLeft':
                case 'ControlRight':
                case 'Space':
                    this.keys.ctrl = false;
                    break;
            }
        });
    }

    triggerN2O() {
        if (this.nitroCount > 0 && !this.isN2OBoosting) {
            this.nitroCount--;
            this.isN2OBoosting = true;
            this.n2oRemaining = 3.0; // 持续3秒大喷
            if (window.soundManager) window.soundManager.playN2O();
            this.showTechniqueTip('🚀 大喷 (N2O BOOST)');
        }
    }

    triggerSmallBoost() {
        if (this.canSmallBoost1) {
            this.canSmallBoost1 = false;
            this.isSmallBoosting = true;
            this.smallBoostRemaining = 0.8;
            if (window.soundManager) window.soundManager.playBoost();

            // 双喷检测 (Double Boost)
            if (this.canSmallBoost2) {
                this.showTechniqueTip(this.isN2OBoosting ? '🔥 CWW 极限喷射!' : '⚡ 经典双喷 (Double Boost)');
            } else {
                this.showTechniqueTip('✨ 小喷加速');
            }
        } else if (this.canSmallBoost2) {
            this.canSmallBoost2 = false;
            this.isSmallBoosting = true;
            this.smallBoostRemaining = 0.8;
            if (window.soundManager) window.soundManager.playBoost();
            this.showTechniqueTip('⚡ 第二段小喷!');
        }
    }

    endDrift() {
        if (this.isDrifting) {
            this.isDrifting = false;
            if (window.soundManager) window.soundManager.setDrift(false);

            // 漂移达到一定时长可获得小喷资格（经典双喷窗口）
            if (this.driftDuration > 0.3) {
                this.canSmallBoost1 = true;
                this.smallBoostTimer1 = 1.4; // 1.4秒内有效

                // 优秀漂移奖励双喷
                if (this.driftDuration > 0.6) {
                    this.canSmallBoost2 = true;
                    this.smallBoostTimer2 = 1.8;
                }
            }
            this.driftDuration = 0;
        }
    }

    showTechniqueTip(text) {
        const el = document.getElementById('skill-alert');
        if (el) {
            el.innerText = text;
            el.style.opacity = '1';
            el.style.transform = 'scale(1.15)';
            clearTimeout(this.skillTimer);
            this.skillTimer = setTimeout(() => {
                el.style.opacity = '0';
                el.style.transform = 'scale(1.0)';
            }, 1200);
        }
    }

    update(dt) {
        // 限制最大单帧步长防止顿卡穿模
        dt = Math.min(dt, 0.05);

        // 1. 喷射状态递减更新
        let maxTargetSpeed = this.MAX_NORMAL_SPEED;
        let accelPower = this.ACCELERATION;

        if (this.isN2OBoosting) {
            this.n2oRemaining -= dt;
            maxTargetSpeed = 295; // 大喷突破至 295 km/h
            accelPower = 180;
            if (this.n2oRemaining <= 0) {
                this.isN2OBoosting = false;
            }
        }

        if (this.isSmallBoosting) {
            this.smallBoostRemaining -= dt;
            maxTargetSpeed = Math.max(maxTargetSpeed, 260); // 小喷叠加最高 260 km/h
            accelPower = Math.max(accelPower, 160);
            if (this.smallBoostRemaining <= 0) {
                this.isSmallBoosting = false;
            }
        }

        // 小喷可触发窗口倒计时
        if (this.canSmallBoost1) {
            this.smallBoostTimer1 -= dt;
            if (this.smallBoostTimer1 <= 0) this.canSmallBoost1 = false;
        }
        if (this.canSmallBoost2) {
            this.smallBoostTimer2 -= dt;
            if (this.smallBoostTimer2 <= 0) this.canSmallBoost2 = false;
        }

        // 2. 加速与刹车动力学
        if (this.keys.up) {
            // 如果处于小喷窗口，按下向上键即刻触发小喷！
            if (this.canSmallBoost1 || this.canSmallBoost2) {
                this.triggerSmallBoost();
            }

            if (this.currentSpeed < maxTargetSpeed) {
                this.currentSpeed += accelPower * dt;
            } else {
                this.currentSpeed -= this.NATURAL_DECEL * dt * 0.5;
            }
        } else if (this.keys.down) {
            if (this.currentSpeed > 0) {
                this.currentSpeed -= this.BRAKE_FORCE * dt;
            } else if (this.currentSpeed > -40) {
                this.currentSpeed -= 40 * dt; // 倒车
            }
        } else {
            // 自然阻力衰减
            if (this.currentSpeed > 0) {
                this.currentSpeed = Math.max(0, this.currentSpeed - this.NATURAL_DECEL * dt);
            } else if (this.currentSpeed < 0) {
                this.currentSpeed = Math.min(0, this.currentSpeed + this.NATURAL_DECEL * dt);
            }
        }

        // 3. 漂移判定与转向计算
        let steerInput = 0;
        if (this.keys.left) steerInput -= 1;
        if (this.keys.right) steerInput += 1;

        // 触发漂移：按住 Shift + 转向 + 具备一定初速
        if (this.keys.shift && Math.abs(steerInput) > 0 && this.currentSpeed > 40) {
            if (!this.isDrifting) {
                this.isDrifting = true;
                this.driftDirection = steerInput;
                this.driftStartTime = performance.now();
                if (window.soundManager) window.soundManager.setDrift(true, 1.0);
            }
            this.driftDuration += dt;

            // 漂移过弯：提供更强的转向力，同时车速略微损失（QQ飞车站位失速）
            this.heading -= steerInput * this.STEER_SENSITIVITY * 1.6 * dt;
            this.driftAngle = THREE.MathUtils.lerp(this.driftAngle, steerInput * 0.55, 0.15);
            this.currentSpeed = Math.max(70, this.currentSpeed - 20 * dt);

            // 经典集气系统：漂移越持久/角度越大，集气槽充能越快
            const chargeRate = 35 * (this.currentSpeed / this.MAX_NORMAL_SPEED);
            this.nitroGauge += chargeRate * dt;
            if (this.nitroGauge >= 100) {
                if (this.nitroCount < this.MAX_NITRO) {
                    this.nitroCount++;
                    this.nitroGauge -= 100;
                    this.showTechniqueTip('⭐ 获得 1 罐氮气!');
                } else {
                    this.nitroGauge = 100;
                }
            }
        } else {
            // 普通转向
            if (this.isDrifting) {
                this.endDrift();
            }
            this.driftAngle = THREE.MathUtils.lerp(this.driftAngle, 0, 0.2);

            if (Math.abs(this.currentSpeed) > 1) {
                const turnFactor = Math.sign(this.currentSpeed) * (steerInput * this.STEER_SENSITIVITY);
                this.heading -= turnFactor * dt;
            }
        }

        // 4. 计算位移与速度向量
        const moveAngle = this.heading + this.driftAngle * 0.4;
        const forwardVector = new THREE.Vector3(
            Math.sin(moveAngle),
            0,
            -Math.cos(moveAngle)
        );

        // 转换速度单位 (km/h -> 内部世界单位/s)
        const speedUnits = (this.currentSpeed / 3.6) * 1.2;
        this.velocity.copy(forwardVector).multiplyScalar(speedUnits);
        this.position.addScaledVector(this.velocity, dt);

        // 5. 更新车体 Mesh
        this.carModel.group.position.copy(this.position);
        this.carModel.group.rotation.y = this.heading - this.driftAngle * 0.7;

        this.carModel.update(
            this.currentSpeed,
            steerInput,
            this.isDrifting,
            this.isSmallBoosting,
            this.isN2OBoosting
        );

        // 声音驱动
        if (window.soundManager) {
            window.soundManager.updateEngine(Math.abs(this.currentSpeed), this.MAX_NORMAL_SPEED, this.isN2OBoosting || this.isSmallBoosting);
        }
    }
}

window.PhysicsController = PhysicsController;
