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
import { Calendar as CalendarIcon, Package, Scale, CheckCircle, XCircle, Search, Loader2, ArrowLeft, Filter, X } from 'lucide-react';
import { Purchase, getPurchases, getVendors, Vendor } from '@/lib/firestore';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';

export default function AllPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [purchasesData, vendorsData] = await Promise.all([
        getPurchases(),
        getVendors()
      ]);
      setPurchases(purchasesData);
      setVendors(vendorsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply all filters using useMemo for performance
  const filteredPurchases = useMemo(() => {
    return purchases.filter(purchase => {
      // Search filter
      const matchesSearch = purchase.vegetable.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           purchase.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Date filter
      const matchesDate = !selectedDate || purchase.purchaseDate === format(selectedDate, 'yyyy-MM-dd');
      
      // Vendor filter
      const matchesVendor = !selectedVendor || selectedVendor === 'all-vendors' || purchase.vendorId === selectedVendor;
      
      return matchesSearch && matchesDate && matchesVendor;
    });
  }, [purchases, searchTerm, selectedDate, selectedVendor]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDate(undefined);
    setSelectedVendor('all-vendors');
  };

  // Group purchases by date
  const purchasesByDate = filteredPurchases.reduce((groups, purchase) => {
    const date = purchase.purchaseDate;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(purchase);
    return groups;
  }, {} as Record<string, Purchase[]>);

  // Sort dates in descending order
  const sortedDates = Object.keys(purchasesByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Helper function to get actual purchase amount
  const getActualAmount = (purchase: Purchase) => {
    if (purchase.receivedWeight && purchase.receivedWeight !== purchase.orderedWeight) {
      return purchase.receivedWeight * purchase.pricePerKg;
    }
    return purchase.totalAmount;
  };

  const totalAmount = filteredPurchases.reduce((sum, purchase) => sum + getActualAmount(purchase), 0);
  const totalWeight = filteredPurchases.reduce((sum, purchase) => sum + (purchase.receivedWeight || purchase.orderedWeight), 0);
  const pendingVerifications = filteredPurchases.filter(p => p.verificationStatus === 'pending').length;
  const discrepancies = filteredPurchases.filter(p => p.verificationStatus === 'discrepancy').length;
  
  const hasActiveFilters = searchTerm || selectedDate || (selectedVendor && selectedVendor !== 'all-vendors');

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
          <div className="flex items-center space-x-2 mb-2">
            <Package className="h-6 w-6 text-green-600" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">All Purchases - Complete History</h1>
          </div>
          <p className="text-gray-600">Complete purchase history across all dates and vendors</p>
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
                      placeholder="Search by vegetable or vendor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Date Filter */}
                <div className="sm:col-span-2 lg:col-span-1">
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

                {/* Vendor Filter */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="vendor-filter">Filter by Vendor</Label>
                  <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                    <SelectTrigger id="vendor-filter">
                      <SelectValue placeholder="All vendors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-vendors">All vendors</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
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
              {filteredPurchases.length} purchase(s) found
              {hasActiveFilters && (
                <span className="ml-2 text-blue-600">
                  (filtered from {purchases.length} total)
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 order-1 sm:order-2">
              {selectedDate && (
                <Badge variant="secondary">
                  <span className="hidden sm:inline">Date: </span>{format(selectedDate, 'MMM d, yyyy')}
                </Badge>
              )}
              {selectedVendor && (
                <Badge variant="secondary">
                  <span className="hidden sm:inline">Vendor: </span>
                  <span className="truncate max-w-[120px]">
                    {selectedVendor === 'all-vendors' ? 'All vendors' : vendors.find(v => v.id === selectedVendor)?.name}
                  </span>
                </Badge>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-3 sm:p-4">
                <div className="text-lg sm:text-2xl font-bold text-green-900">₹{totalAmount.toLocaleString()}</div>
                <p className="text-xs text-green-700">Total Amount</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-3 sm:p-4">
                <div className="text-lg sm:text-2xl font-bold text-blue-900">{totalWeight.toFixed(1)} kg</div>
                <p className="text-xs text-blue-700">Total Weight</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-3 sm:p-4">
                <div className="text-lg sm:text-2xl font-bold text-orange-900">{pendingVerifications}</div>
                <p className="text-xs text-orange-700">Pending</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-3 sm:p-4">
                <div className="text-lg sm:text-2xl font-bold text-red-900">{discrepancies}</div>
                <p className="text-xs text-red-700">Discrepancies</p>
              </CardContent>
            </Card>
          </div>

          {/* Purchase History */}
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2 text-green-600" />
                <span className="text-gray-600">Loading all purchases...</span>
              </div>
            ) : filteredPurchases.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">No purchases found</p>
                  <p className="text-gray-600">
                    {searchTerm 
                      ? `No purchases match "${searchTerm}"`
                      : "No purchase history available."
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
                          {purchasesByDate[date].length} purchase(s)
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 sm:space-y-4">
                        {purchasesByDate[date].map((purchase, index) => (
                          <div key={purchase.id}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors space-y-3 sm:space-y-0">
                              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                                <div className="bg-green-100 p-2 rounded-lg">
                                  <Package className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-base sm:text-lg truncate">{purchase.vegetable}</p>
                                  <p className="text-sm text-gray-600 mb-1 truncate">{purchase.vendorName}</p>
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-600 space-y-1 sm:space-y-0">
                                    <span>Ordered: {purchase.orderedWeight} kg</span>
                                    {purchase.receivedWeight && (
                                      <span className={purchase.discrepancyAmount ? "text-red-600" : "text-green-600"}>
                                        Received: {purchase.receivedWeight} kg
                                        {purchase.discrepancyAmount && (
                                          <span className="text-red-500 ml-1">
                                            (-{purchase.discrepancyAmount} kg)
                                          </span>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end sm:text-right space-x-4 sm:space-x-2">
                                <div className="flex items-center space-x-2">
                                  <Badge variant={
                                    purchase.verificationStatus === 'verified' ? 'default' :
                                    purchase.verificationStatus === 'discrepancy' ? 'destructive' :
                                    'secondary'
                                  } className="text-xs">
                                    {purchase.verificationStatus === 'pending' && <Scale className="h-3 w-3 mr-1" />}
                                    {purchase.verificationStatus === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
                                    {purchase.verificationStatus === 'discrepancy' && <XCircle className="h-3 w-3 mr-1" />}
                                    {purchase.verificationStatus}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600 text-right">
                                  <p>₹{purchase.pricePerKg}/kg</p>
                                  <p className="font-semibold text-green-600">
                                    {purchase.receivedWeight && purchase.receivedWeight !== purchase.orderedWeight ? (
                                      <div>
                                        <span className="text-green-600">₹{(purchase.receivedWeight * purchase.pricePerKg).toLocaleString()}</span>
                                        <div className="text-xs text-gray-500 line-through">₹{purchase.totalAmount.toLocaleString()}</div>
                                      </div>
                                    ) : (
                                      `₹${purchase.totalAmount.toLocaleString()}`
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {index < purchasesByDate[date].length - 1 && (
                              <Separator className="my-2" />
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Date Summary */}
                      <Separator className="my-4" />
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm space-y-2 sm:space-y-0">
                        <span className="text-gray-600">
                          Total for {format(parseISO(date), 'MMM d, yyyy')}:
                        </span>
                        <div className="flex space-x-4">
                          <span className="font-medium">
                            {purchasesByDate[date].reduce((sum, p) => sum + (p.receivedWeight || p.orderedWeight), 0).toFixed(1)} kg
                          </span>
                          <span className="font-semibold text-green-600">
                            ₹{purchasesByDate[date].reduce((sum, p) => sum + getActualAmount(p), 0).toLocaleString()}
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
    </div>
  );
}