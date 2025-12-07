# Activity Feed System - Complete Guide

## Overview
The Activity Feed system tracks all user actions across the farm management platform in real-time. It provides a centralized timeline of everything happening on your farm.

## Features

### 1. **Real-Time Activity Tracking**
- Automatically logs activities when users perform actions
- Instant updates via custom events (no page refresh needed)
- Tracks up to 1000 recent activities

### 2. **Activity Types**
- **Animal**: Create, update, delete animals
- **Task**: Task management actions
- **Crop**: Crop-related activities
- **Finance**: Financial transactions
- **Inventory**: Stock management
- **Health**: Health records and treatments
- **User**: User account activities
- **System**: System-level events

### 3. **Smart Filtering**
- Filter by activity type (all, animal, task, crop, finance, inventory, health, user)
- Filter by time range (today, last 7 days, last 30 days, all time)
- Load more pagination (20 activities at a time)

### 4. **Rich Activity Cards**
- Type-specific icons and colors
- Activity description with metadata
- User attribution
- Relative timestamps (e.g., "5m ago", "2h ago", "3d ago")
- Hover effects for better UX

### 5. **Activity Statistics Dashboard**
- Total activity count
- Activities by type breakdown
- Activities by action breakdown
- Activities by user breakdown
- Time period summaries (today, this week, this month)

## Files Created

### `/src/lib/activityLogger.js`
Core activity logging library with these functions:

```javascript
// Main logging function
logActivity(type, action, description, metadata)

// Get activities
getActivities()                    // All activities
getActivitiesByType(type)          // Filter by type
getActivitiesByUser(userEmail)     // Filter by user
getActivitiesInRange(start, end)   // Date range filter
getActivityStats()                 // Statistics

// Convenience functions for specific types
logAnimalActivity(action, description, animalData)
logTaskActivity(action, description, taskData)
logCropActivity(action, description, cropData)
logFinanceActivity(action, description, financeData)
logInventoryActivity(action, description, inventoryData)
logHealthActivity(action, description, healthData)
logUserActivity(action, description, userData)
logSystemActivity(action, description, systemData)

// Utility functions
clearActivities()                  // Clear all activities
```

### `/src/modules/ActivityFeed.jsx`
React component for displaying the activity feed with:
- Filter controls (type, time range)
- Activity statistics cards
- Grouped timeline view (by date)
- Load more pagination
- Real-time updates
- Empty state handling
- Responsive design

## Integration Examples

### 1. Animals Module (Already Integrated)
```javascript
import { logAnimalActivity } from '../lib/activityLogger'

// When adding an animal
logAnimalActivity('created', `Added new animal: ${animal.name}`, animal)

// When updating an animal
logAnimalActivity('updated', `Updated animal: ${animal.name}`, animal)

// When deleting an animal
logAnimalActivity('deleted', `Deleted animal: ${animal.name}`, animal)
```

### 2. Tasks Module (Example)
```javascript
import { logTaskActivity } from '../lib/activityLogger'

// When creating a task
logTaskActivity('created', `Created task: ${task.title}`, task)

// When completing a task
logTaskActivity('completed', `Completed task: ${task.title}`, task)
```

### 3. Finance Module (Example)
```javascript
import { logFinanceActivity } from '../lib/activityLogger'

// When adding transaction
logFinanceActivity('created', 
  `Added ${transaction.type} transaction: $${transaction.amount}`, 
  transaction
)
```

### 4. Inventory Module (Example)
```javascript
import { logInventoryActivity } from '../lib/activityLogger'

// When updating stock
logInventoryActivity('updated', 
  `Updated ${item.name} stock: ${item.quantity} ${item.unit}`, 
  item
)

// When stock runs low
logInventoryActivity('alert', 
  `Low stock alert: ${item.name} (${item.quantity} remaining)`, 
  item
)
```

## How to Integrate into New Modules

### Step 1: Import the Logger
```javascript
import { logActivity } from '../lib/activityLogger'
// OR use specific helper:
import { logTaskActivity, logCropActivity } from '../lib/activityLogger'
```

### Step 2: Add Logging to Key Actions
Look for functions that:
- Create new records
- Update existing records
- Delete records
- Complete/finish actions
- Import/export data
- Generate reports

### Step 3: Call the Logger
```javascript
// Generic approach
logActivity('type', 'action', 'description', { metadata })

// Using helpers
logTaskActivity('created', 'Created new irrigation task', taskData)
```

### Step 4: Test Real-Time Updates
1. Open Activity Feed in one browser tab
2. Perform actions in another tab/window
3. See activities appear instantly in the feed

## Activity Data Structure

```javascript
{
  id: 'activity_1733591234567_abc123',
  type: 'animal',                    // Activity type
  action: 'created',                 // Action performed
  description: 'Added new animal: Bessie',  // Human-readable
  metadata: {                        // Additional context
    animalId: 'A-12345',
    tagNumber: 'TAG-001',
    name: 'Bessie'
  },
  timestamp: '2025-12-07T10:30:00.000Z',
  user: 'farmer@farm.com',          // User email
  userName: 'John Farmer'           // User display name
}
```

## Storage

- **Key**: `cattalytics:activities`
- **Type**: JSON array in localStorage
- **Limit**: Last 1000 activities
- **Auto-cleanup**: Older activities automatically removed when limit exceeded

## Real-Time Updates

The system uses custom DOM events for instant updates:

```javascript
// Dispatched when new activity logged
window.dispatchEvent(new CustomEvent('activityLogged', { 
  detail: activity 
}))

// Dispatched when activities cleared
window.dispatchEvent(new CustomEvent('activitiesCleared'))

// ActivityFeed listens for these events and auto-refreshes
```

## Accessing the Activity Feed

1. **From Dashboard**: Click "📊 Activity Feed" button
2. **Direct Navigation**: Set view to 'activityfeed'
3. **URL**: `?view=activityfeed` (if using URL params)

## Benefits

1. **Audit Trail**: Complete history of farm operations
2. **Accountability**: Track who did what and when
3. **Debugging**: Troubleshoot issues by reviewing recent actions
4. **Insights**: Understand farm activity patterns
5. **Compliance**: Maintain records for regulatory requirements
6. **Transparency**: Team members see what others are doing

## Next Steps

### To Complete Full Integration:
1. ✅ Animals module (DONE)
2. 🔲 Tasks module
3. 🔲 Finance module
4. 🔲 Inventory module
5. 🔲 Crops module
6. 🔲 Health/Treatment modules
7. 🔲 User authentication events
8. 🔲 Report generation events
9. 🔲 Data import/export events
10. 🔲 Settings changes

### Future Enhancements:
- Export activity log to PDF/CSV
- Advanced filtering (date range picker, multi-select)
- Search activities by keyword
- Activity notifications (configurable alerts)
- Activity analytics dashboard
- Activity-based automation triggers
- Integration with external audit systems

## Performance Considerations

- Activities stored in localStorage (fast, client-side)
- Efficient array operations with slicing
- Lazy loading with pagination
- Event-driven updates (no polling)
- Automatic cleanup of old activities
- Minimal bundle size impact (~5KB)

## Privacy & Security

- Activities stored locally (no server transmission)
- User can clear activities anytime
- No sensitive data in activity logs
- Metadata should avoid PII
- Works offline (PWA compatible)

---

**All features remain 100% free, open-source, and single-user!** 🚀
