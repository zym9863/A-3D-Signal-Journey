// 传输介质组件
import { MediumType } from '../scenes/TransmissionScene';

export interface TransmissionMediumConfig {
  mediumType: MediumType;
  distance: number;          // 传输距离 (米)
  attenuation: number;       // 衰减系数 (dB/km)
  noiseLevel: number;        // 噪声水平 (0-1)
  distortion: number;        // 失真程度 (0-1)
  bandwidth: number;         // 带宽 (Hz)
  showEyeDiagram: boolean;   // 显示眼图
  showSpectrum: boolean;     // 显示频谱
  realTimeAnalysis: boolean; // 实时分析
}

export interface MediumCharacteristics {
  name: string;
  maxDistance: number;       // 最大传输距离 (米)
  typicalAttenuation: number; // 典型衰减 (dB/km)
  bandwidth: number;         // 带宽 (Hz)
  cost: number;             // 相对成本 (1-5)
  complexity: number;       // 复杂度 (1-5)
  description: string;      // 描述
}

export interface TransmissionMediumCallbacks {
  onConfigChange: (config: TransmissionMediumConfig) => void;
  onMediumTypeChange: (type: MediumType) => void;
  onParameterChange: (parameter: string, value: number) => void;
  onAnalysisToggle: (type: 'eye' | 'spectrum' | 'realtime', enabled: boolean) => void;
}

export class TransmissionMedium {
  private container: HTMLElement;
  private config: TransmissionMediumConfig;
  private callbacks: TransmissionMediumCallbacks;
  
  // 介质特性数据
  private mediumCharacteristics: Record<MediumType, MediumCharacteristics> = {
    [MediumType.COAXIAL]: {
      name: '同轴电缆',
      maxDistance: 500,
      typicalAttenuation: 20,
      bandwidth: 1000000, // 1MHz
      cost: 2,
      complexity: 2,
      description: '由内导体、绝缘层、外导体和保护层组成。适合高频信号传输，抗干扰能力强。'
    },
    [MediumType.TWISTED_PAIR]: {
      name: '双绞线',
      maxDistance: 100,
      typicalAttenuation: 50,
      bandwidth: 100000, // 100kHz
      cost: 1,
      complexity: 1,
      description: '两根绝缘导线相互缠绕。成本低，安装简单，但传输距离和带宽有限。'
    },
    [MediumType.OPTICAL_FIBER]: {
      name: '光纤',
      maxDistance: 40000,
      typicalAttenuation: 0.2,
      bandwidth: 100000000, // 100MHz
      cost: 4,
      complexity: 4,
      description: '利用光波传输信号。带宽大，衰减小，抗电磁干扰，但成本较高。'
    },
    [MediumType.WIRELESS]: {
      name: '无线传输',
      maxDistance: 10000,
      typicalAttenuation: 100,
      bandwidth: 10000000, // 10MHz
      cost: 3,
      complexity: 5,
      description: '通过电磁波传输信号。灵活性高，但易受环境干扰，功率损耗大。'
    }
  };
  
  // UI元素
  private mediumTypeSelect: HTMLSelectElement;
  private distanceSlider: HTMLInputElement;
  private attenuationSlider: HTMLInputElement;
  private noiseLevelSlider: HTMLInputElement;
  private distortionSlider: HTMLInputElement;
  private bandwidthSlider: HTMLInputElement;
  
  // 分析控制
  private eyeDiagramCheckbox: HTMLInputElement;
  private spectrumCheckbox: HTMLInputElement;
  private realTimeCheckbox: HTMLInputElement;
  
  // 信息显示
  private mediumInfoPanel: HTMLElement;
  private performancePanel: HTMLElement;

  constructor(container: HTMLElement, config: TransmissionMediumConfig, callbacks: TransmissionMediumCallbacks) {
    this.container = container;
    this.config = config;
    this.callbacks = callbacks;
    
    this.createUI();
    this.bindEvents();
    this.updateUI();
  }

