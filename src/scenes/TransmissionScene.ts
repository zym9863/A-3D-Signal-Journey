// 传输仿真场景
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { addNoise, applyAttenuation, NoiseParams } from '../utils/signalMath';

export enum MediumType {
  COAXIAL = 'coaxial',      // 同轴电缆
  TWISTED_PAIR = 'twisted_pair', // 双绞线
  OPTICAL_FIBER = 'optical_fiber', // 光纤
  WIRELESS = 'wireless'     // 无线传输
}

export interface TransmissionConfig {
  mediumType: MediumType;
  distance: number;         // 传输距离 (米)
  attenuation: number;      // 衰减系数 (dB/km)
  noiseLevel: number;       // 噪声水平
  distortion: number;       // 失真程度
  showEyeDiagram: boolean;  // 显示眼图
  animationSpeed: number;   // 动画速度
}

export interface SignalPacket {
  id: number;
  data: number[];           // 信号数据
  time: number[];          // 时间轴
  position: number;        // 当前位置 (0-1)
  amplitude: number;       // 当前幅度
  color: THREE.Color;      // 信号颜色
}

export class TransmissionScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  
  // 传输介质几何体
  private mediumGeometry?: THREE.Object3D;
  private mediumPath: THREE.Curve<THREE.Vector3>;
  
  // 信号包管理
  private signalPackets: Map<number, SignalPacket> = new Map();
  private packetIdCounter = 0;
  
  // 传输效果
  private transmitterMesh?: THREE.Mesh;
  private receiverMesh?: THREE.Mesh;
  private signalTrail?: THREE.Line;
  
  // 眼图相关
  private eyeDiagramCanvas?: HTMLCanvasElement;
  private eyeDiagramCtx?: CanvasRenderingContext2D;
  private eyeData: Array<{time: number[], amplitude: number[]}> = [];
  
  // 配置和状态
  private config: TransmissionConfig;
  private isTransmitting = false;
  private animationFrame?: number;
  
  // 性能监控
  private transmittedPackets = 0;
  private receivedPackets = 0;
  private errorPackets = 0;

  constructor(container: HTMLElement, config: TransmissionConfig) {
    this.config = config;
    
    // 初始化场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);
    
    // 初始化相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 10, 20);
    
    // 初始化渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    
    // 初始化控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    
    // 设置场景
    this.setupLighting();
    this.createTransmissionMedium();
    this.createTransceivers();
    this.setupEyeDiagram();
    
    // 开始渲染
    this.animate();
  }

  private setupLighting(): void {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);
    
    // 方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    // 点光源用于突出传输路径
    const pathLight = new THREE.PointLight(0x00ffff, 0.6, 30);
    pathLight.position.set(0, 2, 0);
    this.scene.add(pathLight);
  }

  private createTransmissionMedium(): void {
    // 清除现有的介质
    if (this.mediumGeometry) {
      this.scene.remove(this.mediumGeometry);
    }
    
    switch (this.config.mediumType) {
      case MediumType.COAXIAL:
        this.createCoaxialCable();
        break;
      case MediumType.TWISTED_PAIR:
        this.createTwistedPair();
        break;
      case MediumType.OPTICAL_FIBER:
        this.createOpticalFiber();
        break;
      case MediumType.WIRELESS:
        this.createWirelessMedium();
        break;
    }
  }

  private createCoaxialCable(): void {
    // 创建同轴电缆几何体
    const cableLength = this.config.distance * 0.1; // 缩放显示
    const cableRadius = 0.5;
    
    // 外导体
    const outerGeometry = new THREE.CylinderGeometry(cableRadius, cableRadius, cableLength, 16);
    const outerMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x666666,
      transparent: true,
      opacity: 0.8
    });
    const outerCable = new THREE.Mesh(outerGeometry, outerMaterial);
    outerCable.rotation.z = Math.PI / 2;
    outerCable.position.set(0, 2, 0);
    
    // 内导体
    const innerGeometry = new THREE.CylinderGeometry(0.1, 0.1, cableLength, 8);
    const innerMaterial = new THREE.MeshPhongMaterial({ color: 0xffaa00 });
    const innerCable = new THREE.Mesh(innerGeometry, innerMaterial);
    innerCable.rotation.z = Math.PI / 2;
    innerCable.position.set(0, 2, 0);
    
    // 组合
    const cableGroup = new THREE.Group();
    cableGroup.add(outerCable);
    cableGroup.add(innerCable);
    
    this.mediumGeometry = cableGroup;
    this.scene.add(this.mediumGeometry);
    
    // 创建传输路径
    this.mediumPath = new THREE.LineCurve3(
      new THREE.Vector3(-cableLength/2, 2, 0),
      new THREE.Vector3(cableLength/2, 2, 0)
    );
  }

  private createTwistedPair(): void {
    const cableLength = this.config.distance * 0.1;
    const twists = 10;
    
    // 创建双绞线路径
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x = (t - 0.5) * cableLength;
      const y = 2 + Math.sin(t * twists * Math.PI * 2) * 0.2;
      const z = Math.cos(t * twists * Math.PI * 2) * 0.2;
      points.push(new THREE.Vector3(x, y, z));
    }
    
    // 线1
    const curve1 = new THREE.CatmullRomCurve3(points);
    const tubeGeometry1 = new THREE.TubeGeometry(curve1, 100, 0.05, 8, false);
    const wireMaterial1 = new THREE.MeshPhongMaterial({ color: 0x00aa00 });
    const wire1 = new THREE.Mesh(tubeGeometry1, wireMaterial1);
    
    // 线2 (相位偏移)
    const points2: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x = (t - 0.5) * cableLength;
      const y = 2 - Math.sin(t * twists * Math.PI * 2) * 0.2;
      const z = -Math.cos(t * twists * Math.PI * 2) * 0.2;
      points2.push(new THREE.Vector3(x, y, z));
    }
    
    const curve2 = new THREE.CatmullRomCurve3(points2);
    const tubeGeometry2 = new THREE.TubeGeometry(curve2, 100, 0.05, 8, false);
    const wireMaterial2 = new THREE.MeshPhongMaterial({ color: 0xaa0000 });
    const wire2 = new THREE.Mesh(tubeGeometry2, wireMaterial2);
    
    const cableGroup = new THREE.Group();
    cableGroup.add(wire1);
    cableGroup.add(wire2);
    
    this.mediumGeometry = cableGroup;
    this.scene.add(this.mediumGeometry);
    
    this.mediumPath = curve1;
  }

  private createOpticalFiber(): void {
    const fiberLength = this.config.distance * 0.1;
    
    // 纤芯
    const coreGeometry = new THREE.CylinderGeometry(0.05, 0.05, fiberLength, 16);
    const coreMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x00ffff,
      emissive: 0x004444,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.rotation.z = Math.PI / 2;
    core.position.set(0, 2, 0);
    
    // 包层
    const claddingGeometry = new THREE.CylinderGeometry(0.15, 0.15, fiberLength, 16);
    const claddingMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x888888,
      transparent: true,
      opacity: 0.3
    });
    const cladding = new THREE.Mesh(claddingGeometry, claddingMaterial);
    cladding.rotation.z = Math.PI / 2;
    cladding.position.set(0, 2, 0);
    
    const fiberGroup = new THREE.Group();
    fiberGroup.add(cladding);
    fiberGroup.add(core);
    
    this.mediumGeometry = fiberGroup;
    this.scene.add(this.mediumGeometry);
    
    this.mediumPath = new THREE.LineCurve3(
      new THREE.Vector3(-fiberLength/2, 2, 0),
      new THREE.Vector3(fiberLength/2, 2, 0)
    );
  }

  private createWirelessMedium(): void {
    const transmissionRange = this.config.distance * 0.1;
    
    // 创建无线传输区域（半透明圆锥）
    const coneGeometry = new THREE.ConeGeometry(transmissionRange * 0.3, transmissionRange, 16);
    const coneMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8800ff,
      transparent: true,
      opacity: 0.2,
      wireframe: true
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.rotation.z = -Math.PI / 2;
    cone.position.set(0, 2, 0);
    
    this.mediumGeometry = cone;
    this.scene.add(this.mediumGeometry);
    
    this.mediumPath = new THREE.LineCurve3(
      new THREE.Vector3(-transmissionRange/2, 2, 0),
      new THREE.Vector3(transmissionRange/2, 2, 0)
    );
  }

  private createTransceivers(): void {
    const pathLength = this.config.distance * 0.1;
    
    // 发射器
    const transmitterGeometry = new THREE.BoxGeometry(1, 1, 1);
    const transmitterMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x00ff00,
      emissive: 0x002200
    });
    this.transmitterMesh = new THREE.Mesh(transmitterGeometry, transmitterMaterial);
    this.transmitterMesh.position.set(-pathLength/2 - 2, 2, 0);
    this.scene.add(this.transmitterMesh);
    
    // 接收器
    const receiverGeometry = new THREE.BoxGeometry(1, 1, 1);
    const receiverMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff0000,
      emissive: 0x220000
    });
    this.receiverMesh = new THREE.Mesh(receiverGeometry, receiverMaterial);
    this.receiverMesh.position.set(pathLength/2 + 2, 2, 0);
    this.scene.add(this.receiverMesh);
    
    // 添加标签
    this.addTransceiverLabels();
  }

  private addTransceiverLabels(): void {
    // 简化版标签，实际应用中可使用文字贴图
    const labelGeometry = new THREE.SphereGeometry(0.1);
    const labelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const txLabel = new THREE.Mesh(labelGeometry, labelMaterial);
    txLabel.position.copy(this.transmitterMesh!.position);
    txLabel.position.y += 1;
    this.scene.add(txLabel);
    
    const rxLabel = new THREE.Mesh(labelGeometry, labelMaterial);
    rxLabel.position.copy(this.receiverMesh!.position);
    rxLabel.position.y += 1;
    this.scene.add(rxLabel);
  }

  private setupEyeDiagram(): void {
    if (!this.config.showEyeDiagram) return;
    
    // 创建眼图画布 (如果需要在HTML中显示)
    // 这里只做数据准备，实际显示需要在HTML端处理
  }

  private animate(): void {
    this.animationFrame = requestAnimationFrame(() => this.animate());
    
    // 更新控制器
    this.controls.update();
    
    // 更新信号包动画
    if (this.isTransmitting) {
      this.updateSignalPackets();
      this.updateTransceiverAnimations();
    }
    
    // 渲染场景
    this.renderer.render(this.scene, this.camera);
  }

  private updateSignalPackets(): void {
    const deltaTime = 0.016; // 约60fps
    
    this.signalPackets.forEach((packet, id) => {
      // 更新包位置
      packet.position += this.config.animationSpeed * deltaTime * 0.2;
      
      if (packet.position >= 1.0) {
        // 到达接收端
        this.onPacketReceived(packet);
        this.signalPackets.delete(id);
      } else {
        // 更新包的3D位置
        this.updatePacketVisualization(packet);
      }
    });
  }

  private updatePacketVisualization(packet: SignalPacket): void {
    // 根据路径更新信号包的可视化
    const position = this.mediumPath.getPoint(packet.position);
    
    // 应用传输效果
    const attenuatedAmplitude = this.applyTransmissionEffects(packet, packet.position);
    packet.amplitude = attenuatedAmplitude;
    
    // 更新颜色表示信号强度
    const intensity = Math.max(0.1, attenuatedAmplitude);
    packet.color.setHSL(0.3, 1.0, intensity);
    
    // 创建信号波形可视化
    this.createPacketMesh(packet, position);
  }

  private createPacketMesh(packet: SignalPacket, position: THREE.Vector3): void {
    // 创建简单的信号脉冲可视化
    const pulseGeometry = new THREE.SphereGeometry(0.2 * packet.amplitude, 8, 8);
    const pulseMaterial = new THREE.MeshBasicMaterial({ 
      color: packet.color,
      transparent: true,
      opacity: 0.8
    });
    
    const pulseMesh = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulseMesh.position.copy(position);
    pulseMesh.userData = { packetId: packet.id, isSignalPulse: true };
    
    // 移除旧的脉冲
    const oldPulse = this.scene.getObjectByName(`pulse_${packet.id}`);
    if (oldPulse) {
      this.scene.remove(oldPulse);
    }
    
    pulseMesh.name = `pulse_${packet.id}`;
    this.scene.add(pulseMesh);
    
    // 添加粒子尾迹效果
    this.createParticleTrail(position, packet.color);
  }

  private createParticleTrail(position: THREE.Vector3, color: THREE.Color): void {
    const particleCount = 5;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x - Math.random() * 2;
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5);
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5);
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    this.scene.add(particleSystem);
    
    // 3秒后移除粒子
    setTimeout(() => {
      this.scene.remove(particleSystem);
    }, 3000);
  }

  private applyTransmissionEffects(packet: SignalPacket, position: number): number {
    let amplitude = 1.0;
    
    // 衰减效果
    const distance = position * this.config.distance;
    const attenuationLoss = this.config.attenuation * distance / 1000; // dB/km转换
    amplitude *= Math.pow(10, -attenuationLoss / 20);
    
    // 噪声效果
    const noise = (Math.random() - 0.5) * this.config.noiseLevel * 0.1;
    amplitude += noise;
    
    // 失真效果（频率相关的幅度变化）
    const distortionFactor = 1 + Math.sin(position * Math.PI * 4) * this.config.distortion * 0.1;
    amplitude *= distortionFactor;
    
    return Math.max(0.01, amplitude); // 确保不为负值
  }

  private updateTransceiverAnimations(): void {
    const time = Date.now() * 0.001;
    
    // 发射器发光效果
    if (this.transmitterMesh) {
      const intensity = 0.5 + Math.sin(time * 10) * 0.5;
      (this.transmitterMesh.material as THREE.MeshPhongMaterial).emissive.setScalar(intensity * 0.2);
    }
    
    // 接收器根据接收到的信号强度发光
    if (this.receiverMesh) {
      const avgAmplitude = this.getAverageReceivedAmplitude();
      (this.receiverMesh.material as THREE.MeshPhongMaterial).emissive.setScalar(avgAmplitude * 0.3);
    }
  }

  private getAverageReceivedAmplitude(): number {
    if (this.signalPackets.size === 0) return 0;
    
    let totalAmplitude = 0;
    this.signalPackets.forEach(packet => {
      totalAmplitude += packet.amplitude;
    });
    
    return totalAmplitude / this.signalPackets.size;
  }

  private onPacketReceived(packet: SignalPacket): void {
    this.receivedPackets++;
    
    // 检查误码
    if (packet.amplitude < 0.1) {
      this.errorPackets++;
    }
    
    // 更新眼图数据
    if (this.config.showEyeDiagram) {
      this.updateEyeDiagram(packet);
    }
    
    // 移除可视化
    const pulseMesh = this.scene.getObjectByName(`pulse_${packet.id}`);
    if (pulseMesh) {
      this.scene.remove(pulseMesh);
    }
  }

  private updateEyeDiagram(packet: SignalPacket): void {
    this.eyeData.push({
      time: packet.time,
      amplitude: packet.data
    });
    
    // 限制数据量
    if (this.eyeData.length > 50) {
      this.eyeData.shift();
    }
  }

  // 公共方法
  public transmitSignal(data: number[], timeAxis: number[]): void {
    const packet: SignalPacket = {
      id: this.packetIdCounter++,
      data: [...data],
      time: [...timeAxis],
      position: 0,
      amplitude: 1.0,
      color: new THREE.Color(0x00ff88)
    };
    
    this.signalPackets.set(packet.id, packet);
    this.transmittedPackets++;
  }

  public startTransmission(): void {
    this.isTransmitting = true;
  }

  public stopTransmission(): void {
    this.isTransmitting = false;
    
    // 清除所有信号包
    this.signalPackets.forEach((_, id) => {
      const pulseMesh = this.scene.getObjectByName(`pulse_${id}`);
      if (pulseMesh) {
        this.scene.remove(pulseMesh);
      }
    });
    this.signalPackets.clear();
  }

  public updateConfig(newConfig: Partial<TransmissionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 重新创建传输介质
    this.createTransmissionMedium();
    
    // 重新设置眼图
    if (newConfig.showEyeDiagram !== undefined) {
      this.setupEyeDiagram();
    }
  }

  public getTransmissionStats(): {
    transmitted: number,
    received: number,
    errors: number,
    ber: number,
    snr: number
  } {
    const ber = this.receivedPackets > 0 ? this.errorPackets / this.receivedPackets : 0;
    const snr = this.calculateSNR();
    
    return {
      transmitted: this.transmittedPackets,
      received: this.receivedPackets,
      errors: this.errorPackets,
      ber,
      snr
    };
  }

  private calculateSNR(): number {
    // 简化的SNR计算
    const signalPower = 1.0; // 假设单位信号功率
    const noisePower = Math.pow(this.config.noiseLevel, 2);
    return 10 * Math.log10(signalPower / Math.max(0.001, noisePower));
  }

  public resetStats(): void {
    this.transmittedPackets = 0;
    this.receivedPackets = 0;
    this.errorPackets = 0;
    this.eyeData = [];
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.controls.dispose();
    this.renderer.dispose();
    
    // 清理几何体和材质
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}