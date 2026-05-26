/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// product.gs - Manajemen CRUD Produk & SKU Multi-cabang

function addProductToGAS(productObj) {
  // Validasi sederhana
  if (!productObj.sku || !productObj.name || !productObj.branchId) {
    throw new Error("SKU, Nama, dan Cabang wajib diisi.");
  }
  
  // Periksa duplikasi SKU di dalam cabang yang sama
  var products = getSheetDataAsJson(SHEETS.PRODUCTS);
  for (var i = 0; i < products.length; i++) {
    if (products[i].sku === productObj.sku && products[i].branchId === productObj.branchId) {
      throw new Error("SKU " + productObj.sku + " sudah terdaftar di cabang tersebut.");
    }
  }
  
  appendRowToSheet(SHEETS.PRODUCTS, productObj);
  writeGASAuditLog("ADD_PRODUCT", "Menambahkan produk baru SKU: " + productObj.sku + " di Cabang " + productObj.branchId);
  return productObj;
}

function updateProductInGAS(productObj) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  if (!sheet) throw new Error("Sheet PRODUCTS tidak ditemukan.");
  
  var values = sheet.getDataRange().getValues();
  var skuCol = 0; // Kolom SKU
  var branchCol = 10; // Kolom branchId (Disesuaikan dengan urutan header template)
  
  // Cari baris berdasarkan SKU dan branchId
  var headers = values[0];
  var skuIdx = headers.indexOf("sku");
  var branchIdx = headers.indexOf("branchId");
  
  var targetRowIdx = -1;
  for (var i = 1; i < values.length; i++) {
    if (values[i][skuIdx] === productObj.sku && values[i][branchIdx] === productObj.branchId) {
      targetRowIdx = i + 1; // Baris dimulai dari index 1 (headers)
      break;
    }
  }
  
  if (targetRowIdx === -1) {
    throw new Error("Produk dengan SKU " + productObj.sku + " tidak ditemukan di cabang " + productObj.branchId);
  }
  
  // Tulis baris baru
  var rowValues = [];
  for (var j = 0; j < headers.length; j++) {
    var key = headers[j];
    var val = productObj[key] !== undefined ? productObj[key] : values[targetRowIdx-1][j];
    if (typeof val === "object" && val !== null) {
      val = JSON.stringify(val);
    }
    rowValues.push(val);
  }
  
  sheet.getRange(targetRowIdx, 1, 1, headers.length).setValues([rowValues]);
  writeGASAuditLog("UPDATE_PRODUCT", "Update detail produk SKU: " + productObj.sku);
  return productObj;
}

function deleteProductFromGAS(payload) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  if (!sheet) throw new Error("Sheet PRODUCTS tidak ditemukan.");
  
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  
  var skuIdx = headers.indexOf("sku");
  var branchIdx = headers.indexOf("branchId");
  
  var targetRowIdx = -1;
  for (var i = 1; i < values.length; i++) {
    if (values[i][skuIdx] === payload.sku && values[i][branchIdx] === payload.branchId) {
      targetRowIdx = i + 1;
      break;
    }
  }
  
  if (targetRowIdx === -1) {
    throw new Error("Produk tidak ditemukan.");
  }
  
  sheet.deleteRow(targetRowIdx);
  writeGASAuditLog("DELETE_PRODUCT", "Menghapus produk SKU: " + payload.sku + " cabang " + payload.branchId);
  return true;
}
