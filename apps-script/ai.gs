/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ai.gs - Integrasi Business Intelligence Bertenaga AI (Gemini Agent Helper)

function compileAISalesSummaryContext() {
  var txs = getSheetDataAsJson(SHEETS.TRANSACTIONS);
  var products = getSheetDataAsJson(SHEETS.PRODUCTS);
  var cashflows = getSheetDataAsJson(SHEETS.CASHFLOWS);
  
  // Ambil total revenue, pengeluaran, laba bersih kasar
  var totalRevenue = 0;
  var totalExpense = 0;
  
  cashflows.forEach(function(cf) {
    if (cf.type === "INCOME") totalRevenue += Number(cf.amount || 0);
    else if (cf.type === "EXPENSE") totalExpense += Number(cf.amount || 0);
  });
  
  // Daftarkan produk yang stoknya menipis
  var lowStockProducts = products.filter(function(p) {
    return Number(p.stock) <= Number(p.minStock);
  }).map(function(p) {
    return { name: p.name, sku: p.sku, stock: p.stock, minStock: p.minStock, branch: p.branchId };
  });
  
  return {
    period: "Mei 2026",
    totalRevenue: totalRevenue,
    totalExpense: totalExpense,
    netProfit: totalRevenue - totalExpense,
    totalTransactionsCount: txs.length,
    lowStockWarnings: lowStockProducts
  };
}
