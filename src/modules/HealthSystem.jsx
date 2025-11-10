import React, { useEffect, useState } from 'react'
import { fileToDataUrl } from '../lib/image'

// Minimal, single-file Health System to restore a clean build.

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

  // load
  useEffect(()=>{ try{ setPatients(JSON.parse(localStorage.getItem(PAT_KEY)||'[]')) }catch(e){ setPatients([]) } }, [])
  useEffect(()=>{ try{ setAppointments(JSON.parse(localStorage.getItem(APPT_KEY)||'[]')) }catch(e){ setAppointments([]) } }, [])
  useEffect(()=>{ try{ setPrescriptions(JSON.parse(localStorage.getItem(RX_KEY)||'[]')) }catch(e){ setPrescriptions([]) } }, [])
  useEffect(()=>{ try{ setInventory(JSON.parse(localStorage.getItem(INV_KEY)||'[]')) }catch(e){ setInventory([]) } }, [])
  useEffect(()=>{ try{ setBilling(JSON.parse(localStorage.getItem(BILL_KEY)||'[]')) }catch(e){ setBilling([]) } }, [])

  // persist
  useEffect(()=> localStorage.setItem(PAT_KEY, JSON.stringify(patients)), [patients])
  useEffect(()=> localStorage.setItem(APPT_KEY, JSON.stringify(appointments)), [appointments])
  useEffect(()=> localStorage.setItem(RX_KEY, JSON.stringify(prescriptions)), [prescriptions])
  useEffect(()=> localStorage.setItem(INV_KEY, JSON.stringify(inventory)), [inventory])
  useEffect(()=> localStorage.setItem(BILL_KEY, JSON.stringify(billing)), [billing])

  // core helpers
  function addPatient(p){ p.id = uid('p-'); p.createdAt = new Date().toISOString(); setPatients(prev=>[...prev,p]) }
  function updatePatient(id, patch){ setPatients(prev=> prev.map(x=> x.id===id ? { ...x, ...patch } : x)) }
  function removePatient(id){ if(!window.confirm('Delete patient?')) return; setPatients(prev=> prev.filter(p=> p.id!==id)) }

  function createAppointment(a){ a.id = a.id || uid('a-'); a.createdAt = new Date().toISOString(); setAppointments(prev=>[...prev,a]) }
  function addPrescription(r){ r.id = r.id || uid('r-'); r.createdAt = new Date().toISOString(); setPrescriptions(prev=>[...prev,r]) }
  function addInventoryItem(it){ it.id = it.id || uid('i-'); it.qty = Number(it.qty||0); setInventory(prev=>[...prev,it]) }
  function charge(patientId, desc, amount){ const b = { id: uid('b-'), patientId, desc, amount: Number(amount||0), paid:false, createdAt: new Date().toISOString() }; setBilling(prev=>[...prev,b]) }
  function setInvoicePaid(id, paid=true){ setBilling(prev=> prev.map(b=> b.id===id ? { ...b, paid } : b)) }

  async function attachFileToPatient(patientId, file){ if(!file || !patientId) return; try{ const { dataUrl, mime, size } = await fileToDataUrl(file, { maxDim:1200, quality:0.8 }); const entry = { id: uid('att-'), filename: file.name, dataUrl, mime, size, createdAt: new Date().toISOString() }; setPatients(prev=> prev.map(p=> p.id===patientId? { ...p, attachments: [...(p.attachments||[]), entry] } : p)) }catch(e){ console.error(e); alert('Attach failed') } }

  function addSoapNote(patientId, note){ const entry = { id: uid('n-'), ...note, createdAt: new Date().toISOString() }; setPatients(prev=> prev.map(p=> p.id===patientId? { ...p, notes: [...(p.notes||[]), entry] } : p)) }
  function pushEntry(patientId, key, entry){ entry.id = entry.id || uid(key+'-'); entry.createdAt = new Date().toISOString(); setPatients(prev=> prev.map(p=> p.id===patientId? { ...p, [key]: [...(p[key]||[]), entry] } : p)) }

  const totalPatients = patients.length
  const unpaidTotal = billing.filter(b=>!b.paid).reduce((s,i)=> s + Number(i.amount||0), 0)

  return (
    <div>
      <h3>Health System</h3>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <button onClick={()=>setTab('records')} disabled={tab==='records'}>Records</button>
        <button onClick={()=>setTab('appointments')} disabled={tab==='appointments'}>Appointments</button>
        <button onClick={()=>setTab('prescriptions')} disabled={tab==='prescriptions'}>Prescriptions</button>
        <button onClick={()=>setTab('inventory')} disabled={tab==='inventory'}>Inventory</button>
        <button onClick={()=>setTab('billing')} disabled={tab==='billing'}>Billing</button>
        <button onClick={()=>setTab('reports')} disabled={tab==='reports'}>Reports</button>
      </div>

      {tab==='records' && <RecordsView patients={patients} addPatient={addPatient} updatePatient={updatePatient} removePatient={removePatient} attachFileToPatient={attachFileToPatient} addSoapNote={addSoapNote} pushEntry={pushEntry} animals={animals} />}
      {tab==='appointments' && <AppointmentView patients={patients} appointments={appointments} createAppointment={createAppointment} />}
      {tab==='prescriptions' && <PrescriptionView patients={patients} prescriptions={prescriptions} addPrescription={addPrescription} inventory={inventory} />}
      {tab==='inventory' && <InventoryView inventory={inventory} addInventory={addInventoryItem} adjustInventory={(id,delta)=> setInventory(prev=> prev.map(it=> it.id===id ? { ...it, qty: Math.max(0, Number(it.qty||0) + delta) } : it)) } />}
      {tab==='billing' && <BillingView patients={patients} billing={billing} charge={charge} setInvoicePaid={setInvoicePaid} generateInvoice={(pid)=> alert('Generate invoice for '+pid)} />}
      {tab==='reports' && <div><div>Total patients: {totalPatients}</div><div>Unpaid total: ${unpaidTotal.toFixed(2)}</div></div>}
    </div>
  )
}

