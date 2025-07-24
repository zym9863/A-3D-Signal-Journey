import './style.css';
import { EncodingScene, EncodingSceneConfig } from './scenes/EncodingScene';
import { TransmissionScene, TransmissionConfig, MediumType } from './scenes/TransmissionScene';
import { SignalGenerator, SignalGeneratorConfig } from './components/SignalGenerator';
import { ModulationSystem, ModulationSystemConfig } from './components/ModulationSystem';
import { TransmissionMedium, TransmissionMediumConfig } from './components/TransmissionMedium';
import { EncodingType, ModulationType } from './utils/waveforms';

class SignalJourneyApp {
  private currentMode: 'encoding' | 'transmission' = 'encoding';
  
  // 场景实例
  private encodingScene?: EncodingScene;
  private transmissionScene?: TransmissionScene;
  
  // 组件实例
  private signalGenerator?: SignalGenerator;
  private modulationSystem?: ModulationSystem;
  private transmissionMedium?: TransmissionMedium;
  
  // 容器元素
  private app: HTMLElement;
  private sceneContainer?: HTMLElement;
  private controlPanel?: HTMLElement;

  constructor() {
    this.app = document.querySelector<HTMLDivElement>('#app')!;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // 移除加载画面
    this.app.innerHTML = '';
    
    // 创建主界面
    this.createMainInterface();
    
    // 初始化默认模式
    await this.switchMode('encoding');
  }

