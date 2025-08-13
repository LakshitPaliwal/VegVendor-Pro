'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Plus, Search, Calendar as CalendarIcon, Package, Loader2 } from 'lucide-react';
import { Purchase, Vendor, VegetableItem } from '@/lib/firestore';
import AddPurchaseDialog from './AddPurchaseDialog';
import PurchaseTable from './PurchaseTable';

// Helper function to get actual purchase amount
const getActualAmount = (purchase: Purchase) => {
  if (purchase.receivedWeight && purchase.receivedWeight !== purchase.orderedWeight) {
    return purchase.receivedWeight * purchase.pricePerKg;
  }
  return purchase.totalAmount;
};

interface PurchaseManagementProps {
  purchases: Purchase[];
  vendors: Vendor[];
  vegetables: VegetableItem[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onAddPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt'>) => Promise<void>;
  loadingPurchases: boolean;
}

export default function PurchaseManagement({
  purchases,
  vendors,
  vegetables,
  selectedDate,
  onDateChange,
  onAddPurchase,
  loadingPurchases
}: PurchaseManagementProps) {
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [lastSelectedVendor, setLastSelectedVendor] = useState<string>('');

  useEffect(() => {
    const filtered = purchases.filter(purchase =>
      purchase.vegetable.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPurchases(filtered);
  }, [purchases, searchTerm]);

  const handleAddPurchase = async (purchaseData: Omit<Purchase, 'id' | 'createdAt'>) => {
    await onAddPurchase(purchaseData);
    setIsAddPurchaseOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Purchase Management</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Label htmlFor="date-picker" className="text-sm font-medium">
              Purchase Date:
            </Label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="date-picker"
                  variant="outline"
                  className="w-full sm:w-[200px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">{format(selectedDate, 'PPP')}</span>
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
          <Button 
            onClick={() => setIsAddPurchaseOpen(true)}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Purchase
          </Button>
        </div>
      </div>

      {loadingPurchases ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2 text-green-600" />
          <span className="text-gray-600">Loading purchases...</span>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search purchases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600 text-center sm:text-right">
              {filteredPurchases.length} purchase(s) on {format(selectedDate, 'PPP')}
            </div>
          </div>

          {filteredPurchases.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900">No purchases found</p>
                <p className="text-gray-600">
                  {searchTerm 
                    ? `No purchases match "${searchTerm}" on ${format(selectedDate, 'PPP')}`
                    : `No purchases recorded on ${format(selectedDate, 'PPP')}`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <PurchaseTable 
              purchases={filteredPurchases} 
            />
          )}
        </>
      )}

      <AddPurchaseDialog
        isOpen={isAddPurchaseOpen}
        onClose={() => setIsAddPurchaseOpen(false)}
        onAddPurchase={handleAddPurchase}
        vendors={vendors}
        vegetables={vegetables}
        selectedDate={selectedDate}
        lastSelectedVendor={lastSelectedVendor}
        onVendorChange={setLastSelectedVendor}
      />
    </div>
  );
}