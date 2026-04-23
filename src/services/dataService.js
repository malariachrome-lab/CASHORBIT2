import { supabase } from "../lib/supabase";

// Only two task types: Video and Survey
const taskTypes = [
  // Video tasks (admin-controlled via videoUrl)
  {
    id: "video_1",
    name: "Watch Finance Tips",
    baseEarnings: 50,
    duration: "30 sec",
    icon: "Video",
    type: "video",
    videoUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    description: "Watch a short video on personal finance tips and earn rewards!"
  },
  {
    id: "video_2",
    name: "Watch Savings Guide",
    baseEarnings: 60,
    duration: "45 sec",
    icon: "Video",
    type: "video",
    videoUrl: "https://youtu.be/kJQP7kiw5Fk",
    description: "Learn smart saving strategies in this quick video."
  },
  {
    id: "video_3",
    name: "Watch Crypto Basics",
    baseEarnings: 55,
    duration: "40 sec",
    icon: "Video",
    type: "video",
    videoUrl: "https://www.youtube.com/embed/JGwWNGJdvx8",
    description: "Understand the basics of cryptocurrency in under a minute."
  },
  {
    id: "video_4",
    name: "Watch Stock Market Intro",
    baseEarnings: 65,
    duration: "50 sec",
    icon: "Video",
    type: "video",
    videoUrl: "https://www.youtube.com/watch?v=RgKAFK5djSk",
    description: "Get introduced to the stock market and how it works."
  },
  {
    id: "video_5",
    name: "Watch Loan Guide",
    baseEarnings: 58,
    duration: "35 sec",
    icon: "Video",
    type: "video",
    videoUrl: "https://youtu.be/OPf0YbXqDm0",
    description: "Everything you need to know before taking a loan."
  },
  {
    id: "video_6",
    name: "Watch Forex Basics",
    baseEarnings: 62,
    duration: "45 sec",
    icon: "Video",
    type: "video",
    videoUrl: "https://www.youtube.com/watch?v=hT_nvWreIhg",
    description: "Learn the fundamentals of foreign exchange trading."
  },
  {
    id: "video_7",
    name: "Watch Business Tips",
    baseEarnings: 70,
    duration: "55 sec",
    icon: "Video",
    type: "video",
    videoUrl: "https://youtu.be/nfWlot6h_JM",
    description: "Quick business tips for aspiring entrepreneurs."
  },
  {
    id: "video_8",
    name: "Watch Investment Strategies",
    baseEarnings: 75,
    duration: "60 sec",
    icon: "Video",
    type: "video",
    videoUrl: "https://www.youtube.com/watch?v=CevxZvSJLk8",
    description: "Discover proven investment strategies for beginners."
  },

  // Survey tasks (interactive, mapped from task data)
  {
    id: "survey_1",
    name: "Mobile Money Survey",
    baseEarnings: 200,
    duration: "2 min",
    icon: "ClipboardList",
    type: "survey",
    question: "How often do you use mobile payment apps?",
    options: ["Daily", "Weekly", "Monthly", "Rarely", "Never"],
    description: "Share your mobile money habits and earn rewards!"
  },
  {
    id: "survey_2",
    name: "Financial App Features Survey",
    baseEarnings: 220,
    duration: "2 min",
    icon: "ClipboardList",
    type: "survey",
    question: "Which feature do you value most in a financial app?",
    options: ["Security", "Ease of use", "Low fees", "Fast transactions", "Rewards"],
    description: "Tell us what features matter most to you in financial apps."
  },
  {
    id: "survey_3",
    name: "Payment Preferences Survey",
    baseEarnings: 180,
    duration: "1 min",
    icon: "ClipboardList",
    type: "survey",
    question: "How do you prefer to receive payments?",
    options: ["M-Pesa", "Bank transfer", "Cash", "Crypto", "PayPal"],
    description: "Let us know your preferred payment methods."
  },
  {
    id: "survey_4",
    name: "Income Source Survey",
    baseEarnings: 250,
    duration: "2 min",
    icon: "ClipboardList",
    type: "survey",
    question: "What is your primary source of income?",
    options: ["Salary", "Business", "Freelancing", "Investments", "Other"],
    description: "Help us understand income sources in our community."
  },
  {
    id: "survey_5",
    name: "Savings Habits Survey",
    baseEarnings: 190,
    duration: "2 min",
    icon: "ClipboardList",
    type: "survey",
    question: "How much do you typically save per month?",
    options: ["Less than KES 1,000", "KES 1,000-5,000", "KES 5,000-10,000", "KES 10,000-50,000", "More than KES 50,000"],
    description: "Share your monthly savings habits with us."
  },
  {
    id: "survey_6",
    name: "Investment Interest Survey",
    baseEarnings: 230,
    duration: "2 min",
    icon: "ClipboardList",
    type: "survey",
    question: "Which investment option interests you most?",
    options: ["Stocks", "Real estate", "Government bonds", "Crypto", "SACCOs"],
    description: "Tell us which investment avenues you're curious about."
  },
  {
    id: "survey_7",
    name: "Expense Tracking Survey",
    baseEarnings: 210,
    duration: "2 min",
    icon: "ClipboardList",
    type: "survey",
    question: "How do you track your expenses?",
    options: ["Mobile app", "Spreadsheet", "Notebook", "Mental notes", "I don't track"],
    description: "How do you keep tabs on your spending?"
  },
  {
    id: "survey_8",
    name: "Financial Challenge Survey",
    baseEarnings: 240,
    duration: "2 min",
    icon: "ClipboardList",
    type: "survey",
    question: "What is your biggest financial challenge?",
    options: ["Budgeting", "Saving", "Investing", "Debt management", "Earning more"],
    description: "Share the financial hurdles you face so we can help."
  },
];

