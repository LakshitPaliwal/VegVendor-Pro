import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Sale, getSales, addSale as addSaleToFirestore } from '@/lib/firestore';

interface SalesState {
  sales: Sale[];
  loading: boolean;
  error: string | null;
}

const initialState: SalesState = {
  sales: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchSales = createAsyncThunk(
  'sales/fetchSales',
  async () => {
    const sales = await getSales();
    return sales;
  }
);

export const addSale = createAsyncThunk(
  'sales/addSale',
  async (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    const saleId = await addSaleToFirestore(saleData);
    const saleWithId = { ...saleData, id: saleId, createdAt: new Date() };
    return saleWithId;
  }
);

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch sales
      .addCase(fetchSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.loading = false;
        state.sales = action.payload;
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch sales';
      })
      // Add sale
      .addCase(addSale.fulfilled, (state, action) => {
        state.sales.push(action.payload);
      });
  },
});

export const { clearError } = salesSlice.actions;
export default salesSlice.reducer;