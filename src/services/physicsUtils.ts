// src/services/physicsUtils.ts

/**
 * 计算物理摩擦系数，使球体在 reveal 阶段结束时恰好降到最慢速度
 * 与 useLottery.ts 中的 reveal 函数时间保持同步
 */
export const calculateDynamics = (winnerCount: number) => {
  // === 1. 与 useLottery.ts reveal 函数保持一致的时间配置 ===
  const BASE_DELAY = 500; // 基础间隔 (ms)
  const SPAN = 800; // 增量区间 (ms)

  // === 2. 计算揭晓所有卡片需要的总时间 ===
  // reveal 函数中的延迟公式: delay = 500 + (idx / ws.length) * 800
  let totalTimeMs = 0;
  for (let i = 0; i < winnerCount; i++) {
    // 注意：idx 从 0 开始，所以第 i 个人对应的 progress = i / winnerCount
    const progress = i / winnerCount;
    const delay = BASE_DELAY + progress * SPAN;
    totalTimeMs += delay;
  }

  // 加上最后的缓冲时间 (最后一张翻完到弹窗的时间)
  totalTimeMs += 1000;

  // === 3. 反推物理摩擦系数 ===
  // 目标：在 totalTimeMs 内，将速度从 MAX_SPEED 降到 IDLE_SPEED
  const fps = 60;
  const totalFrames = totalTimeMs / (1000 / fps);

  // 与 useSpherePhysics.ts 保持一致
  const startSpeed = 5; // MAX_SPEED
  const endSpeed = 0.05; // IDLE_SPEED

  // 公式: end = start * (friction ^ frames)
  // 变形: friction = (end / start) ^ (1 / frames)
  const ratio = endSpeed / startSpeed; // 0.25
  const friction = Math.pow(ratio, 1 / totalFrames);

  // 兜底：防止 NaN 或极端值
  // 人数越多，摩擦系数越接近 1 (减速越慢)
  // 人数越少，摩擦系数越小 (减速越快)
  return Math.min(0.995, Math.max(0.9, friction));
};
