import React, { useEffect, useState } from 'react'
import Calendar from '../components/Calendar'

const SCHEDULE_TYPES = {
  ROUTINE: 'Routine Task',
  MAINTENANCE: 'Maintenance',
  VETERINARY: 'Veterinary',
  FEEDING: 'Feeding',
  BREEDING: 'Breeding',
  HARVEST: 'Harvest',
  TREATMENT: 'Treatment',
  INSPECTION: 'Inspection',
  MEETING: 'Meeting',
  OTHER: 'Other'
}

const RECURRENCE_TYPES = {
  ONCE: 'One-time',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Every 2 Weeks',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
  CUSTOM: 'Custom'
}

const PRIORITY_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent'
}

const STATUS_TYPES = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled'
}

const LEAVE_TYPES = {
  VACATION: 'Vacation',
  SICK: 'Sick Leave',
  PERSONAL: 'Personal Day',
  EMERGENCY: 'Emergency',
  UNPAID: 'Unpaid Leave',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
  BEREAVEMENT: 'Bereavement',
  OTHER: 'Other'
}

const SAMPLE_EMPLOYEES = [
  { 
    id: 'E-001', 
    name: 'John Smith', 
    role: 'Farm Manager', 
    email: 'john@farm.com', 
    phone: '555-0101',
    emergencyContact: 'Jane Smith',
    emergencyPhone: '555-0199',
    address: '123 Farm Road, Countryside',
    city: 'Greenville',
    state: 'CA',
    zipCode: '12345',
    dateEmployed: '2020-01-15',
    dateOfBirth: '1985-03-20',
    hourlyRate: 25.00,
    weeklyHours: 40,
    active: true,
    leaveBalance: {
      vacation: 15,
      sick: 10,
      personal: 5
    },
    leaveHistory: [
      {
        id: 'L-001',
        type: 'VACATION',
        startDate: '2025-10-15',
        endDate: '2025-10-19',
        days: 5,
        reason: 'Family vacation',
        status: 'APPROVED',
        requestedAt: '2025-09-20T10:00:00.000Z',
        approvedAt: '2025-09-21T14:30:00.000Z'
      },
      {
        id: 'L-002',
        type: 'SICK',
        startDate: '2025-09-05',
        endDate: '2025-09-06',
        days: 2,
        reason: 'Flu symptoms',
        status: 'APPROVED',
        requestedAt: '2025-09-05T08:00:00.000Z',
        approvedAt: '2025-09-05T08:15:00.000Z'
      }
    ]
  },
  { 
    id: 'E-002', 
    name: 'Maria Garcia', 
    role: 'Animal Handler', 
    email: 'maria@farm.com', 
    phone: '555-0102',
    emergencyContact: 'Carlos Garcia',
    emergencyPhone: '555-0198',
    address: '456 Oak Avenue, Rural Valley',
    city: 'Meadowbrook',
    state: 'CA',
    zipCode: '12346',
    dateEmployed: '2021-06-10',
    dateOfBirth: '1990-07-15',
    hourlyRate: 18.50,
    weeklyHours: 40,
    active: true,
    leaveBalance: {
      vacation: 12,
      sick: 8,
      personal: 3
    },
    leaveHistory: [
      {
        id: 'L-003',
        type: 'PERSONAL',
        startDate: '2025-11-08',
        endDate: '2025-11-08',
        days: 1,
        reason: 'Personal appointment',
        status: 'APPROVED',
        requestedAt: '2025-11-01T10:00:00.000Z',
        approvedAt: '2025-11-02T09:00:00.000Z'
      },
      {
        id: 'L-004',
        type: 'SICK',
        startDate: '2025-10-22',
        endDate: '2025-10-23',
        days: 2,
        reason: 'Back pain',
        status: 'APPROVED',
        requestedAt: '2025-10-22T07:30:00.000Z',
        approvedAt: '2025-10-22T08:00:00.000Z'
      },
      {
        id: 'L-005',
        type: 'VACATION',
        startDate: '2025-12-20',
        endDate: '2025-12-24',
        days: 5,
        reason: 'Holiday vacation',
        status: 'PENDING',
        requestedAt: '2025-11-10T10:00:00.000Z'
      }
    ]
  },
  { 
    id: 'E-003', 
    name: 'David Chen', 
    role: 'Crop Specialist', 
    email: 'david@farm.com', 
    phone: '555-0103',
    emergencyContact: 'Linda Chen',
    emergencyPhone: '555-0197',
    address: '789 Harvest Lane, Farm District',
    city: 'Greenville',
    state: 'CA',
    zipCode: '12345',
    dateEmployed: '2019-03-22',
    dateOfBirth: '1988-11-30',
    hourlyRate: 22.00,
    weeklyHours: 40,
    active: true,
    leaveBalance: {
      vacation: 18,
      sick: 10,
      personal: 5
    },
    leaveHistory: [
      {
        id: 'L-006',
        type: 'SICK',
        startDate: '2025-08-12',
        endDate: '2025-08-14',
        days: 3,
        reason: 'Cold and fever',
        status: 'APPROVED',
        requestedAt: '2025-08-12T07:00:00.000Z',
        approvedAt: '2025-08-12T07:30:00.000Z'
      },
      {
        id: 'L-007',
        type: 'PERSONAL',
        startDate: '2025-07-20',
        endDate: '2025-07-20',
        days: 1,
        reason: 'Family matter',
        status: 'APPROVED',
        requestedAt: '2025-07-15T10:00:00.000Z',
        approvedAt: '2025-07-16T09:00:00.000Z'
      },
      {
        id: 'L-008',
        type: 'VACATION',
        startDate: '2025-06-10',
        endDate: '2025-06-17',
        days: 8,
        reason: 'Summer break',
        status: 'APPROVED',
        requestedAt: '2025-05-01T10:00:00.000Z',
        approvedAt: '2025-05-02T14:00:00.000Z'
      }
    ]
  },
  { 
    id: 'E-004', 
    name: 'Sarah Johnson', 
    role: 'Veterinary Assistant', 
    email: 'sarah@farm.com', 
    phone: '555-0104',
    emergencyContact: 'Michael Johnson',
    emergencyPhone: '555-0196',
    address: '321 Pasture Road, County Side',
    city: 'Farmington',
    state: 'CA',
    zipCode: '12347',
    dateEmployed: '2022-01-05',
    dateOfBirth: '1992-05-25',
    hourlyRate: 20.00,
    weeklyHours: 35,
    active: true,
    leaveBalance: {
      vacation: 10,
      sick: 8,
      personal: 3
    },
    leaveHistory: [
      {
        id: 'L-009',
        type: 'SICK',
        startDate: '2025-11-12',
        endDate: '2025-11-13',
        days: 2,
        reason: 'Medical checkup',
        status: 'APPROVED',
        requestedAt: '2025-11-10T09:00:00.000Z',
        approvedAt: '2025-11-10T10:00:00.000Z'
      },
      {
        id: 'L-010',
        type: 'PERSONAL',
        startDate: '2025-10-05',
        endDate: '2025-10-05',
        days: 1,
        reason: 'Moving day',
        status: 'APPROVED',
        requestedAt: '2025-09-28T10:00:00.000Z',
        approvedAt: '2025-09-29T09:00:00.000Z'
      }
    ]
  }
]

const SAMPLE_SCHEDULES = [
  {
    id: 'SCH-001',
    title: 'Morning Milking',
    description: 'Milk all dairy cows in barn A and B',
    type: 'ROUTINE',
    priority: 'HIGH',
    status: 'PENDING',
    recurrence: 'DAILY',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '05:00',
    duration: 120,
    assignedTo: ['E-001', 'E-002'],
    location: 'Barn A & B',
    reminderMinutes: 30,
    notes: 'Ensure equipment is sanitized before starting',
    createdAt: new Date().toISOString(),
    completedInstances: []
  },
  {
    id: 'SCH-002',
    title: 'Pasture Rotation',
    description: 'Move cattle from north pasture to east pasture',
    type: 'ROUTINE',
    priority: 'MEDIUM',
    status: 'PENDING',
    recurrence: 'WEEKLY',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    duration: 60,
    assignedTo: ['E-002'],
    location: 'North & East Pastures',
    reminderMinutes: 60,
    notes: 'Check water supply in east pasture before moving',
    createdAt: new Date().toISOString(),
    completedInstances: []
  },
  {
    id: 'SCH-003',
    title: 'Vet Check - Breeding Cows',
    description: 'Pregnancy checks for breeding group',
    type: 'VETERINARY',
    priority: 'HIGH',
    status: 'PENDING',
    recurrence: 'MONTHLY',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '10:00',
    duration: 180,
    assignedTo: ['E-004', 'E-001'],
    location: 'Handling Facility',
    reminderMinutes: 1440,
    notes: 'Dr. Wilson scheduled - confirm 24 hours before',
    createdAt: new Date().toISOString(),
    completedInstances: []
  }
]

