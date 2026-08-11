import { useState } from 'react';
import { Search, UserPlus, Edit, Trash2, Shield, User as UserIcon } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
  createdAt: string;
  lastLogin: string;
}

const mockUsers: User[] = [
  {
    id: 'user_001',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-01 10:00:00',
    lastLogin: '2026-04-23 09:30:00',
  },
  {
    id: 'user_002',
    username: 'user',
    email: 'user@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2026-02-15 14:20:00',
    lastLogin: '2026-04-22 16:45:00',
  },
  {
    id: 'user_003',
    username: 'zhang_san',
    email: 'zhangsan@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2026-03-10 11:00:00',
    lastLogin: '2026-04-20 10:15:00',
  },
  {
    id: 'user_004',
    username: 'li_si',
    email: 'lisi@example.com',
    role: 'user',
    status: 'disabled',
    createdAt: '2026-03-20 15:30:00',
    lastLogin: '2026-04-10 14:00:00',
  },
];

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = users.filter((user) => {
    if (roleFilter !== 'all' && user.role !== roleFilter) return false;
    if (searchText && !user.username.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const getRoleBadge = (role: string) => {
    return role === 'admin'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-blue-100 text-blue-700';
  };

  const getRoleText = (role: string) => {
    return role === 'admin' ? '管理员' : '普通用户';
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? '启用' : '禁用';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">用户管理</h2>
          <p className="text-sm text-gray-600 mt-1">
            管理系统用户和权限配置
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4" />
          添加用户
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">总用户数</p>
              <p className="text-xl font-semibold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">管理员</p>
              <p className="text-xl font-semibold text-gray-900">
                {users.filter((u) => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">活跃用户</p>
              <p className="text-xl font-semibold text-gray-900">
                {users.filter((u) => u.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">禁用用户</p>
              <p className="text-xl font-semibold text-gray-900">
                {users.filter((u) => u.status === 'disabled').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索用户名..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">全部角色</option>
              <option value="admin">管理员</option>
              <option value="user">普通用户</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  用户ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  用户名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  邮箱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  最后登录
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 text-xs rounded-full ${getRoleBadge(user.role)}`}>
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 text-xs rounded-full ${getStatusBadge(user.status)}`}>
                      {getStatusText(user.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mt-0.5">
            i
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">权限说明</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>管理员</strong>：拥有全部功能权限，包括算法管理、流程管理、用户管理等</li>
              <li>• <strong>普通用户</strong>：仅可访问数据看板、API接口列表和图谱应用</li>
            </ul>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddUserModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

function AddUserModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">添加用户</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
            <input
              type="text"
              placeholder="请输入用户名"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
            <input
              type="email"
              placeholder="请输入邮箱"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">初始密码</label>
            <input
              type="password"
              placeholder="请输入初始密码"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            添加
          </button>
        </div>
      </div>
    </div>
  );
}
