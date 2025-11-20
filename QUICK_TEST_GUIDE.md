# Quick Test Guide - Module Integration

## 🎯 How to Test the New Features

### 1. Test Milk Sales (2 minutes)

**Steps:**
1. Open the app: http://localhost:4173/
2. Navigate to **"Milk Yield"** module
3. Fill out the form:
   - **Animal**: Select any animal (e.g., "Daisy")
   - **Liters**: Enter 25
   - **Price per Liter**: Enter 45 (or any amount)
   - **Buyer**: Enter "John Doe" (optional)
   - **Mark as Sold**: ✓ Check this box
   - **Notice**: Total shows "KES 1125.00" (25 × 45)
4. Click **"Add"**

**Expected Results:**
- ✅ Record appears in list with "✓ Sold" badge
- ✅ Shows "KES 1125.00" next to the record
- ✅ Summary Stats show updated "Total Revenue"
- ✅ "Sold" quantity increases

**Verify in Finance:**
5. Navigate to **"Finance"** module
- ✅ New income entry appears
- ✅ Category: "Milk Sales"
- ✅ Amount: KES 1125.00
- ✅ Description includes animal name and details

**Verify in Dashboard:**
6. Navigate to **"Dashboard"**
- ✅ Total Income includes the KES 1125.00
- ✅ "Milk Yield" card shows Income: +KES 1125.00
- ✅ Net Profit updated

---

### 2. Test Crop Sales (2 minutes)

**Steps:**
1. Navigate to **"Crop Yield"** module
2. Fill out the form:
   - **Crop**: Select any crop (e.g., "Maize")
   - **Quantity**: Enter 150
   - **Price/Unit**: Enter 80 (or any amount)
   - **Buyer**: Enter "Market Buyer" (optional)
   - **Mark as Sold**: ✓ Check this box
   - **Notice**: Total shows "KES 12000.00" (150 × 80)
3. Click **"Add"**

**Expected Results:**
- ✅ Record appears with "✓ Sold" badge
- ✅ Shows "KES 12000.00" and buyer name
- ✅ Summary Stats show "Total Revenue: KES 12000.00"
- ✅ "Sold Quantity" updates

**Verify in Finance:**
4. Navigate to **"Finance"** module
- ✅ New income entry appears
- ✅ Category: "Crop Sales"
- ✅ Amount: KES 12000.00

**Verify in Dashboard:**
5. Navigate to **"Dashboard"**
- ✅ "Crop Yield" card shows Income: +KES 12000.00
- ✅ Total Income includes both milk and crop sales

---

### 3. Test Treatment with Inventory (2 minutes)

**First, add inventory item:**
1. Navigate to **"Inventory"** module
2. Add a medical item:
   - **Name**: "Vaccine XYZ"
   - **Category**: "Veterinary"
   - **Quantity**: 10
   - **Unit**: "doses"
3. Click **"Add Item"**

**Then record treatment:**
4. Navigate to **"Animal Treatment"** module
5. Fill out the form:
   - **Animal**: Select any animal
   - **Treatment Type**: "Vaccination"
   - **Treatment**: "Annual vaccination"
   - **Medication**: Select "Vaccine XYZ" from dropdown
   - **Dosage**: Enter 2
   - **Cost**: Enter 150
   - **Veterinarian**: "Dr. Smith"
6. Click **"Add"** or **"Submit"**

**Expected Results:**
- ✅ Treatment recorded successfully
- ✅ Alert if inventory runs low

**Verify in Inventory:**
7. Navigate back to **"Inventory"**
- ✅ "Vaccine XYZ" quantity decreased by 2 (now 8)
- ✅ If quantity < reorder level, alert appears

**Verify in Finance:**
8. Navigate to **"Finance"** module
- ✅ New expense entry appears
- ✅ Category: "Veterinary"
- ✅ Amount: KES -150.00 (negative for expense)
- ✅ Source: "Animal Treatment"

**Verify in Dashboard:**
9. Navigate to **"Dashboard"**
- ✅ "Animal Treatment" card shows Expenses
- ✅ Total Expenses increased by KES 150
- ✅ Net Profit = Income - Expenses

---

### 4. Test Dashboard Overview (1 minute)

**Navigate to Dashboard:**
1. Go to **"Dashboard"** module
2. Scroll to **"Income & Expense Breakdown by Source"** section

**Expected to See:**
- ✅ **Milk Yield** card:
  - Income: +KES 1125.00
  - Expenses: KES 0.00
  - Net: +KES 1125.00 (green)

- ✅ **Crop Yield** card:
  - Income: +KES 12000.00
  - Expenses: KES 0.00
  - Net: +KES 12000.00 (green)

- ✅ **Animal Treatment** card:
  - Income: KES 0.00
  - Expenses: KES 150.00
  - Net: -KES 150.00 (red)

