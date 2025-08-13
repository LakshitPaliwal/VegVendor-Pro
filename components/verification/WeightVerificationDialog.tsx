'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Purchase } from '@/lib/firestore';

interface WeightVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifyWeight: (receivedWeight: number) => Promise<void>;
  purchase: Purchase | null;
}

export default function WeightVerificationDialog({
  isOpen,
  onClose,
  onVerifyWeight,
  purchase
}: WeightVerificationDialogProps) {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const formData = new FormData(event.currentTarget);
      const receivedWeight = parseFloat(formData.get('receivedWeight') as string);
      await onVerifyWeight(receivedWeight);
    } catch (error) {
      console.error('Error verifying weight:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Received Weight</DialogTitle>
          <DialogDescription>
            Confirm the actual weight received for this purchase
          </DialogDescription>
        </DialogHeader>
        {purchase && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Vegetable:</span>
                <span>{purchase.vegetable}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Vendor:</span>
                <span>{purchase.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Ordered Weight:</span>
                <span className="font-bold text-blue-600">{purchase.orderedWeight} kg</span>
              </div>
            </div>
            <div>
              <Label htmlFor="receivedWeight">Actual Received Weight (kg)</Label>
              <Input
                name="receivedWeight"
                type="number"
                step="0.1"
                placeholder="Enter actual weight received"
                required
                autoFocus
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">
                Confirm Weight
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
        )}
      </DialogContent>
    </Dialog>
  );
}