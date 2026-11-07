// Copyright 2026 VoltBench AR
// SPDX-License-Identifier: Apache-2.0

import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"

export interface StationDiagnosticSpec {
  index: number
  code: string
  shortTitle: string
  fullName: string
  pinoutLabel: string
  expectedSpec: string
  IdleReading: string
  verifiedReading: string
  faultReading: string
  coachInstruction: string
  worldPosCm: vec3
  beaconPosCm: vec3
  probeSnapPosCm: vec3
}

export const STATION_SPECS: StationDiagnosticSpec[] = [
  {
    index: 0,
    code: "ST-A",
    shortTitle: "ST-A: 5V BUCK",
    fullName: "Station A: 5V Buck Regulator",
    pinoutLabel: "TP1: VOUT_5V0 / L1 INDUCTOR",
    expectedSpec: "Target: 5.00 V ±2% (Ripple < 25 mV)",
    IdleReading: "AWAITING PROBE ON TP1...",
    verifiedReading: "5.02 V DC | RIPPLE 11 mV [PASS]",
    faultReading: "LOW RAILFAULT",
    coachInstruction: "Touch probe to front gold pad TP1 to verify 5V rail stability.",
    worldPosCm: new vec3(-12.0, -10.0, -108.0),
    beaconPosCm: new vec3(-12.0, 2.0, -108.0),
    probeSnapPosCm: new vec3(-12.0, -4.0, -104.5)
  },
  {
    index: 1,
    code: "ST-B",
    shortTitle: "ST-B: MCU BUS",
    fullName: "Station B: 48 MHz MCU Logic Bus",
    pinoutLabel: "TP2: SYS_CLK / SPI_MOSI PIN 14",
    expectedSpec: "Target: 48.00 MHz ±50 ppm @ 3.3V CMOS",
    IdleReading: "AWAITING PROBE ON TP2...",
    verifiedReading: "48.00 MHz | DUTY 50.1% [SYNC]",
    faultReading: "CLOCK JITTER",
    coachInstruction: "Hold probe on pin-14 bus header to lock 48 MHz clock waveform.",
    worldPosCm: new vec3(0.0, -10.0, -108.0),
    beaconPosCm: new vec3(0.0, 2.0, -108.0),
    probeSnapPosCm: new vec3(0.0, -4.0, -104.5)
  },
  {
    index: 2,
    code: "ST-C",
    shortTitle: "ST-C: THERMAL",
    fullName: "Station C: MOSFET Load & Heatsink",
    pinoutLabel: "TP3: Q4 DRAIN / NTC THERMISTOR",
    expectedSpec: "Target: < 65.0 °C @ 2.4 A Load",
    IdleReading: "AWAITING PROBE ON TP3...",
    verifiedReading: "41.8 °C | 2.40 A LOAD [NOMINAL]",
    faultReading: "94.6 °C OVERHEAT! [VENT/PROBE ST-C]",
    coachInstruction: "Probe TP3 thermistor pad to calibrate gate bias & clear heat spike.",
    worldPosCm: new vec3(12.0, -10.0, -108.0),
    beaconPosCm: new vec3(12.0, 2.5, -108.0),
    probeSnapPosCm: new vec3(12.0, -4.0, -104.5)
  }
]

/**
 * Channel A event-bus state container for VoltBench.
 * Every state field exposes a `setX()` mutator that fires `onXChanged` only on change.
 */
export class VoltBenchState {
  activeStationIndex: number = 0
  private onActiveStationIndexChanged = new Event<number>()
  public readonly onActiveStationIndexChangedEvent =
    this.onActiveStationIndexChanged.publicApi()

  verifiedCount: number = 0
  private onVerifiedCountChanged = new Event<number>()
  public readonly onVerifiedCountChangedEvent =
    this.onVerifiedCountChanged.publicApi()

  benchComplete: boolean = false
  private onBenchCompleteChanged = new Event<boolean>()
  public readonly onBenchCompleteChangedEvent =
    this.onBenchCompleteChanged.publicApi()

  thermalAlertActive: boolean = false
  private onThermalAlertActiveChanged = new Event<boolean>()
  public readonly onThermalAlertActiveChangedEvent =
    this.onThermalAlertActiveChanged.publicApi()

  focusModeActive: boolean = false
  private onFocusModeActiveChanged = new Event<boolean>()
  public readonly onFocusModeActiveChangedEvent =
    this.onFocusModeActiveChanged.publicApi()

  probeContactCount: number = 0
  private onProbeContactCountChanged = new Event<number>()
  public readonly onProbeContactCountChangedEvent =
    this.onProbeContactCountChanged.publicApi()

  statusBannerText: string = "EYES-UP COACH READY — SELECT OR PROBE STATION A"
  private onStatusBannerTextChanged = new Event<string>()
  public readonly onStatusBannerTextChangedEvent =
    this.onStatusBannerTextChanged.publicApi()

  stationTelemetryText: string = STATION_SPECS[0].IdleReading
  private onStationTelemetryTextChanged = new Event<string>()
  public readonly onStationTelemetryTextChangedEvent =
    this.onStationTelemetryTextChanged.publicApi()

  stationVerified: boolean[] = [false, false, false]

  setActiveStationIndex(val: number): void {
    const clamped = Math.max(0, Math.min(STATION_SPECS.length - 1, Math.floor(val)))
    if (this.activeStationIndex === clamped) return
    this.activeStationIndex = clamped
    this.onActiveStationIndexChanged.invoke(this.activeStationIndex)
    this.refreshTelemetryStrings()
  }

