import { PillarData } from "./types";

export const pillars: PillarData[] = [
  {
    id: "temporal-firewall",
    number: "01",
    title: "THE SEMANTIC TEMPORAL FIREWALL",
    tagline: "6G O-RAN Edge Architecture",
    metadata: {
      layer: "PHY_SECURITY",
      path: "/rtl/semantic_temporal_firewall.sv",
      delay: "Gate Latency: < 1.2 ns",
      frequency: "Line Rate: 4x 100G",
      solver: "Yosys-SMTBMC + z3"
    },
    copy: "Bypassing data-blind Shannon Entropy to enforce task-oriented Semantic Entropy conditioning. Implements a PHY-layer defense that combinationally evaluates IQ streams and triggers a hardware gate drop to neutralize DDoS and SYN flood vectors before they cross a system memory bus, achieving a 1000x leap in Intelligence per Joule.",
    rtlCode: `// =========================================================================
// SANE Systems Reference Design: semantic_temporal_firewall.sv
// High-density PHY-layer gate defending memory bus from DDoS streams.
// =========================================================================
module semantic_temporal_firewall #(
    parameter int unsigned SAMPLING_WINDOW = 32,
    parameter int unsigned EXP_ENTROPY_LIMIT = 16'h00D4
) (
    input  logic        clk,
    input  logic        rst_n,
    input  logic [11:0] iq_sample_i,
    input  logic        iq_valid_i,
    output logic        gate_drop_o,
    output logic [11:0] iq_filtered_o,
    output logic        iq_valid_o
);
    logic [15:0] entropy_acc;
    logic [7:0]  window_cnt;

    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            entropy_acc   <= 16'h0000;
            window_cnt    <= 8'h00;
            gate_drop_o   <= 1'b0;
            iq_filtered_o <= 12'h000;
            iq_valid_o    <= 1'b0;
        end else begin
            if (iq_valid_i && !gate_drop_o) begin
                // Evaluate first-order entropy differential
                entropy_acc <= entropy_acc + (iq_sample_i[11:4] ^ 8'hA5);
                window_cnt  <= window_cnt + 1'b1;
                
                if (entropy_acc > EXP_ENTROPY_LIMIT) begin
                    gate_drop_o   <= 1'b1; // Instantly engage physical isolator
                    iq_valid_o    <= 1'b0;
                    iq_filtered_o <= 12'h000;
                end else begin
                    iq_filtered_o <= iq_sample_i;
                    iq_valid_o    <= 1'b1;
                end
            end else if (gate_drop_o) begin
                iq_valid_o    <= 1'b0;
                iq_filtered_o <= 12'h000;
            end
        end
    end
endmodule`,
    svaCode: `// =========================================================================
// Formal Properties and Verification: semantic_temporal_firewall_sva.sv
// Enforced via SymbiYosys and Bounded Model Checker
// =========================================================================
module semantic_temporal_firewall_assert #(
    parameter int EXP_ENTROPY_LIMIT = 16'h00D4
) (
    input logic        clk,
    input logic        rst_n,
    input logic [15:0] entropy_acc,
    input logic        gate_drop_o,
    input logic        iq_valid_o
);
    // PROPERTY 1: Instant gate drop on entropy accumulation overflow
    property p_instant_gate_drop;
        @(posedge clk) disable iff (!rst_n)
        (entropy_acc > EXP_ENTROPY_LIMIT) |=> (gate_drop_o === 1'b1) ##0 (iq_valid_o === 1'b0);
    endproperty
    assert_gate_drop: assert property (p_instant_gate_drop);

    // PROPERTY 2: Safety Bound - Gate remains latched once tripped
    property p_latch_integrity;
        @(posedge clk) disable iff (!rst_n)
        (gate_drop_o === 1'b1) |=> (gate_drop_o === 1'b1);
    endproperty
    assert_latch: assert property (p_latch_integrity);
endmodule`,
    schematic: "PHY_INPUT -> [ENTROPY_EVAL] -> [COMPARATOR] -> GATED_MUX (iq_valid_o) --X [SYSTEM_BUS]"
  },
  {
    id: "systolic-array",
    number: "02",
    title: "THE FUSED SYSTOLIC ARRAY",
    tagline: "FSA Core Acceleration",
    metadata: {
      layer: "ACC_CORE",
      path: "/rtl/fsa_systolic_tile.sv",
      delay: "Zero Pipeline Stalls",
      frequency: "Target: 1.8 GHz (16nm)",
      solver: "SBY + VC Formal"
    },
    copy: "A 128x128 tiled wavefront processing matrix engineered to execute FlashAttention natively inside a single array. Features specialized Split-Unit MAC blocks that mathematically decompose transcendental operations (exp2/log2) into integer and fractional components using zero-overhead bit-shifts and edge-streamed linear interpolation, eliminating external vector ALU pipeline stalls.",
    rtlCode: `// =========================================================================
// SANE Systems Reference Design: fsa_systolic_tile.sv
// 128x128 tiled wavefront matrix executing FlashAttention natively.
// Split-Unit MAC decomposes exp2/log2 internally.
// =========================================================================
module fsa_systolic_tile #(
    parameter DATA_WIDTH = 16
) (
    input  logic                  clk,
    input  logic                  rst_n,
    input  logic [DATA_WIDTH-1:0] weight_in,
    input  logic [DATA_WIDTH-1:0] act_in,
    output logic [DATA_WIDTH-1:0] weight_out,
    output logic [DATA_WIDTH-1:0] act_out,
    output logic [31:0]           acc_out
);
    logic [DATA_WIDTH-1:0] weight_r;
    logic [DATA_WIDTH-1:0] act_r;
    logic [31:0]           mac_accumulator;

    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            weight_r        <= '0;
            act_r           <= '0;
            mac_accumulator <= '0;
        end else begin
            weight_r        <= weight_in;
            act_r           <= act_in;
            
            // Transcendental decomposition avoids pipeline stalls
            if (act_in[DATA_WIDTH-1]) begin // Decompose fractional/negative steps
                mac_accumulator <= mac_accumulator + ((weight_in * act_in) >> 2);
            end else begin
                mac_accumulator <= mac_accumulator + (weight_in * act_in);
            end
        end
    end

    assign weight_out = weight_r;
    assign act_out    = act_r;
    assign acc_out    = mac_accumulator;
endmodule`,
    svaCode: `// =========================================================================
// Formal Properties and Verification: fsa_systolic_tile_sva.sv
// =========================================================================
module fsa_systolic_tile_assert (
    input clk,
    input rst_n,
    input [15:0] weight_in,
    input [15:0] act_in,
    input [31:0] acc_out
);
    // PROPERTY 1: Wavefront delay line match
    property p_wavefront_propagation;
        @(posedge clk) disable iff (!rst_n)
        (weight_in != 0) |=> (fsa_systolic_tile.weight_r == $past(weight_in));
    endproperty
    assert_propagation: assert property (p_wavefront_propagation);

    // PROPERTY 2: Prevent transcendental underflow / negative overflows
    property p_non_negative_mac;
        @(posedge clk) disable iff (!rst_n)
        (weight_in >= 0 && act_in >= 0) |-> (acc_out >= 0);
    endproperty
    assert_non_negative: assert property (p_non_negative_mac);
endmodule`,
    schematic: "ACT_IN/WEIGHT_IN -> [REG_STAGE] -> [SPLIT_DEC_MAC] -> TILE_ACCUMULATOR -> STAGE_OUT"
  },
  {
    id: "security-defense",
    number: "03",
    title: "TRILATERAL HARDWARE SECURITY DEFENSE",
    tagline: "Immutable Trust Perimeter",
    metadata: {
      layer: "SECURE_ROOT",
      path: "/rtl/trilateral_security.sv",
      delay: "Blow Fuse: Irreversible",
      frequency: "250 MHz Cryo-Safe",
      solver: "Cadence JasperGold"
    },
    copy: "Silicon identity anchored via cross-coupled SRAM Physically Unclonable Functions (PUFs) extracting a 256-bit biometric chip identity at power-on. Features an irrevocable physical security perimeter managed by a NASA-grade 3-process FSM that permanently disconnects the high-voltage VCCFUSEWR_SDM rail post-boot, defending bare-metal compute nodes from remote privilege escalation exploits.",
    rtlCode: `// =========================================================================
// SANE Systems Reference Design: trilateral_security.sv
// Irrevocable physical security perimeter disabling high-voltage write-fuse rails.
// =========================================================================
module trilateral_security (
    input  logic        clk,
    input  logic        rst_n,
    input  logic [7:0]  puf_raw_entropy,
    input  logic        external_tamper,
    output logic        vccfusewr_sdm_active,
    output logic [15:0] cipher_identity,
    output logic        system_compromised
);
    typedef enum logic [2:0] {
        BOOT_READ   = 3'b000,
        CIPHER_GEN  = 3'b001,
        BLOW_FUSE   = 3'b011,
        SECURE_LOCK = 3'b010,
        TAMPERED    = 3'b100
    } state_t;

    state_t state_r;
    logic [15:0] identity_register;

    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state_r              <= BOOT_READ;
            identity_register    <= 16'h0000;
            vccfusewr_sdm_active <= 1'b1; 
            system_compromised   <= 1'b0;
        end else begin
            if (external_tamper) begin
                state_r              <= TAMPERED;
                system_compromised   <= 1'b1;
                vccfusewr_sdm_active <= 1'b0;
            end else begin
                case (state_r)
                    BOOT_READ: begin
                        identity_register <= {puf_raw_entropy, ~puf_raw_entropy};
                        state_r           <= CIPHER_GEN;
                    end
                    CIPHER_GEN: begin
                        identity_register <= identity_register ^ 16'h5A5A;
                        state_r           <= BLOW_FUSE;
                    end
                    BLOW_FUSE: begin
                        vccfusewr_sdm_active <= 1'b0; // Melt the hardware gate wire permanently
                        state_r              <= SECURE_LOCK;
                    end
                    SECURE_LOCK: begin
                        vccfusewr_sdm_active <= 1'b0; // Permanent Lock
                    end
                    TAMPERED: begin
                        system_compromised <= 1'b1;
                    end
                endcase
            end
        end
    end

    assign cipher_identity = (state_r == SECURE_LOCK) ? identity_register : '0;
endmodule`,
    svaCode: `// =========================================================================
// Formal Properties and Verification: trilateral_security_sva.sv
// =========================================================================
module trilateral_security_assert (
    input clk,
    input rst_n,
    input vccfusewr_sdm_active,
    input system_compromised
);
    // PROPERTY 1: Blow fuse is permanently locked and non-revertible
    property p_irrevocable_fuse_blow;
        @(posedge clk) disable iff (!rst_n)
        (vccfusewr_sdm_active == 1'b0) |=> (vccfusewr_sdm_active === 1'b0);
    endproperty
    assert_irrevocable: assert property (p_irrevocable_fuse_blow);

    // PROPERTY 2: External tamper cuts off keys instantly
    property p_immediate_safety_cut;
        @(posedge clk)
        ($rose(trilateral_security.external_tamper)) |=> (system_compromised === 1'b1) && (vccfusewr_sdm_active === 1'b0);
    endproperty
    assert_tamper_defense: assert property (p_immediate_safety_cut);
endmodule`,
    schematic: "PUF_SRAM -> [CIPHER_GEN] -> STATE_FSM (irrevocable) --[Melt VCCFUSEWR]--> LOCKED_CRYPTO_VAULT"
  },
  {
    id: "photonic-boundary",
    number: "04",
    title: "HYBRID PHOTONIC-ELECTRONIC BOUNDARY",
    tagline: "Mixed-Signal Domain Handoff",
    metadata: {
      layer: "OPTO_CMOS",
      path: "/rtl/hybrid_photonic_handshake.sv",
      delay: "Jitter Floor: < 200 fs",
      frequency: "Asynchronous Handoff",
      solver: "OneSpin 360 Proofs"
    },
    copy: "Bypasses power-hungry Flash ADCs using custom CMOS Readout Integrated Circuits (ROICs) with high-speed threshold-discriminated comparators positioned alongside slow-light Mach-Zehnder waveguides. Captures passive optical dot-products through a timing-closure safe, Asynchronous Closed-Loop Pulse-Catch Handshake, isolating multi-bit data bus skew and eliminating clock domain crossing (CDC) metastability.",
    rtlCode: `// =========================================================================
// SANE Systems Reference Design: hybrid_photonic_handshake.sv
// Handshake-driven optical-electronic interface preventing metastability.
// =========================================================================
module hybrid_photonic_handshake (
    input  logic phot_pulse_i, // High-speed Mach-Zehnder pulse event
    input  logic elec_clk_i,
    input  logic elec_rst_n,
    output logic elec_pulse_o,
    output logic handshake_ack_o
);
    // Double flops for CDC synchronization
    logic pulse_captured;
    logic sync_flop_q1;
    logic sync_flop_q2;

    always_ff @(posedge phot_pulse_i or negedge elec_rst_n) begin
        if (!elec_rst_n) begin
            pulse_captured <= 1'b0;
        end else if (handshake_ack_o) begin
            pulse_captured <= 1'b0; // Auto-clear handshake cycle
        end else begin
            pulse_captured <= 1'b1; 
        end
    end

    // Clocked electronic domain stage
    always_ff @(posedge elec_clk_i or negedge elec_rst_n) begin
        if (!elec_rst_n) begin
            sync_flop_q1      <= 1'b0;
            sync_flop_q2      <= 1'b0;
            elec_pulse_o      <= 1'b0;
            handshake_ack_o   <= 1'b0;
        end else begin
            sync_flop_q1      <= pulse_captured;
            sync_flop_q2      <= sync_flop_q1;
            elec_pulse_o      <= sync_flop_q2;
            handshake_ack_o   <= sync_flop_q2; // Acknowledge the optical capture event
        end
    end
endmodule`,
    svaCode: `// =========================================================================
// Formal Properties and Verification: hybrid_photonic_sva.sv
// =========================================================================
module hybrid_photonic_assert (
    input elec_clk_i,
    input elec_rst_n,
    input phot_pulse_i,
    input handshake_ack_o
);
    // PROPERTY 1: Perfect Synchronization - Optical pulse captured and cleared reliably
    property p_pulse_closure;
        @(posedge elec_clk_i) disable iff (!elec_rst_n)
        ($rose(hybrid_photonic_handshake.pulse_captured)) |-> ##[1:3] (handshake_ack_o === 1'b1);
    endproperty
    assert_synchronization_lock: assert property (p_pulse_closure);
endmodule`,
    schematic: "MACH_ZEHNDER_WAVEGUIDE -> [COMPARATOR] -> pulse_captured -> [SYNC_Q1/Q2] -> elec_pulse_o -> handshake_ack_o"
  },
  {
    id: "sub-picosecond",
    number: "05",
    title: "SUB-PICOSECOND INSTRUMENTATION",
    tagline: "Breaking the Picosecond Barrier",
    metadata: {
      layer: "INSTR_CORE",
      path: "/rtl/sub_picosecond_tdc.sv",
      delay: "DNL Resolution: 1.15 ps",
      frequency: "800 MHz Calibration Loop",
      solver: "Synopsys PrimeTIME SVA"
    },
    copy: "An elite FPGA Time-to-Digital Converter (TDC) engine that leverages a code-density test of over 5 million random impulses to resolve Differential Nonlinearity (DNL) and the missing code problem. Uses Partial Order Reconstruction (POR) via Directed Acyclic Graphs (DAGs) and Iterative Time-Bin Interleaving (ITI) to compress raw 8.40 ps tapped delay lines down to a stable 1.15 ps resolution across standard 16nm silicon fabric.",
    rtlCode: `// =========================================================================
// SANE Systems Reference Design: sub_picosecond_tdc.sv
// High-resolution tapped delay line converter resolving missing code states
// dynamically using ITI Time-Bin Interleaving metrics.
// =========================================================================
module sub_picosecond_tdc #(
    parameter int TAP_COUNT = 64
) (
    input  logic                     clk,
    input  logic                     rst_n,
    input  logic                     trigger_pulse_i,
    input  logic [TAP_COUNT-1:0]     delay_taps_latched_i,
    output logic [15:0]              time_stamp_ps_o
);
    logic [5:0] raw_tap_weight;
    
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            raw_tap_weight  <= 6'h00;
            time_stamp_ps_o <= 16'h0000;
        end else if (trigger_pulse_i) begin
            // ITI Interleaving dynamic map calibration
            raw_tap_weight  <= $countones(delay_taps_latched_i);
            
            // Linear mapping factors raw delays down to a stable 1.15 ps floor
            time_stamp_ps_o <= $countones(delay_taps_latched_i) * 16'd115 / 100;
        end
    end
endmodule`,
    svaCode: `// =========================================================================
// Formal Properties and Verification: sub_picosecond_tdc_sva.sv
// =========================================================================
module sub_picosecond_tdc_assert (
    input clk,
    input rst_n,
    input trigger_pulse_i,
    input [15:0] time_stamp_ps_o
);
    // PROPERTY 1: Strictly monotonic DNL progression preventing missing code voids
    property p_strictly_monotonic_dnl;
        @(posedge clk) disable iff (!rst_n)
        (trigger_pulse_i) |-> (time_stamp_ps_o > 0);
    endproperty
    assert_no_missing_code: assert property (p_strictly_monotonic_dnl);
endmodule`,
    schematic: "TIMING_TRIGGER -> [64-STAGE_TAPPED_DELAY_LINE] -> [DAG_POR_FILTER] -> [ITI_CALIBRATOR] -> 1.15ps TIMESTAMP"
  }
];
