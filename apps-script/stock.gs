/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// stock.gs - Alur Mutasi Stok, Transfer Stok, dan Notifikasi Stok Kritis

function addStockLogToGAS(stockLogObj) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var pSheet = ss.getSheetByName(SHEETS.PRODUCTS);
  if (!pSheet) throw new Error("Sheet PRODUCTS tidak ditemukan.");
  
  // 1. Tulis log mutasi ke Sheet STOCKS
  stockLogObj.id = "ST" + Date.now();
  stockLogObj.date = new Date().toISOString();
  appendRowToSheet(SHEETS.STOCKS, stockLogObj);
  
  // 2. Mutasi Stok pada Sheet PRODUCTS
  var pValues = pSheet.getDataRange().getValues();
  var pHeaders = pValues[0];
  var skuIdx = pHeaders.indexOf("sku");
  var branchIdx = pHeaders.indexOf("branchId");
  var stockIdx = pHeaders.indexOf("stock");
  var minStockIdx = pHeaders.indexOf("minStock");
  var nameIdx = pHeaders.indexOf("name");
  
  var productRowIdx = -1;
  for (var i = 1; i < pValues.length; i++) {
    if (pValues[i][skuIdx] === stockLogObj.sku && pValues[i][branchIdx] === stockLogObj.branchId) {
      productRowIdx = i + 1;
      break;
    }
  }
  
  if (productRowIdx === -1) {
    throw new Error("Gagal melakukan mutasi: SKU " + stockLogObj.sku + " tidak terdaftar di cabang " + stockLogObj.branchId);
  }
  
  var currentStock = Number(pValues[productRowIdx-1][stockIdx]);
  var minStock = Number(pValues[productRowIdx-1][minStockIdx]);
  var prodName = pValues[productRowIdx-1][nameIdx];
  var nextStock = currentStock;
  
  if (stockLogObj.type === "IN") {
    nextStock += Number(stockLogObj.qty);
  } else if (stockLogObj.type === "OUT") {
    nextStock -= Number(stockLogObj.qty);
  } else if (stockLogObj.type === "ADJUST") {
    nextStock = Number(stockLogObj.qty);
  }
  
  // Update nilai kolom stock di baris sheet
  pSheet.getRange(productRowIdx, stockIdx + 1).setValue(nextStock);
  
  // 3. Periksa apakah stok menyentuh batas minimum kritis
  if (nextStock <= minStock) {
    var notifObj = {
      id: "NF" + Date.now(),
      type: "STOCK_OUT_OF_BOUNDS",
      title: "Peringatan Stok Kritis",
      message: "Stok produk '" + prodName + "' di cabang '" + stockLogObj.branchId + "' sisa " + nextStock + " pcs.",
      timestamp: new Date().toISOString(),
      read: ""
    };
    appendRowToSheet(SHEETS.NOTIFICATIONS, notifObj);
  }
  
  writeGASAuditLog("STOCK_MUTATION", "Stok " + stockLogObj.type + " SKU: " + stockLogObj.sku + " Qty: " + stockLogObj.qty);
  return stockLogObj;
}
