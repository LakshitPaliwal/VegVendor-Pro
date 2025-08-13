'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scale, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Purchase, VegetableItem } from '@/lib/firestore';
import { format, parseISO } from 'date-fns';
import WeightVerificationDialog from './WeightVerificationDialog';

interface WeightVerificationProps {
  purchases: Purchase[];
  allPurchases: Purchase[];
  vegetables: VegetableItem[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onVerifyWeight: (purchaseId: string, receivedWeight: number) => Promise<void>;
}

export default function WeightVerification({
  purchases,
  allPurchases,
  vegetables,
  selectedDate,
  onDateChange,
  onVerifyWeight
}: WeightVerificationProps) {
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isVerifyWeightOpen, setIsVerifyWeightOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [showAllDates, setShowAllDates] = useState(true);
  
  // Filter purchases by selected date
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const filteredPurchases = purchases.filter(p => p.purchaseDate === dateString);
  const pendingPurchases = filteredPurchases.filter(p => p.verificationStatus === 'pending');
  
  // Get all pending purchases across all dates
  const allPendingPurchases = allPurchases.filter(p => p.verificationStatus === 'pending');
  
  // Group pending purchases by date and then by category
  const pendingByDate = allPendingPurchases.reduce((acc, purchase) => {
    const date = purchase.purchaseDate;
    if (!acc[date]) {
      acc[date] = { vegetables: [], fruits: [] };
    }
    
    // Find the vegetable item to get its category
    const vegetableItem = vegetables.find(v => v.name === purchase.vegetable);
    const category = vegetableItem?.category || 'vegetable';
    
    if (category === 'fruit') {
      acc[date].fruits.push(purchase);
    } else {
      acc[date].vegetables.push(purchase);
    }
    
    return acc;
  }, {} as Record<string, { vegetables: Purchase[], fruits: Purchase[] }>);
  
  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(pendingByDate).sort((a, b) => b.localeCompare(a));
  
  const pendingVerifications = showAllDates ? allPendingPurchases.length : pendingPurchases.length;

  const openVerifyWeight = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setIsVerifyWeightOpen(true);
  };

