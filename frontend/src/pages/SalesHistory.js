import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { History, Search, Filter, Calendar, Download, DollarSign } from 'lucide-react';

const SalesHistory = () => {
  const { userProfile } = useAuth();
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [salespersonFilter, setSalespersonFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to sales
    const salesQuery = query(
      collection(db, 'sales'),
      orderBy('saleDate', 'desc')
    );
    
    const unsubscribe = onSnapshot(salesQuery, (snapshot) => {
      const salesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        saleDate: doc.data().saleDate?.toDate()
      }));
      setSales(salesList);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let filtered = [...sales];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.salespersonEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let dateThreshold;

      switch (dateFilter) {
        case 'today':
          dateThreshold = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          dateThreshold = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          dateThreshold = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          dateThreshold = null;
      }

      if (dateThreshold) {
        filtered = filtered.filter(sale => sale.saleDate >= dateThreshold);
      }
    }

    // Salesperson filter (for admin/manager)
    if (salespersonFilter !== 'all') {
      filtered = filtered.filter(sale => sale.salespersonEmail === salespersonFilter);
    }

    setFilteredSales(filtered);
  }, [sales, searchTerm, dateFilter, salespersonFilter]);

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
  const totalQuantity = filteredSales.reduce((sum, sale) => sum + (sale.quantitySold || 0), 0);

  const uniqueSalespersons = [...new Set(sales.map(sale => sale.salespersonEmail))].filter(Boolean);

  const exportToCSV = () => {
    const headers = ['Date', 'Product', 'Customer', 'Quantity', 'Unit Price', 'Total', 'Salesperson'];
    const csvData = filteredSales.map(sale => [
      sale.saleDate?.toLocaleDateString(),
      sale.productName,
      sale.customerName,
      sale.quantitySold,
      `$${sale.unitPrice?.toFixed(2)}`,
      `$${sale.totalPrice?.toFixed(2)}`,
      sale.salespersonEmail
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <History className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Sales History
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track and analyze all sales transactions
              </p>
            </div>
          </div>
          <Button
            onClick={exportToCSV}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-effect border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredSales.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <History className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Quantity</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalQuantity}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

            {(userProfile?.role === 'admin' || userProfile?.role === 'manager') && (
              <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by salesperson" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Salespersons</SelectItem>
                  {uniqueSalespersons.map(email => (
                    <SelectItem key={email} value={email}>{email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card className="glass-effect border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  {(userProfile?.role === 'admin' || userProfile?.role === 'manager') && (
                    <TableHead>Salesperson</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading sales history...
                    </TableCell>
                  </TableRow>
                ) : filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-center">
                        <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No sales found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell>
                        {sale.saleDate?.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{sale.productName}</TableCell>
                      <TableCell>{sale.customerName}</TableCell>
                      <TableCell>{sale.quantitySold}</TableCell>
                      <TableCell>${sale.unitPrice?.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold text-green-600 dark:text-green-400">
                        ${sale.totalPrice?.toFixed(2)}
                      </TableCell>
                      {(userProfile?.role === 'admin' || userProfile?.role === 'manager') && (
                        <TableCell className="text-sm">{sale.salespersonEmail}</TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesHistory;