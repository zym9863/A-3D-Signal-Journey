// 调制系统组件
import { ModulationType } from '../utils/waveforms';
import { NoiseParams } from '../utils/signalMath';

export interface ModulationSystemConfig {
  modulationType: ModulationType;
  carrierFreq: number;
  amplitude: number;
  phase: number;
  // ASK特定参数
  askAmplitude0: number; // 0比特对应的幅度
  askAmplitude1: number; // 1比特对应的幅度
  // FSK特定参数
  fskFreq0: number; // 0比特对应的频率
  fskFreq1: number; // 1比特对应的频率
  // PSK特定参数
  pskPhase0: number; // 0比特对应的相位
  pskPhase1: number; // 1比特对应的相位
  // QAM特定参数
  qamConstellation: Array<{I: number, Q: number}>; // 星座图点
}

export interface ModulationSystemCallbacks {
  onConfigChange: (config: ModulationSystemConfig) => void;
  onModulationTypeChange: (type: ModulationType) => void;
  onParameterChange: (parameter: string, value: number) => void;
}

export class ModulationSystem {
  private container: HTMLElement;
  private config: ModulationSystemConfig;
  private callbacks: ModulationSystemCallbacks;
  
  // UI元素
  private modulationTypeSelect: HTMLSelectElement;
  private carrierFreqSlider: HTMLInputElement;
  private amplitudeSlider: HTMLInputElement;
  private phaseSlider: HTMLInputElement;
  
  // 特定调制参数面板
  private askPanel: HTMLElement;
  private fskPanel: HTMLElement;
  private pskPanel: HTMLElement;
  private qamPanel: HTMLElement;
  
  // ASK参数
  private askAmplitude0Slider: HTMLInputElement;
  private askAmplitude1Slider: HTMLInputElement;
  
  // FSK参数
  private fskFreq0Slider: HTMLInputElement;
  private fskFreq1Slider: HTMLInputElement;
  
  // PSK参数
  private pskPhase0Slider: HTMLInputElement;
  private pskPhase1Slider: HTMLInputElement;
  
  // QAM星座图画布
  private qamCanvas: HTMLCanvasElement;
  private qamCtx: CanvasRenderingContext2D;

  constructor(container: HTMLElement, config: ModulationSystemConfig, callbacks: ModulationSystemCallbacks) {
    this.container = container;
    this.config = config;
    this.callbacks = callbacks;
    
    this.createUI();
    this.bindEvents();
    this.updateUI();
  }

