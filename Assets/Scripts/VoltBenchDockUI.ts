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
  ICON_BOLT,
  ICON_REFRESH,
  ICON_VISIBILITY,
  ICON_WARNING,
  IMAGE_MATERIAL
} from "./VoltBenchAssetManifest"
import {VoltBenchState} from "./VoltBenchState"

type TextRole =
  | "Display"
  | "Title1"
  | "Title2"
  | "Title3"
  | "Body"
  | "Callout"
  | "Caption"
  | "Overline"

const TEXT_ROLES: {
  [K in TextRole]: {size: number; color: vec4; lineSpacing: number; letterSpacing: number}
} = {
  Display: {size: 48, color: new vec4(0.96, 0.96, 0.98, 1), lineSpacing: 1.05, letterSpacing: 0},
  Title1: {size: 34, color: new vec4(0.96, 0.96, 0.98, 1), lineSpacing: 1.1, letterSpacing: 0},
  Title2: {size: 26, color: new vec4(0.94, 0.95, 0.97, 1), lineSpacing: 1.12, letterSpacing: 0},
  Title3: {size: 21, color: new vec4(0.9, 0.91, 0.95, 1), lineSpacing: 1.15, letterSpacing: 0},
  Body: {size: 18, color: new vec4(0.76, 0.78, 0.84, 1), lineSpacing: 1.25, letterSpacing: 0},
  Callout: {size: 17, color: new vec4(0.88, 0.9, 0.94, 1), lineSpacing: 1.2, letterSpacing: 0.2},
  Caption: {size: 14, color: new vec4(0.55, 0.58, 0.65, 1), lineSpacing: 1.2, letterSpacing: 0.3},
  Overline: {size: 12, color: new vec4(0.5, 0.54, 0.62, 1), lineSpacing: 1.15, letterSpacing: 1.5}
}

export function applyTextRole(
  t: Text,
  role: TextRole,
  opts?: {
    color?: vec4
    width?: number
    height?: number
    hAlign?: HorizontalAlignment
    vAlign?: VerticalAlignment
    overflow?: HorizontalOverflow
  }
): void {
  const spec = TEXT_ROLES[role]
  t.size = spec.size
  t.lineSpacing = spec.lineSpacing
  t.letterSpacing = spec.letterSpacing
  t.textFill.mode = TextFillMode.Solid
  t.textFill.color = opts?.color ?? spec.color
  t.horizontalAlignment = opts?.hAlign ?? HorizontalAlignment.Center
  t.verticalAlignment = opts?.vAlign ?? VerticalAlignment.Center
  t.worldSpaceRect = Rect.create(
    -(opts?.width ?? 22) / 2,
    (opts?.width ?? 22) / 2,
    -(opts?.height ?? 3) / 2,
    (opts?.height ?? 3) / 2
  )
  t.horizontalOverflow = opts?.overflow ?? HorizontalOverflow.Wrap
  t.verticalOverflow = VerticalOverflow.Overflow
  t.depthTest = true
}

/**
 * Left Workbench Control Dock UI (`VoltBenchDockUI`).
 * Houses the explicit Preview Stand-In buttons (`Simulate Probe Contact`,
 * `Simulate Thermal Spike`), `Focus Mode` progressive disclosure toggle,
 * and `Reset Bench` control inside a single-column UIKit `Frame` + `FlexLayout`.
 */
export class VoltBenchDockUI {
  private readonly host: SceneObject
  private dockFrame!: Frame
  private rootBackplate!: BackPlate
  private rootFlex!: FlexLayout
  private overlineText!: Text
  private titleText!: Text
  private subtitleText!: Text
  private standInNoteText!: Text

  private simulateProbeObj!: SceneObject
  private simulateProbeBtn!: Button
  private simulateProbeContent!: ElementContent

  private simulateThermalObj!: SceneObject
  private simulateThermalBtn!: Button
  private simulateThermalContent!: ElementContent

  private focusModeObj!: SceneObject
  private focusModeBtn!: Button
  private focusModeContent!: ElementContent

  private resetBenchObj!: SceneObject
  private resetBenchBtn!: Button
  private resetBenchContent!: ElementContent