  const handleVerifyWeight = async (receivedWeight: number) => {
    if (selectedPurchase) {
      await onVerifyWeight(selectedPurchase.id, receivedWeight);
      setIsVerifyWeightOpen(false);
      setSelectedPurchase(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Weight Verification</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <Button
              variant={showAllDates ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAllDates(true)}
              className="text-xs sm:text-sm"
            >
              All Dates
            </Button>
            <Button
              variant={!showAllDates ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAllDates(false)}
              className="text-xs sm:text-sm"
            >
              Specific Date
            </Button>
          </div>
          {!showAllDates && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="verification-date-picker" className="text-sm font-medium whitespace-nowrap">
                Date:
              </Label>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="verification-date-picker"
                    variant="outline"
                    className="w-full sm:w-[180px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="truncate">{format(selectedDate, 'MMM d, yyyy')}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        onDateChange(date);
                        setIsDatePickerOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {pendingVerifications > 0 && (
        <Alert>
          <Scale className="h-4 w-4" />
          <AlertDescription>
            You have {pendingVerifications} purchase(s) pending weight verification
            {showAllDates ? ' across all dates' : ` on ${format(selectedDate, 'PPP')}`}.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 sm:space-y-6">
        {showAllDates && pendingVerifications > 0 ? (
          // Show accordion grouped by date
          <div className="space-y-4">
            {sortedDates.map((date) => (
              <Card key={date} className="border-orange-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-orange-600" />
                      <span>{format(parseISO(date), 'EEEE, MMMM d, yyyy')}</span>
                      <Badge variant="outline" className="text-orange-700 border-orange-300 text-xs">
                        {pendingByDate[date].vegetables.length + pendingByDate[date].fruits.length} pending
                      </Badge>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Vegetables Section */}
                    {pendingByDate[date].vegetables.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-semibold text-green-700">🥬 Vegetables</h4>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {pendingByDate[date].vegetables.length} pending
                          </Badge>
                        </div>
                        {pendingByDate[date].vegetables.map((purchase) => (
                          <Card key={purchase.id} className="bg-green-50 border-green-200">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Vegetable</p>
                                  <div className="flex items-center space-x-2">
                                    <p className="text-base font-semibold">{purchase.vegetable}</p>
                                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                                      vegetable
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Vendor</p>
                                  <p className="text-base truncate">{purchase.vendorName}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Ordered Weight</p>
                                  <p className="text-base font-semibold text-blue-600">{purchase.orderedWeight} kg</p>
                                </div>
                              </div>
                              <Button
                                onClick={() => openVerifyWeight(purchase)}
                                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                              >
                                <Scale className="h-4 w-4 mr-2" />
                                Verify Weight
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Fruits Section */}
                    {pendingByDate[date].fruits.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-semibold text-orange-700">🍎 Fruits</h4>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {pendingByDate[date].fruits.length} pending
                          </Badge>
                        </div>
                        {pendingByDate[date].fruits.map((purchase) => (
                          <Card key={purchase.id} className="bg-orange-50 border-orange-200">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Fruit</p>
                                  <div className="flex items-center space-x-2">
                                    <p className="text-base font-semibold">{purchase.vegetable}</p>
                                    <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700">
                                      fruit
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Vendor</p>
                                  <p className="text-base truncate">{purchase.vendorName}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Ordered Weight</p>
                                  <p className="text-base font-semibold text-blue-600">{purchase.orderedWeight} kg</p>
                                </div>
                              </div>
                              <Button
                                onClick={() => openVerifyWeight(purchase)}
                                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                              >
                                <Scale className="h-4 w-4 mr-2" />
                                Verify Weight
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !showAllDates && pendingVerifications > 0 ? (
          // Show single date view
          <div className="grid gap-4 sm:gap-6">
            {/* Group single date purchases by category */}
            {(() => {
              const vegetablePurchases = pendingPurchases.filter(p => {
                const vegetableItem = vegetables.find(v => v.name === p.vegetable);
                return vegetableItem?.category === 'vegetable' || !vegetableItem;
              });
              const fruitPurchases = pendingPurchases.filter(p => {
                const vegetableItem = vegetables.find(v => v.name === p.vegetable);
                return vegetableItem?.category === 'fruit';
              });

              return (
                <>
                  {/* Vegetables Section */}
                  {vegetablePurchases.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-semibold text-green-700">🥬 Vegetables</h3>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {vegetablePurchases.length} pending
                        </Badge>
                      </div>
                      {vegetablePurchases.map((purchase) => (
                        <Card key={purchase.id} className="border-green-200 bg-green-50">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base sm:text-lg">Weight Verification Required</CardTitle>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                                  vegetable
                                </Badge>
                                <Badge variant="outline" className="text-orange-700 border-orange-300 text-xs">
                                  Pending
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Vegetable</p>
                                <p className="text-base sm:text-lg font-semibold">{purchase.vegetable}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Vendor</p>
                                <p className="text-base sm:text-lg truncate">{purchase.vendorName}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Ordered Weight</p>
                                <p className="text-base sm:text-lg font-semibold text-blue-600">{purchase.orderedWeight} kg</p>
                              </div>
                            </div>
                            <Button
                              onClick={() => openVerifyWeight(purchase)}
                              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                            >
                              <Scale className="h-4 w-4 mr-2" />
                              Verify Weight
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Fruits Section */}
                  {fruitPurchases.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-semibold text-orange-700">🍎 Fruits</h3>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {fruitPurchases.length} pending
                        </Badge>
                      </div>
                      {fruitPurchases.map((purchase) => (
                        <Card key={purchase.id} className="border-orange-200 bg-orange-50">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base sm:text-lg">Weight Verification Required</CardTitle>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700">
                                  fruit
                                </Badge>
                                <Badge variant="outline" className="text-orange-700 border-orange-300 text-xs">
                                  Pending
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Fruit</p>
                                <p className="text-base sm:text-lg font-semibold">{purchase.vegetable}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Vendor</p>
                                <p className="text-base sm:text-lg truncate">{purchase.vendorName}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Ordered Weight</p>
                                <p className="text-base sm:text-lg font-semibold text-blue-600">{purchase.orderedWeight} kg</p>
                              </div>
                            </div>
                            <Button
                              onClick={() => openVerifyWeight(purchase)}
                              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                            >
                              <Scale className="h-4 w-4 mr-2" />
                              Verify Weight
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          // No pending verifications
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">
                {showAllDates ? 'All weights verified!' : `All weights verified for ${format(selectedDate, 'PPP')}!`}
              </p>
              <p className="text-gray-600">
                {showAllDates ? 'No pending weight verifications found.' : 'No pending weight verifications for this date.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <WeightVerificationDialog
        isOpen={isVerifyWeightOpen}
        onClose={() => setIsVerifyWeightOpen(false)}
        onVerifyWeight={handleVerifyWeight}
        purchase={selectedPurchase}
      />
    </div>
  );
}