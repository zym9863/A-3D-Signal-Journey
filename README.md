# 物理层探秘：3D信号之旅

**交互式数字通信原理3D可视化教学工具**

**中文** | [English](README_EN.md)

## 项目简介

这是一个基于 Three.js 和 TypeScript 构建的交互式3D数字通信原理教学演示系统。通过直观的3D可视化，帮助学生理解物理层通信的核心概念，包括编码、调制和信号传输等过程。

## 功能特性

### 🎯 双模式设计
- **编码调制可视化模式**：实时展示数字信号的编码和调制过程
- **传输仿真模式**：模拟信号在不同介质中的传输效果

### 📊 编码调制可视化
- 支持多种编码方式：NRZ、Manchester、差分编码等
- 多种调制技术：ASK、FSK、PSK、QAM
- 实时3D波形展示
- 参数实时调节
- 比特流自定义输入

### 📡 传输仿真
- 多种传输介质：同轴电缆、光纤、无线信道
- 可调节传输参数：衰减、噪声、失真
- 实时误码率统计
- 眼图和频谱分析

### 🎮 交互控制
- 鼠标操作：拖拽旋转、滚轮缩放、右键平移
- 键盘快捷键支持
- 全屏模式
- 实时参数调节

## 技术栈

- **前端框架**：Vite + TypeScript
- **3D渲染**：Three.js
- **UI控制**：dat.GUI
- **构建工具**：Vite
- **包管理**：pnpm

## 项目结构

```
src/
├── components/              # 核心组件
│   ├── ModulationSystem.ts    # 调制系统
│   ├── SignalGenerator.ts     # 信号生成器
│   └── TransmissionMedium.ts  # 传输介质
├── scenes/                  # 3D场景
│   ├── EncodingScene.ts       # 编码场景
│   └── TransmissionScene.ts   # 传输场景
├── utils/                   # 工具函数
│   ├── signalMath.ts          # 信号数学计算
│   └── waveforms.ts           # 波形生成
├── main.ts                  # 应用入口
└── style.css               # 样式文件
```

## 快速开始

### 环境要求
- Node.js >= 16
- pnpm >= 7

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm dev
```

### 构建项目
```bash
pnpm build
```

### 预览构建结果
```bash
pnpm preview
```

## 使用指南

### 编码调制可视化模式
1. 在信号生成器中输入比特流（如：`10110100`）
2. 选择编码方式（NRZ、Manchester等）
3. 选择调制技术（ASK、FSK、PSK、QAM）
4. 调节载波频率、比特持续时间等参数
5. 点击播放按钮观察3D波形动画

### 传输仿真模式
1. 选择传输介质类型（同轴电缆、光纤、无线）
2. 调节传输距离、衰减、噪声等参数
3. 点击"开始传输"按钮启动仿真
4. 观察信号传输过程和统计数据
5. 查看误码率、眼图等分析结果

### 操作技巧
- **鼠标左键拖拽**：旋转3D视角
- **鼠标滚轮**：缩放场景
- **鼠标右键拖拽**：平移视角
- **双击**：重置相机位置
- **键盘快捷键**：
  - `F11`：切换全屏
  - `Ctrl+H`：显示帮助
  - `Ctrl+R`：重置当前模式
  - `1`：切换到编码模式
  - `2`：切换到传输模式

## 核心概念

### 编码技术
- **NRZ编码**：非归零编码，简单直观
- **Manchester编码**：自同步特性，抗干扰能力强
- **差分编码**：相对编码，降低误码影响

### 调制技术
- **ASK**：幅移键控，通过改变载波幅度传输数据
- **FSK**：频移键控，通过改变载波频率传输数据
- **PSK**：相移键控，通过改变载波相位传输数据
- **QAM**：正交幅度调制，同时调制幅度和相位

### 传输介质
- **同轴电缆**：传统有线传输，带宽适中
- **光纤**：高带宽低损耗，远距离传输
- **无线信道**：移动通信，受环境影响较大

## 教学应用

本系统特别适用于：
- 数字通信原理课程教学
- 信号处理实验演示
- 通信工程专业实践
- 自主学习和复习

## 开发说明

### 核心类结构
- `SignalJourneyApp`：主应用类，管理模式切换和界面
- `EncodingScene`：编码可视化场景
- `TransmissionScene`：传输仿真场景
- `SignalGenerator`：信号生成组件
- `ModulationSystem`：调制系统组件
- `TransmissionMedium`：传输介质组件

### 扩展开发
要添加新的编码或调制方式：
1. 在 `utils/waveforms.ts` 中定义新的枚举类型
2. 在相应组件中实现生成逻辑
3. 在UI控制面板中添加选项
4. 更新3D场景的渲染逻辑

## 贡献指南

欢迎提交 Issue 和 Pull Request 来完善项目：
- 报告 Bug 或提出功能建议
- 改进代码质量和性能
- 完善文档和注释
- 添加新的编码/调制方式
- 优化UI交互体验

## 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

## 致谢

感谢所有为数字通信教育做出贡献的开发者和教育工作者。