  private createUI(): void {
    this.container.innerHTML = `
      <div class="transmission-medium">
        <h3>传输介质配置</h3>
        
        <div class="control-group">
          <label for="mediumTypeSelect">介质类型:</label>
          <select id="mediumTypeSelect" class="select-input">
            <option value="coaxial">同轴电缆</option>
            <option value="twisted_pair">双绞线</option>
            <option value="optical_fiber">光纤</option>
            <option value="wireless">无线传输</option>
          </select>
        </div>

        <div class="control-group">
          <label for="distanceSlider">传输距离: <span id="distanceValue">100</span>m</label>
          <input type="range" id="distanceSlider" class="slider" min="1" max="1000" step="1" value="100" />
          <small class="help-text">最大距离: <span id="maxDistance">500m</span></small>
        </div>

        <div class="control-group">
          <label for="attenuationSlider">衰减系数: <span id="attenuationValue">20</span>dB/km</label>
          <input type="range" id="attenuationSlider" class="slider" min="0.1" max="100" step="0.1" value="20" />
          <small class="help-text">典型值: <span id="typicalAttenuation">20dB/km</span></small>
        </div>

        <div class="control-group">
          <label for="noiseLevelSlider">噪声水平: <span id="noiseLevelValue">0.1</span></label>
          <input type="range" id="noiseLevelSlider" class="slider" min="0" max="1" step="0.01" value="0.1" />
        </div>

        <div class="control-group">
          <label for="distortionSlider">失真程度: <span id="distortionValue">0.1</span></label>
          <input type="range" id="distortionSlider" class="slider" min="0" max="1" step="0.01" value="0.1" />
        </div>

        <div class="control-group">
          <label for="bandwidthSlider">带宽: <span id="bandwidthValue">1000</span>kHz</label>
          <input type="range" id="bandwidthSlider" class="slider" min="10" max="100000" step="10" value="1000" />
        </div>

        <div class="analysis-controls">
          <h4>分析工具</h4>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="eyeDiagramCheckbox" />
              眼图分析
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="spectrumCheckbox" />
              频谱分析
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="realTimeCheckbox" />
              实时分析
            </label>
          </div>
        </div>

        <div id="mediumInfoPanel" class="medium-info-panel">
          <h4>介质特性</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">介质名称:</span>
              <span id="mediumName">同轴电缆</span>
            </div>
            <div class="info-item">
              <span class="info-label">最大距离:</span>
              <span id="mediumMaxDistance">500m</span>
            </div>
            <div class="info-item">
              <span class="info-label">典型衰减:</span>
              <span id="mediumTypicalAttenuation">20dB/km</span>
            </div>
            <div class="info-item">
              <span class="info-label">带宽范围:</span>
              <span id="mediumBandwidth">1MHz</span>
            </div>
            <div class="info-item">
              <span class="info-label">相对成本:</span>
              <span id="mediumCost" class="cost-indicator">●●○○○</span>
            </div>
            <div class="info-item">
              <span class="info-label">复杂度:</span>
              <span id="mediumComplexity" class="complexity-indicator">●●○○○</span>
            </div>
          </div>
          <div class="medium-description">
            <p id="mediumDescription">
              由内导体、绝缘层、外导体和保护层组成。适合高频信号传输，抗干扰能力强。
            </p>
          </div>
        </div>

        <div id="performancePanel" class="performance-panel">
          <h4>传输性能预测</h4>
          <div class="performance-grid">
            <div class="performance-item">
              <span class="performance-label">信号衰减:</span>
              <span id="totalAttenuation" class="performance-value">2.0dB</span>
            </div>
            <div class="performance-item">
              <span class="performance-label">预计SNR:</span>
              <span id="estimatedSNR" class="performance-value">25.0dB</span>
            </div>
            <div class="performance-item">
              <span class="performance-label">带宽利用率:</span>
              <span id="bandwidthUtilization" class="performance-value">65%</span>
            </div>
            <div class="performance-item">
              <span class="performance-label">传输延迟:</span>
              <span id="transmissionDelay" class="performance-value">0.33μs</span>
            </div>
            <div class="performance-item">
              <span class="performance-label">误码率预估:</span>
              <span id="estimatedBER" class="performance-value">1e-6</span>
            </div>
            <div class="performance-item">
              <span class="performance-label">功率损耗:</span>
              <span id="powerLoss" class="performance-value">15%</span>
            </div>
          </div>
        </div>

        <div class="preset-buttons">
          <h4>预设配置</h4>
          <div class="button-row">
            <button id="optimizeBtn" class="btn btn-primary">优化配置</button>
            <button id="resetBtn" class="btn btn-secondary">重置默认</button>
            <button id="compareBtn" class="btn btn-info">介质对比</button>
          </div>
        </div>

        <div id="comparisonTable" class="comparison-table" style="display: none;">
          <h4>介质对比表</h4>
          <table>
            <thead>
              <tr>
                <th>介质类型</th>
                <th>最大距离</th>
                <th>典型衰减</th>
                <th>带宽</th>
                <th>成本</th>
                <th>复杂度</th>
              </tr>
            </thead>
            <tbody id="comparisonTableBody">
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    // 获取UI元素
    this.mediumTypeSelect = this.container.querySelector('#mediumTypeSelect') as HTMLSelectElement;
    this.distanceSlider = this.container.querySelector('#distanceSlider') as HTMLInputElement;
    this.attenuationSlider = this.container.querySelector('#attenuationSlider') as HTMLInputElement;
    this.noiseLevelSlider = this.container.querySelector('#noiseLevelSlider') as HTMLInputElement;
    this.distortionSlider = this.container.querySelector('#distortionSlider') as HTMLInputElement;
    this.bandwidthSlider = this.container.querySelector('#bandwidthSlider') as HTMLInputElement;
    
    this.eyeDiagramCheckbox = this.container.querySelector('#eyeDiagramCheckbox') as HTMLInputElement;
    this.spectrumCheckbox = this.container.querySelector('#spectrumCheckbox') as HTMLInputElement;
    this.realTimeCheckbox = this.container.querySelector('#realTimeCheckbox') as HTMLInputElement;
    
    this.mediumInfoPanel = this.container.querySelector('#mediumInfoPanel') as HTMLElement;
    this.performancePanel = this.container.querySelector('#performancePanel') as HTMLElement;
  }

  private bindEvents(): void {
    // 介质类型选择
    this.mediumTypeSelect.addEventListener('change', () => {
      this.config.mediumType = this.mediumTypeSelect.value as MediumType;
      this.updateMediumCharacteristics();
      this.updatePerformanceEstimation();
      this.callbacks.onMediumTypeChange(this.config.mediumType);
      this.callbacks.onConfigChange(this.config);
    });

    // 参数滑块
    this.distanceSlider.addEventListener('input', () => {
      const value = parseInt(this.distanceSlider.value);
      this.config.distance = value;
      this.updateSliderValue('distanceValue', value, 'm');
      this.updatePerformanceEstimation();
      this.callbacks.onParameterChange('distance', value);
      this.callbacks.onConfigChange(this.config);
    });

    this.attenuationSlider.addEventListener('input', () => {
      const value = parseFloat(this.attenuationSlider.value);
      this.config.attenuation = value;
      this.updateSliderValue('attenuationValue', value, 'dB/km');
      this.updatePerformanceEstimation();
      this.callbacks.onParameterChange('attenuation', value);
      this.callbacks.onConfigChange(this.config);
    });

    this.noiseLevelSlider.addEventListener('input', () => {
      const value = parseFloat(this.noiseLevelSlider.value);
      this.config.noiseLevel = value;
      this.updateSliderValue('noiseLevelValue', value, '');
      this.updatePerformanceEstimation();
      this.callbacks.onParameterChange('noiseLevel', value);
      this.callbacks.onConfigChange(this.config);
    });

    this.distortionSlider.addEventListener('input', () => {
      const value = parseFloat(this.distortionSlider.value);
      this.config.distortion = value;
      this.updateSliderValue('distortionValue', value, '');
      this.updatePerformanceEstimation();
      this.callbacks.onParameterChange('distortion', value);
      this.callbacks.onConfigChange(this.config);
    });

    this.bandwidthSlider.addEventListener('input', () => {
      const value = parseInt(this.bandwidthSlider.value);
      this.config.bandwidth = value * 1000; // 转换为Hz
      this.updateSliderValue('bandwidthValue', value, 'kHz');
      this.updatePerformanceEstimation();
      this.callbacks.onParameterChange('bandwidth', this.config.bandwidth);
      this.callbacks.onConfigChange(this.config);
    });

    // 分析工具复选框
    this.eyeDiagramCheckbox.addEventListener('change', () => {
      this.config.showEyeDiagram = this.eyeDiagramCheckbox.checked;
      this.callbacks.onAnalysisToggle('eye', this.config.showEyeDiagram);
      this.callbacks.onConfigChange(this.config);
    });

    this.spectrumCheckbox.addEventListener('change', () => {
      this.config.showSpectrum = this.spectrumCheckbox.checked;
      this.callbacks.onAnalysisToggle('spectrum', this.config.showSpectrum);
      this.callbacks.onConfigChange(this.config);
    });

    this.realTimeCheckbox.addEventListener('change', () => {
      this.config.realTimeAnalysis = this.realTimeCheckbox.checked;
      this.callbacks.onAnalysisToggle('realtime', this.config.realTimeAnalysis);
      this.callbacks.onConfigChange(this.config);
    });

    // 预设按钮
    const optimizeBtn = this.container.querySelector('#optimizeBtn');
    const resetBtn = this.container.querySelector('#resetBtn');
    const compareBtn = this.container.querySelector('#compareBtn');

    optimizeBtn?.addEventListener('click', () => {
      this.optimizeConfiguration();
    });

    resetBtn?.addEventListener('click', () => {
      this.resetToDefaults();
    });

    compareBtn?.addEventListener('click', () => {
      this.toggleComparisonTable();
    });
  }

  private updateSliderValue(elementId: string, value: number, unit: string): void {
    const element = this.container.querySelector(`#${elementId}`);
    if (element) {
      element.textContent = value.toString() + unit;
    }
  }

