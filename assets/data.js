/* data.js — constants, seed data, shared helpers (loaded before app.js) */
const STATUSES=["Not Started","In Progress","Blocked","In Review","Done"];
const ST_HEX={"Not Started":"#8a97ad","In Progress":"#5b8cff","Blocked":"#ff5d6c","In Review":"#b07cff","Done":"#39c2a0"};
const P_HEX={P0:"#ff5d6c",P1:"#ffb020",P2:"#39c2a0"};
const LETTERS="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const TEAM=["Ashok","Abhishek","Daksh","Subha","Prafful","Aditya","Mihir","Gautam","Imtiaz","Reyvant"];
function rgba(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`}

const SEED=[
 {id:"G-01",group:"Dashboard",sub:"Soft delete functionality",desc:"Revoke login, all metrics on all pages do not show this data. Database data is still there.",owner:"Ashok",prio:"P0",status:"In Progress",dep:"",time:"",note:""},
 {id:"G-01a",group:"Dashboard",sub:"Assessment Results",desc:"Red Users — parameter-wise filter to be with OR condition.",owner:"Ashok",prio:"P0",status:"Not Started",dep:"",time:"",note:""},
 {id:"G-01b",group:"Dashboard",sub:"Unit Wise Overview",desc:"Total Sessions and Red, Amber, Green should be of unique users (KPI Card).",owner:"Ashok",prio:"P0",status:"Not Started",dep:"",time:"",note:""},
 {id:"G-01c",group:"Dashboard",sub:"Whole loop of users attempted",desc:"Enrolment status, users attempting, sent for training, segregation of red users in third attempt, then segregation on RAG, then flag for HR.",owner:"Ashok",prio:"P2",status:"Not Started",dep:"",time:"",note:""},
 {id:"G-01d",group:"Dashboard",sub:"Addition of Logo",desc:"On login page and scenarios page — making the page look more engaging and funky.",owner:"Ashok",prio:"P2",status:"Not Started",dep:"",time:"",note:""},
 {id:"G-01e",group:"Dashboard",sub:"User assignment in bulk",desc:"Bulk upload of users to departments where they access their scenarios. Option to assign multiple scenarios by assigning to multiple departments.",owner:"Ashok",prio:"P2",status:"Not Started",dep:"",time:"",note:""},
 {id:"G-02",group:"Current App Fixes",sub:"Retry Upload",desc:"Making the reupload automatic.",owner:"Abhishek",prio:"P1",status:"In Progress",dep:"",time:"",note:""},
 {id:"G-02a",group:"Current App Fixes",sub:"Unattempted Users mismatch",desc:"Some users have attempted sessions according to BeKind Team but are showing as unattempted.",owner:"Abhishek",prio:"P0",status:"Not Started",dep:"",time:"",note:""},
 {id:"G-02b",group:"Current App Fixes",sub:"Superadmin Scenarios JSON",desc:"Bulk upload & edit for scenarios; difficult column should be properly structured. Currently uploading normal string then converting to JSON.",owner:"Abhishek",prio:"P2",status:"Not Started",dep:"",time:"",note:""},
 {id:"G-02c",group:"Current App Fixes",sub:"Report changes",desc:"Addition of a new section in report of doctor scenarios; UI changes; prompt changes.",owner:"Abhishek",prio:"P1",status:"Not Started",dep:"",time:"",note:""},
 {id:"G-03",group:"New app features",sub:"Introducing practice round",desc:"Practice talking with AI, getting used to the simulation, questions about the assessment, scenario specific.",owner:"Abhishek",prio:"P2",status:"Not Started",dep:"",time:"",note:""},
 {id:"G-03a",group:"New app features",sub:"Making Intro round static",desc:"Scenario-specific intro, non-interactive — like an audio brief before the roleplay.",owner:"Abhishek",prio:"P2",status:"Not Started",dep:"",time:"",note:""},
 {id:"G-03b",group:"New app features",sub:"Feedback round",desc:"AI will mention what was done wrong/right, SOP steps followed/missed. Will be interactive.",owner:"Abhishek",prio:"P2",status:"Not Started",dep:"",time:"",note:""},
];

const LS="aig_tracker_v3", LSC="aig_collapsed_v3";
