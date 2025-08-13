import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchInventory } from '@/store/slices/inventorySlice';

export const useInventory = () => {
  const dispatch = useAppDispatch();
  const { inventory, loading, error } = useAppSelector((state) => state.inventory);

  useEffect(() => {
    dispatch(fetchInventory());
  }, [dispatch]);

  return {
    inventory,
    loading,
    error,
  };
};