  private createMainInterface(): void {
    this.app.innerHTML = `
      <div class="signal-journey-app">
        <header class="app-header">
          <h1>物理层探秘：3D信号之旅</h1>
          <p class="app-subtitle">交互式数字通信原理可视化教学工具</p>
          
          <nav class="mode-selector">
            <button id="encodingModeBtn" class="mode-btn active">
              <span class="mode-icon">📊</span>
              <span class="mode-label">编码调制可视化</span>
            </button>
            <button id="transmissionModeBtn" class="mode-btn">
              <span class="mode-icon">📡</span>
              <span class="mode-label">传输仿真</span>
            </button>
          </nav>
        </header>

        <main class="app-main">
          <div class="scene-container" id="sceneContainer">
            <!-- 3D场景将在这里渲染 -->
          </div>
          
          <aside class="control-panel" id="controlPanel">
            <!-- 控制面板内容将根据模式动态加载 -->
          </aside>
        </main>

        <footer class="app-footer">
          <div class="footer-info">
            <span>物理层通信原理教学演示系统</span>
            <span>基于 Three.js 构建</span>
          </div>
          <div class="footer-controls">
            <button id="fullscreenBtn" class="footer-btn">全屏</button>
            <button id="helpBtn" class="footer-btn">帮助</button>
            <button id="resetBtn" class="footer-btn">重置</button>
          </div>
        </footer>
      </div>

      <!-- 帮助弹窗 -->
      <div id="helpModal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h2>使用帮助</h2>
            <button class="modal-close" id="closeHelpModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="help-section">
              <h3>编码调制可视化模式</h3>
              <ul>
                <li>输入比特流，选择编码和调制方式</li>
                <li>观察信号波形的实时3D展示</li>
                <li>理解不同编码方案的特点</li>
                <li>对比各种调制技术的效果</li>
              </ul>
            </div>
            <div class="help-section">
              <h3>传输仿真模式</h3>
              <ul>
                <li>选择不同的传输介质类型</li>
                <li>调节衰减、噪声、失真参数</li>
                <li>观察信号在传输过程中的变化</li>
                <li>分析传输质量和误码率</li>
              </ul>
            </div>
            <div class="help-section">
              <h3>操作技巧</h3>
              <ul>
                <li>鼠标左键拖拽：旋转视角</li>
                <li>鼠标滚轮：缩放场景</li>
                <li>鼠标右键拖拽：平移视角</li>
                <li>双击：重置相机位置</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;

    // 获取容器引用
    this.sceneContainer = this.app.querySelector('#sceneContainer')!;
    this.controlPanel = this.app.querySelector('#controlPanel')!;

    // 绑定事件
    this.bindMainEvents();
  }

  private bindMainEvents(): void {
    // 模式切换
    const encodingModeBtn = this.app.querySelector('#encodingModeBtn')!;
    const transmissionModeBtn = this.app.querySelector('#transmissionModeBtn')!;

    encodingModeBtn.addEventListener('click', () => {
      this.switchMode('encoding');
      encodingModeBtn.classList.add('active');
      transmissionModeBtn.classList.remove('active');
    });

    transmissionModeBtn.addEventListener('click', () => {
      this.switchMode('transmission');
      transmissionModeBtn.classList.add('active');
      encodingModeBtn.classList.remove('active');
    });

    // 功能按钮
    const fullscreenBtn = this.app.querySelector('#fullscreenBtn')!;
    const helpBtn = this.app.querySelector('#helpBtn')!;
    const resetBtn = this.app.querySelector('#resetBtn')!;

    fullscreenBtn.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    helpBtn.addEventListener('click', () => {
      this.showHelpModal();
    });

    resetBtn.addEventListener('click', () => {
      this.resetCurrentMode();
    });

    // 帮助弹窗
    const helpModal = this.app.querySelector('#helpModal') as HTMLElement;
    const closeHelpModal = this.app.querySelector('#closeHelpModal')!;

    closeHelpModal.addEventListener('click', () => {
      helpModal.style.display = 'none';
    });

    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) {
        helpModal.style.display = 'none';
      }
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'F11':
          e.preventDefault();
          this.toggleFullscreen();
          break;
        case 'h':
        case 'H':
          if (e.ctrlKey) {
            e.preventDefault();
            this.showHelpModal();
          }
          break;
        case 'r':
        case 'R':
          if (e.ctrlKey) {
            e.preventDefault();
            this.resetCurrentMode();
          }
          break;
        case '1':
          this.switchMode('encoding');
          break;
        case '2':
          this.switchMode('transmission');
          break;
      }
    });

    // 窗口大小变化
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  private async switchMode(mode: 'encoding' | 'transmission'): Promise<void> {
    if (this.currentMode === mode) return;

    // 清理当前模式
    this.cleanup();

    this.currentMode = mode;

    if (mode === 'encoding') {
      await this.initializeEncodingMode();
    } else {
      await this.initializeTransmissionMode();
    }
  }

  private async initializeEncodingMode(): Promise<void> {
    // 创建编码模式的控制面板
    this.controlPanel!.innerHTML = `
      <div class="encoding-controls">
        <div id="signalGeneratorContainer" class="control-section">
          <h3>信号生成器</h3>
        </div>
        
        <div id="modulationSystemContainer" class="control-section">
          <h3>调制系统</h3>
        </div>
        
        <div class="scene-controls">
          <h3>显示控制</h3>
          <div class="control-group">
            <button id="resetCameraBtn" class="btn btn-secondary">重置视角</button>
            <button id="toggleAnimationBtn" class="btn btn-primary">开始动画</button>
          </div>
        </div>
      </div>
    `;

    // 初始化信号生成器
    const signalGeneratorContainer = this.controlPanel!.querySelector('#signalGeneratorContainer')!;
    const generatorConfig: SignalGeneratorConfig = {
      bitString: '10110100',
      encodingType: EncodingType.NRZ,
      modulationType: ModulationType.ASK,
      bitDuration: 1.0,
      sampleRate: 1000,
      carrierFreq: 10,
      animationSpeed: 1.0,
      showGrid: true
    };

    this.signalGenerator = new SignalGenerator(
      signalGeneratorContainer as HTMLElement,
      generatorConfig,
      {
        onConfigChange: (config) => this.onSignalConfigChange(config),
        onPlay: () => this.onPlaySignal(),
        onPause: () => this.onPauseSignal(),
        onReset: () => this.onResetSignal(),
        onGenerateRandom: () => this.onGenerateRandomSignal()
      }
    );

    // 初始化调制系统
    const modulationSystemContainer = this.controlPanel!.querySelector('#modulationSystemContainer')!;
    const modulationConfig: ModulationSystemConfig = {
      modulationType: ModulationType.ASK,
      carrierFreq: 10,
      amplitude: 1.0,
      phase: 0,
      askAmplitude0: 0.2,
      askAmplitude1: 1.0,
      fskFreq0: 8,
      fskFreq1: 12,
      pskPhase0: 0,
      pskPhase1: Math.PI,
      qamConstellation: [
        { I: -1, Q: -1 },
        { I: -1, Q: 1 },
        { I: 1, Q: -1 },
        { I: 1, Q: 1 }
      ]
    };

    this.modulationSystem = new ModulationSystem(
      modulationSystemContainer as HTMLElement,
      modulationConfig,
      {
        onConfigChange: (config) => this.onModulationConfigChange(config),
        onModulationTypeChange: (type) => this.onModulationTypeChange(type),
        onParameterChange: (param, value) => this.onModulationParameterChange(param, value)
      }
    );

    // 初始化编码场景
    const sceneConfig: EncodingSceneConfig = {
      bits: this.signalGenerator.getBitArray(),
      encodingType: generatorConfig.encodingType,
      modulationType: generatorConfig.modulationType,
      bitDuration: generatorConfig.bitDuration,
      sampleRate: generatorConfig.sampleRate,
      carrierFreq: generatorConfig.carrierFreq,
      showGrid: generatorConfig.showGrid,
      animationSpeed: generatorConfig.animationSpeed
    };

    this.encodingScene = new EncodingScene(this.sceneContainer!, sceneConfig);

    // 绑定场景控制事件
    this.bindEncodingSceneEvents();
  }

  private async initializeTransmissionMode(): Promise<void> {
    // 创建传输模式的控制面板
    this.controlPanel!.innerHTML = `
      <div class="transmission-controls">
        <div id="transmissionMediumContainer" class="control-section">
        </div>
        
        <div class="transmission-actions">
          <h3>传输控制</h3>
          <div class="control-group">
            <button id="startTransmissionBtn" class="btn btn-primary">开始传输</button>
            <button id="stopTransmissionBtn" class="btn btn-secondary" disabled>停止传输</button>
            <button id="sendSignalBtn" class="btn btn-info">发送信号</button>
          </div>
        </div>
        
        <div class="transmission-stats">
          <h3>传输统计</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">已发送:</span>
              <span id="transmittedCount" class="stat-value">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">已接收:</span>
              <span id="receivedCount" class="stat-value">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">误码数:</span>
              <span id="errorCount" class="stat-value">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">误码率:</span>
              <span id="berValue" class="stat-value">0</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // 初始化传输介质配置
    const transmissionMediumContainer = this.controlPanel!.querySelector('#transmissionMediumContainer')!;
    const mediumConfig: TransmissionMediumConfig = {
      mediumType: MediumType.COAXIAL,
      distance: 100,
      attenuation: 20,
      noiseLevel: 0.1,
      distortion: 0.1,
      bandwidth: 1000000,
      showEyeDiagram: false,
      showSpectrum: false,
      realTimeAnalysis: false
    };

    this.transmissionMedium = new TransmissionMedium(
      transmissionMediumContainer as HTMLElement,
      mediumConfig,
      {
        onConfigChange: (config) => this.onTransmissionConfigChange(config),
        onMediumTypeChange: (type) => this.onMediumTypeChange(type),
        onParameterChange: (param, value) => this.onTransmissionParameterChange(param, value),
        onAnalysisToggle: (type, enabled) => this.onAnalysisToggle(type, enabled)
      }
    );

    // 初始化传输场景
    const transmissionConfig: TransmissionConfig = {
      mediumType: mediumConfig.mediumType,
      distance: mediumConfig.distance,
      attenuation: mediumConfig.attenuation,
      noiseLevel: mediumConfig.noiseLevel,
      distortion: mediumConfig.distortion,
      showEyeDiagram: mediumConfig.showEyeDiagram,
      animationSpeed: 1.0
    };

    this.transmissionScene = new TransmissionScene(this.sceneContainer!, transmissionConfig);

    // 绑定传输场景事件
    this.bindTransmissionSceneEvents();
  }

