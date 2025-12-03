import React, { useEffect, useState } from 'react'
import { recordIncome } from '../lib/moduleIntegration'
import { exportToCSV, exportToExcel, exportToJSON, exportToPDF } from '../lib/exportImport'

const SAMPLE = [
  { id: 'MILK-001', animalId: 'A-012', date: '2025-11-28', timestamp: '2025-11-28T06:30:00', session: 'Morning', liters: 18.5, milkToCalf: 2.5, milkConsumed: 1.0, milkSold: 15.0, spoiledMilk: 0.5, spoiledMilkPrice: 0, spoiledMilkReason: 'Left unrefrigerated', fatContent: 3.8, proteinContent: 3.2, lactose: 4.8, solidsNotFat: 8.7, totalSolids: 12.5, scc: 150000, temp: 37.5, ph: 6.7, quality: 'Grade A', pricePerLiter: 45, totalPrice: 675, buyer: 'Brookside Dairy', sold: true, notes: 'Normal milking', milkerId: 'MKR-001', milkerName: 'John Kamau', milkingDuration: 8, equipmentUsed: 'Portable Milker', location: 'Barn A', weather: 'Sunny', feedQuality: 'Good', cowHealth: 'Excellent', lactationDay: 45, peakMilk: false, colostrum: false, antibiotics: false, withdrawal: false },
  { id: 'MILK-002', animalId: 'A-012', date: '2025-11-28', timestamp: '2025-11-28T18:00:00', session: 'Evening', liters: 16.2, milkToCalf: 2.0, milkConsumed: 1.2, milkSold: 13.0, spoiledMilk: 0, spoiledMilkPrice: 0, spoiledMilkReason: '', fatContent: 4.0, proteinContent: 3.3, lactose: 4.7, solidsNotFat: 8.6, totalSolids: 12.6, scc: 145000, temp: 37.2, ph: 6.8, quality: 'Grade A', pricePerLiter: 45, totalPrice: 585, buyer: 'Brookside Dairy', sold: true, notes: '', milkerId: 'MKR-001', milkerName: 'John Kamau', milkingDuration: 7, equipmentUsed: 'Portable Milker', location: 'Barn A', weather: 'Cloudy', feedQuality: 'Good', cowHealth: 'Excellent', lactationDay: 45, peakMilk: false, colostrum: false, antibiotics: false, withdrawal: false },
  { id: 'MILK-003', animalId: 'A-013', date: '2025-11-29', timestamp: '2025-11-29T06:45:00', session: 'Morning', liters: 14.8, milkToCalf: 1.8, milkConsumed: 1.0, milkSold: 12.0, spoiledMilk: 0.2, spoiledMilkPrice: 0, spoiledMilkReason: 'Spilled during transport', fatContent: 4.2, proteinContent: 3.4, lactose: 4.9, solidsNotFat: 8.8, totalSolids: 13.0, scc: 165000, temp: 37.3, ph: 6.7, quality: 'Grade A', pricePerLiter: 45, totalPrice: 540, buyer: 'Brookside Dairy', sold: true, notes: 'Jersey cow, rich milk', milkerId: 'MKR-002', milkerName: 'Mary Wanjiku', milkingDuration: 6, equipmentUsed: 'Hand Milking', location: 'Barn B', weather: 'Sunny', feedQuality: 'Excellent', cowHealth: 'Good', lactationDay: 120, peakMilk: false, colostrum: false, antibiotics: false, withdrawal: false }
]

const MILKING_SESSIONS = ['Morning', 'Midday', 'Evening', 'Night']
const QUALITY_GRADES = ['Grade A', 'Grade B', 'Grade C', 'Premium', 'Standard', 'Below Standard', 'Rejected']
const EQUIPMENT = ['Hand Milking', 'Portable Milker', 'Milking Machine', 'Automated System', 'Bucket Milking']
const WEATHER_CONDITIONS = ['Sunny', 'Cloudy', 'Rainy', 'Hot', 'Cold', 'Windy', 'Humid']
const FEED_QUALITY = ['Excellent', 'Good', 'Average', 'Poor']
const HEALTH_STATUS = ['Excellent', 'Good', 'Fair', 'Sick', 'Recovering', 'Under Treatment']

