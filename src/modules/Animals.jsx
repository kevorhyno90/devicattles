import React, { useEffect, useState, useRef } from 'react'
import Pastures from './Pastures'
import HealthSystem from './HealthSystem'
import AnimalFeeding from './AnimalFeeding'
import AnimalMeasurement from './AnimalMeasurement'
import AnimalBreeding from './AnimalBreeding'
import AnimalMilkYield from './AnimalMilkYield'
import AnimalTreatment from './AnimalTreatment'
import CalfManagement from './CalfManagement'
import BSFFarming from './BSFFarming'
import AzollaFarming from './AzollaFarming'
import PoultryManagement from './PoultryManagement'
import CanineManagement from './CanineManagement'
import PhotoGallery from '../components/PhotoGallery'
import { fileToDataUrl, estimateDataUrlSize, uid } from '../lib/image'
import { exportToCSV, exportToExcel, exportToJSON, importFromCSV, importFromJSON, batchPrint } from '../lib/exportImport'
import { generateQRCodeDataURL, printQRTag, batchPrintQRTags } from '../lib/qrcode'

// Realized Animals component: HTML5 controls, inline validation, unique tag checks,
// realistic sample data, and non-placeholder behavior.
export default function Animals() {
  // Track expanded/collapsed state for group details
  const [expandedGroups, setExpandedGroups] = useState([])
  const AKEY = 'cattalytics:animals'
  const GKEY = 'cattalytics:groups'

  // Default groups for first load, but allow adding/removing
  const DEFAULT_GROUPS = [
    { id: 'G-001', name: 'Bovine', desc: 'Cattle, dairy cows, beef cattle, and related breeds.' },
    { id: 'G-002', name: 'Porcine', desc: 'Pigs, hogs, swine, and related breeds.' },
    { id: 'G-003', name: 'Caprine', desc: 'Goats, dairy goats, meat goats, and related breeds.' },
    { id: 'G-004', name: 'Ovine', desc: 'Sheep, lambs, wool sheep, and related breeds.' },
    { id: 'G-005', name: 'Equine', desc: 'Horses, donkeys, mules, ponies, and related breeds.' },
    { id: 'G-006', name: 'Camelids', desc: 'Camels, alpacas, llamas, and related breeds.' },
    { id: 'G-007', name: 'Avians', desc: 'Poultry: chickens, turkeys, ducks, geese, quail, and other birds.' },
    { id: 'G-008', name: 'Canines', desc: 'Dogs, working canines, guard dogs, and related breeds.' },
    { id: 'G-009', name: 'Aquaculture', desc: 'Fish, shrimp, and other aquatic livestock.' },
    { id: 'G-010', name: 'Insects', desc: 'Bees, black soldier flies, and other farmed insects.' }
  ]

  const SAMPLE_ANIMALS = [
    // 11 Heifers (Young females, never calved, not pregnant)
    { id: 'A-001', tag: 'TAG1001', name: 'Daisy', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2024-03-15', weight: 320, sire: 'S-100', dam: 'D-200', groupId: 'G-001', status: 'Active', notes: 'Growing well, excellent conformation', owner: 'Farm Owner', registration: 'REG-1001', tattoo: 'H-01', purchaseDate: '2024-03-20', purchasePrice: 85000, vendor: 'Valley Farms', tags: ['heifer','priority','breeding'], photo: '', photos: [], pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 0, lactationStatus: 'Heifer',
      production: {
        milk: { totalLifetime: 0, currentLactation: 0, peakYield: 0, averageDaily: 0, lastRecorded: '' },
        eggs: { totalLifetime: 0, currentYear: 0, averageDaily: 0, lastRecorded: '' },
        meat: { expectedYield: 0, dressedWeight: 0, gradingScore: '' },
        wool: { totalLifetime: 0, lastShearing: '', averageYield: 0, quality: '' },
        work: { hoursWorked: 0, tasksCompleted: 0, efficiency: '' },
        offspring: { totalBorn: 0, totalWeaned: 0, totalSurvived: 0 }
      },
      genetics: { pedigree: 'Holstein-Friesian Elite Line', sireLineage: 'Champion Bull S-100', damLineage: 'High Producer D-200', dnaMarkers: 'A2A2, BB, Polled carrier', breedingValue: '+2850 NM$', geneticDefects: [], inbreedingCoefficient: 0.03, expectedProgenyDifference: { milk: '+1200kg', fat: '+45kg', protein: '+38kg' }, genomicEvaluation: 'TPI: 2750' },
      location: { barn: 'Heifer Barn 1', pen: 'H-12', pasture: 'North Pasture', stall: '', paddock: 'P-5', lastMoved: '2024-11-15', preferredLocation: 'Shaded area' },
      health: {
        vaccinations: [{date: '2024-04-01', vaccine: 'IBR/BVD', veterinarian: 'Dr. Kamau', nextDue: '2025-04-01'}],
        treatments: [],
        diagnoses: [],
        allergies: [],
        chronicConditions: [],
        lastVetVisit: '2024-11-20',
        nextVetVisit: '2025-02-20',
        bodyConditionScore: 3.5,
        healthStatus: 'Excellent',
        quarantineStatus: 'None'
      },
      financial: {
        acquisitionCost: 85000,
        currentValue: 120000,
        insuranceValue: 100000,
        maintenanceCost: 15000,
        productionRevenue: 0,
        feedCost: 12000,
        veterinaryCost: 3000,
        roi: 0,
        profitLoss: -15000
      },
      documentation: {
        insurancePolicy: 'POL-2024-H001',
        insuranceProvider: 'Kenya Livestock Insurance',
        insuranceExpiry: '2025-03-20',
        microchipId: 'KE-982-000001234',
        passportNumber: '',
        healthCertificate: 'HC-2024-001',
        importExportPermits: [],
        birthCertificate: 'BC-VAL-2024-001',
        registrationPapers: ['Holstein Association of Kenya']
      },
      certifications: {
        organic: false,
        freeRange: true,
        grassFed: true,
        animalWelfare: 'Gold Standard',
        showAwards: [],
        breedingCertifications: ['Elite Genetics Program'],
        qualityGrades: ['Premium']
      },
      behavior: {
        temperament: 'Calm',
        trainingLevel: 'Basic halter trained',
        specialNeeds: [],
        behaviorNotes: 'Very gentle, easy to handle',
        handlingDifficulty: 'Easy',
        socialization: 'Excellent with herd'
      },
      nutrition: {
        currentDiet: 'Heifer Grower Ration',
        feedingSchedule: 'Twice daily',
        specialDiet: '',
        supplements: ['Mineral mix', 'Vitamin A/D'],
        waterIntake: 'Ad libitum',
        nutritionNotes: 'Good appetite, consistent growth'
      },
      performance: {
        growthRate: 0.85,
        feedConversionRatio: 6.2,
        reproductiveEfficiency: 0,
        productionEfficiency: 0,
        overallScore: 85
      },
      events: [
        {id: 'E-001', date: '2024-03-20', type: 'Purchase', description: 'Acquired from Valley Farms', cost: 85000},
        {id: 'E-002', date: '2024-04-01', type: 'Vaccination', description: 'IBR/BVD vaccination', cost: 500},
        {id: 'E-003', date: '2024-06-15', type: 'Weighing', description: 'Weight: 250kg', cost: 0},
        {id: 'E-004', date: '2024-09-10', type: 'Weighing', description: 'Weight: 290kg', cost: 0},
        {id: 'E-005', date: '2024-11-15', type: 'Movement', description: 'Moved to North Pasture', cost: 0},
        {id: 'E-006', date: '2024-11-20', type: 'Health Check', description: 'Routine vet inspection - healthy', cost: 1500}
      ]
    },
    { id: 'A-002', tag: 'TAG1002', name: 'Bella', breed: 'Jersey', sex: 'F', color: 'Brown', dob: '2024-02-10', weight: 305, sire: 'S-101', dam: 'D-201', groupId: 'G-001', status: 'Active', notes: 'Ready for breeding soon', owner: 'Farm Owner', registration: 'REG-1002', tattoo: 'H-02', purchaseDate: '2024-02-15', purchasePrice: 80000, vendor: 'Green Pastures', tags: ['heifer'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 0, lactationStatus: 'Heifer' },
    { id: 'A-003', tag: 'TAG1003', name: 'Luna', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2024-04-05', weight: 295, sire: 'S-102', dam: 'D-202', groupId: 'G-001', status: 'Active', notes: '', owner: 'Farm Owner', registration: 'REG-1003', tattoo: 'H-03', purchaseDate: '2024-04-10', purchasePrice: 82000, vendor: 'Valley Farms', tags: ['heifer'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 0, lactationStatus: 'Heifer' },
    { id: 'A-004', tag: 'TAG1004', name: 'Rose', breed: 'Guernsey', sex: 'F', color: 'Fawn/White', dob: '2024-01-20', weight: 340, sire: 'S-103', dam: 'D-203', groupId: 'G-001', status: 'Active', notes: 'Good conformation', owner: 'Farm Owner', registration: 'REG-1004', tattoo: 'H-04', purchaseDate: '2024-01-25', purchasePrice: 78000, vendor: 'Sunrise Ranch', tags: ['heifer'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 0, lactationStatus: 'Heifer' },
    { id: 'A-005', tag: 'TAG1005', name: 'Willow', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2024-05-12', weight: 285, sire: 'S-100', dam: 'D-204', groupId: 'G-001', status: 'Active', notes: '', owner: 'Farm Owner', registration: 'REG-1005', tattoo: 'H-05', purchaseDate: '2024-05-15', purchasePrice: 83000, vendor: 'Valley Farms', tags: ['heifer'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 0, lactationStatus: 'Heifer' },
    { id: 'A-006', tag: 'TAG1006', name: 'Hazel', breed: 'Jersey', sex: 'F', color: 'Brown', dob: '2024-03-28', weight: 310, sire: 'S-101', dam: 'D-205', groupId: 'G-001', status: 'Active', notes: 'Excellent temperament', owner: 'Farm Owner', registration: 'REG-1006', tattoo: 'H-06', purchaseDate: '2024-04-01', purchasePrice: 81000, vendor: 'Green Pastures', tags: ['heifer'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 0, lactationStatus: 'Heifer' },
    { id: 'A-007', tag: 'TAG1007', name: 'Clover', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2024-02-18', weight: 325, sire: 'S-102', dam: 'D-206', groupId: 'G-001', status: 'Active', notes: '', owner: 'Farm Owner', registration: 'REG-1007', tattoo: 'H-07', purchaseDate: '2024-02-22', purchasePrice: 84000, vendor: 'Valley Farms', tags: ['heifer'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 0, lactationStatus: 'Heifer' },
    { id: 'A-008', tag: 'TAG1008', name: 'Maple', breed: 'Ayrshire', sex: 'F', color: 'Red/White', dob: '2024-04-22', weight: 300, sire: 'S-104', dam: 'D-207', groupId: 'G-001', status: 'Active', notes: 'Strong build', owner: 'Farm Owner', registration: 'REG-1008', tattoo: 'H-08', purchaseDate: '2024-04-25', purchasePrice: 79000, vendor: 'Highland Dairy', tags: ['heifer'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 0, lactationStatus: 'Heifer' },
    { id: 'A-009', tag: 'TAG1009', name: 'Ivy', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2024-01-08', weight: 345, sire: 'S-100', dam: 'D-208', groupId: 'G-001', status: 'Active', notes: 'Ready for first breeding', owner: 'Farm Owner', registration: 'REG-1009', tattoo: 'H-09', purchaseDate: '2024-01-12', purchasePrice: 86000, vendor: 'Valley Farms', tags: ['heifer'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 0, lactationStatus: 'Heifer' },
    { id: 'A-010', tag: 'TAG1010', name: 'Poppy', breed: 'Jersey', sex: 'F', color: 'Brown', dob: '2024-03-05', weight: 315, sire: 'S-101', dam: 'D-209', groupId: 'G-001', status: 'Active', notes: '', owner: 'Farm Owner', registration: 'REG-1010', tattoo: 'H-10', purchaseDate: '2024-03-08', purchasePrice: 80500, vendor: 'Green Pastures', tags: ['heifer'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 0, lactationStatus: 'Heifer' },
    { id: 'A-011', tag: 'TAG1011', name: 'Sage', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2024-02-25', weight: 318, sire: 'S-102', dam: 'D-210', groupId: 'G-001', status: 'Active', notes: 'Good growth rate', owner: 'Farm Owner', registration: 'REG-1011', tattoo: 'H-11', purchaseDate: '2024-03-01', purchasePrice: 82500, vendor: 'Valley Farms', tags: ['heifer'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 0, lactationStatus: 'Heifer' },

    // 5 In-Calf (Pregnant cows)
    { id: 'A-012', tag: 'TAG1012', name: 'Bessie', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2021-05-10', weight: 580, sire: 'S-100', dam: 'D-220', groupId: 'G-001', status: 'Active', notes: 'Due in March 2026', owner: 'Farm Owner', registration: 'REG-1012', tattoo: 'C-01', purchaseDate: '2021-06-01', purchasePrice: 150000, vendor: 'Premium Genetics', tags: ['pregnant','priority'], photo: '', pregnancyStatus: 'Pregnant', expectedDue: '2026-03-15', parity: 2, lactationStatus: 'Dry' },
    { id: 'A-013', tag: 'TAG1013', name: 'Matilda', breed: 'Jersey', sex: 'F', color: 'Brown', dob: '2020-08-22', weight: 480, sire: 'S-101', dam: 'D-221', groupId: 'G-001', status: 'Active', notes: 'Due in February 2026', owner: 'Farm Owner', registration: 'REG-1013', tattoo: 'C-02', purchaseDate: '2020-09-10', purchasePrice: 145000, vendor: 'Green Pastures', tags: ['pregnant'], photo: '', pregnancyStatus: 'Pregnant', expectedDue: '2026-02-20', parity: 3, lactationStatus: 'Dry' },
    { id: 'A-014', tag: 'TAG1014', name: 'Rosie', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2022-03-15', weight: 545, sire: 'S-102', dam: 'D-222', groupId: 'G-001', status: 'Active', notes: 'Due in April 2026', owner: 'Farm Owner', registration: 'REG-1014', tattoo: 'C-03', purchaseDate: '2022-04-05', purchasePrice: 148000, vendor: 'Valley Farms', tags: ['pregnant'], photo: '', pregnancyStatus: 'Pregnant', expectedDue: '2026-04-10', parity: 1, lactationStatus: 'Dry' },
    { id: 'A-015', tag: 'TAG1015', name: 'Buttercup', breed: 'Guernsey', sex: 'F', color: 'Fawn/White', dob: '2021-11-08', weight: 510, sire: 'S-103', dam: 'D-223', groupId: 'G-001', status: 'Active', notes: 'Due in January 2026', owner: 'Farm Owner', registration: 'REG-1015', tattoo: 'C-04', purchaseDate: '2021-12-01', purchasePrice: 142000, vendor: 'Sunrise Ranch', tags: ['pregnant'], photo: '', pregnancyStatus: 'Pregnant', expectedDue: '2026-01-25', parity: 2, lactationStatus: 'Dry' },
    { id: 'A-016', tag: 'TAG1016', name: 'Pearl', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2020-12-18', weight: 595, sire: 'S-100', dam: 'D-224', groupId: 'G-001', status: 'Active', notes: 'Due in March 2026, excellent genetics', owner: 'Farm Owner', registration: 'REG-1016', tattoo: 'C-05', purchaseDate: '2021-01-15', purchasePrice: 155000, vendor: 'Premium Genetics', tags: ['pregnant','priority'], photo: '', pregnancyStatus: 'Pregnant', expectedDue: '2026-03-05', parity: 3, lactationStatus: 'Dry' },

    // 9 Dry Cows (Not pregnant, not lactating)
    { id: 'A-017', tag: 'TAG1017', name: 'Molly', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2019-06-12', weight: 620, sire: 'S-100', dam: 'D-230', groupId: 'G-001', status: 'Active', notes: 'Recently dried off', owner: 'Farm Owner', registration: 'REG-1017', tattoo: 'D-01', purchaseDate: '2019-07-05', purchasePrice: 165000, vendor: 'Valley Farms', tags: ['dry'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 4, lactationStatus: 'Dry' },
    { id: 'A-018', tag: 'TAG1018', name: 'Sunshine', breed: 'Jersey', sex: 'F', color: 'Brown', dob: '2020-04-20', weight: 485, sire: 'S-101', dam: 'D-231', groupId: 'G-001', status: 'Active', notes: 'Ready for breeding', owner: 'Farm Owner', registration: 'REG-1018', tattoo: 'D-02', purchaseDate: '2020-05-10', purchasePrice: 138000, vendor: 'Green Pastures', tags: ['dry'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 2, lactationStatus: 'Dry' },
    { id: 'A-019', tag: 'TAG1019', name: 'Daisy Mae', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2021-02-08', weight: 560, sire: 'S-102', dam: 'D-232', groupId: 'G-001', status: 'Active', notes: '', owner: 'Farm Owner', registration: 'REG-1019', tattoo: 'D-03', purchaseDate: '2021-03-01', purchasePrice: 152000, vendor: 'Valley Farms', tags: ['dry'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 2, lactationStatus: 'Dry' },
    { id: 'A-020', tag: 'TAG1020', name: 'Clementine', breed: 'Ayrshire', sex: 'F', color: 'Red/White', dob: '2019-09-15', weight: 575, sire: 'S-104', dam: 'D-233', groupId: 'G-001', status: 'Active', notes: 'Resting period', owner: 'Farm Owner', registration: 'REG-1020', tattoo: 'D-04', purchaseDate: '2019-10-05', purchasePrice: 148000, vendor: 'Highland Dairy', tags: ['dry'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 3, lactationStatus: 'Dry' },
    { id: 'A-021', tag: 'TAG1021', name: 'Violet', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2020-07-25', weight: 590, sire: 'S-100', dam: 'D-234', groupId: 'G-001', status: 'Active', notes: 'Good health', owner: 'Farm Owner', registration: 'REG-1021', tattoo: 'D-05', purchaseDate: '2020-08-15', purchasePrice: 158000, vendor: 'Valley Farms', tags: ['dry'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 3, lactationStatus: 'Dry' },
    { id: 'A-022', tag: 'TAG1022', name: 'Ginger', breed: 'Jersey', sex: 'F', color: 'Brown', dob: '2021-05-18', weight: 470, sire: 'S-101', dam: 'D-235', groupId: 'G-001', status: 'Active', notes: '', owner: 'Farm Owner', registration: 'REG-1022', tattoo: 'D-06', purchaseDate: '2021-06-08', purchasePrice: 140000, vendor: 'Green Pastures', tags: ['dry'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 2, lactationStatus: 'Dry' },
    { id: 'A-023', tag: 'TAG1023', name: 'Magnolia', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2019-11-30', weight: 610, sire: 'S-102', dam: 'D-236', groupId: 'G-001', status: 'Active', notes: 'Experienced cow', owner: 'Farm Owner', registration: 'REG-1023', tattoo: 'D-07', purchaseDate: '2020-01-10', purchasePrice: 162000, vendor: 'Valley Farms', tags: ['dry'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 4, lactationStatus: 'Dry' },
    { id: 'A-024', tag: 'TAG1024', name: 'Honey', breed: 'Guernsey', sex: 'F', color: 'Fawn/White', dob: '2020-10-05', weight: 520, sire: 'S-103', dam: 'D-237', groupId: 'G-001', status: 'Active', notes: 'Sweet temperament', owner: 'Farm Owner', registration: 'REG-1024', tattoo: 'D-08', purchaseDate: '2020-11-01', purchasePrice: 145000, vendor: 'Sunrise Ranch', tags: ['dry'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 3, lactationStatus: 'Dry' },
    { id: 'A-025', tag: 'TAG1025', name: 'Bluebell', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2021-08-14', weight: 555, sire: 'S-100', dam: 'D-238', groupId: 'G-001', status: 'Active', notes: '', owner: 'Farm Owner', registration: 'REG-1025', tattoo: 'D-09', purchaseDate: '2021-09-05', purchasePrice: 151000, vendor: 'Valley Farms', tags: ['dry'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 2, lactationStatus: 'Dry' },

    // 20 Chickens - Flock 1
    { id: 'A-026', tag: 'CHICK-001', name: 'Chicken Flock 1', breed: 'Rhode Island Red', sex: 'F', color: 'Red/Brown', dob: '2024-08-15', weight: 2.5, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Layer hen', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-20', purchasePrice: 800, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', photos: [], pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA',
      production: { eggs: 0, meat: 0 },
      genetics: { pedigree: '', dnaMarkers: '' },
      location: { pen: '', pasture: '' },
      events: []
    },
    { id: 'A-027', tag: 'CHICK-002', name: 'Chicken Flock 2', breed: 'Rhode Island Red', sex: 'F', color: 'Red/Brown', dob: '2024-08-15', weight: 2.4, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Layer hen', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-20', purchasePrice: 800, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-028', tag: 'CHICK-003', name: 'Chicken Flock 3', breed: 'Leghorn', sex: 'F', color: 'White', dob: '2024-08-10', weight: 2.2, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'High egg production', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-15', purchasePrice: 850, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-029', tag: 'CHICK-004', name: 'Chicken Flock 4', breed: 'Leghorn', sex: 'F', color: 'White', dob: '2024-08-10', weight: 2.3, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'High egg production', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-15', purchasePrice: 850, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-030', tag: 'CHICK-005', name: 'Chicken Flock 5', breed: 'Plymouth Rock', sex: 'F', color: 'Barred', dob: '2024-08-18', weight: 2.6, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Dual purpose', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-22', purchasePrice: 900, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-031', tag: 'CHICK-006', name: 'Chicken Flock 6', breed: 'Plymouth Rock', sex: 'F', color: 'Barred', dob: '2024-08-18', weight: 2.5, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Dual purpose', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-22', purchasePrice: 900, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-032', tag: 'CHICK-007', name: 'Chicken Flock 7', breed: 'Sussex', sex: 'F', color: 'Brown', dob: '2024-08-12', weight: 2.7, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Good layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-17', purchasePrice: 820, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-033', tag: 'CHICK-008', name: 'Chicken Flock 8', breed: 'Sussex', sex: 'F', color: 'Brown', dob: '2024-08-12', weight: 2.6, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Good layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-17', purchasePrice: 820, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-034', tag: 'CHICK-009', name: 'Chicken Flock 9', breed: 'Rhode Island Red', sex: 'F', color: 'Red/Brown', dob: '2024-08-15', weight: 2.5, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Layer hen', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-20', purchasePrice: 800, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-035', tag: 'CHICK-010', name: 'Chicken Flock 10', breed: 'Rhode Island Red', sex: 'F', color: 'Red/Brown', dob: '2024-08-15', weight: 2.4, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Layer hen', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-20', purchasePrice: 800, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-036', tag: 'CHICK-011', name: 'Chicken Flock 11', breed: 'Leghorn', sex: 'F', color: 'White', dob: '2024-08-10', weight: 2.3, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'High egg production', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-15', purchasePrice: 850, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-037', tag: 'CHICK-012', name: 'Chicken Flock 12', breed: 'Leghorn', sex: 'F', color: 'White', dob: '2024-08-10', weight: 2.2, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'High egg production', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-15', purchasePrice: 850, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-038', tag: 'CHICK-013', name: 'Chicken Flock 13', breed: 'Plymouth Rock', sex: 'F', color: 'Barred', dob: '2024-08-18', weight: 2.5, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Dual purpose', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-22', purchasePrice: 900, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-039', tag: 'CHICK-014', name: 'Chicken Flock 14', breed: 'Plymouth Rock', sex: 'F', color: 'Barred', dob: '2024-08-18', weight: 2.6, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Dual purpose', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-22', purchasePrice: 900, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-040', tag: 'CHICK-015', name: 'Chicken Flock 15', breed: 'Sussex', sex: 'F', color: 'Brown', dob: '2024-08-12', weight: 2.7, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Good layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-17', purchasePrice: 820, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-041', tag: 'CHICK-016', name: 'Chicken Flock 16', breed: 'Sussex', sex: 'F', color: 'Brown', dob: '2024-08-12', weight: 2.6, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Good layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-17', purchasePrice: 820, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-042', tag: 'CHICK-017', name: 'Chicken Flock 17', breed: 'Rhode Island Red', sex: 'M', color: 'Red/Brown', dob: '2024-08-15', weight: 3.2, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Rooster', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-20', purchasePrice: 900, vendor: 'Poultry Farm', tags: ['flock','rooster'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-043', tag: 'CHICK-018', name: 'Chicken Flock 18', breed: 'Rhode Island Red', sex: 'F', color: 'Red/Brown', dob: '2024-08-15', weight: 2.4, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Layer hen', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-20', purchasePrice: 800, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-044', tag: 'CHICK-019', name: 'Chicken Flock 19', breed: 'Leghorn', sex: 'F', color: 'White', dob: '2024-08-10', weight: 2.3, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'High egg production', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-15', purchasePrice: 850, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-045', tag: 'CHICK-020', name: 'Chicken Flock 20', breed: 'Plymouth Rock', sex: 'F', color: 'Barred', dob: '2024-08-18', weight: 2.5, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Dual purpose', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-08-22', purchasePrice: 900, vendor: 'Poultry Farm', tags: ['flock','layers'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },

    // 22 Ducks - Flock
    { id: 'A-046', tag: 'DUCK-001', name: 'Duck Flock 1', breed: 'Pekin', sex: 'F', color: 'White', dob: '2024-07-20', weight: 3.2, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Egg layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-25', purchasePrice: 1200, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', photos: [], pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA',
      production: { eggs: 0, meat: 0 },
      genetics: { pedigree: '', dnaMarkers: '' },
      location: { pen: '', pasture: '' },
      events: []
    },
    { id: 'A-047', tag: 'DUCK-002', name: 'Duck Flock 2', breed: 'Pekin', sex: 'F', color: 'White', dob: '2024-07-20', weight: 3.1, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Egg layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-25', purchasePrice: 1200, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-048', tag: 'DUCK-003', name: 'Duck Flock 3', breed: 'Khaki Campbell', sex: 'F', color: 'Khaki', dob: '2024-07-15', weight: 2.8, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Excellent layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-20', purchasePrice: 1300, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-049', tag: 'DUCK-004', name: 'Duck Flock 4', breed: 'Khaki Campbell', sex: 'F', color: 'Khaki', dob: '2024-07-15', weight: 2.9, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Excellent layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-20', purchasePrice: 1300, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-050', tag: 'DUCK-005', name: 'Duck Flock 5', breed: 'Muscovy', sex: 'F', color: 'Black/White', dob: '2024-07-10', weight: 3.5, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Meat/Egg bird', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-15', purchasePrice: 1400, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-051', tag: 'DUCK-006', name: 'Duck Flock 6', breed: 'Muscovy', sex: 'F', color: 'Black/White', dob: '2024-07-10', weight: 3.4, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Meat/Egg bird', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-15', purchasePrice: 1400, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-052', tag: 'DUCK-007', name: 'Duck Flock 7', breed: 'Pekin', sex: 'F', color: 'White', dob: '2024-07-20', weight: 3.3, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Egg layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-25', purchasePrice: 1200, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-053', tag: 'DUCK-008', name: 'Duck Flock 8', breed: 'Pekin', sex: 'F', color: 'White', dob: '2024-07-20', weight: 3.2, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Egg layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-25', purchasePrice: 1200, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-054', tag: 'DUCK-009', name: 'Duck Flock 9', breed: 'Khaki Campbell', sex: 'F', color: 'Khaki', dob: '2024-07-15', weight: 2.8, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Excellent layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-20', purchasePrice: 1300, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-055', tag: 'DUCK-010', name: 'Duck Flock 10', breed: 'Khaki Campbell', sex: 'F', color: 'Khaki', dob: '2024-07-15', weight: 2.9, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Excellent layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-20', purchasePrice: 1300, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-056', tag: 'DUCK-011', name: 'Duck Flock 11', breed: 'Muscovy', sex: 'M', color: 'Black/White', dob: '2024-07-10', weight: 4.5, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Drake', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-15', purchasePrice: 1500, vendor: 'Waterfowl Farm', tags: ['flock','ducks','drake'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-057', tag: 'DUCK-012', name: 'Duck Flock 12', breed: 'Pekin', sex: 'F', color: 'White', dob: '2024-07-20', weight: 3.1, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Egg layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-25', purchasePrice: 1200, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-058', tag: 'DUCK-013', name: 'Duck Flock 13', breed: 'Pekin', sex: 'F', color: 'White', dob: '2024-07-20', weight: 3.2, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Egg layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-25', purchasePrice: 1200, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-059', tag: 'DUCK-014', name: 'Duck Flock 14', breed: 'Khaki Campbell', sex: 'F', color: 'Khaki', dob: '2024-07-15', weight: 2.9, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Excellent layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-20', purchasePrice: 1300, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-060', tag: 'DUCK-015', name: 'Duck Flock 15', breed: 'Khaki Campbell', sex: 'F', color: 'Khaki', dob: '2024-07-15', weight: 2.8, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Excellent layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-20', purchasePrice: 1300, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-061', tag: 'DUCK-016', name: 'Duck Flock 16', breed: 'Muscovy', sex: 'F', color: 'Black/White', dob: '2024-07-10', weight: 3.6, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Meat/Egg bird', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-15', purchasePrice: 1400, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-062', tag: 'DUCK-017', name: 'Duck Flock 17', breed: 'Muscovy', sex: 'F', color: 'Black/White', dob: '2024-07-10', weight: 3.5, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Meat/Egg bird', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-15', purchasePrice: 1400, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-063', tag: 'DUCK-018', name: 'Duck Flock 18', breed: 'Pekin', sex: 'M', color: 'White', dob: '2024-07-20', weight: 4.2, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Drake', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-25', purchasePrice: 1400, vendor: 'Waterfowl Farm', tags: ['flock','ducks','drake'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-064', tag: 'DUCK-019', name: 'Duck Flock 19', breed: 'Pekin', sex: 'F', color: 'White', dob: '2024-07-20', weight: 3.1, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Egg layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-25', purchasePrice: 1200, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-065', tag: 'DUCK-020', name: 'Duck Flock 20', breed: 'Khaki Campbell', sex: 'F', color: 'Khaki', dob: '2024-07-15', weight: 2.9, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Excellent layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-20', purchasePrice: 1300, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-066', tag: 'DUCK-021', name: 'Duck Flock 21', breed: 'Muscovy', sex: 'F', color: 'Black/White', dob: '2024-07-10', weight: 3.4, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Meat/Egg bird', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-15', purchasePrice: 1400, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-067', tag: 'DUCK-022', name: 'Duck Flock 22', breed: 'Pekin', sex: 'F', color: 'White', dob: '2024-07-20', weight: 3.2, sire: '', dam: '', groupId: 'G-007', status: 'Active', notes: 'Egg layer', owner: 'Farm Owner', registration: '', tattoo: '', purchaseDate: '2024-07-25', purchasePrice: 1200, vendor: 'Waterfowl Farm', tags: ['flock','ducks'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },

    // 4 Dogs - Canine group
    { id: 'A-068', tag: 'DOG-001', name: 'Max', breed: 'German Shepherd', sex: 'M', color: 'Black/Tan', dob: '2022-04-15', weight: 38, sire: '', dam: '', groupId: 'G-008', status: 'Active', notes: 'Guardian dog, excellent temperament', owner: 'Farm Owner', registration: 'CAN-2022-001', tattoo: '', purchaseDate: '2022-06-01', purchasePrice: 25000, vendor: 'Working Dogs Kenya', tags: ['guard','trained'], photo: '', photos: [], pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA',
      production: { work: '', service: '' },
      genetics: { pedigree: '', dnaMarkers: '' },
      location: { pen: '', pasture: '' },
      events: []
    },
    { id: 'A-069', tag: 'DOG-002', name: 'Bella', breed: 'Border Collie', sex: 'F', color: 'Black/White', dob: '2023-02-10', weight: 22, sire: '', dam: '', groupId: 'G-008', status: 'Active', notes: 'Herding dog, very intelligent', owner: 'Farm Owner', registration: 'CAN-2023-002', tattoo: '', purchaseDate: '2023-03-15', purchasePrice: 28000, vendor: 'Working Dogs Kenya', tags: ['herding','trained'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-070', tag: 'DOG-003', name: 'Duke', breed: 'Rottweiler', sex: 'M', color: 'Black/Tan', dob: '2021-09-20', weight: 45, sire: '', dam: '', groupId: 'G-008', status: 'Active', notes: 'Security dog, well trained', owner: 'Farm Owner', registration: 'CAN-2021-003', tattoo: '', purchaseDate: '2021-11-05', purchasePrice: 30000, vendor: 'Security Dogs Ltd', tags: ['guard','security'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' },
    { id: 'A-071', tag: 'DOG-004', name: 'Luna', breed: 'Australian Shepherd', sex: 'F', color: 'Blue Merle', dob: '2023-06-12', weight: 25, sire: '', dam: '', groupId: 'G-008', status: 'Active', notes: 'Herding and companion dog', owner: 'Farm Owner', registration: 'CAN-2023-004', tattoo: '', purchaseDate: '2023-07-20', purchasePrice: 27000, vendor: 'Working Dogs Kenya', tags: ['herding','companion'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' }
  ]

  const [tab, setTab] = useState('list')
  const [formTab, setFormTab] = useState('basic') // New: for multi-tab animal form
  const [animals, setAnimals] = useState([])
  const [groups, setGroups] = useState([])
  const [filter, setFilter] = useState('')
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSex, setFilterSex] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  const emptyAnimal = { 
    id: '', tag: '', name: '', breed: '', sex: 'F', color: '', dob: '', weight: '', sire: '', dam: '', groupId: '', status: 'Active', notes: '', owner: '', registration: '', tattoo: '', purchaseDate: '', purchasePrice: '', vendor: '', tags: [], photo: '', photos: [], 
    pregnancyStatus: 'Unknown', expectedDue: '', parity: '', lactationStatus: 'NA',
    // Production Metrics
    production: {
      milk: { totalLifetime: 0, currentLactation: 0, peakYield: 0, averageDaily: 0, lastRecorded: '' },
      eggs: { totalLifetime: 0, currentYear: 0, averageDaily: 0, lastRecorded: '' },
      meat: { expectedYield: 0, dressedWeight: 0, gradingScore: '' },
      wool: { totalLifetime: 0, lastShearing: '', averageYield: 0, quality: '' },
      work: { hoursWorked: 0, tasksCompleted: 0, efficiency: '' },
      offspring: { totalBorn: 0, totalWeaned: 0, totalSurvived: 0 }
    },
    // Genetics & Breeding
    genetics: { 
      pedigree: '', 
      sireLineage: '',
      damLineage: '',
      dnaMarkers: '', 
      breedingValue: '',
      geneticDefects: [],
      inbreedingCoefficient: 0,
      expectedProgenyDifference: {},
      genomicEvaluation: ''
    },
    // Location & Facilities
    location: { 
      barn: '',
      pen: '', 
      pasture: '',
      stall: '',
      paddock: '',
      lastMoved: '',
      preferredLocation: ''
    },
    // Health Records
    health: {
      vaccinations: [],
      treatments: [],
      diagnoses: [],
      allergies: [],
      chronicConditions: [],
      lastVetVisit: '',
      nextVetVisit: '',
      bodyConditionScore: 0,
      healthStatus: 'Healthy',
      quarantineStatus: 'None'
    },
    // Financial Tracking
    financial: {
      acquisitionCost: 0,
      currentValue: 0,
      insuranceValue: 0,
      maintenanceCost: 0,
      productionRevenue: 0,
      feedCost: 0,
      veterinaryCost: 0,
      roi: 0,
      profitLoss: 0
    },
    // Insurance & Documentation
    documentation: {
      insurancePolicy: '',
      insuranceProvider: '',
      insuranceExpiry: '',
      microchipId: '',
      passportNumber: '',
      healthCertificate: '',
      importExportPermits: [],
      birthCertificate: '',
      registrationPapers: []
    },
    // Certifications & Awards
    certifications: {
      organic: false,
      freeRange: false,
      grassFed: false,
      animalWelfare: '',
      showAwards: [],
      breedingCertifications: [],
      qualityGrades: []
    },
    // Behavior & Temperament
    behavior: {
      temperament: 'Calm',
      trainingLevel: 'None',
      specialNeeds: [],
      behaviorNotes: '',
      handlingDifficulty: 'Easy',
      socialization: 'Good'
    },
    // Feeding & Nutrition
    nutrition: {
      currentDiet: '',
      feedingSchedule: '',
      specialDiet: '',
      supplements: [],
      waterIntake: '',
      nutritionNotes: ''
    },
    // Performance Metrics
    performance: {
      growthRate: 0,
      feedConversionRatio: 0,
      reproductiveEfficiency: 0,
      productionEfficiency: 0,
      overallScore: 0
    },
    // Event History
    events: []
  }
  const [form, setForm] = useState(emptyAnimal)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})

  const [groupCategory, setGroupCategory] = useState('');
  const [customGroupName, setCustomGroupName] = useState('');
  const [groupName, setGroupName] = useState('');
  // Auto-fill group name when category changes, except for 'Other'
  useEffect(() => {
    if (groupCategory && groupCategory !== 'Other') {
      setGroupName(groupCategory);
    } else if (groupCategory === 'Other') {
      setGroupName(customGroupName);
    }
  }, [groupCategory, customGroupName]);
  const [groupDesc, setGroupDesc] = useState('')
  const [groupDateCreated, setGroupDateCreated] = useState('')
  const [groupDateUpdated, setGroupDateUpdated] = useState('')
  const [groupStartDate, setGroupStartDate] = useState('')
  const [groupEndDate, setGroupEndDate] = useState('')
  const [editingGroupId, setEditingGroupId] = useState(null)

  useEffect(() => {
    try {
      const rawA = localStorage.getItem(AKEY)
      let animalsList = rawA ? JSON.parse(rawA) : SAMPLE_ANIMALS;
      if (!animalsList || animalsList.length === 0) {
        animalsList = SAMPLE_ANIMALS;
        localStorage.setItem(AKEY, JSON.stringify(SAMPLE_ANIMALS));
      }
      setAnimals(animalsList);
      const rawG = localStorage.getItem(GKEY)
      setGroups(rawG ? JSON.parse(rawG) : DEFAULT_GROUPS)
    } catch (err) {
      console.error('Failed parsing stored data', err)
      setAnimals(SAMPLE_ANIMALS)
      setGroups(DEFAULT_GROUPS)
    }
  }, [])

  useEffect(() => localStorage.setItem(AKEY, JSON.stringify(animals)), [animals])
  useEffect(() => localStorage.setItem(GKEY, JSON.stringify(groups)), [groups])

  function validateAnimal(a) {
    const e = {}
    if (!a.name || !a.name.trim()) e.name = 'Name is required'
    if (a.dob) {
      const d = Date.parse(a.dob)
      if (Number.isNaN(d)) e.dob = 'Invalid date'
    }
    if (a.weight) {
      const w = Number(a.weight)
      if (Number.isNaN(w) || w < 0) e.weight = 'Weight must be a positive number'
    }
    if (a.purchaseDate) {
      const pd = Date.parse(a.purchaseDate)
      if (Number.isNaN(pd)) e.purchaseDate = 'Invalid purchase date'
    }
    if (a.purchasePrice) {
      const p = Number(a.purchasePrice)
      if (Number.isNaN(p) || p < 0) e.purchasePrice = 'Purchase price must be a positive number'
    }
    // tag uniqueness
    if (a.tag && animals.some(x => x.tag === a.tag && x.id !== a.id)) e.tag = 'Tag must be unique'
    return e
  }

  function resetForm() { setForm(emptyAnimal); setEditingId(null); setErrors({}) }

  const MAX_PHOTOS = 5
  const MAX_PHOTO_BYTES = 2 * 1024 * 1024 // 2 MB
  const MAX_DIM = 1024
  const JPG_QUALITY = 0.8

  async function handleFiles(selectedFiles) {
    if (!selectedFiles || !selectedFiles.length) return
    const current = Array.isArray(form.photos) ? [...form.photos] : []
    for (let i = 0; i < selectedFiles.length; i++) {
      if (current.length >= MAX_PHOTOS) break
      const f = selectedFiles[i]
      try {
        const { dataUrl, mime, size } = await fileToDataUrl(f, { maxDim: MAX_DIM, quality: JPG_QUALITY })
        if (size > MAX_PHOTO_BYTES) {
          window.alert(`${f.name} is too large after compression (${Math.round(size/1024)} KB). Skipping.`)
          continue
        }
        current.push({ id: uid('p-'), dataUrl, filename: f.name, mime, size, createdAt: new Date().toISOString() })
      } catch (err) {
        console.error('Failed processing image', err)
        window.alert('Failed to process ' + f.name)
      }
    }
    setForm(f => ({ ...f, photos: current }))
  }

  function handleFileInput(e){
    const files = e.target.files
    handleFiles(files)
    // reset input value so same file can be picked again
    e.target.value = ''
  }

  function removePhoto(photoId){
    setForm(f => ({ ...f, photos: (f.photos || []).filter(p => p.id !== photoId) }))
  }

  function saveAnimal(e) {
    e && e.preventDefault()
    const candidate = { ...form }
    if (!candidate.tag || !candidate.tag.trim()) candidate.tag = 'TAG' + (1000 + Math.floor(Math.random() * 9000))
    const eobj = validateAnimal(candidate)
    setErrors(eobj)
    if (Object.keys(eobj).length) return

    if (editingId) {
      // Update existing animal - regenerate QR code with updated data
      const updatedAnimal = { 
        ...candidate,
        id: editingId  // Preserve the ID
      }
      const qrData = {
        type: 'animal',
        id: editingId,
        name: updatedAnimal.name,
        tag: updatedAnimal.tag,
        breed: updatedAnimal.breed
      }
      updatedAnimal.qrCode = generateQRCodeDataURL(JSON.stringify(qrData))
      
      // Update the animal in the array, preserving fields not in the form
      setAnimals(animals.map(a => a.id === editingId ? { ...a, ...updatedAnimal } : a))
    } else {
      // Create new animal - generate ID and QR code
      const id = 'A-' + (1000 + Math.floor(Math.random() * 900000))
      // normalize tags: accept comma-separated string or array
      if (candidate.tags && typeof candidate.tags === 'string') candidate.tags = candidate.tags.split(',').map(t => t.trim()).filter(Boolean)
      
      // Generate QR code automatically
      const qrData = {
        type: 'animal',
        id: id,
        name: candidate.name,
        tag: candidate.tag,
        breed: candidate.breed
      }
      candidate.qrCode = generateQRCodeDataURL(JSON.stringify(qrData))
      
      setAnimals([...animals, { ...candidate, id }])
    }
    resetForm()
    setTab('list')
  }

  function startEditAnimal(a) {
    // Merge animal data with emptyAnimal to ensure all fields have values
    setForm({ ...emptyAnimal, ...a })
    setEditingId(a.id)
    setTab('addAnimal')
  }
  function deleteAnimal(id) { if (!window.confirm('Delete animal ' + id + '?')) return; setAnimals(animals.filter(a => a.id !== id)) }

  function resetGroupForm() {
    setGroupCategory('');
    setCustomGroupName('');
    setGroupDesc('');
    setGroupDateCreated(new Date().toISOString().slice(0,10));
    setGroupDateUpdated('');
    setGroupStartDate('');
    setGroupEndDate('');
    setEditingGroupId(null);
    setTab('addGroup');
  }

  function saveGroup(e) {
    e && e.preventDefault()
    let name = groupCategory !== 'Other' ? groupCategory : customGroupName.trim();
    if (!name) return;
    const now = new Date().toISOString().slice(0,10);
    if (editingGroupId) {
      setGroups(groups.map(g => g.id === editingGroupId ? {
        ...g,
        name,
        desc: groupDesc,
        dateCreated: g.dateCreated || groupDateCreated || now,
        dateUpdated: now,
        startDate: groupStartDate,
        endDate: groupEndDate
      } : g))
    } else {
      const id = 'G-' + (1000 + Math.floor(Math.random() * 900000));
      setGroups([...groups, {
        id,
        name,
        desc: groupDesc,
        dateCreated: groupDateCreated || now,
        dateUpdated: '',
        startDate: groupStartDate,
        endDate: groupEndDate
      }])
    }
    resetGroupForm();
    setTab('list');
  }

  function startEditGroup(g) { setEditingGroupId(g.id); setGroupName(g.name); setGroupDesc(g.desc); setTab('addGroup') }
  function deleteGroup(id) {
    if (!window.confirm('Delete group ' + id + '?')) return
    setGroups(groups.filter(g => g.id !== id))
    setAnimals(animals.map(a => a.groupId === id ? { ...a, groupId: '' } : a))
  }

  const q = filter.trim().toLowerCase()
  const filtered = animals.filter(a => {
    // Text search
    if (q) {
      const groupName = groups.find(g => g.id === a.groupId)?.name || ''
      const matchesText = (a.id || '').toLowerCase().includes(q) || 
                         (a.tag || '').toLowerCase().includes(q) || 
                         (a.name || '').toLowerCase().includes(q) || 
                         (a.breed || '').toLowerCase().includes(q) || 
                         groupName.toLowerCase().includes(q)
      if (!matchesText) return false
    }
    
    // Group filter
    if (filterGroup !== 'all') {
      if (filterGroup === 'ungrouped' && a.groupId) return false
      if (filterGroup !== 'ungrouped' && a.groupId !== filterGroup) return false
    }
    
    // Status filter
    if (filterStatus !== 'all' && a.status !== filterStatus) return false
    
    // Sex filter
    if (filterSex !== 'all' && a.sex !== filterSex) return false
    
    return true
  })

  // Sort animals
  const sortedAnimals = [...filtered].sort((a, b) => {
    switch(sortBy) {
      case 'name': return (a.name || '').localeCompare(b.name || '')
      case 'tag': return (a.tag || '').localeCompare(b.tag || '')
      case 'breed': return (a.breed || '').localeCompare(b.breed || '')
      case 'dob': return (a.dob || '').localeCompare(b.dob || '')
      case 'weight': return (parseFloat(b.weight) || 0) - (parseFloat(a.weight) || 0)
      case 'status': return (a.status || '').localeCompare(b.status || '')
      default: return 0
    }
  })
  const [expandedIds, setExpandedIds] = useState([])
  const [inlineEditingId, setInlineEditingId] = useState(null)
  const [inlineForm, setInlineForm] = useState(emptyAnimal)
  const [modalOpenId, setModalOpenId] = useState(null)

  function toggleExpand(id){
    // Open modal-like expansive view for a single animal to mimic Farmbrite
    if (modalOpenId === id) {
      setModalOpenId(null)
      setExpandedIds(prev => prev.filter(x => x !== id))
    } else {
      setModalOpenId(id)
      setExpandedIds([id])
    }
  }

  function startInlineEdit(a){
    setInlineEditingId(a.id)
    setInlineForm({ ...a })
  }

  function saveInlineEdit(){
    if(!inlineEditingId) return
    setAnimals(animals.map(x => x.id === inlineEditingId ? { ...x, ...inlineForm } : x))
    setInlineEditingId(null)
  }

  function cancelInlineEdit(){ setInlineEditingId(null) }

  function handleInlineChange(field, value){ setInlineForm(f => ({ ...f, [field]: value })) }

  function recordWeight(a){
    const input = window.prompt('Enter new weight (kg)', a.weight || '')
    if (input === null) return
    const w = Number(input)
    if (Number.isNaN(w)) { window.alert('Invalid number'); return }
    const ts = new Date().toISOString()
    setAnimals(animals.map(x => x.id === a.id ? { ...x, weight: w, weightLogs: [...(x.weightLogs||[]), { weight: w, date: ts }] } : x))
  }

  // Export functions
  const fileInputRef = useRef(null)

  function handleExportCSV() {
    const exportData = animals.map(a => ({
      id: a.id,
      tag: a.tag,
      name: a.name,
      species: a.species,
      breed: a.breed,
      sex: a.sex,
      dob: a.dob,
      age: a.age || '',
      weight: a.weight || '',
      group: a.group || '',
      status: a.status,
      sire: a.sire || '',
      dam: a.dam || '',
      notes: a.notes || ''
    }))
    exportToCSV(exportData, 'animals.csv')
  }

  function handleExportExcel() {
    const exportData = animals.map(a => ({
      id: a.id,
      tag: a.tag,
      name: a.name,
      species: a.species,
      breed: a.breed,
      sex: a.sex,
      dob: a.dob,
      age: a.age || '',
      weight: a.weight || '',
      group: a.group || '',
      status: a.status,
      sire: a.sire || '',
      dam: a.dam || '',
      notes: a.notes || ''
    }))
    exportToExcel(exportData, 'animals_export.csv')
  }

  function handleExportJSON() {
    exportToJSON(animals, 'animals.json')
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'json') {
      importFromJSON(file, (data, error) => {
        if (error) {
          alert('Import failed: ' + error.message)
          return
        }
        if (confirm(`Import ${data.length} animals? This will merge with existing data.`)) {
          const imported = data.map(a => ({
            ...a,
            id: a.id || uid()
          }))
          setAnimals([...animals, ...imported])
          alert(`Imported ${imported.length} animals`)
        }
      })
    } else if (ext === 'csv') {
      importFromCSV(file, (data, error) => {
        if (error) {
          alert('Import failed: ' + error.message)
          return
        }
        if (confirm(`Import ${data.length} animals? This will merge with existing data.`)) {
          const imported = data.map(a => ({
            id: a.id || uid(),
            tag: a.tag || '',
            name: a.name || '',
            species: a.species || '',
            breed: a.breed || '',
            sex: a.sex || '',
            dob: a.dob || '',
            age: a.age || '',
            weight: a.weight ? Number(a.weight) : 0,
            group: a.group || '',
            status: a.status || 'active',
            sire: a.sire || '',
            dam: a.dam || '',
            notes: a.notes || ''
          }))
          setAnimals([...animals, ...imported])
          alert(`Imported ${imported.length} animals`)
        }
      })
    } else {
      alert('Unsupported file type. Use CSV or JSON.')
    }

    e.target.value = '' // Reset input
  }

  function handleBatchPrint() {
    const filtered = animals.filter(filterAnimal)
    if (filtered.length === 0) {
      alert('No animals to print')
      return
    }

    batchPrint(filtered, (animal) => `
      <div style="padding: 20px; border: 2px solid #000; margin-bottom: 20px;">
        <h2 style="margin-top: 0;">Animal Record: ${animal.tag || animal.name}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><th style="text-align: left; width: 150px;">Tag:</th><td>${animal.tag || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Name:</th><td>${animal.name}</td></tr>
          <tr><th style="text-align: left;">Species:</th><td>${animal.species}</td></tr>
          <tr><th style="text-align: left;">Breed:</th><td>${animal.breed || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Sex:</th><td>${animal.sex}</td></tr>
          <tr><th style="text-align: left;">Date of Birth:</th><td>${animal.dob || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Age:</th><td>${animal.age || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Weight:</th><td>${animal.weight ? animal.weight + ' kg' : 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Group:</th><td>${animal.group || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Status:</th><td>${animal.status}</td></tr>
          <tr><th style="text-align: left;">Sire:</th><td>${animal.sire || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Dam:</th><td>${animal.dam || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Notes:</th><td>${animal.notes || 'N/A'}</td></tr>
        </table>
      </div>
    `, 'Animal Records')
  }

  // Responsive styles for mobile
  const mobileStyle = {
    '@media (max-width: 600px)': {
      section: { padding: '8px' },
      card: { padding: '12px', fontSize: '15px' },
      tabNav: { fontSize: '16px', minWidth: '120px' },
      tabBtn: { fontSize: '15px', padding: '14px 10px' },
      grid: { gridTemplateColumns: '1fr', gap: '12px' },
      animalList: { flexDirection: 'column' },
      animalCard: { flexDirection: 'column', alignItems: 'center' },
      img: { width: '100%', height: 'auto', maxWidth: '180px' },
    }
  }

  return (
    <section style={{ padding: '16px', ...mobileStyle.section }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: 'inherit' }}>🐄 Livestock Management</h2>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Comprehensive livestock tracking and management system</p>
      </div>

      {/* Statistics Cards - stack vertically on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px', ...(window.innerWidth <= 600 ? { gridTemplateColumns: '1fr', gap: '12px' } : {}) }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center', ...mobileStyle.card }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--green)' }}>{animals.length}</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Total Animals</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center', ...mobileStyle.card }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>{animals.filter(a => a.status === 'Active').length}</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Active</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center', ...mobileStyle.card }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#ec4899' }}>{animals.filter(a => a.sex === 'F').length}</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Female</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center', ...mobileStyle.card }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#6b7280' }}>{groups.length}</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Groups</div>
        </div>
      </div>

      {/* Tab Navigation - scrollable, larger touch targets on mobile */}
      <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
          <button
            onClick={() => setTab('list')}
            style={{
              padding: window.innerWidth <= 600 ? '14px 10px' : '12px 20px',
              minWidth: window.innerWidth <= 600 ? '120px' : 'auto',
              border: 'none',
              borderBottom: tab === 'list' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'list' ? '#f0fdf4' : 'transparent',
              color: tab === 'list' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'list' ? '600' : '400',
              cursor: 'pointer',
              fontSize: window.innerWidth <= 600 ? '15px' : '14px'
            }}
          >
            📋 Animal List
          </button>
          <button
            onClick={() => setTab('feeding')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'feeding' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'feeding' ? '#f0fdf4' : 'transparent',
              color: tab === 'feeding' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'feeding' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🌾 Feeding
          </button>
          <button
            onClick={() => setTab('health')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'health' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'health' ? '#f0fdf4' : 'transparent',
              color: tab === 'health' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'health' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🏥 Health System
          </button>
          <button
            onClick={() => setTab('treatment')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'treatment' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'treatment' ? '#f0fdf4' : 'transparent',
              color: tab === 'treatment' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'treatment' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            💊 Treatment
          </button>
          <button
            onClick={() => setTab('breeding')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'breeding' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'breeding' ? '#f0fdf4' : 'transparent',
              color: tab === 'breeding' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'breeding' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🤰 Breeding
          </button>
          <button
            onClick={() => setTab('milkyield')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'milkyield' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'milkyield' ? '#f0fdf4' : 'transparent',
              color: tab === 'milkyield' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'milkyield' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🥛 Milk Yield
          </button>
          <button
            onClick={() => setTab('measurement')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'measurement' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'measurement' ? '#f0fdf4' : 'transparent',
              color: tab === 'measurement' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'measurement' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📏 Measurement
          </button>
          <button
            onClick={() => setTab('calf')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'calf' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'calf' ? '#f0fdf4' : 'transparent',
              color: tab === 'calf' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'calf' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🐮 Calf Mgmt
          </button>
          <button
            onClick={() => setTab('pastures')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'pastures' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'pastures' ? '#f0fdf4' : 'transparent',
              color: tab === 'pastures' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'pastures' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🌱 Pastures
          </button>
          <button
            onClick={() => setTab('bsf')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'bsf' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'bsf' ? '#f0fdf4' : 'transparent',
              color: tab === 'bsf' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'bsf' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🪰 BSF Farm
          </button>
          <button
            onClick={() => setTab('azolla')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'azolla' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'azolla' ? '#f0fdf4' : 'transparent',
              color: tab === 'azolla' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'azolla' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🌿 Azolla
          </button>
          <button
            onClick={() => setTab('poultry')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'poultry' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'poultry' ? '#f0fdf4' : 'transparent',
              color: tab === 'poultry' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'poultry' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🐔 Poultry
          </button>
          <button
            onClick={() => setTab('canine')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'canine' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'canine' ? '#f0fdf4' : 'transparent',
              color: tab === 'canine' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'canine' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🐕 Canines
          </button>
          <button
            onClick={() => { resetGroupForm(); setTab('addGroup') }}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'addGroup' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'addGroup' ? '#f0fdf4' : 'transparent',
              color: tab === 'addGroup' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'addGroup' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            👥 Groups
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'list' && (
        <div>
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: window.innerWidth <= 600 ? 'wrap' : 'nowrap', alignItems: 'center' }}>
            <button 
              onClick={() => { resetForm(); setTab('addAnimal') }}
              style={{ 
                background: 'var(--green)', 
                color: '#fff', 
                padding: '10px 20px', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              ➕ Add Animal
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={handleExportCSV} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>📊 CSV</button>
              <button onClick={handleExportExcel} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>📈 Excel</button>
              <button onClick={handleExportJSON} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>📄 JSON</button>
              <button onClick={handleImportClick} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>📥 Import</button>
              <button onClick={handleBatchPrint} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>🖨️ Print</button>
              <button onClick={() => batchPrintQRTags(sortedAnimals, 'animal')} style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>📱 Print QR Tags</button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".csv,.json" 
                style={{ display: 'none' }} 
                onChange={handleImportFile}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Search animals..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{ flex: '1 1 200px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
              <select
                value={filterGroup}
                onChange={e => setFilterGroup(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="all">All Groups</option>
                <option value="ungrouped">Ungrouped</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Sold">Sold</option>
                <option value="Deceased">Deceased</option>
              </select>
              <select
                value={filterSex}
                onChange={e => setFilterSex(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="all">All</option>
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="name">Sort by Name</option>
                <option value="tag">Sort by Tag</option>
                <option value="breed">Sort by Breed</option>
                <option value="dob">Sort by DOB</option>
                <option value="weight">Sort by Weight</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
          </div>

          {/* Animal List - stack vertically, collapsible details on mobile */}
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '16px', color: 'inherit' }}>Animals ({sortedAnimals.length})</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {sortedAnimals.map(a => {
              const isExp = expandedIds.includes(a.id)
              const preview = (a.photos && a.photos.length) ? a.photos[0].dataUrl : (a.photo || null)
              const groupName = groups.find(g => g.id === a.groupId)?.name || 'No group'
              return (
                <li key={a.id} className="card" style={{ marginBottom: 12, padding: 16, ...(window.innerWidth <= 600 ? { padding: '12px' } : {}) }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: window.innerWidth <= 600 ? 'center' : 'flex-start', flexDirection: window.innerWidth <= 600 ? 'column' : 'row' }}>
                    {preview && (
                      <img src={preview} alt={a.name} style={{ width: window.innerWidth <= 600 ? '100%' : 80, height: window.innerWidth <= 600 ? 'auto' : 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0, maxWidth: window.innerWidth <= 600 ? '180px' : undefined }} />
                    )}
                    <div style={{ flex: 1, width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                            {a.name}
                            {a.qrCode && <span style={{ marginLeft: 8, fontSize: '0.8rem', color: '#8b5cf6' }} title="QR Code generated">📱</span>}
                          </h4>
                          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: 4 }}>
                            {a.tag && <span style={{ marginRight: 12 }}>🏷️ {a.tag}</span>}
                            <span style={{ marginRight: 12 }}>{a.sex === 'F' ? '♀' : '♂'} {a.breed}</span>
                            <span>📊 {a.status}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => startInlineEdit(a)} style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#ffffcc', border: '1px solid #ffdd00', color: '#333', fontWeight: '500' }}>⚡ Quick</button>
                          <button onClick={() => startEditAnimal(a)} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>✏️ Edit</button>
                          <button onClick={() => deleteAnimal(a.id)} style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#fee', color: '#c00' }}>🗑️</button>
                        </div>
                      </div>
                      
                      {isExp && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb', fontSize: '0.9rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                            {a.dob && <div><strong>DOB:</strong> {a.dob}</div>}
                            {a.weight && <div><strong>Weight:</strong> {a.weight} kg</div>}
                            {a.color && <div><strong>Color:</strong> {a.color}</div>}
                            {groupName && <div><strong>Group:</strong> {groupName}</div>}
                            {a.sire && <div><strong>Sire:</strong> {a.sire}</div>}
                            {a.dam && <div><strong>Dam:</strong> {a.dam}</div>}
                            {a.owner && <div><strong>Owner:</strong> {a.owner}</div>}
                            {a.registration && <div><strong>Registration:</strong> {a.registration}</div>}
                            {a.tattoo && <div><strong>Tattoo:</strong> {a.tattoo}</div>}
                            {a.purchaseDate && <div><strong>Purchase Date:</strong> {a.purchaseDate}</div>}
                            {a.purchasePrice && <div><strong>Purchase Price:</strong> KSH {Number(a.purchasePrice).toLocaleString()}</div>}
                            {a.vendor && <div><strong>Vendor:</strong> {a.vendor}</div>}
                            {a.pregnancyStatus && a.pregnancyStatus !== 'Not Pregnant' && (
                              <div><strong>Pregnancy:</strong> {a.pregnancyStatus}</div>
                            )}
                            {a.expectedDue && <div><strong>Expected Due:</strong> {a.expectedDue}</div>}
                            {a.parity > 0 && <div><strong>Parity:</strong> {a.parity}</div>}
                            {a.lactationStatus && <div><strong>Lactation:</strong> {a.lactationStatus}</div>}
                          </div>
                          {a.notes && (
                            <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 6 }}>
                              <strong>Notes:</strong> {a.notes}
                            </div>
                          )}
                          {a.photos && a.photos.length > 1 && (
                            <div style={{ marginTop: 12 }}>
                              <strong>Photos:</strong>
                              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                {a.photos.map((p, idx) => (
                                  <img key={p.id || idx} src={p.dataUrl} alt={`${a.name} ${idx+1}`} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 6 }} />
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Photo Gallery with IndexedDB storage */}
                          <PhotoGallery 
                            entityType="animal" 
                            entityId={a.id} 
                            entityName={a.name}
                          />
                          
                          {/* QR Code Display and Print */}
                          <div style={{ marginTop: 16, padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <div>
                                <img 
                                  src={a.qrCode || generateQRCodeDataURL(JSON.stringify({ type: 'animal', id: a.id, name: a.name, tag: a.tag, breed: a.breed }))} 
                                  alt={`QR Code for ${a.name}`}
                                  style={{ width: 120, height: 120, border: '2px solid #8b5cf6', borderRadius: 8 }}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: '600', color: '#8b5cf6' }}>
                                  📱 QR Tag {a.qrCode && <span style={{ fontSize: '0.75rem', color: '#10b981', marginLeft: 8 }}>✓ Auto-generated</span>}
                                </h4>
                                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#666' }}>
                                  Scan this QR code to quickly access {a.name}'s records
                                </p>
                                <button 
                                  onClick={() => printQRTag({ type: 'animal', id: a.id, name: a.name, tag: a.tag })}
                                  style={{ 
                                    padding: '8px 16px', 
                                    background: '#8b5cf6', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '6px', 
                                    cursor: 'pointer', 
                                    fontSize: '0.85rem',
                                    fontWeight: '500'
                                  }}
                                >
                                  🖨️ Print QR Tag
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => setExpandedIds(prev => isExp ? prev.filter(id => id !== a.id) : [...prev, a.id])}
                        style={{ marginTop: 12, padding: window.innerWidth <= 600 ? '10px 16px' : '6px 12px', fontSize: window.innerWidth <= 600 ? '1rem' : '0.85rem', background: '#f3f4f6', border: '1px solid #d1d5db', width: window.innerWidth <= 600 ? '100%' : 'auto' }}
                      >
                        {isExp ? '▲ Show Less' : '▼ Show More'}
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Add/Edit Animal Form - single column on mobile */}
      {tab === 'addAnimal' && (
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '20px', color: 'inherit' }}>
            {editingId ? '✏️ Edit Animal [v2.0]' : '➕ Add New Animal [v2.0]'}
          </h3>
          
          {/* Form Section Tabs */}
          <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {[
                { id: 'basic', label: '📋 Basic Info', icon: '📋' },
                { id: 'production', label: '📊 Production', icon: '📊' },
                { id: 'genetics', label: '🧬 Genetics', icon: '🧬' },
                { id: 'health', label: '🏥 Health', icon: '🏥' },
                { id: 'financial', label: '💰 Financial', icon: '💰' },
                { id: 'location', label: '📍 Location', icon: '📍' },
                { id: 'behavior', label: '🎭 Behavior', icon: '🎭' },
                { id: 'documentation', label: '📄 Docs', icon: '📄' }
              ].map(section => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setFormTab(section.id)}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    borderBottom: formTab === section.id ? '3px solid var(--green)' : '3px solid transparent',
                    background: formTab === section.id ? '#f0fdf4' : 'transparent',
                    color: formTab === section.id ? 'var(--green)' : '#6b7280',
                    fontWeight: formTab === section.id ? '600' : '400',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
          
          <form onSubmit={saveAnimal} style={{ marginBottom: 16 }} noValidate>
            
            {/* BASIC INFO TAB */}
            {formTab === 'basic' && (
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 600 ? '1fr' : '1fr 1fr', gap: window.innerWidth <= 600 ? 12 : 8 }}>
              <label>
                Tag
                <input value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} />
                {errors.tag && <div style={{ color: 'crimson' }}>{errors.tag}</div>}
              </label>

              <label>
                Name *
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                {errors.name && <div style={{ color: 'crimson' }}>{errors.name}</div>}
              </label>

              <label>
                Breed
                <input value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} />
              </label>

              <label>
                Color
                <input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
              </label>

              <label>
                DOB
                <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
                {errors.dob && <div style={{ color: 'crimson' }}>{errors.dob}</div>}
              </label>

              <label>
                Weight (kg)
                <input type="number" step="0.1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
                {errors.weight && <div style={{ color: 'crimson' }}>{errors.weight}</div>}
              </label>

              <label>
                Sire
                <input value={form.sire} onChange={e => setForm({ ...form, sire: e.target.value })} />
              </label>

              <label>
                Dam
                <input value={form.dam} onChange={e => setForm({ ...form, dam: e.target.value })} />
              </label>

              <label>
                Sex
                <select value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value })}>
                  <option value="F">Female</option>
                  <option value="M">Male</option>
                </select>
              </label>

              <label>
                Status
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option>Active</option>
                  <option>Sold</option>
                  <option>Deceased</option>
                </select>
              </label>

              <label>
                Group
                <select value={form.groupId} onChange={e => setForm({ ...form, groupId: e.target.value })}>
                  <option value="">-- No group --</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </label>

              <label>
                Owner
                <input value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
              </label>

              <label>
                Registration #
                <input value={form.registration} onChange={e => setForm({ ...form, registration: e.target.value })} />
              </label>

              <label>
                Tattoo / ID
                <input value={form.tattoo} onChange={e => setForm({ ...form, tattoo: e.target.value })} />
              </label>

              <label>
                Purchase date
                <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
                {errors.purchaseDate && <div style={{ color: 'crimson' }}>{errors.purchaseDate}</div>}
              </label>

              <label>
                Purchase price
                <input type="number" step="0.01" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
                {errors.purchasePrice && <div style={{ color: 'crimson' }}>{errors.purchasePrice}</div>}
              </label>

              <label>
                Vendor
                <input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} />
              </label>

              <label>
                Tags (comma separated)
                <input value={typeof form.tags === 'string' ? form.tags : (form.tags || []).join(', ')} onChange={e => setForm({ ...form, tags: e.target.value })} />
              </label>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Photos (up to 5, each ≤ 2 MB)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input type="file" accept="image/*" multiple onChange={handleFileInput} />
                  <small style={{ color: '#666' }}>Files will be resized to {MAX_DIM}px and compressed.</small>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(form.photos || []).map((p, idx) => (
                    <div key={p.id} style={{ width: 120, border: '1px solid #ddd', padding: 6, borderRadius: 6, textAlign: 'center' }}>
                      <img src={p.dataUrl} alt={`preview ${idx+1}`} style={{ width: '100%', height: 72, objectFit: 'cover', borderRadius: 4 }} />
                      <div style={{ fontSize: 12, marginTop: 6 }}>{p.filename || 'photo'}</div>
                      <div style={{ fontSize: 11, color: '#666' }}>{Math.round((p.size||0)/1024)} KB</div>
                      <button type="button" onClick={() => removePhoto(p.id)} aria-label={`Remove photo ${idx+1}`} style={{ marginTop: 6 }}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
              <label>
                Photo URL
                <input value={form.photo} onChange={e => setForm({ ...form, photo: e.target.value })} />
              </label>

              <label>
                Pregnancy status
                <select value={form.pregnancyStatus} onChange={e => setForm({ ...form, pregnancyStatus: e.target.value })}>
                  <option>Not Pregnant</option>
                  <option>Pregnant</option>
                  <option>Unknown</option>
                  <option>Not Applicable</option>
                </select>
              </label>

              <label>
                Expected due
                <input type="date" value={form.expectedDue} onChange={e => setForm({ ...form, expectedDue: e.target.value })} />
              </label>

              <label>
                Parity
                <input type="number" min="0" value={form.parity} onChange={e => setForm({ ...form, parity: e.target.value })} />
              </label>

              <label>
                Lactation status
                <select value={form.lactationStatus} onChange={e => setForm({ ...form, lactationStatus: e.target.value })}>
                  <option>Lactating</option>
                  <option>Dry</option>
                  <option>NA</option>
                  <option>Heifer</option>
                </select>
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                Notes
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
              </label>
            </div>
            )}

            {/* PRODUCTION TAB */}
            {formTab === 'production' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <h4 style={{ gridColumn: '1 / -1', color: '#059669', marginBottom: 8 }}>📊 Production Metrics</h4>
              
              <h5 style={{ gridColumn: '1 / -1', fontSize: '14px', color: '#666', marginTop: 12 }}>Milk Production</h5>
              <label>Total Lifetime (L)<input type="number" step="0.1" value={form.production?.milk?.totalLifetime || ''} onChange={e => setForm({ ...form, production: { ...form.production, milk: { ...form.production?.milk, totalLifetime: e.target.value } } })} /></label>
              <label>Current Lactation (L)<input type="number" step="0.1" value={form.production?.milk?.currentLactation || ''} onChange={e => setForm({ ...form, production: { ...form.production, milk: { ...form.production?.milk, currentLactation: e.target.value } } })} /></label>
              <label>Peak Yield (L/day)<input type="number" step="0.1" value={form.production?.milk?.peakYield || ''} onChange={e => setForm({ ...form, production: { ...form.production, milk: { ...form.production?.milk, peakYield: e.target.value } } })} /></label>
              <label>Average Daily (L)<input type="number" step="0.1" value={form.production?.milk?.averageDaily || ''} onChange={e => setForm({ ...form, production: { ...form.production, milk: { ...form.production?.milk, averageDaily: e.target.value } } })} /></label>
              
              <h5 style={{ gridColumn: '1 / -1', fontSize: '14px', color: '#666', marginTop: 12 }}>Egg Production</h5>
              <label>Total Lifetime<input type="number" value={form.production?.eggs?.totalLifetime || ''} onChange={e => setForm({ ...form, production: { ...form.production, eggs: { ...form.production?.eggs, totalLifetime: e.target.value } } })} /></label>
              <label>Current Year<input type="number" value={form.production?.eggs?.currentYear || ''} onChange={e => setForm({ ...form, production: { ...form.production, eggs: { ...form.production?.eggs, currentYear: e.target.value } } })} /></label>
              <label>Average Daily<input type="number" step="0.1" value={form.production?.eggs?.averageDaily || ''} onChange={e => setForm({ ...form, production: { ...form.production, eggs: { ...form.production?.eggs, averageDaily: e.target.value } } })} /></label>
              <label>Last Recorded<input type="date" value={form.production?.eggs?.lastRecorded || ''} onChange={e => setForm({ ...form, production: { ...form.production, eggs: { ...form.production?.eggs, lastRecorded: e.target.value } } })} /></label>
              
              <h5 style={{ gridColumn: '1 / -1', fontSize: '14px', color: '#666', marginTop: 12 }}>Meat/Wool/Work</h5>
              <label>Expected Meat Yield (kg)<input type="number" step="0.1" value={form.production?.meat?.expectedYield || ''} onChange={e => setForm({ ...form, production: { ...form.production, meat: { ...form.production?.meat, expectedYield: e.target.value } } })} /></label>
              <label>Grading Score<input value={form.production?.meat?.gradingScore || ''} onChange={e => setForm({ ...form, production: { ...form.production, meat: { ...form.production?.meat, gradingScore: e.target.value } } })} /></label>
              <label>Wool Yield (kg)<input type="number" step="0.1" value={form.production?.wool?.averageYield || ''} onChange={e => setForm({ ...form, production: { ...form.production, wool: { ...form.production?.wool, averageYield: e.target.value } } })} /></label>
              <label>Wool Quality<input value={form.production?.wool?.quality || ''} onChange={e => setForm({ ...form, production: { ...form.production, wool: { ...form.production?.wool, quality: e.target.value } } })} /></label>
              
              <h5 style={{ gridColumn: '1 / -1', fontSize: '14px', color: '#666', marginTop: 12 }}>Offspring</h5>
              <label>Total Born<input type="number" value={form.production?.offspring?.totalBorn || ''} onChange={e => setForm({ ...form, production: { ...form.production, offspring: { ...form.production?.offspring, totalBorn: e.target.value } } })} /></label>
              <label>Total Weaned<input type="number" value={form.production?.offspring?.totalWeaned || ''} onChange={e => setForm({ ...form, production: { ...form.production, offspring: { ...form.production?.offspring, totalWeaned: e.target.value } } })} /></label>
              <label>Total Survived<input type="number" value={form.production?.offspring?.totalSurvived || ''} onChange={e => setForm({ ...form, production: { ...form.production, offspring: { ...form.production?.offspring, totalSurvived: e.target.value } } })} /></label>
            </div>
            )}

            {/* GENETICS TAB */}
            {formTab === 'genetics' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <h4 style={{ color: '#3b82f6', marginBottom: 8 }}>🧬 Genetics & Breeding</h4>
              <label>Pedigree<textarea rows={2} value={form.genetics?.pedigree || ''} onChange={e => setForm({ ...form, genetics: { ...form.genetics, pedigree: e.target.value } })} placeholder="Full pedigree information" /></label>
              <label>Sire Lineage<input value={form.genetics?.sireLineage || ''} onChange={e => setForm({ ...form, genetics: { ...form.genetics, sireLineage: e.target.value } })} /></label>
              <label>Dam Lineage<input value={form.genetics?.damLineage || ''} onChange={e => setForm({ ...form, genetics: { ...form.genetics, damLineage: e.target.value } })} /></label>
              <label>DNA Markers<input value={form.genetics?.dnaMarkers || ''} onChange={e => setForm({ ...form, genetics: { ...form.genetics, dnaMarkers: e.target.value } })} placeholder="e.g., A2A2, BB, Polled carrier" /></label>
              <label>Breeding Value<input value={form.genetics?.breedingValue || ''} onChange={e => setForm({ ...form, genetics: { ...form.genetics, breedingValue: e.target.value } })} placeholder="e.g., +2850 NM$" /></label>
              <label>Inbreeding Coefficient<input type="number" step="0.01" value={form.genetics?.inbreedingCoefficient || ''} onChange={e => setForm({ ...form, genetics: { ...form.genetics, inbreedingCoefficient: e.target.value } })} /></label>
              <label>Genomic Evaluation<textarea rows={2} value={form.genetics?.genomicEvaluation || ''} onChange={e => setForm({ ...form, genetics: { ...form.genetics, genomicEvaluation: e.target.value } })} placeholder="e.g., TPI: 2750, NM$: 850" /></label>
              <label>Genetic Defects<textarea rows={2} value={(form.genetics?.geneticDefects || []).join(', ')} onChange={e => setForm({ ...form, genetics: { ...form.genetics, geneticDefects: e.target.value.split(',').map(s => s.trim()) } })} placeholder="Comma-separated list" /></label>
            </div>
            )}

            {/* HEALTH TAB */}
            {formTab === 'health' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <h4 style={{ gridColumn: '1 / -1', color: '#dc2626', marginBottom: 8 }}>🏥 Health Records</h4>
              <label>Health Status<select value={form.health?.healthStatus || 'Healthy'} onChange={e => setForm({ ...form, health: { ...form.health, healthStatus: e.target.value } })}>
                <option>Excellent</option>
                <option>Healthy</option>
                <option>Fair</option>
                <option>Sick</option>
                <option>Recovering</option>
                <option>Critical</option>
              </select></label>
              <label>Body Condition Score (1-5)<input type="number" step="0.5" min="1" max="5" value={form.health?.bodyConditionScore || ''} onChange={e => setForm({ ...form, health: { ...form.health, bodyConditionScore: e.target.value } })} /></label>
              <label>Last Vet Visit<input type="date" value={form.health?.lastVetVisit || ''} onChange={e => setForm({ ...form, health: { ...form.health, lastVetVisit: e.target.value } })} /></label>
              <label>Next Vet Visit<input type="date" value={form.health?.nextVetVisit || ''} onChange={e => setForm({ ...form, health: { ...form.health, nextVetVisit: e.target.value } })} /></label>
              <label>Quarantine Status<select value={form.health?.quarantineStatus || 'None'} onChange={e => setForm({ ...form, health: { ...form.health, quarantineStatus: e.target.value } })}>
                <option>None</option>
                <option>Quarantined</option>
                <option>Isolation</option>
                <option>Observation</option>
              </select></label>
              <label style={{ gridColumn: '1 / -1' }}>Allergies<input value={(form.health?.allergies || []).join(', ')} onChange={e => setForm({ ...form, health: { ...form.health, allergies: e.target.value.split(',').map(s => s.trim()) } })} placeholder="Comma-separated list" /></label>
              <label style={{ gridColumn: '1 / -1' }}>Chronic Conditions<input value={(form.health?.chronicConditions || []).join(', ')} onChange={e => setForm({ ...form, health: { ...form.health, chronicConditions: e.target.value.split(',').map(s => s.trim()) } })} placeholder="Comma-separated list" /></label>
            </div>
            )}

            {/* FINANCIAL TAB */}
            {formTab === 'financial' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <h4 style={{ gridColumn: '1 / -1', color: '#f59e0b', marginBottom: 8 }}>💰 Financial Tracking</h4>
              <label>Acquisition Cost (KES)<input type="number" step="0.01" value={form.financial?.acquisitionCost || form.purchasePrice || ''} onChange={e => setForm({ ...form, financial: { ...form.financial, acquisitionCost: e.target.value } })} /></label>
              <label>Current Value (KES)<input type="number" step="0.01" value={form.financial?.currentValue || ''} onChange={e => setForm({ ...form, financial: { ...form.financial, currentValue: e.target.value } })} /></label>
              <label>Insurance Value (KES)<input type="number" step="0.01" value={form.financial?.insuranceValue || ''} onChange={e => setForm({ ...form, financial: { ...form.financial, insuranceValue: e.target.value } })} /></label>
              <label>Maintenance Cost (KES)<input type="number" step="0.01" value={form.financial?.maintenanceCost || ''} onChange={e => setForm({ ...form, financial: { ...form.financial, maintenanceCost: e.target.value } })} /></label>
              <label>Feed Cost (KES)<input type="number" step="0.01" value={form.financial?.feedCost || ''} onChange={e => setForm({ ...form, financial: { ...form.financial, feedCost: e.target.value } })} /></label>
              <label>Veterinary Cost (KES)<input type="number" step="0.01" value={form.financial?.veterinaryCost || ''} onChange={e => setForm({ ...form, financial: { ...form.financial, veterinaryCost: e.target.value } })} /></label>
              <label>Production Revenue (KES)<input type="number" step="0.01" value={form.financial?.productionRevenue || ''} onChange={e => setForm({ ...form, financial: { ...form.financial, productionRevenue: e.target.value } })} /></label>
              <label>ROI (%)<input type="number" step="0.01" value={form.financial?.roi || ''} onChange={e => setForm({ ...form, financial: { ...form.financial, roi: e.target.value } })} /></label>
            </div>
            )}

            {/* LOCATION TAB */}
            {formTab === 'location' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <h4 style={{ gridColumn: '1 / -1', color: '#8b5cf6', marginBottom: 8 }}>📍 Location & Facilities</h4>
              <label>Barn<input value={form.location?.barn || ''} onChange={e => setForm({ ...form, location: { ...form.location, barn: e.target.value } })} /></label>
              <label>Pen<input value={form.location?.pen || ''} onChange={e => setForm({ ...form, location: { ...form.location, pen: e.target.value } })} /></label>
              <label>Pasture<input value={form.location?.pasture || ''} onChange={e => setForm({ ...form, location: { ...form.location, pasture: e.target.value } })} /></label>
              <label>Stall<input value={form.location?.stall || ''} onChange={e => setForm({ ...form, location: { ...form.location, stall: e.target.value } })} /></label>
              <label>Paddock<input value={form.location?.paddock || ''} onChange={e => setForm({ ...form, location: { ...form.location, paddock: e.target.value } })} /></label>
              <label>Last Moved<input type="date" value={form.location?.lastMoved || ''} onChange={e => setForm({ ...form, location: { ...form.location, lastMoved: e.target.value } })} /></label>
              <label style={{ gridColumn: '1 / -1' }}>Preferred Location<input value={form.location?.preferredLocation || ''} onChange={e => setForm({ ...form, location: { ...form.location, preferredLocation: e.target.value } })} placeholder="e.g., Shaded area, near water" /></label>
            </div>
            )}

            {/* BEHAVIOR TAB */}
            {formTab === 'behavior' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <h4 style={{ gridColumn: '1 / -1', color: '#ec4899', marginBottom: 8 }}>🎭 Behavior & Temperament</h4>
              <label>Temperament<select value={form.behavior?.temperament || 'Calm'} onChange={e => setForm({ ...form, behavior: { ...form.behavior, temperament: e.target.value } })}>
                <option>Calm</option>
                <option>Friendly</option>
                <option>Nervous</option>
                <option>Aggressive</option>
                <option>Docile</option>
              </select></label>
              <label>Handling Difficulty<select value={form.behavior?.handlingDifficulty || 'Easy'} onChange={e => setForm({ ...form, behavior: { ...form.behavior, handlingDifficulty: e.target.value } })}>
                <option>Easy</option>
                <option>Moderate</option>
                <option>Difficult</option>
                <option>Expert Only</option>
              </select></label>
              <label>Training Level<input value={form.behavior?.trainingLevel || ''} onChange={e => setForm({ ...form, behavior: { ...form.behavior, trainingLevel: e.target.value } })} placeholder="e.g., Halter trained, saddle broke" /></label>
              <label>Socialization<select value={form.behavior?.socialization || 'Good'} onChange={e => setForm({ ...form, behavior: { ...form.behavior, socialization: e.target.value } })}>
                <option>Excellent</option>
                <option>Good</option>
                <option>Fair</option>
                <option>Poor</option>
                <option>Isolated</option>
              </select></label>
              <label style={{ gridColumn: '1 / -1' }}>Special Needs<input value={(form.behavior?.specialNeeds || []).join(', ')} onChange={e => setForm({ ...form, behavior: { ...form.behavior, specialNeeds: e.target.value.split(',').map(s => s.trim()) } })} placeholder="Comma-separated list" /></label>
              <label style={{ gridColumn: '1 / -1' }}>Behavior Notes<textarea rows={3} value={form.behavior?.behaviorNotes || ''} onChange={e => setForm({ ...form, behavior: { ...form.behavior, behaviorNotes: e.target.value } })} /></label>
            </div>
            )}

            {/* DOCUMENTATION TAB */}
            {formTab === 'documentation' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <h4 style={{ gridColumn: '1 / -1', color: '#0ea5e9', marginBottom: 8 }}>📄 Documentation & Certifications</h4>
              <label>Insurance Policy #<input value={form.documentation?.insurancePolicy || ''} onChange={e => setForm({ ...form, documentation: { ...form.documentation, insurancePolicy: e.target.value } })} /></label>
              <label>Insurance Provider<input value={form.documentation?.insuranceProvider || ''} onChange={e => setForm({ ...form, documentation: { ...form.documentation, insuranceProvider: e.target.value } })} /></label>
              <label>Insurance Expiry<input type="date" value={form.documentation?.insuranceExpiry || ''} onChange={e => setForm({ ...form, documentation: { ...form.documentation, insuranceExpiry: e.target.value } })} /></label>
              <label>Microchip ID<input value={form.documentation?.microchipId || ''} onChange={e => setForm({ ...form, documentation: { ...form.documentation, microchipId: e.target.value } })} /></label>
              <label>Passport Number<input value={form.documentation?.passportNumber || ''} onChange={e => setForm({ ...form, documentation: { ...form.documentation, passportNumber: e.target.value } })} /></label>
              <label>Health Certificate<input value={form.documentation?.healthCertificate || ''} onChange={e => setForm({ ...form, documentation: { ...form.documentation, healthCertificate: e.target.value } })} /></label>
              <label>Birth Certificate<input value={form.documentation?.birthCertificate || ''} onChange={e => setForm({ ...form, documentation: { ...form.documentation, birthCertificate: e.target.value } })} /></label>
              <h5 style={{ gridColumn: '1 / -1', fontSize: '14px', color: '#666', marginTop: 12 }}>Certifications</h5>
              <label>Organic Certified<input type="checkbox" checked={form.certifications?.organic || false} onChange={e => setForm({ ...form, certifications: { ...form.certifications, organic: e.target.checked } })} /></label>
              <label>Free Range<input type="checkbox" checked={form.certifications?.freeRange || false} onChange={e => setForm({ ...form, certifications: { ...form.certifications, freeRange: e.target.checked } })} /></label>
              <label>Grass Fed<input type="checkbox" checked={form.certifications?.grassFed || false} onChange={e => setForm({ ...form, certifications: { ...form.certifications, grassFed: e.target.checked } })} /></label>
              <label style={{ gridColumn: '1 / -1' }}>Animal Welfare Standard<input value={form.certifications?.animalWelfare || ''} onChange={e => setForm({ ...form, certifications: { ...form.certifications, animalWelfare: e.target.value } })} placeholder="e.g., Gold Standard" /></label>
            </div>
            )}

            {/* Submit Buttons - Always visible */}
            <div style={{ marginTop: 24, padding: '16px 0', borderTop: '2px solid #e5e7eb', display: 'flex', gap: 8 }}>
              <button type="submit" style={{ background: 'var(--green)', color: '#fff', padding: '12px 24px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px' }}>
                {editingId ? '✓ Update Animal' : '+ Add Animal'}
              </button>
              <button type="button" onClick={resetForm} style={{ padding: '12px 24px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '15px' }}>Reset</button>
              {editingId && <button type="button" onClick={() => { resetForm(); setTab('list') }} style={{ padding: '12px 24px', background: '#666', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px' }}>Cancel</button>}
            </div>
          </form>
        </div>
      )}

      {tab === 'addGroup' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#059669', margin: 0 }}>👥 Livestock Groups</h2>
            <button onClick={() => { resetGroupForm(); setTab('addGroup'); setGroupName(''); setGroupDesc(''); setEditingGroupId(null); }} style={{ background: '#059669', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer' }}>➕ Add Group</button>
          </div>

          {/* Filter/Search Bar */}
          <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Search groups..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ flex: '1 1 200px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '1rem' }}
            />
          </div>

          {/* Add/Edit Group Modal - always show when tab is 'addGroup' */}
          <div className="card" style={{ padding: 24, marginBottom: 24, background: '#f0fdf4', border: '2px solid #059669', borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>{editingGroupId ? 'Edit Group' : 'Add New Group'}</h3>
            <form onSubmit={saveGroup}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                <div>
                  <label style={{ fontWeight: 600 }}>Group Name *</label>
                  <input placeholder="e.g., Dairy Herd A" value={groupName} onChange={e => setGroupName(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontWeight: 600 }}>Category *</label>
                    <select value={groupCategory} onChange={e => setGroupCategory(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }}>
                      <option value="">Select animal category...</option>
                      <option value="Bovine">Bovine (Cattle, dairy cows, beef cattle)</option>
                      <option value="Porcine">Porcine (Pigs, hogs, swine)</option>
                      <option value="Caprine">Caprine (Goats, dairy goats, meat goats)</option>
                      <option value="Ovine">Ovine (Sheep, lambs, wool sheep)</option>
                      <option value="Equine">Equine (Horses, donkeys, mules, ponies)</option>
                      <option value="Camelids">Camelids (Camels, alpacas, llamas)</option>
                      <option value="Avians">Avians (Poultry: chickens, turkeys, ducks, geese, quail, other birds)</option>
                      <option value="Canines">Canines (Dogs, working canines, guard dogs)</option>
                      <option value="Aquaculture">Aquaculture (Fish, shrimp, aquatic livestock)</option>
                      <option value="Insects">Insects (Bees, black soldier flies, farmed insects)</option>
                      <option value="Other">Other (Custom category)</option>
                    </select>
                    {groupCategory === 'Other' && (
                      <input type="text" placeholder="Custom group name" value={customGroupName} onChange={e => setCustomGroupName(e.target.value)} required style={{ width: '100%', marginTop: 8, padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                    )}
                  </div>
                </div>
                <div>
                  <label style={{ fontWeight: 600 }}>Description</label>
                  <input placeholder="Brief description of the group" value={groupDesc} onChange={e => setGroupDesc(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                  <label style={{ fontWeight: 600, marginTop: 12 }}>Date Created</label>
                  <input type="date" value={groupDateCreated} onChange={e => setGroupDateCreated(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                  <label style={{ fontWeight: 600, marginTop: 12 }}>Date Updated</label>
                  <input type="date" value={groupDateUpdated} onChange={e => setGroupDateUpdated(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                  <label style={{ fontWeight: 600, marginTop: 12 }}>Start Date (optional)</label>
                  <input type="date" value={groupStartDate} onChange={e => setGroupStartDate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                  <label style={{ fontWeight: 600, marginTop: 12 }}>End Date (optional)</label>
                  <input type="date" value={groupEndDate} onChange={e => setGroupEndDate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                <button type="submit" style={{ background: '#059669', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer' }}>{editingGroupId ? 'Update Group' : 'Create Group'}</button>
                <button type="button" onClick={() => { resetGroupForm(); setTab('addGroup'); }} style={{ padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' }}>Cancel</button>
              </div>
            </form>
          </div>

          {/* Responsive Group Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 600 ? '1fr' : 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
            {groups.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', background: '#f0fdf4', borderRadius: 8 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏷️</div>
                <h3>No groups yet</h3>
                <p style={{ color: '#666' }}>Create your first group to organize animals</p>
              </div>
            ) : (
              groups.filter(g => g.name.toLowerCase().includes(filter.toLowerCase())).map(g => {
                const groupAnimals = animals.filter(a => a.groupId === g.id)
                const femaleCount = groupAnimals.filter(a => a.sex === 'F').length
                const maleCount = groupAnimals.filter(a => a.sex === 'M').length
                const breedBreakdown = Object.entries(groupAnimals.reduce((acc, a) => {
                  acc[a.breed] = (acc[a.breed] || 0) + 1; return acc;
                }, {})).map(([breed, count]) => `${breed}: ${count}`).join(', ')
                const avgWeight = groupAnimals.length ? (groupAnimals.reduce((sum, a) => sum + (parseFloat(a.weight) || 0), 0) / groupAnimals.length).toFixed(1) : 'N/A'
                const ageRange = (() => {
                  const ages = groupAnimals.map(a => {
                    if (!a.dob) return null;
                    const dob = new Date(a.dob);
                    if (isNaN(dob)) return null;
                    const age = ((Date.now() - dob.getTime()) / (365.25*24*3600*1000));
                    return age;
                  }).filter(Boolean);
                  if (!ages.length) return 'N/A';
                  return `${Math.floor(Math.min(...ages))} - ${Math.ceil(Math.max(...ages))} yrs`;
                })()
                return (
                  <div key={g.id} className="card" style={{ padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #e5e7eb', border: '2px solid #059669', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <h3 style={{ margin: 0, fontWeight: '700', color: '#059669' }}>{g.name}</h3>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => startEditGroup(g)} style={{ background: '#f3f4f6', color: '#059669', border: '1px solid #059669', borderRadius: 6, padding: '6px 12px', fontWeight: '600', cursor: 'pointer' }}>✏️ Edit</button>
                        <button onClick={() => deleteGroup(g.id)} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 6, padding: '6px 12px', fontWeight: '600', cursor: 'pointer' }}>🗑️ Delete</button>
                      </div>
                    </div>
                    <p style={{ color: '#666', fontSize: 15, marginBottom: 12 }}>{g.desc || 'No description'}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 16 }}>
                      <div style={{ background: '#f0fdf4', borderRadius: 6, padding: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: '700', color: '#059669' }}>{groupAnimals.length}</div>
                        <div style={{ fontSize: 13, color: '#666' }}>Total</div>
                      </div>
                      <div style={{ background: '#eff6ff', borderRadius: 6, padding: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: '700', color: '#2563eb' }}>{groupAnimals.filter(a => a.status === 'Active').length}</div>
                        <div style={{ fontSize: 13, color: '#666' }}>Active</div>
                      </div>
                      <div style={{ background: '#fce7f3', borderRadius: 6, padding: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: '700', color: '#db2777' }}>{femaleCount}</div>
                        <div style={{ fontSize: 13, color: '#666' }}>Female</div>
                      </div>
                      <div style={{ background: '#dbeafe', borderRadius: 6, padding: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: '700', color: '#2563eb' }}>{maleCount}</div>
                        <div style={{ fontSize: 13, color: '#666' }}>Male</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, marginBottom: 10 }}>
                      <strong>Breed Breakdown:</strong> {breedBreakdown || 'N/A'}<br/>
                      <strong>Average Weight:</strong> {avgWeight} kg<br/>
                      <strong>Age Range:</strong> {ageRange}
                    </div>
                    <div style={{ fontSize: 14, marginBottom: 10 }}>
                      <strong>Status:</strong> Active: {groupAnimals.filter(a => a.status === 'Active').length}, Sold: {groupAnimals.filter(a => a.status === 'Sold').length}, Deceased: {groupAnimals.filter(a => a.status === 'Deceased').length}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Animals in this group:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      {groupAnimals.length === 0 ? (
                        <span style={{ color: '#666', fontSize: 13 }}>No animals in this group.</span>
                      ) : (
                        groupAnimals.slice(0, 10).map(a => (
                          <span key={a.id} style={{ fontSize: 13, padding: '6px 12px', background: '#f3f4f6', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: '4px' }}>
                            {a.name || a.tag || a.id}
                          </span>
                        ))
                      )}
                      {groupAnimals.length > 10 && (
                        <span style={{ fontSize: 13, padding: '6px 12px', color: '#666' }}>+{groupAnimals.length - 10} more</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Ungrouped Animals Warning */}
          {animals.filter(a => !a.groupId).length > 0 && (
            <div className="card" style={{ padding: 20, marginTop: 24, background: '#fef3c7', borderLeft: '6px solid #f59e0b', borderRadius: 8 }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#92400e' }}>⚠️ Ungrouped Animals</h3>
              <p style={{ margin: '0 0 8px 0', color: '#78350f', fontSize: 15 }}>
                {animals.filter(a => !a.groupId).length} animal(s) are not assigned to any group.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {animals.filter(a => !a.groupId).map(a => (
                  <span key={a.id} style={{ fontSize: 13, padding: '6px 12px', background: 'white', borderRadius: 6, border: '1px solid #fbbf24' }}>
                    {a.name || a.tag || a.id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        {/* Submodules - single column on mobile */}
        {tab === 'pastures' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <Pastures />
          </div>
        )}

        {tab === 'health' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <HealthSystem animals={animals} setAnimals={setAnimals} groups={groups} />
          </div>
        )}

        {tab === 'feeding' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <AnimalFeeding animals={animals} />
          </div>
        )}

        {tab === 'measurement' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <AnimalMeasurement animals={animals} />
          </div>
        )}

        {tab === 'breeding' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <AnimalBreeding animals={animals} />
          </div>
        )}

        {tab === 'milkyield' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <AnimalMilkYield animals={animals} />
          </div>
        )}

        {tab === 'treatment' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <AnimalTreatment animals={animals} />
          </div>
        )}

        {tab === 'calf' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <CalfManagement animals={animals} />
          </div>
        )}

        {tab === 'bsf' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <BSFFarming />
          </div>
        )}

        {tab === 'azolla' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <AzollaFarming />
          </div>
        )}

        {tab === 'poultry' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <PoultryManagement />
          </div>
        )}

        {tab === 'canine' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <CanineManagement animals={animals} setAnimals={setAnimals} />
          </div>
        )}
      </div>
    </section>
  )
}
