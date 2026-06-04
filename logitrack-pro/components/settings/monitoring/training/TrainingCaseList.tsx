import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Plus, Search } from 'lucide-react';
import { monitorPyApi, TrainingCase } from '../../../../services/monitorApi';
import CaseDetailPanel from './CaseDetailPanel';

interface Props {
  /** 外部触发刷新（保存案例后递增） */
  refreshTick?: number;
  /** 点击「新增案例」按钮 */
  onAddCase?: () => void;
  /** 点击「编辑」按钮 */
  onEditCase?: (c: TrainingCase) => void;
}

const TrainingCaseList: React.FC<Props> = ({ refreshTick = 0, onAddCase, onEditCase }) => {
  const [cases, setCases] = useState<TrainingCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [keyword, setKeyword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await monitorPyApi.listTrainingCases();
      setCases(res.cases);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshTick]);

  const handleToggle = async (id: string) => {
    try {
      await monitorPyApi.toggleTrainingCase(id);
      setCases(prev => prev.map(c =>
        c.id === id
          ? { ...c, status: c.status === 'active' ? 'paused' : 'active' }
          : c
      ));
    } catch (e: unknown) {
      alert('操作失败: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await monitorPyApi.deleteTrainingCase(id);
      setCases(prev => prev.filter(c => c.id !== id));
    } catch (e: unknown) {
      alert('删除失败: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const filtered = cases.filter(c => {
    if (filter === 'active' && c.status !== 'active') return false;
    if (filter === 'paused' && c.status !== 'paused') return false;
    if (keyword) {
      const kw = keyword.toLowerCase();
      return c.title.toLowerCase().includes(kw) ||
        c.correction_note?.toLowerCase().includes(kw) ||
        c.markdown_text?.toLowerCase().includes(kw);
    }
    return true;
  });

  const activeCount = cases.filter(c => c.status === 'active').length;
  const pausedCount = cases.filter(c => c.status === 'paused').length;

  return (
    <div className="space-y-3">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 搜索 */}
        <div className="relative flex-1 min-w-40">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="搜索案例标题或说明..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        {/* 状态筛选 */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
          {(['all', 'active', 'paused'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? `全部 (${cases.length})` :
               f === 'active' ? `活跃 (${activeCount})` :
               `暂停 (${pausedCount})`}
            </button>
          ))}
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          title="刷新"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>

        {onAddCase && (
          <button
            onClick={onAddCase}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={13} /> 新增案例
          </button>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          加载失败: {error}
        </div>
      )}

      {/* 案例列表 */}
      {!error && filtered.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400">
          {cases.length === 0
            ? '暂无训练案例 — 点击「新增案例」开始添加'
            : '没有匹配的案例'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <CaseDetailPanel
              key={c.id}
              caseItem={c}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={onEditCase ?? (() => {})}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainingCaseList;
