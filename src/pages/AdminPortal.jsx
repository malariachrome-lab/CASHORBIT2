import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { mockAuthService } from "../services/authService";
import { mockDataService } from "../services/dataService";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, CheckCircle, XCircle, Search, DollarSign, ShieldAlert, Clock, Settings,
  RefreshCcw, Trash2, Edit, Wallet, Plus, ClipboardList, X, Save
} from "lucide-react";
import LiveActivityFeed from "../components/LiveActivityFeed";
import { formatDistanceToNowStrict } from "date-fns";
import SkeletonLoader from "../components/SkeletonLoader";

const UserRow = ({ user, onToggleActivation, onDeleteUser, onEditUser, onManageWallet }) => (
  <tr className="border-b border-white/5 last:border-b-0 hover:bg-surface-light">
    <td className="py-3 px-4 text-text-primary">
      <div className="flex items-center gap-2">
        {user.name}
        {user.role === "admin" && <ShieldAlert className="w-4 h-4 text-primary" title="Admin" />}
      </div>
    </td>
    <td className="py-3 px-4 text-text-secondary">{user.email}</td>
    <td className="py-3 px-4">
      <span className={`badge ${user.status === "active" ? "badge-success" : "badge-warning"}`}>
        {user.status?.toUpperCase() || "N/A"}
      </span>
    </td>
    <td className="py-3 px-4 text-success font-semibold">KES {user.balance?.toLocaleString() || "0"}</td>
    <td className="py-3 px-4">
      <div className="flex gap-2">
        <button
          onClick={() => onManageWallet(user)}
          className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
          title="Manage Wallet"
        >
          <DollarSign className="w-5 h-5" />
        </button>
        <button
          onClick={() => onToggleActivation(user)}
          className={`p-2 rounded-lg ${user.status === "active" ? "bg-error/20 text-error hover:bg-error/30" : "bg-success/20 text-success hover:bg-success/30"} transition-colors`}
          title={user.status === "active" ? "Deactivate User" : "Activate User"}
        >
          {user.status === "active" ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
        </button>
        <button
          onClick={() => onEditUser(user)}
          className="p-2 rounded-lg bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 transition-colors"
          title="Edit User Details"
        >
          <Edit className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDeleteUser(user.id)}
          className="p-2 rounded-lg bg-red-700/20 text-red-700 hover:bg-red-700/30 transition-colors"
          title="Delete User"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </td>
  </tr>
);

const TaskRow = ({ task, onEdit, onDelete }) => (
  <tr className="border-b border-white/5 last:border-b-0 hover:bg-surface-light">
    <td className="py-3 px-4 text-text-primary font-medium">{task.name}</td>
    <td className="py-3 px-4 text-text-secondary">{task.description}</td>
    <td className="py-3 px-4">
      <span className={`badge ${task.type === "video" ? "badge-info" : "badge-warning"}`}>
        {task.type?.toUpperCase() || "TASK"}
      </span>
    </td>
    <td className="py-3 px-4 text-success font-semibold">KES {task.baseEarnings}</td>
    <td className="py-3 px-4 text-text-secondary">{task.duration}</td>
    <td className="py-3 px-4">
      <span className={`badge ${task.available ? "badge-success" : "badge-error"}`}>
        {task.available ? "AVAILABLE" : "UNAVAILABLE"}
      </span>
    </td>
    <td className="py-3 px-4">
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(task)}
          className="p-2 rounded-lg bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 transition-colors"
          title="Edit Task"
        >
          <Edit className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 rounded-lg bg-red-700/20 text-red-700 hover:bg-red-700/30 transition-colors"
          title="Delete Task"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </td>
  </tr>
);

