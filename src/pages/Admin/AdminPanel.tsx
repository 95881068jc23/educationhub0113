import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { StoredUser, AuditStatus } from '../../types/auth';
import { Shield, CheckCircle, XCircle, Clock, User as UserIcon, Mail, Calendar, Loader2 } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, getAllUsers, auditUser } = useAuth();
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 检查是否为管理员
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/home', { replace: true });
      return;
    }
    loadUsers();
  }, [user, navigate]);

  const loadUsers = (): void => {
    try {
      const allUsers = getAllUsers();
      // 按注册时间倒序排列
      const sortedUsers = [...allUsers].sort((a, b) => 
        new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      );
      setUsers(sortedUsers);
    } catch (error) {
      console.error('加载用户列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudit = async (userId: string, status: AuditStatus): Promise<void> => {
    if (processingId) return; // 防止重复点击
    
    setProcessingId(userId);
    try {
      auditUser(userId, status);
      // 重新加载用户列表
      loadUsers();
    } catch (error) {
      console.error('审核失败:', error);
      alert(error instanceof Error ? error.message : '审核失败，请稍后重试');
    } finally {
      setProcessingId(null);
    }
  };

  const getAuditStatusBadge = (status: AuditStatus): React.ReactElement => {
    switch (status) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            已通过
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            已拒绝
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            待审核
          </span>
        );
    }
  };

  const getRoleBadge = (role: string): React.ReactElement => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
          <Shield className="w-3 h-3" />
          管理员
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
        <UserIcon className="w-3 h-3" />
        普通用户
      </span>
    );
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-4" />
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-brand-600" />
                管理员后台
              </h1>
              <p className="text-slate-600 mt-1">用户审核与管理</p>
            </div>
            <button
              onClick={() => navigate('/home')}
              className="px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors font-medium"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-600 mb-1">总用户数</div>
            <div className="text-2xl font-bold text-slate-900">{users.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-600 mb-1">待审核</div>
            <div className="text-2xl font-bold text-yellow-600">
              {users.filter((u) => u.auditStatus === 0).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-600 mb-1">已通过</div>
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.auditStatus === 1).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-600 mb-1">已拒绝</div>
            <div className="text-2xl font-bold text-red-600">
              {users.filter((u) => u.auditStatus === 2).length}
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">用户列表</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    用户信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    审核状态
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      暂无用户数据
                    </td>
                  </tr>
                ) : (
                  users.map((userItem) => (
                    <tr key={userItem.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-brand-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{userItem.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <Mail className="w-3 h-3" />
                              {userItem.email}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">@{userItem.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(userItem.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDate(userItem.createTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getAuditStatusBadge(userItem.auditStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {userItem.role !== 'admin' && (
                          <div className="flex items-center justify-end gap-2">
                            {userItem.auditStatus !== 1 && (
                              <button
                                onClick={() => handleAudit(userItem.id, 1)}
                                disabled={processingId === userItem.id}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                              >
                                {processingId === userItem.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    处理中
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    通过
                                  </>
                                )}
                              </button>
                            )}
                            {userItem.auditStatus !== 2 && (
                              <button
                                onClick={() => handleAudit(userItem.id, 2)}
                                disabled={processingId === userItem.id}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                              >
                                {processingId === userItem.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    处理中
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3" />
                                    拒绝
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
