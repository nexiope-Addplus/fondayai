import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// 런타임 에러를 화면에 표시하기 위한 핸들러
window.onerror = (msg, url, lineNo, columnNo, error) => {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:50px;left:10px;right:10px;background:white;color:red;padding:15px;border:3px solid red;z-index:10001;font-size:12px;white-space:pre-wrap;word-break:break-all;';
  div.innerText = `[Runtime Error]\nMessage: ${msg}\nAt: ${url}:${lineNo}:${columnNo}`;
  document.body.appendChild(div);
  return false;
};

createRoot(document.getElementById("root")!).render(<App />);