  private createUI(): void {
    this.container.innerHTML = `
      <div class="modulation-system">
        <h3>调制系统参数</h3>
        
        <div class="control-group">
          <label for="modulationTypeSelect">调制类型:</label>
          <select id="modulationTypeSelect" class="select-input">
            <option value="ASK">ASK - 幅移键控</option>
            <option value="FSK">FSK - 频移键控</option>
            <option value="PSK">PSK - 相移键控</option>
            <option value="QAM">QAM - 正交幅度调制</option>
          </select>
        </div>

        <div class="control-group">
          <label for="carrierFreqSlider">载波频率: <span id="carrierFreqValue">10</span>Hz</label>
          <input type="range" id="carrierFreqSlider" class="slider" min="5" max="100" step="1" value="10" />
        </div>

        <div class="control-group">
          <label for="amplitudeSlider">载波幅度: <span id="amplitudeValue">1.0</span></label>
          <input type="range" id="amplitudeSlider" class="slider" min="0.1" max="2.0" step="0.1" value="1.0" />
        </div>

        <div class="control-group">
          <label for="phaseSlider">载波相位: <span id="phaseValue">0</span>°</label>
          <input type="range" id="phaseSlider" class="slider" min="0" max="360" step="1" value="0" />
        </div>

        <!-- ASK参数面板 -->
        <div id="askPanel" class="parameter-panel">
          <h4>ASK参数设置</h4>
          <div class="control-group">
            <label for="askAmplitude0Slider">0比特幅度: <span id="askAmplitude0Value">0.2</span></label>
            <input type="range" id="askAmplitude0Slider" class="slider" min="0" max="1" step="0.1" value="0.2" />
          </div>
          <div class="control-group">
            <label for="askAmplitude1Slider">1比特幅度: <span id="askAmplitude1Value">1.0</span></label>
            <input type="range" id="askAmplitude1Slider" class="slider" min="0.1" max="2" step="0.1" value="1.0" />
          </div>
          <div class="info-text">
            <p>ASK调制通过改变载波的幅度来表示不同的比特值</p>
          </div>
        </div>

        <!-- FSK参数面板 -->
        <div id="fskPanel" class="parameter-panel" style="display: none;">
          <h4>FSK参数设置</h4>
          <div class="control-group">
            <label for="fskFreq0Slider">0比特频率: <span id="fskFreq0Value">8</span>Hz</label>
            <input type="range" id="fskFreq0Slider" class="slider" min="5" max="50" step="1" value="8" />
          </div>
          <div class="control-group">
            <label for="fskFreq1Slider">1比特频率: <span id="fskFreq1Value">12</span>Hz</label>
            <input type="range" id="fskFreq1Slider" class="slider" min="5" max="50" step="1" value="12" />
          </div>
          <div class="info-text">
            <p>FSK调制通过改变载波的频率来表示不同的比特值</p>
          </div>
        </div>

        <!-- PSK参数面板 -->
        <div id="pskPanel" class="parameter-panel" style="display: none;">
          <h4>PSK参数设置</h4>
          <div class="control-group">
            <label for="pskPhase0Slider">0比特相位: <span id="pskPhase0Value">0</span>°</label>
            <input type="range" id="pskPhase0Slider" class="slider" min="0" max="360" step="1" value="0" />
          </div>
          <div class="control-group">
            <label for="pskPhase1Slider">1比特相位: <span id="pskPhase1Value">180</span>°</label>
            <input type="range" id="pskPhase1Slider" class="slider" min="0" max="360" step="1" value="180" />
          </div>
          <div class="info-text">
            <p>PSK调制通过改变载波的相位来表示不同的比特值</p>
          </div>
        </div>

        <!-- QAM参数面板 -->
        <div id="qamPanel" class="parameter-panel" style="display: none;">
          <h4>QAM参数设置</h4>
          <div class="qam-constellation">
            <label>星座图:</label>
            <canvas id="qamCanvas" width="200" height="200"></canvas>
          </div>
          <div class="qam-controls">
            <button id="qamReset" class="btn btn-secondary">重置星座图</button>
            <button id="qamOptimize" class="btn btn-primary">优化星座图</button>
          </div>
          <div class="info-text">
            <p>QAM调制同时调制幅度和相位，支持更高的数据传输率</p>
          </div>
        </div>

        <div class="modulation-info">
          <h4>调制特性分析</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">频谱效率:</span>
              <span id="spectralEfficiency">1.0 bit/s/Hz</span>
            </div>
            <div class="info-item">
              <span class="info-label">功率效率:</span>
              <span id="powerEfficiency">0 dB</span>
            </div>
            <div class="info-item">
              <span class="info-label">最小欧氏距离:</span>
              <span id="minimumDistance">2.0</span>
            </div>
            <div class="info-item">
              <span class="info-label">符号错误率:</span>
              <span id="symbolErrorRate">0.001</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // 获取UI元素引用
    this.modulationTypeSelect = this.container.querySelector('#modulationTypeSelect') as HTMLSelectElement;
    this.carrierFreqSlider = this.container.querySelector('#carrierFreqSlider') as HTMLInputElement;
    this.amplitudeSlider = this.container.querySelector('#amplitudeSlider') as HTMLInputElement;
    this.phaseSlider = this.container.querySelector('#phaseSlider') as HTMLInputElement;
    
    // 参数面板
    this.askPanel = this.container.querySelector('#askPanel') as HTMLElement;
    this.fskPanel = this.container.querySelector('#fskPanel') as HTMLElement;
    this.pskPanel = this.container.querySelector('#pskPanel') as HTMLElement;
    this.qamPanel = this.container.querySelector('#qamPanel') as HTMLElement;
    
    // ASK参数
    this.askAmplitude0Slider = this.container.querySelector('#askAmplitude0Slider') as HTMLInputElement;
    this.askAmplitude1Slider = this.container.querySelector('#askAmplitude1Slider') as HTMLInputElement;
    
    // FSK参数
    this.fskFreq0Slider = this.container.querySelector('#fskFreq0Slider') as HTMLInputElement;
    this.fskFreq1Slider = this.container.querySelector('#fskFreq1Slider') as HTMLInputElement;
    
    // PSK参数
    this.pskPhase0Slider = this.container.querySelector('#pskPhase0Slider') as HTMLInputElement;
    this.pskPhase1Slider = this.container.querySelector('#pskPhase1Slider') as HTMLInputElement;
    
    // QAM画布
    this.qamCanvas = this.container.querySelector('#qamCanvas') as HTMLCanvasElement;
    this.qamCtx = this.qamCanvas.getContext('2d')!;
  }

  private bindEvents(): void {
    // 调制类型选择
    this.modulationTypeSelect.addEventListener('change', () => {
      this.config.modulationType = this.modulationTypeSelect.value as ModulationType;
      this.updateParameterPanels();
      this.updateModulationInfo();
      this.callbacks.onModulationTypeChange(this.config.modulationType);
      this.callbacks.onConfigChange(this.config);
    });

    // 通用参数滑块
    this.carrierFreqSlider.addEventListener('input', () => {
      const value = parseInt(this.carrierFreqSlider.value);
      this.config.carrierFreq = value;
      this.updateSliderValue('carrierFreqValue', value, 'Hz');
      this.callbacks.onParameterChange('carrierFreq', value);
      this.callbacks.onConfigChange(this.config);
    });

    this.amplitudeSlider.addEventListener('input', () => {
      const value = parseFloat(this.amplitudeSlider.value);
      this.config.amplitude = value;
      this.updateSliderValue('amplitudeValue', value, '');
      this.callbacks.onParameterChange('amplitude', value);
      this.callbacks.onConfigChange(this.config);
    });

    this.phaseSlider.addEventListener('input', () => {
      const value = parseInt(this.phaseSlider.value);
      this.config.phase = value * Math.PI / 180; // 转换为弧度
      this.updateSliderValue('phaseValue', value, '°');
      this.callbacks.onParameterChange('phase', this.config.phase);
      this.callbacks.onConfigChange(this.config);
    });

    // ASK参数
    this.askAmplitude0Slider.addEventListener('input', () => {
      const value = parseFloat(this.askAmplitude0Slider.value);
      this.config.askAmplitude0 = value;
      this.updateSliderValue('askAmplitude0Value', value, '');
      this.updateModulationInfo();
      this.callbacks.onConfigChange(this.config);
    });

    this.askAmplitude1Slider.addEventListener('input', () => {
      const value = parseFloat(this.askAmplitude1Slider.value);
      this.config.askAmplitude1 = value;
      this.updateSliderValue('askAmplitude1Value', value, '');
      this.updateModulationInfo();
      this.callbacks.onConfigChange(this.config);
    });

    // FSK参数
    this.fskFreq0Slider.addEventListener('input', () => {
      const value = parseInt(this.fskFreq0Slider.value);
      this.config.fskFreq0 = value;
      this.updateSliderValue('fskFreq0Value', value, 'Hz');
      this.updateModulationInfo();
      this.callbacks.onConfigChange(this.config);
    });

    this.fskFreq1Slider.addEventListener('input', () => {
      const value = parseInt(this.fskFreq1Slider.value);
      this.config.fskFreq1 = value;
      this.updateSliderValue('fskFreq1Value', value, 'Hz');
      this.updateModulationInfo();
      this.callbacks.onConfigChange(this.config);
    });

    // PSK参数
    this.pskPhase0Slider.addEventListener('input', () => {
      const value = parseInt(this.pskPhase0Slider.value);
      this.config.pskPhase0 = value * Math.PI / 180;
      this.updateSliderValue('pskPhase0Value', value, '°');
      this.updateModulationInfo();
      this.callbacks.onConfigChange(this.config);
    });

    this.pskPhase1Slider.addEventListener('input', () => {
      const value = parseInt(this.pskPhase1Slider.value);
      this.config.pskPhase1 = value * Math.PI / 180;
      this.updateSliderValue('pskPhase1Value', value, '°');
      this.updateModulationInfo();
      this.callbacks.onConfigChange(this.config);
    });

    // QAM控制按钮
    const qamResetBtn = this.container.querySelector('#qamReset');
    const qamOptimizeBtn = this.container.querySelector('#qamOptimize');

    qamResetBtn?.addEventListener('click', () => {
      this.resetQAMConstellation();
    });

    qamOptimizeBtn?.addEventListener('click', () => {
      this.optimizeQAMConstellation();
    });

    // QAM画布点击事件（用于拖拽星座点）
    this.qamCanvas.addEventListener('mousedown', (e) => {
      this.handleQAMCanvasClick(e);
    });
  }

  private updateSliderValue(elementId: string, value: number, unit: string): void {
    const element = this.container.querySelector(`#${elementId}`);
    if (element) {
      element.textContent = value.toString() + unit;
    }
  }

