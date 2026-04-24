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

export const authService = {
  async login(email, password) {
    // Hardcoded admin bypass (kept for compatibility)
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return {
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
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    return normalizeProfile(profileData) || { id: data.user.id, email: data.user.email, status: "pending", role: "user" };
  },

  async register(data) {
    const { email, password, name, phone, referralCode } = data;

    // Disable email confirmation completely to avoid rate limits
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
        emailRedirectTo: undefined,
        shouldCreateUser: true
      },
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Registration failed. No user returned.");

    // Bypass waiting - create profile immediately ourselves
    const referralCodeGen = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email,
        name,
        phone,
        balance: 0,
        status: "pending",
        role: "user",
        referral_code: referralCodeGen,
        referred_by: referralCode || null,
      })
      .select()
      .single();

    if (profileError) {
      console.warn("Profile upsert note:", profileError.message);
      // Return minimal valid user even if profile fails
      return { 
        id: authData.user.id, 
        email, 
        name, 
        phone, 
        status: "pending", 
        role: "user",
        referralCode: referralCodeGen
      };
    }

    return normalizeProfile(profileData);
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async getSession() {
    try {
      const savedUser = localStorage.getItem("cashorbit_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.id === "admin_local_id") return parsed;
      }
    } catch (e) {
      console.warn("Error getting local user:", e);
    }

    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.session.user.id)
      .single();

    return normalizeProfile(profileData) || { id: data.session.user.id, email: data.session.user.email, status: "pending", role: "user" };
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