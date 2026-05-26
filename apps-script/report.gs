/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// report.gs - Laporan Penjualan, Tren Kategori, dan Export Ringkasan Pajak

function compileFinancialReport(branchId, startDateStr, endDateStr) {
  var txs = getSheetDataAsJson(SHEETS.TRANSACTIONS);
  var filtered = txs.filter(function(t) {
    var matchBranch = (!branchId || branchId === "all" || t.branchId === branchId);
    var tDate = new Date(t.date);
    var start = startDateStr ? new Date(startDateStr) : new Date(0);
    var end = endDateStr ? new Date(endDateStr) : new Date();
    return matchBranch && tDate >= start && tDate <= end;
  });
  
  var totalRevenue = 0;
  var totalDiscount = 0;
  var totalTax = 0;
  var count = filtered.length;
  
  filtered.forEach(function(t) {
    totalRevenue += Number(t.finalAmount || 0);
    totalDiscount += Number(t.discountAmount || 0);
    totalTax += Number(t.taxAmount || 0);
  });
  
  return {
    totalTransactions: count,
    totalRevenue: totalRevenue,
    totalDiscount: totalDiscount,
    totalTax: totalTax
  };
}
