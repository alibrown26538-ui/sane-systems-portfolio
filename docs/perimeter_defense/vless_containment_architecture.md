# SANE Reference Architecture: Deterministic Containment of Obfuscated Transport Layers

Document Reference: SANE-ARCH-2026-004
Distribution: Open-Source Public Release Baseline
Target Audience: Systems Architects, Security Operations, Infrastructure Engineers

---

## Executive Summary
Traditional signature-based inspection and dynamic IP blacklisting fail completely against next-generation stealth transport protocols like VLESS paired with XTLS-Reality. By executing client-side browser TLS spoofing (via uTLS) and masquerading as authoritative endpoints (e.g., microsoft.com, apple.com) over port 443, these hostile proxy networks blend seamlessly into standard enterprise HTTPS traffic. 

This reference architecture specifies a multi-layered, deterministic containment framework. It moves enforcement away from fragile software-layer firewalls down to Border Gateway Protocol (BGP) routing constraints, Hardware-Rooted Communication Network Interfaces (CNI), and Cross-Layer Transport Fingerprinting Arrays.

---

## Vector 1: Macro-Level Routing Constraints (Physical Ingress Isolation)
Dynamic IP blocking is mathematically insufficient against ephemeral, automated multi-node proxy rotation. Perimeter defense must pivot to macro-level routing constraints to structurally collapse the underlying transport capability at the line card.

* **Deterministic ASN Fencing via BGP FlowSpec:** Regional threat intelligence translates into instantaneous network routing constraints. Upon identifying a rogue hosting tier or bulletproof Virtual Private Server (VPS) footprint, automated pipelines generate granular BGP FlowSpec drop rules advertised to edge nodes to selectively isolate malicious circuits without blackholing shared public cloud subnets.
* **Remotely Triggered Black Hole (RTBH) & Null0 Adjacency:** For sustained suppression of hostile hosting subnets, internal BGP (iBGP) advertisements are tagged with the global RFC7999 65535:666 BLACKHOLE community string. This updates the edge router's Forwarding Information Base (FIB), gluing the attacker's next-hop IP directly to the Null0 hardware interface. Packets are dropped at strict line-rate directly within the line-card forwarding ASIC, insulating the central route processor from performance degradation.
* **Source-Based Ingress Caging via uRPF:** To block asymmetric or spoofed ingress transport traffic, edge interfaces enforce Unicast Reverse Path Forwarding (uRPF) in loose mode. Because the RTBH advertisement forces the FIB to map the hostile VPS space to Null0, any inbound proxy packet originating from those blocks fails reverse path verification and is dropped at the physical perimeter before initializing a stateful TCP handshake.
* **RPKI-ROV and ASPA Enforcement:** Deploy strict Resource Public Key Infrastructure (RPKI) Route Origin Validation (ROV) and Autonomous System Provider Authorization (ASPA). Cryptographically auditing the entire AS_PATH tree suppresses downstream first-ASN stripping and routing manipulations used by stealth proxies to mask their network ancestry.

---

## Vector 2: CNI-Anchored Identity Boundaries (Zero-Trust Session Control)
To eliminate the risk of compromised or extracted credentials being tunneled through untrusted stealth proxy exit nodes, the identity plane must require strict cryptographic, device-bound perimeter invariants evaluated at the Communication Network Interface (CNI).

* **Cryptographic Endpoint Caging:** Enforce Microsoft Entra ID / Okta Conditional Access (CA) policies that implicitly deny all token issuance requests unless the requesting client provides a valid Mobile Device Management (MDM) certificate and cryptographically proves a Hybrid Domain Joined state. Credentials replayed or tunneled laterally via VLESS links from unmanaged attacker endpoints are automatically blocked at the identity gate.
* **Compliant Network Boundary Enforcement:** Leverage Global Secure Access (GSA) signaling to establish "Compliant Network" constraints. Authentication requests originating outside the rigorously managed corporate network bus or secure egress architecture are dropped at the data plane, mitigating token replay attacks.
* **Token Protection & Session Hardening:** Enforce strict cryptographic Token Protection controls to bind session tokens exclusively to the hardware trusted root (TPM) of the authorized device. This neutralizes "pass-the-cookie" exploits; a stolen bearer token replayed from an unauthenticated adversary box becomes structurally unusable.
* **Pull-Based Continuous Access Evaluation (CAE):** Implements a deterministic, pull-based telemetry bus. The central security engine actively extracts endpoint network telemetry on a fixed schedule. The microsecond an intra-session IP/ASN routing shift or protocol timing anomaly is logged, a real-time signal injection invalidates active access and refresh tokens, returning a 401 claims challenge to sever the circuit.

---

## Vector 3: Cryptographic and Behavioral Anomaly Detection
Because XTLS-Reality encrypts nested handshakes and spoofs reputable Server Name Indications (SNI), standard signature matching is obsolete. Detection requires microarchitectural cross-layer analysis of plaintext metadata and cryptographic implementation flaws.

* **SNI-to-ASN Cross-Layer Validation:** Correlate application-layer Deep Packet Inspection (DPI) handshake logs with Layer-3 BGP routing profiles. If a ClientHello requests an SNI matching a trusted corporate asset (e.g., update.microsoft.com) but the Layer-3 destination IP resolves to an unrelated commercial VPS provider or residential proxy network, flag a critical spatial anomaly to trigger immediate SOAR containment.
* **JA4 Alphabetic Sorting Normalization:** VLESS clients utilize the uTLS library to scramble TLS extensions dynamically, attempting to mimic Chrome's extension randomization. The JA4 fingerprinting standard neutralizes this dynamic entropy by alphabetically sorting the cipher suites and extensions prior to generating a truncated SHA-256 hash, collapsing randomized client mutations into a static, highly analyzable cryptographic signature.
* **Exploitation of Library Flaws (uTLS CVEs):**
    * **Padding Anomalies (CVE-2026-26995):** True modern browsers append a TLS padding extension (ID 21) to ClientHello payloads under 512 bytes. VLESS configurations utilizing outdated non-PQ profiles omit this padding, registering an impossible structural state for the claimed browser.
    * **GREASE ECH Cipher Mismatches (CVE-2026-27017):** Chrome strictly enforces cipher parity across handshakes. VLESS implementations often hardcode an AES preference for the outer handshake but randomly alternate between AES and ChaCha20 for the Encrypted Client Hello (ECH) GREASE extension, exposing a cryptographically impossible profile.
* **Post-Quantum (PQC) Dimensionality Verification:** Genuine modern browsers (Chrome 124+, Firefox 132+) transmit the X25519MLKEM768 hybrid post-quantum key share by default, expanding the ClientHello payload by over 1,088 bytes. If an application-layer User-Agent claims a post-quantum capable browser, but the transport-layer validation confirms the absence of this massive cryptographic payload, the connection is instantly flagged as an outdated uTLS scraper and dropped.
* **Cross-Layer HTTP/2 and System Call Mismatches:**
    * **Protocol Downgrades:** Binding uTLS to standard Go http.Transport engines via DialTLS automatically disables HTTP/2 support. If the JA4 fingerprint mimics Chrome (which mandates HTTP/2 or HTTP/3 via ALPN) but the session executes over HTTP/1.1 or omits SETTINGS frames, trigger a block.
    * **TCP Fragmentation Anomalies:** Go-based VLESS proxies frequently execute a single write() system call for the entire inflated PQC ClientHello sequence, generating unique timing artifacts and deviating from true multi-packet segmentation behaviors used by authentic browsers.
