import { useState, useMemo } from 'react';

/**
 * Calendar Component
 * 
 * A visual calendar interface for scheduling and viewing farm events:
 * - Tasks, treatments, breeding schedules, feeding reminders
 * - Month/week/day views with navigation
 * - Color-coded events by type
 * - Click events to view details
 * - Add new events directly from calendar
 * 
 * Features:
 * - Month view grid with day cells
 * - Week view with time slots
 * - Day view with hourly breakdown
 * - Event filtering by category
 * - Today highlighting
 * - Event tooltips on hover
 * - Responsive design for mobile
 */

const Calendar = ({ events = [], onEventClick, onAddEvent, view = 'month' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState(view);
  const [filterCategory, setFilterCategory] = useState('all');
  const [hoveredEvent, setHoveredEvent] = useState(null);

  // Event categories with colors
  const categories = {
    task: { label: 'Tasks', color: '#3b82f6', icon: '📋' },
    treatment: { label: 'Treatments', color: '#ef4444', icon: '💊' },
    breeding: { label: 'Breeding', color: '#8b5cf6', icon: '💕' },
    feeding: { label: 'Feeding', color: '#10b981', icon: '🌾' },
    milking: { label: 'Milking', color: '#f59e0b', icon: '🥛' },
    checkup: { label: 'Checkup', color: '#06b6d4', icon: '🩺' },
    other: { label: 'Other', color: '#6b7280', icon: '📌' }
  };

  // Filter events by category
  const filteredEvents = useMemo(() => {
    if (filterCategory === 'all') return events;
    return events.filter(e => e.category === filterCategory);
  }, [events, filterCategory]);

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add previous month's trailing days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Add next month's leading days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredEvents.filter(e => e.date === dateStr);
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Get week dates
  const getWeekDates = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    
    return week;
  };

  // Month View
  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div>
        {/* Week day headers */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: 1, 
          marginBottom: 1,
          background: '#e5e7eb'
        }}>
          {weekDays.map(day => (
            <div key={day} style={{ 
              padding: '12px 8px', 
              textAlign: 'center', 
              fontWeight: '600', 
              fontSize: '0.85rem',
              background: '#f3f4f6',
              color: '#374151'
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: 1,
          background: '#e5e7eb'
        }}>
          {days.map((day, idx) => {
            const dayEvents = getEventsForDate(day.date);
            const isTodayDate = isToday(day.date);

            return (
              <div
                key={idx}
                style={{
                  minHeight: 100,
                  padding: 8,
                  background: day.isCurrentMonth ? 'white' : '#f9fafb',
                  cursor: 'pointer',
                  position: 'relative',
                  border: isTodayDate ? '2px solid #3b82f6' : 'none'
                }}
                onClick={() => onAddEvent && onAddEvent(day.date)}
              >
                <div style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: isTodayDate ? '700' : day.isCurrentMonth ? '500' : '400',
                  color: isTodayDate ? '#3b82f6' : day.isCurrentMonth ? '#1f2937' : '#9ca3af',
                  marginBottom: 4
                }}>
                  {day.date.getDate()}
                </div>

                {/* Event indicators */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <div
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick && onEventClick(event);
                      }}
                      onMouseEnter={() => setHoveredEvent(event)}
                      onMouseLeave={() => setHoveredEvent(null)}
                      style={{
                        padding: '2px 4px',
                        fontSize: '0.7rem',
                        borderRadius: 3,
                        background: categories[event.category]?.color || '#6b7280',
                        color: 'white',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer'
                      }}
                    >
                      {categories[event.category]?.icon} {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', textAlign: 'center' }}>
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Week View
  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', gap: 1, marginBottom: 1, background: '#e5e7eb' }}>
          <div style={{ background: '#f3f4f6' }}></div>
          {weekDates.map((date, i) => {
            const isTodayDate = isToday(date);
            return (
              <div key={i} style={{ 
                padding: 12, 
                textAlign: 'center', 
                background: isTodayDate ? '#dbeafe' : '#f3f4f6',
                fontWeight: isTodayDate ? '700' : '600',
                color: isTodayDate ? '#3b82f6' : '#374151'
              }}>
                <div style={{ fontSize: '0.75rem' }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}
                </div>
                <div style={{ fontSize: '1.2rem', marginTop: 4 }}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div style={{ maxHeight: 600, overflowY: 'auto' }}>
          {hours.map(hour => (
            <div key={hour} style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', gap: 1, background: '#e5e7eb', marginBottom: 1 }}>
              <div style={{ padding: 8, background: '#f3f4f6', fontSize: '0.75rem', textAlign: 'right', color: '#6b7280' }}>
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDates.map((date, i) => {
                const dateStr = date.toISOString().split('T')[0];
                const hourEvents = filteredEvents.filter(e => 
                  e.date === dateStr && e.time && parseInt(e.time.split(':')[0]) === hour
                );
                
                return (
                  <div key={i} style={{ 
                    minHeight: 60, 
                    padding: 4, 
                    background: 'white',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => onAddEvent && onAddEvent(date, `${hour.toString().padStart(2, '0')}:00`)}
                  >
                    {hourEvents.map((event, j) => (
                      <div
                        key={j}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick && onEventClick(event);
                        }}
                        style={{
                          padding: 4,
                          fontSize: '0.75rem',
                          borderRadius: 3,
                          background: categories[event.category]?.color || '#6b7280',
                          color: 'white',
                          marginBottom: 2,
                          cursor: 'pointer'
                        }}
                      >
                        {categories[event.category]?.icon} {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Day View
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div>
        <div style={{ padding: 16, background: '#f3f4f6', marginBottom: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
            {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
          <div style={{ fontSize: '1.1rem', color: '#6b7280', marginTop: 4 }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{ marginTop: 12, fontSize: '0.9rem', color: '#374151' }}>
            {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''} scheduled
          </div>
        </div>

        <div style={{ maxHeight: 600, overflowY: 'auto' }}>
          {hours.map(hour => {
            const hourEvents = filteredEvents.filter(e => 
              e.date === dateStr && e.time && parseInt(e.time.split(':')[0]) === hour
            );

            return (
              <div key={hour} style={{ display: 'flex', gap: 12, marginBottom: 1, background: '#e5e7eb', minHeight: 60 }}>
                <div style={{ width: 80, padding: 12, background: '#f3f4f6', fontSize: '0.9rem', textAlign: 'right', color: '#6b7280' }}>
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div style={{ 
                  flex: 1, 
                  padding: 8, 
                  background: 'white',
                  cursor: 'pointer'
                }}
                onClick={() => onAddEvent && onAddEvent(currentDate, `${hour.toString().padStart(2, '0')}:00`)}
                >
                  {hourEvents.map((event, i) => (
                    <div
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick && onEventClick(event);
                      }}
                      style={{
                        padding: 12,
                        marginBottom: 8,
                        borderRadius: 6,
                        background: categories[event.category]?.color || '#6b7280',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: '600', marginBottom: 4 }}>
                        {categories[event.category]?.icon} {event.title}
                      </div>
                      {event.description && (
                        <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                          {event.description}
                        </div>
                      )}
                      {event.time && (
                        <div style={{ fontSize: '0.75rem', marginTop: 4, opacity: 0.8 }}>
                          🕐 {event.time}
                        </div>
                      )}
                      {event.animal && (
                        <div style={{ fontSize: '0.75rem', marginTop: 4, opacity: 0.8 }}>
                          🐄 {event.animal}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Header with navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={selectedView === 'month' ? goToPreviousMonth : selectedView === 'week' ? goToPreviousWeek : () => {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() - 1);
            setCurrentDate(newDate);
          }} style={{ padding: '8px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}>
            ◀
          </button>
          
          <button onClick={goToToday} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: '500' }}>
            Today
          </button>
          
          <button onClick={selectedView === 'month' ? goToNextMonth : selectedView === 'week' ? goToNextWeek : () => {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() + 1);
            setCurrentDate(newDate);
          }} style={{ padding: '8px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}>
            ▶
          </button>

          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
            {selectedView === 'month' ? 
              currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) :
              selectedView === 'week' ?
              `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` :
              currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            }
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {/* View selector */}
          <button 
            onClick={() => setSelectedView('month')}
            style={{ 
              padding: '8px 16px', 
              background: selectedView === 'month' ? '#3b82f6' : '#f3f4f6', 
              color: selectedView === 'month' ? 'white' : '#374151',
              border: 'none', 
              borderRadius: 6, 
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Month
          </button>
          <button 
            onClick={() => setSelectedView('week')}
            style={{ 
              padding: '8px 16px', 
              background: selectedView === 'week' ? '#3b82f6' : '#f3f4f6', 
              color: selectedView === 'week' ? 'white' : '#374151',
              border: 'none', 
              borderRadius: 6, 
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Week
          </button>
          <button 
            onClick={() => setSelectedView('day')}
            style={{ 
              padding: '8px 16px', 
              background: selectedView === 'day' ? '#3b82f6' : '#f3f4f6', 
              color: selectedView === 'day' ? 'white' : '#374151',
              border: 'none', 
              borderRadius: 6, 
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Day
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterCategory('all')}
          style={{
            padding: '6px 12px',
            background: filterCategory === 'all' ? '#1f2937' : '#f3f4f6',
            color: filterCategory === 'all' ? 'white' : '#374151',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '500'
          }}
        >
          All Events
        </button>
        {Object.entries(categories).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setFilterCategory(key)}
            style={{
              padding: '6px 12px',
              background: filterCategory === key ? cat.color : '#f3f4f6',
              color: filterCategory === key ? 'white' : '#374151',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500'
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Calendar view */}
      {selectedView === 'month' && renderMonthView()}
      {selectedView === 'week' && renderWeekView()}
      {selectedView === 'day' && renderDayView()}

      {/* Event tooltip on hover */}
      {hoveredEvent && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: 'white',
          padding: 16,
          borderRadius: 8,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          maxWidth: 300,
          zIndex: 1000
        }}>
          <div style={{ fontWeight: '600', marginBottom: 8, color: categories[hoveredEvent.category]?.color }}>
            {categories[hoveredEvent.category]?.icon} {hoveredEvent.title}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#374151', marginBottom: 4 }}>
            <strong>Event Date:</strong> {hoveredEvent.date}
          </div>
          {hoveredEvent.description && (
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 4 }}>
              <strong>Description:</strong> {hoveredEvent.description}
            </div>
          )}
          {hoveredEvent.time && (
            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
              <strong>Time:</strong> 🕐 {hoveredEvent.time}
            </div>
          )}
          {hoveredEvent.animal && (
            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
              <strong>Animal:</strong> 🐄 {hoveredEvent.animal}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Calendar;
