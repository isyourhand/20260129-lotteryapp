// src/services/audio.ts
// 音效服务 - 使用 Web Audio API 生成音效

// 音频上下文（懒加载）
let audioContext: AudioContext | null = null;

// 音量设置（0-1）
let masterVolume = 0.5;
let isMuted = false;

/**
 * 获取或创建音频上下文
 */
const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

/**
 * 创建增益节点（音量控制）
 */
const createGainNode = (ctx: AudioContext, volume: number): GainNode => {
  const gain = ctx.createGain();
  gain.gain.value = isMuted ? 0 : volume * masterVolume;
  return gain;
};

/**
 * 播放一个音符
 */
const playTone = (
  frequency: number,
  duration: number,
  volume: number = 0.3,
  type: OscillatorType = "sine"
): void => {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = createGainNode(ctx, volume);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  const now = ctx.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(volume * masterVolume, now + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

  oscillator.start(now);
  oscillator.stop(now + duration);
};

/**
 * 播放滑音（频率变化）
 */
const playSlide = (
  startFreq: number,
  endFreq: number,
  duration: number,
  volume: number = 0.3
): void => {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = createGainNode(ctx, volume);

  oscillator.frequency.setValueAtTime(startFreq, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    endFreq,
    ctx.currentTime + duration
  );

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  const now = ctx.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(volume * masterVolume, now + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

  oscillator.start(now);
  oscillator.stop(now + duration);
};

/**
 * 播放噪声（用于鼓点等效果）
 */
const playNoise = (duration: number, volume: number = 0.3): void => {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const gainNode = createGainNode(ctx, volume);

  // 添加低通滤波器，让噪声更柔和
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1000;

  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  const now = ctx.currentTime;
  gainNode.gain.setValueAtTime(volume * masterVolume, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

  noise.start(now);
  noise.stop(now + duration);
};

// =========================================
// 音效 API
// =========================================

/**
 * 初始化音频（在用户交互后调用）
 */
export const initAudio = (): void => {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume();
  }
};

/**
 * 设置主音量
 */
export const setVolume = (volume: number): void => {
  masterVolume = Math.max(0, Math.min(1, volume));
};

/**
 * 获取当前音量
 */
export const getVolume = (): number => masterVolume;

/**
 * 设置静音
 */
export const setMuted = (muted: boolean): void => {
  isMuted = muted;
};

/**
 * 获取静音状态
 */
export const getMuted = (): boolean => isMuted;

// =========================================
// 具体音效
// =========================================

/**
 * 旋转中音效（可循环的短音效）
 */
export const playRollingTick = (): void => {
  playNoise(0.05, 0.1);
};

/**
 * 卡片飞行动画音效
 */
export const playCardFly = (): void => {
  // 嗖的声音
  playSlide(800, 400, 0.3, 0.15);
};

// =========================================
// 导出默认对象
// =========================================

const AudioService = {
  init: initAudio,
  setVolume,
  getVolume,
  setMuted,
  getMuted,
  rollingTick: playRollingTick,
  cardFly: playCardFly,
};

export default AudioService;
