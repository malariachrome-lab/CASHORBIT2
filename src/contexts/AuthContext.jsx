import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

// Safe initialization function
const safeFetchInitialUser = async () => {
  try {
    const savedUser = localStorage.getItem("cashorbit_user");
    if (savedUser && savedUser.includes("admin_local_id")) {
      return JSON.parse(savedUser);
    }
    return null;
  } catch (error) {
    console.warn("Error fetching initial user:", error);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedUser = localStorage.getItem("cashorbit_user");
      if (savedUser && savedUser.includes("admin_local_id")) {
        // Handle local admin bypass
        setUser(JSON.parse(savedUser));
      } else {
        const currentUser = await authService.getSession();
        setUser(currentUser);
        if (currentUser) {
          localStorage.setItem("cashorbit_user", JSON.stringify(currentUser));
        } else {
          localStorage.removeItem("cashorbit_user");
        }
      }
    } catch (e) {
      console.error("Error fetching session or user:", e);
      localStorage.removeItem("cashorbit_user");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Real-time listener for current user's profile changes (balance, status, etc.)
  useEffect(() => {
    if (user?.id && user.role !== "admin") {
      const currentUserId = user.id;
      
      const unsubscribe = authService.subscribeToProfileChanges(
        currentUserId,
        (updatedProfile) => {
          if (updatedProfile && updatedProfile.id === currentUserId) {
            // Get current status BEFORE update
            setUser(prevUser => {
              const wasPending = prevUser.status === "pending";
              const isNowActive = updatedProfile.status === "active";
              
              const merged = { ...prevUser, ...updatedProfile };
              localStorage.setItem("cashorbit_user", JSON.stringify(merged));
              
              // Redirect ONLY after state has been updated
              setTimeout(() => {
                if (wasPending && isNowActive && window.location.pathname === "/activate") {
                  window.location.href = "/";
                }
                
                if (updatedProfile.status === "pending" && window.location.pathname !== "/activate") {
                  window.location.href = "/activate";
                }
              }, 0);
              
              return merged;
            });
          }
        }
      );
      
      return () => unsubscribe();
    }
  }, [user?.id]);

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      // Special handling for hardcoded admin
      if (email === "admin@cashorbit.com" && password === "admin123") {
        const adminUser = await authService.login(email, password);
        setUser(adminUser);
        localStorage.setItem("cashorbit_user", JSON.stringify(adminUser));
        return { success: true };
      }

      const userData = await authService.login(email, password);
      setUser(userData);
      localStorage.setItem("cashorbit_user", JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  const register = useCallback(async (data) => {
    try {
      setError(null);
      const userData = await authService.register(data);
      setUser(userData);
      localStorage.setItem("cashorbit_user", JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setError(null);
      await authService.logout();
      setUser(null);
      localStorage.removeItem("cashorbit_user");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const updateBalance = useCallback((newBalance) => {
    if (user) {
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      localStorage.setItem("cashorbit_user", JSON.stringify(updatedUser));
    }
  }, [user]);

  const updateUserStatus = useCallback(
    (userId, newStatus) => {
      if (user && user.id === userId) {
        const updatedUser = { ...user, status: newStatus };
        setUser(updatedUser);
        localStorage.setItem("cashorbit_user", JSON.stringify(updatedUser));
      }
    },
    [user]
  );

  const updateUserDetails = useCallback(
    (userId, detailsToUpdate) => {
      if (user && user.id === userId) {
        const updatedUser = { ...user, ...detailsToUpdate };
        setUser(updatedUser);
        localStorage.setItem("cashorbit_user", JSON.stringify(updatedUser));
      }
    },
    [user]
  );

  const value = {
    user,
    setUser, // Expose setUser for admin actions or direct updates
    isLoading,
    error,
    login,
    register,
    logout,
    updateBalance,
    updateUserStatus,
    updateUserDetails,
    isAuthenticated: !!user,
    isPending: user?.status === "pending",
    isActive: user?.status === "active",
    isAdmin: user?.role === "admin",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
