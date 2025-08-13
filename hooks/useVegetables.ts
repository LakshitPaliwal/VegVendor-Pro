import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchVegetables, addVegetable } from '@/store/slices/vegetablesSlice';
import { VegetableItem } from '@/lib/firestore';

export const useVegetables = () => {
  const dispatch = useAppDispatch();
  const { vegetables, loading, error } = useAppSelector((state) => state.vegetables);

  useEffect(() => {
    dispatch(fetchVegetables());
  }, [dispatch]);

  const handleAddVegetable = async (vegetableData: Omit<VegetableItem, 'id' | 'createdAt'>) => {
    await dispatch(addVegetable(vegetableData)).unwrap();
  };

  return {
    vegetables,
    loading,
    error,
    addVegetable: handleAddVegetable,
  };
};