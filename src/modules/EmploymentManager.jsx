import React, { useMemo, useState, useEffect } from 'react'

const EMPLOYEE_KEY = 'cattalytics:employment:employees'
const OFF_KEY = 'cattalytics:employment:off'
const LEAVE_KEY = 'cattalytics:employment:leaves'
const ATTENDANCE_KEY = 'cattalytics:employment:attendance'

const TABS = {
  registry: 'registry',
  off: 'off',
  leaves: 'leaves',
  attendance: 'attendance',
  analytics: 'analytics'
}

const EMPTY_EMPLOYEE = {
  employeeId: '',
  fullName: '',
  role: '',
  department: '',
  employmentType: 'full-time',
  status: 'active',
  startDate: '',
  endDate: '',
  phone: '',
  email: '',
  nationalId: '',
  supervisor: '',
  payRate: '',
  payFrequency: 'monthly',
  emergencyContactName: '',
  emergencyContactPhone: '',
  address: '',
  notes: ''
}

const EMPTY_OFF = {
  employeeId: '',
  offDate: '',
  offType: 'weekly-off',
  paid: 'yes',
  approvedBy: '',
  reason: '',
  notes: ''
}

const EMPTY_LEAVE = {
  employeeId: '',
  leaveType: 'annual',
  startDate: '',
  endDate: '',
  reason: '',
  status: 'pending',
  approvedBy: '',
  notes: ''
}

const EMPTY_ATTENDANCE = {
  employeeId: '',
  date: '',
  shift: 'day',
  status: 'present',
  hoursWorked: '',
  overtimeHours: '',
  notes: ''
}

const OFF_TYPES = ['weekly-off', 'rest-day', 'public-holiday', 'comp-off', 'special-off']
const LEAVE_TYPES = ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'compassionate', 'study', 'other']
const LEAVE_STATUS = ['pending', 'approved', 'rejected', 'cancelled']
const ATTENDANCE_STATUS = ['present', 'absent', 'off', 'sick', 'holiday', 'overtime']

