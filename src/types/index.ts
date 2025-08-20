export interface User {
  id: string;
  email: string;
  role: 'admin' | 'employee';
  name: string;
  profile_picture?: string;
  password?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  stock: number;
  barcode?: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Sale {
  id: string;
  total: number;
  payment_method: 'cash' | 'ecash';
  payment_details?: {
    reference_number?: string;
    bank_name?: string;
    contact_info?: string;
  };
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  employee_id: string;
  created_at: string;
}

export interface Voucher {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  created_at: string;
}

export interface Settings {
  id: string;
  logo_url?: string;
  brand_name: string;
  primary_color: string;
  currency: string;
  currency_symbol: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  employee_id: string;
  employee_name: string;
  punch_in: string;
  punch_out?: string;
  total_hours?: number;
  date: string;
  created_at: string;
}

export interface PaymentMethod {
  cash: 'cash';
  ecash: 'ecash';
}

export type PaymentMethodType = 'cash' | 'ecash';