// 波形生成工具函数
import { SignalParams, generateTimeAxis } from './signalMath';

// 编码类型枚举
export enum EncodingType {
  NRZ = 'NRZ',
  Manchester = 'Manchester',
  DifferentialManchester = 'DifferentialManchester'
}

// 调制类型枚举
export enum ModulationType {
  ASK = 'ASK',
  FSK = 'FSK',
  PSK = 'PSK',
  QAM = 'QAM'
}

// 基本波形生成器
export class WaveformGenerator {
  // 生成正弦波
  static generateSineWave(params: SignalParams): { time: number[], amplitude: number[] } {
    const time = generateTimeAxis(params.sampleRate, params.duration);
    const amplitude = time.map(t => 
      params.amplitude * Math.sin(2 * Math.PI * params.frequency * t + params.phase)
    );
    return { time, amplitude };
  }

  // 生成余弦波
  static generateCosineWave(params: SignalParams): { time: number[], amplitude: number[] } {
    const time = generateTimeAxis(params.sampleRate, params.duration);
    const amplitude = time.map(t => 
      params.amplitude * Math.cos(2 * Math.PI * params.frequency * t + params.phase)
    );
    return { time, amplitude };
  }

  // 生成方波
  static generateSquareWave(params: SignalParams): { time: number[], amplitude: number[] } {
    const time = generateTimeAxis(params.sampleRate, params.duration);
    const amplitude = time.map(t => {
      const sine = Math.sin(2 * Math.PI * params.frequency * t + params.phase);
      return params.amplitude * Math.sign(sine);
    });
    return { time, amplitude };
  }
}

// 数字编码器
export class DigitalEncoder {
  // NRZ编码 (非归零码)
  static encodeNRZ(bits: number[], bitDuration: number, sampleRate: number): { time: number[], amplitude: number[] } {
    const samplesPerBit = Math.floor(bitDuration * sampleRate);
    const totalSamples = bits.length * samplesPerBit;
    const time: number[] = [];
    const amplitude: number[] = [];
    
    for (let i = 0; i < totalSamples; i++) {
      const bitIndex = Math.floor(i / samplesPerBit);
      const t = i / sampleRate;
      time.push(t);
      amplitude.push(bits[bitIndex] === 1 ? 1 : -1);
    }
    
    return { time, amplitude };
  }

  // Manchester编码 (曼彻斯特编码)
  static encodeManchester(bits: number[], bitDuration: number, sampleRate: number): { time: number[], amplitude: number[] } {
    const samplesPerBit = Math.floor(bitDuration * sampleRate);
    const totalSamples = bits.length * samplesPerBit;
    const time: number[] = [];
    const amplitude: number[] = [];
    
    for (let i = 0; i < totalSamples; i++) {
      const bitIndex = Math.floor(i / samplesPerBit);
      const positionInBit = (i % samplesPerBit) / samplesPerBit;
      const t = i / sampleRate;
      
      time.push(t);
      
      // Manchester编码: 0 = 高到低转换, 1 = 低到高转换
      if (bits[bitIndex] === 0) {
        amplitude.push(positionInBit < 0.5 ? 1 : -1);
      } else {
        amplitude.push(positionInBit < 0.5 ? -1 : 1);
      }
    }
    
    return { time, amplitude };
  }

  // 差分Manchester编码
  static encodeDifferentialManchester(bits: number[], bitDuration: number, sampleRate: number): { time: number[], amplitude: number[] } {
    const samplesPerBit = Math.floor(bitDuration * sampleRate);
    const totalSamples = bits.length * samplesPerBit;
    const time: number[] = [];
    const amplitude: number[] = [];
    
    let lastPhase = 1; // 初始相位
    
    for (let i = 0; i < totalSamples; i++) {
      const bitIndex = Math.floor(i / samplesPerBit);
      const positionInBit = (i % samplesPerBit) / samplesPerBit;
      const t = i / sampleRate;
      
      time.push(t);
      
      // 差分Manchester: 0 = 相位变化, 1 = 相位不变
      if (i % samplesPerBit === 0) { // 新比特开始
        if (bits[bitIndex] === 0) {
          lastPhase = -lastPhase; // 相位翻转
        }
      }
      
      // 每个比特内部都有跳变
      amplitude.push(positionInBit < 0.5 ? lastPhase : -lastPhase);
    }
    
    return { time, amplitude };
  }
}