- ✅ **Summary Totals**:
  - Total Income: KES 13125.00
  - Total Expenses: KES 150.00
  - Net Profit/Loss: +KES 12975.00 (green)
  - Profit Margin: 98.9% (Excellent 🎉)

---

### 5. Test Finance Report (1 minute)

**Navigate to Finance:**
1. Go to **"Finance"** module
2. View the 4 stats cards at top

**Expected to See:**
- ✅ **Total Income** (green): KES 13125.00
- ✅ **Total Expenses** (red): KES 150.00
- ✅ **Net Profit/Loss** (green): +KES 12975.00
- ✅ **Profit Margin** (blue): 98.9% with 🎉 Excellent

**Scroll to "Income & Expenses by Source":**
- ✅ See breakdown cards for each module
- ✅ Each card shows Income, Expenses, Net
- ✅ Color-coded: Green for profit, Red for loss

---

## 🔍 What to Look For

### ✅ Automatic Data Flow:
- When you add a sale in Milk/Crop module, it **automatically appears** in Finance
- No need to manually enter in Finance module
- Dashboard updates **immediately**

### ✅ Inventory Integration:
- When you use medication in Treatment, inventory **automatically decreases**
- Low stock alerts appear automatically
- Can't use more than available (validation)

### ✅ Financial Calculations:
- Profit/Loss calculated automatically: Income - Expenses
- Profit Margin calculated: (Net / Income) × 100
- All amounts aggregate correctly

### ✅ Source Tracking:
- Every transaction shows where it came from
- "Milk Yield", "Crop Yield", "Animal Treatment", etc.
- Helps identify which operations are profitable

### ✅ Visual Indicators:
- ✓ Green checkmark = Sold
- Green background = Profit/Income
- Red background = Loss/Expense
- Color-coded amounts
- Status badges (Excellent, Good, Low, Loss)

---

## 🐛 Known Behaviors (Not Bugs)

1. **Negative Amounts for Expenses**: 
   - Expenses show as negative (e.g., -150.00)
   - This is correct - expenses reduce your balance

2. **No Auto-Refresh**:
   - After adding in one module, manually navigate to Finance/Dashboard to see updates
   - This is normal for localStorage-based apps

3. **Sample Data**:
   - App comes with sample data
   - Your new entries appear alongside sample data
   - You can delete sample data manually if desired

4. **Price Defaults**:
   - Milk: KES 45/liter (typical Kenya price)
   - Crops: KES 80/unit (example)
   - You can change these to any amount

---

## 💡 Tips

1. **Always Check "Mark as Sold"**:
   - If you don't check this box, no income is recorded
   - Use this feature to track harvest separately from sales

2. **Enter Buyer Name**:
   - Helps track which customers buy what
   - Affects subcategory (Direct Sales vs Wholesale/Market)

3. **Cost is Optional**:
   - In Treatment, you can add treatment without cost
   - Only treatments with cost > 0 record expenses

4. **Inventory First**:
   - Add items to Inventory before using in Treatment
   - Otherwise, dropdown will be empty

5. **Check Dashboard Regularly**:
   - Best overview of all financial activity
   - Shows profit/loss at a glance
   - Identifies which operations are most profitable

---

## ❓ Troubleshooting

**Problem**: Sale not appearing in Finance
- ✅ Check: Did you check "Mark as Sold"?
- ✅ Check: Is price > 0?
- ✅ Try: Navigate away and back to Finance

**Problem**: Inventory not decreasing
- ✅ Check: Did you select item from dropdown?
- ✅ Check: Did you enter dosage/quantity?
- ✅ Try: Refresh Inventory module

**Problem**: Dashboard not showing new data
- ✅ Solution: Click "🔄 Refresh" button
- ✅ Or: Navigate away and back

**Problem**: Can't see integration layer working
- ✅ Open browser console (F12)
- ✅ Look for console.log messages
- ✅ Check localStorage in Application tab

---

## 🎉 Success Criteria

You'll know it's working when:
1. ✅ Milk sale appears in Finance automatically
2. ✅ Crop sale appears in Finance automatically
3. ✅ Treatment expense appears in Finance automatically
4. ✅ Inventory decreases when treatment recorded
5. ✅ Dashboard shows all income/expenses by source
6. ✅ Profit/Loss calculates correctly
7. ✅ Everything is color-coded properly

**Expected Final State After All Tests:**
- Total Income: ~KES 13,125
- Total Expenses: ~KES 150
- Net Profit: ~KES 12,975
- Profit Margin: ~98.9%
- 3 cards in Dashboard breakdown (Milk, Crops, Treatment)

---

## 📞 Support

If something doesn't work as expected:
1. Check browser console for errors (F12)
2. Verify data in localStorage (Application tab)
3. Try clearing cache and reload
4. Check that all modules saved successfully

**Most Common Issue**: Forgetting to check "Mark as Sold" checkbox!

---

**Happy Testing! 🚀**
