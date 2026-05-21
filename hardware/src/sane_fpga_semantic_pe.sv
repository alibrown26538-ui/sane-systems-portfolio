// =========================================================================
// SANE-JARVIS FPGA Prototype: Semantic Filtering Processing Element (PE)
// Objective: Sub-nanosecond deterministic execution of piecewise exponentials
// Optimization: Strict I/O Registering for DSP48E2 Inference & Timing Closure
// Compliance: Post-Quantum Classical-Quantum Control Plane Isolation
// =========================================================================

`timescale 1ns / 1ps

module sane_fpga_semantic_pe #(
    parameter int INT_WIDTH  = 8,
    parameter int FRAC_WIDTH = 16,
    parameter int DATA_WIDTH = INT_WIDTH + FRAC_WIDTH
)(
    input  logic                    clk,
    input  logic                    rst_n,

    // --- The Semantic Firewall Control ---
    input  logic                    semantic_valid, // High if data matches 'True North' context
    input  logic [DATA_WIDTH-1:0]   raw_tensor_in,

    // --- Pre-calculated Interpolation Coefficients (from localized LUT) ---
    input  logic [DATA_WIDTH-1:0]   slope_m,
    input  logic [DATA_WIDTH-1:0]   intercept_b,

    // --- Deterministic Pipeline Output ---
    output logic [DATA_WIDTH-1:0]   activated_out,
    output logic                    data_ready_out
);

    // -------------------------------------------------------------------------
    // STAGE 1: Input Registering & Semantic Filtering (Kill Before Decode)
    // -------------------------------------------------------------------------
    logic [DATA_WIDTH-1:0] reg_tensor;
    logic [DATA_WIDTH-1:0] reg_m, reg_b;
    logic                  reg_valid;

    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            reg_tensor <= '0;
            reg_m      <= '0;
            reg_b      <= '0;
            reg_valid  <= 1'b0;
        end else begin
            // TEMPORAL FIREWALL: If semantic_valid is low, we physically drop the
            // payload by driving zeros into the pipeline, preventing downstream
            // consequence velocity and saving dynamic power.
            reg_tensor <= semantic_valid ? raw_tensor_in : '0;
            reg_m      <= semantic_valid ? slope_m       : '0;
            reg_b      <= semantic_valid ? intercept_b   : '0;
            reg_valid  <= semantic_valid;
        end
    end

    // -------------------------------------------------------------------------
    // STAGE 2: Split-Unit Mathematical Decomposition & DSP MAC
    // -------------------------------------------------------------------------
    logic signed [INT_WIDTH-1:0]  z_int;
    logic [FRAC_WIDTH-1:0]        f_frac;
    logic [DATA_WIDTH-1:0]        mac_result;
    logic                         mac_valid;

    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            z_int      <= '0;
            mac_result <= '0;
            mac_valid  <= 1'b0;
        end else begin
            // Decompose the fixed-point tensor
            z_int  <= reg_tensor[DATA_WIDTH-1 : FRAC_WIDTH];
            f_frac <= reg_tensor[FRAC_WIDTH-1 : 0];

            // Hardened DSP Inference: (m * f) + b
            mac_result <= (reg_m * f_frac) + reg_b;
            mac_valid  <= reg_valid;
        end
    end

    // -------------------------------------------------------------------------
    // STAGE 3: Zero-Latency Bit-Shift & Output Registering
    // -------------------------------------------------------------------------
    always_ff @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            activated_out  <= '0;
            data_ready_out <= 1'b0;
        end else begin
            // Execute 2^z via a dynamic arithmetic left-shift applied to the MAC result
            activated_out  <= mac_valid ? (mac_result <<< z_int) : '0;
            data_ready_out <= mac_valid;
        end
    end

    // =========================================================================
    // Saarthi-Critic Formal Security Proofs (FPV)
    // =========================================================================

    // PROOF 1: The Semantic Kill-Switch Guarantee
    property p_semantic_kill_switch;
        @(posedge clk) disable iff (!rst_n)
        (!semantic_valid) |-> ##3 (activated_out == '0 && data_ready_out == 1'b0);
    endproperty
    assert_kill_switch: assert property (p_semantic_kill_switch)
        else $error("FIREWALL BREACH: Non-compliant semantic data bypassed the filter!");

    // PROOF 2: Hard Real-Time Determinism
    property p_strict_hardware_latency;
        @(posedge clk) disable iff (!rst_n)
        (semantic_valid) |-> ##3 (data_ready_out == 1'b1);
    endproperty
    assert_latency: assert property (p_strict_hardware_latency)
        else $error("LATENCY BREACH: Execution exceeded the 3-cycle deterministic hardware bound.");

endmodule