export default function AdminPortal() {
  const { user, isAuthenticated, isAdmin, updateUserStatus } = useAuth();
  const { pendingActivations, approveActivation, rejectActivation, addFunds, globalConfig, updateGlobalConfig, tasks, addTask, updateTask, deleteTask } = useAppState();
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundType, setFundType] = useState("add");
  const [fundLoading, setFundLoading] = useState(false);
  const [fundMessage, setFundMessage] = useState(null);
  const [fundError, setFundError] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState(null);
  const [settingsError, setSettingsError] = useState(null);

  // Edit User Modal State
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editUserData, setEditUserData] = useState({ name: "", email: "", phone: "", status: "active", role: "user" });
  const [editUserId, setEditUserId] = useState(null);

  // Task Modal State
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    name: "",
    description: "",
    baseEarnings: "",
    duration: "",
    icon: "Video",
    type: "video",
    available: true,
    maxCompletions: 5,
    videoUrl: "",
    question: "",
    options: "",
  });
  const [editingTaskId, setEditingTaskId] = useState(null);

  const fetchAllUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const users = await mockAuthService.getAllUsers();
      setAllUsers(users);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setSettingsError(err.message);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers();
      const interval = setInterval(() => {
        fetchAllUsers();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, fetchAllUsers]);

  const handleApprove = async (userId) => {
    try {
      const updatedUser = await mockAuthService.approveUser(userId);
      approveActivation(userId);
      setAllUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updatedUser } : u));
      if (user && user.id === userId) {
        updateUserStatus(userId, updatedUser.status);
      }
      alert(`User ${updatedUser.name} approved!`);
    } catch (error) {
      alert("Failed to approve user: " + error.message);
    }
  };

  const handleReject = async (userId) => {
    try {
      await mockAuthService.rejectUser(userId);
      rejectActivation(userId);
      setAllUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, status: 'pending', transaction_id: null } : u));
      if (user && user.id === userId) {
        updateUserStatus(userId, 'pending');
      }
      alert(`User ${userId} activation rejected.`);
    } catch (error) {
      alert("Failed to reject user: " + error.message);
    }
  };

  const handleToggleActivation = async (targetUser) => {
    try {
      const newStatus = targetUser.status === "active" ? "pending" : "active";
      const updatedUser = await mockAuthService.updateUserDetails(targetUser.id, { status: newStatus, transaction_id: newStatus === "pending" ? null : targetUser.transaction_id });
      setAllUsers(prevUsers => prevUsers.map(u => u.id === targetUser.id ? { ...u, ...updatedUser } : u));
      if (user && user.id === targetUser.id) {
        updateUserStatus(targetUser.id, newStatus);
      }
      addFunds(targetUser.id, 0);
      alert(`User ${targetUser.name} ${newStatus === "active" ? "activated" : "deactivated"}.`);
    } catch (error) {
      alert("Failed to toggle user activation: " + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    try {
      await mockAuthService.deleteUser(userId);
      setAllUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      alert(`User ${userId} deleted.`);
    } catch (error) {
      alert("Failed to delete user: " + error.message);
    }
  };

  const handleEditUser = (userToEdit) => {
    setEditUserId(userToEdit.id);
    setEditUserData({
      name: userToEdit.name || "",
      email: userToEdit.email || "",
      phone: userToEdit.phone || "",
      status: userToEdit.status || "active",
      role: userToEdit.role || "user",
    });
    setEditUserModalOpen(true);
  };

  const handleSaveEditUser = async () => {
    try {
      const updated = await mockAuthService.updateUserDetails(editUserId, editUserData);
      setAllUsers(prev => prev.map(u => u.id === editUserId ? { ...u, ...updated } : u));
      if (user && user.id === editUserId) {
        updateUserStatus(editUserId, editUserData.status);
      }
      setEditUserModalOpen(false);
      alert("User updated successfully!");
    } catch (error) {
      alert("Failed to update user: " + error.message);
    }
  };

  const handleManageWallet = (user) => {
    setSelectedUser(user);
    setFundAmount("");
    setFundType("add");
    setFundMessage(null);
    setFundError(null);
  };

  const handleFundChange = (e) => {
    const value = e.target.value;
    if (!isNaN(value) && value >= 0) {
      setFundAmount(value);
    }
  };

  const handleFundSubmit = async (e) => {
    e.preventDefault();
    setFundLoading(true);
    setFundMessage(null);
    setFundError(null);

    const amountValue = parseFloat(fundAmount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setFundError("Please enter a valid positive amount.");
      setFundLoading(false);
      return;
    }

    if (!selectedUser) {
      setFundError("Please select a user to modify funds.");
      setFundLoading(false);
      return;
    }

    try {
      const newBalance = await mockAuthService.updateBalance(
        selectedUser.id,
        amountValue,
        fundType
      );
      addFunds(selectedUser.id, amountValue);
      setFundMessage(
        `Successfully ${fundType === "add" ? "added" : "deducted"} KES ${amountValue.toLocaleString()} ${fundType === "add" ? "to" : "from"} ${selectedUser.name}'s balance. New balance: KES ${newBalance.toLocaleString()}`
      );
      setFundAmount("");
      setSelectedUser(prev => prev ? { ...prev, balance: newBalance } : null);
      setAllUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, balance: newBalance } : u));
    } catch (error) {
      setFundError("Failed to update balance: " + error.message);
    } finally {
      setFundLoading(false);
    }
  };

  const handleSettingsChange = (key, value) => {
    setSettingsMessage(null);
    setSettingsError(null);
    updateGlobalConfig(key, parseFloat(value) || value);
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    setSettingsMessage(null);
    setSettingsError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setSettingsMessage("Settings updated successfully!");
    } catch (error) {
      setSettingsError("Failed to save settings: " + error.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Task Management
  const openAddTask = () => {
    setEditingTaskId(null);
    setTaskForm({
      name: "",
      description: "",
      baseEarnings: "",
      duration: "",
      icon: "Video",
      type: "video",
      available: true,
      maxCompletions: 5,
      videoUrl: "",
      question: "",
      options: "",
    });
    setTaskModalOpen(true);
  };

  const openEditTask = (task) => {
    setEditingTaskId(task.id);
    setTaskForm({
      name: task.name || "",
      description: task.description || "",
      baseEarnings: task.baseEarnings || "",
      duration: task.duration || "",
      icon: task.icon || "Video",
      type: task.type || "video",
      available: task.available !== false,
      maxCompletions: task.maxCompletions || 5,
      videoUrl: task.videoUrl || "",
      question: task.question || "",
      options: Array.isArray(task.options) ? task.options.join(", ") : "",
    });
    setTaskModalOpen(true);
  };

  const handleTaskFormChange = (e) => {
    const { id, value, type, checked } = e.target;
    setTaskForm(prev => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveTask = () => {
    const payload = {
      ...taskForm,
      baseEarnings: parseFloat(taskForm.baseEarnings) || 0,
      maxCompletions: parseInt(taskForm.maxCompletions) || 5,
    };
    // Convert options string to array for survey tasks
    if (payload.type === "survey" && payload.options) {
      payload.options = payload.options.split(",").map(o => o.trim()).filter(Boolean);
    }
    if (editingTaskId) {
      updateTask(editingTaskId, payload);
      alert("Task updated successfully!");
    } else {
      addTask(payload);
      alert("Task added successfully!");
    }
    setTaskModalOpen(false);
  };

  const handleDeleteTask = (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    deleteTask(taskId);
    alert("Task deleted successfully!");
  };

  const filteredUsers = allUsers.filter((u) =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  );

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-error">
        <ShieldAlert className="w-10 h-10 mr-3" />
        <p className="text-xl font-semibold">Access Denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-16"
    >
      <h1 className="text-3xl font-bold text-text-primary mb-6 text-center">
        Admin Command Center
      </h1>

      {/* Global Settings */}
      <section className="card p-6">
        <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-3">
          <Settings className="w-6 h-6 text-purple-400" /> Global Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="activationFee" className="block text-sm font-medium text-text-secondary mb-2">
              Activation Fee (KES)
            </label>
            <input
              type="number"
              id="activationFee"
              className="input-field"
              value={globalConfig.activationFee}
              onChange={(e) => handleSettingsChange("activationFee", e.target.value)}
              min="0"
            />
          </div>
          <div>
            <label htmlFor="referralBonus" className="block text-sm font-medium text-text-secondary mb-2">
              Referral Bonus (KES)
            </label>
            <input
              type="number"
              id="referralBonus"
              className="input-field"
              value={globalConfig.referralBonus}
              onChange={(e) => handleSettingsChange("referralBonus", e.target.value)}
              min="0"
            />
          </div>
          <div>
            <label htmlFor="minWithdrawal" className="block text-sm font-medium text-text-secondary mb-2">
              Minimum Withdrawal (KES)
            </label>
            <input
              type="number"
              id="minWithdrawal"
              className="input-field"
              value={globalConfig.minWithdrawal}
              onChange={(e) => handleSettingsChange("minWithdrawal", e.target.value)}
              min="0"
            />
          </div>
          <div>
            <label htmlFor="maxWithdrawal" className="block text-sm font-medium text-text-secondary mb-2">
              Maximum Withdrawal (KES)
            </label>
            <input
              type="number"
              id="maxWithdrawal"
              className="input-field"
              value={globalConfig.maxWithdrawal}
              onChange={(e) => handleSettingsChange("maxWithdrawal", e.target.value)}
              min="0"
            />
          </div>
          <div>
            <label htmlFor="dailyBonusBase" className="block text-sm font-medium text-text-secondary mb-2">
              Daily Bonus Base (KES)
            </label>
            <input
              type="number"
              id="dailyBonusBase"
              className="input-field"
              value={globalConfig.dailyBonusBase}
              onChange={(e) => handleSettingsChange("dailyBonusBase", e.target.value)}
              min="0"
            />
          </div>
          <div>
            <label htmlFor="tillNumber" className="block text-sm font-medium text-text-secondary mb-2">
              Till Number
            </label>
            <input
              type="text"
              id="tillNumber"
              className="input-field"
              value={globalConfig.tillNumber}
              onChange={(e) => handleSettingsChange("tillNumber", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="dailyBonusResetHours" className="block text-sm font-medium text-text-secondary mb-2">
              Daily Bonus Reset Hours
            </label>
            <input
              type="number"
              id="dailyBonusResetHours"
              className="input-field"
              value={globalConfig.dailyBonusResetHours}
              onChange={(e) => handleSettingsChange("dailyBonusResetHours", e.target.value)}
              min="1"
              max="24"
            />
          </div>
        </div>
        {settingsError && <p className="text-error text-sm mt-4 text-center">{settingsError}</p>}
        {settingsMessage && <p className="text-success text-sm mt-4 text-center"><CheckCircle className="inline-block w-4 h-4 mr-1" />{settingsMessage}</p>}
        <button onClick={handleSaveSettings} className="btn-primary mt-6 w-full" disabled={settingsLoading}>
          {settingsLoading ? "Saving..." : "Save Settings"}
        </button>
      </section>

      {/* Task Management */}
      <section className="card p-6">
        <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-emerald-400" /> Task Management
          <button onClick={openAddTask} className="ml-auto btn-success py-2 px-4 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </h2>
        {tasks.length === 0 ? (
          <p className="text-text-secondary text-center py-4">No tasks available.</p>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="text-text-muted border-b border-white/10">
                  <th className="py-2 px-4">Name</th>
                  <th className="py-2 px-4">Description</th>
                  <th className="py-2 px-4">Type</th>
                  <th className="py-2 px-4">Earnings</th>
                  <th className="py-2 px-4">Duration</th>
                  <th className="py-2 px-4">Status</th>
                  <th className="py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    onEdit={openEditTask}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Verification Queue */}
      <section className="card p-6">
        <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-warning" /> Activation Verification Queue
          <button onClick={fetchAllUsers} className="p-1 ml-auto rounded-full text-text-secondary hover:bg-surface-light" title="Refresh">
            <RefreshCcw className="w-5 h-5" />
          </button>
        </h2>
        {pendingActivations.length === 0 ? (
          <p className="text-text-secondary text-center py-4">No pending activations.</p>
        ) : (
          <div className="space-y-4">
            {pendingActivations.map((pending) => (
              <motion.div
                key={pending.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="card bg-surface-light p-4 flex flex-col sm:flex-row justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-text-primary">{pending.name} ({pending.email})</p>
                  <p className="text-sm text-text-secondary">Phone: {pending.phone}</p>
                  <p className="text-sm text-text-secondary">TXN ID: <span className="font-mono text-primary">{pending.transactionId}</span></p>
                  <p className="text-xs text-text-muted">
                    Submitted: {formatDistanceToNowStrict(new Date(pending.submittedAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-3 mt-4 sm:mt-0">
                  <button
                    onClick={() => handleApprove(pending.userId)}
                    className="btn-success py-2 px-4 text-sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />Approve
                  </button>
                  <button
                    onClick={() => handleReject(pending.userId)}
                    className="btn-secondary bg-error/20 text-error hover:bg-error/30 py-2 px-4 text-sm"
                  >
                    <XCircle className="w-4 h-4 mr-2" />Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* User Management */}
      <section className="card p-6">
        <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-400" /> User Management
          <button onClick={fetchAllUsers} className="p-1 ml-auto rounded-full text-text-secondary hover:bg-surface-light" title="Refresh Users">
            <RefreshCcw className="w-5 h-5" />
          </button>
        </h2>
        <div className="mb-4">
          <div className="relative">
            <Search className="w-5 h-5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users by name, email, or phone..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loadingUsers ? (
          <SkeletonLoader count={5} height="60px" className="mb-4" />
        ) : filteredUsers.length === 0 ? (
          <p className="text-text-secondary text-center py-4">No users found.</p>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="text-text-muted border-b border-white/10">
                  <th className="py-2 px-4">Name</th>
                  <th className="py-2 px-4">Email</th>
                  <th className="py-2 px-4">Status</th>
                  <th className="py-2 px-4">Balance</th>
                  <th className="py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    onToggleActivation={handleToggleActivation}
                    onDeleteUser={handleDeleteUser}
                    onEditUser={handleEditUser}
                    onManageWallet={handleManageWallet}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedUser && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 p-6 bg-surface-light rounded-xl border border-white/10 space-y-4"
          >
            <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <Wallet className="w-6 h-6 text-success" /> Manage Wallet for {selectedUser.name}
            </h3>
            <p className="text-text-secondary">Current Balance: <span className="font-bold text-success">KES {selectedUser.balance.toLocaleString()}</span></p>

            <form onSubmit={handleFundSubmit} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-grow">
                <label htmlFor="fundAmount" className="block text-sm font-medium text-text-secondary mb-2">
                  Amount (KES)
                </label>
                <input
                  type="number"
                  id="fundAmount"
                  className="input-field"
                  placeholder="e.g., 500"
                  value={fundAmount}
                  onChange={handleFundChange}
                  required
                  min="0"
                />
              </div>
              <div className="flex-grow">
                <label htmlFor="fundType" className="block text-sm font-medium text-text-secondary mb-2">
                  Action
                </label>
                <select
                  id="fundType"
                  className="input-field"
                  value={fundType}
                  onChange={(e) => setFundType(e.target.value)}
                >
                  <option value="add">Add Funds</option>
                  <option value="deduct">Deduct Funds</option>
                </select>
              </div>
              <button type="submit" className="btn-primary self-end py-3 px-6" disabled={fundLoading}>
                {fundLoading ? "Updating..." : "Update Balance"}
              </button>
            </form>
            {fundError && <p className="text-error text-sm mt-2 text-center">{fundError}</p>}
            {fundMessage && <p className="text-success text-sm mt-2 text-center"><CheckCircle className="inline-block w-4 h-4 mr-1" />{fundMessage}</p>}
          </motion.div>
        )}
      </section>

      {/* Live Activity Feed */}
      <section className="card p-6">
        <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-3">
          <Clock className="w-6 h-6 text-purple-400" /> Live Platform Activity
        </h2>
        <LiveActivityFeed count={20} />
      </section>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editUserModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setEditUserModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Edit className="w-5 h-5 text-yellow-500" /> Edit User
                </h3>
                <button onClick={() => setEditUserModalOpen(false)} className="p-1 rounded-lg hover:bg-white/5 text-text-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                  <input className="input-field" value={editUserData.name} onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                  <input className="input-field" type="email" value={editUserData.email} onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
                  <input className="input-field" value={editUserData.phone} onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                    <select className="input-field" value={editUserData.status} onChange={(e) => setEditUserData({ ...editUserData, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
                    <select className="input-field" value={editUserData.role} onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditUserModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSaveEditUser} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Modal */}
      <AnimatePresence>
        {taskModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setTaskModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-400" /> {editingTaskId ? "Edit Task" : "Add Task"}
                </h3>
                <button onClick={() => setTaskModalOpen(false)} className="p-1 rounded-lg hover:bg-white/5 text-text-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Task Name</label>
                  <input id="name" className="input-field" value={taskForm.name} onChange={handleTaskFormChange} placeholder="e.g., Watch Video" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                  <input id="description" className="input-field" value={taskForm.description} onChange={handleTaskFormChange} placeholder="Short description" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Earnings (KES)</label>
                    <input id="baseEarnings" type="number" className="input-field" value={taskForm.baseEarnings} onChange={handleTaskFormChange} placeholder="50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Duration</label>
                    <input id="duration" className="input-field" value={taskForm.duration} onChange={handleTaskFormChange} placeholder="e.g., 30 sec" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Task Type</label>
                    <select id="type" className="input-field" value={taskForm.type} onChange={handleTaskFormChange}>
                      <option value="video">Video</option>
                      <option value="survey">Survey</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Icon (Lucide name)</label>
                    <input id="icon" className="input-field" value={taskForm.icon} onChange={handleTaskFormChange} placeholder="Video or ClipboardList" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Max Completions</label>
                    <input id="maxCompletions" type="number" className="input-field" value={taskForm.maxCompletions} onChange={handleTaskFormChange} placeholder="5" />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input id="available" type="checkbox" checked={taskForm.available} onChange={handleTaskFormChange} className="w-4 h-4 rounded border-white/10 bg-surface-light text-primary" />
                    <label htmlFor="available" className="text-sm text-text-secondary">Available for users</label>
                  </div>
                </div>

                {/* Video-specific field */}
                {taskForm.type === "video" && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">YouTube Video URL</label>
                    <input id="videoUrl" className="input-field" value={taskForm.videoUrl} onChange={handleTaskFormChange} placeholder="https://www.youtube.com/watch?v=..." />
                    <p className="text-xs text-text-muted mt-1">Paste any YouTube link — the video ID will be extracted automatically.</p>
                  </div>
                )}

                {/* Survey-specific fields */}
                {taskForm.type === "survey" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Survey Question</label>
                      <input id="question" className="input-field" value={taskForm.question} onChange={handleTaskFormChange} placeholder="e.g., How often do you save money?" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Options (comma-separated)</label>
                      <input id="options" className="input-field" value={taskForm.options} onChange={handleTaskFormChange} placeholder="Daily, Weekly, Monthly, Never" />
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setTaskModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSaveTask} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> {editingTaskId ? "Update Task" : "Add Task"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
