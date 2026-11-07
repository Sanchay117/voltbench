// Copyright 2026 VoltBench AR
// SPDX-License-Identifier: Apache-2.0

/**
 * Resolves the authored scene hierarchy (`UI`, `Anchors`, `Content`, `Placeholders`)
 * under the root experience SceneObject, creating any missing nodes at unit scale.
 */
export class VoltBenchSceneRefs {
  readonly root: SceneObject
  readonly uiGroup: SceneObject
  readonly dockPanelAnchor: SceneObject
  readonly inspectorPanelAnchor: SceneObject
  readonly anchorsGroup: SceneObject
  readonly workbenchAnchor: SceneObject
  readonly stationAAnchor: SceneObject
  readonly stationBAnchor: SceneObject
  readonly stationCAnchor: SceneObject
  readonly beaconAnchor: SceneObject
  readonly probeAnchor: SceneObject
  readonly contentGroup: SceneObject
  readonly placeholdersGroup: SceneObject

  constructor(root: SceneObject) {
    this.root = root
    this.uiGroup = this.findOrCreateChild(root, "UI")
    this.dockPanelAnchor = this.findOrCreateChild(this.uiGroup, "DockPanel")
    this.inspectorPanelAnchor = this.findOrCreateChild(this.uiGroup, "InspectorPanel")

    this.anchorsGroup = this.findOrCreateChild(root, "Anchors")
    this.workbenchAnchor = this.findOrCreateChild(this.anchorsGroup, "WorkbenchAnchor")
    this.stationAAnchor = this.findOrCreateChild(this.anchorsGroup, "StationAAnchor")
    this.stationBAnchor = this.findOrCreateChild(this.anchorsGroup, "StationBAnchor")
    this.stationCAnchor = this.findOrCreateChild(this.anchorsGroup, "StationCAnchor")
    this.beaconAnchor = this.findOrCreateChild(this.anchorsGroup, "BeaconAnchor")
    this.probeAnchor = this.findOrCreateChild(this.anchorsGroup, "ProbeAnchor")

    this.contentGroup = this.findOrCreateChild(root, "Content")
    this.placeholdersGroup = this.findOrCreateChild(root, "Placeholders")
  }

  configureDefaultTransforms(): void {
    // All anchors stay inside the z = -104 to -110 cm SPECS focal zone (53 x 77 cm usable FOV)
    this.setTransformCm(this.dockPanelAnchor, new vec3(-21.0, -1.0, -110.0), new vec3(0.0, 8.0, 0.0))
    this.setTransformCm(this.inspectorPanelAnchor, new vec3(21.0, -1.0, -110.0), new vec3(0.0, -8.0, 0.0))

    this.setTransformCm(this.workbenchAnchor, new vec3(0.0, -14.0, -110.0), vec3.zero())
    this.setTransformCm(this.stationAAnchor, new vec3(-12.0, -10.0, -108.0), vec3.zero())
    this.setTransformCm(this.stationBAnchor, new vec3(0.0, -10.0, -108.0), vec3.zero())
    this.setTransformCm(this.stationCAnchor, new vec3(12.0, -10.0, -108.0), vec3.zero())
    this.setTransformCm(this.beaconAnchor, new vec3(-12.0, 2.0, -108.0), vec3.zero())
    this.setTransformCm(this.probeAnchor, new vec3(-6.0, 2.0, -104.0), vec3.zero())
  }

  private findOrCreateChild(parent: SceneObject, name: string): SceneObject {
    const count = parent.getChildrenCount()
    for (let i = 0; i < count; i++) {
      const child = parent.getChild(i)
      if (child.name === name) {
        return child
      }
    }
    const created = global.scene.createSceneObject(name)
    created.setParent(parent)
    return created
  }

  private setTransformCm(obj: SceneObject, posCm: vec3, eulerDeg: vec3): void {
    const tr = obj.getTransform()
    tr.setLocalPosition(posCm)
    tr.setLocalRotation(quat.fromEulerAngles(
      eulerDeg.x * MathUtils.DegToRad,
      eulerDeg.y * MathUtils.DegToRad,
      eulerDeg.z * MathUtils.DegToRad
    ))
    tr.setLocalScale(vec3.one())
  }
}
