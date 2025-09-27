/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Product, CartItem, Transaction, User, Permissions } from './types';
import { mockProducts } from './utils/serviceEnhance'; // Path is old, but content is new `data/products.ts`
import { getProductSuggestion } from './utils/serviceDescribeImage'; // Path is old, but content is `utils/geminiService.ts`
import { Header } from './components/StatusBar'; // Path is old, component name new
import { SearchBar } from './components/PixelDissolve'; // Path is old, component name new
import { ProductCatalog } from './components/DropZone'; // Path is old, component name new
import { Cart } from './components/ImageDisplay'; // Path is old, component name new
import { SuggestionBox } from './components/SelectionAnimator'; // Path is old, component name new
import * as XLSX from 'xlsx';


// Default permissions for a new user
const defaultPermissions: Permissions = {
  canManageProducts: false,
  canViewReports: false,
  canManagePurchases: false,
  canProcessReturns: false,
};


// Login Screen Component
interface LoginScreenProps {
  onLogin: (username: string, password_DO_NOT_STORE_IN_PRODUCTION: string) => void;
  error: string | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="w-full max-w-sm p-8 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl">
        <div className="flex items-center justify-center gap-3 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h1 className="text-2xl font-bold text-cyan-400">تسجيل الدخول</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">اسم المستخدم</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="password_DO_NOT_STORE_IN_PRODUCTION" className="block text-sm font-medium text-gray-300 mb-1">كلمة المرور</label>
            <input
              id="password_DO_NOT_STORE_IN_PRODUCTION"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full px-4 py-3 bg-cyan-600 text-white font-bold rounded-md hover:bg-cyan-500 transition">
            دخول
          </button>
        </form>
      </div>
    </div>
  );
};


// Permissions Modal Component (for editing a specific user's permissions)
interface PermissionsModalProps {
  onClose: () => void;
  user: User;
  onSave: (userId: number, newPermissions: Permissions) => void;
}

