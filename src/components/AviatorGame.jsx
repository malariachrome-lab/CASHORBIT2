import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, TrendingUp, AlertTriangle, X, History, Zap, Coins } from "lucide-react";
import { aviatorService } from "../services/aviatorService";
import { liveActivityService } from "../services/liveActivityService";
import { useAuth } from "../contexts/AuthContext";

const GAME_STATES = {
  IDLE: "idle",
  BETTING: "betting",
  FLYING: "flying",
  CRASHED: "crashed",
  CASHED_OUT: "cashed_out",
};

export default function AviatorGame({ onClose }) {
  const { user, updateBalance } = useAuth();
  const [gameState, setGameState] = useState(GAME_STATES.IDLE);
  const [betAmount, setBetAmount] = useState(100);
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(1.0);
  const [winnings, setWinnings] = useState(0);
  const [balance, setBalance] = useState(user?.balance || 0);
  const [gameHistory, setGameHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const currentMultiplierRef = useRef(1.0);

  // Load game history
  useEffect(() => {
    if (user?.id) {
      aviatorService.getUserGameHistory(user.id, 10).then(setGameHistory).catch(console.error);
    }
  }, [user?.id]);

  // Update local balance when user balance changes
  useEffect(() => {
    setBalance(user?.balance || 0);
  }, [user?.balance]);

  const startGame = useCallback(async () => {
    if (betAmount <= 0) {
      setError("Enter a valid bet amount");
      return;
    }
    if (betAmount > balance) {
      setError("Insufficient balance");
      return;
    }

    setError(null);
    setMessage(null);
    setWinnings(0);
    setMultiplier(1.0);
    currentMultiplierRef.current = 1.0;

    // Deduct bet amount
    try {
      const newBalance = await aviatorService.updateBalance(user.id, betAmount, "deduct");
      setBalance(newBalance);
      updateBalance(newBalance);
    } catch (err) {
      setError(err.message);
      return;
    }

    // Generate crash point
    const crash = aviatorService.generateCrashPoint();
    setCrashPoint(crash);

    // Start countdown
    setGameState(GAME_STATES.BETTING);
    setCountdown(3);

    let count = 3;
    const countInterval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countInterval);
        startFlying(crash);
      }
    }, 1000);
  }, [betAmount, balance, user?.id, updateBalance]);

  const startFlying = useCallback((crash) => {
    setGameState(GAME_STATES.FLYING);
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      // Exponential growth formula
      const m = Math.pow(1 + elapsed * 0.15, 2);
      currentMultiplierRef.current = Math.max(1.0, m);
      setMultiplier(currentMultiplierRef.current);

      if (currentMultiplierRef.current >= crash) {
        handleCrash();
        return;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  const handleCrash = useCallback(async () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setGameState(GAME_STATES.CRASHED);
    setMessage(`Crashed at ${crashPoint.toFixed(2)}x! You lost KES ${betAmount.toLocaleString()}`);

    // Save result
    try {
      await aviatorService.saveGameResult(user.id, betAmount, null, crashPoint, "loss", 0);
      const history = await aviatorService.getUserGameHistory(user.id, 10);
      setGameHistory(history);
    } catch (err) {
      console.error("Failed to save game:", err);
    }
  }, [crashPoint, betAmount, user?.id]);

  const cashOut = useCallback(async () => {
    if (gameState !== GAME_STATES.FLYING) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const cashoutMult = currentMultiplierRef.current;
    const winAmount = Math.floor(betAmount * cashoutMult);
    setWinnings(winAmount);
    setGameState(GAME_STATES.CASHED_OUT);
    setMessage(`You cashed out at ${cashoutMult.toFixed(2)}x! Won KES ${winAmount.toLocaleString()}`);

    try {
      // Add winnings
      const newBalance = await aviatorService.updateBalance(user.id, winAmount, "add");
      setBalance(newBalance);
      updateBalance(newBalance);

      // Save result
      await aviatorService.saveGameResult(user.id, betAmount, cashoutMult, crashPoint, "win", winAmount);

      // Create live activity
      await liveActivityService.createAviatorWinActivity(user?.name || "Player", winAmount, cashoutMult);

      const history = await aviatorService.getUserGameHistory(user.id, 10);
      setGameHistory(history);
    } catch (err) {
      console.error("Failed to process cashout:", err);
    }
  }, [gameState, betAmount, crashPoint, user?.id, user?.name, updateBalance]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Keyboard shortcut for cashout
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && gameState === GAME_STATES.FLYING) {
        e.preventDefault();
        cashOut();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, cashOut]);

  const getMultiplierColor = () => {
    if (multiplier < 1.5) return "text-white";
    if (multiplier < 3) return "text-emerald-400";
    if (multiplier < 5) return "text-yellow-400";
    if (multiplier < 10) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#0A0E17] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-primary" />
            <h2 className="text-white font-bold text-lg">Aviator</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <History className="w-4 h-4 text-white/60" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-white/5"
            >
              <div className="p-3 max-h-32 overflow-y-auto">
                <div className="flex gap-2 flex-wrap">
                  {gameHistory.map((game) => (
                    <span
                      key={game.id}
                      className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        game.result === "win"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {game.cashout_multiplier
                        ? `${game.cashout_multiplier.toFixed(2)}x`
                        : `${game.crashed_at.toFixed(2)}x`}
                    </span>
                  ))}
                  {gameHistory.length === 0 && (
                    <p className="text-white/30 text-xs">No games yet</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Area */}
        <div className="relative h-64 bg-gradient-to-b from-[#0A0E17] via-[#0d1525] to-[#0A0E17] overflow-hidden">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {/* Flight Path */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#007BFF" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#00ff88" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* Animated curve */}
            {gameState === GAME_STATES.FLYING && (
              <motion.path
                d={`M 0 ${240 - Math.min(200, multiplier * 20)} Q ${100} ${240 - Math.min(200, multiplier * 30)} ${200 + multiplier * 10} ${240 - Math.min(200, multiplier * 40)}`}
                fill="none"
                stroke="url(#pathGradient)"
                strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </svg>

          {/* Plane */}
          <AnimatePresence>
            {(gameState === GAME_STATES.FLYING || gameState === GAME_STATES.CASHED_OUT) && (
              <motion.div
                initial={{ x: -50, y: 200, rotate: 0 }}
                animate={{
                  x: Math.min(280, multiplier * 40),
                  y: 240 - Math.min(200, multiplier * 30),
                  rotate: -15 + Math.random() * 5,
                }}
                exit={{ x: 300, y: 50, opacity: 0 }}
                transition={{ type: "spring", stiffness: 50, damping: 15 }}
                className="absolute"
              >
                <Plane className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(0,123,255,0.5)]" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Crash Effect */}
          <AnimatePresence>
            {gameState === GAME_STATES.CRASHED && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <div className="w-20 h-20 rounded-full bg-red-500/50 blur-xl" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Multiplier Display */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
            <motion.div
              key={multiplier.toFixed(2)}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`text-5xl font-black tabular-nums ${getMultiplierColor()}`}
              style={{
                textShadow:
                  multiplier > 2
                    ? `0 0 ${Math.min(30, multiplier * 3)}px rgba(255,200,0,0.5)`
                    : "none",
              }}
            >
              {multiplier.toFixed(2)}x
            </motion.div>
          </div>

          {/* Countdown */}
          <AnimatePresence>
            {gameState === GAME_STATES.BETTING && countdown > 0 && (
              <motion.div
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <div className="text-6xl font-black text-white">{countdown}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Balance */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-white text-sm font-bold">
              KES {balance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4">
          {/* Bet Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={gameState !== GAME_STATES.IDLE && gameState !== GAME_STATES.CRASHED && gameState !== GAME_STATES.CASHED_OUT}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-center disabled:opacity-50"
                placeholder="Bet Amount"
                min={10}
                step={10}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">KES</span>
            </div>
            <button
              onClick={() => setBetAmount(Math.min(balance, betAmount * 2))}
              disabled={gameState === GAME_STATES.FLYING || gameState === GAME_STATES.BETTING}
              className="px-3 py-2 rounded-xl bg-white/5 text-white/60 text-xs font-bold hover:bg-white/10 disabled:opacity-50"
            >
              2x
            </button>
            <button
              onClick={() => setBetAmount(Math.max(10, Math.floor(betAmount / 2)))}
              disabled={gameState === GAME_STATES.FLYING || gameState === GAME_STATES.BETTING}
              className="px-3 py-2 rounded-xl bg-white/5 text-white/60 text-xs font-bold hover:bg-white/10 disabled:opacity-50"
            >
              /2
            </button>
          </div>

          {/* Quick Bet Buttons */}
          <div className="flex gap-2">
            {[50, 100, 200, 500, 1000].map((amount) => (
              <button
                key={amount}
                onClick={() => setBetAmount(amount)}
                disabled={gameState === GAME_STATES.FLYING || gameState === GAME_STATES.BETTING}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  betAmount === amount
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-white/5 text-white/60 border border-white/5 hover:bg-white/10"
                } disabled:opacity-50`}
              >
                {amount}
              </button>
            ))}
          </div>

          {/* Action Button */}
          <AnimatePresence mode="wait">
            {gameState === GAME_STATES.IDLE || gameState === GAME_STATES.CRASHED || gameState === GAME_STATES.CASHED_OUT ? (
              <motion.button
                key="start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={startGame}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-black text-lg hover:shadow-[0_0_30px_rgba(0,123,255,0.3)] transition-shadow"
              >
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  BET KES {betAmount.toLocaleString()}
                </div>
              </motion.button>
            ) : gameState === GAME_STATES.BETTING ? (
              <motion.button
                key="waiting"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                disabled
                className="w-full py-4 rounded-2xl bg-white/5 text-white/30 font-bold text-lg cursor-not-allowed"
              >
                Starting...
              </motion.button>
            ) : (
              <motion.button
                key="cashout"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={cashOut}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-black text-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-shadow animate-pulse"
              >
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  CASH OUT @ {(betAmount * multiplier).toFixed(0)} KES
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-400 text-xs">{error}</p>
            </motion.div>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 p-3 rounded-xl border ${
                gameState === GAME_STATES.CASHED_OUT
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-red-500/10 border-red-500/20"
              }`}
            >
              {gameState === GAME_STATES.CASHED_OUT ? (
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <p
                className={`text-xs ${
                  gameState === GAME_STATES.CASHED_OUT ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {message}
              </p>
            </motion.div>
          )}

          {/* Spacebar hint */}
          <p className="text-center text-white/20 text-[10px]">
            Press SPACEBAR to cash out quickly
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
