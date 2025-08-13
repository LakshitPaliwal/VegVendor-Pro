import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  selectedDate: string;
  activeTab: string;
  lastSelectedVendor: string;
}

const initialState: UIState = {
  selectedDate: new Date().toISOString().split('T')[0],
  activeTab: 'dashboard',
  lastSelectedVendor: '',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    setLastSelectedVendor: (state, action: PayloadAction<string>) => {
      state.lastSelectedVendor = action.payload;
    },
  },
});

export const { setSelectedDate, setActiveTab, setLastSelectedVendor } = uiSlice.actions;
export default uiSlice.reducer;