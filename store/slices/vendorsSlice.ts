import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Vendor, getVendors, addVendor as addVendorToFirestore, updateVendor as updateVendorInFirestore } from '@/lib/firestore';

interface VendorsState {
  vendors: Vendor[];
  loading: boolean;
  error: string | null;
}

const initialState: VendorsState = {
  vendors: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchVendors = createAsyncThunk(
  'vendors/fetchVendors',
  async () => {
    const vendors = await getVendors();
    return vendors;
  }
);

export const addVendor = createAsyncThunk(
  'vendors/addVendor',
  async (vendorData: Omit<Vendor, 'id' | 'createdAt'>) => {
    const vendorId = await addVendorToFirestore(vendorData);
    const vendorWithId = { ...vendorData, id: vendorId, createdAt: new Date() };
    return vendorWithId;
  }
);

export const updateVendor = createAsyncThunk(
  'vendors/updateVendor',
  async ({ vendorId, updates }: { vendorId: string; updates: Partial<Vendor> }) => {
    await updateVendorInFirestore(vendorId, updates);
    return { vendorId, updates };
  }
);

const vendorsSlice = createSlice({
  name: 'vendors',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch vendors
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors = action.payload;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch vendors';
      })
      // Add vendor
      .addCase(addVendor.fulfilled, (state, action) => {
        state.vendors.push(action.payload);
      })
      // Update vendor
      .addCase(updateVendor.fulfilled, (state, action) => {
        const { vendorId, updates } = action.payload;
        const index = state.vendors.findIndex(v => v.id === vendorId);
        if (index !== -1) {
          state.vendors[index] = { ...state.vendors[index], ...updates };
        }
      });
  },
});

export const { clearError } = vendorsSlice.actions;
export default vendorsSlice.reducer;