/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// auth.gs - Layanan Autentikasi dan Manajemen Sesi Multi-role POS

function handleGASLogin(payload) {
  var username = payload.username;
  var password = payload.password; // Dalam produksi, disarankan password telah terenkripsi di client-side
  
  var users = getSheetDataAsJson(SHEETS.USERS);
  var user = null;
  
  for (var i = 0; i < users.length; i++) {
    if (users[i].username === username && users[i].password === password) {
      user = users[i];
      break;
    }
  }
  
  if (!user) {
    throw new Error("Username atau password salah.");
  }
  
  if (!user.active) {
    throw new Error("Akun Anda telah dinonaktifkan oleh administrator.");
  }
  
  // Format token sesi acak sederhana
  var sessionToken = Utilities.base64Encode(Utilities.computeHmacSha256Signature(username + Date.now(), TOKEN_SECRET));
  
  writeGASAuditLog("LOGIN_SUCCESS", "User " + username + " berhasil login ke sistem", user.id, username);
  
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    branchId: user.branchId,
    token: sessionToken
  };
}