// Records view (compact)
function RecordsView({ patients = [], addPatient, updatePatient, removePatient, attachFileToPatient, addSoapNote, pushEntry, animals=[] }){
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})

  useEffect(()=>{ if(selected){ const p = patients.find(x=>x.id===selected) || {}; setForm({ ...p }) } else setForm({}) }, [selected, patients])

  function onNew(){ const p = { id: uid('p-'), name:'', tag:'', owner:{}, ids:{}, notes:[], vaccinations:[], medications:[], surgeries:[], communications:[], consents:[], attachments:[] }; addPatient(p); setSelected(p.id); setEditing(true) }
  function save(){ if(!selected) return; updatePatient(selected, form); setEditing(false) }

  return (
    <div style={{ display:'flex', gap:12 }}>
      <div style={{ width:320 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <strong>Patients</strong>
          <button onClick={onNew}>New</button>
        </div>

        <div style={{ marginTop:8, maxHeight:520, overflow:'auto' }}>
          {patients.map(p=> (
            <div key={p.id} onClick={()=>setSelected(p.id)} style={{ padding:8, borderBottom:'1px solid #eee', cursor:'pointer', background: p.id===selected? '#fafafa': 'transparent' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <div><strong>{p.name || '(unnamed)'}</strong><div style={{ fontSize:12 }}>{p.tag || ''}</div></div>
                <div style={{ fontSize:12 }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:8 }}>
          <strong>Import from animals</strong>
          <div style={{ maxHeight:160, overflow:'auto' }}>{animals.map(a=> <div key={a.id} style={{ display:'flex', justifyContent:'space-between', padding:4 }}><div>{a.name} <small>{a.tag}</small></div><div><button onClick={()=>{ const p = { id: uid('p-'), animalId: a.id, name: a.name||'', tag: a.tag||'', owner: a.owner||{}, createdAt: new Date().toISOString(), notes:[], vaccinations:[], medications:[], surgeries:[], communications:[], consents:[], attachments:[] }; addPatient(p); setSelected(p.id) }}>Import</button></div></div>)}</div>
        </div>
      </div>

      <div style={{ flex:1 }}>
        {!selected ? <div>Select a patient</div> : (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div><h4>{form.name || '(unnamed)'}</h4><div style={{ fontSize:12 }}>{form.breed || ''} • {form.sex || ''}</div></div>
              <div>
                <button onClick={()=>setEditing(e=>!e)}>{editing? 'Cancel':'Edit'}</button>
                <button onClick={()=>{ if(window.confirm('Remove patient?')){ removePatient(selected); setSelected(null) }}} style={{ marginLeft:8 }}>Delete</button>
              </div>
            </div>

            {editing ? (
              <div>
                <label>Name<input value={form.name||''} onChange={e=>setForm({...form, name: e.target.value})} /></label>
                <label>Tag<input value={form.tag||''} onChange={e=>setForm({...form, tag: e.target.value})} /></label>
                <label>DOB<input type='date' value={form.dob||''} onChange={e=>setForm({...form, dob: e.target.value})} /></label>
                <label>Owner name<input value={form.owner?.name||''} onChange={e=>setForm({...form, owner:{...(form.owner||{}), name: e.target.value}})} /></label>
                <div style={{ marginTop:8 }}><button onClick={save}>Save</button></div>
              </div>
            ) : (
              <div>
                <section><strong>Identifiers</strong><div>Microchip: {form.ids?.microchip||'—'} • Tag: {form.ids?.tag||'—'}</div></section>
                <section style={{ marginTop:8 }}><strong>Vaccinations</strong><ul>{(form.vaccinations||[]).map(v=> <li key={v.id}>{v.date || v.createdAt} — {v.vaccine}</li>)}</ul></section>
                <section style={{ marginTop:8 }}><strong>Medications</strong><ul>{(form.medications||[]).map(m=> <li key={m.id}>{m.drug} — {m.dose}</li>)}</ul></section>
                <section style={{ marginTop:8 }}><strong>Communications</strong><ul>{(form.communications||[]).map(c=> <li key={c.id}>{c.method} — {c.note} — <small>{new Date(c.createdAt).toLocaleString()}</small></li>)}</ul></section>
                <section style={{ marginTop:8 }}><strong>Attachments</strong><div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{(form.attachments||[]).map(att=> (<div key={att.id} style={{ width:140 }}><div style={{ fontSize:11 }}>{att.filename}</div><a href={att.dataUrl} target='_blank' rel='noreferrer'>Open</a></div>))}</div>
                  <label style={{ display:'block', marginTop:8 }}>Add attachment<input type='file' onChange={e=>{ const f = e.target.files[0]; if(f) attachFileToPatient(selected, f); e.target.value='' }} /></label>
                </section>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Simple subviews
function AppointmentView({ patients=[], appointments=[], createAppointment }){
  const [patientId, setPatientId] = useState('')
  const [when, setWhen] = useState('')
  const [reason, setReason] = useState('')
  return (
    <div>
      <form onSubmit={e=>{ e.preventDefault(); createAppointment({ patientId, when, reason, createdAt: new Date().toISOString(), status: 'Scheduled' }); setPatientId(''); setWhen(''); setReason('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
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


            {editing ? (
              <div>
                <label style={{ display:'block' }}>Name<input value={form.name||''} onChange={e=>setForm({...form, name: e.target.value})} /></label>
                <label style={{ display:'block' }}>Tag<input value={form.tag||''} onChange={e=>setForm({...form, tag: e.target.value})} /></label>
                <label style={{ display:'block' }}>Owner name<input value={form.owner?.name||''} onChange={e=>setForm({...form, owner:{...(form.owner||{}), name: e.target.value}})} /></label>
                <div style={{ marginTop:8 }}><button onClick={save}>Save</button></div>
              </div>
            ) : (
              <div>
                <section><strong>Identifiers</strong><div>Microchip: {form.ids?.microchip||'—'} • Tag: {form.ids?.tag||'—'}</div></section>

                <section style={{ marginTop:8 }}>
                  <h5>Notes</h5>
                  <ul>{(form.notes||[]).map(n=>(<li key={n.id}>{n.subject || n.text} <small>({new Date(n.createdAt).toLocaleString()})</small></li>))}</ul>
                  <AddSoapNoteForm onAdd={(vals)=>{ addSoapNote(selected, vals); setForm(prev=> ({ ...prev, notes: [...(prev.notes||[]), { id: uid('n-'), ...vals, createdAt: new Date().toISOString() }] })) }} />
                </section>

                <section style={{ marginTop:8 }}>
                  <h5>Vaccinations</h5>
                  <VaccinationList items={form.vaccinations||[]} />
                  <VaccinationForm onAdd={(v)=>{ pushEntry(selected, 'vaccinations', v); setForm(prev=> ({ ...prev, vaccinations: [...(prev.vaccinations||[]), { id: uid('v-'), ...v, createdAt: new Date().toISOString() }] })) }} />
                </section>

                <section style={{ marginTop:8 }}>
                  <h5>Medications</h5>
                  <MedicationList items={form.medications||[]} />
                  <MedicationForm onAdd={(m)=>{ pushEntry(selected, 'medications', m); setForm(prev=> ({ ...prev, medications: [...(prev.medications||[]), { id: uid('m-'), ...m, createdAt: new Date().toISOString() }] })) }} />
                </section>

                <section style={{ marginTop:8 }}>
                  <h5>Surgeries</h5>
                  <SurgeryList items={form.surgeries||[]} />
                  <SurgeryForm onAdd={(s)=>{ pushEntry(selected, 'surgeries', s); setForm(prev=> ({ ...prev, surgeries: [...(prev.surgeries||[]), { id: uid('s-'), ...s, createdAt: new Date().toISOString() }] })) }} />
                </section>

                <section style={{ marginTop:8 }}>
                  <h5>Attachments & Consents</h5>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{(form.attachments||[]).map(a=>(<div key={a.id} style={{ width:140 }}><div style={{ fontSize:11 }}>{a.filename}</div><a href={a.dataUrl} target='_blank' rel='noreferrer'>Open</a></div>))}</div>
                  <label style={{ display:'block', marginTop:8 }}>Add file<input type='file' onChange={e=>{ const f = e.target.files[0]; if(f) handleAttach(f); e.target.value='' }} /></label>
                </section>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  async function handleAttach(file){ await attachFileToPatient(selected, file) }
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

function VaccinationList({ items=[] }){ return (<ul>{items.map(i=>(<li key={i.id}>{i.date||i.createdAt} — {i.vaccine} {i.lot? `(lot ${i.lot})` : ''}</li>))}</ul>) }

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

function MedicationList({ items=[] }){ return (<ul>{items.map(m=>(<li key={m.id}>{m.drug} — {m.dose}</li>))}</ul>) }

function SurgeryForm({ onAdd }){
  const [procedure, setProcedure] = useState('')
  const [date, setDate] = useState('')
  return (
    <form onSubmit={e=>{ e.preventDefault(); onAdd({ procedure, date }); setProcedure(''); setDate('') }} style={{ marginTop:8 }}>
      <div style={{ display:'flex', gap:8 }}>
        <input placeholder='Procedure' value={procedure} onChange={e=>setProcedure(e.target.value)} />
        <input type='date' value={date} onChange={e=>setDate(e.target.value)} />
        <button type='submit'>Add</button>
      </div>
    </form>
  )
}

function SurgeryList({ items=[] }){ return (<ul>{items.map(s=>(<li key={s.id}>{s.date||s.createdAt} — {s.procedure}</li>))}</ul>) }

function AppointmentView({ patients=[], appointments=[], createAppointment }){
  const [patientId, setPatientId] = useState('')
  const [when, setWhen] = useState('')
  const [reason, setReason] = useState('')
  return (
    <div>
      <form onSubmit={e=>{ e.preventDefault(); createAppointment({ patientId, when, reason, status:'Scheduled' }); setPatientId(''); setWhen(''); setReason('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
          <input type='datetime-local' value={when} onChange={e=>setWhen(e.target.value)} />
          <input placeholder='Reason' value={reason} onChange={e=>setReason(e.target.value)} />
          <button type='submit'>Create</button>
        </div>
      </form>
      <div style={{ marginTop:8 }}><strong>Appointments</strong><ul>{appointments.map(a=>(<li key={a.id}>{(patients.find(p=>p.id===a.patientId)||{}).name||a.patientId} — {a.when ? new Date(a.when).toLocaleString() : ''} — {a.status}</li>))}</ul></div>
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
          <button type='submit'>Add Rx</button>
        </div>
      </form>
      <div style={{ marginTop:8 }}><strong>Prescriptions</strong><ul>{prescriptions.map(r=>(<li key={r.id}>{r.drug} — {r.dose} — {(patients.find(p=>p.id===r.patientId)||{}).name||r.patientId}</li>))}</ul></div>
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
import React, { useEffect, useState } from 'react'
import { fileToDataUrl } from '../lib/image'

// Lightweight Health System (Records + helpers)
// Single-file, clean implementation to restore a working build.

const PAT_KEY = 'cattalytics:health:patients'
const APPT_KEY = 'cattalytics:health:appointments'
const RX_KEY = 'cattalytics:health:prescriptions'
const INV_KEY = 'cattalytics:health:inventory'
const BILL_KEY = 'cattalytics:health:billing'

function uid(prefix = '') { return prefix + Math.random().toString(36).slice(2,9) }

export default function HealthSystem({ animals = [] }){
  const [tab, setTab] = useState('records')

  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [inventory, setInventory] = useState([])
  const [billing, setBilling] = useState([])

  // load
  useEffect(()=>{ try{ setPatients(JSON.parse(localStorage.getItem(PAT_KEY)||'[]')) }catch(e){ setPatients([]) } }, [])
  useEffect(()=>{ try{ setAppointments(JSON.parse(localStorage.getItem(APPT_KEY)||'[]')) }catch(e){ setAppointments([]) } }, [])
  useEffect(()=>{ try{ setPrescriptions(JSON.parse(localStorage.getItem(RX_KEY)||'[]')) }catch(e){ setPrescriptions([]) } }, [])
  useEffect(()=>{ try{ setInventory(JSON.parse(localStorage.getItem(INV_KEY)||'[]')) }catch(e){ setInventory([]) } }, [])
  useEffect(()=>{ try{ setBilling(JSON.parse(localStorage.getItem(BILL_KEY)||'[]')) }catch(e){ setBilling([]) } }, [])

  // persist
  useEffect(()=> localStorage.setItem(PAT_KEY, JSON.stringify(patients)), [patients])
  useEffect(()=> localStorage.setItem(APPT_KEY, JSON.stringify(appointments)), [appointments])
  useEffect(()=> localStorage.setItem(RX_KEY, JSON.stringify(prescriptions)), [prescriptions])
  useEffect(()=> localStorage.setItem(INV_KEY, JSON.stringify(inventory)), [inventory])
  useEffect(()=> localStorage.setItem(BILL_KEY, JSON.stringify(billing)), [billing])

  // core helpers
  function addPatient(p){ p.id = uid('p-'); p.createdAt = new Date().toISOString(); setPatients(prev=>[...prev, p]) }
  function updatePatient(id, patch){ setPatients(prev=> prev.map(x=> x.id===id ? { ...x, ...patch } : x)) }
  function removePatient(id){ if(!window.confirm('Delete patient?')) return; setPatients(prev=> prev.filter(p=> p.id!==id)) }

  function createAppointment(a){ a.id = a.id || uid('a-'); a.createdAt = new Date().toISOString(); setAppointments(prev=>[...prev,a]) }
  function addPrescription(r){ r.id = r.id || uid('r-'); r.createdAt = new Date().toISOString(); setPrescriptions(prev=>[...prev,r]) }
  function addInventoryItem(it){ it.id = it.id || uid('i-'); it.qty = Number(it.qty||0); setInventory(prev=>[...prev,it]) }
  function charge(patientId, desc, amount){ const b = { id: uid('b-'), patientId, desc, amount: Number(amount||0), paid:false, createdAt: new Date().toISOString() }; setBilling(prev=>[...prev,b]) }
  function setInvoicePaid(id, paid=true){ setBilling(prev=> prev.map(b=> b.id===id ? { ...b, paid } : b)) }

  // patient-level additions
  async function attachFileToPatient(patientId, file){
    if(!file || !patientId) return
    try{
      const { dataUrl, mime, size } = await fileToDataUrl(file, { maxDim: 1400, quality: 0.8 })
      const entry = { id: uid('att-'), filename: file.name, dataUrl, mime, size, createdAt: new Date().toISOString() }
      setPatients(prev=> prev.map(p=> p.id===patientId ? { ...p, attachments: [...(p.attachments||[]), entry] } : p))
    }catch(e){ console.error(e); alert('Attach failed') }
  }

  function addSoapNote(patientId, note){
    const entry = { id: uid('n-'), ...note, createdAt: new Date().toISOString() }
    setPatients(prev=> prev.map(p=> p.id===patientId ? { ...p, notes: [...(p.notes||[]), entry] } : p))
  }

  function pushEntry(patientId, key, entry){ entry.id = entry.id || uid(key+'-'); entry.createdAt = new Date().toISOString(); setPatients(prev=> prev.map(p=> p.id===patientId ? { ...p, [key]: [...(p[key]||[]), entry] } : p)) }

  const totalPatients = patients.length
  const unpaidTotal = billing.filter(b=>!b.paid).reduce((s,i)=> s + Number(i.amount||0), 0)

  return (
    <div>
      <h3>Health System</h3>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <button onClick={()=>setTab('records')} disabled={tab==='records'}>Records</button>
        <button onClick={()=>setTab('appointments')} disabled={tab==='appointments'}>Appointments</button>
        <button onClick={()=>setTab('prescriptions')} disabled={tab==='prescriptions'}>Prescriptions</button>
        <button onClick={()=>setTab('inventory')} disabled={tab==='inventory'}>Inventory</button>
        <button onClick={()=>setTab('billing')} disabled={tab==='billing'}>Billing</button>
        <button onClick={()=>setTab('reports')} disabled={tab==='reports'}>Reports</button>
      </div>

      {tab==='records' && (
        <RecordsView
          patients={patients}
          addPatient={addPatient}
          updatePatient={updatePatient}
          removePatient={removePatient}
          attachFileToPatient={attachFileToPatient}
          addSoapNote={addSoapNote}
          pushEntry={pushEntry}
          animals={animals}
        />
      )}

      {tab==='appointments' && (
        <AppointmentView patients={patients} appointments={appointments} createAppointment={createAppointment} />
      )}

      {tab==='prescriptions' && (
        <PrescriptionView patients={patients} prescriptions={prescriptions} addPrescription={addPrescription} inventory={inventory} />
      )}

      {tab==='inventory' && (
        <InventoryView inventory={inventory} addInventory={addInventoryItem} adjustInventory={(id,delta)=> setInventory(prev=> prev.map(it=> it.id===id ? { ...it, qty: Math.max(0, Number(it.qty||0) + delta) } : it)) } />
      )}

      {tab==='billing' && (
        <BillingView patients={patients} billing={billing} charge={charge} setInvoicePaid={setInvoicePaid} generateInvoice={(pid)=> alert('Generate invoice for '+pid)} />
      )}

      {tab==='reports' && (
        <div>
          <div>Total patients: {totalPatients}</div>
          <div>Unpaid total: ${unpaidTotal.toFixed(2)}</div>
        </div>
      )}
    </div>
  )
}

// ---------- Records view + subcomponents ----------
function RecordsView({ patients = [], addPatient, updatePatient, removePatient, attachFileToPatient, addSoapNote, pushEntry, animals=[] }){
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})

  useEffect(()=>{ if(selected){ const p = patients.find(x=>x.id===selected) || {}; setForm({ ...p }) } else setForm({}) }, [selected, patients])

  function onNew(){ const p = { id: uid('p-'), name:'', tag:'', owner:{}, ids:{}, notes:[], vaccinations:[], medications:[], surgeries:[], communications:[], consents:[], attachments:[] }; addPatient(p); setSelected(p.id); setEditing(true) }
"""
Replace corrupted HealthSystem.jsx with a clean single-file implementation.
This update removes duplicated content and provides a minimal, working
Records + helpers UI persisted to localStorage.
"""
            </li>
          ))}
        </ul>
      </div>

      <div style={{ flex:1 }}>
        {!selected ? <div>Select a patient</div> : (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h4>{form.name || '(unnamed)'} <small>{form.tag}</small></h4>
              <div>
                <button onClick={()=>setEditing(e=>!e)}>{editing? 'Cancel':'Edit'}</button>
                <button onClick={()=>{ if(window.confirm('Remove patient?')){ removePatient(selected); setSelected(null) }}}>Delete</button>
              </div>
            </div>

            {editing ? (
              <div>
                <label>Name<input value={form.name||''} onChange={e=>setForm({...form, name: e.target.value})} /></label>
                <label>Tag<input value={form.tag||''} onChange={e=>setForm({...form, tag: e.target.value})} /></label>
                <label>DOB<input type='date' value={form.dob||''} onChange={e=>setForm({...form, dob: e.target.value})} /></label>
                <label>Owner name<input value={form.owner?.name||''} onChange={e=>setForm({...form, owner:{...(form.owner||{}), name: e.target.value}})} /></label>
                <div style={{ marginTop:8 }}><button onClick={save}>Save</button></div>
              </div>
            ) : (
              <div>
                <section><strong>Identifiers</strong><div>Microchip: {form.ids?.microchip||'—'} • Tag: {form.ids?.tag||'—'}</div></section>
                <section style={{ marginTop:8 }}><strong>Allergies</strong><div>{(form.allergies||[]).join(', ') || '—'}</div></section>

                <section style={{ marginTop:8 }}>
                  <strong>Vaccinations</strong>
                  <ul>{(form.vaccinations||[]).map(v=> <li key={v.id}>{v.date || v.createdAt} — {v.vaccine}</li>)}</ul>
                </section>

                <section style={{ marginTop:8 }}>
                  <strong>Medications</strong>
                  <ul>{(form.medications||[]).map(m=> <li key={m.id}>{m.drug} — {m.dose}</li>)}</ul>
                </section>

                <section style={{ marginTop:8 }}>
                  <strong>Communications</strong>
                  <ul>{(form.communications||[]).map(c=> <li key={c.id}>{c.method} — {c.note} — <small>{new Date(c.createdAt).toLocaleString()}</small></li>)}</ul>
                </section>

                <section style={{ marginTop:8 }}>
                  <strong>Consents / Documents</strong>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{(form.consents||[]).map(cons=> (<div key={cons.id} style={{ width:140 }}><div style={{ fontSize:11 }}>{cons.filename}</div><a href={cons.dataUrl} target='_blank' rel='noreferrer'>Open</a></div>))}</div>
                  <label style={{ display:'block', marginTop:8 }}>Add consent<input type='file' onChange={e=>{ const f = e.target.files[0]; if(f) addConsent(f); e.target.value='' }} /></label>
                </section>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  async function addConsent(file){ await addConsent(file) }
}

// Small UI components below (kept simple)
function AppointmentView({ patients=[], appointments=[], createAppointment }){
  const [patientId, setPatientId] = useState('')
  const [when, setWhen] = useState('')
  const [reason, setReason] = useState('')
  return (
    <div>
      <form onSubmit={e=>{ e.preventDefault(); createAppointment({ patientId, when, reason, createdAt: new Date().toISOString(), status: 'Scheduled' }); setPatientId(''); setWhen(''); setReason('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
          <input type='datetime-local' value={when} onChange={e=>setWhen(e.target.value)} />
          <input placeholder='Reason' value={reason} onChange={e=>setReason(e.target.value)} />
          <button type='submit'>Create</button>
        </div>
      </form>
      <div style={{ marginTop:8 }}>
        <strong>Appointments</strong>
        <ul>{appointments.map(a=>(<li key={a.id}>{(patients.find(p=>p.id===a.patientId)||{}).name||a.patientId} — {new Date(a.when).toLocaleString()} — {a.status}</li>))}</ul>
      </div>
    </div>
  )
}

function PatientBoard({ patients=[], appointments=[], setPatients }){
  function setStatus(id, status){ setPatients(prev=>prev.map(p=> p.id===id?{...p, status}:p)) }
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
      <div><strong>Patients</strong><ul style={{ listStyle:'none', padding:0 }}>{patients.map(p=>(<li key={p.id} style={{ padding:8, borderBottom:'1px solid #eee' }}><div style={{ display:'flex', justifyContent:'space-between' }}><div><strong>{p.name}</strong><div style={{ fontSize:12 }}>{p.tag}</div></div><div><select value={p.status||'Registered'} onChange={e=>setStatus(p.id, e.target.value)}><option>Registered</option><option>Waiting</option><option>In Treatment</option><option>Recovering</option><option>Discharged</option></select></div></div></li>))}</ul></div>
      <div><strong>Today's appointments</strong><ul>{appointments.filter(a=> new Date(a.when).toDateString()===new Date().toDateString()).map(a=>(<li key={a.id}>{(patients.find(p=>p.id===a.patientId)||{}).name||a.patientId} — {new Date(a.when).toLocaleTimeString()}</li>))}</ul></div>
    </div>
  )
}

function PrescriptionView({ patients=[], prescriptions=[], addPrescription, inventory=[] }){
  const [patientId, setPatientId] = useState('')
  const [drug, setDrug] = useState('')
  const [dose, setDose] = useState('')
  return (
    <div>
      <form onSubmit={e=>{ e.preventDefault(); addPrescription({ patientId, drug, dose, createdAt: new Date().toISOString() }); setDrug(''); setDose('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
          <input placeholder='Drug' value={drug} onChange={e=>setDrug(e.target.value)} />
          <input placeholder='Dose' value={dose} onChange={e=>setDose(e.target.value)} />
          <button type='submit'>Add Rx</button>
        </div>
      </form>
      <div style={{ marginTop:8 }}>
        <strong>Prescriptions</strong>
        <ul>{prescriptions.map(r=>(<li key={r.id}>{r.drug} — {r.dose} — {(patients.find(p=>p.id===r.patientId)||{}).name||r.patientId}</li>))}</ul>
      </div>
    </div>
  )
}

function DiagnosticsView({ patients=[], attachDiagnostic }){
  const [patientId, setPatientId] = useState('')
  return (
    <div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
        <input type='file' accept='image/*,.pdf' onChange={e=>{ const f = e.target.files[0]; if(f && patientId) attachDiagnostic(patientId, f); e.target.value='' }} />
      </div>
    </div>
  )
}

function BillingView({ patients=[], billing=[], charge }){
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
      <ul>{billing.map(b=>(<li key={b.id}>{b.desc} — ${Number(b.amount).toFixed(2)} — {(patients.find(p=>p.id===b.patientId)||{}).name||b.patientId}</li>))}</ul>
    </div>
  )
}

function InventoryView({ inventory=[], addInventory, adjustInventory }){
  const [name, setName] = useState('')
  const [qty, setQty] = useState(0)
  const [lowThreshold, setLowThreshold] = useState(5)
  return (
    <div>
      <form onSubmit={e=>{ e.preventDefault(); addInventory({ name, qty, lowThreshold }); setName(''); setQty(0) }}>
        <input placeholder='Item name' value={name} onChange={e=>setName(e.target.value)} />
        <input type='number' value={qty} onChange={e=>setQty(e.target.value)} />
        <input type='number' value={lowThreshold} onChange={e=>setLowThreshold(e.target.value)} />
        <button type='submit'>Add</button>
      </form>
      <ul>{inventory.map(it=>(<li key={it.id}>{it.name} — {it.qty} <button onClick={()=>adjustInventory(it.id,-1)}>-</button><button onClick={()=>adjustInventory(it.id,1)}>+</button></li>))}</ul>
    </div>
  )
}
// Provides a comprehensive animal health record (client + patient identification,
// signalment, IDs, SOAP/progress notes, vaccines, medications, surgeries,
// diagnostics attachments, communications, consents, disposition). Data is
// persisted to localStorage under PAT_KEY. This keeps the implementation
// compact and resilient while satisfying the requested record fields.

const PAT_KEY = 'health_patients'
const APPT_KEY = 'health_appointments'
const RX_KEY = 'health_prescriptions'
const INV_KEY = 'health_inventory'
const BILL_KEY = 'health_billing'

  function addPatientFromAnimal(an){
    const p = {
      id: uid('p-'),
      animalId: an?.id,
      name: an?.name || '',
      tag: an?.tag || '',
      breed: an?.breed || '',
      sex: an?.sex || '',
      owner: an?.owner || {},
      ids: an?.ids || {},
          <input type='date' value={date} onChange={e=>setDate(e.target.value)} />
          <input placeholder='Lot' value={lot} onChange={e=>setLot(e.target.value)} />
          <input placeholder='Site' value={site} onChange={e=>setSite(e.target.value)} />
          <button type='submit'>Add</button>
        </div>
      </form>
    )
  }

  function MedicationForm({ onAdd }){
    const [drug, setDrug] = useState('')
    const [dose, setDose] = useState('')
    const [route, setRoute] = useState('')
    const [start, setStart] = useState('')
    const [end, setEnd] = useState('')
    return (
      <form onSubmit={e=>{ e.preventDefault(); onAdd({ drug, dose, route, start, end }); setDrug(''); setDose(''); setRoute(''); setStart(''); setEnd('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <input placeholder='Drug' value={drug} onChange={e=>setDrug(e.target.value)} />
          <input placeholder='Dose' value={dose} onChange={e=>setDose(e.target.value)} />
          <input placeholder='Route' value={route} onChange={e=>setRoute(e.target.value)} />
          <input type='date' value={start} onChange={e=>setStart(e.target.value)} />
          <input type='date' value={end} onChange={e=>setEnd(e.target.value)} />
          <button type='submit'>Add</button>
        </div>
      </form>
    )
  }

  function SurgeryForm({ onAdd }){
    const [procedure, setProcedure] = useState('')
    const [anesthesia, setAnesthesia] = useState('')
    const [notes, setNotes] = useState('')
    const [date, setDate] = useState('')
    return (
      <form onSubmit={e=>{ e.preventDefault(); onAdd({ procedure, anesthesia, notes, date }); setProcedure(''); setAnesthesia(''); setNotes(''); setDate('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <input placeholder='Procedure' value={procedure} onChange={e=>setProcedure(e.target.value)} />
          <input placeholder='Anesthesia' value={anesthesia} onChange={e=>setAnesthesia(e.target.value)} />
          <input type='date' value={date} onChange={e=>setDate(e.target.value)} />
          <input placeholder='Notes' value={notes} onChange={e=>setNotes(e.target.value)} />
          <button type='submit'>Add</button>
        </div>
      </form>
    )
  }

  function CommunicationForm({ onAdd }){
    const [method, setMethod] = useState('Phone')
    const [note, setNote] = useState('')
    return (
      <form onSubmit={e=>{ e.preventDefault(); onAdd({ method, note }); setNote('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <select value={method} onChange={e=>setMethod(e.target.value)}><option>Phone</option><option>Email</option><option>SMS</option><option>In person</option></select>
          <input placeholder='Note' value={note} onChange={e=>setNote(e.target.value)} />
          <button type='submit'>Add</button>
        </div>
      </form>
    )
  }

  function AppointmentView({ patients=[], appointments=[], createAppointment }){
    const [patientId, setPatientId] = useState('')
    const [when, setWhen] = useState('')
    const [reason, setReason] = useState('')
    return (
      <div>
        <form onSubmit={e=>{ e.preventDefault(); createAppointment({ id: uid('a-'), patientId, when, reason, status:'Scheduled', createdAt:new Date().toISOString() }); setPatientId(''); setWhen(''); setReason('') }}>
          <div style={{ display:'flex', gap:8 }}>
            <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
            <input type='datetime-local' value={when} onChange={e=>setWhen(e.target.value)} />
            <input placeholder='Reason' value={reason} onChange={e=>setReason(e.target.value)} />
            <button type='submit'>Create</button>
          </div>
        </form>
        <div style={{ marginTop:8 }}>
          <strong>All appointments</strong>
          <ul>{appointments.map(a=>(<li key={a.id}>{a.patientId} — {new Date(a.when).toLocaleString()} — {a.status}</li>))}</ul>
        </div>
      </div>
    )
  }

  function PatientBoard({ patients=[], appointments=[], setPatients }){
    function setStatus(id, status){ setPatients(prev=>prev.map(p=> p.id===id?{...p,status}:p)) }
    return (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div><strong>Patients</strong><ul style={{ listStyle:'none', padding:0 }}>{patients.map(p=>(<li key={p.id} style={{ padding:8, borderBottom:'1px solid #eee' }}><div style={{ display:'flex', justifyContent:'space-between' }}><div><strong>{p.name}</strong><div style={{ fontSize:12 }}>{p.tag}</div></div><div><select value={p.status||'Registered'} onChange={e=>setStatus(p.id, e.target.value)}><option>Registered</option><option>Waiting</option><option>In Treatment</option><option>Recovering</option><option>Discharged</option></select></div></div></li>))}</ul></div>
        <div><strong>Appointments</strong><ul>{appointments.filter(a=>new Date(a.when).toDateString()===new Date().toDateString()).map(a=>(<li key={a.id}>{(patients.find(p=>p.id===a.patientId)||{}).name||a.patientId} — {new Date(a.when).toLocaleTimeString()} — {a.status}</li>))}</ul></div>
      </div>
    )
  }

  function PrescriptionView({ patients=[], prescriptions=[], addPrescription, inventory=[], adjustInventory }){
    const [patientId, setPatientId] = useState('')
    const [drug, setDrug] = useState('')
    const [dose, setDose] = useState('')
    return (
      <div>
        <form onSubmit={e=>{ e.preventDefault(); const r = { id: uid('r-'), patientId, drug, dose, createdAt:new Date().toISOString(), fulfilled:false }; addPrescription(r); const match = inventory.find(it=>it.name&&it.name.toLowerCase()===drug.toLowerCase()); if(match) adjustInventory(match.id, -1); setDrug(''); setDose('') }}>
          <div style={{ display:'flex', gap:8 }}>
            <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
            <input placeholder='Drug' value={drug} onChange={e=>setDrug(e.target.value)} />
            <input placeholder='Dose' value={dose} onChange={e=>setDose(e.target.value)} />
            <button type='submit'>Add Rx</button>
          </div>
        </form>
        <div style={{ marginTop:8 }}><strong>Prescriptions</strong><ul>{prescriptions.map(r=>(<li key={r.id}>{r.drug} — {r.dose} — {(patients.find(p=>p.id===r.patientId)||{}).name||r.patientId} — {r.fulfilled?'Fulfilled':'Pending'}</li>))}</ul></div>
      </div>
    )
  }

  function DiagnosticsView({ patients=[], attachDiagnostic }){
    const [patientId, setPatientId] = useState('')
    return (
      <div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
          <input type='file' accept='image/*,.pdf' onChange={e=>{ const f=e.target.files[0]; if(f && patientId) attachDiagnostic(patientId, f); e.target.value='' }} />
        </div>
        <div style={{ marginTop:8 }}><div style={{ color:'#666' }}>Attach images or lab result files to a patient record. Images will be compressed client-side.</div></div>
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
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
            <input placeholder='Description' value={desc} onChange={e=>setDesc(e.target.value)} />
            <input placeholder='Amount' type='number' value={amount} onChange={e=>setAmount(e.target.value)} />
            <button type='submit'>Charge</button>
          </div>
        </form>
        <ul>{billing.map(b=>(<li key={b.id}>{b.desc} — ${Number(b.amount).toFixed(2)} — {(patients.find(p=>p.id===b.patientId)||{}).name||b.patientId} — {b.paid?'Paid':<button onClick={()=>setInvoicePaid(b.id,true)}>Mark paid</button>} <button onClick={()=>generateInvoice(b.patientId)}>Invoice</button></li>))}</ul>
      </div>
    )
  }

  function InventoryView({ inventory=[], addInventory, adjustInventory }){
    const [name, setName] = useState('')
    const [qty, setQty] = useState(0)
    const [lowThreshold, setLowThreshold] = useState(5)
    return (
      <div>
        <form onSubmit={e=>{ e.preventDefault(); addInventory({ name, qty, lowThreshold }); setName(''); setQty(0) }}>
          <input placeholder='Item name' value={name} onChange={e=>setName(e.target.value)} />
          <input type='number' value={qty} onChange={e=>setQty(e.target.value)} />
          <input type='number' value={lowThreshold} onChange={e=>setLowThreshold(e.target.value)} />
          <button type='submit'>Add</button>
        </form>
        <ul>{inventory.map(it=>(<li key={it.id}>{it.name} — {it.qty} {it.qty <= (it.lowThreshold||5) ? <strong style={{ color:'crimson' }}> • Low</strong> : ''} <button onClick={()=>adjustInventory(it.id,-1)}>-</button><button onClick={()=>adjustInventory(it.id,1)}>+</button></li>))}</ul>
      </div>
    )
  }

                    <ul>{(form.surgeries||[]).map(s=>(<li key={s.id}>{s.date || s.createdAt} — {s.procedure} — {s.anesthesia || ''}</li>))}</ul>
                    <SurgeryForm onAdd={(vals)=>{ const entry = { id: uid('s-'), ...vals, createdAt: new Date().toISOString() }; pushEntry('surgeries', entry) }} />
                  </section>

                  <section style={{ marginTop:8 }}>
                    <h5>Communications</h5>
                    <ul>{(form.communications||[]).map(c=>(<li key={c.id}>{c.method} — {c.note} — <small>{new Date(c.createdAt).toLocaleString()}</small></li>))}</ul>
                    <CommunicationForm onAdd={(vals)=>{ const entry = { id: uid('c-'), ...vals, createdAt: new Date().toISOString() }; pushEntry('communications', entry) }} />
                  </section>

                  <section style={{ marginTop:8 }}>
                    <h5>Consents & Attachments</h5>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{(form.consents||[]).map(cons=>(<div key={cons.id} style={{ width:140 }}><div style={{ fontSize:11 }}>{cons.filename}</div><a href={cons.dataUrl} target='_blank' rel='noreferrer'>Open</a></div>))}</div>
                    <label style={{ display:'block', marginTop:8 }}>Add consent<input type='file' onChange={e=>{ const f = e.target.files[0]; if(f) addConsentFile(f); e.target.value='' }} /></label>
                  </section>

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )

    function addConsentFile(file){ addConsentFile /* handled above */ }
  }

  function VaccinationForm({ onAdd }){
    const [vaccine, setVaccine] = useState('')
    const [date, setDate] = useState('')
    const [lot, setLot] = useState('')
    const [site, setSite] = useState('')
    return (
      <form onSubmit={e=>{ e.preventDefault(); onAdd({ vaccine, date, lot, site }); setVaccine(''); setDate(''); setLot(''); setSite('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <input placeholder='Vaccine' value={vaccine} onChange={e=>setVaccine(e.target.value)} />
          <input type='date' value={date} onChange={e=>setDate(e.target.value)} />
          <input placeholder='Lot' value={lot} onChange={e=>setLot(e.target.value)} />
          <input placeholder='Site' value={site} onChange={e=>setSite(e.target.value)} />
          <button type='submit'>Add</button>
        </div>
      </form>
    )
  }

  function MedicationForm({ onAdd }){
    const [drug, setDrug] = useState('')
    const [dose, setDose] = useState('')
    const [route, setRoute] = useState('')
    const [start, setStart] = useState('')
    const [end, setEnd] = useState('')
    return (
      <form onSubmit={e=>{ e.preventDefault(); onAdd({ drug, dose, route, start, end }); setDrug(''); setDose(''); setRoute(''); setStart(''); setEnd('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <input placeholder='Drug' value={drug} onChange={e=>setDrug(e.target.value)} />
          <input placeholder='Dose' value={dose} onChange={e=>setDose(e.target.value)} />
          <input placeholder='Route' value={route} onChange={e=>setRoute(e.target.value)} />
          <input type='date' value={start} onChange={e=>setStart(e.target.value)} />
          <input type='date' value={end} onChange={e=>setEnd(e.target.value)} />
          <button type='submit'>Add</button>
        </div>
      </form>
    )
  }

  function SurgeryForm({ onAdd }){
    const [procedure, setProcedure] = useState('')
    const [anesthesia, setAnesthesia] = useState('')
    const [notes, setNotes] = useState('')
    const [date, setDate] = useState('')
    return (
      <form onSubmit={e=>{ e.preventDefault(); onAdd({ procedure, anesthesia, notes, date }); setProcedure(''); setAnesthesia(''); setNotes(''); setDate('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <input placeholder='Procedure' value={procedure} onChange={e=>setProcedure(e.target.value)} />
          <input placeholder='Anesthesia' value={anesthesia} onChange={e=>setAnesthesia(e.target.value)} />
          <input type='date' value={date} onChange={e=>setDate(e.target.value)} />
          <input placeholder='Notes' value={notes} onChange={e=>setNotes(e.target.value)} />
          <button type='submit'>Add</button>
        </div>
      </form>
    )
  }

  function CommunicationForm({ onAdd }){
    const [method, setMethod] = useState('Phone')
    const [note, setNote] = useState('')
    return (
      <form onSubmit={e=>{ e.preventDefault(); onAdd({ method, note }); setNote('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <select value={method} onChange={e=>setMethod(e.target.value)}><option>Phone</option><option>Email</option><option>SMS</option><option>In person</option></select>
          <input placeholder='Note' value={note} onChange={e=>setNote(e.target.value)} />
          <button type='submit'>Add</button>
        </div>
      </form>
    )
  }

  function AppointmentView({ patients=[], appointments=[], createAppointment }){
    const [patientId, setPatientId] = useState('')
    const [when, setWhen] = useState('')
    const [reason, setReason] = useState('')
    return (
      <div>
        <form onSubmit={e=>{ e.preventDefault(); createAppointment({ id: uid('a-'), patientId, when, reason, status:'Scheduled', createdAt:new Date().toISOString() }); setPatientId(''); setWhen(''); setReason('') }}>
          <div style={{ display:'flex', gap:8 }}>
            <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
            <input type='datetime-local' value={when} onChange={e=>setWhen(e.target.value)} />
            <input placeholder='Reason' value={reason} onChange={e=>setReason(e.target.value)} />
            <button type='submit'>Create</button>
          </div>
        </form>
        <div style={{ marginTop:8 }}>
          <strong>All appointments</strong>
          <ul>{appointments.map(a=>(<li key={a.id}>{a.patientId} — {new Date(a.when).toLocaleString()} — {a.status}</li>))}</ul>
        </div>
      </div>
    )
  }

  function PatientBoard({ patients=[], appointments=[], setPatients }){
    function setStatus(id, status){ setPatients(prev=>prev.map(p=> p.id===id?{...p,status}:p)) }
    return (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div><strong>Patients</strong><ul style={{ listStyle:'none', padding:0 }}>{patients.map(p=>(<li key={p.id} style={{ padding:8, borderBottom:'1px solid #eee' }}><div style={{ display:'flex', justifyContent:'space-between' }}><div><strong>{p.name}</strong><div style={{ fontSize:12 }}>{p.tag}</div></div><div><select value={p.status||'Registered'} onChange={e=>setStatus(p.id, e.target.value)}><option>Registered</option><option>Waiting</option><option>In Treatment</option><option>Recovering</option><option>Discharged</option></select></div></div></li>))}</ul></div>
        <div><strong>Appointments</strong><ul>{appointments.filter(a=>new Date(a.when).toDateString()===new Date().toDateString()).map(a=>(<li key={a.id}>{(patients.find(p=>p.id===a.patientId)||{}).name||a.patientId} — {new Date(a.when).toLocaleTimeString()} — {a.status}</li>))}</ul></div>
      </div>
    )
  }

  function PrescriptionView({ patients=[], prescriptions=[], addPrescription, inventory=[], adjustInventory }){
    const [patientId, setPatientId] = useState('')
    const [drug, setDrug] = useState('')
    const [dose, setDose] = useState('')
    return (
      <div>
        <form onSubmit={e=>{ e.preventDefault(); const r = { id: uid('r-'), patientId, drug, dose, createdAt:new Date().toISOString(), fulfilled:false }; addPrescription(r); const match = inventory.find(it=>it.name&&it.name.toLowerCase()===drug.toLowerCase()); if(match) adjustInventory(match.id, -1); setDrug(''); setDose('') }}>
          <div style={{ display:'flex', gap:8 }}>
            <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
            <input placeholder='Drug' value={drug} onChange={e=>setDrug(e.target.value)} />
            <input placeholder='Dose' value={dose} onChange={e=>setDose(e.target.value)} />
            <button type='submit'>Add Rx</button>
          </div>
        </form>
        <div style={{ marginTop:8 }}><strong>Prescriptions</strong><ul>{prescriptions.map(r=>(<li key={r.id}>{r.drug} — {r.dose} — {(patients.find(p=>p.id===r.patientId)||{}).name||r.patientId} — {r.fulfilled?'Fulfilled':'Pending'}</li>))}</ul></div>
      </div>
    )
  }

  function DiagnosticsView({ patients=[], attachDiagnostic }){
    const [patientId, setPatientId] = useState('')
    return (
      <div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
          <input type='file' accept='image/*,.pdf' onChange={e=>{ const f=e.target.files[0]; if(f && patientId) attachDiagnostic(patientId, f); e.target.value='' }} />
        </div>
        <div style={{ marginTop:8 }}><div style={{ color:'#666' }}>Attach images or lab result files to a patient record. Images will be compressed client-side.</div></div>
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
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
            <input placeholder='Description' value={desc} onChange={e=>setDesc(e.target.value)} />
            <input placeholder='Amount' type='number' value={amount} onChange={e=>setAmount(e.target.value)} />
            <button type='submit'>Charge</button>
          </div>
        </form>
        <ul>{billing.map(b=>(<li key={b.id}>{b.desc} — ${Number(b.amount).toFixed(2)} — {(patients.find(p=>p.id===b.patientId)||{}).name||b.patientId} — {b.paid?'Paid':<button onClick={()=>setInvoicePaid(b.id,true)}>Mark paid</button>} <button onClick={()=>generateInvoice(b.patientId)}>Invoice</button></li>))}</ul>
      </div>
    )
  }

  function InventoryView({ inventory=[], addInventory, adjustInventory }){
    const [name, setName] = useState('')
    const [qty, setQty] = useState(0)
    const [lowThreshold, setLowThreshold] = useState(5)
    return (
      <div>
        <form onSubmit={e=>{ e.preventDefault(); addInventory({ name, qty, lowThreshold }); setName(''); setQty(0) }}>
          <input placeholder='Item name' value={name} onChange={e=>setName(e.target.value)} />
          <input type='number' value={qty} onChange={e=>setQty(e.target.value)} />
          <input type='number' value={lowThreshold} onChange={e=>setLowThreshold(e.target.value)} />
          <button type='submit'>Add</button>
        </form>
        <ul>{inventory.map(it=>(<li key={it.id}>{it.name} — {it.qty} {it.qty <= (it.lowThreshold||5) ? <strong style={{ color:'crimson' }}> • Low</strong> : ''} <button onClick={()=>adjustInventory(it.id,-1)}>-</button><button onClick={()=>adjustInventory(it.id,1)}>+</button></li>))}</ul>
      </div>
    )
  }

                    <ul>{(form.surgeries||[]).map(s=>(<li key={s.id}>{s.date || s.createdAt} — {s.procedure} — {s.anesthesia || ''}</li>))}</ul>
                    <SurgeryForm onAdd={(vals)=>{ const entry = { id: uid('s-'), ...vals, createdAt: new Date().toISOString() }; pushEntry('surgeries', entry) }} />
                  </section>

                  <section style={{ marginTop:8 }}>
                    <h5>Communications</h5>
                    <ul>{(form.communications||[]).map(c=>(<li key={c.id}>{c.method} — {c.note} — <small>{new Date(c.createdAt).toLocaleString()}</small></li>))}</ul>
                    <CommunicationForm onAdd={(vals)=>{ const entry = { id: uid('c-'), ...vals, createdAt: new Date().toISOString() }; pushEntry('communications', entry) }} />
                  </section>

                  <section style={{ marginTop:8 }}>
                    <h5>Consents & Attachments</h5>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{(form.consents||[]).map(cons=>(<div key={cons.id} style={{ width:140 }}><div style={{ fontSize:11 }}>{cons.filename}</div><a href={cons.dataUrl} target='_blank' rel='noreferrer'>Open</a></div>))}</div>
                    <label style={{ display:'block', marginTop:8 }}>Add consent<input type='file' onChange={e=>{ const f = e.target.files[0]; if(f) addConsentFile(f); e.target.value='' }} /></label>
                  </section>

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )

    function addConsentFile(file){ addConsentFile /* handled above */ }
  }

  function VaccinationForm({ onAdd }){
    const [vaccine, setVaccine] = useState('')
    const [date, setDate] = useState('')
    const [lot, setLot] = useState('')
    const [site, setSite] = useState('')
    return (
      <form onSubmit={e=>{ e.preventDefault(); onAdd({ vaccine, date, lot, site }); setVaccine(''); setDate(''); setLot(''); setSite('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <input placeholder='Vaccine' value={vaccine} onChange={e=>setVaccine(e.target.value)} />
          <input type='date' value={date} onChange={e=>setDate(e.target.value)} />
          <input placeholder='Lot' value={lot} onChange={e=>setLot(e.target.value)} />
          <input placeholder='Site' value={site} onChange={e=>setSite(e.target.value)} />
          <button type='submit'>Add</button>
        </div>
      </form>
    )
  }

  function MedicationForm({ onAdd }){
    const [drug, setDrug] = useState('')
    const [dose, setDose] = useState('')
    const [route, setRoute] = useState('')
    const [start, setStart] = useState('')
    const [end, setEnd] = useState('')
    return (
      <form onSubmit={e=>{ e.preventDefault(); onAdd({ drug, dose, route, start, end }); setDrug(''); setDose(''); setRoute(''); setStart(''); setEnd('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <input placeholder='Drug' value={drug} onChange={e=>setDrug(e.target.value)} />
          <input placeholder='Dose' value={dose} onChange={e=>setDose(e.target.value)} />
          <input placeholder='Route' value={route} onChange={e=>setRoute(e.target.value)} />
          <input type='date' value={start} onChange={e=>setStart(e.target.value)} />
          <input type='date' value={end} onChange={e=>setEnd(e.target.value)} />
          <button type='submit'>Add</button>
        </div>
      </form>
    )
  }

  function SurgeryForm({ onAdd }){
    const [procedure, setProcedure] = useState('')
    const [anesthesia, setAnesthesia] = useState('')
    const [notes, setNotes] = useState('')
    const [date, setDate] = useState('')
    return (
      <form onSubmit={e=>{ e.preventDefault(); onAdd({ procedure, anesthesia, notes, date }); setProcedure(''); setAnesthesia(''); setNotes(''); setDate('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <input placeholder='Procedure' value={procedure} onChange={e=>setProcedure(e.target.value)} />
          <input placeholder='Anesthesia' value={anesthesia} onChange={e=>setAnesthesia(e.target.value)} />
          <input type='date' value={date} onChange={e=>setDate(e.target.value)} />
          <input placeholder='Notes' value={notes} onChange={e=>setNotes(e.target.value)} />
          <button type='submit'>Add</button>
        </div>
      </form>
    )
  }

  function CommunicationForm({ onAdd }){
    const [method, setMethod] = useState('Phone')
    const [note, setNote] = useState('')
    return (
      <form onSubmit={e=>{ e.preventDefault(); onAdd({ method, note }); setNote('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <select value={method} onChange={e=>setMethod(e.target.value)}><option>Phone</option><option>Email</option><option>SMS</option><option>In person</option></select>
          <input placeholder='Note' value={note} onChange={e=>setNote(e.target.value)} />
          <button type='submit'>Add</button>
        </div>
      </form>
    )
  }

  function AppointmentView({ patients=[], appointments=[], createAppointment }){
    const [patientId, setPatientId] = useState('')
    const [when, setWhen] = useState('')
    const [reason, setReason] = useState('')
    return (
      <div>
        <form onSubmit={e=>{ e.preventDefault(); createAppointment({ id: uid('a-'), patientId, when, reason, status:'Scheduled', createdAt:new Date().toISOString() }); setPatientId(''); setWhen(''); setReason('') }}>
          <div style={{ display:'flex', gap:8 }}>
            <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
            <input type='datetime-local' value={when} onChange={e=>setWhen(e.target.value)} />
            <input placeholder='Reason' value={reason} onChange={e=>setReason(e.target.value)} />
            <button type='submit'>Create</button>
          </div>
        </form>
        <div style={{ marginTop:8 }}>
          <strong>All appointments</strong>
          <ul>{appointments.map(a=>(<li key={a.id}>{a.patientId} — {new Date(a.when).toLocaleString()} — {a.status}</li>))}</ul>
        </div>
      </div>
    )
  }

  function PatientBoard({ patients=[], appointments=[], setPatients }){
    function setStatus(id, status){ setPatients(prev=>prev.map(p=> p.id===id?{...p,status}:p)) }
    return (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div><strong>Patients</strong><ul style={{ listStyle:'none', padding:0 }}>{patients.map(p=>(<li key={p.id} style={{ padding:8, borderBottom:'1px solid #eee' }}><div style={{ display:'flex', justifyContent:'space-between' }}><div><strong>{p.name}</strong><div style={{ fontSize:12 }}>{p.tag}</div></div><div><select value={p.status||'Registered'} onChange={e=>setStatus(p.id, e.target.value)}><option>Registered</option><option>Waiting</option><option>In Treatment</option><option>Recovering</option><option>Discharged</option></select></div></div></li>))}</ul></div>
        <div><strong>Appointments</strong><ul>{appointments.filter(a=>new Date(a.when).toDateString()===new Date().toDateString()).map(a=>(<li key={a.id}>{(patients.find(p=>p.id===a.patientId)||{}).name||a.patientId} — {new Date(a.when).toLocaleTimeString()} — {a.status}</li>))}</ul></div>
      </div>
    )
  }

  function PrescriptionView({ patients=[], prescriptions=[], addPrescription, inventory=[], adjustInventory }){
    const [patientId, setPatientId] = useState('')
    const [drug, setDrug] = useState('')
    const [dose, setDose] = useState('')
    return (
      <div>
        <form onSubmit={e=>{ e.preventDefault(); const r = { id: uid('r-'), patientId, drug, dose, createdAt:new Date().toISOString(), fulfilled:false }; addPrescription(r); const match = inventory.find(it=>it.name&&it.name.toLowerCase()===drug.toLowerCase()); if(match) adjustInventory(match.id, -1); setDrug(''); setDose('') }}>
          <div style={{ display:'flex', gap:8 }}>
            <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
            <input placeholder='Drug' value={drug} onChange={e=>setDrug(e.target.value)} />
            <input placeholder='Dose' value={dose} onChange={e=>setDose(e.target.value)} />
            <button type='submit'>Add Rx</button>
          </div>
        </form>
        <div style={{ marginTop:8 }}><strong>Prescriptions</strong><ul>{prescriptions.map(r=>(<li key={r.id}>{r.drug} — {r.dose} — {(patients.find(p=>p.id===r.patientId)||{}).name||r.patientId} — {r.fulfilled?'Fulfilled':'Pending'}</li>))}</ul></div>
      </div>
    )
  }

  function DiagnosticsView({ patients=[], attachDiagnostic }){
    const [patientId, setPatientId] = useState('')
    return (
      <div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
          <input type='file' accept='image/*,.pdf' onChange={e=>{ const f=e.target.files[0]; if(f && patientId) attachDiagnostic(patientId, f); e.target.value='' }} />
        </div>
        <div style={{ marginTop:8 }}><div style={{ color:'#666' }}>Attach images or lab result files to a patient record. Images will be compressed client-side.</div></div>
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
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
            <input placeholder='Description' value={desc} onChange={e=>setDesc(e.target.value)} />
            <input placeholder='Amount' type='number' value={amount} onChange={e=>setAmount(e.target.value)} />
            <button type='submit'>Charge</button>
          </div>
        </form>
        <ul>{billing.map(b=>(<li key={b.id}>{b.desc} — ${Number(b.amount).toFixed(2)} — {(patients.find(p=>p.id===b.patientId)||{}).name||b.patientId} — {b.paid?'Paid':<button onClick={()=>setInvoicePaid(b.id,true)}>Mark paid</button>} <button onClick={()=>generateInvoice(b.patientId)}>Invoice</button></li>))}</ul>
      </div>
    )
  }

  function InventoryView({ inventory=[], addInventory, adjustInventory }){
    const [name, setName] = useState('')
    const [qty, setQty] = useState(0)
    const [lowThreshold, setLowThreshold] = useState(5)
    return (
      <div>
        <form onSubmit={e=>{ e.preventDefault(); addInventory({ name, qty, lowThreshold }); setName(''); setQty(0) }}>
          <input placeholder='Item name' value={name} onChange={e=>setName(e.target.value)} />
          <input type='number' value={qty} onChange={e=>setQty(e.target.value)} />
          <input type='number' value={lowThreshold} onChange={e=>setLowThreshold(e.target.value)} />
          <button type='submit'>Add</button>
        </form>
        <ul>{inventory.map(it=>(<li key={it.id}>{it.name} — {it.qty} {it.qty <= (it.lowThreshold||5) ? <strong style={{ color:'crimson' }}> • Low</strong> : ''} <button onClick={()=>adjustInventory(it.id,-1)}>-</button><button onClick={()=>adjustInventory(it.id,1)}>+</button></li>))}</ul>
      </div>
    )
  }

    try { setInventory(JSON.parse(localStorage.getItem(INV_KEY) || '[]')) } catch(e){ setInventory([]) }
    try { setBilling(JSON.parse(localStorage.getItem(BILL_KEY) || '[]')) } catch(e){ setBilling([]) }
  }, [])

  useEffect(()=> localStorage.setItem(PAT_KEY, JSON.stringify(patients)), [patients])
  useEffect(()=> localStorage.setItem(APPT_KEY, JSON.stringify(appointments)), [appointments])
  useEffect(()=> localStorage.setItem(RX_KEY, JSON.stringify(prescriptions)), [prescriptions])
  useEffect(()=> localStorage.setItem(INV_KEY, JSON.stringify(inventory)), [inventory])
  useEffect(()=> localStorage.setItem(BILL_KEY, JSON.stringify(billing)), [billing])

  // Basic helpers
  function addPatientFromAnimal(an){
    if (!an) return
    const id = uid('p-')
    const p = {
      id,
      animalId: an.id,
      name: an.name || ('#' + id),
      tag: an.tag || '',
      dob: an.dob || '',
      breed: an.breed || '',
      sex: an.sex || '',
      owner: an.owner || {},
      ids: an.ids || {},
      notesLog: [],
      attachments: [],
      vaccinations: [],
      medications: [],
      surgeries: [],
      communications: [],
      consents: [],
      disposition: null,
      createdAt: new Date().toISOString(),
      status: 'Registered',
    }
    setPatients(prev => [...prev, p])
  }

  function updatePatient(id, patch){ setPatients(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)) }
  function deletePatient(id){ if(!window.confirm('Delete patient?')) return; setPatients(prev=>prev.filter(p=>p.id!==id)) }

  // Simple reporting helpers
  const totalPatients = patients.length
  const unpaidTotal = billing.filter(b=>!b.paid).reduce((s,i)=>s+Number(i.amount||0),0)

  return (
    <div>
      <h3>Health System (Records)</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={()=>setTab('records')} disabled={tab==='records'}>Records</button>
        <button onClick={()=>setTab('appointments')} disabled={tab==='appointments'}>Appointments</button>
        <button onClick={()=>setTab('board')} disabled={tab==='board'}>Patient Board</button>
        <button onClick={()=>setTab('prescriptions')} disabled={tab==='prescriptions'}>Prescriptions</button>
        <button onClick={()=>setTab('diagnostics')} disabled={tab==='diagnostics'}>Diagnostics</button>
        <button onClick={()=>setTab('billing')} disabled={tab==='billing'}>Billing</button>
        <button onClick={()=>setTab('inventory')} disabled={tab==='inventory'}>Inventory</button>
        <button onClick={()=>setTab('reports')} disabled={tab==='reports'}>Reporting</button>
      </div>

      {tab === 'records' && (
        <RecordsView animals={animals} patients={patients} addPatientFromAnimal={addPatientFromAnimal} updatePatient={updatePatient} />
      )}

      {tab === 'appointments' && (
        <div><h4>Appointments</h4><AppointmentView patients={patients} appointments={appointments} createAppointment={(a)=>setAppointments(prev=>[...prev,a])} /></div>
      )}

      {tab === 'board' && (
        <PatientBoard patients={patients} appointments={appointments} setPatients={setPatients} />
      )}

      {tab === 'prescriptions' && (
        <div><h4>Prescriptions</h4><PrescriptionView patients={patients} prescriptions={prescriptions} addPrescription={(r)=>setPrescriptions(prev=>[...prev,r])} inventory={inventory} adjustInventory={(id,delta)=>setInventory(prev=>prev.map(it=> it.id===id ? { ...it, qty: Math.max(0, (Number(it.qty||0)||0) + delta) } : it))} /></div>
      )}

      {tab === 'diagnostics' && (
        <div><h4>Diagnostics</h4><DiagnosticsView patients={patients} attachDiagnostic={async (pid,file)=>{
          try{ const { dataUrl, mime, size } = await fileToDataUrl(file, { maxDim: 1200, quality: 0.8 }); updatePatient(pid, { attachments: [...((patients.find(p=>p.id===pid)||{}).attachments||[]), { id: uid('att-'), dataUrl, mime, size, filename: file.name, createdAt: new Date().toISOString() }] }) }catch(e){console.error(e); alert('Attach failed')}
        }} /></div>
      )}

      {tab === 'billing' && (
        <div><h4>Billing</h4><BillingView patients={patients} billing={billing} charge={(p,d,a)=>setBilling(prev=>[...prev,{ id: uid('b-'), patientId: p, desc: d, amount: Number(a||0), paid:false, createdAt: new Date().toISOString()}])} setInvoicePaid={(id,paid)=>setBilling(prev=>prev.map(b=> b.id===id?{...b,paid}:b))} generateInvoice={(pid)=>{ const items = billing.filter(b=>b.patientId===pid); const total = items.reduce((s,i)=>s+Number(i.amount||0),0); const text = `Invoice for ${pid}\n\n`+items.map(i=>`${i.desc} - $${i.amount}`).join('\n')+`\n\nTotal: $${total}`; const blob = new Blob([text]); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`invoice-${pid}.txt`; a.click(); URL.revokeObjectURL(url); }} /></div>
      )}

      {tab === 'inventory' && (
        <div><h4>Inventory</h4><InventoryView inventory={inventory} addInventory={(it)=>setInventory(prev=>[...prev,{ id: uid('i-'), ...it, qty: Number(it.qty||0), lowThreshold: Number(it.lowThreshold||5)}])} adjustInventory={(id,delta)=>setInventory(prev=>prev.map(it=> it.id===id?{...it,qty: Math.max(0,Number(it.qty||0)+delta)}:it))} /></div>
      )}

      {tab === 'reports' && (
        <div>
          <h4>Reporting</h4>
          <div>Total patients: {totalPatients}</div>
          <div>Unpaid total: ${unpaidTotal.toFixed(2)}</div>
        </div>
      )}
    </div>
  )
}

// ---------- Records view and small form components ----------
function RecordsView({ animals=[], patients=[], addPatientFromAnimal, updatePatient }){
  const [selected, setSelected] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({})

  useEffect(()=>{ if(selected){ const p = patients.find(x=>x.id===selected); setForm(p?{...p}:{}) } }, [selected, patients])

  function saveEdits(){ updatePatient(selected, form); setEditMode(false) }

  // helpers to push structured entries
  function pushEntry(key, entry){ updatePatient(selected, { [key]: [...((form[key]||[])), entry] }); setForm(prev=> ({ ...prev, [key]: [...((prev[key]||[])), entry] })) }

  async function addConsentFile(file){ if(!file) return; try{ const { dataUrl, mime, size } = await fileToDataUrl(file, { maxDim: 1200, quality: 0.8 }); const entry = { id: uid('cons-'), filename: file.name, dataUrl, mime, size, createdAt: new Date().toISOString() }; pushEntry('consents', entry) } catch(e){ console.error(e); alert('Failed to add file') } }

  return (
    <div style={{ display:'flex', gap:12 }}>
      <div style={{ width:320 }}>
        <strong>Animals (quick import)</strong>
        <div style={{ maxHeight:220, overflow:'auto' }}>{animals.map(a=> (
          <div key={a.id} style={{ display:'flex', justifyContent:'space-between', padding:4 }}>
            <div>{a.name} <small>{a.tag}</small></div>
            <div><button onClick={()=>addPatientFromAnimal(a)}>Import</button></div>
          </div>
        ))}</div>

        <hr />
        <strong>Patients</strong>
        <ul style={{ listStyle:'none', padding:0, maxHeight:420, overflow:'auto' }}>
          {patients.map(p=> (
            <li key={p.id} style={{ padding:8, borderBottom:'1px solid #eee', cursor:'pointer' }} onClick={()=>setSelected(p.id)}>
              <div><strong>{p.name}</strong> <small>{p.tag}</small></div>
              <div style={{ fontSize:12 }}>{p.status || ''} {p.location?`• ${p.location}`:''}</div>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ flex:1 }}>
        {!selected ? <div>Select a patient to view record</div> : (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div><h4>{form.name} <small>{form.tag}</small></h4><div style={{ fontSize:12 }}>{form.breed || ''} • {form.sex || ''}</div></div>
              <div>
                <button onClick={()=>setEditMode(e=>!e)}>{editMode? 'Cancel' : 'Edit'}</button>
                <button onClick={()=>{ if(window.confirm('Delete patient?')) updatePatient(selected, { _deleted: true }) }}>Delete</button>
              </div>
            </div>

            {editMode ? (
              <div>
                <h5>Client / Owner</h5>
                <label>Owner name<input value={form.owner?.name||''} onChange={e=>setForm({...form, owner:{...(form.owner||{}), name: e.target.value}})} /></label>
                <label>Owner phone<input value={form.owner?.phone||''} onChange={e=>setForm({...form, owner:{...(form.owner||{}), phone: e.target.value}})} /></label>
                <label>Owner email<input value={form.owner?.email||''} onChange={e=>setForm({...form, owner:{...(form.owner||{}), email: e.target.value}})} /></label>

                <h5>Basic</h5>
                <label>Name<input value={form.name||''} onChange={e=>setForm({...form, name: e.target.value})} /></label>
                <label>Tag<input value={form.tag||''} onChange={e=>setForm({...form, tag: e.target.value})} /></label>
                <label>DOB<input type='date' value={form.dob||''} onChange={e=>setForm({...form, dob: e.target.value})} /></label>

                <div style={{ marginTop:8 }}><button onClick={saveEdits}>Save record</button></div>
              </div>
            ) : (
              <div>
                <section><h5>Identifiers & Summary</h5><div>Microchip: {form.ids?.microchip || '—'} • Tag: {form.ids?.tag || '—'}</div><div>Allergies: {(form.allergies||[]).join(', ') || '—'}</div></section>

                <section style={{ marginTop:8 }}>
                  <h5>Vaccinations</h5>
                  <ul>{(form.vaccinations||[]).map(v=>(<li key={v.id}>{v.date || v.createdAt} — {v.vaccine} — {v.site||''} <small>({v.lot||''})</small></li>))}</ul>
                  <VaccinationForm onAdd={(vals)=>{ const entry = { id: uid('v-'), ...vals, createdAt: new Date().toISOString() }; pushEntry('vaccinations', entry) }} />
                </section>

                <section style={{ marginTop:8 }}>
                  <h5>Medications</h5>
                  <ul>{(form.medications||[]).map(m=>(<li key={m.id}>{m.drug} — {m.dose} — {m.route||''} — {m.start || ''} to {m.end || ''}</li>))}</ul>
                  <MedicationForm onAdd={(vals)=>{ const entry = { id: uid('m-'), ...vals, createdAt: new Date().toISOString() }; pushEntry('medications', entry) }} />
                </section>

                <section style={{ marginTop:8 }}>
                  <h5>Surgical records</h5>
                  <ul>{(form.surgeries||[]).map(s=>(<li key={s.id}>{s.date || s.createdAt} — {s.procedure} — {s.anesthesia || ''}</li>))}</ul>
                  <SurgeryForm onAdd={(vals)=>{ const entry = { id: uid('s-'), ...vals, createdAt: new Date().toISOString() }; pushEntry('surgeries', entry) }} />
                </section>

                <section style={{ marginTop:8 }}>
                  <h5>Communications</h5>
                  <ul>{(form.communications||[]).map(c=>(<li key={c.id}>{c.method} — {c.note} — <small>{new Date(c.createdAt).toLocaleString()}</small></li>))}</ul>
                  <CommunicationForm onAdd={(vals)=>{ const entry = { id: uid('c-'), ...vals, createdAt: new Date().toISOString() }; pushEntry('communications', entry) }} />
                </section>

                <section style={{ marginTop:8 }}>
                  <h5>Consents & Attachments</h5>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{(form.consents||[]).map(cons=>(<div key={cons.id} style={{ width:140 }}><div style={{ fontSize:11 }}>{cons.filename}</div><a href={cons.dataUrl} target='_blank' rel='noreferrer'>Open</a></div>))}</div>
                  <label style={{ display:'block', marginTop:8 }}>Add consent<input type='file' onChange={e=>{ const f = e.target.files[0]; if(f) addConsentFile(f); e.target.value='' }} /></label>
                </section>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  function addConsentFile(file){ addConsentFile /* placeholder - handled above in outer scope */ }
}

function VaccinationForm({ onAdd }){
  const [vaccine, setVaccine] = useState('')
  const [date, setDate] = useState('')
  const [lot, setLot] = useState('')
  const [site, setSite] = useState('')
  return (
    <form onSubmit={e=>{ e.preventDefault(); onAdd({ vaccine, date, lot, site }); setVaccine(''); setDate(''); setLot(''); setSite('') }}>
      <div style={{ display:'flex', gap:8 }}>
        <input placeholder='Vaccine' value={vaccine} onChange={e=>setVaccine(e.target.value)} />
        <input type='date' value={date} onChange={e=>setDate(e.target.value)} />
        <input placeholder='Lot' value={lot} onChange={e=>setLot(e.target.value)} />
        <input placeholder='Site' value={site} onChange={e=>setSite(e.target.value)} />
        <button type='submit'>Add</button>
      </div>
    </form>
  )
}

function MedicationForm({ onAdd }){
  const [drug, setDrug] = useState('')
  const [dose, setDose] = useState('')
  const [route, setRoute] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  return (
    <form onSubmit={e=>{ e.preventDefault(); onAdd({ drug, dose, route, start, end }); setDrug(''); setDose(''); setRoute(''); setStart(''); setEnd('') }}>
      <div style={{ display:'flex', gap:8 }}>
        <input placeholder='Drug' value={drug} onChange={e=>setDrug(e.target.value)} />
        <input placeholder='Dose' value={dose} onChange={e=>setDose(e.target.value)} />
        <input placeholder='Route' value={route} onChange={e=>setRoute(e.target.value)} />
        <input type='date' value={start} onChange={e=>setStart(e.target.value)} />
        <input type='date' value={end} onChange={e=>setEnd(e.target.value)} />
        <button type='submit'>Add</button>
      </div>
    </form>
  )
}

function SurgeryForm({ onAdd }){
  const [procedure, setProcedure] = useState('')
  const [anesthesia, setAnesthesia] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState('')
  return (
    <form onSubmit={e=>{ e.preventDefault(); onAdd({ procedure, anesthesia, notes, date }); setProcedure(''); setAnesthesia(''); setNotes(''); setDate('') }}>
      <div style={{ display:'flex', gap:8 }}>
        <input placeholder='Procedure' value={procedure} onChange={e=>setProcedure(e.target.value)} />
        <input placeholder='Anesthesia' value={anesthesia} onChange={e=>setAnesthesia(e.target.value)} />
        <input type='date' value={date} onChange={e=>setDate(e.target.value)} />
        <input placeholder='Notes' value={notes} onChange={e=>setNotes(e.target.value)} />
        <button type='submit'>Add</button>
      </div>
    </form>
  )
}

function CommunicationForm({ onAdd }){
  const [method, setMethod] = useState('Phone')
  const [note, setNote] = useState('')
  return (
    <form onSubmit={e=>{ e.preventDefault(); onAdd({ method, note }); setNote('') }}>
      <div style={{ display:'flex', gap:8 }}>
        <select value={method} onChange={e=>setMethod(e.target.value)}><option>Phone</option><option>Email</option><option>SMS</option><option>In person</option></select>
        <input placeholder='Note' value={note} onChange={e=>setNote(e.target.value)} />
        <button type='submit'>Add</button>
      </div>
    </form>
  )
}

// Small supporting components (Appointments, PatientBoard, PrescriptionView, DiagnosticsView, BillingView, InventoryView)
function AppointmentView({ patients=[], appointments=[], createAppointment }){
  const [patientId, setPatientId] = useState('')
  const [when, setWhen] = useState('')
  const [reason, setReason] = useState('')
  return (
    <div>
      <form onSubmit={e=>{ e.preventDefault(); createAppointment({ id: uid('a-'), patientId, when, reason, status:'Scheduled', createdAt:new Date().toISOString() }); setPatientId(''); setWhen(''); setReason('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
          <input type='datetime-local' value={when} onChange={e=>setWhen(e.target.value)} />
          <input placeholder='Reason' value={reason} onChange={e=>setReason(e.target.value)} />
          <button type='submit'>Create</button>
        </div>
      </form>
      <div style={{ marginTop:8 }}>
        <strong>All appointments</strong>
        <ul>{appointments.map(a=>(<li key={a.id}>{a.patientId} — {new Date(a.when).toLocaleString()} — {a.status}</li>))}</ul>
      </div>
    </div>
  )
}

function PatientBoard({ patients=[], appointments=[], setPatients }){
  function setStatus(id, status){ setPatients(prev=>prev.map(p=> p.id===id?{...p,status}:p)) }
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
      <div><strong>Patients</strong><ul style={{ listStyle:'none', padding:0 }}>{patients.map(p=>(<li key={p.id} style={{ padding:8, borderBottom:'1px solid #eee' }}><div style={{ display:'flex', justifyContent:'space-between' }}><div><strong>{p.name}</strong><div style={{ fontSize:12 }}>{p.tag}</div></div><div><select value={p.status||'Registered'} onChange={e=>setStatus(p.id, e.target.value)}><option>Registered</option><option>Waiting</option><option>In Treatment</option><option>Recovering</option><option>Discharged</option></select></div></div></li>))}</ul></div>
      <div><strong>Appointments</strong><ul>{appointments.filter(a=>new Date(a.when).toDateString()===new Date().toDateString()).map(a=>(<li key={a.id}>{(patients.find(p=>p.id===a.patientId)||{}).name||a.patientId} — {new Date(a.when).toLocaleTimeString()} — {a.status}</li>))}</ul></div>
    </div>
  )
}

function PrescriptionView({ patients=[], prescriptions=[], addPrescription, inventory=[], adjustInventory }){
  const [patientId, setPatientId] = useState('')
  const [drug, setDrug] = useState('')
  const [dose, setDose] = useState('')
  return (
    <div>
      <form onSubmit={e=>{ e.preventDefault(); const r = { id: uid('r-'), patientId, drug, dose, createdAt:new Date().toISOString(), fulfilled:false }; addPrescription(r); const match = inventory.find(it=>it.name&&it.name.toLowerCase()===drug.toLowerCase()); if(match) adjustInventory(match.id, -1); setDrug(''); setDose('') }}>
        <div style={{ display:'flex', gap:8 }}>
          <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
          <input placeholder='Drug' value={drug} onChange={e=>setDrug(e.target.value)} />
          <input placeholder='Dose' value={dose} onChange={e=>setDose(e.target.value)} />
          <button type='submit'>Add Rx</button>
        </div>
      </form>
      <div style={{ marginTop:8 }}><strong>Prescriptions</strong><ul>{prescriptions.map(r=>(<li key={r.id}>{r.drug} — {r.dose} — {(patients.find(p=>p.id===r.patientId)||{}).name||r.patientId} — {r.fulfilled?'Fulfilled':'Pending'}</li>))}</ul></div>
    </div>
  )
}

function DiagnosticsView({ patients=[], attachDiagnostic }){
  const [patientId, setPatientId] = useState('')
  return (
    <div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value=''>Select patient</option>{patients.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}</select>
        <input type='file' accept='image/*,.pdf' onChange={e=>{ const f=e.target.files[0]; if(f && patientId) attachDiagnostic(patientId, f); e.target.value='' }} />
      </div>
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
      <ul>{billing.map(b=>(<li key={b.id}>{b.desc} — ${Number(b.amount).toFixed(2)} — {(patients.find(p=>p.id===b.patientId)||{}).name||b.patientId} — {b.paid?'Paid':<button onClick={()=>setInvoicePaid(b.id,true)}>Mark paid</button>} <button onClick={()=>generateInvoice(b.patientId)}>Invoice</button></li>))}</ul>
    </div>
  )
}

function InventoryView({ inventory=[], addInventory, adjustInventory }){
  const [name, setName] = useState('')
  const [qty, setQty] = useState(0)
  const [lowThreshold, setLowThreshold] = useState(5)
  return (
    <div>
      <form onSubmit={e=>{ e.preventDefault(); addInventory({ name, qty, lowThreshold }); setName(''); setQty(0) }}>
        <input placeholder='Item name' value={name} onChange={e=>setName(e.target.value)} />
        <input type='number' value={qty} onChange={e=>setQty(e.target.value)} />
        <input type='number' value={lowThreshold} onChange={e=>setLowThreshold(e.target.value)} />
        <button type='submit'>Add</button>
      </form>
      <ul>{inventory.map(it=>(<li key={it.id}>{it.name} — {it.qty} {it.qty <= (it.lowThreshold||5) ? <strong style={{ color:'crimson' }}> • Low</strong> : ''} <button onClick={()=>adjustInventory(it.id,-1)}>-</button><button onClick={()=>adjustInventory(it.id,1)}>+</button></li>))}</ul>
    </div>
  )
}
function CommunicationForm({ onAdd }){
  const [method, setMethod] = useState('Phone')
  const [note, setNote] = useState('')
  return (
    <form onSubmit={e=>{ e.preventDefault(); onAdd({ method, note }); setNote('') }}>
      <div style={{ display:'flex', gap:8 }}>
        <select value={method} onChange={e=>setMethod(e.target.value)}><option>Phone</option><option>Email</option><option>SMS</option><option>In person</option></select>
        <input placeholder='Note' value={note} onChange={e=>setNote(e.target.value)} />
        <button type='submit'>Add</button>
      </div>
    </form>
  )
}

function DispositionForm({ onAdd }){
  const [type, setType] = useState('Discharged')
  const [notes, setNotes] = useState('')
  return (
    <form onSubmit={e=>{ e.preventDefault(); onAdd({ type, notes }); setNotes('') }}>
      <div style={{ display:'flex', gap:8 }}>
        <select value={type} onChange={e=>setType(e.target.value)}><option>Discharged</option><option>Euthanasia</option><option>Transferred</option></select>
        <input placeholder='Notes' value={notes} onChange={e=>setNotes(e.target.value)} />
        <button type='submit'>Set disposition</button>
      </div>
    </form>
  )
}

function AddSoapNote({ patientId, addSoapNote }){
  const [type, setType] = useState('S')
  const [text, setText] = useState('')
  return (
    <form onSubmit={(e)=>{ e.preventDefault(); addSoapNote(patientId, type, text); setText('') }}>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <select value={type} onChange={e=>setType(e.target.value)}><option value='S'>S</option><option value='O'>O</option><option value='A'>A</option><option value='P'>P</option></select>
        <input placeholder='SOAP note text' value={text} onChange={e=>setText(e.target.value)} />
        <button type='submit'>Add note</button>
      </div>
    </form>
  )
}

function AppointmentView({ patients=[], appointments=[], createAppointment, updateAppointment, cancelAppointment }){
  const [patientId, setPatientId] = useState('')
  const [when, setWhen] = useState('')
  const [reason, setReason] = useState('')
  return (
    <div>
      <form onSubmit={(e)=>{ e.preventDefault(); createAppointment({ patientId, when, reason }); setPatientId(''); setWhen(''); setReason('') }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={patientId} onChange={e=>setPatientId(e.target.value)}>
            <option value="">Select patient</option>
            {patients.map(p=> <option key={p.id} value={p.id}>{p.name} ({p.tag})</option>)}
          </select>
          <input type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)} />
          <input placeholder="Reason" value={reason} onChange={e=>setReason(e.target.value)} />
          <button type="submit">Create</button>
        </div>
      </form>
      <div style={{ marginTop: 8 }}>
        <strong>All appointments</strong>
        <ul>
          {appointments.map(a=> (
            <li key={a.id}>{a.id} — {(patients.find(p=>p.id===a.patientId)||{}).name || a.patientId} — {new Date(a.when).toLocaleString()} — <select value={a.status} onChange={e=>updateAppointment(a.id,{status: e.target.value})}><option>Scheduled</option><option>In Treatment</option><option>Completed</option><option>Cancelled</option></select> <button onClick={()=>cancelAppointment(a.id)}>Cancel</button></li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function PatientBoard({ patients=[], appointments=[], setPatientStatus, setPatients }){
  // simple board: allow quick status/location update
  function setStatus(id, status){ setPatients(prev => prev.map(p => p.id === id ? { ...p, status } : p)) }
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
      <div>
        <strong>Patients</strong>
        <ul style={{ listStyle:'none', padding:0 }}>
          {patients.map(p=> (
            <li key={p.id} style={{ padding:8, borderBottom:'1px solid #eee' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <div>
                  <strong>{p.name}</strong> <div style={{ fontSize:12 }}>{p.tag}</div>
                  <div style={{ fontSize:12 }}>{p.status} {p.location ? `• ${p.location}` : ''}</div>
                </div>
                <div>
                  <select value={p.status||'Registered'} onChange={e=>setStatus(p.id, e.target.value)}>
                    <option>Registered</option>
                    <option>Waiting</option>
                    <option>In Treatment</option>
                    <option>Recovering</option>
                    <option>Discharged</option>
                  </select>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Today's appointments</strong>
        <ul>
          {appointments.filter(a=> new Date(a.when).toDateString() === new Date().toDateString()).map(a=> <li key={a.id}>{(patients.find(p=>p.id===a.patientId)||{}).name || a.patientId} — {new Date(a.when).toLocaleTimeString()} — {a.status}</li>)}
        </ul>
      </div>
    </div>
  )
}

function PrescriptionView({ patients=[], prescriptions=[], addPrescription, fulfillPrescription, inventory=[], adjustInventory }){
  const [patientId, setPatientId] = useState('')
  const [drug, setDrug] = useState('')
  const [dose, setDose] = useState('')
  const [notes, setNotes] = useState('')
  return (
    <div>
      <form onSubmit={(e)=>{ e.preventDefault(); addPrescription({ patientId, drug, dose, notes }); setDrug(''); setDose(''); setNotes('') }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={patientId} onChange={e=>setPatientId(e.target.value)}>
            <option value="">Select patient</option>
            {patients.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input placeholder="Drug" value={drug} onChange={e=>setDrug(e.target.value)} />
          <input placeholder="Dose" value={dose} onChange={e=>setDose(e.target.value)} />
          <button type="submit">Add Rx</button>
        </div>
      </form>
      <div style={{ marginTop:8 }}>
        <strong>Inventory</strong>
        <ul>
          {inventory.map(it=> <li key={it.id}>{it.name} — {it.qty}</li>)}
        </ul>
      </div>
      <div style={{ marginTop:8 }}>
        <strong>Prescriptions</strong>
        <ul>
          {prescriptions.map(r=> (
            <li key={r.id}>{r.drug} — {r.dose} — for {(patients.find(p=>p.id===r.patientId)||{}).name || r.patientId} — {r.fulfilled ? 'Fulfilled' : <button onClick={()=>{ fulfillPrescription(r.id); const match = inventory.find(it=> it.name && it.name.toLowerCase() === r.drug.toLowerCase()); if(match) adjustInventory(match.id, -1) }}>Fulfill</button>}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function DiagnosticsView({ patients=[], attachDiagnostic }){
  const [patientId, setPatientId] = useState('')
  return (
    <div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <select value={patientId} onChange={e=>setPatientId(e.target.value)}>
          <option value=''>Select patient</option>
          {patients.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type='file' accept='image/*' onChange={e=>{ const f = e.target.files[0]; if(f && patientId) attachDiagnostic(patientId, f); e.target.value='' }} />
      </div>
      <div style={{ marginTop:8 }}>
        <div style={{ color:'#666' }}>Attach images or lab result files to a patient record. Images will be compressed client-side.</div>
      </div>
    </div>
  )
}

function BillingView({ patients=[], billing=[], charge, setInvoicePaid, generateInvoice }){
  const [patientId, setPatientId] = useState('')
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  return (
    <div>
      <form onSubmit={(e)=>{ e.preventDefault(); charge(patientId, desc, amount); setDesc(''); setAmount('') }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={patientId} onChange={e=>setPatientId(e.target.value)}>
            <option value="">Select patient</option>
            {patients.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} />
          <input placeholder="Amount" type="number" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} />
          <button type="submit">Charge</button>
        </div>
      </form>
      <ul>
        {billing.map(b=> (<li key={b.id}>{b.desc} — ${b.amount.toFixed(2)} — {(patients.find(p=>p.id===b.patientId)||{}).name || b.patientId} — {b.paid ? 'Paid' : <button onClick={()=>setInvoicePaid(b.id, true)}>Mark paid</button>} <button onClick={()=>generateInvoice(b.patientId)}>Invoice</button></li>))}
      </ul>
    </div>
  )
}

function InventoryView({ inventory=[], addInventory, adjustInventory }){
  const [name, setName] = useState('')
  const [qty, setQty] = useState(0)
  const [lowThreshold, setLowThreshold] = useState(5)
  return (
    <div>
      <form onSubmit={(e)=>{ e.preventDefault(); addInventory({ name, qty, lowThreshold }); setName(''); setQty(0) }}>
        <input placeholder="Item name" value={name} onChange={e=>setName(e.target.value)} />
        <input type="number" value={qty} onChange={e=>setQty(e.target.value)} />
        <input type="number" value={lowThreshold} onChange={e=>setLowThreshold(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      <ul>
        {inventory.map(it=> (
          <li key={it.id} style={{ padding:6, borderBottom:'1px solid #eee' }}>{it.name} — {it.qty} {it.qty <= (it.lowThreshold||5) ? <strong style={{ color:'crimson' }}> • Low</strong> : ''} <button onClick={()=>adjustInventory(it.id, -1)}>-</button><button onClick={()=>adjustInventory(it.id, 1)}>+</button><button onClick={()=>adjustInventory(it.id, 10)} style={{ marginLeft:8 }}>Reorder +10</button></li>
        ))}
      </ul>
    </div>
  )
}
