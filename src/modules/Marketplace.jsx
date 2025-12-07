import React, { useState, useEffect } from 'react'

/**
 * Marketplace Module
 * Buy/sell livestock, equipment, feed & supplies
 * Worker hiring board, ratings & reviews
 */

const LISTING_CATEGORIES = ['Livestock', 'Equipment', 'Feed & Supplies', 'Services', 'Jobs', 'Other']
const LIVESTOCK_TYPES = ['Cattle', 'Goats', 'Sheep', 'Pigs', 'Poultry', 'Horses', 'Other']
const EQUIPMENT_TYPES = ['Tractors', 'Harvesters', 'Irrigation', 'Tools', 'Vehicles', 'Other']
const CONDITION_OPTIONS = ['New', 'Like New', 'Good', 'Fair', 'For Parts']
const LISTING_STATUS = ['Active', 'Sold', 'Pending', 'Expired']

const SAMPLE_LISTINGS = [
  {
    id: 'M-001',
    category: 'Livestock',
    type: 'Cattle',
    title: 'Jersey Cow - High Milk Producer',
    description: 'Healthy 4-year-old Jersey cow. Produces 20L/day. Excellent temperament. Up to date on vaccinations.',
    price: 150000,
    currency: 'KES',
    seller: 'John Farm',
    sellerPhone: '+254 700 123456',
    location: 'Kiambu County',
    images: [],
    condition: 'Good',
    status: 'Active',
    views: 45,
    likes: 12,
    postedDate: '2025-12-01',
    expiryDate: '2026-01-01',
    rating: 4.5,
    reviews: 3
  },
  {
    id: 'M-002',
    category: 'Equipment',
    type: 'Tractors',
    title: 'Massey Ferguson 240 Tractor',
    description: '50HP tractor in excellent condition. Recently serviced. Low hours. Perfect for small to medium farms.',
    price: 850000,
    currency: 'KES',
    seller: 'Farm Equipment Ltd',
    sellerPhone: '+254 722 345678',
    location: 'Nakuru',
    images: [],
    condition: 'Good',
    status: 'Active',
    views: 89,
    likes: 23,
    postedDate: '2025-11-28',
    expiryDate: '2025-12-28',
    rating: 5.0,
    reviews: 8
  },
  {
    id: 'M-003',
    category: 'Jobs',
    type: 'Farm Worker',
    title: 'Experienced Farm Worker Needed',
    description: 'Looking for experienced farm hand for dairy farm. Milking, feeding, general maintenance. Accommodation provided.',
    price: 18000,
    currency: 'KES',
    seller: 'Green Valley Farms',
    sellerPhone: '+254 733 567890',
    location: 'Eldoret',
    images: [],
    condition: '',
    status: 'Active',
    views: 67,
    likes: 15,
    postedDate: '2025-12-05',
    expiryDate: '2025-12-20',
    rating: 4.2,
    reviews: 5
  }
]

