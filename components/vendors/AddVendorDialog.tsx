'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Vendor } from '@/lib/firestore';

interface AddVendorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVendor: (vendor: Omit<Vendor, 'id' | 'createdAt'>) => Promise<void>;
}

export default function AddVendorDialog({ isOpen, onClose, onAddVendor }: AddVendorDialogProps) {
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [vendorLocation, setVendorLocation] = useState('');
  const [crateCodes, setCrateCodes] = useState<string[]>(['']);

  const addCrateCodeField = () => {
    setCrateCodes([...crateCodes, '']);
  };

  const updateCrateCode = (index: number, value: string) => {
    const updatedCodes = [...crateCodes];
    updatedCodes[index] = value;
    setCrateCodes(updatedCodes);
  };

  const removeCrateCodeField = (index: number) => {
    const updatedCodes = crateCodes.filter((_, i) => i !== index);
    setCrateCodes(updatedCodes);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const newVendor: Omit<Vendor, 'id' | 'createdAt'> = {
        name: vendorName,
        contact: vendorContact,
        location: vendorLocation,
        crateCodes: crateCodes.filter(code => code.trim() !== ''),
        totalPurchases: 0
      };
      
      await onAddVendor(newVendor);
      
      // Reset form
      setVendorName('');
      setVendorContact('');
      setVendorLocation('');
      setCrateCodes(['']);
    } catch (error) {
      console.error('Error adding vendor:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Add a new wholesale vendor to your supplier list
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Vendor Name</Label>
            <Input
              name="name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="Green Valley Wholesale"
              required
            />
          </div>
          <div>
            <Label htmlFor="contact">Contact Number</Label>
            <Input
              name="contact"
              value={vendorContact}
              onChange={(e) => setVendorContact(e.target.value)}
              placeholder="+91 98765 43210"
              required
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              name="location"
              value={vendorLocation}
              onChange={(e) => setVendorLocation(e.target.value)}
              placeholder="Market Road"
              required
            />
          </div>
          <div>
            <Label>Crate Codes</Label>
            <div className="space-y-2">
              {crateCodes.map((code, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={code}
                    onChange={(e) => updateCrateCode(index, e.target.value)}
                    placeholder="e.g., GREENVALLEY, FRESHMART"
                    required={index === 0}
                  />
                  {crateCodes.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCrateCodeField(index)}
                      className="text-red-600"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCrateCodeField}
                className="w-full"
              >
                + Add Another Crate Code
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Add multiple crate codes for this vendor
            </p>
          </div>
          <Button type="submit" className="w-full">
            Add Vendor
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}