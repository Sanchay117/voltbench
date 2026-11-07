// Copyright 2026 VoltBench AR
// SPDX-License-Identifier: Apache-2.0

/**
 * Central asset manifest for VoltBench.
 * All paths are relative to Assets/Scripts/ and verified on disk.
 * Mesh AABB sizes and center offsets come directly from `analyze_glb.js --aabb`.
 */

export interface MeshAssetSpec {
  prefab: ObjectPrefab
  aabbCm: vec3
  centerOffsetCm: vec3
}

export const WORKBENCH_PCB_PREFAB: ObjectPrefab = requireAsset(
  "../GeneratedMeshes/workbench_pcb.glb"
) as ObjectPrefab

export const STATION_REGULATOR_PREFAB: ObjectPrefab = requireAsset(
  "../GeneratedMeshes/station_regulator.glb"
) as ObjectPrefab

export const STATION_MCU_PREFAB: ObjectPrefab = requireAsset(
  "../GeneratedMeshes/station_mcu.glb"
) as ObjectPrefab

export const STATION_THERMAL_PREFAB: ObjectPrefab = requireAsset(
  "../GeneratedMeshes/station_thermal.glb"
) as ObjectPrefab

export const LOGIC_PROBE_PREFAB: ObjectPrefab = requireAsset(
  "../GeneratedMeshes/logic_probe.glb"
) as ObjectPrefab

export const SIGNAL_BEACON_PREFAB: ObjectPrefab = requireAsset(
  "../GeneratedMeshes/signal_beacon.glb"
) as ObjectPrefab

export const BG_LAB_AMBIENT_TRACK: AudioTrackAsset = requireAsset(
  "../GeneratedSFX/bg_lab_ambient.wav"
) as AudioTrackAsset

export const SFX_UI_PINCH_TRACK: AudioTrackAsset = requireAsset(
  "../GeneratedSFX/sfx_ui_pinch.wav"
) as AudioTrackAsset

export const SFX_PROBE_LOCK_TRACK: AudioTrackAsset = requireAsset(
  "../GeneratedSFX/sfx_probe_lock.wav"
) as AudioTrackAsset

export const SFX_THERMAL_ALERT_TRACK: AudioTrackAsset = requireAsset(
  "../GeneratedSFX/sfx_thermal_alert.wav"
) as AudioTrackAsset

export const SFX_BENCH_COMPLETE_TRACK: AudioTrackAsset = requireAsset(
  "../GeneratedSFX/sfx_bench_complete.wav"
) as AudioTrackAsset

export const ICON_BOLT: Texture = requireAsset("../Icons/bolt.png") as Texture
export const ICON_WARNING: Texture = requireAsset("../Icons/warning.png") as Texture
export const ICON_VISIBILITY: Texture = requireAsset("../Icons/visibility.png") as Texture
export const ICON_REFRESH: Texture = requireAsset("../Icons/refresh.png") as Texture
export const ICON_CHECK_CIRCLE: Texture = requireAsset("../Icons/check_circle.png") as Texture
export const ICON_SENSORS: Texture = requireAsset("../Icons/sensors.png") as Texture

export const IMAGE_MATERIAL: Material = requireAsset(
  "../Materials/ImageMaterial.mat"
) as Material

export const MESH_SPECS: {[key: string]: MeshAssetSpec} = {
  workbenchPcb: {
    prefab: WORKBENCH_PCB_PREFAB,
    aabbCm: new vec3(38.0, 6.0, 24.0),
    centerOffsetCm: new vec3(0.0, 3.0, 0.0)
  },
  stationRegulator: {
    prefab: STATION_REGULATOR_PREFAB,
    aabbCm: new vec3(10.0, 13.5, 10.0),
    centerOffsetCm: new vec3(0.0, 6.8, 0.0)
  },
  stationMcu: {
    prefab: STATION_MCU_PREFAB,
    aabbCm: new vec3(10.0, 14.0, 10.0),
    centerOffsetCm: new vec3(0.0, 7.0, 0.0)
  },
  stationThermal: {
    prefab: STATION_THERMAL_PREFAB,
    aabbCm: new vec3(10.0, 16.0, 10.0),
    centerOffsetCm: new vec3(0.0, 8.0, 0.0)
  },
  logicProbe: {
    prefab: LOGIC_PROBE_PREFAB,
    aabbCm: new vec3(5.0, 17.0, 5.0),
    centerOffsetCm: new vec3(-0.5, 8.5, -0.5)
  },
  signalBeacon: {
    prefab: SIGNAL_BEACON_PREFAB,
    aabbCm: new vec3(5.0, 6.0, 5.0),
    centerOffsetCm: new vec3(-0.5, 3.0, -0.5)
  }
}
