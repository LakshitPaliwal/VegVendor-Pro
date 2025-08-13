'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Purchase, Vendor, VegetableItem } from '@/lib/firestore';

interface PurchaseItem {
  id: string;
  vegetable: string;
  orderedWeight: number;
  pricePerKg: number;
  totalAmount: number;
  cratesCount: number;
  selectedCrateCode?: string;
}

interface AddPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt'>) => Promise<void>;
  vendors?: Vendor[];
  vegetables?: VegetableItem[];
  selectedDate: Date;
  lastSelectedVendor?: string;
  onVendorChange?: (vendorId: string) => void;
}

export default function AddPurchaseDialog({
  isOpen,
  onClose,
  onAddPurchase,
  vendors = [],
  vegetables = [],
  selectedDate,
  lastSelectedVendor,
  onVendorChange,
}: AddPurchaseDialogProps) {
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    vegetable: '',
    orderedWeight: '',
    pricePerKg: '',
    cratesCount: '',
    selectedCrateCode: '',
  });
  const [purchaseDate, setPurchaseDate] = useState(format(selectedDate, 'yyyy-MM-dd'));
  
  // Searchable dropdown states
  const [vendorOpen, setVendorOpen] = useState(false);
  const [vegetableOpen, setVegetableOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPurchaseDate(format(selectedDate, 'yyyy-MM-dd'));
      // Set the last selected vendor if available
      if (lastSelectedVendor && !selectedVendor) {
        setSelectedVendor(lastSelectedVendor);
      }
    } else {
      // Reset form when dialog closes
      setSelectedVendor('');
      setPurchaseItems([]);
      setCurrentItem({ vegetable: '', orderedWeight: '', pricePerKg: '', cratesCount: '', selectedCrateCode: '' });
      setPurchaseDate(format(selectedDate, 'yyyy-MM-dd'));
      setVendorOpen(false);
      setVegetableOpen(false);
    }
  }, [isOpen, selectedDate, lastSelectedVendor]);

  const handleVendorChange = (vendorId: string) => {
    setSelectedVendor(vendorId);
    if (onVendorChange) {
      onVendorChange(vendorId);
    }
    setVendorOpen(false);
  };

  const handleVegetableChange = (vegetableName: string) => {
    setCurrentItem(prev => ({ ...prev, vegetable: vegetableName }));
    setVegetableOpen(false);
  };

  const addItemToList = () => {
    const orderedWeightNum = parseFloat(currentItem.orderedWeight);
    const pricePerKgNum = parseFloat(currentItem.pricePerKg);
    const cratesCountNum = currentItem.cratesCount ? parseInt(currentItem.cratesCount) : 0;
    
    if (!currentItem.vegetable || !orderedWeightNum || !pricePerKgNum) return;
    if (cratesCountNum > 0 && !currentItem.selectedCrateCode) return;

    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      vegetable: currentItem.vegetable,
      orderedWeight: orderedWeightNum,
      pricePerKg: pricePerKgNum,
      totalAmount: orderedWeightNum * pricePerKgNum,
      cratesCount: cratesCountNum,
      selectedCrateCode: currentItem.selectedCrateCode || undefined,
    };

    setPurchaseItems(prev => [...prev, newItem]);
    setCurrentItem({ vegetable: '', orderedWeight: '', pricePerKg: '', cratesCount: '', selectedCrateCode: '' });
  };

  const removeItem = (itemId: string) => {
    setPurchaseItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSubmitAll = async () => {
    if (!selectedVendor || purchaseItems.length === 0) return;

    try {
      const vendor = vendors.find((v) => v.id === selectedVendor);
      
      // Submit each item as a separate purchase
      for (const item of purchaseItems) {
        const newPurchase: Omit<Purchase, 'id' | 'createdAt'> = {
          vendorId: selectedVendor,
          vendorName: vendor?.name || '',
          vegetable: item.vegetable,
          orderedWeight: item.orderedWeight,
          pricePerKg: item.pricePerKg,
          totalAmount: item.totalAmount,
          purchaseDate,
          verificationStatus: 'pending',
          cratesCount: item.cratesCount || 0,
          vendorCrateCode: item.selectedCrateCode ?? '',
        };

        await onAddPurchase(newPurchase);
      }

      // Reset only the items, keep vendor selected
      setPurchaseItems([]);
      setCurrentItem({ vegetable: '', orderedWeight: '', pricePerKg: '', cratesCount: '', selectedCrateCode: '' });
      onClose();
    } catch (error) {
      console.error('Error adding purchases:', error);
    }
  };

  const validVendors = vendors.filter(
    (vendor) =>
      vendor.id &&
      vendor.id.trim() !== '' &&
      vendor.name &&
      vendor.name.trim() !== ''
  );

  const selectedVendorName = validVendors.find(v => v.id === selectedVendor)?.name || '';
  const selectedVegetableName = vegetables.find(v => v.name === currentItem.vegetable)?.name || '';
  const totalAmount = purchaseItems.reduce((sum, item) => sum + item.totalAmount, 0);
  const canAddItem = currentItem.vegetable && currentItem.orderedWeight && currentItem.pricePerKg && 
    (parseInt(currentItem.cratesCount) === 0 || currentItem.selectedCrateCode);
  
  const selectedVendorObj = validVendors.find(v => v.id === selectedVendor);
  const availableCrateCodes = selectedVendorObj?.crateCodes || [selectedVendorObj?.crateCodePrefix].filter(Boolean) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-green-600" />
            <span>Record New Purchase</span>
          </DialogTitle>
          <DialogDescription>
            Add multiple vegetables/fruits from the same wholesale vendor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Vendor Selection */}
          <div>
            <Label htmlFor="vendorId">Wholesale Vendor</Label>
            <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={vendorOpen}
                  className="w-full justify-between"
                >
                  {selectedVendorName || "Select vendor..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search vendors..." />
                  <CommandList>
                    <CommandEmpty>No vendor found.</CommandEmpty>
                    <CommandGroup>
                      {validVendors.map((vendor) => (
                        <CommandItem
                          key={vendor.id}
                          value={vendor.name}
                          onSelect={() => handleVendorChange(vendor.id)}
                          className="flex items-center space-x-2"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedVendor === vendor.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-medium">{vendor.name}</span>
                            <span className="text-sm text-gray-500 truncate">{vendor.location}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Purchase Date */}
          {selectedVendor && (
            <div>
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                type="date"
                required
              />
            </div>
          )}

          {/* Add Items Section */}
          {selectedVendor && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold">Add Items</h3>
                <Badge variant="outline">
                  {purchaseItems.length} item(s) added
                </Badge>
              </div>

              {/* Current Item Form */}
              <Card className="bg-gray-50">
                <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  {/* Vegetable Selection */}
                  <div>
                    <Label htmlFor="vegetable">Vegetable/Fruit</Label>
                    <Popover open={vegetableOpen} onOpenChange={setVegetableOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={vegetableOpen}
                          className="w-full justify-between"
                        >
                          {selectedVegetableName || "Select vegetable/fruit..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search vegetables/fruits..." />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-3 sm:p-4 text-center">
                                <p className="text-sm text-gray-500 mb-2">No vegetable/fruit found.</p>
                                <p className="text-xs text-gray-400">
                                  Add vegetables/fruits in the Inventory section first.
                                </p>
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {vegetables.map((item) => (
                                <CommandItem
                                  key={item.id}
                                  value={item.name}
                                  onSelect={() => handleVegetableChange(item.name)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      currentItem.vegetable === item.name ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex items-center justify-between w-full min-w-0">
                                    <span>{item.name}</span>
                                    <Badge variant="outline" className="text-xs ml-2">
                                      {item.category}
                                    </Badge>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Weight and Price */}
                  {currentItem.vegetable && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="orderedWeight">Weight (kg)</Label>
                        <Input
                          value={currentItem.orderedWeight}
                          onChange={(e) => setCurrentItem(prev => ({ ...prev, orderedWeight: e.target.value }))}
                          type="number"
                          step="0.1"
                          placeholder="20.0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pricePerKg">Price per Kg (₹)</Label>
                        <Input
                          value={currentItem.pricePerKg}
                          onChange={(e) => setCurrentItem(prev => ({ ...prev, pricePerKg: e.target.value }))}
                          type="number"
                          step="0.01"
                          placeholder="80.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cratesCount">Crates Count</Label>
                        <Input
                          value={currentItem.cratesCount}
                          onChange={(e) => setCurrentItem(prev => ({ ...prev, cratesCount: e.target.value }))}
                          type="number"
                          min="0"
                          placeholder="1"
                        />
                      </div>
                      {currentItem.cratesCount && parseInt(currentItem.cratesCount) > 0 && selectedVendor && availableCrateCodes.length > 0 && (
                        <div className="sm:col-span-3">
                          <Label>Select Crate Code</Label>
                          <div className="space-y-2">
                            <select
                              value={currentItem.selectedCrateCode}
                              onChange={(e) => setCurrentItem(prev => ({ ...prev, selectedCrateCode: e.target.value }))}
                              className="w-full p-2 border border-gray-300 rounded-md"
                              required
                            >
                              <option value="">Select crate code...</option>
                              {availableCrateCodes.map((code, index) => (
                                <option key={index} value={code}>
                                  {code}
                                </option>
                              ))}
                            </select>
                            {currentItem.selectedCrateCode && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800 mb-2">
                                  All {currentItem.cratesCount} crates will have code:
                                </p>
                                <div className="text-lg font-mono font-bold text-blue-700 bg-blue-100 px-3 py-2 rounded inline-block">
                                  {currentItem.selectedCrateCode}
                                </div>
                              </div>
                            )}
                            </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add Item Button */}
                  {canAddItem && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 space-y-2 sm:space-y-0">
                      <div className="text-sm text-gray-600">
                        Total: ₹{(parseFloat(currentItem.orderedWeight || '0') * parseFloat(currentItem.pricePerKg || '0')).toFixed(2)}
                        {currentItem.cratesCount && parseInt(currentItem.cratesCount) > 0 && (
                          <span className="block text-blue-600">
                            {currentItem.cratesCount} crates
                          </span>
                        )}
                      </div>
                      <Button onClick={addItemToList} size="sm" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Added Items List */}
          {purchaseItems.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">Items to Purchase</h3>
              <div className="space-y-2 sm:space-y-3">
                {purchaseItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{item.vegetable}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.orderedWeight} kg
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              ₹{item.pricePerKg}/kg
                            </Badge>
                            {item.cratesCount > 0 && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                {item.cratesCount} crates
                                {item.selectedCrateCode && ` (${item.selectedCrateCode})`}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            Total: ₹{item.totalAmount.toFixed(2)}
                            {item.cratesCount > 0 && (
                              <div className="text-blue-600 mt-1 font-mono text-xs">
                                • {item.cratesCount} crates
                                {item.selectedCrateCode && (
                                  <div className="text-blue-700 mt-1 font-bold">
                                    Code: {item.selectedCrateCode}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 mt-2 sm:mt-0 sm:ml-4"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              {/* Total Summary */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-green-800">
                      Total Items: {purchaseItems.length}
                    </span>
                    <div className="text-sm text-green-700">
                      Total Weight: {purchaseItems.reduce((sum, item) => sum + item.orderedWeight, 0).toFixed(1)} kg
                    </div>
                    {purchaseItems.some(item => item.cratesCount > 0) && (
                      <div className="text-sm text-blue-700">
                        Total Crates: {purchaseItems.reduce((sum, item) => sum + item.cratesCount, 0)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl font-bold text-green-900">
                      ₹{totalAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-700">Grand Total</div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleSubmitAll} 
                className="w-full bg-green-600 hover:bg-green-700 py-3" 
                size="lg"
              >
                Record All Purchases ({purchaseItems.length} items)
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}