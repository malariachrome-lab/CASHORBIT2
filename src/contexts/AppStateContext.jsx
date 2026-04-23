import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockDataService } from '../services/dataService';
import { mockAuthService } from '../services/authService';

const AppStateContext = createContext(null);

// Safe initialization functions with fallbacks
const safeGetPlatformStats = () => {
  try {
    const stats = mockDataService.getPlatformStats();
    return stats || { totalPayouts: 0, activeUsers: 0, tasksCompleted: 0, totalEarnings: 0, newUsersToday: 0, payoutsToday: 0 };
  } catch (error) {
    console.warn('Error getting platform stats:', error);
    return { totalPayouts: 0, activeUsers: 0, tasksCompleted: 0, totalEarnings: 0, newUsersToday: 0, payoutsToday: 0 };
  }
};

const safeGetTasks = () => {
  try {
    const tasks = mockDataService.getTasks();
    return Array.isArray(tasks) ? tasks : [];
  } catch (error) {
    console.warn('Error getting tasks:', error);
    return [];
  }
};

const safeGetActivityFeed = () => {
  try {
    const feed = mockDataService.getActivityFeed();
    return Array.isArray(feed) ? feed : [];
  } catch (error) {
    console.warn('Error getting activity feed:', error);
    return [];
  }
};

const safeGetPendingActivations = () => {
  try {
    const activations = mockAuthService.getPendingActivations();
    return Array.isArray(activations) ? activations : [];
  } catch (error) {
    console.warn('Error getting pending activations:', error);
    return [];
  }
};

const safeGetGlobalSettings = () => {
  try {
    const settings = mockDataService.getGlobalSettings();
    return settings || {
      activationFee: 1000,
      referralBonus: 100,
      minWithdrawal: 500,
      maxWithdrawal: 50000,
      dailyBonusBase: 50,
      tillNumber: "5707223",
      dailyBonusResetHours: 24
    };
  } catch (error) {
    console.warn('Error getting global settings:', error);
    return {
      activationFee: 1000,
      referralBonus: 100,
      minWithdrawal: 500,
      maxWithdrawal: 50000,
      dailyBonusBase: 50,
      tillNumber: "5707223",
      dailyBonusResetHours: 24
    };
  }
};

