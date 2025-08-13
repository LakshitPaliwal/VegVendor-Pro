'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedDate, setActiveTab } from '@/store/slices/uiSlice';
import { useVendors } from '@/hooks/useVendors';
import { usePurchases } from '@/hooks/usePurchases';
import { useInventory } from '@/hooks/useInventory';
import { useVegetables } from '@/hooks/useVegetables';
import { useSales } from '@/hooks/useSales';
import { useExpenses } from '@/hooks/useExpenses';
import LoginForm from '@/components/auth/LoginForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getPurchasesByVendor, getBillsByVendor, addBill, getSalesByDateRange, getExpensesByDateRange, getPurchasesByDateRange, type Bill } from '@/lib/firestore';

// Components
import Header from '@/components/layout/Header';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import PurchaseManagement from '@/components/purchases/PurchaseManagement';
import InventoryManagement from '@/components/inventory/InventoryManagement';
import VendorManagement from '@/components/vendors/VendorManagement';
import WeightVerification from '@/components/verification/WeightVerification';
import FinancialReports from '@/components/reports/FinancialReports';

export default function VegetableVendorApp() {
  const { user, loading: authLoading } = useAuth();
  const dispatch = useAppDispatch();
  
  // Redux state
  const { selectedDate, activeTab } = useAppSelector((state) => state.ui);
  
  // Custom hooks for data management
  const { vendors, loading: vendorsLoading, addVendor, updateVendor } = useVendors();
  const { purchases, allPurchases, loadingPurchases, addPurchase, verifyWeight } = usePurchases();
  const { inventory, loading: inventoryLoading } = useInventory();
  const { vegetables, addVegetable } = useVegetables();
  const { sales, addSale } = useSales();
  const { expenses, addExpense } = useExpenses();
  
  // Convert selectedDate string to Date object
  const selectedDateObj = parseISO(selectedDate);
  
  // Overall loading state
  const loading = vendorsLoading || inventoryLoading;

  const handleLoadVendorPurchases = async (vendorId: string): Promise<Purchase[]> => {
    try {
      return await getPurchasesByVendor(vendorId);
    } catch (error) {
      console.error('Error loading vendor purchases:', error);
      return [];
    }
  };

  const handleLoadVendorBills = async (vendorId: string): Promise<Bill[]> => {
    try {
      return await getBillsByVendor(vendorId);
    } catch (error) {
      console.error('Error loading vendor bills:', error);
      return [];
    }
  };

  const handleUploadBill = async (
    billData: Omit<Bill, 'id' | 'uploadedAt'>
  ): Promise<void> => {
    try {
      // Save bill data (with base64 file data) to Firestore
      await addBill(billData);
    } catch (error) {
      console.error('Error uploading bill:', error);
      throw error;
    }
  };

  const handleLoadFinancialData = async (startDate: string, endDate: string) => {
    try {
      const [salesData, expensesData, purchasesData] = await Promise.all([
        getSalesByDateRange(startDate, endDate),
        getExpensesByDateRange(startDate, endDate),
        getPurchasesByDateRange(startDate, endDate)
      ]);
      
      return {
        sales: salesData,
        expenses: expensesData,
        purchases: purchasesData
      };
    } catch (error) {
      console.error('Error loading financial data:', error);
      throw error;
    }
  };

  const handleDateChange = (date: Date) => {
    dispatch(setSelectedDate(format(date, 'yyyy-MM-dd')));
  };

  const handleTabChange = (tab: string) => {
    dispatch(setActiveTab(tab));
  };
  
  // Show login form if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Show loading screen while data is being loaded
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading your vendor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header vendorCount={vendors.length} inventoryCount={inventory.length} />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-7 min-w-fit lg:w-fit">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="verification" className="text-xs sm:text-sm">Weight Check</TabsTrigger>
              <TabsTrigger value="crates" className="text-xs sm:text-sm">Crates</TabsTrigger>
              <TabsTrigger value="reports" className="text-xs sm:text-sm">Reports</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <DashboardOverview
              vendors={vendors}
              purchases={purchases}
              inventory={inventory}
              allPurchases={allPurchases}
              onSwitchToWeightCheck={() => {
                console.log('Switching to verification tab');
                dispatch(setActiveTab('verification'));
              }}
            />
          </TabsContent>

          <TabsContent value="purchases">
            <PurchaseManagement
              purchases={purchases}
              vendors={vendors}
              vegetables={vegetables}
              selectedDate={selectedDateObj}
              onDateChange={handleDateChange}
              onAddPurchase={addPurchase}
              loadingPurchases={loadingPurchases}
            />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryManagement 
              inventory={inventory} 
              vegetables={vegetables}
              onAddVegetable={addVegetable}
            />
          </TabsContent>

          <TabsContent value="vendors">
            <VendorManagement
              vendors={vendors}
              onAddVendor={addVendor}
              onLoadVendorPurchases={handleLoadVendorPurchases}
              onUpdateVendor={updateVendor}
              onLoadVendorBills={handleLoadVendorBills}
              onUploadBill={handleUploadBill}
            />
          </TabsContent>

          <TabsContent value="verification">
            <WeightVerification
              purchases={purchases}
              allPurchases={allPurchases}
              vegetables={vegetables}
              selectedDate={selectedDateObj}
              onDateChange={handleDateChange}
              onVerifyWeight={verifyWeight}
            />
          </TabsContent>

          <TabsContent value="crates">
            <div className="text-center py-8">
              <p className="text-lg font-medium text-gray-900 mb-4">Crates Management</p>
              <p className="text-gray-600 mb-6">
                Track and manage crates that need to be returned to wholesale vendors
              </p>
              <a href="/crates" className="inline-block">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  Open Crates Management
                </button>
              </a>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <FinancialReports
              sales={sales}
              expenses={expenses}
              purchases={allPurchases}
              vendors={vendors}
              inventory={inventory}
              vegetables={vegetables}
              onAddSale={addSale}
              onAddExpense={addExpense}
              onLoadFinancialData={handleLoadFinancialData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}