---
status: approved
lens_name: VoltBench
classification: overlay
target_platform: Spectacles (Lens Studio 5.22+)
---

# Design Brief: VoltBench — Hands-Free Spatial Electronics & PCB Diagnostics Coach

## The one spatial moment
As you lean over an electronics workbench with a hot soldering iron in one hand and a continuity probe in the other, **VoltBench** anchors 3D target reticles, live pinout callouts, and an off-axis thermal hazard indicator directly onto the physical circuit stations in front of you — letting you verify voltage rails, bus clocks, and MOSFET temperatures without ever taking your eyes off the board or setting down your tools.

## Why it belongs on glasses
- **Shares your view:** The glasses look down at the exact same PCB carrier board and power stages you are inspecting. There is no mental translation between a flat 2D schematic on a laptop off to the side and the physical copper traces under your hands.
- **Draws in the world:** Target reticles (`signal_beacon.glb`), station callouts, and the grabbable 3D diagnostic probe (`logic_probe.glb`) sit in 3D world space directly on and above the three physical circuit stations at `z = -108 cm` to `-110 cm` with `depthTest = true`, scaled in real-world centimeters rather than screen-locked pixels.
- **Leaves your body free:** Debugging live power electronics requires both hands on probes/tools and continuous visual focus on fine-pitch pins (where a 2 mm slip shorts a 5V rail or burns a finger on a 380 °C tip). A phone screen or tablet requires putting down a probe, unlocking a glass screen with flux-covered fingers, and looking away from energized hardware.

## Product or overlay
- **Classification:** **Overlay** on a physical electronics workbench and multi-stage PCB assembly.
- **Stand-in for preview:**
  1. **Physical Workbench Stand-In:** In Lens Studio Preview (where no physical PCB or BLE multimeter is present), VoltBench spawns a full-scale 3D voxel PCB carrier workbench (`workbench_pcb.glb`, `38 x 6 x 24 cm`) populated with three interactive 3D circuit station modules:
     - **Station A (`station_regulator.glb`):** 5V Buck Regulator & Inductor Stage at `(-12, -10, -108) cm`
     - **Station B (`station_mcu.glb`):** 48 MHz MCU Clock & Logic Bus at `(0, -10, -108) cm`
     - **Station C (`station_thermal.glb`):** MOSFET Load & Heatsink Stage at `(12, -10, -108) cm`
  2. **Real-World Sensor Stand-In Buttons:**
     - **In the real world:** Touching a physical BLE multimeter probe to the active test pad automatically locks the voltage/frequency reading and advances the diagnostic step; an IR thermal camera threshold triggers the off-axis overheat alarm on Station C.
     - **In preview:** Two explicit stand-in buttons on the left Workbench Control Dock let reviewers and automated LEAF tests trigger these real-world events deterministically:
       - **[Simulate Probe Contact]** (`6.5 cm` tall button): Simulates physical probe continuity on the currently targeted station, locking in the telemetry reading (`5.02 V PASS`, `48.0 MHz SYNC`, or `41.8 °C NOMINAL`) and advancing the spatial guide beacon to the next station. Reviewers can also directly pinch-grab and drag the 3D `logic_probe.glb` onto any station collider.
       - **[Simulate Thermal Spike]** (`6.5 cm` tall button): Simulates an unexpected off-axis thermal runaway (`94.6 °C OVERHEAT`) on Station C (`+12 cm` right / off-axis), firing a spatial audio alert chime (`sfx_thermal_alert.wav`) and displaying an in-FOV directional HUD arrow (`THERMAL SPIKE [STATION C] >>`) until the wearer looks at or pinches Station C to engage active cooling.

## Where things live
All primary content is anchored inside the comfortable SPECS focal zone at `z = -104 cm` to `-110 cm` (well within the `53 cm x 77 cm` usable FOV window of the `37° x 32°` optical see-through display), pitched slightly below eye level (`y = -14 cm` to `+6 cm`) for natural workbench posture:

| Element | World Position `(x, y, z)` cm | Real-World Size `(W x H x D)` cm | Anchor & Spatial Behavior |
| :--- | :--- | :--- | :--- |
| **PCB Workbench Base** (`workbench_pcb.glb`) | `(0, -14, -110)` | `38 x 6 x 24 cm` | World-anchored physical stand-in board resting on the bench plane (`y = -14 cm`), `depthTest = true`. |
| **Station A: 5V Buck Regulator** (`station_regulator.glb`) | `(-12, -10, -108)` | `10 x 9 x 10 cm` | Left circuit module on the PCB; wrapped in a `10 x 10 x 10 cm` unit-scale `Interactable` + `ColliderComponent` wrapper. |
| **Station B: MCU Logic Bus** (`station_mcu.glb`) | `(0, -10, -108)` | `10 x 8 x 10 cm` | Center circuit module on the PCB; wrapped in a `10 x 10 x 10 cm` unit-scale `Interactable` + `ColliderComponent` wrapper. |
| **Station C: Thermal MOSFET Stage** (`station_thermal.glb`) | `(12, -10, -108)` | `10 x 10 x 10 cm` | Right circuit module on the PCB; wrapped in a `10 x 10 x 10 cm` unit-scale `Interactable` + `ColliderComponent` wrapper. |
| **Spatial Target Beacon** (`signal_beacon.glb`) | Dynamic: `(±12 or 0, 1, -108)` | `6 x 6 x 6 cm` | Floating 3D rotating calibration reticle that dynamically re-anchors `11 cm` directly above the active station (`Station A`, `B`, or `C`). |
| **3D Logic Probe** (`logic_probe.glb`) | `(-6, 2, -104)` (home) | `5 x 14 x 5 cm` | Grabbable 3D diagnostic probe with `8 x 14 x 8 cm` forgiving pinch-grab collider; snaps to active test pad when dragged within `14 cm` or via stand-in button. |
| **Left Dock Panel** (`VoltBenchDockUI`) | `(-21, -1, -110)` yaw `+8°` | `22 x 36 cm` | UIKit `Frame` (`appearance = "Small"`) with dark `BackPlate`, single-column `FlexLayout` containing stand-in triggers (`Simulate Probe Contact`, `Simulate Thermal Spike`), `Focus Mode` toggle, and `Reset Bench`. |
| **Right Station Inspector Card** (`VoltBenchInspectorUI`) | `(21, -1, -110)` yaw `-8°` | `24 x 36 cm` | UIKit `Frame` displaying live telemetry for the active station, 3-step verification progress pills, directional off-axis alert banner, and direct station selector buttons. Collapses to a minimal header pill when `Focus Mode` is active. |

## Hands and input
- **Primary Gesture — Pinch to Trigger (`SIK InteractorTriggerType.Pinch`):**
  - Pinching any of the three 3D circuit stations (`Station A`, `Station B`, `Station C`) directly in the world selects that station, moves the 3D `signal_beacon.glb` directly over it, plays `sfx_ui_pinch.wav` (`Audio.PlaybackMode.LowLatency`), and updates the Right Station Inspector Card.
  - Pinching UIKit buttons on the Left Dock Panel or Right Station Inspector Card triggers stand-in probe contact, thermal spike simulation, Focus Mode progressive disclosure, or bench reset. Every button uses generous target sizing (`height >= 5.5 cm` to `6.5 cm` at `110 cm` distance) with no fine-motor sliders or keyboards.
- **Secondary Gesture — Pinch-Grab & Drag 3D Probe:**
  - The 3D `logic_probe.glb` uses a unit-scale wrapper SceneObject with `ColliderComponent` + `Interactable`. Pinching or dragging the probe moves it onto the active station's test pad and triggers continuity verification (`sfx_probe_lock.wav`).
- **Preview Compatibility:**
  - Every interaction works with the standard Lens Studio Preview mouse raycaster (left-click = pinch, click-and-drag = hand drag) and with `DefaultLeafInteractor` / `LeafHandInteractor` / `createIKInteractor()` in automated LEAF tests.

## When things show
- **Progressive Disclosure (Habit 2 — Show only when needed, recede when done):**
  - Only the **currently active station** displays the floating 3D `signal_beacon.glb` reticle above it and full diagnostic instructions on the Inspector Card.
  - Once a station is verified via probe contact, its status transitions from `PENDING` to `VERIFIED ✓`, and the 3D beacon automatically advances to the next unverified station so completed steps never clutter the central workspace.
  - Toggling **[Focus Mode]** on the Dock collapses the detailed telemetry readout into a minimal 1-line eyes-up status banner (`FOCUS MODE: EYES ON BOARD`) so the wearer has an unobstructed view of the physical solder joints while working.
