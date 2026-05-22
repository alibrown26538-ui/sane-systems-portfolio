# SANE Framework: Microarchitectural Reliability & Spatial Optimization

This module specifies the design invariants, anti-loop constraints, and EDA timing closure optimizations required to enforce absolute determinism and maximize "Intelligence per Joule" across the SANE processing grid.

## 1. Deterministic Reliability: The Suppression of Unbounded Loops
To eliminate latency jitter and safeguard execution paths against machine-speed software mutation or stalls, the architecture strictly mandates bounded spatial execution blocks over temporal iteration loops:

* **Verification Layer (Agentic Bounding):** The Saarthi automated formal verification workflow enforces a hard execution ceiling capped at 5 iterations on the Coder/Critic multi-agent loop. If a valid SystemVerilog Assertion (SVA) path cannot close mathematically within this window, execution terminates and auto-triggers Human-in-the-Loop (HIL) triage to prevent token/hallucination loops.
* **Hardware Layer (RTL Structural Invariants):** Enforces a strict prohibition on combinational timing loops inside the gateware. All design paths must be completely acyclic to ensure reliable mapping during Static Timing Analysis (STA) and avoid implementation exclusion errors in the physical layout tools.
* **Execution Layer (Spatial Redundancy & TCM):** Replaces prolonged sequential feedback loops with Triple Modular Redundancy (TMR) and real-time hardware voting logic grouped inside localized Fault-Tolerant Units (FTUs). Critical algorithmic paths run adjacent to the computing core inside Tightly Coupled Memory (TCM), bypassing variable multi-level cache pipelines entirely to eliminate interrupt latency.

## 2. Microarchitectural Optimization & Dataflow Engineering

### A. Fused Systolic Array (FSA) Dataflow Tuning
* **Input Data Interleaving:** Employs an interleaved scheduling timeline to process complex data dependencies natively within deeply pipelined matrix blocks, mitigating execution stalls during non-linear attention routines.
* **Serialization and Scatter/Gather Routing:** Implements data aggregation middleware before feeding execution frames to the FSA, reducing high-density off-chip routing lines while pushing physical DSP utilization efficiency toward 100%.
* **Dynamic Stationary Mapping:** Supports software-configurable runtime switches between Output Stationary (OS) logic (accumulating values locally within internal PE registers) and Weight Stationary (WS) configurations to minimize wide-bus memory toggling rates depending on tensor dimensions.

### B. Execution Overheads & Low-Power FinOps Management
* **Deterministic Enclaving:** Deploys hardware-isolated Cache Coloring alongside Invalidation-Driven Allocation (IDA) across multi-tenant landing zones, preventing non-critical concurrent edge threads from evicting safety-critical operational cache lines.
* **TTA-Driven Software Bypassing:** Configures the compiler to route computed data frames directly to the operand registers of subsequent functional units. This bypasses the primary register file entirely, significantly flattening power consumption lines and alleviating register tracking congestion.
* **HDL Optimization Rules:** Mandates that all cyclic ring-buffer array counters and pointer configurations execute via bitwise bitmasking logic rather than costly integer arithmetic division or modulus structures.

### C. Physical Silicon Layout & Timing Closure
* **Useful Skew Insertion:** Introduces controlled clock arrival skew profiles during Clock Tree Synthesis (CTS), programmatically borrowing timing slack from low-density paths to stabilize execution windows on high-density math pipelines.
* **Register Retiming:** Directs physical synthesis engines to balance logic barriers by programmatically shifting registers across the spatial logic path, compressing worst-case path delays without altering clock cycle behavior.
* **Continuous Gate Sizing:** Dynamically resizes physical transistor channel dimensions across the critical execution path to maintain equilibrium between raw processing frequencies and static leakage currents.