const safeParse = (raw, fallback = []) => {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

const uid = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`

const formatDate = (value) => {
  if (!value) return '-'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleDateString()
}

const calcDaysInclusive = (start, end) => {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return 0
  const ms = e.setHours(12, 0, 0, 0) - s.setHours(12, 0, 0, 0)
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1
}

const csvEscape = (value) => {
  const s = String(value ?? '')
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

const toCsv = (rows) => {
  if (!rows || !rows.length) return 'No data\n'
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row || {}).forEach((k) => set.add(k))
      return set
    }, new Set())
  )
  const lines = [headers.join(',')]
  rows.forEach((row) => {
    lines.push(headers.map((h) => csvEscape(row?.[h])).join(','))
  })
  return `${lines.join('\n')}\n`
}

const downloadText = (name, content, type = 'text/plain') => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const getEmployeeName = (employees, id) => {
  const found = employees.find((item) => item.employeeId === id)
  return found ? found.fullName : id || 'Unassigned'
}

export default function EmploymentManager({ initialTab = TABS.registry, recordSource = null }) {
  const [activeTab, setActiveTab] = useState(TABS.registry)

  const [employees, setEmployees] = useState([])
  const [offEntries, setOffEntries] = useState([])
  const [leaveEntries, setLeaveEntries] = useState([])
  const [attendanceEntries, setAttendanceEntries] = useState([])

  const [employeeForm, setEmployeeForm] = useState(EMPTY_EMPLOYEE)
  const [offForm, setOffForm] = useState(EMPTY_OFF)
  const [leaveForm, setLeaveForm] = useState(EMPTY_LEAVE)
  const [attendanceForm, setAttendanceForm] = useState(EMPTY_ATTENDANCE)

  const [editingEmployeeId, setEditingEmployeeId] = useState(null)
  const [editingOffId, setEditingOffId] = useState(null)
  const [editingLeaveId, setEditingLeaveId] = useState(null)
  const [editingAttendanceId, setEditingAttendanceId] = useState(null)

  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const allowed = new Set(Object.values(TABS))
    if (allowed.has(initialTab)) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  useEffect(() => {
    setEmployees(safeParse(localStorage.getItem(EMPLOYEE_KEY), []))
    setOffEntries(safeParse(localStorage.getItem(OFF_KEY), []))
    setLeaveEntries(safeParse(localStorage.getItem(LEAVE_KEY), []))
    setAttendanceEntries(safeParse(localStorage.getItem(ATTENDANCE_KEY), []))
  }, [])

  useEffect(() => {
    localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(employees))
  }, [employees])

  useEffect(() => {
    localStorage.setItem(OFF_KEY, JSON.stringify(offEntries))
  }, [offEntries])

  useEffect(() => {
    localStorage.setItem(LEAVE_KEY, JSON.stringify(leaveEntries))
  }, [leaveEntries])

  useEffect(() => {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendanceEntries))
  }, [attendanceEntries])

  const departments = useMemo(() => {
    return Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).sort()
  }, [employees])

  const nextEmployeeCode = useMemo(() => {
    let max = 0
    employees.forEach((item) => {
      const match = String(item.employeeId || '').match(/EMP-(\d+)/)
      if (match) {
        const n = Number(match[1])
        if (n > max) max = n
      }
    })
    return `EMP-${String(max + 1).padStart(4, '0')}`
  }, [employees])

  useEffect(() => {
    if (!editingEmployeeId && !employeeForm.employeeId) {
      setEmployeeForm((prev) => ({ ...prev, employeeId: nextEmployeeCode }))
    }
  }, [nextEmployeeCode, editingEmployeeId, employeeForm.employeeId])

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase()
    return employees.filter((emp) => {
      const matchSearch = !q || [emp.employeeId, emp.fullName, emp.role, emp.department, emp.phone, emp.email]
        .join(' ')
        .toLowerCase()
        .includes(q)
      const matchDept = departmentFilter === 'all' || emp.department === departmentFilter
      const matchStatus = statusFilter === 'all' || emp.status === statusFilter
      return matchSearch && matchDept && matchStatus
    })
  }, [employees, search, departmentFilter, statusFilter])

  const activeEmployees = employees.filter((e) => e.status === 'active').length
  const onLeaveEmployees = employees.filter((e) => e.status === 'on-leave').length
  const pendingLeaves = leaveEntries.filter((l) => l.status === 'pending').length

  const attendanceLast30 = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    return attendanceEntries.filter((entry) => {
      const d = new Date(entry.date)
      return !Number.isNaN(d.getTime()) && d >= cutoff
    })
  }, [attendanceEntries])

  const presentCount = attendanceLast30.filter((a) => a.status === 'present').length
  const absentCount = attendanceLast30.filter((a) => a.status === 'absent').length
  const offCount = attendanceLast30.filter((a) => a.status === 'off').length
  const overtimeHours = attendanceLast30.reduce((sum, item) => sum + Number(item.overtimeHours || 0), 0)
  const attendanceTracked = presentCount + absentCount + offCount
  const attendanceRate = attendanceTracked > 0 ? Math.round((presentCount / attendanceTracked) * 100) : 0

  const leaveDaysByType = useMemo(() => {
    const summary = {}
    leaveEntries
      .filter((leave) => leave.status === 'approved')
      .forEach((leave) => {
        const days = Number(leave.days || 0)
        summary[leave.leaveType] = (summary[leave.leaveType] || 0) + days
      })
    return summary
  }, [leaveEntries])

  const exportAllData = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      employees,
      offEntries,
      leaveEntries,
      attendanceEntries
    }
    downloadText(`employment-manager-${Date.now()}.json`, JSON.stringify(payload, null, 2), 'application/json')
  }

  const resetEmployeeForm = () => {
    setEmployeeForm({ ...EMPTY_EMPLOYEE, employeeId: nextEmployeeCode })
    setEditingEmployeeId(null)
  }

  const submitEmployee = (e) => {
    e.preventDefault()
    if (!employeeForm.employeeId.trim() || !employeeForm.fullName.trim()) {
      window.alert('Employee ID and full name are required.')
      return
    }

    const payload = {
      ...employeeForm,
      employeeId: employeeForm.employeeId.trim(),
      fullName: employeeForm.fullName.trim(),
      role: employeeForm.role.trim(),
      department: employeeForm.department.trim(),
      phone: employeeForm.phone.trim(),
      email: employeeForm.email.trim(),
      nationalId: employeeForm.nationalId.trim(),
      supervisor: employeeForm.supervisor.trim(),
      emergencyContactName: employeeForm.emergencyContactName.trim(),
      emergencyContactPhone: employeeForm.emergencyContactPhone.trim(),
      address: employeeForm.address.trim(),
      notes: employeeForm.notes.trim(),
      updatedAt: new Date().toISOString()
    }

    if (!editingEmployeeId) {
      if (employees.some((emp) => emp.employeeId === payload.employeeId)) {
        window.alert('Employee ID already exists. Use a unique ID.')
        return
      }
      setEmployees((prev) => [{ ...payload, id: uid('emp'), createdAt: new Date().toISOString() }, ...prev])
    } else {
      setEmployees((prev) => prev.map((item) => (item.id === editingEmployeeId ? { ...item, ...payload } : item)))
    }

    resetEmployeeForm()
  }

  const editEmployee = (item) => {
    setEditingEmployeeId(item.id)
    setEmployeeForm({ ...EMPTY_EMPLOYEE, ...item })
    setActiveTab(TABS.registry)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteEmployee = (id) => {
    const item = employees.find((emp) => emp.id === id)
    if (!item) return
    if (!window.confirm(`Remove ${item.fullName} (${item.employeeId}) from registry?`)) return
    setEmployees((prev) => prev.filter((emp) => emp.id !== id))

    setOffEntries((prev) => prev.filter((entry) => entry.employeeId !== item.employeeId))
    setLeaveEntries((prev) => prev.filter((entry) => entry.employeeId !== item.employeeId))
    setAttendanceEntries((prev) => prev.filter((entry) => entry.employeeId !== item.employeeId))
  }

  const resetOffForm = () => {
    setOffForm(EMPTY_OFF)
    setEditingOffId(null)
  }

  const submitOff = (e) => {
    e.preventDefault()
    if (!offForm.employeeId || !offForm.offDate) {
      window.alert('Employee and off date are required.')
      return
    }
    const payload = {
      ...offForm,
      approvedBy: offForm.approvedBy.trim(),
      reason: offForm.reason.trim(),
      notes: offForm.notes.trim(),
      updatedAt: new Date().toISOString()
    }

    if (!editingOffId) {
      setOffEntries((prev) => [{ ...payload, id: uid('off'), createdAt: new Date().toISOString() }, ...prev])
    } else {
      setOffEntries((prev) => prev.map((entry) => (entry.id === editingOffId ? { ...entry, ...payload } : entry)))
    }
    resetOffForm()
  }

  const editOff = (entry) => {
    setEditingOffId(entry.id)
    setOffForm({ ...EMPTY_OFF, ...entry })
    setActiveTab(TABS.off)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteOff = (id) => {
    setOffEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  const resetLeaveForm = () => {
    setLeaveForm(EMPTY_LEAVE)
    setEditingLeaveId(null)
  }

  const submitLeave = (e) => {
    e.preventDefault()
    if (!leaveForm.employeeId || !leaveForm.startDate || !leaveForm.endDate) {
      window.alert('Employee and leave period are required.')
      return
    }
    const days = calcDaysInclusive(leaveForm.startDate, leaveForm.endDate)
    if (days <= 0) {
      window.alert('Leave end date must be on or after start date.')
      return
    }

    const payload = {
      ...leaveForm,
      days,
      reason: leaveForm.reason.trim(),
      approvedBy: leaveForm.approvedBy.trim(),
      notes: leaveForm.notes.trim(),
      updatedAt: new Date().toISOString()
    }

    if (!editingLeaveId) {
      setLeaveEntries((prev) => [{ ...payload, id: uid('leave'), createdAt: new Date().toISOString() }, ...prev])
    } else {
      setLeaveEntries((prev) => prev.map((entry) => (entry.id === editingLeaveId ? { ...entry, ...payload } : entry)))
    }

    resetLeaveForm()
  }

  const editLeave = (entry) => {
    setEditingLeaveId(entry.id)
    setLeaveForm({ ...EMPTY_LEAVE, ...entry })
    setActiveTab(TABS.leaves)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateLeaveStatus = (id, status) => {
    setLeaveEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, status, updatedAt: new Date().toISOString() } : entry)))
  }

  const deleteLeave = (id) => {
    setLeaveEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  const resetAttendanceForm = () => {
    setAttendanceForm(EMPTY_ATTENDANCE)
    setEditingAttendanceId(null)
  }

  const submitAttendance = (e) => {
    e.preventDefault()
    if (!attendanceForm.employeeId || !attendanceForm.date) {
      window.alert('Employee and date are required.')
      return
    }

    const payload = {
      ...attendanceForm,
      hoursWorked: Number(attendanceForm.hoursWorked || 0),
      overtimeHours: Number(attendanceForm.overtimeHours || 0),
      notes: attendanceForm.notes.trim(),
      updatedAt: new Date().toISOString()
    }

    if (!editingAttendanceId) {
      setAttendanceEntries((prev) => [{ ...payload, id: uid('att'), createdAt: new Date().toISOString() }, ...prev])
    } else {
      setAttendanceEntries((prev) => prev.map((entry) => (entry.id === editingAttendanceId ? { ...entry, ...payload } : entry)))
    }

    resetAttendanceForm()
  }

  const editAttendance = (entry) => {
    setEditingAttendanceId(entry.id)
    setAttendanceForm({ ...EMPTY_ATTENDANCE, ...entry })
    setActiveTab(TABS.attendance)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteAttendance = (id) => {
    setAttendanceEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  const overviewCards = [
    { label: 'Total Employees', value: employees.length, color: '#0f172a' },
    { label: 'Active Employees', value: activeEmployees, color: '#065f46' },
    { label: 'On Leave', value: onLeaveEmployees, color: '#1d4ed8' },
    { label: 'Pending Leave Requests', value: pendingLeaves, color: '#92400e' },
    { label: 'Attendance Rate (30d)', value: `${attendanceRate}%`, color: '#374151' }
  ]

  const tabButton = (tab, label) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      style={{
        border: 'none',
        borderRadius: 999,
        padding: '8px 14px',
        fontWeight: 700,
        cursor: 'pointer',
        background: activeTab === tab ? 'var(--action-success)' : 'var(--bg-tertiary)',
        color: activeTab === tab ? 'var(--text-inverse)' : 'var(--text-primary)'
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 16, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 28, color: 'var(--text-primary)' }}>Employee Full Manager</h2>
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Comprehensive employment module for full staff registry, off planning, leave lifecycle, attendance tracking, and workforce analytics.
            </p>
            {recordSource?.domain && recordSource?.item && (
              <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: 700, color: 'var(--action-success)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '999px', display: 'inline-flex', padding: '4px 10px' }}>
                Opened from Record Coverage: {recordSource.domain} / {recordSource.item}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => downloadText(`employment-registry-${Date.now()}.csv`, toCsv(employees), 'text/csv')}
              style={{ border: '1px solid var(--border-primary)', borderRadius: 8, background: 'var(--bg-elevated)', color: 'var(--action-primary)', fontWeight: 700, padding: '8px 12px', cursor: 'pointer' }}
            >
              Export Registry CSV
            </button>
            <button
              onClick={exportAllData}
              style={{ border: 'none', borderRadius: 8, background: 'var(--action-success)', color: 'var(--text-inverse)', fontWeight: 700, padding: '8px 12px', cursor: 'pointer' }}
            >
              Download Full Employment Pack
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          {overviewCards.map((card) => (
            <div key={card.label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', borderRadius: 14, padding: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tabButton(TABS.registry, 'Employee Registry')}
          {tabButton(TABS.off, 'Off Planner')}
          {tabButton(TABS.leaves, 'Leave Management')}
          {tabButton(TABS.attendance, 'Attendance Log')}
          {tabButton(TABS.analytics, 'Analytics')}
        </div>
      </section>

      {activeTab === TABS.registry && (
        <section style={{ display: 'grid', gap: 14 }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
            <h3 style={{ marginTop: 0 }}>{editingEmployeeId ? 'Edit Employee' : 'Register Employee'}</h3>
            <form onSubmit={submitEmployee} style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
                <label style={{ display: 'grid', gap: 4 }}>
                  Employee ID
                  <input value={employeeForm.employeeId} onChange={(e) => setEmployeeForm((p) => ({ ...p, employeeId: e.target.value }))} required />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  Full Name
                  <input value={employeeForm.fullName} onChange={(e) => setEmployeeForm((p) => ({ ...p, fullName: e.target.value }))} required />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  Role
                  <input value={employeeForm.role} onChange={(e) => setEmployeeForm((p) => ({ ...p, role: e.target.value }))} />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  Department
                  <input value={employeeForm.department} onChange={(e) => setEmployeeForm((p) => ({ ...p, department: e.target.value }))} />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  Employment Type
                  <select value={employeeForm.employmentType} onChange={(e) => setEmployeeForm((p) => ({ ...p, employmentType: e.target.value }))}>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="casual">Casual</option>
                    <option value="intern">Intern</option>
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  Status
                  <select value={employeeForm.status} onChange={(e) => setEmployeeForm((p) => ({ ...p, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="on-leave">On leave</option>
                    <option value="inactive">Inactive</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  Start Date
                  <input type="date" value={employeeForm.startDate} onChange={(e) => setEmployeeForm((p) => ({ ...p, startDate: e.target.value }))} />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  End Date
                  <input type="date" value={employeeForm.endDate} onChange={(e) => setEmployeeForm((p) => ({ ...p, endDate: e.target.value }))} />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  Phone
                  <input value={employeeForm.phone} onChange={(e) => setEmployeeForm((p) => ({ ...p, phone: e.target.value }))} />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  Email
                  <input type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm((p) => ({ ...p, email: e.target.value }))} />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  National ID
                  <input value={employeeForm.nationalId} onChange={(e) => setEmployeeForm((p) => ({ ...p, nationalId: e.target.value }))} />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  Supervisor
                  <input value={employeeForm.supervisor} onChange={(e) => setEmployeeForm((p) => ({ ...p, supervisor: e.target.value }))} />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  Pay Rate
                  <input type="number" value={employeeForm.payRate} onChange={(e) => setEmployeeForm((p) => ({ ...p, payRate: e.target.value }))} />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  Pay Frequency
                  <select value={employeeForm.payFrequency} onChange={(e) => setEmployeeForm((p) => ({ ...p, payFrequency: e.target.value }))}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  Emergency Contact Name
                  <input value={employeeForm.emergencyContactName} onChange={(e) => setEmployeeForm((p) => ({ ...p, emergencyContactName: e.target.value }))} />
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  Emergency Contact Phone
                  <input value={employeeForm.emergencyContactPhone} onChange={(e) => setEmployeeForm((p) => ({ ...p, emergencyContactPhone: e.target.value }))} />
                </label>
              </div>

              <label style={{ display: 'grid', gap: 4 }}>
                Address
                <textarea rows={2} value={employeeForm.address} onChange={(e) => setEmployeeForm((p) => ({ ...p, address: e.target.value }))} />
              </label>

              <label style={{ display: 'grid', gap: 4 }}>
                Notes
                <textarea rows={3} value={employeeForm.notes} onChange={(e) => setEmployeeForm((p) => ({ ...p, notes: e.target.value }))} />
              </label>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="submit" style={{ border: 'none', borderRadius: 8, background: '#0f766e', color: '#fff', fontWeight: 700, padding: '9px 14px', cursor: 'pointer' }}>
                  {editingEmployeeId ? 'Update Employee' : 'Add Employee'}
                </button>
                {editingEmployeeId && (
                  <button type="button" onClick={resetEmployeeForm} style={{ border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', color: '#0f172a', fontWeight: 700, padding: '9px 14px', cursor: 'pointer' }}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 12 }}>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID, name, role, email" />
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="on-leave">On leave</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
              <button onClick={() => downloadText(`employment-employees-${Date.now()}.csv`, toCsv(filteredEmployees), 'text/csv')} style={{ border: '1px solid #0ea5e9', borderRadius: 8, background: '#fff', color: '#0369a1', fontWeight: 700, cursor: 'pointer' }}>
                Export Filtered CSV
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Employee</th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Role / Department</th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Contact</th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontWeight: 700 }}>{emp.fullName}</div>
                        <div style={{ color: '#64748b' }}>{emp.employeeId}</div>
                      </td>
                      <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                        <div>{emp.role || '-'}</div>
                        <div style={{ color: '#64748b' }}>{emp.department || '-'}</div>
                      </td>
                      <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{emp.employmentType}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ borderRadius: 999, padding: '3px 8px', background: emp.status === 'active' ? '#dcfce7' : '#e2e8f0', color: emp.status === 'active' ? '#166534' : '#334155', fontWeight: 700 }}>
                          {emp.status}
                        </span>
                      </td>
                      <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                        <div>{emp.phone || '-'}</div>
                        <div style={{ color: '#64748b' }}>{emp.email || '-'}</div>
                      </td>
                      <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button onClick={() => editEmployee(emp)} style={{ border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => deleteEmployee(emp.id)} style={{ border: '1px solid #fecaca', borderRadius: 6, background: '#fff1f2', color: '#9f1239', cursor: 'pointer' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredEmployees.length && (
                    <tr>
                      <td colSpan={6} style={{ padding: 14, textAlign: 'center', color: '#64748b' }}>No employees found for current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {activeTab === TABS.off && (
        <section style={{ display: 'grid', gap: 14 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
            <h3 style={{ marginTop: 0 }}>{editingOffId ? 'Edit Off Entry' : 'Plan Off Day'}</h3>
            <form onSubmit={submitOff} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
              <label style={{ display: 'grid', gap: 4 }}>
                Employee
                <select value={offForm.employeeId} onChange={(e) => setOffForm((p) => ({ ...p, employeeId: e.target.value }))} required>
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.employeeId}>{emp.employeeId} - {emp.fullName}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Off Date
                <input type="date" value={offForm.offDate} onChange={(e) => setOffForm((p) => ({ ...p, offDate: e.target.value }))} required />
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Off Type
                <select value={offForm.offType} onChange={(e) => setOffForm((p) => ({ ...p, offType: e.target.value }))}>
                  {OFF_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Paid Off
                <select value={offForm.paid} onChange={(e) => setOffForm((p) => ({ ...p, paid: e.target.value }))}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Approved By
                <input value={offForm.approvedBy} onChange={(e) => setOffForm((p) => ({ ...p, approvedBy: e.target.value }))} />
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Reason
                <input value={offForm.reason} onChange={(e) => setOffForm((p) => ({ ...p, reason: e.target.value }))} />
              </label>
              <label style={{ display: 'grid', gap: 4, gridColumn: '1 / -1' }}>
                Notes
                <textarea rows={3} value={offForm.notes} onChange={(e) => setOffForm((p) => ({ ...p, notes: e.target.value }))} />
              </label>
              <div style={{ display: 'flex', gap: 8, gridColumn: '1 / -1' }}>
                <button type="submit" style={{ border: 'none', borderRadius: 8, background: '#0f766e', color: '#fff', fontWeight: 700, padding: '9px 14px', cursor: 'pointer' }}>
                  {editingOffId ? 'Update Off Entry' : 'Add Off Entry'}
                </button>
                {editingOffId && (
                  <button type="button" onClick={resetOffForm} style={{ border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', color: '#0f172a', fontWeight: 700, padding: '9px 14px', cursor: 'pointer' }}>
                    Cancel Edit
                  </button>
                )}
                <button type="button" onClick={() => downloadText(`employment-off-${Date.now()}.csv`, toCsv(offEntries), 'text/csv')} style={{ border: '1px solid #0ea5e9', borderRadius: 8, background: '#fff', color: '#0369a1', fontWeight: 700, padding: '9px 14px', cursor: 'pointer' }}>
                  Export Off CSV
                </button>
              </div>
            </form>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Employee</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Off Date</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Paid</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Reason</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{getEmployeeName(employees, entry.employeeId)}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{formatDate(entry.offDate)}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{entry.offType}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{entry.paid}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{entry.reason || '-'}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => editOff(entry)} style={{ border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => deleteOff(entry.id)} style={{ border: '1px solid #fecaca', borderRadius: 6, background: '#fff1f2', color: '#9f1239', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!offEntries.length && (
                  <tr>
                    <td colSpan={6} style={{ padding: 14, textAlign: 'center', color: '#64748b' }}>No off plans recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === TABS.leaves && (
        <section style={{ display: 'grid', gap: 14 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
            <h3 style={{ marginTop: 0 }}>{editingLeaveId ? 'Edit Leave Request' : 'Create Leave Request'}</h3>
            <form onSubmit={submitLeave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
              <label style={{ display: 'grid', gap: 4 }}>
                Employee
                <select value={leaveForm.employeeId} onChange={(e) => setLeaveForm((p) => ({ ...p, employeeId: e.target.value }))} required>
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.employeeId}>{emp.employeeId} - {emp.fullName}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Leave Type
                <select value={leaveForm.leaveType} onChange={(e) => setLeaveForm((p) => ({ ...p, leaveType: e.target.value }))}>
                  {LEAVE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Start Date
                <input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm((p) => ({ ...p, startDate: e.target.value }))} required />
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                End Date
                <input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm((p) => ({ ...p, endDate: e.target.value }))} required />
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Status
                <select value={leaveForm.status} onChange={(e) => setLeaveForm((p) => ({ ...p, status: e.target.value }))}>
                  {LEAVE_STATUS.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Approved By
                <input value={leaveForm.approvedBy} onChange={(e) => setLeaveForm((p) => ({ ...p, approvedBy: e.target.value }))} />
              </label>
              <label style={{ display: 'grid', gap: 4, gridColumn: '1 / -1' }}>
                Reason
                <textarea rows={2} value={leaveForm.reason} onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))} />
              </label>
              <label style={{ display: 'grid', gap: 4, gridColumn: '1 / -1' }}>
                Notes
                <textarea rows={3} value={leaveForm.notes} onChange={(e) => setLeaveForm((p) => ({ ...p, notes: e.target.value }))} />
              </label>
              <div style={{ display: 'flex', gap: 8, gridColumn: '1 / -1' }}>
                <button type="submit" style={{ border: 'none', borderRadius: 8, background: '#0f766e', color: '#fff', fontWeight: 700, padding: '9px 14px', cursor: 'pointer' }}>
                  {editingLeaveId ? 'Update Leave' : 'Add Leave'}
                </button>
                {editingLeaveId && (
                  <button type="button" onClick={resetLeaveForm} style={{ border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', color: '#0f172a', fontWeight: 700, padding: '9px 14px', cursor: 'pointer' }}>
                    Cancel Edit
                  </button>
                )}
                <button type="button" onClick={() => downloadText(`employment-leaves-${Date.now()}.csv`, toCsv(leaveEntries), 'text/csv')} style={{ border: '1px solid #0ea5e9', borderRadius: 8, background: '#fff', color: '#0369a1', fontWeight: 700, padding: '9px 14px', cursor: 'pointer' }}>
                  Export Leave CSV
                </button>
              </div>
            </form>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Employee</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Period</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Days</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{getEmployeeName(employees, entry.employeeId)}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{entry.leaveType}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{formatDate(entry.startDate)} - {formatDate(entry.endDate)}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{entry.days}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ borderRadius: 999, padding: '3px 8px', background: entry.status === 'approved' ? '#dcfce7' : entry.status === 'pending' ? '#fef3c7' : '#e2e8f0', color: '#334155', fontWeight: 700 }}>
                        {entry.status}
                      </span>
                    </td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => editLeave(entry)} style={{ border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => updateLeaveStatus(entry.id, 'approved')} style={{ border: '1px solid #bbf7d0', borderRadius: 6, background: '#f0fdf4', color: '#166534', cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => updateLeaveStatus(entry.id, 'rejected')} style={{ border: '1px solid #fecaca', borderRadius: 6, background: '#fff1f2', color: '#9f1239', cursor: 'pointer' }}>Reject</button>
                        <button onClick={() => deleteLeave(entry.id)} style={{ border: '1px solid #fecaca', borderRadius: 6, background: '#fff1f2', color: '#9f1239', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!leaveEntries.length && (
                  <tr>
                    <td colSpan={6} style={{ padding: 14, textAlign: 'center', color: '#64748b' }}>No leave records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === TABS.attendance && (
        <section style={{ display: 'grid', gap: 14 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
            <h3 style={{ marginTop: 0 }}>{editingAttendanceId ? 'Edit Attendance' : 'Log Attendance'}</h3>
            <form onSubmit={submitAttendance} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
              <label style={{ display: 'grid', gap: 4 }}>
                Employee
                <select value={attendanceForm.employeeId} onChange={(e) => setAttendanceForm((p) => ({ ...p, employeeId: e.target.value }))} required>
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.employeeId}>{emp.employeeId} - {emp.fullName}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Date
                <input type="date" value={attendanceForm.date} onChange={(e) => setAttendanceForm((p) => ({ ...p, date: e.target.value }))} required />
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Shift
                <select value={attendanceForm.shift} onChange={(e) => setAttendanceForm((p) => ({ ...p, shift: e.target.value }))}>
                  <option value="day">Day</option>
                  <option value="night">Night</option>
                  <option value="split">Split</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Status
                <select value={attendanceForm.status} onChange={(e) => setAttendanceForm((p) => ({ ...p, status: e.target.value }))}>
                  {ATTENDANCE_STATUS.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Hours Worked
                <input type="number" step="0.25" value={attendanceForm.hoursWorked} onChange={(e) => setAttendanceForm((p) => ({ ...p, hoursWorked: e.target.value }))} />
              </label>
              <label style={{ display: 'grid', gap: 4 }}>
                Overtime Hours
                <input type="number" step="0.25" value={attendanceForm.overtimeHours} onChange={(e) => setAttendanceForm((p) => ({ ...p, overtimeHours: e.target.value }))} />
              </label>
              <label style={{ display: 'grid', gap: 4, gridColumn: '1 / -1' }}>
                Notes
                <textarea rows={3} value={attendanceForm.notes} onChange={(e) => setAttendanceForm((p) => ({ ...p, notes: e.target.value }))} />
              </label>
              <div style={{ display: 'flex', gap: 8, gridColumn: '1 / -1', flexWrap: 'wrap' }}>
                <button type="submit" style={{ border: 'none', borderRadius: 8, background: '#0f766e', color: '#fff', fontWeight: 700, padding: '9px 14px', cursor: 'pointer' }}>
                  {editingAttendanceId ? 'Update Attendance' : 'Add Attendance'}
                </button>
                {editingAttendanceId && (
                  <button type="button" onClick={resetAttendanceForm} style={{ border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', color: '#0f172a', fontWeight: 700, padding: '9px 14px', cursor: 'pointer' }}>
                    Cancel Edit
                  </button>
                )}
                <button type="button" onClick={() => downloadText(`employment-attendance-${Date.now()}.csv`, toCsv(attendanceEntries), 'text/csv')} style={{ border: '1px solid #0ea5e9', borderRadius: 8, background: '#fff', color: '#0369a1', fontWeight: 700, padding: '9px 14px', cursor: 'pointer' }}>
                  Export Attendance CSV
                </button>
              </div>
            </form>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Employee</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Shift</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Hours</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendanceEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{getEmployeeName(employees, entry.employeeId)}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{formatDate(entry.date)}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{entry.shift}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{entry.status}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{entry.hoursWorked || 0} (OT: {entry.overtimeHours || 0})</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => editAttendance(entry)} style={{ border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => deleteAttendance(entry.id)} style={{ border: '1px solid #fecaca', borderRadius: 6, background: '#fff1f2', color: '#9f1239', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!attendanceEntries.length && (
                  <tr>
                    <td colSpan={6} style={{ padding: 14, textAlign: 'center', color: '#64748b' }}>No attendance records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === TABS.analytics && (
        <section style={{ display: 'grid', gap: 14 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
            <h3 style={{ marginTop: 0 }}>Employment Analytics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Present Records (30d)</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{presentCount}</div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Absent Records (30d)</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{absentCount}</div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Off Records (30d)</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{offCount}</div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Overtime Hours (30d)</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{overtimeHours}</div>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
            <h4 style={{ marginTop: 0 }}>Approved Leave Days by Type</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {Object.keys(leaveDaysByType).map((type) => (
                <div key={type} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{type}</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{leaveDaysByType[type]}</div>
                </div>
              ))}
              {!Object.keys(leaveDaysByType).length && (
                <div style={{ color: '#64748b' }}>No approved leave data yet.</div>
              )}
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
            <h4 style={{ marginTop: 0 }}>Quick Export</h4>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => downloadText(`employment-off-${Date.now()}.csv`, toCsv(offEntries), 'text/csv')} style={{ border: '1px solid #0ea5e9', borderRadius: 8, background: '#fff', color: '#0369a1', fontWeight: 700, padding: '8px 12px', cursor: 'pointer' }}>
                Off Planner CSV
              </button>
              <button onClick={() => downloadText(`employment-leaves-${Date.now()}.csv`, toCsv(leaveEntries), 'text/csv')} style={{ border: '1px solid #0ea5e9', borderRadius: 8, background: '#fff', color: '#0369a1', fontWeight: 700, padding: '8px 12px', cursor: 'pointer' }}>
                Leave CSV
              </button>
              <button onClick={() => downloadText(`employment-attendance-${Date.now()}.csv`, toCsv(attendanceEntries), 'text/csv')} style={{ border: '1px solid #0ea5e9', borderRadius: 8, background: '#fff', color: '#0369a1', fontWeight: 700, padding: '8px 12px', cursor: 'pointer' }}>
                Attendance CSV
              </button>
              <button onClick={exportAllData} style={{ border: 'none', borderRadius: 8, background: '#0f766e', color: '#fff', fontWeight: 700, padding: '8px 12px', cursor: 'pointer' }}>
                Full JSON Pack
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