  private bindEncodingSceneEvents(): void {
    const resetCameraBtn = this.controlPanel!.querySelector('#resetCameraBtn')!;
    const toggleAnimationBtn = this.controlPanel!.querySelector('#toggleAnimationBtn')!;

    resetCameraBtn.addEventListener('click', () => {
      this.encodingScene?.resetCamera();
    });

    toggleAnimationBtn.addEventListener('click', () => {
      this.encodingScene?.toggleAnimation();
      const isAnimating = toggleAnimationBtn.textContent === '停止动画';
      toggleAnimationBtn.textContent = isAnimating ? '开始动画' : '停止动画';
    });
  }

  private bindTransmissionSceneEvents(): void {
    const startTransmissionBtn = this.controlPanel!.querySelector('#startTransmissionBtn')!;
    const stopTransmissionBtn = this.controlPanel!.querySelector('#stopTransmissionBtn')!;
    const sendSignalBtn = this.controlPanel!.querySelector('#sendSignalBtn')!;

    startTransmissionBtn.addEventListener('click', () => {
      this.transmissionScene?.startTransmission();
      startTransmissionBtn.setAttribute('disabled', 'true');
      stopTransmissionBtn.removeAttribute('disabled');
    });

    stopTransmissionBtn.addEventListener('click', () => {
      this.transmissionScene?.stopTransmission();
      startTransmissionBtn.removeAttribute('disabled');
      stopTransmissionBtn.setAttribute('disabled', 'true');
    });

    sendSignalBtn.addEventListener('click', () => {
      // 发送测试信号
      const testData = [1, 0, 1, 1, 0, 1, 0, 0];
      const timeAxis = testData.map((_, i) => i * 0.1);
      this.transmissionScene?.transmitSignal(testData, timeAxis);
      this.updateTransmissionStats();
    });

    // 定期更新统计信息
    setInterval(() => {
      if (this.currentMode === 'transmission') {
        this.updateTransmissionStats();
      }
    }, 1000);
  }

