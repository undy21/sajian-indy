/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// audit.gs - Perekaman Jejak Audit (Audit Trail Log) untuk Modifikasi Sistem

/**
 * Perekaman logger terpadu untuk aksi edit dan delete krusial demi menjaga
 * akuntabilitas data multi-cabang.
 */
function logCriticalAction(userId, username, actionType, Details) {
  var activity = {
    id: "AL" + Date.now() + "_" + Math.random().toString(36).substring(4),
    userId: userId,
    username: username,
    action: actionType,
    ip: "GoogleAppsScriptServer",
    timestamp: new Date().toISOString(),
    details: Details
  };
  
  appendRowToSheet(SHEETS.ACTIVITY_LOG, activity);
  return activity;
}
