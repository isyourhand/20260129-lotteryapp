// src/hooks/useAudio.ts
// 音效控制 Hook

import { useCallback, useEffect, useRef, useState } from "react";
import AudioService from "../services/audio";
import { bgMusic } from "../services/backgroundMusic";

/**
 * 音效控制 Hook
 */
export const useAudio = () => {
  const [isMuted, setIsMuted] = useState(() => {
    // 从 localStorage 读取静音状态
    const saved = localStorage.getItem("lottery_audio_muted");
    return saved ? JSON.parse(saved) : false;
  });

  const [volume, setVolumeState] = useState(() => {
    // 从 localStorage 读取音量
    const saved = localStorage.getItem("lottery_audio_volume");
    return saved ? parseFloat(saved) : 0.5;
  });

  const isInitializedRef = useRef(false);

  // 初始化音频设置
  useEffect(() => {
    AudioService.setMuted(isMuted);
    AudioService.setVolume(volume);
  }, []);

  // 保存设置到 localStorage，并同步静音状态到音频服务
  useEffect(() => {
    localStorage.setItem("lottery_audio_muted", JSON.stringify(isMuted));
    AudioService.setMuted(isMuted);
    bgMusic.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem("lottery_audio_volume", volume.toString());
    AudioService.setVolume(volume);
  }, [volume]);

  /**
   * 初始化音频（必须在用户交互后调用）
   */
  const initAudio = useCallback(() => {
    if (!isInitializedRef.current) {
      AudioService.init();
      isInitializedRef.current = true;
    }
  }, []);

  /**
   * 切换静音
   */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    // 首次点击时初始化音频
    initAudio();
  }, [initAudio]);

  /**
   * 设置音量
   */
  const setVolume = useCallback(
    (v: number) => {
      setVolumeState(Math.max(0, Math.min(1, v)));
      initAudio();
    },
    [initAudio]
  );

  // 音效播放函数已移除，现使用 MP3 背景音乐替代

  return {
    // 状态
    isMuted,
    volume,
    // 控制
    initAudio,
    toggleMute,
    setVolume,
    // 音效播放（已移除，使用 MP3 背景音乐替代）
  };
};

export default useAudio;
