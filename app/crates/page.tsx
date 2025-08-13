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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Package, ArrowLeft, Search, Filter, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Purchase, getPurchases, getVendors, Vendor, updatePurchase } from '@/lib/firestore';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';

interface CrateReturn {
  purchaseId: string;
  returnDate: string;
  returnedCrates: number;
}

export default function CratesManagementPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [returnDate, setReturnDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [cratesToReturnInput, setCratesToReturnInput] = useState('');
  const [cratesToReturn, setCratesToReturn] = useState(0);

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

  // Filter purchases that have crates
  const purchasesWithCrates = purchases.filter(p => p.cratesCount && p.cratesCount > 0);

  // Apply filters
  const filteredPurchases = useMemo(() => {
    return purchasesWithCrates.filter(purchase => {
      // Search filter
      const matchesSearch = purchase.vegetable.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           purchase.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Date filter
      const matchesDate = !selectedDate || purchase.purchaseDate === format(selectedDate, 'yyyy-MM-dd');
      
      // Vendor filter
      const matchesVendor = !selectedVendor || selectedVendor === 'all-vendors' || purchase.vendorId === selectedVendor;
      
      return matchesSearch && matchesDate && matchesVendor;
    });
  }, [purchasesWithCrates, searchTerm, selectedDate, selectedVendor]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDate(undefined);
    setSelectedVendor('all-vendors');
  };

  // Group purchases by vendor
  const purchasesByVendor = filteredPurchases.reduce((groups, purchase) => {
    const vendorId = purchase.vendorId;
    if (!groups[vendorId]) {
      groups[vendorId] = {
        vendorName: purchase.vendorName,
        purchases: []
      };
    }
    groups[vendorId].purchases.push(purchase);
    return groups;
  }, {} as Record<string, { vendorName: string, purchases: Purchase[] }>);

  // Calculate totals
  const totalCrates = filteredPurchases.reduce((sum, purchase) => sum + (purchase.cratesCount || 0), 0);
  const returnedCrates = filteredPurchases.reduce((sum, purchase) => sum + (purchase.returnedCrates || 0), 0);
  const pendingCrates = totalCrates - returnedCrates;

  const hasActiveFilters = searchTerm || selectedDate || (selectedVendor && selectedVendor !== 'all-vendors');

  const handleReturnCrates = async () => {
    if (!selectedPurchase || cratesToReturn <= 0) return;

    try {
      const currentReturned = selectedPurchase.returnedCrates || 0;
      const newReturnedTotal = currentReturned + cratesToReturn;
      
      // Update purchase with returned crates info
      await updatePurchase(selectedPurchase.id, {
        returnedCrates: newReturnedTotal,
        lastReturnDate: returnDate,
        crateStatus: newReturnedTotal >= (selectedPurchase.cratesCount || 0) ? 'returned' : 'partial'
      });

      // Update local state
      setPurchases(prev => prev.map(p => 
        p.id === selectedPurchase.id 
          ? { 
              ...p, 
              returnedCrates: newReturnedTotal,
              lastReturnDate: returnDate,
              crateStatus: newReturnedTotal >= (p.cratesCount || 0) ? 'returned' : 'partial'
            }
          : p
      ));

      // Reset form
      setCratesToReturn(0);
      setReturnDate(format(new Date(), 'yyyy-MM-dd'));
      setIsReturnDialogOpen(false);
      setSelectedPurchase(null);
    } catch (error) {
      console.error('Error returning crates:', error);
    }
  };

  const openReturnDialog = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setCratesToReturn(0);
    setIsReturnDialogOpen(true);
  };

  const getCrateStatus = (purchase: Purchase) => {
    const total = purchase.cratesCount || 0;
    const returned = purchase.returnedCrates || 0;
    
    if (returned === 0) return 'pending';
    if (returned >= total) return 'returned';
    return 'partial';
  };

  const getCrateStatusBadge = (status: string) => {
    switch (status) {
      case 'returned':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Returned</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Partial</Badge>;
      default:
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
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
          <div className="flex items-center space-x-2 mb-2">
            <Package className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Crates Management</h1>
          </div>
          <p className="text-gray-600">Track and manage crates that need to be returned to wholesale vendors</p>
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

                {/* Vendor Filter */}
                <div>
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

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-900">{totalCrates}</div>
                <p className="text-sm text-blue-700">Total Crates</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-900">{returnedCrates}</div>
                <p className="text-sm text-green-700">Returned Crates</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-900">{pendingCrates}</div>
                <p className="text-sm text-red-700">Pending Returns</p>
              </CardContent>
            </Card>
          </div>

          {/* Results Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
            <div className="text-sm text-gray-600">
              {filteredPurchases.length} purchase(s) with crates found
              {hasActiveFilters && (
                <span className="ml-2 text-blue-600">
                  (filtered from {purchasesWithCrates.length} total)
                </span>
              )}
            </div>
          </div>

          {/* Crates by Vendor */}
          {Object.keys(purchasesByVendor).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900">No crates found</p>
                <p className="text-gray-600">No purchases with crates match your current filters.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(purchasesByVendor).map(([vendorId, { vendorName, purchases }]) => (
                <Card key={vendorId}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{vendorName}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {purchases.length} purchase(s)
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {purchases.reduce((sum, p) => sum + (p.cratesCount || 0), 0)} total crates
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {purchases.map((purchase, index) => (
                        <div key={purchase.id}>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors space-y-3 sm:space-y-0">
                            <div className="flex items-center space-x-4 min-w-0 flex-1">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <Package className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-lg">{purchase.vegetable}</p>
                                <p className="text-sm text-gray-600 mb-1">
                                  Purchase Date: {format(parseISO(purchase.purchaseDate), 'MMM d, yyyy')}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  <span className="text-blue-600 font-medium">
                                    {purchase.cratesCount} crates total
                                    {purchase.vendorCrateCode && (
                                      <span className="text-blue-700 ml-1 font-mono">
                                        (Code: {purchase.vendorCrateCode})
                                      </span>
                                    )}
                                  </span>
                                  {purchase.returnedCrates > 0 && (
                                    <span className="text-green-600">
                                      • {purchase.returnedCrates} returned
                                    </span>
                                  )}
                                  {purchase.lastReturnDate && (
                                    <span className="text-gray-500">
                                      • Last return: {format(parseISO(purchase.lastReturnDate), 'MMM d, yyyy')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {getCrateStatusBadge(getCrateStatus(purchase))}
                              {getCrateStatus(purchase) !== 'returned' && (
                                <Button
                                  onClick={() => openReturnDialog(purchase)}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Return Crates
                                </Button>
                              )}
                            </div>
                          </div>
                          {index < purchases.length - 1 && <Separator className="my-2" />}
                        </div>
                      ))}
                    </div>
                    
                    {/* Vendor Summary */}
                    <Separator className="my-4" />
                    <div className="flex justify-between items-center text-sm bg-blue-50 p-3 rounded-lg">
                      <span className="text-blue-800 font-medium">
                        Total for {vendorName}:
                      </span>
                      <div className="flex space-x-4">
                        <span className="font-medium text-blue-700">
                          {purchases.reduce((sum, p) => sum + (p.cratesCount || 0), 0)} crates
                        </span>
                        <span className="font-medium text-green-600">
                          {purchases.reduce((sum, p) => sum + (p.returnedCrates || 0), 0)} returned
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

      {/* Return Crates Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Crates</DialogTitle>
            <DialogDescription>
              Record the return of crates to the wholesale vendor
            </DialogDescription>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Vegetable:</span>
                  <span>{selectedPurchase.vegetable}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Vendor:</span>
                  <span>{selectedPurchase.vendorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Crates:</span>
                  <span className="font-bold text-blue-600">{selectedPurchase.cratesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Already Returned:</span>
                  <span className="font-bold text-green-600">{selectedPurchase.returnedCrates || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Remaining:</span>
                  <span className="font-bold text-red-600">
                    {(selectedPurchase.cratesCount || 0) - (selectedPurchase.returnedCrates || 0)}
                  </span>
                </div>
                {selectedPurchase.vendorCrateCode && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-2">Vendor Crate Code:</p>
                    <div className="text-lg font-mono font-bold text-blue-700 bg-blue-100 px-3 py-2 rounded inline-block">
                      {selectedPurchase.vendorCrateCode}
                    </div>
                    <p className="text-xs text-blue-600 mt-2">All crates from this vendor have the same code</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="returnDate">Return Date</Label>
                <Input
                  id="returnDate"
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="cratesToReturn">Number of Crates to Return</Label>
                <Input
                  id="cratesToReturn"
                  type="number"
                  min="1"
                  max={(selectedPurchase.cratesCount || 0) - (selectedPurchase.returnedCrates || 0)}
                  value={cratesToReturn}
                  onChange={(e) => setCratesToReturn(parseInt(e.target.value) || 0)}
                  placeholder="Enter number of crates"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {(selectedPurchase.cratesCount || 0) - (selectedPurchase.returnedCrates || 0)} crates available
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleReturnCrates} 
                  className="flex-1" 
                  disabled={cratesToReturn <= 0 || cratesToReturn > ((selectedPurchase.cratesCount || 0) - (selectedPurchase.returnedCrates || 0))}
                >
                  Record Return
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsReturnDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}