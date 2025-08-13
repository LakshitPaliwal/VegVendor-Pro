'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarIcon, Receipt, ArrowLeft, Search, Filter, X, Plus } from 'lucide-react';
import { Expense, getExpenses, addExpense as addExpenseToFirestore } from '@/lib/firestore';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import AddExpenseDialog from '@/components/reports/AddExpenseDialog';

const categoryOptions = [
  { value: 'transportation', label: 'Transportation', color: 'bg-blue-100 text-blue-800' },
  { value: 'storage', label: 'Storage', color: 'bg-green-100 text-green-800' },
  { value: 'utilities', label: 'Utilities', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'labor', label: 'Labor', color: 'bg-purple-100 text-purple-800' },
  { value: 'rent', label: 'Rent', color: 'bg-red-100 text-red-800' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-orange-100 text-orange-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const expensesData = await getExpenses();
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply all filters using useMemo for performance
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Search filter
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           expense.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Date filter
      const matchesDate = !selectedDate || expense.expenseDate === format(selectedDate, 'yyyy-MM-dd');
      
      // Category filter
      const matchesCategory = !selectedCategory || selectedCategory === 'all-categories' || expense.category === selectedCategory;
      
      return matchesSearch && matchesDate && matchesCategory;
    });
  }, [expenses, searchTerm, selectedDate, selectedCategory]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDate(undefined);
    setSelectedCategory('all-categories');
  };

  // Group expenses by date
  const expensesByDate = filteredExpenses.reduce((groups, expense) => {
    const date = expense.expenseDate;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(expense);
    return groups;
  }, {} as Record<string, Expense[]>);

  // Sort dates in descending order
  const sortedDates = Object.keys(expensesByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Helper function to get actual purchase amount (for consistency with other pages)
  const getActualAmount = (purchase: any) => {
    if (purchase.receivedWeight && purchase.receivedWeight !== purchase.orderedWeight) {
      return purchase.receivedWeight * purchase.pricePerKg;
    }
    return purchase.totalAmount;
  };

  // Calculate totals
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const hasActiveFilters = searchTerm || selectedDate || (selectedCategory && selectedCategory !== 'all-categories');

  const getCategoryInfo = (category: string) => {
    return categoryOptions.find(opt => opt.value === category) || 
           { value: category, label: category.charAt(0).toUpperCase() + category.slice(1), color: 'bg-gray-100 text-gray-800' };
  };

  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    try {
      await addExpenseToFirestore(expenseData);
      await loadExpenses(); // Refresh the list
      setIsAddExpenseOpen(false);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6">
          <Link href="/">
            <Button variant="outline" className="mb-4 text-sm sm:text-base">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Receipt className="h-6 w-6 text-orange-600" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">All Expenses</h1>
              </div>
              <p className="text-gray-600">Complete expense history and management</p>
            </div>
            <Button 
              onClick={() => setIsAddExpenseOpen(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Filters Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="ml-auto text-xs sm:text-sm"
                  >
                    <X className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Clear All</span>
                    <span className="sm:hidden">Clear</span>
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Search Filter */}
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="Search by description or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Date Filter */}
                <div>
                  <Label htmlFor="date-filter">Filter by Date</Label>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="date-filter"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="truncate">
                          {selectedDate ? format(selectedDate, 'PPP') : 'All dates'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setIsDatePickerOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Category Filter */}
                <div>
                  <Label htmlFor="category-filter">Filter by Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category-filter">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-categories">All categories</SelectItem>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
            <div className="text-sm text-gray-600 order-2 sm:order-1">
              {filteredExpenses.length} expense(s) found
              {hasActiveFilters && (
                <span className="ml-2 text-orange-600">
                  (filtered from {expenses.length} total)
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 order-1 sm:order-2">
              {selectedDate && (
                <Badge variant="secondary">
                  <span className="hidden sm:inline">Date: </span>{format(selectedDate, 'MMM d, yyyy')}
                </Badge>
              )}
              {selectedCategory && selectedCategory !== 'all-categories' && (
                <Badge variant="secondary">
                  <span className="hidden sm:inline">Category: </span>
                  {getCategoryInfo(selectedCategory).label}
                </Badge>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-3 sm:p-4">
                <div className="text-lg sm:text-2xl font-bold text-orange-900">₹{totalAmount.toLocaleString()}</div>
                <p className="text-xs text-orange-700">Total Amount</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-3 sm:p-4">
                <div className="text-lg sm:text-2xl font-bold text-blue-900">{filteredExpenses.length}</div>
                <p className="text-xs text-blue-700">Total Expenses</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-3 sm:p-4">
                <div className="text-lg sm:text-2xl font-bold text-green-900">
                  {filteredExpenses.length > 0 ? Math.round(totalAmount / filteredExpenses.length) : 0}
                </div>
                <p className="text-xs text-green-700">Avg per Expense</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-3 sm:p-4">
                <div className="text-lg sm:text-2xl font-bold text-purple-900">
                  {Object.keys(expensesByCategory).length}
                </div>
                <p className="text-xs text-purple-700">Categories Used</p>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          {Object.keys(expensesByCategory).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(expensesByCategory).map(([category, amount]) => {
                    const categoryInfo = getCategoryInfo(category);
                    const percentage = Math.round((amount / totalAmount) * 100);
                    return (
                      <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge className={categoryInfo.color}>
                            {categoryInfo.label}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">₹{amount.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">{percentage}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expense History */}
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <span className="ml-2 text-gray-600">Loading expenses...</span>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">No expenses found</p>
                  <p className="text-gray-600">
                    {searchTerm 
                      ? `No expenses match "${searchTerm}"`
                      : "No expense history available."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {sortedDates.map((date) => (
                  <Card key={date}>
                    <CardHeader>
                      <CardTitle className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <span className="text-base sm:text-lg">{format(parseISO(date), 'EEEE, MMMM d, yyyy')}</span>
                        <Badge variant="outline" className="self-start sm:self-center">
                          {expensesByDate[date].length} expense(s)
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 sm:space-y-4">
                        {expensesByDate[date].map((expense, index) => {
                          const categoryInfo = getCategoryInfo(expense.category);
                          return (
                            <div key={expense.id}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors space-y-3 sm:space-y-0">
                                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                                  <div className="bg-orange-100 p-2 rounded-lg">
                                    <Receipt className="h-4 w-4 text-orange-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-base sm:text-lg truncate">{expense.description}</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <Badge className={`${categoryInfo.color} text-xs`}>
                                        {categoryInfo.label}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end sm:text-right space-x-4 sm:space-x-2">
                                  <div className="text-sm text-gray-600 text-right">
                                    <p className="font-semibold text-orange-600 text-lg">₹{expense.amount.toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                              {index < expensesByDate[date].length - 1 && (
                                <Separator className="my-2" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Date Summary */}
                      <Separator className="my-4" />
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm space-y-2 sm:space-y-0">
                        <span className="text-gray-600">
                          Total for {format(parseISO(date), 'MMM d, yyyy')}:
                        </span>
                        <div className="flex space-x-4">
                          <span className="font-medium">
                            {expensesByDate[date].length} expense(s)
                          </span>
                          <span className="font-semibold text-orange-600">
                            ₹{expensesByDate[date].reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddExpenseDialog
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onAddExpense={handleAddExpense}
      />
    </div>
  );
}