'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Calendar, Package, Scale, CheckCircle, XCircle, Search, Loader2 } from 'lucide-react';
import { Purchase } from '@/lib/firestore';
import { format, parseISO } from 'date-fns';

interface AllPurchasesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadAllPurchases: () => Promise<Purchase[]>;
}

export default function AllPurchasesDialog({
  isOpen,
  onClose,
  onLoadAllPurchases
}: AllPurchasesDialogProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAllPurchases();
    }
  }, [isOpen]);

  useEffect(() => {
    const filtered = purchases.filter(purchase =>
      purchase.vegetable.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPurchases(filtered);
  }, [purchases, searchTerm]);

  const loadAllPurchases = async () => {
    try {
      setLoading(true);
      const allPurchases = await onLoadAllPurchases();
      setPurchases(allPurchases);
      setFilteredPurchases(allPurchases);
    } catch (error) {
      console.error('Error loading all purchases:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-green-600" />
            <span>All Purchases - Complete History</span>
          </DialogTitle>
          <DialogDescription>
            Complete purchase history across all dates and vendors
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search and Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by vegetable or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-gray-600">
              {filteredPurchases.length} purchase(s) found
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-900">₹{totalAmount.toLocaleString()}</div>
                <p className="text-xs text-green-700">Total Amount</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-900">{totalWeight.toFixed(1)} kg</div>
                <p className="text-xs text-blue-700">Total Weight</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-900">{pendingVerifications}</div>
                <p className="text-xs text-orange-700">Pending</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-900">{discrepancies}</div>
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
              <div className="space-y-6">
                {sortedDates.map((date) => (
                  <Card key={date}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>{format(parseISO(date), 'EEEE, MMMM d, yyyy')}</span>
                        <Badge variant="outline">
                          {purchasesByDate[date].length} purchase(s)
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {purchasesByDate[date].map((purchase, index) => (
                          <div key={purchase.id}>
                            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center space-x-4">
                                <div className="bg-green-100 p-2 rounded-lg">
                                  <Package className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-lg">{purchase.vegetable}</p>
                                  <p className="text-sm text-gray-600 mb-1">{purchase.vendorName}</p>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                              <div className="text-right">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge variant={
                                    purchase.verificationStatus === 'verified' ? 'default' :
                                    purchase.verificationStatus === 'discrepancy' ? 'destructive' :
                                    'secondary'
                                  }>
                                    {purchase.verificationStatus === 'pending' && <Scale className="h-3 w-3 mr-1" />}
                                    {purchase.verificationStatus === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
                                    {purchase.verificationStatus === 'discrepancy' && <XCircle className="h-3 w-3 mr-1" />}
                                    {purchase.verificationStatus}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600">
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
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          ₹{purchasesByDate[date].reduce((sum, p) => sum + getActualAmount(p), 0).toLocaleString()}
                        </span>
                        <div className="flex space-x-4">
                          <span className="font-medium">
                            {purchasesByDate[date].reduce((sum, p) => sum + (p.receivedWeight || p.orderedWeight), 0).toFixed(1)} kg
                          </span>
                          <span className="font-semibold text-green-600">
                            ₹{purchasesByDate[date].reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}
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
      </DialogContent>
    </Dialog>
  );
}