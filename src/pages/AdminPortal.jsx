import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { authService } from "../services/authService";
import { withdrawalService } from "../services/withdrawalService";
import { liveActivityService } from "../services/liveActivityService";
import { motion } from "framer-motion";
import {
  Users, CheckCircle, XCircle, Search, DollarSign, ShieldAlert,
  RefreshCcw, Trash2, Edit, ClipboardList, X, Save, Activity,
  Wallet, Zap, ArrowUpRight, ArrowDownRight, BarChart3, Crown,
  Settings, AlertCircle
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
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [liveActivities, setLiveActivities] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editUserData, setEditUserData] = useState({ name: "", email: "", phone: "", status: "active", role: "user" });
  const [editUserId, setEditUserId] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ name: "", description: "", baseEarnings: "", duration: "", icon: "Video", type: "video", available: true, maxCompletions: 5, videoUrl: "", question: "", options: "" });
  const [editingTaskId, setEditingTaskId] = useState(null);

  const fetchAllUsers = useCallback(async () => {
    setLoadingUsers(true);
    try { const users = await authService.getAllUsers(); setAllUsers(users); }
    catch (err) { console.error(err); }
    finally { setLoadingUsers(false); }
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    setLoadingWithdrawals(true);
    try { const data = await withdrawalService.getAllWithdrawals(); setWithdrawals(data); }
    catch (err) { console.error(err); }
    finally { setLoadingWithdrawals(false); }
  }, []);

  const fetchLiveActivities = useCallback(async () => {
    try { const data = await liveActivityService.getRecentActivities(30); setLiveActivities(data); }
    catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers(); 
      fetchWithdrawals(); 
      fetchLiveActivities();
      
      // Real-time subscription for ALL withdrawals (admin gets everything)
      const unsubWithdrawals = withdrawalService.subscribeToWithdrawals((payload) => {
        // Refresh withdrawals IMMEDIATELY on any change (new, update, delete)
        fetchWithdrawals();
      });
      
      const unsubAct = liveActivityService.subscribeToActivities((act) => {
        setLiveActivities(prev => [act, ...prev.slice(0, 49)]);
      });
      
      return () => { 
        unsubWithdrawals(); 
        unsubAct(); 
      };
    }
  }, [isAdmin, fetchAllUsers, fetchWithdrawals, fetchLiveActivities]);

  const handleApprove = async (userId) => {
    try { const updatedUser = await authService.approveUser(userId); approveActivation(userId); setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedUser } : u)); if (user?.id === userId) updateUserStatus(userId, updatedUser.status); }
    catch (error) { alert("Failed: " + error.message); }
  };

  const handleReject = async (userId) => {
    try { await authService.rejectUser(userId); rejectActivation(userId); setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'pending', transaction_id: null } : u)); if (user?.id === userId) updateUserStatus(userId, 'pending'); }
    catch (error) { alert("Failed: " + error.message); }
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    try { await withdrawalService.approveWithdrawal(withdrawalId, user.id); fetchWithdrawals(); }
    catch (error) { alert("Failed: " + error.message); }
  };

  const handleRejectWithdrawal = async (withdrawalId, userId, amount) => {
    try { await withdrawalService.rejectWithdrawal(withdrawalId, user.id); await authService.updateBalance(userId, Number(amount), "add"); fetchWithdrawals(); fetchAllUsers(); }
    catch (error) { alert("Failed: " + error.message); }
  };

  const handleToggleActivation = async (targetUser) => {
    try { const newStatus = targetUser.status === "active" ? "pending" : "active"; const updatedUser = await authService.updateUserDetails(targetUser.id, { status: newStatus }); setAllUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, ...updatedUser } : u)); if (user?.id === targetUser.id) updateUserStatus(targetUser.id, newStatus); addFunds(targetUser.id, 0); }
    catch (error) { alert("Failed: " + error.message); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete permanently?")) return;
    try { await authService.deleteUser(userId); setAllUsers(prev => prev.filter(u => u.id !== userId)); }
    catch (error) { alert("Failed: " + error.message); }
  };

  const handleEditUser = (userToEdit) => { setEditUserId(userToEdit.id); setEditUserData({ name: userToEdit.name || "", email: userToEdit.email || "", phone: userToEdit.phone || "", status: userToEdit.status || "active", role: userToEdit.role || "user" }); setEditUserModalOpen(true); };

  const handleSaveEditUser = async () => {
    try { const updated = await authService.updateUserDetails(editUserId, editUserData); setAllUsers(prev => prev.map(u => u.id === editUserId ? { ...u, ...updated } : u)); if (user?.id === editUserId) updateUserStatus(editUserId, editUserData.status); setEditUserModalOpen(false); }
    catch (error) { alert("Failed: " + error.message); }
  };

  const handleManageWallet = (u) => { setSelectedUser(u); setFundAmount(""); setFundType("add"); setFundMessage(null); setFundError(null); };

  const handleFundSubmit = async (e) => {
    e.preventDefault(); setFundLoading(true); setFundMessage(null); setFundError(null);
    const amountValue = parseFloat(fundAmount);
    if (isNaN(amountValue) || amountValue <= 0) { setFundError("Invalid amount."); setFundLoading(false); return; }
    if (!selectedUser) { setFundError("No user selected."); setFundLoading(false); return; }
    try { const newBalance = await authService.updateBalance(selectedUser.id, amountValue, fundType); addFunds(selectedUser.id, amountValue); setFundMessage(`${fundType === "add" ? "Added" : "Deducted"} KES ${amountValue.toLocaleString()}`); setFundAmount(""); setSelectedUser(prev => prev ? { ...prev, balance: newBalance } : null); setAllUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, balance: newBalance } : u)); }
    catch (error) { setFundError(error.message); }
    finally { setFundLoading(false); }
  };

  const handleSettingsChange = (key, value) => updateGlobalConfig(key, parseFloat(value) || value);
  const handleSaveSettings = async () => { setSettingsLoading(true); await new Promise(r => setTimeout(r, 400)); setSettingsLoading(false); alert("Saved!"); };
  const openAddTask = () => { setEditingTaskId(null); setTaskForm({ name: "", description: "", baseEarnings: "", duration: "", icon: "Video", type: "video", available: true, maxCompletions: 5, videoUrl: "", question: "", options: "" }); setTaskModalOpen(true); };
  const openEditTask = (task) => { setEditingTaskId(task.id); setTaskForm({ name: task.name || "", description: task.description || "", baseEarnings: task.baseEarnings || "", duration: task.duration || "", icon: task.icon || "Video", type: task.type || "video", available: task.available !== false, maxCompletions: task.maxCompletions || 5, videoUrl: task.videoUrl || "", question: task.question || "", options: Array.isArray(task.options) ? task.options.join(", ") : "" }); setTaskModalOpen(true); };
  const handleTaskFormChange = (e) => { const { id, value, type, checked } = e.target; setTaskForm(prev => ({ ...prev, [id]: type === "checkbox" ? checked : value })); };
  const handleSaveTask = () => { const payload = { ...taskForm, baseEarnings: parseFloat(taskForm.baseEarnings) || 0, maxCompletions: parseInt(taskForm.maxCompletions) || 5 }; if (payload.type === "survey" && payload.options) payload.options = payload.options.split(",").map(o => o.trim()).filter(Boolean); editingTaskId ? updateTask(editingTaskId, payload) : addTask(payload); setTaskModalOpen(false); };
  const handleDeleteTask = (taskId) => { if (!window.confirm("Delete task?")) return; deleteTask(taskId); };

  const filteredUsers = allUsers.filter((u) => u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.phone?.includes(searchTerm));
  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending");
  const totalPendingAmount = pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-error">
        <ShieldAlert className="w-10 h-10 mr-3" />
        <p className="text-xl font-semibold">Access Denied.</p>
      </div>
    );
  }

  const TabButton = ({ id, label, icon: Icon, count }) => (
    <button onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === id ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 text-white/60 border border-white/5 hover:bg-white/10"}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
      {count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px]">{count}</span>}
    </button>
  );

  const renderDashboard = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <motion.div whileHover={{ scale: 1.03 }} className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-white/10 text-center">
          <Users className="w-5 h-5 text-blue-400 mx-auto mb-2" />
          <p className="text-white text-xl font-black">{allUsers.length}</p>
          <p className="text-white/40 text-[10px]">Total Users</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl border border-white/10 text-center">
          <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
          <p className="text-white text-xl font-black">{allUsers.filter(u => u.status === "active").length}</p>
          <p className="text-white/40 text-[10px]">Active</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-white/10 text-center">
          <DollarSign className="w-5 h-5 text-amber-400 mx-auto mb-2" />
          <p className="text-white text-xl font-black">{pendingWithdrawals.length}</p>
          <p className="text-white/40 text-[10px]">Pending Withdrawals</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/10 text-center">
          <Wallet className="w-5 h-5 text-purple-400 mx-auto mb-2" />
          <p className="text-white text-xl font-black">KES {totalPendingAmount.toLocaleString()}</p>
          <p className="text-white/40 text-[10px]">Pending Amount</p>
        </motion.div>
      </div>

      <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white">Quick Settings</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["activationFee","referralBonus","minWithdrawal","maxWithdrawal","dailyBonusBase","tillNumber"].map(key => (
            <div key={key}>
              <label className="text-[10px] text-white/50 block mb-1">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
              <input type={key === "tillNumber" ? "text" : "number"} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs" value={globalConfig[key]} onChange={(e) => handleSettingsChange(key, e.target.value)} />
            </div>
          ))}
        </div>
        <button onClick={handleSaveSettings} className="w-full mt-3 py-2 rounded-xl bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-colors" disabled={settingsLoading}>
          {settingsLoading ? "Saving..." : "Save Settings"}
        </button>
      </div>

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
                <p className="text-white/40 text-[10px]">KES {t.baseEarnings} &bull; {t.duration}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEditTask(t)} className="p-1 rounded bg-yellow-500/10 text-yellow-500"><Edit className="w-3 h-3" /></button>
                <button onClick={() => handleDeleteTask(t.id)} className="p-1 rounded bg-red-500/10 text-red-500"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-500/30">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">PENDING ACTIVATIONS ({pendingActivations.length})</h2>
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {pendingActivations.length === 0 && (
            <div className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-white/50 text-sm">No pending activations</p>
            </div>
          )}
          {pendingActivations.map(p => (
            <motion.div 
              key={p.userId} 
              className="p-4 rounded-xl bg-white/[0.05] border border-white/10"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white text-sm font-bold">{p.name}</p>
                  <p className="text-white/40 text-xs">{p.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-400 text-sm font-bold">KES 1000</p>
                  <p className="text-white/30 text-[10px]">Activation Fee</p>
                </div>
              </div>
              
              <div className="bg-black/30 p-2 rounded-lg mb-3">
                <p className="text-white/40 text-[10px] mb-1">MPESA TRANSACTION ID:</p>
                <p className="text-white font-mono text-sm">{p.transactionId}</p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => handleApprove(p.userId)} 
                  className="flex-1 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold hover:bg-emerald-500/30 transition-colors"
                >
                  ✓ APPROVE ACCOUNT
                </button>
                <button 
                  onClick={() => handleReject(p.userId)} 
                  className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/30 transition-colors"
                >
                  ✗ REJECT
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWithdrawals = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-white/60 text-xs">Pending Withdrawals</p>
            <p className="text-white text-2xl font-black">KES {totalPendingAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {loadingWithdrawals ? <SkeletonLoader count={3} height="60px" /> : withdrawals.length === 0 ? (
          <p className="text-white/30 text-xs text-center py-4">No withdrawals</p>
        ) : withdrawals.map(w => (
          <motion.div key={w.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-white text-sm font-bold">{w.profiles?.name || "Unknown"}</p>
                <p className="text-white/40 text-[10px]">{w.phone || w.profiles?.phone || "N/A"}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                w.status === "approved" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                w.status === "rejected" ? "text-red-400 bg-red-500/10 border-red-500/20" :
                "text-amber-400 bg-amber-500/10 border-amber-500/20"
              }`}>{w.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-white text-lg font-black">KES {Number(w.amount).toLocaleString()}</p>
              {w.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => handleApproveWithdrawal(w.id)} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors">Approve</button>
                  <button onClick={() => handleRejectWithdrawal(w.id, w.user_id, w.amount)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors">Reject</button>
                </div>
              )}
            </div>
            <p className="text-white/20 text-[9px] mt-1">{new Date(w.created_at).toLocaleString()}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4">
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
                <p className="text-white/40 text-[10px]">KES {u.balance?.toLocaleString() || 0} &bull; {u.phone}</p>
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
    </div>
  );

  const renderLive = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-red-400 animate-pulse" />
          <h2 className="text-sm font-bold text-white">Live Activity Monitor</h2>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold animate-pulse">LIVE</span>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {liveActivities.length === 0 && <p className="text-white/30 text-xs text-center py-4">No activity yet</p>}
          {liveActivities.map((activity, i) => (
            <motion.div key={activity.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activity.is_real === false ? 'bg-blue-500/10' : activity.type === 'withdrawal' ? 'bg-red-500/10' : activity.type === 'deposit' ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
                {activity.is_real === false ? <Zap className="w-4 h-4 text-blue-400" /> : activity.type === 'withdrawal' ? <ArrowUpRight className="w-4 h-4 text-red-400" /> : activity.type === 'deposit' ? <ArrowDownRight className="w-4 h-4 text-emerald-400" /> : <Activity className="w-4 h-4 text-white/40" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs truncate">{activity.message || `${activity.user_name} ${activity.type}`}</p>
                <p className="text-white/30 text-[10px]">{new Date(activity.created_at || activity.timestamp).toLocaleTimeString()} {activity.is_real === false && <span className="text-blue-400/60 ml-1">(simulated)</span>}</p>
              </div>
              {activity.amount && <span className={`text-xs font-bold shrink-0 ${activity.type === 'withdrawal' ? 'text-red-400' : 'text-emerald-400'}`}>{activity.type === 'withdrawal' ? '-' : '+'}KES {Number(activity.amount).toLocaleString()}</span>}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-80px)] pb-24 px-4 pt-4 max-w-lg mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" /> Admin Panel
          </h1>
          <p className="text-white/30 text-[10px]">Global Dashboard</p>
        </div>
        <button onClick={() => { fetchAllUsers(); fetchWithdrawals(); fetchLiveActivities(); }} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <RefreshCcw className="w-4 h-4 text-white/60" />
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-2 overflow-x-auto pb-1">
        <TabButton id="dashboard" label="Dashboard" icon={BarChart3} />
        <TabButton id="withdrawals" label="Withdrawals" icon={DollarSign} count={pendingWithdrawals.length} />
        <TabButton id="users" label="Users" icon={Users} />
        <TabButton id="live" label="Live" icon={Activity} />
      </motion.div>

      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "withdrawals" && renderWithdrawals()}
      {activeTab === "users" && renderUsers()}
      {activeTab === "live" && renderLive()}

      {editUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setEditUserModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-[#0A0E17] border border-white/10 rounded-2xl p-5 w-full max-w-sm space-y-3">
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
          </div>
        </div>
      )}

      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setTaskModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-[#0A0E17] border border-white/10 rounded-2xl p-5 w-full max-w-sm space-y-3 max-h-[90vh] overflow-y-auto">
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
              {taskForm.type === "video" && <input id="videoUrl" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" placeholder="YouTube URL" value={taskForm.videoUrl} onChange={handleTaskFormChange} />}
              {taskForm.type === "survey" && <><input id="question" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" placeholder="Question" value={taskForm.question} onChange={handleTaskFormChange} /><input id="options" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs" placeholder="Options (comma separated)" value={taskForm.options} onChange={handleTaskFormChange} /></>}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setTaskModalOpen(false)} className="flex-1 py-2 rounded-xl bg-white/5 text-white text-xs font-bold">Cancel</button>
              <button onClick={handleSaveTask} className="flex-1 py-2 rounded-xl bg-primary/20 text-primary text-xs font-bold flex items-center justify-center gap-1"><Save className="w-3 h-3" /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
