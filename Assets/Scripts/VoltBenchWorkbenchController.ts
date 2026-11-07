// Copyright 2026 VoltBench AR
// SPDX-License-Identifier: Apache-2.0

import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {InteractorTriggerType} from "SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor"
import {MESH_SPECS, MeshAssetSpec} from "./VoltBenchAssetManifest"
import {VoltBenchSceneRefs} from "./VoltBenchSceneRefs"
import {STATION_SPECS, VoltBenchState} from "./VoltBenchState"

interface InteractiveStationNode {
  index: number
  wrapper: SceneObject
  hitVolume: SceneObject
  collider: ColliderComponent
  interactable: Interactable
  meshInstance: SceneObject | null
}

/**
 * Non-UI 3D spatial workbench controller for VoltBench.
 * Instantiates canonical GLB meshes under unit-scale wrapper SceneObjects,
 * wires SIK Interactable + ColliderComponent hit volumes from AABB data,
 * and animates the 3D spatial target beacon and diagnostic logic probe.
 */
export class VoltBenchWorkbenchController {
  private readonly refs: VoltBenchSceneRefs
  private readonly stationNodes: InteractiveStationNode[] = []
  private pcbWrapper!: SceneObject
  private beaconWrapper!: SceneObject
  private probeWrapper!: SceneObject
  private probeHitVolume!: SceneObject
  private probeCollider!: ColliderComponent
  private probeInteractable!: Interactable
  private targetBeaconPos: vec3 = new vec3(-12.0, 2.0, -108.0)
  private targetProbePos: vec3 = new vec3(-6.0, 2.0, -104.0)
  private animTime: number = 0.0

  constructor(refs: VoltBenchSceneRefs) {
    this.refs = refs

    // Create unit-scale wrapper nodes during onAwake phase
    this.pcbWrapper = global.scene.createSceneObject("WorkbenchPCBWrapper")
    this.pcbWrapper.setParent(refs.workbenchAnchor)

    const stationAnchors = [
      refs.stationAAnchor,
      refs.stationBAnchor,
      refs.stationCAnchor
    ]
    const stationNames = ["StationAWrapper", "StationBWrapper", "StationCWrapper"]

    for (let i = 0; i < 3; i++) {
      const wrapper = global.scene.createSceneObject(stationNames[i])
      wrapper.setParent(stationAnchors[i])

      const hitVolume = global.scene.createSceneObject(`${stationNames[i]}_HitVolume`)
      hitVolume.setParent(wrapper)

      const collider = hitVolume.createComponent("Physics.ColliderComponent") as ColliderComponent
      const interactable = hitVolume.createComponent(Interactable.getTypeName()) as Interactable

      this.stationNodes.push({
        index: i,
        wrapper,
        hitVolume,
        collider,
        interactable,
        meshInstance: null
      })
    }

    this.beaconWrapper = global.scene.createSceneObject("SignalBeaconWrapper")
    this.beaconWrapper.setParent(refs.beaconAnchor)

    this.probeWrapper = global.scene.createSceneObject("LogicProbeWrapper")
    this.probeWrapper.setParent(refs.probeAnchor)

    this.probeHitVolume = global.scene.createSceneObject("LogicProbe_HitVolume")
    this.probeHitVolume.setParent(this.probeWrapper)
    this.probeCollider = this.probeHitVolume.createComponent("Physics.ColliderComponent") as ColliderComponent
    this.probeInteractable = this.probeHitVolume.createComponent(Interactable.getTypeName()) as Interactable
  }

