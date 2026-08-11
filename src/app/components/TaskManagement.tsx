import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, RefreshCw, FileText, X } from 'lucide-react';

type TaskTab = 'training' | 'deployment';

const trainingTasks = [
  {
    id: 'TRAIN_20260419_001',
    algorithmName: '实体抽取算法',
    version: 'v2.3.1',
    initiator: '张三',
    startTime: '2026-04-19 09:00:00',
    endTime: '2026-04-19 11:30:00',
    status: '成功',
    result: 'F1: 92.5%',
  },
  {
    id: 'TRAIN_20260418_002',
    algorithmName: '关系抽取算法',
    version: 'v1.5.2',
    initiator: '李四',
    startTime: '2026-04-18 14:00:00',
    endTime: '2026-04-18 16:45:00',
    status: '成功',
    result: 'F1: 88.3%',
  },
  {
    id: 'TRAIN_20260417_003',
    algorithmName: '实体抽取算法',
    version: 'v2.3.0',
    initiator: '王五',
    startTime: '2026-04-17 10:00:00',
    endTime: null,
    status: '运行中',
    result: '-',
  },
  {
    id: 'TRAIN_20260416_004',
    algorithmName: '实体消歧算法',
    version: 'v3.1.0',
    initiator: '赵六',
    startTime: '2026-04-16 08:00:00',
    endTime: '2026-04-16 09:15:00',
    status: '失败',
    result: '-',
  },
];

const deploymentTasks = [
  {
    id: 'DEPLOY_20260419_001',
    algorithmName: '实体抽取算法',
    version: 'v2.3.1',
    serviceUrl: 'http://api.example.com/entity-extract',
    status: '运行中',
    progress: 68,
    createdAt: '2026-04-19 12:00:00',
    updatedAt: '2026-04-19 12:00:00',
    apiEntry: '/api/algorithm/entity-extract',
  },
  {
    id: 'DEPLOY_20260418_002',
    algorithmName: '关系抽取算法',
    version: 'v1.5.2',
    serviceUrl: 'http://api.example.com/relation-extract',
    status: '运行中',
    progress: 43,
    createdAt: '2026-04-18 17:00:00',
    updatedAt: '2026-04-18 17:00:00',
    apiEntry: '/api/algorithm/relation-extract',
  },
  {
    id: 'DEPLOY_20260417_003',
    algorithmName: '实体消歧算法',
    version: 'v3.1.0',
    serviceUrl: '-',
    status: '失败',
    progress: 0,
    createdAt: '2026-04-17 15:00:00',
    updatedAt: '2026-04-17 15:30:00',
    apiEntry: '-',
  },
];