  constructor(parent: SceneObject) {
    this.host = global.scene.createSceneObject("VoltBenchDockFrame")
    this.host.setParent(parent)

    // Phase 1 (onAwake): create SceneObjects and UIKit components only
    this.dockFrame = this.host.createComponent(Frame.getTypeName()) as Frame

    const innerObj = this.child("DockInner")
    this.rootBackplate = innerObj.createComponent(BackPlate.getTypeName()) as BackPlate
    this.rootFlex = innerObj.createComponent(FlexLayout.getTypeName()) as FlexLayout

    const overlineObj = this.child("DockOverline", innerObj)
    this.overlineText = overlineObj.createComponent("Component.Text") as Text

    const titleObj = this.child("DockTitle", innerObj)
    this.titleText = titleObj.createComponent("Component.Text") as Text

    const subObj = this.child("DockSubtitle", innerObj)
    this.subtitleText = subObj.createComponent("Component.Text") as Text

    this.simulateProbeObj = this.child("SimulateProbeBtn", innerObj)
    this.simulateProbeBtn = this.simulateProbeObj.createComponent(Button.getTypeName()) as Button
    this.simulateProbeContent = this.simulateProbeObj.createComponent(
      ElementContent.getTypeName()
    ) as ElementContent

    this.simulateThermalObj = this.child("SimulateThermalBtn", innerObj)
    this.simulateThermalBtn = this.simulateThermalObj.createComponent(
      Button.getTypeName()
    ) as Button
    this.simulateThermalContent = this.simulateThermalObj.createComponent(
      ElementContent.getTypeName()
    ) as ElementContent

    this.focusModeObj = this.child("FocusModeBtn", innerObj)
    this.focusModeBtn = this.focusModeObj.createComponent(Button.getTypeName()) as Button
    this.focusModeContent = this.focusModeObj.createComponent(
      ElementContent.getTypeName()
    ) as ElementContent

    this.resetBenchObj = this.child("ResetBenchBtn", innerObj)
    this.resetBenchBtn = this.resetBenchObj.createComponent(Button.getTypeName()) as Button
    this.resetBenchContent = this.resetBenchObj.createComponent(
      ElementContent.getTypeName()
    ) as ElementContent

    const standInObj = this.child("StandInNote", innerObj)
    this.standInNoteText = standInObj.createComponent("Component.Text") as Text
  }

  /**
   * Phase 2 (OnStartEvent): configure UIKit layout dimensions, typography, and callbacks.
   */
  configure(state: VoltBenchState, accentColor: vec4): void {
    this.frame(this.dockFrame, 22, 36)
    this.backplate(this.rootBackplate, "Dark", 21, 35)
    this.vstack(this.rootFlex, 21, 35, 0.9, [1.2, 1.0, 1.2, 1.0])

    this.label(this.overlineText, "PREVIEW SENSOR STAND-INS", "Overline", {
      width: 19,
      height: 1.6,
      color: accentColor
    })
    this.label(this.titleText, "VOLTBENCH AR", "Title2", {
      width: 19,
      height: 2.8
    })
    this.label(this.subtitleText, "Hands-Free PCB Coach", "Caption", {
      width: 19,
      height: 2.0
    })

    // 1. [Simulate Probe Contact] — Stand-in for physical BLE multimeter probe continuity
    this.btn(this.simulateProbeBtn, "Primary", "Capsule", 19, 6.2)
    this.content(this.simulateProbeContent, {
      title: "Simulate Probe Contact",
      subtitle: "Locks active test pad reading",
      leadingIcon: ICON_BOLT,
      iconLayout: "left"
    })
    this.simulateProbeBtn.onTriggerUp.add(() => {
      state.simulateProbeContact()
    })

    // 2. [Simulate Thermal Spike] — Stand-in for off-axis IR thermal runaway on Station C
    this.btn(this.simulateThermalBtn, "Secondary", "Capsule", 19, 6.2)
    this.content(this.simulateThermalContent, {
      title: "Simulate Thermal Spike",
      subtitle: "Triggers off-FOV ST-C alarm",
      leadingIcon: ICON_WARNING,
      iconLayout: "left"
    })
    this.simulateThermalBtn.onTriggerUp.add(() => {
      state.triggerThermalSpike()
    })

    // 3. [Focus Mode] — Progressive disclosure toggle (Habit 2)
    this.btn(this.focusModeBtn, "Neutral", "Capsule", 19, 5.8)
    this.content(this.focusModeContent, {
      title: "Toggle Focus Mode",
      subtitle: "Eyes-up compact HUD mode",
      leadingIcon: ICON_VISIBILITY,
      iconLayout: "left"
    })
    this.focusModeBtn.onTriggerUp.add(() => {
      state.toggleFocusMode()
    })

    // 4. [Reset Bench] — Restores all 3 circuit stations to unverified
    this.btn(this.resetBenchBtn, "Ghost", "Capsule", 19, 5.4)
    this.content(this.resetBenchContent, {
      title: "Reset Bench (0/3)",
      subtitle: "Clear all station checks",
      leadingIcon: ICON_REFRESH,
      iconLayout: "left"
    })
    this.resetBenchBtn.onTriggerUp.add(() => {
      state.resetBench()
    })

    this.label(
      this.standInNoteText,
      "Stand-in: simulates BLE probe & IR thermal camera in Preview",
      "Caption",
      {width: 19, height: 2.8}
    )

    state.onFocusModeActiveChangedEvent.add((focused: boolean) => {
      this.content(this.focusModeContent, {
        title: focused ? "Exit Focus Mode" : "Toggle Focus Mode",
        subtitle: focused ? "Restore full telemetry card" : "Eyes-up compact HUD mode",
        leadingIcon: ICON_VISIBILITY,
        iconLayout: "left"
      })
    })
  }

