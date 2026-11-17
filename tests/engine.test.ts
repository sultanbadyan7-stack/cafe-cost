import assert from 'node:assert/strict';
import test from 'node:test';
import { DAYS_PER_MONTH } from '../shared/constants';
import {
  assetDepreciableBase,
  assetTotalCost,
  averageCoffeePricePerGram,
  baseMonthlyPayroll,
  baseMonthlySalaries,
  beanPriceAdjustment,
  buildAmortizationSchedule,
  buildCashFlowProjection,
  cashRunwayMonths,
  classifyCashRunway,
  classifyMaterialsAndLabor,
  classifyMenuMargin,
  classifyRentToRevenue,
  cogsForMenuItem,
  computeAssetMetrics,
  computeBreakEven,
  computeMenuMetrics,
  convertCurrencyAmount,
  embeddedWasteMonthly,
  embeddedWastePerDay,
  embeddedWasteShare,
  employeeMonthlyCost,
  findBeanSupplierById,
  findCoffeeBeanSupplier,
  ingredientBaseCost,
  ingredientCost,
  isRetailBeansItem,
  loadedMonthlyPayroll,
  massCoffeeBeanSuppliers,
  menuItemCogsBreakdown,
  menuItemEconomics,
  monthlyDepreciation,
  monthlyLoanInstallment,
  netSellingPrice,
  payrollBreakdown,
  recipeCostBreakdown,
  retailBeanCogs,
  retailBeanCostBreakdown,
  roleMonthlyCost,
  simpleCogsForMenuItem,
  supplierBaseUnitCost,
  supplierEffectiveBaseUnitCost,
  supplierPricePerKilogram,
  supplierWasteMultiplier,
  supplierWasteUnitCost,
  totalCashFixedCosts,
  totalMonthlyWaste,
  unitsAreCompatible,
  vatAmount,
  wasteExpenseTotal,
} from '../shared/engine';
import type {
  EmployeeRole,
  FixedAsset,
  MenuItem,
  OperatingExpenseItem,
  SupplierItem,
} from '../shared/types';

