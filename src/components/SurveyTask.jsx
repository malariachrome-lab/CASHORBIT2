import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function SurveyTask({ task, onComplete }) {
  const [selectedOption, setSelectedOption] = useState(null);

  // Get survey data from task object (admin-controlled)
  const question = task.question || "What is your feedback?";
  const options = Array.isArray(task.options) ? task.options : [
    "Option A",
    "Option B",
    "Option C",
    "Option D"
  ];

  const handleSubmit = () => {
    if (selectedOption === null) {
      alert("Please select an option before submitting.");
      return;
    }
    onComplete();
  };

  return (
    <div className="space-y-4">
      <div className="card bg-surface-light p-4 space-y-4">
        <p className="font-medium text-text-primary text-lg">
          {question}
        </p>

        <div className="space-y-2">
          {options.map((option, idx) => (
            <label
              key={idx}
              className={`flex items-center gap-3 w-full p-3 rounded-lg border cursor-pointer transition-all ${
                selectedOption === option
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-white/10 hover:border-white/20 text-text-secondary"
              }`}
            >
              <input
                type="radio"
                name="survey-option"
                value={option}
                checked={selectedOption === option}
                onChange={() => setSelectedOption(option)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
              <span className="flex-1">{option}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="btn-success w-full flex items-center justify-center gap-2"
      >
        <CheckCircle className="w-5 h-5" />
        Submit Survey & Complete
      </button>
    </div>
  );
}
