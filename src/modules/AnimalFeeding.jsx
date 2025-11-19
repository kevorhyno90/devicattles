import React, { useEffect, useState, useRef } from 'react'
import { exportToCSV, exportToExcel, exportToJSON, importFromCSV, importFromJSON, batchPrint } from '../lib/exportImport'

// Comprehensive Ingredient Library with Kenya Prices (KES per kg)
// Now includes ME (Metabolizable Energy, MJ/kg DM) alongside NEL
// Total: 223 ingredients from SNV library with complete nutritional profiles
// Categories: Forages (48), Energy (45), Protein (79), Fats (15), Minerals (40), Vitamins/Additives (30)
const INGREDIENTS = [
  // === FORAGES (48 items) ===
  // Growth stages: Early (high protein, digestible) → Mid → Late (more fiber, less protein)
  // Alfalfa Growth Stages
  { id: 1, name: 'Alfalfa Hay - Early Vegetative', category: 'Forages', DM: 88, CP: 21.0, NDF: 38, ADF: 28, TDN: 65, NEL: 1.51, ME: 10.5, Ca: 1.50, P: 0.28, pricePerKg: 28 },
  { id: 2, name: 'Alfalfa Hay - Mid Vegetative', category: 'Forages', DM: 88, CP: 17.0, NDF: 45, ADF: 35, TDN: 58, NEL: 1.35, ME: 9.5, Ca: 1.30, P: 0.23, pricePerKg: 24 },
  { id: 3, name: 'Alfalfa Hay - Late Vegetative', category: 'Forages', DM: 88, CP: 14.0, NDF: 52, ADF: 40, TDN: 54, NEL: 1.26, ME: 8.8, Ca: 1.15, P: 0.20, pricePerKg: 20 },
  
  // Timothy Growth Stages
  { id: 4, name: 'Timothy Hay - Early Vegetative', category: 'Forages', DM: 88, CP: 14.5, NDF: 48, ADF: 28, TDN: 64, NEL: 1.49, ME: 10.3, Ca: 0.52, P: 0.30, pricePerKg: 22 },
  { id: 5, name: 'Timothy Hay - Mid Vegetative', category: 'Forages', DM: 88, CP: 11.0, NDF: 55, ADF: 32, TDN: 60, NEL: 1.40, ME: 9.8, Ca: 0.45, P: 0.25, pricePerKg: 18 },
  { id: 6, name: 'Timothy Hay - Late Vegetative', category: 'Forages', DM: 88, CP: 8.5, NDF: 62, ADF: 38, TDN: 55, NEL: 1.28, ME: 9.0, Ca: 0.38, P: 0.22, pricePerKg: 15 },
  
  // Rhodes Grass Growth Stages
  { id: 7, name: 'Rhodes Grass Hay - Early Vegetative', category: 'Forages', DM: 88, CP: 13.5, NDF: 52, ADF: 32, TDN: 62, NEL: 1.44, ME: 10.1, Ca: 0.58, P: 0.30, pricePerKg: 20 },
  { id: 8, name: 'Rhodes Grass Hay - Mid Vegetative', category: 'Forages', DM: 88, CP: 10.0, NDF: 58, ADF: 36, TDN: 57, NEL: 1.32, ME: 9.3, Ca: 0.50, P: 0.25, pricePerKg: 16 },
  { id: 9, name: 'Rhodes Grass Hay - Late Vegetative', category: 'Forages', DM: 88, CP: 7.5, NDF: 65, ADF: 42, TDN: 52, NEL: 1.21, ME: 8.5, Ca: 0.42, P: 0.22, pricePerKg: 13 },
  
  // Napier Grass Growth Stages
  { id: 10, name: 'Napier Grass - Early Vegetative', category: 'Forages', DM: 18, CP: 14.5, NDF: 58, ADF: 35, TDN: 58, NEL: 1.35, ME: 9.5, Ca: 0.52, P: 0.32, pricePerKg: 3 },
  { id: 11, name: 'Napier Grass - Mid Vegetative', category: 'Forages', DM: 18, CP: 10.5, NDF: 65, ADF: 40, TDN: 52, NEL: 1.21, ME: 8.6, Ca: 0.45, P: 0.28, pricePerKg: 2 },
  { id: 12, name: 'Napier Grass - Late Vegetative', category: 'Forages', DM: 18, CP: 7.8, NDF: 72, ADF: 46, TDN: 48, NEL: 1.12, ME: 7.9, Ca: 0.38, P: 0.24, pricePerKg: 1.5 },
  { id: 13, name: 'Napier Grass - Silage', category: 'Forages', DM: 28, CP: 9.8, NDF: 62, ADF: 38, TDN: 56, NEL: 1.30, ME: 9.2, Ca: 0.42, P: 0.26, pricePerKg: 4 },
  
  // Desmodium Growth Stages
  { id: 14, name: 'Desmodium - Early Vegetative', category: 'Forages', DM: 24, CP: 23.5, NDF: 36, ADF: 28, TDN: 68, NEL: 1.58, ME: 11.1, Ca: 1.50, P: 0.30, pricePerKg: 7 },
  { id: 15, name: 'Desmodium - Mid Vegetative', category: 'Forages', DM: 24, CP: 19.5, NDF: 42, ADF: 32, TDN: 63, NEL: 1.47, ME: 10.3, Ca: 1.35, P: 0.26, pricePerKg: 5 },
  { id: 16, name: 'Desmodium - Late Vegetative', category: 'Forages', DM: 24, CP: 16.0, NDF: 48, ADF: 36, TDN: 58, NEL: 1.35, ME: 9.5, Ca: 1.20, P: 0.23, pricePerKg: 4 },
  
  // Kikuyu Pasture Growth Stages
  { id: 17, name: 'Kikuyu Pasture - Early Vegetative', category: 'Forages', DM: 20, CP: 21.0, NDF: 42, ADF: 24, TDN: 72, NEL: 1.68, ME: 11.8, Ca: 0.75, P: 0.38, pricePerKg: 4 },
  { id: 18, name: 'Kikuyu Pasture - Mid Vegetative', category: 'Forages', DM: 20, CP: 18.0, NDF: 48, ADF: 28, TDN: 67, NEL: 1.55, ME: 10.9, Ca: 0.65, P: 0.32, pricePerKg: 3 },
  { id: 19, name: 'Kikuyu Pasture - Late Vegetative', category: 'Forages', DM: 20, CP: 14.5, NDF: 55, ADF: 33, TDN: 62, NEL: 1.44, ME: 10.1, Ca: 0.55, P: 0.28, pricePerKg: 2.5 },
  
  // Star Grass Growth Stages
  { id: 20, name: 'Star Grass - Early Vegetative', category: 'Forages', DM: 22, CP: 18.5, NDF: 46, ADF: 26, TDN: 68, NEL: 1.58, ME: 11.1, Ca: 0.68, P: 0.35, pricePerKg: 4 },
  { id: 21, name: 'Star Grass - Mid Vegetative', category: 'Forages', DM: 22, CP: 15.5, NDF: 52, ADF: 30, TDN: 64, NEL: 1.49, ME: 10.4, Ca: 0.58, P: 0.30, pricePerKg: 3 },
  { id: 22, name: 'Star Grass - Late Vegetative', category: 'Forages', DM: 22, CP: 12.0, NDF: 58, ADF: 35, TDN: 58, NEL: 1.35, ME: 9.5, Ca: 0.50, P: 0.26, pricePerKg: 2.5 },
  
  // Silages
  { id: 23, name: 'Maize Silage - Whole Plant', category: 'Forages', DM: 35, CP: 8.5, NDF: 42, ADF: 26, TDN: 68, NEL: 1.58, ME: 11.1, Ca: 0.25, P: 0.22, pricePerKg: 10 },
  { id: 24, name: 'Maize Silage - High Moisture Corn', category: 'Forages', DM: 70, CP: 9.0, NDF: 12, ADF: 4, TDN: 88, NEL: 2.05, ME: 14.4, Ca: 0.03, P: 0.26, pricePerKg: 18 },
  { id: 25, name: 'Sorghum Silage - Grain Type', category: 'Forages', DM: 32, CP: 7.8, NDF: 48, ADF: 30, TDN: 62, NEL: 1.44, ME: 10.1, Ca: 0.30, P: 0.24, pricePerKg: 8 },
  { id: 26, name: 'Sorghum Silage - Forage Type', category: 'Forages', DM: 30, CP: 7.0, NDF: 54, ADF: 34, TDN: 58, NEL: 1.35, ME: 9.5, Ca: 0.35, P: 0.22, pricePerKg: 7 },
  
  // Other Common Forages
  { id: 27, name: 'Oat Hay', category: 'Forages', DM: 87, CP: 9.5, NDF: 60, ADF: 38, TDN: 55, NEL: 1.28, ME: 9.0, Ca: 0.35, P: 0.22, pricePerKg: 15 },
  { id: 28, name: 'Wheat Straw', category: 'Forages', DM: 90, CP: 4.0, NDF: 75, ADF: 50, TDN: 48, NEL: 1.10, ME: 7.8, Ca: 0.20, P: 0.08, pricePerKg: 8 },
  { id: 29, name: 'Maize Stover', category: 'Forages', DM: 85, CP: 5.5, NDF: 68, ADF: 42, TDN: 52, NEL: 1.21, ME: 8.5, Ca: 0.28, P: 0.12, pricePerKg: 5 },
  { id: 30, name: 'Lucerne (Green)', category: 'Forages', DM: 22, CP: 20.0, NDF: 38, ADF: 28, TDN: 65, NEL: 1.51, ME: 10.6, Ca: 1.50, P: 0.28, pricePerKg: 6 },
  { id: 31, name: 'Calliandra Leaves', category: 'Forages', DM: 30, CP: 22.0, NDF: 35, ADF: 26, TDN: 66, NEL: 1.53, ME: 10.8, Ca: 1.20, P: 0.24, pricePerKg: 7 },
  { id: 32, name: 'Leucaena Leaves', category: 'Forages', DM: 28, CP: 24.5, NDF: 32, ADF: 24, TDN: 68, NEL: 1.58, ME: 11.1, Ca: 1.40, P: 0.26, pricePerKg: 8 },
  { id: 33, name: 'Sweet Potato Vines', category: 'Forages', DM: 15, CP: 16.5, NDF: 28, ADF: 22, TDN: 70, NEL: 1.63, ME: 11.4, Ca: 0.95, P: 0.35, pricePerKg: 3 },
  { id: 34, name: 'Cassava Leaves', category: 'Forages', DM: 25, CP: 21.0, NDF: 30, ADF: 20, TDN: 68, NEL: 1.58, ME: 11.1, Ca: 1.80, P: 0.40, pricePerKg: 4 },
  { id: 35, name: 'Bean Straw', category: 'Forages', DM: 88, CP: 8.5, NDF: 55, ADF: 38, TDN: 56, NEL: 1.30, ME: 9.2, Ca: 1.20, P: 0.18, pricePerKg: 6 },
  { id: 36, name: 'Rice Straw', category: 'Forages', DM: 90, CP: 3.5, NDF: 72, ADF: 48, TDN: 45, NEL: 1.05, ME: 7.4, Ca: 0.22, P: 0.06, pricePerKg: 4 },
  { id: 37, name: 'Barley Hay', category: 'Forages', DM: 88, CP: 10.5, NDF: 56, ADF: 34, TDN: 58, NEL: 1.35, ME: 9.5, Ca: 0.38, P: 0.24, pricePerKg: 16 },
  { id: 38, name: 'Clover Hay (Red)', category: 'Forages', DM: 88, CP: 15.5, NDF: 42, ADF: 32, TDN: 60, NEL: 1.40, ME: 9.8, Ca: 1.25, P: 0.26, pricePerKg: 22 },
  { id: 39, name: 'Clover Hay (White)', category: 'Forages', DM: 88, CP: 18.0, NDF: 38, ADF: 28, TDN: 64, NEL: 1.49, ME: 10.4, Ca: 1.40, P: 0.30, pricePerKg: 25 },
  { id: 40, name: 'Vetch Hay', category: 'Forages', DM: 88, CP: 17.5, NDF: 44, ADF: 34, TDN: 58, NEL: 1.35, ME: 9.5, Ca: 1.35, P: 0.25, pricePerKg: 23 },
  { id: 41, name: 'Boma Rhodes (Mature)', category: 'Forages', DM: 90, CP: 6.5, NDF: 70, ADF: 44, TDN: 50, NEL: 1.16, ME: 8.2, Ca: 0.35, P: 0.18, pricePerKg: 12 },
  { id: 42, name: 'Teff Straw', category: 'Forages', DM: 91, CP: 4.5, NDF: 74, ADF: 48, TDN: 46, NEL: 1.07, ME: 7.5, Ca: 0.28, P: 0.08, pricePerKg: 5 },
  { id: 43, name: 'Millet Stover', category: 'Forages', DM: 88, CP: 5.0, NDF: 70, ADF: 44, TDN: 48, NEL: 1.12, ME: 7.9, Ca: 0.32, P: 0.10, pricePerKg: 6 },
  { id: 44, name: 'Sugarcane Tops (Fresh)', category: 'Forages', DM: 25, CP: 6.5, NDF: 62, ADF: 38, TDN: 54, NEL: 1.26, ME: 8.8, Ca: 0.42, P: 0.18, pricePerKg: 2 },
  { id: 45, name: 'Banana Leaves', category: 'Forages', DM: 12, CP: 12.0, NDF: 42, ADF: 30, TDN: 58, NEL: 1.35, ME: 9.5, Ca: 0.85, P: 0.22, pricePerKg: 1.5 },
  { id: 46, name: 'Banana Stems (Pseudostem)', category: 'Forages', DM: 8, CP: 5.5, NDF: 58, ADF: 42, TDN: 48, NEL: 1.12, ME: 7.9, Ca: 0.38, P: 0.15, pricePerKg: 1 },
  { id: 47, name: 'Pineapple Waste', category: 'Forages', DM: 15, CP: 6.0, NDF: 38, ADF: 28, TDN: 62, NEL: 1.44, ME: 10.1, Ca: 0.45, P: 0.12, pricePerKg: 2 },
  { id: 48, name: 'Kale (Fresh)', category: 'Forages', DM: 14, CP: 16.5, NDF: 32, ADF: 22, TDN: 68, NEL: 1.58, ME: 11.1, Ca: 1.35, P: 0.42, pricePerKg: 5 },
  
  // === ENERGY FEEDS (45 items) ===
  { id: 50, name: 'Maize Grain (Whole)', category: 'Energy', DM: 88, CP: 9.5, NDF: 10, ADF: 3, TDN: 90, NEL: 2.10, ME: 14.7, Ca: 0.02, P: 0.28, pricePerKg: 33 },
  { id: 51, name: 'Maize Grain (Ground)', category: 'Energy', DM: 88, CP: 9.5, NDF: 10, ADF: 3, TDN: 90, NEL: 2.10, ME: 14.7, Ca: 0.02, P: 0.28, pricePerKg: 35 },
  { id: 52, name: 'Maize Germ Meal', category: 'Energy', DM: 90, CP: 12.0, NDF: 14, ADF: 5, TDN: 88, NEL: 2.05, ME: 14.4, Ca: 0.04, P: 0.52, pricePerKg: 30 },
  { id: 53, name: 'Maize Bran', category: 'Energy', DM: 89, CP: 11.0, NDF: 28, ADF: 8, TDN: 78, NEL: 1.82, ME: 12.7, Ca: 0.08, P: 0.85, pricePerKg: 24 },
  { id: 54, name: 'Barley Grain (Ground)', category: 'Energy', DM: 89, CP: 12.5, NDF: 18, ADF: 6, TDN: 85, NEL: 1.98, ME: 13.9, Ca: 0.05, P: 0.35, pricePerKg: 32 },
  { id: 55, name: 'Oats Grain (Ground)', category: 'Energy', DM: 90, CP: 12.0, NDF: 28, ADF: 12, TDN: 76, NEL: 1.78, ME: 12.4, Ca: 0.08, P: 0.35, pricePerKg: 30 },
  { id: 56, name: 'Wheat Grain (Ground)', category: 'Energy', DM: 89, CP: 13.5, NDF: 12, ADF: 4, TDN: 88, NEL: 2.05, ME: 14.4, Ca: 0.04, P: 0.38, pricePerKg: 36 },
  { id: 57, name: 'Wheat Bran', category: 'Energy', DM: 90, CP: 17.5, NDF: 35, ADF: 10, TDN: 78, NEL: 1.82, ME: 12.7, Ca: 0.12, P: 0.95, pricePerKg: 26 },
  { id: 58, name: 'Wheat Pollard', category: 'Energy', DM: 89, CP: 16.0, NDF: 32, ADF: 9, TDN: 80, NEL: 1.86, ME: 13.1, Ca: 0.10, P: 0.88, pricePerKg: 28 },
  { id: 59, name: 'Rice Bran', category: 'Energy', DM: 91, CP: 13.5, NDF: 22, ADF: 8, TDN: 82, NEL: 1.90, ME: 13.4, Ca: 0.08, P: 1.65, pricePerKg: 32 },
  { id: 60, name: 'Rice Polishings', category: 'Energy', DM: 90, CP: 12.0, NDF: 18, ADF: 6, TDN: 85, NEL: 1.98, ME: 13.9, Ca: 0.06, P: 1.45, pricePerKg: 35 },
  { id: 61, name: 'Sorghum Grain', category: 'Energy', DM: 88, CP: 10.5, NDF: 12, ADF: 4, TDN: 88, NEL: 2.05, ME: 14.4, Ca: 0.03, P: 0.32, pricePerKg: 30 },
  { id: 62, name: 'Millet Grain', category: 'Energy', DM: 89, CP: 11.5, NDF: 14, ADF: 5, TDN: 85, NEL: 1.98, ME: 13.9, Ca: 0.04, P: 0.35, pricePerKg: 38 },
  { id: 63, name: 'Cassava Chips', category: 'Energy', DM: 88, CP: 2.5, NDF: 8, ADF: 4, TDN: 85, NEL: 1.98, ME: 13.9, Ca: 0.18, P: 0.12, pricePerKg: 18 },
  { id: 64, name: 'Sweet Potato (Dried)', category: 'Energy', DM: 87, CP: 4.5, NDF: 10, ADF: 5, TDN: 82, NEL: 1.90, ME: 13.4, Ca: 0.25, P: 0.15, pricePerKg: 20 },
  { id: 65, name: 'Molasses (Sugarcane)', category: 'Energy', DM: 75, CP: 4.5, NDF: 0, ADF: 0, TDN: 72, NEL: 1.68, ME: 11.8, Ca: 0.90, P: 0.09, pricePerKg: 22 },
  { id: 66, name: 'Beet Pulp', category: 'Energy', DM: 91, CP: 9.5, NDF: 45, ADF: 22, TDN: 72, NEL: 1.68, ME: 11.8, Ca: 0.70, P: 0.10, pricePerKg: 26 },
  { id: 67, name: 'Hominy Feed', category: 'Energy', DM: 90, CP: 11.0, NDF: 32, ADF: 10, TDN: 84, NEL: 1.95, ME: 13.7, Ca: 0.06, P: 0.45, pricePerKg: 29 },
  { id: 68, name: 'Bakery Waste', category: 'Energy', DM: 92, CP: 10.5, NDF: 8, ADF: 3, TDN: 88, NEL: 2.05, ME: 14.4, Ca: 0.15, P: 0.18, pricePerKg: 20 },
  { id: 69, name: 'Citrus Pulp (Dried)', category: 'Energy', DM: 90, CP: 6.5, NDF: 22, ADF: 14, TDN: 78, NEL: 1.82, ME: 12.7, Ca: 1.80, P: 0.14, pricePerKg: 24 },
  { id: 70, name: 'Palm Kernel Meal', category: 'Energy', DM: 91, CP: 17.0, NDF: 65, ADF: 35, TDN: 68, NEL: 1.58, ME: 11.1, Ca: 0.22, P: 0.60, pricePerKg: 35 },
  { id: 71, name: 'Copra Meal', category: 'Energy', DM: 92, CP: 21.0, NDF: 52, ADF: 28, TDN: 75, NEL: 1.75, ME: 12.2, Ca: 0.18, P: 0.58, pricePerKg: 40 },
  { id: 72, name: 'Sunflower Cake', category: 'Energy', DM: 91, CP: 28.0, NDF: 38, ADF: 24, TDN: 75, NEL: 1.75, ME: 12.2, Ca: 0.32, P: 0.85, pricePerKg: 45 },
  { id: 73, name: 'Brewers Grains (Dried)', category: 'Energy', DM: 92, CP: 26.0, NDF: 42, ADF: 18, TDN: 70, NEL: 1.63, ME: 11.4, Ca: 0.28, P: 0.52, pricePerKg: 28 },
  { id: 74, name: 'Coffee Pulp (Dried)', category: 'Energy', DM: 90, CP: 11.5, NDF: 35, ADF: 22, TDN: 65, NEL: 1.51, ME: 10.6, Ca: 0.45, P: 0.18, pricePerKg: 15 },
  { id: 75, name: 'Sorghum Bran', category: 'Energy', DM: 89, CP: 10.0, NDF: 30, ADF: 10, TDN: 75, NEL: 1.75, ME: 12.2, Ca: 0.06, P: 0.72, pricePerKg: 22 },
  { id: 76, name: 'Finger Millet Bran', category: 'Energy', DM: 90, CP: 12.5, NDF: 26, ADF: 8, TDN: 78, NEL: 1.82, ME: 12.7, Ca: 0.35, P: 0.45, pricePerKg: 28 },
  { id: 77, name: 'Rapeseed Meal', category: 'Energy', DM: 91, CP: 36.0, NDF: 30, ADF: 18, TDN: 72, NEL: 1.68, ME: 11.8, Ca: 0.68, P: 1.05, pricePerKg: 52 },
  { id: 78, name: 'Coconut Cake', category: 'Energy', DM: 92, CP: 20.0, NDF: 55, ADF: 30, TDN: 73, NEL: 1.70, ME: 11.9, Ca: 0.16, P: 0.55, pricePerKg: 38 },
  { id: 79, name: 'Apple Pomace (Dried)', category: 'Energy', DM: 90, CP: 5.5, NDF: 36, ADF: 24, TDN: 70, NEL: 1.63, ME: 11.4, Ca: 0.15, P: 0.08, pricePerKg: 18 },
  { id: 80, name: 'Grape Pomace (Dried)', category: 'Energy', DM: 91, CP: 10.5, NDF: 42, ADF: 28, TDN: 68, NEL: 1.58, ME: 11.1, Ca: 0.85, P: 0.18, pricePerKg: 20 },
  { id: 81, name: 'Tomato Pomace (Dried)', category: 'Energy', DM: 92, CP: 21.0, NDF: 38, ADF: 26, TDN: 72, NEL: 1.68, ME: 11.8, Ca: 0.35, P: 0.42, pricePerKg: 25 },
  { id: 82, name: 'Carrot Pulp (Dried)', category: 'Energy', DM: 90, CP: 8.5, NDF: 28, ADF: 18, TDN: 75, NEL: 1.75, ME: 12.2, Ca: 0.48, P: 0.25, pricePerKg: 22 },
  { id: 83, name: 'Potato Meal', category: 'Energy', DM: 89, CP: 9.0, NDF: 12, ADF: 6, TDN: 85, NEL: 1.98, ME: 13.9, Ca: 0.06, P: 0.22, pricePerKg: 24 },
  { id: 84, name: 'Tapioca (Cassava Meal)', category: 'Energy', DM: 88, CP: 2.8, NDF: 10, ADF: 5, TDN: 84, NEL: 1.95, ME: 13.7, Ca: 0.16, P: 0.14, pricePerKg: 19 },
  { id: 85, name: 'Maize Gluten Feed', category: 'Energy', DM: 90, CP: 22.0, NDF: 35, ADF: 12, TDN: 82, NEL: 1.90, ME: 13.4, Ca: 0.35, P: 0.85, pricePerKg: 32 },
  { id: 86, name: 'Maize Gluten Meal', category: 'Energy', DM: 91, CP: 60.0, NDF: 8, ADF: 3, TDN: 85, NEL: 1.98, ME: 13.9, Ca: 0.08, P: 0.48, pricePerKg: 72 },
  { id: 87, name: 'Rye Grain', category: 'Energy', DM: 88, CP: 11.5, NDF: 14, ADF: 5, TDN: 86, NEL: 2.00, ME: 14.0, Ca: 0.06, P: 0.35, pricePerKg: 34 },
  { id: 88, name: 'Triticale Grain', category: 'Energy', DM: 89, CP: 13.0, NDF: 13, ADF: 4, TDN: 87, NEL: 2.03, ME: 14.2, Ca: 0.05, P: 0.36, pricePerKg: 35 },
  { id: 89, name: 'Corn Cobs (Ground)', category: 'Energy', DM: 90, CP: 2.5, NDF: 85, ADF: 38, TDN: 52, NEL: 1.21, ME: 8.5, Ca: 0.08, P: 0.04, pricePerKg: 8 },
  { id: 90, name: 'Peas (Field)', category: 'Energy', DM: 89, CP: 23.0, NDF: 14, ADF: 7, TDN: 83, NEL: 1.93, ME: 13.5, Ca: 0.10, P: 0.40, pricePerKg: 48 },
  { id: 91, name: 'Chickpeas (Gram)', category: 'Energy', DM: 90, CP: 20.5, NDF: 16, ADF: 8, TDN: 82, NEL: 1.90, ME: 13.4, Ca: 0.14, P: 0.38, pricePerKg: 52 },
  { id: 92, name: 'Lupin Seeds', category: 'Energy', DM: 90, CP: 32.0, NDF: 20, ADF: 12, TDN: 80, NEL: 1.86, ME: 13.1, Ca: 0.22, P: 0.45, pricePerKg: 55 },
  { id: 90, name: 'Soybean Meal 44%', category: 'Protein', DM: 90, CP: 48.5, NDF: 9, ADF: 7, TDN: 82, NEL: 1.90, ME: 13.4, Ca: 0.30, P: 0.65, pricePerKg: 63 },
  { id: 91, name: 'Soybean Meal 48%', category: 'Protein', DM: 90, CP: 53.5, NDF: 8, ADF: 6, TDN: 84, NEL: 1.95, ME: 13.7, Ca: 0.32, P: 0.70, pricePerKg: 68 },
  { id: 92, name: 'Soybean (Roasted Full Fat)', category: 'Protein', DM: 92, CP: 38.0, NDF: 12, ADF: 8, TDN: 115, NEL: 2.68, ME: 18.8, Ca: 0.25, P: 0.62, pricePerKg: 85 },
  { id: 93, name: 'Cottonseed Meal', category: 'Protein', DM: 91, CP: 41.0, NDF: 25, ADF: 15, TDN: 75, NEL: 1.75, ME: 12.2, Ca: 0.20, P: 1.20, pricePerKg: 48 },
  { id: 94, name: 'Cottonseed Cake (Expeller)', category: 'Protein', DM: 92, CP: 43.5, NDF: 22, ADF: 13, TDN: 78, NEL: 1.82, ME: 12.7, Ca: 0.22, P: 1.25, pricePerKg: 52 },
  { id: 95, name: 'Cottonseed (Whole)', category: 'Protein', DM: 90, CP: 23.0, NDF: 45, ADF: 28, TDN: 95, NEL: 2.21, ME: 15.5, Ca: 0.18, P: 0.68, pricePerKg: 55 },
  { id: 96, name: 'Cottonseed (Whole Fuzzy)', category: 'Protein', DM: 89, CP: 22.5, NDF: 47, ADF: 30, TDN: 93, NEL: 2.17, ME: 15.2, Ca: 0.16, P: 0.65, pricePerKg: 53 },
  { id: 97, name: 'Canola Meal', category: 'Protein', DM: 90, CP: 38.0, NDF: 28, ADF: 18, TDN: 72, NEL: 1.68, ME: 11.8, Ca: 0.70, P: 1.10, pricePerKg: 54 },
  { id: 98, name: 'Sunflower Meal (Dehulled)', category: 'Protein', DM: 92, CP: 42.0, NDF: 22, ADF: 14, TDN: 78, NEL: 1.82, ME: 12.7, Ca: 0.38, P: 1.05, pricePerKg: 50 },
  { id: 99, name: 'Sunflower Meal (w/ Hulls)', category: 'Protein', DM: 92, CP: 35.0, NDF: 32, ADF: 20, TDN: 70, NEL: 1.63, ME: 11.4, Ca: 0.35, P: 0.95, pricePerKg: 42 },
  { id: 100, name: 'Sunflower Cake (Expeller)', category: 'Protein', DM: 91, CP: 38.0, NDF: 26, ADF: 16, TDN: 76, NEL: 1.78, ME: 12.4, Ca: 0.36, P: 1.00, pricePerKg: 48 },
  { id: 101, name: 'Groundnut Cake', category: 'Protein', DM: 91, CP: 48.0, NDF: 12, ADF: 8, TDN: 80, NEL: 1.86, ME: 13.1, Ca: 0.18, P: 0.62, pricePerKg: 70 },
  { id: 102, name: 'Sesame Cake', category: 'Protein', DM: 92, CP: 42.0, NDF: 18, ADF: 12, TDN: 78, NEL: 1.82, ME: 12.7, Ca: 1.50, P: 1.10, pricePerKg: 65 },
  { id: 103, name: 'Linseed Meal', category: 'Protein', DM: 91, CP: 36.0, NDF: 22, ADF: 14, TDN: 78, NEL: 1.82, ME: 12.7, Ca: 0.38, P: 0.85, pricePerKg: 60 },
  { id: 104, name: 'Fish Meal (65% CP)', category: 'Protein', DM: 92, CP: 65.0, NDF: 0, ADF: 0, TDN: 78, NEL: 1.82, ME: 12.7, Ca: 5.50, P: 3.20, pricePerKg: 120 },
  { id: 105, name: 'Fish Meal (60% CP)', category: 'Protein', DM: 91, CP: 60.0, NDF: 0, ADF: 0, TDN: 75, NEL: 1.75, ME: 12.2, Ca: 4.80, P: 2.85, pricePerKg: 110 },
  { id: 106, name: 'Blood Meal', category: 'Protein', DM: 92, CP: 85.0, NDF: 0, ADF: 0, TDN: 72, NEL: 1.68, ME: 11.8, Ca: 0.25, P: 0.25, pricePerKg: 95 },
  { id: 107, name: 'Meat Meal', category: 'Protein', DM: 93, CP: 55.0, NDF: 0, ADF: 0, TDN: 75, NEL: 1.75, ME: 12.2, Ca: 8.50, P: 4.20, pricePerKg: 85 },
  { id: 108, name: 'Meat & Bone Meal', category: 'Protein', DM: 93, CP: 50.0, NDF: 0, ADF: 0, TDN: 72, NEL: 1.68, ME: 11.8, Ca: 10.0, P: 5.00, pricePerKg: 75 },
  { id: 109, name: 'Poultry By-Product Meal', category: 'Protein', DM: 92, CP: 58.0, NDF: 0, ADF: 0, TDN: 75, NEL: 1.75, ME: 12.2, Ca: 4.20, P: 2.50, pricePerKg: 80 },
  { id: 110, name: 'Feather Meal', category: 'Protein', DM: 93, CP: 82.0, NDF: 0, ADF: 0, TDN: 68, NEL: 1.58, ME: 11.1, Ca: 0.35, P: 0.60, pricePerKg: 70 },
  { id: 111, name: 'Distillers Grains (DDG)', category: 'Protein', DM: 90, CP: 30.0, NDF: 40, ADF: 15, TDN: 85, NEL: 1.98, ME: 13.9, Ca: 0.12, P: 0.80, pricePerKg: 36 },
  { id: 112, name: 'Distillers Grains (DDGS)', category: 'Protein', DM: 89, CP: 28.0, NDF: 38, ADF: 14, TDN: 88, NEL: 2.05, ME: 14.4, Ca: 0.10, P: 0.75, pricePerKg: 38 },
  { id: 113, name: 'Alfalfa Meal (Dehy)', category: 'Protein', DM: 91, CP: 17.0, NDF: 42, ADF: 30, TDN: 58, NEL: 1.35, ME: 9.5, Ca: 1.45, P: 0.24, pricePerKg: 27 },
  { id: 114, name: 'Pea Protein', category: 'Protein', DM: 90, CP: 22.0, NDF: 15, ADF: 8, TDN: 82, NEL: 1.90, ME: 13.4, Ca: 0.12, P: 0.42, pricePerKg: 50 },
  { id: 115, name: 'Bean Meal', category: 'Protein', DM: 89, CP: 24.0, NDF: 18, ADF: 10, TDN: 80, NEL: 1.86, ME: 13.1, Ca: 0.15, P: 0.45, pricePerKg: 45 },
  { id: 116, name: 'Cowpea Meal', category: 'Protein', DM: 90, CP: 23.5, NDF: 16, ADF: 9, TDN: 81, NEL: 1.88, ME: 13.2, Ca: 0.14, P: 0.40, pricePerKg: 42 },
  { id: 117, name: 'Lablab Meal', category: 'Protein', DM: 89, CP: 25.0, NDF: 17, ADF: 10, TDN: 79, NEL: 1.84, ME: 12.9, Ca: 0.16, P: 0.38, pricePerKg: 40 },
  { id: 118, name: 'Pigeon Pea Meal', category: 'Protein', DM: 90, CP: 21.5, NDF: 20, ADF: 12, TDN: 78, NEL: 1.82, ME: 12.7, Ca: 0.18, P: 0.35, pricePerKg: 38 },
  { id: 119, name: 'Urea (46% N = 287% CP)', category: 'Protein', DM: 99, CP: 287.0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 68 },
  { id: 120, name: 'Dairy Whey Powder', category: 'Protein', DM: 95, CP: 13.0, NDF: 0, ADF: 0, TDN: 95, NEL: 2.21, ME: 15.5, Ca: 0.85, P: 0.75, pricePerKg: 90 },
  { id: 121, name: 'Skim Milk Powder', category: 'Protein', DM: 96, CP: 35.0, NDF: 0, ADF: 0, TDN: 98, NEL: 2.28, ME: 16.0, Ca: 1.30, P: 1.00, pricePerKg: 180 },
  { id: 122, name: 'Casein', category: 'Protein', DM: 92, CP: 88.0, NDF: 0, ADF: 0, TDN: 82, NEL: 1.90, ME: 13.4, Ca: 0.12, P: 0.85, pricePerKg: 450 },
  { id: 153, name: 'Yeast Culture', category: 'Protein', DM: 95, CP: 18.0, NDF: 0, ADF: 0, TDN: 65, NEL: 1.52, ME: 10.6, Ca: 0.15, P: 1.20, pricePerKg: 570 },
  { id: 154, name: 'Brewers Yeast', category: 'Protein', DM: 93, CP: 45.0, NDF: 0, ADF: 0, TDN: 72, NEL: 1.68, ME: 11.8, Ca: 0.12, P: 1.45, pricePerKg: 380 },
  { id: 155, name: 'Torula Yeast', category: 'Protein', DM: 93, CP: 48.0, NDF: 0, ADF: 0, TDN: 75, NEL: 1.75, ME: 12.2, Ca: 0.10, P: 1.50, pricePerKg: 420 },
  { id: 156, name: 'Safflower Meal', category: 'Protein', DM: 92, CP: 38.0, NDF: 28, ADF: 18, TDN: 72, NEL: 1.68, ME: 11.8, Ca: 0.32, P: 0.88, pricePerKg: 46 },
  { id: 157, name: 'Pumpkin Seed Meal', category: 'Protein', DM: 91, CP: 42.0, NDF: 16, ADF: 10, TDN: 78, NEL: 1.82, ME: 12.7, Ca: 0.28, P: 0.95, pricePerKg: 58 },
  { id: 158, name: 'Moringa Leaf Meal', category: 'Protein', DM: 92, CP: 27.5, NDF: 24, ADF: 16, TDN: 68, NEL: 1.58, ME: 11.1, Ca: 2.10, P: 0.32, pricePerKg: 85 },
  { id: 159, name: 'Spirulina', category: 'Protein', DM: 95, CP: 62.0, NDF: 0, ADF: 0, TDN: 70, NEL: 1.63, ME: 11.4, Ca: 0.12, P: 0.85, pricePerKg: 1850 },
  { id: 160, name: 'Silkworm Pupae Meal', category: 'Protein', DM: 93, CP: 52.0, NDF: 0, ADF: 0, TDN: 78, NEL: 1.82, ME: 12.7, Ca: 0.48, P: 0.75, pricePerKg: 125 },
  { id: 161, name: 'Cricket Meal', category: 'Protein', DM: 94, CP: 65.0, NDF: 0, ADF: 0, TDN: 80, NEL: 1.86, ME: 13.1, Ca: 0.35, P: 0.85, pricePerKg: 380 },
  { id: 162, name: 'Black Soldier Fly Larvae Meal', category: 'Protein', DM: 94, CP: 42.0, NDF: 0, ADF: 0, TDN: 85, NEL: 1.98, ME: 13.9, Ca: 5.20, P: 0.95, pricePerKg: 285 },
  { id: 163, name: 'Mealworm Meal', category: 'Protein', DM: 95, CP: 53.0, NDF: 0, ADF: 0, TDN: 82, NEL: 1.90, ME: 13.4, Ca: 0.18, P: 0.72, pricePerKg: 420 },
  { id: 164, name: 'Shrimp Meal', category: 'Protein', DM: 92, CP: 58.0, NDF: 0, ADF: 0, TDN: 75, NEL: 1.75, ME: 12.2, Ca: 6.80, P: 2.10, pricePerKg: 145 },
  { id: 165, name: 'Crab Meal', category: 'Protein', DM: 92, CP: 32.0, NDF: 0, ADF: 0, TDN: 68, NEL: 1.58, ME: 11.1, Ca: 12.5, P: 1.85, pricePerKg: 95 },
  { id: 166, name: 'Squid Meal', category: 'Protein', DM: 92, CP: 72.0, NDF: 0, ADF: 0, TDN: 78, NEL: 1.82, ME: 12.7, Ca: 2.40, P: 1.55, pricePerKg: 165 },
  { id: 167, name: 'Anchovy Meal', category: 'Protein', DM: 92, CP: 63.0, NDF: 0, ADF: 0, TDN: 76, NEL: 1.78, ME: 12.4, Ca: 5.20, P: 3.05, pricePerKg: 115 },
  { id: 168, name: 'Hydrolyzed Feather Meal', category: 'Protein', DM: 93, CP: 85.0, NDF: 0, ADF: 0, TDN: 72, NEL: 1.68, ME: 11.8, Ca: 0.38, P: 0.65, pricePerKg: 78 },
  
  // === FATS & OILS (15 items) ===
  { id: 180, name: 'Soybean Oil', category: 'Fats', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 210, NEL: 4.89, ME: 34.3, Ca: 0, P: 0, pricePerKg: 210 },
  { id: 181, name: 'Palm Oil', category: 'Fats', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 210, NEL: 4.89, ME: 34.3, Ca: 0, P: 0, pricePerKg: 180 },
  { id: 182, name: 'Sunflower Oil', category: 'Fats', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 210, NEL: 4.89, ME: 34.3, Ca: 0, P: 0, pricePerKg: 220 },
  { id: 183, name: 'Canola Oil', category: 'Fats', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 210, NEL: 4.89, ME: 34.3, Ca: 0, P: 0, pricePerKg: 230 },
  { id: 184, name: 'Corn Oil', category: 'Fats', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 210, NEL: 4.89, ME: 34.3, Ca: 0, P: 0, pricePerKg: 215 },
  { id: 185, name: 'Coconut Oil', category: 'Fats', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 210, NEL: 4.89, ME: 34.3, Ca: 0, P: 0, pricePerKg: 250 },
  { id: 186, name: 'Animal Fat (Tallow)', category: 'Fats', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 200, NEL: 4.66, ME: 32.7, Ca: 0, P: 0, pricePerKg: 150 },
  { id: 187, name: 'Poultry Fat', category: 'Fats', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 205, NEL: 4.77, ME: 33.5, Ca: 0, P: 0, pricePerKg: 160 },
  { id: 188, name: 'Lard (Pork Fat)', category: 'Fats', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 205, NEL: 4.77, ME: 33.5, Ca: 0, P: 0, pricePerKg: 165 },
  { id: 189, name: 'Fish Oil', category: 'Fats', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 210, NEL: 4.89, ME: 34.3, Ca: 0, P: 0, pricePerKg: 280 },
  { id: 190, name: 'Flaxseed Oil (Linseed Oil)', category: 'Fats', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 210, NEL: 4.89, ME: 34.3, Ca: 0, P: 0, pricePerKg: 320 },
  { id: 191, name: 'Calcium Soaps (Fat)', category: 'Fats', DM: 98, CP: 0, NDF: 0, ADF: 0, TDN: 195, NEL: 4.54, ME: 31.9, Ca: 8.50, P: 0, pricePerKg: 190 },
  { id: 192, name: 'Bypass Fat Supplement', category: 'Fats', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 198, NEL: 4.61, ME: 32.4, Ca: 0.10, P: 0, pricePerKg: 220 },
  { id: 193, name: 'Hydrogenated Fat', category: 'Fats', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 200, NEL: 4.66, ME: 32.7, Ca: 0, P: 0, pricePerKg: 175 },
  { id: 194, name: 'Lecithin', category: 'Fats', DM: 98, CP: 0, NDF: 0, ADF: 0, TDN: 190, NEL: 4.43, ME: 31.1, Ca: 0, P: 1.85, pricePerKg: 420 },
  
  // === MINERALS (35 items) ===
  { id: 210, name: 'Limestone (Calcium Carbonate)', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 38.0, P: 0, pricePerKg: 13 },
  { id: 211, name: 'Oyster Shell', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 38.5, P: 0, pricePerKg: 15 },
  { id: 212, name: 'Calcite', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 40.0, P: 0, pricePerKg: 14 },
  { id: 213, name: 'Dolomitic Limestone', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 22.0, P: 0, pricePerKg: 15 },
  { id: 214, name: 'Dicalcium Phosphate', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 22.0, P: 18.5, pricePerKg: 98 },
  { id: 215, name: 'Monocalcium Phosphate', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 16.0, P: 21.0, pricePerKg: 105 },
  { id: 216, name: 'Tricalcium Phosphate', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 38.0, P: 20.0, pricePerKg: 110 },
  { id: 217, name: 'Defluorinated Phosphate', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 32.0, P: 18.0, pricePerKg: 95 },
  { id: 218, name: 'Bone Meal (Steamed)', category: 'Minerals', DM: 95, CP: 10.0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 24.0, P: 12.0, pricePerKg: 65 },
  { id: 219, name: 'Rock Phosphate (Soft)', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 33.0, P: 14.5, pricePerKg: 45 },
  { id: 220, name: 'Salt (Sodium Chloride)', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 18 },
  { id: 221, name: 'Iodized Salt', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 22 },
  { id: 222, name: 'Trace Mineralized Salt', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 28 },
  { id: 223, name: 'Magnesium Oxide', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 143 },
  { id: 224, name: 'Magnesium Sulfate (Epsom Salt)', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 85 },
  { id: 225, name: 'Magnesium Carbonate', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 95 },
  { id: 226, name: 'Sodium Bicarbonate (Baking Soda)', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 63 },
  { id: 227, name: 'Sodium Sesquicarbonate', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 75 },
  { id: 228, name: 'Potassium Carbonate', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 120 },
  { id: 229, name: 'Potassium Chloride', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 85 },
  { id: 230, name: 'Sulfur (Elemental)', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 45 },
  { id: 231, name: 'Ammonium Sulfate', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 52 },
  { id: 232, name: 'Zinc Oxide', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 280 },
  { id: 233, name: 'Zinc Sulfate', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 185 },
  { id: 234, name: 'Copper Sulfate', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 350 },
  { id: 235, name: 'Copper Oxide', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 420 },
  { id: 236, name: 'Manganese Oxide', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 240 },
  { id: 237, name: 'Manganese Sulfate', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 165 },
  { id: 238, name: 'Iron Sulfate', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 75 },
  { id: 239, name: 'Iron Oxide', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 95 },
  { id: 240, name: 'Selenium Premix (0.2%)', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 2800 },
  { id: 241, name: 'Sodium Selenite', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 3500 },
  { id: 242, name: 'Cobalt Carbonate', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 850 },
  { id: 243, name: 'Cobalt Sulfate', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 720 },
  { id: 244, name: 'Iodine (Potassium Iodide)', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 1200 },
  { id: 245, name: 'Calcium Iodate', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 1400 },
  { id: 246, name: 'Trace Mineral Mix', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 180 },
  { id: 247, name: 'Macro Mineral Mix', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 15.0, P: 8.0, pricePerKg: 85 },
  { id: 248, name: 'Dairy Mineral Premix', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 18.0, P: 10.0, pricePerKg: 120 },
  { id: 249, name: 'Poultry Mineral Premix', category: 'Minerals', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 12.0, P: 6.0, pricePerKg: 95 },
  
  // === VITAMINS & ADDITIVES (30 items) ===
  { id: 270, name: 'Vitamin A Premix (500k IU/g)', category: 'Vitamins', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 850 },
  { id: 271, name: 'Vitamin D3 Premix (500k IU/g)', category: 'Vitamins', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 920 },
  { id: 272, name: 'Vitamin E Premix (50%)', category: 'Vitamins', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 1100 },
  { id: 273, name: 'Vitamin A-D-E Premix', category: 'Vitamins', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 375 },
  { id: 274, name: 'Vitamin K3 (Menadione)', category: 'Vitamins', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 780 },
  { id: 275, name: 'Thiamine (Vitamin B1)', category: 'Vitamins', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 520 },
  { id: 276, name: 'Riboflavin (Vitamin B2)', category: 'Vitamins', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 880 },
  { id: 277, name: 'Niacin (Vitamin B3)', category: 'Vitamins', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 550 },
  { id: 278, name: 'Pantothenic Acid (B5)', category: 'Vitamins', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 720 },
  { id: 279, name: 'Pyridoxine (Vitamin B6)', category: 'Vitamins', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 950 },
  { id: 280, name: 'Folic Acid (Vitamin B9)', category: 'Vitamins', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 1850 },
  { id: 281, name: 'Vitamin B12 (Cobalamin)', category: 'Vitamins', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 12500 },
  { id: 282, name: 'B-Complex Vitamins', category: 'Vitamins', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 680 },
  { id: 283, name: 'Biotin Premix (2%)', category: 'Vitamins', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 975 },
  { id: 284, name: 'Choline Chloride (60%)', category: 'Vitamins', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 420 },
  { id: 285, name: 'Vitamin C (Ascorbic Acid)', category: 'Vitamins', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 480 },
  { id: 286, name: 'Lysine HCl (78%)', category: 'Additives', DM: 99, CP: 78.0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 320 },
  { id: 287, name: 'L-Lysine Sulfate (55%)', category: 'Additives', DM: 99, CP: 55.0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 280 },
  { id: 288, name: 'DL-Methionine (99%)', category: 'Additives', DM: 99, CP: 59.0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 580 },
  { id: 289, name: 'Methionine Hydroxy Analog', category: 'Additives', DM: 88, CP: 42.0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 420 },
  { id: 290, name: 'L-Threonine (98%)', category: 'Additives', DM: 99, CP: 75.0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 420 },
  { id: 291, name: 'L-Tryptophan (98%)', category: 'Additives', DM: 99, CP: 85.0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 1850 },
  { id: 292, name: 'Probiotics (Multi-Strain)', category: 'Additives', DM: 95, CP: 12.0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 1850 },
  { id: 293, name: 'Lactobacillus Culture', category: 'Additives', DM: 95, CP: 8.0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 1250 },
  { id: 294, name: 'Bacillus Subtilis', category: 'Additives', DM: 95, CP: 6.0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 1450 },
  { id: 295, name: 'Enzymes (Multi-Enzyme Complex)', category: 'Additives', DM: 98, CP: 5.0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 2200 },
  { id: 296, name: 'Phytase Enzyme', category: 'Additives', DM: 98, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 1850 },
  { id: 297, name: 'Xylanase Enzyme', category: 'Additives', DM: 98, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 1650 },
  { id: 298, name: 'Toxin Binder (Mycotoxin)', category: 'Additives', DM: 98, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 380 },
  { id: 299, name: 'Organic Acids Blend', category: 'Additives', DM: 99, CP: 0, NDF: 0, ADF: 0, TDN: 0, NEL: 0, ME: 0, Ca: 0, P: 0, pricePerKg: 520 }
]

