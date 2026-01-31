// src/services/physicsUtils.ts
import { PHYSICS, DECELERATION, TIMING } from "../config/physics";

/**
 * 计算揭晓所有卡片需要的总时间（即减速阶段的总时间）
 * 与 useLottery.ts reveal 函数保持一致
 * 
 * 注意：reveal 函数使用固定的 CARD_INTERVAL 间隔（默认 2500ms）
 * 确保前一张卡片飞行动画完成后再开始下一张
 */
export const calculateRevealDuration = (winnerCount: number): number => {
  const { REVEAL_BUFFER } = TIMING;

  if (winnerCount <= 0) return 0;

  // reveal 函数使用固定的 CARD_INTERVAL 间隔
  // 每张卡片间隔 = CARD_ANIMATION.TOTAL (默认 2500ms)
  const CARD_INTERVAL = 2500;
  
  // 总时间 = 卡片数量 * 间隔 + 缓冲时间
  const totalTimeMs = winnerCount * CARD_INTERVAL + REVEAL_BUFFER;

  return Math.round(totalTimeMs);
};

/**
 * 计算滚动阶段持续时间（纯加速旋转时间）
 * 
 * 设计逻辑：
 * 1. 滚动阶段 = 纯加速时间（固定2秒）
 * 2. 揭晓阶段 = 开始减速 + 逐张揭晓卡片
 * 3. 揭晓阶段的总时长 = 减速所需时间
 * 
 * 这样确保：最后一张卡片揭晓时，球体刚好降到IDLE_SPEED
 */
export const calculateRollingDuration = (winnerCount: number): number => {
  const { ACCELERATION_DURATION } = TIMING;
  
  // 滚动时间固定为加速阶段时间
  // 之后进入揭晓阶段，开始减速
  return ACCELERATION_DURATION;
};

/**
 * 计算物理摩擦系数
 * 
 * 核心目标：在 reveal 阶段的总时长内，球体速度从 MAX_SPEED 恰好降到 IDLE_SPEED
 * 
 * 物理公式：
 *   v_end = v_start * (friction ^ frames)
 *   friction = (v_end / v_start) ^ (1 / frames)
 */
export const calculateDynamics = (winnerCount: number) => {
  // 揭晓阶段的总时长 = 减速时间
  const revealDurationMs = calculateRevealDuration(winnerCount);
  
  const { FPS, START_SPEED, END_SPEED, MIN_FRICTION, MAX_FRICTION } = DECELERATION;

  // 转换为帧数
  const totalFrames = revealDurationMs / (1000 / FPS);

  // 使用物理公式计算摩擦系数
  // friction = (END_SPEED / START_SPEED) ^ (1 / totalFrames)
  const speedRatio = END_SPEED / START_SPEED;
  const friction = Math.pow(speedRatio, 1 / totalFrames);

  // 兜底：确保摩擦系数在合理范围内
  // 越接近1表示减速越慢，越小表示减速越快
  return Math.min(MAX_FRICTION, Math.max(MIN_FRICTION, friction));
};

/**
 * 调试信息：计算并返回各阶段时间
 * 用于验证时间计算是否正确
 */
export const calculateDebugInfo = (winnerCount: number) => {
  const rollingDuration = calculateRollingDuration(winnerCount);
  const revealDuration = calculateRevealDuration(winnerCount);
  const friction = calculateDynamics(winnerCount);
  const totalTime = rollingDuration + revealDuration;

  return {
    winnerCount,
    rollingDuration,      // 加速阶段
    revealDuration,       // 减速+揭晓阶段
    totalTime,            // 总时间
    friction,             // 摩擦系数
    estimatedEndSpeed: PHYSICS.MAX_SPEED * Math.pow(friction, (revealDuration / (1000 / 60))),
  };
};
