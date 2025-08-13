'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VegetableItem } from '@/lib/firestore';

interface AddVegetableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVegetable: (vegetable: Omit<VegetableItem, 'id' | 'createdAt'>) => Promise<void>;
}

export default function AddVegetableDialog({ isOpen, onClose, onAddVegetable }: AddVegetableDialogProps) {
  const [vegetableName, setVegetableName] = useState('');
  const [category, setCategory] = useState<'vegetable' | 'fruit'>('vegetable');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const newVegetable: Omit<VegetableItem, 'id' | 'createdAt'> = {
        name: vegetableName,
        category
      };
      
      await onAddVegetable(newVegetable);
      
      // Reset form
      setVegetableName('');
      setCategory('vegetable');
      onClose();
    } catch (error) {
      console.error('Error adding vegetable:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Vegetable/Fruit</DialogTitle>
          <DialogDescription>
            Add a new vegetable or fruit to your inventory list
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              name="name"
              value={vegetableName}
              onChange={(e) => setVegetableName(e.target.value)}
              placeholder="e.g., Tomato, Apple, Onion"
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value: 'vegetable' | 'fruit') => setCategory(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vegetable">Vegetable</SelectItem>
                <SelectItem value="fruit">Fruit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">
            Add Item
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}