// src/hooks/useSpherePhysics.ts
import { useEffect, useRef, type RefObject } from "react";
import type { LotteryState } from "../types";

// 物理配置
const PHYSICS = {
  IDLE_SPEED: 0.5, // 空闲时的慢速旋转
  MAX_SPEED: 5, // 抽奖时的最高速度
  ACCELERATION: 0.8, // 加速度
};

export const useSpherePhysics = (
  containerRef: RefObject<HTMLDivElement | null>,
  status: LotteryState,
  dynamicFriction: number, // <--- 新增参数
) => {
  const physicsState = useRef({
    angle: 0,
    velocity: PHYSICS.IDLE_SPEED,
  });

  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const loop = () => {
      const state = physicsState.current;

      if (status === "rolling") {
        if (state.velocity < PHYSICS.MAX_SPEED) {
          state.velocity += PHYSICS.ACCELERATION;
        }
      } else if (status === "revealing") {
        // 使用动态计算的摩擦系数，让速度自然下降到 IDLE_SPEED
        state.velocity *= dynamicFriction;
        // 确保速度不会低于 IDLE_SPEED（避免在最后降得太慢）
        if (state.velocity < PHYSICS.IDLE_SPEED) {
          state.velocity = PHYSICS.IDLE_SPEED;
        }
      } else {
        state.velocity = state.velocity * 0.9 + PHYSICS.IDLE_SPEED * 0.1;
      }

      state.angle = (state.angle + state.velocity) % 360;

      if (containerRef.current) {
        containerRef.current.style.transform = `rotateY(${state.angle}deg)`;
      }

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);

    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [status, dynamicFriction]); // <--- 依赖项加入 dynamicFriction
};
