import { supabase } from "../lib/supabase";

function handleSupabaseError(error, defaultMessage) {
  if (!error) return defaultMessage;
  const msg = error.message || String(error);
  return msg;
}

// Unpredictable crash algorithm using weighted probabilities
// Like Odibet - mostly small multipliers, occasional big wins
function generateCrashPoint() {
  const rand = Math.random();
  // 40% chance to crash at 1.00x - 1.50x
  if (rand < 0.40) return 1.0 + Math.random() * 0.5;
  // 30% chance to crash at 1.50x - 2.50x
  if (rand < 0.70) return 1.5 + Math.random() * 1.0;
  // 20% chance to crash at 2.50x - 5.00x
  if (rand < 0.90) return 2.5 + Math.random() * 2.5;
  // 8% chance to crash at 5.00x - 10.00x
  if (rand < 0.98) return 5.0 + Math.random() * 5.0;
  // 2% chance for huge win 10x - 50x
  return 10.0 + Math.random() * 40.0;
}

export const aviatorService = {
  generateCrashPoint,

  async saveGameResult(userId, betAmount, cashoutMultiplier, crashedAt, result, winnings) {
    const { data, error } = await supabase
      .from("aviator_games")
      .insert({
        user_id: userId,
        bet_amount: betAmount,
        cashout_multiplier: cashoutMultiplier,
        crashed_at: crashedAt,
        result,
        winnings,
      })
      .select()
      .single();

    if (error) throw new Error(handleSupabaseError(error, "Failed to save game result"));
    return data;
  },

  async getUserGameHistory(userId, limit = 20) {
    const { data, error } = await supabase
      .from("aviator_games")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(handleSupabaseError(error, "Failed to fetch game history"));
    return data || [];
  },

  async getAllGameHistory(limit = 50) {
    const { data, error } = await supabase
      .from("aviator_games")
      .select("*, profiles(name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(handleSupabaseError(error, "Failed to fetch game history"));
    return data || [];
  },

  async updateBalance(userId, amount, type = "deduct") {
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", userId)
      .single();

    if (fetchError) throw new Error(handleSupabaseError(fetchError, "Failed to fetch balance"));

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

    if (error) throw new Error(handleSupabaseError(error, "Failed to update balance"));
    return Number(data.balance);
  },
};
