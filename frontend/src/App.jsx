import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ManagerDashboard from './components/ManagerDashboard';
import ScheduleView from './components/ScheduleView';
import TaskBoard from './components/TaskBoard';
import TeamDirectory from './components/TeamDirectory';
import VerificationModal from './components/VerificationModal';
import CreateTaskModal from './components/CreateTaskModal';
import SubmitEvidenceModal from './components/SubmitEvidenceModal';
import BlockerModal from './components/BlockerModal';
import { api, setAuthToken } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [evidenceTask, setEvidenceTask] = useState(null);
  const [blockerTask, setBlockerTask] = useState(null);

  // Initialize with Sarah Chen (Manager) by default
  useEffect(() => {
    loginAs('sarah.chen@taskflow.dev', 'manager123');
  }, []);

  const loginAs = async (email, password = 'manager123') => {
    try {
      setLoading(true);
      let pwd = password;
      if (email.startsWith('admin')) pwd = 'admin123';
      else if (email.includes('.dev') || email.includes('.ai') || email.includes('.growth')) pwd = 'emp123';

      const authData = await api.login(email, pwd);
      setAuthToken(authData.access_token);
      setCurrentUser(authData.user);
      await loadAppTelemetry();
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAppTelemetry = async () => {
    try {
      const [tasksRes, notifsRes] = await Promise.all([
        api.getTasks(),
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
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pr-4">
        
        {/* Top Search & Actions Bar */}
        <TopBar
          onOpenCreateTask={() => setShowCreateModal(true)}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          currentUser={currentUser}
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

          {activeTab === 'team' && (
            <TeamDirectory />
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
                Connected repositories: <code>taskflow-org/core-platform</code>
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