  private updateParameterPanels(): void {
    // 隐藏所有面板
    this.askPanel.style.display = 'none';
    this.fskPanel.style.display = 'none';
    this.pskPanel.style.display = 'none';
    this.qamPanel.style.display = 'none';

    // 显示对应的面板
    switch (this.config.modulationType) {
      case ModulationType.ASK:
        this.askPanel.style.display = 'block';
        break;
      case ModulationType.FSK:
        this.fskPanel.style.display = 'block';
        break;
      case ModulationType.PSK:
        this.pskPanel.style.display = 'block';
        break;
      case ModulationType.QAM:
        this.qamPanel.style.display = 'block';
        this.drawQAMConstellation();
        break;
    }
  }

  private drawQAMConstellation(): void {
    const ctx = this.qamCtx;
    const width = this.qamCanvas.width;
    const height = this.qamCanvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 80;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制坐标轴
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // 绘制网格
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let i = -2; i <= 2; i++) {
      if (i !== 0) {
        ctx.beginPath();
        ctx.moveTo(centerX + i * scale / 2, 0);
        ctx.lineTo(centerX + i * scale / 2, height);
        ctx.moveTo(0, centerY + i * scale / 2);
        ctx.lineTo(width, centerY + i * scale / 2);
        ctx.stroke();
      }
    }

