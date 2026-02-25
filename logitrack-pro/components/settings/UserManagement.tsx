import React, { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, ShieldCheck, ShieldOff, KeyRound, Pencil, X, Eye, EyeOff } from 'lucide-react';
import { settingsApi, UserItem, RoleOption } from '../../services/settingsApi';

interface PasswordRevealState {
  username: string;
  password: string;
}

const DEFAULT_FORM = {
  username: '',
  fullName: '',
  email: '',
  phone: '',
  roleCode: '',
  password: '',
  isActive: true,
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordReveal, setPasswordReveal] = useState<PasswordRevealState | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await settingsApi.getUsers(includeInactive);
      setUsers(response || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await settingsApi.getRoles();
      setRoles(response || []);
    } catch (err) {
      console.warn('[UserManagement] Failed to load roles', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [includeInactive]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return users;
    }
    return users.filter((user) => {
      return (
        user.username.toLowerCase().includes(keyword) ||
        user.fullName?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword)
      );
    });
  }, [users, search]);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm({ ...DEFAULT_FORM, roleCode: roles[0]?.roleCode || '' });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserItem) => {
    const roleCode = user.roleCodes?.[0] || roles[0]?.roleCode || '';
    setEditingUser(user);
    setForm({
      username: user.username,
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      roleCode,
      password: '',
      isActive: user.isActive,
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setForm(DEFAULT_FORM);
  };

  const handleSave = async () => {
    if (!form.username || !form.fullName || !form.roleCode) {
      setError('请填写用户名、姓名和角色');
      return;
    }
    if (!editingUser && !form.password) {
      setError('请设置初始密码');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, any> = {
        fullName: form.fullName,
        email: form.email || null,
        phone: form.phone || null,
        isActive: form.isActive,
        roleCodes: [form.roleCode],
      };

      if (!editingUser) {
        payload.username = form.username;
        payload.password = form.password;
        await settingsApi.createUser(payload);
      } else {
        if (form.password) {
          payload.password = form.password;
        }
        await settingsApi.updateUser(editingUser.id, payload);
      }

      closeModal();
      fetchUsers();
    } catch (err: any) {
      setError(err?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (user: UserItem) => {
    if (!window.confirm(`确认禁用用户 ${user.username} 吗？`)) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await settingsApi.deleteUser(user.id);
      fetchUsers();
    } catch (err: any) {
      setError(err?.message || '禁用失败');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (user: UserItem) => {
    setLoading(true);
    setError(null);
    try {
      await settingsApi.updateUser(user.id, { isActive: true });
      fetchUsers();
    } catch (err: any) {
      setError(err?.message || '启用失败');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (user: UserItem) => {
    if (!window.confirm(`确认重置 ${user.username} 的密码吗？`)) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await settingsApi.resetUserPassword(user.id);
      setPasswordReveal({
        username: user.username,
        password: response.temporaryPassword,
      });
    } catch (err: any) {
      setError(err?.message || '重置失败');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let value = '';
    for (let i = 0; i < 12; i += 1) {
      value += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    setForm({ ...form, password: value });
    setShowPassword(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👥 用户管理</h1>
          <p className="text-gray-500 mt-1">创建、编辑用户并管理权限</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="ml-2">刷新</span>
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus size={16} />
            <span className="ml-2">新增用户</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          className="w-64 rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="搜索用户名/姓名/邮箱"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
          />
          显示已禁用用户
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">用户名</th>
              <th className="px-4 py-3 text-left font-semibold">姓名</th>
              <th className="px-4 py-3 text-left font-semibold">邮箱</th>
              <th className="px-4 py-3 text-left font-semibold">角色</th>
              <th className="px-4 py-3 text-left font-semibold">状态</th>
              <th className="px-4 py-3 text-left font-semibold">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="bg-white">
                <td className="px-4 py-3 font-medium text-gray-900">{user.username}</td>
                <td className="px-4 py-3 text-gray-700">{user.fullName}</td>
                <td className="px-4 py-3 text-gray-600">{user.email || '-'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {(user.roleNames && user.roleNames.join(', ')) ||
                    (user.roleCodes && user.roleCodes.join(', ')) ||
                    '-'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      user.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {user.isActive ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil size={14} />
                      编辑
                    </button>
                    {user.isActive ? (
                      <button
                        onClick={() => handleDeactivate(user)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        <ShieldOff size={14} />
                        禁用
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(user)}
                        className="inline-flex items-center gap-1 rounded-md border border-green-200 px-2 py-1 text-xs text-green-700 hover:bg-green-50"
                      >
                        <ShieldCheck size={14} />
                        启用
                      </button>
                    )}
                    <button
                      onClick={() => handleResetPassword(user)}
                      className="inline-flex items-center gap-1 rounded-md border border-indigo-200 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50"
                    >
                      <KeyRound size={14} />
                      重置密码
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredUsers.length && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  暂无用户数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingUser ? '编辑用户' : '新增用户'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">用户名</label>
                <input
                  type="text"
                  disabled={!!editingUser}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                  value={form.username}
                  onChange={(event) => setForm({ ...form, username: event.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">姓名</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={form.fullName}
                  onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">邮箱</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">电话</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">角色</label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={form.roleCode}
                  onChange={(event) => setForm({ ...form, roleCode: event.target.value })}
                >
                  <option value="">请选择角色</option>
                  {roles.map((role) => (
                    <option key={role.roleCode} value={role.roleCode}>
                      {role.roleName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">密码</label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm"
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-2 flex items-center text-gray-500"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="rounded-md border border-indigo-200 px-3 py-2 text-xs text-indigo-600 hover:bg-indigo-50"
                  >
                    生成密码
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">重置或新增时可以生成临时密码，并在此处查看。</p>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                />
                启用账号
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordReveal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">临时密码</h2>
              <button
                onClick={() => setPasswordReveal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              用户 {passwordReveal.username} 的新密码如下，请立即保存并告知用户。
            </p>
            <div className="mt-4 rounded-md border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">
              {passwordReveal.password}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setPasswordReveal(null)}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
