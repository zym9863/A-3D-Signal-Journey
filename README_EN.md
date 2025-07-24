# Physical Layer Explorer: 3D Signal Journey

**Interactive 3D Visualization Tool for Digital Communication Principles**

[中文版](README.md) | **English**

## Project Overview

This is an interactive 3D digital communication principles teaching demonstration system built with Three.js and TypeScript. Through intuitive 3D visualization, it helps students understand core concepts of physical layer communication, including encoding, modulation, and signal transmission processes.

## Features

### 🎯 Dual Mode Design
- **Encoding & Modulation Visualization Mode**: Real-time display of digital signal encoding and modulation processes
- **Transmission Simulation Mode**: Simulate signal transmission effects in different media

### 📊 Encoding & Modulation Visualization
- Multiple encoding schemes: NRZ, Manchester, Differential encoding, etc.
- Various modulation techniques: ASK, FSK, PSK, QAM
- Real-time 3D waveform display
- Real-time parameter adjustment
- Custom bit stream input

### 📡 Transmission Simulation
- Multiple transmission media: Coaxial cable, Optical fiber, Wireless channel
- Adjustable transmission parameters: Attenuation, noise, distortion
- Real-time bit error rate statistics
- Eye diagram and spectrum analysis

### 🎮 Interactive Controls
- Mouse operations: Drag to rotate, scroll to zoom, right-click to pan
- Keyboard shortcut support
- Fullscreen mode
- Real-time parameter adjustment

## Technology Stack

- **Frontend Framework**: Vite + TypeScript
- **3D Rendering**: Three.js
- **UI Controls**: dat.GUI
- **Build Tool**: Vite
- **Package Manager**: pnpm

## Project Structure

```
src/
├── components/              # Core components
│   ├── ModulationSystem.ts    # Modulation system
│   ├── SignalGenerator.ts     # Signal generator
│   └── TransmissionMedium.ts  # Transmission medium
├── scenes/                  # 3D scenes
│   ├── EncodingScene.ts       # Encoding scene
│   └── TransmissionScene.ts   # Transmission scene
├── utils/                   # Utility functions
│   ├── signalMath.ts          # Signal mathematics
│   └── waveforms.ts           # Waveform generation
├── main.ts                  # Application entry
└── style.css               # Stylesheet
```

## Quick Start

### Requirements
- Node.js >= 16
- pnpm >= 7

### Install Dependencies
```bash
pnpm install
```

### Development Mode
```bash
pnpm dev
```

### Build Project
```bash
pnpm build
```

### Preview Build
```bash
pnpm preview
```

## User Guide

### Encoding & Modulation Visualization Mode
1. Input bit stream in signal generator (e.g., `10110100`)
2. Select encoding scheme (NRZ, Manchester, etc.)
3. Choose modulation technique (ASK, FSK, PSK, QAM)
4. Adjust carrier frequency, bit duration, and other parameters
5. Click play button to observe 3D waveform animation

### Transmission Simulation Mode
1. Select transmission medium type (Coaxial, Fiber, Wireless)
2. Adjust transmission distance, attenuation, noise parameters
3. Click "Start Transmission" to begin simulation
4. Observe signal transmission process and statistics
5. View bit error rate, eye diagram, and other analysis results

### Operation Tips
- **Left Mouse Drag**: Rotate 3D view
- **Mouse Wheel**: Zoom scene
- **Right Mouse Drag**: Pan view
- **Double Click**: Reset camera position
- **Keyboard Shortcuts**:
  - `F11`: Toggle fullscreen
  - `Ctrl+H`: Show help
  - `Ctrl+R`: Reset current mode
  - `1`: Switch to encoding mode
  - `2`: Switch to transmission mode

## Core Concepts

### Encoding Techniques
- **NRZ Encoding**: Non-Return-to-Zero, simple and intuitive
- **Manchester Encoding**: Self-synchronizing, strong interference resistance
- **Differential Encoding**: Relative encoding, reduces bit error impact

### Modulation Techniques
- **ASK**: Amplitude Shift Keying, transmits data by changing carrier amplitude
- **FSK**: Frequency Shift Keying, transmits data by changing carrier frequency
- **PSK**: Phase Shift Keying, transmits data by changing carrier phase
- **QAM**: Quadrature Amplitude Modulation, modulates both amplitude and phase

### Transmission Media
- **Coaxial Cable**: Traditional wired transmission, moderate bandwidth
- **Optical Fiber**: High bandwidth, low loss, long-distance transmission
- **Wireless Channel**: Mobile communication, affected by environment

## Educational Applications

This system is particularly suitable for:
- Digital communication principles course teaching
- Signal processing experiment demonstration
- Communication engineering professional practice
- Self-study and review

## Development Notes

### Core Class Structure
- `SignalJourneyApp`: Main application class, manages mode switching and interface
- `EncodingScene`: Encoding visualization scene
- `TransmissionScene`: Transmission simulation scene
- `SignalGenerator`: Signal generation component
- `ModulationSystem`: Modulation system component
- `TransmissionMedium`: Transmission medium component

### Extension Development
To add new encoding or modulation schemes:
1. Define new enum types in `utils/waveforms.ts`
2. Implement generation logic in corresponding components
3. Add options in UI control panel
4. Update 3D scene rendering logic

## Contributing

Welcome to submit Issues and Pull Requests to improve the project:
- Report bugs or suggest features
- Improve code quality and performance
- Enhance documentation and comments
- Add new encoding/modulation schemes
- Optimize UI interaction experience

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Acknowledgments

Thanks to all developers and educators who contribute to digital communication education.