'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sale, InventoryItem, VegetableItem } from '@/lib/firestore';
import { format } from 'date-fns';

interface AddSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>;
  inventory: InventoryItem[];
  vegetables: VegetableItem[];
}

export default function AddSaleDialog({ isOpen, onClose, onAddSale, inventory, vegetables }: AddSaleDialogProps) {
  const [formData, setFormData] = useState({
    vegetable: '',
    quantitySold: '',
    sellingPricePerKg: '',
    customerName: '',
    paymentMethod: 'cash' as 'cash' | 'upi' | 'card' | 'credit',
    saleDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [vegetableOpen, setVegetableOpen] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const quantitySold = parseFloat(formData.quantitySold);
      const sellingPricePerKg = parseFloat(formData.sellingPricePerKg);
      
      // Check if quantity sold exceeds available inventory
      const inventoryItem = inventory.find(item => item.vegetable === formData.vegetable);
      if (inventoryItem && quantitySold > inventoryItem.totalStock) {
        alert(`Cannot sell ${quantitySold} kg. Only ${inventoryItem.totalStock} kg available in inventory.`);
        return;
      }
      
      const totalSaleAmount = quantitySold * sellingPricePerKg;

      const saleData: Omit<Sale, 'id' | 'createdAt'> = {
        vegetable: formData.vegetable,
        quantitySold,
        sellingPricePerKg,
        totalSaleAmount,
        saleDate: formData.saleDate,
        customerName: formData.customerName || null,
        paymentMethod: formData.paymentMethod
      };

      await onAddSale(saleData);
      
      // Reset form
      setFormData({
        vegetable: '',
        quantitySold: '',
        sellingPricePerKg: '',
        customerName: '',
        paymentMethod: 'cash',
        saleDate: format(new Date(), 'yyyy-MM-dd')
      });
      onClose();
    } catch (error) {
      console.error('Error adding sale:', error);
    }
  };

  const handleVegetableChange = (vegetableName: string) => {
    setFormData(prev => ({ ...prev, vegetable: vegetableName, quantitySold: '' }));
    setVegetableOpen(false);
  };

  const totalAmount = (parseFloat(formData.quantitySold) || 0) * (parseFloat(formData.sellingPricePerKg) || 0);
  const selectedVegetableItem = vegetables.find(v => v.name === formData.vegetable);
  const availableStock = inventory.find(item => item.vegetable === formData.vegetable)?.totalStock || 0;
  const quantitySoldNum = parseFloat(formData.quantitySold) || 0;
  const isQuantityValid = quantitySoldNum <= availableStock;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record New Sale</DialogTitle>
          <DialogDescription>
            Add a new sale transaction to track revenue
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                    {formData.vegetable || "Select vegetable/fruit..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search vegetables/fruits..." />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-500 mb-2">No items found in inventory.</p>
                          <p className="text-xs text-gray-400">
                            Only items with available stock are shown.
                          </p>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {inventory
                          .filter(item => item.totalStock > 0)
                          .map((item) => {
                            const vegetableItem = vegetables.find(v => v.name === item.vegetable);
                            return (
                              <CommandItem
                                key={item.vegetable}
                                value={item.vegetable}
                                onSelect={() => handleVegetableChange(item.vegetable)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.vegetable === item.vegetable ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex items-center justify-between w-full min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span>{item.vegetable}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {vegetableItem?.category || 'vegetable'}
                                    </Badge>
                                  </div>
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 ml-2">
                                    {item.totalStock} kg available
                                  </Badge>
                                </div>
                              </CommandItem>
                            );
                          })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="saleDate">Sale Date</Label>
              <Input
                id="saleDate"
                type="date"
                value={formData.saleDate}
                onChange={(e) => setFormData(prev => ({ ...prev, saleDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantitySold">Quantity Sold (kg)</Label>
              <Input
                id="quantitySold"
                type="number"
                step="0.1"
                max={availableStock}
                value={formData.quantitySold}
                onChange={(e) => setFormData(prev => ({ ...prev, quantitySold: e.target.value }))}
                placeholder="5.0"
                disabled={!formData.vegetable}
                required
              />
              {formData.vegetable && (
                <p className="text-xs text-gray-500 mt-1">
                  Available: {availableStock} kg
                  {!isQuantityValid && quantitySoldNum > 0 && (
                    <span className="text-red-600 block">
                      ⚠️ Cannot sell more than available stock
                    </span>
                  )}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="sellingPricePerKg">Selling Price per Kg (₹)</Label>
              <Input
                id="sellingPricePerKg"
                type="number"
                step="0.01"
                value={formData.sellingPricePerKg}
                onChange={(e) => setFormData(prev => ({ ...prev, sellingPricePerKg: e.target.value }))}
                placeholder="120.00"
                disabled={!formData.vegetable}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="customerName">Customer Name (Optional)</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              placeholder="Customer name"
              disabled={!formData.vegetable}
            />
          </div>

          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select 
              value={formData.paymentMethod} 
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {totalAmount > 0 && isQuantityValid && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-800">Total Sale Amount:</span>
                <span className="text-xl font-bold text-green-900">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          {!isQuantityValid && quantitySoldNum > 0 && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2">
                <span className="text-red-800 font-medium">⚠️ Invalid Quantity</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                You cannot sell {quantitySoldNum} kg when only {availableStock} kg is available in inventory.
              </p>
            </div>
          )}
          <div className="flex space-x-2">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!isQuantityValid || !formData.vegetable || quantitySoldNum <= 0}
            >
              Record Sale
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}