// src/main.tsx (或者 index.tsx)
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx"; // 确保这里引入了 App
import "./styles/main.css"; // 引入你的样式（如果有）

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