  private updateMediumCharacteristics(): void {
    const characteristics = this.mediumCharacteristics[this.config.mediumType];
    
    // 更新UI显示
    this.updateElementText('mediumName', characteristics.name);
    this.updateElementText('mediumMaxDistance', `${characteristics.maxDistance}m`);
    this.updateElementText('mediumTypicalAttenuation', `${characteristics.typicalAttenuation}dB/km`);
    this.updateElementText('mediumBandwidth', this.formatBandwidth(characteristics.bandwidth));
    this.updateElementText('mediumDescription', characteristics.description);
    
    // 更新成本和复杂度指示器
    this.updateIndicator('mediumCost', characteristics.cost);
    this.updateIndicator('mediumComplexity', characteristics.complexity);
    
    // 更新滑块范围和提示
    this.distanceSlider.max = characteristics.maxDistance.toString();
    this.updateElementText('maxDistance', `${characteristics.maxDistance}m`);
    this.updateElementText('typicalAttenuation', `${characteristics.typicalAttenuation}dB/km`);
    
    // 如果当前距离超过最大距离，调整到最大值
    if (this.config.distance > characteristics.maxDistance) {
      this.config.distance = characteristics.maxDistance;
      this.distanceSlider.value = this.config.distance.toString();
      this.updateSliderValue('distanceValue', this.config.distance, 'm');
    }
  }

