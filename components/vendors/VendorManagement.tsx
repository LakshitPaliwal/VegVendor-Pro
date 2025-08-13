'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { Vendor, Purchase, Bill } from '@/lib/firestore';
import AddVendorDialog from './AddVendorDialog';
import VendorDetailsDialog from './VendorDetailsDialog';

interface VendorManagementProps {
  vendors: Vendor[];
  onAddVendor: (vendor: Omit<Vendor, 'id' | 'createdAt'>) => Promise<void>;
  onLoadVendorPurchases: (vendorId: string) => Promise<Purchase[]>;
  onUpdateVendor: (vendorId: string, updates: Partial<Vendor>) => Promise<void>;
  onLoadVendorBills: (vendorId: string) => Promise<Bill[]>;
  onUploadBill: (billData: Omit<Bill, 'id' | 'uploadedAt'>) => Promise<void>;
}

export default function VendorManagement({ vendors, onAddVendor, onLoadVendorPurchases, onUpdateVendor, onLoadVendorBills, onUploadBill }: VendorManagementProps) {
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isVendorDetailsOpen, setIsVendorDetailsOpen] = useState(false);

  const handleAddVendor = async (vendorData: Omit<Vendor, 'id' | 'createdAt'>) => {
    await onAddVendor(vendorData);
    setIsAddVendorOpen(false);
  };

  // Calculate actual purchase count from all purchases for each vendor
  const getVendorPurchaseCount = (vendorId: string) => {
    // This would need access to allPurchases, but we'll use the vendor's stored count for now
    // The count is updated in real-time when purchases are added
    return vendors.find(v => v.id === vendorId)?.totalPurchases || 0;
  };

  const handleViewVendorDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsVendorDetailsOpen(true);
  };
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Wholesale Vendors</h2>
        <Button 
          onClick={() => setIsAddVendorOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-sm sm:text-base"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Add Vendor</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {vendors.map((vendor) => (
          <Card key={vendor.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl truncate mr-2">{vendor.name}</CardTitle>
                {/* <Badge variant="outline" className="text-xs whitespace-nowrap">
                  {vendor.totalPurchases || 0} purchases
                </Badge> */}
              </div>
            </CardHeader>
            <CardContent onClick={() => handleViewVendorDetails(vendor)}>
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Contact:</span>
                  <span className="text-sm truncate">{vendor.contact}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Location:</span>
                  <span className="text-sm truncate">{vendor.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Crate Code:</span>
                  <div className="flex flex-wrap gap-1">
                    {(vendor.crateCodes || [vendor.crateCodePrefix].filter(Boolean)).map((code, index) => (
                      <span key={index} className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {code}
                      </span>
                    ))}
                    {(!vendor.crateCodes || vendor.crateCodes.length === 0) && !vendor.crateCodePrefix && (
                      <span className="text-xs text-gray-500">-</span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewVendorDetails(vendor);
                  }}
                  className="w-full text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">View Purchase History</span>
                  <span className="sm:hidden">View History</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddVendorDialog
        isOpen={isAddVendorOpen}
        onClose={() => setIsAddVendorOpen(false)}
        onAddVendor={handleAddVendor}
      />

      <VendorDetailsDialog
        isOpen={isVendorDetailsOpen}
        onClose={() => setIsVendorDetailsOpen(false)}
        vendor={selectedVendor}
        onLoadVendorPurchases={onLoadVendorPurchases}
        onUpdateVendor={onUpdateVendor}
        onLoadVendorBills={onLoadVendorBills}
        onUploadBill={onUploadBill}
      />
    </div>
  );
}