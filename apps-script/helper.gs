/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// helper.gs - Utilitas Pembantu & Endpoint Inti REST API

function doGet(e) {
  return HtmlService.createHtmlOutput("<h1>Enterprise POS REST Gateway is Live</h1><p>Apps Script is responding in POST mode.</p>");
}

function doPost(e) {
  var responseHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  
  try {
    var rawData = e.postData.contents;
    var request = JSON.parse(rawData);
    var action = request.action;
    var payload = request.payload;
    
    // Dispatch Action ke service yang tepat
    var result = routeRequest(action, payload);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      data: result
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function routeRequest(action, payload) {
  switch (action) {
    // Auth & Users
    case "login":
      return handleGASLogin(payload);
    case "getUsers":
      return getSheetDataAsJson(SHEETS.USERS);
      
    // Products
    case "getProducts":
      return getSheetDataAsJson(SHEETS.PRODUCTS);
    case "addProduct":
      return addProductToGAS(payload);
    case "updateProduct":
      return updateProductInGAS(payload);
    case "deleteProduct":
      return deleteProductFromGAS(payload);
      
    // Customers & Suppliers
    case "getCustomers":
      return getSheetDataAsJson(SHEETS.CUSTOMERS);
    case "addCustomer":
      return addCustomerToGAS(payload);
    case "getSuppliers":
      return getSheetDataAsJson(SHEETS.SUPPLIERS);
    case "addSupplier":
      return addSupplierToGAS(payload);
      
    // Stocks
    case "getStocks":
      return getSheetDataAsJson(SHEETS.STOCKS);
    case "addStockLog":
      return addStockLogToGAS(payload);
      
    // Purchases
    case "getPurchases":
      return getSheetDataAsJson(SHEETS.PURCHASES);
    case "addPurchase":
      return addPurchaseToGAS(payload);
    case "receivePurchase":
      return receivePurchaseGoodsInGAS(payload);
      
    // Transactions
    case "getTransactions":
      return getSheetDataAsJson(SHEETS.TRANSACTIONS);
    case "getTransactionItems":
      return getSheetDataAsJson(SHEETS.TRANSACTION_ITEMS);
    case "addTransaction":
      return addTransactionToGAS(payload);
      
    // Finance
    case "getCashflows":
      return getSheetDataAsJson(SHEETS.CASHFLOWS);
    case "addCashflow":
      return addCashflowToGAS(payload);
      
    // Utilities
    case "getAuditLogs":
      return getSheetDataAsJson(SHEETS.ACTIVITY_LOG);
    case "getNotifications":
      return getSheetDataAsJson(SHEETS.NOTIFICATIONS);
      
    default:
      throw new Error("Action " + action + " tidak didukung atau tidak ditemukan.");
  }
}

// Mengambil Data Sheet sebagai Array of JSON Objects
function getSheetDataAsJson(sheetName) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length <= 1) return [];
  
  var headers = values[0];
  var list = [];
  
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      // Format Tanggal jika bernilai tipe Date
      if (val instanceof Date) {
        val = val.toISOString();
      }
      // Khusus untuk field items berupa stringified JSON
      if (headers[j] === "items" && typeof val === "string" && val.startsWith("[")) {
        try {
          val = JSON.parse(val);
        } catch(e) {}
      }
      obj[headers[j]] = val;
    }
    list.push(obj);
  }
  return list;
}

// Menambahkan baris ke sheet
function appendRowToSheet(sheetName, itemObj) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet " + sheetName + " tidak ditemukan.");
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowValues = [];
  
  for (var j = 0; j < headers.length; j++) {
    var key = headers[j];
    var val = itemObj[key];
    if (val === undefined || val === null) {
      val = "";
    } else if (typeof val === "object") {
      val = JSON.stringify(val);
    }
    rowValues.push(val);
  }
  
  sheet.appendRow(rowValues);
  return itemObj;
}

// Menulis log aktivitas langsung di sistem
function writeGASAuditLog(action, details, userId, username) {
  var logItem = {
    id: "AL" + Date.now(),
    userId: userId || "SYSTEM",
    username: username || "GAS_SERVICE",
    action: action,
    ip: "GoogleAppsScript",
    timestamp: new Date().toISOString(),
    details: details
  };
  appendRowToSheet(SHEETS.ACTIVITY_LOG, logItem);
}
