import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAllPurchases, fetchPurchasesByDate, addPurchase, updatePurchase } from '@/store/slices/purchasesSlice';
import { updateVendor } from '@/store/slices/vendorsSlice';
import { updateInventoryItem, addInventoryItem } from '@/store/slices/inventorySlice';
import { Purchase } from '@/lib/firestore';
import { format } from 'date-fns';

export const usePurchases = () => {
  const dispatch = useAppDispatch();
  const { purchases, allPurchases, loading, loadingPurchases, error } = useAppSelector((state) => state.purchases);
  const { vendors } = useAppSelector((state) => state.vendors);
  const { inventory } = useAppSelector((state) => state.inventory);
  const { selectedDate } = useAppSelector((state) => state.ui);

  useEffect(() => {
    dispatch(fetchAllPurchases());
  }, [dispatch]);

  useEffect(() => {
    if (selectedDate) {
      dispatch(fetchPurchasesByDate(selectedDate));
    }
  }, [dispatch, selectedDate]);

  const handleAddPurchase = async (purchaseData: Omit<Purchase, 'id' | 'createdAt'>) => {
    await dispatch(addPurchase(purchaseData)).unwrap();
    
    // Update vendor's total purchases count
    const vendor = vendors.find(v => v.id === purchaseData.vendorId);
    if (vendor) {
      const newCount = vendor.totalPurchases + 1;
      await dispatch(updateVendor({ 
        vendorId: vendor.id, 
        updates: { totalPurchases: newCount } 
      })).unwrap();
    }
  };

  const handleVerifyWeight = async (purchaseId: string, receivedWeight: number) => {
    const purchase = purchases.find(p => p.id === purchaseId) || 
                    allPurchases.find(p => p.id === purchaseId);
    if (!purchase) return;

    const discrepancy = purchase.orderedWeight - receivedWeight;
    const updates = {
      receivedWeight,
      verificationStatus: discrepancy > 0 ? 'discrepancy' as const : 'verified' as const,
      discrepancyAmount: discrepancy > 0 ? discrepancy : null
    };
    
    await dispatch(updatePurchase({ purchaseId, updates })).unwrap();

    // Update inventory
    const existingItem = inventory.find(item => item.vegetable === purchase.vegetable);
    
    if (existingItem) {
      const updatedItem = {
        totalStock: existingItem.totalStock + receivedWeight,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      await dispatch(updateInventoryItem({ 
        itemId: existingItem.id, 
        updates: updatedItem 
      })).unwrap();
    } else {
      const newItem = {
        vegetable: purchase.vegetable,
        totalStock: receivedWeight,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      await dispatch(addInventoryItem(newItem)).unwrap();
    }
  };

  return {
    purchases,
    allPurchases,
    loading,
    loadingPurchases,
    error,
    addPurchase: handleAddPurchase,
    verifyWeight: handleVerifyWeight,
  };
};