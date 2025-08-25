import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { collection, addDoc, query, onSnapshot, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { ShoppingCart, Package, User, Calendar, DollarSign, Plus } from 'lucide-react';

const Sales = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen to products
    const unsubscribe = onSnapshot(query(collection(db, 'products')), (snapshot) => {
      const productsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsList);
    });

    return unsubscribe;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct || !quantity || !customerName) {
      toast.error('Please fill in all fields');
      return;
    }

    const quantityNum = parseInt(quantity);
    if (quantityNum <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) {
      toast.error('Product not found');
      return;
    }

    if (quantityNum > product.stock) {
      toast.error(`Insufficient stock. Available: ${product.stock}`);
      return;
    }

    setLoading(true);
    try {
      const totalPrice = quantityNum * product.price;

      // Add sale record
      await addDoc(collection(db, 'sales'), {
        productId: selectedProduct,
        productName: product.name,
        quantitySold: quantityNum,
        customerName: customerName.trim(),
        saleDate: serverTimestamp(),
        salespersonId: currentUser.uid,
        salespersonEmail: currentUser.email,
        unitPrice: product.price,
        totalPrice: totalPrice
      });

      // Update product stock
      const productRef = doc(db, 'products', selectedProduct);
      await updateDoc(productRef, {
        stock: increment(-quantityNum)
      });

      toast.success('Sale recorded successfully!');
      
      // Reset form
      setSelectedProduct('');
      setQuantity('');
      setCustomerName('');
    } catch (error) {
      console.error('Error recording sale:', error);
      toast.error('Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-700">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Record New Sale
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Process customer transactions quickly and efficiently
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sale Form */}
        <div className="lg:col-span-2">
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-green-600" />
                <span>Sale Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{product.name}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              Stock: {product.stock} | ${product.price}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      placeholder="Enter quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  {selectedProductData && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Available stock: {selectedProductData.stock}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer">Customer Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="customer"
                      type="text"
                      placeholder="Enter customer name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? 'Recording Sale...' : 'Record Sale'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sale Summary */}
        <div className="space-y-4">
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Sale Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProductData && quantity ? (
                <>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Product:</span>
                      <span className="font-medium">{selectedProductData.name}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Unit Price:</span>
                      <span className="font-medium">${selectedProductData.price}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Quantity:</span>
                      <span className="font-medium">{quantity}</span>
                    </div>
                    
                    <hr className="border-gray-200 dark:border-gray-700" />
                    
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg text-green-600 dark:text-green-400">
                        ${(selectedProductData.price * parseInt(quantity || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800 dark:text-blue-200">Sale Date</span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Select product and quantity to see summary
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Sales;