import jsPDF from 'jspdf'
import 'jspdf-autotable'

/**
 * Generate PDF for Animal Profit Report
 */
export function exportAnimalProfitReport(animals, startDate, endDate) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text('Animal Profit Report', 14, 20)
  
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text(`Period: ${startDate} to ${endDate}`, 14, 28)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34)
  
  // Table data
  const tableData = animals.map(animal => {
    const income = (animal.milkIncome || 0) + (animal.salePrice || 0) + (animal.calfIncome || 0)
    const expenses = (animal.feedCost || 0) + (animal.veterinaryCost || 0) + (animal.otherCosts || 0)
    const profit = income - expenses
    
    return [
      animal.name || animal.tag,
      animal.breed || 'N/A',
      `$${income.toFixed(2)}`,
      `$${expenses.toFixed(2)}`,
      `$${profit.toFixed(2)}`,
      profit >= 0 ? '✓' : '✗'
    ]
  })
  
  // Add table
  doc.autoTable({
    startY: 40,
    head: [['Animal', 'Breed', 'Income', 'Expenses', 'Profit', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'center' }
    }
  })
  
  // Summary
  const totalIncome = tableData.reduce((sum, row) => sum + parseFloat(row[2].slice(1)), 0)
  const totalExpenses = tableData.reduce((sum, row) => sum + parseFloat(row[3].slice(1)), 0)
  const totalProfit = totalIncome - totalExpenses
  
  const finalY = doc.lastAutoTable.finalY + 10
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 14, finalY)
  doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 14, finalY + 7)
  doc.text(`Net Profit: $${totalProfit.toFixed(2)}`, 14, finalY + 14)
  
  // Save
  doc.save(`animal-profit-report-${startDate}-to-${endDate}.pdf`)
}

/**
 * Generate PDF for Vaccination Records
 */