// Animal Requirement Templates by Category
const REQUIREMENTS = {
  // Dairy Cattle
  'Dairy - High Production (>35kg/day)': { DM: 24, CP: 18, NDF: 32, ADF: 21, NEL: 1.75, Ca: 0.75, P: 0.45, category: 'Dairy Cattle' },
  'Dairy - Mid Production (25-35kg/day)': { DM: 22, CP: 16, NDF: 35, ADF: 23, NEL: 1.65, Ca: 0.70, P: 0.40, category: 'Dairy Cattle' },
  'Dairy - Low Production (<25kg/day)': { DM: 20, CP: 14, NDF: 38, ADF: 25, NEL: 1.55, Ca: 0.65, P: 0.38, category: 'Dairy Cattle' },
  'Dairy - Dry Cow (Far-off)': { DM: 12, CP: 12, NDF: 45, ADF: 30, NEL: 1.35, Ca: 0.50, P: 0.30, category: 'Dairy Cattle' },
  'Dairy - Dry Cow (Close-up)': { DM: 13, CP: 14, NDF: 40, ADF: 28, NEL: 1.50, Ca: 0.60, P: 0.38, category: 'Dairy Cattle' },
  'Dairy - Fresh Cow (0-21 days)': { DM: 20, CP: 18, NDF: 33, ADF: 22, NEL: 1.70, Ca: 0.80, P: 0.50, category: 'Dairy Cattle' },
  
  // Beef Cattle
  'Beef - Growing (200-400kg)': { DM: 10, CP: 14, NDF: 40, ADF: 26, NEL: 1.45, Ca: 0.40, P: 0.25, category: 'Beef Cattle' },
  'Beef - Finishing (>400kg)': { DM: 11, CP: 13, NDF: 25, ADF: 16, NEL: 1.65, Ca: 0.35, P: 0.30, category: 'Beef Cattle' },
  'Beef - Cow-Calf (Lactating)': { DM: 12, CP: 12, NDF: 45, ADF: 30, NEL: 1.40, Ca: 0.45, P: 0.28, category: 'Beef Cattle' },
  'Beef - Cow-Calf (Dry)': { DM: 10, CP: 10, NDF: 50, ADF: 33, NEL: 1.25, Ca: 0.35, P: 0.22, category: 'Beef Cattle' },
  'Beef - Bull (Breeding)': { DM: 14, CP: 12, NDF: 42, ADF: 28, NEL: 1.45, Ca: 0.40, P: 0.30, category: 'Beef Cattle' },
  
  // Heifers & Calves
  'Heifer - Growing (200-400kg)': { DM: 10, CP: 14, NDF: 40, ADF: 26, NEL: 1.50, Ca: 0.50, P: 0.35, category: 'Heifers & Calves' },
  'Heifer - Breeding (>400kg)': { DM: 11, CP: 13, NDF: 42, ADF: 28, NEL: 1.45, Ca: 0.55, P: 0.38, category: 'Heifers & Calves' },
  'Calf - Starter (50-100kg)': { DM: 2, CP: 20, NDF: 20, ADF: 12, NEL: 1.85, Ca: 0.70, P: 0.45, category: 'Heifers & Calves' },
  'Calf - Grower (100-200kg)': { DM: 5, CP: 16, NDF: 30, ADF: 18, NEL: 1.65, Ca: 0.60, P: 0.40, category: 'Heifers & Calves' },
  
  // Small Ruminants - Sheep
  'Sheep - Ewe Lactating': { DM: 2.5, CP: 16, NDF: 35, ADF: 23, NEL: 1.60, Ca: 0.60, P: 0.38, category: 'Sheep' },
  'Sheep - Ewe Dry': { DM: 1.8, CP: 11, NDF: 45, ADF: 30, NEL: 1.30, Ca: 0.40, P: 0.25, category: 'Sheep' },
  'Sheep - Lamb Growing': { DM: 1.5, CP: 16, NDF: 30, ADF: 20, NEL: 1.70, Ca: 0.55, P: 0.35, category: 'Sheep' },
  'Sheep - Ram Breeding': { DM: 2.2, CP: 13, NDF: 40, ADF: 26, NEL: 1.45, Ca: 0.45, P: 0.30, category: 'Sheep' },
  
  // Small Ruminants - Goats
  'Goat - Doe Lactating': { DM: 3.0, CP: 17, NDF: 33, ADF: 22, NEL: 1.62, Ca: 0.65, P: 0.40, category: 'Goats' },
  'Goat - Doe Dry': { DM: 2.0, CP: 12, NDF: 42, ADF: 28, NEL: 1.35, Ca: 0.45, P: 0.28, category: 'Goats' },
  'Goat - Kid Growing': { DM: 1.2, CP: 18, NDF: 28, ADF: 18, NEL: 1.75, Ca: 0.60, P: 0.38, category: 'Goats' },
  'Goat - Buck Breeding': { DM: 2.5, CP: 14, NDF: 38, ADF: 25, NEL: 1.50, Ca: 0.50, P: 0.32, category: 'Goats' },
  
  // Horses
  'Horse - Maintenance': { DM: 10, CP: 10, NDF: 45, ADF: 30, NEL: 1.30, Ca: 0.30, P: 0.20, category: 'Horses' },
  'Horse - Light Work': { DM: 11, CP: 11, NDF: 40, ADF: 26, NEL: 1.45, Ca: 0.35, P: 0.25, category: 'Horses' },
  'Horse - Moderate Work': { DM: 12, CP: 12, NDF: 35, ADF: 23, NEL: 1.60, Ca: 0.40, P: 0.30, category: 'Horses' },
  'Horse - Heavy Work': { DM: 14, CP: 14, NDF: 30, ADF: 20, NEL: 1.75, Ca: 0.45, P: 0.35, category: 'Horses' },
  'Horse - Lactating Mare': { DM: 13, CP: 14, NDF: 35, ADF: 23, NEL: 1.65, Ca: 0.55, P: 0.40, category: 'Horses' },
  'Horse - Growing (Yearling)': { DM: 9, CP: 14, NDF: 35, ADF: 23, NEL: 1.60, Ca: 0.60, P: 0.45, category: 'Horses' },
  
  // Swine
  'Pig - Growing (20-50kg)': { DM: 2.5, CP: 18, NDF: 15, ADF: 8, NEL: 2.30, Ca: 0.70, P: 0.60, category: 'Swine' },
  'Pig - Finishing (50-120kg)': { DM: 3.5, CP: 16, NDF: 18, ADF: 10, NEL: 2.20, Ca: 0.60, P: 0.50, category: 'Swine' },
  'Pig - Sow Lactating': { DM: 6.5, CP: 17, NDF: 20, ADF: 12, NEL: 2.25, Ca: 0.85, P: 0.70, category: 'Swine' },
  'Pig - Sow Gestating': { DM: 2.5, CP: 13, NDF: 25, ADF: 15, NEL: 2.10, Ca: 0.75, P: 0.60, category: 'Swine' },
  
  // Poultry - Layers
  'Layer - Pullet (0-6 weeks)': { DM: 0.030, CP: 20, NDF: 8, ADF: 4, NEL: 2.90, Ca: 1.00, P: 0.70, category: 'Poultry - Layers' },
  'Layer - Grower (7-18 weeks)': { DM: 0.080, CP: 16, NDF: 10, ADF: 5, NEL: 2.80, Ca: 0.90, P: 0.65, category: 'Poultry - Layers' },
  'Layer - Production (>18 weeks)': { DM: 0.110, CP: 18, NDF: 12, ADF: 6, NEL: 2.85, Ca: 3.50, P: 0.40, category: 'Poultry - Layers' },
  'Layer - Breeder': { DM: 0.120, CP: 17, NDF: 12, ADF: 6, NEL: 2.80, Ca: 3.25, P: 0.45, category: 'Poultry - Layers' },
  
  // Poultry - Broilers
  'Broiler - Starter (0-10 days)': { DM: 0.025, CP: 23, NDF: 6, ADF: 3, NEL: 3.10, Ca: 1.00, P: 0.75, category: 'Poultry - Broilers' },
  'Broiler - Grower (11-24 days)': { DM: 0.070, CP: 21, NDF: 8, ADF: 4, NEL: 3.05, Ca: 0.90, P: 0.70, category: 'Poultry - Broilers' },
  'Broiler - Finisher (25+ days)': { DM: 0.110, CP: 19, NDF: 10, ADF: 5, NEL: 3.00, Ca: 0.85, P: 0.65, category: 'Poultry - Broilers' },
  
  // Poultry - Turkeys
  'Turkey - Starter (0-4 weeks)': { DM: 0.040, CP: 28, NDF: 7, ADF: 3, NEL: 3.00, Ca: 1.20, P: 0.80, category: 'Poultry - Turkeys' },
  'Turkey - Grower (5-12 weeks)': { DM: 0.180, CP: 24, NDF: 9, ADF: 4, NEL: 2.95, Ca: 1.00, P: 0.70, category: 'Poultry - Turkeys' },
  'Turkey - Finisher (13+ weeks)': { DM: 0.280, CP: 20, NDF: 11, ADF: 5, NEL: 2.90, Ca: 0.85, P: 0.60, category: 'Poultry - Turkeys' },
  'Turkey - Breeder': { DM: 0.200, CP: 18, NDF: 12, ADF: 6, NEL: 2.75, Ca: 2.25, P: 0.55, category: 'Poultry - Turkeys' },
  
  // Poultry - Ducks
  'Duck - Starter (0-2 weeks)': { DM: 0.030, CP: 22, NDF: 7, ADF: 3, NEL: 2.95, Ca: 0.90, P: 0.70, category: 'Poultry - Ducks' },
  'Duck - Grower (3-7 weeks)': { DM: 0.120, CP: 18, NDF: 10, ADF: 5, NEL: 2.85, Ca: 0.80, P: 0.65, category: 'Poultry - Ducks' },
  'Duck - Finisher (8+ weeks)': { DM: 0.180, CP: 16, NDF: 12, ADF: 6, NEL: 2.80, Ca: 0.75, P: 0.60, category: 'Poultry - Ducks' },
  'Duck - Breeder': { DM: 0.150, CP: 17, NDF: 11, ADF: 5, NEL: 2.75, Ca: 2.75, P: 0.50, category: 'Poultry - Ducks' }
}

