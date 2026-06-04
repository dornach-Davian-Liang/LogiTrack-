import React, { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, ShieldCheck, ShieldOff, KeyRound, Pencil, X, Eye, EyeOff } from 'lucide-react';
import { settingsApi, UserItem, RoleOption } from '../../services/settingsApi';
import { masterDataApi } from '../../services/api';
import type { SelectOption } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

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
  cnOfficeCodes: [] as string[],
};

const UserManagement: React.FC = () => {
  const { translations: t } = useLanguage();
  const um = t.settings.userManagement;
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [cnOfficeOptions, setCnOfficeOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [search, setSearch] = useState('');
  const [showOfficeDropdown, setShowOfficeDropdown] = useState(false);

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

  const fetchCnOffices = async () => {
    try {
      const response = await masterDataApi.getCnOffices();
      setCnOfficeOptions(response || []);
    } catch (err) {
      console.warn('[UserManagement] Failed to load CN offices', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchCnOffices();
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
    setShowOfficeDropdown(false);
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
      cnOfficeCodes: user.cnOfficeCodes ? [...user.cnOfficeCodes] : [],
    });
    setShowOfficeDropdown(false);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setShowOfficeDropdown(false);
    setForm(DEFAULT_FORM);
  };

  const handleSave = async () => {
    if (!form.username || !form.fullName || !form.roleCode) {
      setError(um.errors.requiredFields);
      return;
    }
    if (!editingUser && !form.password) {
      setError(um.errors.passwordRequired);
      return;
    }
    if (form.cnOfficeCodes.length === 0) {
      setError(um.errors.cnOfficeRequired);
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
        cnOfficeCodes: form.cnOfficeCodes,
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
      setError(err?.message || um.errors.saveFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (user: UserItem) => {
    if (!window.confirm(um.confirm.disable.replace('{{username}}', user.username))) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await settingsApi.deleteUser(user.id);
      fetchUsers();
    } catch (err: any) {
      setError(err?.message || um.errors.disableFailed);
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
      setError(err?.message || um.errors.enableFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (user: UserItem) => {
    if (!window.confirm(um.confirm.resetPassword.replace('{{username}}', user.username))) {
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
      setError(err?.message || um.errors.resetFailed);
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
          <h1 className="text-2xl font-bold text-gray-900">{um.title}</h1>
          <p className="text-gray-500 mt-1">{um.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="ml-2">{um.refresh}</span>
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus size={16} />
            <span className="ml-2">{um.createUser}</span>
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
          placeholder={um.searchPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
          />
          {um.showInactive}
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">{um.tableHeaders.username}</th>
              <th className="px-4 py-3 text-left font-semibold">{um.tableHeaders.fullName}</th>
              <th className="px-4 py-3 text-left font-semibold">{um.tableHeaders.email}</th>
              <th className="px-4 py-3 text-left font-semibold">{um.tableHeaders.role}</th>
              <th className="px-4 py-3 text-left font-semibold">{um.tableHeaders.cnOffice}</th>
              <th className="px-4 py-3 text-left font-semibold">{um.tableHeaders.status}</th>
              <th className="px-4 py-3 text-left font-semibold">{um.tableHeaders.actions}</th>
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
                <td className="px-4 py-3 text-gray-600 max-w-xs">
                  {user.cnOfficeCodes && user.cnOfficeCodes.length > 0
                    ? user.cnOfficeCodes.join(', ')
                    : <span className="text-amber-500 text-xs">{um.unassigned}</span>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      user.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {user.isActive ? um.statusActive : um.statusInactive}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil size={14} />
                      {um.actions.edit}
                    </button>
                    {user.isActive ? (
                      <button
                        onClick={() => handleDeactivate(user)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        <ShieldOff size={14} />
                        {um.actions.disable}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(user)}
                        className="inline-flex items-center gap-1 rounded-md border border-green-200 px-2 py-1 text-xs text-green-700 hover:bg-green-50"
                      >
                        <ShieldCheck size={14} />
                        {um.actions.enable}
                      </button>
                    )}
                    <button
                      onClick={() => handleResetPassword(user)}
                      className="inline-flex items-center gap-1 rounded-md border border-indigo-200 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50"
                    >
                      <KeyRound size={14} />
                      {um.actions.resetPassword}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredUsers.length && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  {um.noData}
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
                {editingUser ? um.modal.editTitle : um.modal.createTitle}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{um.form.username}</label>
                <input
                  type="text"
                  disabled={!!editingUser}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                  value={form.username}
                  onChange={(event) => setForm({ ...form, username: event.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{um.form.fullName}</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={form.fullName}
                  onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{um.form.email}</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{um.form.phone}</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{um.form.role}</label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={form.roleCode}
                  onChange={(event) => setForm({ ...form, roleCode: event.target.value })}
                >
                  <option value="">{um.form.rolePlaceholder}</option>
                  {roles.map((role) => (
                    <option key={role.roleCode} value={role.roleCode}>
                      {role.roleName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700">
                  {um.form.cnOffice} <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowOfficeDropdown(!showOfficeDropdown)}
                  className={`mt-1 w-full text-left rounded-md border px-3 py-2 text-sm ${
                    form.cnOfficeCodes.length > 0 ? 'bg-indigo-50 border-indigo-300' : 'border-gray-300'
                  }`}
                >
                  {form.cnOfficeCodes.length === 0
                    ? um.form.cnOfficePlaceholder
                    : form.cnOfficeCodes.join(', ')}
                </button>
                {showOfficeDropdown && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {cnOfficeOptions.map((o) => {
                      const val = String(o.value);
                      return (
                        <label
                          key={val}
                          className="flex items-center px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={form.cnOfficeCodes.includes(val)}
                            onChange={(ev) => {
                              if (ev.target.checked) {
                                setForm({ ...form, cnOfficeCodes: [...form.cnOfficeCodes, val] });
                              } else {
                                setForm({ ...form, cnOfficeCodes: form.cnOfficeCodes.filter((c) => c !== val) });
                              }
                            }}
                            className="mr-2 rounded border-gray-300 text-indigo-600"
                          />
                          {o.label}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{um.form.password}</label>
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
                    {um.form.generatePassword}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">{um.passwordReveal.warning}</p>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                />
                {um.statusActive}
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordReveal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{um.passwordReveal.title}</h2>
              <button
                onClick={() => setPasswordReveal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              {um.passwordReveal.usernameLabel}: {passwordReveal.username}<br/>{um.passwordReveal.warning}
            </p>
            <div className="mt-4 rounded-md border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">
              {passwordReveal.password}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setPasswordReveal(null)}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
              >
                {um.passwordReveal.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
