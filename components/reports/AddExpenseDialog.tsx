'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Expense } from '@/lib/firestore';
import { format } from 'date-fns';

interface AddExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
}

export default function AddExpenseDialog({ isOpen, onClose, onAddExpense }: AddExpenseDialogProps) {
  const [formData, setFormData] = useState({
    category: '' as 'transportation' | 'storage' | 'utilities' | 'labor' | 'rent' | 'maintenance' | 'other' | '',
    description: '',
    amount: '',
    expenseDate: format(new Date(), 'yyyy-MM-dd')
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const expenseData: Omit<Expense, 'id' | 'createdAt'> = {
        category: formData.category as any,
        description: formData.description,
        amount: parseFloat(formData.amount),
        expenseDate: formData.expenseDate
      };

      await onAddExpense(expenseData);
      
      // Reset form
      setFormData({
        category: '',
        description: '',
        amount: '',
        expenseDate: format(new Date(), 'yyyy-MM-dd')
      });
      onClose();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const categoryOptions = [
    { value: 'transportation', label: 'Transportation' },
    { value: 'storage', label: 'Storage' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'labor', label: 'Labor' },
    { value: 'rent', label: 'Rent' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Record a business expense for tracking and analysis
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expenseDate">Expense Date</Label>
              <Input
                id="expenseDate"
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expenseDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="500.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the expense..."
              required
            />
          </div>

          <div className="flex space-x-2">
            <Button type="submit" className="flex-1">
              Add Expense
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