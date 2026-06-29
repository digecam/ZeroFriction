import { useState, useEffect } from 'react';

export default function App() {
  const [task, setTask] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTaskIndex, setActiveTaskIndex] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isPivotMode, setIsPivotMode] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // 1. DEFINE STREAK FIRST
  const [streak, setStreak] = useState(0);
  const [isListening, setIsListening] = useState(false);

  // 2. NOW DEFINE LOGIC FUNCTIONS
  const getBadge = (currentStreak) => {
    if (currentStreak >= 10) return { icon: "👑", title: "Execution God" };
    if (currentStreak >= 5) return { icon: "🔥", title: "Unstoppable" };
    if (currentStreak >= 1) return { icon: "⚡", title: "Momentum Builder" };
    return { icon: "🌱", title: "Novice" };
  };

  const userBadge = getBadge(streak); // This now works because streak is defined

  // 3. NOW DEFINE DERIVED DATA
  const leaderboardData = [
    { rank: 1, name: "Rahul (Manas Hostel)", streak: 24, badge: "👑" },
    { rank: 2, name: "Vikram (Kameng)", streak: 15, badge: "🔥" },
    { rank: 3, name: "Ananya (Subansiri)", streak: 8, badge: "⚡" },
    { rank: 4, name: "You", streak: streak, badge: userBadge.icon },
    { rank: 5, name: "Dev (Brahmaputra)", streak: 2, badge: "⚡" },
  ].sort((a, b) => b.streak - a.streak);

  // ... rest of your useEffect and other functions ...

  // Load streak from local storage on startup
  useEffect(() => {
    const savedStreak = localStorage.getItem('launchpad_streak');
    if (savedStreak) setStreak(parseInt(savedStreak));
  }, []);

  // 🎙️ VOICE INPUT FUNCTION
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Try Chrome!");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTask(prev => prev ? prev + " " + transcript : transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // 📅 CALENDAR INTEGRATION FUNCTION
  const exportToCalendar = () => {
    if (!result) return;
    const planDetails = result.execution_steps.map(s => `[ ] ${s.title} (${s.estimated_minutes}m)`).join('\n');
    const description = `Autonomously planned by Launchpad AI.\n\nRecommendation: ${result.personalized_recommendation}\n\nSteps:\n${planDetails}`;
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Launchpad Action: ${result.goal_summary}\nDESCRIPTION:${description}\nDTSTART:${new Date().toISOString().replace(/-|:|\.\d+/g, '')}\nDTEND:${new Date(Date.now() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, '')}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Launchpad_Action_Plan.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const submitTask = async (isEmergency) => {
    if (!task) return;
    const payload = {
      task,
      time_remaining: timeRemaining || "Unknown",
      is_emergency: isEmergency
    };
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/demolish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.status === "success") {
        setResult(data.data);
        setActiveTaskIndex(null);
        setIsPivotMode(false);
        setCompletedSteps([]);
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
    }
    setLoading(false);
  };

  const handlePivot = async () => {
    if (activeTaskIndex === null || !result) return;
    const currentStep = result.execution_steps[activeTaskIndex];
    const btn = document.getElementById("pivot-btn");
    if (btn) btn.innerText = "Pivoting...";
    try {
      const response = await fetch("http://127.0.0.1:8000/api/pivot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step_title: currentStep.title,
          action_prompt: currentStep.launchpad_resources.action_prompt
        })
      });
      const data = await response.json();
      if (data.status === "success") {
        const updatedResult = { ...result };
        updatedResult.execution_steps[activeTaskIndex].title = data.data.new_title;
        updatedResult.execution_steps[activeTaskIndex].estimated_minutes = 2;
        updatedResult.execution_steps[activeTaskIndex].launchpad_resources.action_prompt = data.data.action_prompt;
        updatedResult.execution_steps[activeTaskIndex].launchpad_resources.inspiration_or_tip = data.data.inspiration_or_tip;
        setResult(updatedResult);
        setIsPivotMode(true);
      }
    } catch (error) {
      console.error("Pivot failed:", error);
    }
    if (btn) btn.innerText = "I'm Stuck (Pivot)";
  };

  const toggleComplete = (index, e) => {
    e.stopPropagation();
    if (completedSteps.includes(index)) {
      setCompletedSteps(completedSteps.filter(i => i !== index));
    } else {
      setCompletedSteps([...completedSteps, index]);
    }
  };

  const completePivotTask = () => {
    if (!completedSteps.includes(activeTaskIndex)) {
      setCompletedSteps([...completedSteps, activeTaskIndex]);
    }
    setIsPivotMode(false);
    setActiveTaskIndex(null);

    // UPDATE STREAK
    const newStreak = streak + 1;
    setStreak(newStreak);
    localStorage.setItem('launchpad_streak', newStreak);
  };

  const progressPercentage = result ? Math.round((completedSteps.length / result.execution_steps.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans p-6 md:p-12 flex flex-col items-center selection:bg-indigo-500/30">

      {/* --- FULL SCREEN PIVOT TAKEOVER --- */}
      {isPivotMode && activeTaskIndex !== null && (
        <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500">
          <h2 className="text-5xl md:text-7xl font-black text-amber-500 tracking-tighter mb-4 uppercase">Stop Thinking.</h2>
          <p className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-2xl font-medium">You are paralyzed. We are shrinking this task to 2 minutes. Just do this:</p>
          <div className="bg-zinc-900/80 border-2 border-amber-500/30 p-8 md:p-12 rounded-[2rem] max-w-3xl w-full shadow-[0_0_80px_rgba(245,158,11,0.15)] backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-amber-500 animate-pulse"></div>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">{result.execution_steps[activeTaskIndex].title}</h3>
            <p className="text-lg md:text-xl text-amber-100/70 mb-8 leading-relaxed">{result.execution_steps[activeTaskIndex].launchpad_resources.action_prompt}</p>
            <div className="inline-flex items-center gap-3 bg-zinc-950/50 px-6 py-3 rounded-full border border-zinc-800">
              <span className="text-amber-500 animate-ping">●</span>
              <span className="text-sm font-medium text-zinc-300">Start a 2-minute timer right now.</span>
            </div>
          </div>
          <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button onClick={completePivotTask} className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-2xl text-lg transition-all hover:scale-105 shadow-lg shadow-amber-500/20">I Did It</button>
            <button onClick={() => setIsPivotMode(false)} className="w-full py-5 bg-transparent hover:bg-zinc-900 text-zinc-500 font-medium rounded-2xl text-lg transition-colors">Cancel</button>
          </div>
        </div>
      )}
      {/* --- LEADERBOARD MODAL --- */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-amber-500/30 p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowLeaderboard(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white font-bold"
            >
              ✕
            </button>
            <h2 className="text-2xl font-black text-amber-500 mb-6 flex items-center gap-2">
              🏆 Campus Top Performers
            </h2>
            <div className="space-y-3">
              {leaderboardData.map((user, i) => (
                <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${user.name === "You" ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div className="flex items-center gap-4">
                    <span className="text-zinc-500 font-bold w-4">#{i + 1}</span>
                    <span className="text-xl">{user.badge}</span>
                    <span className={`font-medium ${user.name === "You" ? 'text-indigo-400' : 'text-zinc-300'}`}>
                      {user.name}
                    </span>
                  </div>
                  <span className="text-amber-500 font-bold">{user.streak} 🔥</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* --- STANDARD UI HEADING --- */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-12 relative z-10">

        {/* Left Side: Title + ZeroFriction Badge */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTaskIndex(null); setIsPivotMode(false); }}>
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Launchpad AI
          </h1>
          <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            ZeroFriction
          </span>
        </div>

        {/* Right Side: Leaderboard Badge */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowLeaderboard(true)}
            className="text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-full border border-amber-500/20 flex items-center gap-2 transition-colors shadow-lg cursor-pointer"
          >
            {userBadge.icon} {userBadge.title} | {streak} 🔥
          </button>
        </div>

      </header>
      {/* --- PHASE 1: INPUT --- */}
      {activeTaskIndex === null && !result && !isPivotMode && (
        <main className="w-full max-w-2xl flex flex-col items-center mb-16 animate-in fade-in duration-500 relative z-10">
          <h2 className="text-4xl md:text-5xl font-medium text-center mb-6 leading-tight text-zinc-100 tracking-tight">
            Out of time? <br />
            <span className="text-red-500">Engage survival mode.</span>
          </h2>
          <div className="w-full mt-8 bg-zinc-900/50 border border-zinc-800 p-4 rounded-3xl shadow-sm focus-within:border-zinc-700 transition-all duration-300">
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="flex gap-2 flex-[2]">
                <input
                  type="text"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="e.g., Finish Fusion 360 seedball assembly..."
                  className="w-full bg-zinc-950/50 border border-zinc-800/50 text-zinc-100 px-4 py-3 rounded-xl outline-none focus:border-indigo-500/50 placeholder:text-zinc-600"
                  disabled={loading}
                />
                <button
                  onClick={startListening}
                  className={`px-4 rounded-xl transition-colors border ${isListening ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-zinc-950/50 border-zinc-800/50 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600'}`}
                  title="Use Voice Input"
                >
                  {isListening ? "🎙️" : "🎤"}
                </button>
              </div>
              <div className="flex-1 relative">
                <select
                  value={timeRemaining}
                  onChange={(e) => setTimeRemaining(e.target.value)}
                  className="w-full h-full appearance-none bg-zinc-950/50 border border-zinc-800/50 text-zinc-300 px-4 py-3 rounded-xl outline-none focus:border-red-500/50 cursor-pointer disabled:opacity-50"
                  disabled={loading}
                >
                  <option value="" disabled>Select time limit...</option>
                  <option value="Under 1 Hour">Less than 1 Hour 🚨</option>
                  <option value="1-3 Hours">1 to 3 Hours</option>
                  <option value="Tonight">By Tonight</option>
                  <option value="Tomorrow Morning">Tomorrow Morning</option>
                  <option value="24+ Hours">24+ Hours (Standard)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => submitTask(false)} disabled={loading || !timeRemaining || !task} className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-sm rounded-xl transition-colors disabled:opacity-30 border border-zinc-700 disabled:cursor-not-allowed">
                {loading ? "Processing..." : "Standard Path"}
              </button>
              <button onClick={() => submitTask(true)} disabled={loading || !timeRemaining || !task} className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-30 shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] flex justify-center items-center gap-2 disabled:cursor-not-allowed">
                🚨 EMERGENCY TRIAGE
              </button>
            </div>
          </div>
        </main>
      )}

      {/* --- PHASE 2: RESULTS & FOCUS --- */}
      {result && !isPivotMode && (
        <section className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
          <div className="w-full mb-8">
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-xl font-medium text-zinc-100">{result.goal_summary}</h3>
              <button onClick={exportToCalendar} className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg">
                📅 Add to Calendar
              </button>
            </div>

            {/* PERSONALIZED RECOMMENDATION */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl mb-4">
              <p className="text-sm text-indigo-300 font-medium">
                <span className="font-bold text-indigo-400 uppercase tracking-wider text-xs mr-2">🤖 AI Strategy:</span>
                {result.personalized_recommendation}
              </p>
            </div>

            <div className="flex justify-end mb-2">
              <span className="text-sm font-bold text-indigo-400">{progressPercentage}% Completed</span>
            </div>
            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div className={`h-full transition-all duration-500 ease-out ${result.is_emergency ? 'bg-gradient-to-r from-red-500 to-orange-400' : 'bg-gradient-to-r from-indigo-500 to-cyan-400'}`} style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>

          {activeTaskIndex === null ? (
            <div className="space-y-3">
              {result.execution_steps.map((step, index) => {
                const isDone = completedSteps.includes(index);
                return (
                  <div key={index} className={`border p-4 rounded-2xl transition-all cursor-pointer group flex items-center justify-between ${isDone ? 'bg-zinc-950/50 border-zinc-900 opacity-60' : 'bg-zinc-900/40 border-zinc-800/80 hover:border-indigo-500/50'}`} onClick={() => setActiveTaskIndex(index)}>
                    <div className="flex items-center gap-4">
                      <div onClick={(e) => toggleComplete(index, e)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isDone ? 'bg-indigo-500 border-indigo-500 text-zinc-950' : 'border-zinc-600 hover:border-indigo-400'}`}>
                        {isDone && <span className="text-xs font-black">✓</span>}
                      </div>
                      <h4 className={`text-base font-medium transition-colors ${isDone ? 'text-zinc-600 line-through' : 'text-zinc-200 group-hover:text-white'}`}>{step.title}</h4>
                    </div>
                    <span className="text-xs font-medium text-zinc-500 bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800">{step.estimated_minutes} min</span>
                  </div>
                );
              })}
              <button onClick={() => { setResult(null); setTask(''); }} className="mt-8 text-sm text-zinc-500 hover:text-zinc-300 transition-colors w-full text-center">← Start a new task</button>
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-indigo-500/30 p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-400"></div>
              <button onClick={() => setActiveTaskIndex(null)} className="text-sm font-medium text-zinc-500 hover:text-zinc-300 mb-8 flex items-center gap-2 transition-colors">← Back to Sequence</button>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Task {result.execution_steps[activeTaskIndex].step_number}</span>
                <span className="text-sm font-mono font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 flex items-center gap-2 animate-pulse">⏱ {result.execution_steps[activeTaskIndex].estimated_minutes}:00</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-semibold text-zinc-100 mb-8 leading-tight">{result.execution_steps[activeTaskIndex].title}</h3>
              <div className="space-y-6 bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800/50 mb-10">
                <div>
                  <p className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">⚡ Immediate Action</p>
                  <p className="text-zinc-300 text-base leading-relaxed">{result.execution_steps[activeTaskIndex].launchpad_resources.action_prompt}</p>
                </div>
                <div className="h-px w-full bg-zinc-800/50"></div>
                <div>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">💡 AI Tip</p>
                  <p className="text-zinc-400 text-sm leading-relaxed italic">{result.execution_steps[activeTaskIndex].launchpad_resources.inspiration_or_tip}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => { if (!completedSteps.includes(activeTaskIndex)) { setCompletedSteps([...completedSteps, activeTaskIndex]); } setActiveTaskIndex(null); }} className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-4 rounded-xl transition-colors">Mark Complete</button>
                <button id="pivot-btn" onClick={handlePivot} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-4 rounded-xl transition-colors border border-zinc-700 hover:border-zinc-500">I'm Stuck (Pivot)</button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}