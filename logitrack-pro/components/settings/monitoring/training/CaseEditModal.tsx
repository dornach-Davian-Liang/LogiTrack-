/**
 * CaseEditModal — 创建 / 编辑训练案例的弹窗表单
 *
 * 替代 AITraining.tsx 里的 prompt() 调用，提供规范的 Modal UI：
 * - 标题、markdown_text（可折叠预览）、correction_note、status
 */
import React, { useState } from 'react';
import { X, Save, Loader, Eye, EyeOff } from 'lucide-react';

interface CaseFormData {
  title: string;
  markdown_text: string;
  correction_note: string;
  status: 'active' | 'draft' | 'archived';
}

interface Props {
  mode: 'create' | 'edit';
  initialData?: Partial<CaseFormData>;
  onSave: (data: CaseFormData) => Promise<void>;
  onClose: () => void;
}

const CaseEditModal: React.FC<Props> = ({ mode, initialData, onSave, onClose }) => {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [markdownText, setMarkdownText] = useState(
    initialData?.markdown_text ??
      '### 训练案例\n\n**邮件内容：**\n```\nSubject: \nFrom: \n\n（粘贴邮件正文）\n```\n\n**期望 AI 输出：**\n```json\n{\n  "is_inquiry": true,\n  "transport_mode": "SEA",\n  "branch_code": "SHA"\n}\n```'
  );
  const [correctionNote, setCorrectionNote] = useState(initialData?.correction_note ?? '');
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>(initialData?.status ?? 'active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) { setError('请填写标题'); return; }
    if (!correctionNote.trim()) { setError('请填写纠正说明'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({ title: title.trim(), markdown_text: markdownText, correction_note: correctionNote.trim(), status });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <h2 className="font-semibold text-gray-900">
            {mode === 'create' ? '➕ 新建训练案例' : '✏️ 编辑训练案例'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* 表单内容（可滚动） */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* 标题 */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例：Chile SEA 路由应走 SHA+NGB，不只是 SHA"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          {/* Markdown 内容 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600">
                案例内容（Markdown）
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(p => !p)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
              >
                {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                {showPreview ? '编辑' : '预览'}
              </button>
            </div>
            {showPreview ? (
              <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 min-h-[140px] text-sm text-gray-700 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                {markdownText || <span className="text-gray-400 italic">（无内容）</span>}
              </div>
            ) : (
              <textarea
                rows={8}
                value={markdownText}
                onChange={e => setMarkdownText(e.target.value)}
                placeholder="粘贴邮件示例 + 期望的 AI 输出..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-y"
              />
            )}
          </div>

          {/* 纠正说明 */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              纠正说明 <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={correctionNote}
              onChange={e => setCorrectionNote(e.target.value)}
              placeholder="说明 AI 为什么判断错误、正确的判断依据是什么..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* 状态 */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">状态</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as 'active' | 'draft' | 'archived')}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="active">✅ Active（生效）</option>
              <option value="draft">📝 Draft（草稿）</option>
              <option value="archived">🗄 Archived（归档）</option>
            </select>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-gray-200 bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            取消
          </button>
          <button
            disabled={saving}
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? '保存中...' : mode === 'create' ? '创建案例' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseEditModal;