export default function AnimalFeeding({ animals }){
  const [activeTab, setActiveTab] = useState('ingredients')
  const [diets, setDiets] = useState([])
  const [rations, setRations] = useState([])
  
  // Ingredient Library
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  
  // Diet Formulation
  const [dietName, setDietName] = useState('')
  const [targetAnimal, setTargetAnimal] = useState('Dairy - High Production (>35kg/day)')
  const [animalCategory, setAnimalCategory] = useState('all')
  const [dietIngredients, setDietIngredients] = useState([])
  const [selectedIngId, setSelectedIngId] = useState('')
  const [ingredientAmount, setIngredientAmount] = useState('')
  
  // Ration Assignment
  const [rationName, setRationName] = useState('')
  const [selectedDiet, setSelectedDiet] = useState('')
  const [selectedAnimals, setSelectedAnimals] = useState([])

  useEffect(() => {
    const d = localStorage.getItem('rumen8:diets')
    const r = localStorage.getItem('rumen8:rations')
    if(d) setDiets(JSON.parse(d))
    if(r) setRations(JSON.parse(r))
  }, [])

  useEffect(() => localStorage.setItem('rumen8:diets', JSON.stringify(diets)), [diets])
  useEffect(() => localStorage.setItem('rumen8:rations', JSON.stringify(rations)), [rations])

  const categories = [...new Set(INGREDIENTS.map(i => i.category))]
  const filteredIngredients = INGREDIENTS.filter(ing => {
    if(filterCategory !== 'all' && ing.category !== filterCategory) return false
    if(searchTerm && !ing.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  function addIngredientToDiet() {
    if(!selectedIngId || !ingredientAmount || parseFloat(ingredientAmount) <= 0) {
      alert('Select ingredient and enter valid amount')
      return
    }
    const ing = INGREDIENTS.find(i => i.id === parseInt(selectedIngId))
    setDietIngredients([...dietIngredients, { ...ing, amount: parseFloat(ingredientAmount) }])
    setSelectedIngId('')
    setIngredientAmount('')
  }

  function removeFromDiet(id) {
    setDietIngredients(dietIngredients.filter(i => i.id !== id))
  }

  function analyzeDiet() {
    const total = dietIngredients.reduce((sum, i) => sum + i.amount, 0)
    if(total === 0) return null

    let totalDM = 0, cpDM = 0, ndfDM = 0, adfDM = 0, nelDM = 0, meDM = 0, caDM = 0, pDM = 0, cost = 0
    
    dietIngredients.forEach(ing => {
      const dm = (ing.DM / 100) * ing.amount
      totalDM += dm
      cpDM += (ing.CP / 100) * dm
      ndfDM += (ing.NDF / 100) * dm
      adfDM += (ing.ADF / 100) * dm
      nelDM += ing.NEL * dm
      meDM += ing.ME * dm
      caDM += (ing.Ca / 100) * dm
      pDM += (ing.P / 100) * dm
      cost += ing.pricePerKg * ing.amount
    })

    return {
      DM: totalDM,
      CP: (cpDM / totalDM) * 100,
      NDF: (ndfDM / totalDM) * 100,
      ADF: (adfDM / totalDM) * 100,
      NEL: nelDM / totalDM,
      ME: meDM / totalDM,
      Ca: (caDM / totalDM) * 100,
      P: (pDM / totalDM) * 100,
      costPerKg: cost / total,
      total
    }
  }

  function saveDiet() {
    if(!dietName || dietIngredients.length === 0) {
      alert('Enter diet name and add ingredients')
      return
    }
    const analysis = analyzeDiet()
    const newDiet = {
      id: Date.now(),
      name: dietName,
      targetAnimal,
      ingredients: dietIngredients,
      analysis,
      created: new Date().toISOString()
    }
    setDiets([...diets, newDiet])
    setDietName('')
    setDietIngredients([])
    alert('Diet saved!')
  }

  function createRation() {
    if(!rationName || !selectedDiet || selectedAnimals.length === 0) {
      alert('Complete all fields')
      return
    }
    const diet = diets.find(d => d.id === parseInt(selectedDiet))
    setRations([...rations, {
      id: Date.now(),
      name: rationName,
      dietId: diet.id,
      dietName: diet.name,
      animals: selectedAnimals,
      created: new Date().toISOString()
    }])
    setRationName('')
    setSelectedDiet('')
    setSelectedAnimals([])
    alert('Ration assigned!')
  }

  const analysis = analyzeDiet()
  const requirements = REQUIREMENTS[targetAnimal]
  
  // Get animal categories
  const animalCategories = [...new Set(Object.values(REQUIREMENTS).map(r => r.category))]
  
  // Filter requirements by category
  const filteredRequirements = animalCategory === 'all' 
    ? Object.entries(REQUIREMENTS)
    : Object.entries(REQUIREMENTS).filter(([_, req]) => req.category === animalCategory)

  // Export/Import functions
  const fileInputRef = useRef(null)

  function exportIngredientsCSV() {
    const data = Object.entries(INGREDIENTS).map(([name, ing]) => ({
      name,
      category: ing.category,
      DM: ing.DM,
      CP: ing.CP,
      NDF: ing.NDF,
      ADF: ing.ADF,
      TDN: ing.TDN,
      NEL: ing.NEL,
      ME: ing.ME,
      Ca: ing.Ca,
      P: ing.P,
      price: ing.price || 0
    }))
    exportToCSV(data, 'ingredients.csv')
  }

  function exportDietsCSV() {
    const data = diets.map(d => ({
      id: d.id,
      name: d.name,
      targetAnimal: d.targetAnimal,
      created: d.created,
      ingredients: d.ingredients.map(i => `${i.name}:${i.amount}kg`).join('; '),
      totalDM: d.analysis.totalDM.toFixed(2),
      totalCP: d.analysis.totalCP.toFixed(2),
      costPerKg: d.analysis.costPerKg.toFixed(2)
    }))
    exportToCSV(data, 'diets.csv')
  }

  function exportRationsCSV() {
    const data = rations.map(r => ({
      id: r.id,
      name: r.name,
      dietName: r.dietName,
      animals: r.animals.join('; '),
      created: r.created
    }))
    exportToCSV(data, 'rations.csv')
  }

  function batchPrintRations() {
    if (rations.length === 0) {
      alert('No rations to print')
      return
    }

    batchPrint(rations, (ration) => {
      const diet = diets.find(d => d.id === ration.dietId)
      return `
        <div style="padding: 20px; border: 2px solid #000;">
          <h2 style="margin-top: 0;">🔗 Ration Card: ${ration.name}</h2>
          <p><strong>Diet:</strong> ${ration.dietName}</p>
          <p><strong>Created:</strong> ${new Date(ration.created).toLocaleString()}</p>
          <h3>Assigned Animals:</h3>
          <ul>
            ${ration.animals.map(a => `<li>${a}</li>`).join('')}
          </ul>
          ${diet ? `
            <h3>Diet Composition:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr>
                  <th style="border: 1px solid #000; padding: 8px; text-align: left;">Ingredient</th>
                  <th style="border: 1px solid #000; padding: 8px; text-align: right;">Amount (kg)</th>
                </tr>
              </thead>
              <tbody>
                ${diet.ingredients.map(ing => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 8px;">${ing.name}</td>
                    <td style="border: 1px solid #000; padding: 8px; text-align: right;">${ing.amount}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="margin-top: 20px; padding: 10px; background: #f0f0f0;">
              <h4 style="margin-top: 0;">Nutritional Analysis:</h4>
              <p><strong>Total DM:</strong> ${diet.analysis.totalDM.toFixed(2)} kg</p>
              <p><strong>Total CP:</strong> ${diet.analysis.totalCP.toFixed(2)} kg</p>
              <p><strong>Cost per kg:</strong> KES ${diet.analysis.costPerKg.toFixed(2)}</p>
            </div>
          ` : ''}
        </div>
      `
    }, 'Ration Cards')
  }

  return (
    <section>
      <div style={{ marginBottom: 16 }}>
        <h3>🧪 Rumen8 Feed Formulation System</h3>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #e5e7eb', flexWrap: 'wrap' }}>
        {[
          { id: 'ingredients', label: '📚 Ingredient Library' },
          { id: 'requirements', label: '🎯 Requirements' },
          { id: 'formulation', label: '🧪 Diet Formulation' },
          { id: 'diets', label: '💾 Saved Diets' },
          { id: 'rations', label: '🔗 Ration Assignment' },
          { id: 'reports', label: '📊 Reports' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent',
              background: activeTab === tab.id ? '#eff6ff' : 'transparent',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? '#2563eb' : '#666'
            }}
          >
            {tab.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {activeTab === 'ingredients' && (
            <button onClick={exportIngredientsCSV} style={{ fontSize: 12 }} title="Export ingredients">📊 Export</button>
          )}
          {activeTab === 'diets' && (
            <button onClick={exportDietsCSV} style={{ fontSize: 12 }} title="Export diets">📊 Export</button>
          )}
          {activeTab === 'rations' && (
            <>
              <button onClick={exportRationsCSV} style={{ fontSize: 12 }} title="Export rations">📊 Export</button>
              <button onClick={batchPrintRations} style={{ fontSize: 12 }} title="Print all rations">🖨️ Print</button>
            </>
          )}
        </div>
      </div>

      {/* INGREDIENT LIBRARY */}
      {activeTab === 'ingredients' && (
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <input
                type="text"
                placeholder="Search ingredients..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: 10, textAlign: 'left' }}>Ingredient</th>
                  <th style={{ padding: 10 }}>DM%</th>
                  <th style={{ padding: 10 }}>CP%</th>
                  <th style={{ padding: 10 }}>NDF%</th>
                  <th style={{ padding: 10 }}>ADF%</th>
                  <th style={{ padding: 10 }}>NEL</th>
                  <th style={{ padding: 10 }}>ME</th>
                  <th style={{ padding: 10 }}>Ca%</th>
                  <th style={{ padding: 10 }}>P%</th>
                  <th style={{ padding: 10 }}>Price/kg</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.map(ing => (
                  <tr key={ing.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: 10 }}>
                      <div style={{ fontWeight: 600 }}>{ing.name}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{ing.category}</div>
                    </td>
                    <td style={{ padding: 10, textAlign: 'center' }}>{ing.DM.toFixed(1)}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>{ing.CP.toFixed(1)}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>{ing.NDF.toFixed(1)}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>{ing.ADF.toFixed(1)}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>{ing.NEL.toFixed(2)}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>{ing.ME.toFixed(1)}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>{ing.Ca.toFixed(2)}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>{ing.P.toFixed(2)}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>KES {ing.pricePerKg.toFixed(2)}/kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REQUIREMENTS */}
      {activeTab === 'requirements' && (
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <select value={animalCategory} onChange={e => setAnimalCategory(e.target.value)} style={{ width: '100%' }}>
              <option value="all">All Categories</option>
              {animalCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'grid', gap: 16 }}>
            {filteredRequirements.map(([animal, req]) => (
              <div key={animal} className="card" style={{ padding: 16, background: '#f9fafb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <div>
                    <h5 style={{ margin: 0 }}>{animal}</h5>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{req.category}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12, fontSize: 14 }}>
                  <div><strong>DM:</strong> {req.DM} kg/day</div>
                  <div><strong>CP:</strong> {req.CP}%</div>
                  <div><strong>NDF:</strong> {req.NDF}%</div>
                  <div><strong>ADF:</strong> {req.ADF}%</div>
                  <div><strong>NEL:</strong> {req.NEL} Mcal/kg</div>
                  <div><strong>Ca:</strong> {req.Ca}%</div>
                  <div><strong>P:</strong> {req.P}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DIET FORMULATION */}
      {activeTab === 'formulation' && (
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h4>Create New Diet</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginTop: 16 }}>
              <input
                type="text"
                placeholder="Diet name..."
                value={dietName}
                onChange={e => setDietName(e.target.value)}
              />
              <select value={targetAnimal} onChange={e => setTargetAnimal(e.target.value)}>
                <option value="">-- Select Animal Type --</option>
                {animalCategories.map(category => (
                  <optgroup key={category} label={category}>
                    {Object.entries(REQUIREMENTS)
                      .filter(([_, req]) => req.category === category)
                      .map(([name, _]) => (
                        <option key={name} value={name}>{name}</option>
                      ))
                    }
                  </optgroup>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12, marginTop: 16 }}>
              <select value={selectedIngId} onChange={e => setSelectedIngId(e.target.value)}>
                <option value="">-- Select Ingredient --</option>
                {INGREDIENTS.map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.name} ({ing.category})</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Amount (kg)"
                value={ingredientAmount}
                onChange={e => setIngredientAmount(e.target.value)}
                step="0.1"
              />
              <button onClick={addIngredientToDiet}>Add</button>
            </div>
          </div>

          {/* Diet Ingredients */}
          {dietIngredients.length > 0 && (
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <h4>Diet Composition</h4>
              <table style={{ width: '100%', marginTop: 16 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: 8, textAlign: 'left' }}>Ingredient</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Amount (kg)</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>% of Mix</th>
                    <th style={{ padding: 8 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {dietIngredients.map(ing => {
                    const total = dietIngredients.reduce((s, i) => s + i.amount, 0)
                    const pct = (ing.amount / total) * 100
                    return (
                      <tr key={ing.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: 8 }}>{ing.name}</td>
                        <td style={{ padding: 8, textAlign: 'right' }}>{ing.amount.toFixed(2)}</td>
                        <td style={{ padding: 8, textAlign: 'right' }}>{pct.toFixed(1)}%</td>
                        <td style={{ padding: 8, textAlign: 'center' }}>
                          <button onClick={() => removeFromDiet(ing.id)} style={{ color: '#dc2626' }}>✕</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Analysis */}
          {analysis && (
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <h4>Nutritional Analysis</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#666' }}>Dry Matter</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>{analysis.DM.toFixed(1)} kg</div>
                  {requirements && <div style={{ fontSize: 12, color: analysis.DM >= requirements.DM ? '#059669' : '#dc2626' }}>
                    Target: {requirements.DM} kg
                  </div>}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#666' }}>Crude Protein</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>{analysis.CP.toFixed(1)}%</div>
                  {requirements && <div style={{ fontSize: 12, color: analysis.CP >= requirements.CP ? '#059669' : '#dc2626' }}>
                    Target: {requirements.CP}%
                  </div>}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#666' }}>NDF</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>{analysis.NDF.toFixed(1)}%</div>
                  {requirements && <div style={{ fontSize: 12, color: Math.abs(analysis.NDF - requirements.NDF) <= 5 ? '#059669' : '#dc2626' }}>
                    Target: {requirements.NDF}%
                  </div>}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#666' }}>NEL</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>{analysis.NEL.toFixed(2)}</div>
                  {requirements && <div style={{ fontSize: 12, color: analysis.NEL >= requirements.NEL ? '#059669' : '#dc2626' }}>
                    Target: {requirements.NEL}
                  </div>}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#666' }}>ME (MJ/kg DM)</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>{analysis.ME.toFixed(1)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#666' }}>Calcium</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>{analysis.Ca.toFixed(2)}%</div>
                  {requirements && <div style={{ fontSize: 12, color: analysis.Ca >= requirements.Ca ? '#059669' : '#dc2626' }}>
                    Target: {requirements.Ca}%
                  </div>}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#666' }}>Phosphorus</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>{analysis.P.toFixed(2)}%</div>
                  {requirements && <div style={{ fontSize: 12, color: analysis.P >= requirements.P ? '#059669' : '#dc2626' }}>
                    Target: {requirements.P}%
                  </div>}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#666' }}>Cost</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>KES {analysis.costPerKg.toFixed(2)}/kg</div>
                  <div style={{ fontSize: 12, color: '#666' }}>KES {(analysis.costPerKg * analysis.DM).toFixed(2)}/head/day</div>
                </div>
              </div>
              <button onClick={saveDiet} style={{ marginTop: 20, width: '100%' }}>Save Diet</button>
            </div>
          )}
        </div>
      )}

      {/* SAVED DIETS */}
      {activeTab === 'diets' && (
        <div>
          {diets.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 48 }}>💾</div>
              <p style={{ color: '#666' }}>No saved diets yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {diets.map(diet => (
                <div key={diet.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0' }}>{diet.name}</h4>
                      <div style={{ fontSize: 14, color: '#666' }}>{diet.targetAnimal}</div>
                    </div>
                    <button onClick={() => setDiets(diets.filter(d => d.id !== diet.id))} style={{ color: '#dc2626' }}>Delete</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16, fontSize: 13 }}>
                    <div><strong>DM:</strong> {diet.analysis.DM.toFixed(1)} kg</div>
                    <div><strong>CP:</strong> {diet.analysis.CP.toFixed(1)}%</div>
                    <div><strong>NEL:</strong> {diet.analysis.NEL.toFixed(2)}</div>
                    <div><strong>ME:</strong> {diet.analysis.ME.toFixed(1)} MJ/kg</div>
                    <div><strong>Ca:</strong> {diet.analysis.Ca.toFixed(2)}%</div>
                    <div><strong>P:</strong> {diet.analysis.P.toFixed(2)}%</div>
                    <div><strong>Cost:</strong> KES {diet.analysis.costPerKg.toFixed(2)}/kg</div>
                  </div>
                  <details style={{ marginTop: 12 }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Ingredients ({diet.ingredients.length})</summary>
                    <div style={{ marginTop: 8 }}>
                      {diet.ingredients.map(ing => (
                        <div key={ing.id} style={{ fontSize: 13, padding: '4px 0' }}>
                          {ing.name}: {ing.amount} kg ({((ing.amount / diet.analysis.total) * 100).toFixed(1)}%)
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RATION ASSIGNMENT */}
      {activeTab === 'rations' && (
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h4>Assign Ration to Animals</h4>
            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              <input
                type="text"
                placeholder="Ration name..."
                value={rationName}
                onChange={e => setRationName(e.target.value)}
              />
              <select value={selectedDiet} onChange={e => setSelectedDiet(e.target.value)}>
                <option value="">-- Select Diet --</option>
                {diets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <div>
                <label>Select Animals</label>
                <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid #e5e7eb', padding: 8, borderRadius: 4 }}>
                  {(animals || []).map(a => (
                    <label key={a.id} style={{ display: 'block', padding: 4 }}>
                      <input
                        type="checkbox"
                        checked={selectedAnimals.includes(a.id)}
                        onChange={e => {
                          if(e.target.checked) setSelectedAnimals([...selectedAnimals, a.id])
                          else setSelectedAnimals(selectedAnimals.filter(id => id !== a.id))
                        }}
                      />
                      {' '}{a.name || a.tag} ({a.breed})
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={createRation}>Create Ration</button>
            </div>
          </div>

          {rations.length > 0 && (
            <div style={{ display: 'grid', gap: 12 }}>
              {rations.map(r => (
                <div key={r.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <h5 style={{ margin: 0 }}>{r.name}</h5>
                      <div style={{ fontSize: 13, color: '#666' }}>Diet: {r.dietName}</div>
                      <div style={{ fontSize: 13, color: '#666' }}>{r.animals.length} animals assigned</div>
                    </div>
                    <button onClick={() => setRations(rations.filter(rat => rat.id !== r.id))} style={{ color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REPORTS */}
      {activeTab === 'reports' && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>📊</div>
          <h4>Reports & Analytics</h4>
          <p style={{ color: '#666' }}>Feed cost analysis, nutrient balance reports coming soon</p>
        </div>
      )}
    </section>
  )
}
