import { supabase } from "../lib/supabase";

// Fake user names for simulated deposits
const fakeNames = [
  "John", "Mary", "Peter", "Alice", "James", "Grace", "David", "Sarah",
  "Michael", "Linda", "Chris", "Emma", "Brian", "Ivy", "Kevin", "Joy",
  "Daniel", "Cynthia", "Andrew", "Violet", "Steve", "Nancy", "Mark", "Ruth",
  "Paul", "Lydia", "George", "Anne", "Frank", "Diana", "Henry", "Betty",
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
      console.warn("Failed to add live activity:", error);
      return null;
    }
    return data;
  },

  async getRecentActivities(limit = 50) {
    const { data, error } = await supabase
      .from("live_activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(handleSupabaseError(error, "Failed to fetch live activities"));
    return data || [];
  },

  generateFakeDeposit() {
    const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
    const amount = fakeAmounts[Math.floor(Math.random() * fakeAmounts.length)];
    return {
      type: "deposit",
      userName: `${name}${Math.floor(Math.random() * 999)}`,
      amount,
      message: `${name} just deposited KES ${amount.toLocaleString()}`,
      isReal: false,
    };
  },

  generateFakeWithdrawal() {
    const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
    const amount = fakeAmounts[Math.floor(Math.random() * fakeAmounts.length)];
    return {
      type: "withdrawal",
      userName: `${name}${Math.floor(Math.random() * 999)}`,
      amount,
      message: `${name} just withdrew KES ${amount.toLocaleString()}`,
      isReal: false,
    };
  },

  subscribeToActivities(callback) {
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
  },
};
