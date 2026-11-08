// In-memory transport only. No Supabase client, credentials, mail or remote I/O.
const seed=()=>({companies:[{id:'test-company',name:'TEST Jobs Report',status:'active'}],workers:[{id:'test-admin',company_id:'test-company',name:'Amministratore TEST',username:'testadmin',role:'admin',status:'active',hourly_rate:20,created_at:new Date().toISOString()}],clients:[],projects:[],reports:[],rapportini_workers:[],rapportini_expenses:[],subcontractors:[],user_companies:[],vw_access_control:[{company_id:'test-company',plan_code:'enterprise'}]});
export let tables:Record<string,any[]>=JSON.parse(localStorage.getItem('workflow-fixture-v1')||'null')||seed();
export const requests:any[]=[];
let failure:{table:string;operation:string}|null=null;
export const failNext=(table:string,operation:string)=>{failure={table,operation}};
const save=()=>localStorage.setItem('workflow-fixture-v1',JSON.stringify(tables));
class Query implements PromiseLike<any>{
 op='select';rows:any[]=[];filters:((r:any)=>boolean)[]=[];singleRow=false;countOnly=false;start=0;end=Infinity;sort='';ascending=true;columns='';
 constructor(public table:string){}
 select(columns='*',options:any={}){this.columns=columns;this.countOnly=!!options.head;return this}
 insert(rows:any){this.op='insert';this.rows=Array.isArray(rows)?rows:[rows];return this}
 upsert(rows:any){return this.insert(rows)}
 update(row:any){this.op='update';this.rows=[row];return this}
 delete(){this.op='delete';return this}
 eq(k:string,v:any){this.filters.push(r=>r[k]===v);return this}
 in(k:string,vs:any[]){this.filters.push(r=>vs.includes(r[k]));return this}
 gte(k:string,v:any){this.filters.push(r=>r[k]>=v);return this}
 lte(k:string,v:any){this.filters.push(r=>r[k]<=v);return this}
 gt(k:string,v:any){this.filters.push(r=>r[k]>v);return this}
 is(k:string,v:any){return this.eq(k,v)}
 order(k:string,opts:any={}){this.sort=k;this.ascending=opts.ascending!==false;return this}
 range(a:number,b:number){this.start=a;this.end=b;return this}
 limit(n:number){this.end=n-1;return this}
 single(){this.singleRow=true;return this}
 maybeSingle(){return this.single()}
 execute(){
  requests.push({table:this.table,operation:this.op});
  if(failure?.table===this.table&&failure.operation===this.op){failure=null;return {data:null,error:{message:'TEST: errore di salvataggio simulato'}}}
  const list=tables[this.table]??(tables[this.table]=[]);const matches=(r:any)=>this.filters.every(f=>f(r));let result:any[]=[];
  if(this.op==='insert'){result=this.rows.map(r=>({...r,id:r.id||crypto.randomUUID(),created_at:r.created_at||new Date().toISOString()}));list.push(...result);save()}
  else if(this.op==='update'){result=list.filter(matches);for(const r of result)for(const [k,v] of Object.entries(this.rows[0]))if(v!==undefined)r[k]=v;save()}
  else if(this.op==='delete'){result=list.filter(matches);tables[this.table]=list.filter(r=>!matches(r));save()}
  else result=list.filter(matches);
  if(this.sort)result=[...result].sort((a,b)=>String(a[this.sort]).localeCompare(String(b[this.sort]))*(this.ascending?1:-1));
  const count=result.length;result=result.slice(this.start,this.end===Infinity?undefined:this.end+1).map(r=>({...r}));
  if(this.table==='reports'&&this.columns.includes('additionalWorkers:'))result=result.map(r=>({...r,additionalWorkers:tables.rapportini_workers.filter(w=>w.rapportino_id===r.id),expenses:tables.rapportini_expenses.filter(e=>e.rapportino_id===r.id)}));
  return {data:this.countOnly?null:this.singleRow?(result[0]??null):result,error:null,count};
 }
 then(resolve:any,reject?:any){return Promise.resolve().then(()=>this.execute()).then(resolve,reject)}
}
export const supabase:any={from:(table:string)=>new Query(table),rpc:async(name:string,args:any={})=>{
 if(name==='save_report_atomic'){
  const snapshot=JSON.stringify(tables);
  try {
   const run=(q:Query)=>{const result=q.execute();if(result.error)throw result.error;return result.data};
   let r:any;
   if(args.p_report_id){r=run(new Query('reports').update(args.p_report).eq('id',args.p_report_id).eq('company_id',args.p_company_id).single());if(!r)throw new Error('Report unavailable')}
   else r=run(new Query('reports').insert(args.p_report).single());
   for(const [table,rows] of [['rapportini_expenses',args.p_expenses],['rapportini_workers',args.p_workers]] as const){
    if(rows===null)continue;run(new Query(table).delete().eq('rapportino_id',r.id));
    if(rows.length)run(new Query(table).insert(rows.map((x:any)=>({...x,rapportino_id:r.id}))));
   }
   return {data:{...r,expenses:tables.rapportini_expenses.filter(x=>x.rapportino_id===r.id),additionalWorkers:tables.rapportini_workers.filter(x=>x.rapportino_id===r.id)},error:null};
  }catch(error){tables=JSON.parse(snapshot);save();return {data:null,error}}
 }
 if(name==='save_project_with_compensations'){const r={...args.p_project,id:args.p_project_id||crypto.randomUUID(),worker_compensations:Object.entries(args.p_terms||{}).map(([worker_id,c]:any)=>({worker_id,...c,unit_rate:c.unitRate,fixed_amount:c.fixedAmount,unit_name:c.unitName}))};const i=tables.projects.findIndex(p=>p.id===r.id);if(i<0)tables.projects.push(r);else tables.projects[i]=r;save();return {data:r,error:null}}
 return {data:null,error:null};
},auth:{getSession:async()=>({data:{session:{access_token:'LOCAL_TEST_ONLY'}},error:null})}};
