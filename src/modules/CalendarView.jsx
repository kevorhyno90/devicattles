import { useState, useEffect } from 'react'

export default function CalendarView() {
  const [view, setView] = useState('month') // month, week, day
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [focusType, setFocusType] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [taskCreated, setTaskCreated] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [currentDate])

  const createTaskFromEvent = (event) => {
    const titleMap = {
      'breeding-heat': `Heat check — ${event.animalName || event.title}`,
      'breeding-due':  `Expected birth — ${event.animalName || event.title}`,
      'breeding-event': `Follow-up: breeding — ${event.animalName || event.title}`,
    }
    const categoryMap = {
      'breeding-heat': 'Breeding',
      'breeding-due':  'Breeding',
      'breeding-event': 'Breeding',
    }
    const priorityMap = {
      'breeding-heat': 'Medium',
      'breeding-due':  'High',
      'breeding-event': 'Medium',
    }
    const dueDate = event.date ? event.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
    const newTask = {
      id: 'T-' + Math.floor(1000 + Math.random() * 9000),
      title: titleMap[event.type] || event.title,
      description: event.description || '',
      assignedTo: '',
      due: dueDate,
      priority: priorityMap[event.type] || 'Medium',
      category: categoryMap[event.type] || 'Breeding',
      estimatedHours: 1,
      location: '',
      done: false,
      createdDate: new Date().toISOString().slice(0, 10),
      notes: [],
      sourceEvent: { type: event.type, animalId: event.animalId || '' }
    }
    try {
      const existing = JSON.parse(localStorage.getItem('cattalytics:tasks') || '[]')
      localStorage.setItem('cattalytics:tasks', JSON.stringify([...existing, newTask]))
    } catch { /* storage full or parse error — skip */ }
    setTaskCreated(true)
    setTimeout(() => { setTaskCreated(false); setShowEventModal(false) }, 1800)
  }

  const loadEvents = () => {
    try {
      const allEvents = []
      const safeRead = (key, fallback = []) => {
        try {
          const raw = localStorage.getItem(key)
          if (!raw) return fallback
          const parsed = JSON.parse(raw)
          return Array.isArray(parsed) ? parsed : fallback
        } catch {
          return fallback
        }
      }

      // Load tasks
      const tasks = safeRead('cattalytics:tasks')
      tasks.forEach(task => {
        if (task.dueDate) {
          allEvents.push({
            id: task.id,
            title: task.title,
            date: task.dueDate,
            time: task.dueTime || '09:00',
            type: 'task',
            category: task.category,
            priority: task.priority,
            status: task.status,
            description: task.description,
            color: '#3b82f6'
          })
        }
      })

      // Load schedules
      const schedules = safeRead('cattalytics:schedules')
      schedules.forEach(schedule => {
        if (schedule.date) {
          allEvents.push({
            id: schedule.id,
            title: schedule.title,
            date: schedule.date,
            time: schedule.time || '10:00',
            type: 'schedule',
            category: schedule.category,
            description: schedule.description,
            recurring: schedule.frequency,
            color: '#10b981'
          })
        }
      })

      // Load animal treatments
      const animals = safeRead('cattalytics:animals')
      const animalNameById = {}
      animals.forEach((animal) => {
        animalNameById[animal.id] = animal.name || animal.tag || animal.tagNumber || animal.id
      })

      animals.forEach(animal => {
        if (animal.treatments && animal.treatments.length > 0) {
          animal.treatments.forEach(treatment => {
            if (treatment.nextTreatment) {
              allEvents.push({
                id: `treatment-${animal.id}-${treatment.date}`,
                title: `Treatment: ${animal.name}`,
                date: treatment.nextTreatment,
                time: '08:00',
                type: 'treatment',
                category: 'Animal Care',
                description: `${treatment.treatment} for ${animal.name}`,
                animalName: animal.name,
                color: '#f59e0b'
              })
            }
          })
        }

        // Heat-cycle reminders from last breeding date when present
        if (animal.lastBreeding) {
          const lastBreeding = new Date(animal.lastBreeding)
          if (!Number.isNaN(lastBreeding.getTime())) {
            const returnToHeat = new Date(lastBreeding)
            returnToHeat.setDate(returnToHeat.getDate() + 21)
            allEvents.push({
              id: `heat-${animal.id}-${animal.lastBreeding}`,
              title: `Heat check: ${animal.name || animal.tagNumber || animal.id}`,
              date: returnToHeat.toISOString().slice(0, 10),
              time: '06:30',
              type: 'breeding-heat',
              category: 'Breeding',
              description: `${animal.name || animal.id} estimated return-to-heat date`,
              animalName: animal.name,
              color: '#db2777'
            })
          }
        }

        // Load breeding schedules
        if (animal.breeding && animal.breeding.length > 0) {
          animal.breeding.forEach(breeding => {
            if (breeding.expectedCalvingDate) {
              allEvents.push({
                id: `breeding-${animal.id}-${breeding.breedingDate}`,
                title: `Expected birth: ${animal.name}`,
                date: breeding.expectedCalvingDate,
                type: 'breeding',
                category: 'Breeding',
                description: `${animal.name} expected to give birth`,
                animalName: animal.name,
                color: '#ec4899'
              })
            }
          })
        }
      })

      // Load standalone breeding records from breeding module
      const breedingRecords = safeRead('cattalytics:animal:breeding')
      breedingRecords.forEach(record => {
        const animalLabel = animalNameById[record.animalId] || record.animalId || 'Unknown animal'

        if (record.date) {
          allEvents.push({
            id: `breed-event-${record.id}`,
            title: `${record.event || 'Breeding'}: ${animalLabel}`,
            date: record.date,
            time: '07:30',
            type: 'breeding-event',
            category: 'Breeding',
            description: `${record.method || 'Breeding'} • ${record.status || 'Pending'}`,
            animalName: animalLabel,
            color: '#ec4899'
          })
        }

        if (record.returnToHeat) {
          allEvents.push({
            id: `return-heat-${record.id}`,
            title: `Return to heat: ${animalLabel}`,
            date: record.returnToHeat,
            time: '06:00',
            type: 'breeding-heat',
            category: 'Breeding',
            description: 'Follow-up heat cycle check',
            animalName: animalLabel,
            color: '#be185d'
          })
        }

        if (record.expectedDue) {
          allEvents.push({
            id: `due-date-${record.id}`,
            title: `Expected birth: ${animalLabel}`,
            date: record.expectedDue,
            time: '08:30',
            type: 'breeding-due',
            category: 'Breeding',
            description: `${animalLabel} expected due date`,
            animalName: animalLabel,
            color: '#f97316'
          })
        }
      })

      // Load crop treatments
      const crops = safeRead('cattalytics:crops:v2', safeRead('cattalytics:crops'))
      crops.forEach(crop => {
        if (crop.treatments && crop.treatments.length > 0) {
          crop.treatments.forEach(treatment => {
            if (treatment.nextTreatment) {
              allEvents.push({
                id: `crop-treatment-${crop.id}-${treatment.date}`,
                title: `Crop Treatment: ${crop.cropName}`,
                date: treatment.nextTreatment,
                time: '07:00',
                type: 'crop-treatment',
                category: 'Crop Care',
                description: `${treatment.treatment} for ${crop.cropName}`,
                color: '#8b5cf6'
              })
            }
          })
        }

        // Harvest dates
        if (crop.expectedHarvestDate) {
          allEvents.push({
            id: `harvest-${crop.id}`,
            title: `Harvest: ${crop.cropName}`,
            date: crop.expectedHarvestDate,
            type: 'harvest',
            category: 'Crop Care',
            description: `Expected harvest for ${crop.cropName}`,
            color: '#059669'
          })
        }
      })

      // Load schedules from other modules

      const sorted = allEvents.sort((a, b) => {
        const da = new Date(`${a.date || ''}T${a.time || '00:00'}`)
        const db = new Date(`${b.date || ''}T${b.time || '00:00'}`)
        return da - db
      })
      setEvents(sorted)
    } catch (e) {
      console.error('Failed to load events:', e)
    }
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // Add all days in month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const getWeekDays = (date) => {
    const days = []
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }

    return days
  }

  const getEventsForDate = (date) => {
    if (!date) return []
    const dateStr = date.toISOString().slice(0, 10)
    return events.filter(event => {
      if (event.date !== dateStr) return false
      if (focusType === 'all') return true
      if (focusType === 'breeding') return (event.category || '').toLowerCase() === 'breeding'
      return event.type === focusType
    })
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction * 7))
    setCurrentDate(newDate)
  }

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + direction)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleEventClick = (event) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate)
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-primary)' }}>
        {weekDays.map(day => (
          <div key={day} style={{ background: 'var(--bg-tertiary)', padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>
            {day}
          </div>
        ))}
        {days.map((day, idx) => {
          const dayEvents = day ? getEventsForDate(day) : []
          const isToday = day && day.toDateString() === new Date().toDateString()

          return (
            <div
              key={idx}
              style={{
                background: day ? '#fff' : '#f9fafb',
                minHeight: '120px',
                padding: '8px',
                position: 'relative',
                border: isToday ? '2px solid #3b82f6' : 'none'
              }}
            >
              {day && (
                <>
                  <div style={{ fontWeight: isToday ? '700' : '600', marginBottom: '4px', color: isToday ? '#3b82f6' : '#374151' }}>
                    {day.getDate()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        style={{
                          background: event.color,
                          color: 'white',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={event.title}
                      >
                        {event.time} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderWeekView = () => {
    const days = getWeekDays(currentDate)
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div style={{ display: 'flex', gap: '1px', background: 'var(--border-primary)', overflowX: 'auto' }}>
        <div style={{ minWidth: '60px', background: 'var(--bg-tertiary)' }}>
          <div style={{ height: '60px', borderBottom: '1px solid #e5e7eb' }}></div>
          {hours.map(hour => (
            <div key={hour} style={{ height: '60px', padding: '4px', fontSize: '12px', borderBottom: '1px solid #e5e7eb' }}>
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>
        {days.map(day => {
          const dayEvents = getEventsForDate(day)
          const isToday = day.toDateString() === new Date().toDateString()

          return (
            <div key={day.toISOString()} style={{ flex: 1, minWidth: '120px', background: 'var(--bg-elevated)' }}>
              <div style={{
                height: '60px',
                padding: '8px',
                borderBottom: '1px solid #e5e7eb',
                textAlign: 'center',
                background: isToday ? '#dbeafe' : '#f3f4f6',
                fontWeight: isToday ? '700' : '600'
              }}>
                <div>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getDay()]}</div>
                <div style={{ fontSize: '20px', marginTop: '4px' }}>{day.getDate()}</div>
              </div>
              <div style={{ position: 'relative' }}>
                {hours.map(hour => (
                  <div key={hour} style={{ height: '60px', borderBottom: '1px solid #f3f4f6' }}></div>
                ))}
                {dayEvents.map(event => {
                  const [eventHour] = event.time.split(':').map(Number)
                  return (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      style={{
                        position: 'absolute',
                        top: `${eventHour * 60}px`,
                        left: '4px',
                        right: '4px',
                        background: event.color,
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        zIndex: 1
                      }}
                    >
                      <div style={{ fontWeight: '600' }}>{event.time}</div>
                      <div style={{ fontSize: '11px' }}>{event.title}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayEvents = getEventsForDate(currentDate)

    return (
      <div style={{ display: 'flex', gap: '1px', background: 'var(--border-primary)' }}>
        <div style={{ minWidth: '80px', background: 'var(--bg-tertiary)' }}>
          {hours.map(hour => (
            <div key={hour} style={{ height: '80px', padding: '8px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>
        <div style={{ flex: 1, background: 'var(--bg-elevated)', position: 'relative' }}>
          {hours.map(hour => (
            <div key={hour} style={{ height: '80px', borderBottom: '1px solid #f3f4f6' }}></div>
          ))}
          {dayEvents.map(event => {
            const [eventHour, eventMinute] = event.time.split(':').map(Number)
            const topPosition = eventHour * 80 + (eventMinute / 60) * 80
            return (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
                style={{
                  position: 'absolute',
                  top: `${topPosition}px`,
                  left: '8px',
                  right: '8px',
                  background: event.color,
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  zIndex: 1,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{event.time} - {event.title}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>{event.category}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '700' }}>📅 Farm Calendar</h2>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              if (view === 'month') navigateMonth(-1)
              else if (view === 'week') navigateWeek(-1)
              else navigateDay(-1)
            }}
            style={{ padding: '8px 16px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            ← Previous
          </button>
          <button
            onClick={goToToday}
            style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Today
          </button>
          <button
            onClick={() => {
              if (view === 'month') navigateMonth(1)
              else if (view === 'week') navigateWeek(1)
              else navigateDay(1)
            }}
            style={{ padding: '8px 16px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Next →
          </button>
        </div>

        <div style={{ fontSize: '18px', fontWeight: '600' }}>
          {view === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          {view === 'week' && `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
          {view === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>

        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={() => setView('month')}
            style={{
              padding: '8px 16px',
              background: view === 'month' ? '#3b82f6' : '#e5e7eb',
              color: view === 'month' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Month
          </button>
          <button
            onClick={() => setView('week')}
            style={{
              padding: '8px 16px',
              background: view === 'week' ? '#3b82f6' : '#e5e7eb',
              color: view === 'week' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Week
          </button>
          <button
            onClick={() => setView('day')}
            style={{
              padding: '8px 16px',
              background: view === 'day' ? '#3b82f6' : '#e5e7eb',
              color: view === 'day' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Day
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Focus</label>
          <select
            value={focusType}
            onChange={(e) => setFocusType(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db' }}
          >
            <option value="all">All Events</option>
            <option value="breeding">Breeding Only</option>
            <option value="breeding-heat">Heat Checks</option>
            <option value="breeding-due">Expected Births</option>
            <option value="task">Tasks</option>
            <option value="treatment">Treatments</option>
            <option value="harvest">Harvest</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: '#3b82f6', borderRadius: '4px' }}></div>
          <span style={{ fontSize: '14px' }}>Tasks</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: '#10b981', borderRadius: '4px' }}></div>
          <span style={{ fontSize: '14px' }}>Schedules</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: '#f59e0b', borderRadius: '4px' }}></div>
          <span style={{ fontSize: '14px' }}>Treatments</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: '#ec4899', borderRadius: '4px' }}></div>
          <span style={{ fontSize: '14px' }}>Breeding</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: '#8b5cf6', borderRadius: '4px' }}></div>
          <span style={{ fontSize: '14px' }}>Pet Care</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: '#059669', borderRadius: '4px' }}></div>
          <span style={{ fontSize: '14px' }}>Harvest</span>
        </div>
      </div>

      {/* Calendar View */}
      <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowEventModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-elevated)',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>{selectedEvent.title}</h3>
              <button
                onClick={() => setShowEventModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', background: selectedEvent.color, borderRadius: '4px' }}></div>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{selectedEvent.category || selectedEvent.type}</span>
              </div>

              {selectedEvent.date && (
                <div>
                  <strong>Date:</strong> {new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              )}

              {selectedEvent.time && (
                <div>
                  <strong>Time:</strong> {selectedEvent.time}
                </div>
              )}

              {selectedEvent.description && (
                <div>
                  <strong>Description:</strong> {selectedEvent.description}
                </div>
              )}

              {selectedEvent.priority && (
                <div>
                  <strong>Priority:</strong>{' '}
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: selectedEvent.priority === 'HIGH' ? '#fee2e2' : selectedEvent.priority === 'MEDIUM' ? '#fef3c7' : '#dbeafe',
                    color: selectedEvent.priority === 'HIGH' ? '#991b1b' : selectedEvent.priority === 'MEDIUM' ? '#92400e' : '#1e40af'
                  }}>
                    {selectedEvent.priority}
                  </span>
                </div>
              )}

              {selectedEvent.status && (
                <div>
                  <strong>Status:</strong>{' '}
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: selectedEvent.status === 'completed' ? '#d1fae5' : '#fef3c7',
                    color: selectedEvent.status === 'completed' ? '#065f46' : '#92400e'
                  }}>
                    {selectedEvent.status}
                  </span>
                </div>
              )}

              {selectedEvent.recurring && (
                <div>
                  <strong>Recurring:</strong> {selectedEvent.recurring}
                </div>
              )}

              {selectedEvent.animalName && (
                <div>
                  <strong>Animal:</strong> {selectedEvent.animalName}
                </div>
              )}

              {selectedEvent.petName && (
                <div>
                  <strong>Pet:</strong> {selectedEvent.petName}
                </div>
              )}
            </div>

            {['breeding-heat', 'breeding-due', 'breeding-event'].includes(selectedEvent.type) && (
              <button
                onClick={() => createTaskFromEvent(selectedEvent)}
                disabled={taskCreated}
                style={{
                  marginTop: '20px',
                  width: '100%',
                  padding: '10px',
                  background: taskCreated ? '#16a34a' : '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: taskCreated ? 'default' : 'pointer',
                  fontWeight: '600'
                }}
              >
                {taskCreated ? '✓ Task created!' : '📝 Create Task'}
              </button>
            )}

            <button
              onClick={() => setShowEventModal(false)}
              style={{
                marginTop: '8px',
                width: '100%',
                padding: '10px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
