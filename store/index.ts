import { configureStore } from '@reduxjs/toolkit';
import vendorsReducer from './slices/vendorsSlice';
import purchasesReducer from './slices/purchasesSlice';
import inventoryReducer from './slices/inventorySlice';
import vegetablesReducer from './slices/vegetablesSlice';
import salesReducer from './slices/salesSlice';
import expensesReducer from './slices/expensesSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    vendors: vendorsReducer,
    purchases: purchasesReducer,
    inventory: inventoryReducer,
    vegetables: vegetablesReducer,
    sales: salesReducer,
    expenses: expensesReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        ignoredPaths: [
          'vendors.vendors',
          'purchases.purchases',
          'purchases.allPurchases',
          'purchases.purchasesByDate',
          'inventory.items',
          'vegetables.vegetables',
          'sales.sales',
          'expenses.expenses'
        ],
        ignoredActionPaths: [
          'payload.0.createdAt',
          'payload.1.createdAt',
          'payload.2.createdAt',
          'payload.3.createdAt',
          'payload.4.createdAt',
          'payload.5.createdAt',
          'payload.6.createdAt',
          'payload.7.createdAt',
          'payload.8.createdAt',
          'payload.9.createdAt',
          'payload.purchases.0.createdAt',
          'payload.purchases.1.createdAt',
          'payload.purchases.2.createdAt',
          'payload.purchases.3.createdAt',
          'payload.purchases.4.createdAt',
          'payload.purchases.5.createdAt',
          'payload.purchases.6.createdAt',
          'payload.purchases.7.createdAt',
          'payload.purchases.8.createdAt',
          'payload.purchases.9.createdAt',
          'meta.arg.createdAt',
          'payload.createdAt'
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;