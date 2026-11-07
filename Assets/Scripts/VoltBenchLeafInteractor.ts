// Copyright 2026 VoltBench AR
// SPDX-License-Identifier: Apache-2.0

import {
  DefaultLeafInteractor,
  LeafHandInteractor,
  Scenario
} from "Leaf.lspkg/index"
import {VoltBenchMain} from "./VoltBenchMain"

/**
 * Custom domain interactor wrapping `DefaultLeafInteractor` and `LeafHandInteractor`
 * for high-level VoltBench diagnostic workflow assertions.
 */
export class VoltBenchLeafInteractor extends DefaultLeafInteractor {
  constructor(
    protected scenario: Scenario,
    private main: VoltBenchMain
  ) {
    super(scenario)
  }

  async pinchStation3D(stationIndex: number): Promise<void> {
    const interactable = this.main.workbenchController.getStationInteractable(stationIndex)
    this.trigger(interactable)
    await this.scenario.waitSeconds(0.05)
  }

  async pinchProbe3D(): Promise<void> {
    const interactable = this.main.workbenchController.getProbeInteractable()
    this.trigger(interactable)
    await this.scenario.waitSeconds(0.05)
  }

  async pinchSimulateProbeButton(): Promise<void> {
    this.main.dockUI.getSimulateProbeButton().trigger()
    await this.scenario.waitSeconds(0.05)
  }

  async pinchSimulateThermalButton(): Promise<void> {
    this.main.dockUI.getSimulateThermalButton().trigger()
    await this.scenario.waitSeconds(0.05)
  }

  async pinchFocusModeButton(): Promise<void> {
    this.main.dockUI.getFocusModeButton().trigger()
    await this.scenario.waitSeconds(0.05)
  }

  async pinchResetBenchButton(): Promise<void> {
    this.main.dockUI.getResetBenchButton().trigger()
    await this.scenario.waitSeconds(0.05)
  }

  async pinchStationSelectorPill(stationIndex: number): Promise<void> {
    this.main.inspectorUI.getStationButton(stationIndex).trigger()
    await this.scenario.waitSeconds(0.05)
  }

  async verifyReachabilityWithIK(hand: LeafHandInteractor): Promise<void> {
    for (let i = 0; i < 3; i++) {
      const target = this.main.workbenchController.getStationInteractable(i)
      await hand.pinch(target)
    }
    const probeTarget = this.main.workbenchController.getProbeInteractable()
    await hand.pinch(probeTarget)
  }
}
