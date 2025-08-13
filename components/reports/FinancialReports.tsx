'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt, FileText, Calendar as CalendarIcon, Download } from 'lucide-react';
import { Sale, Expense, Purchase, Vendor, InventoryItem, VegetableItem } from '@/lib/firestore';


import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import Link from 'next/link';
import AddSaleDialog from './AddSaleDialog';
import AddExpenseDialog from './AddExpenseDialog';

interface FinancialReportsProps {
  sales: Sale[];
  expenses: Expense[];
  purchases: Purchase[];
  vendors: Vendor[];
  inventory: InventoryItem[];
  vegetables: VegetableItem[];
  onAddSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  onLoadFinancialData: (startDate: string, endDate: string) => Promise<{
    sales: Sale[];
    expenses: Expense[];
    purchases: Purchase[];
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function FinancialReports({
  sales,
  expenses,
  purchases,
  vendors,
  inventory,
  vegetables,
  onAddSale,
  onAddExpense,
  onLoadFinancialData
}: FinancialReportsProps) {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState<Date>(startOfMonth(new Date()));
  const [customEndDate, setCustomEndDate] = useState<Date>(endOfMonth(new Date()));
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [filteredData, setFilteredData] = useState<{
    sales: Sale[];
    expenses: Expense[];
    purchases: Purchase[];
  }>({ sales, expenses, purchases });

  // Calculate date range
  const getDateRange = () => {
    const today = new Date();
    switch (dateRange) {
      case 'today':
        return { start: format(today, 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') };
      case 'week':
        return {
          start: format(startOfWeek(today), 'yyyy-MM-dd'),
          end: format(endOfWeek(today), 'yyyy-MM-dd')
        };
      case 'month':
        return {
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd')
        };
      case 'custom':
        return {
          start: format(customStartDate, 'yyyy-MM-dd'),
          end: format(customEndDate, 'yyyy-MM-dd')
        };
      default:
        return { start: format(startOfMonth(today), 'yyyy-MM-dd'), end: format(endOfMonth(today), 'yyyy-MM-dd') };
    }
  };

  // Load filtered data when date range changes
  useEffect(() => {
    const loadData = async () => {
      const { start, end } = getDateRange();
      const data = await onLoadFinancialData(start, end);
      setFilteredData(data);
    };
    loadData();
  }, [dateRange, customStartDate, customEndDate]);

  // Calculate financial metrics
  const metrics = useMemo(() => {
    const totalSales = filteredData.sales.reduce((sum, sale) => sum + sale.totalSaleAmount, 0);
    const totalExpenses = filteredData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalPurchases = filteredData.purchases.reduce((sum, purchase) => {
      // Use actual received amount if weight was verified, otherwise use original amount
      if (purchase.receivedWeight && purchase.receivedWeight !== purchase.orderedWeight) {
        return sum + (purchase.receivedWeight * purchase.pricePerKg);
      }
      return sum + purchase.totalAmount;
    }, 0);
    const grossProfit = totalSales - totalPurchases;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    return {
      totalSales,
      totalExpenses,
      totalPurchases,
      grossProfit,
      netProfit,
      profitMargin
    };
  }, [filteredData]);

  // Prepare chart data
  const dailyRevenueData = useMemo(() => {
    const salesByDate = filteredData.sales.reduce((acc, sale) => {
      const date = sale.saleDate;
      acc[date] = (acc[date] || 0) + sale.totalSaleAmount;
      return acc;
    }, {} as Record<string, number>);

    const expensesByDate = filteredData.expenses.reduce((acc, expense) => {
      const date = expense.expenseDate;
      acc[date] = (acc[date] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const purchasesByDate = filteredData.purchases.reduce((acc, purchase) => {
      const date = purchase.purchaseDate;
      // Use actual received amount if weight was verified, otherwise use original amount
      const actualAmount = (purchase.receivedWeight && purchase.receivedWeight !== purchase.orderedWeight)
        ? purchase.receivedWeight * purchase.pricePerKg
        : purchase.totalAmount;
      acc[date] = (acc[date] || 0) + actualAmount;
      return acc;
    }, {} as Record<string, number>);

    const allDates = new Set([
      ...Object.keys(salesByDate),
      ...Object.keys(expensesByDate),
      ...Object.keys(purchasesByDate)
    ]);

    return Array.from(allDates)
      .sort()
      .map(date => ({
        date: format(parseISO(date), 'MMM dd'),
        sales: salesByDate[date] || 0,
        expenses: expensesByDate[date] || 0,
        purchases: purchasesByDate[date] || 0,
        profit: (salesByDate[date] || 0) - (purchasesByDate[date] || 0) - (expensesByDate[date] || 0)
      }));
  }, [filteredData]);

  // Vendor-wise profit analysis
  const vendorProfitData = useMemo(() => {
    const vendorData = vendors.map(vendor => {
      const vendorPurchases = filteredData.purchases.filter(p => p.vendorId === vendor.id);
      const totalCost = vendorPurchases.reduce((sum, p) => {
        // Use actual received amount if weight was verified, otherwise use original amount
        if (p.receivedWeight && p.receivedWeight !== p.orderedWeight) {
          return sum + (p.receivedWeight * p.pricePerKg);
        }
        return sum + p.totalAmount;
      }, 0);

      // Calculate estimated sales for this vendor's items
      // const vendorItems = [...new Set(vendorPurchases.map(p => p.vegetable))];
      const seen: Record<string, boolean> = {};
      const vendorItems: string[] = [];

      for (const p of vendorPurchases) {
        if (!seen[p.vegetable]) {
          seen[p.vegetable] = true;
          vendorItems.push(p.vegetable);
        }
      }

      const estimatedSales = filteredData.sales
        .filter(s => vendorItems.includes(s.vegetable))
        .reduce((sum, s) => sum + s.totalSaleAmount, 0);

      const profit = estimatedSales - totalCost;
      const margin = estimatedSales > 0 ? (profit / estimatedSales) * 100 : 0;

      return {
        vendorName: vendor.name,
        totalCost,
        estimatedSales,
        profit,
        margin: Math.round(margin * 100) / 100
      };
    }).filter(v => v.totalCost > 0);

    return vendorData.sort((a, b) => b.profit - a.profit);
  }, [vendors, filteredData]);

  // Expense breakdown
  const expenseBreakdown = useMemo(() => {
    const breakdown = filteredData.expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(breakdown).map(([category, amount]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      amount,
      percentage: Math.round((amount / metrics.totalExpenses) * 100)
    }));
  }, [filteredData.expenses, metrics.totalExpenses]);

  // Generate GST report data
  const gstReportData = useMemo(() => {
    const gstRate = 0; // Most vegetables are GST-free, but you can adjust this
    const taxableSales = metrics.totalSales;
    const gstAmount = taxableSales * (gstRate / 100);

    return {
      taxableSales,
      gstRate,
      gstAmount,
      totalWithGst: taxableSales + gstAmount,
      period: `${format(parseISO(getDateRange().start), 'MMM dd, yyyy')} - ${format(parseISO(getDateRange().end), 'MMM dd, yyyy')}`
    };
  }, [metrics.totalSales]);

  const handleAddSale = async (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    await onAddSale(saleData);
    setIsAddSaleOpen(false);
    // Refresh data
    const { start, end } = getDateRange();
    const data = await onLoadFinancialData(start, end);
    setFilteredData(data);
  };

  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    await onAddExpense(expenseData);
    setIsAddExpenseOpen(false);
    // Refresh data
    const { start, end } = getDateRange();
    const data = await onLoadFinancialData(start, end);
    setFilteredData(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Financial Reports & Analytics</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button onClick={() => setIsAddSaleOpen(true)} className="bg-green-600 hover:bg-green-700">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add Sale
          </Button>
          <Button onClick={() => setIsAddExpenseOpen(true)} variant="outline">
            <Receipt className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {dateRange === 'custom' && (
              <div className="flex items-center space-x-2">
                <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[140px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(customStartDate, 'MMM dd')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={(date) => {
                        if (date) {
                          setCustomStartDate(date);
                          setIsStartDateOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span>to</span>
                <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[140px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(customEndDate, 'MMM dd')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={(date) => {
                        if (date) {
                          setCustomEndDate(date);
                          setIsEndDateOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Total Sales</p>
                <div className="text-2xl font-bold text-green-900">₹{metrics.totalSales.toLocaleString()}</div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Purchases</p>
                <div className="text-2xl font-bold text-blue-900">₹{metrics.totalPurchases.toLocaleString()}</div>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Total Expenses</p>
                <div className="text-2xl font-bold text-orange-900">₹{metrics.totalExpenses.toLocaleString()}</div>
              </div>
              <Receipt className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${metrics.netProfit >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${metrics.netProfit >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>Net Profit</p>
                <div className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                  ₹{metrics.netProfit.toLocaleString()}
                </div>
                <p className={`text-xs ${metrics.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {metrics.profitMargin.toFixed(1)}% margin
                </p>
              </div>
              {metrics.netProfit >= 0 ?
                <TrendingUp className="h-8 w-8 text-emerald-600" /> :
                <TrendingDown className="h-8 w-8 text-red-600" />
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Analysis</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="tax">Tax Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue & Profit Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, '']} />
                    <Bar dataKey="sales" fill="#10B981" name="Sales" />
                    <Bar dataKey="purchases" fill="#3B82F6" name="Purchases" />
                    <Bar dataKey="expenses" fill="#F59E0B" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Profit Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Profit Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Profit']} />
                    <Line type="monotone" dataKey="profit" stroke="#059669" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor-wise Profit Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendorProfitData.map((vendor, index) => (
                  <div key={vendor.vendorName} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <span className="text-blue-600 font-bold">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{vendor.vendorName}</p>
                        <p className="text-sm text-gray-600">
                          Cost: ₹{vendor.totalCost.toLocaleString()} | Sales: ₹{vendor.estimatedSales.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${vendor.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{vendor.profit.toLocaleString()}
                      </div>
                      <Badge variant={vendor.margin >= 0 ? 'default' : 'destructive'}>
                        {vendor.margin.toFixed(1)}% margin
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense Breakdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percentage }) => `${category} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expense Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Expense Categories</CardTitle>
                  <Link href="/expenses">
                    <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                      <Receipt className="h-4 w-4 mr-2" />
                      View All Expenses
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseBreakdown.map((expense, index) => (
                    <div key={expense.category} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{expense.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">₹{expense.amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{expense.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tax" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>GST Report</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Report Period</h4>
                  <p className="text-gray-600">{gstReportData.period}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="font-medium">Taxable Sales</span>
                      <span className="font-bold">₹{gstReportData.taxableSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="font-medium">GST Rate</span>
                      <span className="font-bold">{gstReportData.gstRate}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="font-medium">GST Amount</span>
                      <span className="font-bold">₹{gstReportData.gstAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg bg-green-50 border-green-200">
                      <span className="font-medium text-green-800">Total with GST</span>
                      <span className="font-bold text-green-900">₹{gstReportData.totalWithGst.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Note</h4>
                    <p className="text-sm text-blue-800">
                      Most fresh vegetables and fruits are exempt from GST. This report assumes 0% GST rate.
                      Please consult with your tax advisor for accurate GST calculations based on your specific products and business structure.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddSaleDialog
        isOpen={isAddSaleOpen}
        onClose={() => setIsAddSaleOpen(false)}
        onAddSale={handleAddSale}
        inventory={inventory}
        vegetables={vegetables}
      />

      <AddExpenseDialog
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onAddExpense={handleAddExpense}
      />
    </div>
  );
}