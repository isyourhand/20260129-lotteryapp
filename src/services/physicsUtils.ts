// src/services/physicsUtils.ts (新建或放在合适位置)

export const calculateDynamics = (winnerCount: number) => {
  // === 1. 时间配置 (需与 runVariableSpeedReveal 保持一致) ===
  const BASE_DELAY = 5000; // 基础间隔
  const SPAN = 2000; // 增量区间

  // === 2. 计算揭晓所有卡片需要的总时间 ===
  let totalTimeMs = 0;
  for (let i = 0; i < winnerCount; i++) {
    // 进度 0 -> 1
    const progress = i / (winnerCount || 1);
    // 这是第 i 张卡片翻开后，等待下一张的时间
    const delay = BASE_DELAY + progress * SPAN;
    totalTimeMs += delay;
  }

  // 加上最后的缓冲时间 (比如最后一张翻完还要停顿一下才弹窗)
  totalTimeMs += 500;

  // === 3. 反推物理摩擦系数 ===
  // 目标：在 totalTimeMs 内，将速度从 25 降到 0.2
  const fps = 60;
  const totalFrames = totalTimeMs / (1000 / fps);

  const startSpeed = 25; // PHYSICS.MAX_SPEED
  const endSpeed = 0.1; // PHYSICS.IDLE_SPEED

  // 公式: end = start * (friction ^ frames)
  // 变形: friction = (end / start) ^ (1 / frames)
  const ratio = endSpeed / startSpeed; // 0.008
  const friction = Math.pow(ratio, 1 / totalFrames);

  // 兜底：防止 NaN 或极端值 (比如只有1个人时，摩擦系数不能太离谱)
  // 通常 friction 会在 0.90 ~ 0.99 之间
  return Math.min(0.995, Math.max(0.85, friction));
};
