import { supabase } from "../lib/supabase";

// Fake user names for simulated deposits
const fakeNames = [
  "John", "Mary", "Peter", "Alice", "James", "Grace", "David", "Sarah",
  "Michael", "Linda", "Chris", "Emma", "Brian", "Ivy", "Kevin", "Joy",
  "Daniel", "Cynthia", "Andrew", "Violet", "Steve", "Nancy", "Mark", "Ruth",
];

// Fake deposit amounts
const fakeAmounts = [500, 1000, 1500, 2000, 2500, 3000, 5000, 10000];

function handleSupabaseError(error, defaultMessage) {
  if (!error) return defaultMessage;
  const msg = error.message || String(error);
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    return "Network error. Please check your internet connection.";
  }
  return msg;
}

export const liveActivityService = {
  async addActivity(type, userName, amount, message, isReal = true) {
    try {
      const { data, error } = await supabase
        .from("live_activities")
        .insert({
          type,
          user_name: userName,
          amount: amount ? parseFloat(amount) : null,
          message: message || null,
          is_real: isReal,
        })
        .select()
        .single();

      if (error) {
        console.warn("Live activities table not created yet. Run SQL migration in Supabase.");
        return { id: "local_" + Date.now(), type, user_name: userName, amount, message, is_real: isReal, created_at: new Date().toISOString() };
      }
      return data;
    } catch (e) {
      console.warn("Add activity fallback:", e);
      return { id: "local_" + Date.now(), type, user_name: userName, amount, message, is_real: isReal, created_at: new Date().toISOString() };
    }
  },

  async getRecentActivities(limit = 50) {
    try {
      const { data, error } = await supabase
        .from("live_activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.warn("Live activities table not created yet. Run SQL migration in Supabase.");
        return Array.from({ length: 10 }, (_, i) => this.generateFakeDeposit());
      }
      return data || [];
    } catch (e) {
      console.warn("Get recent activities fallback:", e);
      return Array.from({ length: 10 }, (_, i) => this.generateFakeDeposit());
    }
  },

  generateFakeDeposit() {
    const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
    const amount = fakeAmounts[Math.floor(Math.random() * fakeAmounts.length)];
    return {
      type: "deposit",
      user_name: `${name}${Math.floor(Math.random() * 999)}`,
      amount,
      message: `${name} just deposited KES ${amount.toLocaleString()}`,
      is_real: false,
      created_at: new Date().toISOString(),
    };
  },

  async createWithdrawalActivity(userName, amount) {
    return this.addActivity(
      "withdrawal",
      userName,
      amount,
      `${userName} just withdrew KES ${parseFloat(amount).toLocaleString()}`,
      true
    );
  },

  generateFakeWithdrawal() {
    const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
    const amount = fakeAmounts[Math.floor(Math.random() * fakeAmounts.length)];
    return {
      type: "withdrawal",
      user_name: `${name}${Math.floor(Math.random() * 999)}`,
      amount,
      message: `${name} just withdrew KES ${amount.toLocaleString()}`,
      is_real: false,
      created_at: new Date().toISOString(),
    };
  },

  subscribeToActivities(callback) {
    try {
      const subscription = supabase
        .channel("live-activities")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "live_activities" },
          (payload) => {
            callback(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    } catch (e) {
      console.warn("Live activities subscription disabled:", e);
      return () => {};
    }
  },
};
