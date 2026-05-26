/**
 * =========================================================================
 * NUSANTARA POS - DATABASE & BACKEND SYSTEM GOOGLE APPS SCRIPT (UNIFIED CODE)
 * =========================================================================
 * 
 * SCRIPT INI ADALAH GABUNGAN SELURUH MODUL BACKEND UNTUK GOOGLE SHEETS POS.
 * Cukup salin seluruh kode di bawah ini, tempelkan ke project Google Apps Script Anda (Code.gs),
 * masukkan ID Spreadsheet Anda pada variabel SPREADSHEET_ID, lalu deploy sebagai Web App.
 */

// ==========================================
// 1. CONFIGURATION (config.gs)
// ==========================================

// GANTI ID DI BAWAH INI DENGAN ID GOOGLE SHEET ANDA!
// ID dapat diambil dari URL browser: https://docs.google.com/spreadsheets/d/[ID_SPREADSHEET_ANDA]/edit
var SPREADSHEET_ID = "MASUKKAN_ID_SPREADSHEET_ANDA_DI_SINI";

var TOKEN_SECRET = "EnterprisePOS_GAS_Secret_Key_2026";
var RATE_LIMIT_WINDOW_MS = 60000; // 1 menit
var RATE_LIMIT_MAX_REQUESTS = 100;

// Whitelist domain untuk CORS security
var COR_DOMAIN_WHITELIST = [
  "*" // Ubah ke domain produksi Vercel/Cloud Run Anda demi keamanan optimal jika perlu
];

// Nama-nama sheet utama
var SHEETS = {
  USERS: "USERS",
  PRODUCTS: "PRODUCTS",
  STOCKS: "STOCKS",
  TRANSACTIONS: "TRANSACTIONS",
  TRANSACTION_ITEMS: "TRANSACTION_ITEMS",
  CUSTOMERS: "CUSTOMERS",
  SUPPLIERS: "SUPPLIERS",
  PURCHASES: "PURCHASES",
  CASHFLOWS: "CASHFLOWS",
  ACTIVITY_LOG: "ACTIVITY_LOG",
  NOTIFICATIONS: "NOTIFICATIONS"
};

/**
 * Inisialisasi awal database Sheets saat pertama kali digunakan.
 * Jalankan fungsi ini pertamakali di Google Apps Script (pilih fungsi 'initializePOSDatabase' lalu klik 'Run')
 * untuk otomatis membuat lembar sheets beserta header kolom database yang diperlukan!
 */
function initializePOSDatabase() {
  var ss;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (err) {
    throw new Error("Gagal membuka Spreadsheet. Pastikan ID SPREADSHEET_ID sudah dimasukkan dengan benar dan Anda memiliki izin akses: " + err.toString());
  }
  
  var sheetTemplates = {
    "USERS": ["id", "username", "password", "name", "role", "branchId", "active"],
    "PRODUCTS": ["sku", "barcode", "name", "description", "category", "buyPrice", "sellPrice", "memberPrice", "stock", "minStock", "branchId", "image", "active"],
    "STOCKS": ["id", "sku", "branchId", "type", "qty", "notes", "date", "user"],
    "TRANSACTIONS": ["id", "date", "totalAmount", "discountAmount", "taxAmount", "finalAmount", "paymentMethod", "changeAmount", "customerId", "branchId", "cashierId", "cashierName"],
    "TRANSACTION_ITEMS": ["id", "transactionId", "sku", "productName", "price", "qty", "total", "discount"],
    "CUSTOMERS": ["id", "name", "phone", "email", "point", "memberRank", "notes"],
    "SUPPLIERS": ["id", "name", "contact", "phone", "address"],
    "PURCHASES": ["id", "code", "supplierId", "supplierName", "date", "totalAmount", "status", "branchId", "items"],
    "CASHFLOWS": ["id", "date", "type", "category", "amount", "description", "branchId", "user"],
    "ACTIVITY_LOG": ["id", "userId", "username", "action", "ip", "timestamp", "details"],
    "NOTIFICATIONS": ["id", "type", "title", "message", "timestamp", "read"]
  };
  
  // Buat sheet jika belum ada
  for (var name in sheetTemplates) {
    var s = ss.getSheetByName(name);
    if (!s) {
      s = ss.insertSheet(name);
      s.appendRow(sheetTemplates[name]);
      Logger.log("Sheet " + name + " berhasil dibuat.");
    }
  }

  // Tambahkan user default admin/owner jika sheet USERS kosong
  var userSheet = ss.getSheetByName("USERS");
  if (userSheet && userSheet.getLastRow() === 1) {
    userSheet.appendRow(["u1", "admin", "admin", "Super Admin", "ADMIN", "b1", "true"]);
    userSheet.appendRow(["u2", "owner", "owner", "ndy (Owner)", "OWNER", "all", "true"]);
    userSheet.appendRow(["u3", "kasir1", "kasir1", "Siti (Kasir Jakarta)", "CASHIER", "b1", "true"]);
    userSheet.appendRow(["u4", "kasir2", "kasir2", "Andi (Kasir Bandung)", "CASHIER", "b2", "true"]);
    Logger.log("Default User akun demo berhasil dibuat.");
  }
}

