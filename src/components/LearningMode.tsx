import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Trophy, RefreshCw, CheckCircle2, XCircle, ChevronRight,
  Award, Target, Clock, Zap, Brain, RotateCcw,
} from "lucide-react";
import { getRandomQuizQuestions, type QuizQuestion } from "@/data/quizBank";

type QuizState = "intro" | "quiz" | "review" | "done";

export function LearningMode() {
  const [state, setState] = useState<QuizState>("intro");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timer, setTimer] = useState(0);
  const [quizTimer, setQuizTimer] = useState(0);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [questionCount, setQuestionCount] = useState(5);

  // Per-question timer
  useEffect(() => {
    if (state !== "quiz") return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [state, current]);

  // Total quiz timer
  useEffect(() => {
    if (state !== "quiz") return;
    const id = setInterval(() => setQuizTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [state]);

  const startQuiz = (count: number) => {
    const qs = getRandomQuizQuestions(count);
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setCurrent(0);
    setSelected(null);
    setShowExplanation(false);
    setTimer(0);
    setQuizTimer(0);
    setQuestionCount(count);
    setState("quiz");
  };

  const handleSelect = (idx: number) => {
    if (selected !== null) return; // already answered
    setSelected(idx);
    setAnswers((prev) => {
      const copy = [...prev];
      copy[current] = idx;
      return copy;
    });
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowExplanation(false);
      setTimer(0);
    } else {
      setState("done");
    }
  };

  const score = answers.filter((a, i) => a === questions[i]?.correctIndex).length;
  const scorePercent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const DIFFICULTY_COLOR = {
    beginner: "text-clinical-success border-clinical-success/30 bg-clinical-success/10",
    intermediate: "text-clinical-warning border-clinical-warning/30 bg-clinical-warning/10",
    advanced: "text-clinical-danger border-clinical-danger/30 bg-clinical-danger/10",
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 border-b border-border bg-card px-4 py-4 sm:px-5 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
             style={{ background: "var(--gradient-primary)" }}>
          <Brain size={18} className="text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-display font-semibold text-foreground text-sm">Learning Mode</p>
          <p className="text-xs text-muted-foreground">40+ question bank · Randomized · Expert explanations</p>
        </div>
        {state === "quiz" && (
          <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock size={12} />
              {Math.floor(quizTimer / 60)}:{String(quizTimer % 60).padStart(2, "0")}
            </div>
            <span className="text-xs text-muted-foreground">{current + 1}/{questions.length}</span>
            <button
              onClick={() => setState("intro")}
              className="text-xs px-2 py-1 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              Exit
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* INTRO */}
        <AnimatePresence mode="wait">
          {state === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-2xl p-4 sm:p-6"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                     style={{ background: "var(--gradient-primary)" }}>
                  <BookOpen size={32} className="text-primary-foreground" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  Pathology Quiz
                </h2>
                <p className="text-muted-foreground text-sm">
                  Test your knowledge with randomized questions from our 40+ question bank covering surgical pathology, cytology, IHC, special stains, and more.
                </p>
              </div>

              {/* Stats */}
              <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { label: "Questions", value: "40+", icon: <Target size={18} />, color: "text-primary" },
                  { label: "Categories", value: "15+", icon: <BookOpen size={18} />, color: "text-clinical-success" },
                  { label: "Difficulty", value: "3 Levels", icon: <Zap size={18} />, color: "text-clinical-warning" },
                ].map((s, i) => (
                  <div key={i} className="p-4 rounded-xl bg-secondary border border-border text-center">
                    <div className={`flex justify-center mb-2 ${s.color}`}>{s.icon}</div>
                    <p className="font-display font-bold text-lg text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Question count selector */}
              <div className="mb-6">
                <p className="text-sm font-medium text-foreground mb-3">Select number of questions:</p>
                <div className="flex gap-2 flex-wrap">
                  {[5, 10, 15, 20, 30, 40].map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuestionCount(n)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                        questionCount === n
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary text-foreground hover:border-primary/40"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => startQuiz(questionCount)}
                className="w-full py-3.5 rounded-xl font-display font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "var(--gradient-primary)" }}
              >
                Start Quiz ({questionCount} questions)
              </button>

              {/* Category preview */}
              <div className="mt-8">
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Topics Covered</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Breast Pathology", "Prostate/GU", "Lung Pathology", "GI Pathology",
                    "Neuropathology", "Hematopathology", "Special Stains", "IHC Panels",
                    "Cytopathology", "Skin/Dermatopathology", "Gynecologic", "Soft Tissue",
                    "Thyroid/Endocrine", "Liver/Pancreas", "Infectious Pathology",
                  ].map((cat) => (
                    <span key={cat} className="px-2 py-1 rounded-lg text-xs bg-secondary border border-border text-muted-foreground">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* QUIZ */}
          {state === "quiz" && questions[current] && (
            <motion.div
              key={`q-${current}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="mx-auto max-w-3xl p-4 sm:p-6"
            >
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Question {current + 1} of {questions.length}</span>
                  <span className="text-primary">{Math.round((current / questions.length) * 100)}% complete</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--gradient-primary)" }}
                    animate={{ width: `${((current) / questions.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Question card */}
              <div className="bg-card border border-border rounded-2xl p-5 mb-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${DIFFICULTY_COLOR[questions[current].difficulty]}`}>
                    {questions[current].difficulty}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                    {questions[current].category}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={11} />
                    {timer}s
                  </span>
                </div>
                <p className="font-display text-base font-semibold text-foreground leading-relaxed">
                  {questions[current].question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2.5 mb-4">
                {questions[current].options.map((opt, i) => {
                  const isCorrect = i === questions[current].correctIndex;
                  const isSelected = selected === i;
                  const answered = selected !== null;

                  let cls = "border-border bg-secondary text-foreground hover:border-primary/50";
                  if (answered && isCorrect) cls = "border-clinical-success bg-clinical-success/10 text-foreground";
                  else if (answered && isSelected && !isCorrect) cls = "border-clinical-danger bg-clinical-danger/10 text-foreground";
                  else if (!answered) cls = "border-border bg-secondary text-foreground hover:border-primary/50 hover:bg-primary/5 cursor-pointer";

                  return (
                    <motion.button
                      key={i}
                      onClick={() => handleSelect(i)}
                      disabled={answered}
                      whileHover={!answered ? { scale: 1.005 } : {}}
                      whileTap={!answered ? { scale: 0.997 } : {}}
                      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all duration-150 ${cls}`}
                    >
                      <span className={`
                        w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-semibold flex-shrink-0 mt-0.5
                        ${answered && isCorrect ? "bg-clinical-success text-white" : ""}
                        ${answered && isSelected && !isCorrect ? "bg-clinical-danger text-white" : ""}
                        ${!answered || (!isCorrect && !isSelected) ? "bg-muted text-muted-foreground" : ""}
                      `}>
                        {answered && isCorrect ? <CheckCircle2 size={12} /> :
                         answered && isSelected && !isCorrect ? <XCircle size={12} /> :
                         String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-sm leading-relaxed">{opt}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className={`p-4 rounded-xl border mb-4 ${
                      selected === questions[current].correctIndex
                        ? "border-clinical-success/30 bg-clinical-success/8"
                        : "border-clinical-danger/30 bg-clinical-danger/8"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {selected === questions[current].correctIndex ? (
                          <><CheckCircle2 size={15} className="text-clinical-success" />
                          <span className="text-sm font-semibold text-clinical-success">Correct!</span></>
                        ) : (
                          <><XCircle size={15} className="text-clinical-danger" />
                          <span className="text-sm font-semibold text-clinical-danger">Incorrect</span></>
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{questions[current].explanation}</p>
                      {questions[current].reference && (
                        <p className="text-xs text-muted-foreground mt-2 italic">📚 {questions[current].reference}</p>
                      )}
                    </div>

                    <button
                      onClick={nextQuestion}
                      className="w-full py-3 rounded-xl font-medium text-primary-foreground flex items-center justify-center gap-2 transition-all hover:opacity-90"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {current < questions.length - 1 ? (
                        <><span>Next Question</span><ChevronRight size={16} /></>
                      ) : (
                        <><span>See Results</span><Trophy size={16} /></>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* DONE */}
          {state === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-2xl p-4 sm:p-6"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{
                    background: scorePercent >= 80 ? "linear-gradient(135deg, hsl(152 76% 40%), hsl(186 100% 42%))" :
                                scorePercent >= 60 ? "linear-gradient(135deg, hsl(38 92% 50%), hsl(186 100% 42%))" :
                                "linear-gradient(135deg, hsl(0 72% 55%), hsl(186 100% 42%))"
                  }}
                >
                  <Trophy size={32} className="text-white" />
                </motion.div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                  {scorePercent >= 80 ? "Excellent!" : scorePercent >= 60 ? "Good Work!" : "Keep Studying!"}
                </h2>
                <p className="text-muted-foreground">You scored {score} out of {questions.length} questions</p>
              </div>

              {/* Score ring */}
              <div className="flex justify-center mb-8">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
                    <motion.circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={scorePercent >= 80 ? "hsl(152 76% 40%)" : scorePercent >= 60 ? "hsl(38 92% 50%)" : "hsl(0 72% 55%)"}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      initial={{ strokeDashoffset: `${2 * Math.PI * 50}` }}
                      animate={{ strokeDashoffset: `${2 * Math.PI * 50 * (1 - scorePercent / 100)}` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-bold text-foreground">{scorePercent}%</span>
                    <span className="text-xs text-muted-foreground">{score}/{questions.length}</span>
                  </div>
                </div>
              </div>

              {/* Per-question summary */}
              <div className="space-y-2 mb-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Question Review</p>
                {questions.map((q, i) => {
                  const correct = answers[i] === q.correctIndex;
                  return (
                    <div key={i} className={`p-3 rounded-xl border flex items-start gap-3 ${correct ? "border-clinical-success/20 bg-clinical-success/5" : "border-clinical-danger/20 bg-clinical-danger/5"}`}>
                      {correct ? <CheckCircle2 size={15} className="text-clinical-success flex-shrink-0 mt-0.5" /> : <XCircle size={15} className="text-clinical-danger flex-shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{q.question}</p>
                        {!correct && (
                          <p className="text-xs text-clinical-success mt-0.5">✓ {q.options[q.correctIndex]}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-md border font-medium flex-shrink-0 ${
                        DIFFICULTY_COLOR[q.difficulty]
                      }`}>{q.difficulty}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => startQuiz(questionCount)}
                  className="flex-1 py-3 rounded-xl font-medium text-primary-foreground flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <RefreshCw size={16} />
                  New Quiz
                </button>
                <button
                  onClick={() => setState("intro")}
                  className="px-5 py-3 rounded-xl font-medium bg-secondary text-foreground border border-border hover:bg-muted transition-colors"
                >
                  Home
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
