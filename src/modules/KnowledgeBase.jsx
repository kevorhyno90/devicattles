import React, { useState, useEffect } from 'react'

/**
 * Knowledge Base Module
 * Educational content library and AI assistance
 * Features: Farming Guides, FAQ, AI Chatbot, Tips & Tricks
 */
export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState('guides')
  const [guides, setGuides] = useState([])
  const [faqItems, setFaqItems] = useState([])
  const [tips, setTips] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [userInput, setUserInput] = useState('')
  const [selectedGuide, setSelectedGuide] = useState(null)
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState(null)

  // Load data from localStorage
  useEffect(() => {
    const savedGuides = localStorage.getItem('cattalytics:knowledge:guides')
    const savedFaq = localStorage.getItem('cattalytics:knowledge:faq')
    const savedTips = localStorage.getItem('cattalytics:knowledge:tips')

    if (savedGuides) setGuides(JSON.parse(savedGuides))
    else setGuides(sampleGuides)

    if (savedFaq) setFaqItems(JSON.parse(savedFaq))
    else setFaqItems(sampleFaq)

    if (savedTips) setTips(JSON.parse(savedTips))
    else setTips(sampleTips)
  }, [])

  // Initialize chatbot
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([{
        id: 1,
        text: 'Hello! I\'m your farming assistant. Ask me anything about livestock care, crop management, financial planning, or using this app!',
        sender: 'bot',
        time: new Date().toLocaleTimeString()
      }])
    }
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSendMessage = () => {
    if (!userInput.trim()) return

    const userMessage = {
      id: chatMessages.length + 1,
      text: userInput,
      sender: 'user',
      time: new Date().toLocaleTimeString()
    }

    setChatMessages([...chatMessages, userMessage])
    const response = generateBotResponse(userInput)

    setTimeout(() => {
      const botMessage = {
        id: chatMessages.length + 2,
        text: response,
        sender: 'bot',
        time: new Date().toLocaleTimeString()
      }
      setChatMessages(prev => [...prev, botMessage])
    }, 500)

    setUserInput('')
  }

  const generateBotResponse = (input) => {
    const lowerInput = input.toLowerCase()

    // Dairy/Livestock keywords
    if (lowerInput.includes('milk') || lowerInput.includes('dairy')) {
      return 'For optimal milk production, ensure your dairy cattle have: 1) Balanced nutrition with adequate protein (16-18% crude protein), 2) Consistent milking schedule (2-3 times daily), 3) Clean, stress-free environment, 4) Regular health checks. The Milk Yield module in this app helps track production trends!'
    }
    if (lowerInput.includes('cattle') || lowerInput.includes('cow')) {
      return 'Cattle management best practices include: proper nutrition, regular health monitoring, maintaining clean housing, vaccination schedules, and breeding management. Use the Animals module to track your herd\'s health, breeding cycles, and individual animal records.'
    }
    if (lowerInput.includes('feeding') || lowerInput.includes('nutrition')) {
      return 'Balanced animal nutrition is crucial! Key points: 1) Provide quality forage (hay/silage), 2) Supplement with concentrates based on production level, 3) Ensure constant access to clean water, 4) Include minerals and vitamins. Check the Animal Feeding module to create custom feeding schedules!'
    }
    if (lowerInput.includes('health') || lowerInput.includes('disease') || lowerInput.includes('sick')) {
      return 'Animal health management tips: 1) Regular veterinary check-ups, 2) Maintain vaccination schedules, 3) Watch for early warning signs (appetite changes, behavior, discharge), 4) Isolate sick animals immediately, 5) Keep detailed health records. Use the Health Tracker module for monitoring!'
    }

    // Crop keywords
    if (lowerInput.includes('crop') || lowerInput.includes('plant')) {
      return 'For successful crop management: 1) Soil testing before planting, 2) Choose appropriate varieties for your climate, 3) Proper irrigation scheduling, 4) Integrated pest management, 5) Timely fertilization. The Crops module helps you track all your field activities!'
    }
    if (lowerInput.includes('irrigation') || lowerInput.includes('water')) {
      return 'Efficient irrigation practices: 1) Water early morning or evening to reduce evaporation, 2) Use drip irrigation for water conservation, 3) Monitor soil moisture, 4) Adjust based on crop stage and weather. Track water usage in the Crop Management module!'
    }
    if (lowerInput.includes('pest') || lowerInput.includes('insect')) {
      return 'Integrated Pest Management (IPM) approach: 1) Regular crop scouting, 2) Identify pests correctly, 3) Use cultural controls first (crop rotation, resistant varieties), 4) Biological controls (beneficial insects), 5) Chemical treatments as last resort. Document in the Crops module!'
    }

    // Finance keywords
    if (lowerInput.includes('profit') || lowerInput.includes('income') || lowerInput.includes('finance')) {
      return 'Financial management tips: 1) Track ALL expenses and income, 2) Separate personal and farm finances, 3) Plan for seasonal cash flow variations, 4) Build emergency fund (3-6 months expenses), 5) Review financial reports monthly. Use the Finance module for comprehensive tracking!'
    }
    if (lowerInput.includes('cost') || lowerInput.includes('expense')) {
      return 'Cost management strategies: 1) Categorize expenses (feed, labor, equipment, etc.), 2) Look for bulk purchase discounts, 3) Maintain equipment to avoid costly repairs, 4) Negotiate with suppliers, 5) Monitor cost per unit produced. The Finance module auto-categorizes expenses!'
    }

    // App usage
    if (lowerInput.includes('how') && (lowerInput.includes('use') || lowerInput.includes('work'))) {
      return 'This app has multiple modules: Animals (track livestock), Crops (field management), Finance (accounting), Tasks (to-do lists), Reports (analytics), Inventory (supplies), and more! Navigate using the bottom menu or Dashboard Quick Actions. Try exploring each module!'
    }
    if (lowerInput.includes('report') || lowerInput.includes('analytics')) {
      return 'The Reports module provides powerful insights: financial summaries, production trends, inventory levels, task completion rates, and custom reports. Access it from the dashboard to visualize your farm data with charts and graphs!'
    }

    // Weather/Season
    if (lowerInput.includes('weather') || lowerInput.includes('season')) {
      return 'Seasonal farming tips: 1) Spring: Plant crops, calving season preparation, 2) Summer: Hay harvesting, heat stress management, 3) Fall: Harvest, prepare winter housing, 4) Winter: Nutrition focus, equipment maintenance. Check the Weather widget on dashboard for forecasts!'
    }

    // Marketing
    if (lowerInput.includes('sell') || lowerInput.includes('market') || lowerInput.includes('price')) {
      return 'Marketing strategies: 1) Research local market prices regularly, 2) Build relationships with buyers, 3) Consider direct-to-consumer sales, 4) Maintain quality standards for premium pricing, 5) Use the Market Prices module to track trends. The Marketplace module connects you with buyers!'
    }

    // Default response
    return 'I can help you with topics like livestock care, dairy management, crop cultivation, financial planning, pest control, animal health, and using this app\'s features. What would you like to know more about?'
  }

  const filteredGuides = guides.filter(guide =>
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFaq = faqItems.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>📚</span> Knowledge Base
      </h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Learn farming best practices, get answers, and chat with our AI assistant
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('guides')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'guides' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
            color: activeTab === 'guides' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📖 Guides
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'faq' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : '#f3f4f6',
            color: activeTab === 'faq' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          ❓ FAQ
        </button>
        <button
          onClick={() => setActiveTab('chatbot')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'chatbot' ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : '#f3f4f6',
            color: activeTab === 'chatbot' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🤖 AI Assistant
        </button>
        <button
          onClick={() => setActiveTab('tips')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'tips' ? 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' : '#f3f4f6',
            color: activeTab === 'tips' ? '#000' : '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          💡 Tips & Tricks
        </button>
      </div>

      {/* Guides Tab */}
      {activeTab === 'guides' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {filteredGuides.map(guide => (
              <div
                key={guide.id}
                onClick={() => setSelectedGuide(guide)}
                style={{
                  background: '#fff',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{
                  width: '100%',
                  height: '160px',
                  background: `linear-gradient(135deg, ${guide.color1} 0%, ${guide.color2} 100%)`,
                  borderRadius: '8px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '64px'
                }}>
                  {guide.icon}
                </div>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: '#dbeafe',
                  color: '#1e40af',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  {guide.category}
                </span>
                <h3 style={{ margin: '8px 0', fontSize: '18px' }}>{guide.title}</h3>
                <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
                  {guide.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                  <span>📖 {guide.readTime}</span>
                  <span>⭐ {guide.rating}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {filteredFaq.map(faq => (
              <div
                key={faq.id}
                style={{
                  background: '#fff',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      background: '#dbeafe',
                      color: '#1e40af',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginBottom: '8px'
                    }}>
                      {faq.category}
                    </span>
                    <h3 style={{ margin: '8px 0', fontSize: '16px', fontWeight: '600' }}>
                      {faq.question}
                    </h3>
                  </div>
                  <span style={{ fontSize: '24px', marginLeft: '12px' }}>
                    {expandedFaq === faq.id ? '−' : '+'}
                  </span>
                </div>
                {expandedFaq === faq.id && (
                  <p style={{ margin: '12px 0 0 0', color: '#666', lineHeight: '1.6' }}>
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chatbot Tab */}
      {activeTab === 'chatbot' && (
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          height: '600px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '2px solid #e5e7eb',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '12px 12px 0 0',
            color: '#fff'
          }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              🤖 AI Farming Assistant
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
              Ask me anything about farming!
            </p>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {chatMessages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: msg.sender === 'user'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : '#f3f4f6',
                  color: msg.sender === 'user' ? '#fff' : '#374151'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>{msg.text}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', opacity: 0.7 }}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            padding: '20px',
            borderTop: '2px solid #e5e7eb',
            display: 'flex',
            gap: '12px'
          }}>
            <input
              type="text"
              placeholder="Ask a question..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              style={{
                flex: 1,
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Tips Tab */}
      {activeTab === 'tips' && (
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {tips.map(tip => (
            <div
              key={tip.id}
              style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>{tip.icon}</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{tip.title}</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
                {tip.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Guide Detail Modal */}
      {selectedGuide && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setSelectedGuide(null)}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '32px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '100%',
              height: '200px',
              background: `linear-gradient(135deg, ${selectedGuide.color1} 0%, ${selectedGuide.color2} 100%)`,
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '96px'
            }}>
              {selectedGuide.icon}
            </div>
            <span style={{
              display: 'inline-block',
              padding: '6px 16px',
              background: '#dbeafe',
              color: '#1e40af',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              {selectedGuide.category}
            </span>
            <h2 style={{ margin: '12px 0', fontSize: '28px' }}>{selectedGuide.title}</h2>
            <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
              {selectedGuide.description}
            </p>
            <div style={{ marginBottom: '24px', display: 'flex', gap: '24px', fontSize: '14px', color: '#666' }}>
              <span>📖 {selectedGuide.readTime}</span>
              <span>⭐ {selectedGuide.rating}/5</span>
            </div>
            <div style={{ lineHeight: '1.8', color: '#374151' }}>
              {selectedGuide.content}
            </div>
            <button
              onClick={() => setSelectedGuide(null)}
              style={{
                marginTop: '24px',
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px'
              }}
            >
              Close
            </button>
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
const sampleGuides = [
  {
    id: 1,
    title: 'Complete Guide to Dairy Cattle Nutrition',
    category: 'Livestock',
    description: 'Learn optimal feeding strategies for maximum milk production and herd health.',
    icon: '🐄',
    color1: '#667eea',
    color2: '#764ba2',
    readTime: '15 min read',
    rating: 4.8,
    content: 'Comprehensive nutrition guide covering TMR formulation, mineral supplementation, forage quality assessment, and seasonal feeding adjustments...'
  },
  {
    id: 2,
    title: 'Mastitis Prevention and Control',
    category: 'Health',
    description: 'Effective strategies to prevent and treat mastitis in dairy herds.',
    icon: '💊',
    color1: '#f093fb',
    color2: '#f5576c',
    readTime: '12 min read',
    rating: 4.9,
    content: 'Detailed guide on identifying mastitis, implementing hygiene protocols, treatment options, and prevention through proper milking procedures...'
  },
  {
    id: 3,
    title: 'Crop Rotation for Sustainable Farming',
    category: 'Crops',
    description: 'Maximize yields while maintaining soil health through strategic crop rotation.',
    icon: '🌾',
    color1: '#4facfe',
    color2: '#00f2fe',
    readTime: '10 min read',
    rating: 4.7,
    content: 'Learn about rotation benefits, planning multi-year sequences, nitrogen fixation, pest management through rotation, and cover cropping strategies...'
  },
  {
    id: 4,
    title: 'Farm Financial Planning Basics',
    category: 'Finance',
    description: 'Essential financial management techniques for profitable farming.',
    icon: '💰',
    color1: '#a8edea',
    color2: '#fed6e3',
    readTime: '18 min read',
    rating: 4.6,
    content: 'Budget creation, cash flow management, enterprise analysis, tax planning, and using financial ratios to measure farm profitability...'
  }
]

const sampleFaq = [
  {
    id: 1,
    category: 'Getting Started',
    question: 'How do I add my first animal to the system?',
    answer: 'Click on "Animals" from the bottom menu or Dashboard, then tap the "+ Add Animal" button. Fill in details like name, type, breed, tag ID, and any other relevant information. You can also add photos and medical history.'
  },
  {
    id: 2,
    category: 'Livestock Care',
    question: 'What\'s the ideal milk production per cow per day?',
    answer: 'Average dairy cows produce 6-7 gallons (22-28 liters) per day, but this varies by breed. Holstein cows can produce 8-10 gallons (30-38 liters), while Jersey cows produce less volume but higher butterfat content. Track production in the Milk Yield module!'
  },
  {
    id: 3,
    category: 'Crop Management',
    question: 'When is the best time to irrigate crops?',
    answer: 'Irrigate early morning (4-10 AM) or evening (4-8 PM) to minimize evaporation. Morning is best as it allows foliage to dry during the day, reducing disease risk. Avoid midday watering when evaporation rates are highest.'
  },
  {
    id: 4,
    category: 'Financial Planning',
    question: 'How do I calculate my farm\'s profit margin?',
    answer: 'Profit Margin = (Total Revenue - Total Expenses) / Total Revenue × 100. Track all income and expenses in the Finance module, then check the Reports section for automatic profit margin calculations and trends over time.'
  },
  {
    id: 5,
    category: 'Health & Disease',
    question: 'What are signs of mastitis in dairy cows?',
    answer: 'Key signs include: swollen, hot, or hard udder quarters; abnormal milk (clots, discoloration, watery); reduced milk production; cow showing pain when milking; fever or depression in severe cases. Treat immediately and consult a vet!'
  },
  {
    id: 6,
    category: 'Equipment',
    question: 'How often should I service farm equipment?',
    answer: 'Follow manufacturer guidelines, but generally: tractors every 200-400 hours or annually; milking equipment daily cleaning + monthly servicing; irrigation systems before each season. Log maintenance in the Equipment module!'
  },
  {
    id: 7,
    category: 'Software Usage',
    question: 'Can I use this app offline?',
    answer: 'Yes! The app works offline and syncs data when connection is restored. Your data is stored locally on your device and automatically backed up to the cloud when online. Perfect for remote farm locations!'
  },
  {
    id: 8,
    category: 'Livestock Care',
    question: 'What\'s the best breeding age for heifers?',
    answer: 'Dairy heifers should be bred at 13-15 months of age when they reach 55-60% of mature body weight. Beef heifers can be bred at 14-16 months. Track breeding cycles in the Animal Breeding module for optimal timing!'
  },
  {
    id: 9,
    category: 'Financial Planning',
    question: 'How much should I budget for feed costs?',
    answer: 'Feed typically represents 50-60% of total livestock production costs. For dairy cows, budget $5-8 per cow per day depending on location and feed prices. Track actual costs in the Finance module to identify trends and opportunities for savings.'
  },
  {
    id: 10,
    category: 'Software Usage',
    question: 'How do I generate reports?',
    answer: 'Navigate to the Reports module from the bottom menu. Choose from pre-built reports (Financial Summary, Production Analysis, Inventory Status) or create custom reports by selecting date ranges, categories, and metrics. Export as PDF or Excel!'
  }
]

const sampleTips = [
  {
    id: 1,
    icon: '💧',
    title: 'Water Quality Matters',
    description: 'Dairy cows need 30-50 gallons of clean water daily. Test water quality quarterly - high bacterial counts or mineral imbalances affect milk production and health.'
  },
  {
    id: 2,
    icon: '🌡️',
    title: 'Heat Stress Management',
    description: 'Provide shade, fans, and sprinklers when temperature exceeds 80°F. Heat stress reduces feed intake and milk production by up to 20%.'
  },
  {
    id: 3,
    icon: '🔍',
    title: 'Daily Health Checks',
    description: 'Spend 10 minutes observing animals daily. Early detection of illness (appetite changes, posture, behavior) saves treatment costs and prevents losses.'
  },
  {
    id: 4,
    icon: '📊',
    title: 'Track Production Costs',
    description: 'Calculate cost per liter of milk or kg of beef quarterly. This metric helps identify inefficiencies and compare with industry benchmarks.'
  },
  {
    id: 5,
    icon: '🌱',
    title: 'Soil Testing Saves Money',
    description: 'Test soil every 2-3 years. Precision fertilization based on soil tests can reduce fertilizer costs by 20-30% while maintaining yields.'
  },
  {
    id: 6,
    icon: '🔧',
    title: 'Preventive Maintenance',
    description: 'Schedule regular equipment maintenance. One hour of prevention saves ten hours of breakdown repairs and prevents costly production delays.'
  },
  {
    id: 7,
    icon: '📱',
    title: 'Use Mobile Features',
    description: 'Take advantage of voice commands, photo logging, and offline mode. Mobile-first farming saves time and improves record accuracy.'
  },
  {
    id: 8,
    icon: '🤝',
    title: 'Join the Community',
    description: 'Connect with other farmers in the Community module. Share experiences, get advice, and stay informed about local disease outbreaks and market trends.'
  }
]
