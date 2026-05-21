<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/08202474-0269-4462-ba28-fda0176899b9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

## 🔐 Post-Quantum Security & Active Immunological Architecture

### 1. Quantum Decryption Shield (Anti-Shor Mitigation)
The SANE Architecture mitigates the threat of "Q Day" by shifting the cryptographic foundation completely away from vulnerable public-key math (RSA/ECC) susceptible to Shor's algorithm, anchoring security directly into hardware physics:
* **Silicon Biometrics (SRAM PUFs):** Root-of-Trust (RoT) keys are derived locally via SRAM Physically Unclonable Functions inside the Secure Device Manager (SDM). Keys are generated dynamically based on atomic-level manufacturing variances, bypassing network key-exchange interception risks entirely.
* **Inline Symmetric Hardening:** Multi-chiplet interconnect data (CXL, PCIe Gen6/7) is secured via line-rate MACsec (IEEE 802.1AE) using hardened AES-256 blocks, maintaining computational safety bounds even under Grover-class algorithmic acceleration.
* **Sidecar Cryptographic Agility:** Employs sidecar FPGAs at the O-RAN Distributed Unit (O-DU) boundaries to support clean, over-the-air gate reconfiguration for emerging NIST Post-Quantum Cryptography (PQC) standards without requiring ASIC replacement cycles.

### 2. The Inverse Riddle-Shor Protocol (Active Threat Emulation)
To transition from static sandboxing to probabilistic resilience, the framework implements an automated, continuous immune response layer:
* **Continuous Quantum Probing:** Simulates Shor's algorithm workloads against internal data corridors to model an active "time-to-decay" metric, proactively forcing key rotations and primitive modifications before an external exploit can settle.
* **Speculative Red Teaming:** Active microarchitectural fuzzing triggers sandboxed Spectre-style (Variant 1/2) conditional branch mispredictions to formally verify that Branch Target Buffer (BTB) isolation barriers and speculation serialization primitives (`lfence`) hold firmly under execution pressure.
* **Layer-1 Waveform Containment:** Continuous delay-injection and jamming emulation confirms the absolute isolation profile of Layer-1 Syntonization. Telemetry transmitted outside strict Time-Triggered Architecture (TTA) clock bins is instantly grounded at the physical radio edge.
