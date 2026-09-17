/* Search state and URL syncing for M3. */
window.HSJobs = window.HSJobs || {};
(function(){
  const state = window.HSJobs;
  state.search = function(jobs, filters){
    const keyword=(filters.keyword||'').trim().toLowerCase();
    const location=(filters.location||'').trim().toLowerCase();
    const category=(filters.category||'').trim().toLowerCase();
    return jobs.filter(job=>{
      const hay=[job.title,job.company,job.category,...job.skills].join(' ').toLowerCase();
      const locationHay=[job.location,job.city,job.state,job.workMode].join(' ').toLowerCase();
      return (!keyword || hay.includes(keyword)) && (!location || locationHay.includes(location)) && (!category || job.category.toLowerCase()===category);
    });
  };
  state.readQuery = function(){
    const p=new URLSearchParams(location.search);
    return {keyword:p.get('q')||'',location:p.get('location')||'',category:p.get('category')||''};
  };
  state.syncQuery = function(filters){
    const p=new URLSearchParams();
    if(filters.keyword)p.set('q',filters.keyword); if(filters.location)p.set('location',filters.location); if(filters.category)p.set('category',filters.category);
    const url=p.toString()?`${location.pathname}?${p}`:location.pathname;
    history.replaceState(null,'',url);
  };
})();