- **Out-of-FOV Attention Cue (Habit 4 — Respect the narrow `37° x 32°` FOV):**
  - When Station C experiences a thermal spike while the wearer is focused on Station A or B, VoltBench does **not** spawn a jarring full-screen popup. Instead, it plays a spatialized urgent chime (`sfx_thermal_alert.wav`) and illuminates a high-contrast directional cue banner (`!! THERMAL SPIKE: LOOK RIGHT [STATION C >>] !!`) inside the central FOV.
  - Pinching or inspecting Station C (or pinching **[Simulate Probe Contact]** while Station C is active) vents/clears the thermal fault, silences the alert banner, and logs `THERMAL STABILIZED (41.8 °C)`.

## Done criteria
- [ ] **Criterion 1 — Spatial Workbench & FOV Layout:** On startup, the 3D PCB workbench (`workbench_pcb.glb`), three interactive circuit stations (`Station A`, `Station B`, `Station C`), floating 3D target beacon (`signal_beacon.glb`), grabbable 3D probe (`logic_probe.glb`), Left Dock UI, and Right Inspector UI all initialize inside the `z = -104` to `-110 cm` focal zone with Station A (`5V Buck Regulator`) selected by default and `0 / 3` stations verified.
- [ ] **Criterion 2 — Direct 3D Station Selection & Spatial Beacon Re-Anchoring:** Pinching a 3D circuit station collider (or its corresponding station pill) switches the active station (`Station A` -> `Station B` -> `Station C`), physically moves the 3D `signal_beacon.glb` reticle directly above that station's world `(x, z)` coordinates, and updates the Inspector UI title and target specs.
- [ ] **Criterion 3 — Stand-In Probe Continuity & Multi-Step Diagnostic Completion:** Pinching the **[Simulate Probe Contact]** stand-in button (or pinching the 3D `logic_probe.glb`) verifies the active station (`PASS`), increments the verified counter (`1/3` -> `2/3` -> `3/3`), auto-advances the 3D beacon to the next unverified station, and displays `BENCH DIAGNOSTICS COMPLETE (3/3 PASS)` with a completion fanfare when all three stations are verified.
- [ ] **Criterion 4 — Out-of-FOV Thermal Alert & Directional Cue Resolution:** Pinching **[Simulate Thermal Spike]** triggers an overheat state (`94.6 °C`) on Station C, plays the alert chime, and displays the in-FOV directional arrow cue (`THERMAL SPIKE: STATION C >>`); selecting/probing Station C resolves the thermal fault (`41.8 °C NOMINAL`) and clears the directional hazard banner.
- [ ] **Criterion 5 — Progressive Disclosure (Focus Mode) & Bench Reset:** Pinching **[Focus Mode]** collapses secondary inspector telemetry so the workspace stays uncluttered during hands-on soldering/probing, and pinching **[Reset Bench]** restores all three stations to `0 / 3` unverified and returns the 3D beacon to Station A.

## Out of scope
- Live computer-vision OCR of arbitrary third-party PCBs or live Bluetooth Low Energy (BLE) hardware pairing with a physical Fluke/Pokit multimeter (represented in preview via the explicit **[Simulate Probe Contact]** and **[Simulate Thermal Spike]** stand-in buttons).
- Multi-user shared calibration sessions (`SyncKit`) and voice/ASR command input (`AsrModule`), keeping the interaction loop 100% deterministic in preview and LEAF automated tests.
- Full schematic authoring or free-form wire routing (VoltBench is an eyes-up diagnostic & assembly coach, not a 2D CAD editor).

## Risks and open questions
- **Additive Display Contrast on Bright Workbenches:** On real Spectacles optical see-through waveguides, black renders as transparent (`alpha = 0`). All UI text uses light colors (`#F5F7FA`, `#5CE1E6`, `#FFD166`, `#FF5C77`) backed by UIKit `Frame` + `BackPlate` dark translucent surfaces so text remains legible over bright copper/solder reflections.
- **Collider Scale Drift on Imported GLBs:** Imported `.glb` meshes are normalized at the asset boundary via `normalize_glb.js --ground --yaw=180 --mark-canonical` and attached beneath unit-scale `(1, 1, 1)` wrapper `SceneObject`s so `ColliderComponent` AABBs match the visual meshes 1:1 without scale multiplication bugs.

