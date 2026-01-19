import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { StoredUser, AuditStatus, UserIdentity, UserRole } from '../../types/auth';
import { getUserLogs, getUserFiles, deleteUserFile, formatFileSize, type UserFile } from '../../services/storageService';
import { Shield, CheckCircle, XCircle, Clock, User as UserIcon, Mail, Calendar, Loader2, UserCog, GraduationCap, FileText, X, Filter, Folder, Download, Trash2, Music, Image, File, Users, Search } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, getAllUsers, auditUser, updateUserIdentity, updateUserRole, updateUserScope } = useAuth();
  const [allUsers, setAllUsers] = useState<StoredUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<StoredUser[]>([]);
  const [filterStatus, setFilterStatus] = useState<AuditStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<string>('all');
  const [selectedUserFiles, setSelectedUserFiles] = useState<string | null>(null);
  const [userFiles, setUserFiles] = useState<UserFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'audio' | 'image' | 'document'>('all');
  
  // Scope Management State
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [selectedScopeUsers, setSelectedScopeUsers] = useState<string[]>([]);
  const [scopeSearchTerm, setScopeSearchTerm] = useState('');

  // 检查是否为管理员或分级管理员
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'tiered_admin')) {
      navigate('/home', { replace: true });
      return;
    }
    loadUsers();
  }, [user, navigate]);

  const loadUsers = async (): Promise<void> => {
    try {
      const fetchedUsers = await getAllUsers();
      
      let displayUsers = fetchedUsers;
      
      // 如果是分级管理员，只显示其管理的用户
      if (user?.role === 'tiered_admin') {
        const managedUserIds = user.managedUsers || [];
        displayUsers = fetchedUsers.filter(u => managedUserIds.includes(u.id));
      } else {
        // 超级管理员可以看到所有用户
        // 过滤掉超级管理员自己（可选，但通常保留以便查看列表）
      }
      
      // 按注册时间倒序排列
      const sortedUsers = [...displayUsers].sort((a, b) => {
        const timeA = new Date(a.createTime || a.createdAt || 0).getTime();
        const timeB = new Date(b.createTime || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setAllUsers(sortedUsers);
      applyFilter(sortedUsers, filterStatus);
    } catch (error) {
      console.error('加载用户列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = (users: StoredUser[], status: AuditStatus | 'all'): void => {
    if (status === 'all') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter((u) => u.auditStatus === status));
    }
  };

  // 当过滤状态改变时，重新应用过滤
  useEffect(() => {
    applyFilter(allUsers, filterStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, allUsers]);

  // 检查用户是否已分配身份
  const hasIdentityAssigned = (userIdentity: UserIdentity): boolean => {
    if (!userIdentity) return false;
    if (typeof userIdentity === 'string') return true;
    if (Array.isArray(userIdentity)) return userIdentity.length > 0;
    return false;
  };

  const handleAudit = async (userId: string, status: AuditStatus): Promise<void> => {
    if (processingId) return; // 防止重复点击
    
    // 如果是要通过审核（status === 1），必须先检查是否已分配身份
    if (status === 1) {
      const targetUser = allUsers.find((u) => u.id === userId);
      if (targetUser && !hasIdentityAssigned(targetUser.identity ?? null)) {
        alert('请先为用户分配身份（顾问身份或教师身份），然后才能通过审核。');
        return;
      }
    }
    
    setProcessingId(userId);
    try {
      await auditUser(userId, status);
      // 重新加载用户列表
      await loadUsers();
    } catch (error) {
      console.error('审核失败:', error);
      alert(error instanceof Error ? error.message : '审核失败，请稍后重试');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateIdentity = async (userId: string, identity: UserIdentity): Promise<void> => {
    if (processingId) return;
    
    setProcessingId(userId);
    try {
      await updateUserIdentity(userId, identity);
      // 重新加载用户列表
      await loadUsers();
    } catch (error) {
      console.error('更新身份失败:', error);
      alert(error instanceof Error ? error.message : '更新身份失败，请稍后重试');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (processingId) return;
    if (!confirm(`确定要将用户角色更改为 ${newRole === 'admin' ? '超级管理员' : newRole === 'tiered_admin' ? '分级管理员' : '普通用户'} 吗？`)) {
      return;
    }

    setProcessingId(userId);
    try {
      await updateUserRole(userId, newRole);
      await loadUsers();
    } catch (error) {
      console.error('更新角色失败:', error);
      alert('更新角色失败');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenScopeModal = (adminId: string) => {
    const adminUser = allUsers.find(u => u.id === adminId);
    if (!adminUser) return;
    setEditingAdminId(adminId);
    setSelectedScopeUsers(adminUser.managedUsers || []);
    setScopeModalOpen(true);
    setScopeSearchTerm('');
  };

  const handleCloseScopeModal = () => {
    setScopeModalOpen(false);
    setEditingAdminId(null);
    setSelectedScopeUsers([]);
  };

  const handleSaveScope = async () => {
    if (!editingAdminId) return;
    try {
      await updateUserScope(editingAdminId, selectedScopeUsers);
      await loadUsers();
      handleCloseScopeModal();
      alert('管理范围已更新');
    } catch (error) {
      console.error('更新管理范围失败:', error);
      alert('更新管理范围失败');
    }
  };

  const handleToggleScopeUser = (targetUserId: string) => {
    setSelectedScopeUsers(prev => {
      if (prev.includes(targetUserId)) {
        return prev.filter(id => id !== targetUserId);
      } else {
        return [...prev, targetUserId];
      }
    });
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
    if (role === 'tiered_admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
          <Users className="w-3 h-3" />
          分级管理员
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

  const getIdentityBadges = (identity: UserIdentity): React.ReactElement[] => {
    // 兼容旧数据：如果是字符串，转换为数组
    let identities: ('consultant' | 'teacher')[] = [];
    if (identity) {
      if (typeof identity === 'string') {
        identities = [identity];
      } else if (Array.isArray(identity)) {
        identities = identity;
      }
    }

    if (identities.length === 0) {
      return [
        <span key="none" className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          <UserIcon className="w-3 h-3" />
          未分配
        </span>
      ];
    }

    return identities.map((id) => {
      if (id === 'consultant') {
        return (
          <span key="consultant" className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <UserCog className="w-3 h-3" />
            顾问身份
          </span>
        );
      }
      if (id === 'teacher') {
        return (
          <span key="teacher" className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <GraduationCap className="w-3 h-3" />
            教师身份
          </span>
        );
      }
      return null;
    }).filter(Boolean) as React.ReactElement[];
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

  // 查看用户操作日志
  const handleViewLogs = async (userId: string) => {
    setSelectedUserId(userId);
    setIsLoadingLogs(true);
    try {
      const logs = await getUserLogs(userId, undefined, 200);
      setUserLogs(logs);
    } catch (error) {
      console.error('获取操作日志失败:', error);
      alert('获取操作日志失败，请稍后重试');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // 关闭日志模态框
  const handleCloseLogs = () => {
    setSelectedUserId(null);
    setUserLogs([]);
    setLogFilter('all');
  };

  // 查看用户文件列表
  const handleViewFiles = async (userId: string) => {
    setSelectedUserFiles(userId);
    setIsLoadingFiles(true);
    try {
      const files = await getUserFiles(userId, fileTypeFilter === 'all' ? undefined : fileTypeFilter);
      setUserFiles(files);
    } catch (error) {
      console.error('获取文件列表失败:', error);
      alert('获取文件列表失败，请稍后重试');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // 关闭文件模态框
  const handleCloseFiles = () => {
    setSelectedUserFiles(null);
    setUserFiles([]);
    setFileTypeFilter('all');
  };

  // 下载文件
  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 删除文件
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`确定要删除文件 "${fileName}" 吗？此操作无法撤销。`)) {
      return;
    }

    try {
      await deleteUserFile(fileId);
      // 重新加载文件列表
      if (selectedUserFiles) {
        await handleViewFiles(selectedUserFiles);
      }
      alert('文件删除成功');
    } catch (error) {
      console.error('删除文件失败:', error);
      alert(error instanceof Error ? error.message : '删除文件失败，请稍后重试');
    }
  };

  // 获取文件类型图标
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'audio':
        return <Music className="w-4 h-4 text-purple-600" />;
      case 'image':
        return <Image className="w-4 h-4 text-blue-600" />;
      case 'document':
        return <File className="w-4 h-4 text-green-600" />;
      default:
        return <File className="w-4 h-4 text-slate-600" />;
    }
  };

  // 获取文件类型标签
  const getFileTypeLabel = (fileType: string): string => {
    const labels: Record<string, string> = {
      audio: '音频',
      image: '图片',
      document: '文档',
    };
    return labels[fileType] || fileType;
  };

  // 当文件类型筛选改变时，重新加载文件列表
  useEffect(() => {
    if (selectedUserFiles) {
      setIsLoadingFiles(true);
      getUserFiles(selectedUserFiles, fileTypeFilter === 'all' ? undefined : fileTypeFilter)
        .then(files => {
          setUserFiles(files);
        })
        .catch(error => {
          console.error('获取文件列表失败:', error);
          alert('获取文件列表失败，请稍后重试');
        })
        .finally(() => {
          setIsLoadingFiles(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileTypeFilter, selectedUserFiles]);

  // 过滤文件列表
  const filteredFiles = fileTypeFilter === 'all' 
    ? userFiles 
    : userFiles.filter(file => file.file_type === fileTypeFilter);

  // 获取操作类型的中文名称
  const getActionTypeLabel = (actionType: string): string => {
    const labels: Record<string, string> = {
      login: '登录',
      register: '注册',
      upload_audio: '上传录音',
      chat_message: '发送消息',
      logout: '退出登录',
    };
    return labels[actionType] || actionType;
  };

  // 获取操作类型的颜色
  const getActionTypeColor = (actionType: string): string => {
    const colors: Record<string, string> = {
      login: 'bg-blue-100 text-blue-700',
      register: 'bg-green-100 text-green-700',
      upload_audio: 'bg-purple-100 text-purple-700',
      chat_message: 'bg-indigo-100 text-indigo-700',
      logout: 'bg-gray-100 text-gray-700',
    };
    return colors[actionType] || 'bg-slate-100 text-slate-700';
  };

  // 过滤日志
  const filteredLogs = logFilter === 'all' 
    ? userLogs 
    : userLogs.filter(log => log.action_type === logFilter);

  // 获取所有操作类型（用于筛选）
  const actionTypes = Array.from(new Set(userLogs.map(log => log.action_type)));

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
          <button
            onClick={() => setFilterStatus('all')}
            className={`bg-white rounded-lg shadow-sm border p-4 text-left transition-all hover:shadow-md cursor-pointer ${
              filterStatus === 'all' ? 'border-brand-500 ring-2 ring-brand-200' : 'border-slate-200'
            }`}
          >
            <div className="text-sm text-slate-600 mb-1">总用户数</div>
            <div className="text-2xl font-bold text-slate-900">{allUsers.length}</div>
          </button>
          <button
            onClick={() => setFilterStatus(0)}
            className={`bg-white rounded-lg shadow-sm border p-4 text-left transition-all hover:shadow-md cursor-pointer ${
              filterStatus === 0 ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-slate-200'
            }`}
          >
            <div className="text-sm text-slate-600 mb-1">待审核</div>
            <div className="text-2xl font-bold text-yellow-600">
              {allUsers.filter((u) => u.auditStatus === 0).length}
            </div>
          </button>
          <button
            onClick={() => setFilterStatus(1)}
            className={`bg-white rounded-lg shadow-sm border p-4 text-left transition-all hover:shadow-md cursor-pointer ${
              filterStatus === 1 ? 'border-green-500 ring-2 ring-green-200' : 'border-slate-200'
            }`}
          >
            <div className="text-sm text-slate-600 mb-1">已通过</div>
            <div className="text-2xl font-bold text-green-600">
              {allUsers.filter((u) => u.auditStatus === 1).length}
            </div>
          </button>
          <button
            onClick={() => setFilterStatus(2)}
            className={`bg-white rounded-lg shadow-sm border p-4 text-left transition-all hover:shadow-md cursor-pointer ${
              filterStatus === 2 ? 'border-red-500 ring-2 ring-red-200' : 'border-slate-200'
            }`}
          >
            <div className="text-sm text-slate-600 mb-1">已拒绝</div>
            <div className="text-2xl font-bold text-red-600">
              {allUsers.filter((u) => u.auditStatus === 2).length}
            </div>
          </button>
        </div>

        {/* User List */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              用户列表
              {filterStatus !== 'all' && (
                <span className="ml-2 text-sm font-normal text-slate-500">
                  ({filteredUsers.length} 个用户)
                </span>
              )}
            </h2>
            {filterStatus !== 'all' && (
              <button
                onClick={() => setFilterStatus('all')}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium"
              >
                清除筛选
              </button>
            )}
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
                    身份
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      {allUsers.length === 0 ? '暂无用户数据' : `没有${filterStatus === 0 ? '待审核' : filterStatus === 1 ? '已通过' : '已拒绝'}的用户`}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((userItem) => (
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
                        <div className="flex flex-col gap-2">
                          <div>{getRoleBadge(userItem.role)}</div>
                          {user?.role === 'admin' && userItem.id !== user.id && (
                            <div className="flex flex-col gap-2 mt-1">
                              <select
                                value={userItem.role}
                                onChange={(e) => handleRoleChange(userItem.id, e.target.value as UserRole)}
                                className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                                disabled={processingId === userItem.id}
                              >
                                <option value="user">普通用户</option>
                                <option value="tiered_admin">分级管理员</option>
                                <option value="admin">超级管理员</option>
                              </select>
                              {userItem.role === 'tiered_admin' && (
                                <button
                                  onClick={() => handleOpenScopeModal(userItem.id)}
                                  className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                >
                                  <Users className="w-3 h-3" />
                                  管理范围
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-1">
                            {getIdentityBadges(userItem.identity ?? null)}
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-600 font-medium">分配身份：</label>
                            <div className="flex flex-col gap-1">
                              <label className="flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={(() => {
                                    const id = userItem.identity;
                                    if (!id) return false;
                                    if (typeof id === 'string') return id === 'consultant';
                                    return Array.isArray(id) && id.includes('consultant');
                                  })()}
                                  onChange={(e) => {
                                    const currentIdentity = userItem.identity;
                                    let identities: ('consultant' | 'teacher')[] = [];
                                    
                                    // 兼容旧数据
                                    if (currentIdentity) {
                                      if (typeof currentIdentity === 'string') {
                                        identities = [currentIdentity];
                                      } else if (Array.isArray(currentIdentity)) {
                                        identities = [...currentIdentity];
                                      }
                                    }
                                    
                                    if (e.target.checked) {
                                      if (!identities.includes('consultant')) {
                                        identities.push('consultant');
                                      }
                                    } else {
                                      identities = identities.filter((id) => id !== 'consultant');
                                    }
                                    
                                    const newIdentity: UserIdentity = identities.length > 0 ? identities : null;
                                    handleUpdateIdentity(userItem.id, newIdentity);
                                  }}
                                  disabled={processingId === userItem.id}
                                  className="w-3 h-3 text-brand-600 rounded focus:ring-brand-500 disabled:opacity-50"
                                />
                                <span className="text-slate-700">顾问身份</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={(() => {
                                    const id = userItem.identity;
                                    if (!id) return false;
                                    if (typeof id === 'string') return id === 'teacher';
                                    return Array.isArray(id) && id.includes('teacher');
                                  })()}
                                  onChange={(e) => {
                                    const currentIdentity = userItem.identity;
                                    let identities: ('consultant' | 'teacher')[] = [];
                                    
                                    // 兼容旧数据
                                    if (currentIdentity) {
                                      if (typeof currentIdentity === 'string') {
                                        identities = [currentIdentity];
                                      } else if (Array.isArray(currentIdentity)) {
                                        identities = [...currentIdentity];
                                      }
                                    }
                                    
                                    if (e.target.checked) {
                                      if (!identities.includes('teacher')) {
                                        identities.push('teacher');
                                      }
                                    } else {
                                      identities = identities.filter((id) => id !== 'teacher');
                                    }
                                    
                                    const newIdentity: UserIdentity = identities.length > 0 ? identities : null;
                                    handleUpdateIdentity(userItem.id, newIdentity);
                                  }}
                                  disabled={processingId === userItem.id}
                                  className="w-3 h-3 text-brand-600 rounded focus:ring-brand-500 disabled:opacity-50"
                                />
                                <span className="text-slate-700">教师身份</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDate(userItem.createTime || userItem.createdAt || '')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getAuditStatusBadge(userItem.auditStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {userItem.role !== 'admin' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewLogs(userItem.id)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                              title="查看操作记录"
                            >
                              <FileText className="w-3 h-3" />
                              日志
                            </button>
                            <button
                              onClick={() => handleViewFiles(userItem.id)}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                              title="查看文件列表"
                            >
                              <Folder className="w-3 h-3" />
                              文件
                            </button>
                            {userItem.auditStatus !== 1 && (
                              <button
                                onClick={() => handleAudit(userItem.id, 1)}
                                disabled={processingId === userItem.id || !hasIdentityAssigned(userItem.identity ?? null)}
                                className={`px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
                                  !hasIdentityAssigned(userItem.identity ?? null)
                                    ? 'bg-slate-400 hover:bg-slate-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed'
                                }`}
                                title={!hasIdentityAssigned(userItem.identity ?? null) ? '请先分配身份才能通过审核' : ''}
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

      {/* 操作日志模态框 */}
      {selectedUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* 模态框头部 */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  用户操作记录
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {allUsers.find(u => u.id === selectedUserId)?.name || selectedUserId}
                </p>
              </div>
              <button
                onClick={handleCloseLogs}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* 筛选器 */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">筛选：</span>
                </div>
                <button
                  onClick={() => setLogFilter('all')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    logFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  全部
                </button>
                {actionTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setLogFilter(type)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      logFilter === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {getActionTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>

            {/* 日志列表 */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingLogs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                  <span className="ml-2 text-slate-600">加载中...</span>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  {userLogs.length === 0 ? '暂无操作记录' : '没有符合条件的操作记录'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLogs.map((log, index) => (
                    <div
                      key={log.id || index}
                      className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getActionTypeColor(log.action_type)}`}>
                            {getActionTypeLabel(log.action_type)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                      </div>
                      {log.action_details && Object.keys(log.action_details).length > 0 && (
                        <div className="mt-2 text-sm text-slate-700">
                          <details className="cursor-pointer">
                            <summary className="text-slate-600 hover:text-slate-900 font-medium">
                              查看详情
                            </summary>
                            <pre className="mt-2 p-3 bg-white rounded border border-slate-200 text-xs overflow-x-auto">
                              {JSON.stringify(log.action_details, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                      {log.ip_address && (
                        <div className="mt-2 text-xs text-slate-500">
                          IP: {log.ip_address}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 模态框底部 */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  共 {filteredLogs.length} 条记录
                </span>
                <button
                  onClick={handleCloseLogs}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors font-medium"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 文件列表模态框 */}
      {selectedUserFiles && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            {/* 模态框头部 */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-purple-600" />
                  用户文件列表
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {allUsers.find(u => u.id === selectedUserFiles)?.name || selectedUserFiles}
                </p>
              </div>
              <button
                onClick={handleCloseFiles}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* 筛选器 */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">筛选：</span>
                </div>
                <button
                  onClick={() => setFileTypeFilter('all')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    fileTypeFilter === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setFileTypeFilter('audio')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    fileTypeFilter === 'audio'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Music className="w-3 h-3" />
                  音频
                </button>
                <button
                  onClick={() => setFileTypeFilter('image')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    fileTypeFilter === 'image'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Image className="w-3 h-3" />
                  图片
                </button>
                <button
                  onClick={() => setFileTypeFilter('document')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    fileTypeFilter === 'document'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <File className="w-3 h-3" />
                  文档
                </button>
              </div>
            </div>

            {/* 文件列表 */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingFiles ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                  <span className="ml-2 text-slate-600">加载中...</span>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  {userFiles.length === 0 ? '暂无文件' : '没有符合条件的文件'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1">
                          {getFileTypeIcon(file.file_type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-slate-900 truncate">
                                {file.file_name}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                file.file_type === 'audio' ? 'bg-purple-100 text-purple-700' :
                                file.file_type === 'image' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {getFileTypeLabel(file.file_type)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                              <span>{formatFileSize(file.file_size)}</span>
                              <span>{formatDate(file.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {file.file_type === 'audio' && (
                            <audio
                              controls
                              src={file.file_url}
                              className="h-8 w-64"
                              preload="none"
                            >
                              您的浏览器不支持音频播放
                            </audio>
                          )}
                          {file.file_type === 'image' && (
                            <img
                              src={file.file_url}
                              alt={file.file_name}
                              className="h-16 w-16 object-cover rounded border border-slate-200"
                              loading="lazy"
                            />
                          )}
                          <button
                            onClick={() => handleDownloadFile(file.file_url, file.file_name)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            title="下载文件"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file.id, file.file_name)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            title="删除文件"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-400 truncate">
                        {file.file_url}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 模态框底部 */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  共 {filteredFiles.length} 个文件
                  {fileTypeFilter !== 'all' && ` (${userFiles.length} 个总计)`}
                </span>
                <button
                  onClick={handleCloseFiles}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors font-medium"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 管理范围设置模态框 */}
      {scopeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                管理范围设置
              </h2>
              <button onClick={handleCloseScopeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索用户..."
                  value={scopeSearchTerm}
                  onChange={(e) => setScopeSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {allUsers
                  .filter(u => u.id !== editingAdminId && u.role !== 'admin') // Exclude self and super admins
                  .filter(u => 
                    u.name.toLowerCase().includes(scopeSearchTerm.toLowerCase()) || 
                    u.email.toLowerCase().includes(scopeSearchTerm.toLowerCase())
                  )
                  .map(u => (
                    <label key={u.id} className="flex items-center p-3 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedScopeUsers.includes(u.id)}
                        onChange={() => handleToggleScopeUser(u.id)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {u.role === 'tiered_admin' ? '分级管理员' : '普通用户'}
                      </div>
                    </label>
                  ))}
                  {allUsers.filter(u => u.id !== editingAdminId && u.role !== 'admin').length === 0 && (
                    <div className="text-center py-8 text-slate-500">暂无用户可分配</div>
                  )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={handleCloseScopeModal}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSaveScope}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
