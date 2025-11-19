# 🔔 Notifications & 📊 Dashboard Analytics Guide

## Overview
Your PWA now includes **comprehensive notification/reminder system** and **real-time dashboard analytics** for complete farm management visibility.

---

## 🔔 Notification System

### Features
- ✅ **Browser Push Notifications** (when enabled)
- ✅ **In-App Notification Center** (always works offline)
- ✅ **Scheduled Reminders** with lead time
- ✅ **Automatic Alerts** for critical events
- ✅ **Priority Levels** (Low, Medium, High, Urgent)
- ✅ **Notification Types** (Treatment, Breeding, Tasks, Inventory, Health)

### How to Enable Browser Notifications
1. Open the **Notifications** page from the main navigation
2. Click **Settings** button
3. Click **Enable Browser Notifications**
4. Allow notifications in your browser prompt

### Automatic Notifications

#### Treatment Reminders
- Notifies **24 hours before** treatment is due
- Shows as **URGENT** if treatment is overdue
- Runs every 5 minutes in background

#### Breeding Due Dates
- Alerts **7 days before** expected birth
- Shows as **URGENT** if overdue
- Tracks pregnant animals automatically

#### Task Deadlines
- Reminds **1 day before** task due date
- Escalates to **URGENT** when overdue
- Only tracks incomplete tasks

#### Inventory Alerts
- **Low Stock**: Warns when below 10 units
- **Critical Stock**: Urgent alert when below 5 units
- **Out of Stock**: High priority when depleted
- Checks hourly

### Notification Settings

```javascript
// Default Settings
{
  enabled: true,                  // Master toggle
  treatmentReminders: true,       // Treatment alerts
  breedingReminders: true,        // Breeding alerts
  taskReminders: true,            // Task alerts
  inventoryAlerts: true,          // Inventory alerts
  healthAlerts: true,             // Health alerts
  reminderLeadTime: 24,           // Hours before event (default: 24)
  lowInventoryThreshold: 10,      // Low stock threshold
  criticalInventoryThreshold: 5,  // Critical threshold
  soundEnabled: true              // Sound effects
}
```

### In-App Notification Center
- **Unread Badge** in header shows notification count
- **Filter by Type**: All, Treatment, Breeding, Tasks, etc.
- **Mark as Read**: Individual or bulk actions
- **Delete Notifications**: Remove old alerts
- **Reminder Management**: View upcoming & overdue reminders

### Storage
All notifications stored in **localStorage** at:
- `devinsfarm:notifications` - Notification history (max 100)
- `devinsfarm:reminders` - Scheduled reminders
- `devinsfarm:notification:settings` - User preferences

---

## 📊 Dashboard Analytics

### Real-Time KPI Cards

#### 🐄 Total Animals
- **By Type**: Breakdown of cattle, goats, sheep, etc.
- **By Status**: Active, Pregnant, Under Treatment, etc.
- Click to navigate to Animals module

#### ✅ Tasks Overview
- **Active Tasks**: Pending + In Progress
- **Due Today**: Tasks requiring immediate attention
- **Due This Week**: Planning visibility
- **Overdue**: Highlighted in red
- **Completion Rate**: Performance metric
- Click to navigate to Tasks module

#### 💰 Financial Summary (Monthly)
- **Net Profit**: Income - Expenses (color-coded)
- **Income**: Total earnings
- **Expenses**: Total costs
- **Profit Margin**: Percentage calculation
- Click to navigate to Finance module

#### 🏥 Health Status
- **Total Alerts**: Active health concerns
- **Under Treatment**: Animals currently being treated
- **Due Treatments**: Scheduled for today
- **Needs Vaccination**: Overdue for shots (6-month cycle)
- Click to navigate to Health System

#### 🤰 Breeding Status
- **Pregnant Animals**: Active pregnancies
- **Due Next Month**: Expected births in 30 days
- **Overdue**: Highlighted for immediate attention
- **Success Rate**: Historical breeding performance
- Click to navigate to Breeding module

#### 📦 Inventory Alerts
- **Critical Stock**: Red alert (≤5 units)
- **Low Stock**: Yellow warning (≤10 units)
- **Out of Stock**: Items depleted
- Click to navigate to Inventory module

#### 🥛 Milk Production (Monthly)
- **Total Milk**: Liters produced this month
- **Avg Daily**: Daily production average
- **Producing Animals**: Count of lactating animals

#### 🌾 Feed Costs (6-Month Trend)
- **Avg Monthly**: Average monthly feed expense
- **6-Month Total**: Cumulative cost
- **Trend**: ↗ Increasing, ↘ Decreasing, → Stable
- **Trend %**: Percentage change

### Feed Cost Chart
Visual bar chart showing monthly feed expenses over 6 months with:
- Color-coded bars (gradient)
- Dollar amounts on hover
- Month labels

### Quick Actions
One-click shortcuts to:
- ➕ Add Animal
- 📝 New Task
- 💳 Add Transaction
- 📦 Update Inventory

### Auto-Refresh
- **Toggle**: Enable/disable auto-refresh
- **Interval**: Updates every 60 seconds when enabled
- **Manual Refresh**: 🔄 Refresh button