  getSimulateProbeButton(): Button {
    return this.simulateProbeBtn
  }

  getSimulateThermalButton(): Button {
    return this.simulateThermalBtn
  }

  getFocusModeButton(): Button {
    return this.focusModeBtn
  }

  getResetBenchButton(): Button {
    return this.resetBenchBtn
  }

  private child(name: string, parent?: SceneObject): SceneObject {
    const o = global.scene.createSceneObject(name)
    o.setParent(parent ?? this.host)
    return o
  }

  private frame(f: Frame, w: number, h: number, opts?: {follow?: boolean}): Frame {
    f.innerSize = new vec2(w, h)
    f.appearance = "Small"
    f.autoShowHide = false
    f.allowScaling = false
    f.useBillboarding = opts?.follow ?? false
    f.useFollowBehavior = opts?.follow ?? false
    return f
  }

  private backplate(
    bp: BackPlate,
    style: "Default" | "Dark" | "Light",
    w: number,
    h: number
  ): BackPlate {
    bp.size = new vec2(w, h)
    bp.style = style
    return bp
  }

  private vstack(
    fl: FlexLayout,
    w: number,
    h: number,
    gap: number = 0.8,
    pad?: [number, number, number, number]
  ): FlexLayout {
    fl.direction = FlexDirection.Column
    fl.justifyContent = JustifyContent.FlexStart
    fl.alignItems = AlignItems.Center
    fl.containerSize = new vec2(w, h)
    fl.rowGap = gap
    if (pad) {
      fl.paddingTop = pad[0]
      fl.paddingBottom = pad[1]
      fl.paddingLeft = pad[2]
      fl.paddingRight = pad[3]
    }
    return fl
  }

  private btn(
    b: Button,
    style: "Primary" | "Secondary" | "Neutral" | "Ghost",
    shape: "Capsule" | "Rectangle" | "Round",
    w: number,
    h: number
  ): Button {
    b.size = new vec3(w, h, 1)
    b.style = style
    b.shape = shape
    return b
  }

  private content(
    ec: ElementContent,
    opts: {
      title?: string
      subtitle?: string
      iconLayout?: "none" | "left" | "right" | "both"
      leadingIcon?: Texture
    }
  ): ElementContent {
    ec.imageMaterial = IMAGE_MATERIAL
    if (opts.title !== undefined) ec.titleText = opts.title
    if (opts.subtitle !== undefined) {
      ec.showSubtitle = true
      ec.subtitleText = opts.subtitle
    }
    if (opts.iconLayout !== undefined) ec.iconLayout = opts.iconLayout
    if (opts.leadingIcon !== undefined) ec.leadingIcon = opts.leadingIcon
    return ec
  }

  private label(
    t: Text,
    str: string,
    role: TextRole,
    opts?: {
      color?: vec4
      width?: number
      height?: number
      hAlign?: HorizontalAlignment
    }
  ): Text {
    t.text = str
    applyTextRole(t, role, opts)
    return t
  }
}
