// 信号生成器组件
import { EncodingType, ModulationType } from '../utils/waveforms';

export interface SignalGeneratorConfig {
  bitString: string;
  encodingType: EncodingType;
  modulationType: ModulationType;
  bitDuration: number;
  sampleRate: number;
  carrierFreq: number;
  animationSpeed: number;
  showGrid: boolean;
}

export interface SignalGeneratorCallbacks {
  onConfigChange: (config: SignalGeneratorConfig) => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onGenerateRandom: () => void;
}

export class SignalGenerator {
  private container: HTMLElement;
  private config: SignalGeneratorConfig;
  private callbacks: SignalGeneratorCallbacks;
  
  // UI元素
  private bitInput: HTMLInputElement;
  private encodingSelect: HTMLSelectElement;
  private modulationSelect: HTMLSelectElement;
  private bitDurationSlider: HTMLInputElement;
  private carrierFreqSlider: HTMLInputElement;
  private animationSpeedSlider: HTMLInputElement;
  private showGridCheckbox: HTMLInputElement;
  
  // 控制按钮
  private playButton: HTMLButtonElement;
  private pauseButton: HTMLButtonElement;
  private resetButton: HTMLButtonElement;
  private randomButton: HTMLButtonElement;
  
  // 状态
  private isPlaying: boolean = false;

  constructor(container: HTMLElement, config: SignalGeneratorConfig, callbacks: SignalGeneratorCallbacks) {
    this.container = container;
    this.config = config;
    this.callbacks = callbacks;
    
    this.createUI();
    this.bindEvents();
    this.updateUI();
  }

  private createUI(): void {
    this.container.innerHTML = `
      <div class="signal-generator">
        <div class="control-group">
          <label for="bitInput">比特流输入:</label>
          <div class="input-row">
            <input type="text" id="bitInput" class="bit-input" placeholder="输入比特流，如：10110100" />
            <button id="randomButton" class="btn btn-secondary">随机生成</button>
          </div>
          <small class="help-text">请输入0和1组成的比特流</small>
        </div>

        <div class="control-group">
          <label for="encodingSelect">编码方式:</label>
          <select id="encodingSelect" class="select-input">
            <option value="NRZ">NRZ (非归零码)</option>
            <option value="Manchester">Manchester (曼彻斯特编码)</option>
            <option value="DifferentialManchester">差分Manchester编码</option>
          </select>
        </div>

        <div class="control-group">
          <label for="modulationSelect">调制方式:</label>
          <select id="modulationSelect" class="select-input">
            <option value="ASK">ASK (幅移键控)</option>
            <option value="FSK">FSK (频移键控)</option>
            <option value="PSK">PSK (相移键控)</option>
            <option value="QAM">QAM (正交幅度调制)</option>
          </select>
        </div>

        <div class="control-group">
          <label for="bitDurationSlider">比特持续时间: <span id="bitDurationValue">1.0</span>s</label>
          <input type="range" id="bitDurationSlider" class="slider" min="0.1" max="2.0" step="0.1" value="1.0" />
        </div>

        <div class="control-group">
          <label for="carrierFreqSlider">载波频率: <span id="carrierFreqValue">10</span>Hz</label>
          <input type="range" id="carrierFreqSlider" class="slider" min="5" max="50" step="1" value="10" />
        </div>

        <div class="control-group">
          <label for="animationSpeedSlider">动画速度: <span id="animationSpeedValue">1.0</span>x</label>
          <input type="range" id="animationSpeedSlider" class="slider" min="0.1" max="3.0" step="0.1" value="1.0" />
        </div>

        <div class="control-group">
          <label class="checkbox-label">
            <input type="checkbox" id="showGridCheckbox" checked />
            显示网格
          </label>
        </div>

        <div class="control-group">
          <div class="button-row">
            <button id="playButton" class="btn btn-primary">播放</button>
            <button id="pauseButton" class="btn btn-secondary" disabled>暂停</button>
            <button id="resetButton" class="btn btn-secondary">重置</button>
          </div>
        </div>

        <div class="info-panel">
          <h4>当前设置:</h4>
          <div class="info-row">
            <span>比特流长度: <span id="bitLengthInfo">0</span></span>
          </div>
          <div class="info-row">
            <span>信号总时长: <span id="signalDurationInfo">0</span>s</span>
          </div>
          <div class="info-row">
            <span>采样点数: <span id="sampleCountInfo">0</span></span>
          </div>
        </div>
      </div>
    `;
    
    // 获取UI元素引用
    this.bitInput = this.container.querySelector('#bitInput') as HTMLInputElement;
    this.encodingSelect = this.container.querySelector('#encodingSelect') as HTMLSelectElement;
    this.modulationSelect = this.container.querySelector('#modulationSelect') as HTMLSelectElement;
    this.bitDurationSlider = this.container.querySelector('#bitDurationSlider') as HTMLInputElement;
    this.carrierFreqSlider = this.container.querySelector('#carrierFreqSlider') as HTMLInputElement;
    this.animationSpeedSlider = this.container.querySelector('#animationSpeedSlider') as HTMLInputElement;
    this.showGridCheckbox = this.container.querySelector('#showGridCheckbox') as HTMLInputElement;
    
    this.playButton = this.container.querySelector('#playButton') as HTMLButtonElement;
    this.pauseButton = this.container.querySelector('#pauseButton') as HTMLButtonElement;
    this.resetButton = this.container.querySelector('#resetButton') as HTMLButtonElement;
    this.randomButton = this.container.querySelector('#randomButton') as HTMLButtonElement;
  }

