// src/App.tsx
// 主应用组件 - 新版：支持自由选择奖池和抽取数量

import React, { useCallback } from "react";
import { useLotteryGame } from "./hooks/useLottery";
import { useAnimationConfig } from "./hooks/useAnimationConfig";
import { useAudio } from "./hooks/useAudio";
import { LotteryPanel } from "./components/LotteryPanel";
import { WinnerModal } from "./components/WinnerModal";
import { Sidebar } from "./components/Sidebar";
import { UploadLayer } from "./components/UploadLayer";
import "./styles/main.css";

const App: React.FC = () => {
  // 同步动画配置到 CSS 变量
  useAnimationConfig();

  const audio = useAudio();
  const g = useLotteryGame();

  // 处理静音切换
  const handleToggleMute = useCallback(() => {
    audio.toggleMute();
  }, [audio]);

  // 包装上传函数
  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      g.uploadFile(e);
    },
    [g.uploadFile]
  );

  // 如果没有文件，显示上传层
  if (!g.hasFile) {
    return (
      <div className="container">
        <UploadLayer onUpload={handleUpload} />
      </div>
    );
  }

  // 抽奖进行中时隐藏侧边栏
  const isRolling = g.status === "rolling" || g.status === "revealing";

  return (
    <div className="container">
      {/* 彩带飘落特效 */}
      <div className="ribbon-container">
        <div className="ribbon ribbon--gold" />
        <div className="ribbon ribbon--red" />
        <div className="ribbon ribbon--blue" />
        <div className="ribbon ribbon--purple" />
        <div className="ribbon ribbon--pink" />
        <div className="ribbon ribbon--green" />
        <div className="ribbon ribbon--gold" />
        <div className="ribbon ribbon--red" />
        <div className="ribbon ribbon--blue" />
        <div className="ribbon ribbon--purple" />
        <div className="ribbon ribbon--pink" />
        <div className="ribbon ribbon--green" />
        <div className="ribbon ribbon--gold" />
        <div className="ribbon ribbon--red" />
        <div className="ribbon ribbon--blue" />
        <div className="ribbon ribbon--purple" />
        <div className="ribbon ribbon--pink" />
        <div className="ribbon ribbon--green" />
        <div className="ribbon ribbon--gold" />
        <div className="ribbon ribbon--red" />
        <div className="ribbon ribbon--blue" />
        <div className="ribbon ribbon--purple" />
        <div className="ribbon ribbon--pink" />
        <div className="ribbon ribbon--green" />
        <div className="ribbon ribbon--gold" />
        <div className="ribbon ribbon--red" />
        <div className="ribbon ribbon--blue" />
        <div className="ribbon ribbon--purple" />
        <div className="ribbon ribbon--pink" />
        <div className="ribbon ribbon--green" />
      </div>
      {!isRolling && (
        <Sidebar
          prizePools={g.prizePools}
          selectedPool={g.selectedPool}
          drawCount={g.drawCount}
          maxDrawCount={g.maxDrawCount}
          history={g.history}
          canStart={g.canStart}
          onSelectPool={g.selectPool}
          onSetDrawCount={g.setDrawQuantity}
          onStart={g.start}
          onExport={g.downloadResults}
          onReset={g.clearAllData}
          isMuted={audio.isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      <LotteryPanel
        pool={g.pool}
        lotteryState={g.status}
        currentWinners={g.winners}
        friction={g.friction}
        isFirstPrize={g.result?.isFirstPrize ?? false}
      />

      <WinnerModal
        isOpen={!!g.result}
        poolName={g.result?.poolName ?? ""}
        winners={g.result?.winners ?? []}
        isFirstPrize={g.result?.isFirstPrize ?? false}
        onClose={g.reset}
      />
    </div>
  );
};

export default App;
