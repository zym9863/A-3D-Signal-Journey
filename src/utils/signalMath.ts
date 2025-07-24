// 信号数学运算工具函数

// 信号参数接口
export interface SignalParams {
  amplitude: number;
  frequency: number;
  phase: number;
  sampleRate: number;
  duration: number;
}

// 噪声参数接口
export interface NoiseParams {
  type: 'gaussian' | 'uniform';
  power: number;
}

// 复数类
export class Complex {
  constructor(public real: number, public imag: number) {}

  add(other: Complex): Complex {
    return new Complex(this.real + other.real, this.imag + other.imag);
  }

  multiply(other: Complex): Complex {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  magnitude(): number {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  }

  phase(): number {
    return Math.atan2(this.imag, this.real);
  }
}

// 生成时间轴
export function generateTimeAxis(sampleRate: number, duration: number): number[] {
  const samples = Math.floor(sampleRate * duration);
  const timeStep = 1 / sampleRate;
  return Array.from({ length: samples }, (_, i) => i * timeStep);
}

// 生成频率轴
export function generateFrequencyAxis(sampleRate: number, samples: number): number[] {
  const freqStep = sampleRate / samples;
  return Array.from({ length: samples }, (_, i) => i * freqStep);
}

// 快速傅里叶变换 (简化版)
export function fft(signal: Complex[]): Complex[] {
  const N = signal.length;
  if (N <= 1) return signal;
  
  // 分治递归
  const even = signal.filter((_, i) => i % 2 === 0);
  const odd = signal.filter((_, i) => i % 2 === 1);
  
  const evenFFT = fft(even);
  const oddFFT = fft(odd);
  
  const result: Complex[] = new Array(N);
  
  for (let k = 0; k < N / 2; k++) {
    const t = new Complex(
      Math.cos(-2 * Math.PI * k / N),
      Math.sin(-2 * Math.PI * k / N)
    ).multiply(oddFFT[k]);
    
    result[k] = evenFFT[k].add(t);
    result[k + N / 2] = evenFFT[k].add(t.multiply(new Complex(-1, 0)));
  }
  
  return result;
}

// 添加噪声
export function addNoise(signal: number[], noiseParams: NoiseParams): number[] {
  return signal.map(sample => {
    let noise = 0;
    if (noiseParams.type === 'gaussian') {
      // Box-Muller变换生成高斯噪声
      const u1 = Math.random();
      const u2 = Math.random();
      noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    } else {
      // 均匀噪声
      noise = (Math.random() - 0.5) * 2;
    }
    return sample + noise * noiseParams.power;
  });
}

// 信号衰减
export function applyAttenuation(signal: number[], attenuationFactor: number): number[] {
  return signal.map(sample => sample * attenuationFactor);
}

// 信号滤波 (简单低通滤波器)
export function lowPassFilter(signal: number[], cutoffFreq: number, sampleRate: number): number[] {
  const alpha = cutoffFreq / (cutoffFreq + sampleRate);
  const filtered: number[] = [signal[0]];
  
  for (let i = 1; i < signal.length; i++) {
    filtered[i] = alpha * signal[i] + (1 - alpha) * filtered[i - 1];
  }
  
  return filtered;
}

// 计算信噪比
export function calculateSNR(originalSignal: number[], noisySignal: number[]): number {
  if (originalSignal.length !== noisySignal.length) {
    throw new Error('信号长度不匹配');
  }
  
  let signalPower = 0;
  let noisePower = 0;
  
  for (let i = 0; i < originalSignal.length; i++) {
    signalPower += originalSignal[i] * originalSignal[i];
    const noise = noisySignal[i] - originalSignal[i];
    noisePower += noise * noise;
  }
  
  signalPower /= originalSignal.length;
  noisePower /= originalSignal.length;
  
  return 10 * Math.log10(signalPower / noisePower);
}

// 计算误码率 (BER)
export function calculateBER(originalBits: number[], receivedBits: number[]): number {
  if (originalBits.length !== receivedBits.length) {
    throw new Error('比特流长度不匹配');
  }
  
  let errors = 0;
  for (let i = 0; i < originalBits.length; i++) {
    if (originalBits[i] !== receivedBits[i]) {
      errors++;
    }
  }
  
  return errors / originalBits.length;
}