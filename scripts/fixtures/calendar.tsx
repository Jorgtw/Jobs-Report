import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider, useTranslation } from '../../src/contexts/LanguageContext';
import CalendarView from '../../src/pages/CalendarView';
import ReportsView from '../../src/pages/ReportsView';
import { db } from '../../src/services/dbService';
import { calendarService } from '../../src/services/calendarService';
import { daysInRange, dateObject, localDate } from '../../src/services/workCalendar';
import type { CalendarOccurrence, ScheduleRule } from '../../src/services/workCalendar';
import type { User, Project, Client, WorkReport } from '../../src/types';
import '../../src/index.css';
const people: User[]=['Admin','Dogan','Marco'].map((name,i)=>({id:name.toLowerCase(),companyId:'company',name,username:name,password:'',role:i?'operator':'admin',status:'active',createdAt:0}));
const projects: Project[]=[{id:'alfa',clientId:'client',name:'Pulizia Ufficio Alfa',description:'Pulizia ufficio',address:'Frederiksberg',status:'active',createdAt:0,assignedWorkerIds:['dogan','marco']},{id:'manual',clientId:'client',name:'Progetto senza pianificazione',description:'',status:'active',createdAt:0}];
const clients=[{id:'client',name:'Cliente Alfa'}] as Client[];
let rules: {id:string;rule:ScheduleRule;workers:string[]}[]=[{id:'series',rule:{project_id:'alfa',title:'Pulizia Ufficio Alfa',notes:'Ingresso principale',schedule_type:'recurring',start_date:'2026-01-01',end_date:null,start_time:'18:00',end_time:'20:00',weekdays:[0,3],status:'planned'},workers:['dogan']}];
const exceptions=new Map<string,{rule:ScheduleRule;workers:string[]}>();
let role='admin';
const reports: WorkReport[]=[];
let notify=(value:unknown)=>{};
db.getUsers=async()=>people;
db.getProjects=async()=>projects;
db.getClients=async()=>clients;
db.getReports=async()=>[...reports];
db.getSubcontractors=async()=>[];
db.addReport=async(data:any)=>{ const r={...data,id:`report-${reports.length+1}`,totalHours:db.calculateTotalHours(data.startTime,data.endTime,data.breakHours,data.manualTotalHours),createdAt:Date.now()};reports.push(r);notify(r);return r; };
calendarService.list=async(_c,from,to)=>{
 const result:CalendarOccurrence[]=[];
 for(const entry of rules) for(const date of daysInRange(from,to)) {
  if(date<entry.rule.start_date || (entry.rule.end_date && date>entry.rule.end_date) || (entry.rule.schedule_type==='recurring' && !entry.rule.weekdays.includes(dateObject(date).getDay()))) continue;
  const override=exceptions.get(`${entry.id}:${date}`);const effective=override || entry;
  if(role!=='admin' && !effective.workers.includes(role))continue;
  const p=projects.find(p=>p.id===entry.rule.project_id)!;
  result.push({scheduleId:entry.id,date,projectId:p.id,projectName:p.name,clientId:p.clientId,clientName:'Cliente Alfa',address:p.address||'',title:effective.rule.title,notes:effective.rule.notes,startTime:effective.rule.start_time,endTime:effective.rule.end_time,status:effective.rule.status,scheduleType:entry.rule.schedule_type,exceptionId:override?'exception':null,workers:people.filter(w=>effective.workers.includes(w.id) && (role==='admin'||w.id===role)).map(w=>({id:w.id,name:w.name})),reports:reports.filter(r=>r.scheduleId===entry.id&&r.scheduleDate===date&&(role==='admin'||r.userId===role)).map(r=>({id:r.id,workerId:r.userId}))});
 }
 return result;
};
calendarService.rule=async(_c,id)=>{const r=rules.find(r=>r.id===id)!;return {rule:{...r.rule},workers:[...r.workers]};};
calendarService.save=async(_c,id,scope,date,rule,workers,remove)=>{
 notify({id,scope,date,rule,workers,remove});
 if(scope==='this'&&id)exceptions.set(`${id}:${date}`,{rule,workers});
 else if(id) { rules=rules.map(r=>r.id===id?{id,rule,workers}:r); }
 else {id=`s${rules.length}`;rules.push({id,rule,workers});}
 return id;
};
const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
function Fixture(){
 const [user,setUser]=useState(people[0]);const [saved,setSaved]=useState<unknown>();notify=setSaved;
 const {lang,setLang}=useTranslation();
 return <main className="max-w-7xl mx-auto p-3 sm:p-6 bg-slate-50 min-h-screen"><header className="mb-4 flex flex-wrap items-center gap-3 border-b pb-3"><strong>Jobs Report · Test locale</strong><label>Test role <select value={user.id} onChange={e=>{role=e.target.value;setUser(people.find(p=>p.id===role)!);client.clear();}}>{people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Language <select value={lang} onChange={e=>setLang(e.target.value as any)}>{['it','en','es','pl','tr','da'].map(l=><option key={l}>{l}</option>)}</select></label><Link to="/calendar">Calendario</Link><Link to="/reports">Rapportini</Link></header><Routes><Route path="/reports" element={<ReportsView key={user.id} user={user}/>}/><Route path="*" element={<CalendarView key={user.id} user={user}/>}/></Routes><details className="mt-4"><summary>Saved test data</summary><pre aria-label="Saved test data" className="text-xs whitespace-pre-wrap break-all">{JSON.stringify(saved,null,2)}</pre></details><p className="text-xs mt-2">Local date: {localDate()}</p></main>;
}
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={client}><LanguageProvider><HashRouter><Fixture/></HashRouter></LanguageProvider></QueryClientProvider>);
