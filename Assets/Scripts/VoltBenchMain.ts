// Copyright 2026 VoltBench AR
// SPDX-License-Identifier: Apache-2.0

import {VoltBenchAudioController} from "./VoltBenchAudioController"
import {VoltBenchDockUI} from "./VoltBenchDockUI"
import {VoltBenchInspectorUI} from "./VoltBenchInspectorUI"
import {VoltBenchSceneRefs} from "./VoltBenchSceneRefs"
import {VoltBenchState} from "./VoltBenchState"
import {VoltBenchWorkbenchController} from "./VoltBenchWorkbenchController"

/**
 * Main entry script for VoltBench — Hands-Free Spatial Electronics & PCB Diagnostics Coach.
 * Orchestrates the 3D PCB workbench, 3 interactive circuit stations, spatial target beacon,
 * grabbable 3D logic probe, UIKit Dock & Inspector panels, and spatial audio feedback.
 */
@component
export class VoltBenchMain extends BaseScriptComponent {
  @input
  @hint("Initial circuit station selected on startup (0 = 5V Buck, 1 = MCU Bus, 2 = Thermal MOSFET)")
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("Station A: 5V Buck Regulator", 0),
      new ComboBoxItem("Station B: 48 MHz MCU Bus", 1),
      new ComboBoxItem("Station C: Thermal MOSFET Stage", 2)
    ])
  )
  initialStationIndex: number = 0

  @input
  @hint("Ambient lab background music volume (LowPower mode)")
  @widget(new SliderWidget(0.0, 1.0, 0.05))
  ambientMusicVolume: number = 0.4

  @input
  @hint("Interactive pinch and probe confirmation SFX volume (LowLatency mode)")
  @widget(new SliderWidget(0.0, 1.0, 0.05))
  sfxVolume: number = 0.85

  @input
  @hint("Animation bobbing speed multiplier for the 3D spatial target beacon")
  @widget(new SliderWidget(0.2, 3.0, 0.1))
  beaconBobSpeed: number = 1.0

  @input
  @hint("Primary HUD accent color for active station telemetry and callouts")
  @widget(new ColorWidget())
  accentColor: vec4 = new vec4(0.36, 0.88, 0.9, 1.0)

  @input
  @hint("Directional hazard banner color for off-axis thermal runaway alerts")
  @widget(new ColorWidget())
  alertColor: vec4 = new vec4(1.0, 0.36, 0.47, 1.0)

  @input
  @hint("Start in compact Eyes-Up Focus Mode (collapses secondary pinout rows)")
  startInFocusMode: boolean = false

  @input
  @hint("Show physics collider wireframes on 3D stations and probe for spatial debugging")
  debugColliders: boolean = false

  public state!: VoltBenchState
  public sceneRefs!: VoltBenchSceneRefs
  public audioController!: VoltBenchAudioController
  public workbenchController!: VoltBenchWorkbenchController
  public dockUI!: VoltBenchDockUI
  public inspectorUI!: VoltBenchInspectorUI

  onAwake(): void {
    // Phase 1: Instantiate state, scene hierarchy, and component structures only
    this.state = new VoltBenchState()
    this.sceneRefs = new VoltBenchSceneRefs(this.getSceneObject())
    this.audioController = new VoltBenchAudioController(this.sceneRefs.contentGroup)
    this.workbenchController = new VoltBenchWorkbenchController(this.sceneRefs)
    this.dockUI = new VoltBenchDockUI(this.sceneRefs.dockPanelAnchor)
    this.inspectorUI = new VoltBenchInspectorUI(this.sceneRefs.inspectorPanelAnchor)

    this.createEvent("OnStartEvent").bind(() => {
      this.configure()
    })

    this.createEvent("UpdateEvent").bind(() => {
      this.workbenchController.update(getDeltaTime(), this.beaconBobSpeed)
    })
  }

  private configure(): void {
    // Phase 2: Apply transforms, Inspector @inputs, UIKit properties, and event bindings
    this.sceneRefs.configureDefaultTransforms()

    this.state.setFocusModeActive(this.startInFocusMode)
    this.state.selectStation(this.initialStationIndex)
    this.state.refreshTelemetryStrings()

    this.audioController.configure(
      this.state,
      this.ambientMusicVolume,
      this.sfxVolume
    )
    this.workbenchController.configure(
      this.state,
      this.debugColliders,
      this.beaconBobSpeed
    )
    this.dockUI.configure(this.state, this.accentColor)
    this.inspectorUI.configure(this.state, this.accentColor, this.alertColor)
  }
}
