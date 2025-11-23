function h(e,r="export.csv",t=null){try{if(!e||e.length===0){alert("No data to export");return}const n=t||Object.keys(e[0]),o=c=>{if(c==null)return"";const s=String(c);return s.includes(",")||s.includes('"')||s.includes(`
`)?`"${s.replace(/"/g,'""')}"`:s},i=e.map(c=>n.map(s=>o(c[s])).join(",")),d=[n.join(","),...i].join(`
`),p=new Blob([d],{type:"text/csv;charset=utf-8;"}),l=URL.createObjectURL(p),a=document.createElement("a");a.href=l,a.download=r,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(l)}catch(n){console.error("CSV export failed:",n),alert("Export failed: "+n.message)}}function g(e,r="export.csv",t=null){try{if(!e||e.length===0){alert("No data to export");return}const n=t||Object.keys(e[0]),o=s=>{if(s==null)return"";const f=String(s);return f.includes(",")||f.includes('"')||f.includes(`
`)?`"${f.replace(/"/g,'""')}"`:f},i=e.map(s=>n.map(f=>o(s[f])).join(",")),d=[n.join(","),...i].join(`
`),p="\uFEFF",l=new Blob([p+d],{type:"text/csv;charset=utf-8;"}),a=URL.createObjectURL(l),c=document.createElement("a");c.href=a,c.download=r.replace(".csv","")+".csv",document.body.appendChild(c),c.click(),document.body.removeChild(c),URL.revokeObjectURL(a)}catch(n){console.error("Excel export failed:",n),alert("Export failed: "+n.message)}}function b(e,r="export.json"){try{if(!e){alert("No data to export");return}const t=JSON.stringify(e,null,2),n=new Blob([t],{type:"application/json"}),o=URL.createObjectURL(n),i=document.createElement("a");i.href=o,i.download=r,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(o)}catch(t){console.error("JSON export failed:",t),alert("Export failed: "+t.message)}}function x(e,r){const t=new FileReader;t.onload=n=>{try{const i=n.target.result.split(`
`).filter(l=>l.trim());if(i.length===0){alert("File is empty");return}const d=i[0].split(",").map(l=>l.trim().replace(/^"|"$/g,"")),p=[];for(let l=1;l<i.length;l++){const a=m(i[l]);if(a.length===d.length){const c={};d.forEach((s,f)=>{c[s]=a[f]}),p.push(c)}}r(p,null)}catch(o){console.error("CSV import failed:",o),r(null,o)}},t.onerror=()=>{r(null,new Error("Failed to read file"))},t.readAsText(e)}function y(e,r){const t=new FileReader;t.onload=n=>{try{const o=JSON.parse(n.target.result);r(o,null)}catch(o){console.error("JSON import failed:",o),r(null,o)}},t.onerror=()=>{r(null,new Error("Failed to read file"))},t.readAsText(e)}function m(e){const r=[];let t="",n=!1;for(let o=0;o<e.length;o++){const i=e[o],d=e[o+1];i==='"'?n&&d==='"'?(t+='"',o++):n=!n:i===","&&!n?(r.push(t.trim()),t=""):t+=i}return r.push(t.trim()),r}function w(e,r,t="Batch Print",n="Report"){const o=window.open("","_blank"),i=new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}),d=e.map((p,l)=>`
    <div class="print-page" style="page-break-after: ${l<e.length-1?"always":"auto"};">
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 15px;">
        <h1 style="margin: 0; font-size: 28pt; letter-spacing: 2px;">HEADINGJR FARM</h1>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
          <div style="flex: 1;"></div>
          <div style="flex: 2; text-align: center;">
            <p style="margin: 5px 0; font-size: 11pt;">${n}</p>
            <p style="margin: 5px 0; font-size: 10pt; color: #555;">Date: ${i}</p>
          </div>
          <div style="flex: 1; text-align: right; font-size: 9pt; font-style: italic; color: #666;">
            Made by<br/>Dr. Devin Omwenga
          </div>
        </div>
      </div>
      ${r(p)}
    </div>
  `).join("");o.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${t}</title>
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
      ${d}
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
  `),o.document.close()}function v(e,r="export",t="Export Report",n=null){try{if(!e||e.length===0){alert("No data to export");return}const o=n||Object.keys(e[0]),i=e.map(l=>"<tr>"+o.map(a=>`<td>${u(l[a]||"")}</td>`).join("")+"</tr>").join(""),d=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${u(t)}</title>
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
        <h1>${u(t)}</h1>
        <table>
          <thead>
            <tr>${o.map(l=>`<th>${u(l)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${i}
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
    `,p=window.open("","_blank","width=800,height=600");p.document.write(d),p.document.close()}catch(o){console.error("PDF export failed:",o),alert("Export failed: "+o.message)}}function u(e){if(e==null)return"";const r=String(e),t=document.createElement("div");return t.textContent=r,t.innerHTML}export{g as a,w as b,b as c,v as d,h as e,x as f,y as i};
