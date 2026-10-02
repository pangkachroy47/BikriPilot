import { z } from 'zod';

export const orderFormSchema = z.object({
  customer_name: z
    .string()
    .min(2, 'গ্রাহকের নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
  phone: z
    .string()
    .regex(/^(?:\+8801|8801|01)[3-9]\d{8}$/, 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)'),
  district: z
    .string()
    .min(2, 'জেলা নির্বাচন বা উল্লেখ করুন'),
  thana: z.string().optional().default(''),
  full_address: z
    .string()
    .min(5, 'বাড়ি, রোড ও এলাকা সহ সম্পূর্ণ ঠিকানা দিন'),
  product_name: z
    .string()
    .min(2, 'পণ্যের নাম উল্লেখ করুন'),
  variant: z.string().optional().default(''),
  quantity: z.coerce
    .number()
    .int('পূর্ণসংখ্যা দিন')
    .min(1, 'পরিমাণ কমপক্ষে ১ হতে হবে'),
  selling_price: z.coerce
    .number()
    .min(0, 'বিক্রয় মূল্য ঋণাত্মক হতে পারে না'),
  delivery_charge: z.coerce
    .number()
    .min(0, 'ডেলিভারি চার্জ ঋণাত্মক হতে পারে না')
    .default(80),
  advance_payment: z.coerce
    .number()
    .min(0, 'অগ্রিম টাকা ঋণাত্মক হতে পারে না')
    .default(0),
  payment_method: z.string().default('Cash on Delivery'),
  product_cost: z.coerce
    .number()
    .min(0, 'পণ্যের খরচ ঋণাত্মক হতে পারে না')
    .default(0),
  courier_cost: z.coerce
    .number()
    .min(0, 'কুরিয়ার খরচ ঋণাত্মক হতে পারে না')
    .default(80),
  packaging_cost: z.coerce
    .number()
    .min(0, 'প্যাকেজিং খরচ ঋণাত্মক হতে পারে না')
    .default(25),
  ad_cost: z.coerce
    .number()
    .min(0, 'বিজ্ঞাপন খরচ ঋণাত্মক হতে পারে না')
    .default(100),
  other_cost: z.coerce
    .number()
    .min(0, 'অন্যান্য খরচ ঋণাত্মক হতে পারে না')
    .default(0),
  return_courier_cost: z.coerce
    .number()
    .min(0, 'রিটার্ন খরচ ঋণাত্মক হতে পারে না')
    .default(0),
  notes: z.string().optional().default(''),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;

export const productFormSchema = z.object({
  name: z.string().min(2, 'পণ্যের নাম আবশ্যক'),
  sku: z.string().min(2, 'SKU কোড দিন'),
  variant: z.string().optional().default('Standard'),
  selling_price: z.coerce.number().min(1, 'সঠিক বিক্রয় মূল্য দিন'),
  cost_price: z.coerce.number().min(0, 'ক্রয় মূল্য দিন'),
  stock: z.coerce.number().int().min(0, 'মজুদ সংখ্যা দিন'),
  image_url: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
