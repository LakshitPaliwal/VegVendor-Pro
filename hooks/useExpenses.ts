import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchExpenses, addExpense } from '@/store/slices/expensesSlice';
import { Expense } from '@/lib/firestore';

export const useExpenses = () => {
  const dispatch = useAppDispatch();
  const { expenses, loading, error } = useAppSelector((state) => state.expenses);

  useEffect(() => {
    dispatch(fetchExpenses());
  }, [dispatch]);

  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    await dispatch(addExpense(expenseData)).unwrap();
  };

  return {
    expenses,
    loading,
    error,
    addExpense: handleAddExpense,
  };
};