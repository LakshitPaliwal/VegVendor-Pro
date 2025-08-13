import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchVendors, addVendor, updateVendor } from '@/store/slices/vendorsSlice';
import { Vendor } from '@/lib/firestore';

export const useVendors = () => {
  const dispatch = useAppDispatch();
  const { vendors, loading, error } = useAppSelector((state) => state.vendors);

  useEffect(() => {
    dispatch(fetchVendors());
  }, [dispatch]);

  const handleAddVendor = async (vendorData: Omit<Vendor, 'id' | 'createdAt'>) => {
    await dispatch(addVendor(vendorData)).unwrap();
  };

  const handleUpdateVendor = async (vendorId: string, updates: Partial<Vendor>) => {
    await dispatch(updateVendor({ vendorId, updates })).unwrap();
  };

  return {
    vendors,
    loading,
    error,
    addVendor: handleAddVendor,
    updateVendor: handleUpdateVendor,
  };
};