// Mock authentication service for Cash Orbit - pure localStorage/mock based

const ADMIN_EMAIL = "admin@cashorbit.com";
const ADMIN_PASSWORD = "admin123";

// Load mock users from localStorage or use defaults
const loadMockUsers = () => {
  try {
    const saved = localStorage.getItem("cashorbit_mock_users");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Error loading mock users:", e);
  }
  return [
    {
      id: "1",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: "Admin User",
      phone: "+254700000000",
      balance: 0,
      status: "active",
      role: "admin",
      referralCode: "ADMIN001",
      referredBy: null,
      businessTills: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      email: "demo@cashorbit.com",
      password: "demo123",
      name: "Demo User",
      phone: "+254712345678",
      balance: 2500,
      status: "active",
      role: "user",
      referralCode: "DEMO002",
      referredBy: null,
      businessTills: [],
      createdAt: new Date().toISOString(),
    },
  ];
};

let mockUsers = loadMockUsers();

const saveMockUsers = () => {
  try {
    localStorage.setItem("cashorbit_mock_users", JSON.stringify(mockUsers));
  } catch (e) {
    console.warn("Error saving mock users:", e);
  }
};

// Generate unique referral code
const generateReferralCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const mockAuthService = {
  async login(email, password) {
    // Admin bypass
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser = {
        id: "admin_local_id",
        email: ADMIN_EMAIL,
        name: "Local Admin",
        balance: 0,
        status: "active",
        role: "admin",
        referralCode: "ADMIN001",
        createdAt: new Date().toISOString(),
        businessTills: [],
        referredBy: null,
      };
      return adminUser;
    }

    // Mock user login
    const user = mockUsers.find((u) => u.email === email && u.password === password);
    if (!user) {
      throw new Error("Invalid email or password.");
    }
    return { ...user, password: undefined };
  },

  async register(data) {
    const { email, password, name, phone, referralCode } = data;

    // Check if email already exists
    if (mockUsers.some((u) => u.email === email)) {
      throw new Error("Email already registered.");
    }

    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      password,
      name,
      phone,
      referral_code: generateReferralCode(),
      referred_by: referralCode || null,
      balance: 0,
      status: "pending",
      role: "user",
      business_tills: [],
      transaction_id: null,
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);
    saveMockUsers();

    return { ...newUser, password: undefined };
  },

  async logout() {
    // No server-side logout needed for mock
    return;
  },

  async getSession() {
    // Check localStorage for saved user
    try {
      const savedUser = localStorage.getItem("cashorbit_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        // For admin bypass, just return it
        if (parsed.id === "admin_local_id") return parsed;
        // For regular users, find in mockUsers to get latest data
        const liveUser = mockUsers.find((u) => u.id === parsed.id);
        if (liveUser) {
          return { ...liveUser, password: undefined };
        }
      }
    } catch (e) {
      console.warn("Error getting session:", e);
    }
    return null;
  },

  async submitActivationPayment(userId, transactionId) {
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) throw new Error("User not found.");
    user.transaction_id = transactionId;
    saveMockUsers();
    return { success: true, message: "Payment submitted for verification" };
  },

  async approveUser(userId) {
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) throw new Error("User not found.");
    user.status = "active";
    user.transaction_id = null;
    saveMockUsers();
    return { ...user, password: undefined };
  },

  async rejectUser(userId) {
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) throw new Error("User not found.");
    user.transaction_id = null;
    saveMockUsers();
    return { success: true, message: "User activation rejected" };
  },

  async updateBalance(userId, amount, type = "add") {
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) throw new Error("User not found.");

    let newBalance = user.balance || 0;
    if (type === "add") {
      newBalance += amount;
    } else if (type === "deduct") {
      newBalance = Math.max(0, newBalance - amount);
    }

    user.balance = newBalance;
    saveMockUsers();
    return newBalance;
  },

  async addBusinessTill(userId, tillName, tillNumber) {
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) throw new Error("User not found.");

    const currentTills = user.business_tills || [];
    const newTill = {
      id: Date.now().toString(),
      name: tillName,
      number: tillNumber,
      createdAt: new Date().toISOString(),
    };
    user.business_tills = [...currentTills, newTill];
    saveMockUsers();
    return user.business_tills;
  },

  async getUserById(userId) {
    const user = mockUsers.find((u) => u.id === userId);
    return user ? { ...user, password: undefined } : null;
  },

  async getAllUsers() {
    return mockUsers.map((u) => ({ ...u, password: undefined }));
  },

  async deleteUser(userId) {
    const idx = mockUsers.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error("User not found.");
    mockUsers.splice(idx, 1);
    saveMockUsers();
    return { success: true, message: "User deleted successfully." };
  },

  async updateUserDetails(userId, details) {
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) throw new Error("User not found.");
    Object.assign(user, details);
    saveMockUsers();
    return { ...user, password: undefined };
  },

  // No-op real-time listeners (kept for API compatibility)
  subscribeToProfileChanges(userId, callback) {
    // Mock real-time: poll every 3 seconds
    const interval = setInterval(() => {
      const user = mockUsers.find((u) => u.id === userId);
      if (user) {
        callback({ ...user, password: undefined });
      }
    }, 3000);
    return () => clearInterval(interval);
  },

  subscribeToAllProfileChanges(callback) {
    // Mock real-time: poll every 3 seconds
    let lastHash = "";
    const interval = setInterval(() => {
      const hash = JSON.stringify(mockUsers);
      if (hash !== lastHash) {
        lastHash = hash;
        mockUsers.forEach((u) => {
          callback({ new: { ...u, password: undefined } });
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  },

  // Get pending activations from mock data
  getPendingActivations() {
    return mockUsers
      .filter((u) => u.status === "pending" && u.transaction_id)
      .map((u) => ({
        userId: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        transactionId: u.transaction_id,
        amount: 1000,
        submittedAt: u.createdAt,
      }));
  },
};
