import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ManagerDashboard from './components/ManagerDashboard';
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
      // Determine password for seed users
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

      // Fetch analytics (if manager or admin)
      try {
        const analyticsRes = await api.getDashboardAnalytics();
        setAnalytics(analyticsRes);
      } catch (err) {
        // Normal for employees if restricted
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
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-slate-400 font-['Outfit']">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 animate-spin flex items-center justify-center shadow-xl shadow-indigo-600/40" />
          <p className="text-sm font-semibold tracking-wide text-slate-300">
            Initializing TaskFlow Telemetry Engine...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100">
      
      {/* Top Header & Navigation */}
      <Header
        currentUser={currentUser}
        onSwitchUser={(email) => loginAs(email)}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onOpenCreateTask={() => setShowCreateModal(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'dashboard' && (
          <ManagerDashboard
            analytics={analytics}
            tasks={tasks}
            onSelectTask={(task) => setSelectedTask(task)}
            onOpenCreateTask={() => setShowCreateModal(true)}
            currentUser={currentUser}
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

      </main>

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

      {/* Blocker Escalation Modal */}
      {blockerTask && (
        <BlockerModal
          task={blockerTask}
          onClose={() => setBlockerTask(null)}
          onReported={loadAppTelemetry}
        />
      )}

      {/* Bottom Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>TaskFlow — Employee Task Management & Objective Work Verification Platform © 2026</p>
      </footer>

    </div>
  );
}
