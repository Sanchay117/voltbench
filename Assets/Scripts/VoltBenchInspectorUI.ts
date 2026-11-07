// Copyright 2026 VoltBench AR
// SPDX-License-Identifier: Apache-2.0

import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/Components/BackPlate/BackPlate"
import {ElementContent} from "SpectaclesUIKit.lspkg/Scripts/Components/ElementContent/ElementContent"
import {Frame} from "SpectaclesUIKit.lspkg/Scripts/Components/Frame/Frame"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/UIElement/Button"
import {
  AlignItems,
  FlexDirection,
  FlexLayout,
  JustifyContent
} from "SpectaclesUIKit.lspkg/Scripts/Layouts/FlexLayout"
import {
  ICON_CHECK_CIRCLE,
  ICON_SENSORS,
  IMAGE_MATERIAL
} from "./VoltBenchAssetManifest"
import {applyTextRole} from "./VoltBenchDockUI"
import {STATION_SPECS, VoltBenchState} from "./VoltBenchState"

/**
 * Right Station Inspector Card (`VoltBenchInspectorUI`).
 * Displays the active circuit station's pinout spec, live probe telemetry,
 * off-axis directional thermal hazard banner (`THERMAL SPIKE: STATION C >>`),
 * progressive disclosure collapse in `Focus Mode`, and direct station selector buttons.
 */
export class VoltBenchInspectorUI {
  private readonly host: SceneObject
  private inspectorFrame!: Frame
  private rootBackplate!: BackPlate
  private rootFlex!: FlexLayout

  private alertBannerText!: Text
  private stationTitleText!: Text
  private pinoutLabelObj!: SceneObject
  private pinoutLabelText!: Text
  private expectedSpecObj!: SceneObject
  private expectedSpecText!: Text
  private liveReadingText!: Text
  private coachInstructionObj!: SceneObject
  private coachInstructionText!: Text
  private progressSummaryText!: Text

  private stationButtons: Button[] = []
  private stationButtonContents: ElementContent[] = []

  constructor(parent: SceneObject) {
    this.host = global.scene.createSceneObject("VoltBenchInspectorFrame")
    this.host.setParent(parent)

    // Phase 1 (onAwake): create SceneObjects and UIKit components only
    this.inspectorFrame = this.host.createComponent(Frame.getTypeName()) as Frame

    const innerObj = this.child("InspectorInner")
    this.rootBackplate = innerObj.createComponent(BackPlate.getTypeName()) as BackPlate
    this.rootFlex = innerObj.createComponent(FlexLayout.getTypeName()) as FlexLayout

    const alertObj = this.child("DirectionalAlertBanner", innerObj)
    this.alertBannerText = alertObj.createComponent("Component.Text") as Text

    const titleObj = this.child("StationTitle", innerObj)
    this.stationTitleText = titleObj.createComponent("Component.Text") as Text

    this.pinoutLabelObj = this.child("PinoutLabel", innerObj)
    this.pinoutLabelText = this.pinoutLabelObj.createComponent("Component.Text") as Text

    this.expectedSpecObj = this.child("ExpectedSpec", innerObj)
    this.expectedSpecText = this.expectedSpecObj.createComponent("Component.Text") as Text

    const readingObj = this.child("LiveReading", innerObj)
    this.liveReadingText = readingObj.createComponent("Component.Text") as Text

    this.coachInstructionObj = this.child("CoachInstruction", innerObj)
    this.coachInstructionText = this.coachInstructionObj.createComponent(
      "Component.Text"
    ) as Text

    const progressObj = this.child("ProgressSummary", innerObj)
    this.progressSummaryText = progressObj.createComponent("Component.Text") as Text

    for (let i = 0; i < STATION_SPECS.length; i++) {
      const btnObj = this.child(`SelectStationBtn_${i}`, innerObj)
      const btn = btnObj.createComponent(Button.getTypeName()) as Button
      const content = btnObj.createComponent(ElementContent.getTypeName()) as ElementContent
      this.stationButtons.push(btn)
      this.stationButtonContents.push(content)
    }
  }

