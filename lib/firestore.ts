import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  location: string;
  crateCodePrefix: string; // Keep for backward compatibility
  crateCodes?: string[]; // New field for multiple crate codes
  totalPurchases: number;
  createdAt: Date;
}

export interface Purchase {
  id: string;
  vendorId: string;
  vendorName: string;
  vegetable: string;
  orderedWeight: number;
  receivedWeight?: number;
  pricePerKg: number;
  totalAmount: number;
  purchaseDate: string;
  verificationStatus: 'pending' | 'verified' | 'discrepancy';
  discrepancyAmount?: number;
  cratesCount?: number;
  vendorCrateCode?: string; // Selected crate code for this purchase
  returnedCrates?: number;
  lastReturnDate?: string;
  crateStatus?: 'pending' | 'partial' | 'returned';
  createdAt: Date;
}

export interface Bill {
  id: string;
  vendorId: string;
  vendorName: string;
  purchaseDate: string;
  fileName: string;
  fileData: string; // base64 encoded file data
  fileType: string; // MIME type
  fileSize: number;
  uploadedAt: Date;
  totalAmount: number;
  billType: 'parent' | 'child'; // parent = all items, child = single item
  purchaseId?: string; // only for child bills
  vegetableName?: string; // only for child bills
}

export interface Sale {
  id: string;
  vegetable: string;
  quantitySold: number;
  sellingPricePerKg: number;
  totalSaleAmount: number;
  saleDate: string;
  customerName?: string;
  paymentMethod: 'cash' | 'upi' | 'card' | 'credit';
  createdAt: Date;
}

export interface Expense {
  id: string;
  category: 'transportation' | 'storage' | 'utilities' | 'labor' | 'rent' | 'maintenance' | 'other';
  description: string;
  amount: number;
  expenseDate: string;
  receiptUrl?: string;
  createdAt: Date;
}

export interface InventoryItem {
  id: string;
  vegetable: string;
  totalStock: number;
  lastUpdated: string;
}

export interface VegetableItem {
  id: string;
  name: string;
  category: 'vegetable' | 'fruit';
  createdAt: Date;
}

// Vendors
export const addVendor = async (vendor: Omit<Vendor, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'vendors'), {
      ...vendor,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding vendor:', error);
    throw error;
  }
};

export const getVendors = async (): Promise<Vendor[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'vendors'));
    const vendors = querySnapshot.docs.map(doc => {
      const { createdAt, ...data } = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt?.toDate?.() || new Date()
      };
    }) as Vendor[];
    
    // Ensure totalPurchases is always a number
    return vendors.map(vendor => ({
      ...vendor,
      totalPurchases: vendor.totalPurchases || 0
    }));
  } catch (error) {
    console.error('Error getting vendors:', error);
    return [];
  }
};

export const updateVendor = async (vendorId: string, updates: Partial<Vendor>) => {
  try {
    const vendorRef = doc(db, 'vendors', vendorId);
    await updateDoc(vendorRef, updates);
  } catch (error) {
    console.error('Error updating vendor:', error);
    throw error;
  }
};

export const getPurchasesByVendor = async (vendorId: string): Promise<Purchase[]> => {
  try {
    const q = query(collection(db, 'purchases'), where('vendorId', '==', vendorId));
    const querySnapshot = await getDocs(q);
    const purchases = querySnapshot.docs.map(doc => {
      const { createdAt, ...data } = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt?.toDate?.() || new Date()
      };
    }) as Purchase[];
    
    // Sort by createdAt in memory as secondary sort
    return purchases.sort((a, b) => {
      // First sort by date
      const dateCompare = b.purchaseDate.localeCompare(a.purchaseDate);
      if (dateCompare !== 0) return dateCompare;
      // Then by creation time
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    console.error('Error getting purchases by vendor:', error);
    return [];
  }
};
// Purchases
export const addPurchase = async (purchase: Omit<Purchase, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'purchases'), {
      ...purchase,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding purchase:', error);
    throw error;
  }
};

export const getPurchases = async (): Promise<Purchase[]> => {
  try {
    const q = query(collection(db, 'purchases'), orderBy('purchaseDate', 'desc'));
    const querySnapshot = await getDocs(q);
    const purchases = querySnapshot.docs.map(doc => {
      const { createdAt, ...data } = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt?.toDate?.() || new Date()
      };
    }) as Purchase[];
    
    // Sort by purchaseDate (desc) then by createdAt (desc) in JavaScript
    return purchases.sort((a, b) => {
      const dateComparison = b.purchaseDate.localeCompare(a.purchaseDate);
      if (dateComparison !== 0) return dateComparison;
      
      // If dates are the same, sort by createdAt
      const aTime = a.createdAt?.getTime?.() || 0;
      const bTime = b.createdAt?.getTime?.() || 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Error getting purchases:', error);
    return [];
  }
};

export const getPurchasesByDate = async (date: string): Promise<Purchase[]> => {
  try {
    const q = query(
      collection(db, 'purchases'), 
      where('purchaseDate', '==', date)
    );
    const querySnapshot = await getDocs(q);
    const purchases = querySnapshot.docs.map(doc => {
      const { createdAt, ...data } = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt?.toDate?.() || new Date()
      };
    }) as Purchase[];
    
    // Sort by createdAt in memory to avoid index requirement
    return purchases.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting purchases by date:', error);
    return [];
  }
};