// ==========================================
// 2. HTTP ENDPOINTS & ROUTER (helper.gs & routing)
// ==========================================

function doGet(e) {
  return HtmlService.createHtmlOutput(
    "<h1>Nusantara POS Google Sheets REST API Gateway</h1>" +
    "<p>Status: <span style='color: green; font-weight: bold;'>LIVE & SECURE</span></p>" +
    "<p>Backend ini telah dikonfigurasi menggunakan JSON RPC untuk mengelola transaksi multi-cabang secara persistent.</p>" +
    "<p><i>Pastikan Anda memanggil API ini menggunakan metode HTTP POST.</i></p>"
  );
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
      // Khusus untuk field items berupa stringified JSON (untuk tabel PO)
      if (headers[j] === "items" && typeof val === "string" && val.startsWith("[")) {
        try {
          val = JSON.parse(val);
        } catch(e) {}
      }
      
      // Mengubah string true/false menjadi boolean riil untuk kecocokan tipe data di frontend
      if (val === "true") val = true;
      if (val === "false") val = false;
      
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
    rowValues.push(val.toString());
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


// ==========================================
// 3. AUTH SERVICE (auth.gs)
// ==========================================

function handleGASLogin(payload) {
  var username = payload.username;
  var password = payload.password;
  
  var users = getSheetDataAsJson(SHEETS.USERS);
  var user = null;
  
  for (var i = 0; i < users.length; i++) {
    if (users[i].username.toLowerCase() === username.toLowerCase() && users[i].password === password) {
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


// ==========================================
// 4. PRODUCT SERVICE (product.gs)
// ==========================================

function addProductToGAS(productObj) {
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
  var headers = values[0];
  var skuIdx = headers.indexOf("sku");
  var branchIdx = headers.indexOf("branchId");
  
  var targetRowIdx = -1;
  for (var i = 1; i < values.length; i++) {
    if (values[i][skuIdx] === productObj.sku && values[i][branchIdx] === productObj.branchId) {
      targetRowIdx = i + 1;
      break;
    }
  }
  
  if (targetRowIdx === -1) {
    throw new Error("Produk dengan SKU " + productObj.sku + " tidak ditemukan di cabang " + productObj.branchId);
  }
  
  var rowValues = [];
  for (var j = 0; j < headers.length; j++) {
    var key = headers[j];
    var val = productObj[key] !== undefined ? productObj[key] : values[targetRowIdx-1][j];
    if (typeof val === "object" && val !== null) {
      val = JSON.stringify(val);
    }
    rowValues.push(val.toString());
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


// ==========================================
// 5. STOCK MUTATION SERVICE (stock.gs)
// ==========================================

function addStockLogToGAS(stockLogObj) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var pSheet = ss.getSheetByName(SHEETS.PRODUCTS);
  if (!pSheet) throw new Error("Sheet PRODUCTS tidak ditemukan.");
  
  // Tulis log mutasi ke Sheet STOCKS
  stockLogObj.id = "ST" + Date.now();
  stockLogObj.date = new Date().toISOString();
  appendRowToSheet(SHEETS.STOCKS, stockLogObj);
  
  // Mutasi Stok pada Sheet PRODUCTS
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
  
  pSheet.getRange(productRowIdx, stockIdx + 1).setValue(nextStock);
  
  // Periksa apakah stok menyentuh batas minimum kritis
  if (nextStock <= minStock) {
    var notifObj = {
      id: "NF" + Date.now(),
      type: "STOCK_OUT_OF_BOUNDS",
      title: "Peringatan Stok Kritis",
      message: "Stok produk '" + prodName + "' di cabang '" + stockLogObj.branchId + "' sisa " + nextStock + " pcs.",
      timestamp: new Date().toISOString(),
      read: "false"
    };
    appendRowToSheet(SHEETS.NOTIFICATIONS, notifObj);
  }
  
  writeGASAuditLog("STOCK_MUTATION", "Stok " + stockLogObj.type + " SKU: " + stockLogObj.sku + " Qty: " + stockLogObj.qty);
  return stockLogObj;
}


// ==========================================
// 6. TRANSACTION ENGINE (transaction.gs)
// ==========================================

function addTransactionToGAS(payload) {
  var transaction = payload.transaction;
  var items = payload.items;
  
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 1. Simpan Header Transaksi ke sheet TRANSACTIONS
  appendRowToSheet(SHEETS.TRANSACTIONS, transaction);
  
  // 2. Simpan Item Detail Transaksi ke sheet TRANSACTION_ITEMS
  for (var i = 0; i < items.length; i++) {
    appendRowToSheet(SHEETS.TRANSACTION_ITEMS, items[i]);
    
    // 3. Mutasi Stok Produk
    try {
      addStockLogToGAS({
        sku: items[i].sku,
        branchId: transaction.branchId,
        type: "OUT",
        qty: items[i].qty,
        notes: "Penjualan " + transaction.id,
        user: transaction.cashierName
      });
    } catch(err) {
      Logger.log("Stock auto-deduction failed for: " + items[i].sku);
    }
  }
  
  // 4. Catat ke Aliran Kas (CASHFLOWS Sheet) sebagai Pendapatan
  var incomeFlow = {
    id: "CF_T_" + Date.now(),
    date: new Date().toISOString(),
    type: "INCOME",
    category: "Sales",
    amount: transaction.finalAmount,
    description: "Pendapatan dari transaksi " + transaction.id,
    branchId: transaction.branchId,
    user: transaction.cashierName
  };
  appendRowToSheet(SHEETS.CASHFLOWS, incomeFlow);
  
  // 5. Reward Poin Pelanggan jika ada Member ID
  if (transaction.customerId) {
    var cSheet = ss.getSheetByName(SHEETS.CUSTOMERS);
    if (cSheet) {
      var cValues = cSheet.getDataRange().getValues();
      var cHeaders = cValues[0];
      var idIdx = cHeaders.indexOf("id");
      var pointIdx = cHeaders.indexOf("point");
      var rankIdx = cHeaders.indexOf("memberRank");
      
      var custRowIdx = -1;
      for (var k = 1; k < cValues.length; k++) {
        if (cValues[k][idIdx] === transaction.customerId) {
          custRowIdx = k + 1;
          break;
        }
      }
      
      if (custRowIdx !== -1) {
        var pointsEarned = Math.floor(transaction.finalAmount / 10000); // 1 point per 10k IDR
        var currentPoints = Number(cValues[custRowIdx-1][pointIdx]);
        var nextPoints = currentPoints + pointsEarned;
        
        var nextRank = cValues[custRowIdx-1][rankIdx];
        if (nextPoints > 1000) nextRank = "PLATINUM";
        else if (nextPoints > 500) nextRank = "GOLD";
        else if (nextPoints > 150) nextRank = "SILVER";
        
        cSheet.getRange(custRowIdx, pointIdx + 1).setValue(nextPoints);
        cSheet.getRange(custRowIdx, rankIdx + 1).setValue(nextRank);
      }
    }
  }
  
  writeGASAuditLog("TRANSACTION_CREATED", "Transaksi baru sukses disimpan: ID " + transaction.id, transaction.cashierId, transaction.cashierName);
  return true;
}


// ==========================================
// 7. FINANCE & PURCHASE SERVICE (finance.gs)
// ==========================================

function addCashflowToGAS(cfObj) {
  cfObj.id = "CF" + Date.now();
  cfObj.date = new Date().toISOString();
  appendRowToSheet(SHEETS.CASHFLOWS, cfObj);
  writeGASAuditLog("FINANCE_ENTRY", "Entri keuangan baru " + cfObj.type + " kategori: " + cfObj.category, cfObj.user);
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
  
  var decodedItems = [];
  try {
    decodedItems = typeof itemsJson === "string" ? JSON.parse(itemsJson) : itemsJson;
  } catch (ex) {}

  // Trigger update stok untuk produk yang diterima
  if (Array.isArray(decodedItems)) {
    decodedItems.forEach(function(item) {
      try {
        addStockLogToGAS({
          sku: item.sku,
          branchId: branchId,
          type: "IN",
          qty: Number(item.qty),
          notes: "Penerimaan PO " + code,
          user: "admin"
        });
      } catch (errStock) {
        Logger.log("Gagal tambah stok PO untuk SKU: " + item.sku);
      }
    });
  }

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