export function AppStateProvider({ children }) {
  const [platformStats, setPlatformStats] = useState(() => safeGetPlatformStats());
  const [tasks, setTasks] = useState(() => safeGetTasks());
  const [activityFeed, setActivityFeed] = useState(() => safeGetActivityFeed());
  const [pendingActivations, setPendingActivations] = useState(() => safeGetPendingActivations());
  const [dailyStreak, setDailyStreak] = useState(() => {
    try {
      const savedStreak = localStorage.getItem('cashorbit_streak');
      return savedStreak ? JSON.parse(savedStreak) : {
        current: 0,
        lastClaim: null,
        multiplier: 1
      };
    } catch (error) {
      console.warn('Error parsing daily streak:', error);
      return {
        current: 0,
        lastClaim: null,
        multiplier: 1
      };
    }
  });

  // Daily task limit (7 per day)
  const [dailyTasks, setDailyTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('cashorbit_daily_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        const today = new Date().toDateString();
        if (parsed.date === today) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error loading daily tasks:', e);
    }
    return { date: new Date().toDateString(), count: 0, completedTaskIds: [] };
  });

  const [globalConfig, setGlobalConfig] = useState(() => safeGetGlobalSettings());

  // Fetch initial global settings
  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const settings = await mockDataService.getGlobalSettingsFromDB();
        if (settings) {
          setGlobalConfig(settings);
        }
      } catch (error) {
        console.warn('Failed to fetch global settings, using defaults:', error);
        setGlobalConfig(mockDataService.getGlobalSettings());
      }
    };
    fetchGlobalSettings();
  }, []);

  // Simulate real-time updates for platform stats (can be replaced by Supabase Realtime for aggregates)
  useEffect(() => {
    const interval = setInterval(() => {
      setPlatformStats(prev => ({
        ...prev,
        totalPayouts: (prev.totalPayouts || 0) + Math.random() * 100,
        activeUsers: (prev.activeUsers || 0) + Math.floor(Math.random() * 3) - 1,
        tasksCompleted: (prev.tasksCompleted || 0) + Math.floor(Math.random() * 5)
      }));

      if (Math.random() > 0.7) {
        const newActivity = mockDataService.generateRandomActivity();
        setActivityFeed(prev => [newActivity, ...prev.slice(0, 49)]);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Poll for pending activations updates
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const activations = mockAuthService.getPendingActivations();
        setPendingActivations(activations);
      } catch (error) {
        console.warn('Failed to poll pending activations:', error);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const completeTask = useCallback((taskId, earnings) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: true, earnings: (task.earnings || 0) + earnings, currentCompletions: (task.currentCompletions || 0) + 1 } 
        : task
    ));
    setDailyTasks(prev => {
      const today = new Date().toDateString();
      const isNewDay = prev.date !== today;
      const newState = isNewDay 
        ? { date: today, count: 1, completedTaskIds: [taskId] }
        : { ...prev, count: prev.count + 1, completedTaskIds: [...prev.completedTaskIds, taskId] };
      localStorage.setItem('cashorbit_daily_tasks', JSON.stringify(newState));
      return newState;
    });
    setActivityFeed(prev => [{
      id: Date.now(),
      type: 'task_completed',
      message: `Task completed! Earned KES ${earnings}`,
      timestamp: new Date().toISOString(),
      amount: earnings,
      user: 'You' 
    }, ...prev]);
  }, []);

  const addFunds = useCallback((userId, amount) => {
    setActivityFeed(prev => [{
      id: Date.now(),
      type: 'funds_added',
      message: `KES ${amount} added to user account`,
      timestamp: new Date().toISOString(),
      amount,
      user: `Admin for ${userId}` 
    }, ...prev]);
  }, []);

  const approveActivation = useCallback((userId) => {
    setPendingActivations(prev => prev.filter(p => p.userId !== userId)); 
    setActivityFeed(prev => [{
      id: Date.now(),
      type: 'activation_approved',
      message: `User ${userId} account activated`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    }, ...prev]);
  }, []);

  const rejectActivation = useCallback((userId) => {
    setPendingActivations(prev => prev.filter(p => p.userId !== userId)); 
    setActivityFeed(prev => [{
      id: Date.now(),
      type: 'activation_rejected',
      message: `User ${userId} activation rejected`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    }, ...prev]);
  }, []);

  const claimDailyBonus = useCallback(() => {
    const today = new Date().toDateString();
    const lastClaim = dailyStreak.lastClaim ? new Date(dailyStreak.lastClaim).toDateString() : null;
    
    if (lastClaim === today) {
      return { success: false, error: 'Already claimed today' };
    }

    let newStreak;
    if (lastClaim) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastClaim === yesterday.toDateString()) {
        newStreak = {
          current: dailyStreak.current + 1,
          lastClaim: new Date().toISOString(),
          multiplier: Math.min(dailyStreak.multiplier + 0.1, 3)
        };
      } else {
        newStreak = {
          current: 1,
          lastClaim: new Date().toISOString(),
          multiplier: 1
        };
      }
    } else {
      newStreak = {
        current: 1,
        lastClaim: new Date().toISOString(),
        multiplier: 1
      };
    }

    setDailyStreak(newStreak);
    localStorage.setItem('cashorbit_streak', JSON.stringify(newStreak));

    const bonus = Math.floor(globalConfig.dailyBonusBase * newStreak.multiplier);
    return { success: true, bonus };
  }, [dailyStreak, globalConfig.dailyBonusBase]);

  const updateGlobalConfig = useCallback(async (key, value) => {
    setGlobalConfig(prev => ({
      ...prev,
      [key]: value
    }));
    await mockDataService.updateGlobalSettingInDB(key, value);
  }, []);

  const addTask = useCallback((task) => {
    const newTask = mockDataService.addTask(task);
    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, []);

  const updateTask = useCallback((taskId, updates) => {
    const updated = mockDataService.updateTask(taskId, updates);
    if (updated) {
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    }
    return updated;
  }, []);

  const deleteTask = useCallback((taskId) => {
    const success = mockDataService.deleteTask(taskId);
    if (success) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
    return success;
  }, []);

  const dailyTasksLeft = Math.max(0, 7 - dailyTasks.count);

  const value = {
    platformStats,
    tasks,
    activityFeed,
    pendingActivations,
    dailyStreak,
    globalConfig,
    dailyTasks,
    dailyTasksLeft,
    completeTask,
    addFunds,
    approveActivation,
    rejectActivation,
    claimDailyBonus,
    updateGlobalConfig,
    setTasks,
    addTask,
    updateTask,
    deleteTask,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