  private bindEvents(): void {
    // 比特流输入
    this.bitInput.addEventListener('input', () => {
      const bitString = this.validateBitString(this.bitInput.value);
      this.config.bitString = bitString;
      this.updateInfoPanel();
      this.callbacks.onConfigChange(this.config);
    });

    // 编码方式选择
    this.encodingSelect.addEventListener('change', () => {
      this.config.encodingType = this.encodingSelect.value as EncodingType;
      this.callbacks.onConfigChange(this.config);
    });

    // 调制方式选择
    this.modulationSelect.addEventListener('change', () => {
      this.config.modulationType = this.modulationSelect.value as ModulationType;
      this.callbacks.onConfigChange(this.config);
    });

    // 滑块事件
    this.bitDurationSlider.addEventListener('input', () => {
      const value = parseFloat(this.bitDurationSlider.value);
      this.config.bitDuration = value;
      this.updateSliderValue('bitDurationValue', value, 's');
      this.updateInfoPanel();
      this.callbacks.onConfigChange(this.config);
    });

    this.carrierFreqSlider.addEventListener('input', () => {
      const value = parseInt(this.carrierFreqSlider.value);
      this.config.carrierFreq = value;
      this.updateSliderValue('carrierFreqValue', value, 'Hz');
      this.callbacks.onConfigChange(this.config);
    });

    this.animationSpeedSlider.addEventListener('input', () => {
      const value = parseFloat(this.animationSpeedSlider.value);
      this.config.animationSpeed = value;
      this.updateSliderValue('animationSpeedValue', value, 'x');
      this.callbacks.onConfigChange(this.config);
    });

    // 网格显示复选框
    this.showGridCheckbox.addEventListener('change', () => {
      this.config.showGrid = this.showGridCheckbox.checked;
      this.callbacks.onConfigChange(this.config);
    });

    // 控制按钮
    this.playButton.addEventListener('click', () => {
      this.play();
    });

    this.pauseButton.addEventListener('click', () => {
      this.pause();
    });

    this.resetButton.addEventListener('click', () => {
      this.reset();
    });

    this.randomButton.addEventListener('click', () => {
      this.generateRandomBits();
    });
  }

  private validateBitString(input: string): string {
    // 只保留0和1
    return input.replace(/[^01]/g, '');
  }

  private updateSliderValue(elementId: string, value: number, unit: string): void {
    const element = this.container.querySelector(`#${elementId}`);
    if (element) {
      element.textContent = value.toString() + unit;
    }
  }