export function exportVaccinationRecords(pets) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text('Pet Vaccination Records', 14, 20)
  
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
  
  let yPos = 40
  
  pets.forEach((pet, index) => {
    if (index > 0 && yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    
    // Pet info
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text(`${pet.name} (${pet.species})`, 14, yPos)
    yPos += 6
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Breed: ${pet.breed} | Age: ${pet.age} | Microchip: ${pet.microchip || 'N/A'}`, 14, yPos)
    yPos += 10
    
    // Vaccinations table
    if (pet.vaccinations && pet.vaccinations.length > 0) {
      const vacData = pet.vaccinations.map(vac => [
        vac.vaccineName,
        vac.dateGiven,
        vac.nextDue || 'N/A',
        vac.veterinarian || 'N/A',
        vac.batchNumber || 'N/A'
      ])
      
      doc.autoTable({
        startY: yPos,
        head: [['Vaccine', 'Date Given', 'Next Due', 'Veterinarian', 'Batch #']],
        body: vacData,
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] },
        styles: { fontSize: 9 },
        margin: { left: 14 }
      })
      
      yPos = doc.lastAutoTable.finalY + 15
    } else {
      doc.text('No vaccination records', 14, yPos)
      yPos += 15
    }
  })
  
  doc.save('pet-vaccination-records.pdf')
}

/**
 * Generate PDF for Breeding Records
 */
export function exportBreedingRecords(animals, pets) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text('Breeding Records', 14, 20)
  
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
  
  let yPos = 40
  
  // Animal breeding
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('Livestock Breeding', 14, yPos)
  yPos += 10
  
  const animalBreedingData = []
  animals.forEach(animal => {
    if (animal.breeding && animal.breeding.length > 0) {
      animal.breeding.forEach(b => {
        animalBreedingData.push([
          animal.name || animal.tag,
          b.breedingDate,
          b.method || 'Natural',
          b.bullId || 'N/A',
          b.expectedCalvingDate || 'N/A',
          b.calfTag || 'Pending'
        ])
      })
    }
  })
  
  if (animalBreedingData.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Animal', 'Breeding Date', 'Method', 'Bull/Sire', 'Expected Birth', 'Offspring']],
      body: animalBreedingData,
      theme: 'striped',
      headStyles: { fillColor: [236, 72, 153] },
      styles: { fontSize: 9 }
    })
    yPos = doc.lastAutoTable.finalY + 15
  } else {
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text('No livestock breeding records', 14, yPos)
    yPos += 15
  }
  
  // Pet breeding
  if (yPos > 200) {
    doc.addPage()
    yPos = 20
  }
  
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('Pet Breeding', 14, yPos)
  yPos += 10
  
  const petBreedingData = []
  pets.forEach(pet => {
    if (pet.breedingRecords && pet.breedingRecords.length > 0) {
      pet.breedingRecords.forEach(b => {
        petBreedingData.push([
          pet.name,
          b.heatCycleStart || 'N/A',
          b.breedingDate || 'N/A',
          b.partner || 'N/A',
          b.expectedBirthDate || 'N/A',
          b.birthDate ? `${b.litterSize || 0} pups/kittens` : 'Pending'
        ])
      })
    }
  })
  
  if (petBreedingData.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Pet', 'Heat Cycle', 'Breeding Date', 'Partner', 'Expected Birth', 'Litter']],
      body: petBreedingData,
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] },
      styles: { fontSize: 9 }
    })
  } else {
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text('No pet breeding records', 14, yPos)
  }
  
  doc.save('breeding-records.pdf')
}

/**
 * Generate PDF for Crop Yield Report
 */
export function exportCropYieldReport(crops, startDate, endDate) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text('Crop Yield Report', 14, 20)
  
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text(`Period: ${startDate} to ${endDate}`, 14, 28)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34)
  
  // Table data
  const tableData = crops.map(crop => {
    const totalYield = crop.yields ? crop.yields.reduce((sum, y) => sum + (parseFloat(y.quantity) || 0), 0) : 0
    const totalRevenue = crop.yields ? crop.yields.reduce((sum, y) => sum + (parseFloat(y.revenue) || 0), 0) : 0
    
    return [
      crop.cropName,
      crop.variety || 'N/A',
      `${crop.areaPlanted || 0} ${crop.areaUnit || 'acres'}`,
      crop.plantingDate || 'N/A',
      `${totalYield.toFixed(2)} ${crop.yieldUnit || 'kg'}`,
      `$${totalRevenue.toFixed(2)}`
    ]
  })
  
  // Add table
  doc.autoTable({
    startY: 40,
    head: [['Crop', 'Variety', 'Area Planted', 'Planting Date', 'Total Yield', 'Revenue']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [5, 150, 105] },
    styles: { fontSize: 10 },
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' }
    }
  })
  
  // Summary
  const totalRevenue = tableData.reduce((sum, row) => sum + parseFloat(row[5].slice(1)), 0)
  
  const finalY = doc.lastAutoTable.finalY + 10
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 14, finalY)
  
  doc.save(`crop-yield-report-${startDate}-to-${endDate}.pdf`)
}

/**
 * Generate PDF for Financial Summary
 */
export function exportFinancialSummary(finances, startDate, endDate) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text('Financial Summary', 14, 20)
  
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text(`Period: ${startDate} to ${endDate}`, 14, 28)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34)
  
  // Filter by date range
  const filtered = finances.filter(f => {
    const fDate = new Date(f.date)
    return fDate >= new Date(startDate) && fDate <= new Date(endDate)
  })
  
  // Income table
  const income = filtered.filter(f => f.type === 'income')
  if (income.length > 0) {
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Income', 14, 45)
    
    const incomeData = income.map(f => [
      f.date,
      f.category,
      f.description || 'N/A',
      `$${f.amount.toFixed(2)}`
    ])
    
    doc.autoTable({
      startY: 50,
      head: [['Date', 'Category', 'Description', 'Amount']],
      body: incomeData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 9 },
      columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } }
    })
  }
  
  // Expenses table
  const expenses = filtered.filter(f => f.type === 'expense')
  if (expenses.length > 0) {
    const startY = income.length > 0 ? doc.lastAutoTable.finalY + 15 : 45
    
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Expenses', 14, startY)
    
    const expenseData = expenses.map(f => [
      f.date,
      f.category,
      f.description || 'N/A',
      `$${Math.abs(f.amount).toFixed(2)}`
    ])
    
    doc.autoTable({
      startY: startY + 5,
      head: [['Date', 'Category', 'Description', 'Amount']],
      body: expenseData,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 9 },
      columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } }
    })
  }
  
  // Summary
  const totalIncome = income.reduce((sum, f) => sum + f.amount, 0)
  const totalExpenses = expenses.reduce((sum, f) => sum + Math.abs(f.amount), 0)
  const netProfit = totalIncome - totalExpenses
  
  const finalY = doc.lastAutoTable.finalY + 15
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 14, finalY)
  doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 14, finalY + 7)
  doc.text(`Net Profit: $${netProfit.toFixed(2)}`, 14, finalY + 14)
  
  doc.save(`financial-summary-${startDate}-to-${endDate}.pdf`)
}

/**
 * Generate PDF for Inventory Report
 */
export function exportInventoryReport(inventory) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text('Inventory Report', 14, 20)
  
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
  
  // Table data
  const tableData = inventory.map(item => {
    const status = item.quantity <= (item.reorderPoint || 0) ? '⚠️ Low' : '✓ OK'
    const value = (item.quantity || 0) * (item.unitCost || 0)
    
    return [
      item.name,
      item.category || 'N/A',
      `${item.quantity || 0} ${item.unit || ''}`,
      item.reorderPoint || 'N/A',
      `$${value.toFixed(2)}`,
      status
    ]
  })
  
  // Add table
  doc.autoTable({
    startY: 35,
    head: [['Item', 'Category', 'Quantity', 'Reorder Point', 'Value', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
    columnStyles: {
      2: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'center' }
    }
  })
  
  // Summary
  const totalValue = tableData.reduce((sum, row) => sum + parseFloat(row[4].slice(1)), 0)
  const lowStockItems = tableData.filter(row => row[5].includes('Low')).length
  
  const finalY = doc.lastAutoTable.finalY + 10
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text(`Total Inventory Value: $${totalValue.toFixed(2)}`, 14, finalY)
  doc.text(`Low Stock Items: ${lowStockItems}`, 14, finalY + 7)
  
  doc.save('inventory-report.pdf')
}

export default {
  exportAnimalProfitReport,
  exportVaccinationRecords,
  exportBreedingRecords,
  exportCropYieldReport,
  exportFinancialSummary,
  exportInventoryReport
}