const PermissionsModal: React.FC<PermissionsModalProps> = ({ onClose, user, onSave }) => {
  const [currentPermissions, setCurrentPermissions] = useState<Permissions>(user.permissions || defaultPermissions);

  const handleCheckboxChange = (key: keyof Permissions) => {
    setCurrentPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onSave(user.id, currentPermissions);
    onClose();
  };

  const permissionLabels: { key: keyof Permissions; label: string }[] = [
    { key: 'canManageProducts', label: 'إدارة المنتجات (إضافة، تعديل، استيراد)' },
    { key: 'canViewReports', label: 'الاطلاع على التقارير' },
    { key: 'canManagePurchases', label: 'إنشاء فواتير المشتريات' },
    { key: 'canProcessReturns', label: 'معالجة المرتجعات' },
  ];

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 w-full max-w-lg p-6 rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">تعديل صلاحيات: <span className="text-cyan-400">{user.username}</span></h2>
        <div className="space-y-4">
          {permissionLabels.map(({ key, label }) => (
            <div key={key} className="flex items-center p-3 bg-gray-700 rounded-md">
              <input
                id={key}
                type="checkbox"
                checked={currentPermissions[key]}
                onChange={() => handleCheckboxChange(key)}
                className="h-5 w-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor={key} className="mr-3 block text-sm text-gray-200">
                {label}
              </label>
            </div>
          ))}
        </div>
        <div className="flex justify-start gap-4 pt-6 mt-4">
          <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-md hover:bg-cyan-500 transition">
            حفظ الصلاحيات
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

// Users Management Modal
interface UsersManagementModalProps {
  onClose: () => void;
  users: User[];
  onAddUser: (user: Pick<User, 'username' | 'password_DO_NOT_STORE_IN_PRODUCTION'>) => void;
  onDeleteUser: (user: User) => void;
  onSavePermissions: (userId: number, permissions: Permissions) => void;
  onChangePassword: (user: User) => void;
  currentUserId: number | undefined;
}

const UsersManagementModal: React.FC<UsersManagementModalProps> = ({ onClose, users, onAddUser, onDeleteUser, onSavePermissions, onChangePassword, currentUserId }) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userToEditPerms, setUserToEditPerms] = useState<User | null>(null);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      alert("يرجى إدخال اسم مستخدم وكلمة مرور.");
      return;
    }
    if (users.some(u => u.username === newUsername.trim())) {
      alert("اسم المستخدم هذا موجود بالفعل.");
      return;
    }
    onAddUser({ username: newUsername.trim(), password_DO_NOT_STORE_IN_PRODUCTION: newPassword.trim() });
    setNewUsername('');
    setNewPassword('');
  };

  return (
    <>
      <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40" onClick={onClose}>
        <div className="bg-gray-800 border border-gray-700 w-full max-w-3xl h-[90vh] p-6 rounded-lg shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-xl font-bold">إدارة المستخدمين</h2>
            <button onClick={onClose} className="text-2xl">&times;</button>
          </div>

          <div className="flex-grow overflow-y-auto pr-2">
            <h3 className="font-bold mb-2 text-lg">قائمة المستخدمين</h3>
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                  <div>
                    <p className="font-bold">{user.username}</p>
                    <p className="text-xs text-gray-400">{user.role === 'admin' ? 'مدير' : 'مستخدم'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onChangePassword(user)}
                      className="text-sm bg-gray-600 px-3 py-1 rounded hover:bg-gray-500"
                    >
                      تغيير كلمة المرور
                    </button>
                    {user.role === 'user' && (
                      <>
                        <button 
                          onClick={() => setUserToEditPerms(user)}
                          className="text-sm bg-yellow-600 px-3 py-1 rounded hover:bg-yellow-500"
                        >
                          الصلاحيات
                        </button>
                        <button 
                          onClick={() => onDeleteUser(user)}
                          disabled={user.id === currentUserId}
                          className="text-sm bg-red-600 px-3 py-1 rounded hover:bg-red-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                          حذف
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-700 flex-shrink-0">
            <h3 className="text-lg font-bold mb-3">إضافة مستخدم جديد</h3>
            <form onSubmit={handleAddUser} className="flex items-end gap-4 flex-wrap">
              <div>
                <label className="block text-sm text-gray-400 mb-1">اسم المستخدم</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="p-1.5 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">كلمة المرور</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="p-1.5 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-md hover:bg-cyan-500 transition"
              >
                إضافة
              </button>
            </form>
          </div>
        </div>
      </div>
      {userToEditPerms && (
        <PermissionsModal 
          user={userToEditPerms}
          onClose={() => setUserToEditPerms(null)}
          onSave={onSavePermissions}
        />
      )}
    </>
  );
};


// FIX: Moved ReportsModal component from utils/gifGenerator.ts to fix JSX parsing errors.
interface ReportsModalProps {
  onClose: () => void;
  transactions: Transaction[];
  products: Product[];
  formatCurrency: (amount: number) => string;
}

type ViewType = 'daily' | 'monthly' | 'annual';

const ReportsModal: React.FC<ReportsModalProps> = ({ onClose, transactions, products, formatCurrency }) => {
  const [view, setView] = useState<ViewType>('daily');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [exportStartDate, setExportStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().slice(0, 10));

  const filteredTransactions = useMemo(() => {
    const [year, month, day] = date.split('-').map(Number);
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      if (view === 'daily') {
        return txDate.getFullYear() === year && txDate.getMonth() + 1 === month && txDate.getDate() === day;
      }
      if (view === 'monthly') {
        return txDate.getFullYear() === year && txDate.getMonth() + 1 === month;
      }
      if (view === 'annual') {
        return txDate.getFullYear() === year;
      }
      return false;
    });
  }, [transactions, view, date]);

  const reportSummary = useMemo(() => {
    const saleTransactions = filteredTransactions.filter(tx => tx.type === 'sale').length;
    const returnTransactions = filteredTransactions.filter(tx => tx.type === 'return').length;

    const totalRevenue = filteredTransactions.reduce((sum, tx) => sum + tx.total, 0); // total is negative for returns
    
    const productsSold = new Map<string, { name: string; quantity: number; total: number }>();

    for (const tx of filteredTransactions) {
      const sign = tx.type === 'return' ? -1 : 1;
      for (const item of tx.items) {
        const existing = productsSold.get(item.id);
        const itemValue = item.price * item.quantity * sign;
        if (existing) {
          existing.quantity += (item.quantity * sign);
          existing.total += itemValue;
        } else {
          productsSold.set(item.id, {
            name: item.name,
            quantity: (item.quantity * sign),
            total: itemValue,
          });
        }
      }
    }
    
    // Sort products by quantity sold in descending order
    const sortedProducts = Array.from(productsSold.values()).sort((a, b) => b.quantity - a.quantity);

    return { totalRevenue, totalTransactions: saleTransactions + returnTransactions, productsSold: sortedProducts };
  }, [filteredTransactions]);
  
  const getFilterDateLabel = () => {
    const d = new Date(date + 'T00:00:00'); // Adjust for timezone issues
    if (view === 'daily') return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
    if (view === 'monthly') return d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
    if (view === 'annual') return d.toLocaleDateString('ar-EG', { year: 'numeric' });
  };
  
  const handleExportSales = () => {
    const start = new Date(exportStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(exportEndDate);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      alert('تاريخ البداية يجب أن يكون قبل تاريخ النهاية.');
      return;
    }

    const filteredForExport = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= start && txDate <= end;
    });

    if (filteredForExport.length === 0) {
      alert('لا توجد معاملات في النطاق الزمني المحدد للتصدير.');
      return;
    }

    const exportData = filteredForExport.flatMap(tx => 
      tx.items.map(item => ({
        'معرف العملية': tx.id,
        'نوع العملية': tx.type === 'return' ? 'مرتجع' : 'بيع',
        'المعرف الأصلي': tx.originalTransactionId || '',
        'التاريخ': new Date(tx.date).toLocaleDateString('ar-EG'),
        'الوقت': new Date(tx.date).toLocaleTimeString('ar-EG'),
        'باركود المنتج': item.id,
        'اسم المنتج': item.name,
        'الكمية': item.quantity,
        'سعر الوحدة': item.price,
        'إجمالي الصنف': item.price * item.quantity,
        'إجمالي الفاتورة': tx.total,
        'المبلغ المستلم/المسترد': tx.amountReceived,
        'الباقي': tx.changeDue,
      }))
    );
    
    const headers = [
      'معرف العملية', 'نوع العملية', 'المعرف الأصلي', 'التاريخ', 'الوقت', 'باركود المنتج', 'اسم المنتج', 'الكمية', 'سعر الوحدة', 'إجمالي الصنف', 'إجمالي الفاتورة', 'المبلغ المستلم/المسترد', 'الباقي'
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(exportData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير المبيعات');
    
    XLSX.writeFile(workbook, `تقرير_المبيعات_${exportStartDate}_إلى_${exportEndDate}.xlsx`);
  };

  const handleExportStock = () => {
    if (products.length === 0) {
      alert('لا توجد منتجات لتصدير رصيدها.');
      return;
    }

    const exportData = products.map(p => ({
      'الباركود': p.id,
      'اسم المنتج': p.name,
      'الرصيد المتاح': p.stock,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'رصيد المخزن');
    
    XLSX.writeFile(workbook, `تقرير_رصيد_المخزن_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="reports-modal-title">
      <div className="bg-gray-800 border border-gray-700 w-full max-w-4xl h-[90vh] p-6 rounded-lg shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 id="reports-modal-title" className="text-xl font-bold">تقارير المبيعات</h2>
            <button onClick={onClose} className="text-2xl">&times;</button>
        </div>
        
        <div className="flex-grow flex flex-col overflow-y-auto">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gray-900/50 rounded-md flex-shrink-0">
              <div className="flex rounded-md bg-gray-700 p-1">
                  {(['daily', 'monthly', 'annual'] as ViewType[]).map(v => (
                      <button key={v} onClick={() => setView(v)} className={`px-3 py-1 text-sm rounded-md transition ${view === v ? 'bg-cyan-600' : 'hover:bg-gray-600'}`}>
                          {v === 'daily' ? 'يومي' : v === 'monthly' ? 'شهري' : 'سنوي'}
                      </button>
                  ))}
              </div>
              <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  className="p-1.5 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <p className="mr-auto text-gray-300">عرض تقرير: <span className="font-bold">{getFilterDateLabel()}</span></p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-4 flex-shrink-0">
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-400">صافي الإيرادات (بعد المرتجعات)</p>
                  <p className="text-2xl font-bold text-cyan-400">{formatCurrency(reportSummary.totalRevenue)}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-400">إجمالي المعاملات</p>
                  <p className="text-2xl font-bold text-cyan-400">{reportSummary.totalTransactions}</p>
              </div>
          </div>

          {/* Details Table */}
          <div className="flex-grow overflow-y-auto border border-gray-700 rounded-lg mb-6">
              <table className="w-full text-sm text-right">
                  <thead className="bg-gray-700 sticky top-0">
                      <tr>
                          <th className="p-3 font-semibold">المنتج</th>
                          <th className="p-3 font-semibold">الكمية الصافية</th>
                          <th className="p-3 font-semibold">الإيرادات الصافية</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                      {reportSummary.productsSold.length > 0 ? (
                        reportSummary.productsSold.map(p => (
                          <tr key={p.name} className="hover:bg-gray-700/50">
                              <td className="p-3">{p.name}</td>
                              <td className="p-3 text-center">{p.quantity}</td>
                              <td className="p-3">{formatCurrency(p.total)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="text-center p-10 text-gray-400">لا توجد بيانات مبيعات لهذه الفترة.</td>
                        </tr>
                      )}
                  </tbody>
              </table>
          </div>

          {/* Sales Export Section */}
          <div className="mt-auto pt-4 border-t border-gray-700 flex-shrink-0">
            <h3 className="text-lg font-bold mb-3">تصدير المبيعات إلى Excel</h3>
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <label htmlFor="startDate" className="block text-sm text-gray-400 mb-1">من تاريخ:</label>
                <input 
                  id="startDate" 
                  type="date" 
                  value={exportStartDate} 
                  onChange={e => setExportStartDate(e.target.value)}
                  className="p-1.5 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm text-gray-400 mb-1">إلى تاريخ:</label>
                <input 
                  id="endDate" 
                  type="date" 
                  value={exportEndDate} 
                  onChange={e => setExportEndDate(e.target.value)}
                  className="p-1.5 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <button 
                onClick={handleExportSales}
                className="px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-500 transition"
                aria-label="تصدير تقرير المبيعات المحدد إلى ملف Excel"
              >
                تصدير المبيعات
              </button>
            </div>
          </div>
          
           {/* Stock Export Section */}
          <div className="mt-6 pt-4 border-t border-gray-700 flex-shrink-0">
            <h3 className="text-lg font-bold mb-3">تصدير المخزون</h3>
            <div className="flex items-center gap-4 flex-wrap">
              <p className="text-sm text-gray-400 flex-grow">تصدير قائمة بجميع المنتجات وأرصدتها الحالية إلى ملف Excel.</p>
              <button 
                onClick={handleExportStock}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 transition"
                aria-label="تصدير رصيد المخزن الحالي إلى ملف Excel"
              >
                تصدير رصيد المخزن
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// A unified modal for adding and editing products.
interface ProductModalProps {
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit: Product | null;
}

const ProductModal: React.FC<ProductModalProps> = ({ onClose, onSave, productToEdit }) => {
  const isEditMode = !!productToEdit;
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isTaxable, setIsTaxable] = useState(false);
  const [stock, setStock] = useState('');
  
  useEffect(() => {
    if (productToEdit) {
      setId(productToEdit.id);
      setName(productToEdit.name);
      setPrice(String(productToEdit.price));
      setImageUrl(productToEdit.imageUrl);
      setIsTaxable(productToEdit.isTaxable || false);
      setStock(String(productToEdit.stock || 0));
    } else {
      // Reset form for adding a new product
      setId('');
      setName('');
      setPrice('');
      setImageUrl('');
      setIsTaxable(false);
      setStock('');
    }
  }, [productToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNumber = parseFloat(price);
    const stockNumber = parseInt(stock, 10);

    if (!id.trim() || !name.trim() || isNaN(priceNumber) || priceNumber <= 0) {
      alert('يرجى ملء جميع الحقول ببيانات صالحة.');
      return;
    }

    if (isNaN(stockNumber) || stockNumber < 0) {
        alert('يرجى إدخال كمية مخزون صالحة (رقم صحيح موجب).');
        return;
    }

    onSave({
      id: id.trim(),
      name: name.trim(),
      price: priceNumber,
      isTaxable,
      stock: stockNumber,
      imageUrl: imageUrl.trim() || 'https://storage.googleapis.com/aistudio-apps/demos/pos/placeholder.png' // default placeholder
    });
  };

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
      <div className="bg-gray-800 border border-gray-700 w-full max-w-md p-6 rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="product-modal-title" className="text-xl font-bold mb-4">{isEditMode ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="barcode" className="block text-sm font-medium text-gray-300 mb-1">الباركود (المعرف)</label>
            <input
              id="barcode"
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="مثال: 123456789012"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
              required
              aria-required="true"
              disabled={isEditMode}
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">اسم المنتج</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مياه معبأة"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              required
              aria-required="true"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">السعر</label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="10.50"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                required
                aria-required="true"
              />
            </div>
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-300 mb-1">الكمية في المخزون</label>
              <input
                id="stock"
                type="number"
                step="1"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="50"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                required
                aria-required="true"
              />
            </div>
          </div>
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-300 mb-1">رابط الصورة (اختياري)</label>
            <input
              id="imageUrl"
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            />
          </div>
          <div className="flex items-center">
            <input
              id="isTaxable"
              type="checkbox"
              checked={isTaxable}
              onChange={(e) => setIsTaxable(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="isTaxable" className="mr-2 block text-sm text-gray-300">
              خاضع للضريبة (14%)
            </label>
          </div>
          <div className="flex justify-start gap-4 pt-4">
            <button type="submit" className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-md hover:bg-cyan-500 transition">
              {isEditMode ? 'حفظ التغييرات' : 'إضافة منتج'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Import from Excel Modal
interface ImportModalProps {
  onClose: () => void;
  onImport: (newProducts: Product[]) => void;
  existingBarcodes: Set<string>;
  formatCurrency: (amount: number) => string;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport, existingBarcodes, formatCurrency }) => {
  const [validProducts, setValidProducts] = useState<Product[]>([]);
  const [errorRows, setErrorRows] = useState<{row: number, data: any, error: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
    // Reset file input to allow re-uploading the same file
    e.target.value = '';
  };

  const processFile = (fileToProcess: File) => {
    setIsProcessing(true);
    setValidProducts([]);
    setErrorRows([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const parsedProducts: Product[] = [];
        const newErrorRows: {row: number, data: any, error: string}[] = [];
        
        json.forEach((row, index) => {
          const barcode = row['الباركود']?.toString().trim();
          const name = row['اسم المنتج']?.toString().trim();
          const priceStr = row['السعر']?.toString().trim();
          const imageUrl = row['رابط الصورة']?.toString().trim();
          const isTaxableStr = row['خاضع للضريبة']?.toString().toLowerCase().trim();
          const isTaxable = ['true', 'yes', 'نعم'].includes(isTaxableStr);
          const stockStr = row['الرصيد']?.toString().trim();
          const stock = parseInt(stockStr, 10);
          const price = parseFloat(priceStr);

          if (!barcode || !name || !priceStr) {
            newErrorRows.push({ row: index + 2, data: row, error: 'الباركود، اسم المنتج، والسعر حقول مطلوبة.' });
          } else if (isNaN(price) || price <= 0) {
            newErrorRows.push({ row: index + 2, data: row, error: 'السعر يجب أن يكون رقمًا صالحًا وأكبر من صفر.' });
          } else if (stockStr && (isNaN(stock) || stock < 0)) {
            newErrorRows.push({ row: index + 2, data: row, error: 'الرصيد يجب أن يكون رقمًا موجبًا.' });
          } else if (existingBarcodes.has(barcode)) {
            newErrorRows.push({ row: index + 2, data: row, error: `الباركود مكرر وموجود بالفعل في النظام.` });
          } else {
            parsedProducts.push({
              id: barcode,
              name: name,
              price: price,
              imageUrl: imageUrl || 'https://storage.googleapis.com/aistudio-apps/demos/pos/placeholder.png',
              isTaxable: isTaxable,
              stock: stock || 0,
            });
          }
        });
        
        // Check for duplicates within the file itself
        const seenBarcodes = new Set<string>();
        const finalValidProducts: Product[] = [];
        parsedProducts.reverse().forEach(p => { // Reverse to keep the first occurrence in case of duplicates
            if (!seenBarcodes.has(p.id)) {
                seenBarcodes.add(p.id);
                finalValidProducts.unshift(p); // Add to beginning to restore original order
            } else {
                 newErrorRows.push({ row: -1, data: p, error: `الباركود ${p.id} مكرر داخل الملف نفسه.` });
            }
        });

        setValidProducts(finalValidProducts);
        setErrorRows(newErrorRows);
      } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء معالجة الملف. يرجى التأكد من أنه ملف Excel صالح.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(fileToProcess);
  };

  const handleImportClick = () => {
    onImport(validProducts);
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
      <div className="bg-gray-800 border border-gray-700 w-full max-w-4xl h-[90vh] p-6 rounded-lg shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 id="import-modal-title" className="text-xl font-bold">استيراد المنتجات من Excel</h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>
        
        <div className="mb-4 p-4 bg-gray-900/50 rounded-md space-y-3">
            <p>قم برفع ملف Excel (.xlsx) يحتوي على الأعمدة التالية: <code className="bg-gray-700 p-1 rounded text-cyan-400">الباركود</code>, <code className="bg-gray-700 p-1 rounded text-cyan-400">اسم المنتج</code>, <code className="bg-gray-700 p-1 rounded text-cyan-400">السعر</code>. يمكن إضافة أعمدة اختيارية: <code className="bg-gray-700 p-1 rounded text-cyan-400">الرصيد</code>, <code className="bg-gray-700 p-1 rounded text-cyan-400">رابط الصورة</code>, <code className="bg-gray-700 p-1 rounded text-cyan-400">خاضع للضريبة</code> (اكتب 'نعم' أو 'TRUE').</p>
            <label className="block">
                <span className="sr-only">اختر ملف</span>
                <input type="file" onChange={handleFileChange} accept=".xlsx, .xls" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer" />
            </label>
        </div>
        
        {isProcessing && <p className="text-center animate-pulse">جاري المعالجة...</p>}

        {(validProducts.length > 0 || errorRows.length > 0) && (
          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
            <div className="flex flex-col overflow-hidden">
              <h3 className="font-bold mb-2 text-green-400">منتجات صالحة للاستيراد ({validProducts.length})</h3>
              <div className="flex-grow overflow-y-auto border border-gray-700 rounded-lg p-2 space-y-2">
                {/* FIX: Use formatCurrency passed in through props. */}
                {validProducts.map(p => <div key={p.id} className="bg-gray-700 p-2 rounded text-sm"><strong>{p.name}</strong> ({p.id}) - {formatCurrency(p.price)} | الرصيد: {p.stock} {p.isTaxable && <span className="text-xs bg-cyan-800 px-1 rounded">ض</span>}</div>)}
              </div>
            </div>
            <div className="flex flex-col overflow-hidden">
              <h3 className="font-bold mb-2 text-red-400">صفوف بها أخطاء ({errorRows.length})</h3>
               <div className="flex-grow overflow-y-auto border border-gray-700 rounded-lg p-2 space-y-2">
                {errorRows.map((e, i) => <div key={i} className="bg-red-900/50 p-2 rounded text-sm"><strong>{e.row !== -1 ? `صف ${e.row}:` : `منتج مكرر:`}</strong> {e.error} <pre className="text-xs text-gray-400 mt-1">{JSON.stringify(e.data)}</pre></div>)}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-start gap-4 pt-4 mt-auto">
            <button onClick={handleImportClick} disabled={validProducts.length === 0 || isProcessing} className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-md hover:bg-cyan-500 transition disabled:bg-gray-500 disabled:cursor-not-allowed">
              استيراد ({validProducts.length}) منتج
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition">
              إغلاق
            </button>
        </div>
      </div>
    </div>
  );
};

// Checkout Modal
interface CheckoutModalProps {
  onClose: () => void;
  onConfirm: (amountReceived: number) => void;
  total: number;
  formatCurrency: (amount: number) => string;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose, onConfirm, total, formatCurrency }) => {
  const [amountReceived, setAmountReceived] = useState('');
  const amountInputRef = useRef<HTMLInputElement>(null);

  const amountReceivedNum = parseFloat(amountReceived) || 0;
  const change = amountReceivedNum - total;
  const canConfirm = amountReceivedNum >= total;

  useEffect(() => {
    // Auto-focus the input when the modal opens
    amountInputRef.current?.focus();
  }, []);

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm(amountReceivedNum);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title">
      <div className="bg-gray-800 border border-gray-700 w-full max-w-md p-6 rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="checkout-modal-title" className="text-xl font-bold mb-4">إتمام البيع</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-lg p-3 bg-gray-700 rounded-md">
            <span className="font-medium text-gray-300">المبلغ الإجمالي:</span>
            <span className="font-bold text-2xl text-cyan-400">{formatCurrency(total)}</span>
          </div>
          <div>
            <label htmlFor="amountReceived" className="block text-sm font-medium text-gray-300 mb-1">المبلغ المستلم من العميل</label>
            <input
              ref={amountInputRef}
              id="amountReceived"
              type="number"
              step="0.01"
              min="0"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="أدخل المبلغ هنا..."
              className="w-full p-3 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition text-center text-xl"
              required
              aria-required="true"
            />
          </div>
          {amountReceived && (
            <div className={`flex justify-between items-center text-lg p-3 rounded-md ${change >= 0 ? 'bg-green-800/50' : 'bg-red-800/50'}`}>
              <span className="font-medium">{change >= 0 ? 'الباقي للعميل:' : 'المبلغ المتبقي:'}</span>
              <span className="font-bold text-2xl">{formatCurrency(Math.abs(change))}</span>
            </div>
          )}
        </div>
        <div className="flex justify-start gap-4 pt-6 mt-2">
          <button onClick={handleConfirm} disabled={!canConfirm} className="flex-1 px-4 py-3 bg-cyan-600 text-white font-bold rounded-md hover:bg-cyan-500 transition disabled:bg-gray-500 disabled:cursor-not-allowed">
            تأكيد البيع
          </button>
          <button type="button" onClick={onClose} className="px-4 py-3 bg-gray-600 rounded-md hover:bg-gray-500 transition">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

// Purchase Invoice Modal
interface PurchaseInvoiceModalProps {
  onClose: () => void;
  onConfirm: (itemsToUpdate: Map<string, number>) => void;
  products: Product[];
}

const PurchaseInvoiceModal: React.FC<PurchaseInvoiceModalProps> = ({ onClose, onConfirm, products }) => {
  const [search, setSearch] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<Map<string, { product: Product, quantity: number }>>(new Map());

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return [];
    const lowercasedSearch = search.toLowerCase();
    return products.filter(p => 
      !invoiceItems.has(p.id) &&
      (p.name.toLowerCase().includes(lowercasedSearch) || p.id.toLowerCase().includes(lowercasedSearch))
    ).slice(0, 10); // Limit results for performance
  }, [search, products, invoiceItems]);

  const handleAddProduct = (product: Product) => {
    setInvoiceItems(prev => {
      const newItems = new Map(prev);
      newItems.set(product.id, { product, quantity: 1 });
      return newItems;
    });
    setSearch(''); // Clear search after adding
  };

  const handleUpdateQuantity = (productId: string, quantityStr: string) => {
    const quantity = parseInt(quantityStr, 10);
    setInvoiceItems(prev => {
      const newItems = new Map(prev);
      const item = newItems.get(productId);
      if (item) {
        newItems.set(productId, { ...item, quantity: isNaN(quantity) || quantity < 0 ? 0 : quantity });
      }
      return newItems;
    });
  };

  const handleRemoveItem = (productId: string) => {
    setInvoiceItems(prev => {
      const newItems = new Map(prev);
      newItems.delete(productId);
      return newItems;
    });
  };

  const handleConfirm = () => {
    const itemsToUpdate = new Map<string, number>();
    for (const [id, item] of invoiceItems.entries()) {
      if (item.quantity > 0) {
        itemsToUpdate.set(id, item.quantity);
      }
    }
    if (itemsToUpdate.size > 0) {
      onConfirm(itemsToUpdate);
    }
    onClose();
  };
  
  const currentInvoiceItems = Array.from(invoiceItems.values());

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="purchase-modal-title">
      <div className="bg-gray-800 border border-gray-700 w-full max-w-4xl h-[90vh] p-6 rounded-lg shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 id="purchase-modal-title" className="text-xl font-bold">فاتورة مشتريات جديدة</h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 flex-grow overflow-hidden">
          {/* Left side: Search and add */}
          <div className="w-full md:w-1/3 flex flex-col">
            <label htmlFor="productSearch" className="block text-sm font-medium text-gray-300 mb-1">ابحث عن منتج (بالاسم أو الباركود)</label>
            <input
              id="productSearch"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث هنا..."
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
            {filteredProducts.length > 0 && (
              <div className="mt-2 border border-gray-600 rounded-md overflow-y-auto flex-grow">
                {filteredProducts.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => handleAddProduct(p)}
                    className="w-full text-right p-2 hover:bg-gray-700 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.id}</p>
                    </div>
                    <span className="text-xs text-gray-400">الرصيد: {p.stock}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right side: Invoice items */}
          <div className="w-full md:w-2/3 flex flex-col">
            <h3 className="font-bold mb-2">المنتجات في الفاتورة ({currentInvoiceItems.length})</h3>
            <div className="flex-grow overflow-y-auto border border-gray-700 rounded-lg">
               <table className="w-full text-sm text-right">
                  <thead className="bg-gray-700 sticky top-0">
                      <tr>
                          <th className="p-2 font-semibold">المنتج</th>
                          <th className="p-2 font-semibold w-24">الكمية المستلمة</th>
                          <th className="p-2 font-semibold w-16">إجراء</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                      {currentInvoiceItems.length > 0 ? (
                        currentInvoiceItems.map(({ product, quantity }) => (
                          <tr key={product.id} className="hover:bg-gray-700/50">
                              <td className="p-2">
                                <p className="font-semibold">{product.name}</p>
                                <p className="text-xs text-gray-400">الرصيد الحالي: {product.stock}</p>
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={quantity}
                                  min="0"
                                  step="1"
                                  onChange={e => handleUpdateQuantity(product.id, e.target.value)}
                                  className="w-20 p-1 bg-gray-900 border border-gray-600 rounded-md text-center"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  onClick={() => handleRemoveItem(product.id)}
                                  className="text-red-400 hover:text-red-300"
                                  aria-label={`إزالة ${product.name}`}
                                >
                                  حذف
                                </button>
                              </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="text-center p-10 text-gray-400">لم تتم إضافة أي منتجات. ابحث وأضف منتجات لبدء الفاتورة.</td>
                        </tr>
                      )}
                  </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="flex justify-start gap-4 pt-4 mt-auto flex-shrink-0 border-t border-gray-700">
          <button onClick={handleConfirm} disabled={invoiceItems.size === 0} className="px-4 py-2 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-500 transition disabled:bg-gray-500 disabled:cursor-not-allowed">
            تأكيد وإضافة للمخزون
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

// Receipt Modal
interface ReceiptModalProps {
  transaction: Transaction;
  onClose: () => void;
  formatCurrency: (amount: number) => string;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose, formatCurrency }) => {
  const handlePrint = () => {
    window.print();
  };

  const { subtotal, tax } = useMemo(() => {
    let currentSubtotal = 0;
    let currentTax = 0;
    const TAX_RATE = 0.14;
    
    for (const item of transaction.items) {
      const itemTotal = item.price * item.quantity;
      currentSubtotal += itemTotal;
      if (item.isTaxable) {
        currentTax += itemTotal * TAX_RATE;
      }
    }
    return { subtotal: currentSubtotal, tax: currentTax };
  }, [transaction.items]);

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 receipt-container" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="receipt-modal-title">
      <div className="bg-white text-black w-full max-w-sm p-6 rounded-lg shadow-2xl receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 id="receipt-modal-title" className="text-2xl font-bold">نقطة بيع متجرك</h2>
          </div>
          <p className="text-xs text-gray-500 mt-2">فاتورة ضريبية مبسطة</p>
        </div>
        
        <div className="text-xs text-gray-600 space-y-1 mb-4">
            <p><strong>معرف العملية:</strong> {transaction.id}</p>
            <p><strong>التاريخ:</strong> {new Date(transaction.date).toLocaleString('ar-EG')}</p>
        </div>

        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b-2 border-dashed border-gray-400">
              <th className="text-right font-semibold p-1">الصنف</th>
              <th className="text-center font-semibold p-1">الكمية</th>
              <th className="text-left font-semibold p-1">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items.map(item => (
              <tr key={item.id} className="border-b border-dashed border-gray-300">
                <td className="p-1">
                  {item.name}
                  <div className="text-xs text-gray-500">{formatCurrency(item.price)} للوحدة</div>
                </td>
                <td className="p-1 text-center">{item.quantity}</td>
                <td className="p-1 text-left">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="space-y-1 text-sm border-t-2 border-dashed border-gray-400 pt-3">
          <div className="flex justify-between"><span>المجموع الفرعي:</span> <span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between"><span>إجمالي الضريبة (14%):</span> <span>{formatCurrency(tax)}</span></div>
          <div className="flex justify-between font-bold text-lg"><span>الإجمالي:</span> <span>{formatCurrency(transaction.total)}</span></div>
          <div className="flex justify-between"><span>المبلغ المستلم:</span> <span>{formatCurrency(transaction.amountReceived ?? 0)}</span></div>
          <div className="flex justify-between"><span>الباقي:</span> <span>{formatCurrency(transaction.changeDue ?? 0)}</span></div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">شكرًا لتسوقكم!</p>

        <div className="flex justify-center gap-4 pt-6 mt-4 border-t border-gray-300 no-print">
          <button onClick={handlePrint} className="px-6 py-2 bg-cyan-600 text-white font-bold rounded-md hover:bg-cyan-500 transition">
            طباعة الفاتورة
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

// Confirmation Modal for Deletion
interface ConfirmationModalProps {
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ onClose, onConfirm, title, message }) => {
  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 w-full max-w-md p-6 rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-red-400">{title}</h2>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex justify-start gap-4">
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-500 transition">
            تأكيد الحذف
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

// Change Password Modal
interface ChangePasswordModalProps {
  onClose: () => void;
  onSave: (userId: number, newPassword_DO_NOT_STORE_IN_PRODUCTION: string, currentPassword_DO_NOT_STORE_IN_PRODUCTION?: string) => void;
  user: User;
  mode: 'self' | 'admin';
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, onSave, user, mode }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور الجديدتان غير متطابقتين.');
      return;
    }
    if (newPassword.length < 6) {
      setError('يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل.');
      return;
    }

    if (mode === 'self') {
      onSave(user.id, newPassword, currentPassword);
    } else {
      onSave(user.id, newPassword);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 w-full max-w-md p-6 rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">
          {mode === 'self' ? 'تغيير كلمة المرور' : `تغيير كلمة مرور ${user.username}`}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'self' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">كلمة المرور الحالية</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">كلمة المرور الجديدة</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">تأكيد كلمة المرور الجديدة</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex justify-start gap-4 pt-4">
            <button type="submit" className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-md hover:bg-cyan-500 transition">
              حفظ
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Returns Modal
interface ReturnsModalProps {
  onClose: () => void;
  transactions: Transaction[];
  onConfirmReturn: (originalTx: Transaction, itemsToReturn: Map<string, number>, totalRefund: number) => void;
  formatCurrency: (amount: number) => string;
}

const ReturnsModal: React.FC<ReturnsModalProps> = ({ onClose, transactions, onConfirmReturn, formatCurrency }) => {
  const [searchId, setSearchId] = useState('');
  const [foundTx, setFoundTx] = useState<Transaction | null>(null);
  const [itemsToReturn, setItemsToReturn] = useState<Map<string, number>>(new Map());
  const [error, setError] = useState('');

  const handleSearch = () => {
    setError('');
    const tx = transactions.find(t => t.id === searchId.trim() && t.type === 'sale');
    if (tx) {
      setFoundTx(tx);
      setItemsToReturn(new Map()); // Reset on new search
    } else {
      setFoundTx(null);
      setError('لم يتم العثور على فاتورة بيع بهذا المعرف.');
    }
  };

  const handleQuantityChange = (itemId: string, maxQuantity: number, returnedQuantity: number, value: string) => {
    const availableToReturn = maxQuantity - returnedQuantity;
    let quantity = parseInt(value, 10);
    if (isNaN(quantity) || quantity < 0) {
      quantity = 0;
    }
    if (quantity > availableToReturn) {
      quantity = availableToReturn;
    }

    setItemsToReturn(prev => {
      const newMap = new Map(prev);
      if (quantity > 0) {
        newMap.set(itemId, quantity);
      } else {
        newMap.delete(itemId);
      }
      return newMap;
    });
  };

  const { totalRefund } = useMemo(() => {
    if (!foundTx) return { totalRefund: 0 };
    let refund = 0;
    const TAX_RATE = 0.14;
    for (const [itemId, quantity] of itemsToReturn.entries()) {
      const item = foundTx.items.find(i => i.id === itemId);
      if (item) {
        const itemTotal = item.price * quantity;
        refund += itemTotal;
        if (item.isTaxable) {
          refund += itemTotal * TAX_RATE;
        }
      }
    }
    return { totalRefund: refund };
  }, [itemsToReturn, foundTx]);

  const handleConfirm = () => {
    if (foundTx && itemsToReturn.size > 0) {
      onConfirmReturn(foundTx, itemsToReturn, totalRefund);
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 w-full max-w-3xl h-[90vh] p-6 rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">معالجة المرتجعات</h2>
        
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            placeholder="أدخل معرف العملية للبحث..."
            className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md"
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="px-4 py-2 bg-orange-600 rounded-md hover:bg-orange-500">
            بحث
          </button>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}
        
        <div className="flex-grow overflow-y-auto border-t border-gray-700 pt-4">
          {foundTx ? (
            <div>
              <h3 className="font-bold mb-2">تفاصيل الفاتورة: <span className="text-orange-400">{foundTx.id}</span></h3>
              <p className="text-sm text-gray-400 mb-4">تاريخ: {new Date(foundTx.date).toLocaleString('ar-EG')}</p>
              
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="p-2">المنتج</th>
                    <th className="p-2">الكمية المشتراة</th>
                    <th className="p-2">الكمية المرتجعة سابقًا</th>
                    <th className="p-2">الكمية المراد إرجاعها</th>
                  </tr>
                </thead>
                <tbody>
                  {foundTx.items.map(item => {
                    const returnedQty = item.returned || 0;
                    const availableToReturn = item.quantity - returnedQty;
                    return (
                      <tr key={item.id} className={availableToReturn <= 0 ? 'opacity-50' : ''}>
                        <td className="p-2">{item.name}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-center">{returnedQty}</td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max={availableToReturn}
                            value={itemsToReturn.get(item.id) || 0}
                            onChange={e => handleQuantityChange(item.id, item.quantity, returnedQty, e.target.value)}
                            disabled={availableToReturn <= 0}
                            className="w-20 p-1 bg-gray-900 border border-gray-600 rounded-md text-center"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center mt-8">ابحث عن فاتورة لبدء عملية الإرجاع.</p>
          )}
        </div>

        {foundTx && (
          <div className="mt-auto pt-4 border-t border-gray-600">
            <div className="flex justify-between items-center text-lg p-3 bg-gray-700 rounded-md mb-4">
              <span className="font-medium">المبلغ المسترد:</span>
              <span className="font-bold text-2xl text-orange-400">{formatCurrency(totalRefund)}</span>
            </div>
            <div className="flex justify-start gap-4">
              <button onClick={handleConfirm} disabled={itemsToReturn.size === 0} className="px-4 py-2 bg-orange-600 text-white font-bold rounded-md hover:bg-orange-500 disabled:bg-gray-500">
                تأكيد الإرجاع
              </button>
              <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('pos-users');
    try {
      if (savedUsers) {
        return JSON.parse(savedUsers);
      }
    } catch (e) {
      console.error("Failed to parse users from localStorage", e);
    }
    return [
      { id: 1, username: 'admin', password_DO_NOT_STORE_IN_PRODUCTION: 'admin123', role: 'admin' },
      { id: 2, username: 'user', password_DO_NOT_STORE_IN_PRODUCTION: 'user123', role: 'user', permissions: defaultPermissions },
    ];
  });

  useEffect(() => {
    localStorage.setItem('pos-users', JSON.stringify(users));
  }, [users]);
  
  const [isUsersManagementModalOpen, setIsUsersManagementModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [userToChangePassword, setUserToChangePassword] = useState<{ user: User, mode: 'self' | 'admin' } | null>(null);
  const [isReturnsModalOpen, setIsReturnsModalOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const savedProducts = localStorage.getItem('pos-products');
      return savedProducts ? JSON.parse(savedProducts) : mockProducts;
    } catch (error) {
      console.error("Failed to load products from localStorage:", error);
      return mockProducts;
    }
  });

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [receiptToShow, setReceiptToShow] = useState<Transaction | null>(null);
  
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const savedTransactions = localStorage.getItem('pos-transactions');
      return savedTransactions ? JSON.parse(savedTransactions) : [];
    } catch (error) {
      console.error("Failed to load transactions from localStorage:", error);
      return [];
    }
  });

  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Derived permissions for easier access
  const permissions = useMemo(() => {
    // FIX: Ensure the default permissions object includes `canEditProducts` to match the expected type for all cases.
    const defaultFalsePermissions = { canManageProducts: false, canViewReports: false, canManagePurchases: false, canProcessReturns: false, canEditProducts: false };
    if (!currentUser) return defaultFalsePermissions;
    if (currentUser.role === 'admin') {
      return { canManageProducts: true, canViewReports: true, canManagePurchases: true, canProcessReturns: true, canEditProducts: true };
    }
    const userPerms = currentUser.permissions || defaultPermissions;
    return { ...userPerms, canEditProducts: userPerms.canManageProducts };
  }, [currentUser]);

  // Handle Login/Logout
  const handleLogin = (username: string, password_DO_NOT_STORE_IN_PRODUCTION: string) => {
    const foundUser = users.find(
      u => u.username === username && u.password_DO_NOT_STORE_IN_PRODUCTION === password_DO_NOT_STORE_IN_PRODUCTION
    );
    if (foundUser) {
      setCurrentUser(foundUser);
      setLoginError(null);
    } else {
      setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    // Optionally clear cart on logout
    setCart(new Map());
  };
  
  // Handlers for User Management
  const handleAddUser = (user: Pick<User, 'username' | 'password_DO_NOT_STORE_IN_PRODUCTION'>) => {
    setUsers(prev => [
      ...prev,
      {
        ...user,
        id: Date.now(),
        role: 'user',
        permissions: defaultPermissions
      }
    ]);
  };

  const requestDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const executeDeleteUser = () => {
    if (!userToDelete) return;
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
    setUserToDelete(null);
  };

  const handleSavePermissions = (userId: number, newPermissions: Permissions) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, permissions: newPermissions } : u)));
  };

  const openChangePasswordModal = (user: User, mode: 'self' | 'admin') => {
    setUserToChangePassword({ user, mode });
    setIsChangePasswordModalOpen(true);
  };

  const handleSavePassword = (userId: number, newPassword_DO_NOT_STORE_IN_PRODUCTION: string, currentPassword_DO_NOT_STORE_IN_PRODUCTION?: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) {
        alert('المستخدم غير موجود.');
        return;
    }

    // If changing own password, verify current password
    if (currentPassword_DO_NOT_STORE_IN_PRODUCTION !== undefined) {
      if (userToUpdate.password_DO_NOT_STORE_IN_PRODUCTION !== currentPassword_DO_NOT_STORE_IN_PRODUCTION) {
        alert('كلمة المرور الحالية غير صحيحة.');
        return; // Use alert for direct feedback in modal
      }
    }
    
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password_DO_NOT_STORE_IN_PRODUCTION: newPassword_DO_NOT_STORE_IN_PRODUCTION } : u));
    alert('تم تغيير كلمة المرور بنجاح.');
    setIsChangePasswordModalOpen(false);
    setUserToChangePassword(null);
  };
  
  // Save products to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('pos-products', JSON.stringify(products));
    } catch (error) {
      console.error("Failed to save products to localStorage:", error);
    }
  }, [products]);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('pos-transactions', JSON.stringify(transactions));
    } catch (error) {
      console.error("Failed to save transactions to localStorage:", error);
    }
  }, [transactions]);

  const productMap = useMemo(() => 
    new Map(products.map(p => [p.id, p])),
  [products]);
  
  const existingBarcodesSet = useMemo(() => new Set(products.map(p => p.id)), [products]);

  const cartItems = useMemo(() => Array.from(cart.values()), [cart]);
  
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
  }, []);

  const TAX_RATE = 0.14;
  const { subtotal, tax, total } = useMemo(() => {
    let currentSubtotal = 0;
    let currentTax = 0;
    
    for (const item of cartItems) {
      const itemTotal = item.price * item.quantity;
      currentSubtotal += itemTotal;
      if (item.isTaxable) {
        currentTax += itemTotal * TAX_RATE;
      }
    }

    const currentTotal = currentSubtotal + currentTax;
    return { subtotal: currentSubtotal, tax: currentTax, total: currentTotal };
  }, [cartItems]);

  const fetchSuggestion = useCallback(async () => {
    if (cartItems.length === 0) {
      setSuggestion(null);
      return;
    }
    setIsSuggestionLoading(true);
    const newSuggestion = await getProductSuggestion(cartItems);
    setSuggestion(newSuggestion);
    setIsSuggestionLoading(false);
  }, [cartItems]);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuggestion();
    }, 1000); // Debounce API calls

    return () => {
      clearTimeout(handler);
    };
  }, [fetchSuggestion]);

  const addToCart = useCallback((productToAdd: Product) => {
    const product = productMap.get(productToAdd.id);
    if (!product || product.stock <= 0) return;

    setCart(prevCart => {
      const newCart = new Map(prevCart);
      const existingItem = newCart.get(product.id);
      const quantityInCart = existingItem?.quantity || 0;

      if (quantityInCart >= product.stock) {
        alert(`لا يمكن إضافة المزيد، الكمية المتاحة في المخزون هي ${product.stock} فقط.`);
        return prevCart;
      }

      if (existingItem) {
        newCart.set(product.id, { ...existingItem, quantity: quantityInCart + 1 });
      } else {
        newCart.set(product.id, { ...product, quantity: 1 });
      }
      return newCart;
    });
  }, [productMap]);
  
  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    const product = productMap.get(productId);
    if (!product) return;

    if (newQuantity > product.stock) {
      alert(`الكمية المطلوبة (${newQuantity}) أكبر من المتاح في المخزون (${product.stock}).`);
      return;
    }

    setCart(prevCart => {
      const newCart = new Map(prevCart);
      if (newQuantity <= 0) {
        newCart.delete(productId);
      } else {
        const item = newCart.get(productId);
        if (item) {
          newCart.set(productId, { ...item, quantity: newQuantity });
        }
      }
      return newCart;
    });
  }, [productMap]);

  const handleInitiateCheckout = () => {
    if (cartItems.length === 0) return;
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmSale = useCallback((amountReceived: number) => {
    const changeDue = amountReceived - total;
    // Deduct stock
    setProducts(currentProducts => {
      const newProductsMap = new Map(currentProducts.map(p => [p.id, {...p}]));
      for (const item of cartItems) {
        const product = newProductsMap.get(item.id);
        if (product) {
          product.stock -= item.quantity;
        }
      }
      return Array.from(newProductsMap.values());
    });
    
    // Create and save transaction
    const newTransaction: Transaction = {
      id: `txn-${Date.now()}`,
      date: Date.now(),
      type: 'sale',
      items: cartItems,
      total: total,
      amountReceived: amountReceived,
      changeDue: changeDue,
    };
    setTransactions(prev => [...prev, newTransaction]);

    // UI feedback
    setIsCheckoutModalOpen(false);
    setReceiptToShow(newTransaction);
    setCart(new Map());
    setSuggestion(null);
  }, [cartItems, total]);

  const handleConfirmReturn = useCallback((originalTx: Transaction, itemsToReturn: Map<string, number>, totalRefund: number) => {
    // 1. Update stock (increase)
    setProducts(currentProducts => {
      const newProductsMap = new Map(currentProducts.map(p => [p.id, { ...p }]));
      for (const [itemId, quantity] of itemsToReturn.entries()) {
        const product = newProductsMap.get(itemId);
        if (product) {
          product.stock += quantity;
        }
      }
      return Array.from(newProductsMap.values());
    });
    
    // 2. Create new return transaction
    const returnedItems: CartItem[] = [];
    for (const [itemId, quantity] of itemsToReturn.entries()) {
      const originalItem = originalTx.items.find(i => i.id === itemId);
      if (originalItem) {
        returnedItems.push({ ...originalItem, quantity });
      }
    }
    
    const returnTransaction: Transaction = {
      id: `ret-${Date.now()}`,
      date: Date.now(),
      type: 'return',
      originalTransactionId: originalTx.id,
      items: returnedItems,
      total: -totalRefund, // Store as a negative value
    };
    
    // 3. Update original transaction to track returned items
    const updatedTransactions = transactions.map(tx => {
      if (tx.id === originalTx.id) {
        const newItems = tx.items.map(item => {
          if (itemsToReturn.has(item.id)) {
            const returnedSoFar = item.returned || 0;
            const newReturnedAmount = itemsToReturn.get(item.id) || 0;
            return { ...item, returned: returnedSoFar + newReturnedAmount };
          }
          return item;
        });
        return { ...tx, items: newItems };
      }
      return tx;
    });

    setTransactions([...updatedTransactions, returnTransaction]);
    alert(`تم إرجاع مبلغ ${formatCurrency(totalRefund)} بنجاح.`);

  }, [transactions, formatCurrency]);


  const handleOpenAddModal = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };
  
  const handleOpenEditModal = (product: Product) => {
    setProductToEdit(product);
    setIsProductModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsProductModalOpen(false);
    setProductToEdit(null);
  };

  const handleSaveProduct = useCallback((product: Product) => {
    if (productToEdit) { // Update existing product
      setProducts(prevProducts =>
        prevProducts.map(p => p.id === product.id ? product : p)
      );
    } else { // Add new product
      if (productMap.has(product.id)) {
        alert(`منتج بالباركود ${product.id} موجود بالفعل.`);
        return;
      }
      setProducts(prevProducts => [product, ...prevProducts]);
    }
    handleCloseModal();
  }, [productMap, productToEdit]);
  
  const handleImportProducts = useCallback((newProducts: Product[]) => {
    // The modal already filters for existing products, but as a safeguard:
    const currentProductMap = new Map(products.map(p => [p.id, p]));
    const uniqueNewProducts = newProducts.filter(p => !currentProductMap.has(p.id));
    setProducts(prev => [...uniqueNewProducts, ...prev]);
  }, [products]);

  const handleConfirmPurchase = useCallback((itemsToUpdate: Map<string, number>) => {
    setProducts(currentProducts => {
      const newProductsMap = new Map(currentProducts.map(p => [p.id, {...p}]));
      for (const [id, quantity] of itemsToUpdate.entries()) {
        const product = newProductsMap.get(id);
        if (product) {
          product.stock += quantity;
        }
      }
      return Array.from(newProductsMap.values());
    });
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowercasedQuery) || 
      p.id.toLowerCase().includes(lowercasedQuery)
    );
  }, [products, searchQuery]);

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col p-4 font-mono">
      <Header 
        currentUser={currentUser}
        permissions={permissions}
        onAddProductClick={() => permissions.canManageProducts && handleOpenAddModal()} 
        onReportsClick={() => permissions.canViewReports && setIsReportsModalOpen(true)}
        onImportClick={() => permissions.canManageProducts && setIsImportModalOpen(true)}
        onPurchaseInvoiceClick={() => permissions.canManagePurchases && setIsPurchaseModalOpen(true)}
        onReturnsClick={() => permissions.canProcessReturns && setIsReturnsModalOpen(true)}
        onUsersManagementClick={() => setIsUsersManagementModalOpen(true)}
        onChangePasswordClick={() => openChangePasswordModal(currentUser, 'self')}
        onLogout={handleLogout}
      />
      <main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
        <section className="md:col-span-2 flex flex-col overflow-hidden">
          <SearchBar 
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
          <div className="flex-grow overflow-y-auto">
            <ProductCatalog 
              products={filteredProducts} 
              onAddToCart={addToCart} 
              onEditProduct={handleOpenEditModal}
              formatCurrency={formatCurrency}
              canEditProducts={permissions.canEditProducts}
            />
          </div>
        </section>

        <section className="md:col-span-1 flex flex-col overflow-hidden">
           <Cart 
            items={cartItems} 
            onUpdateQuantity={updateQuantity} 
            onCheckout={handleInitiateCheckout} 
            formatCurrency={formatCurrency}
            subtotal={subtotal}
            tax={tax}
            total={total}
           />
           <SuggestionBox suggestion={suggestion} isLoading={isSuggestionLoading} />
        </section>
      </main>

      {receiptToShow && (
        <ReceiptModal 
          transaction={receiptToShow}
          onClose={() => setReceiptToShow(null)}
          formatCurrency={formatCurrency}
        />
      )}

      {isProductModalOpen && (
        <ProductModal 
          onClose={handleCloseModal} 
          onSave={handleSaveProduct}
          productToEdit={productToEdit}
        />
      )}

      {isReportsModalOpen && (
        <ReportsModal 
          onClose={() => setIsReportsModalOpen(false)}
          transactions={transactions}
          products={products}
          formatCurrency={formatCurrency}
        />
      )}
      
      {isImportModalOpen && (
        <ImportModal
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportProducts}
          existingBarcodes={existingBarcodesSet}
          formatCurrency={formatCurrency}
        />
      )}

      {isCheckoutModalOpen && (
        <CheckoutModal
          onClose={() => setIsCheckoutModalOpen(false)}
          onConfirm={handleConfirmSale}
          total={total}
          formatCurrency={formatCurrency}
        />
      )}

      {isPurchaseModalOpen && (
        <PurchaseInvoiceModal
          onClose={() => setIsPurchaseModalOpen(false)}
          onConfirm={handleConfirmPurchase}
          products={products}
        />
      )}

      {isReturnsModalOpen && (
        <ReturnsModal
          onClose={() => setIsReturnsModalOpen(false)}
          transactions={transactions}
          onConfirmReturn={handleConfirmReturn}
          formatCurrency={formatCurrency}
        />
      )}

      {isUsersManagementModalOpen && currentUser.role === 'admin' && (
        <UsersManagementModal
          onClose={() => setIsUsersManagementModalOpen(false)}
          users={users}
          onAddUser={handleAddUser}
          onDeleteUser={requestDeleteUser}
          onSavePermissions={handleSavePermissions}
          onChangePassword={(user) => openChangePasswordModal(user, 'admin')}
          currentUserId={currentUser?.id}
        />
      )}

      {userToDelete && (
        <ConfirmationModal
          onClose={() => setUserToDelete(null)}
          onConfirm={executeDeleteUser}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من أنك تريد حذف المستخدم "${userToDelete.username}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        />
      )}

      {isChangePasswordModalOpen && userToChangePassword && (
        <ChangePasswordModal
          onClose={() => {
            setIsChangePasswordModalOpen(false);
            setUserToChangePassword(null);
          }}
          onSave={handleSavePassword}
          user={userToChangePassword.user}
          mode={userToChangePassword.mode}
        />
      )}
    </div>
  );
};

export default App;