export default function AnimalMilkYield({ animals }){
      const [spoiledMilk, setSpoiledMilk] = useState('')
      const [spoiledMilkPrice, setSpoiledMilkPrice] = useState('')
      const [spoiledMilkReason, setSpoiledMilkReason] = useState('')
    // New fields for milk record
    const [milkToCalf, setMilkToCalf] = useState('')
    const [milkConsumed, setMilkConsumed] = useState('')
    const [milkSold, setMilkSold] = useState('')
  const KEY = 'cattalytics:animal:milkyield'
  const [items, setItems] = useState([])
  const [animalId, setAnimalId] = useState(animals && animals[0] ? animals[0].id : '')
  const [session, setSession] = useState('Morning')
  const [liters, setLiters] = useState('')
  const [fatContent, setFatContent] = useState('')
  const [proteinContent, setProteinContent] = useState('')
  const [lactose, setLactose] = useState('')
  const [solidsNotFat, setSolidsNotFat] = useState('')
  const [totalSolids, setTotalSolids] = useState('')
  const [scc, setScc] = useState('')
  const [temp, setTemp] = useState('')
  const [ph, setPh] = useState('')
  const [quality, setQuality] = useState('Grade A')
  const [pricePerLiter, setPricePerLiter] = useState('45')
  const [buyer, setBuyer] = useState('')
  const [sold, setSold] = useState(false)
  const [notes, setNotes] = useState('')
  const [milkerId, setMilkerId] = useState('')
  const [milkerName, setMilkerName] = useState('')
  const [milkingDuration, setMilkingDuration] = useState('')
  const [equipmentUsed, setEquipmentUsed] = useState('Portable Milker')
  const [location, setLocation] = useState('Barn A')
  const [weather, setWeather] = useState('Sunny')
  const [feedQuality, setFeedQuality] = useState('Good')
  const [cowHealth, setCowHealth] = useState('Good')
  const [lactationDay, setLactationDay] = useState('')
  const [peakMilk, setPeakMilk] = useState(false)
  const [colostrum, setColostrum] = useState(false)
  const [antibiotics, setAntibiotics] = useState(false)
  const [withdrawal, setWithdrawal] = useState(false)
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterAnimal, setFilterAnimal] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [filterSession, setFilterSession] = useState('all')
  
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineData, setInlineData] = useState({ liters: '', session: 'Morning', quality: 'Grade A', notes: '' })
  const [toast, setToast] = useState(null)
  const [lastChange, setLastChange] = useState(null)
  const [filterQuality, setFilterQuality] = useState('all')
  const [viewMode, setViewMode] = useState('list')
  const [editingId, setEditingId] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  // Auto-calculate derived values
  useEffect(() => {
    if(fatContent && proteinContent && lactose) {
      const fat = parseFloat(fatContent) || 0
      const protein = parseFloat(proteinContent) || 0
      const lact = parseFloat(lactose) || 0
      const snf = protein + lact + 0.7 // Approximate SNF
      const ts = fat + snf
      if(!solidsNotFat || parseFloat(solidsNotFat) === 0) setSolidsNotFat(snf.toFixed(1))
      if(!totalSolids || parseFloat(totalSolids) === 0) setTotalSolids(ts.toFixed(1))
    }
  }, [fatContent, proteinContent, lactose])

  function add(){
      const spoiledMilkAmount = parseFloat(spoiledMilk) || 0
      const spoiledMilkPriceAmount = parseFloat(spoiledMilkPrice) || 0
      const spoiledMilkReasonText = spoiledMilkReason.trim()
    if(!animalId || !liters) {
      alert('Please select animal and enter milk quantity')
      return
    }
    const literAmount = parseFloat(liters)
    const milkToCalfAmount = parseFloat(milkToCalf) || 0
    const milkConsumedAmount = parseFloat(milkConsumed) || 0
    const milkSoldAmount = parseFloat(milkSold) || 0
    const priceAmount = parseFloat(pricePerLiter) || 0
    const totalPrice = milkSoldAmount * priceAmount
    const animalName = animals?.find(a => a.id === animalId)?.name || animalId
    
    if(editingId) {
      // Update existing record
      setItems(items.map(item => 
        item.id === editingId 
          ? {
              ...item,
              animalId,
              animalName,
              session,
              liters: literAmount,
              milkToCalf: milkToCalfAmount,
              milkConsumed: milkConsumedAmount,
              milkSold: milkSoldAmount,
              spoiledMilk: spoiledMilkAmount,
              spoiledMilkPrice: spoiledMilkPriceAmount,
              spoiledMilkReason: spoiledMilkReasonText,
              fatContent: parseFloat(fatContent) || null,
              proteinContent: parseFloat(proteinContent) || null,
              lactose: parseFloat(lactose) || null,
              solidsNotFat: parseFloat(solidsNotFat) || null,
              totalSolids: parseFloat(totalSolids) || null,
              scc: parseInt(scc) || null,
              temp: parseFloat(temp) || null,
              ph: parseFloat(ph) || null,
              quality,
              pricePerLiter: priceAmount,
              totalPrice,
              buyer: buyer.trim() || 'Not specified',
              sold,
              notes: notes.trim(),
              milkerId: milkerId.trim(),
              milkerName: milkerName.trim(),
              milkingDuration: parseInt(milkingDuration) || null,
              equipmentUsed,
              location: location.trim(),
              weather,
              feedQuality,
              cowHealth,
              lactationDay: parseInt(lactationDay) || null,
              peakMilk,
              colostrum,
              antibiotics,
              withdrawal
            }
          : item
      ))
      setEditingId(null)
      // Update existing record
      setItems(items.map(item => 
        item.id === editingId 
          ? {
              ...item,
              animalId,
              animalName,
              session,
              liters: literAmount,
              milkToCalf: milkToCalfAmount,
              milkConsumed: milkConsumedAmount,
              milkSold: milkSoldAmount,
              fatContent: parseFloat(fatContent) || null,
              proteinContent: parseFloat(proteinContent) || null,
              lactose: parseFloat(lactose) || null,
              solidsNotFat: parseFloat(solidsNotFat) || null,
              totalSolids: parseFloat(totalSolids) || null,
              scc: parseInt(scc) || null,
              temp: parseFloat(temp) || null,
              ph: parseFloat(ph) || null,
              quality,
              pricePerLiter: priceAmount,
              totalPrice,
              buyer: buyer.trim() || 'Not specified',
              sold,
              notes: notes.trim(),
              milkerId: milkerId.trim(),
              milkerName: milkerName.trim(),
              milkingDuration: parseInt(milkingDuration) || null,
              equipmentUsed,
              location: location.trim(),
              weather,
              feedQuality,
              cowHealth,
              lactationDay: parseInt(lactationDay) || null,
              peakMilk,
              colostrum,
              antibiotics,
              withdrawal
            }
          : item
      ))
      setEditingId(null)
    } else {
      // Create new record
      const id = 'MILK-' + Math.floor(1000 + Math.random()*9000)
      
      const newItem = {
        id,
        animalId,
        animalName,
        date: new Date().toISOString().slice(0,10),
        timestamp: new Date().toISOString(),
        session,
        liters: literAmount,
        milkToCalf: milkToCalfAmount,
        milkConsumed: milkConsumedAmount,
        milkSold: milkSoldAmount,
        fatContent: parseFloat(fatContent) || null,
        proteinContent: parseFloat(proteinContent) || null,
        lactose: parseFloat(lactose) || null,
        solidsNotFat: parseFloat(solidsNotFat) || null,
        totalSolids: parseFloat(totalSolids) || null,
        scc: parseInt(scc) || null,
        temp: parseFloat(temp) || null,
        ph: parseFloat(ph) || null,
        quality,
        pricePerLiter: priceAmount,
        totalPrice,
        buyer: buyer.trim() || 'Not specified',
        sold: sold,
        notes: notes.trim(),
        milkerId: milkerId.trim(),
        milkerName: milkerName.trim(),
        milkingDuration: parseInt(milkingDuration) || null,
        equipmentUsed,
        location: location.trim(),
        weather,
        feedQuality,
        cowHealth,
        lactationDay: parseInt(lactationDay) || null,
        peakMilk,
        colostrum,
        antibiotics,
        withdrawal
      }
      setItems([...items, newItem])
      
      // Auto-record income in Finance if sold
      if(sold && totalPrice > 0) {
        recordIncome({
          amount: totalPrice,
          category: 'Milk Sales',
          subcategory: buyer ? 'Direct Sales' : 'Wholesale',
          description: `Milk from ${animalName}: ${literAmount} liters @ ${priceAmount}/liter`,
          vendor: buyer || 'Dairy Buyer',
          source: 'Milk Yield',
          linkedId: id,
          date: newItem.date
        })
      }
    }
    
    resetForm()
  }

  function resetForm() {
        setSpoiledMilk('')
        setSpoiledMilkPrice('')
        setSpoiledMilkReason('')
      setMilkToCalf('')
      setMilkConsumed('')
      setMilkSold('')
    setLiters('')
    setFatContent('')
    setProteinContent('')
    setLactose('')
    setSolidsNotFat('')
    setTotalSolids('')
    setScc('')
    setTemp('')
    setPh('')
    setPricePerLiter('45')
    setBuyer('')
    setSold(false)
    setNotes('')
    setMilkerId('')
    setMilkerName('')
    setMilkingDuration('')
    setEquipmentUsed('Portable Milker')
    setLocation('Barn A')
    setWeather('Sunny')
    setFeedQuality('Good')
    setCowHealth('Good')
    setLactationDay('')
    setPeakMilk(false)
    setColostrum(false)
    setAntibiotics(false)
    setWithdrawal(false)
    setShowAddForm(false)
  }

  function remove(id){ if(!confirm('Delete record '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }

  function startInlineEdit(item) {
    setInlineEditId(item.id)
    setInlineData({ 
      liters: item.liters || '', 
      session: item.session || 'Morning',
      quality: item.quality || 'Grade A',
      notes: item.notes || ''
    })
  }

  function saveInlineEdit() {
    if (!inlineData.liters || Number(inlineData.liters) <= 0) {
      setToast({ type: 'error', message: 'Liters must be greater than 0' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    const updated = items.map(item => {
      if (item.id === inlineEditId) {
        setLastChange({ type: 'edit', item: { ...item } })
        return { 
          ...item, 
          liters: Number(inlineData.liters),
          session: inlineData.session,
          quality: inlineData.quality,
          notes: inlineData.notes.trim()
        }
      }
      return item
    })
    setItems(updated)
    setToast({ type: 'success', message: 'Milk record updated', showUndo: true })
    setTimeout(() => setToast(null), 5000)
    setInlineEditId(null)
  }

  function cancelInlineEdit() {
    setInlineEditId(null)
    setInlineData({ liters: '', session: 'Morning', quality: 'Grade A', notes: '' })
  }

  function undoLastChange() {
    if (lastChange) {
      setItems(items.map(i => i.id === lastChange.item.id ? lastChange.item : i))
      setToast({ type: 'success', message: 'Change reverted' })
      setTimeout(() => setToast(null), 3000)
      setLastChange(null)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); saveInlineEdit() }
    else if (e.key === 'Escape') cancelInlineEdit()
  }

  function startEdit(item){
        setSpoiledMilk(item.spoiledMilk ? String(item.spoiledMilk) : '')
        setSpoiledMilkPrice(item.spoiledMilkPrice ? String(item.spoiledMilkPrice) : '')
        setSpoiledMilkReason(item.spoiledMilkReason || '')
      setMilkToCalf(item.milkToCalf ? String(item.milkToCalf) : '')
      setMilkConsumed(item.milkConsumed ? String(item.milkConsumed) : '')
      setMilkSold(item.milkSold ? String(item.milkSold) : '')
    setEditingId(item.id)
    setAnimalId(item.animalId)
    setSession(item.session)
    setLiters(String(item.liters))
    setFatContent(item.fatContent ? String(item.fatContent) : '')
    setProteinContent(item.proteinContent ? String(item.proteinContent) : '')
    setLactose(item.lactose ? String(item.lactose) : '')
    setSolidsNotFat(item.solidsNotFat ? String(item.solidsNotFat) : '')
    setTotalSolids(item.totalSolids ? String(item.totalSolids) : '')
    setScc(item.scc ? String(item.scc) : '')
    setTemp(item.temp ? String(item.temp) : '')
    setPh(item.ph ? String(item.ph) : '')
    setQuality(item.quality)
    setPricePerLiter(String(item.pricePerLiter))
    setBuyer(item.buyer || '')
    setSold(item.sold)
    setNotes(item.notes || '')
    setMilkerId(item.milkerId || '')
    setMilkerName(item.milkerName || '')
    setMilkingDuration(item.milkingDuration ? String(item.milkingDuration) : '')
    setEquipmentUsed(item.equipmentUsed || 'Portable Milker')
    setLocation(item.location || 'Barn A')
    setWeather(item.weather || 'Sunny')
    setFeedQuality(item.feedQuality || 'Good')
    setCowHealth(item.cowHealth || 'Good')
    setLactationDay(item.lactationDay ? String(item.lactationDay) : '')
    setPeakMilk(item.peakMilk || false)
    setColostrum(item.colostrum || false)
    setAntibiotics(item.antibiotics || false)
    setWithdrawal(item.withdrawal || false)
    setShowAddForm(true)
  }

  function cancelEdit(){
    setEditingId(null)
    resetForm()
    if(animals && animals[0]) setAnimalId(animals[0].id)
  }

  const filteredItems = items.filter(item => {
    if(filterAnimal !== 'all' && item.animalId !== filterAnimal) return false
    if(filterDate && item.date !== filterDate) return false
    if(filterSession !== 'all' && item.session !== filterSession) return false
    if(filterQuality !== 'all' && item.quality !== filterQuality) return false
    return true
  })

  // Calculate comprehensive statistics
  // Move uniqueDays and monthGroups initialization above their usage
  const uniqueDays = Array.from(new Set(filteredItems.map(i => i.date)));
  const monthGroups = {};
  filteredItems.forEach(item => {
    const month = item.date ? item.date.slice(0,7) : '';
    if(!monthGroups[month]) monthGroups[month] = { milk: 0, toCalf: 0, consumed: 0, sold: 0, revenue: 0 };
    monthGroups[month].milk += item.liters || 0;
    monthGroups[month].toCalf += item.milkToCalf || 0;
    monthGroups[month].consumed += item.milkConsumed || 0;
    monthGroups[month].sold += item.milkSold || 0;
    monthGroups[month].revenue += item.totalPrice || 0;
  });
  // Spoiled milk calculations
  Object.keys(monthGroups).forEach(month => {
    monthGroups[month].spoiled = filteredItems.filter(i => i.date && i.date.slice(0,7) === month).reduce((sum, i) => sum + (i.spoiledMilk || 0), 0);
    monthGroups[month].spoiledPrice = filteredItems.filter(i => i.date && i.date.slice(0,7) === month).reduce((sum, i) => sum + (i.spoiledMilkPrice || 0), 0);
  });
  const totalSpoiledMilk = filteredItems.reduce((sum, item) => sum + (item.spoiledMilk || 0), 0);
  const totalSpoiledMilkPrice = filteredItems.reduce((sum, item) => sum + (item.spoiledMilkPrice || 0), 0);
  const avgDailySpoiledMilk = uniqueDays.length > 0 ? totalSpoiledMilk / uniqueDays.length : 0;
  const avgDailySpoiledMilkPrice = uniqueDays.length > 0 ? totalSpoiledMilkPrice / uniqueDays.length : 0;
  const totalMilk = filteredItems.reduce((sum, item) => sum + (item.liters || 0), 0);
  const totalMilkToCalf = filteredItems.reduce((sum, item) => sum + (item.milkToCalf || 0), 0);
  const totalMilkConsumed = filteredItems.reduce((sum, item) => sum + (item.milkConsumed || 0), 0)
  const totalMilkSold = filteredItems.reduce((sum, item) => sum + (item.milkSold || 0), 0)
  const totalRevenue = filteredItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
  const unsoldMilk = totalMilk - totalMilkSold
  // (Already declared above)
  const avgDailyMilk = uniqueDays.length > 0 ? totalMilk / uniqueDays.length : 0
  const avgDailyMilkToCalf = uniqueDays.length > 0 ? totalMilkToCalf / uniqueDays.length : 0
  const avgDailyMilkConsumed = uniqueDays.length > 0 ? totalMilkConsumed / uniqueDays.length : 0
  const avgDailyMilkSold = uniqueDays.length > 0 ? totalMilkSold / uniqueDays.length : 0
  const avgDailyRevenue = uniqueDays.length > 0 ? totalRevenue / uniqueDays.length : 0
  const avgFat = filteredItems.filter(i => i.fatContent).length > 0 
    ? filteredItems.reduce((sum, i) => sum + (i.fatContent || 0), 0) / filteredItems.filter(i => i.fatContent).length 
    : 0
  const avgProtein = filteredItems.filter(i => i.proteinContent).length > 0
    ? filteredItems.reduce((sum, i) => sum + (i.proteinContent || 0), 0) / filteredItems.filter(i => i.proteinContent).length
    : 0
  const avgLactose = filteredItems.filter(i => i.lactose).length > 0
    ? filteredItems.reduce((sum, i) => sum + (i.lactose || 0), 0) / filteredItems.filter(i => i.lactose).length
    : 0
  const avgSNF = filteredItems.filter(i => i.solidsNotFat).length > 0
    ? filteredItems.reduce((sum, i) => sum + (i.solidsNotFat || 0), 0) / filteredItems.filter(i => i.solidsNotFat).length
    : 0
  const avgTS = filteredItems.filter(i => i.totalSolids).length > 0
    ? filteredItems.reduce((sum, i) => sum + (i.totalSolids || 0), 0) / filteredItems.filter(i => i.totalSolids).length
    : 0
  const avgSCC = filteredItems.filter(i => i.scc).length > 0
    ? filteredItems.reduce((sum, i) => sum + (i.scc || 0), 0) / filteredItems.filter(i => i.scc).length
    : 0
  const avgTemp = filteredItems.filter(i => i.temp).length > 0
    ? filteredItems.reduce((sum, i) => sum + (i.temp || 0), 0) / filteredItems.filter(i => i.temp).length
    : 0
  const avgPh = filteredItems.filter(i => i.ph).length > 0
    ? filteredItems.reduce((sum, i) => sum + (i.ph || 0), 0) / filteredItems.filter(i => i.ph).length
    : 0
  const avgDuration = filteredItems.filter(i => i.milkingDuration).length > 0
    ? filteredItems.reduce((sum, i) => sum + (i.milkingDuration || 0), 0) / filteredItems.filter(i => i.milkingDuration).length
    : 0
  
  // Quality distribution
  const qualityDist = {}
  filteredItems.forEach(item => {
    qualityDist[item.quality] = (qualityDist[item.quality] || 0) + 1
  })
  
  // Session distribution
  const sessionDist = {}
  filteredItems.forEach(item => {
    sessionDist[item.session] = (sessionDist[item.session] || 0) + (item.liters || 0)
  })

  // Mastitis alerts (high SCC)
  const mastitisAlerts = filteredItems.filter(i => i.scc && i.scc > 400000)
  const qualityIssues = filteredItems.filter(i => ['Below Standard', 'Rejected', 'Grade C'].includes(i.quality))
  const antibioticMilk = filteredItems.filter(i => i.antibiotics || i.withdrawal)

  // Animal production summary
  const animalProduction = {}
  filteredItems.forEach(item => {
    if(!animalProduction[item.animalId]) {
      animalProduction[item.animalId] = { total: 0, count: 0, sessions: {} }
    }
    animalProduction[item.animalId].total += item.liters || 0
    animalProduction[item.animalId].count += 1
    if(!animalProduction[item.animalId].sessions[item.session]) {
      animalProduction[item.animalId].sessions[item.session] = 0
    }
    animalProduction[item.animalId].sessions[item.session] += item.liters || 0
  })

  // Export functions
  const handleExportCSV = () => {
    const data = filteredItems.map(item => ({
      ID: item.id,
      Date: item.date,
      Time: new Date(item.timestamp).toLocaleTimeString(),
      Animal: item.animalName || item.animalId,
      Session: item.session,
      Liters: item.liters,
      Fat: item.fatContent || 'N/A',
      Protein: item.proteinContent || 'N/A',
      Lactose: item.lactose || 'N/A',
      SNF: item.solidsNotFat || 'N/A',
      TotalSolids: item.totalSolids || 'N/A',
      SCC: item.scc || 'N/A',
      Temp: item.temp || 'N/A',
      pH: item.ph || 'N/A',
      Quality: item.quality,
      Price: item.pricePerLiter,
      Total: item.totalPrice,
      Sold: item.sold ? 'Yes' : 'No',
      Buyer: item.buyer || 'N/A',
      Milker: item.milkerName || 'N/A',
      Duration: item.milkingDuration || 'N/A',
      Equipment: item.equipmentUsed || 'N/A',
      Location: item.location || 'N/A',
      Weather: item.weather || 'N/A',
      FeedQuality: item.feedQuality || 'N/A',
      CowHealth: item.cowHealth || 'N/A',
      LactationDay: item.lactationDay || 'N/A',
      PeakMilk: item.peakMilk ? 'Yes' : 'No',
      Colostrum: item.colostrum ? 'Yes' : 'No',
      Antibiotics: item.antibiotics ? 'Yes' : 'No',
      Withdrawal: item.withdrawal ? 'Yes' : 'No'
    }))
    exportToCSV(data, 'comprehensive_milk_production.csv')
  }

  const handleExportPDF = () => {
    const data = filteredItems.map(item => ({
      Date: item.date,
      Animal: item.animalName || item.animalId,
      Session: item.session,
      Liters: item.liters,
      Quality: item.quality,
      'Price/L': `KES ${item.pricePerLiter}`,
      Total: `KES ${item.totalPrice}`,
      Sold: item.sold ? 'Yes' : 'No'
    }))
    exportToPDF(data, 'comprehensive_milk_production', 'Comprehensive Milk Production Records')
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h3>🥛 Comprehensive Milk Production Tracker</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={handleExportCSV} title="Export to CSV" style={{ fontSize: 12 }}>📊 CSV</button>
          <button onClick={() => exportToExcel(filteredItems, 'milk_production.xlsx')} title="Export to Excel" style={{ fontSize: 12 }}>📈 Excel</button>
          <button onClick={handleExportPDF} title="Export to PDF" style={{ fontSize: 12 }}>📕 PDF</button>
          <button onClick={() => exportToJSON(filteredItems, 'milk_production.json')} title="Export to JSON" style={{ fontSize: 12 }}>📄 JSON</button>
          <button className={viewMode === 'list' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewMode('list')}>📋 List</button>
          <button className={viewMode === 'summary' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewMode('summary')}>📊 Summary</button>
          <button className={viewMode === 'analytics' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewMode('analytics')}>📈 Analytics</button>
          <button onClick={() => setShowAddForm(!showAddForm)} style={{ background: showAddForm ? '#dc2626' : '#059669', color: 'white' }}>
            {showAddForm ? (editingId ? '✕ Cancel Edit' : '✕ Cancel') : '+ Add Milk Record'}
          </button>
        </div>
      </div>

      {/* Alerts Section */}
      {(mastitisAlerts.length > 0 || qualityIssues.length > 0 || antibioticMilk.length > 0) && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {mastitisAlerts.length > 0 && (
            <div className="card" style={{ padding: 12, background: '#fee2e2', border: '2px solid #dc2626', flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 'bold', color: '#dc2626', marginBottom: 4 }}>⚠️ Mastitis Alert</div>
              <div style={{ fontSize: 13 }}>{mastitisAlerts.length} record(s) with SCC > 400,000</div>
            </div>
          )}
          {qualityIssues.length > 0 && (
            <div className="card" style={{ padding: 12, background: '#fef3c7', border: '2px solid #f59e0b', flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 'bold', color: '#f59e0b', marginBottom: 4 }}>⚠️ Quality Issues</div>
              <div style={{ fontSize: 13 }}>{qualityIssues.length} record(s) with quality concerns</div>
            </div>
          )}
          {antibioticMilk.length > 0 && (
            <div className="card" style={{ padding: 12, background: '#dbeafe', border: '2px solid #2563eb', flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 'bold', color: '#2563eb', marginBottom: 4 }}>💊 Antibiotic Withdrawal</div>
              <div style={{ fontSize: 13 }}>{antibioticMilk.length} record(s) under antibiotic treatment</div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
                <div className="card" style={{ padding: 16, background: '#fee2e2' }}>
                  <div style={{ fontSize: 11, color: '#dc2626', marginBottom: 4 }}>Spoiled Milk</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626' }}>{totalSpoiledMilk.toFixed(1)} L</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Loss: KES {totalSpoiledMilkPrice.toFixed(0)}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Avg/day: {avgDailySpoiledMilk.toFixed(1)} L</div>
                </div>
        <div className="card" style={{ padding: 16, background: '#f0fdf4' }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Total Milk Produced</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{totalMilk.toFixed(1)} L</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{filteredItems.length} records</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#e0f2fe' }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Milk Given to Calf</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0284c7' }}>{totalMilkToCalf.toFixed(1)} L</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Avg/day: {avgDailyMilkToCalf.toFixed(1)} L</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#dbeafe' }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Milk Consumed</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>{totalMilkConsumed.toFixed(1)} L</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Avg/day: {avgDailyMilkConsumed.toFixed(1)} L</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#e0f2fe' }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Milk Sold</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0284c7' }}>{totalMilkSold.toFixed(1)} L</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Avg/day: {avgDailyMilkSold.toFixed(1)} L</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#d1fae5' }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Total Revenue (Sold Milk)</div>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: '#059669' }}>KES {totalRevenue.toFixed(0)}</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Avg/day: KES {avgDailyRevenue.toFixed(0)}</div>
        </div>
        <div className="card" style={{ padding: 16, background: unsoldMilk > 0 ? '#fef3c7' : '#eff6ff' }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Unsold Milk</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: unsoldMilk > 0 ? '#f59e0b' : '#2563eb' }}>{unsoldMilk.toFixed(1)} L</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{((unsoldMilk/totalMilk)*100 || 0).toFixed(0)}% unsold</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#eff6ff' }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Avg Daily Total Milk</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>{avgDailyMilk.toFixed(1)} L</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>per day</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#fef3c7' }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Avg Fat %</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>{avgFat > 0 ? avgFat.toFixed(2) : 'N/A'}</div>
          {avgFat > 0 && <div style={{ fontSize: 11, color: avgFat >= 3.5 ? '#059669' : '#f59e0b', marginTop: 4 }}>{avgFat >= 3.5 ? 'Good' : 'Below Std'}</div>}
        </div>
        <div className="card" style={{ padding: 16, background: '#dbeafe' }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Avg Protein %</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0284c7' }}>{avgProtein > 0 ? avgProtein.toFixed(2) : 'N/A'}</div>
          {avgProtein > 0 && <div style={{ fontSize: 11, color: avgProtein >= 3.0 ? '#059669' : '#f59e0b', marginTop: 4 }}>{avgProtein >= 3.0 ? 'Good' : 'Below Std'}</div>}
        </div>
        {avgLactose > 0 && (
          <div className="card" style={{ padding: 16, background: '#f3e8ff' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Avg Lactose %</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#9333ea' }}>{avgLactose.toFixed(2)}</div>
          </div>
        )}
        {avgSNF > 0 && (
          <div className="card" style={{ padding: 16, background: '#e0e7ff' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Avg SNF %</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#4f46e5' }}>{avgSNF.toFixed(2)}</div>
          </div>
        )}
        {avgTS > 0 && (
          <div className="card" style={{ padding: 16, background: '#fce7f3' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Avg Total Solids %</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#db2777' }}>{avgTS.toFixed(2)}</div>
          </div>
        )}
        {avgSCC > 0 && (
          <div className="card" style={{ padding: 16, background: avgSCC < 200000 ? '#d1fae5' : avgSCC < 400000 ? '#fef3c7' : '#fee2e2' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Avg SCC</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: avgSCC < 200000 ? '#059669' : avgSCC < 400000 ? '#f59e0b' : '#dc2626' }}>
              {(avgSCC / 1000).toFixed(0)}k
            </div>
            <div style={{ fontSize: 11, color: avgSCC < 200000 ? '#059669' : avgSCC < 400000 ? '#f59e0b' : '#dc2626', marginTop: 4 }}>
              {avgSCC < 200000 ? 'Excellent' : avgSCC < 400000 ? 'Good' : 'High'}
            </div>
          </div>
        )}
        {avgTemp > 0 && (
          <div className="card" style={{ padding: 16, background: '#fef3c7' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Avg Temp °C</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: avgTemp >= 36 && avgTemp <= 38 ? '#059669' : '#f59e0b' }}>{avgTemp.toFixed(1)}</div>
            <div style={{ fontSize: 11, color: avgTemp >= 36 && avgTemp <= 38 ? '#059669' : '#f59e0b', marginTop: 4 }}>
              {avgTemp >= 36 && avgTemp <= 38 ? 'Normal' : 'Check'}
            </div>
          </div>
        )}
        {avgPh > 0 && (
          <div className="card" style={{ padding: 16, background: '#e0f2fe' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Avg pH</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: avgPh >= 6.5 && avgPh <= 6.8 ? '#059669' : '#f59e0b' }}>{avgPh.toFixed(2)}</div>
            <div style={{ fontSize: 11, color: avgPh >= 6.5 && avgPh <= 6.8 ? '#059669' : '#f59e0b', marginTop: 4 }}>
              {avgPh >= 6.5 && avgPh <= 6.8 ? 'Normal' : 'Abnormal'}
            </div>
          </div>
        )}
        {avgDuration > 0 && (
          <div className="card" style={{ padding: 16, background: '#f0fdf4' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Avg Duration</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{avgDuration.toFixed(0)} min</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>per session</div>
          </div>
        )}
      </div>

      {/* Comprehensive Add/Edit Form */}
            {/* Monthly Totals Table */}
            <div style={{ marginBottom: 20 }}>
              <h5 style={{ color: '#059669', marginBottom: 8 }}>📅 Monthly Totals</h5>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f0fdf4' }}>
                    <th style={{ padding: '6px 8px', border: '1px solid #ddd' }}>Month</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #ddd' }}>Total Milk</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #ddd' }}>To Calf</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #ddd' }}>Consumed</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #ddd' }}>Sold</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #ddd' }}>Revenue</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #ddd' }}>Spoiled Milk</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(monthGroups).map(([month, vals]) => (
                    <tr key={month} style={{ background: '#fff' }}>
                      <td style={{ padding: '6px 8px', border: '1px solid #eee' }}>{month}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #eee' }}>{vals.milk.toFixed(1)} L</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #eee' }}>{vals.toCalf.toFixed(1)} L</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #eee' }}>{vals.consumed.toFixed(1)} L</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #eee' }}>{vals.sold.toFixed(1)} L</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #eee' }}>KES {vals.revenue.toFixed(0)}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #eee' }}>{(vals.spoiled || 0).toFixed(1)} L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      {showAddForm && (
        <div className="card" style={{ padding: 20, marginBottom: 20, background: '#f9fafb', border: '2px solid #059669' }}>
          <h4 style={{ marginTop: 0, color: '#059669' }}>
            {editingId ? '✏️ Edit Milk Production Record' : '➕ Add Comprehensive Milk Production Record'}
          </h4>
          
          {/* Basic Information */}
          <h5 style={{ marginTop: 16, marginBottom: 12, color: '#666' }}>📋 Basic Information</h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <label>Animal *</label>
              <select value={animalId} onChange={e => setAnimalId(e.target.value)} required>
                <option value="">-- Select Animal --</option>
                {(animals||[]).filter(a => a.sex === 'F' && (a.lactationStatus === 'Lactating' || a.lactationStatus === 'Heifer' || !a.lactationStatus)).map(a => (
                  <option key={a.id} value={a.id}>{a.name || a.tag} ({a.breed}) - {a.lactationStatus || 'Active'}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Milking Session *</label>
              <select value={session} onChange={e => setSession(e.target.value)} required>
                {MILKING_SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Quantity (Liters) *</label>
              <input type="number" step="0.1" min="0" value={liters} onChange={e => setLiters(e.target.value)} placeholder="0.0" required />
            </div>
            <div>
              <label>Lactation Day</label>
              <input type="number" min="0" value={lactationDay} onChange={e => setLactationDay(e.target.value)} placeholder="Days in milk" />
            </div>
          </div>

          {/* Milk Quality Parameters */}
          <h5 style={{ marginTop: 16, marginBottom: 12, color: '#666' }}>🧪 Milk Quality Parameters</h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div>
              <label>Fat Content (%)</label>
              <input type="number" step="0.01" min="0" max="10" value={fatContent} onChange={e => setFatContent(e.target.value)} placeholder="e.g., 3.8" />
              <div style={{ fontSize: 11, color: '#888' }}>Std: 3.5-5.0%</div>
            </div>
            <div>
              <label>Protein Content (%)</label>
              <input type="number" step="0.01" min="0" max="10" value={proteinContent} onChange={e => setProteinContent(e.target.value)} placeholder="e.g., 3.2" />
              <div style={{ fontSize: 11, color: '#888' }}>Std: 3.0-3.5%</div>
            </div>
            <div>
              <label>Lactose (%)</label>
              <input type="number" step="0.01" min="0" max="10" value={lactose} onChange={e => setLactose(e.target.value)} placeholder="e.g., 4.8" />
              <div style={{ fontSize: 11, color: '#888' }}>Std: 4.6-5.0%</div>
            </div>
            <div>
              <label>Solids-Not-Fat (%)</label>
              <input type="number" step="0.01" min="0" max="15" value={solidsNotFat} onChange={e => setSolidsNotFat(e.target.value)} placeholder="Auto-calc" />
              <div style={{ fontSize: 11, color: '#888' }}>Std: 8.5-9.0%</div>
            </div>
            <div>
              <label>Total Solids (%)</label>
              <input type="number" step="0.01" min="0" max="20" value={totalSolids} onChange={e => setTotalSolids(e.target.value)} placeholder="Auto-calc" />
              <div style={{ fontSize: 11, color: '#888' }}>Std: 12-13%</div>
            </div>
            <div>
              <label>SCC (cells/mL)</label>
              <input type="number" min="0" value={scc} onChange={e => setScc(e.target.value)} placeholder="e.g., 150000" />
              <div style={{ fontSize: 11, color: '#888' }}>Good: &lt;200k</div>
            </div>
            <div>
              <label>Temperature (°C)</label>
              <input type="number" step="0.1" min="30" max="45" value={temp} onChange={e => setTemp(e.target.value)} placeholder="e.g., 37.5" />
              <div style={{ fontSize: 11, color: '#888' }}>Normal: 36-38°C</div>
            </div>
            <div>
              <label>pH Level</label>
              <input type="number" step="0.01" min="6" max="7.5" value={ph} onChange={e => setPh(e.target.value)} placeholder="e.g., 6.7" />
              <div style={{ fontSize: 11, color: '#888' }}>Normal: 6.5-6.8</div>
            </div>
            <div>
              <label>Quality Grade</label>
              <select value={quality} onChange={e => setQuality(e.target.value)}>
                {QUALITY_GRADES.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          </div>

          {/* Sales Information */}
          <h5 style={{ marginTop: 16, marginBottom: 12, color: '#666' }}>💰 Sales Information</h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <label>Price per Liter (KES)</label>
              <input type="number" step="0.01" min="0" value={pricePerLiter} onChange={e => setPricePerLiter(e.target.value)} placeholder="45.00" />
            </div>
            <div>
              <label>Buyer/Customer</label>
              <input type="text" value={buyer} onChange={e => setBuyer(e.target.value)} placeholder="e.g., Brookside Dairy" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 12px', background: sold ? '#d1fae5' : '#f3f4f6', borderRadius: 6 }}>
                <input type="checkbox" checked={sold} onChange={e => setSold(e.target.checked)} style={{ width: 20, height: 20 }} />
                <span>Mark as Sold (Auto-record income)</span>
              </label>
            </div>
            {sold && pricePerLiter && liters && (
              <div style={{ padding: 12, background: '#d1fae5', borderRadius: 6, border: '2px solid #059669' }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Revenue</div>
                <div style={{ fontSize: 22, fontWeight: 'bold', color: '#059669' }}>
                  KES {(parseFloat(liters) * parseFloat(pricePerLiter)).toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* Milking Details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 }}>
            <h5 style={{ margin: 0, color: '#666' }}>🐄 Milking Details</h5>
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} style={{ fontSize: 12, padding: '4px 12px' }}>
              {showAdvanced ? '▲ Hide Advanced' : '▼ Show Advanced'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div>
              <label>Milker ID</label>
              <input type="text" value={milkerId} onChange={e => setMilkerId(e.target.value)} placeholder="e.g., MKR-001" />
            </div>
            <div>
              <label>Milker Name</label>
              <input type="text" value={milkerName} onChange={e => setMilkerName(e.target.value)} placeholder="e.g., John Kamau" />
            </div>
            <div>
              <label>Duration (minutes)</label>
              <input type="number" min="0" value={milkingDuration} onChange={e => setMilkingDuration(e.target.value)} placeholder="e.g., 8" />
            </div>
            <div>
              <label>Equipment Used</label>
              <select value={equipmentUsed} onChange={e => setEquipmentUsed(e.target.value)}>
                {EQUIPMENT.map(eq => <option key={eq} value={eq}>{eq}</option>)}
              </select>
            </div>
            <div>
              <label>Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g., Barn A" />
            </div>
          </div>

          {/* Advanced Parameters */}
          {showAdvanced && (
            <>
              <h5 style={{ marginTop: 16, marginBottom: 12, color: '#666' }}>🌤️ Environmental & Health Factors</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div>
                  <label>Weather Condition</label>
                  <select value={weather} onChange={e => setWeather(e.target.value)}>
                    {WEATHER_CONDITIONS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label>Feed Quality</label>
                  <select value={feedQuality} onChange={e => setFeedQuality(e.target.value)}>
                    {FEED_QUALITY.map(fq => <option key={fq} value={fq}>{fq}</option>)}
                  </select>
                </div>
                <div>
                  <label>Cow Health Status</label>
                  <select value={cowHealth} onChange={e => setCowHealth(e.target.value)}>
                    {HEALTH_STATUS.map(hs => <option key={hs} value={hs}>{hs}</option>)}
                  </select>
                </div>
              </div>

              <h5 style={{ marginTop: 16, marginBottom: 12, color: '#666' }}>⚠️ Special Conditions</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 8, background: peakMilk ? '#e0f2fe' : '#f9fafb', borderRadius: 6 }}>
                  <input type="checkbox" checked={peakMilk} onChange={e => setPeakMilk(e.target.checked)} />
                  <span>🏆 Peak Milk Production</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 8, background: colostrum ? '#fef3c7' : '#f9fafb', borderRadius: 6 }}>
                  <input type="checkbox" checked={colostrum} onChange={e => setColostrum(e.target.checked)} />
                  <span>🍼 Colostrum Milk</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 8, background: antibiotics ? '#fee2e2' : '#f9fafb', borderRadius: 6 }}>
                  <input type="checkbox" checked={antibiotics} onChange={e => setAntibiotics(e.target.checked)} />
                  <span>💊 Under Antibiotic Treatment</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 8, background: withdrawal ? '#fecaca' : '#f9fafb', borderRadius: 6 }}>
                  <input type="checkbox" checked={withdrawal} onChange={e => setWithdrawal(e.target.checked)} />
                  <span>⏰ Withdrawal Period</span>
                </label>
              </div>
            </>
          )}

          {/* Notes */}
          <div style={{ marginTop: 16 }}>
            <label>Additional Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any additional observations, issues, or comments about this milking session..." />
          </div>

          {/* Form Actions */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={add} style={{ background: '#059669', color: 'white', padding: '10px 20px', fontSize: 16 }}>
              {editingId ? '💾 Save Changes' : '➕ Add Milk Record'}
            </button>
            {editingId && <button onClick={cancelEdit} style={{ background: '#6b7280' }}>Cancel Edit</button>}
            <button onClick={() => { resetForm(); setShowAddForm(false); }} style={{ background: '#dc2626', color: 'white' }}>✕ Cancel</button>
            <button onClick={resetForm} type="button" style={{ background: '#f59e0b', color: 'white' }}>🔄 Reset Form</button>
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h5 style={{ margin: 0, marginBottom: 12 }}>🔍 Filter Records</h5>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12 }}>Animal</label>
            <select value={filterAnimal} onChange={e => setFilterAnimal(e.target.value)} style={{ fontSize: 13 }}>
              <option value="all">All Animals</option>
              {(animals||[]).filter(a => a.sex === 'F').map(a => <option key={a.id} value={a.id}>{a.name || a.tag}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12 }}>Date</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 12 }}>Session</label>
            <select value={filterSession} onChange={e => setFilterSession(e.target.value)} style={{ fontSize: 13 }}>
              <option value="all">All Sessions</option>
              {MILKING_SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12 }}>Quality</label>
            <select value={filterQuality} onChange={e => setFilterQuality(e.target.value)} style={{ fontSize: 13 }}>
              <option value="all">All Grades</option>
              {QUALITY_GRADES.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            {(filterAnimal !== 'all' || filterDate || filterSession !== 'all' || filterQuality !== 'all') && (
              <button onClick={() => { setFilterAnimal('all'); setFilterDate(''); setFilterSession('all'); setFilterQuality('all'); }} 
                      style={{ background: '#f59e0b', color: 'white', fontSize: 13, width: '100%' }}>
                🔄 Clear All Filters
              </button>
            )}
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
          Showing {filteredItems.length} of {items.length} records
        </div>
      </div>

      {/* Analytics View */}
      {viewMode === 'analytics' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Quality Distribution */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ marginTop: 0 }}>📊 Quality Distribution</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {Object.entries(qualityDist).map(([grade, count]) => (
                <div key={grade} style={{ padding: 12, background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{grade}</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{count}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{((count/filteredItems.length)*100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Distribution */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ marginTop: 0 }}>⏰ Production by Session</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {Object.entries(sessionDist).map(([sess, liters]) => (
                <div key={sess} style={{ padding: 16, background: '#e0f2fe', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>{sess}</div>
                  <div style={{ fontSize: 26, fontWeight: 'bold', color: '#0284c7' }}>{liters.toFixed(1)} L</div>
                  <div style={{ fontSize: 12, color: '#0369a1', marginTop: 4 }}>{((liters/totalMilk)*100).toFixed(1)}% of total</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ marginTop: 0 }}>🏆 Top Performing Animals</h4>
            <div style={{ display: 'grid', gap: 12 }}>
              {Object.entries(animalProduction)
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 5)
                .map(([aId, data], index) => {
                  const animal = (animals||[]).find(a => a.id === aId)
                  const avgPerSession = data.total / data.count
                  return (
                    <div key={aId} style={{ padding: 16, background: index === 0 ? '#fef3c7' : '#f9fafb', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: index === 0 ? '#f59e0b' : '#666' }}>
                          #{index + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: 16 }}>{animal?.name || animal?.tag || aId}</div>
                          <div style={{ fontSize: 13, color: '#666' }}>{animal?.breed}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 22, fontWeight: 'bold', color: '#059669' }}>{data.total.toFixed(1)} L</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{avgPerSession.toFixed(1)} L avg/session</div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Recent Trends */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ marginTop: 0 }}>📈 Recent Trends (Last 7 Days)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date()
                date.setDate(date.getDate() - i)
                const dateStr = date.toISOString().slice(0, 10)
                const dayItems = filteredItems.filter(item => item.date === dateStr)
                const dayTotal = dayItems.reduce((sum, item) => sum + (item.liters || 0), 0)
                return (
                  <div key={dateStr} style={{ padding: 12, background: dayTotal > 0 ? '#d1fae5' : '#f3f4f6', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: dayTotal > 0 ? '#059669' : '#9ca3af' }}>
                      {dayTotal.toFixed(1)} L
                    </div>
                    <div style={{ fontSize: 10, color: '#888' }}>{dayItems.length} sessions</div>
                  </div>
                )
              }).reverse()}
            </div>
          </div>

          {/* Health Indicators */}
          {avgSCC > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ marginTop: 0 }}>🩺 Health Indicators</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div style={{ padding: 16, background: avgSCC < 200000 ? '#d1fae5' : avgSCC < 400000 ? '#fef3c7' : '#fee2e2', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>Overall Herd SCC</div>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: avgSCC < 200000 ? '#059669' : avgSCC < 400000 ? '#f59e0b' : '#dc2626' }}>
                    {(avgSCC / 1000).toFixed(0)}k
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    {avgSCC < 200000 ? '✓ Excellent udder health' : avgSCC < 400000 ? '⚠️ Monitor closely' : '❌ Action needed'}
                  </div>
                </div>
                <div style={{ padding: 16, background: avgFat >= 3.5 ? '#d1fae5' : '#fef3c7', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>Fat Content</div>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: avgFat >= 3.5 ? '#059669' : '#f59e0b' }}>
                    {avgFat.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    {avgFat >= 3.5 ? '✓ Good fat levels' : '⚠️ Below standard'}
                  </div>
                </div>
                <div style={{ padding: 16, background: avgProtein >= 3.0 ? '#d1fae5' : '#fef3c7', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>Protein Content</div>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: avgProtein >= 3.0 ? '#059669' : '#f59e0b' }}>
                    {avgProtein.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    {avgProtein >= 3.0 ? '✓ Good protein levels' : '⚠️ Below standard'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Animal Production Summary View */}
      {viewMode === 'summary' && (
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ marginTop: 0 }}>Production Summary by Animal</h4>
          <div style={{ display: 'grid', gap: 16 }}>
            {Object.entries(animalProduction).map(([aId, data]) => {
              const animal = (animals||[]).find(a => a.id === aId)
              const avgPerSession = data.total / data.count
              return (
                <div key={aId} className="card" style={{ padding: 16, background: '#f9fafb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: 0, marginBottom: 4 }}>{animal?.name || animal?.tag || aId}</h4>
                      <div style={{ fontSize: 13, color: '#666' }}>{animal?.breed}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{data.total.toFixed(1)} L</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{data.count} sessions</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                    <div style={{ padding: 8, background: 'white', borderRadius: 4 }}>
                      <div style={{ fontSize: 11, color: '#666' }}>Avg/Session</div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{avgPerSession.toFixed(1)} L</div>
                    </div>
                    {Object.entries(data.sessions).map(([sess, amt]) => (
                      <div key={sess} style={{ padding: 8, background: 'white', borderRadius: 4 }}>
                        <div style={{ fontSize: 11, color: '#666' }}>{sess}</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{amt.toFixed(1)} L</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Records List View */}
      {viewMode === 'list' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🥛</div>
              <h4>No milk production records yet</h4>
              <p style={{ color: '#666' }}>Add your first milk record to start tracking</p>
            </div>
          ) : (
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {filteredItems.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)).map(item => {
                const animal = (animals||[]).find(a => a.id === item.animalId)
                const sccStatus = item.scc ? (item.scc < 200000 ? 'good' : item.scc < 400000 ? 'warning' : 'poor') : null
                
                return (
                  <div key={item.id} style={{ padding: 16, borderBottom: '1px solid #eee' }}>
                    {inlineEditId === item.id ? (
                      <div onKeyDown={handleKeyDown} style={{display:'flex',flexDirection:'column',gap:12}}>
                        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                          <input type="number" value={inlineData.liters} onChange={e=>setInlineData({...inlineData,liters:e.target.value})} placeholder="Liters" style={{width:100}} autoFocus />
                          <select value={inlineData.session} onChange={e=>setInlineData({...inlineData,session:e.target.value})} style={{width:120}}>
                            {MILKING_SESSIONS.map(s=><option key={s}>{s}</option>)}
                          </select>
                          <select value={inlineData.quality} onChange={e=>setInlineData({...inlineData,quality:e.target.value})} style={{width:120}}>
                            {QUALITY_GRADES.map(q=><option key={q}>{q}</option>)}
                          </select>
                          <input value={inlineData.notes} onChange={e=>setInlineData({...inlineData,notes:e.target.value})} placeholder="Notes" style={{flex:1,minWidth:150}} />
                          <button onClick={saveInlineEdit} style={{background:'#10b981',color:'#fff',padding:'6px 12px',border:'none',borderRadius:4}}>✓ Save</button>
                          <button onClick={cancelInlineEdit} style={{background:'#ef4444',color:'#fff',padding:'6px 12px',border:'none',borderRadius:4}}>✕ Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'start'}}>
                        <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 18, color: '#059669' }}>{item.liters.toFixed(1)} L</span>
                        <span className="badge" style={{ background: '#e0f2fe' }}>{item.session}</span>
                        <span className="badge" style={{ background: '#f3e8ff' }}>{item.quality}</span>
                        {item.sold && <span className="badge" style={{ background: '#d1fae5', color: '#065f46' }}>✓ Sold</span>}
                        {item.totalPrice > 0 && <span style={{ fontWeight: 600, color: '#059669' }}>KES {item.totalPrice.toFixed(2)}</span>}
                        {item.fatContent && <span className="badge" style={{ background: '#fef3c7' }}>Fat: {item.fatContent}%</span>}
                        {item.proteinContent && <span className="badge" style={{ background: '#dbeafe' }}>Protein: {item.proteinContent}%</span>}
                        {sccStatus && (
                          <span className="badge" style={{ 
                            background: sccStatus === 'good' ? '#d1fae5' : sccStatus === 'warning' ? '#fef3c7' : '#fee2e2',
                            color: sccStatus === 'good' ? '#059669' : sccStatus === 'warning' ? '#f59e0b' : '#dc2626'
                          }}>
                            SCC: {(item.scc / 1000).toFixed(0)}k
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                        <strong>{animal?.name || animal?.tag || item.animalId}</strong> • {new Date(item.timestamp || item.date).toLocaleString()}
                      </div>
                      {item.temp && (
                        <div style={{ fontSize: 13, color: '#888' }}>Temperature: {item.temp}°C</div>
                      )}
                      {item.notes && (
                        <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>{item.notes}</div>
                      )}
                    </div>
                        <div style={{display:'flex',gap:4,flexDirection:'column'}}>
                          <button className="tab-btn" style={{background:'#3b82f6',color:'#fff',padding:'4px 8px'}} onClick={()=>startInlineEdit(item)}>⚡ Quick</button>
                          <button className="tab-btn" onClick={() => startEdit(item)}>✏️</button>
                          <button className="tab-btn" style={{ color: '#dc2626' }} onClick={() => remove(item.id)}>🗑️</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
      {toast && (
        <div style={{position:'fixed',bottom:20,right:20,padding:'12px 20px',background:toast.type==='error'?'#ef4444':'#10b981',color:'#fff',borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.15)',zIndex:10000,display:'flex',gap:12}}>
          <span>{toast.message}</span>
          {toast.showUndo && <button onClick={undoLastChange} style={{background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',padding:'4px 12px',borderRadius:4,cursor:'pointer'}}>↶ Undo</button>}
        </div>
      )}
    </section>
  )
}
