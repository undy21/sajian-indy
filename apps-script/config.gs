/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// config.gs - Konfigurasi Utama Google Sheets POS Database

var SPREADSHEET_ID = "MASUKKAN_ID_SPREADSHEET_ANDA_DI_SINI";
var TOKEN_SECRET = "EnterprisePOS_GAS_Secret_Key_2026";
var RATE_LIMIT_WINDOW_MS = 60000; // 1 menit
var RATE_LIMIT_MAX_REQUESTS = 100;

// Whitelist domain untuk CORS security
var COR_DOMAIN_WHITELIST = [
  "*" // Ubah ke domain produksi Vercel Anda demi keamanan optimal
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
 * Fungsi ini membuat tabel database dengan header default jika belum ada.
 */
function initializePOSDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  
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
  
  for (var name in sheetTemplates) {
    var s = ss.getSheetByName(name);
    if (!s) {
      s = ss.insertSheet(name);
      s.appendRow(sheetTemplates[name]);
      Logger.log("Sheet " + name + " berhasil dibuat.");
    }
  }
}
