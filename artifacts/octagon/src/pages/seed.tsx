import { useState, useEffect } from "react";
import { Eye, ChevronRight, RotateCcw, Lock } from "lucide-react";

const STAGES = [
  {
    id: 0,
    name: "WAKE",
    phase: "ORIENTATION",
    question: "What am I looking at?",
    prompt:
      "You are inside a Digital Twin. Nothing here is magic. Everything you see is either an observation, a measurement, a relationship, a question, a model, or a decision. Your first job is simple: tell me what you can see.",
    character: null,
    lesson: "The operator is the centre.",
    accent: "text-green-400",
    border: "border-green-500/40",
    bg: "bg-green-500/5",
    dot: "bg-green-400",
  },
  {
    id: 1,
    name: "SEE",
    phase: "OBSERVATION",
    question: "What can you see?",
    prompt:
      'Answer only with facts. Not guesses. Good answer: "The craft is moving upward." Bad answer: "The craft is safe." The first is observed. The second is a judgement.',
    character: null,
    lesson: "Reality comes before meaning.",
    accent: "text-blue-400",
    border: "border-blue-500/40",
    bg: "bg-blue-500/5",
    dot: "bg-blue-400",
  },
  {
    id: 2,
    name: "MEASURE",
    phase: "TELEMETRY",
    question: "What changed since the last moment?",
    prompt:
      "Telemetry means: numbers or signals that tell us what is happening. Height, speed, direction, force, drift, stability. A Digital Twin is not just a picture — it is a picture that changes with time.",
    character: null,
    lesson: "A twin watches movement, not just objects.",
    accent: "text-blue-400",
    border: "border-blue-500/40",
    bg: "bg-blue-500/5",
    dot: "bg-blue-400",
  },
  {
    id: 3,
    name: "CONNECT",
    phase: "COUPLING",
    question: "When this moved, what else moved?",
    prompt:
      "Coupling means: when one thing changes, another thing changes because of it. If the left thruster fires harder, the craft may tilt right. If wind increases, the craft may drift.",
    character: null,
    lesson: "The twin is a map of relationships.",
    accent: "text-blue-400",
    border: "border-blue-500/40",
    bg: "bg-blue-500/5",
    dot: "bg-blue-400",
  },
  {
    id: 4,
    name: "EXPLAIN",
    phase: "INTERPRETATION",
    question: "What might this mean?",
    prompt:
      'SIMON enters. SIMON translates — but SIMON must say "may", because meaning is not the same as fact. Data is what happened. Interpretation is what it might mean. Meaning must be checked.',
    character: "SIMON",
    lesson: "SIMON helps the operator understand, but SIMON does not own the truth.",
    accent: "text-amber-400",
    border: "border-amber-500/40",
    bg: "bg-amber-500/5",
    dot: "bg-amber-400",
  },
  {
    id: 5,
    name: "QUESTION",
    phase: "CHALLENGE",
    question: "Are we sure?",
    prompt:
      "JEMMA enters. JEMMA asks: What evidence do we have? What is missing? Are we guessing? Could there be another explanation? Is the model overreaching? A good system challenges itself before it acts.",
    character: "JEMMA",
    lesson: "A good system challenges itself before it acts.",
    accent: "text-amber-400",
    border: "border-amber-500/40",
    bg: "bg-amber-500/5",
    dot: "bg-amber-400",
  },
  {
    id: 6,
    name: "SIMULATE",
    phase: "MODEL",
    question: "What happens if we change one thing?",
    prompt:
      "Build the little twin. Not the full Digital Twin — a toy twin. Change one variable and watch what happens. A model is a safe place to test reality before touching reality.",
    character: null,
    lesson: "A model is a safe place to test reality before touching reality.",
    accent: "text-violet-400",
    border: "border-violet-500/40",
    bg: "bg-violet-500/5",
    dot: "bg-violet-400",
  },
  {
    id: 7,
    name: "DECIDE",
    phase: "ACTION",
    question: "What should we do next?",
    prompt:
      "The operator can choose: Observe more · Slow down · Stabilise · Ask JEMMA · Save report · Stop simulation. The most important action is not 'go faster.' The most important action is: choose responsibly.",
    character: null,
    lesson: "Action comes last.",
    accent: "text-violet-400",
    border: "border-violet-500/40",
    bg: "bg-violet-500/5",
    dot: "bg-violet-400",
  },
  {
    id: 8,
    name: "AUDIT",
    phase: "MEMORY",
    question: "What really happened?",
    prompt:
      "Write the memory: What did we observe? What changed? What did SIMON think? What did JEMMA challenge? What did the operator decide? What happened next? This becomes the learning memory.",
    character: null,
    lesson: "The twin learns by remembering reality, not by inventing stories.",
    accent: "text-red-400",
    border: "border-red-500/40",
    bg: "bg-red-500/5",
    dot: "bg-red-400",
  },
] as const;

const STORAGE_KEY = "octagon_seed_stage";

