// Copyright 2026 VoltBench AR
// SPDX-License-Identifier: Apache-2.0

import {LeafRunner} from "Leaf.lspkg/index"
import "./VoltBenchLeafScenario"

/**
 * Root LEAF test runner component attached to the `LeafIndex` SceneObject.
 */
@component
export class LeafIndex extends BaseScriptComponent {
  onAwake(): void {
    new LeafRunner(this)
  }
}
