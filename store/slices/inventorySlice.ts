import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { InventoryItem, getInventory, updateInventoryItem as updateInventoryItemInFirestore, addInventoryItem as addInventoryItemToFirestore } from '@/lib/firestore';

interface InventoryState {
  inventory: InventoryItem[];
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  inventory: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchInventory = createAsyncThunk(
  'inventory/fetchInventory',
  async () => {
    const inventory = await getInventory();
    return inventory;
  }
);

export const updateInventoryItem = createAsyncThunk(
  'inventory/updateInventoryItem',
  async ({ itemId, updates }: { itemId: string; updates: Partial<InventoryItem> }) => {
    await updateInventoryItemInFirestore(itemId, updates);
    return { itemId, updates };
  }
);

export const addInventoryItem = createAsyncThunk(
  'inventory/addInventoryItem',
  async (itemData: Omit<InventoryItem, 'id'>) => {
    const itemId = await addInventoryItemToFirestore(itemData);
    return { ...itemData, id: itemId };
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch inventory
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.inventory = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch inventory';
      })
      // Update inventory item
      .addCase(updateInventoryItem.fulfilled, (state, action) => {
        const { itemId, updates } = action.payload;
        const index = state.inventory.findIndex(item => item.id === itemId);
        if (index !== -1) {
          state.inventory[index] = { ...state.inventory[index], ...updates };
        }
      })
      // Add inventory item
      .addCase(addInventoryItem.fulfilled, (state, action) => {
        state.inventory.push(action.payload);
      });
  },
});

export const { clearError } = inventorySlice.actions;
export default inventorySlice.reducer;