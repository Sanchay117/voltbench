// Copyright 2026 VoltBench AR
// SPDX-License-Identifier: Apache-2.0

import {expect, Scenario} from "Leaf.lspkg/index"
import {VoltBenchLeafInteractor} from "./VoltBenchLeafInteractor"
import {VoltBenchMain} from "./VoltBenchMain"

/**
 * LEAF Automated Scenario Test Suite for VoltBench.
 * Verifies all 5 Done Criteria from `devpost/design-brief.md` plus IK hand reachability.
 */
@component
export class VoltBenchLeafScenario extends BaseScriptComponent {
  @input
  @hint("Reference to the VoltBenchMain entry script component under test")
  voltBenchMain!: VoltBenchMain

  onAwake(): void {
    const parentScenario = Scenario.create("VoltBench — All 5 Done Criteria Suite", {
      script: this
    })

    // Done Criterion 1: Spatial Workbench & FOV Layout
    parentScenario.add("Criterion 1: Initial spatial layout & FOV compliance", async (s) => {
      await s.waitSeconds(0.05)
      this.voltBenchMain.state.resetBench()

      expect(this.voltBenchMain.state.activeStationIndex).toBe(0)
      expect(this.voltBenchMain.state.verifiedCount).toBe(0)
      expect(this.voltBenchMain.state.benchComplete).toBe(false)
      expect(this.voltBenchMain.state.thermalAlertActive).toBe(false)

      const beaconPos = this.voltBenchMain.workbenchController.getBeaconWorldPosition()
      expect(beaconPos.x).toBeCloseTo(-12.0, 1)
      expect(beaconPos.z).toBeCloseTo(-108.0, 1)
    })

    // Done Criterion 2: Direct 3D Station Selection & Spatial Beacon Re-Anchoring
    parentScenario.add("Criterion 2: Direct 3D station pinch & spatial beacon re-anchoring", async (s) => {
      const interactor = new VoltBenchLeafInteractor(s, this.voltBenchMain)
      this.voltBenchMain.state.resetBench()

      // Pinch Station B (48 MHz MCU Bus at x = 0 cm)
      await interactor.pinchStation3D(1)
      expect(this.voltBenchMain.state.activeStationIndex).toBe(1)
      expect(this.voltBenchMain.state.getActiveSpec().code).toBe("ST-B")

      // Pinch Station C (Thermal MOSFET Stage at x = +12 cm)
      await interactor.pinchStation3D(2)
      expect(this.voltBenchMain.state.activeStationIndex).toBe(2)
      expect(this.voltBenchMain.state.getActiveSpec().code).toBe("ST-C")

      // Pinch Station A pill on Inspector UI (5V Buck at x = -12 cm)
      await interactor.pinchStationSelectorPill(0)
      expect(this.voltBenchMain.state.activeStationIndex).toBe(0)
    })

    // Done Criterion 3: Stand-In Probe Continuity & Multi-Step Diagnostic Completion (3/3)
    parentScenario.add("Criterion 3: Stand-in probe contact & 3/3 diagnostic completion", async (s) => {
      const interactor = new VoltBenchLeafInteractor(s, this.voltBenchMain)
      this.voltBenchMain.state.resetBench()

      // Step 1: Probe Station A via [Simulate Probe Contact] stand-in button
      await interactor.pinchSimulateProbeButton()
      expect(this.voltBenchMain.state.isStationVerified(0)).toBe(true)
      expect(this.voltBenchMain.state.verifiedCount).toBe(1)
      // Beacon auto-advances to Station B (index 1)
      expect(this.voltBenchMain.state.activeStationIndex).toBe(1)

      // Step 2: Probe Station B via 3D Logic Probe pinch
      await interactor.pinchProbe3D()
      expect(this.voltBenchMain.state.isStationVerified(1)).toBe(true)
      expect(this.voltBenchMain.state.verifiedCount).toBe(2)
      // Beacon auto-advances to Station C (index 2)
      expect(this.voltBenchMain.state.activeStationIndex).toBe(2)

      // Step 3: Probe Station C -> completes all 3 stations
      await interactor.pinchSimulateProbeButton()
      expect(this.voltBenchMain.state.isStationVerified(2)).toBe(true)
      expect(this.voltBenchMain.state.verifiedCount).toBe(3)
      expect(this.voltBenchMain.state.benchComplete).toBe(true)
      expect(this.voltBenchMain.inspectorUI.getProgressSummaryText()).toContain(
        "BENCH DIAGNOSTICS COMPLETE"
      )
    })

    // Done Criterion 4: Out-of-FOV Thermal Alert & Directional Cue Resolution
    parentScenario.add("Criterion 4: Out-of-FOV thermal alert & directional arrow resolution", async (s) => {
      const interactor = new VoltBenchLeafInteractor(s, this.voltBenchMain)
      this.voltBenchMain.state.resetBench()

      // Trigger off-axis thermal runaway on Station C while looking at Station A
      await interactor.pinchSimulateThermalButton()
      expect(this.voltBenchMain.state.thermalAlertActive).toBe(true)
      expect(this.voltBenchMain.inspectorUI.getAlertBannerText()).toContain(
        "THERMAL SPIKE: LOOK RIGHT [STATION C >>]"
      )

      // Follow the directional cue to Station C and probe TP3 to clear the fault
      await interactor.pinchStation3D(2)
      expect(this.voltBenchMain.state.activeStationIndex).toBe(2)
      expect(this.voltBenchMain.inspectorUI.getLiveReadingText()).toContain("94.6 °C OVERHEAT")

      await interactor.pinchSimulateProbeButton()
      expect(this.voltBenchMain.state.thermalAlertActive).toBe(false)
      expect(this.voltBenchMain.state.isStationVerified(2)).toBe(true)
    })

    // Done Criterion 5: Progressive Disclosure (Focus Mode) & Bench Reset + IK Reachability
    parentScenario.add("Criterion 5: Focus Mode progressive disclosure, Reset, and IK reachability", async (s) => {
      const interactor = new VoltBenchLeafInteractor(s, this.voltBenchMain)
      this.voltBenchMain.state.resetBench()

      expect(this.voltBenchMain.state.focusModeActive).toBe(false)
      expect(this.voltBenchMain.inspectorUI.isPinoutDetailVisible()).toBe(true)

      // Toggle Focus Mode on -> collapses secondary pinout detail rows
      await interactor.pinchFocusModeButton()
      expect(this.voltBenchMain.state.focusModeActive).toBe(true)
      expect(this.voltBenchMain.inspectorUI.isPinoutDetailVisible()).toBe(false)

      // Toggle Focus Mode off -> restores detail rows
      await interactor.pinchFocusModeButton()
      expect(this.voltBenchMain.state.focusModeActive).toBe(false)
      expect(this.voltBenchMain.inspectorUI.isPinoutDetailVisible()).toBe(true)

      // Verify IK hand reachability across the workbench
      const hand = s.createIKInteractor()
      await interactor.verifyReachabilityWithIK(hand)

      // Reset Bench restores 0/3 state
      await interactor.pinchResetBenchButton()
      expect(this.voltBenchMain.state.verifiedCount).toBe(0)
      expect(this.voltBenchMain.state.activeStationIndex).toBe(0)
      expect(this.voltBenchMain.state.benchComplete).toBe(false)
    })
  }
}