export default function Schedules() {
  const SCHEDULES_KEY = 'cattalytics:schedules:v2'
  const EMPLOYEES_KEY = 'cattalytics:employees:v2'
  
  const [schedules, setSchedules] = useState([])
  const [employees, setEmployees] = useState([])
  const [view, setView] = useState('calendar') // calendar, list, employees, timetable
  const [calendarMode, setCalendarMode] = useState('enhanced') // 'classic' or 'enhanced'
  const [showModal, setShowModal] = useState(false)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showEmployeeDetailsModal, setShowEmployeeDetailsModal] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [detailsEmployee, setDetailsEmployee] = useState(null)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterEmployee, setFilterEmployee] = useState('ALL')
  const [filterType, setFilterType] = useState('ALL')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [timetableWeek, setTimetableWeek] = useState(new Date().toISOString().split('T')[0])

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'ROUTINE',
    priority: 'MEDIUM',
    status: 'PENDING',
    recurrence: 'ONCE',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    duration: 60,
    assignedTo: [],
    location: '',
    reminderMinutes: 30,
    notes: ''
  })

  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    emergencyContact: '',
    emergencyPhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    dateEmployed: new Date().toISOString().split('T')[0],
    dateOfBirth: '',
    hourlyRate: 0,
    weeklyHours: 40,
    active: true,
    leaveBalance: {
      vacation: 10,
      sick: 8,
      personal: 3
    }
  })

  const [leaveForm, setLeaveForm] = useState({
    type: 'VACATION',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'PENDING'
  })

  useEffect(() => {
    const rawSchedules = localStorage.getItem(SCHEDULES_KEY)
    const rawEmployees = localStorage.getItem(EMPLOYEES_KEY)
    
    if (rawSchedules) setSchedules(JSON.parse(rawSchedules))
    else setSchedules(SAMPLE_SCHEDULES)
    
    if (rawEmployees) setEmployees(JSON.parse(rawEmployees))
    else setEmployees(SAMPLE_EMPLOYEES)
  }, [])

  useEffect(() => {
    localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules))
  }, [schedules])

  useEffect(() => {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees))
  }, [employees])

  // Check for reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      const upcoming = schedules.filter(sch => {
        if (sch.status === 'COMPLETED' || sch.status === 'CANCELLED') return false
        
        const scheduleDateTime = new Date(`${sch.startDate}T${sch.startTime}`)
        const diffMinutes = (scheduleDateTime - now) / (1000 * 60)
        
        return diffMinutes > 0 && diffMinutes <= (sch.reminderMinutes || 30)
      })
      
      if (upcoming.length > 0 && Notification.permission === 'granted') {
        upcoming.forEach(sch => {
          new Notification(`Upcoming Task: ${sch.title}`, {
            body: `Starting at ${sch.startTime} - ${sch.description}`,
            icon: '🔔'
          })
        })
      }
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const interval = setInterval(checkReminders, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [schedules])

  function openModal(schedule = null) {
    if (schedule) {
      setSelectedSchedule(schedule)
      setFormData({
        title: schedule.title,
        description: schedule.description,
        type: schedule.type,
        priority: schedule.priority,
        status: schedule.status,
        recurrence: schedule.recurrence,
        startDate: schedule.startDate,
        startTime: schedule.startTime,
        duration: schedule.duration,
        assignedTo: schedule.assignedTo,
        location: schedule.location,
        reminderMinutes: schedule.reminderMinutes,
        notes: schedule.notes
      })
    } else {
      setSelectedSchedule(null)
      setFormData({
        title: '',
        description: '',
        type: 'ROUTINE',
        priority: 'MEDIUM',
        status: 'PENDING',
        recurrence: 'ONCE',
        startDate: selectedDate,
        startTime: '08:00',
        duration: 60,
        assignedTo: [],
        location: '',
        reminderMinutes: 30,
        notes: ''
      })
    }
    setShowModal(true)
  }

  function saveSchedule() {
    if (!formData.title.trim()) {
      alert('Please enter a title')
      return
    }

    if (selectedSchedule) {
      setSchedules(schedules.map(s => 
        s.id === selectedSchedule.id 
          ? { ...s, ...formData }
          : s
      ))
    } else {
      const newSchedule = {
        id: 'SCH-' + Math.floor(1000 + Math.random() * 9000),
        ...formData,
        createdAt: new Date().toISOString(),
        completedInstances: []
      }
      setSchedules([...schedules, newSchedule])
    }
    setShowModal(false)
  }

  function deleteSchedule(id) {
    if (!confirm('Delete this schedule? This cannot be undone.')) return
    setSchedules(schedules.filter(s => s.id !== id))
  }

  function completeSchedule(schedule) {
    const instance = {
      completedAt: new Date().toISOString(),
      completedBy: schedule.assignedTo,
      notes: ''
    }
    
    setSchedules(schedules.map(s => 
      s.id === schedule.id 
        ? {
            ...s,
            status: 'COMPLETED',
            completedInstances: [...(s.completedInstances || []), instance]
          }
        : s
    ))
  }

  function updateStatus(scheduleId, newStatus) {
    setSchedules(schedules.map(s => 
      s.id === scheduleId 
        ? { ...s, status: newStatus }
        : s
    ))
  }

  // Employee management
  function openEmployeeModal(employee = null) {
    if (employee) {
      setSelectedEmployee(employee)
      setEmployeeForm({
        name: employee.name,
        role: employee.role,
        email: employee.email,
        phone: employee.phone,
        emergencyContact: employee.emergencyContact || '',
        emergencyPhone: employee.emergencyPhone || '',
        address: employee.address || '',
        city: employee.city || '',
        state: employee.state || '',
        zipCode: employee.zipCode || '',
        dateEmployed: employee.dateEmployed || new Date().toISOString().split('T')[0],
        dateOfBirth: employee.dateOfBirth || '',
        hourlyRate: employee.hourlyRate || 0,
        weeklyHours: employee.weeklyHours || 40,
        active: employee.active,
        leaveBalance: employee.leaveBalance || { vacation: 10, sick: 8, personal: 3 }
      })
    } else {
      setSelectedEmployee(null)
      setEmployeeForm({
        name: '',
        role: '',
        email: '',
        phone: '',
        emergencyContact: '',
        emergencyPhone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        dateEmployed: new Date().toISOString().split('T')[0],
        dateOfBirth: '',
        hourlyRate: 0,
        weeklyHours: 40,
        active: true,
        leaveBalance: {
          vacation: 10,
          sick: 8,
          personal: 3
        }
      })
    }
    setShowEmployeeModal(true)
  }

  function saveEmployee() {
    if (!employeeForm.name.trim()) {
      alert('Please enter employee name')
      return
    }

    if (selectedEmployee) {
      setEmployees(employees.map(e => 
        e.id === selectedEmployee.id 
          ? { ...e, ...employeeForm }
          : e
      ))
    } else {
      const newEmployee = {
        id: 'E-' + Math.floor(1000 + Math.random() * 9000),
        ...employeeForm,
        leaveHistory: []
      }
      setEmployees([...employees, newEmployee])
    }
    setShowEmployeeModal(false)
  }

  function deleteEmployee(id) {
    if (!confirm('Delete this employee? This cannot be undone.')) return
    setEmployees(employees.filter(e => e.id !== id))
  }

  function openEmployeeDetails(employee) {
    setDetailsEmployee(employee)
    setShowEmployeeDetailsModal(true)
  }

  function openLeaveModal(employee) {
    setSelectedEmployee(employee)
    setLeaveForm({
      type: 'VACATION',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: '',
      status: 'PENDING'
    })
    setShowLeaveModal(true)
  }

  function saveLeaveRequest() {
    if (!leaveForm.startDate || !leaveForm.endDate) {
      alert('Please select start and end dates')
      return
    }

    const startDate = new Date(leaveForm.startDate)
    const endDate = new Date(leaveForm.endDate)
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1

    const leaveEntry = {
      id: 'L-' + Math.floor(1000 + Math.random() * 9000),
      ...leaveForm,
      days: daysDiff,
      requestedAt: new Date().toISOString()
    }

    setEmployees(employees.map(e => 
      e.id === selectedEmployee.id 
        ? {
            ...e,
            leaveHistory: [...(e.leaveHistory || []), leaveEntry]
          }
        : e
    ))

    setShowLeaveModal(false)
  }

  function approveLeave(employeeId, leaveId) {
    setEmployees(employees.map(e => {
      if (e.id === employeeId) {
        const leave = e.leaveHistory.find(l => l.id === leaveId)
        
        // Deduct from balance when approved
        let updatedBalance = { ...e.leaveBalance }
        if (leave) {
          const leaveType = leave.type.toLowerCase()
          if (leaveType === 'vacation' && updatedBalance.vacation) {
            updatedBalance.vacation = Math.max(0, updatedBalance.vacation - leave.days)
          } else if (leaveType === 'sick' && updatedBalance.sick) {
            updatedBalance.sick = Math.max(0, updatedBalance.sick - leave.days)
          } else if (leaveType === 'personal' && updatedBalance.personal) {
            updatedBalance.personal = Math.max(0, updatedBalance.personal - leave.days)
          }
        }
        
        const updatedHistory = e.leaveHistory.map(l => 
          l.id === leaveId 
            ? { ...l, status: 'APPROVED', approvedAt: new Date().toISOString() }
            : l
        )
        return { ...e, leaveHistory: updatedHistory, leaveBalance: updatedBalance }
      }
      return e
    }))
  }

  function rejectLeave(employeeId, leaveId) {
    setEmployees(employees.map(e => {
      if (e.id === employeeId) {
        const updatedHistory = e.leaveHistory.map(leave => 
          leave.id === leaveId 
            ? { ...leave, status: 'REJECTED', rejectedAt: new Date().toISOString() }
            : leave
        )
        return { ...e, leaveHistory: updatedHistory }
      }
      return e
    }))
  }

  function deleteLeave(employeeId, leaveId) {
    if (!confirm('Delete this leave request?')) return
    setEmployees(employees.map(e => {
      if (e.id === employeeId) {
        return { ...e, leaveHistory: e.leaveHistory.filter(l => l.id !== leaveId) }
      }
      return e
    }))
  }

  // Check for upcoming leaves and send reminders
  useEffect(() => {
    const checkLeaveReminders = () => {
      const now = new Date()
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      
      employees.forEach(emp => {
        if (!emp.leaveHistory) return
        
        emp.leaveHistory.forEach(leave => {
          if (leave.status !== 'APPROVED') return
          
          const leaveStart = new Date(leave.startDate)
          const leaveEnd = new Date(leave.endDate)
          
          // Remind 3 days before leave starts
          if (leaveStart >= now && leaveStart <= threeDaysFromNow) {
            if (Notification.permission === 'granted') {
              new Notification(`Upcoming Leave - ${emp.name}`, {
                body: `${LEAVE_TYPES[leave.type]} starting ${leaveStart.toLocaleDateString()} (${leave.days} days)`,
                icon: '🏖️'
              })
            }
          }
          
          // Notify when employee is currently on leave
          if (leaveStart <= now && leaveEnd >= now) {
            // Employee is currently on leave
            console.log(`${emp.name} is currently on ${LEAVE_TYPES[leave.type]}`)
          }
        })
      })
    }

    const interval = setInterval(checkLeaveReminders, 60000 * 60) // Check hourly
    checkLeaveReminders() // Check immediately on mount
    
    return () => clearInterval(interval)
  }, [employees])

  // Filtering
  const filteredSchedules = schedules.filter(sch => {
    if (filterStatus !== 'ALL' && sch.status !== filterStatus) return false
    if (filterType !== 'ALL' && sch.type !== filterType) return false
    if (filterEmployee !== 'ALL' && !sch.assignedTo.includes(filterEmployee)) return false
    return true
  })

  // Update overdue statuses
  useEffect(() => {
    const now = new Date()
    const updated = schedules.map(sch => {
      if (sch.status === 'PENDING' || sch.status === 'IN_PROGRESS') {
        const scheduleDateTime = new Date(`${sch.startDate}T${sch.startTime}`)
        if (scheduleDateTime < now) {
          return { ...sch, status: 'OVERDUE' }
        }
      }
      return sch
    })
    
    if (JSON.stringify(updated) !== JSON.stringify(schedules)) {
      setSchedules(updated)
    }
  }, [schedules])

  // Get schedules for a specific date
  function getSchedulesForDate(date) {
    return filteredSchedules.filter(sch => sch.startDate === date)
  }

  // Timetable functions
  function getWeekDates(startDate) {
    const date = new Date(startDate)
    const day = date.getDay()
    const diff = date.getDate() - day // Adjust to start of week (Sunday)
    const sunday = new Date(date.setDate(diff))
    
    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday)
      d.setDate(sunday.getDate() + i)
      weekDates.push(d.toISOString().split('T')[0])
    }
    return weekDates
  }

  function getSchedulesForEmployeeAndDate(employeeId, date) {
    return schedules
      .filter(sch => {
        if (!sch.assignedTo.includes(employeeId)) return false
        if (sch.status === 'CANCELLED') return false
        
        // Handle recurring schedules
        if (sch.recurrence === 'DAILY') {
          return new Date(date) >= new Date(sch.startDate)
        } else if (sch.recurrence === 'WEEKLY') {
          const schDate = new Date(sch.startDate)
          const targetDate = new Date(date)
          const daysDiff = Math.floor((targetDate - schDate) / (1000 * 60 * 60 * 24))
          return daysDiff >= 0 && daysDiff % 7 === 0
        } else {
          return sch.startDate === date
        }
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  function calculateTotalHours(employeeId, weekDates) {
    let totalMinutes = 0
    weekDates.forEach(date => {
      const daySchedules = getSchedulesForEmployeeAndDate(employeeId, date)
      daySchedules.forEach(sch => {
        totalMinutes += sch.duration || 0
      })
    })
    return (totalMinutes / 60).toFixed(1)
  }

  function getTimeSlot(time) {
    const hour = parseInt(time.split(':')[0])
    if (hour < 6) return 'Night (12AM-6AM)'
    if (hour < 12) return 'Morning (6AM-12PM)'
    if (hour < 18) return 'Afternoon (12PM-6PM)'
    return 'Evening (6PM-12AM)'
  }

  // Calendar generation
  function generateCalendar() {
    const year = new Date(selectedDate).getFullYear()
    const month = new Date(selectedDate).getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    
    return days
  }

  // Statistics
  const stats = {
    total: schedules.length,
    pending: schedules.filter(s => s.status === 'PENDING').length,
    inProgress: schedules.filter(s => s.status === 'IN_PROGRESS').length,
    completed: schedules.filter(s => s.status === 'COMPLETED').length,
    overdue: schedules.filter(s => s.status === 'OVERDUE').length,
    today: schedules.filter(s => s.startDate === new Date().toISOString().split('T')[0]).length
  }

  // Leave statistics
  const today = new Date().toISOString().split('T')[0]
  const allLeaves = employees.flatMap(e => 
    (e.leaveHistory || []).map(leave => ({ ...leave, employeeName: e.name, employeeId: e.id }))
  )
  const pendingLeaves = allLeaves.filter(l => l.status === 'PENDING')
  const onLeaveToday = allLeaves.filter(l => 
    l.status === 'APPROVED' && 
    new Date(l.startDate) <= new Date(today) && 
    new Date(l.endDate) >= new Date(today)
  )
  const upcomingLeaves = allLeaves.filter(l => {
    const startDate = new Date(l.startDate)
    const nowDate = new Date(today)
    const weekFromNow = new Date(nowDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    return l.status === 'APPROVED' && startDate > nowDate && startDate <= weekFromNow
  })

  const activeEmployees = employees.filter(e => e.active)

  return (
    <section style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>📅 Schedule Management</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => setView('calendar')}
            style={{ background: view === 'calendar' ? '#4CAF50' : '#666' }}
          >
            📅 Calendar
          </button>
          <button 
            onClick={() => setView('list')}
            style={{ background: view === 'list' ? '#4CAF50' : '#666' }}
          >
            📋 List View
          </button>
          <button 
            onClick={() => setView('timetable')}
            style={{ background: view === 'timetable' ? '#4CAF50' : '#666' }}
          >
            ⏰ Timetable
          </button>
          <button 
            onClick={() => setView('employees')}
            style={{ background: view === 'employees' ? '#4CAF50' : '#666' }}
          >
            👥 Employees
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        <div style={{ background: '#e3f2fd', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1976d2' }}>{stats.total}</div>
          <div style={{ fontSize: 14, color: '#666' }}>Total Schedules</div>
        </div>
        <div style={{ background: '#fff9c4', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#f57c00' }}>{stats.today}</div>
          <div style={{ fontSize: 14, color: '#666' }}>Today's Tasks</div>
        </div>
        <div style={{ background: '#ffe0b2', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#e65100' }}>{stats.pending}</div>
          <div style={{ fontSize: 14, color: '#666' }}>Pending</div>
        </div>
        <div style={{ background: '#c8e6c9', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#388e3c' }}>{stats.inProgress}</div>
          <div style={{ fontSize: 14, color: '#666' }}>In Progress</div>
        </div>
        <div style={{ background: '#ffcdd2', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#d32f2f' }}>{stats.overdue}</div>
          <div style={{ fontSize: 14, color: '#666' }}>Overdue</div>
        </div>
        <div style={{ background: '#f0f4c3', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#689f38' }}>{activeEmployees.length}</div>
          <div style={{ fontSize: 14, color: '#666' }}>Active Staff</div>
        </div>
      </div>

      {/* Leave Status Dashboard */}
      {(pendingLeaves.length > 0 || onLeaveToday.length > 0 || upcomingLeaves.length > 0) && (
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: 20,
          borderRadius: 12,
          marginBottom: 24,
          color: 'white'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>🏖️ Leave Status Dashboard</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {pendingLeaves.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 8 }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 4 }}>{pendingLeaves.length}</div>
                <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>Pending Leave Requests</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>
                  {pendingLeaves.slice(0, 2).map(l => (
                    <div key={l.id} style={{ marginBottom: 2 }}>
                      • {l.employeeName}: {LEAVE_TYPES[l.type]}
                    </div>
                  ))}
                  {pendingLeaves.length > 2 && <div>+{pendingLeaves.length - 2} more</div>}
                </div>
              </div>
            )}
            
            {onLeaveToday.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 8 }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 4 }}>{onLeaveToday.length}</div>
                <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>On Leave Today</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>
                  {onLeaveToday.map(l => (
                    <div key={l.id} style={{ marginBottom: 2 }}>
                      • {l.employeeName}: {LEAVE_TYPES[l.type]}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {upcomingLeaves.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 8 }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 4 }}>{upcomingLeaves.length}</div>
                <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>Upcoming (Next 7 Days)</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>
                  {upcomingLeaves.slice(0, 2).map(l => (
                    <div key={l.id} style={{ marginBottom: 2 }}>
                      • {l.employeeName}: {new Date(l.startDate).toLocaleDateString()}
                    </div>
                  ))}
                  {upcomingLeaves.length > 2 && <div>+{upcomingLeaves.length - 2} more</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {/* Calendar Mode Toggle */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 8 }}>
            <button 
              onClick={() => setCalendarMode('enhanced')}
              style={{ 
                padding: '8px 16px',
                background: calendarMode === 'enhanced' ? '#8b5cf6' : '#f3f4f6',
                color: calendarMode === 'enhanced' ? 'white' : '#374151',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              ✨ Enhanced Calendar
            </button>
            <button 
              onClick={() => setCalendarMode('classic')}
              style={{ 
                padding: '8px 16px',
                background: calendarMode === 'classic' ? '#8b5cf6' : '#f3f4f6',
                color: calendarMode === 'classic' ? 'white' : '#374151',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              📅 Classic View
            </button>
          </div>

          {/* Enhanced Calendar Component */}
          {calendarMode === 'enhanced' ? (
            <Calendar
              events={filteredSchedules.map(sch => ({
                id: sch.id,
                title: sch.title,
                description: sch.description,
                date: sch.startDate,
                time: sch.startTime,
                category: sch.type.toLowerCase().includes('treatment') ? 'treatment' :
                         sch.type.toLowerCase().includes('breeding') ? 'breeding' :
                         sch.type.toLowerCase().includes('feeding') ? 'feeding' :
                         sch.type.toLowerCase().includes('veterinary') ? 'checkup' :
                         sch.type.toLowerCase().includes('routine') ? 'task' : 'other',
                animal: sch.location || undefined
              }))}
              onEventClick={(event) => {
                const schedule = schedules.find(s => s.id === event.id);
                if (schedule) openModal(schedule);
              }}
              onAddEvent={(date, time) => {
                setFormData({
                  ...formData,
                  startDate: date.toISOString ? date.toISOString().split('T')[0] : date,
                  startTime: time || '08:00'
                });
                openModal();
              }}
            />
          ) : (
            <div>
              {/* Classic Calendar View */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button onClick={() => {
                    const d = new Date(selectedDate)
                    d.setMonth(d.getMonth() - 1)
                    setSelectedDate(d.toISOString().split('T')[0])
                  }}>
                    ← Previous
                  </button>
                  <h3 style={{ margin: 0 }}>
                    {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button onClick={() => {
                    const d = new Date(selectedDate)
                    d.setMonth(d.getMonth() + 1)
                    setSelectedDate(d.toISOString().split('T')[0])
                  }}>
                    Next →
                  </button>
                  <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>
                    Today
                  </button>
                </div>
                <button onClick={() => openModal()} style={{ background: '#4CAF50' }}>
                  ➕ New Schedule
                </button>
              </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px' }}>
              <option value="ALL">All Statuses</option>
              {Object.entries(STATUS_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px' }}>
              <option value="ALL">All Types</option>
              {Object.entries(SCHEDULE_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} style={{ padding: '8px 12px' }}>
              <option value="ALL">All Employees</option>
              {activeEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ 
                fontWeight: 'bold', 
                textAlign: 'center', 
                padding: 8,
                background: '#f5f5f5',
                borderRadius: 4
              }}>
                {day}
              </div>
            ))}
            {generateCalendar().map((day, idx) => {
              if (!day) return <div key={idx} style={{ minHeight: 100 }} />
              
              const dateStr = new Date(
                new Date(selectedDate).getFullYear(),
                new Date(selectedDate).getMonth(),
                day
              ).toISOString().split('T')[0]
              
              const daySchedules = getSchedulesForDate(dateStr)
              const isToday = dateStr === new Date().toISOString().split('T')[0]
              
              return (
                <div 
                  key={idx}
                  style={{
                    border: isToday ? '2px solid #4CAF50' : '1px solid #ddd',
                    borderRadius: 8,
                    padding: 8,
                    minHeight: 100,
                    background: isToday ? '#f0fff0' : 'white',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{day}</div>
                  {daySchedules.slice(0, 3).map(sch => (
                    <div 
                      key={sch.id}
                      style={{
                        fontSize: 11,
                        padding: '2px 4px',
                        marginBottom: 2,
                        borderRadius: 3,
                        background: 
                          sch.status === 'COMPLETED' ? '#c8e6c9' :
                          sch.status === 'OVERDUE' ? '#ffcdd2' :
                          sch.status === 'IN_PROGRESS' ? '#fff9c4' :
                          '#e3f2fd',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        openModal(sch)
                      }}
                    >
                      {sch.startTime} {sch.title}
                    </div>
                  ))}
                  {daySchedules.length > 3 && (
                    <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                      +{daySchedules.length - 3} more
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Selected Date Tasks */}
          {getSchedulesForDate(selectedDate).length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3>Tasks for {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {getSchedulesForDate(selectedDate)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map(sch => (
                    <div 
                      key={sch.id}
                      style={{
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        padding: 16,
                        background: 'white'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 18, fontWeight: 'bold' }}>{sch.title}</span>
                            <span style={{ 
                              fontSize: 12, 
                              padding: '2px 8px', 
                              borderRadius: 12,
                              background: 
                                sch.priority === 'URGENT' ? '#ffcdd2' :
                                sch.priority === 'HIGH' ? '#ffe0b2' :
                                sch.priority === 'MEDIUM' ? '#fff9c4' :
                                '#e0e0e0',
                              color: '#333'
                            }}>
                              {PRIORITY_LEVELS[sch.priority]}
                            </span>
                            <span style={{ 
                              fontSize: 12, 
                              padding: '2px 8px', 
                              borderRadius: 12,
                              background: 
                                sch.status === 'COMPLETED' ? '#c8e6c9' :
                                sch.status === 'OVERDUE' ? '#ffcdd2' :
                                sch.status === 'IN_PROGRESS' ? '#fff9c4' :
                                '#e3f2fd',
                              color: '#333'
                            }}>
                              {STATUS_TYPES[sch.status]}
                            </span>
                          </div>
                          <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>{sch.description}</div>
                          <div style={{ fontSize: 13, color: '#888' }}>
                            ⏰ {sch.startTime} ({sch.duration} min) | 📍 {sch.location || 'Not specified'} | 
                            🔔 Reminder: {sch.reminderMinutes} min before
                          </div>
                          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                            👥 Assigned: {sch.assignedTo.map(id => 
                              employees.find(e => e.id === id)?.name || id
                            ).join(', ') || 'Unassigned'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {sch.status !== 'COMPLETED' && (
                            <>
                              <select 
                                value={sch.status}
                                onChange={(e) => updateStatus(sch.id, e.target.value)}
                                style={{ padding: '4px 8px', fontSize: 12 }}
                              >
                                {Object.entries(STATUS_TYPES).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                              <button 
                                onClick={() => completeSchedule(sch)}
                                style={{ background: '#4CAF50', fontSize: 12 }}
                              >
                                ✓ Complete
                              </button>
                            </>
                          )}
                          <button onClick={() => openModal(sch)} style={{ fontSize: 12 }}>
                            ✏️ Edit
                          </button>
                          <button onClick={() => deleteSchedule(sch.id)} style={{ background: '#f44336', fontSize: 12 }}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3>All Schedules</h3>
            <button onClick={() => openModal()} style={{ background: '#4CAF50' }}>
              ➕ New Schedule
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px' }}>
              <option value="ALL">All Statuses</option>
              {Object.entries(STATUS_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px' }}>
              <option value="ALL">All Types</option>
              {Object.entries(SCHEDULE_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} style={{ padding: '8px 12px' }}>
              <option value="ALL">All Employees</option>
              {activeEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          {/* Schedules Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #ddd' }}>Title</th>
                  <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #ddd' }}>Type</th>
                  <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #ddd' }}>Date & Time</th>
                  <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #ddd' }}>Assigned To</th>
                  <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #ddd' }}>Priority</th>
                  <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                  <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #ddd' }}>Recurrence</th>
                  <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules
                  .sort((a, b) => {
                    const dateA = new Date(`${a.startDate}T${a.startTime}`)
                    const dateB = new Date(`${b.startDate}T${b.startTime}`)
                    return dateA - dateB
                  })
                  .map(sch => (
                    <tr key={sch.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: 12 }}>
                        <div style={{ fontWeight: 'bold' }}>{sch.title}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{sch.description}</div>
                      </td>
                      <td style={{ padding: 12 }}>{SCHEDULE_TYPES[sch.type]}</td>
                      <td style={{ padding: 12 }}>
                        <div>{new Date(sch.startDate).toLocaleDateString()}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{sch.startTime} ({sch.duration}m)</div>
                      </td>
                      <td style={{ padding: 12 }}>
                        {sch.assignedTo.map(id => {
                          const emp = employees.find(e => e.id === id)
                          return emp ? (
                            <div key={id} style={{ fontSize: 12, marginBottom: 2 }}>{emp.name}</div>
                          ) : null
                        })}
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={{ 
                          fontSize: 12, 
                          padding: '4px 8px', 
                          borderRadius: 12,
                          background: 
                            sch.priority === 'URGENT' ? '#ffcdd2' :
                            sch.priority === 'HIGH' ? '#ffe0b2' :
                            sch.priority === 'MEDIUM' ? '#fff9c4' :
                            '#e0e0e0'
                        }}>
                          {PRIORITY_LEVELS[sch.priority]}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={{ 
                          fontSize: 12, 
                          padding: '4px 8px', 
                          borderRadius: 12,
                          background: 
                            sch.status === 'COMPLETED' ? '#c8e6c9' :
                            sch.status === 'OVERDUE' ? '#ffcdd2' :
                            sch.status === 'IN_PROGRESS' ? '#fff9c4' :
                            '#e3f2fd'
                        }}>
                          {STATUS_TYPES[sch.status]}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>{RECURRENCE_TYPES[sch.recurrence]}</td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {sch.status !== 'COMPLETED' && (
                            <button 
                              onClick={() => completeSchedule(sch)}
                              style={{ background: '#4CAF50', fontSize: 11, padding: '4px 8px' }}
                            >
                              ✓
                            </button>
                          )}
                          <button 
                            onClick={() => openModal(sch)}
                            style={{ fontSize: 11, padding: '4px 8px' }}
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => deleteSchedule(sch.id)}
                            style={{ background: '#f44336', fontSize: 11, padding: '4px 8px' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employees View */}
      {view === 'employees' && (
        <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3>Employee Management</h3>
            <button onClick={() => openEmployeeModal()} style={{ background: '#4CAF50' }}>
              ➕ Add Employee
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
            {employees.map(emp => {
              const assignedTasks = schedules.filter(s => 
                s.assignedTo.includes(emp.id) && s.status !== 'COMPLETED' && s.status !== 'CANCELLED'
              )
              const pendingLeaves = (emp.leaveHistory || []).filter(l => l.status === 'PENDING').length
              const approvedLeaves = (emp.leaveHistory || []).filter(l => l.status === 'APPROVED' && 
                new Date(l.startDate) >= new Date()
              )
              const onLeaveNow = (emp.leaveHistory || []).find(l => 
                l.status === 'APPROVED' && 
                new Date(l.startDate) <= new Date() && 
                new Date(l.endDate) >= new Date()
              )
              const nextLeave = (emp.leaveHistory || [])
                .filter(l => l.status === 'APPROVED' && new Date(l.startDate) > new Date())
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0]
              const yearsEmployed = emp.dateEmployed ? 
                ((new Date() - new Date(emp.dateEmployed)) / (1000 * 60 * 60 * 24 * 365)).toFixed(1) : 0
              
              return (
                <div 
                  key={emp.id}
                  style={{
                    border: emp.active ? '2px solid #ddd' : '2px solid #ccc',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: emp.active ? 'white' : '#f5f5f5',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* Header */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: 16
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: 18 }}>{emp.name}</h4>
                        <div style={{ fontSize: 13, opacity: 0.9 }}>{emp.role}</div>
                        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                          {emp.id} • Employed {yearsEmployed} years
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: 11, 
                        padding: '4px 12px',
                        borderRadius: 12,
                        background: emp.active ? '#4CAF50' : '#999',
                        fontWeight: 'bold'
                      }}>
                        {emp.active ? 'ACTIVE' : 'INACTIVE'}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div style={{ padding: 16, borderBottom: '1px solid #eee' }}>
                    <div style={{ fontSize: 12, marginBottom: 6 }}>
                      <strong>📧 Email:</strong> {emp.email}
                    </div>
                    <div style={{ fontSize: 12, marginBottom: 6 }}>
                      <strong>📱 Phone:</strong> {emp.phone}
                    </div>
                    {emp.address && (
                      <div style={{ fontSize: 12, marginBottom: 6 }}>
                        <strong>🏠 Address:</strong> {emp.address}, {emp.city}, {emp.state} {emp.zipCode}
                      </div>
                    )}
                    {emp.dateOfBirth && (
                      <div style={{ fontSize: 12, marginBottom: 6 }}>
                        <strong>🎂 DOB:</strong> {new Date(emp.dateOfBirth).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Work Info */}
                  <div style={{ padding: 16, borderBottom: '1px solid #eee', background: '#f9f9f9' }}>
                    <div style={{ fontSize: 12, marginBottom: 6 }}>
                      <strong>📅 Employed Since:</strong> {emp.dateEmployed ? new Date(emp.dateEmployed).toLocaleDateString() : 'N/A'}
                    </div>
                    <div style={{ fontSize: 12, marginBottom: 6 }}>
                      <strong>💰 Rate:</strong> ${emp.hourlyRate ? emp.hourlyRate.toFixed(2) : '0.00'}/hr
                    </div>
                    <div style={{ fontSize: 12 }}>
                      <strong>⏰ Hours/Week:</strong> {emp.weeklyHours || 40}
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  {emp.emergencyContact && (
                    <div style={{ padding: 16, borderBottom: '1px solid #eee' }}>
                      <div style={{ fontSize: 11, fontWeight: 'bold', color: '#d32f2f', marginBottom: 6 }}>
                        🚨 EMERGENCY CONTACT
                      </div>
                      <div style={{ fontSize: 12, marginBottom: 4 }}>
                        <strong>{emp.emergencyContact}</strong>
                      </div>
                      <div style={{ fontSize: 12 }}>
                        📞 {emp.emergencyPhone}
                      </div>
                    </div>
                  )}

                  {/* Leave Balance */}
                  <div style={{ padding: 16, borderBottom: '1px solid #eee', background: onLeaveNow ? '#fff3e0' : '#f0f4ff' }}>
                    <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 8, color: onLeaveNow ? '#f57c00' : '#1976d2' }}>
                      🏖️ LEAVE STATUS
                    </div>
                    
                    {/* Current Leave Status */}
                    {onLeaveNow && (
                      <div style={{ 
                        padding: 8, 
                        background: '#ff9800', 
                        color: 'white', 
                        borderRadius: 6,
                        marginBottom: 12,
                        textAlign: 'center',
                        fontWeight: 'bold'
                      }}>
                        🏖️ ON LEAVE NOW
                        <div style={{ fontSize: 11, marginTop: 4, opacity: 0.9 }}>
                          {LEAVE_TYPES[onLeaveNow.type]}
                        </div>
                        <div style={{ fontSize: 10, marginTop: 2, opacity: 0.8 }}>
                          Returns: {new Date(onLeaveNow.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    
                    {/* Next Scheduled Leave */}
                    {!onLeaveNow && nextLeave && (
                      <div style={{ 
                        padding: 8, 
                        background: '#e3f2fd', 
                        borderRadius: 6,
                        marginBottom: 12,
                        border: '1px solid #2196F3'
                      }}>
                        <div style={{ fontSize: 10, color: '#1976d2', fontWeight: 'bold', marginBottom: 4 }}>
                          NEXT LEAVE:
                        </div>
                        <div style={{ fontSize: 11, color: '#333' }}>
                          📅 {new Date(nextLeave.startDate).toLocaleDateString()} - {new Date(nextLeave.endDate).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                          {LEAVE_TYPES[nextLeave.type]} ({nextLeave.days} days)
                        </div>
                      </div>
                    )}
                    
                    {/* Leave Balance */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 'bold', color: '#4CAF50' }}>
                          {emp.leaveBalance?.vacation || 0}
                        </div>
                        <div style={{ fontSize: 10, color: '#666' }}>Vacation</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 'bold', color: '#f57c00' }}>
                          {emp.leaveBalance?.sick || 0}
                        </div>
                        <div style={{ fontSize: 10, color: '#666' }}>Sick</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 'bold', color: '#9c27b0' }}>
                          {emp.leaveBalance?.personal || 0}
                        </div>
                        <div style={{ fontSize: 10, color: '#666' }}>Personal</div>
                      </div>
                    </div>
                    
                    {/* Pending Requests */}
                    {pendingLeaves > 0 && (
                      <div style={{ 
                        marginTop: 8, 
                        padding: 6,
                        background: '#fff9c4',
                        borderRadius: 4,
                        fontSize: 11, 
                        color: '#f57c00',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        border: '1px solid #fbc02d'
                      }}>
                        ⚠️ {pendingLeaves} pending request{pendingLeaves > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {/* Active Tasks */}
                  <div style={{ padding: 16, borderBottom: '1px solid #eee' }}>
                    <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 6 }}>
                      📋 ACTIVE TASKS ({assignedTasks.length})
                    </div>
                    {assignedTasks.length === 0 ? (
                      <div style={{ fontSize: 11, color: '#999', textAlign: 'center', padding: '8px 0' }}>
                        No active tasks
                      </div>
                    ) : (
                      assignedTasks.slice(0, 3).map(task => (
                        <div 
                          key={task.id}
                          style={{
                            fontSize: 11,
                            padding: '4px 8px',
                            marginBottom: 4,
                            borderRadius: 4,
                            background: '#f5f5f5',
                            cursor: 'pointer',
                            borderLeft: '3px solid',
                            borderLeftColor: 
                              task.priority === 'URGENT' ? '#d32f2f' :
                              task.priority === 'HIGH' ? '#f57c00' : '#1976d2'
                          }}
                          onClick={() => {
                            setView('list')
                            setFilterEmployee(emp.id)
                          }}
                        >
                          {task.title} - {new Date(task.startDate).toLocaleDateString()}
                        </div>
                      ))
                    )}
                    {assignedTasks.length > 3 && (
                      <div style={{ fontSize: 10, color: '#666', marginTop: 4, textAlign: 'center' }}>
                        +{assignedTasks.length - 3} more tasks
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ padding: 12, display: 'flex', gap: 8, background: '#fafafa' }}>
                    <button 
                      onClick={() => openEmployeeDetails(emp)}
                      style={{ flex: 1, fontSize: 11, padding: '8px', background: '#1976d2' }}
                    >
                      📄 Full Details
                    </button>
                    <button 
                      onClick={() => openLeaveModal(emp)}
                      style={{ flex: 1, fontSize: 11, padding: '8px', background: '#4CAF50' }}
                    >
                      🏖️ Leave
                    </button>
                    <button 
                      onClick={() => openEmployeeModal(emp)}
                      style={{ fontSize: 11, padding: '8px 12px', background: '#666' }}
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => deleteEmployee(emp.id)}
                      style={{ fontSize: 11, padding: '8px 12px', background: '#f44336' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Timetable View */}
      {view === 'timetable' && (
        <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button onClick={() => {
                const d = new Date(timetableWeek)
                d.setDate(d.getDate() - 7)
                setTimetableWeek(d.toISOString().split('T')[0])
              }}>
                ← Previous Week
              </button>
              <h3 style={{ margin: 0 }}>
                Week of {new Date(getWeekDates(timetableWeek)[0]).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
              <button onClick={() => {
                const d = new Date(timetableWeek)
                d.setDate(d.getDate() + 7)
                setTimetableWeek(d.toISOString().split('T')[0])
              }}>
                Next Week →
              </button>
              <button onClick={() => setTimetableWeek(new Date().toISOString().split('T')[0])}>
                This Week
              </button>
            </div>
            <button onClick={() => openModal()} style={{ background: '#4CAF50' }}>
              ➕ New Schedule
            </button>
          </div>

          {/* Weekly Timetable Grid */}
          <div style={{ overflowX: 'auto' }}>
            {activeEmployees.map(employee => {
              const weekDates = getWeekDates(timetableWeek)
              const totalHours = calculateTotalHours(employee.id, weekDates)
              
              return (
                <div 
                  key={employee.id}
                  style={{ 
                    marginBottom: 32,
                    border: '2px solid #e0e0e0',
                    borderRadius: 8,
                    overflow: 'hidden'
                  }}
                >
                  {/* Employee Header */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: 18 }}>{employee.name}</h4>
                      <div style={{ fontSize: 13, opacity: 0.9 }}>
                        {employee.role} • Total: {totalHours} hours this week
                      </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                      {totalHours}h
                    </div>
                  </div>

                  {/* Weekly Schedule Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
                    {weekDates.map((date, idx) => {
                      const daySchedules = getSchedulesForEmployeeAndDate(employee.id, date)
                      const dayDate = new Date(date)
                      const isToday = date === new Date().toISOString().split('T')[0]
                      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayDate.getDay()]
                      const totalMinutes = daySchedules.reduce((sum, sch) => sum + (sch.duration || 0), 0)
                      
                      return (
                        <div 
                          key={date}
                          style={{
                            borderRight: idx < 6 ? '1px solid #e0e0e0' : 'none',
                            minHeight: 200,
                            background: isToday ? '#f0fff0' : 'white'
                          }}
                        >
                          {/* Day Header */}
                          <div style={{
                            background: isToday ? '#4CAF50' : '#f5f5f5',
                            color: isToday ? 'white' : '#333',
                            padding: '8px',
                            textAlign: 'center',
                            borderBottom: '1px solid #e0e0e0',
                            fontWeight: 'bold'
                          }}>
                            <div style={{ fontSize: 13 }}>{dayName}</div>
                            <div style={{ fontSize: 16 }}>{dayDate.getDate()}</div>
                            <div style={{ fontSize: 11, marginTop: 2 }}>
                              {(totalMinutes / 60).toFixed(1)}h
                            </div>
                          </div>

                          {/* Tasks for the day */}
                          <div style={{ padding: 8 }}>
                            {daySchedules.length === 0 ? (
                              <div style={{ 
                                fontSize: 12, 
                                color: '#999', 
                                textAlign: 'center',
                                paddingTop: 20
                              }}>
                                No tasks
                              </div>
                            ) : (
                              daySchedules.map(sch => (
                                <div
                                  key={sch.id}
                                  style={{
                                    fontSize: 11,
                                    padding: '6px 8px',
                                    marginBottom: 6,
                                    borderRadius: 4,
                                    background: 
                                      sch.priority === 'URGENT' ? '#ffcdd2' :
                                      sch.priority === 'HIGH' ? '#ffe0b2' :
                                      sch.priority === 'MEDIUM' ? '#fff9c4' :
                                      '#e3f2fd',
                                    borderLeft: '3px solid',
                                    borderLeftColor:
                                      sch.priority === 'URGENT' ? '#d32f2f' :
                                      sch.priority === 'HIGH' ? '#f57c00' :
                                      sch.priority === 'MEDIUM' ? '#fbc02d' :
                                      '#1976d2',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => openModal(sch)}
                                  title={`${sch.title}\n${sch.description}\n${sch.location}`}
                                >
                                  <div style={{ fontWeight: 'bold', marginBottom: 2 }}>
                                    {sch.startTime}
                                  </div>
                                  <div style={{ 
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    {sch.title}
                                  </div>
                                  <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                                    {sch.duration}min • {sch.location}
                                  </div>
                                  <div style={{
                                    fontSize: 9,
                                    marginTop: 2,
                                    padding: '1px 4px',
                                    borderRadius: 2,
                                    background: 
                                      sch.status === 'COMPLETED' ? '#c8e6c9' :
                                      sch.status === 'OVERDUE' ? '#ffcdd2' :
                                      sch.status === 'IN_PROGRESS' ? '#fff9c4' :
                                      'rgba(255,255,255,0.5)',
                                    display: 'inline-block'
                                  }}>
                                    {STATUS_TYPES[sch.status]}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Daily Summary by Time Slot */}
                  <div style={{ 
                    background: '#f9f9f9', 
                    padding: 12,
                    borderTop: '1px solid #e0e0e0',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 8
                  }}>
                    {['Morning (6AM-12PM)', 'Afternoon (12PM-6PM)', 'Evening (6PM-12AM)', 'Night (12AM-6AM)'].map(slot => {
                      const slotTasks = weekDates.flatMap(date => 
                        getSchedulesForEmployeeAndDate(employee.id, date)
                          .filter(sch => getTimeSlot(sch.startTime) === slot)
                      )
                      const slotHours = (slotTasks.reduce((sum, sch) => sum + (sch.duration || 0), 0) / 60).toFixed(1)
                      
                      return (
                        <div key={slot} style={{ 
                          background: 'white',
                          padding: 8,
                          borderRadius: 4,
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>
                            {slot.split(' ')[0]}
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>
                            {slotHours}h
                          </div>
                          <div style={{ fontSize: 9, color: '#888' }}>
                            {slotTasks.length} tasks
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Task Type Summary */}
                  <div style={{ 
                    background: '#fafafa',
                    padding: 12,
                    borderTop: '1px solid #e0e0e0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8
                  }}>
                    {Object.entries(SCHEDULE_TYPES).map(([key, label]) => {
                      const typeTasks = weekDates.flatMap(date => 
                        getSchedulesForEmployeeAndDate(employee.id, date)
                          .filter(sch => sch.type === key)
                      )
                      
                      if (typeTasks.length === 0) return null
                      
                      return (
                        <div key={key} style={{ 
                          fontSize: 11,
                          padding: '4px 8px',
                          background: 'white',
                          borderRadius: 12,
                          border: '1px solid #e0e0e0'
                        }}>
                          {label}: <strong>{typeTasks.length}</strong>
                        </div>
                      )
                    }).filter(Boolean)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Weekly Summary Statistics */}
          <div style={{ 
            marginTop: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: 20,
            borderRadius: 8
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Weekly Summary</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: 16 
            }}>
              {(() => {
                const weekDates = getWeekDates(timetableWeek)
                const allWeekSchedules = schedules.filter(sch => 
                  weekDates.includes(sch.startDate) || 
                  (sch.recurrence === 'DAILY' && new Date(sch.startDate) <= new Date(weekDates[6]))
                )
                
                const totalTasks = allWeekSchedules.length
                const completedTasks = allWeekSchedules.filter(s => s.status === 'COMPLETED').length
                const totalHours = (allWeekSchedules.reduce((sum, sch) => sum + (sch.duration || 0), 0) / 60).toFixed(1)
                const avgHoursPerEmployee = (parseFloat(totalHours) / activeEmployees.length).toFixed(1)
                
                return (
                  <>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 4 }}>
                      <div style={{ fontSize: 28, fontWeight: 'bold' }}>{totalTasks}</div>
                      <div style={{ fontSize: 13, opacity: 0.9 }}>Total Tasks</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 4 }}>
                      <div style={{ fontSize: 28, fontWeight: 'bold' }}>{completedTasks}</div>
                      <div style={{ fontSize: 13, opacity: 0.9 }}>Completed</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 4 }}>
                      <div style={{ fontSize: 28, fontWeight: 'bold' }}>{totalHours}h</div>
                      <div style={{ fontSize: 13, opacity: 0.9 }}>Total Hours</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 4 }}>
                      <div style={{ fontSize: 28, fontWeight: 'bold' }}>{avgHoursPerEmployee}h</div>
                      <div style={{ fontSize: 13, opacity: 0.9 }}>Avg per Employee</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 4 }}>
                      <div style={{ fontSize: 28, fontWeight: 'bold' }}>
                        {((completedTasks / totalTasks) * 100 || 0).toFixed(0)}%
                      </div>
                      <div style={{ fontSize: 13, opacity: 0.9 }}>Completion Rate</div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            maxWidth: 600,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: 24
          }}>
            <h3 style={{ marginTop: 0 }}>
              {selectedSchedule ? 'Edit Schedule' : 'New Schedule'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Title *</label>
                <input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Morning Milking"
                  style={{ width: '100%', padding: 8 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the task"
                  rows={3}
                  style={{ width: '100%', padding: 8 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', padding: 8 }}
                  >
                    {Object.entries(SCHEDULE_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    style={{ width: '100%', padding: 8 }}
                  >
                    {Object.entries(PRIORITY_LEVELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: 8 }}
                  >
                    {Object.entries(STATUS_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Recurrence</label>
                  <select
                    value={formData.recurrence}
                    onChange={e => setFormData({ ...formData, recurrence: e.target.value })}
                    style={{ width: '100%', padding: 8 }}
                  >
                    {Object.entries(RECURRENCE_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ width: '100%', padding: 8 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    style={{ width: '100%', padding: 8 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Duration (min)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                    style={{ width: '100%', padding: 8 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Assign To</label>
                <div style={{ border: '1px solid #ddd', borderRadius: 4, padding: 8, maxHeight: 120, overflow: 'auto' }}>
                  {activeEmployees.map(emp => (
                    <label key={emp.id} style={{ display: 'block', marginBottom: 4, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.assignedTo.includes(emp.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setFormData({ ...formData, assignedTo: [...formData.assignedTo, emp.id] })
                          } else {
                            setFormData({ ...formData, assignedTo: formData.assignedTo.filter(id => id !== emp.id) })
                          }
                        }}
                        style={{ marginRight: 8 }}
                      />
                      {emp.name} ({emp.role})
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Location</label>
                <input
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Barn A, North Pasture"
                  style={{ width: '100%', padding: 8 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                  Reminder (minutes before)
                </label>
                <input
                  type="number"
                  value={formData.reminderMinutes}
                  onChange={e => setFormData({ ...formData, reminderMinutes: parseInt(e.target.value) || 30 })}
                  style={{ width: '100%', padding: 8 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or instructions"
                  rows={3}
                  style={{ width: '100%', padding: 8 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={saveSchedule} style={{ flex: 1, background: '#4CAF50', padding: 12 }}>
                {selectedSchedule ? 'Save Changes' : 'Create Schedule'}
              </button>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, background: '#666', padding: 12 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {showEmployeeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            maxWidth: 600,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: 24
          }}>
            <h3 style={{ marginTop: 0 }}>
              {selectedEmployee ? 'Edit Employee' : 'Add Employee'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Name *</label>
                <input
                  value={employeeForm.name}
                  onChange={e => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                  placeholder="Employee name"
                  style={{ width: '100%', padding: 8 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Role</label>
                <input
                  value={employeeForm.role}
                  onChange={e => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                  placeholder="e.g., Farm Manager, Animal Handler"
                  style={{ width: '100%', padding: 8 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Email</label>
                <input
                  type="email"
                  value={employeeForm.email}
                  onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  placeholder="email@example.com"
                  style={{ width: '100%', padding: 8 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Phone</label>
                <input
                  type="tel"
                  value={employeeForm.phone}
                  onChange={e => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                  placeholder="555-0000"
                  style={{ width: '100%', padding: 8 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Emergency Contact</label>
                  <input
                    value={employeeForm.emergencyContact}
                    onChange={e => setEmployeeForm({ ...employeeForm, emergencyContact: e.target.value })}
                    placeholder="Contact name"
                    style={{ width: '100%', padding: 8 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Emergency Phone</label>
                  <input
                    type="tel"
                    value={employeeForm.emergencyPhone}
                    onChange={e => setEmployeeForm({ ...employeeForm, emergencyPhone: e.target.value })}
                    placeholder="555-0000"
                    style={{ width: '100%', padding: 8 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Address</label>
                <input
                  value={employeeForm.address}
                  onChange={e => setEmployeeForm({ ...employeeForm, address: e.target.value })}
                  placeholder="Street address"
                  style={{ width: '100%', padding: 8 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>City</label>
                  <input
                    value={employeeForm.city}
                    onChange={e => setEmployeeForm({ ...employeeForm, city: e.target.value })}
                    placeholder="City"
                    style={{ width: '100%', padding: 8 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>State</label>
                  <input
                    value={employeeForm.state}
                    onChange={e => setEmployeeForm({ ...employeeForm, state: e.target.value })}
                    placeholder="State"
                    style={{ width: '100%', padding: 8 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>ZIP</label>
                  <input
                    value={employeeForm.zipCode}
                    onChange={e => setEmployeeForm({ ...employeeForm, zipCode: e.target.value })}
                    placeholder="ZIP"
                    style={{ width: '100%', padding: 8 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Date Employed</label>
                  <input
                    type="date"
                    value={employeeForm.dateEmployed}
                    onChange={e => setEmployeeForm({ ...employeeForm, dateEmployed: e.target.value })}
                    style={{ width: '100%', padding: 8 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Date of Birth</label>
                  <input
                    type="date"
                    value={employeeForm.dateOfBirth}
                    onChange={e => setEmployeeForm({ ...employeeForm, dateOfBirth: e.target.value })}
                    style={{ width: '100%', padding: 8 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Hourly Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={employeeForm.hourlyRate}
                    onChange={e => setEmployeeForm({ ...employeeForm, hourlyRate: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: 8 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Weekly Hours</label>
                  <input
                    type="number"
                    value={employeeForm.weeklyHours}
                    onChange={e => setEmployeeForm({ ...employeeForm, weeklyHours: parseInt(e.target.value) || 40 })}
                    style={{ width: '100%', padding: 8 }}
                  />
                </div>
              </div>

              <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, background: '#f9f9f9' }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Leave Balance (Days)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Vacation</label>
                    <input
                      type="number"
                      value={employeeForm.leaveBalance.vacation}
                      onChange={e => setEmployeeForm({ 
                        ...employeeForm, 
                        leaveBalance: { ...employeeForm.leaveBalance, vacation: parseInt(e.target.value) || 0 }
                      })}
                      style={{ width: '100%', padding: 6 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Sick</label>
                    <input
                      type="number"
                      value={employeeForm.leaveBalance.sick}
                      onChange={e => setEmployeeForm({ 
                        ...employeeForm, 
                        leaveBalance: { ...employeeForm.leaveBalance, sick: parseInt(e.target.value) || 0 }
                      })}
                      style={{ width: '100%', padding: 6 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Personal</label>
                    <input
                      type="number"
                      value={employeeForm.leaveBalance.personal}
                      onChange={e => setEmployeeForm({ 
                        ...employeeForm, 
                        leaveBalance: { ...employeeForm.leaveBalance, personal: parseInt(e.target.value) || 0 }
                      })}
                      style={{ width: '100%', padding: 6 }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={employeeForm.active}
                    onChange={e => setEmployeeForm({ ...employeeForm, active: e.target.checked })}
                    style={{ marginRight: 8 }}
                  />
                  <span style={{ fontWeight: 'bold' }}>Active Employee</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={saveEmployee} style={{ flex: 1, background: '#4CAF50', padding: 12 }}>
                {selectedEmployee ? 'Save Changes' : 'Add Employee'}
              </button>
              <button onClick={() => setShowEmployeeModal(false)} style={{ flex: 1, background: '#666', padding: 12 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && selectedEmployee && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            maxWidth: 500,
            width: '100%',
            padding: 24
          }}>
            <h3 style={{ marginTop: 0 }}>
              Request Leave - {selectedEmployee.name}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Leave Type</label>
                <select
                  value={leaveForm.type}
                  onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })}
                  style={{ width: '100%', padding: 8 }}
                >
                  {Object.entries(LEAVE_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Start Date</label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    style={{ width: '100%', padding: 8 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>End Date</label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    style={{ width: '100%', padding: 8 }}
                  />
                </div>
              </div>

              <div style={{ padding: 12, background: '#f0f4ff', borderRadius: 8 }}>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                  Duration: {Math.ceil((new Date(leaveForm.endDate) - new Date(leaveForm.startDate)) / (1000 * 60 * 60 * 24)) + 1} days
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  Available Balance: 
                  {leaveForm.type === 'VACATION' && ` ${selectedEmployee.leaveBalance?.vacation || 0} vacation days`}
                  {leaveForm.type === 'SICK' && ` ${selectedEmployee.leaveBalance?.sick || 0} sick days`}
                  {leaveForm.type === 'PERSONAL' && ` ${selectedEmployee.leaveBalance?.personal || 0} personal days`}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Reason</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Reason for leave request"
                  rows={3}
                  style={{ width: '100%', padding: 8 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={saveLeaveRequest} style={{ flex: 1, background: '#4CAF50', padding: 12 }}>
                Submit Request
              </button>
              <button onClick={() => setShowLeaveModal(false)} style={{ flex: 1, background: '#666', padding: 12 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {showEmployeeDetailsModal && detailsEmployee && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            maxWidth: 800,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: 0
          }}>
            {/* Header */}
            <div style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: 24,
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0' }}>{detailsEmployee.name}</h2>
                  <div style={{ fontSize: 16, opacity: 0.9 }}>{detailsEmployee.role}</div>
                  <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                    Employee ID: {detailsEmployee.id}
                  </div>
                </div>
                <button 
                  onClick={() => setShowEmployeeDetailsModal(false)}
                  style={{ 
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    fontSize: 24,
                    cursor: 'pointer',
                    padding: '4px 12px',
                    borderRadius: 4
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              {/* Personal Information */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginTop: 0, color: '#1976d2', borderBottom: '2px solid #1976d2', paddingBottom: 8 }}>
                  👤 Personal Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Date of Birth</div>
                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>
                      {detailsEmployee.dateOfBirth ? new Date(detailsEmployee.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Email</div>
                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>{detailsEmployee.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Phone</div>
                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>{detailsEmployee.phone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Status</div>
                    <div style={{ 
                      fontSize: 12, 
                      fontWeight: 'bold',
                      padding: '4px 12px',
                      borderRadius: 12,
                      background: detailsEmployee.active ? '#c8e6c9' : '#ffcdd2',
                      display: 'inline-block'
                    }}>
                      {detailsEmployee.active ? 'ACTIVE' : 'INACTIVE'}
                    </div>
                  </div>
                </div>
                {detailsEmployee.address && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Address</div>
                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>
                      {detailsEmployee.address}<br/>
                      {detailsEmployee.city}, {detailsEmployee.state} {detailsEmployee.zipCode}
                    </div>
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              {detailsEmployee.emergencyContact && (
                <div style={{ marginBottom: 24, padding: 16, background: '#fff3e0', borderRadius: 8, border: '1px solid #f57c00' }}>
                  <h3 style={{ marginTop: 0, color: '#d32f2f' }}>
                    🚨 Emergency Contact
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Name</div>
                      <div style={{ fontSize: 14, fontWeight: 'bold' }}>{detailsEmployee.emergencyContact}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Phone</div>
                      <div style={{ fontSize: 14, fontWeight: 'bold' }}>{detailsEmployee.emergencyPhone}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Employment Information */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginTop: 0, color: '#4CAF50', borderBottom: '2px solid #4CAF50', paddingBottom: 8 }}>
                  💼 Employment Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Date Employed</div>
                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>
                      {detailsEmployee.dateEmployed ? new Date(detailsEmployee.dateEmployed).toLocaleDateString() : 'N/A'}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                      ({((new Date() - new Date(detailsEmployee.dateEmployed)) / (1000 * 60 * 60 * 24 * 365)).toFixed(1)} years)
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Position</div>
                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>{detailsEmployee.role}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Hourly Rate</div>
                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>
                      ${(detailsEmployee.hourlyRate || 0).toFixed(2)}/hr
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Weekly Hours</div>
                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>{detailsEmployee.weeklyHours || 40} hours</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Weekly Earnings</div>
                    <div style={{ fontSize: 14, fontWeight: 'bold', color: '#4CAF50' }}>
                      ${((detailsEmployee.hourlyRate || 0) * (detailsEmployee.weeklyHours || 40)).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Annual Salary (Est.)</div>
                    <div style={{ fontSize: 14, fontWeight: 'bold', color: '#4CAF50' }}>
                      ${((detailsEmployee.hourlyRate || 0) * (detailsEmployee.weeklyHours || 40) * 52).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Leave Management */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, color: '#9c27b0', borderBottom: '2px solid #9c27b0', paddingBottom: 8, flex: 1 }}>
                    🏖️ Leave Management
                  </h3>
                  <button 
                    onClick={() => {
                      setShowEmployeeDetailsModal(false)
                      openLeaveModal(detailsEmployee)
                    }}
                    style={{ background: '#9c27b0', fontSize: 12, padding: '6px 12px' }}
                  >
                    ➕ Request Leave
                  </button>
                </div>

                {/* Leave Balance */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr', 
                  gap: 12,
                  marginBottom: 16
                }}>
                  <div style={{ background: '#e8f5e9', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#4CAF50' }}>
                      {detailsEmployee.leaveBalance?.vacation || 0}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>Vacation Days</div>
                  </div>
                  <div style={{ background: '#fff3e0', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f57c00' }}>
                      {detailsEmployee.leaveBalance?.sick || 0}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>Sick Days</div>
                  </div>
                  <div style={{ background: '#f3e5f5', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#9c27b0' }}>
                      {detailsEmployee.leaveBalance?.personal || 0}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>Personal Days</div>
                  </div>
                </div>

                {/* Leave Breakdown by Type */}
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ fontSize: 14, margin: '0 0 12px 0' }}>Leave Usage by Type</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {/* Vacation Days */}
                    <div style={{ border: '1px solid #4CAF50', borderRadius: 8, padding: 12, background: '#e8f5e9' }}>
                      <div style={{ fontSize: 12, fontWeight: 'bold', color: '#4CAF50', marginBottom: 8 }}>
                        🏖️ VACATION DAYS
                      </div>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                        Taken: {(detailsEmployee.leaveHistory || [])
                          .filter(l => l.type === 'VACATION' && l.status === 'APPROVED')
                          .reduce((sum, l) => sum + l.days, 0)} days
                      </div>
                      <div style={{ fontSize: 10, color: '#888' }}>
                        {(detailsEmployee.leaveHistory || [])
                          .filter(l => l.type === 'VACATION' && l.status === 'APPROVED')
                          .slice(0, 3)
                          .map(l => (
                            <div key={l.id} style={{ marginBottom: 2 }}>
                              • {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()} ({l.days}d)
                            </div>
                          ))}
                        {(detailsEmployee.leaveHistory || []).filter(l => l.type === 'VACATION' && l.status === 'APPROVED').length > 3 && (
                          <div>+{(detailsEmployee.leaveHistory || []).filter(l => l.type === 'VACATION' && l.status === 'APPROVED').length - 3} more</div>
                        )}
                        {(detailsEmployee.leaveHistory || []).filter(l => l.type === 'VACATION' && l.status === 'APPROVED').length === 0 && (
                          <div style={{ color: '#999' }}>No vacation days taken</div>
                        )}
                      </div>
                    </div>

                    {/* Sick Days */}
                    <div style={{ border: '1px solid #f57c00', borderRadius: 8, padding: 12, background: '#fff3e0' }}>
                      <div style={{ fontSize: 12, fontWeight: 'bold', color: '#f57c00', marginBottom: 8 }}>
                        🤒 SICK DAYS
                      </div>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                        Taken: {(detailsEmployee.leaveHistory || [])
                          .filter(l => l.type === 'SICK' && l.status === 'APPROVED')
                          .reduce((sum, l) => sum + l.days, 0)} days
                      </div>
                      <div style={{ fontSize: 10, color: '#888' }}>
                        {(detailsEmployee.leaveHistory || [])
                          .filter(l => l.type === 'SICK' && l.status === 'APPROVED')
                          .slice(0, 3)
                          .map(l => (
                            <div key={l.id} style={{ marginBottom: 2 }}>
                              • {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()} ({l.days}d)
                            </div>
                          ))}
                        {(detailsEmployee.leaveHistory || []).filter(l => l.type === 'SICK' && l.status === 'APPROVED').length > 3 && (
                          <div>+{(detailsEmployee.leaveHistory || []).filter(l => l.type === 'SICK' && l.status === 'APPROVED').length - 3} more</div>
                        )}
                        {(detailsEmployee.leaveHistory || []).filter(l => l.type === 'SICK' && l.status === 'APPROVED').length === 0 && (
                          <div style={{ color: '#999' }}>No sick days taken</div>
                        )}
                      </div>
                    </div>

                    {/* Personal Days */}
                    <div style={{ border: '1px solid #9c27b0', borderRadius: 8, padding: 12, background: '#f3e5f5' }}>
                      <div style={{ fontSize: 12, fontWeight: 'bold', color: '#9c27b0', marginBottom: 8 }}>
                        👤 PERSONAL DAYS
                      </div>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                        Taken: {(detailsEmployee.leaveHistory || [])
                          .filter(l => l.type === 'PERSONAL' && l.status === 'APPROVED')
                          .reduce((sum, l) => sum + l.days, 0)} days
                      </div>
                      <div style={{ fontSize: 10, color: '#888' }}>
                        {(detailsEmployee.leaveHistory || [])
                          .filter(l => l.type === 'PERSONAL' && l.status === 'APPROVED')
                          .slice(0, 3)
                          .map(l => (
                            <div key={l.id} style={{ marginBottom: 2 }}>
                              • {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()} ({l.days}d)
                            </div>
                          ))}
                        {(detailsEmployee.leaveHistory || []).filter(l => l.type === 'PERSONAL' && l.status === 'APPROVED').length > 3 && (
                          <div>+{(detailsEmployee.leaveHistory || []).filter(l => l.type === 'PERSONAL' && l.status === 'APPROVED').length - 3} more</div>
                        )}
                        {(detailsEmployee.leaveHistory || []).filter(l => l.type === 'PERSONAL' && l.status === 'APPROVED').length === 0 && (
                          <div style={{ color: '#999' }}>No personal days taken</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leave History */}
                <div>
                  <h4 style={{ fontSize: 14, margin: '0 0 12px 0' }}>Leave History</h4>
                  {(detailsEmployee.leaveHistory || []).length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: 20, 
                      background: '#f5f5f5', 
                      borderRadius: 8,
                      color: '#999'
                    }}>
                      No leave history
                    </div>
                  ) : (
                    <div style={{ maxHeight: 300, overflow: 'auto' }}>
                      {(detailsEmployee.leaveHistory || [])
                        .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
                        .map(leave => (
                          <div 
                            key={leave.id}
                            style={{
                              border: '1px solid #ddd',
                              borderRadius: 8,
                              padding: 12,
                              marginBottom: 8,
                              background: 
                                leave.status === 'APPROVED' ? '#e8f5e9' :
                                leave.status === 'REJECTED' ? '#ffebee' :
                                '#fff9c4'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                                  {LEAVE_TYPES[leave.type]}
                                  <span style={{ 
                                    marginLeft: 8,
                                    fontSize: 11,
                                    padding: '2px 8px',
                                    borderRadius: 12,
                                    background: 
                                      leave.status === 'APPROVED' ? '#4CAF50' :
                                      leave.status === 'REJECTED' ? '#f44336' :
                                      '#FBC02D',
                                    color: 'white'
                                  }}>
                                    {leave.status}
                                  </span>
                                </div>
                                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                                  {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()} ({leave.days} days)
                                </div>
                                {leave.reason && (
                                  <div style={{ fontSize: 12, color: '#666', marginTop: 4, fontStyle: 'italic' }}>
                                    "{leave.reason}"
                                  </div>
                                )}
                                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                                  Requested: {new Date(leave.requestedAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {leave.status === 'PENDING' && (
                                  <>
                                    <button 
                                      onClick={() => approveLeave(detailsEmployee.id, leave.id)}
                                      style={{ background: '#4CAF50', fontSize: 11, padding: '4px 8px' }}
                                    >
                                      ✓ Approve
                                    </button>
                                    <button 
                                      onClick={() => rejectLeave(detailsEmployee.id, leave.id)}
                                      style={{ background: '#f44336', fontSize: 11, padding: '4px 8px' }}
                                    >
                                      ✗ Reject
                                    </button>
                                  </>
                                )}
                                <button 
                                  onClick={() => deleteLeave(detailsEmployee.id, leave.id)}
                                  style={{ background: '#999', fontSize: 11, padding: '4px 8px' }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid #ddd' }}>
                <button 
                  onClick={() => {
                    setShowEmployeeDetailsModal(false)
                    openEmployeeModal(detailsEmployee)
                  }}
                  style={{ flex: 1, background: '#1976d2', padding: 12 }}
                >
                  ✏️ Edit Employee
                </button>
                <button 
                  onClick={() => setShowEmployeeDetailsModal(false)}
                  style={{ flex: 1, background: '#666', padding: 12 }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
