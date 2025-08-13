import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSales, addSale } from '@/store/slices/salesSlice';
import { updateInventoryItem } from '@/store/slices/inventorySlice';
import { Sale } from '@/lib/firestore';

export const useSales = () => {
  const dispatch = useAppDispatch();
  const { sales, loading, error } = useAppSelector((state) => state.sales);
  const { inventory } = useAppSelector((state) => state.inventory);

  useEffect(() => {
    dispatch(fetchSales());
  }, [dispatch]);

  const handleAddSale = async (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    await dispatch(addSale(saleData)).unwrap();
    
    // Update inventory - reduce stock
    const inventoryItem = inventory.find(item => item.vegetable === saleData.vegetable);
    if (inventoryItem) {
      const updatedStock = inventoryItem.totalStock - saleData.quantitySold;
      await dispatch(updateInventoryItem({
        itemId: inventoryItem.id,
        updates: {
          totalStock: Math.max(0, updatedStock),
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      })).unwrap();
    }
  };

  return {
    sales,
    loading,
    error,
    addSale: handleAddSale,
  };
};