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

    if (error) throw new Error(handleSupabaseError(error, "Failed to create withdrawal request"));
    return data;
  },

  async getUserWithdrawals(userId) {
    const { data, error } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(handleSupabaseError(error, "Failed to fetch withdrawals"));
    return data || [];
  },

  async getAllWithdrawals(status = null) {
    let query = supabase
      .from("withdrawals")
      .select("*, profiles:user_id(name, phone, email)")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw new Error(handleSupabaseError(error, "Failed to fetch all withdrawals"));
    return data || [];
  },

  async approveWithdrawal(withdrawalId, adminId) {
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

    if (error) throw new Error(handleSupabaseError(error, "Failed to approve withdrawal"));
    return data;
  },

  async rejectWithdrawal(withdrawalId, adminId, reason) {
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

    if (error) throw new Error(handleSupabaseError(error, "Failed to reject withdrawal"));
    return data;
  },

  subscribeToWithdrawals(callback) {
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
  },

  subscribeToUserWithdrawals(userId, callback) {
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
  },
};