  private updateInfoPanel(): void {
    const bitLength = this.config.bitString.length;
    const signalDuration = bitLength * this.config.bitDuration;
    const sampleCount = Math.floor(signalDuration * this.config.sampleRate);

    const bitLengthInfo = this.container.querySelector('#bitLengthInfo');
    const signalDurationInfo = this.container.querySelector('#signalDurationInfo');
    const sampleCountInfo = this.container.querySelector('#sampleCountInfo');

    if (bitLengthInfo) bitLengthInfo.textContent = bitLength.toString();
    if (signalDurationInfo) signalDurationInfo.textContent = signalDuration.toFixed(2);
    if (sampleCountInfo) sampleCountInfo.textContent = sampleCount.toString();
  }

  private updateUI(): void {
    this.bitInput.value = this.config.bitString;
    this.encodingSelect.value = this.config.encodingType;
    this.modulationSelect.value = this.config.modulationType;
    this.bitDurationSlider.value = this.config.bitDuration.toString();
    this.carrierFreqSlider.value = this.config.carrierFreq.toString();
    this.animationSpeedSlider.value = this.config.animationSpeed.toString();
    this.showGridCheckbox.checked = this.config.showGrid;

    // 更新滑块显示值
    this.updateSliderValue('bitDurationValue', this.config.bitDuration, 's');
    this.updateSliderValue('carrierFreqValue', this.config.carrierFreq, 'Hz');
    this.updateSliderValue('animationSpeedValue', this.config.animationSpeed, 'x');

    this.updateInfoPanel();
  }

  private play(): void {
    if (this.config.bitString.length === 0) {
      alert('请先输入比特流！');
      return;
    }

    this.isPlaying = true;
    this.playButton.disabled = true;
    this.pauseButton.disabled = false;
    this.callbacks.onPlay();
  }

  private pause(): void {
    this.isPlaying = false;
    this.playButton.disabled = false;
    this.pauseButton.disabled = true;
    this.callbacks.onPause();
  }

  private reset(): void {
    this.pause();
    this.callbacks.onReset();
  }

  private generateRandomBits(): void {
    const length = Math.floor(Math.random() * 8) + 4; // 4-11位随机长度
    let randomBits = '';
    for (let i = 0; i < length; i++) {
      randomBits += Math.random() > 0.5 ? '1' : '0';
    }
    
    this.bitInput.value = randomBits;
    this.config.bitString = randomBits;
    this.updateInfoPanel();
    this.callbacks.onConfigChange(this.config);
    this.callbacks.onGenerateRandom();
  }

  // 公共方法
  public updateConfig(newConfig: Partial<SignalGeneratorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.updateUI();
  }

  public getConfig(): SignalGeneratorConfig {
    return { ...this.config };
  }

  public setPlayingState(isPlaying: boolean): void {
    this.isPlaying = isPlaying;
    this.playButton.disabled = isPlaying;
    this.pauseButton.disabled = !isPlaying;
  }

  public getBitArray(): number[] {
    // 确保比特字符串不为空，如果为空则使用配置中的默认值
    const bitString = this.config.bitString || '10110100';

    // 验证比特字符串的有效性
    if (!/^[01]+$/.test(bitString)) {
      console.warn('Invalid bit string, using default:', bitString);
      return '10110100'.split('').map(bit => parseInt(bit));
    }

    return bitString.split('').map(bit => parseInt(bit));
  }

  public validateInput(): boolean {
    if (this.config.bitString.length === 0) {
      alert('请输入比特流！');
      this.bitInput.focus();
      return false;
    }
    
    if (!/^[01]+$/.test(this.config.bitString)) {
      alert('比特流只能包含0和1！');
      this.bitInput.focus();
      return false;
    }
    
    return true;
  }

  public setError(message: string): void {
    // 显示错误信息
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = 'red';
    errorDiv.style.marginTop = '10px';
    
    // 移除之前的错误信息
    const existingError = this.container.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    this.container.appendChild(errorDiv);
    
    // 3秒后自动移除错误信息
    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
  }

  public clearError(): void {
    const existingError = this.container.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
  }
}