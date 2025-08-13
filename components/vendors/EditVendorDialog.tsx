'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Vendor } from '@/lib/firestore';

interface EditVendorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateVendor: (updates: Partial<Vendor>) => Promise<void>;
  vendor: Vendor | null;
}

export default function EditVendorDialog({ isOpen, onClose, onUpdateVendor, vendor }: EditVendorDialogProps) {
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

  useEffect(() => {
    if (vendor && isOpen) {
      setVendorName(vendor.name);
      setVendorContact(vendor.contact);
      setVendorLocation(vendor.location);
      // Handle both new crateCodes array and legacy crateCodePrefix
      if (vendor.crateCodes && vendor.crateCodes.length > 0) {
        setCrateCodes(vendor.crateCodes);
      } else if (vendor.crateCodePrefix) {
        setCrateCodes([vendor.crateCodePrefix]);
      } else {
        setCrateCodes(['']);
      }
    }
  }, [vendor, isOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const updates: Partial<Vendor> = {
        name: vendorName,
        contact: vendorContact,
        location: vendorLocation,
        crateCodes: crateCodes.filter(code => code.trim() !== '')
      };
      
      await onUpdateVendor(updates);
      onClose();
    } catch (error) {
      console.error('Error updating vendor:', error);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    if (vendor) {
      setVendorName(vendor.name);
      setVendorContact(vendor.contact);
      setVendorLocation(vendor.location);
      if (vendor.crateCodes && vendor.crateCodes.length > 0) {
        setCrateCodes(vendor.crateCodes);
      } else if (vendor.crateCodePrefix) {
        setCrateCodes([vendor.crateCodePrefix]);
      } else {
        setCrateCodes(['']);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Vendor Details</DialogTitle>
          <DialogDescription>
            Update the vendor information
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
              Multiple crate codes for this vendor
            </p>
          </div>
          <div className="flex space-x-2">
            <Button type="submit" className="flex-1">
              Update Vendor
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
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