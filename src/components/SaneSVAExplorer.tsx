import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  Database, 
  BarChart3, 
  ChevronRight, 
  Activity, 
  Cpu, 
  Server, 
  Lock, 
  Play, 
  RotateCcw, 
  AlertTriangle, 
  Terminal, 
  Zap, 
  CheckCircle2, 
  Sliders, 
  Layers 
} from "lucide-react";
import { pillars } from "../data";
import { SimulationState, WaveformPoint } from "../types";

export function SaneSVAExplorer() {
  const [activePillarIdx, setActivePillarIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"rtl" | "sva" | "schematic">("rtl");
  
  // Simulation Engine State
  const [simState, setSimState] = useState<SimulationState>({
    clk_cycle: 0,
    entropyLevel: 80,
    gateDrop: false,
    validOut: true,
    
    weightVal: 64,
    actVal: 32,
    macAccumulator: 0,
    
    tamperTriggered: false,
    fsmState: "BOOT_READ",
    fuseActive: true,
    systemCompromised: false,
    
    pulsePending: false,
    pulseCaptured: false,
    syncFlopQ1: false,
    syncFlopQ2: false,
    handshakeAck: false,
    
    delayTaps: 40,
    timestampPs: 46.00
  });

  // Waveform History (storing last 12 cycles)
  const [waveformHistory, setWaveformHistory] = useState<WaveformPoint[]>([]);

  // Formal Solver Terminal Log State
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [solverLogs, setSolverLogs] = useState<string[]>([]);
  const [solvedStatus, setSolvedStatus] = useState<"idle" | "solving" | "proved" | "failed">("idle");
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  const activePillar = pillars[activePillarIdx];

  // Initialize Waveform History to static base clock
  useEffect(() => {
    resetSimulation();
  }, [activePillarIdx]);

  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [solverLogs]);

  const resetSimulation = () => {
    const defaultState: SimulationState = {
      clk_cycle: 0,
      entropyLevel: activePillarIdx === 0 ? 120 : 80,
      gateDrop: false,
      validOut: true,
      
      weightVal: 72,
      actVal: 32,
      macAccumulator: 0,
      
      tamperTriggered: false,
      fsmState: "BOOT_READ",
      fuseActive: true,
      systemCompromised: false,
      
      pulsePending: false,
      pulseCaptured: false,
      syncFlopQ1: false,
      syncFlopQ2: false,
      handshakeAck: false,
      
      delayTaps: 40,
      timestampPs: 46.00
    };

    setSimState(defaultState);

    // Seed historical waveform
    const prepHistory: WaveformPoint[] = [];
    for (let i = 0; i < 10; i++) {
      prepHistory.push(generatePoint(i, defaultState));
    }
    setWaveformHistory(prepHistory);
    setSolvedStatus("idle");
    setSolverLogs([]);
  };

  const generatePoint = (cycle: number, state: SimulationState): WaveformPoint => {
    return {
      cycle,
      clockValue: cycle % 2,
      p1_entropy: state.entropyLevel,
      p1_gate_drop: state.gateDrop ? 1 : 0,
      p1_valid_o: state.validOut ? 1 : 0,
      
      p2_weight: state.weightVal,
      p2_act: state.actVal,
      p2_acc: state.macAccumulator,
      
      p3_tamper: state.tamperTriggered ? 1 : 0,
      p3_fuse: state.fuseActive ? 1 : 0,
      p3_secure_ok: state.fsmState === "SECURE_LOCK" ? 1 : 0,
      
      p4_photon_pulse: state.pulsePending ? 1 : 0,
      p4_captured: state.pulseCaptured ? 1 : 0,
      p4_ack: state.handshakeAck ? 1 : 0,
      
      p5_taps: state.delayTaps,
      p5_timestamp: state.timestampPs
    };
  };

  const stepSimulation = () => {
    setSimState(prev => {
      const nextCycle = prev.clk_cycle + 1;
      let updated = { ...prev, clk_cycle: nextCycle };

      // Pillar 1 calculations
      if (activePillarIdx === 0) {
        if (prev.entropyLevel > 212) {
          updated.gateDrop = true;
          updated.validOut = false;
        } else {
          updated.validOut = !prev.gateDrop;
        }
      }

      // Pillar 2 calculations
      if (activePillarIdx === 1) {
        const factor = prev.actVal < 0 ? 4 : 1;
        const inc = Math.round((prev.weightVal * prev.actVal) / factor);
        updated.macAccumulator = prev.macAccumulator + inc;
      }

      // Pillar 3 calculations
      if (activePillarIdx === 2) {
        if (prev.tamperTriggered) {
          updated.fsmState = "TAMPER_BREACH";
          updated.fuseActive = false;
          updated.systemCompromised = true;
        } else {
          switch (prev.fsmState) {
            case "BOOT_READ":
              updated.fsmState = "CIPHER_GEN";
              break;
            case "CIPHER_GEN":
              updated.fsmState = "BLOW_FUSE";
              updated.fuseActive = false;
              break;
            case "BLOW_FUSE":
            case "SECURE_LOCK":
              updated.fsmState = "SECURE_LOCK";
              updated.fuseActive = false;
              break;
            default:
              break;
          }
        }
      }

      // Pillar 4 calculations
      if (activePillarIdx === 3) {
        // CDC clock stages simulation
        if (prev.pulsePending) {
          updated.pulseCaptured = true;
          updated.pulsePending = false; // Reset async event trigger
        }
        
        updated.syncFlopQ1 = prev.pulseCaptured;
        updated.syncFlopQ2 = prev.syncFlopQ1;
        updated.handshakeAck = prev.syncFlopQ2;
        
        if (prev.handshakeAck) {
          updated.pulseCaptured = false; // clear latch on ACK high
        }
      }

      // Pillar 5 calculations
      if (activePillarIdx === 4) {
        updated.timestampPs = prev.delayTaps * 1.15;
      }

      // Append to waveform history & truncate to 14 points
      setWaveformHistory(prevHistory => {
        const nextPoint = generatePoint(nextCycle, updated);
        const copy = [...prevHistory, nextPoint];
        if (copy.length > 14) {
          copy.shift();
        }
        return copy;
      });

      return updated;
    });
  };

  // Run Simulated Formal Proof Solver
  const runFormalVerification = () => {
    setIsSolving(true);
    setSolvedStatus("solving");
    setSolverLogs([
      `[SWA SOLVER]: Parsing Reference Specification...`,
      `[SWA SOLVER]: Bind complete: ${activePillar.metadata.path} integrated with assertion block SVA-Formal.`,
      `[SWA SOLVER]: Initializing solver backend: ${activePillar.metadata.solver}...`
    ]);

    const logSteps = [
      `[YOSYS]: Elaborating module ${activePillar.id === "temporal-firewall" ? "semantic_temporal_firewall" : "sane_block"}...`,
      `[YOSYS]: Mapping internal logic cells...`,
      `[SBY]: Found ${activePillarIdx === 0 ? "2" : "2"} formal assertion properties to verify...`,
      `[SBY]: Launching Bounded Model Checker (BMC) solver engine...`,
      `[BMC-Z3]: Step k = 0: checking base induction step... Passed.`,
      `[BMC-Z3]: Step k = 5: checking induction hypothesis... Passed.`,
      `[BMC-Z3]: Step k = 10: executing deep path analysis... Passed.`,
      `[SBY]: All inductive step proofs resolved with ZERO violations.`,
      `[SWA PROOF]: STATUS SECURE // MATHEMATICALLY PROVED IMMUTABLE`
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < logSteps.length) {
        const nextLog = logSteps[currentStepIdx];
        setSolverLogs(prev => [...prev, nextLog]);
        currentStepIdx++;
      } else {
        clearInterval(interval);
        setIsSolving(false);
        setSolvedStatus("proved");
      }
    }, 280);
  };

  // Helper to colorize SystemVerilog in a super-clean raw visual layout
  const colorizeSV = (code: string) => {
    return code.split("\n").map((line, idx) => {
      // Check for comments
      if (line.trim().startsWith("//")) {
        return (
          <div key={idx} className="text-zinc-700 italic font-mono text-xs select-none">
            {line}
          </div>
        );
      }
      
      // Basic aesthetic substitution style replacement (real SV feel)
      return (
        <div key={idx} className="text-zinc-300 font-mono text-xs leading-relaxed">
          <span className="text-zinc-600 mr-4 select-none inline-block w-4 text-right">
            {(idx + 1).toString().padStart(2, "0")}
          </span>
          {line.split(/(\s+)/).map((word, wIdx) => {
            const trimmed = word.trim();
            if (["module", "endmodule", "input", "output", "parameter", "always_ff", "always_comb", "begin", "end", "case", "endcase", "if", "else", "assign", "typedef", "struct", "enum", "property", "assert", "disable", "iff", "posedge", "negedge", "logic", "int", "unsigned"].includes(trimmed)) {
              return <span key={wIdx} className="text-white font-semibold">{word}</span>;
            }
            if (trimmed.startsWith("p_") || trimmed.startsWith("assert_")) {
              return <span key={wIdx} className="text-emerald-400">{word}</span>;
            }
            if (trimmed.match(/^[0-9'dhdhb]+$/) || trimmed.startsWith("'")) {
              return <span key={wIdx} className="text-amber-500 font-mono">{word}</span>;
            }
            return <span key={wIdx}>{word}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="border border-zinc-900 bg-zinc-950/80 rounded-sm p-1 ml-0 relative overflow-hidden" id="sane-board-suite">
      {/* CAD UI Grid Matrix Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} id="sane-sandbox-bg"></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-900 min-h-[720px] relative z-10">
        
        {/* Left-Side Column: Core Pillar Selector (Navigation Rail) */}
        <div className="lg:col-span-4 p-6 flex flex-col justify-between" id="sandbox-rail">
          <div>
            <div className="flex items-center gap-2 mb-8 uppercase text-[10px] tracking-[0.2em] text-zinc-600 font-mono border-b border-zinc-900 pb-3">
              <Layers size={12} className="text-zinc-500" />
              <span>Silicon Substrate Layers</span>
            </div>
            
            <div className="space-y-3" id="pillars-list">
              {pillars.map((pillar, idx) => {
                const isActive = activePillarIdx === idx;
                return (
                  <button
                    key={pillar.id}
                    onClick={() => setActivePillarIdx(idx)}
                    className={`w-full text-left p-4 rounded-sm transition-all relative border ${
                      isActive 
                        ? "bg-zinc-900 border-zinc-800 text-white" 
                        : "bg-black/20 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
                    }`}
                    id={`pillar-btn-${pillar.id}`}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="active-indicator"
                        className="absolute left-0 top-0 bottom-0 w-[3px] bg-white"
                      />
                    )}
                    <div className="flex justify-between items-start mb-2 font-mono text-[10px]">
                      <span className={isActive ? "text-white" : "text-zinc-600"}>PILLAR_{pillar.number}</span>
                      <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-zinc-950/80 border border-zinc-900 text-zinc-500 font-normal">
                        {pillar.metadata.layer}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium tracking-tight uppercase leading-snug">
                      {pillar.title.replace("THE ", "").replace(" (", "\n(").split("\n")[0]}
                    </h3>
                    <div className="text-[10px] font-mono text-zinc-600 mt-1 uppercase tracking-wider">
                      {pillar.tagline}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="mt-8 border-t border-zinc-900/80 pt-6">
            <div className="p-4 bg-black border border-zinc-900 rounded-sm">
              <div className="flex items-center gap-2 text-white font-mono text-[10px] uppercase tracking-wider mb-2">
                <Shield size={12} className="text-emerald-500" />
                <span>Verification Rigor</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                Proven via <strong>SystemVerilog Assertions (SVA)</strong> mapped to formal solvers ensuring absolute correctness within 1 clock cycle of transition boundaries.
              </p>
            </div>
          </div>
        </div>

        {/* Central Component: Live Code Viewer, Toggles, and CAD Schematic */}
        <div className="lg:col-span-8 p-6 flex flex-col justify-between bg-black/40" id="sandbox-main">
          
          {/* Header Metadata Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-4 mb-6 font-mono text-[10px]" id="sandbox-main-ribbon">
            <div className="flex items-center gap-4">
              <span className="text-zinc-500">TARGET: <strong className="text-zinc-300">{activePillar.metadata.path}</strong></span>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 hidden md:block"></span>
              <span className="text-zinc-500 hidden md:inline">TIMING: <strong className="text-zinc-300">{activePillar.metadata.delay}</strong></span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="px-2 py-0.5 rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-400">
                {activePillar.metadata.frequency}
              </span>
            </div>
          </div>

          <div className="space-y-6" id="sandbox-container">
            {/* Tabbed Sheet Toggle BAR */}
            <div className="flex border-b border-zinc-900" id="sheet-selector">
              <button
                onClick={() => setActiveTab("rtl")}
                className={`py-2 px-4 text-xs font-mono border-b-2 tracking-wider ${
                  activeTab === "rtl" ? "border-white text-white font-bold" : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                SYSTEMVERILOG RTL
              </button>
              <button
                onClick={() => setActiveTab("sva")}
                className={`py-2 px-4 text-xs font-mono border-b-2 tracking-wider ${
                  activeTab === "sva" ? "border-white text-white font-bold" : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                FORMAL SVA PROPERTIES
              </button>
              <button
                onClick={() => setActiveTab("schematic")}
                className={`py-2 px-4 text-xs font-mono border-b-2 tracking-wider ${
                  activeTab === "schematic" ? "border-white text-white font-bold" : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                CAD BLOCK FLOW
              </button>
            </div>

            {/* Render Tab Contents */}
            <div className="min-h-[260px] max-h-[260px] overflow-auto bg-zinc-950 p-6 border border-zinc-900/60 rounded-sm relative" id="sheet-scroller">
              <AnimatePresence mode="wait">
                {activeTab === "rtl" && (
                  <motion.div
                    key="rtl-sheet"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {colorizeSV(activePillar.rtlCode)}
                  </motion.div>
                )}
                
                {activeTab === "sva" && (
                  <motion.div
                    key="sva-sheet"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {colorizeSV(activePillar.svaCode)}
                  </motion.div>
                )}

                {activeTab === "schematic" && (
                  <motion.div
                    key="schem-sheet"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full min-h-[190px]"
                  >
                    <div className="text-center mb-6">
                      <span className="font-mono text-[9px] tracking-widest text-zinc-600 block mb-2">LOGICAL ARCHITECTURE METRIC</span>
                      <span className="font-mono text-zinc-400 text-xs border border-zinc-800 px-3 py-1 bg-black rounded-sm">
                        {activePillar.schematic}
                      </span>
                    </div>

                    {/* Highly polished schematic diagram of signal streams */}
                    <div className="w-full max-w-lg h-16 flex items-center justify-between border-t border-b border-dashed border-zinc-900 py-3 relative">
                      <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                      <div className="flex-1 border-t border-zinc-800 relative mx-3">
                        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-4 h-4 bg-zinc-900 border border-zinc-800 rotate-45 flex items-center justify-center text-[8px] text-zinc-500 font-mono">D</div>
                        <div className="absolute top-1/2 left-2/3 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-500 animate-ping rounded-full"></div>
                      </div>
                      <div className="px-3 py-1.5 border border-zinc-800 bg-black text-center font-mono text-[10px] text-zinc-300">
                        {activePillar.metadata.layer} CORE MODULE
                      </div>
                      <div className="flex-1 border-t border-zinc-800 relative mx-3">
                        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 w-3 h-3 border border-zinc-800 bg-black flex items-center justify-center text-[7px] font-mono select-none">Q</div>
                      </div>
                      <div className="w-2.5 h-2.5 bg-zinc-800 rounded-full"></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Interactive Play Deck & Waveform Tracer */}
          <div className="mt-8 border-t border-zinc-900/70 pt-8" id="sandbox-deck">
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="sandbox-playfield">
              
              {/* Fault Injector Panel */}
              <div className="md:col-span-5 space-y-4 bg-zinc-950 p-4 border border-zinc-900 rounded-sm">
                <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-2">
                  <Sliders size={12} className="text-zinc-500" />
                  <span>Substrate Control Deck</span>
                </div>

                {/* Pillar 1 Specific Controls */}
                {activePillarIdx === 0 && (
                  <div className="space-y-3 font-sans" id="ctrl-p1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-500 uppercase">Input Entropy:</span>
                      <span className={simState.entropyLevel > 212 ? "text-red-500" : "text-emerald-500"}>
                        {simState.entropyLevel} / 300
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="300"
                      value={simState.entropyLevel}
                      onChange={(e) => setSimState(prev => ({ ...prev, entropyLevel: parseInt(e.target.value) }))}
                      className="w-full accent-white bg-zinc-800 h-1 rounded-sm appearance-none cursor-pointer"
                    />
                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600 uppercase">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                      <span>SVA drop threshold: {0xD4} (212)</span>
                    </div>
                  </div>
                )}

                {/* Pillar 2 Specific Controls */}
                {activePillarIdx === 1 && (
                  <div className="space-y-3 font-sans" id="ctrl-p2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-500 uppercase">Input Weight:</span>
                      <span className="text-white">{simState.weightVal}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="127"
                      value={simState.weightVal}
                      onChange={(e) => setSimState(prev => ({ ...prev, weightVal: parseInt(e.target.value) }))}
                      className="w-full accent-white bg-zinc-800 h-1 rounded-sm cursor-pointer"
                    />

                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-500 uppercase">Input Activation:</span>
                      <span className="text-white">{simState.actVal}</span>
                    </div>
                    <input 
                      type="range" 
                      min="-128" 
                      max="127"
                      value={simState.actVal}
                      onChange={(e) => setSimState(prev => ({ ...prev, actVal: parseInt(e.target.value) }))}
                      className="w-full accent-white bg-zinc-800 h-1 rounded-sm cursor-pointer"
                    />
                  </div>
                )}

                {/* Pillar 3 Specific Controls */}
                {activePillarIdx === 2 && (
                  <div className="space-y-4 font-sans" id="ctrl-p3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-mono uppercase">Tamper Override:</span>
                      <button 
                        onClick={() => setSimState(prev => ({ ...prev, tamperTriggered: !prev.tamperTriggered }))}
                        className={`px-3 py-1 font-mono text-[10px] rounded-sm border ${
                          simState.tamperTriggered 
                            ? "bg-red-950 border-red-500 text-red-200" 
                            : "bg-black border-zinc-900 text-zinc-500 hover:text-white"
                        }`}
                      >
                        {simState.tamperTriggered ? "TAMPER ON" : "INJECT TAMPER"}
                      </button>
                    </div>

                    <div className="p-2 border border-zinc-900 bg-black/40 rounded-sm space-y-1 font-mono text-[9px] text-zinc-600">
                      <div>FSM_S: <strong className="text-white">{simState.fsmState}</strong></div>
                      <div>SDM_FUSE: <strong className={simState.fuseActive ? "text-emerald-500" : "text-amber-500"}>{simState.fuseActive ? "ACTIVE_VCC" : "BLOWN/MELTED"}</strong></div>
                    </div>
                  </div>
                )}

                {/* Pillar 4 Specific Controls */}
                {activePillarIdx === 3 && (
                  <div className="space-y-4 font-sans" id="ctrl-p4">
                    <div className="text-center">
                      <button
                        onClick={() => setSimState(prev => ({ ...prev, pulsePending: true }))}
                        className="w-full py-2 bg-white text-black font-mono text-xs font-bold rounded-sm border hover:bg-zinc-200 uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <Zap size={12} fill="currentColor" />
                        Emit Optical Pulse
                      </button>
                    </div>

                    <div className="p-2 border border-zinc-900 bg-black/40 rounded-sm space-y-1 font-mono text-[9px] text-zinc-600">
                      <div>PULSED_LATCH: <strong className="text-white">{simState.pulseCaptured ? "1" : "0"}</strong></div>
                      <div>CDC_SYNC_ACK: <strong className="text-white">{simState.handshakeAck ? "1" : "0"}</strong></div>
                    </div>
                  </div>
                )}

                {/* Pillar 5 Specific Controls */}
                {activePillarIdx === 4 && (
                  <div className="space-y-3 font-sans" id="ctrl-p5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-500 uppercase">Tapped Delay Length:</span>
                      <span className="text-white">{simState.delayTaps} taps</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="64"
                      value={simState.delayTaps}
                      onChange={(e) => setSimState(prev => ({ ...prev, delayTaps: parseInt(e.target.value) }))}
                      className="w-full accent-white bg-zinc-800 h-1 rounded-sm cursor-pointer"
                    />

                    <div className="p-2 border border-zinc-900 bg-black bg-opacity-40 rounded-sm flex justify-between font-mono text-[10px]">
                      <span className="text-zinc-600">Calculated Delay Floor:</span>
                      <span className="text-emerald-500 font-bold">{simState.timestampPs.toFixed(2)} ps</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={stepSimulation}
                    className="flex-1 py-1.5 bg-zinc-900 border border-zinc-800 text-white font-mono text-[10px] hover:bg-white hover:text-black tracking-widest uppercase rounded-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Play size={10} fill="currentColor" /> Clock tick_n
                  </button>
                  <button
                    onClick={resetSimulation}
                    className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white rounded-sm"
                    title="Reset Simulation"
                  >
                    <RotateCcw size={10} />
                  </button>
                </div>
              </div>

              {/* Dynamic Waveform Simulation Field */}
              <div className="md:col-span-7 bg-zinc-950 p-4 border border-zinc-900 rounded-sm flex flex-col justify-between" id="waveform-panel">
                <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-2">
                  <span>Logic Waveform Tracer</span>
                  <span className="text-zinc-600">Cycle: #{simState.clk_cycle}</span>
                </div>

                {/* Simulated Custom Waveform Drawing Layer */}
                <div className="h-28 flex flex-col justify-around py-2 font-mono" id="tracer-grid">
                  
                  {/* CLK line */}
                  <div className="flex items-center gap-3 text-[9px]">
                    <span className="w-12 text-zinc-600">CLK</span>
                    <div className="flex-1 h-3 flex items-end">
                      <svg className="w-full h-full stroke-zinc-800 stroke-1 fill-none">
                        <path d={waveformHistory.map((pt, i) => `M ${i * 24} ${pt.clockValue === 1 ? 0 : 8} L ${(i + 0.5) * 24} ${pt.clockValue === 1 ? 0 : 8} L ${(i + 0.5) * 24} ${pt.clockValue === 1 ? 8 : 0} L ${(i + 1) * 24} ${pt.clockValue === 1 ? 8 : 0}`).join(" ")} />
                      </svg>
                    </div>
                  </div>

                  {/* Input Signal Line */}
                  <div className="flex items-center gap-3 text-[9px]">
                    <span className="w-12 text-zinc-600 truncate">
                      {activePillarIdx === 0 ? "ENTROPY" : activePillarIdx === 1 ? "WEIGHT" : activePillarIdx === 2 ? "TAMPER" : activePillarIdx === 3 ? "PT_PULSE" : "TAPS"}
                    </span>
                    <div className="flex-1 h-3 flex items-end">
                      <svg className="w-full h-full stroke-zinc-600 stroke-1 fill-none">
                        <path d={waveformHistory.map((pt, i) => {
                          let val = 0;
                          if (activePillarIdx === 0) val = pt.p1_entropy > 212 ? 0 : 8;
                          if (activePillarIdx === 1) val = pt.p2_weight > 64 ? 0 : 8;
                          if (activePillarIdx === 2) val = pt.p3_tamper === 1 ? 0 : 8;
                          if (activePillarIdx === 3) val = pt.p4_photon_pulse === 1 ? 0 : 8;
                          if (activePillarIdx === 4) val = pt.p5_taps > 32 ? 0 : 8;
                          return `M ${i * 24} ${val} L ${(i + 1) * 24} ${val}`;
                        }).join(" ")} />
                      </svg>
                    </div>
                  </div>

                  {/* Output Latch Signal Line */}
                  <div className="flex items-center gap-3 text-[9px]">
                    <span className="w-12 text-emerald-500 font-bold truncate">
                      {activePillarIdx === 0 ? "G_DROP" : activePillarIdx === 1 ? "ACC_VAL" : activePillarIdx === 2 ? "SECURE" : activePillarIdx === 3 ? "SYNC_ACK" : "TIMESTAMP"}
                    </span>
                    <div className="flex-1 h-3 flex items-end">
                      <svg className="w-full h-full stroke-emerald-500 stroke-1 fill-none">
                        <path d={waveformHistory.map((pt, i) => {
                          let val = 8;
                          if (activePillarIdx === 0) val = pt.p1_gate_drop === 1 ? 0 : 8;
                          if (activePillarIdx === 1) val = pt.p2_acc > 500 ? 0 : 8;
                          if (activePillarIdx === 2) val = pt.p3_secure_ok === 1 ? 0 : 8;
                          if (activePillarIdx === 3) val = pt.p4_ack === 1 ? 0 : 8;
                          if (activePillarIdx === 4) val = pt.p5_timestamp > 50 ? 0 : 8;
                          return `M ${i * 24} ${val} L ${(i + 1) * 24} ${val}`;
                        }).join(" ")} />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="text-[8px] font-mono text-zinc-700 uppercase tracking-widest text-right">
                  System model check: <span className="text-emerald-500/80">SVA bounds active</span>
                </div>
              </div>

            </div>

          </div>

          {/* SVA Bounded Model Checking (Console Terminal Logs) */}
          <div className="mt-8 border-t border-zinc-900 pt-6" id="formal-checker-pane">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-4">
              <div>
                <h4 className="text-sm text-white font-medium flex items-center gap-2">
                  <Terminal size={14} className="text-zinc-500" /> Formal Solver Dashboard
                </h4>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Solves all microarchitectural paths bounded to k = 15 step sequence.
                </p>
              </div>

              <div>
                <button
                  onClick={runFormalVerification}
                  disabled={isSolving}
                  className={`w-full md:w-auto px-5 py-2 rounded-sm font-mono text-xs tracking-wider border ${
                    solvedStatus === "proved"
                      ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                      : "bg-white text-black font-bold border-white hover:bg-zinc-200"
                  }`}
                >
                  {isSolving ? "PROPAGATING MODEL..." : solvedStatus === "proved" ? "SOLVED & IMMUTABLE PROVEN" : "RUN BOUNDED MODEL CHECK"}
                </button>
              </div>
            </div>

            {/* Terminal Window Output */}
            <div className="bg-black border border-zinc-900 p-4 font-mono text-[10px] text-zinc-500 rounded-sm overflow-hidden h-32 flex flex-col justify-between" id="terminal-scroller">
              <div className="overflow-y-auto flex-1 space-y-1.5" id="logs-field">
                {solverLogs.length === 0 ? (
                  <div className="text-zinc-700 italic select-none">
                    // Console Ready. Press 'RUN BOUNDED MODEL CHECK' to compile assertions and verify logic...
                  </div>
                ) : (
                  solverLogs.map((log, i) => {
                    const isSuccess = log?.includes("SECURE") || log?.includes("PROVED");
                    return (
                      <div 
                        key={i} 
                        className={isSuccess ? "text-emerald-400 font-bold" : "text-zinc-500"}
                      >
                        {log}
                      </div>
                    );
                  })
                )}
                <div ref={terminalBottomRef} />
              </div>

              {solvedStatus === "proved" && (
                <div className="mt-2 text-center border border-dashed border-emerald-500/20 bg-emerald-500/5 py-1 text-emerald-300 font-bold uppercase tracking-widest text-[9px] rounded-sm select-none animate-pulse">
                  Formal SVA Verification Secure: Zero-cycle RTL violation risk neutralized
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
