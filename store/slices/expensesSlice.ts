import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Expense, getExpenses, addExpense as addExpenseToFirestore } from '@/lib/firestore';

interface ExpensesState {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
}

const initialState: ExpensesState = {
  expenses: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async () => {
    const expenses = await getExpenses();
    return expenses;
  }
);

export const addExpense = createAsyncThunk(
  'expenses/addExpense',
  async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const expenseId = await addExpenseToFirestore(expenseData);
    const expenseWithId = { ...expenseData, id: expenseId, createdAt: new Date() };
    return expenseWithId;
  }
);

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch expenses';
      })
      // Add expense
      .addCase(addExpense.fulfilled, (state, action) => {
        state.expenses.push(action.payload);
      });
  },
});

export const { clearError } = expensesSlice.actions;
export default expensesSlice.reducer;