    // 绘制星座点
    ctx.fillStyle = '#ff6b6b';
    this.config.qamConstellation.forEach((point, index) => {
      const x = centerX + point.I * scale;
      const y = centerY - point.Q * scale; // Y轴翻转

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();

      // 标注比特值
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.fillText(index.toString(2).padStart(2, '0'), x + 8, y - 8);
      ctx.fillStyle = '#ff6b6b';
    });

    // 添加轴标签
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText('I', width - 20, centerY - 10);
    ctx.fillText('Q', centerX + 10, 20);
  }

  private resetQAMConstellation(): void {
    // 重置为标准4-QAM星座图
    this.config.qamConstellation = [
      { I: -1, Q: -1 }, // 00
      { I: -1, Q: 1 },  // 01
      { I: 1, Q: -1 },  // 10
      { I: 1, Q: 1 }    // 11
    ];
    this.drawQAMConstellation();
    this.updateModulationInfo();
    this.callbacks.onConfigChange(this.config);
  }

  private optimizeQAMConstellation(): void {
    // 简单的星座图优化：最大化最小欧氏距离
    const optimized = [
      { I: -1, Q: -1 },
      { I: -1, Q: 1 },
      { I: 1, Q: -1 },
      { I: 1, Q: 1 }
    ];
    
    this.config.qamConstellation = optimized;
    this.drawQAMConstellation();
    this.updateModulationInfo();
    this.callbacks.onConfigChange(this.config);
  }

  private handleQAMCanvasClick(event: MouseEvent): void {
    const rect = this.qamCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = this.qamCanvas.width / 2;
    const centerY = this.qamCanvas.height / 2;
    const scale = 80;

    // 转换为I-Q坐标
    const I = (x - centerX) / scale;
    const Q = -(y - centerY) / scale; // Y轴翻转

    // 找到最近的星座点
    let minDistance = Infinity;
    let closestIndex = 0;

    this.config.qamConstellation.forEach((point, index) => {
      const distance = Math.sqrt((point.I - I) ** 2 + (point.Q - Q) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    // 如果点击距离足够近，更新该星座点
    if (minDistance < 0.5) {
      this.config.qamConstellation[closestIndex] = { I: Math.round(I * 2) / 2, Q: Math.round(Q * 2) / 2 };
      this.drawQAMConstellation();
      this.updateModulationInfo();
      this.callbacks.onConfigChange(this.config);
    }
  }

  private updateModulationInfo(): void {
    // 计算并更新调制特性信息
    let spectralEfficiency = this.calculateSpectralEfficiency();
    let powerEfficiency = this.calculatePowerEfficiency();
    let minimumDistance = this.calculateMinimumDistance();
    let symbolErrorRate = this.calculateSymbolErrorRate();

    const spectralEfficiencyEl = this.container.querySelector('#spectralEfficiency');
    const powerEfficiencyEl = this.container.querySelector('#powerEfficiency');
    const minimumDistanceEl = this.container.querySelector('#minimumDistance');
    const symbolErrorRateEl = this.container.querySelector('#symbolErrorRate');

    if (spectralEfficiencyEl) spectralEfficiencyEl.textContent = `${spectralEfficiency.toFixed(2)} bit/s/Hz`;
    if (powerEfficiencyEl) powerEfficiencyEl.textContent = `${powerEfficiency.toFixed(1)} dB`;
    if (minimumDistanceEl) minimumDistanceEl.textContent = minimumDistance.toFixed(2);
    if (symbolErrorRateEl) symbolErrorRateEl.textContent = symbolErrorRate.toExponential(3);
  }

  private calculateSpectralEfficiency(): number {
    switch (this.config.modulationType) {
      case ModulationType.ASK:
      case ModulationType.FSK:
      case ModulationType.PSK:
        return 1.0; // 1 bit per symbol
      case ModulationType.QAM:
        return Math.log2(this.config.qamConstellation.length); // log2(M) bits per symbol
      default:
        return 1.0;
    }
  }

  private calculatePowerEfficiency(): number {
    // 简化的功率效率计算
    switch (this.config.modulationType) {
      case ModulationType.ASK:
        const avgPowerASK = (this.config.askAmplitude0 ** 2 + this.config.askAmplitude1 ** 2) / 2;
        return 10 * Math.log10(1 / avgPowerASK);
      case ModulationType.FSK:
      case ModulationType.PSK:
        return 0; // 参考值
      case ModulationType.QAM:
        const avgPowerQAM = this.config.qamConstellation.reduce((sum, point) => 
          sum + point.I ** 2 + point.Q ** 2, 0) / this.config.qamConstellation.length;
        return 10 * Math.log10(1 / avgPowerQAM);
      default:
        return 0;
    }
  }

  private calculateMinimumDistance(): number {
    if (this.config.modulationType === ModulationType.QAM) {
      let minDist = Infinity;
      for (let i = 0; i < this.config.qamConstellation.length; i++) {
        for (let j = i + 1; j < this.config.qamConstellation.length; j++) {
          const p1 = this.config.qamConstellation[i];
          const p2 = this.config.qamConstellation[j];
          const dist = Math.sqrt((p1.I - p2.I) ** 2 + (p1.Q - p2.Q) ** 2);
          minDist = Math.min(minDist, dist);
        }
      }
      return minDist;
    }
    return 2.0; // 其他调制方式的默认值
  }

  private calculateSymbolErrorRate(): number {
    // 简化的符号错误率计算（假设高SNR）
    const minDist = this.calculateMinimumDistance();
    const snr = 20; // 假设SNR = 20dB
    return 0.5 * Math.exp(-(minDist ** 2) * snr / 4);
  }

  private updateUI(): void {
    this.modulationTypeSelect.value = this.config.modulationType;
    this.carrierFreqSlider.value = this.config.carrierFreq.toString();
    this.amplitudeSlider.value = this.config.amplitude.toString();
    this.phaseSlider.value = (this.config.phase * 180 / Math.PI).toString();

    // 更新滑块显示值
    this.updateSliderValue('carrierFreqValue', this.config.carrierFreq, 'Hz');
    this.updateSliderValue('amplitudeValue', this.config.amplitude, '');
    this.updateSliderValue('phaseValue', Math.round(this.config.phase * 180 / Math.PI), '°');

    // 更新特定参数
    this.askAmplitude0Slider.value = this.config.askAmplitude0.toString();
    this.askAmplitude1Slider.value = this.config.askAmplitude1.toString();
    this.fskFreq0Slider.value = this.config.fskFreq0.toString();
    this.fskFreq1Slider.value = this.config.fskFreq1.toString();
    this.pskPhase0Slider.value = (this.config.pskPhase0 * 180 / Math.PI).toString();
    this.pskPhase1Slider.value = (this.config.pskPhase1 * 180 / Math.PI).toString();

    this.updateSliderValue('askAmplitude0Value', this.config.askAmplitude0, '');
    this.updateSliderValue('askAmplitude1Value', this.config.askAmplitude1, '');
    this.updateSliderValue('fskFreq0Value', this.config.fskFreq0, 'Hz');
    this.updateSliderValue('fskFreq1Value', this.config.fskFreq1, 'Hz');
    this.updateSliderValue('pskPhase0Value', Math.round(this.config.pskPhase0 * 180 / Math.PI), '°');
    this.updateSliderValue('pskPhase1Value', Math.round(this.config.pskPhase1 * 180 / Math.PI), '°');

    this.updateParameterPanels();
    this.updateModulationInfo();
  }

  // 公共方法
  public updateConfig(newConfig: Partial<ModulationSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.updateUI();
  }

  public getConfig(): ModulationSystemConfig {
    return { ...this.config };
  }
}