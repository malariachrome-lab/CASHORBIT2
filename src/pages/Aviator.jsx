import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { aviatorService } from "../services/aviatorService";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane,
  TrendingUp,
  History,
  Wallet,
  AlertTriangle,
  Play,
  Square,
  Zap,
  ChevronUp,
  X,
  Sparkles,
} from "lucide-react";

export default function Aviator() {
  const { user, updateBalance } = useAuth();
  const { aviatorHistory, saveAviatorGame, loadAviatorHistory } = useAppState();

  const [betAmount, setBetAmount] = useState("100");
  const [gameState, setGameState] = useState("idle"); // idle, flying, crashed, won
  const [multiplier, setMultiplier] = useState(1.0);
  const [cashoutMultiplier, setCashoutMultiplier] = useState(null);
  const [crashPoint, setCrashPoint] = useState(null);
  const [winnings, setWinnings] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [message, setMessage] = useState(null);
  const [balance, setBalance] = useState(user?.balance || 0);

  const multiplierRef = useRef(1.0);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (user?.balance !== undefined) {
      setBalance(user.balance);
    }
  }, [user?.balance]);

  useEffect(() => {
    if (user?.id) {
      loadAviatorHistory(user.id);
    }
  }, [user?.id, loadAviatorHistory]);

  const startGame = useCallback(() => {
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      setMessage({ type: "error", text: "Enter a valid bet amount" });
      return;
    }
    if (bet > balance) {
      setMessage({ type: "error", text: "Insufficient balance" });
      return;
    }

    const newBalance = balance - bet;
    setBalance(newBalance);
    updateBalance(newBalance);

    const crash = aviatorService.generateCrashPoint();
    setCrashPoint(crash);
    setCashoutMultiplier(null);
    setWinnings(0);
    setGameState("flying");
    setMessage(null);
    multiplierRef.current = 1.0;
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      // Exponential growth formula
      const currentMult = Math.max(1.0, Math.pow(1.15, elapsed));
      multiplierRef.current = currentMult;
      setMultiplier(currentMult);

      if (currentMult >= crash) {
        setGameState("crashed");
        setMultiplier(crash);
        setMessage({
          type: "error",
          text: `Crashed at ${crash.toFixed(2)}x! You lost KES ${bet.toLocaleString()}`,
        });
        saveAviatorGame(user.id, bet, 0, crash, "loss", 0);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [betAmount, balance, user?.id, updateBalance, saveAviatorGame]);

  const cashout = useCallback(() => {
    if (gameState !== "flying") return;

    cancelAnimationFrame(animationFrameRef.current);
    const currentMult = multiplierRef.current;
    const bet = parseFloat(betAmount);
    const winAmount = parseFloat((bet * currentMult).toFixed(2));
    const netWin = parseFloat((winAmount - bet).toFixed(2));

    const newBalance = parseFloat((balance + winAmount).toFixed(2));
    setBalance(newBalance);
    updateBalance(newBalance);

    setCashoutMultiplier(currentMult);
    setWinnings(netWin);
    setGameState("won");
    setMessage({
      type: "success",
      text: `Cashed out at ${currentMult.toFixed(2)}x! You won KES ${netWin.toLocaleString()}`,
    });
    saveAviatorGame(user.id, bet, currentMult, crashPoint, "win", netWin);
  }, [gameState, betAmount, balance, user?.id, crashPoint, updateBalance, saveAviatorGame]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const quickBets = [50, 100, 200, 500, 1000];

  const getPlanePosition = () => {
    // Map multiplier to a visual height (1x at bottom, 10x at top)
    const maxDisplay = 10;
    const pct = Math.min(100, (multiplier / maxDisplay) * 100);
    return pct;
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-white/50">Please login to play Aviator</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] pb-24 px-4 pt-4 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Plane className="w-6 h-6 text-neon-cyan" />
            Aviator
          </h1>
          <p className="text-white/40 text-xs">Fly high, cash out before crash!</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span className="text-white text-sm font-bold">KES {balance.toLocaleString()}</span>
        </div>
      </motion.div>

      {/* Game Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative h-72 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 overflow-hidden mb-6"
      >
        {/* Grid background */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Flying path curve */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ff00aa" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {gameState === "flying" && (
            <motion.path
              d={`M 0 ${280 - (getPlanePosition() / 100) * 280} Q 150 ${280 - (getPlanePosition() / 100) * 280 - 50} 300 ${280 - (getPlanePosition() / 100) * 280 - 80}`}
              stroke="url(#pathGradient)"
              strokeWidth="3"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </svg>

        {/* Multiplier Display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {gameState === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center"
              >
                <Plane className="w-16 h-16 text-white/20 mx-auto mb-2" />
                <p className="text-white/30 text-sm">Place your bet to start</p>
              </motion.div>
            )}
            {gameState === "flying" && (
              <motion.div
                key="flying"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="text-6xl font-black text-white drop-shadow-[0_0_30px_rgba(0,240,255,0.5)]"
                >
                  {multiplier.toFixed(2)}x
                </motion.div>
              </motion.div>
            )}
            {gameState === "crashed" && (
              <motion.div
                key="crashed"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="text-5xl font-black text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                >
                  {multiplier.toFixed(2)}x
                </motion.div>
                <p className="text-red-400 text-sm mt-2 font-bold">CRASHED</p>
              </motion.div>
            )}
            {gameState === "won" && (
              <motion.div
                key="won"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  className="text-5xl font-black text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.5)]"
                >
                  {cashoutMultiplier?.toFixed(2)}x
                </motion.div>
                <p className="text-emerald-400 text-sm mt-2 font-bold">
                  +KES {winnings.toLocaleString()}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Plane icon flying */}
        <AnimatePresence>
          {gameState === "flying" && (
            <motion.div
              initial={{ x: -50, y: 250 }}
              animate={{
                x: Math.min(280, (multiplier - 1) * 40),
                y: 270 - (getPlanePosition() / 100) * 250,
              }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="absolute"
            >
              <Plane className="w-8 h-8 text-neon-cyan transform -rotate-45 drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Crash explosion */}
        <AnimatePresence>
          {gameState === "crashed" && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="w-20 h-20 rounded-full bg-red-500/50 blur-xl" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 p-3 rounded-xl text-center text-sm font-medium ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bet Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
          <label className="text-white/50 text-xs mb-2 block">Bet Amount (KES)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-bold"
              min="10"
              step="10"
              disabled={gameState === "flying"}
            />
          </div>
          <div className="flex gap-2 mt-3">
            {quickBets.map((amount) => (
              <button
                key={amount}
                onClick={() => setBetAmount(amount.toString())}
                disabled={gameState === "flying"}
                className="flex-1 py-2 rounded-lg bg-white/5 text-white/60 text-xs font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                KES {amount}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        {gameState === "idle" || gameState === "crashed" || gameState === "won" ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startGame}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-neon-cyan via-blue-500 to-purple-500 text-white font-bold text-lg shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-shadow flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            BET & FLY
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={cashout}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white font-bold text-lg shadow-[0_0_30px_rgba(52,211,153,0.3)] hover:shadow-[0_0_40px_rgba(52,211,153,0.5)] transition-shadow flex items-center justify-center gap-2 animate-pulse"
          >
            <Square className="w-5 h-5" />
            CASH OUT @ {multiplier.toFixed(2)}x
          </motion.button>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 grid grid-cols-3 gap-3"
      >
        <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
          <TrendingUp className="w-4 h-4 text-neon-cyan mx-auto mb-1" />
          <p className="text-white text-sm font-bold">{aviatorHistory.filter(g => g.result === 'win').length}</p>
          <p className="text-white/40 text-[10px]">Wins</p>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
          <AlertTriangle className="w-4 h-4 text-red-400 mx-auto mb-1" />
          <p className="text-white text-sm font-bold">{aviatorHistory.filter(g => g.result === 'loss').length}</p>
          <p className="text-white/40 text-[10px]">Losses</p>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
          <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <p className="text-white text-sm font-bold">
            {aviatorHistory.length > 0
              ? (aviatorHistory.reduce((sum, g) => sum + (g.winnings || 0), 0)).toLocaleString()
              : "0"}
          </p>
          <p className="text-white/40 text-[10px]">Net Profit</p>
        </div>
      </motion.div>

      {/* History Toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => setShowHistory(!showHistory)}
        className="mt-4 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
      >
        <History className="w-4 h-4" />
        {showHistory ? "Hide" : "Show"} Game History
        <ChevronUp className={`w-4 h-4 transition-transform ${showHistory ? "" : "rotate-180"}`} />
      </motion.button>

      {/* Game History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {aviatorHistory.length === 0 && (
              <p className="text-white/30 text-xs text-center py-4">No games played yet</p>
            )}
            {aviatorHistory.map((game, i) => (
              <motion.div
                key={game.id || i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  game.result === "win"
                    ? "bg-emerald-500/5 border-emerald-500/10"
                    : "bg-red-500/5 border-red-500/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      game.result === "win" ? "bg-emerald-500/10" : "bg-red-500/10"
                    }`}
                  >
                    {game.result === "win" ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">
                      Bet: KES {game.bet_amount?.toLocaleString()}
                    </p>
                    <p className="text-white/40 text-[10px]">
                      {game.result === "win"
                        ? `Cashed @ ${game.cashout_multiplier?.toFixed(2)}x`
                        : `Crashed @ ${game.crashed_at?.toFixed(2)}x`}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold ${
                    game.result === "win" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {game.result === "win" ? "+" : "-"}KES{" "}
                  {game.result === "win"
                    ? game.winnings?.toLocaleString()
                    : game.bet_amount?.toLocaleString()}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* How to Play */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-neon-purple" />
          <h3 className="text-white text-sm font-bold">How to Play</h3>
        </div>
        <ol className="text-white/50 text-xs space-y-2 list-decimal list-inside">
          <li>Enter your bet amount (min KES 10)</li>
          <li>Click "BET & FLY" to start the round</li>
          <li>Watch the multiplier grow as the plane flies</li>
          <li>Click "CASH OUT" before the plane crashes</li>
          <li>If you cash out in time, you win! If it crashes, you lose</li>
        </ol>
      </motion.div>
    </div>
  );
}