export default function SeedMode() {
  const [unlocked, setUnlocked] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10) || 0;
    } catch {
      return 0;
    }
  });
  const [active, setActive] = useState<number>(unlocked);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(unlocked));
    } catch {}
  }, [unlocked]);

  const stage = STAGES[active];

  function advance() {
    if (unlocked < 8) {
      const next = unlocked + 1;
      setUnlocked(next);
      setActive(next);
    }
  }

  function reset() {
    setUnlocked(0);
    setActive(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-green-400 shrink-0" />
            <h1 className="text-sm font-bold tracking-widest text-primary">
              OPERATOR SEED MODE
            </h1>
          </div>
          <p className="text-[10px] text-muted-foreground tracking-wider leading-relaxed max-w-xl normal-case">
            The finished system is the museum. The operator walks through it — one room at a time. Each stage teaches one power. Do not start with the whole machine.
          </p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border text-muted-foreground hover:border-red-500/40 hover:text-red-400 transition-colors text-[10px] shrink-0"
          title="Reset to Stage 0"
        >
          <RotateCcw className="w-3 h-3" />
          RESET
        </button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>STAGE {unlocked + 1} / 9 UNLOCKED</span>
          <span>{Math.round(((unlocked + 1) / 9) * 100)}% REVEALED</span>
        </div>
        <div className="h-0.5 bg-border">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${((unlocked + 1) / 9) * 100}%` }}
          />
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-4 md:gap-6">
        {/* Left: Stage ladder */}
        <div className="shrink-0 w-36 md:w-44 space-y-1">
          <div className="text-[10px] text-muted-foreground mb-2 tracking-wider">STAGE LADDER</div>
          {STAGES.map((s) => {
            const isLocked = s.id > unlocked;
            const isActive = s.id === active;
            return (
              <button
                key={s.id}
                disabled={isLocked}
                onClick={() => !isLocked && setActive(s.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 border text-left transition-colors text-[10px] ${
                  isActive
                    ? `${s.border} ${s.bg} ${s.accent}`
                    : isLocked
                    ? "border-transparent text-muted-foreground/30 cursor-default"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isActive ? s.dot : isLocked ? "bg-muted/30" : "bg-muted-foreground/40"
                  }`}
                />
                <span className="flex-1 min-w-0">
                  {isLocked ? (
                    <span className="flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{s.name}</span>
                    </span>
                  ) : (
                    <span className="truncate">{s.id} · {s.name}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Active stage */}
        <div className={`flex-1 border ${stage.border} ${stage.bg} p-5 md:p-6 space-y-5`}>
          {/* Stage header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] tracking-widest ${stage.accent}`}>
                STAGE {stage.id} · {stage.phase}
              </span>
              {stage.character && (
                <span className={`text-[10px] px-1.5 py-0.5 border ${stage.border} ${stage.accent} tracking-widest`}>
                  {stage.character} ACTIVE
                </span>
              )}
            </div>
            <h2 className={`text-2xl md:text-3xl font-bold tracking-widest ${stage.accent}`}>
              {stage.name}
            </h2>
          </div>

          {/* The question */}
          <div className={`border-l-2 ${stage.border.replace("/40", "")} pl-4`}>
            <div className="text-[10px] text-muted-foreground mb-1 tracking-wider">THE QUESTION</div>
            <p className={`text-base md:text-lg font-bold ${stage.accent} normal-case`}>
              "{stage.question}"
            </p>
          </div>

          {/* Prompt */}
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground tracking-wider">MISSION BRIEF</div>
            <p className="text-xs text-foreground leading-relaxed normal-case">
              {stage.prompt}
            </p>
          </div>

          {/* Lesson */}
          <div className={`${stage.bg} border ${stage.border} p-3`}>
            <div className="text-[10px] text-muted-foreground mb-1 tracking-wider">LESSON</div>
            <p className={`text-xs font-bold ${stage.accent} normal-case`}>
              {stage.lesson}
            </p>
          </div>

          {/* Advance / completed */}
          {active === unlocked ? (
            unlocked < 8 ? (
              <button
                onClick={advance}
                className={`flex items-center gap-2 px-4 py-2.5 border ${stage.border} ${stage.accent} hover:${stage.bg} transition-colors text-[10px] tracking-widest`}
              >
                UNLOCK STAGE {unlocked + 1} · {STAGES[unlocked + 1].name}
                <ChevronRight className="w-3 h-3" />
              </button>
            ) : (
              <div className={`text-[10px] ${stage.accent} tracking-widest`}>
                ✓ ALL STAGES COMPLETE · THE MUSEUM IS FULLY OPEN
              </div>
            )
          ) : (
            <div className="text-[10px] text-muted-foreground tracking-wider">
              ← REVIEWING COMPLETED STAGE
            </div>
          )}
        </div>
      </div>

      {/* Flow formula footer */}
      <div className="border border-border p-3 text-[10px] text-muted-foreground tracking-wider text-center normal-case">
        Look → Measure → Connect → Understand → Challenge → Test → Act → Remember → Audit
        <span className="mx-3 text-border">·</span>
        Do not guess. Observe. Check. Then choose.
      </div>
    </div>
  );
}
