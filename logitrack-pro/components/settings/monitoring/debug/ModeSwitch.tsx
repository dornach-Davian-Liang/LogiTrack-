import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { monitorPyApi } from '../../../../services/monitorApi';

interface Props {
  currentMode: string | null;
  onModeChanged?: (mode: string) => void;
}

const MODE_CONFIG = {
  DRY_RUN: {
    label: '🟢 DRY-RUN',
    desc: '只分析，不转发，不标记已读',
    activeCls: 'bg-green-600 text-white border-green-600',
    hoverCls: 'hover:bg-green-50 hover:border-green-400 text-green-700',
  },
  TEST_FORWARD: {
    label: '🟡 TEST-FORWARD',
    desc: '转发到测试邮箱，不标记已读',
    activeCls: 'bg-yellow-500 text-white border-yellow-500',
    hoverCls: 'hover:bg-yellow-50 hover:border-yellow-400 text-yellow-700',
  },
  LIVE: {
    label: '🔴 LIVE',
    desc: '真实转发到客户，标记已读',
    activeCls: 'bg-red-600 text-white border-red-600',
    hoverCls: 'hover:bg-red-50 hover:border-red-400 text-red-700',
  },
};

const ModeSwitch: React.FC<Props> = ({ currentMode, onModeChanged }) => {
  const [pending, setPending] = useState<string | null>(null);
  const [testMailbox, setTestMailbox] = useState('');
  const [showLiveConfirm, setShowLiveConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pyOffline, setPyOffline] = useState(false);

  // 检测 Python API 是否在线
  useEffect(() => {
    monitorPyApi.getStatus()
      .then(() => setPyOffline(false))
      .catch(() => setPyOffline(true));
  }, []);

  const doSwitch = async (mode: string, mailbox?: string) => {
    setLoading(true);
    setMessage(null);
    try {
      await monitorPyApi.switchMode(mode, mailbox);
      setMessage({ type: 'ok', text: `已切换到 ${mode}` });
      onModeChanged?.(mode);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessage({ type: 'err', text: `切换失败: ${msg}` });
    } finally {
      setLoading(false);
      setShowLiveConfirm(false);
      setPending(null);
    }
  };

  const handleClick = (mode: string) => {
    if (mode === currentMode) return;
    if (mode === 'LIVE') {
      setPending(mode);
      setShowLiveConfirm(true);
    } else {
      doSwitch(mode, mode === 'TEST_FORWARD' ? testMailbox : undefined);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-gray-700">运行模式切换</div>

      {pyOffline && (
        <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
          ⚠️ Python 监控 API 不在线，模式切换不可用（需启动 email-ai-automation 服务）
        </div>
      )}

      {/* 三个模式按钮 */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(MODE_CONFIG) as [string, typeof MODE_CONFIG.DRY_RUN][]).map(([mode, cfg]) => {
          const isActive = currentMode === mode;
          return (
            <button
              key={mode}
              onClick={() => handleClick(mode)}
              disabled={loading || pyOffline}
              className={`flex-1 min-w-[130px] px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all
                ${isActive ? cfg.activeCls : `border-gray-200 ${cfg.hoverCls}`}
                disabled:opacity-40`}
            >
              <div>{cfg.label}</div>
              <div className={`text-xs mt-0.5 ${isActive ? 'opacity-80' : 'text-gray-400'}`}>
                {isActive ? '【当前】' : cfg.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* TEST_FORWARD 邮箱输入 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 whitespace-nowrap">TEST 邮箱:</span>
        <input
          type="email"
          placeholder="test@example.com（TEST-FORWARD 模式使用）"
          value={testMailbox}
          onChange={e => setTestMailbox(e.target.value)}
          className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      {/* 操作结果提示 */}
      {message && (
        <div className={`text-sm rounded px-3 py-2 ${
          message.type === 'ok'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* LIVE 确认弹窗 */}
      {showLiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl border border-red-200 p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={22} />
              <div>
                <div className="font-semibold text-gray-800 mb-1">⚠️ 切换到 LIVE 模式</div>
                <p className="text-sm text-gray-600">
                  LIVE 模式将<strong>真实转发邮件到客户</strong>，并<strong>标记邮件为已读</strong>。
                  请确认您已准备好投入生产运行。
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowLiveConfirm(false); setPending(null); }}
                className="px-4 py-2 rounded border border-gray-200 text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => doSwitch('LIVE')}
                disabled={loading}
                className="px-4 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? '切换中...' : '确认切换到 LIVE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModeSwitch;
