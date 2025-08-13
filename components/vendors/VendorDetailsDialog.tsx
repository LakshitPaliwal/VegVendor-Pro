'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Package, Scale, CheckCircle, XCircle, Loader2, Upload, FileText, Eye } from 'lucide-react';
import { Vendor, Purchase, Bill } from '@/lib/firestore';
import { format, parseISO } from 'date-fns';
import EditVendorDialog from './EditVendorDialog';
import BillUploadDialog from './BillUploadDialog';

interface VendorDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  onLoadVendorPurchases: (vendorId: string) => Promise<Purchase[]>;
  onUpdateVendor: (vendorId: string, updates: Partial<Vendor>) => Promise<void>;
  onLoadVendorBills: (vendorId: string) => Promise<Bill[]>;
  onUploadBill: (billData: Omit<Bill, 'id' | 'uploadedAt'>) => Promise<void>;
}

export default function VendorDetailsDialog({
  isOpen,
  onClose,
  vendor,
  onLoadVendorPurchases,
  onUpdateVendor,
  onLoadVendorBills,
  onUploadBill
}: VendorDetailsDialogProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBills, setLoadingBills] = useState(false);
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [isBillUploadOpen, setIsBillUploadOpen] = useState(false);
  const [selectedDateForBill, setSelectedDateForBill] = useState('');
  const [selectedDateAmount, setSelectedDateAmount] = useState(0);
  const [selectedPurchaseForBill, setSelectedPurchaseForBill] = useState<Purchase | null>(null);
  const [billUploadType, setBillUploadType] = useState<'single' | 'all'>('all');

  useEffect(() => {
    if (isOpen && vendor) {
      loadPurchases();
      loadBills();
    }
  }, [isOpen, vendor]);

  const loadPurchases = async () => {
    if (!vendor) return;
    
    try {
      setLoading(true);
      const vendorPurchases = await onLoadVendorPurchases(vendor.id);
      setPurchases(vendorPurchases);
    } catch (error) {
      console.error('Error loading vendor purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBills = async () => {
    if (!vendor) return;
    
    try {
      setLoadingBills(true);
      const vendorBills = await onLoadVendorBills(vendor.id);
      setBills(vendorBills);
    } catch (error) {
      console.error('Error loading vendor bills:', error);
    } finally {
      setLoadingBills(false);
    }
  };

  const handleUpdateVendor = async (updates: Partial<Vendor>) => {
    if (!vendor) return;
    await onUpdateVendor(vendor.id, updates);
    setIsEditVendorOpen(false);
  };

  const handleUploadBill = async (billData: Omit<Bill, 'id' | 'uploadedAt'>) => {
    try {
      await onUploadBill(billData);
    } catch (error) {
      console.error('Error in handleUploadBill:', error);
      throw error;
    }
    await loadBills(); // Refresh bills after upload
    setIsBillUploadOpen(false);
  };

  const openBillUpload = (date: string, totalAmount: number) => {
    setSelectedDateForBill(date);
    setSelectedDateAmount(totalAmount);
    setSelectedPurchaseForBill(null);
    setBillUploadType('all');
    setIsBillUploadOpen(true);
  };

  const openBillUploadForItem = (purchase: Purchase) => {
    setSelectedPurchaseForBill(purchase);
    setSelectedDateForBill(purchase.purchaseDate);
    setSelectedDateAmount(getActualAmount(purchase));
    setBillUploadType('single');
    setIsBillUploadOpen(true);
  };

  const getBillForDate = (date: string) => {
    return bills.find(bill => bill.purchaseDate === date && bill.billType === 'parent');
  };

  const getBillsForPurchase = (purchaseId: string) => {
    return bills.filter(bill => bill.purchaseId === purchaseId && bill.billType === 'child');
  };

  const handleViewBill = (bill: Bill) => {
    // Create a temporary URL from base64 data and open it
    try {
      const blob = dataURLtoBlob(bill.fileData);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Clean up the URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error opening bill:', error);
    }
  };

  // Helper function to convert data URL to Blob
  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || '';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const getActualAmount = (purchase: Purchase) => {
    if (purchase.receivedWeight && purchase.receivedWeight !== purchase.orderedWeight) {
      return purchase.receivedWeight * purchase.pricePerKg;
    }
    return purchase.totalAmount;
  };

  // Group purchases by date
  const purchasesByDate = purchases.reduce((groups, purchase) => {
    const date = purchase.purchaseDate;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(purchase);
    return groups;
  }, {} as Record<string, Purchase[]>);

  // Sort dates in descending order
  const sortedDates = Object.keys(purchasesByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const totalAmount = purchases.reduce((sum, purchase) => sum + getActualAmount(purchase), 0);
  const totalWeight = purchases.reduce((sum, purchase) => sum + (purchase.receivedWeight || purchase.orderedWeight), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-green-600" />
            <span>{vendor?.name} - Purchase History</span>
          </DialogTitle>
          <DialogDescription>
            Complete purchase history and transaction details
          </DialogDescription>
        </DialogHeader>

        {vendor && (
          <div className="space-y-6">
            {/* Vendor Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vendor Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Contact</p>
                    <p className="text-lg">{vendor.contact}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Location</p>
                    <p className="text-lg">{vendor.location}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                    <p className="text-lg font-semibold text-blue-600">{purchases.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-lg font-semibold text-green-600">₹{totalAmount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button 
                    onClick={() => setIsEditVendorOpen(true)}
                    variant="outline"
                    className="w-full"
                  >
                    Edit Vendor Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Purchase History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Purchase History</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading purchases...</span>
                  </div>
                ) : purchases.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No purchases found for this vendor.</p>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {sortedDates.map((date) => {
                      const datePurchases = purchasesByDate[date];
                      const dateTotal = datePurchases.reduce((sum, purchase) => sum + getActualAmount(purchase), 0);
                      const bill = getBillForDate(date);
                      
                      return (
                        <AccordionItem key={date} value={date}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full mr-4">
                              <div className="flex items-center space-x-3">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">
                                  {format(parseISO(date), 'PPP')}
                                </span>
                                <Badge variant="secondary">
                                  {datePurchases.length} item{datePurchases.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className="font-semibold text-green-600">
                                  ₹{dateTotal.toLocaleString()}
                                </span>
                                {bill ? (
                                  <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewBill(bill);
                                      }}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View Parent Bill
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openBillUpload(date, dateTotal);
                                      }}
                                    >
                                      <Upload className="h-3 w-3 mr-1" />
                                      Upload Parent Bill
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pt-4">
                              {datePurchases.map((purchase) => (
                                <Card key={purchase.id} className="border-l-4 border-l-blue-500">
                                  <CardContent className="p-4">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                      <div>
                                        <p className="text-sm font-medium text-gray-600">Vegetable</p>
                                        <p className="font-semibold">{purchase.vegetable}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-600">Weight</p>
                                        <div className="flex items-center space-x-2">
                                          <Scale className="h-4 w-4 text-gray-500" />
                                          <span>
                                            {purchase.receivedWeight ? (
                                              <>
                                                <span className="font-semibold">{purchase.receivedWeight}KG</span>
                                                {purchase.receivedWeight !== purchase.orderedWeight && (
                                                  <span className="text-red-600 ml-1">
                                                    ({purchase.receivedWeight - purchase.orderedWeight > 0 ? '+' : ''}{purchase.receivedWeight - purchase.orderedWeight})
                                                  </span>
                                                )}
                                              </>
                                            ) : (
                                              <span className="font-semibold">{purchase.orderedWeight}KG</span>
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-600">Rate</p>
                                        <p className="font-semibold">₹{purchase.pricePerKg}/kg</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-600">Amount</p>
                                        <div className="flex items-center space-x-2">
                                          <span className="font-semibold text-green-600">
                                            ₹{getActualAmount(purchase).toLocaleString()}
                                          </span>
                                          {purchase.receivedWeight && purchase.receivedWeight !== purchase.orderedWeight && (
                                            <span className="text-sm text-gray-500 line-through">
                                              ₹{purchase.totalAmount.toLocaleString()}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right space-y-2">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <Badge variant={
                                            purchase.verificationStatus === 'verified' ? 'default' :
                                            purchase.verificationStatus === 'discrepancy' ? 'destructive' :
                                            'secondary'
                                          }>
                                            {purchase.verificationStatus === 'pending' && <Scale className="h-3 w-3 mr-1" />}
                                            {purchase.verificationStatus === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
                                            {purchase.verificationStatus === 'discrepancy' && <XCircle className="h-3 w-3 mr-1" />}
                                            {purchase.verificationStatus}
                                          </Badge>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          <p>₹{purchase.pricePerKg}/kg</p>
                                          <p className="font-semibold text-green-600">
                                            {purchase.receivedWeight && purchase.receivedWeight !== purchase.orderedWeight ? (
                                              <div>
                                                <span className="text-green-600">₹{(purchase.receivedWeight * purchase.pricePerKg).toLocaleString()}</span>
                                                <div className="text-xs text-gray-500 line-through">₹{purchase.totalAmount.toLocaleString()}</div>
                                              </div>
                                            ) : (
                                              `₹${purchase.totalAmount.toLocaleString()}`
                                            )}
                                          </p>
                                        </div>
                                        {/* Child Bills for this item */}
                                        <div className="flex flex-col space-y-1">
                                          {getBillsForPurchase(purchase.id).map((childBill) => (
                                            <Button
                                              key={childBill.id}
                                              size="sm"
                                              variant="outline"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewBill(childBill);
                                              }}
                                              className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                                            >
                                              <Eye className="h-3 w-3 mr-1" />
                                              View Item Bill
                                            </Button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-4 flex space-x-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openBillUploadForItem(purchase);
                                        }}
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                      >
                                        <Upload className="h-3 w-3 mr-1" />
                                        Upload Item Bill
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Vendor Dialog */}
        <EditVendorDialog
          isOpen={isEditVendorOpen}
          onClose={() => setIsEditVendorOpen(false)}
          vendor={vendor}
          onUpdateVendor={handleUpdateVendor}
        />

        {/* Bill Upload Dialog */}
        <BillUploadDialog
          isOpen={isBillUploadOpen}
          onClose={() => setIsBillUploadOpen(false)}
          vendorId={vendor?.id || ''}
          vendorName={vendor?.name || ''}
          purchaseDate={selectedDateForBill}
          totalAmount={selectedDateAmount}
          purchaseItem={selectedPurchaseForBill}
          uploadType={billUploadType}
          onUploadBill={handleUploadBill}
        />
      </DialogContent>
    </Dialog>
  );
}