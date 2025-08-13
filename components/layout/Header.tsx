'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Store, LogOut, Info } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { signOutUser } from '@/lib/auth';
import Link from 'next/link';

interface HeaderProps {
  vendorCount: number;
  inventoryCount: number;
}

export default function Header({ vendorCount, inventoryCount }: HeaderProps) {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-green-600 p-2 rounded-lg">
              <Store className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">VegVendor Pro</h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Retail Vegetable Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {user && (
              <div className="hidden sm:flex items-center space-x-2 mr-2">
                <span className="text-xs text-gray-600">Welcome, {user.email}</span>
              </div>
            )}
            <Badge variant="outline" className="text-green-700 border-green-200 text-xs sm:text-sm">
              {vendorCount} Vendors
            </Badge>
            <Badge variant="outline" className="text-blue-700 border-blue-200 text-xs sm:text-sm">
              {inventoryCount} Items
            </Badge>
            <Link href="/about">
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
              >
                <Info className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">About</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}