function close(actual: number | null, expected: number, epsilon = 1e-9) {
  assert.ok(actual !== null, 'expected a numeric value, received null');
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${expected}, received ${actual}`,
  );
}

const staffing: EmployeeRole[] = [
  {
    id: 'barista',
    roleName: 'Barista',
    count: 2,
    baseSalary: 4000,
    housingAllowance: 800,
    transportAllowance: 300,
    medicalInsurance: 500,
    annualVisaCost: 2000,
    annualFlightCost: 3000,
  },
  {
    id: 'cashier',
    roleName: 'Cashier',
    count: 1,
    baseSalary: 3000,
    housingAllowance: 600,
    transportAllowance: 300,
    medicalInsurance: 400,
    annualVisaCost: 2000,
    annualFlightCost: 3000,
  },
];

const suppliers: SupplierItem[] = [
  {
    id: 'coffee-beans',
    name: 'Coffee Beans',
    category: 'coffee',
    packageLabel: '1 kg',
    packageQuantity: 1,
    packageUnit: 'kg',
    price: 120,
    wastePercentage: 0,
  },
  {
    id: 'fresh-milk',
    name: 'Fresh Milk',
    category: 'dairy',
    packageLabel: '1 L',
    packageQuantity: 1,
    packageUnit: 'l',
    price: 7,
    wastePercentage: 0,
  },
  {
    id: 'paper-cup',
    name: 'Paper Cup',
    category: 'packaging',
    packageLabel: '1 pc',
    packageQuantity: 1,
    packageUnit: 'pc',
    price: 0.6,
    wastePercentage: 0,
  },
  {
    id: 'cup-lid',
    name: 'Cup Lid',
    category: 'packaging',
    packageLabel: '1 pc',
    packageQuantity: 1,
    packageUnit: 'pc',
    price: 0.2,
    wastePercentage: 0,
  },
];

const menu: MenuItem[] = [
  {
    id: 'espresso',
    name: 'Espresso',
    category: 'hot_drinks',
    sellingPrice: 10,
    expectedDailyUnits: 60,
    costingMode: 'simple',
    estimatedCogsPercent: 20,
    ingredients: [],
  },
  {
    id: 'flat-white',
    name: 'Flat White',
    category: 'hot_drinks',
    sellingPrice: 16,
    expectedDailyUnits: 40,
    costingMode: 'advanced',
    estimatedCogsPercent: 30,
    ingredients: [
      { supplierId: 'coffee-beans', quantityUsed: 0.018, unit: 'kg' },
      { supplierId: 'fresh-milk', quantityUsed: 0.15, unit: 'l' },
      { supplierId: 'paper-cup', quantityUsed: 1, unit: 'pc' },
      { supplierId: 'cup-lid', quantityUsed: 1, unit: 'pc' },
    ],
  },
];

const assets: FixedAsset[] = [
  {
    id: 'espresso-machine',
    name: 'Espresso Machine',
    category: 'equipment',
    purchasePrice: 45000,
    shippingInstallation: 2500,
    usefulLifeYears: 10,
    salvageValue: 5000,
    depreciationMethod: 'straight_line',
  },
  {
    id: 'grinder',
    name: 'Coffee Grinder',
    category: 'equipment',
    purchasePrice: 18000,
    shippingInstallation: 500,
    usefulLifeYears: 8,
    salvageValue: 2000,
    depreciationMethod: 'straight_line',
  },
];

/* -------------------------------------------------------------------------- */
/* Suppliers & recipes                                                        */
/* -------------------------------------------------------------------------- */

test('supplier base unit cost converts the package to grams or millilitres', () => {
  close(supplierBaseUnitCost(suppliers[0]!), 0.12);
  close(supplierBaseUnitCost(suppliers[1]!), 0.007);
  close(supplierBaseUnitCost(suppliers[2]!), 0.6);
});

test('ingredient cost converts recipe units into the package dimension', () => {
  close(
    ingredientCost(
      { supplierId: 'coffee-beans', quantityUsed: 18, unit: 'g' },
      suppliers[0]!,
    ),
    2.16,
  );
  close(
    ingredientCost(
      { supplierId: 'coffee-beans', quantityUsed: 0.018, unit: 'kg' },
      suppliers[0]!,
    ),
    2.16,
  );
  close(
    ingredientCost(
      { supplierId: 'fresh-milk', quantityUsed: 150, unit: 'ml' },
      suppliers[1]!,
    ),
    1.05,
  );
});

test('incompatible units and missing suppliers cost zero', () => {
  assert.equal(
    unitsAreCompatible('g', 'l'),
    false,
    'mass and volume must not mix',
  );
  close(
    ingredientCost(
      { supplierId: 'fresh-milk', quantityUsed: 100, unit: 'g' },
      suppliers[1]!,
    ),
    0,
  );
  close(
    ingredientCost(
      { supplierId: 'missing', quantityUsed: 100, unit: 'g' },
      null,
    ),
    0,
  );
});

test('advanced recipe COGS is the sum of linked supplier lines', () => {
  const breakdown = recipeCostBreakdown(menu[1]!, suppliers);
  assert.equal(breakdown.lines.length, 4);
  assert.equal(breakdown.missingSupplierCount, 0);
  assert.equal(breakdown.incompatibleUnitCount, 0);
  close(breakdown.totalCost, 4.01);
  close(cogsForMenuItem(menu[1]!, suppliers), 4.01);
});

test('recipe breakdown reports missing suppliers and incompatible units', () => {
  const broken: MenuItem = {
    ...menu[1]!,
    ingredients: [
      { supplierId: 'missing', quantityUsed: 10, unit: 'g' },
      { supplierId: 'fresh-milk', quantityUsed: 10, unit: 'g' },
      { supplierId: 'coffee-beans', quantityUsed: 10, unit: 'g' },
    ],
  };

  const breakdown = recipeCostBreakdown(broken, suppliers);
  assert.equal(breakdown.missingSupplierCount, 1);
  assert.equal(breakdown.incompatibleUnitCount, 1);
  close(breakdown.totalCost, 1.2);
});

test('supplier price changes flow straight into advanced COGS', () => {
  const before = cogsForMenuItem(menu[1]!, suppliers);
  const dearer = suppliers.map((supplier) =>
    supplier.id === 'coffee-beans'
      ? { ...supplier, price: 240 }
      : supplier,
  );
  const after = cogsForMenuItem(menu[1]!, dearer);
  close(after - before, 2.16);
});

test('simple COGS stays a percentage of the selling price', () => {
  close(simpleCogsForMenuItem(menu[0]!), 2);
  close(cogsForMenuItem(menu[0]!, suppliers), 2);

  const economics = menuItemEconomics(menu[0]!, suppliers);
  close(economics.cogs, 2);
  close(economics.contributionMargin, 8);
  close(economics.contributionMarginRatio, 0.8);
});

test('menu metrics mix simple and advanced items equally', () => {
  const metrics = computeMenuMetrics(menu, suppliers);
  close(metrics.itemCount, 2);
  close(metrics.averageSellingPrice, 13);
  close(metrics.averageCogs, 3.005);
  close(metrics.averageContributionMargin, 9.995);
  close(metrics.contributionMarginRatio, 9.995 / 13);
  close(metrics.cogsRatio, 3.005 / 13);
});

/* -------------------------------------------------------------------------- */
/* VAT and net pricing                                                        */
/* -------------------------------------------------------------------------- */

test('VAT-inclusive menu prices are converted to net prices for margins', () => {
  const vat = { pricesIncludeVAT: true, vatRate: 15 };
  const net = 10 / 1.15;

  close(netSellingPrice(10, true, 15), net);
  close(netSellingPrice(10, false, 15), 10);
  close(vatAmount(10, true, 15), 10 - net);
  close(vatAmount(10, false, 15), 0);

  const economics = menuItemEconomics(menu[0]!, suppliers, vat);
  close(economics.netSellingPrice, net);
  close(economics.vatAmount, 10 - net);
  close(economics.contributionMargin, net - 2);
  close(economics.contributionMarginRatio, (net - 2) / net);

  const metrics = computeMenuMetrics(menu, suppliers, vat);
  close(metrics.averageSellingPrice, 13);
  close(metrics.averageNetSellingPrice, 13 / 1.15);
  close(metrics.averageVatAmount, 13 - 13 / 1.15);
});

/* -------------------------------------------------------------------------- */
/* Margin guardrails                                                          */
/* -------------------------------------------------------------------------- */

test('menu margin dots follow the 65 / 50 thresholds', () => {
  assert.equal(classifyMenuMargin(0.66), 'healthy');
  assert.equal(classifyMenuMargin(0.65), 'warning');
  assert.equal(classifyMenuMargin(0.5), 'warning');
  assert.equal(classifyMenuMargin(0.49), 'critical');
  assert.equal(classifyMenuMargin(null), 'unknown');
  assert.equal(classifyMenuMargin(Number.NaN), 'unknown');
});

/* -------------------------------------------------------------------------- */
/* Waste provision                                                            */
/* -------------------------------------------------------------------------- */

const wastefulSuppliers: SupplierItem[] = suppliers.map((supplier) => {
  switch (supplier.id) {
    case 'coffee-beans':
      return { ...supplier, wastePercentage: 10 };
    case 'fresh-milk':
      return { ...supplier, wastePercentage: 5 };
    default:
      return { ...supplier, wastePercentage: 1 };
  }
});

const wasteExpenses: OperatingExpenseItem[] = [
  { id: 'waste-1', name: 'Spoilage', category: 'waste', amount: 800 },
  { id: 'rent-1', name: 'Rent', category: 'rent', amount: 12000 },
];

test('supplier waste is baked into the effective unit cost', () => {
  const beans = wastefulSuppliers[0]!;
  close(supplierWasteMultiplier(beans), 1.1);
  close(supplierEffectiveBaseUnitCost(beans), 0.132);
  close(supplierWasteUnitCost(beans), 0.012);

  /* A 10% waste rate raises an 18 g shot from 2.16 to 2.376. */
  close(
    ingredientBaseCost(
      { supplierId: 'coffee-beans', quantityUsed: 18, unit: 'g' },
      beans,
    ),
    2.16,
  );
  close(
    ingredientCost(
      { supplierId: 'coffee-beans', quantityUsed: 18, unit: 'g' },
      beans,
    ),
    2.376,
  );
});

test('menu COGS includes supplier waste for every ingredient line', () => {
  const flatWhite = menu[1]!;
  const breakdown = recipeCostBreakdown(flatWhite, wastefulSuppliers);

  close(breakdown.baseCost, 4.01);
  close(breakdown.wasteCost, 0.2765);
  close(breakdown.totalCost, 4.2865);
  close(cogsForMenuItem(flatWhite, wastefulSuppliers), 4.2865);

  const split = menuItemCogsBreakdown(flatWhite, wastefulSuppliers);
  close(split.baseCogs, 4.01);
  close(split.wasteCost, 0.2765);
  close(split.totalCogs, 4.2865);
});

test('embedded supplier waste is reported per forecast unit, never as a fixed cost', () => {
  close(embeddedWastePerDay(menu, wastefulSuppliers), 0.2765 * 40);
  close(
    embeddedWasteMonthly(menu, wastefulSuppliers),
    0.2765 * 40 * DAYS_PER_MONTH,
  );

  const totalCogs = 2 * 60 + 4.2865 * 40;
  close(embeddedWasteShare(menu, wastefulSuppliers), (0.2765 * 40) / totalCogs);
});

test('total monthly waste is explicit expenses only', () => {
  close(wasteExpenseTotal(wasteExpenses), 800);
  /* Supplier waste lives in COGS, so it is not added here again. */
  close(totalMonthlyWaste(wasteExpenses), 800);
});

test('total cash fixed costs includes waste but still excludes depreciation', () => {
  close(
    totalCashFixedCosts({
      rent: 12000,
      loadedPayroll: 18958.8,
      utilities: 3500,
      marketing: 1000,
      loanInstallment: 500,
      waste: 800,
      other: 300,
    }),
    37058.8,
  );
});

/* -------------------------------------------------------------------------- */
/* Payroll TCO                                                                */
/* -------------------------------------------------------------------------- */

test('employee monthly cost includes allowances and amortised annual costs', () => {
  close(employeeMonthlyCost(staffing[0]!), 5600 + 2000 / 12 + 3000 / 12);
  close(roleMonthlyCost(staffing[0]!), 2 * (5600 + 2000 / 12 + 3000 / 12));
  close(roleMonthlyCost(staffing[1]!), 4300 + 2000 / 12 + 3000 / 12);
});

test('base payroll sums role TCO and statutory base sums base salaries', () => {
  close(baseMonthlyPayroll(staffing), 16750);
  close(baseMonthlySalaries(staffing), 11000);
});

test('statutory rates apply to base salaries only', () => {
  const breakdown = payrollBreakdown(staffing, 11.75, 8.33);
  close(breakdown.baseSalaries, 11000);
  close(breakdown.totalMonthlyRoleCost, 16750);
  close(breakdown.basePayroll, 16750);
  close(breakdown.socialInsurance, 1292.5);
  close(breakdown.endOfService, 916.3);
  close(breakdown.loadedPayroll, 18958.8);
  close(
    loadedMonthlyPayroll(16750, 11000, 11.75, 8.33),
    breakdown.loadedPayroll,
  );
});

/* -------------------------------------------------------------------------- */
/* Fixed costs, break-even, and cash flow                                     */
/* -------------------------------------------------------------------------- */

test('total cash fixed costs includes every bucket and ignores depreciation', () => {
  close(
    totalCashFixedCosts({
      rent: 12000,
      loadedPayroll: 18958.8,
      utilities: 3500,
      marketing: 1000,
      loanInstallment: 500,
      other: 300,
    }),
    36258.8,
  );
});

test('break-even uses the fixed target material ratio and reports projected revenue', () => {
  const result = computeBreakEven({
    fixedCashCosts: 10000,
    targetMaterialCostRatio: 30,
    menu,
    suppliers,
  });

  /* Espresso: 60 × 10 = 600 revenue, 60 × 2 = 120 COGS.
     Flat White: 40 × 16 = 640 revenue, 40 × 4.01 = 160.4 COGS. */
  const projectedRevenue = 600 + 640;
  const projectedCogs = 120 + 160.4;
  const monthlyRevenue = 10000 / 0.7;

  assert.equal(result.isCalculable, true);
  assert.equal(result.isBreakEvenReachable, true);
  assert.equal(result.hasData, true);
  assert.equal(result.negativeContribution, false);
  close(result.targetMaterialCostRatio, 30);
  close(result.marginRatio, 0.7);
  close(result.monthlyBreakEvenRevenue, monthlyRevenue);
  close(result.requiredDailyRevenue, monthlyRevenue / DAYS_PER_MONTH);
  close(result.projectedDailyRevenue, projectedRevenue);
  close(result.projectedMonthlyRevenue, projectedRevenue * DAYS_PER_MONTH);
  close(result.projectedDailyCogs, projectedCogs);
  assert.equal(result.coversBreakEven, true);
  assert.equal(result.revenueGap, 0);
});

test('break-even compares net revenue, so VAT cannot cover fixed costs', () => {
  const vatSettings = { pricesIncludeVAT: true, vatRate: 15 };
  const result = computeBreakEven({
    fixedCashCosts: 24000,
    targetMaterialCostRatio: 30,
    menu,
    suppliers,
    vatSettings,
  });

  const grossDaily = 600 + 640; // list prices, VAT included
  const netDaily = grossDaily / 1.15;
  const requiredDaily = 24000 / 0.7 / DAYS_PER_MONTH;

  close(result.projectedDailyGrossRevenue, grossDaily);
  close(result.projectedMonthlyGrossRevenue, grossDaily * DAYS_PER_MONTH);
  close(result.projectedDailyRevenue, netDaily);
  close(result.projectedMonthlyRevenue, netDaily * DAYS_PER_MONTH);
  close(result.projectedDailyVat, grossDaily - netDaily);
  close(result.projectedMonthlyVat, (grossDaily - netDaily) * DAYS_PER_MONTH);
  close(result.requiredDailyRevenue, requiredDaily);

  /* Gross revenue clears the target but net revenue does not. */
  assert.ok(grossDaily > requiredDaily);
  assert.ok(netDaily < requiredDaily);
  assert.equal(result.coversBreakEven, false);
  close(result.revenueGap, requiredDaily - netDaily);
});

test('break-even adds VAT on top when prices exclude VAT', () => {
  const result = computeBreakEven({
    fixedCashCosts: 1000,
    targetMaterialCostRatio: 30,
    menu,
    suppliers,
    vatSettings: { pricesIncludeVAT: false, vatRate: 15 },
  });

  close(result.projectedDailyRevenue, 600 + 640);
  close(result.projectedDailyGrossRevenue, (600 + 640) * 1.15);
  close(result.projectedDailyVat, (600 + 640) * 0.15);
});

test('break-even target stays fixed when expected daily units increase', () => {
  const low = computeBreakEven({
    fixedCashCosts: 10000,
    targetMaterialCostRatio: 30,
    menu: menu.map((item) => ({ ...item, expectedDailyUnits: 1 })),
    suppliers,
  });
  const high = computeBreakEven({
    fixedCashCosts: 10000,
    targetMaterialCostRatio: 30,
    menu: menu.map((item) => ({ ...item, expectedDailyUnits: 100 })),
    suppliers,
  });

  close(low.requiredDailyRevenue, high.requiredDailyRevenue);
  close(low.monthlyBreakEvenRevenue, high.monthlyBreakEvenRevenue);
  assert.ok(high.projectedDailyRevenue > low.projectedDailyRevenue);
});

test('forecast can be zero while the fixed break-even target stays calculable', () => {
  const result = computeBreakEven({
    fixedCashCosts: 5000,
    targetMaterialCostRatio: 30,
    menu: menu.map((item) => ({ ...item, expectedDailyUnits: 0 })),
    suppliers,
  });

  const monthlyRevenue = 5000 / 0.7;
  const requiredDailyRevenue = monthlyRevenue / DAYS_PER_MONTH;

  assert.equal(result.isCalculable, true);
  assert.equal(result.isBreakEvenReachable, true);
  close(result.monthlyBreakEvenRevenue, monthlyRevenue);
  close(result.requiredDailyRevenue, requiredDailyRevenue);
  assert.equal(result.projectedDailyRevenue, 0);
  assert.equal(result.projectedMonthlyRevenue, 0);
  assert.equal(result.hasData, false);
  assert.equal(result.coversBreakEven, false);
  close(result.revenueGap, requiredDailyRevenue);
});

test('a menu sold below material cost never reports that it covers break-even', () => {
  const result = computeBreakEven({
    fixedCashCosts: 100,
    targetMaterialCostRatio: 30,
    /* 10% COGS on a 10 price is fine, but 150% is not. */
    menu: menu.map((item) => ({
      ...item,
      expectedDailyUnits: 10,
      estimatedCogsPercent: 150,
      costingMode: 'simple' as const,
    })),
    suppliers: [],
  });

  assert.equal(result.hasData, true);
  assert.equal(result.negativeContribution, true);
  assert.equal(result.coversBreakEven, false);
  assert.equal(result.revenueGap, 0);
});

test('break-even is unreachable when the target material ratio leaves no margin', () => {
  const result = computeBreakEven({
    fixedCashCosts: 5000,
    targetMaterialCostRatio: 100,
    menu,
    suppliers,
  });

  assert.equal(result.isCalculable, false);
  assert.equal(result.isBreakEvenReachable, false);
  close(result.marginRatio, 0);
  assert.equal(result.monthlyBreakEvenRevenue, 0);
  assert.equal(result.requiredDailyRevenue, 0);
  assert.equal(result.coversBreakEven, false);
  assert.equal(result.revenueGap, 0);
  assert.ok(result.projectedDailyRevenue > 0);
});

test('loan installment handles zero-rate and amortizing loans', () => {
  close(monthlyLoanInstallment(12000, 0, 12), 1000);

  const installment = monthlyLoanInstallment(12000, 12, 12);
  assert.ok(installment > 1000 && installment < 1200);

  const schedule = buildAmortizationSchedule(12000, 12, 12);
  assert.equal(schedule.length, 12);
  close(schedule[schedule.length - 1]!.closingBalance, 0, 1e-6);
  close(
    schedule.reduce((sum, row) => sum + row.principal, 0),
    12000,
    1e-6,
  );
});

test('cash flow projection is driven by menu net, gross, and COGS per day', () => {
  const projection = buildCashFlowProjection({
    dailyNetRevenue: 1000,
    dailyGrossRevenue: 1150,
    dailyCogs: 300,
    fixedCashCosts: 1000,
    rampUp: Array.from({ length: 12 }, () => 1),
    openingBankBalance: 5000,
  });

  assert.equal(projection.months.length, 12);
  const first = projection.months[0]!;
  close(first.grossRevenue, 1150 * DAYS_PER_MONTH);
  close(first.projectedRevenue, 1000 * DAYS_PER_MONTH);
  close(first.vatPayable, 150 * DAYS_PER_MONTH);
  close(first.directCosts, 300 * DAYS_PER_MONTH);
  close(first.loanInstallment, 0);
  close(
    first.netCashFlow,
    first.projectedRevenue - first.directCosts - 1000,
  );
  close(first.closingBalance, 5000 + first.netCashFlow);
  close(
    projection.summary.totalNetRevenue,
    first.projectedRevenue * 12,
    1e-6,
  );
  close(
    projection.summary.totalGrossRevenue,
    first.grossRevenue * 12,
    1e-6,
  );
  close(
    projection.summary.totalVatPayable,
    first.vatPayable * 12,
    1e-6,
  );
  close(
    projection.summary.totalNetCashFlow,
    first.netCashFlow * 12,
    1e-6,
  );
  close(
    projection.summary.endingBankBalance,
    5000 + first.netCashFlow * 12,
    1e-6,
  );
  assert.equal(projection.summary.cashRunwayMonths, null);
});

test('loan principal funds opening cash and installments stop after the term', () => {
  const projection = buildCashFlowProjection({
    dailyNetRevenue: 1000,
    dailyGrossRevenue: 1150,
    dailyCogs: 300,
    fixedCashCosts: 1000,
    rampUp: Array.from({ length: 12 }, () => 1),
    openingBankBalance: 0,
    loanPrincipal: 12000,
    loanInstallment: 1000,
    loanTermMonths: 6,
  });

  const first = projection.months[0]!;
  close(first.openingBalance, 12000);
  close(first.loanInstallment, 1000);
  close(first.fixedCashCosts, 2000);
  close(projection.months[5]!.loanInstallment, 1000);
  close(projection.months[6]!.loanInstallment, 0);
  close(projection.months[6]!.fixedCashCosts, 1000);
});

test('runway is the number of complete months before the first negative balance', () => {
  const projection = buildCashFlowProjection({
    dailyNetRevenue: 100,
    dailyGrossRevenue: 115,
    dailyCogs: 50,
    fixedCashCosts: 5000,
    rampUp: Array.from({ length: 12 }, () => 1),
    openingBankBalance: 10000,
  });

  /* Month 1 loses ~3,480 and month 2 loses another ~3,480: month 3 is negative. */
  assert.equal(projection.months[0]!.closingBalance > 0, true);
  assert.equal(projection.months[1]!.closingBalance > 0, true);
  assert.equal(projection.months[2]!.closingBalance < 0, true);
  assert.equal(projection.summary.cashRunwayMonths, 2);
});

test('runway returns zero when month 1 already ends negative', () => {
  const projection = buildCashFlowProjection({
    dailyNetRevenue: 0,
    dailyGrossRevenue: 0,
    dailyCogs: 0,
    fixedCashCosts: 1000,
    rampUp: Array.from({ length: 12 }, () => 1),
    openingBankBalance: 100,
  });

  assert.equal(projection.summary.cashRunwayMonths, 0);
  assert.equal(projection.summary.minimumClosingBalance < 0, true);
  close(projection.summary.requiredWorkingCapitalBuffer, 11900);
});

test('cashRunwayMonths measures closing balances directly', () => {
  const rows = (balances: number[]) =>
    balances.map((closingBalance, index) => ({
      month: index + 1,
      rampUpFactor: 1,
      grossRevenue: 0,
      vatPayable: 0,
      projectedRevenue: 0,
      directCosts: 0,
      fixedCashCosts: 0,
      loanInstallment: 0,
      netCashFlow: 0,
      openingBalance: 0,
      closingBalance,
      cumulativeCashFlow: 0,
    }));

  assert.equal(cashRunwayMonths(rows([100, 50, 10, 5])), null);
  assert.equal(cashRunwayMonths(rows([-1, 50])), 0);
  assert.equal(cashRunwayMonths(rows([100, 50, -1])), 2);
  assert.equal(cashRunwayMonths(rows([])), null);
});

test('currency conversion moves amounts between rates', () => {
  /* 3,750 SAR at 3.75/USD is 1,000 USD; at 1/USD that is 1,000 USD. */
  close(convertCurrencyAmount(3750, 3.75, 1), 1000);
  close(convertCurrencyAmount(1000, 1, 3.75), 3750);
  close(convertCurrencyAmount(100, 3.75, 3.75), 100);
  /* A non-positive rate leaves the amount untouched. */
  close(convertCurrencyAmount(100, 0, 3.75), 100);
  close(convertCurrencyAmount(100, 3.75, 0), 100);
});

/* -------------------------------------------------------------------------- */
/* Fixed assets                                                               */
/* -------------------------------------------------------------------------- */

test('straight-line depreciation divides the depreciable base over months', () => {
  close(assetTotalCost(assets[0]!), 47500);
  close(assetDepreciableBase(assets[0]!), 42500);
  close(monthlyDepreciation(assets[0]!), 42500 / 120);
  close(monthlyDepreciation(assets[1]!), 16500 / 96);
});

test('an asset without a useful life depreciates to zero, not infinity', () => {
  const asset: FixedAsset = { ...assets[0]!, usefulLifeYears: 0 };
  close(monthlyDepreciation(asset), 0);
});

test('asset metrics aggregate cost, salvage, and depreciation', () => {
  const metrics = computeAssetMetrics(assets);
  close(metrics.assetCount, 2);
  close(metrics.totalAssetCost, 66000);
  close(metrics.totalSalvageValue, 7000);
  close(metrics.totalDepreciableBase, 59000);
  close(metrics.totalMonthlyDepreciation, 42500 / 120 + 16500 / 96);
  close(metrics.totalAnnualDepreciation, (42500 / 120 + 16500 / 96) * 12);
});

/* -------------------------------------------------------------------------- */
/* Validation bands                                                           */
/* -------------------------------------------------------------------------- */

test('validation bands follow the simple commercial thresholds', () => {
  assert.equal(classifyMaterialsAndLabor(59), 'healthy');
  assert.equal(classifyMaterialsAndLabor(62), 'warning');
  assert.equal(classifyMaterialsAndLabor(70), 'critical');
  assert.equal(classifyMaterialsAndLabor(null), 'unknown');

  assert.equal(classifyRentToRevenue(10), 'healthy');
  assert.equal(classifyRentToRevenue(5), 'warning');
  assert.equal(classifyRentToRevenue(13), 'warning');
  assert.equal(classifyRentToRevenue(20), 'critical');

  assert.equal(classifyCashRunway(7), 'healthy');
  assert.equal(classifyCashRunway(4), 'warning');
  assert.equal(classifyCashRunway(2), 'critical');
  assert.equal(classifyCashRunway(null), 'unknown');
});

/* -------------------------------------------------------------------------- */
/* Retail bean bags                                                           */
/* -------------------------------------------------------------------------- */

const retailBag: MenuItem = {
  id: 'retail-bag',
  name: 'House Blend 250 g',
  category: 'retail_beans',
  sellingPrice: 55,
  expectedDailyUnits: 5,
  costingMode: 'simple',
  estimatedCogsPercent: 90,
  ingredients: [],
  bagWeightGrams: 250,
  packagingCost: 2,
};

test('retail bag COGS uses the supplier bean price, bag weight, and packaging', () => {
  const breakdown = retailBeanCostBreakdown(retailBag, suppliers);

  assert.equal(breakdown.supplier?.id, 'coffee-beans');
  assert.equal(breakdown.hasBeanPrice, true);
  /* Exact formula: package price ÷ package grams, then × bag grams. */
  close(breakdown.supplierPackagePrice, 120);
  close(breakdown.packageSizeGrams, 1000);
  close(breakdown.pricePerGram, 120 / 1000);
  close(breakdown.pricePerGram, 0.12);
  close(breakdown.beanCost, (120 / 1000) * 250);
  close(breakdown.beanCost, 30);
  close(breakdown.packagingCost, 2);
  close(breakdown.totalCost, 32);

  close(retailBeanCogs(retailBag, suppliers), 32);
  /* Retail COGS must ignore the simple COGS percentage entirely. */
  close(cogsForMenuItem(retailBag, suppliers), 32);
  assert.equal(isRetailBeansItem(retailBag), true);
});

test('a gram package and a kilogram package cost the bag identically', () => {
  const gramSupplier = {
    ...suppliers[0]!,
    id: 'coffee-beans-grams',
    packageLabel: '1000 g',
    packageQuantity: 1000,
    packageUnit: 'g' as const,
  };

  const fromKilograms = retailBeanCostBreakdown(retailBag, suppliers);
  const fromGrams = retailBeanCostBreakdown(retailBag, [gramSupplier]);

  close(fromGrams.packageSizeGrams, fromKilograms.packageSizeGrams);
  close(fromGrams.pricePerGram, fromKilograms.pricePerGram);
  close(fromGrams.beanCost, fromKilograms.beanCost);
  close(fromGrams.totalCost, fromKilograms.totalCost);
  close(fromGrams.totalCost, 32);
});

test('retail bag without a coffee supplier costs only its packaging', () => {
  const noCoffee = suppliers.filter((supplier) => supplier.category !== 'coffee');
  const breakdown = retailBeanCostBreakdown(retailBag, noCoffee);

  assert.equal(breakdown.supplier, null);
  assert.equal(breakdown.hasBeanPrice, false);
  close(breakdown.totalCost, 2);
  assert.equal(findCoffeeBeanSupplier(noCoffee), null);
});

test('retail margin dots use the wider 45 / 30 band', () => {
  assert.equal(classifyMenuMargin(0.46, 'retail_beans'), 'healthy');
  assert.equal(classifyMenuMargin(0.45, 'retail_beans'), 'warning');
  assert.equal(classifyMenuMargin(0.3, 'retail_beans'), 'warning');
  assert.equal(classifyMenuMargin(0.29, 'retail_beans'), 'critical');

  /* The same ratio stays critical for a standard menu item. */
  assert.equal(classifyMenuMargin(0.46), 'critical');
});

test('retail bags keep the raw bean cost because they are sealed resale stock', () => {
  /* No production waste is applied to a sealed bag. */
  const split = menuItemCogsBreakdown(retailBag, wastefulSuppliers);
  close(split.baseCogs, 32);
  close(split.wasteCost, 0);
  close(split.totalCogs, 32);
  close(cogsForMenuItem(retailBag, wastefulSuppliers), 32);
});

test('simple percentage COGS assumes the estimate already includes waste', () => {
  const split = menuItemCogsBreakdown(menu[0]!, wastefulSuppliers);
  close(split.baseCogs, 2);
  close(split.wasteCost, 0);
  close(split.totalCogs, 2);
});

/* -------------------------------------------------------------------------- */
/* Multi-bean selection                                                       */
/* -------------------------------------------------------------------------- */

const colombiaBeans: SupplierItem = {
  id: 'coffee-colombia',
  name: 'Colombia Beans',
  category: 'coffee',
  packageLabel: '1 kg',
  packageQuantity: 1,
  packageUnit: 'kg',
  price: 180,
  wastePercentage: 0,
};

const yemeniBeans: SupplierItem = {
  id: 'coffee-yemeni',
  name: 'Yemeni Beans',
  category: 'coffee',
  packageLabel: '1 kg',
  packageQuantity: 1,
  packageUnit: 'kg',
  price: 300,
  wastePercentage: 0,
};

const multiBeanSuppliers: SupplierItem[] = [
  suppliers[0]!,
  colombiaBeans,
  yemeniBeans,
  ...suppliers.slice(1),
];

test('bean helpers expose every mass-based coffee supplier', () => {
  const liquidCoffee: SupplierItem = {
    ...colombiaBeans,
    id: 'coffee-liquid',
    name: 'Cold Brew Concentrate',
    packageLabel: '1 L',
    packageQuantity: 1,
    packageUnit: 'l',
  };

  assert.deepEqual(
    massCoffeeBeanSuppliers(multiBeanSuppliers).map((bean) => bean.id),
    ['coffee-beans', 'coffee-colombia', 'coffee-yemeni'],
  );
  assert.deepEqual(
    massCoffeeBeanSuppliers([...multiBeanSuppliers, liquidCoffee]).map(
      (bean) => bean.id,
    ),
    ['coffee-beans', 'coffee-colombia', 'coffee-yemeni'],
  );
  close(supplierPricePerKilogram(colombiaBeans), 180);
  assert.equal(
    findBeanSupplierById(multiBeanSuppliers, 'coffee-yemeni')?.id,
    'coffee-yemeni',
  );
  assert.equal(findBeanSupplierById(multiBeanSuppliers, 'fresh-milk'), null);
  assert.equal(findBeanSupplierById(multiBeanSuppliers, 'missing'), null);
});

test('retail bag uses the explicitly selected bean, not the first coffee row', () => {
  const bag: MenuItem = {
    ...retailBag,
    selectedBeanId: 'coffee-colombia',
  };

  const breakdown = retailBeanCostBreakdown(bag, multiBeanSuppliers);
  assert.equal(breakdown.supplier?.id, 'coffee-colombia');
  assert.equal(breakdown.selectedBeanMissing, false);
  close(breakdown.pricePerGram, 0.18);
  close(breakdown.beanCost, 45);
  close(breakdown.totalCost, 47);
  close(cogsForMenuItem(bag, multiBeanSuppliers), 47);
});

test('changing the selected supplier price updates every linked retail bag', () => {
  const bag: MenuItem = {
    ...retailBag,
    selectedBeanId: 'coffee-colombia',
  };
  const before = cogsForMenuItem(bag, multiBeanSuppliers);

  const dearer = multiBeanSuppliers.map((supplier) =>
    supplier.id === 'coffee-colombia'
      ? { ...supplier, price: 240 }
      : supplier,
  );

  close(before, 47);
  close(cogsForMenuItem(bag, dearer), 62);
});

test('a stale bean id is reported and falls back to the legacy coffee row', () => {
  const bag: MenuItem = {
    ...retailBag,
    selectedBeanId: 'deleted-bean',
  };

  const breakdown = retailBeanCostBreakdown(bag, multiBeanSuppliers);
  assert.equal(breakdown.selectedBeanMissing, true);
  assert.equal(breakdown.supplier?.id, 'coffee-beans');
  close(breakdown.totalCost, 32);
});

test('simple drinks adjust the percentage estimate by the selected bean price', () => {
  close(averageCoffeePricePerGram(multiBeanSuppliers), 0.2);

  const espresso: MenuItem = {
    ...menu[0]!,
    selectedBeanId: 'coffee-colombia',
  };
  /* (0.18 - 0.20) × 18 g = -0.36 */
  close(beanPriceAdjustment(espresso, multiBeanSuppliers), -0.36);
  close(simpleCogsForMenuItem(espresso, multiBeanSuppliers), 1.64);
  close(cogsForMenuItem(espresso, multiBeanSuppliers), 1.64);

  const yemeniEspresso: MenuItem = {
    ...menu[0]!,
    selectedBeanId: 'coffee-yemeni',
  };
  /* (0.30 - 0.20) × 18 g = +1.80 */
  close(beanPriceAdjustment(yemeniEspresso, multiBeanSuppliers), 1.8);
  close(simpleCogsForMenuItem(yemeniEspresso, multiBeanSuppliers), 3.8);
});

test('simple bean adjustment is neutral with one supplier or a stale selection', () => {
  const onlyBean: MenuItem = {
    ...menu[0]!,
    selectedBeanId: 'coffee-beans',
  };
  close(beanPriceAdjustment(onlyBean, suppliers), 0);
  close(simpleCogsForMenuItem(onlyBean, suppliers), 2);

  const stale: MenuItem = {
    ...menu[0]!,
    selectedBeanId: 'deleted-bean',
  };
  close(beanPriceAdjustment(stale, multiBeanSuppliers), 0);
  close(simpleCogsForMenuItem(stale, multiBeanSuppliers), 2);
});
