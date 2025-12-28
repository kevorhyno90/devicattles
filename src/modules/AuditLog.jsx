import React, { useState, useEffect } from 'react'
import { 
  getAuditLog, 
  getAuditStats, 
  exportAuditLogCSV, 
  exportAuditLogJSON,
  formatAuditEntry,
  clearAuditLog,
  ACTIONS,
  ENTITIES
} from '../lib/audit'
import { hasPermission } from '../lib/auth'

export default function AuditLog() {
  const [audit, setAudit] = useState([])
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    userId: '',
    startDate: '',
    endDate: ''
  })
  const [searchTerm, setSearchTerm] = useState('')


  useEffect(() => {
    loadData()
  }, [filters])

  // Helper to generate sample logs if empty
  function handleGenerateSampleLogs() {
    import('../lib/audit').then(mod => {
      if (typeof mod.generateSampleAuditLogs === 'function') {
        mod.generateSampleAuditLogs()
        loadData()
      } else {
        alert('Sample log generator not found')
      }
    export default function AuditLog() {
      return (
        <section>
          <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>
            Audit log feature has been removed from this app.
          </div>
        </section>
      )
    }
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, fontSize: 13, color: '#666', textAlign: 'center' }}>
        Showing {filteredAudit.length} of {audit.length} entries
      </div>
    </section>
  )
}