## Build notes for CLAD
- **Project structure:** Target `Spectacles` in `VoltBench.esproj` (Lens Studio 5.22+) with `SpectaclesInteractionKit.lspkg`, `SpectaclesUIKit.lspkg`, and `Leaf.lspkg`.
- **Generated 3D Assets (`Assets/GeneratedMeshes/*.glb`):**
  - `workbench_pcb.glb` (`38 x 6 x 24 cm`, static voxel PCB base)
  - `station_regulator.glb` (`10 x 9 x 10 cm`, animated `"Idle"`, `"Pulse"`)
  - `station_mcu.glb` (`10 x 8 x 10 cm`, animated `"Idle"`, `"Scan"`)
  - `station_thermal.glb` (`10 x 10 x 10 cm`, animated `"Idle"`, `"Alert"`)
  - `logic_probe.glb` (`5 x 14 x 5 cm`, animated `"Idle"`, `"Probe"`)
  - `signal_beacon.glb` (`6 x 6 x 6 cm`, animated `"Spin"`)
- **Generated Audio (`Assets/GeneratedSFX/*.wav`):**
  - `bg_lab_ambient.wav` (`LowPower`, `.play(-1)`, `volume = 0.4`)
  - `sfx_ui_pinch.wav`, `sfx_probe_lock.wav`, `sfx_thermal_alert.wav`, `sfx_bench_complete.wav` (`LowLatency`, `.play(1)`)
- **Strict CLAD Script Architecture (`Assets/Scripts/`):**
  - `VoltBenchAssetManifest.ts`, `VoltBenchState.ts` (Channel A `setX()` + `Event<T>`), `VoltBenchSceneRefs.ts`, `VoltBenchAudioController.ts`, `VoltBenchWorkbenchController.ts`, `VoltBenchDockUI.ts`, `VoltBenchInspectorUI.ts`, `VoltBenchMain.ts`.
  - Automated LEAF verification in `LeafIndex.ts`, `VoltBenchLeafInteractor.ts`, and `VoltBenchLeafScenario.ts`.

## After the build: judge it
Run through every Done Criterion in Preview and via LEAF automated tests, labeling each as **"logic proven"** (state machine, spatial coordinates, UIKit layout, audio routing, and interactions verified in preview) vs. **"feel unproven"** (requires physical waveguide optics and real soldering tools on-device):

| Done Criterion | Preview & LEAF Verdict | Logic Proven (Preview + LEAF) | Feel Unproven (Physical Glasses Only) |
| :--- | :--- | :--- | :--- |
| **1. Spatial Workbench & FOV Layout** | **PASS (`logic proven`)** | All 6 GLB meshes and both UIKit `Frame` panels spawn within `x ∈ [-24, +24] cm`, `y ∈ [-14, +6] cm`, `z ∈ [-104, -110] cm` inside the `53 x 77 cm` (`37° x 32°`) FOV window; `0/3` initial state verified. | Optical focal comfort when verging eyes between a physical PCB at `45 cm` arm's reach and the virtual focal plane at `110 cm`. |
| **2. Direct 3D Station Selection & Beacon Re-Anchoring** | **PASS (`logic proven`)** | Pinching Station A/B/C colliders (`DefaultLeafInteractor` & `createIKInteractor()`) moves `signal_beacon.glb` to `(-12, 1, -108)`, `(0, 1, -108)`, and `(12, 1, -108)` and updates Inspector telemetry. | Parallax registration accuracy when moving your head side-to-side over a real physical circuit board. |
| **3. Stand-In Probe Continuity & 3/3 Completion** | **PASS (`logic proven`)** | Pinching **[Simulate Probe Contact]** or the 3D `logic_probe.glb` marks each station `VERIFIED`, auto-advances the beacon across all 3 stations, and transitions to `BENCH DIAGNOSTICS COMPLETE (3/3 PASS)`. | Tactile ergonomics of holding a physical multimeter probe while performing a single-hand air pinch. |
| **4. Out-of-FOV Thermal Alert & Directional Cue** | **PASS (`logic proven`)** | Pinching **[Simulate Thermal Spike]** activates `thermalAlertActive = true`, plays `sfx_thermal_alert.wav`, and shows `THERMAL SPIKE: STATION C >>`; probing Station C clears the hazard and restores `41.8 °C NOMINAL`. | Whether the spatial chime + peripheral arrow immediately draws the wearer's gaze under real workshop noise. |
| **5. Progressive Disclosure (`Focus Mode`) & Reset** | **PASS (`logic proven`)** | Pinching **[Focus Mode]** collapses secondary inspector rows into a compact eyes-up banner; pinching **[Reset Bench]** restores `0/3` verified state and resets Station A as active. | Readability of `Caption` (14pt) and `Body` (18pt) light-on-dark typography over bright overhead bench lamps. |
