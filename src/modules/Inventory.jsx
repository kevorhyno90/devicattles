import React, { useEffect, useState, useRef, useMemo } from 'react'
import { exportToCSV, exportToExcel, exportToJSON, importFromCSV, importFromJSON } from '../lib/exportImport'
import { useDebounce } from '../lib/useDebounce'
import { logInventoryActivity } from '../lib/activityLogger'
import RecordCV from '../components/RecordCV'

const SAMPLE = [
  { 
    id: 'INV-001', 
    name: 'Alfalfa Hay', 
    category: 'Feed',
    subcategory: 'Hay',
    quantity: 450, 
    unit: 'bales',
    unitCost: 1275,
    totalValue: 573750,
    location: 'Barn A',
    supplier: 'Green Valley Feed',
    lastOrdered: '2025-10-15',
    reorderPoint: 100,
    reorderQuantity: 200,
    expiryDate: '',
    batchNumber: 'HAY-2025-10',
    quality: 'Premium',
    notes: 'Premium quality alfalfa for dairy cattle'
  },
  { 
    id: 'INV-002', 
    name: 'Grain Mix', 
    category: 'Feed',
    subcategory: 'Concentrate',
    quantity: 2800, 
    unit: 'lbs',
    unitCost: 67.50,
    totalValue: 189000,
    location: 'Feed Storage',
    supplier: 'Farm Supply Co',
    lastOrdered: '2025-11-01',
    reorderPoint: 500,
    reorderQuantity: 2000,
    expiryDate: '2026-05-01',
    batchNumber: 'GRAIN-2025-11',
    quality: 'Standard',
    notes: 'Balanced grain mix for cattle'
  },
  { 
    id: 'INV-003', 
    name: 'Mineral Supplement', 
    category: 'Supplements',
    subcategory: 'Minerals',
    quantity: 15, 
    unit: 'bags',
    unitCost: 6300,
    totalValue: 94500,
    location: 'Supply Room',
    supplier: 'Valley Veterinary',
    lastOrdered: '2025-09-20',
    reorderPoint: 5,
    reorderQuantity: 10,
    expiryDate: '2027-09-01',
    batchNumber: 'MIN-2025-09',
    quality: 'Premium',
    notes: 'Essential minerals for cattle health'
  },
  { 
    id: 'INV-004', 
    name: 'Ivermectin Injectable', 
    category: 'Veterinary',
    subcategory: 'Dewormer',
    quantity: 8, 
    unit: 'bottles',
    unitCost: 18750,
    totalValue: 150000,
    location: 'Vet Supplies',
    supplier: 'Valley Veterinary',
    lastOrdered: '2025-08-15',
    reorderPoint: 3,
    reorderQuantity: 6,
    expiryDate: '2026-08-01',
    batchNumber: 'IVER-2025-08',
    quality: 'Pharmaceutical',
    notes: 'Requires prescription - store refrigerated'
  },
  { 
    id: 'INV-005', 
    name: 'Fencing Wire', 
    category: 'Maintenance',
    subcategory: 'Fencing',
    quantity: 12, 
    unit: 'rolls',
    unitCost: 12750,
    totalValue: 153000,
    location: 'Equipment Shed',
    supplier: 'Farm Hardware',
    lastOrdered: '2025-07-10',
    reorderPoint: 5,
    reorderQuantity: 10,
    expiryDate: '',
    batchNumber: 'FENCE-2025-07',
    quality: 'Commercial',
    notes: 'High-tensile wire for pasture fencing'
  }
]

const CATEGORIES = ['Feed', 'Supplements', 'Veterinary', 'Seeds', 'Fertilizer', 'Pesticides', 'Maintenance', 'Equipment Parts', 'Supplies', 'Other']
const SUPPLY_SUBCATEGORIES = ['Breeding', 'General', 'Safety', 'Office', 'Packaging', 'Tools']
const UNITS = ['bales', 'lbs', 'kg', 'tons', 'bags', 'gallons', 'liters', 'bottles', 'boxes', 'rolls', 'units']
const LOCATIONS = ['Barn A', 'Barn B', 'Feed Storage', 'Supply Room', 'Vet Supplies', 'Equipment Shed', 'Cold Storage', 'Office']

const EQUIPMENT_SAMPLE = [
  {
    id: 'EQ-001',
    name: 'John Deere 5075E Tractor',
    type: 'Tractor',
    manufacturer: 'John Deere',
    model: '5075E',
    serialNumber: 'JD5075E2020-8821',
    year: 2020,
    purchaseDate: '2020-03-15',
    purchasePrice: 45000,
    currentValue: 38000,
    location: 'Main Equipment Barn',
    status: 'Operational',
    condition: 'Good',
    hours: 1245,
    fuelType: 'Diesel',
    lastServiceDate: '2025-10-05',
    nextServiceDate: '2025-12-05',
    servicePerson: 'Mike\'s Tractor Service',
    serviceContact: '555-0198',
    warrantyExpiry: '2023-03-15',
    insurancePolicy: 'POL-TR-45821',
    insuranceExpiry: '2026-03-15',
    notes: '75 HP utility tractor, primary field work vehicle',
    maintenanceHistory: [
      { date: '2025-10-05', type: 'Regular Service', hours: 1245, cost: 425, provider: 'Mike\'s Tractor Service', description: 'Oil change, filter replacement, hydraulic check' },
      { date: '2025-07-12', type: 'Repair', hours: 1180, cost: 680, provider: 'Mike\'s Tractor Service', description: 'Replaced PTO clutch' }
    ]
  },
  {
    id: 'EQ-002',
    name: 'Kubota M5-111 Tractor',
    type: 'Tractor',
    manufacturer: 'Kubota',
    model: 'M5-111',
    serialNumber: 'KB-M5-2021-4455',
    year: 2021,
    purchaseDate: '2021-06-20',
    purchasePrice: 52000,
    currentValue: 46000,
    location: 'Main Equipment Barn',
    status: 'Operational',
    condition: 'Excellent',
    hours: 780,
    fuelType: 'Diesel',
    lastServiceDate: '2025-09-15',
    nextServiceDate: '2026-01-15',
    servicePerson: 'Mike\'s Tractor Service',
    serviceContact: '555-0198',
    warrantyExpiry: '2024-06-20',
    insurancePolicy: 'POL-TR-45822',
    insuranceExpiry: '2026-06-20',
    notes: '111 HP tractor for heavy-duty operations',
    maintenanceHistory: [
      { date: '2025-09-15', type: 'Regular Service', hours: 780, cost: 485, provider: 'Mike\'s Tractor Service', description: 'Scheduled maintenance, all systems check' }
    ]
  },
  {
    id: 'EQ-003',
    name: 'New Holland BC5070 Baler',
    type: 'Hay Equipment',
    manufacturer: 'New Holland',
    model: 'BC5070',
    serialNumber: 'NH-BC-2019-7743',
    year: 2019,
    purchaseDate: '2019-05-10',
    purchasePrice: 28000,
    currentValue: 22000,
    location: 'Hay Equipment Shed',
    status: 'Operational',
    condition: 'Good',
    hours: 420,
    fuelType: 'PTO Powered',
    lastServiceDate: '2025-08-20',
    nextServiceDate: '2026-05-01',
    servicePerson: 'Valley Equipment Service',
    serviceContact: '555-0175',
    warrantyExpiry: '2022-05-10',
    insurancePolicy: 'POL-HE-88934',
    insuranceExpiry: '2026-05-10',
    notes: 'Small square baler for hay production',
    maintenanceHistory: [
      { date: '2025-08-20', type: 'Pre-Season Service', hours: 420, cost: 350, provider: 'Valley Equipment Service', description: 'Cleaned, lubricated, new bale chamber belts' }
    ]
  },
  {
    id: 'EQ-004',
    name: 'Bush Hog 2615L Mower',
    type: 'Mower',
    manufacturer: 'Bush Hog',
    model: '2615L',
    serialNumber: 'BH-2615-2022-3321',
    year: 2022,
    purchaseDate: '2022-04-08',
    purchasePrice: 8500,
    currentValue: 7200,
    location: 'Implement Shed',
    status: 'Operational',
    condition: 'Excellent',
    hours: 145,
    fuelType: 'PTO Powered',
    lastServiceDate: '2025-10-12',
    nextServiceDate: '2026-04-01',
    servicePerson: 'Farm Equipment Co',
    serviceContact: '555-0134',
    warrantyExpiry: '2025-04-08',
    insurancePolicy: 'POL-MW-12456',
    insuranceExpiry: '2026-04-08',
    notes: '15-foot rotary cutter for pasture maintenance',
    maintenanceHistory: [
      { date: '2025-10-12', type: 'Blade Sharpening', hours: 145, cost: 125, provider: 'Farm Equipment Co', description: 'Sharpened blades, checked gearbox oil' }
    ]
  }
]

