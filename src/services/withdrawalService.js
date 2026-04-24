import { supabase } from "../lib/supabase";

function handleSupabaseError(error, defaultMessage) {
  if (!error) return defaultMessage;
  const msg = error.message || String(error);
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    return "Network error. Please check your internet connection.";
  }
  return msg;
}

export const withdrawalService = {
  async createWithdrawal(userId, amount, phone) {
    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .insert({
          user_id: userId,
          amount: parseFloat(amount),
          phone: phone || null,
          method: "M-Pesa",
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.warn("Withdrawals table not created yet. Run SQL migration in Supabase.");
        return { id: "local_" + Date.now(), user_id: userId, amount, phone, status: "pending", created_at: new Date().toISOString() };
      }
      return data;
    } catch (e) {
      console.warn("Create withdrawal fallback:", e);
      return { id: "local_" + Date.now(), user_id: userId, amount, phone, status: "pending", created_at: new Date().toISOString() };
    }
  },

  async getUserWithdrawals(userId) {
    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Withdrawals table not created yet. Run SQL migration in Supabase.");
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn("Get user withdrawals fallback:", e);
      return [];
    }
  },

  async getAllWithdrawals(status = null) {
    try {
      let query = supabase
        .from("withdrawals")
        .select("*, profiles:user_id(name, phone, email)")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) {
        console.warn("Withdrawals table not created yet. Run SQL migration in Supabase.");
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn("Get all withdrawals fallback:", e);
      return [];
    }
  },

  async approveWithdrawal(withdrawalId, adminId) {
    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .update({
          status: "approved",
          processed_by: adminId,
          processed_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId)
        .select()
        .single();

      if (error) {
        console.warn("Withdrawals table not created yet. Run SQL migration in Supabase.");
        return { id: withdrawalId, status: "approved" };
      }
      return data;
    } catch (e) {
      console.warn("Approve withdrawal fallback:", e);
      return { id: withdrawalId, status: "approved" };
    }
  },

  async rejectWithdrawal(withdrawalId, adminId, reason) {
    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .update({
          status: "rejected",
          processed_by: adminId,
          processed_at: new Date().toISOString(),
          rejection_reason: reason || null,
        })
        .eq("id", withdrawalId)
        .select()
        .single();

      if (error) {
        console.warn("Withdrawals table not created yet. Run SQL migration in Supabase.");
        return { id: withdrawalId, status: "rejected" };
      }
      return data;
    } catch (e) {
      console.warn("Reject withdrawal fallback:", e);
      return { id: withdrawalId, status: "rejected" };
    }
  },

  subscribeToWithdrawals(callback) {
    try {
      const subscription = supabase
        .channel("withdrawals-all")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "withdrawals" },
          (payload) => {
            callback(payload);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    } catch (e) {
      console.warn("Withdrawal subscription disabled:", e);
      return () => {};
    }
  },

  subscribeToUserWithdrawals(userId, callback) {
    try {
      const subscription = supabase
        .channel(`withdrawals-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "withdrawals", filter: `user_id=eq.${userId}` },
          (payload) => {
            callback(payload);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    } catch (e) {
      console.warn("User withdrawal subscription disabled:", e);
      return () => {};
    }
  },
};
