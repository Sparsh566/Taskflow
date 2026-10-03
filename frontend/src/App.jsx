import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ManagerDashboard from './components/ManagerDashboard';
import ScheduleView from './components/ScheduleView';
import TaskBoard from './components/TaskBoard';
import TeamDirectory from './components/TeamDirectory';
import ChatView from './components/ChatView';
import SettingsView from './components/SettingsView';
import VerificationModal from './components/VerificationModal';
import CreateTaskModal from './components/CreateTaskModal';
import SubmitEvidenceModal from './components/SubmitEvidenceModal';
import BlockerModal from './components/BlockerModal';
import CreateWorkspaceModal from './components/CreateWorkspaceModal';
import AddUserModal from './components/AddUserModal';
import DemoSandboxBanner from './components/DemoSandboxBanner';
import { api, setAuthToken } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [chatTargetUser, setChatTargetUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Workspace management state
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Modals state
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [evidenceTask, setEvidenceTask] = useState(null);
  const [blockerTask, setBlockerTask] = useState(null);

  // Initialize with Sarah Chen (Manager) by default
  useEffect(() => {
    loginAs('sarah.chen@taskflow.dev');
  }, []);

  // Poll unread chat count periodically
  useEffect(() => {
    if (!currentUser) return;
    loadUnreadChatCount();
    const interval = setInterval(loadUnreadChatCount, 5000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const loadUnreadChatCount = async () => {
    try {
      const res = await api.getChatUnreadCount();
      setUnreadChatCount(res.unread_count || 0);
    } catch {
      // ignore
    }
  };

  const loadWorkspaces = async () => {
    try {
      const wsList = await api.getWorkspaces();
      setWorkspaces(wsList);
      if (wsList.length > 0) {
        setActiveWorkspace(prev => {
          if (prev && wsList.some(w => w.id === prev.id)) {
            return wsList.find(w => w.id === prev.id);
          }
          return wsList[0];
        });
        return wsList[0];
      }
      return null;
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      return null;
    }
  };

  const loginAs = async (email, password = null) => {
    try {
      setLoading(true);
      let authData;
      try {
        // Preferred instant switch persona endpoint
        authData = await api.switchPersona(email);
      } catch (e) {
        // Fallback with credential login
        let pwd = password;
        if (!pwd) {
          if (email.startsWith('admin')) pwd = 'admin123';
          else if (email.startsWith('sarah') || email.startsWith('marcus')) pwd = 'manager123';
          else pwd = 'emp123';
        }
        authData = await api.login(email, pwd);
      }

      setAuthToken(authData.access_token);
      setCurrentUser(authData.user);
      
      const defaultWs = await loadWorkspaces();
      await loadAppTelemetry(defaultWs?.id);
      loadUnreadChatCount();
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAppTelemetry = async (targetWsId = undefined) => {
    try {
      const wsId = targetWsId !== undefined ? targetWsId : activeWorkspace?.id;
      const queryParam = wsId ? `workspace_id=${wsId}` : '';
      const [tasksRes, notifsRes] = await Promise.all([
        api.getTasks(queryParam),
        api.getNotifications()
      ]);
      setTasks(tasksRes);
      setNotifications(notifsRes);

      try {
        const analyticsRes = await api.getDashboardAnalytics();
        setAnalytics(analyticsRes);
      } catch (err) {
        setAnalytics(null);
      }
    } catch (err) {
      console.error('Error loading app telemetry:', err);
    }
  };

  const handleSelectWorkspace = (ws) => {
    setActiveWorkspace(ws);
    loadAppTelemetry(ws?.id);
  };

  const handleStartTask = async (taskId) => {
    try {
      await api.updateTaskStatus(taskId, 'in_progress');
      await loadAppTelemetry();
    } catch (err) {
      alert(`Could not start task: ${err.message}`);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen w-full bg-[#f6f4ee] flex items-center justify-center text-slate-700 font-['Outfit']">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#141518] animate-spin flex items-center justify-center shadow-lg" />
          <p className="text-sm font-bold tracking-wide text-slate-800">
            Initializing TaskFlow Telemetry...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f6f4ee] flex flex-row text-slate-900 font-['Inter']">
      
      {/* Matte Black Left Sidebar from reference UI */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onSwitchUser={(email) => loginAs(email)}
        unreadChatCount={unreadChatCount}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        onOpenCreateWorkspace={() => setShowCreateWorkspaceModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pr-4">
        
        {/* Top Search & Actions Bar */}
        <TopBar
          onOpenCreateTask={() => setShowCreateModal(true)}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          currentUser={currentUser}
          onNavigate={(tab) => setActiveTab(tab)}
          unreadChatCount={unreadChatCount}
          activeWorkspace={activeWorkspace}
          onOpenAddUser={() => setShowAddUserModal(true)}
        />

        {/* Live Demo Sandbox & 1-Click Persona Switcher */}
        <DemoSandboxBanner
          currentUser={currentUser}
          onSwitchUser={(email) => loginAs(email)}
        />

        {/* Dynamic View Container */}
        <main className="flex-1 px-6 py-4">
          
          {activeTab === 'dashboard' && (
            <ManagerDashboard
              analytics={analytics}
              tasks={tasks}
              onSelectTask={(task) => setSelectedTask(task)}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleView
              tasks={tasks}
              currentUser={currentUser}
              onSelectTask={(task) => setSelectedTask(task)}
              onOpenCreateTask={() => setShowCreateModal(true)}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskBoard
              tasks={tasks}
              onSelectTask={(task) => setSelectedTask(task)}
              onStartTask={handleStartTask}
              onOpenSubmitEvidence={(task) => setEvidenceTask(task)}
              onOpenBlockerModal={(task) => setBlockerTask(task)}
              onOpenCreateTask={() => setShowCreateModal(true)}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'messages' && (
            <ChatView
              currentUser={currentUser}
              initialTargetUser={chatTargetUser}
            />
          )}

          {activeTab === 'team' && (
            <TeamDirectory
              currentUser={currentUser}
              activeWorkspace={activeWorkspace}
              onOpenAddUser={() => setShowAddUserModal(true)}
              onOpenChatWithUser={(user) => {
                setChatTargetUser(user);
                setActiveTab('messages');
              }}
              onSwitchUser={(email) => loginAs(email)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              onSwitchUser={(email) => loginAs(email)}
            />
          )}

          {activeTab === 'verification' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 font-['Outfit']">
                Work Verification Workbench
              </h1>
              <p className="text-xs text-slate-500">
                Select any task below to inspect code diff heuristics, commit frequency, or deliverable compliance.
              </p>
              <TaskBoard
                tasks={tasks}
                onSelectTask={(task) => setSelectedTask(task)}
                onStartTask={handleStartTask}
                onOpenSubmitEvidence={(task) => setEvidenceTask(task)}
                onOpenBlockerModal={(task) => setBlockerTask(task)}
                onOpenCreateTask={() => setShowCreateModal(true)}
                currentUser={currentUser}
              />
            </div>
          )}

          {activeTab === 'github' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 font-['Outfit']">
                GitHub Repositories & Pull Request Links
              </h1>
              <p className="text-xs text-slate-500">
                Connected repositories: <code>{activeWorkspace?.repository_url || 'taskflow-org/core-platform'}</code>
              </p>
              <TaskBoard
                tasks={tasks.filter(t => t.verification_type === 'github_code')}
                onSelectTask={(task) => setSelectedTask(task)}
                onStartTask={handleStartTask}
                onOpenSubmitEvidence={(task) => setEvidenceTask(task)}
                onOpenBlockerModal={(task) => setBlockerTask(task)}
                onOpenCreateTask={() => setShowCreateModal(true)}
                currentUser={currentUser}
              />
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 font-['Outfit']">
                Documents & Non-Technical Deliverables Base
              </h1>
              <p className="text-xs text-slate-500">
                Deliverables, PDFs, checklists, and executive slide decks.
              </p>
              <TaskBoard
                tasks={tasks.filter(t => t.verification_type !== 'github_code')}
                onSelectTask={(task) => setSelectedTask(task)}
                onStartTask={handleStartTask}
                onOpenSubmitEvidence={(task) => setEvidenceTask(task)}
                onOpenBlockerModal={(task) => setBlockerTask(task)}
                onOpenCreateTask={() => setShowCreateModal(true)}
                currentUser={currentUser}
              />
            </div>
          )}

        </main>

      </div>

      {/* Verification Inspector Modal */}
      {selectedTask && (
        <VerificationModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onRefresh={loadAppTelemetry}
          currentUser={currentUser}
        />
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadAppTelemetry}
          currentUser={currentUser}
          activeWorkspace={activeWorkspace}
        />
      )}

      {/* Create Custom Workspace Modal */}
      {showCreateWorkspaceModal && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateWorkspaceModal(false)}
          onCreated={async (newWs) => {
            const updatedList = await api.getWorkspaces();
            setWorkspaces(updatedList);
            setActiveWorkspace(newWs);
            await loadAppTelemetry(newWs.id);
          }}
        />
      )}

      {/* Add Custom User / Team Member Modal */}
      {showAddUserModal && (
        <AddUserModal
          activeWorkspace={activeWorkspace}
          onClose={() => setShowAddUserModal(false)}
          onCreated={async () => {
            await loadAppTelemetry();
            const updatedList = await api.getWorkspaces();
            setWorkspaces(updatedList);
          }}
        />
      )}

      {/* Submit Evidence Modal */}
      {evidenceTask && (
        <SubmitEvidenceModal
          task={evidenceTask}
          onClose={() => setEvidenceTask(null)}
          onSubmitted={loadAppTelemetry}
        />
      )}

      {/* Blocker Modal */}
      {blockerTask && (
        <BlockerModal
          task={blockerTask}
          onClose={() => setBlockerTask(null)}
          onReported={loadAppTelemetry}
        />
      )}

    </div>
  );
}