const EQUIPMENT_TYPES = ['Tractor', 'Harvester', 'Planter', 'Sprayer', 'Hay Equipment', 'Mower', 'Loader', 'Cultivator', 'Trailer', 'Utility Vehicle', 'Generator', 'Pump', 'Other']
const EQUIPMENT_STATUS = ['Operational', 'In Service', 'Down for Repair', 'Retired', 'Sold']
const EQUIPMENT_CONDITION = ['Excellent', 'Good', 'Fair', 'Poor']
const ORDER_TRACKING_TEMPLATE = [
  { step: 'Order Placed', date: null, completed: true },
  { step: 'Payment Confirmed', date: null, completed: false },
  { step: 'Seller Confirmed', date: null, completed: false },
  { step: 'In Transit', date: null, completed: false },
  { step: 'Delivered', date: null, completed: false }
]

export default function Inventory({ initialView = 'supplies' }){
  const KEY = 'cattalytics:inventory'
  const EQUIPMENT_KEY = 'cattalytics:equipment'
  const ORDERS_KEY = 'cattalytics:marketplace:orders'
  const [items, setItems] = useState([])
  const [equipment, setEquipment] = useState([])
  const [orders, setOrders] = useState([])
  const [view, setView] = useState('supplies') // 'supplies' or 'equipment' or 'orders'
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [modalOpenId, setModalOpenId] = useState(null)
  const [showRecordCV, setShowRecordCV] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [orderFilterStatus, setOrderFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Debounce search for better performance
  const debouncedSearch = useDebounce(searchTerm, 300)
  
  // Inline edit state
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineData, setInlineData] = useState({ name: '', quantity: '', unitCost: '', location: '', reorderPoint: '' })
  const [toast, setToast] = useState(null)
  const [lastChange, setLastChange] = useState(null)
  
  const [equipmentForm, setEquipmentForm] = useState({
    name: '', type: 'Tractor', manufacturer: '', model: '', serialNumber: '',
    year: new Date().getFullYear(), purchaseDate: '', purchasePrice: '', currentValue: '',
    location: '', status: 'Operational', condition: 'Good', hours: '',
    fuelType: '', lastServiceDate: '', nextServiceDate: '', servicePerson: '',
    serviceContact: '', warrantyExpiry: '', insurancePolicy: '', insuranceExpiry: '', notes: '',
    personInCare: '', dateGiven: ''
  })
  
  const [formData, setFormData] = useState({
    name: '', category: 'Feed', subcategory: '', quantity: '', unit: 'lbs',
    unitCost: '', location: 'Barn A', supplier: '', reorderPoint: '',
    reorderQuantity: '', expiryDate: '', batchNumber: '', quality: 'Standard', notes: '', personInCare: '', serviceReminder: '', usagePerDay: '', usagePerMonth: ''
  })

  const [orderForm, setOrderForm] = useState({
    listingTitle: '',
    seller: '',
    quantity: '',
    unit: 'units',
    price: '',
    currency: 'KES',
    paymentMethod: '',
    expectedDelivery: '',
    notes: '',
    orderType: 'Manual'
  })

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
    
    const eqRaw = localStorage.getItem(EQUIPMENT_KEY)
    if(eqRaw) setEquipment(JSON.parse(eqRaw))
    else setEquipment(EQUIPMENT_SAMPLE)

    const ordRaw = localStorage.getItem(ORDERS_KEY)
    if(ordRaw) setOrders(JSON.parse(ordRaw))
  }, [])

  useEffect(() => {
    const allowedViews = ['supplies', 'equipment', 'orders']
    const nextView = allowedViews.includes(initialView) ? initialView : 'supplies'
    setView(nextView)
  }, [initialView])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])
  useEffect(()=> localStorage.setItem(EQUIPMENT_KEY, JSON.stringify(equipment)), [equipment])
  useEffect(()=> localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)), [orders])

  function resetForm(){
    setFormData({
      name: '', category: 'Feed', subcategory: '', quantity: '', unit: 'lbs',
      unitCost: '', location: 'Barn A', supplier: '', reorderPoint: '',
      reorderQuantity: '', expiryDate: '', batchNumber: '', quality: 'Standard', notes: ''
    })
    setEquipmentForm({
      name: '', type: 'Tractor', manufacturer: '', model: '', serialNumber: '',
      year: new Date().getFullYear(), purchaseDate: '', purchasePrice: '', currentValue: '',
      location: '', status: 'Operational', condition: 'Good', hours: '',
      fuelType: '', lastServiceDate: '', nextServiceDate: '', servicePerson: '',
      serviceContact: '', warrantyExpiry: '', insurancePolicy: '', insuranceExpiry: '', notes: ''
    })
    setOrderForm({
      listingTitle: '',
      seller: '',
      quantity: '',
      unit: 'units',
      price: '',
      currency: 'KES',
      paymentMethod: '',
      expectedDelivery: '',
      notes: '',
      orderType: 'Manual'
    })
    setEditingId(null)
  }

  function createTrackingSteps(){
    const now = new Date().toISOString()
    return ORDER_TRACKING_TEMPLATE.map((step, idx) => (
      idx === 0 ? { ...step, date: now, completed: true } : { ...step }
    ))
  }

  function addOrUpdateOrder(){
    if(!orderForm.listingTitle.trim()) {
      alert('Please enter order title/item name')
      return
    }

    const quantity = parseFloat(orderForm.quantity) || 1
    const price = parseFloat(orderForm.price) || 0

    if(editingId){
      setOrders(orders.map(o => o.id === editingId ? {
        ...o,
        ...orderForm,
        quantity,
        price,
        expectedDelivery: orderForm.expectedDelivery || o.expectedDelivery || ''
      } : o))
      setToast({ type: 'success', message: 'Order updated successfully' })
      setTimeout(() => setToast(null), 3000)
      setEditingId(null)
    } else {
      const now = new Date().toISOString().split('T')[0]
      const newOrder = {
        id: 'ORD-' + Date.now(),
        listingId: null,
        listingTitle: orderForm.listingTitle,
        price,
        quantity,
        unit: orderForm.unit || 'units',
        currency: orderForm.currency || 'KES',
        buyer: 'Current User',
        seller: orderForm.seller || 'Unassigned Supplier',
        status: 'Pending Payment',
        orderDate: now,
        paymentMethod: orderForm.paymentMethod || '',
        expectedDelivery: orderForm.expectedDelivery || '',
        notes: orderForm.notes || '',
        orderType: orderForm.orderType || 'Manual',
        source: 'inventory',
        trackingSteps: createTrackingSteps()
      }
      setOrders([newOrder, ...orders])
      setToast({ type: 'success', message: 'Order created successfully' })
      setTimeout(() => setToast(null), 3000)
    }

    resetForm()
    setShowAddForm(false)
    setView('orders')
  }

  function startEditOrder(order){
    setOrderForm({
      listingTitle: order.listingTitle || '',
      seller: order.seller || '',
      quantity: order.quantity || 1,
      unit: order.unit || 'units',
      price: order.price || 0,
      currency: order.currency || 'KES',
      paymentMethod: order.paymentMethod || '',
      expectedDelivery: order.expectedDelivery || '',
      notes: order.notes || '',
      orderType: order.orderType || 'Manual'
    })
    setEditingId(order.id)
    setShowAddForm(true)
  }

  function createReorderFromItem(item){
    const reorderQty = parseFloat(item.reorderQuantity) || Math.max(1, parseFloat(item.reorderPoint) || 1)
    const nowIso = new Date().toISOString().split('T')[0]
    const newOrder = {
      id: 'ORD-' + Date.now(),
      listingId: item.id,
      listingTitle: `${item.name} Reorder`,
      price: (item.unitCost || 0) * reorderQty,
      quantity: reorderQty,
      unit: item.unit || 'units',
      currency: 'KES',
      buyer: 'Current User',
      seller: item.supplier || 'Preferred Supplier',
      status: 'Pending Payment',
      orderDate: nowIso,
      paymentMethod: '',
      expectedDelivery: '',
      notes: `Auto-generated from low stock inventory. Item: ${item.name}.`,
      orderType: 'Inventory Reorder',
      source: 'inventory',
      trackingSteps: createTrackingSteps()
    }
    setOrders([newOrder, ...orders])
    setToast({ type: 'success', message: `Reorder created for ${item.name}` })
    setTimeout(() => setToast(null), 3000)
  }

  function updateOrderStatus(orderId, stepIndex){
    setOrders(orders.map(order => {
      if(order.id !== orderId) return order
      if(!Array.isArray(order.trackingSteps)) return order

      const canAdvance = stepIndex > 0 && order.trackingSteps[stepIndex - 1]?.completed
      if(!canAdvance || order.trackingSteps[stepIndex]?.completed) return order

      const now = new Date().toISOString()
      const trackingSteps = order.trackingSteps.map((step, idx) => (
        idx === stepIndex ? { ...step, completed: true, date: now } : step
      ))
      const allDone = trackingSteps.every(step => step.completed)

      return {
        ...order,
        trackingSteps,
        status: allDone ? 'Delivered' : trackingSteps[stepIndex].step
      }
    }))
  }

  function cancelOrder(orderId){
    if(!confirm('Cancel this order?')) return
    setOrders(orders.map(order => order.id === orderId ? { ...order, status: 'Cancelled' } : order))
  }

  function add(){
    if(!formData.name.trim()) {
      alert('Please enter an item name')
      return
    }
    
    const quantity = parseFloat(formData.quantity) || 0
    const unitCost = parseFloat(formData.unitCost) || 0
    
    if(editingId){
      const updatedItem = {
        ...items.find(i => i.id === editingId),
        ...formData,
        quantity,
        unitCost,
        totalValue: quantity * unitCost,
        reorderPoint: parseFloat(formData.reorderPoint) || 0,
        reorderQuantity: parseFloat(formData.reorderQuantity) || 0
      }
      setItems(items.map(i => i.id === editingId ? updatedItem : i))
      logInventoryActivity('updated', `Updated inventory: ${updatedItem.name} (${updatedItem.quantity} ${updatedItem.unit})`, updatedItem)
      setEditingId(null)
    } else {
      const id = 'INV-' + Math.floor(1000 + Math.random()*9000)
      const newItem = {
        id,
        ...formData,
        quantity,
        unitCost,
        totalValue: quantity * unitCost,
        reorderPoint: parseFloat(formData.reorderPoint) || 0,
        reorderQuantity: parseFloat(formData.reorderQuantity) || 0,
        personInCare: formData.personInCare,
        serviceReminder: formData.serviceReminder,
        usagePerDay: parseFloat(formData.usagePerDay) || 0,
        usagePerMonth: parseFloat(formData.usagePerMonth) || 0,
        lastOrdered: new Date().toISOString().slice(0,10)
      }
      setItems([...items, newItem])
      logInventoryActivity('created', `Added inventory: ${newItem.name} (${newItem.quantity} ${newItem.unit})`, newItem)
    }
    
    setFilterCategory('all')
    setSearchTerm('')
    resetForm()
    setShowAddForm(false)
  }

  function startEdit(item){
    setFormData({...item})
    setEditingId(item.id)
    setShowAddForm(true)
  }

  function remove(id){
    if(!confirm('Delete inventory item?')) return
    const item = items.find(i => i.id === id)
    setItems(items.filter(i=>i.id!==id))
    if(item) {
      logInventoryActivity('deleted', `Removed inventory: ${item.name}`, item)
    }
  }

  // Inline Quick Edit Functions
  function startInlineEdit(item) {
    setInlineEditId(item.id)
    setInlineData({
      name: item.name,
      quantity: item.quantity,
      unitCost: item.unitCost,
      location: item.location,
      reorderPoint: item.reorderPoint || ''
    })
  }

  function saveInlineEdit() {
    // Validation
    if (!inlineData.name.trim()) {
      setToast({ type: 'error', message: 'Item name is required' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    if (!inlineData.quantity || isNaN(inlineData.quantity) || Number(inlineData.quantity) < 0) {
      setToast({ type: 'error', message: 'Valid quantity is required' })
      setTimeout(() => setToast(null), 3000)
      return
    }

    const updated = items.map(i => {
      if (i.id === inlineEditId) {
        // Store previous state for undo
        setLastChange({ type: 'edit', item: { ...i } })
        const quantity = Number(inlineData.quantity)
        const unitCost = Number(inlineData.unitCost) || 0
        return { 
          ...i, 
          ...inlineData,
          quantity,
          unitCost,
          totalValue: quantity * unitCost
        }
      }
      return i
    })
    
    setItems(updated)
    localStorage.setItem(KEY, JSON.stringify(updated))
    
    setToast({ type: 'success', message: 'Item updated successfully', showUndo: true })
    setTimeout(() => setToast(null), 5000)
    
    setInlineEditId(null)
    setInlineData({ name: '', quantity: '', unitCost: '', location: '', reorderPoint: '' })
  }

  function cancelInlineEdit() {
    setInlineEditId(null)
    setInlineData({ name: '', quantity: '', unitCost: '', location: '', reorderPoint: '' })
  }

  function undoLastChange() {
    if (!lastChange) return
    
    if (lastChange.type === 'edit') {
      const updated = items.map(i => 
        i.id === lastChange.item.id ? lastChange.item : i
      )
      setItems(updated)
      localStorage.setItem(KEY, JSON.stringify(updated))
      setToast({ type: 'success', message: 'Change reverted' })
      setTimeout(() => setToast(null), 3000)
      setLastChange(null)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveInlineEdit()
    } else if (e.key === 'Escape') {
      cancelInlineEdit()
    }
  }

  function adjustQuantity(id, adjustment, reason){
    setItems(items.map(i => {
      if(i.id === id){
        const newQty = Math.max(0, i.quantity + adjustment)
        return {
          ...i,
          quantity: newQty,
          totalValue: newQty * (i.unitCost || 0),
          history: [...(i.history || []), {
            date: new Date().toISOString().slice(0,10),
            adjustment,
            newQuantity: newQty,
            reason
          }]
        }
      }
      return i
    }))
  }

  // Equipment functions
  function addEquipment(){
    if(!equipmentForm.name.trim()) {
      alert('Please enter equipment name')
      return
    }
    
    if(editingId){
      setEquipment(equipment.map(e => e.id === editingId ? {
        ...e,
        ...equipmentForm,
        purchasePrice: parseFloat(equipmentForm.purchasePrice) || 0,
        currentValue: parseFloat(equipmentForm.currentValue) || 0,
        hours: parseFloat(equipmentForm.hours) || 0,
        year: parseInt(equipmentForm.year) || new Date().getFullYear(),
        personInCare: equipmentForm.personInCare || '',
        dateGiven: equipmentForm.dateGiven || ''
      } : e))
      setEditingId(null)
    } else {
      const id = 'EQ-' + Math.floor(1000 + Math.random()*9000)
      const newEquipment = {
        id,
        ...equipmentForm,
        purchasePrice: parseFloat(equipmentForm.purchasePrice) || 0,
        currentValue: parseFloat(equipmentForm.currentValue) || 0,
        hours: parseFloat(equipmentForm.hours) || 0,
        year: parseInt(equipmentForm.year) || new Date().getFullYear(),
        personInCare: equipmentForm.personInCare || '',
        dateGiven: equipmentForm.dateGiven || '',
        maintenanceHistory: []
      }
      setEquipment([...equipment, newEquipment])
    }
    
    setFilterCategory('all')
    setSearchTerm('')
    resetForm()
    setShowAddForm(false)
  }

  function startEditEquipment(item){
    setEquipmentForm({...item})
    setEditingId(item.id)
    setShowAddForm(true)
  }

  function removeEquipment(id){
    if(!confirm('Delete equipment record?')) return
    setEquipment(equipment.filter(e => e.id !== id))
  }

  function addMaintenanceRecord(equipmentId, record){
    setEquipment(equipment.map(e => {
      if(e.id === equipmentId){
        return {
          ...e,
          maintenanceHistory: [...(e.maintenanceHistory || []), {
            date: new Date().toISOString().slice(0,10),
            ...record
          }],
          hours: record.hours || e.hours,
          lastServiceDate: record.date || e.lastServiceDate
        }
      }
      return e
    }))
  }

  // Memoized filtering with debounced search for better performance
  const filteredItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    
    return items.filter(item => {
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory
      const matchesSearch = !q || 
        (item.name || '').toLowerCase().includes(q) ||
        (item.supplier || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.location || '').toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [items, debouncedSearch, filterCategory])

  const filteredEquipment = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    
    return equipment.filter(eq => {
      const matchesType = filterCategory === 'all' || eq.type === filterCategory
      const matchesSearch = !q ||
        (eq.name || '').toLowerCase().includes(q) ||
        (eq.manufacturer || '').toLowerCase().includes(q) ||
        (eq.model || '').toLowerCase().includes(q) ||
        (eq.location || '').toLowerCase().includes(q)
      return matchesType && matchesSearch
    })
  }, [equipment, debouncedSearch, filterCategory])

  const filteredOrders = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()

    return [...orders]
      .filter(order => {
        const matchesStatus = orderFilterStatus === 'all' || order.status === orderFilterStatus
        const matchesSearch = !q ||
          (order.listingTitle || '').toLowerCase().includes(q) ||
          (order.seller || '').toLowerCase().includes(q) ||
          (order.id || '').toLowerCase().includes(q) ||
          (order.orderType || '').toLowerCase().includes(q)
        return matchesStatus && matchesSearch
      })
      .sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0))
  }, [orders, debouncedSearch, orderFilterStatus])

  const lowStockItems = items.filter(i => i.quantity <= (i.reorderPoint || 0))
  const totalValue = items.reduce((sum, i) => sum + (i.totalValue || 0), 0)
  const expiringSoon = items.filter(i => {
    if(!i.expiryDate) return false
    const days = Math.floor((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
    return days <= 90 && days >= 0
  })
  
  const totalEquipmentValue = equipment.reduce((sum, e) => sum + (e.currentValue || 0), 0)
  const equipmentNeedingService = equipment.filter(e => {
    if(!e.nextServiceDate) return false
    const days = Math.floor((new Date(e.nextServiceDate) - new Date()) / (1000 * 60 * 60 * 24))
    return days <= 30 && days >= 0
  })
  const operationalEquipment = equipment.filter(e => e.status === 'Operational').length

  const pendingOrders = orders.filter(o => (o.status || '').includes('Pending') || (o.status || '').includes('Payment')).length
  const inTransitOrders = orders.filter(o => o.status === 'In Transit').length
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length
  const totalOrderValue = orders.reduce((sum, o) => sum + (o.price || 0), 0)

  const fileInputRef = useRef(null)

  function handleExportCSV() {
    if (view === 'supplies') {
      exportToCSV(items, 'inventory_items.csv')
    } else if (view === 'equipment') {
      exportToCSV(equipment, 'equipment.csv')
    } else {
      exportToCSV(orders, 'inventory_orders.csv')
    }
  }

  function handleExportExcel() {
    if (view === 'supplies') {
      exportToExcel(items, 'inventory_items_export.csv')
    } else if (view === 'equipment') {
      exportToExcel(equipment, 'equipment_export.csv')
    } else {
      exportToExcel(orders, 'inventory_orders_export.csv')
    }
  }

  function handleExportJSON() {
    if (view === 'supplies') {
      exportToJSON(items, 'inventory_items.json')
    } else if (view === 'equipment') {
      exportToJSON(equipment, 'equipment.json')
    } else {
      exportToJSON(orders, 'inventory_orders.json')
    }
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
        if (view === 'supplies') {
          if (confirm(`Import ${data.length} items? This will merge with existing data.`)) {
            setItems([...items, ...data])
            alert(`Imported ${data.length} items`)
          }
        } else if (view === 'equipment') {
          if (confirm(`Import ${data.length} equipment records? This will merge with existing data.`)) {
            setEquipment([...equipment, ...data])
            alert(`Imported ${data.length} equipment records`)
          }
        } else {
          if (confirm(`Import ${data.length} orders? This will merge with existing data.`)) {
            setOrders([...orders, ...data])
            alert(`Imported ${data.length} orders`)
          }
        }
      })
    } else if (ext === 'csv') {
      importFromCSV(file, (data, error) => {
        if (error) {
          alert('Import failed: ' + error.message)
          return
        }
        if (view === 'supplies') {
          if (confirm(`Import ${data.length} items? This will merge with existing data.`)) {
            setItems([...items, ...data])
            alert(`Imported ${data.length} items`)
          }
        } else if (view === 'equipment') {
          if (confirm(`Import ${data.length} equipment records? This will merge with existing data.`)) {
            setEquipment([...equipment, ...data])
            alert(`Imported ${data.length} equipment records`)
          }
        } else {
          if (confirm(`Import ${data.length} orders? This will merge with existing data.`)) {
            setOrders([...orders, ...data])
            alert(`Imported ${data.length} orders`)
          }
        }
      })
    } else {
      alert('Unsupported file type. Use CSV or JSON.')
    }

    e.target.value = '' // Reset input
  }

  return (
    <div>
      <div className="health-header">
        <div>
          <h2>{view === 'supplies' ? '📦' : view === 'equipment' ? '🚜' : '🧾'} {view === 'supplies' ? 'Inventory' : view === 'equipment' ? 'Equipment' : 'Orders'} Management</h2>
          <p className="muted">{view === 'supplies' ? 'Track supplies, monitor stock levels, and manage reordering' : view === 'equipment' ? 'Track machinery, equipment, maintenance, and service records' : 'Create, track, and manage purchase orders tied to inventory and suppliers'}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className={view === 'supplies' ? 'tab-btn active' : 'tab-btn'} onClick={() => { setView('supplies'); setShowAddForm(false); resetForm() }}>
            📦 Supplies
          </button>
          <button className={view === 'equipment' ? 'tab-btn active' : 'tab-btn'} onClick={() => { setView('equipment'); setShowAddForm(false); resetForm() }}>
            🚜 Equipment
          </button>
          <button className={view === 'orders' ? 'tab-btn active' : 'tab-btn'} onClick={() => { setView('orders'); setShowAddForm(false); resetForm() }}>
            🧾 Orders ({orders.length})
          </button>
          <button className="tab-btn" onClick={()=> setShowAddForm(!showAddForm)}>
            {showAddForm ? '✕ Cancel' : `+ Add ${view === 'supplies' ? 'Item' : view === 'equipment' ? 'Equipment' : 'Order'}`}
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button onClick={handleExportCSV} title="Export to CSV" style={{ fontSize: 12 }}>📊 CSV</button>
            <button onClick={handleExportExcel} title="Export to Excel" style={{ fontSize: 12 }}>📈 Excel</button>
            <button onClick={handleExportJSON} title="Export to JSON" style={{ fontSize: 12 }}>📄 JSON</button>
            <button onClick={handleImportClick} title="Import from file" style={{ fontSize: 12 }}>📥 Import</button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".csv,.json" 
              style={{ display: 'none' }} 
              onChange={handleImportFile}
            />
          </div>
        </div>
      </div>

      {/* Summary Stats for Supplies */}
      {view === 'supplies' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '16px', background: '#f0fdf4' }}>
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>Total Inventory Value</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669' }}>KES {totalValue.toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>
          <div className="card" style={{ padding: '16px', background: '#fef3c7' }}>
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>Low Stock Alerts</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{lowStockItems.length}</div>
          </div>
          <div className="card" style={{ padding: '16px', background: '#fee2e2' }}>
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>Expiring Soon (90 days)</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626' }}>{expiringSoon.length}</div>
          </div>
          <div className="card" style={{ padding: '16px', background: '#eff6ff' }}>
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>Total Items</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb' }}>{items.length}</div>
          </div>
        </div>
      )}

      {/* Summary Stats for Equipment */}
      {view === 'equipment' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '16px', background: '#f0fdf4' }}>
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>Total Equipment Value</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669' }}>KES {totalEquipmentValue.toLocaleString('en-KE')}</div>
          </div>
          <div className="card" style={{ padding: '16px', background: '#fef3c7' }}>
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>Service Due (30 days)</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{equipmentNeedingService.length}</div>
          </div>
          <div className="card" style={{ padding: '16px', background: '#e0f2fe' }}>
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>Operational</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0284c7' }}>{operationalEquipment}/{equipment.length}</div>
          </div>
          <div className="card" style={{ padding: '16px', background: '#eff6ff' }}>
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>Total Equipment</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb' }}>{equipment.length}</div>
          </div>
        </div>
      )}

      {/* Summary Stats for Orders */}
      {view === 'orders' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '16px', background: '#f0f9ff' }}>
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>Total Orders</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0369a1' }}>{orders.length}</div>
          </div>
          <div className="card" style={{ padding: '16px', background: '#fef3c7' }}>
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>Pending / Payment</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#b45309' }}>{pendingOrders}</div>
          </div>
          <div className="card" style={{ padding: '16px', background: '#e0f2fe' }}>
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>In Transit</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0284c7' }}>{inTransitOrders}</div>
          </div>
          <div className="card" style={{ padding: '16px', background: '#ecfdf5' }}>
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>Delivered</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669' }}>{deliveredOrders}</div>
          </div>
          <div className="card" style={{ padding: '16px', background: '#fee2e2' }}>
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>Cancelled</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626' }}>{cancelledOrders}</div>
          </div>
          <div className="card" style={{ padding: '16px', background: '#f5f3ff' }}>
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>Total Order Value</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7c3aed' }}>KES {totalOrderValue.toLocaleString('en-KE')}</div>
          </div>
        </div>
      )}

      {/* Add/Edit Form for Supplies */}
      {showAddForm && view === 'supplies' && (
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Item' : 'Add New Item'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div>
              <label>Item Name *</label>
              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label>Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Subcategory</label>
              <input value={formData.subcategory} onChange={e => setFormData({...formData, subcategory: e.target.value})} />
            </div>
            <div>
              <label>Quantity *</label>
              <input type="number" step="0.01" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
            </div>
            <div>
              <label>Unit</label>
              <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label>Unit Cost (KES)</label>
              <input type="number" step="0.01" value={formData.unitCost} onChange={e => setFormData({...formData, unitCost: e.target.value})} />
            </div>
            <div>
              <label>Usage Per Day</label>
              <input type="number" step="0.01" value={formData.usagePerDay || ''} onChange={e => setFormData({...formData, usagePerDay: e.target.value})} placeholder="e.g., 2" />
            </div>
            <div>
              <label>Usage Per Month</label>
              <input type="number" step="0.01" value={formData.usagePerMonth || ''} onChange={e => setFormData({...formData, usagePerMonth: e.target.value})} placeholder="e.g., 60" />
            </div>
            <div>
              <label>Location</label>
              <select value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label>Supplier</label>
              <input value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
            </div>
            <div>
              <label>Quality Level</label>
              <select value={formData.quality} onChange={e => setFormData({...formData, quality: e.target.value})}>
                <option>Standard</option>
                <option>Premium</option>
                <option>Commercial</option>
                <option>Pharmaceutical</option>
              </select>
            </div>
            <div>
              <label>Reorder Point</label>
              <input type="number" value={formData.reorderPoint} onChange={e => setFormData({...formData, reorderPoint: e.target.value})} />
            </div>
            <div>
              <label>Reorder Quantity</label>
              <input type="number" value={formData.reorderQuantity} onChange={e => setFormData({...formData, reorderQuantity: e.target.value})} />
            </div>
            <div>
              <label>Expiry Date</label>
              <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
            </div>
            <div>
              <label>Batch Number</label>
              <input value={formData.batchNumber} onChange={e => setFormData({...formData, batchNumber: e.target.value})} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label>Notes</label>
              <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} />
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button onClick={add}>{editingId ? 'Save Changes' : 'Add Item'}</button>
            <button onClick={() => { resetForm(); setShowAddForm(false) }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Equipment Add/Edit Form */}
      {showAddForm && view === 'equipment' && (
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Equipment' : 'Add New Equipment'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div>
              <label>Equipment Name *</label>
              <input value={equipmentForm.name} onChange={e => setEquipmentForm({...equipmentForm, name: e.target.value})} placeholder="e.g., John Deere 5075E" />
            </div>
            <div>
              <label>Type</label>
              <select value={equipmentForm.type} onChange={e => setEquipmentForm({...equipmentForm, type: e.target.value})}>
                {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Manufacturer</label>
              <input value={equipmentForm.manufacturer} onChange={e => setEquipmentForm({...equipmentForm, manufacturer: e.target.value})} placeholder="e.g., John Deere" />
            </div>
            <div>
              <label>Model</label>
              <input value={equipmentForm.model} onChange={e => setEquipmentForm({...equipmentForm, model: e.target.value})} placeholder="e.g., 5075E" />
            </div>
            <div>
              <label>Serial Number</label>
              <input value={equipmentForm.serialNumber} onChange={e => setEquipmentForm({...equipmentForm, serialNumber: e.target.value})} />
            </div>
            <div>
              <label>Year</label>
              <input type="number" value={equipmentForm.year} onChange={e => setEquipmentForm({...equipmentForm, year: e.target.value})} />
            </div>
            <div>
              <label>Purchase Date</label>
              <input type="date" value={equipmentForm.purchaseDate} onChange={e => setEquipmentForm({...equipmentForm, purchaseDate: e.target.value})} />
            </div>
            <div>
              <label>Purchase Price (KES)</label>
              <input type="number" step="0.01" value={equipmentForm.purchasePrice} onChange={e => setEquipmentForm({...equipmentForm, purchasePrice: e.target.value})} />
            </div>
            <div>
              <label>Current Value (KES)</label>
              <input type="number" step="0.01" value={equipmentForm.currentValue} onChange={e => setEquipmentForm({...equipmentForm, currentValue: e.target.value})} />
            </div>
            <div>
              <label>Location</label>
              <input value={equipmentForm.location} onChange={e => setEquipmentForm({...equipmentForm, location: e.target.value})} placeholder="e.g., Main Equipment Barn" />
            </div>
            <div>
              <label>Person in Care</label>
              <input value={equipmentForm.personInCare || ''} onChange={e => setEquipmentForm({...equipmentForm, personInCare: e.target.value})} placeholder="e.g., John Doe" />
            </div>
            <div>
              <label>Date Given</label>
              <input type="date" value={equipmentForm.dateGiven || ''} onChange={e => setEquipmentForm({...equipmentForm, dateGiven: e.target.value})} />
            </div>
            <div>
              <label>Status</label>
              <select value={equipmentForm.status} onChange={e => setEquipmentForm({...equipmentForm, status: e.target.value})}>
                {EQUIPMENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Condition</label>
              <select value={equipmentForm.condition} onChange={e => setEquipmentForm({...equipmentForm, condition: e.target.value})}>
                {EQUIPMENT_CONDITION.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Operating Hours</label>
              <input type="number" step="0.1" value={equipmentForm.hours} onChange={e => setEquipmentForm({...equipmentForm, hours: e.target.value})} />
            </div>
            <div>
              <label>Fuel Type</label>
              <input value={equipmentForm.fuelType} onChange={e => setEquipmentForm({...equipmentForm, fuelType: e.target.value})} placeholder="e.g., Diesel, Gas, PTO" />
            </div>
            <div>
              <label>Last Service Date</label>
              <input type="date" value={equipmentForm.lastServiceDate} onChange={e => setEquipmentForm({...equipmentForm, lastServiceDate: e.target.value})} />
            </div>
            <div>
              <label>Next Service Date</label>
              <input type="date" value={equipmentForm.nextServiceDate} onChange={e => setEquipmentForm({...equipmentForm, nextServiceDate: e.target.value})} />
            </div>
            <div>
              <label>Service Person/Company</label>
              <input value={equipmentForm.servicePerson} onChange={e => setEquipmentForm({...equipmentForm, servicePerson: e.target.value})} placeholder="e.g., Mike's Tractor Service" />
            </div>
            <div>
              <label>Service Contact</label>
              <input value={equipmentForm.serviceContact} onChange={e => setEquipmentForm({...equipmentForm, serviceContact: e.target.value})} placeholder="e.g., 555-0198" />
            </div>
            <div>
              <label>Warranty Expiry</label>
              <input type="date" value={equipmentForm.warrantyExpiry} onChange={e => setEquipmentForm({...equipmentForm, warrantyExpiry: e.target.value})} />
            </div>
            <div>
              <label>Insurance Policy #</label>
              <input value={equipmentForm.insurancePolicy} onChange={e => setEquipmentForm({...equipmentForm, insurancePolicy: e.target.value})} />
            </div>
            <div>
              <label>Insurance Expiry</label>
              <input type="date" value={equipmentForm.insuranceExpiry} onChange={e => setEquipmentForm({...equipmentForm, insuranceExpiry: e.target.value})} />
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <label>Notes</label>
              <textarea value={equipmentForm.notes} onChange={e => setEquipmentForm({...equipmentForm, notes: e.target.value})} rows={3} placeholder="Additional information about this equipment..." />
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button onClick={addEquipment}>{editingId ? 'Save Changes' : 'Add Equipment'}</button>
            <button onClick={() => { resetForm(); setShowAddForm(false) }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Orders Add/Edit Form */}
      {showAddForm && view === 'orders' && (
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Order' : 'Create New Order'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div>
              <label>Order Title / Item *</label>
              <input value={orderForm.listingTitle} onChange={e => setOrderForm({ ...orderForm, listingTitle: e.target.value })} placeholder="e.g., Grain Mix Reorder" />
            </div>
            <div>
              <label>Supplier / Seller</label>
              <input value={orderForm.seller} onChange={e => setOrderForm({ ...orderForm, seller: e.target.value })} placeholder="e.g., Farm Supply Co" />
            </div>
            <div>
              <label>Order Type</label>
              <select value={orderForm.orderType} onChange={e => setOrderForm({ ...orderForm, orderType: e.target.value })}>
                <option value="Manual">Manual</option>
                <option value="Inventory Reorder">Inventory Reorder</option>
                <option value="Emergency Purchase">Emergency Purchase</option>
                <option value="Service Contract">Service Contract</option>
              </select>
            </div>
            <div>
              <label>Quantity</label>
              <input type="number" step="0.01" value={orderForm.quantity} onChange={e => setOrderForm({ ...orderForm, quantity: e.target.value })} />
            </div>
            <div>
              <label>Unit</label>
              <select value={orderForm.unit} onChange={e => setOrderForm({ ...orderForm, unit: e.target.value })}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label>Total Price</label>
              <input type="number" step="0.01" value={orderForm.price} onChange={e => setOrderForm({ ...orderForm, price: e.target.value })} />
            </div>
            <div>
              <label>Currency</label>
              <select value={orderForm.currency} onChange={e => setOrderForm({ ...orderForm, currency: e.target.value })}>
                <option value="KES">KES</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label>Payment Method</label>
              <select value={orderForm.paymentMethod} onChange={e => setOrderForm({ ...orderForm, paymentMethod: e.target.value })}>
                <option value="">Not selected</option>
                <option value="M-Pesa">M-Pesa</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card Payment">Card Payment</option>
                <option value="Cash on Delivery">Cash on Delivery</option>
              </select>
            </div>
            <div>
              <label>Expected Delivery</label>
              <input type="date" value={orderForm.expectedDelivery} onChange={e => setOrderForm({ ...orderForm, expectedDelivery: e.target.value })} />
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <label>Order Notes</label>
              <textarea value={orderForm.notes} onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })} rows={3} placeholder="Optional notes, terms, or special instructions..." />
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button onClick={addOrUpdateOrder}>{editingId ? 'Save Order' : 'Create Order'}</button>
            <button onClick={() => { resetForm(); setShowAddForm(false) }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      {view !== 'orders' && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="all">{view === 'supplies' ? 'All Categories' : 'All Types'}</option>
            {view === 'supplies' ? CATEGORIES.map(c => <option key={c} value={c}>{c}</option>) : EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input 
            placeholder={view === 'supplies' ? 'Search items or suppliers...' : 'Search equipment, manufacturer, or model...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flexGrow: 1, maxWidth: '400px' }}
          />
        </div>
      )}

      {view === 'orders' && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <select value={orderFilterStatus} onChange={e => setOrderFilterStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Pending Payment">Pending Payment</option>
            <option value="Payment Confirmed">Payment Confirmed</option>
            <option value="Seller Confirmed">Seller Confirmed</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <input
            placeholder="Search order ID, title, supplier, or type..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flexGrow: 1, maxWidth: '520px' }}
          />
        </div>
      )}

      {/* Low Stock Alerts */}
      {view === 'supplies' && lowStockItems.length > 0 && (
        <div className="card" style={{ padding: '16px', marginBottom: '16px', background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#92400e' }}>⚠️ Low Stock Alerts</h4>
          {lowStockItems.map(item => (
            <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #fbbf24' }}>
              <strong>{item.name}</strong> - {item.quantity} {item.unit} (Reorder at: {item.reorderPoint})
               <span style={{ marginLeft: 12, color: '#dc2626', fontWeight: 600 }}>
                 {item.usagePerDay ? `Daily usage: ${item.usagePerDay} ${item.unit}` : ''}
                 {item.usagePerMonth ? `, Monthly: ${item.usagePerMonth} ${item.unit}` : ''}
               </span>
               <span style={{ marginLeft: 12, color: '#059669', fontWeight: 600 }}>
                 {item.personInCare ? `In care: ${item.personInCare}` : ''}
               </span>
               {item.serviceReminder && (
                 <span style={{ marginLeft: 12, color: '#f59e0b', fontWeight: 600 }}>
                   Service due: {new Date(item.serviceReminder).toLocaleDateString()}
                 </span>
               )}
               {/* Notification logic: alert if low and usage predicts next purchase soon */}
               {item.usagePerDay && item.quantity <= item.usagePerDay * 7 && (
                 <span style={{ marginLeft: 12, color: '#dc2626', fontWeight: 700 }}>
                   ⚠️ Predicted to run out in less than a week!
                 </span>
               )}
               <button className="tab-btn" style={{ marginLeft: 12 }} onClick={() => createReorderFromItem(item)}>
                 🛒 Create Reorder
               </button>
            </div>
          ))}
        </div>
      )}

      {/* Service Due Alerts */}
      {view === 'equipment' && equipmentNeedingService.length > 0 && (
        <div className="card" style={{ padding: '16px', marginBottom: '16px', background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#92400e' }}>⚠️ Service Due Soon</h4>
          {equipmentNeedingService.map(eq => (
            <div key={eq.id} style={{ padding: '8px 0', borderBottom: '1px solid #fbbf24' }}>
              <strong>{eq.name}</strong> - Next service: {new Date(eq.nextServiceDate).toLocaleDateString()}
            </div>
          ))}
        </div>
      )}

      {/* Equipment Grid */}
      {view === 'equipment' && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredEquipment.map(eq => {
            const needsService = eq.nextServiceDate && Math.floor((new Date(eq.nextServiceDate) - new Date()) / (1000 * 60 * 60 * 24)) <= 30
            const warrantyActive = eq.warrantyExpiry && new Date(eq.warrantyExpiry) > new Date()
            
            // ...existing code...
            return (
              <div key={eq.id} className="card" style={{ 
                padding: '20px',
                borderLeft: needsService ? '4px solid #f59e0b' : eq.status !== 'Operational' ? '4px solid #dc2626' : '4px solid #059669'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0' }}>{eq.name}</h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="badge" style={{ background: 'var(--green)' }}>{eq.type}</span>
                      <span className="badge" style={{ background: eq.status === 'Operational' ? '#059669' : eq.status === 'In Service' ? '#f59e0b' : '#dc2626' }}>
                        {eq.status}
                      </span>
                      <span className="badge" style={{ background: '#6b7280' }}>{eq.condition}</span>
                      {warrantyActive && <span className="badge" style={{ background: '#0284c7' }}>Under Warranty</span>}
                      {needsService && <span className="badge" style={{ background: '#f59e0b' }}>Service Due</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button className="tab-btn" onClick={() => setModalOpenId(eq.id)}>👁️ Details</button>
                    <button className="tab-btn" onClick={() => startEditEquipment(eq)}>✏️ Edit</button>
                    <button className="tab-btn" style={{ color: '#dc2626' }} onClick={() => removeEquipment(eq.id)}>🗑️</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', fontSize: '14px' }}>
                  <div>
                    <div className="muted">Manufacturer</div>
                    <div style={{ fontWeight: '600' }}>{eq.manufacturer || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="muted">Model / Year</div>
                    <div style={{ fontWeight: '600' }}>{eq.model || 'N/A'} • {eq.year}</div>
                  </div>
                  <div>
                    <div className="muted">Serial Number</div>
                    <div style={{ fontWeight: '600', fontSize: '12px' }}>{eq.serialNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="muted">Operating Hours</div>
                    <div style={{ fontWeight: '600' }}>{eq.hours ? `${eq.hours.toFixed(1)} hrs` : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="muted">Current Value</div>
                    <div style={{ fontWeight: '600', color: 'var(--green)', fontSize: '16px' }}>KES {(eq.currentValue || 0).toLocaleString('en-KE')}</div>
                  </div>
                  <div>
                    <div className="muted">Purchase Price</div>
                    <div style={{ fontWeight: '600' }}>KES {(eq.purchasePrice || 0).toLocaleString('en-KE')}</div>
                  </div>
                  <div>
                    <div className="muted">Depreciation Rate</div>
                    <div style={{ fontWeight: '600', color: '#ef4444' }}>
                      {(() => {
                        const years = eq.purchaseDate ? (new Date().getFullYear() - new Date(eq.purchaseDate).getFullYear()) : 0;
                        if (years > 0 && eq.purchasePrice > 0) {
                          const rate = ((eq.purchasePrice - eq.currentValue) / eq.purchasePrice) / years * 100;
                          return rate.toFixed(2) + '%/yr';
                        }
                        return 'N/A';
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="muted">Location</div>
                    <div style={{ fontWeight: '600' }}>{eq.location || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="muted">Person in Care</div>
                    <div style={{ fontWeight: '600' }}>{eq.personInCare || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="muted">Date Given</div>
                    <div style={{ fontWeight: '600' }}>{eq.dateGiven ? new Date(eq.dateGiven).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="muted">Purchase Date</div>
                    <div style={{ fontWeight: '600' }}>{eq.purchaseDate ? new Date(eq.purchaseDate).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="muted">Last Service</div>
                    <div style={{ fontWeight: '600' }}>{eq.lastServiceDate ? new Date(eq.lastServiceDate).toLocaleDateString() : 'Never'}</div>
                  </div>
                  <div>
                    <div className="muted">Next Service</div>
                    <div style={{ fontWeight: '600', color: needsService ? '#f59e0b' : '#6b7280' }}>
                      {eq.nextServiceDate ? new Date(eq.nextServiceDate).toLocaleDateString() : 'Not scheduled'}
                    </div>
                  </div>
                </div>

                {eq.servicePerson && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '6px', fontSize: '13px' }}>
                    <strong>Service Provider:</strong> {eq.servicePerson}
                    {eq.serviceContact && <span> • 📞 {eq.serviceContact}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {view === 'equipment' && filteredEquipment.length === 0 && (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚜</div>
          <h3>No equipment found</h3>
          <p className="muted">Adjust your filters or add new equipment</p>
        </div>
      )}

      {/* Orders Grid */}
      {view === 'orders' && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredOrders.map(order => {
            const tracking = Array.isArray(order.trackingSteps) ? order.trackingSteps : createTrackingSteps()
            const nextStepIndex = tracking.findIndex((step, idx) => idx > 0 && !step.completed)
            const canAdvance = nextStepIndex > 0 && tracking[nextStepIndex - 1]?.completed && order.status !== 'Cancelled' && order.status !== 'Delivered'

            return (
              <div key={order.id} className="card" style={{ padding: '16px', borderLeft: order.status === 'Delivered' ? '4px solid #059669' : order.status === 'Cancelled' ? '4px solid #dc2626' : '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0 }}>{order.listingTitle}</h3>
                      <span className="badge" style={{ background: '#1d4ed8' }}>{order.orderType || 'Order'}</span>
                      <span className="badge" style={{ background: order.status === 'Delivered' ? '#059669' : order.status === 'Cancelled' ? '#dc2626' : '#f59e0b' }}>{order.status}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '14px' }}>
                      <div><div className="muted">Order ID</div><strong>{order.id}</strong></div>
                      <div><div className="muted">Supplier</div><strong>{order.seller || 'N/A'}</strong></div>
                      <div><div className="muted">Order Date</div><strong>{order.orderDate || 'N/A'}</strong></div>
                      <div><div className="muted">Expected Delivery</div><strong>{order.expectedDelivery || 'N/A'}</strong></div>
                      <div><div className="muted">Quantity</div><strong>{order.quantity || 1} {order.unit || ''}</strong></div>
                      <div><div className="muted">Value</div><strong style={{ color: '#059669' }}>{order.currency || 'KES'} {(order.price || 0).toLocaleString('en-KE')}</strong></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button className="tab-btn" onClick={() => setModalOpenId(order.id)}>👁️ View</button>
                    <button className="tab-btn" onClick={() => startEditOrder(order)}>✏️ Edit</button>
                    <button className="tab-btn" disabled={!canAdvance} onClick={() => canAdvance && updateOrderStatus(order.id, nextStepIndex)}>➡️ Advance</button>
                    <button className="tab-btn" style={{ color: '#dc2626' }} disabled={order.status === 'Cancelled' || order.status === 'Delivered'} onClick={() => cancelOrder(order.id)}>✕ Cancel</button>
                  </div>
                </div>

                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Tracking Progress</div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {tracking.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: step.completed ? '#10b981' : '#e5e7eb', color: step.completed ? '#fff' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                          {step.completed ? '✓' : idx + 1}
                        </div>
                        <div style={{ fontSize: '13px' }}>
                          <div style={{ fontWeight: step.completed ? 700 : 500 }}>{step.step}</div>
                          {step.date && <div className="muted">{new Date(step.date).toLocaleString()}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view === 'orders' && filteredOrders.length === 0 && (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧾</div>
          <h3>No orders found</h3>
          <p className="muted">Create an order or adjust your filters</p>
        </div>
      )}

      {/* Supplies Items Grid */}
      {view === 'supplies' && lowStockItems.length > 0 && (
        <div className="card" style={{ padding: '16px', marginBottom: '16px', background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#92400e' }}>⚠️ Low Stock Alerts</h4>
          {lowStockItems.map(item => (
            <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #fbbf24' }}>
              <strong>{item.name}</strong> - {item.quantity} {item.unit} (Reorder at: {item.reorderPoint})
            </div>
          ))}
        </div>
      )}

      {/* Supplies Items Grid */}
      {view === 'supplies' && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredItems.map(item => {
          const isLowStock = item.quantity <= (item.reorderPoint || 0)
          const isExpiring = item.expiryDate && Math.floor((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) <= 90
          
          return (
            <div key={item.id} className="card" style={{ 
              padding: '16px',
              borderLeft: isLowStock ? '4px solid #f59e0b' : isExpiring ? '4px solid #dc2626' : 'none'
            }}>
              {inlineEditId === item.id ? (
                // Inline Edit Mode
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onKeyDown={handleKeyDown}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>⚡ Quick Edit</h4>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={saveInlineEdit} style={{ padding: '6px 16px', fontSize: '0.85rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✓ Save</button>
                      <button onClick={cancelInlineEdit} style={{ padding: '6px 16px', fontSize: '0.85rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✕ Cancel</button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 600 ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: 4 }}>Item Name *</label>
                      <input
                        type="text"
                        value={inlineData.name}
                        onChange={(e) => setInlineData({ ...inlineData, name: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                        autoFocus
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: 4 }}>Quantity *</label>
                      <input
                        type="number"
                        value={inlineData.quantity}
                        onChange={(e) => setInlineData({ ...inlineData, quantity: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: 4 }}>Unit Cost (KES)</label>
                      <input
                        type="number"
                        value={inlineData.unitCost}
                        onChange={(e) => setInlineData({ ...inlineData, unitCost: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: 4 }}>Location</label>
                      <input
                        type="text"
                        value={inlineData.location}
                        onChange={(e) => setInlineData({ ...inlineData, location: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: 4 }}>Reorder Point</label>
                      <input
                        type="number"
                        value={inlineData.reorderPoint}
                        onChange={(e) => setInlineData({ ...inlineData, reorderPoint: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: 4 }}>
                    💡 Press Enter to save, Escape to cancel
                  </div>
                </div>
              ) : (
                // Display Mode
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0 }}>{item.name}</h3>
                    <span className="badge" style={{ background: 'var(--green)' }}>{item.category}</span>
                    {isLowStock && <span className="badge" style={{ background: '#f59e0b' }}>Low Stock</span>}
                    {isExpiring && <span className="badge" style={{ background: '#dc2626' }}>Expiring Soon</span>}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', fontSize: '14px' }}>
                    <div>
                      <div className="muted">Stock Level</div>
                      <div style={{ fontWeight: '600', fontSize: '18px', color: isLowStock ? '#f59e0b' : '#059669' }}>
                        {item.quantity} {item.unit}
                      </div>
                    </div>
                    <div>
                      <div className="muted">Unit Cost</div>
                      <div style={{ fontWeight: '600' }}>KES {(item.unitCost || 0).toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                    <div>
                      <div className="muted">Total Value</div>
                      <div style={{ fontWeight: '600', color: 'var(--green)' }}>KES {(item.totalValue || 0).toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                    <div>
                      <div className="muted">Location</div>
                      <div style={{ fontWeight: '600' }}>{item.location}</div>
                    </div>
                    <div>
                      <div className="muted">Supplier</div>
                      <div style={{ fontWeight: '600' }}>{item.supplier || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="muted">Reorder Point</div>
                      <div style={{ fontWeight: '600' }}>{item.reorderPoint} {item.unit}</div>
                    </div>
                  </div>

                  {item.expiryDate && (
                    <div style={{ marginTop: '8px', fontSize: '13px' }}>
                      <span className="muted">Expires: </span>
                      <span style={{ color: isExpiring ? '#dc2626' : '#6b7280', fontWeight: '500' }}>
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button className="tab-btn" onClick={() => startInlineEdit(item)} title="Quick Edit">⚡ Quick</button>
                  <button className="tab-btn" onClick={() => createReorderFromItem(item)} title="Create Reorder">🛒 Order</button>
                  <button className="tab-btn" onClick={() => {
                    const amount = parseFloat(prompt('Enter quantity to add:', '0'))
                    if(amount && amount > 0) adjustQuantity(item.id, amount, 'Stock added')
                  }}>➕ Add</button>
                  <button className="tab-btn" onClick={() => {
                    const amount = parseFloat(prompt('Enter quantity to remove:', '0'))
                    if(amount && amount > 0) adjustQuantity(item.id, -amount, 'Stock used')
                  }}>➖ Use</button>
                  <button className="tab-btn" onClick={() => setModalOpenId(item.id)}>👁️ View</button>
                  <button className="tab-btn" onClick={() => startEdit(item)}>✏️ Full</button>
                  <button className="tab-btn" style={{ color: '#dc2626' }} onClick={() => remove(item.id)}>🗑️</button>
                </div>
              </div>
              )}
            </div>
          )
        })}
        </div>
      )}

      {view === 'supplies' && filteredItems.length === 0 && (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <h3>No items found</h3>
          <p className="muted">Adjust your filters or add new inventory items</p>
        </div>
      )}

      {/* Details Modal */}
      {modalOpenId && (() => {
        const item = items.find(i => i.id === modalOpenId)
        const eq = equipment.find(e => e.id === modalOpenId)
        const order = orders.find(o => o.id === modalOpenId)
        const record = item || eq || order
        if(!record) return null
        
        return (
            <div className="drawer-overlay" onClick={() => setModalOpenId(null)}>
              <div className="drawer" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>{record.name || record.listingTitle} — {record.id}</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!order && <button onClick={() => setShowRecordCV(record)} style={{ padding: '6px 10px', background: '#059669', color: 'white', border: 'none', borderRadius: 6 }}>👁️ View CV</button>}
                    <button onClick={() => setModalOpenId(null)}>✕ Close</button>
                  </div>
              </div>

              {/* Supplies Details */}
              {item && (
                <>
                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Inventory Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '14px' }}>
                      <div><strong>Category:</strong> {item.category}</div>
                      <div><strong>Subcategory:</strong> {item.subcategory || 'N/A'}</div>
                      <div><strong>Current Stock:</strong> {item.quantity} {item.unit}</div>
                      <div><strong>Unit Cost:</strong> KES {(item.unitCost || 0).toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      <div><strong>Total Value:</strong> KES {(item.totalValue || 0).toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      <div><strong>Quality:</strong> {item.quality}</div>
                      <div><strong>Location:</strong> {item.location}</div>
                      <div><strong>Supplier:</strong> {item.supplier || 'N/A'}</div>
                      <div><strong>Last Ordered:</strong> {item.lastOrdered || 'N/A'}</div>
                      <div><strong>Batch Number:</strong> {item.batchNumber || 'N/A'}</div>
                      <div><strong>Reorder Point:</strong> {item.reorderPoint} {item.unit}</div>
                      <div><strong>Reorder Qty:</strong> {item.reorderQuantity} {item.unit}</div>
                      {item.expiryDate && (
                        <div style={{ gridColumn: 'span 2' }}>
                          <strong>Expiry Date:</strong> {new Date(item.expiryDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {item.notes && (
                      <div style={{ marginTop: '12px' }}>
                        <strong>Notes:</strong>
                        <p style={{ margin: '4px 0 0 0' }}>{item.notes}</p>
                      </div>
                    )}
                  </div>

                  {item.history && item.history.length > 0 && (
                    <div className="card" style={{ padding: '16px' }}>
                      <h4>Transaction History</h4>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {item.history.map((h, idx) => (
                          <div key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>{h.date}</span>
                              <span style={{ color: h.adjustment > 0 ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
                                {h.adjustment > 0 ? '+' : ''}{h.adjustment} {item.unit}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                              {h.reason} • New stock: {h.newQuantity} {item.unit}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Equipment Details */}
              {eq && (
                <>
                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Equipment Specifications</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '14px' }}>
                      <div><strong>Type:</strong> {eq.type}</div>
                      <div><strong>Manufacturer:</strong> {eq.manufacturer || 'N/A'}</div>
                      <div><strong>Model:</strong> {eq.model || 'N/A'}</div>
                      <div><strong>Year:</strong> {eq.year}</div>
                      <div><strong>Serial Number:</strong> {eq.serialNumber || 'N/A'}</div>
                      <div><strong>Fuel Type:</strong> {eq.fuelType || 'N/A'}</div>
                      <div><strong>Operating Hours:</strong> {eq.hours ? `${eq.hours} hrs` : 'N/A'}</div>
                      <div><strong>Status:</strong> <span style={{ color: eq.status === 'Operational' ? '#059669' : '#dc2626', fontWeight: 'bold' }}>{eq.status}</span></div>
                      <div><strong>Condition:</strong> {eq.condition}</div>
                      <div><strong>Location:</strong> {eq.location || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Financial Information</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '14px' }}>
                      <div><strong>Purchase Date:</strong> {eq.purchaseDate ? new Date(eq.purchaseDate).toLocaleDateString() : 'N/A'}</div>
                      <div><strong>Purchase Price:</strong> KES {(eq.purchasePrice || 0).toLocaleString('en-KE')}</div>
                      <div><strong>Current Value:</strong> <span style={{ color: 'var(--green)', fontWeight: 'bold', fontSize: '16px' }}>KES {(eq.currentValue || 0).toLocaleString('en-KE')}</span></div>
                      <div><strong>Depreciation:</strong> {eq.purchasePrice ? `KES ${(eq.purchasePrice - (eq.currentValue || 0)).toLocaleString('en-KE')}` : 'N/A'}</div>
                      <div><strong>Insurance Policy:</strong> {eq.insurancePolicy || 'N/A'}</div>
                      <div><strong>Insurance Expiry:</strong> {eq.insuranceExpiry ? new Date(eq.insuranceExpiry).toLocaleDateString() : 'N/A'}</div>
                      <div><strong>Warranty Expiry:</strong> {eq.warrantyExpiry ? new Date(eq.warrantyExpiry).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Service Information</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '14px' }}>
                      <div><strong>Service Person/Company:</strong> {eq.servicePerson || 'N/A'}</div>
                      <div><strong>Contact:</strong> {eq.serviceContact || 'N/A'}</div>
                      <div><strong>Last Service Date:</strong> {eq.lastServiceDate ? new Date(eq.lastServiceDate).toLocaleDateString() : 'Never'}</div>
                      <div><strong>Next Service Date:</strong> {eq.nextServiceDate ? new Date(eq.nextServiceDate).toLocaleDateString() : 'Not scheduled'}</div>
                    </div>
                  </div>

                  {eq.notes && (
                    <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                      <h4>Notes</h4>
                      <p style={{ margin: 0, fontSize: '14px' }}>{eq.notes}</p>
                    </div>
                  )}

                  {eq.maintenanceHistory && eq.maintenanceHistory.length > 0 && (
                    <div className="card" style={{ padding: '16px' }}>
                      <h4>Maintenance History</h4>
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {eq.maintenanceHistory.sort((a, b) => new Date(b.date) - new Date(a.date)).map((m, idx) => (
                          <div key={idx} style={{ padding: '12px', marginBottom: '8px', background: '#f9fafb', borderRadius: '6px', borderLeft: '3px solid var(--green)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <div>
                                <strong style={{ fontSize: '14px' }}>{m.type}</strong>
                                <div style={{ fontSize: '12px', color: '#4b5563' }}>{new Date(m.date).toLocaleDateString()}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--green)' }}>${(m.cost || 0).toLocaleString()}</div>
                                {m.hours && <div style={{ fontSize: '12px', color: '#4b5563' }}>{m.hours} hours</div>}
                              </div>
                            </div>
                            <div style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>{m.description}</div>
                            {m.provider && <div style={{ fontSize: '12px', color: '#4b5563' }}>Provider: {m.provider}</div>}
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: '16px', padding: '12px', background: '#eff6ff', borderRadius: '6px' }}>
                        <strong>Total Maintenance Cost:</strong> <span style={{ fontSize: '18px', color: 'var(--green)', fontWeight: 'bold' }}>
                          ${eq.maintenanceHistory.reduce((sum, m) => sum + (m.cost || 0), 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Orders Details */}
              {order && (
                <>
                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Order Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '14px' }}>
                      <div><strong>Status:</strong> {order.status}</div>
                      <div><strong>Order Type:</strong> {order.orderType || 'Order'}</div>
                      <div><strong>Supplier:</strong> {order.seller || 'N/A'}</div>
                      <div><strong>Buyer:</strong> {order.buyer || 'N/A'}</div>
                      <div><strong>Order Date:</strong> {order.orderDate || 'N/A'}</div>
                      <div><strong>Expected Delivery:</strong> {order.expectedDelivery || 'N/A'}</div>
                      <div><strong>Payment Method:</strong> {order.paymentMethod || 'N/A'}</div>
                      <div><strong>Quantity:</strong> {order.quantity || 1} {order.unit || ''}</div>
                      <div><strong>Total Value:</strong> {order.currency || 'KES'} {(order.price || 0).toLocaleString('en-KE')}</div>
                    </div>
                    {order.notes && (
                      <div style={{ marginTop: '12px' }}>
                        <strong>Notes:</strong>
                        <p style={{ margin: '4px 0 0 0' }}>{order.notes}</p>
                      </div>
                    )}
                  </div>

                  {Array.isArray(order.trackingSteps) && order.trackingSteps.length > 0 && (
                    <div className="card" style={{ padding: '16px' }}>
                      <h4>Tracking Steps</h4>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {order.trackingSteps.map((step, idx) => {
                          const canComplete = idx > 0 && order.trackingSteps[idx - 1]?.completed && !step.completed && order.status !== 'Cancelled' && order.status !== 'Delivered'
                          return (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                              <div>
                                <strong>{step.step}</strong>
                                <div className="muted" style={{ fontSize: '12px' }}>{step.date ? new Date(step.date).toLocaleString() : 'Pending'}</div>
                              </div>
                              <button className="tab-btn" disabled={!canComplete} onClick={() => updateOrderStatus(order.id, idx)}>
                                {step.completed ? '✓ Completed' : canComplete ? 'Mark Complete' : 'Locked'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })()}

        {/* Record CV modal for inventory/equipment */}
        {showRecordCV && (
          <RecordCV
            entity={showRecordCV}
            title={`Record: ${showRecordCV.name || showRecordCV.id}`}
            fields={[
              { key: 'name', label: 'Name' },
              { key: 'id', label: 'ID' },
              { key: 'category', label: 'Category' },
              { key: 'quantity', label: 'Quantity' },
              { key: 'unit', label: 'Unit' },
              { key: 'unitCost', label: 'Unit Cost' },
              { key: 'totalValue', label: 'Total Value' },
              { key: 'location', label: 'Location' },
              { key: 'supplier', label: 'Supplier' }
            ]}
            onClose={() => setShowRecordCV(null)}
          />
        )}
      
      {/* Toast Notifications */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 20px',
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '400px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <span>{toast.message}</span>
          {toast.showUndo && (
            <button
              onClick={undoLastChange}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              ↶ Undo
            </button>
          )}
        </div>
      )}
    </div>
  )
}