  private updateElementText(id: string, text: string): void {
    const element = this.container.querySelector(`#${id}`);
    if (element) {
      element.textContent = text;
    }
  }

  private updateIndicator(id: string, level: number): void {
    const element = this.container.querySelector(`#${id}`);
    if (element) {
      const filled = '●'.repeat(level);
      const empty = '○'.repeat(5 - level);
      element.textContent = filled + empty;
    }
  }

  private formatBandwidth(bandwidth: number): string {
    if (bandwidth >= 1000000) {
      return `${(bandwidth / 1000000).toFixed(1)}MHz`;
    } else if (bandwidth >= 1000) {
      return `${(bandwidth / 1000).toFixed(1)}kHz`;
    } else {
      return `${bandwidth}Hz`;
    }
  }

  private updatePerformanceEstimation(): void {
    const characteristics = this.mediumCharacteristics[this.config.mediumType];
    
    // 计算总衰减
    const totalAttenuation = (this.config.attenuation * this.config.distance / 1000).toFixed(1);
    this.updateElementText('totalAttenuation', `${totalAttenuation}dB`);
    
    // 估算SNR
    const baseSignalPower = 20; // dBm
    const noisePower = -80 + 20 * Math.log10(this.config.noiseLevel + 0.01);
    const estimatedSNR = baseSignalPower - parseFloat(totalAttenuation) - noisePower;
    this.updateElementText('estimatedSNR', `${estimatedSNR.toFixed(1)}dB`);
    
    // 带宽利用率
    const maxBandwidth = characteristics.bandwidth;
    const utilization = Math.min(100, (this.config.bandwidth / maxBandwidth) * 100);
    this.updateElementText('bandwidthUtilization', `${utilization.toFixed(0)}%`);
    
    // 传输延迟 (假设信号传播速度)
    let propagationSpeed: number;
    switch (this.config.mediumType) {
      case MediumType.OPTICAL_FIBER:
        propagationSpeed = 200000000; // 2×10^8 m/s (光在光纤中)
        break;
      case MediumType.WIRELESS:
        propagationSpeed = 300000000; // 3×10^8 m/s (光速)
        break;
      default:
        propagationSpeed = 200000000; // 电信号在电缆中
    }
    const delay = (this.config.distance / propagationSpeed) * 1000000; // 微秒
    this.updateElementText('transmissionDelay', `${delay.toFixed(2)}μs`);
    
    // 误码率预估
    const ber = Math.pow(10, -(estimatedSNR / 10 + 6));
    this.updateElementText('estimatedBER', ber.toExponential(1));
    
    // 功率损耗
    const powerLoss = (1 - Math.pow(10, -parseFloat(totalAttenuation) / 10)) * 100;
    this.updateElementText('powerLoss', `${powerLoss.toFixed(1)}%`);
  }

