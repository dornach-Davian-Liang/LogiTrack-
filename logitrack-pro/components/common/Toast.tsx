import React, { useEffect, useCallback, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

// ==========================================
// Toast 通知类型
// ==========================================
export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number; // 自动关闭毫秒数，默认 4000
}

// ==========================================
// Toast 组件
// ==========================================
const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const config = {
    success: {
      containerClass: 'bg-green-50 border-green-300',
      textClass: 'text-green-800',
      titleClass: 'text-green-900',
      title: '操作成功',
      icon: <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />,
    },
    error: {
      containerClass: 'bg-red-50 border-red-300',
      textClass: 'text-red-700',
      titleClass: 'text-red-900',
      title: '操作失败',
      icon: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />,
    },
    warning: {
      containerClass: 'bg-yellow-50 border-yellow-300',
      textClass: 'text-yellow-700',
      titleClass: 'text-yellow-900',
      title: '警告',
      icon: <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />,
    },
  };

  const c = config[type];

  return (
    <>
      <style>{`
        @keyframes _toast_slideIn {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0);    }
        }
      `}</style>
      <div
        className={`fixed top-6 right-6 z-[200] flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm w-full ${c.containerClass}`}
        style={{ animation: '_toast_slideIn 0.25s ease-out' }}
      >
      {c.icon}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${c.titleClass}`}>{c.title}</p>
        <p className={`text-sm mt-0.5 break-words ${c.textClass}`}>{message}</p>
      </div>
      <button
        onClick={onClose}
        className={`flex-shrink-0 ml-1 ${c.textClass} opacity-70 hover:opacity-100 transition-opacity`}
        aria-label="关闭"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
    </>
  );
};

export default Toast;

// ==========================================
// useToast hook - 在组件中管理 toast 状态
// ==========================================
export interface ToastState {
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, closeToast };
}

// ==========================================
// 工具函数：从 API 错误中提取可读的错误信息
// 后端 Spring Boot 通常返回格式: {"status":400,"message":"xxx","error":"..."}
// ==========================================
export function parseApiError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    // 格式: "API Error: 400 - {"message":"xxx",...}"
    const match = err.message.match(/API Error: \d+ - ([\s\S]*)/);
    if (match) {
      const rawText = match[1].trim();
      try {
        const json = JSON.parse(rawText);
        // 优先取 message，其次 error，最后 fallback
        return json.message || json.error || fallback;
      } catch {
        // 不是 JSON，直接返回文本（截断过长内容）
        return rawText.length > 200 ? rawText.substring(0, 200) + '...' : rawText || fallback;
      }
    }
    return err.message || fallback;
  }
  return fallback;
}
