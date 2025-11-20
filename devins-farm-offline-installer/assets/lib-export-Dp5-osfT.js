import{g as I}from"./lib-core-XQuPJE47.js";const v="devinsfarm:audit",b=1e3,g={CREATE:"create",UPDATE:"update",DELETE:"delete",LOGIN:"login",LOGOUT:"logout",EXPORT:"export",IMPORT:"import",PRINT:"print"},f={ANIMAL:"animal",TASK:"task",TRANSACTION:"transaction",INVENTORY:"inventory",EQUIPMENT:"equipment",CROP:"crop",TREATMENT:"treatment",MEASUREMENT:"measurement",BREEDING:"breeding",MILK_YIELD:"milk_yield",DIET:"diet",RATION:"ration",USER:"user",GROUP:"group",SYSTEM:"system"};function S(e,a,s,n={}){try{const r=I(),o={id:"audit-"+Date.now()+"-"+Math.random().toString(36).substr(2,9),timestamp:new Date().toISOString(),action:e,entityType:a,entityId:s,userId:r?.userId||"anonymous",userName:r?.name||"Anonymous",userRole:r?.role||"guest",details:n,ipAddress:"client-side",userAgent:navigator.userAgent},t=y();return t.unshift(o),t.length>b&&t.splice(b),localStorage.setItem(v,JSON.stringify(t)),o}catch(r){return console.error("Failed to log audit entry:",r),null}}function y(e={}){try{const a=localStorage.getItem(v);let s=a?JSON.parse(a):[];return e.action&&(s=s.filter(n=>n.action===e.action)),e.entityType&&(s=s.filter(n=>n.entityType===e.entityType)),e.entityId&&(s=s.filter(n=>n.entityId===e.entityId)),e.userId&&(s=s.filter(n=>n.userId===e.userId)),e.startDate&&(s=s.filter(n=>new Date(n.timestamp)>=new Date(e.startDate))),e.endDate&&(s=s.filter(n=>new Date(n.timestamp)<=new Date(e.endDate))),s}catch(a){return console.error("Failed to get audit log:",a),[]}}function T(){const e=y(),a={total:e.length,byAction:{},byEntity:{},byUser:{},last24Hours:0,lastWeek:0},s=Date.now(),n=1440*60*1e3,r=7*n;return e.forEach(o=>{a.byAction[o.action]=(a.byAction[o.action]||0)+1,a.byEntity[o.entityType]=(a.byEntity[o.entityType]||0)+1,a.byUser[o.userName]=(a.byUser[o.userName]||0)+1;const t=new Date(o.timestamp).getTime();s-t<n&&a.last24Hours++,s-t<r&&a.lastWeek++}),a}function w(){const e=I();return!e||e.role!=="MANAGER"?{success:!1,error:"Permission denied"}:(localStorage.removeItem(v),S(g.DELETE,f.SYSTEM,"audit-log",{message:"Audit log cleared",previousEntries:y().length}),{success:!0})}function x(){const e=y(),a=["Timestamp","Action","Entity Type","Entity ID","User","Role","Details"],s=e.map(r=>[r.timestamp,r.action,r.entityType,r.entityId,r.userName,r.userRole,JSON.stringify(r.details)]),n=[a,...s].map(r=>r.map(o=>{const t=String(o||"");return t.includes(",")||t.includes('"')||t.includes(`
`)?`"${t.replace(/"/g,'""')}"`:t}).join(",")).join(`
`);return S(g.EXPORT,f.SYSTEM,"audit-log",{entries:e.length}),n}function R(){const e=y();return S(g.EXPORT,f.SYSTEM,"audit-log",{entries:e.length,format:"json"}),e}function J(e){const s=new Date(e.timestamp).toLocaleString();let n="";switch(e.action){case g.CREATE:n=`Created ${e.entityType} (${e.entityId})`;break;case g.UPDATE:n=`Updated ${e.entityType} (${e.entityId})`;break;case g.DELETE:n=`Deleted ${e.entityType} (${e.entityId})`;break;case g.LOGIN:n="Logged in";break;case g.LOGOUT:n="Logged out";break;case g.EXPORT:n=`Exported ${e.entityType} data`;break;case g.IMPORT:n=`Imported ${e.entityType} data`;break;case g.PRINT:n=`Printed ${e.entityType} records`;break;default:n=`${e.action} ${e.entityType}`}return{time:s,description:n,user:e.userName,role:e.userRole,details:e.details}}function A(e,a="export.csv",s=null){try{if(!e||e.length===0){alert("No data to export");return}const n=s||Object.keys(e[0]),r=d=>{if(d==null)return"";const l=String(d);return l.includes(",")||l.includes('"')||l.includes(`
`)?`"${l.replace(/"/g,'""')}"`:l},o=e.map(d=>n.map(l=>r(d[l])).join(",")),t=[n.join(","),...o].join(`
`),c=new Blob([t],{type:"text/csv;charset=utf-8;"}),i=URL.createObjectURL(c),u=document.createElement("a");u.href=i,u.download=a,document.body.appendChild(u),u.click(),document.body.removeChild(u),URL.revokeObjectURL(i)}catch(n){console.error("CSV export failed:",n),alert("Export failed: "+n.message)}}function D(e,a="export.csv",s=null){try{if(!e||e.length===0){alert("No data to export");return}const n=s||Object.keys(e[0]),r=l=>{if(l==null)return"";const p=String(l);return p.includes(",")||p.includes('"')||p.includes(`
`)?`"${p.replace(/"/g,'""')}"`:p},o=e.map(l=>n.map(p=>r(l[p])).join(",")),t=[n.join(","),...o].join(`
`),c="\uFEFF",i=new Blob([c+t],{type:"text/csv;charset=utf-8;"}),u=URL.createObjectURL(i),d=document.createElement("a");d.href=u,d.download=a.replace(".csv","")+".csv",document.body.appendChild(d),d.click(),document.body.removeChild(d),URL.revokeObjectURL(u)}catch(n){console.error("Excel export failed:",n),alert("Export failed: "+n.message)}}function L(e,a="export.json"){try{if(!e){alert("No data to export");return}const s=JSON.stringify(e,null,2),n=new Blob([s],{type:"application/json"}),r=URL.createObjectURL(n),o=document.createElement("a");o.href=r,o.download=a,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(r)}catch(s){console.error("JSON export failed:",s),alert("Export failed: "+s.message)}}function $(e,a){const s=new FileReader;s.onload=n=>{try{const o=n.target.result.split(`
`).filter(i=>i.trim());if(o.length===0){alert("File is empty");return}const t=o[0].split(",").map(i=>i.trim().replace(/^"|"$/g,"")),c=[];for(let i=1;i<o.length;i++){const u=k(o[i]);if(u.length===t.length){const d={};t.forEach((l,p)=>{d[l]=u[p]}),c.push(d)}}a(c,null)}catch(r){console.error("CSV import failed:",r),a(null,r)}},s.onerror=()=>{a(null,new Error("Failed to read file"))},s.readAsText(e)}function U(e,a){const s=new FileReader;s.onload=n=>{try{const r=JSON.parse(n.target.result);a(r,null)}catch(r){console.error("JSON import failed:",r),a(null,r)}},s.onerror=()=>{a(null,new Error("Failed to read file"))},s.readAsText(e)}function k(e){const a=[];let s="",n=!1;for(let r=0;r<e.length;r++){const o=e[r],t=e[r+1];o==='"'?n&&t==='"'?(s+='"',r++):n=!n:o===","&&!n?(a.push(s.trim()),s=""):s+=o}return a.push(s.trim()),a}function j(e,a,s="Batch Print",n="Report"){const r=window.open("","_blank"),o=new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}),t=e.map((c,i)=>`
    <div class="print-page" style="page-break-after: ${i<e.length-1?"always":"auto"};">
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 15px;">
        <h1 style="margin: 0; font-size: 28pt; letter-spacing: 2px;">HEADINGJR FARM</h1>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
          <div style="flex: 1;"></div>
          <div style="flex: 2; text-align: center;">
            <p style="margin: 5px 0; font-size: 11pt;">${n}</p>
            <p style="margin: 5px 0; font-size: 10pt; color: #555;">Date: ${o}</p>
          </div>
          <div style="flex: 1; text-align: right; font-size: 9pt; font-style: italic; color: #666;">
            Made by<br/>Dr. Devin Omwenga
          </div>
        </div>
      </div>
      ${a(c)}
    </div>
  `).join("");r.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${s}</title>
      <style>
        @page { 
          margin: 20mm; 
          size: A4;
        }
        body { 
          font-family: Arial, sans-serif; 
          font-size: 12pt;
          line-height: 1.4;
          color: #000;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 20px;
        }
        th, td { 
          border: 1px solid #000; 
          padding: 8px; 
          text-align: left; 
        }
        th { 
          background: #f0f0f0; 
          font-weight: bold;
        }
        h1, h2, h3 { 
          margin-top: 0;
        }
        .print-page {
          min-height: 100vh;
        }
      </style>
    </head>
    <body>
      ${t}
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      <\/script>
    </body>
    </html>
  `),r.document.close()}function C(e,a="export",s="Export Report",n=null){try{if(!e||e.length===0){alert("No data to export");return}const r=n||Object.keys(e[0]),o=e.map(i=>"<tr>"+r.map(u=>`<td>${h(i[u]||"")}</td>`).join("")+"</tr>").join(""),t=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${h(s)}</title>
        <style>
          @page { margin: 15mm; size: A4; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 10pt;
            line-height: 1.3;
            color: #000;
          }
          h1 { 
            font-size: 18pt; 
            margin-bottom: 10px;
            text-align: center;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
          }
          th, td { 
            border: 1px solid #333; 
            padding: 6px 8px; 
            text-align: left;
            font-size: 9pt;
          }
          th { 
            background: #e0e0e0; 
            font-weight: bold;
          }
          tr:nth-child(even) { background: #f9f9f9; }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 8pt;
            color: #666;
          }
        </style>
      </head>
      <body>
        <h1>${h(s)}</h1>
        <table>
          <thead>
            <tr>${r.map(i=>`<th>${h(i)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${o}
          </tbody>
        </table>
        <div class="footer">
          Generated on ${new Date().toLocaleString()} | Total Records: ${e.length}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        <\/script>
      </body>
      </html>
    `,c=window.open("","_blank","width=800,height=600");c.document.write(t),c.document.close()}catch(r){console.error("PDF export failed:",r),alert("Export failed: "+r.message)}}function h(e){if(e==null)return"";const a=String(e),s=document.createElement("div");return s.textContent=a,s.innerHTML}function O(){return{version:"2.0",timestamp:new Date().toISOString(),animals:JSON.parse(localStorage.getItem("devinsfarm:animals")||"[]"),transactions:JSON.parse(localStorage.getItem("devinsfarm:transactions")||"[]"),inventory:JSON.parse(localStorage.getItem("devinsfarm:inventory")||"[]"),tasks:JSON.parse(localStorage.getItem("devinsfarm:tasks")||"[]"),crops:JSON.parse(localStorage.getItem("devinsfarm:crops")||"[]"),treatments:JSON.parse(localStorage.getItem("devinsfarm:treatments")||"[]"),breeding:JSON.parse(localStorage.getItem("devinsfarm:breeding")||"[]"),feeding:JSON.parse(localStorage.getItem("devinsfarm:feeding")||"[]"),measurements:JSON.parse(localStorage.getItem("devinsfarm:measurements")||"[]"),milkYield:JSON.parse(localStorage.getItem("devinsfarm:milkYield")||"[]"),groups:JSON.parse(localStorage.getItem("devinsfarm:groups")||"[]"),pastures:JSON.parse(localStorage.getItem("devinsfarm:pastures")||"[]"),schedules:JSON.parse(localStorage.getItem("devinsfarm:schedules")||"[]"),equipment:JSON.parse(localStorage.getItem("devinsfarm:equipment")||"[]"),settings:{currency:localStorage.getItem("devinsfarm:currency")||"KES",appSettings:JSON.parse(localStorage.getItem("devinsfarm:app:settings")||"null"),notificationSettings:JSON.parse(localStorage.getItem("devinsfarm:notification:settings")||"null"),uiSettings:JSON.parse(localStorage.getItem("devinsfarm:ui:settings")||"null")},users:JSON.parse(localStorage.getItem("devinsfarm:users")||"[]"),audit:JSON.parse(localStorage.getItem("devinsfarm:audit")||"[]")}}function N(e={}){try{const a=O(),s=e.filename||`devinsfarm-backup-${new Date().toISOString().split("T")[0]}.json`,n=new Blob([JSON.stringify(a,null,2)],{type:"application/json"}),r=URL.createObjectURL(n),o=document.createElement("a");return o.href=r,o.download=s,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(r),S(g.EXPORT,f.OTHER,null,{operation:"Full Backup",filename:s}),{success:!0,filename:s,size:n.size}}catch(a){return console.error("Error creating backup:",a),{success:!1,error:a.message}}}function P(e,a={}){return new Promise((s,n)=>{const r=new FileReader;r.onload=o=>{try{const t=JSON.parse(o.target.result);if(!t.version||!t.timestamp)throw new Error("Invalid backup file format");if(!(a.skipConfirm||confirm(`Restore backup from ${new Date(t.timestamp).toLocaleString()}?

This will ${a.merge?"merge":"replace"} your current data.

Animals: ${t.animals?.length||0}
Transactions: ${t.transactions?.length||0}
Tasks: ${t.tasks?.length||0}
Inventory: ${t.inventory?.length||0}

Are you sure?`))){s({success:!1,cancelled:!0});return}a.createBackupFirst!==!1&&N({filename:`pre-restore-backup-${Date.now()}.json`});const i={};a.merge?(i.animals=m("devinsfarm:animals",t.animals),i.transactions=m("devinsfarm:transactions",t.transactions),i.inventory=m("devinsfarm:inventory",t.inventory),i.tasks=m("devinsfarm:tasks",t.tasks),i.crops=m("devinsfarm:crops",t.crops),i.treatments=m("devinsfarm:treatments",t.treatments),i.breeding=m("devinsfarm:breeding",t.breeding),i.feeding=m("devinsfarm:feeding",t.feeding),i.measurements=m("devinsfarm:measurements",t.measurements),i.milkYield=m("devinsfarm:milkYield",t.milkYield),i.groups=m("devinsfarm:groups",t.groups),i.pastures=m("devinsfarm:pastures",t.pastures),i.schedules=m("devinsfarm:schedules",t.schedules),i.equipment=m("devinsfarm:equipment",t.equipment)):(localStorage.setItem("devinsfarm:animals",JSON.stringify(t.animals||[])),localStorage.setItem("devinsfarm:transactions",JSON.stringify(t.transactions||[])),localStorage.setItem("devinsfarm:inventory",JSON.stringify(t.inventory||[])),localStorage.setItem("devinsfarm:tasks",JSON.stringify(t.tasks||[])),localStorage.setItem("devinsfarm:crops",JSON.stringify(t.crops||[])),localStorage.setItem("devinsfarm:treatments",JSON.stringify(t.treatments||[])),localStorage.setItem("devinsfarm:breeding",JSON.stringify(t.breeding||[])),localStorage.setItem("devinsfarm:feeding",JSON.stringify(t.feeding||[])),localStorage.setItem("devinsfarm:measurements",JSON.stringify(t.measurements||[])),localStorage.setItem("devinsfarm:milkYield",JSON.stringify(t.milkYield||[])),localStorage.setItem("devinsfarm:groups",JSON.stringify(t.groups||[])),localStorage.setItem("devinsfarm:pastures",JSON.stringify(t.pastures||[])),localStorage.setItem("devinsfarm:schedules",JSON.stringify(t.schedules||[])),localStorage.setItem("devinsfarm:equipment",JSON.stringify(t.equipment||[])),i.animals=t.animals?.length||0,i.transactions=t.transactions?.length||0,i.inventory=t.inventory?.length||0,i.tasks=t.tasks?.length||0),t.settings&&(t.settings.currency&&localStorage.setItem("devinsfarm:currency",t.settings.currency),t.settings.appSettings&&localStorage.setItem("devinsfarm:app:settings",JSON.stringify(t.settings.appSettings)),t.settings.notificationSettings&&localStorage.setItem("devinsfarm:notification:settings",JSON.stringify(t.settings.notificationSettings)),t.settings.uiSettings&&localStorage.setItem("devinsfarm:ui:settings",JSON.stringify(t.settings.uiSettings))),a.restoreUsers&&t.users&&localStorage.setItem("devinsfarm:users",JSON.stringify(t.users)),a.restoreAudit&&t.audit&&localStorage.setItem("devinsfarm:audit",JSON.stringify(t.audit)),S(g.IMPORT,f.OTHER,null,{operation:"Full Restore",mode:a.merge?"merge":"replace",backupDate:t.timestamp}),s({success:!0,restored:i,backupDate:t.timestamp,version:t.version})}catch(t){console.error("Error restoring backup:",t),n({success:!1,error:t.message})}},r.onerror=()=>{n({success:!1,error:"Failed to read file"})},r.readAsText(e)})}function m(e,a){if(!a||!Array.isArray(a))return 0;const n=[...JSON.parse(localStorage.getItem(e)||"[]")];let r=0;return a.forEach(o=>{const t=n.findIndex(c=>c.id===o.id);t===-1?(n.push(o),r++):new Date(o.updatedAt||o.date)>new Date(n[t].updatedAt||n[t].date)&&(n[t]=o)}),localStorage.setItem(e,JSON.stringify(n)),r}function B(){const e=O();return{totalRecords:(e.animals?.length||0)+(e.transactions?.length||0)+(e.inventory?.length||0)+(e.tasks?.length||0)+(e.crops?.length||0)+(e.treatments?.length||0)+(e.breeding?.length||0),animals:e.animals?.length||0,transactions:e.transactions?.length||0,inventory:e.inventory?.length||0,tasks:e.tasks?.length||0,crops:e.crops?.length||0,treatments:e.treatments?.length||0,breeding:e.breeding?.length||0,lastBackup:localStorage.getItem("devinsfarm:lastBackup")||null}}function F(){const e=localStorage.getItem("devinsfarm:lastBackup"),s=JSON.parse(localStorage.getItem("devinsfarm:app:settings")||"{}").backupFrequency||7;if(!e)return{needsBackup:!0,daysSince:null,message:"No backup found. Create your first backup now!"};const n=new Date(e),r=Math.floor((Date.now()-n.getTime())/(1e3*60*60*24));return r>=s?{needsBackup:!0,daysSince:r,message:`Last backup was ${r} days ago. Time to create a new backup!`}:{needsBackup:!1,daysSince:r,message:`Last backup: ${r} days ago`}}function M(){localStorage.setItem("devinsfarm:lastBackup",new Date().toISOString())}export{g as A,f as E,D as a,j as b,L as c,C as d,A as e,$ as f,y as g,T as h,U as i,J as j,x as k,S as l,R as m,w as n,B as o,F as p,N as q,P as r,M as u};
