import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { VegetableItem, getVegetableItems, addVegetableItem as addVegetableItemToFirestore } from '@/lib/firestore';

interface VegetablesState {
  vegetables: VegetableItem[];
  loading: boolean;
  error: string | null;
}

const initialState: VegetablesState = {
  vegetables: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchVegetables = createAsyncThunk(
  'vegetables/fetchVegetables',
  async () => {
    const vegetables = await getVegetableItems();
    return vegetables;
  }
);

export const addVegetable = createAsyncThunk(
  'vegetables/addVegetable',
  async (vegetableData: Omit<VegetableItem, 'id' | 'createdAt'>) => {
    const vegetableId = await addVegetableItemToFirestore(vegetableData);
    const vegetableWithId = { ...vegetableData, id: vegetableId, createdAt: new Date() };
    return vegetableWithId;
  }
);

const vegetablesSlice = createSlice({
  name: 'vegetables',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch vegetables
      .addCase(fetchVegetables.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVegetables.fulfilled, (state, action) => {
        state.loading = false;
        state.vegetables = action.payload;
      })
      .addCase(fetchVegetables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch vegetables';
      })
      // Add vegetable
      .addCase(addVegetable.fulfilled, (state, action) => {
        state.vegetables.push(action.payload);
      });
  },
});

export const { clearError } = vegetablesSlice.actions;
export default vegetablesSlice.reducer;