  private optimizeConfiguration(): void {
    const characteristics = this.mediumCharacteristics[this.config.mediumType];
    
    // 根据介质特性优化参数
    this.config.attenuation = characteristics.typicalAttenuation;
    this.config.noiseLevel = 0.05; // 较低的噪声水平
    this.config.distortion = 0.02; // 较低的失真
    
    // 优化带宽：使用介质最大带宽的80%
    this.config.bandwidth = Math.floor(characteristics.bandwidth * 0.8);
    
    this.updateUI();
    this.callbacks.onConfigChange(this.config);
  }

  private resetToDefaults(): void {
    const characteristics = this.mediumCharacteristics[this.config.mediumType];
    
    this.config.distance = Math.min(100, characteristics.maxDistance);
    this.config.attenuation = characteristics.typicalAttenuation;
    this.config.noiseLevel = 0.1;
    this.config.distortion = 0.1;
    this.config.bandwidth = Math.min(1000000, characteristics.bandwidth);
    this.config.showEyeDiagram = false;
    this.config.showSpectrum = false;
    this.config.realTimeAnalysis = false;
    
    this.updateUI();
    this.callbacks.onConfigChange(this.config);
  }

  private toggleComparisonTable(): void {
    const table = this.container.querySelector('#comparisonTable') as HTMLElement;
    if (table.style.display === 'none') {
      this.createComparisonTable();
      table.style.display = 'block';
    } else {
      table.style.display = 'none';
    }
  }