export default function Marketplace() {
  const KEY = 'cattalytics:marketplace:listings'
  const FAVORITES_KEY = 'cattalytics:marketplace:favorites'
  
  const [listings, setListings] = useState([])
  const [favorites, setFavorites] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedListing, setSelectedListing] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  
  // Filters
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('Active')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    category: 'Livestock',
    type: '',
    title: '',
    description: '',
    price: '',
    currency: 'KES',
    seller: '',
    sellerPhone: '',
    location: '',
    condition: 'Good',
    status: 'Active',
    images: []
  })
  
  // Review form
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    reviewerName: ''
  })

  useEffect(() => {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      setListings(JSON.parse(raw))
    } else {
      setListings(SAMPLE_LISTINGS)
      localStorage.setItem(KEY, JSON.stringify(SAMPLE_LISTINGS))
    }
    
    const favRaw = localStorage.getItem(FAVORITES_KEY)
    if (favRaw) setFavorites(JSON.parse(favRaw))
  }, [])

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(listings))
  }, [listings])
  
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  const addListing = () => {
    if (!formData.title.trim() || !formData.price) return
    
    const newListing = {
      ...formData,
      id: 'M-' + Date.now(),
      views: 0,
      likes: 0,
      postedDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      rating: 0,
      reviews: 0
    }
    
    setListings([newListing, ...listings])
    setFormData({
      category: 'Livestock',
      type: '',
      title: '',
      description: '',
      price: '',
      currency: 'KES',
      seller: '',
      sellerPhone: '',
      location: '',
      condition: 'Good',
      status: 'Active',
      images: []
    })
    setShowAddForm(false)
  }

  const deleteListing = (id) => {
    if (!confirm('Delete this listing?')) return
    setListings(listings.filter(l => l.id !== id))
    if (selectedListing?.id === id) setSelectedListing(null)
  }

  const toggleFavorite = (id) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(fid => fid !== id))
    } else {
      setFavorites([...favorites, id])
    }
  }

  const viewListing = (listing) => {
    // Increment view count
    setListings(listings.map(l => 
      l.id === listing.id ? { ...l, views: l.views + 1 } : l
    ))
    setSelectedListing(listing)
  }

  const likeListing = (id) => {
    setListings(listings.map(l => 
      l.id === id ? { ...l, likes: l.likes + 1 } : l
    ))
  }

  const addReview = () => {
    if (!selectedListing || !reviewForm.rating || !reviewForm.reviewerName.trim()) return
    
    const updatedListing = {
      ...selectedListing,
      reviews: selectedListing.reviews + 1,
      rating: ((selectedListing.rating * selectedListing.reviews) + reviewForm.rating) / (selectedListing.reviews + 1)
    }
    
    setListings(listings.map(l => l.id === selectedListing.id ? updatedListing : l))
    setSelectedListing(updatedListing)
    setReviewForm({ rating: 5, comment: '', reviewerName: '' })
    setShowReviewForm(false)
    alert('✅ Review submitted!')
  }

  const updateListingStatus = (id, status) => {
    setListings(listings.map(l => l.id === id ? { ...l, status } : l))
  }

  // Filtering and sorting
  const filteredListings = listings
    .filter(l => {
      if (filterCategory !== 'all' && l.category !== filterCategory) return false
      if (filterStatus !== 'all' && l.status !== filterStatus) return false
      if (showFavoritesOnly && !favorites.includes(l.id)) return false
      if (searchQuery && !l.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !l.description.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.postedDate) - new Date(a.postedDate)
      if (sortBy === 'price-low') return a.price - b.price
      if (sortBy === 'price-high') return b.price - a.price
      if (sortBy === 'popular') return b.views - a.views
      if (sortBy === 'rating') return b.rating - a.rating
      return 0
    })

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'Active').length,
    sold: listings.filter(l => l.status === 'Sold').length,
    favorites: favorites.length
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🏪 Marketplace</h2>
      <p style={{ color: '#666', marginBottom: 20 }}>Buy & sell livestock, equipment, and farm supplies</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 15, marginBottom: 20 }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: 15, borderRadius: 8 }}>
          <div style={{ fontSize: 28, fontWeight: 'bold' }}>{stats.total}</div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>Total Listings</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white', padding: 15, borderRadius: 8 }}>
          <div style={{ fontSize: 28, fontWeight: 'bold' }}>{stats.active}</div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>Active</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)', color: 'white', padding: 15, borderRadius: 8 }}>
          <div style={{ fontSize: 28, fontWeight: 'bold' }}>{stats.sold}</div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>Sold</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)', color: 'white', padding: 15, borderRadius: 8 }}>
          <div style={{ fontSize: 28, fontWeight: 'bold' }}>{stats.favorites}</div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>Favorites</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: 6, 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {showAddForm ? '✖ Cancel' : '➕ Post Listing'}
        </button>
        <button 
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          style={{ 
            background: showFavoritesOnly ? 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)' : '#e2e8f0', 
            color: showFavoritesOnly ? 'white' : '#333',
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: 6, 
            cursor: 'pointer' 
          }}
        >
          {showFavoritesOnly ? '❤️ Showing Favorites' : '🤍 Show All'}
        </button>
      </div>

      {/* Add Listing Form */}
      {showAddForm && (
        <div style={{ background: '#f7fafc', padding: 20, borderRadius: 8, marginBottom: 20, border: '2px solid #667eea' }}>
          <h3 style={{ marginTop: 0 }}>Post New Listing</h3>
          <div style={{ display: 'grid', gap: 15 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Category *</label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, type: '' })}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                >
                  {LISTING_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Type</label>
                <select 
                  value={formData.type} 
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                >
                  <option value="">Select type...</option>
                  {formData.category === 'Livestock' && LIVESTOCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  {formData.category === 'Equipment' && EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Title *</label>
              <input 
                type="text" 
                value={formData.title} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Short, descriptive title"
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Description *</label>
              <textarea 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description, age, condition, specifications..."
                rows={4}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 15 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Price *</label>
                <input 
                  type="number" 
                  value={formData.price} 
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Currency</label>
                <select 
                  value={formData.currency} 
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                >
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Seller Name</label>
                <input 
                  type="text" 
                  value={formData.seller} 
                  onChange={(e) => setFormData({ ...formData, seller: e.target.value })}
                  placeholder="Your name or farm name"
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Phone</label>
                <input 
                  type="tel" 
                  value={formData.sellerPhone} 
                  onChange={(e) => setFormData({ ...formData, sellerPhone: e.target.value })}
                  placeholder="+254 700 000000"
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Location</label>
                <input 
                  type="text" 
                  value={formData.location} 
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="County or town"
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                />
              </div>
            </div>
            
            {(formData.category === 'Equipment' || formData.category === 'Livestock') && (
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Condition</label>
                <select 
                  value={formData.condition} 
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                >
                  {CONDITION_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={addListing}
                style={{ 
                  background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '10px 30px', 
                  borderRadius: 6, 
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✅ Post Listing
              </button>
              <button 
                onClick={() => setShowAddForm(false)}
                style={{ background: '#e2e8f0', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ background: '#f7fafc', padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Search</label>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search listings..."
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Category</label>
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            >
              <option value="all">All Categories</option>
              {LISTING_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Status</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            >
              <option value="all">All Status</option>
              {LISTING_STATUS.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Sort By</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            >
              <option value="recent">Most Recent</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🔍</div>
          <div>No listings found. Try adjusting your filters or post a new listing!</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filteredListings.map(listing => (
            <div 
              key={listing.id} 
              style={{ 
                background: 'white', 
                border: favorites.includes(listing.id) ? '2px solid #f56565' : '1px solid #e2e8f0',
                borderRadius: 8, 
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {/* Image placeholder */}
              <div 
                style={{ 
                  height: 180, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 64,
                  color: 'white'
                }}
              >
                {listing.category === 'Livestock' ? '🐄' : 
                 listing.category === 'Equipment' ? '🚜' : 
                 listing.category === 'Jobs' ? '👷' : '📦'}
              </div>
              
              <div style={{ padding: 15 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: 11, 
                      color: 'white', 
                      background: listing.status === 'Active' ? '#48bb78' : listing.status === 'Sold' ? '#ed8936' : '#a0aec0',
                      padding: '2px 8px',
                      borderRadius: 4,
                      display: 'inline-block',
                      marginBottom: 8
                    }}>
                      {listing.status}
                    </div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: 16 }}>{listing.title}</h3>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {listing.category} {listing.type && `• ${listing.type}`}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(listing.id)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 24,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {favorites.includes(listing.id) ? '❤️' : '🤍'}
                  </button>
                </div>
                
                {/* Description */}
                <p style={{ 
                  fontSize: 13, 
                  color: '#666', 
                  margin: '10px 0',
                  height: 60,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {listing.description}
                </p>
                
                {/* Price */}
                <div style={{ 
                  fontSize: 24, 
                  fontWeight: 'bold', 
                  color: '#667eea',
                  marginBottom: 10
                }}>
                  {listing.currency} {listing.price.toLocaleString()}
                </div>
                
                {/* Metadata */}
                <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
                  <div>📍 {listing.location}</div>
                  <div>👤 {listing.seller}</div>
                  {listing.condition && <div>⚙️ {listing.condition}</div>}
                  <div>📅 Posted {listing.postedDate}</div>
                </div>
                
                {/* Stats */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: 12,
                  color: '#666',
                  padding: '10px 0',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <span>👁️ {listing.views} views</span>
                  <span>❤️ {listing.likes} likes</span>
                  <span>⭐ {listing.rating > 0 ? listing.rating.toFixed(1) : 'No ratings'}</span>
                </div>
                
                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => viewListing(listing)}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '8px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    View Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      likeListing(listing.id)
                    }}
                    style={{
                      background: '#e2e8f0',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    👍
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Listing Detail Modal */}
      {selectedListing && (
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
            zIndex: 1000,
            padding: 20
          }}
          onClick={() => setSelectedListing(null)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: 12,
              maxWidth: 800,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: 30
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: '0 0 10px 0' }}>{selectedListing.title}</h2>
                <div style={{ fontSize: 14, color: '#666' }}>
                  {selectedListing.category} {selectedListing.type && `• ${selectedListing.type}`}
                </div>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                style={{
                  background: '#e2e8f0',
                  border: 'none',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: 18
                }}
              >
                ✖
              </button>
            </div>
            
            {/* Large image placeholder */}
            <div 
              style={{ 
                height: 300, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 120,
                color: 'white',
                marginBottom: 20
              }}
            >
              {selectedListing.category === 'Livestock' ? '🐄' : 
               selectedListing.category === 'Equipment' ? '🚜' : 
               selectedListing.category === 'Jobs' ? '👷' : '📦'}
            </div>
            
            {/* Price */}
            <div style={{ 
              fontSize: 36, 
              fontWeight: 'bold', 
              color: '#667eea',
              marginBottom: 20
            }}>
              {selectedListing.currency} {selectedListing.price.toLocaleString()}
            </div>
            
            {/* Status */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Status:</label>
              <select
                value={selectedListing.status}
                onChange={(e) => updateListingStatus(selectedListing.id, e.target.value)}
                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              >
                {LISTING_STATUS.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
            
            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <h3>Description</h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>{selectedListing.description}</p>
            </div>
            
            {/* Details */}
            <div style={{ 
              background: '#f7fafc', 
              padding: 15, 
              borderRadius: 8,
              marginBottom: 20
            }}>
              <h3 style={{ marginTop: 0 }}>Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 14 }}>
                <div><strong>Location:</strong> {selectedListing.location}</div>
                <div><strong>Seller:</strong> {selectedListing.seller}</div>
                <div><strong>Phone:</strong> {selectedListing.sellerPhone}</div>
                {selectedListing.condition && <div><strong>Condition:</strong> {selectedListing.condition}</div>}
                <div><strong>Posted:</strong> {selectedListing.postedDate}</div>
                <div><strong>Expires:</strong> {selectedListing.expiryDate}</div>
                <div><strong>Views:</strong> {selectedListing.views}</div>
                <div><strong>Likes:</strong> {selectedListing.likes}</div>
              </div>
            </div>
            
            {/* Rating & Reviews */}
            <div style={{ marginBottom: 20 }}>
              <h3>Rating & Reviews</h3>
              <div style={{ fontSize: 24, color: '#f59e0b', marginBottom: 10 }}>
                {'⭐'.repeat(Math.round(selectedListing.rating))}
                <span style={{ fontSize: 16, color: '#666', marginLeft: 10 }}>
                  {selectedListing.rating > 0 ? selectedListing.rating.toFixed(1) : 'No ratings yet'}
                  {selectedListing.reviews > 0 && ` (${selectedListing.reviews} review${selectedListing.reviews > 1 ? 's' : ''})`}
                </span>
              </div>
              
              {!showReviewForm ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  style={{
                    background: '#48bb78',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Write a Review
                </button>
              ) : (
                <div style={{ background: '#f7fafc', padding: 15, borderRadius: 8 }}>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Your Name</label>
                    <input
                      type="text"
                      value={reviewForm.reviewerName}
                      onChange={(e) => setReviewForm({ ...reviewForm, reviewerName: e.target.value })}
                      placeholder="Enter your name"
                      style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                    />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Rating</label>
                    <select
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                      style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                    >
                      {[5, 4, 3, 2, 1].map(r => (
                        <option key={r} value={r}>{'⭐'.repeat(r)} ({r})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Comment (optional)</label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      rows={3}
                      placeholder="Share your experience..."
                      style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={addReview}
                      style={{
                        background: '#48bb78',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      Submit Review
                    </button>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      style={{
                        background: '#e2e8f0',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Contact Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => window.location.href = `tel:${selectedListing.sellerPhone}`}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                📞 Call Seller
              </button>
              <button
                onClick={() => window.location.href = `sms:${selectedListing.sellerPhone}`}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                💬 Send Message
              </button>
              <button
                onClick={() => deleteListing(selectedListing.id)}
                style={{
                  background: '#f56565',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
