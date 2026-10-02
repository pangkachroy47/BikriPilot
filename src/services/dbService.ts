import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Customer, Order, OrderStatus, Product, Shop, AIParsingLog } from '../types';

export class DatabaseService {
  /**
   * Fetch all shops owned by the user
   */
  static async fetchShops(ownerId: string): Promise<Shop[] | null> {
    if (!supabase || !isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase fetchShops error:', error.message);
      return null;
    }
    return data as Shop[];
  }

  /**
   * Insert new shop into Supabase
   */
  static async createShop(shop: Partial<Shop>): Promise<Shop | null> {
    if (!supabase || !isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('shops')
      .insert(shop)
      .select()
      .single();

    if (error) {
      console.warn('Supabase createShop error:', error.message);
      return null;
    }
    return data as Shop;
  }

  /**
   * Update shop record
   */
  static async updateShop(shopId: string, patch: Partial<Shop>): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    const { error } = await supabase
      .from('shops')
      .update(patch)
      .eq('id', shopId);

    if (error) {
      console.warn('Supabase updateShop error:', error.message);
      return false;
    }
    return true;
  }

  /**
   * Fetch all products belonging to a shop
   */
  static async fetchProducts(shopId: string): Promise<Product[] | null> {
    if (!supabase || !isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchProducts error:', error.message);
      return null;
    }
    return data as Product[];
  }

  /**
   * Insert product
   */
  static async createProduct(product: Partial<Product>): Promise<Product | null> {
    if (!supabase || !isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) {
      console.warn('Supabase createProduct error:', error.message);
      return null;
    }
    return data as Product;
  }

  /**
   * Update product
   */
  static async updateProduct(productId: string, patch: Partial<Product>): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    const { error } = await supabase
      .from('products')
      .update(patch)
      .eq('id', productId);

    return !error;
  }

  /**
   * Delete product
   */
  static async deleteProduct(productId: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    return !error;
  }

  /**
   * Fetch customers of a shop
   */
  static async fetchCustomers(shopId: string): Promise<Customer[] | null> {
    if (!supabase || !isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('shop_id', shopId)
      .order('total_orders', { ascending: false });

    if (error) {
      console.warn('Supabase fetchCustomers error:', error.message);
      return null;
    }
    return data as Customer[];
  }

  /**
   * Fetch orders of a shop
   */
  static async fetchOrders(shopId: string): Promise<Order[] | null> {
    if (!supabase || !isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchOrders error:', error.message);
      return null;
    }
    return data as Order[];
  }

  /**
   * Insert new order
   */
  static async createOrder(order: Partial<Order>): Promise<Order | null> {
    if (!supabase || !isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();

    if (error) {
      console.warn('Supabase createOrder error:', error.message);
      return null;
    }
    return data as Order;
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    return !error;
  }

  /**
   * Delete order
   */
  static async deleteOrder(orderId: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    return !error;
  }

  /**
   * Record AI Parse log
   */
  static async recordAILog(log: Partial<AIParsingLog>): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    const { error } = await supabase
      .from('ai_parse_logs')
      .insert(log);

    return !error;
  }
}
