// 编码可视化场景
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EncodingType, ModulationType, DigitalEncoder, Modulator, WaveformProcessor } from '../utils/waveforms';

export interface EncodingSceneConfig {
  bits: number[];
  encodingType: EncodingType;
  modulationType: ModulationType;
  bitDuration: number;
  sampleRate: number;
  carrierFreq: number;
  showGrid: boolean;
  animationSpeed: number;
}

export class EncodingScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  
  // 信号相关
  private originalSignalLine?: THREE.Line;
  private modulatedSignalLine?: THREE.Line;
  private animationGroup: THREE.Group;
  
  // 配置
  private config: EncodingSceneConfig;
  
  // 动画相关
  private isAnimating: boolean = false;
  private animationFrame?: number;

  constructor(container: HTMLElement, config: EncodingSceneConfig) {
    this.config = config;
    
    // 初始化场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    
    // 初始化相机
    this.camera = new THREE.PerspectiveCamera(
      75, 
      container.clientWidth / container.clientHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(10, 5, 10);
    
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
    
    // 初始化动画组
    this.animationGroup = new THREE.Group();
    this.scene.add(this.animationGroup);
    
    // 设置场景
    this.setupLighting();
    this.setupGrid();
    this.setupAxes();
    this.generateSignals();
    
    // 开始渲染循环
    this.animate();
  }

  private setupLighting(): void {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    // 方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    // 点光源
    const pointLight = new THREE.PointLight(0x00ff88, 0.5, 50);
    pointLight.position.set(0, 5, 0);
    this.scene.add(pointLight);
  }

  private setupGrid(): void {
    if (!this.config.showGrid) return;
    
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    this.scene.add(gridHelper);
  }

  private setupAxes(): void {
    // 坐标轴辅助器
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);
    
    // 添加轴标签
    this.addAxisLabels();
  }

  private addAxisLabels(): void {
    // 使用简单的几何体作为轴标签
    const labelGeometry = new THREE.SphereGeometry(0.1);
    const labelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // X轴标签 (时间)
    const timeLabel = new THREE.Mesh(labelGeometry, labelMaterial);
    timeLabel.position.set(5.5, 0, 0);
    this.scene.add(timeLabel);

    // Y轴标签 (幅度)
    const amplitudeLabel = new THREE.Mesh(labelGeometry, labelMaterial);
    amplitudeLabel.position.set(0, 3.5, 0);
    this.scene.add(amplitudeLabel);
  }

  private generateSignals(): void {
    // 清除之前的信号线
    if (this.originalSignalLine) {
      this.scene.remove(this.originalSignalLine);
    }
    if (this.modulatedSignalLine) {
      this.scene.remove(this.modulatedSignalLine);
    }
    
    // 生成原始编码信号
    this.generateOriginalSignal();
    
    // 生成调制信号
    this.generateModulatedSignal();
  }

  private generateOriginalSignal(): void {
    let signalData: { time: number[], amplitude: number[] };
    
    // 根据编码类型生成信号
    switch (this.config.encodingType) {
      case EncodingType.NRZ:
        signalData = DigitalEncoder.encodeNRZ(
          this.config.bits, 
          this.config.bitDuration, 
          this.config.sampleRate
        );
        break;
      case EncodingType.Manchester:
        signalData = DigitalEncoder.encodeManchester(
          this.config.bits, 
          this.config.bitDuration, 
          this.config.sampleRate
        );
        break;
      case EncodingType.DifferentialManchester:
        signalData = DigitalEncoder.encodeDifferentialManchester(
          this.config.bits, 
          this.config.bitDuration, 
          this.config.sampleRate
        );
        break;
    }
    
    // 降采样以提高性能
    const downsampledData = WaveformProcessor.downsample(signalData.time, signalData.amplitude, 1000);
    
    // 转换为Three.js点
    const points = WaveformProcessor.toThreeJSPoints(
      downsampledData.time, 
      downsampledData.amplitude,
      { x: 2, y: 2 }
    );
    
    // 创建几何体
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(points.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    
    // 创建材质
    const material = new THREE.LineBasicMaterial({ 
      color: 0x00ff88,
      linewidth: 3
    });
    
    // 创建线条
    this.originalSignalLine = new THREE.Line(geometry, material);
    this.originalSignalLine.position.z = 1; // 稍微向前偏移
    this.scene.add(this.originalSignalLine);
  }

  private generateModulatedSignal(): void {
    let signalData: { time: number[], amplitude: number[] };
    
    // 根据调制类型生成信号
    switch (this.config.modulationType) {
      case ModulationType.ASK:
        signalData = Modulator.modulateASK(
          this.config.bits,
          this.config.carrierFreq,
          this.config.bitDuration,
          this.config.sampleRate
        );
        break;
      case ModulationType.FSK:
        const freq0 = this.config.carrierFreq * 0.8;
        const freq1 = this.config.carrierFreq * 1.2;
        signalData = Modulator.modulateFSK(
          this.config.bits,
          freq0,
          freq1,
          this.config.bitDuration,
          this.config.sampleRate
        );
        break;
      case ModulationType.PSK:
        signalData = Modulator.modulatePSK(
          this.config.bits,
          this.config.carrierFreq,
          this.config.bitDuration,
          this.config.sampleRate
        );
        break;
      case ModulationType.QAM:
        signalData = Modulator.modulateQAM(
          this.config.bits,
          this.config.carrierFreq,
          this.config.bitDuration,
          this.config.sampleRate
        );
        break;
    }
    
    // 降采样以提高性能
    const downsampledData = WaveformProcessor.downsample(signalData.time, signalData.amplitude, 1000);
    
    // 转换为Three.js点
    const points = WaveformProcessor.toThreeJSPoints(
      downsampledData.time, 
      downsampledData.amplitude,
      { x: 2, y: 1 }
    );
    
    // 创建几何体
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(points.map(p => new THREE.Vector3(p[0], p[1] - 4, p[2])));
    
    // 创建材质
    const material = new THREE.LineBasicMaterial({ 
      color: 0xff6b6b,
      linewidth: 3
    });
    
    // 创建线条
    this.modulatedSignalLine = new THREE.Line(geometry, material);
    this.scene.add(this.modulatedSignalLine);
  }

  private animate(): void {
    this.animationFrame = requestAnimationFrame(() => this.animate());
    
    // 更新控制器
    this.controls.update();
    
    // 如果正在播放动画
    if (this.isAnimating) {
      this.updateAnimation();
    }
    
    // 渲染场景
    this.renderer.render(this.scene, this.camera);
  }

  private updateAnimation(): void {
    // 简单的波形动画效果
    const time = Date.now() * 0.001 * this.config.animationSpeed;
    
    if (this.originalSignalLine) {
      this.originalSignalLine.rotation.z = Math.sin(time) * 0.1;
    }
    
    if (this.modulatedSignalLine) {
      this.modulatedSignalLine.rotation.z = Math.sin(time + Math.PI) * 0.1;
    }
  }

  // 公共方法
  public updateConfig(newConfig: Partial<EncodingSceneConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.generateSignals();
  }

  public startAnimation(): void {
    this.isAnimating = true;
  }

  public stopAnimation(): void {
    this.isAnimating = false;
  }

  public toggleAnimation(): void {
    this.isAnimating = !this.isAnimating;
  }

  public resetCamera(): void {
    this.camera.position.set(10, 5, 10);
    this.camera.lookAt(0, 0, 0);
    this.controls.reset();
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