// Generate mock tasks
let currentTasks = generateTasksInternal();

function generateTasksInternal() {
  return taskTypes.map((type) => ({
    id: type.id,
    name: type.name,
    baseEarnings: type.baseEarnings,
    duration: type.duration,
    icon: type.icon,
    type: type.type,
    description: type.description,
    available: true,
    completed: false,
    earnings: 0,
    maxCompletions: 5,
    currentCompletions: 0,
    // Task-specific data (admin-controlled)
    ...(type.videoUrl && { videoUrl: type.videoUrl }),
    ...(type.question && { question: type.question }),
    ...(type.options && { options: type.options }),
  }));
}

// Activity types for the feed
const activityTypes = [
  { type: "task_completed", messages: ["completed a task", "finished a survey", "watched a video"] },
  { type: "withdrawal", messages: ["requested a withdrawal", "cashed out", "withdrew earnings"] },
  { type: "referral", messages: ["referred a new user", "earned referral bonus", "shared referral link"] },
  { type: "bonus_claimed", messages: ["claimed daily bonus", "streak bonus earned", "daily reward claimed"] },
  { type: "activation", messages: ["account activated", "joined Cash Orbit", "started earning"] },
  { type: "funds_added", messages: ["had funds added to their account"] },
  { type: "activation_approved", messages: ["account activated by admin"] },
  { type: "activation_rejected", messages: ["account activation rejected by admin"] },
];

// Generate random activity for mock feed
const generateRandomActivity = () => {
  const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
  const message = activityType.messages[Math.floor(Math.random() * activityType.messages.length)];
  const amount = activityType.type === "withdrawal"
    ? Math.floor(Math.random() * 5000) + 500
    : activityType.type === "task_completed"
    ? Math.floor(Math.random() * 200) + 25
    : null;

  return {
    id: Date.now() + Math.random(),
    type: activityType.type,
    message,
    timestamp: new Date().toISOString(),
    amount,
    user: `User${Math.floor(Math.random() * 10000)}`,
  };
};

// Initial activity feed
const initialActivityFeed = Array.from({ length: 20 }, (_, i) => {
  const activity = generateRandomActivity();
  activity.timestamp = new Date(Date.now() - i * 60000 * 5).toISOString();
  return activity;
});

// Global configuration settings (local only)
let globalSettings = {
  activationFee: 1000,
  referralBonus: 100,
  minWithdrawal: 500,
  maxWithdrawal: 50000,
  dailyBonusBase: 50,
  tillNumber: "5707223",
  dailyBonusResetHours: 24
};

// Load settings from localStorage if available
try {
  const savedSettings = localStorage.getItem("cashorbit_global_settings");
  if (savedSettings) {
    globalSettings = { ...globalSettings, ...JSON.parse(savedSettings) };
  }
} catch (e) {
  console.warn("Error loading global settings:", e);
}

const saveGlobalSettings = () => {
  try {
    localStorage.setItem("cashorbit_global_settings", JSON.stringify(globalSettings));
  } catch (e) {
    console.warn("Error saving global settings:", e);
  }
};

