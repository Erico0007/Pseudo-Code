import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Code2, 
  Play, 
  Terminal, 
  FileCode, 
  Settings, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Check,
  ShieldCheck,
  AlertCircle,
  Cpu,
  Maximize2,
  Minimize2,
  X,
  ChevronRight,
  Command,
  Save,
  FolderOpen,
  MessageSquare,
  ShieldAlert,
  GitGraph,
  Share2,
  HelpCircle,
  Zap,
  Lightbulb
} from 'lucide-react';
import Markdown from 'react-markdown';
import mermaid from 'mermaid';
import { 
  convertPseudocodeToCode, 
  validatePseudocode, 
  auditPseudocode, 
  suggestPseudocode,
  refineProblem,
  validateProblem,
  generateFlowchart,
  ConversionResult, 
  ValidationResult, 
  AuditResult,
  RefinementResult,
  ProblemValidation
} from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Mermaid = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
      mermaid.render('mermaid-svg', chart).then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      });
    }
  }, [chart]);

  return <div key={chart} ref={ref} className="flex justify-center w-full" />;
};

export default function App() {
  const [problem, setProblem] = useState<string>('');
  const [pseudocode, setPseudocode] = useState<string>('');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [refinement, setRefinement] = useState<RefinementResult | null>(null);
  const [problemValidation, setProblemValidation] = useState<ProblemValidation | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isValidatingProblem, setIsValidatingProblem] = useState(false);
  const [isFlowcharting, setIsFlowcharting] = useState(false);
  const [showRefinement, setShowRefinement] = useState(false);
  const [flowchartData, setFlowchartData] = useState<string | null>(null);
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [targetLang, setTargetLang] = useState('typescript');
  const [error, setError] = useState<string | null>(null);

  // Derived state for workflow indicators
  const workflowStep = useMemo(() => {
    if (result) return 4; // Code Translated
    if (audit || validation) return 3; // Logic Audited/Validated
    if (pseudocode.trim().length > 20) return 2; // Logic Drafted
    if (problem.trim().length > 10) return 1; // Problem Defined
    return 0;
  }, [problem, pseudocode, audit, validation, result]);

  const stats = useMemo(() => ({
    problemLines: problem.split('\n').filter(l => l.trim()).length,
    problemWords: problem.trim().split(/\s+/).filter(w => w).length,
    logicLines: pseudocode.split('\n').filter(l => l.trim()).length,
    logicWords: pseudocode.trim().split(/\s+/).filter(w => w).length,
  }), [problem, pseudocode]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Desktop environment state
  const [windows, setWindows] = useState({
    problem: { isOpen: true, isMaximized: false },
    editor: { isOpen: true, isMaximized: false },
    output: { isOpen: true, isMaximized: false },
    terminal: { isOpen: true, isMaximized: false }
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSave = () => {
    const blob = new Blob([pseudocode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pseudocode.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setPseudocode(content);
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be loaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConvert = async () => {
    if (!pseudocode.trim()) return;
    
    setIsConverting(true);
    setError(null);
    setShowCode(false); // Reset show state for new generation
    
    try {
      const data = await convertPseudocodeToCode(pseudocode, targetLang, problem);
      setResult(data);
    } catch (err) {
      setError('Failed to process pseudocode. Please try again.');
      console.error(err);
    } finally {
      setIsConverting(false);
    }
  };

  const handleValidate = async () => {
    if (!pseudocode.trim()) return;
    
    setIsValidating(true);
    setError(null);
    setResult(null); // Clear previous results to focus on validation
    
    try {
      const data = await validatePseudocode(pseudocode, problem);
      setValidation(data);
    } catch (err) {
      setError('Failed to validate pseudocode. Please try again.');
      console.error(err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleAudit = async () => {
    if (!pseudocode.trim()) return;
    
    setIsAuditing(true);
    setError(null);
    setResult(null);
    setValidation(null);
    
    try {
      const data = await auditPseudocode(pseudocode, problem);
      setAudit(data);
    } catch (err) {
      setError('Failed to perform audit. Please try again.');
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSuggest = async () => {
    if (!problem.trim()) return;
    
    setIsSuggesting(true);
    setError(null);
    
    try {
      const suggestion = await suggestPseudocode(problem);
      setPseudocode(suggestion);
      // Automatically open the editor if it's closed
      if (!windows.editor.isOpen) {
        toggleWindow('editor');
      }
    } catch (err) {
      setError('Failed to suggest pseudocode. Please try again.');
      console.error(err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleRefine = async () => {
    if (!problem.trim()) return;
    
    setIsRefining(true);
    setError(null);
    
    try {
      const data = await refineProblem(problem);
      setRefinement(data);
      setShowRefinement(true);
    } catch (err) {
      setError('Failed to refine problem. Please try again.');
      console.error(err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleValidateProblem = async () => {
    if (!problem.trim()) return;
    
    setIsValidatingProblem(true);
    setError(null);
    
    try {
      const result = await validateProblem(problem);
      setProblemValidation(result);
    } catch (err) {
      setError('Failed to validate problem statement.');
      console.error(err);
    } finally {
      setIsValidatingProblem(false);
    }
  };

  const handleFlowchart = async () => {
    if (!pseudocode.trim()) return;
    
    setIsFlowcharting(true);
    setError(null);
    
    try {
      const data = await generateFlowchart(pseudocode);
      setFlowchartData(data);
      setShowFlowchart(true);
    } catch (err) {
      setError('Failed to generate flowchart. Please try again.');
      console.error(err);
    } finally {
      setIsFlowcharting(false);
    }
  };

  const toggleWindow = (win: keyof typeof windows) => {
    setWindows(prev => ({
      ...prev,
      [win]: { ...prev[win], isOpen: !prev[win].isOpen }
    }));
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden select-none">
      {/* Top Bar / Menu */}
      <header className="h-8 bg-[#141414] text-[#E4E3E0] flex items-center justify-between px-4 text-xs font-medium z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-emerald-400" />
            <span className="font-serif italic tracking-wide">PseudoCode Studio v1.0</span>
          </div>
          <nav className="flex gap-4 opacity-70">
            <button className="hover:opacity-100 transition-opacity">File</button>
            <button className="hover:opacity-100 transition-opacity">Edit</button>
            <button className="hover:opacity-100 transition-opacity">View</button>
            <button className="hover:opacity-100 transition-opacity">Help</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 opacity-70">
            <Command size={12} />
            <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </header>

      {/* Main Desktop Area */}
      <main className="flex-1 relative p-4 flex flex-col gap-4 overflow-hidden">
        
        {/* Workflow Stepper */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
          {[
            { label: 'Problem', icon: <MessageSquare size={14} /> },
            { label: 'Logic', icon: <Code2 size={14} /> },
            { label: 'Audit', icon: <ShieldCheck size={14} /> },
            { label: 'Translate', icon: <Cpu size={14} /> }
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all",
                workflowStep > i 
                  ? "bg-[#141414] text-white border-[#141414]" 
                  : workflowStep === i 
                    ? "bg-white text-[#141414] border-[#141414] ring-2 ring-[#141414]/10" 
                    : "bg-gray-50 text-gray-300 border-gray-200"
              )}>
                {workflowStep > i ? <Check size={12} /> : i + 1}
              </div>
              <div className="flex flex-col">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  workflowStep >= i ? "text-[#141414]" : "text-gray-300"
                )}>{step.label}</span>
              </div>
              {i < 3 && <div className={cn("w-12 h-[1px] mx-2", workflowStep > i ? "bg-[#141414]" : "bg-gray-200")} />}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
        
        {/* Left Pane: Problem & Editor */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-4 overflow-hidden">
          {/* Problem Statement Window */}
          <AnimatePresence>
            {windows.problem.isOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col h-1/3 min-h-[150px] bg-white border border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
              >
                <div className="h-10 border-b border-[#141414] flex items-center justify-between px-3 bg-[#f5f5f5]">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} />
                    <span className="text-xs font-mono font-bold uppercase tracking-tighter">problem_statement.md</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleValidateProblem}
                      disabled={isValidatingProblem || !problem.trim()}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase border border-[#141414] hover:bg-emerald-50 transition-colors",
                        (isValidatingProblem || !problem.trim()) && "opacity-50 cursor-not-allowed"
                      )}
                      title="Check if problem statement is complete"
                    >
                      {isValidatingProblem ? (
                        <div className="w-2 h-2 border border-[#141414]/30 border-t-[#141414] rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 size={12} className="text-emerald-500" />
                      )}
                      <span>Validate</span>
                    </button>
                    <button 
                      onClick={handleRefine}
                      disabled={isRefining || !problem.trim()}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase border border-[#141414] hover:bg-blue-50 transition-colors",
                        (isRefining || !problem.trim()) && "opacity-50 cursor-not-allowed",
                        showRefinement && "bg-blue-50"
                      )}
                      title="Analyze problem for clarifying questions and edge cases"
                    >
                      {isRefining ? (
                        <div className="w-2 h-2 border border-[#141414]/30 border-t-[#141414] rounded-full animate-spin" />
                      ) : (
                        <HelpCircle size={12} className="text-blue-500" />
                      )}
                      <span>Clarify</span>
                    </button>
                    <button 
                      onClick={handleSuggest}
                      disabled={isSuggesting || !problem.trim()}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase border border-[#141414] hover:bg-emerald-50 transition-colors",
                        (isSuggesting || !problem.trim()) && "opacity-50 cursor-not-allowed"
                      )}
                      title="Suggest pseudocode based on this problem"
                    >
                      {isSuggesting ? (
                        <div className="w-2 h-2 border border-[#141414]/30 border-t-[#141414] rounded-full animate-spin" />
                      ) : (
                        <Lightbulb size={12} className="text-amber-500" />
                      )}
                      <span>Suggest Logic</span>
                    </button>
                    <button onClick={() => toggleWindow('problem')} className="p-1 hover:bg-red-100 rounded transition-colors"><X size={14} /></button>
                  </div>
                </div>
                <div className="flex-1 relative overflow-hidden flex flex-col">
                  {problemValidation && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "mx-4 mt-4 p-3 border border-[#141414] text-xs shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] z-10",
                        problemValidation.score >= 80 ? "bg-emerald-50" : problemValidation.score >= 50 ? "bg-amber-50" : "bg-red-50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold uppercase tracking-tighter">Completeness:</span>
                          <span className={cn(
                            "font-mono font-bold",
                            problemValidation.score >= 80 ? "text-emerald-700" : problemValidation.score >= 50 ? "text-amber-700" : "text-red-700"
                          )}>{problemValidation.score}%</span>
                        </div>
                        <button 
                          onClick={() => setProblemValidation(null)}
                          className="hover:underline text-[10px] font-bold uppercase"
                        >Dismiss</button>
                      </div>
                      <p className="italic mb-2">"{problemValidation.feedback}"</p>
                      {problemValidation.missingElements.length > 0 && (
                        <div>
                          <span className="font-bold uppercase text-[10px] text-gray-500">Missing:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {problemValidation.missingElements.map((el, i) => (
                              <span key={i} className="bg-white/50 border border-[#141414]/10 px-1.5 py-0.5 rounded-sm text-[10px]">
                                {el}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                  <textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="// Describe the problem you're trying to solve...&#10;Example: Create an algorithm to find the shortest path in a weighted graph."
                    className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none bg-transparent leading-relaxed custom-scrollbar"
                  />

                  {/* Refinement Panel Overlay */}
                  <AnimatePresence>
                    {showRefinement && refinement && (
                      <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="absolute inset-0 bg-white border-l border-[#141414] z-10 flex flex-col"
                      >
                        <div className="h-8 border-b border-[#141414] flex items-center justify-between px-3 bg-blue-50">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700">Refinement Analysis</span>
                          <button onClick={() => setShowRefinement(false)} className="hover:bg-blue-100 p-0.5 rounded transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                          {refinement.clarifications.length > 0 && (
                            <div>
                              <h4 className="text-[10px] font-bold uppercase text-blue-600 mb-2">Clarifying Questions</h4>
                              <ul className="space-y-2">
                                {refinement.clarifications.map((q, i) => (
                                  <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                    <span className="mt-1.5 w-1 h-1 bg-blue-400 rounded-full shrink-0" />
                                    {q}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {refinement.edgeCases.length > 0 && (
                            <div>
                              <h4 className="text-[10px] font-bold uppercase text-amber-600 mb-2">Edge Cases to Consider</h4>
                              <ul className="space-y-2">
                                {refinement.edgeCases.map((e, i) => (
                                  <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                    <span className="mt-1.5 w-1 h-1 bg-amber-400 rounded-full shrink-0" />
                                    {e}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="p-3 border-t border-[#141414] bg-gray-50">
                          <p className="text-[10px] text-gray-500 italic">Use these insights to update your problem statement or logic.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="h-6 border-t border-[#141414] bg-[#f5f5f5] flex items-center justify-between px-3 text-[9px] font-mono text-gray-500 uppercase">
                  <div className="flex gap-3">
                    <span>Lines: {stats.problemLines}</span>
                    <span>Words: {stats.problemWords}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={cn("w-1.5 h-1.5 rounded-full", problem.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-gray-300")} />
                    <span>{problem.length > 0 ? 'Drafting' : 'Empty'}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pseudocode Editor Window */}
          <AnimatePresence>
            {windows.editor.isOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "flex-1 flex flex-col bg-white border border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]",
                  windows.editor.isMaximized && "fixed inset-4 z-40"
                )}
              >
              <div className="h-10 border-b border-[#141414] flex items-center justify-between px-3 bg-[#f5f5f5]">
                <div className="flex items-center gap-2">
                  <FileCode size={16} />
                  <span className="text-xs font-mono font-bold uppercase tracking-tighter">pseudocode.txt</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 hover:bg-gray-200 rounded transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
                    title="Open File"
                  >
                    <FolderOpen size={14} />
                    <span className="hidden sm:inline">Open</span>
                  </button>
                  <button 
                    onClick={handleSave}
                    className="p-1.5 hover:bg-gray-200 rounded transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
                    title="Save File"
                  >
                    <Save size={14} />
                    <span className="hidden sm:inline">Save</span>
                  </button>
                  <div className="w-[1px] h-4 bg-gray-300 mx-1" />
                  <button onClick={() => toggleWindow('editor')} className="p-1 hover:bg-red-100 rounded transition-colors"><X size={14} /></button>
                </div>
              </div>
              
              <div className="flex-1 relative flex flex-col">
                <div className="flex-1 relative">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleLoad} 
                    className="hidden" 
                    accept=".txt,.pseudo,.md"
                  />
                  <textarea
                    value={pseudocode}
                    onChange={(e) => setPseudocode(e.target.value)}
                    placeholder="// Write your pseudocode here...&#10;Example:&#10;1. Create a function that adds two numbers&#10;2. If sum > 10, return true&#10;3. Else return false"
                    className="w-full h-full p-6 font-mono text-sm resize-none focus:outline-none bg-transparent leading-relaxed custom-scrollbar"
                  />
                  
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <select 
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="bg-white border border-[#141414] px-3 py-1.5 text-xs font-mono focus:outline-none hover:bg-gray-50 cursor-pointer"
                    >
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="rust">Rust</option>
                      <option value="go">Go</option>
                      <option value="sql">SQL</option>
                    </select>
                    
                    <button
                      onClick={handleValidate}
                      disabled={isValidating || isConverting || !pseudocode.trim()}
                      className={cn(
                        "flex items-center gap-2 px-4 py-1.5 border border-[#141414] text-[#141414] text-xs font-bold uppercase tracking-widest transition-all",
                        (isValidating || isConverting || !pseudocode.trim()) ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 active:translate-y-0.5"
                      )}
                    >
                      {isValidating ? (
                        <div className="w-3 h-3 border-2 border-[#141414]/30 border-t-[#141414] rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      <span>Validate</span>
                    </button>

                    <button
                      onClick={handleAudit}
                      disabled={isAuditing || isConverting || isValidating || !pseudocode.trim()}
                      className={cn(
                        "flex items-center gap-2 px-4 py-1.5 border border-[#141414] text-[#141414] text-xs font-bold uppercase tracking-widest transition-all",
                        (isAuditing || isConverting || isValidating || !pseudocode.trim()) ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 active:translate-y-0.5"
                      )}
                    >
                      {isAuditing ? (
                        <div className="w-3 h-3 border-2 border-[#141414]/30 border-t-[#141414] rounded-full animate-spin" />
                      ) : (
                        <ShieldAlert size={14} />
                      )}
                      <span>Audit</span>
                    </button>

                    <button
                      onClick={handleFlowchart}
                      disabled={isFlowcharting || isConverting || isValidating || isAuditing || !pseudocode.trim()}
                      className={cn(
                        "flex items-center gap-2 px-4 py-1.5 border border-[#141414] text-[#141414] text-xs font-bold uppercase tracking-widest transition-all",
                        (isFlowcharting || isConverting || isValidating || isAuditing || !pseudocode.trim()) ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 active:translate-y-0.5"
                      )}
                    >
                      {isFlowcharting ? (
                        <div className="w-3 h-3 border-2 border-[#141414]/30 border-t-[#141414] rounded-full animate-spin" />
                      ) : (
                        <GitGraph size={14} />
                      )}
                      <span>Flowchart</span>
                    </button>

                    <button
                      onClick={handleConvert}
                      disabled={isConverting || isValidating || !pseudocode.trim()}
                      className={cn(
                        "flex items-center gap-2 px-4 py-1.5 bg-[#141414] text-white text-xs font-bold uppercase tracking-widest transition-all",
                        (isConverting || !pseudocode.trim()) ? "opacity-50 cursor-not-allowed" : "hover:bg-emerald-600 active:translate-y-0.5"
                      )}
                    >
                      {isConverting ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Play size={14} fill="currentColor" />
                      )}
                      <span>Process</span>
                    </button>
                  </div>
                </div>
                <div className="h-6 border-t border-[#141414] bg-[#f5f5f5] flex items-center justify-between px-3 text-[9px] font-mono text-gray-500 uppercase">
                  <div className="flex gap-3">
                    <span>Lines: {stats.logicLines}</span>
                    <span>Words: {stats.logicWords}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {audit && (
                      <div className="flex items-center gap-1">
                        <ShieldCheck size={10} className={cn(
                          audit.vulnerabilities.length === 0 ? "text-emerald-500" : "text-amber-500"
                        )} />
                        <span>Audit: {audit.vulnerabilities.length === 0 ? 'Secure' : `${audit.vulnerabilities.length} Issues`}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <div className={cn("w-1.5 h-1.5 rounded-full", pseudocode.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-gray-300")} />
                      <span>{pseudocode.length > 0 ? 'Active' : 'Idle'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
        
        {/* Right Pane: Analysis & Code */}
        <AnimatePresence>
          {windows.output.isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "col-span-12 lg:col-span-6 flex flex-col bg-white border border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]",
                windows.output.isMaximized && "fixed inset-4 z-40"
              )}
            >
              <div className="h-10 border-b border-[#141414] flex items-center justify-between px-3 bg-[#f5f5f5]">
                <div className="flex items-center gap-2">
                  <Terminal size={16} />
                  <span className="text-xs font-mono font-bold uppercase tracking-tighter">analysis_output</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleWindow('output')} className="p-1 hover:bg-red-100 rounded transition-colors"><X size={14} /></button>
                </div>
              </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {!result && !validation && !audit && !flowchartData && !isConverting && !isValidating && !isAuditing && !isFlowcharting && !error && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                    <Code2 size={48} strokeWidth={1} />
                    <p className="mt-4 font-serif italic">Awaiting logic input...</p>
                  </div>
                )}

                {(isConverting || isValidating || isAuditing || isFlowcharting) && (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-gray-200 w-3/4 rounded" />
                    <div className="h-4 bg-gray-200 w-1/2 rounded" />
                    <div className="h-32 bg-gray-100 rounded border border-dashed border-gray-300" />
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                {validation && !result && (
                  <div className="space-y-8">
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        {validation.isValid ? (
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        ) : (
                          <AlertCircle size={16} className="text-amber-600" />
                        )}
                        <h3 className={cn(
                          "text-xs font-bold uppercase tracking-widest",
                          validation.isValid ? "text-emerald-600" : "text-amber-600"
                        )}>
                          {validation.isValid ? 'Logic is Sound' : 'Logic Concerns Detected'}
                        </h3>
                      </div>
                      <div className={cn(
                        "p-4 border rounded-lg",
                        validation.isValid ? "bg-emerald-50 border-emerald-100 text-emerald-900" : "bg-amber-50 border-amber-100 text-amber-900"
                      )}>
                        <p className="text-sm leading-relaxed">
                          {validation.feedback}
                        </p>
                      </div>
                    </section>

                    {validation.suggestions.length > 0 && (
                      <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Suggestions for Improvement</h3>
                        <ul className="space-y-2">
                          {validation.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-[#141414]/80">
                              <ChevronRight size={14} className="shrink-0 mt-1 opacity-40" />
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    <div className="pt-6 border-t border-gray-100 flex justify-center">
                      <button 
                        onClick={handleConvert}
                        className="flex items-center gap-2 px-6 py-2 bg-[#141414] text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all"
                      >
                        <Play size={14} fill="currentColor" />
                        <span>Proceed to Translation</span>
                      </button>
                    </div>
                  </div>
                )}

                {audit && !result && !validation && !showFlowchart && (
                  <div className="space-y-8">
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldAlert size={16} className="text-red-600" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-red-600">Security & Quality Audit</h3>
                      </div>
                      <div className="p-4 border border-red-100 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-900 font-medium mb-4">
                          Potential vulnerabilities and bottlenecks detected in your logic.
                        </p>
                        
                        <div className="space-y-4">
                          {audit.vulnerabilities.length > 0 && (
                            <div>
                              <h4 className="text-[10px] font-bold uppercase text-red-700 mb-2 flex items-center gap-1">
                                <AlertCircle size={12} />
                                Vulnerabilities
                              </h4>
                              <ul className="space-y-1">
                                {audit.vulnerabilities.map((v, i) => (
                                  <li key={i} className="text-xs text-red-800 flex items-start gap-2">
                                    <span className="mt-1 w-1 h-1 bg-red-400 rounded-full shrink-0" />
                                    {v}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {audit.performanceIssues.length > 0 && (
                            <div>
                              <h4 className="text-[10px] font-bold uppercase text-amber-700 mb-2 flex items-center gap-1">
                                <Zap size={12} />
                                Performance
                              </h4>
                              <ul className="space-y-1">
                                {audit.performanceIssues.map((p, i) => (
                                  <li key={i} className="text-xs text-amber-800 flex items-start gap-2">
                                    <span className="mt-1 w-1 h-1 bg-amber-400 rounded-full shrink-0" />
                                    {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb size={16} className="text-blue-600" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-blue-600">Hints (No Spoilers)</h3>
                      </div>
                      <div className="space-y-3">
                        {audit.hints.map((hint, idx) => (
                          <div key={idx} className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900 flex items-start gap-3">
                            <ChevronRight size={14} className="shrink-0 mt-1 opacity-40" />
                            <span>{hint}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <div className="pt-6 border-t border-gray-100 flex justify-center gap-4">
                      <button 
                        onClick={() => setAudit(null)}
                        className="px-6 py-2 border border-[#141414] text-[#141414] text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-all"
                      >
                        Back to Editor
                      </button>
                      <button 
                        onClick={handleConvert}
                        className="flex items-center gap-2 px-6 py-2 bg-[#141414] text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all"
                      >
                        <Play size={14} fill="currentColor" />
                        <span>Proceed Anyway</span>
                      </button>
                    </div>
                  </div>
                )}

                {showFlowchart && flowchartData && !result && !validation && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <GitGraph size={16} className="text-emerald-600" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-600">Logic Flowchart</h3>
                      </div>
                      <button 
                        onClick={() => setShowFlowchart(false)}
                        className="text-[10px] font-bold uppercase tracking-widest hover:underline"
                      >
                        Close Diagram
                      </button>
                    </div>
                    <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 overflow-auto flex items-center justify-center">
                      <Mermaid chart={flowchartData} />
                    </div>
                    <div className="mt-4 flex justify-center">
                       <button 
                        onClick={handleConvert}
                        className="flex items-center gap-2 px-6 py-2 bg-[#141414] text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all"
                      >
                        <Play size={14} fill="currentColor" />
                        <span>Proceed to Translation</span>
                      </button>
                    </div>
                  </div>
                )}

                {result && (
                  <div className="space-y-8">
                    {/* Logic Check Section */}
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-600">Logic Validation</h3>
                      </div>
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                        <p className="text-sm font-medium text-emerald-900 leading-relaxed">
                          {result.logicCheck}
                        </p>
                      </div>
                    </section>

                    {/* Explanation Section */}
                    <section>
                      <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Interpretation</h3>
                      <div className="prose prose-sm max-w-none text-[#141414]/80">
                        <Markdown>{result.explanation}</Markdown>
                      </div>
                    </section>

                    {/* Code Section (Hidden by default) */}
                    <section className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest opacity-50">Generated Source</h3>
                        <button 
                          onClick={() => setShowCode(!showCode)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase border border-[#141414] transition-colors",
                            showCode ? "bg-[#141414] text-white" : "hover:bg-gray-50"
                          )}
                        >
                          {showCode ? <EyeOff size={12} /> : <Eye size={12} />}
                          <span>{showCode ? 'Hide Implementation' : 'Reveal Implementation'}</span>
                        </button>
                      </div>

                      <div className="relative group">
                        <div className={cn(
                          "bg-[#141414] p-4 rounded-lg font-mono text-sm overflow-x-auto transition-all duration-500",
                          !showCode && "blur-md select-none pointer-events-none opacity-20 grayscale"
                        )}>
                          <pre className="text-emerald-400">
                            <code>{result.code}</code>
                          </pre>
                        </div>
                        {!showCode && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">Implementation Locked</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>

      {/* Taskbar */}
      <footer className="h-12 bg-[#E4E3E0] border-t border-[#141414] flex items-center px-4 gap-2 z-50">
        <button className="w-10 h-10 bg-[#141414] text-white flex items-center justify-center hover:bg-emerald-600 transition-colors">
          <Cpu size={20} />
        </button>
        <div className="h-6 w-[1px] bg-[#141414]/20 mx-2" />
        
        <div className="flex gap-1">
          <button 
            onClick={() => toggleWindow('problem')}
            className={cn(
              "px-4 h-10 flex items-center gap-2 text-xs font-bold uppercase tracking-tighter transition-all border-b-2",
              windows.problem.isOpen ? "bg-white border-[#141414]" : "opacity-40 border-transparent hover:opacity-100"
            )}
          >
            <MessageSquare size={14} />
            <span className="hidden sm:inline">Problem</span>
          </button>

          <button 
            onClick={() => toggleWindow('editor')}
            className={cn(
              "px-4 h-10 flex items-center gap-2 text-xs font-bold uppercase tracking-tighter transition-all border-b-2",
              windows.editor.isOpen ? "bg-white border-[#141414]" : "opacity-40 border-transparent hover:opacity-100"
            )}
          >
            <FileCode size={14} />
            <span className="hidden sm:inline">Editor</span>
          </button>
          
          <button 
            onClick={() => toggleWindow('output')}
            className={cn(
              "px-4 h-10 flex items-center gap-2 text-xs font-bold uppercase tracking-tighter transition-all border-b-2",
              windows.output.isOpen ? "bg-white border-[#141414]" : "opacity-40 border-transparent hover:opacity-100"
            )}
          >
            <Terminal size={14} />
            <span className="hidden sm:inline">Output</span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-4 text-[10px] font-bold uppercase opacity-50">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI System Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
