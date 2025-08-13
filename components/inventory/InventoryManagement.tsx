'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus } from 'lucide-react';
import { InventoryItem, VegetableItem } from '@/lib/firestore';
import AddVegetableDialog from './AddVegetableDialog';

interface InventoryManagementProps {
  inventory: InventoryItem[];
  vegetables: VegetableItem[];
  onAddVegetable: (vegetable: Omit<VegetableItem, 'id' | 'createdAt'>) => Promise<void>;
}

export default function InventoryManagement({ inventory, vegetables, onAddVegetable }: InventoryManagementProps) {
  const [isAddVegetableOpen, setIsAddVegetableOpen] = useState(false);

  // Group vegetables by category
  const vegetablesByCategory = vegetables.reduce((acc, item) => {
    if (item.category === 'fruit') {
      acc.fruits.push(item);
    } else {
      acc.vegetables.push(item);
    }
    return acc;
  }, { vegetables: [] as VegetableItem[], fruits: [] as VegetableItem[] });

  const handleAddVegetable = async (vegetableData: Omit<VegetableItem, 'id' | 'createdAt'>) => {
    await onAddVegetable(vegetableData);
    setIsAddVegetableOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Current Inventory</h2>
        <Button 
          onClick={() => setIsAddVegetableOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-sm sm:text-base"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Add Vegetable/Fruit</span>
          <span className="sm:hidden">Add Item</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Available Items by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Vegetables Section */}
            {vegetablesByCategory.vegetables.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <h4 className="text-lg font-semibold text-green-700">🥬 Vegetables</h4>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {vegetablesByCategory.vegetables.length} items
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {vegetablesByCategory.vegetables.map((item) => (
                    <Badge key={item.id} variant="outline" className="justify-center p-2 text-xs sm:text-sm bg-green-50 text-green-700 border-green-200">
                      {item.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Fruits Section */}
            {vegetablesByCategory.fruits.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <h4 className="text-lg font-semibold text-orange-700">🍎 Fruits</h4>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    {vegetablesByCategory.fruits.length} items
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {vegetablesByCategory.fruits.map((item) => (
                    <Badge key={item.id} variant="outline" className="justify-center p-2 text-xs sm:text-sm bg-orange-50 text-orange-700 border-orange-200">
                      {item.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {vegetables.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No vegetables/fruits added yet. Click "Add Vegetable/Fruit" to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {inventory.map((item) => (
          <Card key={item.vegetable} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base sm:text-lg truncate mr-2">{item.vegetable}</CardTitle>
              <Package className="h-5 w-5 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-green-600">{item.totalStock} kg</div>
              <p className="text-sm text-gray-600 mt-2">
                Last updated: {item.lastUpdated}
              </p>
              <div className="mt-4">
                <Badge variant="outline" className="text-green-700 border-green-200 text-xs">
                  In Stock
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddVegetableDialog
        isOpen={isAddVegetableOpen}
        onClose={() => setIsAddVegetableOpen(false)}
        onAddVegetable={handleAddVegetable}
      />
    </div>
  );
}