### Alert Bar
Displays urgent attention items at top:
- ⚠️ Overdue tasks
- ⚠️ Health alerts
- ⚠️ Critical inventory

---

## 🔧 Technical Details

### Analytics Calculation

#### Animal Statistics
```javascript
getAnimalsByType() // Returns { total, byType, byStatus }
```
- Filters out Sold/Deceased animals
- Groups by animal type
- Groups by status

#### Financial Summary
```javascript
getFinancialSummary(period) // period: 'week', 'month', 'year'
```
- Sums income transactions
- Sums expense transactions
- Calculates net profit
- Computes profit margin
- Provides all-time totals

#### Feed Cost Trends
```javascript
getFeedCostTrends(months) // Default: 6 months
```
- Filters feed-related expenses
- Groups by month
- Calculates average
- Determines trend (first half vs second half)

#### Inventory Alerts
```javascript
getInventoryAlerts(lowThreshold, criticalThreshold)
```
- Scans all inventory items
- Flags low stock (default: ≤10)
- Flags critical stock (default: ≤5)
- Lists out-of-stock items

### Notification System

#### Reminder Checker
Runs **every 5 minutes** checking:
1. Scheduled reminders within lead time
2. Overdue reminders
3. Displays browser notification if enabled
4. Stores in-app notification
5. Plays sound if enabled
6. Marks reminder as notified

#### Auto-Check System
Runs **every hour** checking:
- Treatment due dates (today/tomorrow)
- Breeding due dates (next 7 days/overdue)
- Task deadlines (today/tomorrow/overdue)
- Inventory levels (low/critical/out)

### Performance
- All calculations run **client-side** (no server)
- Data stored in **localStorage + IndexedDB**
- Lazy loading for large datasets
- Efficient filtering with JavaScript Array methods
- Responsive updates (no page reload needed)

---

## 🎯 Use Cases

### Daily Morning Routine
1. Open Dashboard
2. Check Alert Bar for urgent items
3. Review "Tasks Due Today" KPI
4. Check "Health Status" for treatments needed
5. Review Notifications for overnight alerts

### Weekly Planning
1. Dashboard → Tasks KPI
2. See "Due This Week" count
3. Check "Breeding Status" for upcoming births
4. Review Feed Cost trend

### Monthly Financial Review
1. Dashboard → Financial Summary
2. Review Net Profit (color-coded)
3. Check Profit Margin percentage
4. View Feed Cost Chart
5. Export Finance data for records

### Inventory Management
1. Dashboard → Inventory Alerts
2. Check Critical/Low stock items
3. Click through to Inventory module
4. Update quantities or place orders

---

## 📱 Mobile Support

All dashboard and notification features are:
- ✅ **Fully Responsive** (phones, tablets, desktop)
- ✅ **Touch-Friendly** (44x44px minimum targets)
- ✅ **Offline-Capable** (works without internet)
- ✅ **PWA-Optimized** (install on home screen)

---

## 💾 Data Privacy

All data stays **100% local**:
- No cloud storage
- No external APIs
- No tracking
- No user data collection
- Everything stored in browser (localStorage + IndexedDB)

---

## 🔄 Updates & Refresh

### Automatic Updates
- Dashboard: Refreshes every 60 seconds (when enabled)
- Notifications: Checks every 5 minutes
- Auto-alerts: Runs every hour
- Unread count: Updates every 30 seconds

### Manual Refresh
- Dashboard: Click 🔄 Refresh button
- Notifications: Automatic on view load

---

## 🎨 Customization

### Notification Lead Time
Adjust how early you want reminders:
```
Settings → Reminder Lead Time → 24 hours (default)
```
Options: 1-168 hours (1 week)

### Inventory Thresholds
Customize alert triggers:
```javascript
// In settings (future feature)
lowInventoryThreshold: 10      // Adjust as needed
criticalInventoryThreshold: 5  // Adjust as needed
```

### Dashboard Period
Financial summary period:
- Week: Last 7 days
- Month: Current month (default)
- Year: Current year

---

## 🐛 Troubleshooting

### Notifications Not Showing
1. Check Settings → Enable Notifications
2. Allow browser permissions
3. Check notification filters
4. Verify data exists (treatments, tasks, etc.)

### Dashboard Not Loading
1. Check browser console for errors
2. Clear cache and reload
3. Verify data in localStorage
4. Try manual refresh

### KPIs Show Zero
- Add data in respective modules first
- Dashboard calculates from existing records
- Empty modules = zero stats (expected)

---

## 📚 Related Documentation
- [PWA Installation Guide](README.md)
- [Authentication System](src/lib/auth.js)
- [Audit Trail System](src/lib/audit.js)
- [Export/Import Guide](src/lib/exportImport.js)

---

## 🚀 Future Enhancements (Potential)
- Custom notification sounds
- Email/SMS integration (if server added)
- Advanced analytics charts (line/pie charts)
- Predictive analytics (AI/ML forecasting)
- Custom KPI builder
- Mobile push notifications (native app)

---

Built with ❤️ for **personal offline farm management**. No server required!
