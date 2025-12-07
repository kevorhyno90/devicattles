import React, { useState, useEffect } from 'react'

/**
 * Community Module
 * Farmer social network and collaboration platform
 * Features: Forums, Disease Alerts, Events, Members Directory
 */
export default function Community() {
  const [activeTab, setActiveTab] = useState('forum')
  const [posts, setPosts] = useState([])
  const [alerts, setAlerts] = useState([])
  const [events, setEvents] = useState([])
  const [members, setMembers] = useState([])
  const [showPostModal, setShowPostModal] = useState(false)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [toast, setToast] = useState(null)

  // Load data from localStorage
  useEffect(() => {
    const savedPosts = localStorage.getItem('cattalytics:community:posts')
    const savedAlerts = localStorage.getItem('cattalytics:community:alerts')
    const savedEvents = localStorage.getItem('cattalytics:community:events')
    const savedMembers = localStorage.getItem('cattalytics:community:members')

    if (savedPosts) setPosts(JSON.parse(savedPosts))
    else setPosts(samplePosts)

    if (savedAlerts) setAlerts(JSON.parse(savedAlerts))
    else setAlerts(sampleAlerts)

    if (savedEvents) setEvents(JSON.parse(savedEvents))
    else setEvents(sampleEvents)

    if (savedMembers) setMembers(JSON.parse(savedMembers))
    else setMembers(sampleMembers)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (posts.length > 0) localStorage.setItem('cattalytics:community:posts', JSON.stringify(posts))
  }, [posts])

  useEffect(() => {
    if (alerts.length > 0) localStorage.setItem('cattalytics:community:alerts', JSON.stringify(alerts))
  }, [alerts])

  useEffect(() => {
    if (events.length > 0) localStorage.setItem('cattalytics:community:events', JSON.stringify(events))
  }, [events])

  useEffect(() => {
    if (members.length > 0) localStorage.setItem('cattalytics:community:members', JSON.stringify(members))
  }, [members])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleLikePost = (postId) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p))
    showToast('Post liked!')
  }

  const handleRSVP = (eventId) => {
    setEvents(events.map(e => e.id === eventId ? { ...e, attendees: e.attendees + 1, rsvp: true } : e))
    showToast('RSVP confirmed!')
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>👥</span> Community
      </h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Connect with fellow farmers, share knowledge, and stay informed
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('forum')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'forum' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
            color: activeTab === 'forum' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          💬 Forum
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'alerts' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : '#f3f4f6',
            color: activeTab === 'alerts' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🚨 Alerts
        </button>
        <button
          onClick={() => setActiveTab('events')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'events' ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : '#f3f4f6',
            color: activeTab === 'events' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📅 Events
        </button>
        <button
          onClick={() => setActiveTab('members')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'members' ? 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' : '#f3f4f6',
            color: activeTab === 'members' ? '#000' : '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          👥 Members
        </button>
      </div>

      {/* Forum Tab */}
      {activeTab === 'forum' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>Community Forum</h2>
            <button
              onClick={() => setShowPostModal(true)}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              + New Post
            </button>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {posts.map(post => (
              <div
                key={post.id}
                style={{
                  background: '#fff',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onClick={() => setSelectedPost(post)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '18px'
                  }}>
                    {post.author[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{post.title}</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                          {post.author} • {post.category} • {post.date}
                        </p>
                      </div>
                      <span style={{
                        padding: '4px 12px',
                        background: post.type === 'Question' ? '#dbeafe' : post.type === 'Alert' ? '#fee2e2' : '#d1fae5',
                        color: post.type === 'Question' ? '#1e40af' : post.type === 'Alert' ? '#991b1b' : '#065f46',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {post.type}
                      </span>
                    </div>
                    <p style={{ margin: '12px 0', color: '#374151' }}>
                      {post.content.substring(0, 150)}...
                    </p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#666' }}>
                      <span onClick={(e) => { e.stopPropagation(); handleLikePost(post.id) }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ❤️ {post.likes} Likes
                      </span>
                      <span>💬 {post.comments} Comments</span>
                      <span>👁️ {post.views} Views</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>Disease & Pest Alerts</h2>
            <button
              onClick={() => setShowAlertModal(true)}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              + Report Alert
            </button>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {alerts.map(alert => (
              <div
                key={alert.id}
                style={{
                  background: alert.severity === 'Critical' ? '#fee2e2' : alert.severity === 'High' ? '#fef3c7' : '#dbeafe',
                  padding: '20px',
                  borderRadius: '12px',
                  border: `2px solid ${alert.severity === 'Critical' ? '#dc2626' : alert.severity === 'High' ? '#f59e0b' : '#3b82f6'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'start', marginBottom: '12px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {alert.severity === 'Critical' ? '🔴' : alert.severity === 'High' ? '🟡' : '🔵'}
                    {alert.title}
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    background: alert.severity === 'Critical' ? '#dc2626' : alert.severity === 'High' ? '#f59e0b' : '#3b82f6',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {alert.severity}
                  </span>
                </div>
                <p style={{ margin: '0 0 12px 0', color: '#374151' }}>{alert.description}</p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#666' }}>
                  <span>📍 {alert.location}</span>
                  <span>📅 {alert.date}</span>
                  <span>👤 {alert.reportedBy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>Community Events</h2>
            <button
              onClick={() => setShowEventModal(true)}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              + Create Event
            </button>
          </div>

          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {events.map(event => (
              <div
                key={event.id}
                style={{
                  background: '#fff',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{
                  width: '100%',
                  height: '140px',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px'
                }}>
                  {event.type === 'Workshop' ? '🎓' : event.type === 'Training' ? '📚' : event.type === 'Fair' ? '🎪' : '🔨'}
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{event.title}</h3>
                <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>{event.description}</p>
                <div style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>
                  <div style={{ marginBottom: '4px' }}>📅 {event.date}</div>
                  <div style={{ marginBottom: '4px' }}>📍 {event.location}</div>
                  <div>👥 {event.attendees} attendees</div>
                </div>
                <button
                  onClick={() => handleRSVP(event.id)}
                  disabled={event.rsvp}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: event.rsvp ? '#9ca3af' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: event.rsvp ? 'not-allowed' : 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {event.rsvp ? '✓ RSVP Confirmed' : 'RSVP'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          <h2 style={{ marginBottom: '16px' }}>Community Members</h2>
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {members.map(member => (
              <div
                key={member.id}
                style={{
                  background: '#fff',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '32px',
                  margin: '0 auto 16px'
                }}>
                  {member.name[0]}
                </div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{member.name}</h3>
                <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>{member.location}</p>
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {member.expertise.map(exp => (
                    <span
                      key={exp}
                      style={{
                        padding: '4px 8px',
                        background: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    >
                      {exp}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                  ⭐ {member.reputation} Reputation Points
                </div>
                <button
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000
        }}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

// Sample Data
const samplePosts = [
  {
    id: 1,
    title: 'Best practices for dairy cattle nutrition in winter',
    author: 'John Farmer',
    category: 'Livestock',
    type: 'Discussion',
    date: '2 hours ago',
    content: 'With winter approaching, I wanted to share some insights on maintaining optimal nutrition for dairy cattle during cold months. Key considerations include increased energy requirements due to cold stress, ensuring adequate fiber intake for heat production...',
    likes: 24,
    comments: 12,
    views: 156
  },
  {
    id: 2,
    title: 'Help: Strange symptoms in my chickens',
    author: 'Sarah Green',
    category: 'Health',
    type: 'Question',
    date: '5 hours ago',
    content: 'I\'ve noticed some of my chickens showing unusual symptoms - reduced appetite, lethargy, and some respiratory issues. Has anyone experienced something similar? I\'m worried it might be infectious...',
    likes: 18,
    comments: 23,
    views: 203
  }
]

const sampleAlerts = [
  {
    id: 1,
    title: 'Foot and Mouth Disease Outbreak',
    severity: 'Critical',
    description: 'Multiple cases of FMD reported in the northern district. All farmers are advised to implement strict biosecurity measures, quarantine new animals, and report any suspicious symptoms immediately.',
    location: 'Northern District, 25km radius',
    date: 'Today, 10:30 AM',
    reportedBy: 'District Veterinary Office'
  }
]

const sampleEvents = [
  {
    id: 1,
    title: 'Modern Dairy Farming Workshop',
    description: 'Learn about latest technologies and best practices in dairy farming. Topics include automated milking systems, nutrition management, and herd health monitoring.',
    type: 'Workshop',
    date: 'Dec 15, 2025 at 9:00 AM',
    location: 'County Agricultural Center',
    attendees: 47,
    rsvp: false
  }
]

const sampleMembers = [
  {
    id: 1,
    name: 'John Farmer',
    location: 'Northern Valley',
    expertise: ['Dairy', 'Cattle', 'Organic'],
    reputation: 1250
  },
  {
    id: 2,
    name: 'Sarah Green',
    location: 'Eastern Plains',
    expertise: ['Poultry', 'Crops', 'Sustainability'],
    reputation: 890
  },
  {
    id: 3,
    name: 'Mike Johnson',
    location: 'Southern Hills',
    expertise: ['Beef Cattle', 'Pasture Management'],
    reputation: 2100
  },
  {
    id: 4,
    name: 'Lisa Martinez',
    location: 'Western Valley',
    expertise: ['Veterinary', 'Animal Health', 'Biosecurity'],
    reputation: 3400
  }
]
