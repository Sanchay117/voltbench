// Copyright 2026 VoltBench AR
// SPDX-License-Identifier: Apache-2.0

import {
  BG_LAB_AMBIENT_TRACK,
  SFX_BENCH_COMPLETE_TRACK,
  SFX_PROBE_LOCK_TRACK,
  SFX_THERMAL_ALERT_TRACK,
  SFX_UI_PINCH_TRACK
} from "./VoltBenchAssetManifest"
import {VoltBenchState} from "./VoltBenchState"

/**
 * Manages VoltBench spatial audio & interactive sound effects on Spectacles.
 * - Background music uses `Audio.PlaybackMode.LowPower`, `volume = 0.4`, `.play(-1)` infinite loop.
 * - Interactive SFX use `Audio.PlaybackMode.LowLatency`, `.play(1)` one-shot playback.
 */
export class VoltBenchAudioController {
  private readonly hostObject: SceneObject
  private bgMusicAudio!: AudioComponent
  private pinchSfxAudio!: AudioComponent
  private probeLockSfxAudio!: AudioComponent
  private thermalAlertSfxAudio!: AudioComponent
  private benchCompleteSfxAudio!: AudioComponent
  private ambientVolume: number = 0.4
  private sfxVolume: number = 0.85

  constructor(parent: SceneObject) {
    this.hostObject = global.scene.createSceneObject("VoltBenchAudioBank")
    this.hostObject.setParent(parent)

    // Phase 1 (onAwake): create AudioComponents only
    this.bgMusicAudio = this.hostObject.createComponent("Component.AudioComponent") as AudioComponent
    this.pinchSfxAudio = this.hostObject.createComponent("Component.AudioComponent") as AudioComponent
    this.probeLockSfxAudio = this.hostObject.createComponent("Component.AudioComponent") as AudioComponent
    this.thermalAlertSfxAudio = this.hostObject.createComponent("Component.AudioComponent") as AudioComponent
    this.benchCompleteSfxAudio = this.hostObject.createComponent("Component.AudioComponent") as AudioComponent
  }

  /**
   * Phase 2 (OnStartEvent): assign tracks, playback modes, volumes, and state listeners.
   */
  configure(state: VoltBenchState, ambientVolume: number, sfxVolume: number): void {
    this.ambientVolume = Math.max(0.0, Math.min(1.0, ambientVolume))
    this.sfxVolume = Math.max(0.0, Math.min(1.0, sfxVolume))

    // Ambient background music — LowPower mode, 0.3–0.5 volume, infinite loop (-1)
    this.bgMusicAudio.playbackMode = Audio.PlaybackMode.LowPower
    this.bgMusicAudio.audioTrack = BG_LAB_AMBIENT_TRACK
    this.bgMusicAudio.volume = this.ambientVolume
    this.bgMusicAudio.play(-1)

    // Interactive user-input SFX — LowLatency mode, one-shot (1)
    this.pinchSfxAudio.playbackMode = Audio.PlaybackMode.LowLatency
    this.pinchSfxAudio.audioTrack = SFX_UI_PINCH_TRACK
    this.pinchSfxAudio.volume = this.sfxVolume * 0.85

    this.probeLockSfxAudio.playbackMode = Audio.PlaybackMode.LowLatency
    this.probeLockSfxAudio.audioTrack = SFX_PROBE_LOCK_TRACK
    this.probeLockSfxAudio.volume = this.sfxVolume

    this.thermalAlertSfxAudio.playbackMode = Audio.PlaybackMode.LowLatency
    this.thermalAlertSfxAudio.audioTrack = SFX_THERMAL_ALERT_TRACK
    this.thermalAlertSfxAudio.volume = Math.min(1.0, this.sfxVolume * 1.05)

    this.benchCompleteSfxAudio.playbackMode = Audio.PlaybackMode.LowLatency
    this.benchCompleteSfxAudio.audioTrack = SFX_BENCH_COMPLETE_TRACK
    this.benchCompleteSfxAudio.volume = Math.min(1.0, this.sfxVolume * 1.05)

    // Subscribe to Channel A state events
    state.onActiveStationIndexChangedEvent.add(() => {
      this.playPinchSfx()
    })
    state.onFocusModeActiveChangedEvent.add(() => {
      this.playPinchSfx()
    })
    state.onProbeContactCountChangedEvent.add(() => {
      this.playProbeLockSfx()
    })
    state.onThermalAlertActiveChangedEvent.add((active: boolean) => {
      if (active) {
        this.playThermalAlertSfx()
      } else {
        this.playProbeLockSfx()
      }
    })
    state.onBenchCompleteChangedEvent.add((complete: boolean) => {
      if (complete) {
        this.playBenchCompleteSfx()
      }
    })
  }

  playPinchSfx(): void {
    if (this.pinchSfxAudio && this.pinchSfxAudio.audioTrack) {
      this.pinchSfxAudio.play(1)
    }
  }

  playProbeLockSfx(): void {
    if (this.probeLockSfxAudio && this.probeLockSfxAudio.audioTrack) {
      this.probeLockSfxAudio.play(1)
    }
  }

  playThermalAlertSfx(): void {
    if (this.thermalAlertSfxAudio && this.thermalAlertSfxAudio.audioTrack) {
      this.thermalAlertSfxAudio.play(1)
    }
  }

  playBenchCompleteSfx(): void {
    if (this.benchCompleteSfxAudio && this.benchCompleteSfxAudio.audioTrack) {
      this.benchCompleteSfxAudio.play(1)
    }
  }
}