  /**
   * Phase 2 (OnStartEvent): configure layout, initial telemetry, and state listeners.
   */
  configure(state: VoltBenchState, accentColor: vec4, alertColor: vec4): void {
    this.inspectorFrame.innerSize = new vec2(24, 36)
    this.inspectorFrame.appearance = "Small"
    this.inspectorFrame.autoShowHide = false
    this.inspectorFrame.allowScaling = false
    this.inspectorFrame.useBillboarding = false
    this.inspectorFrame.useFollowBehavior = false

    this.rootBackplate.size = new vec2(23, 35)
    this.rootBackplate.style = "Dark"

    this.rootFlex.direction = FlexDirection.Column
    this.rootFlex.justifyContent = JustifyContent.FlexStart
    this.rootFlex.alignItems = AlignItems.Center
    this.rootFlex.containerSize = new vec2(23, 35)
    this.rootFlex.rowGap = 0.65
    this.rootFlex.paddingTop = 1.0
    this.rootFlex.paddingBottom = 0.8
    this.rootFlex.paddingLeft = 1.0
    this.rootFlex.paddingRight = 1.0

    for (let i = 0; i < STATION_SPECS.length; i++) {
      const spec = STATION_SPECS[i]
      const btn = this.stationButtons[i]
      const ec = this.stationButtonContents[i]
      btn.size = new vec3(20.5, 4.4, 1)
      btn.style = i === state.activeStationIndex ? "Primary" : "Neutral"
      btn.shape = "Capsule"

      ec.imageMaterial = IMAGE_MATERIAL
      ec.titleText = `${spec.shortTitle} [PENDING]`
      ec.iconLayout = "left"
      ec.leadingIcon = ICON_SENSORS

      const stationIdx = i
      btn.onTriggerUp.add(() => {
        state.selectStation(stationIdx)
      })
    }

    const syncView = (): void => {
      const spec = state.getActiveSpec()
      const isAlert = state.thermalAlertActive
      const isComplete = state.benchComplete
      const isFocused = state.focusModeActive

      // 1. Directional Hazard / Status Banner (Habit 4: Out-of-FOV attention cue)
      this.alertBannerText.text = state.statusBannerText
      applyTextRole(this.alertBannerText, "Caption", {
        width: 21,
        height: 2.2,
        color: isAlert
          ? alertColor
          : isComplete
            ? new vec4(0.32, 0.96, 0.62, 1.0)
            : accentColor
      })

      // 2. Active Station Header
      this.stationTitleText.text = spec.fullName
      applyTextRole(this.stationTitleText, "Title3", {
        width: 21,
        height: 2.6
      })

      // 3. Pinout & Expected Spec (Progressive disclosure: hidden in Focus Mode)
      this.pinoutLabelObj.enabled = !isFocused
      this.expectedSpecObj.enabled = !isFocused
      this.coachInstructionObj.enabled = !isFocused

      this.pinoutLabelText.text = spec.pinoutLabel
      applyTextRole(this.pinoutLabelText, "Caption", {
        width: 21,
        height: 1.8,
        color: accentColor
      })

      this.expectedSpecText.text = spec.expectedSpec
      applyTextRole(this.expectedSpecText, "Body", {
        width: 21,
        height: 2.2
      })

      // 4. Live Telemetry Reading
      this.liveReadingText.text = state.stationTelemetryText
      const isVerified = state.isStationVerified(state.activeStationIndex)
      applyTextRole(this.liveReadingText, "Callout", {
        width: 21,
        height: 2.6,
        color: isAlert
          ? alertColor
          : isVerified
            ? new vec4(0.32, 0.96, 0.62, 1.0)
            : new vec4(1.0, 0.85, 0.38, 1.0)
      })

      // 5. Hands-Free Coach Guidance
      this.coachInstructionText.text = spec.coachInstruction
      applyTextRole(this.coachInstructionText, "Caption", {
        width: 21,
        height: 2.6
      })

      // 6. Verification Progress Counter
      this.progressSummaryText.text = isComplete
        ? "BENCH DIAGNOSTICS COMPLETE (3/3 PASS)"
        : `VERIFIED STATIONS: ${state.verifiedCount} / 3`
      applyTextRole(this.progressSummaryText, "Caption", {
        width: 21,
        height: 2.0,
        color: isComplete ? new vec4(0.32, 0.96, 0.62, 1.0) : accentColor
      })

      // 7. Update station selector pills
      for (let i = 0; i < STATION_SPECS.length; i++) {
        const s = STATION_SPECS[i]
        const verified = state.isStationVerified(i)
        const btn = this.stationButtons[i]
        const ec = this.stationButtonContents[i]
        btn.style = i === state.activeStationIndex ? "Primary" : "Neutral"
        ec.imageMaterial = IMAGE_MATERIAL
        ec.iconLayout = "left"
        ec.leadingIcon = verified ? ICON_CHECK_CIRCLE : ICON_SENSORS
        if (i === 2 && isAlert) {
          ec.titleText = `${s.shortTitle} [94.6°C ALERT!]`
        } else {
          ec.titleText = `${s.shortTitle} [${verified ? "PASS ✓" : "PENDING"}]`
        }
      }

      this.rootFlex.layout()
    }

    syncView()

    state.onActiveStationIndexChangedEvent.add(() => syncView())
    state.onVerifiedCountChangedEvent.add(() => syncView())
    state.onBenchCompleteChangedEvent.add(() => syncView())
    state.onThermalAlertActiveChangedEvent.add(() => syncView())
    state.onFocusModeActiveChangedEvent.add(() => syncView())
    state.onStatusBannerTextChangedEvent.add(() => syncView())
    state.onStationTelemetryTextChangedEvent.add(() => syncView())
  }

  getStationButton(index: number): Button {
    return this.stationButtons[index]
  }

  getAlertBannerText(): string {
    return this.alertBannerText.text
  }

  getLiveReadingText(): string {
    return this.liveReadingText.text
  }

  getProgressSummaryText(): string {
    return this.progressSummaryText.text
  }

  isPinoutDetailVisible(): boolean {
    return this.pinoutLabelObj.enabled
  }

  private child(name: string, parent?: SceneObject): SceneObject {
    const o = global.scene.createSceneObject(name)
    o.setParent(parent ?? this.host)
    return o
  }
}
