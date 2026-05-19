import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, Pause, Play, Edit2 } from 'lucide-react';
import { TrainingCase } from '../../../../services/monitorApi';

interface Props {
  caseItem: TrainingCase;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (caseItem: TrainingCase) => void;
}

const STATUS_STYLE = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-gray-100 text-gray-500',
};

const CaseDetailPanel: React.FC<Props> = ({ caseItem, onToggle, onDelete, onEdit }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${
      caseItem.status === 'active'
        ? 'border-green-200 bg-green-50/30'
        : 'border-gray-200 bg-gray-50/50 opacity-70'
    }`}>
      {/* 标题行 */}
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-white/60 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {expanded
          ? <ChevronDown size={14} className="text-gray-400 shrink-0" />
          : <ChevronRight size={14} className="text-gray-400 shrink-0" />
        }

        <span className="font-medium text-sm text-gray-800 flex-1 truncate">
          {caseItem.title}
        </span>

        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[caseItem.status]}`}>
          {caseItem.status === 'active' ? '活跃' : '暂停'}
        </span>

        <span className="text-xs text-gray-400 ml-2 shrink-0">
          {caseItem.created_at?.substring(0, 10)}
        </span>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onEdit(caseItem)}
            className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
            title="编辑"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onToggle(caseItem.id)}
            className="p-1 text-gray-400 hover:text-amber-600 rounded transition-colors"
            title={caseItem.status === 'active' ? '暂停' : '恢复'}
          >
            {caseItem.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <button
            onClick={() => {
              if (window.confirm(`确定删除训练案例「${caseItem.title}」？`)) {
                onDelete(caseItem.id);
              }
            }}
            className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
            title="删除"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* 展开详情 */}
      {expanded && (
        <div className="border-t border-gray-200 bg-white px-4 py-3 space-y-3">
          {caseItem.correction_note && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">📝 纠正说明</div>
              <div className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded px-3 py-2">
                {caseItem.correction_note}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">📄 Few-shot 内容</div>
            <pre className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2 overflow-auto max-h-60 whitespace-pre-wrap leading-relaxed">
              {caseItem.markdown_text}
            </pre>
          </div>
          {caseItem.updated_at && (
            <div className="text-xs text-gray-400">
              最后更新: {caseItem.updated_at.replace('T', ' ').substring(0, 19)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaseDetailPanel;
