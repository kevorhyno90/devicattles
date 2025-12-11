# Inline Edit Implementation Guide

## Quick Pattern for Any Module

### Step 1: Import the Hook
```jsx
import { useInlineEdit } from '../lib/inlineEditHelper'
import { Toast, InlineEditField, EditActionButtons } from '../lib/inlineEditHelper'
```

### Step 2: Initialize Hook
```jsx
const { isEditing, inlineEditId, inlineData, setInlineData, startEdit, saveEdit, cancelEdit, handleKeyDown, toast, setToast } = useInlineEdit(
  async (id, data) => {
    await DataLayer.yourEntity.update(id, data)
    // Refresh list
    const updated = await DataLayer.yourEntity.getAll()
    setYourData(updated)
  }
)
```

### Step 3: Add Edit Buttons
For each item in your list:
```jsx
<EditActionButtons
  isEditing={inlineEditId === item.id}
  onEdit={() => startEdit(item)}
  onSave={saveEdit}
  onCancel={cancelEdit}
/>
```

### Step 4: Add Edit Fields
For each editable field:
```jsx
<InlineEditField
  isEditing={inlineEditId === item.id}
  value={inlineEditId === item.id ? inlineData.name : item.name}
  onChange={(val) => setInlineData({ ...inlineData, name: val })}
  onKeyDown={handleKeyDown}
  placeholder="Animal name"
/>
```

### Step 5: Add Toast
```jsx
<Toast toast={toast} onUndo={handleKeyDown} />
```

---

## Example: Adding Inline Edit to Crops Module

### Current Code (Before)
```jsx
function Crops() {
  const [crops, setCrops] = useState([])
  
  const updateCrop = async (id, updates) => {
    await DataLayer.crops.update(id, updates)
    setCrops(await DataLayer.crops.getAll())
  }
  
  return (
    <div>
      {crops.map(crop => (
        <div key={crop.id}>
          <div>{crop.name}</div>
          <div>{crop.area} ha</div>
        </div>
      ))}
    </div>
  )
}
```

### Updated Code (After)
```jsx
import { useInlineEdit, Toast, InlineEditField, EditActionButtons } from '../lib/inlineEditHelper'

function Crops() {
  const [crops, setCrops] = useState([])
  
  const { inlineEditId, inlineData, setInlineData, startEdit, saveEdit, cancelEdit, handleKeyDown, toast } = useInlineEdit(
    async (id, data) => {
      await DataLayer.crops.update(id, data)
      setCrops(await DataLayer.crops.getAll())
    }
  )
  
  return (
    <div>
      {crops.map(crop => (
        <div key={crop.id} style={{ padding: '12px', border: '1px solid #ddd', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <InlineEditField
              isEditing={inlineEditId === crop.id}
              value={inlineEditId === crop.id ? inlineData.name : crop.name}
              onChange={(val) => setInlineData({ ...inlineData, name: val })}
              onKeyDown={handleKeyDown}
              placeholder="Crop name"
            />
            <EditActionButtons
              isEditing={inlineEditId === crop.id}
              onEdit={() => startEdit(crop)}
              onSave={saveEdit}
              onCancel={cancelEdit}
            />
          </div>
          
          <InlineEditField
            isEditing={inlineEditId === crop.id}
            value={inlineEditId === crop.id ? inlineData.area : crop.area}
            onChange={(val) => setInlineData({ ...inlineData, area: val })}
            onKeyDown={handleKeyDown}
            placeholder="Area (ha)"
          />
        </div>
      ))}
      
      <Toast toast={toast} />
    </div>
  )
}
```

---

## Modules Needing Inline Edit

### Tier 1 (Highest Impact - Start Here)
1. **Crops.jsx** - crop name, area, stage, variety
2. **Finance.jsx** - description, amount, category, date
3. **Inventory.jsx** - name, quantity, unit, min_stock
4. **Tasks.jsx** - title, priority, due date, assigned to
5. **AnimalFeeding.jsx** - feed type, quantity, time

### Tier 2 (High Impact)
6. **AnimalTreatment.jsx** - treatment, date, cost
7. **AnimalBreeding.jsx** - sire, dam, expected date
8. **AnimalMeasurement.jsx** - weight, date, notes
9. **AnimalMilkYield.jsx** - liters, date, quality
10. **Health.jsx** - condition, treatment, date

### Tier 3 (Medium Impact)
11. **Groups.jsx** - group name, description
12. **Pastures.jsx** - pasture name, size, type
13. **Equipment.jsx** - name, type, status
14. **Schedules.jsx** - event name, date, time
15. **Reminders.jsx** - reminder text, date, time

---

## Testing Checklist

For each module after adding inline edit:

- [ ] Click Edit button - enters edit mode
- [ ] Type in field - updates value
- [ ] Press Enter - saves changes
- [ ] Press Escape - cancels without saving
- [ ] Click Save - saves and refreshes list
- [ ] Click Cancel - reverts changes
- [ ] Click Undo - restores previous value
- [ ] Multiple edits work in sequence
- [ ] Data persists after page refresh
- [ ] Toast notification appears after save

---

## Performance Optimization Tips

1. **Debounce heavy operations:**
```jsx
const debouncedSearch = useDebounce(searchTerm, 300)
```

2. **Use React.memo for list items:**
```jsx
const CropItem = React.memo(({ crop, isEditing, ...props }) => (
  <div>{crop.name}</div>
))
```

3. **Lazy load DataLayer calls:**
```jsx
useEffect(() => {
  const loadData = async () => {
    const data = await DataLayer.crops.getAll()
    setCrops(data)
  }
  loadData()
}, [])
```

---

## Keyboard Shortcuts

- **Enter** - Save changes (unless editing multiline text)
- **Escape** - Cancel editing
- **Shift+Enter** - New line in textarea (if applicable)
- **Tab** - Move to next field
- **Shift+Tab** - Move to previous field

---

## Common Issues & Solutions

### Issue: Edit mode doesn't activate
**Solution:** Ensure `inlineEditId` is compared with `item.id` correctly

### Issue: Changes aren't saved
**Solution:** Make sure `saveEdit` is awaiting DataLayer update and refreshing list

### Issue: Toast doesn't appear
**Solution:** Check that `<Toast toast={toast} />` is rendered at component level

### Issue: Keyboard shortcuts don't work
**Solution:** Ensure `onKeyDown={handleKeyDown}` is attached to input field

---

## Accessibility Features

- Form inputs are auto-focused when entering edit mode
- Keyboard navigation with Tab/Shift+Tab
- Clear visual feedback (blue border for active edit)
- Toast notifications for user actions
- Undo button for accidental changes

---

**Implementation Time Estimate:** 15-30 minutes per module  
**Total Time for 5 core modules:** 2-3 hours  
**Difficulty:** Easy (copy-paste pattern)

---

Created: December 10, 2025  
Updated: December 10, 2025
