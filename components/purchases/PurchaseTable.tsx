'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Scale, CheckCircle, XCircle } from 'lucide-react';
import { Purchase } from '@/lib/firestore';

interface PurchaseTableProps {
  purchases: Purchase[];
}

export default function PurchaseTable({ purchases, onVerifyWeight }: PurchaseTableProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0 overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Vendor</TableHead>
              <TableHead className="min-w-[100px]">Vegetable</TableHead>
              <TableHead className="min-w-[80px] text-center">Ordered (kg)</TableHead>
              <TableHead className="min-w-[80px] text-center">Received (kg)</TableHead>
              <TableHead className="min-w-[60px] text-center">Crates</TableHead>
              <TableHead className="min-w-[80px] text-center">Price/kg</TableHead>
              <TableHead className="min-w-[100px] text-center">Total Amount</TableHead>
              <TableHead className="min-w-[80px] text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="font-medium">
                  <div className="truncate max-w-[120px]" title={purchase.vendorName}>
                    {purchase.vendorName}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="truncate max-w-[100px]" title={purchase.vegetable}>
                    {purchase.vegetable}
                  </div>
                </TableCell>
                <TableCell className="text-center">{purchase.orderedWeight}</TableCell>
                <TableCell className="text-center">
                  {purchase.receivedWeight ? 
                    <span className={purchase.discrepancyAmount ? "text-red-600 font-medium" : "text-green-600"}>
                      {purchase.receivedWeight}
                      {purchase.discrepancyAmount && (
                        <span className="text-red-500 text-xs block sm:inline sm:ml-1">
                          (-{purchase.discrepancyAmount})
                        </span>
                      )}
                    </span>
                    : '-'
                  }
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-blue-600 font-medium">
                    {purchase.cratesCount || 0}
                  </span>
                </TableCell>
                <TableCell className="text-center">₹{purchase.pricePerKg}</TableCell>
                <TableCell className="text-center font-medium">
                  {purchase.receivedWeight && purchase.receivedWeight !== purchase.orderedWeight ? (
                    <div>
                      <span className="text-green-600">₹{(purchase.receivedWeight * purchase.pricePerKg).toLocaleString()}</span>
                      <div className="text-xs text-gray-500 line-through">₹{purchase.totalAmount.toLocaleString()}</div>
                    </div>
                  ) : (
                    `₹${purchase.totalAmount.toLocaleString()}`
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={
                    purchase.verificationStatus === 'verified' ? 'default' :
                    purchase.verificationStatus === 'discrepancy' ? 'destructive' :
                    'secondary'
                  } className="text-xs">
                    {purchase.verificationStatus === 'pending' && <Scale className="h-3 w-3 mr-1" />}
                    {purchase.verificationStatus === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {purchase.verificationStatus === 'discrepancy' && <XCircle className="h-3 w-3 mr-1" />}
                    {purchase.verificationStatus}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}