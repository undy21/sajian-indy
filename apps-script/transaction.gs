/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// transaction.gs - Penyimpanan Transaksi POS Multi-table Terintegrasi

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
        
        // Atur tingkat peringkat member berdasarkan total poin
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
