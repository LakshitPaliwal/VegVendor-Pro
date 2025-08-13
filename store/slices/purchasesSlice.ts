import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Purchase, getPurchases, getPurchasesByDate, addPurchase as addPurchaseToFirestore, updatePurchase as updatePurchaseInFirestore } from '@/lib/firestore';

interface PurchasesState {
  purchases: Purchase[];
  allPurchases: Purchase[];
  loading: boolean;
  loadingPurchases: boolean;
  error: string | null;
}

const initialState: PurchasesState = {
  purchases: [],
  allPurchases: [],
  loading: false,
  loadingPurchases: false,
  error: null,
};

// Async thunks
export const fetchAllPurchases = createAsyncThunk(
  'purchases/fetchAllPurchases',
  async () => {
    const purchases = await getPurchases();
    return purchases;
  }
);

export const fetchPurchasesByDate = createAsyncThunk(
  'purchases/fetchPurchasesByDate',
  async (date: string) => {
    const purchases = await getPurchasesByDate(date);
    return { date, purchases };
  }
);

export const addPurchase = createAsyncThunk(
  'purchases/addPurchase',
  async (purchaseData: Omit<Purchase, 'id' | 'createdAt'>) => {
    const purchaseId = await addPurchaseToFirestore(purchaseData);
    const purchaseWithId = { ...purchaseData, id: purchaseId, createdAt: new Date() };
    return purchaseWithId;
  }
);

export const updatePurchase = createAsyncThunk(
  'purchases/updatePurchase',
  async ({ purchaseId, updates }: { purchaseId: string; updates: Partial<Purchase> }) => {
    await updatePurchaseInFirestore(purchaseId, updates);
    return { purchaseId, updates };
  }
);

const purchasesSlice = createSlice({
  name: 'purchases',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all purchases
      .addCase(fetchAllPurchases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPurchases.fulfilled, (state, action) => {
        state.loading = false;
        state.allPurchases = action.payload;
      })
      .addCase(fetchAllPurchases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch purchases';
      })
      // Fetch purchases by date
      .addCase(fetchPurchasesByDate.pending, (state) => {
        state.loadingPurchases = true;
        state.error = null;
      })
      .addCase(fetchPurchasesByDate.fulfilled, (state, action) => {
        state.loadingPurchases = false;
        state.purchases = action.payload.purchases;
        
        // Update allPurchases with new data
        const updatedAllPurchases = [...state.allPurchases];
        action.payload.purchases.forEach(newPurchase => {
          const existingIndex = updatedAllPurchases.findIndex(p => p.id === newPurchase.id);
          if (existingIndex >= 0) {
            updatedAllPurchases[existingIndex] = newPurchase;
          } else {
            updatedAllPurchases.push(newPurchase);
          }
        });
        state.allPurchases = updatedAllPurchases;
      })
      .addCase(fetchPurchasesByDate.rejected, (state, action) => {
        state.loadingPurchases = false;
        state.error = action.error.message || 'Failed to fetch purchases by date';
      })
      // Add purchase
      .addCase(addPurchase.fulfilled, (state, action) => {
        state.allPurchases.unshift(action.payload);
        // Add to current purchases if it matches the current date
        if (state.purchases.length === 0 || state.purchases[0]?.purchaseDate === action.payload.purchaseDate) {
          state.purchases.unshift(action.payload);
        }
      })
      // Update purchase
      .addCase(updatePurchase.fulfilled, (state, action) => {
        const { purchaseId, updates } = action.payload;
        
        // Update in purchases array
        const purchaseIndex = state.purchases.findIndex(p => p.id === purchaseId);
        if (purchaseIndex !== -1) {
          state.purchases[purchaseIndex] = { ...state.purchases[purchaseIndex], ...updates };
        }
        
        // Update in allPurchases array
        const allPurchaseIndex = state.allPurchases.findIndex(p => p.id === purchaseId);
        if (allPurchaseIndex !== -1) {
          state.allPurchases[allPurchaseIndex] = { ...state.allPurchases[allPurchaseIndex], ...updates };
        }
      });
  },
});

export const { clearError } = purchasesSlice.actions;
export default purchasesSlice.reducer;