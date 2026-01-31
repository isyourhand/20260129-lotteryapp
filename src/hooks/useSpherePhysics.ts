// src/hooks/useSpherePhysics.ts
import { useEffect, useRef, type RefObject } from "react";
import type { LotteryState } from "../types";
import { PHYSICS } from "../config/physics";

export const useSpherePhysics = (
  containerRef: RefObject<HTMLDivElement | null>,
  status: LotteryState,
  dynamicFriction: number // <--- 新增参数
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
        // 空闲状态：使用配置的插值系数平滑回到 IDLE_SPEED
        const lerp = PHYSICS.IDLE_LERP_FACTOR;
        state.velocity = state.velocity * (1 - lerp) + PHYSICS.IDLE_SPEED * lerp;
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