export function TaskManagement() {
  const [activeTab, setActiveTab] = useState<TaskTab>('training');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [taskIdSearch, setTaskIdSearch] = useState('');
  const [algorithmTypeFilter, setAlgorithmTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [selectedLog, setSelectedLog] = useState('');
  const [showTrainingDetail, setShowTrainingDetail] = useState(false);
  const [showDeploymentDetail, setShowDeploymentDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // 运行中部署任务的进度动画
  const [deployProgress, setDeployProgress] = useState<Record<string, number>>(() =>
    Object.fromEntries(deploymentTasks.map((t) => [t.id, t.progress]))
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setDeployProgress((prev) => {
        const next = { ...prev };
        deploymentTasks.forEach((t) => {
          if (t.status === '运行中' && next[t.id] < 99) {
            next[t.id] = Math.min(next[t.id] + Math.random() * 0.4, 99);
          }
        });
        return next;
      });
    }, 800);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // 获取所有唯一的算法类型
  const algorithmTypes = useMemo(() => {
    const types = new Set<string>();
    trainingTasks.forEach(task => types.add(task.algorithmName));
    deploymentTasks.forEach(task => types.add(task.algorithmName));
    return Array.from(types);
  }, []);

  // 过滤任务
  const filteredTrainingTasks = useMemo(() => {
    return trainingTasks.filter(task => {
      // 任务ID精确搜索
      if (taskIdSearch && !task.id.toLowerCase().includes(taskIdSearch.toLowerCase())) {
        return false;
      }

      // 通用搜索（任务ID、算法名称、发起人）
      if (searchText && !(
        task.id.toLowerCase().includes(searchText.toLowerCase()) ||
        task.algorithmName.toLowerCase().includes(searchText.toLowerCase()) ||
        task.initiator.toLowerCase().includes(searchText.toLowerCase())
      )) {
        return false;
      }

      // 状态筛选
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // 算法类型筛选
      if (algorithmTypeFilter !== 'all' && task.algorithmName !== algorithmTypeFilter) {
        return false;
      }

      // 时间区间筛选
      if (startDate && task.startTime < startDate) {
        return false;
      }

      if (endDate && task.startTime > endDate + ' 23:59:59') {
        return false;
      }

      return true;
    });
  }, [searchText, statusFilter, taskIdSearch, algorithmTypeFilter, startDate, endDate]);

  const filteredDeploymentTasks = useMemo(() => {
    return deploymentTasks.filter(task => {
      // 任务ID精确搜索
      if (taskIdSearch && !task.id.toLowerCase().includes(taskIdSearch.toLowerCase())) {
        return false;
      }

      // 通用搜索（任务ID、算法名称）
      if (searchText && !(
        task.id.toLowerCase().includes(searchText.toLowerCase()) ||
        task.algorithmName.toLowerCase().includes(searchText.toLowerCase())
      )) {
        return false;
      }

      // 状态筛选
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // 算法类型筛选
      if (algorithmTypeFilter !== 'all' && task.algorithmName !== algorithmTypeFilter) {
        return false;
      }

      // 时间区间筛选
      if (startDate && task.createdAt < startDate) {
        return false;
      }

      if (endDate && task.createdAt > endDate + ' 23:59:59') {
        return false;
      }

      return true;
    });
  }, [searchText, statusFilter, taskIdSearch, algorithmTypeFilter, startDate, endDate]);

  const clearFilters = () => {
    setSearchText('');
    setTaskIdSearch('');
    setStatusFilter('all');
    setAlgorithmTypeFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const handleViewLog = (taskId: string) => {
    setSelectedLog(taskId);
    setShowLogDrawer(true);
  };

  const handleViewTrainingDetail = (task: any) => {
    setSelectedTask(task);
    setShowTrainingDetail(true);
  };

  const handleViewDeploymentDetail = (task: any) => {
    setSelectedTask(task);
    setShowDeploymentDetail(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '成功':
        return 'bg-green-100 text-green-700';
      case '运行中':
        return 'bg-blue-100 text-blue-700';
      case '失败':
        return 'bg-red-100 text-red-700';
      case '待执行':
        return 'bg-gray-100 text-gray-700';
      case '已取消':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">任务管理</h2>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 space-y-4">
          {/* 第一行：通用搜索 + 状态筛选 */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索任务ID、算法名称、发起人..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg min-w-[120px]"
            >
              <option value="all">全部状态</option>
              <option value="待执行">待执行</option>
              <option value="运行中">运行中</option>
              <option value="成功">成功</option>
              <option value="失败">失败</option>
              <option value="已取消">已取消</option>
            </select>
          </div>

          {/* 第二行：高级筛选标签 */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-600">筛选:</span>

            {/* 任务ID精搜 */}
            <div className="relative">
              <input
                type="text"
                placeholder="任务ID"
                value={taskIdSearch}
                onChange={(e) => setTaskIdSearch(e.target.value)}
                className="pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded-md w-48"
              />
              {taskIdSearch && (
                <button
                  onClick={() => setTaskIdSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 算法类型筛选 */}
            <select
              value={algorithmTypeFilter}
              onChange={(e) => setAlgorithmTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md"
            >
              <option value="all">全部算法类型</option>
              {algorithmTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* 开始时间 */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">开始时间:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md"
              />
            </div>

            {/* 结束时间 */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">结束时间:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md"
              />
            </div>

            {/* 清空筛选按钮 */}
            {(taskIdSearch || algorithmTypeFilter !== 'all' || startDate || endDate || searchText || statusFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <X className="w-3.5 h-3.5" />
                清空筛选
              </button>
            )}
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab('training')}
                className={`py-3 border-b-2 transition-colors ${
                  activeTab === 'training'
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                训练任务 ({filteredTrainingTasks.length})
              </button>
              <button
                onClick={() => setActiveTab('deployment')}
                className={`py-3 border-b-2 transition-colors ${
                  activeTab === 'deployment'
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                部署任务 ({filteredDeploymentTasks.length})
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'training' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    任务 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    算法名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    训练版本
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    发起人
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    开始时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    结束时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    评估结果
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTrainingTasks.length > 0 ? (
                  filteredTrainingTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.algorithmName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.version}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.initiator}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.startTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.endTime || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.result}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleViewLog(task.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          查看日志
                        </button>
                        <button
                          onClick={() => handleViewTrainingDetail(task)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          查看详情
                        </button>
                        {task.status === '失败' && (
                          <button className="text-orange-600 hover:text-orange-800">重试</button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      没有找到符合条件的训练任务
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    部署任务 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    算法名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    部署版本
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    服务地址
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    API 入口
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDeploymentTasks.length > 0 ? (
                  filteredDeploymentTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.algorithmName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.version}</td>
                      <td className="px-6 py-4 text-sm text-blue-600 max-w-xs truncate">
                        {task.serviceUrl}
                      </td>
                      <td className="px-6 py-4">
                        {task.status === '运行中' ? (
                          <div className="min-w-[140px]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-blue-700">部署中</span>
                              <span className="text-xs text-blue-600 font-mono">
                                {Math.floor(deployProgress[task.id] ?? 0)}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-700"
                                style={{ width: `${deployProgress[task.id] ?? 0}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className={`px-2 py-1 text-xs rounded ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.createdAt}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{task.apiEntry}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleViewDeploymentDetail(task)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          查看详情
                        </button>
                        <button className="text-blue-600 hover:text-blue-800">查看 API</button>
                        {task.status === '失败' && (
                          <button className="text-orange-600 hover:text-orange-800">重试部署</button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      没有找到符合条件的部署任务
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showLogDrawer && <LogDrawer taskId={selectedLog} onClose={() => setShowLogDrawer(false)} />}
      {showTrainingDetail && selectedTask && (
        <TrainingTaskDetail task={selectedTask} onClose={() => setShowTrainingDetail(false)} />
      )}
      {showDeploymentDetail && selectedTask && (
        <DeploymentTaskDetail task={selectedTask} onClose={() => setShowDeploymentDetail(false)} />
      )}
    </div>
  );
}

function TrainingTaskDetail({ task, onClose }: { task: any; onClose: () => void }) {
  const taskDetails = {
    dataset: 'medical_entities_training.jsonl',
    datasetSize: '45.2 MB',
    datasetRecords: 12500,
    epochs: 50,
    batchSize: 32,
    learningRate: 0.001,
    optimizer: 'Adam',
    validationSplit: 0.2,
    earlyStopping: 5,
    gpuType: 'NVIDIA V100 (16GB)',
    gpuCount: 1,
    maxLength: 256,
    hiddenSize: 256,
    numLayers: 2,
    dropout: 0.1,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">训练任务详情</h3>
              <p className="text-sm text-gray-600 mt-1">任务 ID: {task.id}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">基本信息</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">算法名称:</span>
                  <span className="text-gray-900 font-medium">{task.algorithmName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">训练版本:</span>
                  <span className="text-gray-900 font-medium">{task.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">发起人:</span>
                  <span className="text-gray-900 font-medium">{task.initiator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">任务状态:</span>
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    task.status === '成功' ? 'bg-green-100 text-green-700' :
                    task.status === '失败' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">时间信息</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">开始时间:</span>
                  <span className="text-gray-900 font-medium">{task.startTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">结束时间:</span>
                  <span className="text-gray-900 font-medium">{task.endTime || '运行中...'}</span>
                </div>
                {task.endTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">耗时:</span>
                    <span className="text-gray-900 font-medium">2小时30分钟</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">评估结果:</span>
                  <span className="text-gray-900 font-medium">{task.result}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">训练数据集</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">数据集名称:</span>
                <p className="text-blue-900 font-medium mt-1">{taskDetails.dataset}</p>
              </div>
              <div>
                <span className="text-blue-700">数据集大小:</span>
                <p className="text-blue-900 font-medium mt-1">{taskDetails.datasetSize}</p>
              </div>
              <div>
                <span className="text-blue-700">记录数:</span>
                <p className="text-blue-900 font-medium mt-1">{taskDetails.datasetRecords.toLocaleString()} 条</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">训练参数配置</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">训练轮数:</span>
                  <span className="text-gray-900 font-medium">{taskDetails.epochs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">批次大小:</span>
                  <span className="text-gray-900 font-medium">{taskDetails.batchSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">学习率:</span>
                  <span className="text-gray-900 font-medium">{taskDetails.learningRate}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">优化器:</span>
                  <span className="text-gray-900 font-medium">{taskDetails.optimizer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">验证集比例:</span>
                  <span className="text-gray-900 font-medium">{taskDetails.validationSplit * 100}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">早停轮数:</span>
                  <span className="text-gray-900 font-medium">{taskDetails.earlyStopping}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">最大长度:</span>
                  <span className="text-gray-900 font-medium">{taskDetails.maxLength}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">隐藏层大小:</span>
                  <span className="text-gray-900 font-medium">{taskDetails.hiddenSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dropout:</span>
                  <span className="text-gray-900 font-medium">{taskDetails.dropout}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">计算资源配置</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">GPU 类型:</span>
                <span className="text-gray-900 font-medium">{taskDetails.gpuType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GPU 数量:</span>
                <span className="text-gray-900 font-medium">{taskDetails.gpuCount} 个</span>
              </div>
            </div>
          </div>

          {task.status === '成功' && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="text-sm font-semibold text-green-900 mb-3">训练结果</h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-900">92.5%</div>
                  <div className="text-xs text-green-700 mt-1">F1-Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-900">93.2%</div>
                  <div className="text-xs text-green-700 mt-1">Precision</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-900">91.8%</div>
                  <div className="text-xs text-green-700 mt-1">Recall</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-900">0.08</div>
                  <div className="text-xs text-green-700 mt-1">Final Loss</div>
                </div>
              </div>
            </div>
          )}

          {task.status === '失败' && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h4 className="text-sm font-semibold text-red-900 mb-2">失败原因</h4>
              <p className="text-sm text-red-800">训练过程中出现 CUDA out of memory 错误。建议减小 batch_size 或使用更大显存的 GPU。</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

function DeploymentTaskDetail({ task, onClose }: { task: any; onClose: () => void }) {
  const deployDetails = {
    serviceName: 'entity-extraction-service',
    namespace: 'kg-algorithms',
    computeResource: 'GPU - T4 (4C8G)',
    replicas: 2,
    maxConcurrency: 10,
    requestTimeout: 30,
    autoScaling: true,
    minReplicas: 1,
    maxReplicas: 5,
    cpuThreshold: 70,
    memoryThreshold: 80,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">部署任务详情</h3>
              <p className="text-sm text-gray-600 mt-1">任务 ID: {task.id}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">基本信息</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">算法名称:</span>
                  <span className="text-gray-900 font-medium">{task.algorithmName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">部署版本:</span>
                  <span className="text-gray-900 font-medium">{task.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">服务名称:</span>
                  <span className="text-gray-900 font-medium">{deployDetails.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">命名空间:</span>
                  <span className="text-gray-900 font-medium">{deployDetails.namespace}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">部署状态:</span>
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    task.status === '运行中' ? 'bg-green-100 text-green-700' :
                    task.status === '失败' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">时间信息</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">创建时间:</span>
                  <span className="text-gray-900 font-medium">{task.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">更新时间:</span>
                  <span className="text-gray-900 font-medium">{task.updatedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">运行时长:</span>
                  <span className="text-gray-900 font-medium">5 天 3 小时</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">服务访问信息</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-blue-700">服务地址:</span>
                <p className="text-blue-900 font-medium font-mono mt-1">{task.serviceUrl}</p>
              </div>
              <div>
                <span className="text-blue-700">API 入口:</span>
                <p className="text-blue-900 font-medium font-mono mt-1">{task.apiEntry}</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">部署配置</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">计算资源:</span>
                  <span className="text-gray-900 font-medium">{deployDetails.computeResource}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">副本数量:</span>
                  <span className="text-gray-900 font-medium">{deployDetails.replicas} 个</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">最大并发数:</span>
                  <span className="text-gray-900 font-medium">{deployDetails.maxConcurrency}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">请求超时:</span>
                  <span className="text-gray-900 font-medium">{deployDetails.requestTimeout} 秒</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">自动扩缩容:</span>
                  <span className="text-gray-900 font-medium">{deployDetails.autoScaling ? '已启用' : '未启用'}</span>
                </div>
              </div>
            </div>
          </div>

          {deployDetails.autoScaling && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">自动扩缩容配置</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">最小副本数:</span>
                    <span className="text-gray-900 font-medium">{deployDetails.minReplicas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">最大副本数:</span>
                    <span className="text-gray-900 font-medium">{deployDetails.maxReplicas}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">CPU 阈值:</span>
                    <span className="text-gray-900 font-medium">{deployDetails.cpuThreshold}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">内存阈值:</span>
                    <span className="text-gray-900 font-medium">{deployDetails.memoryThreshold}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {task.status === '运行中' && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="text-sm font-semibold text-green-900 mb-3">服务健康状态</h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-900">2/2</div>
                  <div className="text-xs text-green-700 mt-1">健康副本</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-900">1,245</div>
                  <div className="text-xs text-green-700 mt-1">今日请求数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-900">99.8%</div>
                  <div className="text-xs text-green-700 mt-1">成功率</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-900">125ms</div>
                  <div className="text-xs text-green-700 mt-1">平均响应</div>
                </div>
              </div>
            </div>
          )}

          {task.status === '失败' && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h4 className="text-sm font-semibold text-red-900 mb-2">部署失败原因</h4>
              <p className="text-sm text-red-800">镜像拉取失败: ImagePullBackOff。请检查镜像地址是否正确，以及是否有权限访问镜像仓库。</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            关闭
          </button>
          {task.status === '运行中' && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              查看监控
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LogDrawer({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const logs = `[任务ID: ${taskId}]
[2026-04-19 09:00:00] 训练任务开始
[2026-04-19 09:00:05] 加载训练数据集: 50000 条
[2026-04-19 09:00:10] 数据预处理完成
[2026-04-19 09:00:15] 初始化 BERT-LSTM-CRF 模型
[2026-04-19 09:00:20] 模型参数: hidden_size=256, num_layers=2, dropout=0.1
[2026-04-19 09:00:25] 开始训练循环...
[2026-04-19 09:15:30] Epoch 1/50 - Loss: 0.45 - Precision: 0.75 - Recall: 0.72 - F1: 0.78
[2026-04-19 09:30:35] Epoch 5/50 - Loss: 0.35 - Precision: 0.82 - Recall: 0.80 - F1: 0.81
[2026-04-19 09:45:40] Epoch 10/50 - Loss: 0.28 - Precision: 0.86 - Recall: 0.84 - F1: 0.85
[2026-04-19 10:00:45] Epoch 20/50 - Loss: 0.20 - Precision: 0.89 - Recall: 0.87 - F1: 0.88
[2026-04-19 10:30:50] Epoch 30/50 - Loss: 0.15 - Precision: 0.92 - Recall: 0.90 - F1: 0.91
[2026-04-19 11:00:55] Epoch 40/50 - Loss: 0.11 - Precision: 0.93 - Recall: 0.92 - F1: 0.925
[2026-04-19 11:15:00] Epoch 50/50 - Loss: 0.08 - Precision: 0.94 - Recall: 0.93 - F1: 0.935
[2026-04-19 11:20:00] 训练完成
[2026-04-19 11:22:00] 模型评估中...
[2026-04-19 11:25:00] 最终评估结果: F1-Score: 92.5%
[2026-04-19 11:28:00] 保存模型至 /models/entity_extract_v2.3.1.pt
[2026-04-19 11:30:00] 任务完成`;

  return (
    <div className="fixed inset-y-0 right-0 w-2/3 bg-white shadow-xl z-50 flex flex-col">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">训练日志</h3>
          <p className="text-sm text-gray-600 mt-1">任务 ID: {taskId}</p>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-900 text-xl">
          ✕
        </button>
      </div>
      <div className="flex-1 p-6 overflow-y-auto bg-gray-900">
        <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">{logs}</pre>
      </div>
      <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <FileText className="w-4 h-4" />
          下载日志
        </button>
        <button onClick={onClose} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
          关闭
        </button>
      </div>
    </div>
  );
}