  setVerifiedCount(val: number): void {
    if (this.verifiedCount === val) return
    this.verifiedCount = val
    this.onVerifiedCountChanged.invoke(this.verifiedCount)
  }

  setBenchComplete(val: boolean): void {
    if (this.benchComplete === val) return
    this.benchComplete = val
    this.onBenchCompleteChanged.invoke(this.benchComplete)
  }

  setThermalAlertActive(val: boolean): void {
    if (this.thermalAlertActive === val) return
    this.thermalAlertActive = val
    this.onThermalAlertActiveChanged.invoke(this.thermalAlertActive)
    this.refreshTelemetryStrings()
  }

  setFocusModeActive(val: boolean): void {
    if (this.focusModeActive === val) return
    this.focusModeActive = val
    this.onFocusModeActiveChanged.invoke(this.focusModeActive)
    this.refreshTelemetryStrings()
  }

  setProbeContactCount(val: number): void {
    if (this.probeContactCount === val) return
    this.probeContactCount = val
    this.onProbeContactCountChanged.invoke(this.probeContactCount)
  }

  setStatusBannerText(val: string): void {
    if (this.statusBannerText === val) return
    this.statusBannerText = val
    this.onStatusBannerTextChanged.invoke(this.statusBannerText)
  }

  setStationTelemetryText(val: string): void {
    if (this.stationTelemetryText === val) return
    this.stationTelemetryText = val
    this.onStationTelemetryTextChanged.invoke(this.stationTelemetryText)
  }

  getActiveSpec(): StationDiagnosticSpec {
    return STATION_SPECS[this.activeStationIndex]
  }

  isStationVerified(index: number): boolean {
    return Boolean(this.stationVerified[index])
  }

  selectStation(index: number): void {
    const clamped = Math.max(0, Math.min(STATION_SPECS.length - 1, Math.floor(index)))
    this.setActiveStationIndex(clamped)
    this.refreshTelemetryStrings()
  }

  /**
   * Stand-in for physical BLE multimeter probe continuity or 3D probe contact.
   * Locks reading on the currently active station, clears any active thermal fault on Station C,
   * and auto-advances the 3D spatial beacon to the next unverified station.
   */
  simulateProbeContact(): void {
    const idx = this.activeStationIndex
    if (idx === 2 && this.thermalAlertActive) {
      this.setThermalAlertActive(false)
    }

    if (!this.stationVerified[idx]) {
      this.stationVerified[idx] = true
    }

    const totalVerified = this.stationVerified.filter(Boolean).length
    this.setVerifiedCount(totalVerified)
    this.setProbeContactCount(this.probeContactCount + 1)

    if (totalVerified >= STATION_SPECS.length) {
      this.setBenchComplete(true)
      this.refreshTelemetryStrings()
      return
    }

    // Auto-advance spatial beacon to the next unverified station (Habit 2: recede when done)
    for (let offset = 1; offset < STATION_SPECS.length; offset++) {
      const candidate = (idx + offset) % STATION_SPECS.length
      if (!this.stationVerified[candidate]) {
        this.setActiveStationIndex(candidate)
        break
      }
    }
    this.refreshTelemetryStrings()
  }

  /**
   * Stand-in for off-axis IR thermal runaway on Station C (+12 cm right).
   * Fires spatial alert chime and illuminates the in-FOV directional arrow cue.
   */
  triggerThermalSpike(): void {
    this.stationVerified[2] = false
    const totalVerified = this.stationVerified.filter(Boolean).length
    this.setVerifiedCount(totalVerified)
    this.setBenchComplete(false)
    this.setThermalAlertActive(true)
    this.refreshTelemetryStrings()
  }

  toggleFocusMode(): void {
    this.setFocusModeActive(!this.focusModeActive)
  }

  resetBench(): void {
    this.stationVerified = [false, false, false]
    this.setThermalAlertActive(false)
    this.setBenchComplete(false)
    this.setVerifiedCount(0)
    this.setActiveStationIndex(0)
    this.refreshTelemetryStrings()
  }

  refreshTelemetryStrings(): void {
    const spec = STATION_SPECS[this.activeStationIndex]
    if (this.thermalAlertActive) {
      this.setStatusBannerText("!! THERMAL SPIKE: LOOK RIGHT [STATION C >>] !!")
      if (this.activeStationIndex === 2) {
        this.setStationTelemetryText(STATION_SPECS[2].faultReading)
      } else {
        this.setStationTelemetryText(
          `${spec.code} HOLD | OFF-AXIS ALERT ON ST-C (94.6 °C) >>`
        )
      }
      return
    }

    if (this.benchComplete) {
      this.setStatusBannerText("BENCH DIAGNOSTICS COMPLETE (3/3 STATIONS PASS)")
      this.setStationTelemetryText(spec.verifiedReading)
      return
    }

    if (this.focusModeActive) {
      this.setStatusBannerText(
        `FOCUS MODE: ${spec.code} ACTIVE (${this.verifiedCount}/3 PASS)`
      )
    } else {
      this.setStatusBannerText(
        `ACTIVE: ${spec.fullName.toUpperCase()} (${this.verifiedCount}/3 PASS)`
      )
    }

    if (this.stationVerified[this.activeStationIndex]) {
      this.setStationTelemetryText(spec.verifiedReading)
    } else {
      this.setStationTelemetryText(spec.IdleReading)
    }
  }
}