// Instructions for activation, dynamically updated
let activationInstructions = [
  "Go to M-Pesa menu on your phone",
  "Select Lipa Na M-Pesa",
  "Select Buy Goods and Services",
  `Enter Till Number: ${globalSettings.tillNumber}`,
  `Enter Amount: KES ${globalSettings.activationFee.toLocaleString()}`,
  "Enter your M-Pesa PIN",
  "Wait for confirmation message",
  "Copy the Transaction ID from the SMS",
  "Paste the Transaction ID below to verify your payment",
];

const updateInstructions = () => {
  activationInstructions = [
    "Go to M-Pesa menu on your phone",
    "Select Lipa Na M-Pesa",
    "Select Buy Goods and Services",
    `Enter Till Number: ${globalSettings.tillNumber}`,
    `Enter Amount: KES ${globalSettings.activationFee.toLocaleString()}`,
    "Enter your M-Pesa PIN",
    "Wait for confirmation message",
    "Copy the Transaction ID from the SMS",
    "Paste the Transaction ID below to verify your payment",
  ];
};

export const dataService = {
  async getGlobalSettingsFromDB() {
    updateInstructions();
    return { ...globalSettings };
  },

  async updateGlobalSettingInDB(key, value) {
    globalSettings[key] = value;
    saveGlobalSettings();
    updateInstructions();
    return { ...globalSettings };
  },

  getTasks() {
    return currentTasks;
  },

  setTasks(newTasks) {
    currentTasks = newTasks;
  },

  getActivityFeed() {
    return initialActivityFeed;
  },

  getPendingActivations() {
    return [];
  },

  generateRandomActivity() {
    return generateRandomActivity();
  },

  getTaskById(taskId) {
    return currentTasks.find((t) => t.id === taskId);
  },

  getTaskTypes() {
    return taskTypes;
  },

  // Withdrawal configuration
  withdrawalConfig: {
    minimumAmount: () => globalSettings.minWithdrawal,
    maximumAmount: () => globalSettings.maxWithdrawal,
    processingFee: 0,
    processingTime: "24-48 hours",
    methods: ["M-Pesa"],
  },

  // Activation configuration
  activationConfig: {
    tillNumber: () => globalSettings.tillNumber,
    amount: () => globalSettings.activationFee,
    instructions: activationInstructions,
  },

  // Platform statistics (mocked)
  getPlatformStats() {
    return {
      totalPayouts: 2847563,
      activeUsers: 15847,
      tasksCompleted: 89234,
      totalEarnings: 5694120,
      newUsersToday: 127,
      payoutsToday: 45230,
    };
  },

  // Referral rewards
  referralRewards: {
    referrerBonus: () => globalSettings.referralBonus,
    refereeBonus: 50,
    tierBonuses: {
      bronze: { min: 0, max: 9, bonusPerReferral: 100 },
      silver: { min: 10, max: 49, bonusPerReferral: 150 },
      gold: { min: 50, max: Infinity, bonusPerReferral: 250 },
    },
  },

  // Daily bonus configuration
  dailyBonusConfig: {
    baseAmount: () => globalSettings.dailyBonusBase,
    streakMultiplier: 0.1,
    maxMultiplier: 3,
    resetHours: () => globalSettings.dailyBonusResetHours,
  },

  // For AppStateContext to get latest values
  getGlobalSettings() {
    updateInstructions();
    return { ...globalSettings };
  },

  // Task CRUD operations
  addTask(task) {
    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...task,
      completed: false,
      earnings: 0,
      currentCompletions: 0,
    };
    currentTasks.push(newTask);
    return newTask;
  },

  updateTask(taskId, updates) {
    const idx = currentTasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return null;
    currentTasks[idx] = { ...currentTasks[idx], ...updates };
    return currentTasks[idx];
  },

  deleteTask(taskId) {
    const idx = currentTasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return false;
    currentTasks.splice(idx, 1);
    return true;
  },

  // Handle task completion: fetch current balance, add amount, update DB
  async handleTaskCompletion(userId, amount) {
    if (!userId || amount == null) {
      throw new Error("Invalid userId or amount");
    }

    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", userId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const currentBalance = Number(profile?.balance) || 0;
    const newBalance = currentBalance + amount;

    const { data, error: updateError } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    return Number(data.balance);
  },
};