  /**
   * Phase 2 (OnStartEvent): instantiate GLB prefabs, configure AABB colliders,
   * and wire SIK pinch callbacks to the VoltBenchState event bus.
   */
  configure(state: VoltBenchState, debugColliders: boolean, beaconBobSpeed: number): void {
    // 1. Instantiate static PCB base under unit-scale wrapper
    this.instantiateGlbChild(this.pcbWrapper, MESH_SPECS.workbenchPcb, "WorkbenchPCBMesh")

    // 2. Instantiate and wire the 3 interactive circuit stations
    const stationSpecKeys = ["stationRegulator", "stationMcu", "stationThermal"]
    for (let i = 0; i < this.stationNodes.length; i++) {
      const node = this.stationNodes[i]
      const meshSpec = MESH_SPECS[stationSpecKeys[i]]
      node.meshInstance = this.instantiateGlbChild(
        node.wrapper,
        meshSpec,
        `Station_${i}_Mesh`
      )
      this.configureHitVolume(
        node.hitVolume,
        node.collider,
        node.interactable,
        meshSpec,
        debugColliders
      )

      const stationIdx = i
      node.interactable.onTriggerEnd.add((event) => {
        if (
          event.triggerType !== undefined &&
          (event.triggerType & InteractorTriggerType.Pinch) === 0
        ) {
          return
        }
        if (state.activeStationIndex === stationIdx) {
          // Pinching the already-active 3D station probes/verifies it directly
          state.simulateProbeContact()
        } else {
          state.selectStation(stationIdx)
        }
      })
    }

    // 3. Instantiate floating 3D spatial target beacon
    this.instantiateGlbChild(this.beaconWrapper, MESH_SPECS.signalBeacon, "SignalBeaconMesh")

    // 4. Instantiate interactive 3D diagnostic logic probe
    this.instantiateGlbChild(this.probeWrapper, MESH_SPECS.logicProbe, "LogicProbeMesh")
    this.configureHitVolume(
      this.probeHitVolume,
      this.probeCollider,
      this.probeInteractable,
      MESH_SPECS.logicProbe,
      debugColliders
    )

    this.probeInteractable.onTriggerEnd.add((event) => {
      if (
        event.triggerType !== undefined &&
        (event.triggerType & InteractorTriggerType.Pinch) === 0
      ) {
        return
      }
      state.simulateProbeContact()
    })

    // 5. Subscribe to state changes to move the 3D beacon and snap the 3D probe
    this.syncBeaconToStation(state.activeStationIndex, true)

    state.onActiveStationIndexChangedEvent.add((newIdx: number) => {
      this.syncBeaconToStation(newIdx, false)
    })

    state.onProbeContactCountChangedEvent.add(() => {
      const activeSpec = STATION_SPECS[state.activeStationIndex]
      this.targetProbePos = activeSpec.probeSnapPosCm
      this.refs.probeAnchor.getTransform().setLocalPosition(this.targetProbePos)
    })

    state.onVerifiedCountChangedEvent.add((count: number) => {
      if (count === 0) {
        this.targetProbePos = new vec3(-6.0, 2.0, -104.0)
        this.refs.probeAnchor.getTransform().setLocalPosition(this.targetProbePos)
      }
    })

    this.animTime = beaconBobSpeed * 0.0
  }

  /**
   * Per-frame spatial interpolation for the 3D target reticle and probe.
   */
  update(dt: number, beaconBobSpeed: number): void {
    this.animTime += dt * Math.max(0.2, beaconBobSpeed)

    const beaconTr = this.refs.beaconAnchor.getTransform()
    const currentPos = beaconTr.getLocalPosition()
    const bobOffset = Math.sin(this.animTime * 3.0) * 0.8
    const desired = new vec3(
      this.targetBeaconPos.x,
      this.targetBeaconPos.y + bobOffset,
      this.targetBeaconPos.z
    )
    const nextPos = vec3.lerp(currentPos, desired, Math.min(1.0, dt * 8.0))
    beaconTr.setLocalPosition(nextPos)

    // Subtle yaw spin on the 3D beacon wrapper
    const spinQuat = quat.fromEulerAngles(0.0, this.animTime * 1.6, 0.0)
    this.beaconWrapper.getTransform().setLocalRotation(spinQuat)
  }

  getStationInteractable(index: number): Interactable {
    return this.stationNodes[index].interactable
  }

  getProbeInteractable(): Interactable {
    return this.probeInteractable
  }

  getBeaconWorldPosition(): vec3 {
    return this.refs.beaconAnchor.getTransform().getLocalPosition()
  }

  private syncBeaconToStation(stationIndex: number, immediate: boolean): void {
    const spec = STATION_SPECS[stationIndex] || STATION_SPECS[0]
    this.targetBeaconPos = spec.beaconPosCm
    if (immediate) {
      this.refs.beaconAnchor.getTransform().setLocalPosition(this.targetBeaconPos)
    }
  }

  private instantiateGlbChild(
    wrapper: SceneObject,
    spec: MeshAssetSpec,
    fallbackName: string
  ): SceneObject {
    wrapper.getTransform().setLocalPosition(vec3.zero())
    wrapper.getTransform().setLocalRotation(quat.quatIdentity())
    wrapper.getTransform().setLocalScale(vec3.one())

    if (spec.prefab) {
      const inst = spec.prefab.instantiate(wrapper)
      inst.getTransform().setLocalPosition(vec3.zero())
      inst.getTransform().setLocalRotation(quat.quatIdentity())
      inst.getTransform().setLocalScale(vec3.one())
      return inst
    }

    const fallback = global.scene.createSceneObject(fallbackName)
    fallback.setParent(wrapper)
    return fallback
  }

  private configureHitVolume(
    hitObj: SceneObject,
    collider: ColliderComponent,
    interactable: Interactable,
    spec: MeshAssetSpec,
    debugColliders: boolean
  ): void {
    const tr = hitObj.getTransform()
    tr.setLocalPosition(spec.centerOffsetCm)
    tr.setLocalRotation(quat.quatIdentity())
    tr.setLocalScale(vec3.one())

    const box = Shape.createBoxShape()
    // Ensure generous >= 6 cm pinch targets for hand tracking ergonomics (Habit 3)
    const halfExtents = new vec3(
      Math.max(4.0, spec.aabbCm.x * 0.5),
      Math.max(4.0, spec.aabbCm.y * 0.5),
      Math.max(4.0, spec.aabbCm.z * 0.5)
    )
    box.size = halfExtents
    collider.shape = box
    collider.fitVisual = false
    collider.debugDrawEnabled = debugColliders
    interactable.targetingMode = 3 // Direct | Indirect (Ray/Pinch)
  }
}
