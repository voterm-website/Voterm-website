
(function(){
 const q=s=>document.querySelector(s); const qa=s=>[...document.querySelectorAll(s)];
 const menu=q('#menu'),nav=q('#nav'); if(menu&&nav)menu.onclick=()=>nav.classList.toggle('open');
 qa('[data-year]').forEach(x=>x.textContent=new Date().getFullYear());
 const cfg=window.VOTREM_CONFIG||{}; let db=null;
 if(window.supabase&&cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY) db=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
 window.votremDB=db;
 async function loadTable(table,render){ if(!db)return; const {data,error}=await db.from(table).select('*').eq('published',true).order('created_at',{ascending:false}); if(!error)render(data||[]); }
 window.VOTREM={loadTable};
 function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 window.votremEsc=esc;
 async function submitForm(form,table,map){form.addEventListener('submit',async e=>{e.preventDefault();const status=form.querySelector('.status');const btn=form.querySelector('button[type=submit]');if(!db){status.textContent='The secure submission system is not connected yet.';status.className='status error';return;}btn.disabled=true;status.textContent='Submitting...';status.className='status';const payload=map(new FormData(form));const {error}=await db.from(table).insert(payload);btn.disabled=false;if(error){status.textContent='Unable to submit right now. Please try again.';status.className='status error';return;}status.textContent='Thank you. Your submission has been received.';status.className='status ok';form.reset();});}
 window.votremSubmit=submitForm;
})();
