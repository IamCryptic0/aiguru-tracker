/* app.js — AI Guru Task Tracker UI, sync, notifications */
let data = load();
let collapsed = loadCollapsed();
function load(){ try{const s=localStorage.getItem(LS); return s?JSON.parse(s):structuredClone(SEED)}catch(e){return structuredClone(SEED)} }
function save(){ localStorage.setItem(LS, JSON.stringify(data)); schedulePush(); }
function loadCollapsed(){ try{return JSON.parse(localStorage.getItem(LSC)||"{}")}catch(e){return {}} }
function saveCollapsed(){ localStorage.setItem(LSC, JSON.stringify(collapsed)); schedulePush(); }

let editIndex=null;
let editGroupName=null;

function esc(s){return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function uniq(a){return [...new Set(a)]}
function groupsInOrder(){ const seen=[]; data.forEach(d=>{if(!seen.includes(d.group))seen.push(d.group)}); return seen; }
function letterOf(d){ const peers=data.filter(x=>x.group===d.group); return LETTERS[peers.indexOf(d)]||"•"; }
function ownersOf(d){ return (d.owner||"").split(",").map(s=>s.trim()).filter(Boolean); }
function allOwners(){ return uniq(data.flatMap(ownersOf)).sort(); }

function refreshFilterOptions(){
  const g=document.getElementById("fGroup"), o=document.getElementById("fOwner");
  const gv=g.value, ov=o.value, gs=groupsInOrder(), ow=allOwners();
  g.innerHTML='<option value="">All tasks</option>'+gs.map((x,i)=>`<option value="${esc(x)}" ${x===gv?"selected":""}>${i+1}. ${esc(x)}</option>`).join("");
  o.innerHTML='<option value="">All owners</option>'+ow.map(x=>`<option ${x===ov?"selected":""}>${esc(x)}</option>`).join("");
  document.getElementById("groupList").innerHTML=gs.map(x=>`<option value="${esc(x)}">`).join("");
}

function filtered(){
  const q=document.getElementById("q").value.toLowerCase().trim();
  const fg=document.getElementById("fGroup").value, fo=document.getElementById("fOwner").value;
  const fp=document.getElementById("fPrio").value, fs=document.getElementById("fStatus").value;
  return data.filter(d=>{
    if(fg&&d.group!==fg)return false;
    if(fo&&!ownersOf(d).includes(fo))return false;
    if(fp&&d.prio!==fp)return false;
    if(fs&&d.status!==fs)return false;
    if(q){const hay=(d.id+" "+d.sub+" "+d.desc+" "+d.group+" "+d.owner+" "+d.note).toLowerCase(); if(!hay.includes(q))return false;}
    return true;
  });
}

function render(){
  refreshFilterOptions();
  renderMetrics();
  const board=document.getElementById("board");
  const rows=filtered();
  if(!rows.length){board.innerHTML='<div class="empty">No tasks match your filters. Add one with &ldquo;+ Add Task&rdquo;.</div>';return;}
  board.innerHTML="";
  groupsInOrder().forEach((gname,gi)=>{
    const grp=rows.filter(r=>r.group===gname);
    if(!grp.length)return;
    const isCol=!!collapsed[gname];
    const section=document.createElement("div");
    section.className="group"+(isCol?" collapsed":"");
    section.innerHTML=`
      <div class="ghead" data-toggle="${esc(gname)}">
        <span class="chev">&#9662;</span>
        <span class="tasknum">${gi+1}</span>
        <span class="gname">${esc(gname)}</span>
        <span class="gcount">${grp.length} subtask${grp.length>1?"s":""}</span>
        <span class="gactions">
          <button class="btn sm" data-editgroup="${esc(gname)}">&#9998; Edit Task</button>
          <button class="btn sm primary" data-addsub="${esc(gname)}">+ Subtask</button>
        </span>
      </div>
      <div class="gbody">${grp.map(rowHtml).join("")}</div>`;
    board.appendChild(section);
  });
}

function rowHtml(d){
  const idx=data.indexOf(d);
  const sh=ST_HEX[d.status], ph=P_HEX[d.prio];
  const rowBg=d.status==="Not Started"?"var(--panel2)":`linear-gradient(90deg,${rgba(sh,.30)},${rgba(sh,.10)} 70%,var(--panel2))`;
  const prioStyle=`background:${rgba(ph,.20)};color:${ph};border-color:${rgba(ph,.7)}`;
  const statStyle=`background:${rgba(sh,.22)};color:${sh};border-color:${rgba(sh,.75)}`;
  const ownerChips=ownersOf(d).map(o=>`<span class="owner-chip">&#128100; ${esc(o)}</span>`).join("");
  return `<div class="row" style="border-left-color:${ph};background:${rowBg}">
    <div class="letter" style="color:${ph}">${letterOf(d)}</div>
    <div class="cell-sub">
      <div class="statusbadge"><span class="pill" style="background:${rgba(sh,.22)};color:${sh}">${d.status}</span></div>
      <div class="stitle">${esc(d.sub)||"<span style='color:var(--muted)'>(untitled)</span>"}</div>
      ${(d.dep||d.time||d.note)?`<div class="extra">
        ${d.dep?`<span class="tag dep">&#128279; ${esc(d.dep)}</span>`:""}
        ${d.time?`<span class="tag time">&#128197; ${esc(d.time)}</span>`:""}
        ${d.note?`<span class="tag note">&#128221; ${esc(d.note)}</span>`:""}</div>`:""}
    </div>
    <div class="cell-desc">${esc(d.desc)}</div>
    <div class="cell-owner">${ownerChips}</div>
    <div><select class="inline" data-field="prio" data-idx="${idx}" style="${prioStyle}">
      ${["P0","P1","P2"].map(p=>`<option ${p===d.prio?"selected":""}>${p}</option>`).join("")}</select></div>
    <div><select class="inline" data-field="status" data-idx="${idx}" style="${statStyle}">
      ${STATUSES.map(s=>`<option ${s===d.status?"selected":""}>${s}</option>`).join("")}</select></div>
    <div class="rowact">
      <button class="edit" data-edit="${idx}">&#9998; Edit</button>
      <button class="del" data-del="${idx}">&#128465; Delete</button>
    </div>
  </div>`;
}

function renderMetrics(){
  const total=data.length;
  const done=data.filter(d=>d.status==="Done").length;
  const prog=data.filter(d=>d.status==="In Progress").length;
  const block=data.filter(d=>d.status==="Blocked").length;
  const pct=total?Math.round(done/total*100):0;
  document.getElementById("metrics").innerHTML=`
    <div class="card"><div class="num">${groupsInOrder().length}</div><div class="lbl">Tasks</div></div>
    <div class="card"><div class="num">${total}</div><div class="lbl">Subtasks</div></div>
    <div class="card"><div class="num" style="color:${ST_HEX['In Progress']}">${prog}</div><div class="lbl">In Progress</div></div>
    <div class="card"><div class="num" style="color:${ST_HEX['Blocked']}">${block}</div><div class="lbl">Blocked</div></div>
    <div class="card"><div class="num" style="color:${ST_HEX['Done']}">${done}</div><div class="lbl">Done</div></div>
    <div class="card"><div class="num">${pct}%</div><div class="lbl">Completion</div><div class="bar"><i style="width:${pct}%"></i></div></div>`;
  const max=total||1;
  document.getElementById("byStatus").innerHTML=STATUSES.map(s=>{
    const c=data.filter(d=>d.status===s).length;
    return `<div class="legrow"><span class="dot" style="background:${ST_HEX[s]}"></span><span style="min-width:96px">${s}</span>
      <span class="track"><i style="width:${c/max*100}%;background:${ST_HEX[s]}"></i></span><span class="cnt">${c}</span></div>`;
  }).join("");
  const lbl={P0:"P0 · Critical",P1:"P1 · High",P2:"P2 · Normal"};
  document.getElementById("byPriority").innerHTML=["P0","P1","P2"].map(p=>{
    const c=data.filter(d=>d.prio===p).length;
    return `<div class="legrow"><span class="dot" style="background:${P_HEX[p]}"></span><span style="min-width:96px">${lbl[p]}</span>
      <span class="track"><i style="width:${c/max*100}%;background:${P_HEX[p]}"></i></span><span class="cnt">${c}</span></div>`;
  }).join("");
}

document.getElementById("board").addEventListener("change",e=>{
  const sel=e.target.closest("select.inline");
  if(sel){ data[+sel.dataset.idx][sel.dataset.field]=sel.value; save(); render(); }
});
document.getElementById("board").addEventListener("click",e=>{
  const t=e.target;
  const del=t.closest("[data-del]"); if(del){ if(confirm("Delete this subtask?")){data.splice(+del.dataset.del,1);save();render();} return; }
  const ed=t.closest("[data-edit]"); if(ed){ openSub(+ed.dataset.edit); return; }
  const add=t.closest("[data-addsub]"); if(add){ openSub(null, add.dataset.addsub); return; }
  const eg=t.closest("[data-editgroup]"); if(eg){ openGroup(eg.dataset.editgroup); return; }
  const tog=t.closest("[data-toggle]"); if(tog){ const g=tog.dataset.toggle; collapsed[g]=!collapsed[g]; saveCollapsed(); render(); }
});
["q","fGroup","fOwner","fPrio","fStatus"].forEach(id=>document.getElementById(id).addEventListener("input",render));
document.getElementById("expandAll").onclick=()=>{collapsed={};saveCollapsed();render()};
document.getElementById("collapseAll").onclick=()=>{groupsInOrder().forEach(g=>collapsed[g]=true);saveCollapsed();render()};

const overlay=document.getElementById("overlay");
function suggestId(group){
  if(!group) return "T-"+Date.now().toString(36);
  const ids=data.filter(d=>d.group===group).map(d=>d.id);
  if(!ids.length) return "T-"+Date.now().toString(36);
  const base=(ids[0].match(/^[A-Za-z]+-\d+/)||[])[0];
  if(!base) return "T-"+Date.now().toString(36);
  for(const L of "abcdefghijklmnopqrstuvwxyz"){ const c=base+L; if(!ids.includes(c)) return c; }
  return base+"-x";
}
function renderOwnerPick(){
  const pick=document.getElementById("ownerPick");
  const chosen=ownersFromInput();
  const avail=allOwners().filter(o=>!chosen.includes(o));
  pick.innerHTML=avail.length? avail.map(o=>`<button type="button" data-add-owner="${esc(o)}">+ ${esc(o)}</button>`).join("") : "";
}
function ownersFromInput(){ return m_owner.value.split(",").map(s=>s.trim()).filter(Boolean); }
function openSub(index, presetGroup){
  editIndex=index;
  document.getElementById("modalTitle").textContent = index==null ? "Add Subtask" : "Edit Subtask";
  document.getElementById("deleteSubBtn").style.display = index==null ? "none" : "inline-block";
  const d = index==null
    ? {group:presetGroup||"",sub:"",desc:"",owner:"",prio:"P2",status:"Not Started",dep:"",time:"",note:""}
    : data[index];
  m_group.value=d.group; m_sub.value=d.sub; m_desc.value=d.desc;
  m_owner.value=d.owner; m_prio.value=d.prio; m_status.value=d.status;
  m_dep.value=d.dep; m_time.value=d.time; m_note.value=d.note;
  refreshFilterOptions(); renderOwnerPick();
  overlay.classList.add("open"); m_sub.focus();
}
function closeSub(){ overlay.classList.remove("open"); editIndex=null; }
document.getElementById("cancelBtn").onclick=closeSub;
overlay.addEventListener("click",e=>{if(e.target===overlay)closeSub()});
m_owner.addEventListener("input",renderOwnerPick);
document.getElementById("ownerPick").addEventListener("click",e=>{
  const b=e.target.closest("[data-add-owner]"); if(!b)return;
  const cur=ownersFromInput(); cur.push(b.dataset.addOwner);
  m_owner.value=cur.join(", "); renderOwnerPick(); m_owner.focus();
});
document.getElementById("deleteSubBtn").onclick=()=>{ if(editIndex!=null&&confirm("Delete this subtask?")){data.splice(editIndex,1);save();closeSub();render();} };
document.getElementById("saveBtn").onclick=()=>{
  const group=m_group.value.trim()||"Ungrouped";
  const existing = editIndex==null ? null : data[editIndex];
  const owner=ownersFromInput().join(", ");
  const rec={id: existing ? existing.id : suggestId(group), group, sub:m_sub.value.trim(),
    desc:m_desc.value.trim(),owner,prio:m_prio.value,status:m_status.value,
    dep:m_dep.value.trim(),time:m_time.value.trim(),note:m_note.value.trim()};
  const isNew = editIndex==null;
  if(isNew) data.push(rec); else data[editIndex]=rec;
  save(); closeSub(); render();
  if(isNew) notifyNewTask(rec);
};

const goverlay=document.getElementById("goverlay");
function openGroup(name){
  editGroupName = name||null;
  document.getElementById("gmodalTitle").textContent = name ? "Edit Task" : "Add Task";
  document.getElementById("gDeleteBtn").style.display = name ? "inline-block" : "none";
  document.getElementById("gFirstField").style.display = name ? "none" : "flex";
  g_name.value = name||""; g_first.value="";
  goverlay.classList.add("open"); g_name.focus();
}
function closeGroup(){ goverlay.classList.remove("open"); editGroupName=null; }
document.getElementById("addGroupBtn").onclick=()=>openGroup(null);
document.getElementById("gCancelBtn").onclick=closeGroup;
goverlay.addEventListener("click",e=>{if(e.target===goverlay)closeGroup()});
document.getElementById("gSaveBtn").onclick=()=>{
  const name=g_name.value.trim(); if(!name){g_name.focus();return;}
  let newGroupRec=null;
  if(editGroupName){
    if(name!==editGroupName){
      data.forEach(d=>{ if(d.group===editGroupName) d.group=name; });
      if(collapsed[editGroupName]){ collapsed[name]=true; delete collapsed[editGroupName]; saveCollapsed(); }
    }
  } else {
    const num=groupsInOrder().length+1;
    newGroupRec={id:"G-"+String(num).padStart(2,"0"),group:name,sub:g_first.value.trim(),
      desc:"",owner:"",prio:"P2",status:"Not Started",dep:"",time:"",note:""};
    data.push(newGroupRec);
  }
  save(); closeGroup(); render();
  if(newGroupRec && newGroupRec.sub) notifyNewTask(newGroupRec);
};
document.getElementById("gDeleteBtn").onclick=()=>{
  if(editGroupName&&confirm('Delete task "'+editGroupName+'" and all its subtasks?')){
    data=data.filter(d=>d.group!==editGroupName); delete collapsed[editGroupName];
    save(); saveCollapsed(); closeGroup(); render();
  }
};

document.getElementById("exportBtn").onclick=()=>{
  const cols=["id","group","sub","desc","owner","prio","status","dep","time","note"];
  const head=["Task ID","Group","Subtask","Description","Owner(s)","Priority","Status","Dependencies","Timeline","Notes"];
  const csv=[head.join(",")].concat(data.map(d=>cols.map(c=>{
    const v=(d[c]||"").toString().replace(/"/g,'""'); return /[",\n]/.test(v)?'"'+v+'"':v;
  }).join(","))).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download="ai_guru_tasks.csv";a.click();
};

// ---- shared cloud sync (Vercel Blob via /api/state) ----
const API="/api/state";
let lastSync=0, pushTimer=null, pushing=false, pushAgain=false;
function setSync(state){
  const dot=document.getElementById("syncDot"), txt=document.getElementById("syncText");
  if(!dot)return;
  const map={synced:["#39c2a0","Synced"],saving:["#ffb020","Saving…"],offline:["#ff5d6c","Offline (local only)"],loading:["#8a97ad","Connecting…"]};
  const [c,t]=map[state]||map.loading; dot.style.background=c; txt.textContent=t;
}
function modalOpen(){ return document.getElementById("overlay").classList.contains("open")||document.getElementById("goverlay").classList.contains("open"); }
function schedulePush(){ clearTimeout(pushTimer); pushTimer=setTimeout(remotePush,400); setSync("saving"); }
async function remotePush(){
  if(pushing){ pushAgain=true; return; }
  pushing=true;
  try{
    const res=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data,collapsed})});
    const j=await res.json();
    if(j&&j.updatedAt) lastSync=j.updatedAt;
    setSync("synced");
  }catch(e){ setSync("offline"); }
  pushing=false;
  if(pushAgain){ pushAgain=false; remotePush(); }
}
async function remotePull(initial){
  try{
    const res=await fetch(API,{cache:"no-store"});
    if(res.status===401){ location.replace("/login"); return false; }
    const j=await res.json();
    if(j&&Array.isArray(j.data)&&j.data.length&&(j.updatedAt||0)>lastSync){
      data=j.data; collapsed=j.collapsed||{}; lastSync=j.updatedAt||Date.now();
      localStorage.setItem(LS,JSON.stringify(data)); localStorage.setItem(LSC,JSON.stringify(collapsed));
      render();
    } else if(initial && !(Array.isArray(j.data)&&j.data.length)){
      await remotePush(); // first run: seed the cloud with local/SEED data
    }
    setSync("synced");
    return true;
  }catch(e){ setSync("offline"); return false; }
}
function revealApp(){ const g=document.getElementById("authGate"); if(g) g.remove(); }
function startPolling(){ setInterval(()=>{ if(!modalOpen()&&!pushing) remotePull(false); }, 5000); }

