export interface PillarData {
  id: string;
  number: string;
  title: string;
  tagline: string;
  metadata: {
    layer: string;
    path: string;
    delay: string;
    frequency: string;
    solver: string;
  };
  copy: string;
  rtlCode: string;
  svaCode: string;
  schematic: string; // Describes block nodes or a structured representation for rendering custom SVGs
}

export interface SimulationState {
  clk_cycle: number;
  // Pillar 1 state
  entropyLevel: number;
  gateDrop: boolean;
  validOut: boolean;
  
  // Pillar 2 state
  weightVal: number;
  actVal: number;
  macAccumulator: number;
  
  // Pillar 3 state
  tamperTriggered: boolean;
  fsmState: "BOOT_READ" | "CIPHER_GEN" | "BLOW_FUSE" | "SECURE_LOCK" | "TAMPER_BREACH";
  fuseActive: boolean;
  systemCompromised: boolean;
  
  // Pillar 4 state
  pulsePending: boolean;
  pulseCaptured: boolean;
  syncFlopQ1: boolean;
  syncFlopQ2: boolean;
  handshakeAck: boolean;
  
  // Pillar 5 state
  delayTaps: number;
  timestampPs: number;
}

export interface WaveformPoint {
  cycle: number;
  clockValue: number;
  p1_entropy: number;
  p1_gate_drop: number;
  p1_valid_o: number;
  
  p2_weight: number;
  p2_act: number;
  p2_acc: number;
  
  p3_tamper: number;
  p3_fuse: number;
  p3_secure_ok: number;
  
  p4_photon_pulse: number;
  p4_captured: number;
  p4_ack: number;
  
  p5_taps: number;
  p5_timestamp: number;
}
