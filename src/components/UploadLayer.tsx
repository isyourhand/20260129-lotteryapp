// src/components/UploadLayer.tsx
// 文件上传层组件

import React from "react";

interface Props {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const UploadLayer: React.FC<Props> = ({ onUpload }) => (
  <div
    className="upload-layer"
    style={{
      color: "white",
      textAlign: "center",
      paddingTop: "20vh",
      position: "relative",
      zIndex: 200,
    }}
  >
    <h1>导入数据启动系统</h1>
    <input type="file" accept=".xlsx,.xls" onChange={onUpload} />
  </div>
);