// Verify auth and load data BEFORE showing the app (no flash of the tracker pre-login).
async function boot(){
  setSync("loading");
  try{
    const res=await fetch(API,{cache:"no-store"});
    if(res.status===401){ location.replace("/login"); return; }   // not logged in -> never render the app
    const j=await res.json();
    if(j&&Array.isArray(j.data)&&j.data.length){
      data=j.data; collapsed=j.collapsed||{}; lastSync=j.updatedAt||Date.now();
      localStorage.setItem(LS,JSON.stringify(data)); localStorage.setItem(LSC,JSON.stringify(collapsed));
      setSync("synced");
    } else {
      // authed but cloud is empty -> seed it from local/SEED
      render(); revealApp();
      await remotePush();
      startPolling();
      return;
    }
  }catch(e){
    // offline: fall back to local cache (online unauthed users already got redirected on 401)
    setSync("offline");
  }
  render();
  revealApp();
  startPolling();
}

// ---- Google Chat notification on new task (server-side webhook via /api/notify) ----
async function notifyNewTask(task){
  try{ await fetch("/api/notify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({task})}); }catch(e){}
}

// ---- logout ----
const _logoutBtn=document.getElementById("logoutBtn");
if(_logoutBtn) _logoutBtn.onclick=async ()=>{
  try{ await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"logout"})}); }catch(e){}
  location.href="/login";
};

boot();
