// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

/**
 * Gateway WebSocket client for ZeroClaw.
 * Phase 2 will implement real WebSocket connection.
 * Currently exports config helpers and placeholder connection logic.
 */

export function getGatewayConfig() {
  return {
    url: process.env.GATEWAY_WS_URL || "ws://localhost:18789",
    token: process.env.GATEWAY_TOKEN || "",
  };
}

export function getMissionControlUrl() {
  return process.env.MC_API_URL || "http://localhost:4000";
}
