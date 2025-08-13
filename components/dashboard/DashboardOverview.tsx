'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Users, Scale, AlertTriangle, Package } from 'lucide-react';
import { Vendor, Purchase, InventoryItem } from '@/lib/firestore';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import Link from 'next/link';

interface DashboardOverviewProps {
  vendors: Vendor[];
  purchases: Purchase[];
  inventory: InventoryItem[];
  allPurchases: Purchase[];
  onSwitchToWeightCheck: () => void;
}

export default function DashboardOverview({
  vendors,
  purchases,
  inventory,
  allPurchases,
  onSwitchToWeightCheck
}: DashboardOverviewProps) {
  const [isPendingDialogOpen, setIsPendingDialogOpen] = useState(false);

  // Get all pending verifications across all dates (use allPurchases, not just today's purchases)
  const allPendingVerifications = allPurchases.filter(p => p.verificationStatus === 'pending');
  const pendingVerificationsCount = allPendingVerifications.length;
  const totalDiscrepancies = purchases.filter(p => p.verificationStatus === 'discrepancy').length;
  const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.totalStock * 50), 0);

  // Helper function to get actual purchase amount
  const getActualAmount = (purchase: Purchase) => {
    if (purchase.receivedWeight && purchase.receivedWeight !== purchase.orderedWeight) {
      return purchase.receivedWeight * purchase.pricePerKg;
    }
    return purchase.totalAmount;
  };

  // Group pending verifications by date
  const pendingByDate = allPendingVerifications.reduce((groups, purchase) => {
    const date = purchase.purchaseDate;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(purchase);
    return groups;
  }, {} as Record<string, Purchase[]>);

  // Sort dates in descending order (most recent first)
  const sortedPendingDates = Object.keys(pendingByDate).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/all-purchases">
            <Button
              variant="outline"
              className="text-blue-600 border-blue-200 hover:bg-blue-50 w-full sm:w-auto"
            >
              View All Purchases
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm font-medium text-green-800">Total Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold text-green-900">₹{totalInventoryValue.toLocaleString()}</div>
            <p className="text-xs text-green-700">Estimated current value</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm font-medium text-blue-800">Active Vendors</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold text-blue-900">{vendors.length}</div>
            <p className="text-xs text-blue-700">Wholesale suppliers</p>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={onSwitchToWeightCheck}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm font-medium text-orange-800">Pending Verifications</CardTitle>
            <Scale className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold text-orange-900">{pendingVerificationsCount}</div>
            <p className="text-xs text-orange-700">Awaiting weight check</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm font-medium text-red-800">Weight Discrepancies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold text-red-900">{totalDiscrepancies}</div>
            <p className="text-xs text-red-700">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Recent Purchase Activities</CardTitle>
          <CardDescription>Latest transactions and weight verifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {purchases.slice(0, 5).map((purchase) => (
              <div key={purchase.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Package className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{purchase.vegetable}</p>
                    <p className="text-sm text-gray-600">{purchase.vendorName}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end sm:text-right space-x-4 sm:space-x-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      purchase.verificationStatus === 'verified' ? 'default' :
                        purchase.verificationStatus === 'discrepancy' ? 'destructive' :
                          'secondary'
                    } className="text-xs">
                      {purchase.verificationStatus}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{purchase.orderedWeight} kg ordered</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Verifications Dialog */}
      <Dialog open={isPendingDialogOpen} onOpenChange={setIsPendingDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Scale className="h-5 w-5 text-orange-600" />
              <span>All Pending Weight Verifications</span>
            </DialogTitle>
            <DialogDescription>
              {pendingVerificationsCount} purchase(s) across all dates awaiting weight verification
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {pendingVerificationsCount === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Scale className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">All weights verified!</p>
                  <p className="text-gray-600">No pending weight verifications found.</p>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="w-full">
                {sortedPendingDates.map((date) => (
                  <AccordionItem key={date} value={date} className="border rounded-lg mb-4">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full mr-4">
                        <div className="flex items-center space-x-2">
                          <Scale className="h-4 w-4 text-orange-600" />
                          <span className="font-semibold">{format(parseISO(date), 'EEEE, MMMM d, yyyy')}</span>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {pendingByDate[date].length} pending
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">
                            {pendingByDate[date].reduce((sum, p) => sum + p.orderedWeight, 0).toFixed(1)} kg total
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <div className="space-y-4">
                        {pendingByDate[date].map((purchase, index) => (
                          <div key={purchase.id}>
                            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center space-x-4">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                  <Package className="h-4 w-4 text-orange-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-lg">{purchase.vegetable}</p>
                                  <p className="text-sm text-gray-600 mb-1">{purchase.vendorName}</p>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <span>Ordered: {purchase.orderedWeight} kg</span>
                                    <span>₹{purchase.pricePerKg}/kg</span>
                                    {/* {purchase.cratesCount > 0 && (
                                      <span className="text-blue-600">{purchase.cratesCount} crates</span>
                                    )} */}
                                    {(purchase.cratesCount ?? 0) > 0 && (
                                      <span className="text-blue-600">{purchase.cratesCount} crates</span>
                                    )}

                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="secondary" className="mb-2">
                                  <Scale className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                                <div className="text-sm text-gray-600">
                                  <p className="font-semibold text-green-600">₹{purchase.totalAmount}</p>
                                </div>
                              </div>
                            </div>
                            {index < pendingByDate[date].length - 1 && (
                              <Separator className="my-2" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Date Summary */}
                      <Separator className="my-4" />
                      <div className="flex justify-between items-center text-sm bg-orange-50 p-3 rounded-lg">
                        <span className="text-orange-800 font-medium">
                          Total for {format(parseISO(date), 'MMM d, yyyy')}:
                        </span>
                        <div className="flex space-x-4">
                          <span className="font-medium text-orange-700">
                            {pendingByDate[date].reduce((sum, p) => sum + p.orderedWeight, 0).toFixed(1)} kg
                          </span>
                          <span className="font-semibold text-green-600">
                            ₹{pendingByDate[date].reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}