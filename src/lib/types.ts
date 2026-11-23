export interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  duration: number;
  description: string;
  type: string;
  is_available: number;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  service_id: number;
  service_name: string;
  quantity: number;
  price: number;
  duration: number;
}

export interface Order {
  id: number;
  token_number: number;
  customer_name: string;
  customer_phone: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  cancel_token?: string;
}

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  servicesCompleted: number;
  topService: string | null;
}
