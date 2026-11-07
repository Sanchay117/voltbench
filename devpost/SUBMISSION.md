# Devpost Submission Guide — VoltBench AR ("Learn AR with SPECS")

Use the sections below to fill out the Devpost submission form on **[https://learn-specs.devpost.com/](https://learn-specs.devpost.com/)**.

---

## Project Name
**VoltBench AR — Hands-Free Spatial PCB & Electronics Diagnostics Coach**

## Elevator Pitch (Tagline)
An eyes-up, hands-free AR electronics workbench coach for Snap Spectacles that anchors 3D pinout reticles, live probe telemetry, and off-axis thermal hazard cues directly onto physical circuit boards (`z = -110 cm`).

## Demo Video & Preview Assets
- **Ready-to-upload MP4 Demo Video (< 3 min):** `devpost/voltbench-demo.mp4`
- **High-Res 1080p Storyboard Screenshots:** `devpost/screenshots/01_workbench_overview.png` through `05_leaf_test_suite_5_of_5_pass.png`
- **Approved Design Brief:** `devpost/design-brief.md`
- **Interactive Web Preview Simulator:** `preview-simulator/index.html`

---

## Full Devpost Description (Copy & Paste)

### Inspiration
Anyone who has ever debugged a live power supply or multi-stage PCB knows the frustration—and physical hazard—of "schematic whiplash." One hand is holding a 380 °C soldering iron or hot-air rework wand, the other hand is holding a fine-pitch multimeter probe on a 0.5 mm IC pin, and your schematic is trapped on a laptop or phone screen off to the side. Glancing away for even half a second causes your probe tip to slip and short adjacent pins.

We asked: *What if your glasses shared your exact view of the workbench, drew the target test pad and expected rail tolerances directly on the physical circuit stage in front of you, and warned you with a spatial audio chime + directional arrow before an off-axis MOSFET stage overheated?*

### What it does
**VoltBench AR** is a focused, single-moment spatial electronics diagnostics coach built for **Snap Spectacles (Lens Studio 5.22+)**:
1. **3D World-Anchored Circuit Stations & Target Reticle:** Anchors three interactive 3D circuit modules (`Station A: 5V Buck Regulator` at `-12 cm`, `Station B: 48 MHz MCU Logic Bus` at `0 cm`, and `Station C: MOSFET Load & Heatsink` at `+12 cm`) onto a physical PCB workbench at `z = -108 cm` to `-110 cm`. A floating 3D calibration beacon (`signal_beacon.glb`) hovers directly above the active station so your eyes never leave the board.
2. **Explicit Preview Stand-Ins for Real-World Sensors:** Following the **Learn AR with SPECS Preview Limits** guidelines, VoltBench pairs its 3D grabbable probe (`logic_probe.glb`) with explicit stand-in buttons on the Left UIKit Control Dock:
   - **[Simulate Probe Contact]:** Simulates physical BLE multimeter probe continuity on the active test pad, locking the reading (`5.02 V PASS`, `48.00 MHz SYNC`, or `41.8 °C NOMINAL`) and automatically advancing the 3D beacon to the next unverified station.
   - **[Simulate Thermal Spike]:** Simulates an off-axis IR thermal runaway (`94.6 °C OVERHEAT`) on Station C.
3. **Out-of-FOV Spatial Audio + Directional Arrow Cue:** Respecting the narrow `37° x 32°` (`53 x 77 cm` at `z = -110 cm`) optical waveguide FOV, when Station C overheats off-axis, VoltBench plays an urgent low-latency spatial chime (`sfx_thermal_alert.wav`) and illuminates a high-contrast directional hazard banner (`!! THERMAL SPIKE: LOOK RIGHT [STATION C >>] !!`) inside the central FOV until the wearer inspects and probes Station C.
4. **Progressive Disclosure (`Focus Mode`):** Pinching **[Toggle Focus Mode]** collapses secondary pinout specs into a compact 1-line eyes-up banner (`FOCUS MODE: EYES ON BOARD`) while soldering, and completed stations recede cleanly into `PASS ✓` pills.

### How we built it
1. **Planned with `plan-lens` (`challengepost/learn-specs`):** We authored [`devpost/design-brief.md`](./design-brief.md) (`status: approved`) before writing a single line of code—locking down centimeter-level coordinates inside the `53 x 77 cm` FOV at `z = -110 cm`, explicit preview sensor stand-ins, and 5 testable Done Criteria.
2. **3D Voxel Meshes via Blender 4.4 & CLAD `/build-mesh`:** We built 6 custom 3D voxel models (`workbench_pcb.glb`, `station_regulator.glb`, `station_mcu.glb`, `station_thermal.glb`, `logic_probe.glb`, `signal_beacon.glb`) with baked NLA animation clips (`Idle`, `Pulse`, `Scan`, `Alert`, `Probe`, `Spin`), normalized and grounded them via `normalize_glb.js --ground --yaw=180 --mark-canonical`, and verified their AABBs with `analyze_glb.js --aabb --shape`.
3. **Procedural 44.1 kHz WAV Audio via `/build-sfx` & `/build-music`:** We synthesized an 8-bar 96 BPM lofi lab ambient loop (`bg_lab_ambient.wav`, configured with `Audio.PlaybackMode.LowPower`, `volume = 0.4`, `.play(-1)`) and 4 low-latency interactive SFX (`sfx_ui_pinch.wav`, `sfx_probe_lock.wav`, `sfx_thermal_alert.wav`, `sfx_bench_complete.wav`, configured with `Audio.PlaybackMode.LowLatency`, `.play(1)`).
4. **Strict CLAD Architecture & UIKit Primitives:** We structured `Assets/Scripts/` into isolated modules (`VoltBenchAssetManifest.ts`, `VoltBenchState.ts` using Channel A `setX()` + `Event<T>`, `VoltBenchSceneRefs.ts`, `VoltBenchAudioController.ts`, `VoltBenchWorkbenchController.ts` with unit-scale collider wrappers, `VoltBenchDockUI.ts`, `VoltBenchInspectorUI.ts` using `SpectaclesUIKit` `Frame`, `BackPlate`, `FlexLayout`, `Button`, `ElementContent`, and `applyTextRole`, and `VoltBenchMain.ts`).
5. **Automated LEAF Verification (`Leaf.lspkg`):** We wrote `VoltBenchLeafInteractor.ts` and `VoltBenchLeafScenario.ts` to test all 5 Done Criteria plus `createIKInteractor()` hand reachability automatically.

### Challenges we ran into
- **Keeping UI out of the center workspace within a `37° x 32°` FOV:** Placing panels at `x = ±21 cm` with `±8°` inward yaw at `z = -110 cm` kept the central `28 cm` corridor completely open for the physical PCB workbench while keeping every UIKit `Frame` inside the `77 cm` horizontal FOV window.
- **Preventing collider scale drift on imported GLBs:** Scaling a `SceneObject` that carries a `ColliderComponent` multiplies the collider size in world space. We solved this at the asset boundary with `normalize_glb.js` and unit-scale `(1, 1, 1)` wrapper `SceneObject`s (`StationAWrapper`, `StationBWrapper`, `StationCWrapper`, `LogicProbeWrapper`) with child `HitVolume` colliders sized directly from `analyze_glb.js --aabb`.

### Accomplishments that we're proud of
- **Zero-violation CLAD Phase 3c static verification:** Every `requireAsset()` path resolves on disk, all UI lives exclusively in `*UI.ts` modules using `SpectaclesUIKit`, background music loops at `LowPower`, interactive SFX fire at `LowLatency`, and every `@input` is annotated with `@hint` and `@widget` and actively wired.
- **5 / 5 Done Criteria proven with automated LEAF tests:** Every single requirement in `devpost/design-brief.md` is verified programmatically via `VoltBenchLeafScenario.ts` and evaluated with explicit `"logic proven"` vs. `"feel unproven"` engineering notes.

### What we learned
Designing for optical see-through AR glasses is fundamentally different from designing for a phone or VR headset: black is transparent, the field of view is a tight spotlight (`37° x 32°`), and the best interface is one that anchors directly to the physical object you are working on and gets out of the way as soon as the step is done.

### What's next for VoltBench AR
- Pairing live Bluetooth Low Energy (BLE) multimeter telemetry (Pokit Pro / Mooshimeter) via Spectacles Bluetooth APIs to replace the preview stand-in button on physical hardware.
- Adding multi-wearer shared bench calibration via `SyncKit` so a remote senior hardware engineer can drop a 3D spatial beacon onto a junior technician's PCB in real time.

---

## Built With (Tags for Devpost)
- `spectacles`
- `lens-studio`
- `typescript`
- `spectacles-interaction-kit`
- `spectacles-uikit`
- `leaf`
- `blender`
- `webgl`
- `ar`
