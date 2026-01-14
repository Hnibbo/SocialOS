import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PerformanceMonitor } from "@/lib/utils/performance";

// Initialize performance monitoring
PerformanceMonitor.init();

// Global error handling
window.onerror = (message, source, lineno, colno, error) => {
    PerformanceMonitor.reportError(error || (message as string), { source, lineno, colno });
};

window.onunhandledrejection = (event) => {
    PerformanceMonitor.reportError(`Unhandled Rejection: ${event.reason}`);
};

createRoot(document.getElementById("root")!).render(<App />);
