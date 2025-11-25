import React, { useEffect, useState } from 'react'
import { fileToDataUrl } from '../lib/image'

// Cattalytics Health System (Farmbrite-style) - single-file module
// Features: Records (patient <-> animal link), SOAP notes, vaccinations,
// medications, appointments, prescriptions, inventory, billing. Persisted
// in localStorage under cattalytics:health:* keys.

const PAT_KEY = 'cattalytics:health:patients'
const APPT_KEY = 'cattalytics:health:appointments'
const RX_KEY = 'cattalytics:health:prescriptions'
const INV_KEY = 'cattalytics:health:inventory'
const BILL_KEY = 'cattalytics:health:billing'

function uid(prefix = ''){ return prefix + Math.random().toString(36).slice(2,9) }

export default function HealthSystem({ animals = [] }){
  const [tab, setTab] = useState('records')

  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [inventory, setInventory] = useState([])
  const [billing, setBilling] = useState([])
  // transfer/merge UI state for admissions
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferSource, setTransferSource] = useState(null)
  const [transferTarget, setTransferTarget] = useState('')
  const [transferMode, setTransferMode] = useState('move')

  // Load from localStorage
  useEffect(()=>{ try{ setPatients(JSON.parse(localStorage.getItem(PAT_KEY)||'[]')) }catch(e){ setPatients([]) } }, [])
  useEffect(()=>{ try{ setAppointments(JSON.parse(localStorage.getItem(APPT_KEY)||'[]')) }catch(e){ setAppointments([]) } }, [])
  useEffect(()=>{ try{ setPrescriptions(JSON.parse(localStorage.getItem(RX_KEY)||'[]')) }catch(e){ setPrescriptions([]) } }, [])
  useEffect(()=>{ try{ setInventory(JSON.parse(localStorage.getItem(INV_KEY)||'[]')) }catch(e){ setInventory([]) } }, [])
  useEffect(()=>{ try{ setBilling(JSON.parse(localStorage.getItem(BILL_KEY)||'[]')) }catch(e){ setBilling([]) } }, [])

  // Persist
  useEffect(()=> localStorage.setItem(PAT_KEY, JSON.stringify(patients)), [patients])
  useEffect(()=> localStorage.setItem(APPT_KEY, JSON.stringify(appointments)), [appointments])
  useEffect(()=> localStorage.setItem(RX_KEY, JSON.stringify(prescriptions)), [prescriptions])
  useEffect(()=> localStorage.setItem(INV_KEY, JSON.stringify(inventory)), [inventory])
  useEffect(()=> localStorage.setItem(BILL_KEY, JSON.stringify(billing)), [billing])

  // Core operations
  function addPatient(p){ p.id = p.id || uid('p-'); p.createdAt = new Date().toISOString(); setPatients(prev=> [...prev, p]) }
  function updatePatient(id, patch){ setPatients(prev=> prev.map(x=> x.id===id ? { ...x, ...patch } : x)) }
  function removePatient(id){ if(!window.confirm('Delete patient?')) return; setPatients(prev=> prev.filter(p=> p.id!==id)) }

  function createAppointment(a){ a.id = a.id || uid('a-'); a.createdAt = new Date().toISOString(); setAppointments(prev=> [...prev, a]) }
  function addPrescription(r){ r.id = r.id || uid('r-'); r.createdAt = new Date().toISOString(); setPrescriptions(prev=> [...prev, r]) }
  function addInventoryItem(it){ it.id = it.id || uid('i-'); it.qty = Number(it.qty||0); setInventory(prev=> [...prev, it]) }
  function charge(patientId, desc, amount){ const b = { id: uid('b-'), patientId, desc, amount: Number(amount||0), paid:false, createdAt: new Date().toISOString() }; setBilling(prev=> [...prev, b]) }
  function setInvoicePaid(id, paid=true){ setBilling(prev=> prev.map(b=> b.id===id ? { ...b, paid } : b)) }

  async function attachFileToPatient(patientId, file){
    if(!file || !patientId) return
    try{
      const { dataUrl, mime, size } = await fileToDataUrl(file, { maxDim:1200, quality:0.8 })
      const entry = { id: uid('att-'), filename: file.name, dataUrl, mime, size, createdAt: new Date().toISOString() }
      setPatients(prev=> prev.map(p=> p.id===patientId ? { ...p, attachments: [...(p.attachments||[]), entry] } : p))
    }catch(e){ console.error(e); alert('Attach failed') }
  }

  function addSoapNote(patientId, note){ const entry = { id: uid('n-'), ...note, createdAt: new Date().toISOString() }; setPatients(prev=> prev.map(p=> p.id===patientId ? { ...p, notes: [...(p.notes||[]), entry] } : p)) }
  function pushEntry(patientId, key, entry){ entry.id = entry.id || uid(key+'-'); entry.createdAt = new Date().toISOString(); setPatients(prev=> prev.map(p=> p.id===patientId ? { ...p, [key]: [...(p[key]||[]), entry] } : p)) }

  // Veterinary-specific helpers
  function toggleFlag(patientId, flag){ setPatients(prev=> prev.map(p=> p.id===patientId ? { ...p, flags: { ...(p.flags||{}), [flag]: !((p.flags||{})[flag]) } } : p)) }

  // Admission helpers for veterinary admissions (animals or groups)
  function admitPatient(id, meta={}){ setPatients(prev=> prev.map(p=> p.id===id ? { ...p, admitted:true, admittedAt:new Date().toISOString(), admissionMeta: { ...(p.admissionMeta||{}), ...meta } } : p)) }
  function dischargePatient(id, note=''){ setPatients(prev=> prev.map(p=> p.id===id ? { ...p, admitted:false, dischargedAt:new Date().toISOString(), dischargeNote: note } : p)) }

  // Transfer / merge helpers
  function performTransfer(sourceId, targetId, mode='move'){
    if(!sourceId || !targetId) { alert('Please select a source and target'); return }
    if(sourceId === targetId) { alert('Source and target are the same'); return }
    const src = patients.find(p=> p.id===sourceId)
    const tgt = patients.find(p=> p.id===targetId)
    if(!src || !tgt){ alert('Source or target patient not found'); return }

    if(mode === 'move'){
      // move admission from source to target
      updatePatient(sourceId, { admitted:false, dischargeNote: 'Transferred to '+targetId, dischargedAt: new Date().toISOString() })
      updatePatient(targetId, { admitted:true, admittedAt: new Date().toISOString(), admissionMeta: { ...(tgt.admissionMeta||{}), transferredFrom: sourceId } })
      alert(`Admission moved from ${src.name||sourceId} to ${tgt.name||targetId}`)
    } else if(mode === 'merge'){
      // merge source into target: bring notes, vitals, vaccinations, medications, attachments, and reassign billing
      const merged = { ...tgt }
      const concat = (a,b)=> [ ...(a||[]), ...(b||[]) ]
      merged.notes = concat(tgt.notes, src.notes)
      merged.vitals = concat(tgt.vitals, src.vitals)
      merged.vaccinations = concat(tgt.vaccinations, src.vaccinations)
      merged.medications = concat(tgt.medications, src.medications)
      merged.attachments = concat(tgt.attachments, src.attachments)
      merged.surgeries = concat(tgt.surgeries, src.surgeries)
      // admission state: if either admitted, mark target admitted
      merged.admitted = Boolean(tgt.admitted || src.admitted)
      merged.admittedAt = tgt.admittedAt || src.admittedAt

      // update billing entries to point to target
      setBilling(prev => prev.map(b=> b.patientId === sourceId ? { ...b, patientId: targetId } : b))

      // replace target and remove source
      setPatients(prev => prev.reduce((acc,p)=>{
        if(p.id === targetId) acc.push(merged)
        else if(p.id === sourceId) return acc
        else acc.push(p)
        return acc
      }, []))

      alert(`Merged ${src.name||sourceId} into ${tgt.name||targetId}. Source record removed.`)
    }

    // close transfer UI
    setTransferOpen(false)
    setTransferSource(null)
    setTransferTarget('')
    setTransferMode('move')
  }

  // download helper (JSON)
  function downloadJson(obj, filename='export.json'){ try{ const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }catch(e){ console.error('download failed', e) } }

  // download a single patient's full record as a flattened CSV
  function downloadPatientCsv(patientId){
    try{
      const p = patients.find(x=>x.id===patientId)
      if(!p){ alert('Patient not found'); return }
      const escape = v => '"' + String(v ?? '').replace(/"/g,'""') + '"'
      const rows = []
      // headers: section,date,patientId,patientName,field1,field2,field3,notes
      const headers = ['section','date','patientId','patientName','c1','c2','c3','notes']

      // vitals
      (p.vitals||[]).forEach(v=> rows.push(['vital', v.createdAt || v.date || '', p.id, p.name || '', v.weight ?? '', v.temp ?? '', v.hr ?? '', v.notes || '']))
      // vaccinations
      (p.vaccinations||[]).forEach(v=> rows.push(['vaccination', v.createdAt || v.date || '', p.id, p.name || '', v.vaccine || '', v.lot || '', '', v.notes || '']))
      // medications
      (p.medications||[]).forEach(m=> rows.push(['medication', m.createdAt || m.date || '', p.id, p.name || '', m.drug || '', m.dose || '', '', m.notes || '']))
      // notes
      (p.notes||[]).forEach(n=> rows.push(['note', n.createdAt || '', p.id, p.name || '', n.subjective || '', n.objective || '', n.assessment || '', n.plan || '']))
      // attachments
      (p.attachments||[]).forEach(a=> rows.push(['attachment', a.createdAt || '', p.id, p.name || '', a.filename || '', a.mime || '', a.size || '', '']))

      const csv = [headers, ...rows].map(r=> r.map(escape).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `patient-${p.id}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }catch(e){ console.error('patient csv failed', e); alert('Export failed') }
  }

  const totalPatients = patients.length
  const unpaidTotal = billing.filter(b=>!b.paid).reduce((s,i)=> s + Number(i.amount||0), 0)

  return (
    <div className="health-root">
      <div className="health-header">
        <div>
          <h3 className="health-title">Devins Farm — Health</h3>
          <div className="muted">Patient information management system (PIMS)</div>
        </div>

        <div className="health-toolbar">
          <button className={`tab-btn ${tab==='records' ? 'active' : ''}`} onClick={()=>setTab('records')}>Records</button>
          <button className={`tab-btn ${tab==='appointments' ? 'active' : ''}`} onClick={()=>setTab('appointments')}>Appointments</button>
          <button className={`tab-btn ${tab==='prescriptions' ? 'active' : ''}`} onClick={()=>setTab('prescriptions')}>Prescriptions</button>
          <button className={`tab-btn ${tab==='inventory' ? 'active' : ''}`} onClick={()=>setTab('inventory')}>Inventory</button>
          <button className={`tab-btn ${tab==='billing' ? 'active' : ''}`} onClick={()=>setTab('billing')}>Billing</button>
          <button className={`tab-btn ${tab==='reports' ? 'active' : ''}`} onClick={()=>setTab('reports')}>Reports</button>
          <button className={`tab-btn ${tab==='admissions' ? 'active' : ''}`} onClick={()=>setTab('admissions')}>Admissions</button>
        </div>
      </div>

      <div className="panel">
        {tab==='records' && (
          <div className="columns">
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <strong>Patients</strong>
                <button className="tab-btn" onClick={()=>{ const p = { id: uid('p-'), name:'', animalId:'', tag:'', owner:{}, ids:{}, notes:[], vaccinations:[], medications:[], surgeries:[], communications:[], attachments:[] }; addPatient(p); }}>New</button>
              </div>
              <div style={{ marginTop:8, maxHeight:520, overflow:'auto', display:'grid', gap:8 }}>
                {patients.map(p=> (
                  <div key={p.id} onClick={()=>{ /* select */ }} className={`patient-list-item`}> 
                    <div>
                      <div style={{fontWeight:600}}>{p.name || '(unnamed)'}</div>
                      <div className="muted" style={{fontSize:12}}>{p.tag || ''}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div className="muted" style={{fontSize:12}}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</div>
                      <div className="badge">{(p.notes||[]).length} notes</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <RecordsView
                patients={patients}
                addPatient={addPatient}
                updatePatient={updatePatient}
                removePatient={removePatient}
                attachFileToPatient={attachFileToPatient}
                addSoapNote={addSoapNote}
                pushEntry={pushEntry}
                admitPatient={admitPatient}
                dischargePatient={dischargePatient}
                animals={animals}
              />
            </div>
          </div>
        )}

        {tab==='appointments' && <AppointmentView patients={patients} appointments={appointments} createAppointment={createAppointment} />}
        {tab==='prescriptions' && <PrescriptionView patients={patients} prescriptions={prescriptions} addPrescription={addPrescription} inventory={inventory} />}
        {tab==='inventory' && <InventoryView inventory={inventory} addInventory={addInventoryItem} adjustInventory={(id,delta)=> setInventory(prev=> prev.map(it=> it.id===id ? { ...it, qty: Math.max(0, Number(it.qty||0) + delta) } : it)) } />}
        {tab==='billing' && <BillingView patients={patients} billing={billing} charge={charge} setInvoicePaid={setInvoicePaid} generateInvoice={(pid)=> alert('Generate invoice for '+pid)} />}

        {tab==='reports' && (
          <ReportsView
            patients={patients}
            appointments={appointments}
            prescriptions={prescriptions}
            inventory={inventory}
            billing={billing}
            downloadJson={downloadJson}
            downloadPatientCsv={(pid)=> downloadPatientCsv(pid)}
          />
        )}

  {tab==='admissions' && (<>
          <div>
            <h4>Admissions</h4>
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>Currently admitted patients</div>
                <div className="muted">{patients.filter(p=>p.admitted).length} admitted</div>
              </div>
              <div style={{ marginTop:8 }}>
                {patients.filter(p=>p.admitted).length===0 ? <div className="muted">No admitted patients</div> : patients.filter(p=>p.admitted).map(p=> (
                  <div key={p.id} style={{ display:'flex', justifyContent:'space-between', padding:8, alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:600 }}>{p.name || '(unnamed)'}</div>
                      <div className="muted">Admitted: {p.admittedAt ? new Date(p.admittedAt).toLocaleString() : ''} — {p.admissionMeta?.reason || ''}</div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="tab-btn" onClick={()=>{ const note = prompt('Discharge note (optional)'); dischargePatient(p.id, note); updatePatient(p.id, { admitted:false, dischargeNote: note }); }}>Discharge</button>
                      <button className="tab-btn" onClick={()=>{ setTransferOpen(true); setTransferSource(p.id); setTransferTarget(''); setTransferMode('move') }}>Transfer</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {transferOpen && (
            <div style={{ marginTop:12, padding:12, border:'1px solid #eee', borderRadius:8, background:'#fff' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <strong>Transfer / Merge</strong>
                <button className="tab-btn" onClick={()=>{ setTransferOpen(false); setTransferSource(null); setTransferTarget(''); }}>Close</button>
              </div>
              <div style={{ marginTop:8, display:'flex', gap:8, alignItems:'center' }}>
                <label style={{ display:'flex', flexDirection:'column' }}>
                  To patient
                  <select value={transferTarget} onChange={e=>setTransferTarget(e.target.value)}>
                    <option value=''>Select target patient</option>
                    {patients.filter(pt=> pt.id !== transferSource).map(pt=> <option key={pt.id} value={pt.id}>{pt.name || pt.tag || pt.id}</option>)}
                  </select>
                </label>
                <label style={{ display:'flex', flexDirection:'column' }}>
                  Mode
                  <select value={transferMode} onChange={e=>setTransferMode(e.target.value)}>
                    <option value='move'>Move admission (source remains as record)</option>
                    <option value='merge'>Merge records (combine and remove source)</option>
                  </select>
                </label>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="tab-btn" onClick={()=>{
                    if(!transferTarget){ alert('Pick a target patient'); return }
                    if(!confirm(`Confirm ${transferMode} from ${transferSource} to ${transferTarget}?`)) return
                    performTransfer(transferSource, transferTarget, transferMode)
                  }}>Confirm</button>
                  <button className="tab-btn" onClick={()=>{ setTransferOpen(false); setTransferSource(null); setTransferTarget(''); }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </>)}
      </div>
    </div>
  )
}

// ----------- Subviews -----------
function RecordsView({ patients = [], addPatient, updatePatient, removePatient, attachFileToPatient, addSoapNote, pushEntry, admitPatient, dischargePatient, animals = [] }){
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [query, setQuery] = useState('')

  useEffect(()=>{ if(selected){ const p = patients.find(x=>x.id===selected) || {}; setForm({ ...p }) } else setForm({}) }, [selected, patients])

  function onNew(){ const p = { id: uid('p-'), name:'', animalId:'', tag:'', owner:{}, ids:{}, notes:[], vaccinations:[], medications:[], surgeries:[], communications:[], attachments:[] }; addPatient(p); setSelected(p.id); setEditing(true) }
  function save(){ if(!selected) return; updatePatient(selected, form); setEditing(false) }

  const q = (query || '').trim().toLowerCase()
  const filtered = q ? patients.filter(p=> (p.name||'').toLowerCase().includes(q) || (p.tag||'').toLowerCase().includes(q) || (p.owner?.name||'').toLowerCase().includes(q)) : patients

  return (
    <div style={{ display:'flex', gap:12 }}>
      <div style={{ width:320 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <strong>Patients</strong>
          <button onClick={()=>{ const p = { id: uid('p-'), name:'', animalId:'', tag:'', owner:{}, ids:{}, notes:[], vaccinations:[], medications:[], surgeries:[], communications:[], attachments:[] }; addPatient(p); setSelected(p.id); setEditing(true) }}>New</button>
        </div>

        <div style={{ marginTop:8, display:'flex', gap:8 }}>
          <input aria-label="Search patients" placeholder="Search name, tag, owner" value={query} onChange={e=>setQuery(e.target.value)} style={{flex:1,padding:8,border:'1px solid #ddd',borderRadius:8}} />
          <button onClick={()=>setQuery('')} className="tab-btn">Clear</button>
        </div>

        <div style={{ marginTop:8, maxHeight:520, overflow:'auto' }}>
          {filtered.length === 0 ? <div className="muted" style={{padding:10}}>No patients match "{query}"</div> : filtered.map(p=> (
            <div key={p.id} className={`patient-list-item ${p.id===selected? 'selected' : ''}`}>
              <div style={{ flex:1, cursor:'pointer' }} onClick={()=>{ setSelected(p.id); setEditing(false) }}>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <div style={{fontWeight:600}}>{p.name || '(unnamed)'}</div>
                  {p.admitted ? <span className="flag green">Admitted</span> : null}
                </div>
                <div className="muted" style={{fontSize:12}}>{p.tag || ''}</div>
              </div>
              <div style={{textAlign:'right', display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end'}}>
                <div className="muted" style={{fontSize:12}}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <div className="badge">{(p.notes||[]).length} notes</div>
                  {p.admitted ? (
                    <button className="tab-btn" onClick={(e)=>{ e.stopPropagation(); const note = prompt('Discharge note (optional)'); dischargePatient(p.id, note); updatePatient(p.id, { admitted:false, dischargeNote: note }); if(selected===p.id) setForm(prev=> ({ ...prev, admitted:false, dischargeNote: note })); }}>Discharge</button>
                  ) : (
                    <button className="tab-btn" onClick={(e)=>{ e.stopPropagation(); const reason = prompt('Admission reason (optional)'); admitPatient(p.id, { reason }); updatePatient(p.id, { admitted:true, admissionMeta:{ reason }, admittedAt: new Date().toISOString() }); if(selected===p.id) setForm(prev=> ({ ...prev, admitted:true, admissionMeta:{ reason }, admittedAt: new Date().toISOString() })); }}>Admit</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:8 }}>
          <strong>Import from animals</strong>
          <div style={{ maxHeight:160, overflow:'auto' }}>{animals.map(a=> (
            <div key={a.id} style={{ display:'flex', justifyContent:'space-between', padding:4 }}>
              <div>{a.name} <small>{a.tag}</small></div>
              <div>
                <button onClick={()=>{ const p = { id: uid('p-'), animalId: a.id, name: a.name||'', tag: a.tag||'', owner: a.owner||{}, createdAt: new Date().toISOString(), notes:[], vaccinations:[], medications:[], surgeries:[], communications:[], attachments:[] }; addPatient(p); setSelected(p.id); setEditing(true) }}>Import</button>
              </div>
            </div>
          ))}</div>
        </div>
      </div>

      <div style={{ flex:1 }}>
        {!selected ? <div className="muted">Select a patient</div> : (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h4>{form.name || '(unnamed)'}</h4>
                <div className="muted" style={{ fontSize:12 }}>{form.tag || ''} {form.animalId ? `• animal ${form.animalId}` : ''}</div>
                {form.admitted ? <div style={{marginTop:6}}><span className="flag">Admitted</span> <small className="muted">{form.admittedAt? new Date(form.admittedAt).toLocaleString():''}</small></div> : null}
              </div>
              <div>
                <button onClick={()=>setEditing(e=>!e)}>{editing? 'Cancel':'Edit'}</button>
                <button onClick={()=>{ if(window.confirm('Remove patient?')){ removePatient(selected); setSelected(null) }}} style={{ marginLeft:8 }}>Delete</button>
              </div>
            </div>

            {editing ? (
              <div>
                <label style={{ display:'block' }}>Name<input value={form.name||''} onChange={e=>{ setForm({...form, name: e.target.value}); if(selected) updatePatient(selected, { name: e.target.value }) }} /></label>
                <label style={{ display:'block' }}>Tag<input value={form.tag||''} onChange={e=>{ setForm({...form, tag: e.target.value}); if(selected) updatePatient(selected, { tag: e.target.value }) }} /></label>
                <label style={{ display:'block' }}>Owner<input value={form.owner?.name||''} onChange={e=>{ setForm({...form, owner:{...(form.owner||{}), name: e.target.value}}); if(selected) updatePatient(selected, { owner: {...(form.owner||{}), name: e.target.value} }) }} /></label>
                <div style={{ marginTop:8 }}><button onClick={()=>{ save(); /* already saved via updatePatient */ }}>Save</button></div>
                <div style={{ marginTop:8 }}>
                  {form.admitted ? (
                    <button className="tab-btn" onClick={()=>{ const note = prompt('Discharge note (optional)'); dischargePatient(selected, note); updatePatient(selected, { admitted:false, dischargeNote: note }); setForm(prev=> ({ ...prev, admitted:false, dischargeNote: note })) }}>Discharge</button>
                  ) : (
                    <button className="tab-btn" onClick={()=>{ const reason = prompt('Admission reason (optional)'); admitPatient(selected, { reason }); updatePatient(selected, { admitted:true, admissionMeta:{ reason } }); setForm(prev=> ({ ...prev, admitted:true, admissionMeta:{ reason }, admittedAt: new Date().toISOString() })) }}>Admit</button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <section><strong>Notes</strong><ul>{(form.notes||[]).map(n=> <li key={n.id}>{n.subject || n.text} <small>({new Date(n.createdAt).toLocaleString()})</small></li>)}</ul></section>

                <section style={{ marginTop:8 }}>
                  <strong>Vaccinations</strong>
                  <VaccinationList items={form.vaccinations||[]} />
                  <VaccinationForm onAdd={(v)=>{ pushEntry(selected, 'vaccinations', v); setForm(prev=> ({ ...prev, vaccinations: [...(prev.vaccinations||[]), { id: uid('v-'), ...v, createdAt: new Date().toISOString() }] })) }} />
                </section>

                <section style={{ marginTop:8 }}>
                  <strong>Vitals & Weights</strong>
                  <div className="vitals-row">
                    <div className="vitals-item">Latest: {((form.vitals||[]).slice(-1)[0]?.weight) ? `${(form.vitals||[]).slice(-1)[0].weight} kg` : '—'}</div>
                    <div className="vitals-item">Temp: {((form.vitals||[]).slice(-1)[0]?.temp) || '—'}</div>
                    <div className="vitals-item">HR: {((form.vitals||[]).slice(-1)[0]?.hr) || '—'}</div>
                  </div>
                  <VitalsForm onAdd={(v)=>{ pushEntry(selected, 'vitals', v); setForm(prev=> ({ ...prev, vitals: [...(prev.vitals||[]), { id: uid('vt-'), ...v, createdAt: new Date().toISOString() }] })) }} />
                  <VitalsList items={form.vitals||[]} />
                </section>

                <section style={{ marginTop:8 }}>
                  <strong>Status</strong>
                  <div style={{ marginTop:6 }}>
                    <button className={`tab-btn ${form.flags?.injured ? '' : ''}`} onClick={()=>{ toggleFlag(selected, 'injured'); updatePatient(selected, { flags: { ...(form.flags||{}), injured: !form.flags?.injured } }); setForm(prev=> ({ ...prev, flags: { ...(prev.flags||{}), injured: !prev.flags?.injured } })) }}>{form.flags?.injured ? 'Unmark injured' : 'Mark injured'}</button>
                    <button className="tab-btn" onClick={()=>{ toggleFlag(selected, 'isolated'); updatePatient(selected, { flags: { ...(form.flags||{}), isolated: !form.flags?.isolated } }); setForm(prev=> ({ ...prev, flags: { ...(prev.flags||{}), isolated: !prev.flags?.isolated } })) }} style={{ marginLeft:8 }}>{form.flags?.isolated ? 'Unmark isolated' : 'Mark isolated'}</button>
                  </div>
                </section>

                <section style={{ marginTop:8 }}>
                  <strong>Medications</strong>
                  <MedicationList items={form.medications||[]} />
                  <MedicationForm onAdd={(m)=>{ pushEntry(selected, 'medications', m); setForm(prev=> ({ ...prev, medications: [...(prev.medications||[]), { id: uid('m-'), ...m, createdAt: new Date().toISOString() }] })) }} />
                </section>

                <section style={{ marginTop:8 }}>
                  <strong>Attachments</strong>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{(form.attachments||[]).map(a=> (<div key={a.id} style={{ width:140 }}><div style={{ fontSize:11 }}>{a.filename}</div><a href={a.dataUrl} target='_blank' rel='noreferrer'>Open</a></div>))}</div>
                  <label style={{ display:'block', marginTop:8 }}>Add file<input type='file' onChange={e=>{ const f = e.target.files[0]; if(f) attachFileToPatient(selected, f); e.target.value='' }} /></label>
                </section>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AddSoapNoteForm({ onAdd }){
  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')
  return (
    <form onSubmit={e=>{ e.preventDefault(); onAdd({ subjective, objective, assessment, plan }); setSubjective(''); setObjective(''); setAssessment(''); setPlan('') }} style={{ marginTop:8 }}>
      <div style={{ display:'flex', gap:8 }}>
        <input placeholder='Subjective' value={subjective} onChange={e=>setSubjective(e.target.value)} />
        <input placeholder='Objective' value={objective} onChange={e=>setObjective(e.target.value)} />
        <input placeholder='Assessment' value={assessment} onChange={e=>setAssessment(e.target.value)} />
        <input placeholder='Plan' value={plan} onChange={e=>setPlan(e.target.value)} />
        <button type='submit'>Add note</button>
      </div>
    </form>
  )
}

function VaccinationForm({ onAdd }){
  const [vaccine, setVaccine] = useState('')
  const [date, setDate] = useState('')
  const [lot, setLot] = useState('')
  return (
    <form onSubmit={e=>{ e.preventDefault(); onAdd({ vaccine, date, lot }); setVaccine(''); setDate(''); setLot('') }} style={{ marginTop:8 }}>
      <div style={{ display:'flex', gap:8 }}>
        <input placeholder='Vaccine' value={vaccine} onChange={e=>setVaccine(e.target.value)} />
        <input type='date' value={date} onChange={e=>setDate(e.target.value)} />
        <input placeholder='Lot' value={lot} onChange={e=>setLot(e.target.value)} />
        <button type='submit'>Add</button>
      </div>
    </form>
  )
}

function VaccinationList({ items=[] }){ return (<ul>{items.map(i=> <li key={i.id}>{i.date||i.createdAt} — {i.vaccine} {i.lot? `(lot ${i.lot})` : ''}</li>)}</ul>) }

function MedicationForm({ onAdd }){
  const [drug, setDrug] = useState('')
  const [dose, setDose] = useState('')
  return (
    <form onSubmit={e=>{ e.preventDefault(); onAdd({ drug, dose }); setDrug(''); setDose('') }} style={{ marginTop:8 }}>
      <div style={{ display:'flex', gap:8 }}>
        <input placeholder='Drug' value={drug} onChange={e=>setDrug(e.target.value)} />
        <input placeholder='Dose' value={dose} onChange={e=>setDose(e.target.value)} />
        <button type='submit'>Add</button>
      </div>
    </form>
  )
}

function MedicationList({ items=[] }){ return (<ul>{items.map(i=> <li key={i.id}>{i.drug} — {i.dose}</li>)}</ul>) }

function SurgeryForm({ onAdd }){
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState('')
  return (
    <form onSubmit={e=>{ e.preventDefault(); onAdd({ desc, date }); setDesc(''); setDate('') }} style={{ marginTop:8 }}>
      <div style={{ display:'flex', gap:8 }}>
        <input placeholder='Procedure' value={desc} onChange={e=>setDesc(e.target.value)} />
        <input type='date' value={date} onChange={e=>setDate(e.target.value)} />
        <button type='submit'>Add</button>
      </div>
    </form>
  )
}

function SurgeryList({ items=[] }){ return (<ul>{items.map(i=> <li key={i.id}>{i.date||i.createdAt} — {i.desc}</li>)}</ul>) }

function VitalsForm({ onAdd }){
  const [weight, setWeight] = useState('')
  const [temp, setTemp] = useState('')
  const [hr, setHr] = useState('')
  const [notes, setNotes] = useState('')
  return (
    <form onSubmit={e=>{ e.preventDefault(); onAdd({ weight: weight? Number(weight): undefined, temp: temp || undefined, hr: hr || undefined, notes }); setWeight(''); setTemp(''); setHr(''); setNotes('') }} style={{ marginTop:8 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input placeholder='Weight (kg)' value={weight} onChange={e=>setWeight(e.target.value)} style={{width:100}} />
        <input placeholder='Temp (°C)' value={temp} onChange={e=>setTemp(e.target.value)} style={{width:110}} />
        <input placeholder='HR' value={hr} onChange={e=>setHr(e.target.value)} style={{width:80}} />
        <input placeholder='Notes' value={notes} onChange={e=>setNotes(e.target.value)} style={{flex:1}} />
        <button type='submit'>Add</button>
      </div>
    </form>
  )
}

function VitalsList({ items=[] }){
  if(!items || items.length===0) return <div className="muted">No vitals recorded</div>
  return (<ul>{items.slice().reverse().map(i=> <li key={i.id}>{i.createdAt ? new Date(i.createdAt).toLocaleString() : ''} — {i.weight? `${i.weight} kg` : ''} {i.temp? `• ${i.temp}°C` : ''} {i.hr? `• ${i.hr} bpm` : ''} {i.notes? `• ${i.notes}` : ''}</li>)}</ul>)
}

function AppointmentView({ patients=[], appointments=[], createAppointment }){
  const [patientId, setPatientId] = useState('')
  const [when, setWhen] = useState('')
  const [reason, setReason] = useState('')
  return (
    <div>
      <form onSubmit={e=>{ e.preventDefault(); createAppointment({ patientId, when, reason, createdAt: new Date().toISOString(), status: 'Scheduled' }); setPatientId(''); setWhen(''); setReason('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
          <label style={{marginRight:4}}>Appointment Date & Time:</label>
          <input type='datetime-local' value={when} onChange={e=>setWhen(e.target.value)} />
          <input placeholder='Reason' value={reason} onChange={e=>setReason(e.target.value)} />
          <button type='submit'>Create</button>
        </div>
      </form>
      <div style={{ marginTop:8 }}>{appointments.map(a=> (<div key={a.id}>{(patients.find(p=>p.id===a.patientId)||{}).name || a.patientId} — {a.when || a.createdAt} — {a.status}</div>))}</div>
    </div>
  )
}

function PrescriptionView({ patients=[], prescriptions=[], addPrescription, inventory=[] }){
  const [patientId, setPatientId] = useState('')
  const [drug, setDrug] = useState('')
  const [dose, setDose] = useState('')
  return (
    <div>
      <form onSubmit={e=>{ e.preventDefault(); addPrescription({ patientId, drug, dose }); setDrug(''); setDose('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
          <input placeholder='Drug' value={drug} onChange={e=>setDrug(e.target.value)} />
          <input placeholder='Dose' value={dose} onChange={e=>setDose(e.target.value)} />
          <button type='submit'>Prescribe</button>
        </div>
      </form>
      <ul>{prescriptions.map(r=> <li key={r.id}>{(patients.find(p=>p.id===r.patientId)||{}).name||r.patientId} — {r.drug} — {r.dose}</li>)}</ul>
    </div>
  )
}

function InventoryView({ inventory=[], addInventory, adjustInventory }){
  const [name, setName] = useState('')
  const [qty, setQty] = useState(0)
  return (
    <div>
      <form onSubmit={e=>{ e.preventDefault(); addInventory({ name, qty }); setName(''); setQty(0) }}>
        <input placeholder='Item name' value={name} onChange={e=>setName(e.target.value)} />
        <input type='number' value={qty} onChange={e=>setQty(e.target.value)} />
        <button type='submit'>Add</button>
      </form>
      <ul>{inventory.map(it=>(<li key={it.id}>{it.name} — {it.qty} <button onClick={()=>adjustInventory(it.id,-1)}>-</button><button onClick={()=>adjustInventory(it.id,1)}>+</button></li>))}</ul>
    </div>
  )
}

function BillingView({ patients=[], billing=[], charge, setInvoicePaid, generateInvoice }){
  const [patientId, setPatientId] = useState('')
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  return (
    <div>
      <form onSubmit={e=>{ e.preventDefault(); charge(patientId, desc, amount); setDesc(''); setAmount('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
          <input placeholder='Description' value={desc} onChange={e=>setDesc(e.target.value)} />
          <input placeholder='Amount' type='number' value={amount} onChange={e=>setAmount(e.target.value)} />
          <button type='submit'>Charge</button>
        </div>
      </form>
      <ul>{billing.map(b=>(<li key={b.id}>{b.desc} — ${Number(b.amount).toFixed(2)} — {(patients.find(p=>p.id===b.patientId)||{}).name||b.patientId} — {b.paid? 'Paid' : <button onClick={()=>setInvoicePaid(b.id,true)}>Mark paid</button>} <button onClick={()=>generateInvoice(b.patientId)}>Invoice</button></li>))}</ul>
    </div>
  )
}

// Reports view: select a section and view/download entries or full patient records
function ReportsView({ patients=[], appointments=[], prescriptions=[], inventory=[], billing=[], downloadJson, downloadPatientCsv }){
  // Build an HTML document representing a patient's full record (exhaustive)
  function generatePatientHtml(patient){
    const p = patient || {}
    const esc = s => String(s === undefined || s === null ? '' : s)
    const appts = appointments.filter(a=> a.patientId === p.id)
    const rx = prescriptions.filter(r=> r.patientId === p.id)
    const bills = billing.filter(b=> b.patientId === p.id)
    const inv = inventory || []

    const sectionRows = (title, items, renderRow) => `\n<h3>${title} (${items.length})</h3>\n${items.length? '<table border="0" style="width:100%;border-collapse:collapse">' + items.map(renderRow).join('') + '</table>' : '<div class="muted">No records</div>'}`

    const notesHtml = sectionRows('Notes', p.notes||[], n=> `<tr><td style="padding:6px;border:1px solid #eee"><strong>${esc(n.createdAt||n.date||'')}</strong><div>${esc(n.subjective||'')}</div><div>${esc(n.objective||'')}</div><div>${esc(n.assessment||'')}</div><div>${esc(n.plan||'')}</div></td></tr>`)
    const vitalsHtml = sectionRows('Vitals', p.vitals||[], v=> `<tr><td style="padding:6px;border:1px solid #eee">${esc(v.createdAt||v.date||'')} — Weight: ${esc(v.weight)} kg • Temp: ${esc(v.temp)} °C • HR: ${esc(v.hr)} • ${esc(v.notes||'')}</td></tr>`)
    const vaccHtml = sectionRows('Vaccinations', p.vaccinations||[], v=> `<tr><td style="padding:6px;border:1px solid #eee">${esc(v.date||v.createdAt||'')} — ${esc(v.vaccine||'')} ${(v.lot? ' (lot '+esc(v.lot)+')' : '')}</td></tr>`)
    const medsHtml = sectionRows('Medications', p.medications||[], m=> `<tr><td style="padding:6px;border:1px solid #eee">${esc(m.createdAt||m.date||'')} — ${esc(m.drug||m.name||'')} — ${esc(m.dose||'')}</td></tr>`)
    const attachHtml = sectionRows('Attachments', p.attachments||[], a=> `<tr><td style="padding:6px;border:1px solid #eee">${esc(a.filename||'file')} — ${esc(a.createdAt||'')}<div>${a.dataUrl? `<img src="${a.dataUrl}" style="max-width:320px;display:block;margin-top:6px"/>` : ''}</div></td></tr>`)
    const apptsHtml = sectionRows('Appointments', appts, a=> `<tr><td style="padding:6px;border:1px solid #eee">${esc(a.when||a.createdAt||'')} — ${esc(a.reason||'')} — ${esc(a.status||'')}</td></tr>`)
    const rxHtml = sectionRows('Prescriptions', rx, r=> `<tr><td style="padding:6px;border:1px solid #eee">${esc(r.createdAt||'')} — ${esc(r.drug||'')} — ${esc(r.dose||'')}</td></tr>`)
    const billsHtml = sectionRows('Billing', bills, b=> `<tr><td style="padding:6px;border:1px solid #eee">${esc(b.createdAt||'')} — ${esc(b.desc||'')} — ${esc(b.amount||'')} — ${b.paid? 'Paid' : 'Unpaid'}</td></tr>`)

    // Polished header with farm branding
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const headerHtml = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 15px;">
        <h1 style="margin: 0; font-size: 28pt; letter-spacing: 2px;">JR FARM</h1>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
          <div style="flex: 1;"></div>
          <div style="flex: 2; text-align: center;">
            <p style="margin: 5px 0; font-size: 11pt;">Patient Health Record</p>
            <p style="margin: 5px 0; font-size: 10pt; color: #555;">Date: ${today}</p>
          </div>
          <div style="flex: 1; text-align: right; font-size: 9pt; font-style: italic; color: #666;">
            Made by<br/>Dr. Devin Omwenga
          </div>
        </div>
      </div>`

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Full record - ${esc(p.name||p.id||'patient')}</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:18px;color:#111}h1{margin-bottom:6px}h2{margin:0}h3{margin-top:18px;color:#2b8c3e}table{margin-top:6px}td{vertical-align:top}.muted{color:#666}</style></head><body>${headerHtml}<h1>${esc(p.name||'(unnamed)')}</h1><div><strong>ID:</strong> ${esc(p.id||'')}</div><div><strong>Tag:</strong> ${esc(p.tag||'')}</div><div><strong>Owner:</strong> ${esc(p.owner?.name||'')}</div><div><strong>Created:</strong> ${esc(p.createdAt||'')}</div>${notesHtml}${vitalsHtml}${vaccHtml}${medsHtml}${attachHtml}${apptsHtml}${rxHtml}${billsHtml}</body></html>`
    return html
  }

  // DOCX export helpers using dynamic import of 'docx' if available
  async function exportDocxForPatient(patientId){
    const p = patients.find(x=> x.id === patientId)
    if(!p) return alert('Patient not found')
      try{
        const docx = await new Function('return import("docx")')()
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, AlignmentType } = docx

      // helper: fetch an image (data: or url), convert svg -> png if needed, return ArrayBuffer
      async function fetchImageArrayBuffer(src){
        if(!src) return null
        try{
          // fetch via browser so data: URLs are supported
          const res = await fetch(src)
          const blob = await res.blob()
          if(!blob) return null
          if(blob.type === 'image/svg+xml'){
            // convert SVG blob to PNG via canvas
            const svgText = await blob.text()
            const svgUrl = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }))
            const img = new Image()
            img.src = svgUrl
            await new Promise((resolve, reject)=>{ img.onload = resolve; img.onerror = reject })
            const canvas = document.createElement('canvas')
            canvas.width = img.width || 400
            canvas.height = img.height || 120
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            const pngBlob = await new Promise(r=> canvas.toBlob(r, 'image/png'))
            URL.revokeObjectURL(svgUrl)
            return await pngBlob.arrayBuffer()
          }
          return await blob.arrayBuffer()
        }catch(e){ console.error('fetchImage failed', e); return null }
      }

      // load logo from persisted settings if present
      const uiSettings = (()=>{ try{ return JSON.parse(localStorage.getItem('devinsfarm:ui:settings')||'{}') }catch(e){ return {} } })()
      const logoSrc = uiSettings.logo === 'uploaded' && uiSettings.uploadedLogo ? uiSettings.uploadedLogo : (uiSettings.logo ? `/assets/${uiSettings.logo}` : null)
      let logoBuffer = null
      if(logoSrc){ logoBuffer = await fetchImageArrayBuffer(logoSrc) }

      const doc = new Document({ sections: [] })

      // Header: HEADINGJR FARM
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      const headerParagraphs = []
      headerParagraphs.push(new Paragraph({ 
        children: [ new TextRun({ text: 'HEADINGJR FARM', bold:true, size: 32 }) ],
        alignment: AlignmentType.CENTER
      }))
      headerParagraphs.push(new Paragraph({ 
        children: [ new TextRun({ text: 'Patient Health Record', size: 22 }) ],
        alignment: AlignmentType.CENTER
      }))
      headerParagraphs.push(new Paragraph({ 
        children: [ new TextRun({ text: `Date: ${today}`, size: 20, color: '555555' }) ],
        alignment: AlignmentType.CENTER
      }))
      headerParagraphs.push(new Paragraph({ 
        children: [ new TextRun({ text: 'Made by Dr. Devin Omwenga', size: 18, italics: true, color: '666666' }) ],
        alignment: AlignmentType.RIGHT
      }))

      // Build content paragraphs per section
      const body = []
      body.push(new Paragraph({ text: `Patient: ${p.name || '(unnamed)'}`, heading: HeadingLevel.HEADING_1 }))
      body.push(new Paragraph({ text: `ID: ${p.id || ''}` }))
      if(p.tag) body.push(new Paragraph({ text: `Tag: ${p.tag}` }))
      if(p.owner?.name) body.push(new Paragraph({ text: `Owner: ${p.owner.name}` }))
      body.push(new Paragraph({ text: `Created: ${p.createdAt || ''}` }))

      const pushSection = (title, items, render) => {
        body.push(new Paragraph({ text: title, heading: HeadingLevel.HEADING_2 }))
        if(!items || items.length===0){ body.push(new Paragraph({ text: 'No records' })) ; return }
        items.forEach(it=> body.push(new Paragraph({ text: render(it) })))
      }

      pushSection('Notes', p.notes||[], n=> `${n.createdAt || ''} — ${n.subjective || ''} ${n.objective ? '\nObj: '+n.objective : ''} ${n.assessment ? '\nAssess: '+n.assessment : ''} ${n.plan ? '\nPlan: '+n.plan : ''}`)
      pushSection('Vitals', p.vitals||[], v=> `${v.createdAt || ''} — Weight: ${v.weight ?? ''} kg — Temp: ${v.temp ?? ''} °C — HR: ${v.hr ?? ''} bpm — ${v.notes || ''}`)
      pushSection('Vaccinations', p.vaccinations||[], v=> `${v.createdAt || v.date || ''} — ${v.vaccine || ''} ${v.lot ? '(lot '+v.lot+')' : ''}`)
      pushSection('Medications', p.medications||[], m=> `${m.createdAt || ''} — ${m.drug || m.name || ''} — ${m.dose || ''}`)
      pushSection('Attachments', p.attachments||[], a=> `${a.createdAt || ''} — ${a.filename || ''}`)
      pushSection('Appointments', appointments.filter(a=> a.patientId === p.id), a=> `${a.when || a.createdAt || ''} — ${a.reason || ''} — ${a.status || ''}`)
      pushSection('Prescriptions', prescriptions.filter(r=> r.patientId === p.id), r=> `${r.createdAt || ''} — ${r.drug || ''} — ${r.dose || ''}`)
      pushSection('Billing', billing.filter(b=> b.patientId === p.id), b=> `${b.createdAt || ''} — ${b.desc || ''} — ${b.amount || ''} — ${b.paid ? 'Paid' : 'Unpaid'}`)

      // Assemble document section
      doc.addSection({ headers: { default: { children: headerParagraphs } }, children: body })

      const packer = new Packer()
      const blob = await packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `patient-${p.id}.docx`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)

    }catch(e){
      console.error('docx export failed', e)
      alert('DOCX export requires the `docx` package. Please install it (npm install docx) and reload.')
    }
  }

  async function exportAllPatientsDocx(){
    try{
      const docx = await new Function('return import("docx")')()
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, AlignmentType } = docx
      const doc = new Document({ sections: [] })
      const children = []

      // Header: JR FARM
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      children.push(new Paragraph({ 
        children: [ new TextRun({ text: 'JR FARM', bold:true, size: 32 }) ],
        alignment: AlignmentType.CENTER
      }))
      children.push(new Paragraph({ 
        children: [ new TextRun({ text: 'Patient Health Records', size: 22 }) ],
        alignment: AlignmentType.CENTER
      }))
      children.push(new Paragraph({ 
        children: [ new TextRun({ text: `Date: ${today}`, size: 20, color: '555555' }) ],
        alignment: AlignmentType.CENTER
      }))
      children.push(new Paragraph({ 
        children: [ new TextRun({ text: 'Made by Dr. Devin Omwenga', size: 18, italics: true, color: '666666' }) ],
        alignment: AlignmentType.RIGHT
      }))

      // attempt to fetch logo to embed
      const uiSettings = (()=>{ try{ return JSON.parse(localStorage.getItem('devinsfarm:ui:settings')||'{}') }catch(e){ return {} } })()
      const logoSrc = uiSettings.logo === 'uploaded' && uiSettings.uploadedLogo ? uiSettings.uploadedLogo : (uiSettings.logo ? `/assets/${uiSettings.logo}` : null)
      async function fetchImageArrayBuffer(src){
        if(!src) return null
        try{
          const res = await fetch(src)
          const blob = await res.blob()
          if(!blob) return null
          if(blob.type === 'image/svg+xml'){
            const svgText = await blob.text()
            const svgUrl = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }))
            const img = new Image()
            img.src = svgUrl
            await new Promise((resolve, reject)=>{ img.onload = resolve; img.onerror = reject })
            const canvas = document.createElement('canvas')
            canvas.width = img.width || 400
            canvas.height = img.height || 120
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            const pngBlob = await new Promise(r=> canvas.toBlob(r, 'image/png'))
            URL.revokeObjectURL(svgUrl)
            return await pngBlob.arrayBuffer()
          }
          return await blob.arrayBuffer()
        }catch(e){ console.error('fetchImage failed', e); return null }
      }

      let logoBuffer = null
      if(logoSrc) logoBuffer = await fetchImageArrayBuffer(logoSrc)

      // Logo removed since we have JR FARM header already added above

      patients.forEach(p=>{
        children.push(new Paragraph({ text: `Patient: ${p.name || '(unnamed)'}`, heading: HeadingLevel.HEADING_1 }))
        children.push(new Paragraph({ text: `ID: ${p.id || ''}` }))
        if(p.tag) children.push(new Paragraph({ text: `Tag: ${p.tag}` }))
        if(p.owner?.name) children.push(new Paragraph({ text: `Owner: ${p.owner.name}` }))
        children.push(new Paragraph({ text: `Created: ${p.createdAt || ''}` }))
        (p.notes||[]).forEach(n=> children.push(new Paragraph({ text: `${n.createdAt || ''} — ${n.subjective || ''}` })))
        // page break
        children.push(new Paragraph({ children: [ new TextRun({ text: '', break: 1 }) ] }))
      })
      doc.addSection({ children })
      const packer = new Packer()
      const blob = await packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `full-health-records.docx`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    }catch(e){ console.error('docx export failed', e); alert('DOCX export requires the `docx` package. Please install it (npm install docx) and reload.') }
  }

  function downloadDocForPatient(patientId){
    const p = patients.find(x=> x.id === patientId)
    if(!p) return alert('Patient not found')
    const html = generatePatientHtml(p)
    const blob = new Blob([html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `patient-${patientId}.doc`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  function openPatientReport(patientId){
    const p = patients.find(x=> x.id === patientId)
    if(!p) return alert('Patient not found')
    const html = generatePatientHtml(p)
    const w = window.open('', '_blank')
    if(!w) return alert('Popup blocked — allow popups to preview the report')
    w.document.open()
    w.document.write(html)
    w.document.close()
  }

  function downloadAllPatientsDoc(){
    const combined = `<!doctype html><html><head><meta charset="utf-8"><title>Full health dataset</title></head><body>${patients.map(p=> generatePatientHtml(p)).join('<div style="page-break-after:always"></div>')}</body></html>`
    const blob = new Blob([combined], { type: 'application/msword' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `full-health-records.doc`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }
  // Section-aware CSV exporter: produces columnar CSV for some sections (vitals, vaccinations)
  function downloadSectionCsv(items, filename='export.csv'){
    try{
      const escape = v => '"' + String(v ?? '').replace(/"/g,'""') + '"'

      let headers = []
      let rows = []

      if(section === 'vitals'){
        headers = ['date','patientId','patientName','weight','temp','hr','notes']
        rows = items.map(it=>{
          const d = it.data || {}
          const patient = patients.find(p=>p.id===it.patientId) || {}
          const date = d.createdAt || d.date || ''
          return [date, it.patientId || '', patient.name || '', d.weight ?? '', d.temp ?? '', d.hr ?? '', d.notes || '']
        })
      } else if(section === 'vaccinations'){
        headers = ['date','patientId','patientName','vaccine','lot','notes']
        rows = items.map(it=>{
          const d = it.data || {}
          const patient = patients.find(p=>p.id===it.patientId) || {}
          const date = d.createdAt || d.date || ''
          return [date, it.patientId || '', patient.name || '', d.vaccine || d.vaccineName || '', d.lot || '', d.notes || '']
        })
      } else if(section === 'medications'){
        headers = ['date','patientId','patientName','drug','dose','notes']
        rows = items.map(it=>{
          const d = it.data || {}
          const patient = patients.find(p=>p.id===it.patientId) || {}
          const date = d.createdAt || d.date || ''
          return [date, it.patientId || '', patient.name || '', d.drug || d.name || '', d.dose || '', d.notes || '']
        })
      } else if(section === 'appointments'){
        headers = ['date','patientId','patientName','when','reason','status']
        rows = items.map(it=>{
          const d = it.data || {}
          const patient = patients.find(p=>p.id===it.patientId) || {}
          const when = d.when || d.createdAt || ''
          return [d.createdAt || '', it.patientId || '', patient.name || '', when, d.reason || '', d.status || '']
        })
      } else if(section === 'billing'){
        headers = ['date','patientId','patientName','desc','amount','paid']
        rows = items.map(it=>{
          const d = it.data || {}
          const patient = patients.find(p=>p.id===it.patientId) || {}
          return [d.createdAt || '', it.patientId || '', patient.name || '', d.desc || '', d.amount ?? '', d.paid ? 'yes' : 'no']
        })
      } else {
        // generic fallback: id, patientId, type, data(json)
        headers = ['id','patientId','type','data']
        rows = items.map(it=> [it.id || '', it.patientId || '', it.type || '', JSON.stringify(it.data || {})])
      }

      const csv = [headers, ...rows].map(r=> r.map(escape).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }catch(e){ console.error('csv export failed', e) }
  }
  const [section, setSection] = useState('patients')
  const [patientFilter, setPatientFilter] = useState('')
  const [expanded, setExpanded] = useState(null)

  const sections = [
    { id:'patients', label:'Patients / Records' },
    { id:'appointments', label:'Appointments' },
    { id:'prescriptions', label:'Prescriptions' },
    { id:'vitals', label:'Vitals' },
    { id:'vaccinations', label:'Vaccinations' },
    { id:'medications', label:'Medications' },
    { id:'attachments', label:'Attachments' },
    { id:'inventory', label:'Inventory' },
    { id:'billing', label:'Billing' }
  ]

  function getItems(){
    if(section==='patients') return patients.map(p=> ({ id: p.id, patientId: p.id, data: p, type: 'patient' }))
    if(section==='appointments') return appointments.map(a=> ({ id: a.id, patientId: a.patientId, data: a, type:'appointment' }))
    if(section==='prescriptions') return prescriptions.map(r=> ({ id: r.id, patientId: r.patientId, data: r, type:'prescription' }))
    if(section==='inventory') return inventory.map(i=> ({ id: i.id, data: i, type:'inventory' }))
    if(section==='billing') return billing.map(b=> ({ id: b.id, patientId: b.patientId, data: b, type:'billing' }))

    // per-patient sections (vitals, vaccinations, medications, attachments)
    const items = []
    patients.forEach(p=>{
      if(!patientFilter || patientFilter===p.id){
        if(section==='vitals') (p.vitals||[]).forEach(v=> items.push({ id: v.id, patientId: p.id, data: v, type:'vital' }))
        if(section==='vaccinations') (p.vaccinations||[]).forEach(v=> items.push({ id: v.id, patientId: p.id, data: v, type:'vaccination' }))
        if(section==='medications') (p.medications||[]).forEach(m=> items.push({ id: m.id, patientId: p.id, data: m, type:'medication' }))
        if(section==='attachments') (p.attachments||[]).forEach(a=> items.push({ id: a.id, patientId: p.id, data: a, type:'attachment' }))
      }
    })
    return items
  }

  const items = getItems()

  return (
    <div>
      <h4>Reports</h4>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
        <select value={section} onChange={e=>setSection(e.target.value)}>
          {sections.map(s=> <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select value={patientFilter} onChange={e=>setPatientFilter(e.target.value)}>
          <option value=''>All patients</option>
          {patients.map(p=> <option key={p.id} value={p.id}>{p.name || p.tag || p.id}</option>)}
        </select>
        {patientFilter ? <button className="tab-btn" onClick={()=> downloadPatientCsv(patientFilter)}>Download patient CSV</button> : null}
        <button onClick={()=> downloadJson(items, `${section}-export.json`)}>Download visible JSON ({items.length})</button>
  <button onClick={()=> downloadSectionCsv(items, `${section}-export.csv`)} className="tab-btn">Download section CSV</button>
        <button onClick={()=> downloadJson(patients, 'full-health-records.json')}>Download full health dataset</button>
        <button className="tab-btn" onClick={()=> downloadAllPatientsDoc()} title="Download a combined .doc of all patients">Download all patients (.doc)</button>
        {patientFilter ? (
          <>
            <button className="tab-btn" onClick={()=> openPatientReport(patientFilter)} title="Open full patient report in a new window">Open full report</button>
            <button className="tab-btn" onClick={()=> downloadDocForPatient(patientFilter)} title="Download full patient report as .doc">Download .doc</button>
          </>
        ) : null}
      </div>

      <div>
        {items.length===0 ? <div className="muted">No records for selected section.</div> : items.map(it=> (
          <div key={it.id} className="card" style={{ marginBottom:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:600 }}>{it.type === 'patient' ? (it.data.name || '(unnamed)') : `${it.type} — ${it.data.id || ''}`}</div>
                <div className="muted">Patient: {(patients.find(p=>p.id===it.patientId)||{}).name || it.patientId}</div>
              </div>
              <div>
                <button onClick={()=> setExpanded(expanded===it.id? null : it.id)} className="tab-btn">{expanded===it.id? 'Hide' : 'View'}</button>
                <button onClick={()=> downloadJson(it.data, `${it.type}-${it.id}.json`)} className="tab-btn" style={{ marginLeft:8 }}>Download</button>
                {it.type==='patient' && (
                  <>
                    <button onClick={()=> downloadJson(it.data, `patient-full-${it.id}.json`)} className="tab-btn" style={{ marginLeft:8 }}>Download full record</button>
                    <button onClick={()=> openPatientReport(it.id)} className="tab-btn" style={{ marginLeft:8 }}>Open full report</button>
                    <button onClick={()=> downloadDocForPatient(it.id)} className="tab-btn" style={{ marginLeft:8 }}>Download .doc</button>
                  </>
                )}
              </div>
            </div>
            {expanded===it.id && (
              <pre style={{ whiteSpace:'pre-wrap', marginTop:8, maxHeight:300, overflow:'auto' }}>{JSON.stringify(it.data, null, 2)}</pre>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