  private createComparisonTable(): void {
    const tbody = this.container.querySelector('#comparisonTableBody') as HTMLElement;
    tbody.innerHTML = '';
    
    Object.entries(this.mediumCharacteristics).forEach(([type, characteristics]) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${characteristics.name}</td>
        <td>${characteristics.maxDistance}m</td>
        <td>${characteristics.typicalAttenuation}dB/km</td>
        <td>${this.formatBandwidth(characteristics.bandwidth)}</td>
        <td>${'●'.repeat(characteristics.cost) + '○'.repeat(5 - characteristics.cost)}</td>
        <td>${'●'.repeat(characteristics.complexity) + '○'.repeat(5 - characteristics.complexity)}</td>
      `;
      
      // 高亮当前选中的介质
      if (type === this.config.mediumType) {
        row.classList.add('selected-medium');
      }
      
      tbody.appendChild(row);
    });
  }

  private updateUI(): void {
    this.mediumTypeSelect.value = this.config.mediumType;
    this.distanceSlider.value = this.config.distance.toString();
    this.attenuationSlider.value = this.config.attenuation.toString();
    this.noiseLevelSlider.value = this.config.noiseLevel.toString();
    this.distortionSlider.value = this.config.distortion.toString();
    this.bandwidthSlider.value = (this.config.bandwidth / 1000).toString();
    
    this.eyeDiagramCheckbox.checked = this.config.showEyeDiagram;
    this.spectrumCheckbox.checked = this.config.showSpectrum;
    this.realTimeCheckbox.checked = this.config.realTimeAnalysis;
    
    // 更新滑块显示值
    this.updateSliderValue('distanceValue', this.config.distance, 'm');
    this.updateSliderValue('attenuationValue', this.config.attenuation, 'dB/km');
    this.updateSliderValue('noiseLevelValue', this.config.noiseLevel, '');
    this.updateSliderValue('distortionValue', this.config.distortion, '');
    this.updateSliderValue('bandwidthValue', this.config.bandwidth / 1000, 'kHz');
    
    this.updateMediumCharacteristics();
    this.updatePerformanceEstimation();
  }

  // 公共方法
  public updateConfig(newConfig: Partial<TransmissionMediumConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.updateUI();
  }

  public getConfig(): TransmissionMediumConfig {
    return { ...this.config };
  }

  public getMediumCharacteristics(mediumType?: MediumType): MediumCharacteristics {
    return this.mediumCharacteristics[mediumType || this.config.mediumType];
  }

  public getAllMediumCharacteristics(): Record<MediumType, MediumCharacteristics> {
    return { ...this.mediumCharacteristics };
  }

  public validateConfiguration(): { isValid: boolean, warnings: string[], errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];
    const characteristics = this.mediumCharacteristics[this.config.mediumType];
    
    // 检查距离
    if (this.config.distance > characteristics.maxDistance) {
      errors.push(`传输距离超过${characteristics.name}的最大距离限制`);
    }
    
    if (this.config.distance > characteristics.maxDistance * 0.8) {
      warnings.push('传输距离接近介质限制，可能影响信号质量');
    }
    
    // 检查带宽
    if (this.config.bandwidth > characteristics.bandwidth) {
      warnings.push('所需带宽超过介质最大带宽');
    }
    
    // 检查衰减
    if (this.config.attenuation > characteristics.typicalAttenuation * 2) {
      warnings.push('衰减系数过高，可能需要使用信号放大器');
    }
    
    // 检查噪声和失真
    if (this.config.noiseLevel > 0.5) {
      warnings.push('噪声水平较高，建议检查环境干扰');
    }
    
    if (this.config.distortion > 0.3) {
      warnings.push('失真程度较高，可能影响信号完整性');
    }
    
    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  public calculateTotalCost(): number {
    const characteristics = this.mediumCharacteristics[this.config.mediumType];
    const baseCost = characteristics.cost * 100; // 基础成本
    const distanceCost = this.config.distance * characteristics.cost; // 距离相关成本
    const complexityCost = characteristics.complexity * 50; // 复杂度成本
    
    return baseCost + distanceCost + complexityCost;
  }
}