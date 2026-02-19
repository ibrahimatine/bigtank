import { z } from 'zod';
import { SENEGAL_REGIONS } from '@bigtank/shared-utils';

const regionValues = SENEGAL_REGIONS as unknown as [string, ...string[]];

export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email ou telephone requis'),
  password: z.string().min(6, 'Minimum 6 caracteres'),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Minimum 2 caracteres').max(100),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    password: z.string().min(8, 'Minimum 8 caracteres'),
    confirmPassword: z.string(),
    city: z.string().optional().or(z.literal('')),
    region: z.enum(regionValues).optional().or(z.literal('')),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })
  .refine((d) => d.email || d.phone, {
    message: 'Email ou telephone requis',
    path: ['email'],
  });

export const listingSchema = z.object({
  title: z.string().min(5, 'Minimum 5 caracteres').max(120),
  description: z.string().min(10, 'Minimum 10 caracteres').max(2000),
  brand: z.string().min(1, 'Marque requise'),
  model: z.string().optional().or(z.literal('')),
  sizeEu: z.coerce.number().min(38).max(55),
  sizeUs: z.coerce.number().min(5).max(20).optional().or(z.literal('')),
  sizeUk: z.coerce.number().min(4).max(18).optional().or(z.literal('')),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']),
  color: z.string().min(1, 'Couleur requise'),
  priceXof: z.coerce.number().min(1000, 'Minimum 1 000 FCFA').max(500000),
  locationCity: z.string().min(1, 'Ville requise'),
  locationRegion: z.enum(regionValues, { errorMap: () => ({ message: 'Region requise' }) }),
});

export const profileSchema = z.object({
  name: z.string().min(2, 'Minimum 2 caracteres'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  region: z.enum(regionValues).optional().or(z.literal('')),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ListingValues = z.infer<typeof listingSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
