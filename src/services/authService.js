import { supabase } from "../lib/supabase";

const ADMIN_EMAIL = "admin@cashorbit.com";
const ADMIN_PASSWORD = "admin123";

function normalizeProfile(rawProfile) {
  if (!rawProfile) return null;
  return {
    id: rawProfile.id,
    email: rawProfile.email,
    name: rawProfile.name,
    phone: rawProfile.phone,
    balance: Number(rawProfile.balance) || 0,
    status: rawProfile.status || "pending",
    role: rawProfile.role || "user",
    referralCode: rawProfile.referral_code,
    referredBy: rawProfile.referred_by,
    businessTills: Array.isArray(rawProfile.business_tills) ? rawProfile.business_tills : [],
    transaction_id: rawProfile.transaction_id,
    createdAt: rawProfile.created_at,
  };
}

// 100% CUSTOM AUTHENTICATION SYSTEM - NO SUPABASE AUTH AT ALL
// 0 RATE LIMITS - NEVER AGAIN
export const authService = {
  async login(identifier, password) {
    // Hardcoded admin bypass
    if (identifier === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
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
      localStorage.setItem("cashorbit_user", JSON.stringify(adminUser));
      return adminUser;
    }

    // Normal user login
    const cleanPhone = identifier.replace(/\D/g, '');
    
    const { data: user, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("phone", cleanPhone)
      .single();

    if (error || !user) throw new Error("Invalid phone number or password");

    // Verify password (simple hash for now)
    if (atob(user.password_hash) !== password) {
      throw new Error("Invalid phone number or password");
    }

    const validUser = normalizeProfile(user);
    localStorage.setItem("cashorbit_user", JSON.stringify(validUser));
    
    return validUser;
  },

  async register(data) {
    const { password, name, phone, referralCode } = data;
    const cleanPhone = phone.replace(/\D/g, '');

    // Check if phone already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (existing) throw new Error("Phone number already registered");

    // Generate proper UUID manually
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const userId = generateUUID();
    const dummyEmail = `${cleanPhone}@cashorbit.local`;
    const referralCodeGen = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create user DIRECTLY - NO SUPABASE AUTH, 0 RATE LIMITS
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: dummyEmail,
        name,
        phone: cleanPhone,
        password_hash: btoa(password),
        balance: 0,
        status: "pending",
        role: "user",
        referral_code: referralCodeGen,
        referred_by: referralCode || null,
      })
      .select()
      .single();

    if (profileError) throw new Error(profileError.message);

    // Set session
    const user = normalizeProfile(profileData);
    localStorage.setItem("cashorbit_user", JSON.stringify(user));
    
    return user;
  },

  async logout() {
    localStorage.removeItem("cashorbit_user");
    return true;
  },

  async getSession() {
    try {
      const savedUser = localStorage.getItem("cashorbit_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed;
      }
    } catch (e) {
      console.warn("Error getting local user:", e);
    }
    return null;
  },

  async submitActivationPayment(userId, transactionId) {
    const { error } = await supabase
      .from("profiles")
      .update({ transaction_id: transactionId })
      .eq("id", userId);

    if (error) throw new Error(error.message);
    return { success: true, message: "Payment submitted for verification" };
  },

  async approveUser(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ status: "active", transaction_id: null })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return normalizeProfile(data);
  },

  async rejectUser(userId) {
    const { error } = await supabase
      .from("profiles")
      .update({ transaction_id: null })
      .eq("id", userId);

    if (error) throw new Error(error.message);
    return { success: true, message: "User activation rejected" };
  },

  async updateBalance(userId, amount, type = "add") {
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", userId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    let newBalance = Number(profile.balance) || 0;
    if (type === "add") {
      newBalance += amount;
    } else if (type === "deduct") {
      newBalance = Math.max(0, newBalance - amount);
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return Number(data.balance);
  },

  async addBusinessTill(userId, tillName, tillNumber) {
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("business_tills")
      .eq("id", userId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const currentTills = Array.isArray(profile.business_tills) ? profile.business_tills : [];
    const newTill = {
      id: Date.now().toString(),
      name: tillName,
      number: tillNumber,
      createdAt: new Date().toISOString(),
    };
    const updatedTills = [...currentTills, newTill];

    const { data, error } = await supabase
      .from("profiles")
      .update({ business_tills: updatedTills })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return Array.isArray(data.business_tills) ? data.business_tills : updatedTills;
  },

  async getUserById(userId) {
    if (userId === "admin_local_id") {
      return {
        id: "admin_local_id",
        email: ADMIN_EMAIL,
        name: "Local Admin",
        balance: 0,
        status: "active",
        role: "admin",
      };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) return null;
    return normalizeProfile(data);
  },

  async getAllUsers() {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) throw new Error(error.message);
    return data.map(normalizeProfile);
  },

  async deleteUser(userId) {
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) throw new Error(error.message);
    return { success: true, message: "User deleted successfully." };
  },

  async updateUserDetails(userId, details) {
    const dbUpdates = {};
    if (details.name !== undefined) dbUpdates.name = details.name;
    if (details.phone !== undefined) dbUpdates.phone = details.phone;
    if (details.status !== undefined) dbUpdates.status = details.status;
    if (details.role !== undefined) dbUpdates.role = details.role;
    if (details.balance !== undefined) dbUpdates.balance = details.balance;
    if (details.transaction_id !== undefined) dbUpdates.transaction_id = details.transaction_id;
    if (details.business_tills !== undefined) dbUpdates.business_tills = details.business_tills;
    if (details.referral_code !== undefined) dbUpdates.referral_code = details.referral_code;
    if (details.referred_by !== undefined) dbUpdates.referred_by = details.referred_by;

    const { data, error } = await supabase
      .from("profiles")
      .update(dbUpdates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return normalizeProfile(data);
  },

  subscribeToProfileChanges(userId, callback) {
    const subscription = supabase
      .channel(`profile-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload) => {
          callback(normalizeProfile(payload.new));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  subscribeToAllProfileChanges(callback) {
    const subscription = supabase
      .channel("profiles-all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          callback({ new: normalizeProfile(payload.new) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  async getPendingActivations() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, phone, transaction_id, created_at")
      .eq("status", "pending")
      .not("transaction_id", "is", null);

    if (error) {
      console.warn("Error fetching pending activations:", error.message);
      return [];
    }

    return data.map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      transactionId: u.transaction_id,
      amount: 1000,
      submittedAt: u.created_at,
    }));
  },
};