export const updatePurchase = async (purchaseId: string, updates: Partial<Purchase>) => {
  try {
    const purchaseRef = doc(db, 'purchases', purchaseId);
    await updateDoc(purchaseRef, updates);
  } catch (error) {
    console.error('Error updating purchase:', error);
    throw error;
  }
};

// Sales
export const addSale = async (sale: Omit<Sale, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'sales'), {
      ...sale,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding sale:', error);
    throw error;
  }
};

export const getSales = async (): Promise<Sale[]> => {
  try {
    const q = query(collection(db, 'sales'), orderBy('saleDate', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const { createdAt, ...data } = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt?.toDate?.() || new Date()
      };
    }) as Sale[];
  } catch (error) {
    console.error('Error getting sales:', error);
    return [];
  }
};

export const getSalesByDateRange = async (startDate: string, endDate: string): Promise<Sale[]> => {
  try {
    const q = query(
      collection(db, 'sales'),
      where('saleDate', '>=', startDate),
      where('saleDate', '<=', endDate),
      orderBy('saleDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const { createdAt, ...data } = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt?.toDate?.() || new Date()
      };
    }) as Sale[];
  } catch (error) {
    console.error('Error getting sales by date range:', error);
    return [];
  }
};

// Expenses
export const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'expenses'), {
      ...expense,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const q = query(collection(db, 'expenses'), orderBy('expenseDate', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const { createdAt, ...data } = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt?.toDate?.() || new Date()
      };
    }) as Expense[];
  } catch (error) {
    console.error('Error getting expenses:', error);
    return [];
  }
};

export const getExpensesByDateRange = async (startDate: string, endDate: string): Promise<Expense[]> => {
  try {
    const q = query(
      collection(db, 'expenses'),
      where('expenseDate', '>=', startDate),
      where('expenseDate', '<=', endDate),
      orderBy('expenseDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const { createdAt, ...data } = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt?.toDate?.() || new Date()
      };
    }) as Expense[];
  } catch (error) {
    console.error('Error getting expenses by date range:', error);
    return [];
  }
};

export const getPurchasesByDateRange = async (startDate: string, endDate: string): Promise<Purchase[]> => {
  try {
    const q = query(
      collection(db, 'purchases'),
      where('purchaseDate', '>=', startDate),
      where('purchaseDate', '<=', endDate),
      orderBy('purchaseDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const { createdAt, ...data } = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt?.toDate?.() || new Date()
      };
    }) as Purchase[];
  } catch (error) {
    console.error('Error getting purchases by date range:', error);
    return [];
  }
};

// Inventory
export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'inventory'), item);
    return docRef.id;
  } catch (error) {
    console.error('Error adding inventory item:', error);
    throw error;
  }
};

export const getInventory = async (): Promise<InventoryItem[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'inventory'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InventoryItem[];
  } catch (error) {
    console.error('Error getting inventory:', error);
    return [];
  }
};

export const updateInventoryItem = async (itemId: string, updates: Partial<InventoryItem>) => {
  try {
    const itemRef = doc(db, 'inventory', itemId);
    await updateDoc(itemRef, updates);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
};

// Vegetables/Fruits
export const addVegetableItem = async (item: Omit<VegetableItem, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'vegetables'), {
      ...item,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding vegetable item:', error);
    throw error;
  }
};

export const getVegetableItems = async (): Promise<VegetableItem[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'vegetables'));
    return querySnapshot.docs.map(doc => {
      const { createdAt, ...data } = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt?.toDate?.() || new Date()
      };
    }) as VegetableItem[];
  } catch (error) {
    console.error('Error getting vegetable items:', error);
    return [];
  }
};
// Bills
export const addBill = async (bill: Omit<Bill, 'id' | 'uploadedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'bills'), {
      ...bill,
      uploadedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding bill:', error);
    throw error;
  }
};

export const getBillsByVendor = async (vendorId: string): Promise<Bill[]> => {
  try {
    const q = query(
      collection(db, 'bills'), 
      where('vendorId', '==', vendorId)
    );
    const querySnapshot = await getDocs(q);
    const bills = querySnapshot.docs.map(doc => {
      const { uploadedAt, ...data } = doc.data();
      return {
        id: doc.id,
        ...data,
        uploadedAt: uploadedAt?.toDate?.() || new Date()
      };
    }) as Bill[];
    
    // Sort by purchaseDate in JavaScript to avoid index requirement
    return bills.sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));
  } catch (error) {
    console.error('Error getting bills by vendor:', error);
    return [];
  }
};

export const getBillsByDate = async (vendorId: string, purchaseDate: string): Promise<Bill[]> => {
  try {
    const q = query(
      collection(db, 'bills'), 
      where('vendorId', '==', vendorId),
      where('purchaseDate', '==', purchaseDate)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const { uploadedAt, ...data } = doc.data();
      return {
        id: doc.id,
        ...data,
        uploadedAt: uploadedAt?.toDate?.() || new Date()
      };
    }) as Bill[];
  } catch (error) {
    console.error('Error getting bills by date:', error);
    return [];
  }
};

// Convert file to base64
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsDataURL(file);
  });
};

// Create download URL from base64 data
export const createDownloadUrlFromBase64 = (fileData: string, fileName: string): string => {
  try {
    const blob = dataURLtoBlob(fileData);
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error creating download URL:', error);
    throw error;
  }
};

// Helper function to convert data URL to Blob
const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || '';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};