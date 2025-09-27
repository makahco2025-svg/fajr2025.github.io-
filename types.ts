/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


export interface Product {
  id: string; // Barcode
  name: string;
  price: number;
  imageUrl: string;
  isTaxable?: boolean;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  date: number; // Timestamp
  type: 'sale' | 'return'; // Distinguish sales from returns
  originalTransactionId?: string; // Link return to original sale
  items: (CartItem & { returned?: number })[]; // Track returned quantity per item
  total: number; // For returns, this will be a negative value
  amountReceived?: number;
  changeDue?: number;
}

export interface User {
  id: number;
  username: string;
  password_DO_NOT_STORE_IN_PRODUCTION: string; // In a real app, use a hashed password
  role: 'admin' | 'user';
  permissions?: Permissions; // Permissions are now per-user
}

export interface Permissions {
  canManageProducts: boolean;
  canViewReports: boolean;
  canManagePurchases: boolean;
  canProcessReturns: boolean; // New permission for returns
}


// Fix: Add Rect and HistoryStep interfaces to resolve import errors.
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HistoryStep {
  imageSrc: string;
  originalRect?: Rect;
}