  private updateTransmissionStats(): void {
    if (!this.transmissionScene) return;

    const stats = this.transmissionScene.getTransmissionStats();
    
    const transmittedCount = this.controlPanel!.querySelector('#transmittedCount');
    const receivedCount = this.controlPanel!.querySelector('#receivedCount');
    const errorCount = this.controlPanel!.querySelector('#errorCount');
    const berValue = this.controlPanel!.querySelector('#berValue');

    if (transmittedCount) transmittedCount.textContent = stats.transmitted.toString();
    if (receivedCount) receivedCount.textContent = stats.received.toString();
    if (errorCount) errorCount.textContent = stats.errors.toString();
    if (berValue) berValue.textContent = stats.ber.toExponential(2);
  }

  // 事件处理函数
  private onSignalConfigChange(config: SignalGeneratorConfig): void {
    if (this.encodingScene) {
      this.encodingScene.updateConfig({
        bits: this.signalGenerator!.getBitArray(),
        encodingType: config.encodingType,
        modulationType: config.modulationType,
        bitDuration: config.bitDuration,
        sampleRate: config.sampleRate,
        carrierFreq: config.carrierFreq,
        showGrid: config.showGrid,
        animationSpeed: config.animationSpeed
      });
    }
  }

  private onPlaySignal(): void {
    this.encodingScene?.startAnimation();
  }

  private onPauseSignal(): void {
    this.encodingScene?.stopAnimation();
  }

  private onResetSignal(): void {
    this.encodingScene?.stopAnimation();
    this.encodingScene?.resetCamera();
  }

  private onGenerateRandomSignal(): void {
    // 信号生成器会自动更新，这里不需要额外处理
  }

  private onModulationConfigChange(config: ModulationSystemConfig): void {
    // 同步更新信号生成器的调制类型
    if (this.signalGenerator) {
      this.signalGenerator.updateConfig({
        modulationType: config.modulationType,
        carrierFreq: config.carrierFreq
      });
    }
  }

  private onModulationTypeChange(type: ModulationType): void {
    // 更新信号生成器的调制类型
    if (this.signalGenerator) {
      this.signalGenerator.updateConfig({ modulationType: type });
    }
  }

  private onModulationParameterChange(param: string, value: number): void {
    // 处理调制参数变化
    console.log(`调制参数 ${param} 变为 ${value}`);
  }

  private onTransmissionConfigChange(config: TransmissionMediumConfig): void {
    if (this.transmissionScene) {
      this.transmissionScene.updateConfig({
        mediumType: config.mediumType,
        distance: config.distance,
        attenuation: config.attenuation,
        noiseLevel: config.noiseLevel,
        distortion: config.distortion,
        showEyeDiagram: config.showEyeDiagram
      });
    }
  }

  private onMediumTypeChange(type: MediumType): void {
    console.log(`传输介质变更为: ${type}`);
  }

  private onTransmissionParameterChange(param: string, value: number): void {
    console.log(`传输参数 ${param} 变为 ${value}`);
  }

  private onAnalysisToggle(type: 'eye' | 'spectrum' | 'realtime', enabled: boolean): void {
    console.log(`${type} 分析 ${enabled ? '开启' : '关闭'}`);
  }

  // 工具函数
  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  private showHelpModal(): void {
    const helpModal = this.app.querySelector('#helpModal') as HTMLElement;
    helpModal.style.display = 'flex';
  }

  private resetCurrentMode(): void {
    if (this.currentMode === 'encoding') {
      this.encodingScene?.resetCamera();
      this.encodingScene?.stopAnimation();
    } else {
      this.transmissionScene?.stopTransmission();
      this.transmissionScene?.resetStats();
      this.updateTransmissionStats();
    }
  }

  private handleResize(): void {
    const rect = this.sceneContainer!.getBoundingClientRect();
    
    if (this.encodingScene) {
      this.encodingScene.resize(rect.width, rect.height);
    }
    
    if (this.transmissionScene) {
      this.transmissionScene.resize(rect.width, rect.height);
    }
  }

  private cleanup(): void {
    // 清理当前场景和组件
    if (this.encodingScene) {
      this.encodingScene.dispose();
      this.encodingScene = undefined;
    }
    
    if (this.transmissionScene) {
      this.transmissionScene.dispose();
      this.transmissionScene = undefined;
    }

    // 清空容器
    if (this.sceneContainer) {
      this.sceneContainer.innerHTML = '';
    }
    
    if (this.controlPanel) {
      this.controlPanel.innerHTML = '';
    }
  }
}

// 启动应用
new SignalJourneyApp();
