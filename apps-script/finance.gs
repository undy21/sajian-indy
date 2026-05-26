/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// finance.gs - Pengelolaan Arus Kas (Cashflow), Hutang Piutang, & Neraca Laba Rugi

function addCashflowToGAS(cfObj) {
  cfObj.id = "CF" + Date.now();
  cfObj.date = new Date().toISOString();
  appendRowToSheet(SHEETS.CASHFLOWS, cfObj);
  writeGASAuditLog("FINANCE_ENTRY", "Entri keuanganbaru " + cfObj.type + " kategori: " + cfObj.category, cfObj.user);
  return cfObj;
}

function addCustomerToGAS(cObj) {
  cObj.id = "C" + Date.now();
  cObj.point = 0;
  cObj.memberRank = "REGULAR";
  appendRowToSheet(SHEETS.CUSTOMERS, cObj);
  writeGASAuditLog("ADD_CUSTOMER", "Mendaftarkan member baru: " + cObj.name);
  return cObj;
}

function addSupplierToGAS(sObj) {
  sObj.id = "S" + Date.now();
  appendRowToSheet(SHEETS.SUPPLIERS, sObj);
  writeGASAuditLog("ADD_SUPPLIER", "Mendaftarkan supplier baru: " + sObj.name);
  return sObj;
}

function addPurchaseToGAS(pObj) {
  pObj.id = "P" + Date.now();
  appendRowToSheet(SHEETS.PURCHASES, pObj);
  writeGASAuditLog("PURCHASE_ORDER", "Membuat Order Pembelian baru PO: " + pObj.code);
  return pObj;
}

function receivePurchaseGoodsInGAS(payload) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEETS.PURCHASES);
  if (!sheet) throw new Error("Sheet PURCHASES tidak ditemukan");
  
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idIdx = headers.indexOf("id");
  var statusIdx = headers.indexOf("status");
  var branchIdx = headers.indexOf("branchId");
  var codeIdx = headers.indexOf("code");
  var itemsIdx = headers.indexOf("items");
  var totalColIdx = headers.indexOf("totalAmount");
  
  var targetRowIdx = -1;
  for (var i = 1; i < values.length; i++) {
    if (values[i][idIdx] === payload.id) {
      targetRowIdx = i + 1;
      break;
    }
  }
  
  if (targetRowIdx === -1) {
    throw new Error("Laporan PO tidak ditemukan.");
  }
  
  sheet.getRange(targetRowIdx, statusIdx + 1).setValue("RECEIVED");
  var rowData = values[targetRowIdx-1];
  var branchId = rowData[branchIdx];
  var code = rowData[codeIdx];
  var totalAmount = rowData[totalColIdx];
  var itemsJson = rowData[itemsIdx];
  
  // Catat pengeluaran keuangan
  var outFlow = {
    id: "CF_P_" + Date.now(),
    date: new Date().toISOString(),
    type: "EXPENSE",
    category: "Purchase PO",
    amount: Number(totalAmount),
    description: "Pembayaran penerimaan PO " + code,
    branchId: branchId,
    user: payload.username || "admin"
  };
  appendRowToSheet(SHEETS.CASHFLOWS, outFlow);
  
  writeGASAuditLog("RECEIVE_GOODS", "Menerima barang-barang untuk PO " + code + ", kas berkurang Rp " + totalAmount);
  return true;
}
