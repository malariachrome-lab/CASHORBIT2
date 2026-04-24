import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { authService } from "../services/authService";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, CheckCircle, XCircle, Search, DollarSign, ShieldAlert, Settings,
  RefreshCcw, Trash2, Edit, ClipboardList, X, Save
} from "lucide-react";
import SkeletonLoader from "../components/SkeletonLoader";

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

  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editUserData, setEditUserData] = useState({ name: "", email: "", phone: "", status: "active", role: "user" });
  const [editUserId, setEditUserId] = useState(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    name: "", description: "", baseEarnings: "", duration: "",
    icon: "Video", type: "video", available: true, maxCompletions: 5,
    videoUrl: "", question: "", options: "",
  });
  const [editingTaskId, setEditingTaskId] = useState(null);

  const fetchAllUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const users = await authService.getAllUsers();
      setAllUsers(users);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers();
      const interval = setInterval(fetchAllUsers, 3000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, fetchAllUsers]);

  const handleApprove = async (userId) => {
    try {
      const updatedUser = await authService.approveUser(userId);
      approveActivation(userId);
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedUser } : u));
      if (user?.id === userId) updateUserStatus(userId, updatedUser.status);
      alert(`User ${updatedUser.name} approved!`);
    } catch (error) {
      alert("Failed to approve user: " + error.message);
    }
  };

  const handleReject = async (userId) => {
    try {
      await authService.rejectUser(userId);
      rejectActivation(userId);
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'pending', transaction_id: null } : u));
      if (user?.id === userId) updateUserStatus(userId, 'pending');
      alert("Activation rejected.");
    } catch (error) {
      alert("Failed to reject user: " + error.message);
    }
  };

  const handleToggleActivation = async (targetUser) => {
    try {
      const newStatus = targetUser.status === "active" ? "pending" : "active";
      const updatedUser = await authService.updateUserDetails(targetUser.id, { status: newStatus, transaction_id: newStatus === "pending" ? null : targetUser.transaction_id });
      setAllUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, ...updatedUser } : u));
      if (user?.id === targetUser.id) updateUserStatus(targetUser.id, newStatus);
      addFunds(targetUser.id, 0);
      alert(`${targetUser.name} ${newStatus}.`);
    } catch (error) {
      alert("Failed to toggle activation: " + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      await authService.deleteUser(userId);
      setAllUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      alert("Failed to delete user: " + error.message);
    }
  };

  const handleEditUser = (userToEdit) => {
    setEditUserId(userToEdit.id);
    setEditUserData({
      name: userToEdit.name || "", email: userToEdit.email || "",
      phone: userToEdit.phone || "", status: userToEdit.status || "active", role: userToEdit.role || "user",
    });
    setEditUserModalOpen(true);
  };

  const handleSaveEditUser = async () => {
    try {
      const updated = await authService.updateUserDetails(editUserId, editUserData);
      setAllUsers(prev => prev.map(u => u.id === editUserId ? { ...u, ...updated } : u));
      if (user?.id === editUserId) updateUserStatus(editUserId, editUserData.status);
      setEditUserModalOpen(false);
    } catch (error) {
      alert("Failed to update user: " + error.message);
    }
  };

  const handleManageWallet = (u) => {
    setSelectedUser(u);
    setFundAmount(""); setFundType("add"); setFundMessage(null); setFundError(null);
  };

  const handleFundSubmit = async (e) => {
    e.preventDefault();
    setFundLoading(true); setFundMessage(null); setFundError(null);
    const amountValue = parseFloat(fundAmount);
    if (isNaN(amountValue) || amountValue <= 0) { setFundError("Enter a valid amount."); setFundLoading(false); return; }
    if (!selectedUser) { setFundError("No user selected."); setFundLoading(false); return; }
    try {
      const newBalance = await authService.updateBalance(selectedUser.id, amountValue, fundType);
      addFunds(selectedUser.id, amountValue);
      setFundMessage(`${fundType === "add" ? "Added" : "Deducted"} KES ${amountValue.toLocaleString()}`);
      setFundAmount("");
      setSelectedUser(prev => prev ? { ...prev, balance: newBalance } : null);
      setAllUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, balance: newBalance } : u));
    } catch (error) {
      setFundError(error.message);
    } finally { setFundLoading(false); }
  };

  const handleSettingsChange = (key, value) => updateGlobalConfig(key, parseFloat(value) || value);

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    await new Promise(r => setTimeout(r, 400));
    setSettingsLoading(false);
    alert("Settings saved!");
  };

  const openAddTask = () => {
    setEditingTaskId(null);
    setTaskForm({ name: "", description: "", baseEarnings: "", duration: "", icon: "Video", type: "video", available: true, maxCompletions: 5, videoUrl: "", question: "", options: "" });
    setTaskModalOpen(true);
  };

  const openEditTask = (task) => {
    setEditingTaskId(task.id);
    setTaskForm({
      name: task.name || "", description: task.description || "", baseEarnings: task.baseEarnings || "",
      duration: task.duration || "", icon: task.icon || "Video", type: task.type || "video",
      available: task.available !== false, maxCompletions: task.maxCompletions || 5,
      videoUrl: task.videoUrl || "", question: task.question || "",
      options: Array.isArray(task.options) ? task.options.join(", ") : "",
    });
    setTaskModalOpen(true);
  };

  const handleTaskFormChange = (e) => {
    const { id, value, type, checked } = e.target;
    setTaskForm(prev => ({ ...prev, [id]: type === "checkbox" ? checked : value }));
  };

  const handleSaveTask = () => {
    const payload = { ...taskForm, baseEarnings: parseFloat(taskForm.baseEarnings) || 0, maxCompletions: parseInt(taskForm.maxCompletions) || 5 };
    if (payload.type === "survey" && payload.options) payload.options = payload.options.split(",").map(o => o.trim()).filter(Boolean);
    editingTaskId ? updateTask(editingTaskId, payload) : addTask(payload);
    setTaskModalOpen(false);
  };

  const handleDeleteTask = (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    deleteTask(taskId);
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
        <p className="text-xl font-semibold">Access Denied.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] pb-24 px-4 pt-4 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Admin Panel</h1>
        <button onClick={fetchAllUsers} className="p-2 rounded-lg bg-white/5 border border-white/10">
          <RefreshCcw className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
          <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <p className="text-white text-sm font-bold">{allUsers.length}</p>
          <p className="text-white/40 text-[10px]">Users</p>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
          <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-white text-sm font-bold">{allUsers.filter(u => u.status === "active").length}</p>
          <p className="text-white/40 text-[10px]">Active</p>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
          <ClipboardList className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <p className="text-white text-sm font-bold">{tasks.length}</p>
          <p className="text-white/40 text-[10px]">Tasks</p>
        </div>
      </div>

      {/* Quick Settings */}
      <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white">Settings</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-white/50 block mb-1">Activation Fee</label>
            <input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs" value={globalConfig.activationFee} onChange={(e) => handleSettingsChange("activationFee", e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-white/50 block mb-1">Referral Bonus</label>
            <input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs" value={globalConfig.referralBonus} onChange={(e) => handleSettingsChange("referralBonus", e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-white/50 block mb-1">Min Withdrawal</label>
            <input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs" value={globalConfig.minWithdrawal} onChange={(e) => handleSettingsChange("minWithdrawal", e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-white/50 block mb-1">Max Withdrawal</label>
            <input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs" value={globalConfig.maxWithdrawal} onChange={(e) => handleSettingsChange("maxWithdrawal", e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-white/50 block mb-1">Daily Bonus</label>
            <input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs" value={globalConfig.dailyBonusBase} onChange={(e) => handleSettingsChange("dailyBonusBase", e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-white/50 block mb-1">Till Number</label>
            <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs" value={globalConfig.tillNumber} onChange={(e) => handleSettingsChange("tillNumber", e.target.value)} />
          </div>
        </div>
        <button onClick={handleSaveSettings} className="w-full mt-3 py-2 rounded-xl bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-colors" disabled={settingsLoading}>
          {settingsLoading ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Tasks */}
      <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Tasks ({tasks.length})</h2>
          </div>
          <button onClick={openAddTask} className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold">+ Add</button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {tasks.slice(0, 5).map(t => (
            <div key={t.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <div>
                <p className="text-white text-xs font-medium">{t.name}</p>
                <p className="text-white/40 text-[10px]">KES {t.baseEarnings} • {t.duration}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEditTask(t)} className="p-1 rounded bg-yellow-500/10 text-yellow-500"><Edit className="w-3 h-3" /></button>
                <button onClick={() => handleDeleteTask(t.id)} className="p-1 rounded bg-red-500/10 text-red-500"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Activations */}
      <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Pending ({pendingActivations.length})</h2>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {pendingActivations.length === 0 && <p className="text-white/30 text-xs text-center py-2">No pending activations</p>}
          {pendingActivations.map(p => (
            <div key={p.userId} className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-white text-xs font-medium">{p.name}</p>
              <p className="text-white/40 text-[10px]">{p.phone} • TXN: {p.transactionId}</p>
              <div className="flex gap-2 mt-1">
                <button onClick={() => handleApprove(p.userId)} className="flex-1 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Approve</button>
                <button onClick={() => handleReject(p.userId)} className="flex-1 py-1 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Management */}
      <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white">Users</h2>
        </div>
        <div className="relative mb-2">
          <Search className="w-3 h-3 text-white/40 absolute left-2 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search..." className="w-full bg-white/5 border border-white/10 rounded-lg pl-6 pr-2 py-1.5 text-white text-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {loadingUsers ? <SkeletonLoader count={3} height="48px" /> : filteredUsers.length === 0 ? (
            <p className="text-white/30 text-xs text-center py-2">No users found</p>
          ) : filteredUsers.slice(0, 8).map(u => (
            <div key={u.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-white text-xs font-medium truncate">{u.name}</p>
                  {u.role === "admin" && <ShieldAlert className="w-3 h-3 text-primary shrink-0" />}
                </div>
                <p className="text-white/40 text-[10px]">KES {u.balance?.toLocaleString() || 0} • {u.phone}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleManageWallet(u)} className="p-1.5 rounded bg-primary/10 text-primary"><DollarSign className="w-3 h-3" /></button>
                <button onClick={() => handleToggleActivation(u)} className={`p-1.5 rounded ${u.status === "active" ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                  {u.status === "active" ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                </button>
                <button onClick={() => handleEditUser(u)} className="p-1.5 rounded bg-yellow-500/10 text-yellow-500"><Edit className="w-3 h-3" /></button>
                <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 rounded bg-red-500/10 text-red-500"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Wallet Section */}
        {selectedUser && (
          <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-white text-xs font-bold mb-1">Wallet: {selectedUser.name}</p>
            <p className="text-emerald-400 text-xs mb-2">Balance: KES {selectedUser.balance?.toLocaleString()}</p>
            <form onSubmit={handleFundSubmit} className="flex gap-2">
              <input type="number" placeholder="Amount" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} required min="0" />
              <select className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs" value={fundType} onChange={(e) => setFundType(e.target.value)}>
                <option value="add">Add</option>
                <option value="deduct">Deduct</option>
              </select>
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-bold" disabled={fundLoading}>{fundLoading ? "..." : "Go"}</button>
            </form>
            {fundError && <p className="text-red-400 text-[10px] mt-1">{fundError}</p>}
            {fundMessage && <p className="text-emerald-400 text-[10px] mt-1">{fundMessage}</p>}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editUserModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setEditUserModalOpen(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#0A0E17] border border-white/10 rounded-2xl p-5 w-full max-w-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-sm font-bold">Edit User</h3>
                <button onClick={() => setEditUserModalOpen(false)} className="p-1 rounded hover:bg-white/5 text-white/50"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2">
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" placeholder="Name" value={editUserData.name} onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })} />
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" placeholder="Email" value={editUserData.email} onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })} />
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" placeholder="Phone" value={editUserData.phone} onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" value={editUserData.status} onChange={(e) => setEditUserData({ ...editUserData, status: e.target.value })}>
                    <option value="active">Active</option><option value="pending">Pending</option>
                  </select>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" value={editUserData.role} onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}>
                    <option value="user">User</option><option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditUserModalOpen(false)} className="flex-1 py-2 rounded-xl bg-white/5 text-white text-xs font-bold">Cancel</button>
                <button onClick={handleSaveEditUser} className="flex-1 py-2 rounded-xl bg-primary/20 text-primary text-xs font-bold flex items-center justify-center gap-1"><Save className="w-3 h-3" /> Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Modal */}
      <AnimatePresence>
        {taskModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setTaskModalOpen(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#0A0E17] border border-white/10 rounded-2xl p-5 w-full max-w-sm space-y-3 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-sm font-bold">{editingTaskId ? "Edit Task" : "Add Task"}</h3>
                <button onClick={() => setTaskModalOpen(false)} className="p-1 rounded hover:bg-white/5 text-white/50"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2">
                <input id="name" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" placeholder="Task name" value={taskForm.name} onChange={handleTaskFormChange} />
                <input id="description" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" placeholder="Description" value={taskForm.description} onChange={handleTaskFormChange} />
                <div className="grid grid-cols-2 gap-2">
                  <input id="baseEarnings" type="number" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" placeholder="Earnings" value={taskForm.baseEarnings} onChange={handleTaskFormChange} />
                  <input id="duration" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" placeholder="Duration" value={taskForm.duration} onChange={handleTaskFormChange} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select id="type" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" value={taskForm.type} onChange={handleTaskFormChange}>
                    <option value="video">Video</option><option value="survey">Survey</option>
                  </select>
                  <input id="icon" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" placeholder="Icon name" value={taskForm.icon} onChange={handleTaskFormChange} />
                </div>
                {taskForm.type === "video" && (
                  <input id="videoUrl" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" placeholder="YouTube URL" value={taskForm.videoUrl} onChange={handleTaskFormChange} />
                )}
                {taskForm.type === "survey" && (
                  <>
                    <input id="question" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" placeholder="Question" value={taskForm.question} onChange={handleTaskFormChange} />
                    <input id="options" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" placeholder="Options (comma separated)" value={taskForm.options} onChange={handleTaskFormChange} />
                  </>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setTaskModalOpen(false)} className="flex-1 py-2 rounded-xl bg-white/5 text-white text-xs font-bold">Cancel</button>
                <button onClick={handleSaveTask} className="flex-1 py-2 rounded-xl bg-primary/20 text-primary text-xs font-bold flex items-center justify-center gap-1"><Save className="w-3 h-3" /> Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}