// 调制器
export class Modulator {
  // ASK调制 (幅移键控)
  static modulateASK(bits: number[], carrierFreq: number, bitDuration: number, sampleRate: number): { time: number[], amplitude: number[] } {
    const samplesPerBit = Math.floor(bitDuration * sampleRate);
    const totalSamples = bits.length * samplesPerBit;
    const time: number[] = [];
    const amplitude: number[] = [];
    
    for (let i = 0; i < totalSamples; i++) {
      const bitIndex = Math.floor(i / samplesPerBit);
      const t = i / sampleRate;
      
      time.push(t);
      
      const carrierAmplitude = bits[bitIndex] === 1 ? 1 : 0.1; // 1对应高幅度，0对应低幅度
      amplitude.push(carrierAmplitude * Math.cos(2 * Math.PI * carrierFreq * t));
    }
    
    return { time, amplitude };
  }

  // FSK调制 (频移键控)
  static modulateFSK(bits: number[], freq0: number, freq1: number, bitDuration: number, sampleRate: number): { time: number[], amplitude: number[] } {
    const samplesPerBit = Math.floor(bitDuration * sampleRate);
    const totalSamples = bits.length * samplesPerBit;
    const time: number[] = [];
    const amplitude: number[] = [];
    
    for (let i = 0; i < totalSamples; i++) {
      const bitIndex = Math.floor(i / samplesPerBit);
      const t = i / sampleRate;
      
      time.push(t);
      
      const frequency = bits[bitIndex] === 1 ? freq1 : freq0;
      amplitude.push(Math.cos(2 * Math.PI * frequency * t));
    }
    
    return { time, amplitude };
  }

  // PSK调制 (相移键控)
  static modulatePSK(bits: number[], carrierFreq: number, bitDuration: number, sampleRate: number): { time: number[], amplitude: number[] } {
    const samplesPerBit = Math.floor(bitDuration * sampleRate);
    const totalSamples = bits.length * samplesPerBit;
    const time: number[] = [];
    const amplitude: number[] = [];
    
    for (let i = 0; i < totalSamples; i++) {
      const bitIndex = Math.floor(i / samplesPerBit);
      const t = i / sampleRate;
      
      time.push(t);
      
      const phase = bits[bitIndex] === 1 ? 0 : Math.PI; // 1对应0相位，0对应π相位
      amplitude.push(Math.cos(2 * Math.PI * carrierFreq * t + phase));
    }
    
    return { time, amplitude };
  }

  // QAM调制 (正交幅度调制) - 简化版4-QAM
  static modulateQAM(bits: number[], carrierFreq: number, bitDuration: number, sampleRate: number): { time: number[], amplitude: number[] } {
    // 将比特流分组为2位一组
    const symbols: number[] = [];
    for (let i = 0; i < bits.length; i += 2) {
      const bit1 = bits[i] || 0;
      const bit2 = bits[i + 1] || 0;
      symbols.push(bit1 * 2 + bit2); // 00=0, 01=1, 10=2, 11=3
    }
    
    const samplesPerSymbol = Math.floor(bitDuration * 2 * sampleRate); // 2位一个符号
    const totalSamples = symbols.length * samplesPerSymbol;
    const time: number[] = [];
    const amplitude: number[] = [];
    
    // QAM星座点映射
    const constellation = [
      { I: -1, Q: -1 }, // 00
      { I: -1, Q: 1 },  // 01
      { I: 1, Q: -1 },  // 10
      { I: 1, Q: 1 }    // 11
    ];
    
    for (let i = 0; i < totalSamples; i++) {
      const symbolIndex = Math.floor(i / samplesPerSymbol);
      const t = i / sampleRate;
      
      time.push(t);
      
      const symbol = constellation[symbols[symbolIndex]];
      const I_component = symbol.I * Math.cos(2 * Math.PI * carrierFreq * t);
      const Q_component = symbol.Q * Math.sin(2 * Math.PI * carrierFreq * t);
      
      amplitude.push(I_component + Q_component);
    }
    
    return { time, amplitude };
  }
}

// 波形处理工具
export class WaveformProcessor {
  // 将波形数据转换为Three.js可用的点数组
  static toThreeJSPoints(time: number[], amplitude: number[], scale: { x: number, y: number } = { x: 1, y: 1 }): [number, number, number][] {
    return time.map((t, i) => [
      t * scale.x,
      amplitude[i] * scale.y,
      0
    ]);
  }

  // 对波形进行采样，减少点数以提高性能
  static downsample(time: number[], amplitude: number[], maxPoints: number): { time: number[], amplitude: number[] } {
    if (time.length <= maxPoints) {
      return { time, amplitude };
    }
    
    const step = Math.floor(time.length / maxPoints);
    const sampledTime: number[] = [];
    const sampledAmplitude: number[] = [];
    
    for (let i = 0; i < time.length; i += step) {
      sampledTime.push(time[i]);
      sampledAmplitude.push(amplitude[i]);
    }
    
    return { time: sampledTime, amplitude: sampledAmplitude };
  }
}