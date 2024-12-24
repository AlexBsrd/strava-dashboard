import{c as Q,d as X,f as I,g as Z}from"./chunk-PUAS7KUQ.js";import{B as L,C as U,Ea as q,Fa as W,Ia as G,Ja as J,K as Y,M as o,N as S,T as P,V as p,Wa as K,Y as t,Z as i,_ as m,ba as $,ca as B,da as f,f as A,g as T,h as R,ia as n,ja as s,k as h,ka as H,l as j,la as g,n as w,o as F,qa as E,s as b,sa as N,ta as V,v as z,x as C}from"./chunk-OOK45D6R.js";var M=class l{static \u0275fac=function(e){return new(e||l)};static \u0275cmp=C({type:l,selectors:[["app-profile-skeleton"]],standalone:!0,features:[E],decls:38,vars:0,consts:[[1,"skeleton-profile-card"],[1,"skeleton","skeleton-avatar"],[1,"skeleton-info"],[1,"skeleton","skeleton-name"],[1,"skeleton-details"],[1,"skeleton","skeleton-detail"],[1,"skeleton-stats-grid"],[1,"skeleton-stats-card"],[1,"skeleton","skeleton-card-title"],[1,"skeleton-stats-details"],[1,"skeleton-stat"],[1,"skeleton","skeleton-stat-label"],[1,"skeleton","skeleton-stat-value"]],template:function(e,a){e&1&&(t(0,"div",0),m(1,"div",1),t(2,"div",2),m(3,"div",3),t(4,"div",4),m(5,"div",5)(6,"div",5),i()()(),t(7,"div",6)(8,"div",7),m(9,"div",8),t(10,"div",9)(11,"div",10),m(12,"div",11)(13,"div",12),i(),t(14,"div",10),m(15,"div",11)(16,"div",12),i(),t(17,"div",10),m(18,"div",11)(19,"div",12),i(),t(20,"div",10),m(21,"div",11)(22,"div",12),i()()(),t(23,"div",7),m(24,"div",8),t(25,"div",9)(26,"div",10),m(27,"div",11)(28,"div",12),i(),t(29,"div",10),m(30,"div",11)(31,"div",12),i(),t(32,"div",10),m(33,"div",11)(34,"div",12),i(),t(35,"div",10),m(36,"div",11)(37,"div",12),i()()()())},styles:[".skeleton[_ngcontent-%COMP%]{animation:_ngcontent-%COMP%_pulse 1.5s ease-in-out infinite;background:linear-gradient(90deg,var(--bg-primary) 25%,var(--gray-200) 37%,var(--bg-primary) 63%);background-size:400% 100%}@keyframes _ngcontent-%COMP%_pulse{0%{background-position:100% 50%}to{background-position:0 50%}}.skeleton-profile-card[_ngcontent-%COMP%]{display:flex;align-items:center;gap:2rem;background:var(--bg-primary);padding:2rem;border-radius:16px;box-shadow:var(--shadow-sm);margin-bottom:2rem}.skeleton-avatar[_ngcontent-%COMP%]{width:150px;height:150px;border-radius:50%}.skeleton-info[_ngcontent-%COMP%]{flex:1}.skeleton-name[_ngcontent-%COMP%]{height:2.5rem;width:200px;border-radius:8px;margin-bottom:1rem}.skeleton-details[_ngcontent-%COMP%]{display:flex;gap:1.5rem}.skeleton-detail[_ngcontent-%COMP%]{height:1rem;width:120px;border-radius:4px}.skeleton-stats-grid[_ngcontent-%COMP%]{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem}.skeleton-stats-card[_ngcontent-%COMP%]{background:var(--bg-primary);padding:1.5rem;border-radius:12px;box-shadow:var(--shadow-sm)}.skeleton-card-title[_ngcontent-%COMP%]{height:1.5rem;width:150px;border-radius:4px;margin-bottom:1.5rem}.skeleton-stats-details[_ngcontent-%COMP%]{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}.skeleton-stat[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:.5rem}.skeleton-stat-label[_ngcontent-%COMP%]{height:.8rem;width:80px;border-radius:4px}.skeleton-stat-value[_ngcontent-%COMP%]{height:1.2rem;width:100px;border-radius:4px}@media (max-width: 768px){.skeleton-profile-card[_ngcontent-%COMP%]{flex-direction:column;text-align:center;padding:1.5rem}.skeleton-avatar[_ngcontent-%COMP%]{width:120px;height:120px}.skeleton-details[_ngcontent-%COMP%]{justify-content:center}.skeleton-stats-grid[_ngcontent-%COMP%]{grid-template-columns:1fr}}"]})};var O=class l{constructor(r){this.http=r}apiUrl="https://www.strava.com/api/v3";getAthleteProfile(){return this.http.get(`${this.apiUrl}/athlete`).pipe(w(r=>(console.error("Erreur lors de la r\xE9cup\xE9ration du profil:",r),h(()=>new Error("Impossible de r\xE9cup\xE9rer le profil de l'athl\xE8te")))))}getAthleteSummary(){return localStorage.getItem("strava_athlete_id")?this.getAllActivities().pipe(j(e=>{let a=new Date().getFullYear(),d=e.filter(c=>new Date(c.start_date).getFullYear()===a),u=e.filter(c=>c.type==="Run"),te=e.filter(c=>c.type==="Ride"),ie=d.filter(c=>c.type==="Run"),ne=d.filter(c=>c.type==="Ride"),v=this.findBiggestClimb(d),_=this.findLongestRun(d),y=this.findBiggestClimb(e),x=this.findLongestRun(e);return{all_run_totals:this.calculateTotals(u),all_ride_totals:this.calculateTotals(te),ytd_run_totals:this.calculateTotals(ie),ytd_ride_totals:this.calculateTotals(ne),current_year_records:{biggest_climb:{value:v?.total_elevation_gain||0,activity_type:v?.type||"",activity_name:v?.name||"Aucune activit\xE9",activity_date:v?.start_date.toString()||"",activity_period:"current_year"},longest_run:{value:_?.distance||0,activity_type:_?.type||"",activity_name:_?.name||"Aucune activit\xE9",activity_date:_?.start_date.toString()||"",activity_period:"current_year"}},all_time_records:{biggest_climb:{value:y?.total_elevation_gain||0,activity_type:y?.type||"",activity_name:y?.name||"Aucune activit\xE9",activity_date:y?.start_date.toString()||"",activity_period:"all_time"},longest_run:{value:x?.distance||0,activity_type:x?.type||"",activity_name:x?.name||"Aucune activit\xE9",activity_date:x?.start_date.toString()||"",activity_period:"all_time"}}}}),w(e=>(console.error("Erreur lors de la r\xE9cup\xE9ration des statistiques:",e),h(()=>new Error("Impossible de r\xE9cup\xE9rer les statistiques de l'athl\xE8te"))))):h(()=>new Error("ID de l'athl\xE8te non trouv\xE9"))}getAllActivities(){return new A(r=>{let e=(a,d=[])=>{this.http.get(`${this.apiUrl}/athlete/activities`,{params:{per_page:"200",page:a.toString()}}).subscribe({next:u=>{u.length===0?(r.next(d),r.complete()):e(a+1,[...d,...u])},error:u=>r.error(u)})};e(1)})}filterCurrentYear(r){let e=new Date().getFullYear();return r.filter(a=>new Date(a.start_date).getFullYear()===e)}calculateTotals(r){return{count:r.length,distance:r.reduce((e,a)=>e+(a.distance||0),0),moving_time:r.reduce((e,a)=>e+(a.moving_time||0),0),elapsed_time:r.reduce((e,a)=>e+(a.elapsed_time||0),0),elevation_gain:r.reduce((e,a)=>e+(a.total_elevation_gain||0),0)}}findBiggestClimb(r){let e=r.filter(a=>a.type==="Run"||a.type==="Walk"||a.type==="Hike");if(e.length!==0)return e.reduce((a,d)=>!a||d.total_elevation_gain>a.total_elevation_gain?d:a,e[0])}findLongestRun(r){let e=r.filter(a=>a.type==="Run"||a.type==="Walk"||a.type==="Hike");if(e.length!==0)return e.reduce((a,d)=>!a||d.distance>a.distance?d:a,e[0])}static \u0275fac=function(e){return new(e||l)(z(J))};static \u0275prov=b({token:l,factory:l.\u0275fac,providedIn:"root"})};var k=class l{cache={profile:null,summary:null,lastUpdate:null};profileSubject=new R(this.cache);setProfileData(r,e){this.cache={profile:r,summary:e,lastUpdate:new Date},this.profileSubject.next(this.cache)}getProfileData$(){return this.profileSubject.asObservable()}needsRefresh(){if(!this.cache.lastUpdate||!this.cache.profile||!this.cache.summary)return!0;let r=new Date(Date.now()-30*60*1e3);return this.cache.lastUpdate<r}clear(){this.cache={profile:null,summary:null,lastUpdate:null},this.profileSubject.next(this.cache)}static \u0275fac=function(e){return new(e||l)};static \u0275prov=b({token:l,factory:l.\u0275fac,providedIn:"root"})};function le(l,r){l&1&&m(0,"app-profile-skeleton")}function se(l,r){if(l&1){let e=$();t(0,"div",4)(1,"div",5)(2,"div",6),n(3,"\u26A0\uFE0F"),i(),t(4,"p"),n(5),i(),t(6,"button",7),B("click",function(){L(e);let d=f();return U(d.reconnect())}),n(7," Se reconnecter \xE0 Strava "),i()()()}if(l&2){let e=f();o(5),s(e.error)}}function me(l,r){if(l&1&&(t(0,"span",15)(1,"i",16),n(2,"\u{1F4CD}"),i(),n(3),i()),l&2){let e=f(2);o(3),g(" ",e.profile.city,", ",e.profile.country," ")}}function de(l,r){if(l&1&&(t(0,"div",18)(1,"div",19)(2,"div",20)(3,"div",21),n(4,"\u{1F3C3}"),i(),t(5,"h3"),n(6,"Course \xE0 pied - Total"),i()(),t(7,"div",22)(8,"div",23)(9,"span",24),n(10),i(),t(11,"span",25),n(12,"distance totale"),i()(),t(13,"div",23)(14,"span",24),n(15),i(),t(16,"span",25),n(17,"temps total"),i()(),t(18,"div",23)(19,"span",24),n(20),i(),t(21,"span",25),n(22,"sorties"),i()(),t(23,"div",23)(24,"span",24),n(25),i(),t(26,"span",25),n(27,"d\xE9nivel\xE9 total"),i()()()(),t(28,"div",26)(29,"div",20)(30,"div",27),n(31,"\u{1F6B4}"),i(),t(32,"h3"),n(33,"V\xE9lo - Total"),i()(),t(34,"div",22)(35,"div",23)(36,"span",24),n(37),i(),t(38,"span",25),n(39,"distance totale"),i()(),t(40,"div",23)(41,"span",24),n(42),i(),t(43,"span",25),n(44,"temps total"),i()(),t(45,"div",23)(46,"span",24),n(47),i(),t(48,"span",25),n(49,"sorties"),i()(),t(50,"div",23)(51,"span",24),n(52),i(),t(53,"span",25),n(54,"d\xE9nivel\xE9 total"),i()()()(),t(55,"div",28)(56,"div",20)(57,"div",29),n(58,"\u{1F3C6}"),i(),t(59,"h3"),n(60,"Records (Course/Marche uniquement)"),i()(),t(61,"div",22)(62,"div",30)(63,"div",31)(64,"span",32),n(65,"Plus grand d\xE9nivel\xE9"),i(),t(66,"span",33),n(67),i(),t(68,"span",34),n(69),i(),t(70,"span",35),n(71),i()()(),t(72,"div",30)(73,"div",31)(74,"span",32),n(75,"Plus longue sortie"),i(),t(76,"span",33),n(77),i(),t(78,"span",34),n(79),i(),t(80,"span",35),n(81),i()()()()(),t(82,"div",36)(83,"div",20)(84,"div",21),n(85,"\u{1F3C3}"),i(),t(86,"h3"),n(87,"Course \xE0 pied - Cette ann\xE9e"),i()(),t(88,"div",22)(89,"div",23)(90,"span",24),n(91),i(),t(92,"span",25),n(93,"distance parcourue"),i()(),t(94,"div",23)(95,"span",24),n(96),i(),t(97,"span",25),n(98,"temps total"),i()(),t(99,"div",23)(100,"span",24),n(101),i(),t(102,"span",25),n(103,"sorties"),i()(),t(104,"div",23)(105,"span",24),n(106),i(),t(107,"span",25),n(108,"d\xE9nivel\xE9 total"),i()()()(),t(109,"div",37)(110,"div",20)(111,"div",27),n(112,"\u{1F6B4}"),i(),t(113,"h3"),n(114,"V\xE9lo - Cette ann\xE9e"),i()(),t(115,"div",22)(116,"div",23)(117,"span",24),n(118),i(),t(119,"span",25),n(120,"distance parcourue"),i()(),t(121,"div",23)(122,"span",24),n(123),i(),t(124,"span",25),n(125,"temps total"),i()(),t(126,"div",23)(127,"span",24),n(128),i(),t(129,"span",25),n(130,"sorties"),i()(),t(131,"div",23)(132,"span",24),n(133),i(),t(134,"span",25),n(135,"d\xE9nivel\xE9 total"),i()()()()()),l&2){let e=f(2);o(10),s(e.formatDistance(e.summary.all_run_totals.distance)),o(5),s(e.formatDuration(e.summary.all_run_totals.moving_time)),o(5),s(e.summary.all_run_totals.count),o(5),s(e.formatElevation(e.summary.all_run_totals.elevation_gain)),o(12),s(e.formatDistance(e.summary.all_ride_totals.distance)),o(5),s(e.formatDuration(e.summary.all_ride_totals.moving_time)),o(5),s(e.summary.all_ride_totals.count),o(5),s(e.formatElevation(e.summary.all_ride_totals.elevation_gain)),o(15),s(e.formatElevation(e.summary.all_time_records.biggest_climb.value)),o(2),g(" ",e.summary.all_time_records.biggest_climb.activity_name," (",e.summary.all_time_records.biggest_climb.activity_type,") "),o(2),s(e.formatDate(e.summary.all_time_records.biggest_climb.activity_date)),o(6),s(e.formatDistance(e.summary.all_time_records.longest_run.value)),o(2),g(" ",e.summary.all_time_records.longest_run.activity_name," (",e.summary.all_time_records.longest_run.activity_type,") "),o(2),s(e.formatDate(e.summary.all_time_records.longest_run.activity_date)),o(10),s(e.formatDistance(e.summary.ytd_run_totals.distance)),o(5),s(e.formatDuration(e.summary.ytd_run_totals.moving_time)),o(5),s(e.summary.ytd_run_totals.count),o(5),s(e.formatElevation(e.summary.ytd_run_totals.elevation_gain)),o(12),s(e.formatDistance(e.summary.ytd_ride_totals.distance)),o(5),s(e.formatDuration(e.summary.ytd_ride_totals.moving_time)),o(5),s(e.summary.ytd_ride_totals.count),o(5),s(e.formatElevation(e.summary.ytd_ride_totals.elevation_gain))}}function ce(l,r){if(l&1&&(t(0,"div",8)(1,"div",9)(2,"div",10),m(3,"img",11),i(),t(4,"div",12)(5,"h1"),n(6),i(),t(7,"div",13),P(8,me,4,2,"span",14),t(9,"span",15)(10,"i",16),n(11,"\u{1F3AF}"),i(),n(12),N(13,"date"),i()()()(),P(14,de,136,24,"div",17),i()),l&2){let e=f();p("@fadeIn",void 0),o(3),p("src",e.profile.profile||"/assets/images/default-avatar.png",Y)("alt",e.profile.firstname),o(3),g("",e.profile.firstname," ",e.profile.lastname,""),o(2),p("ngIf",e.profile.city||e.profile.country),o(4),H(" Membre depuis ",V(13,8,e.profile.created_at,"MMMM yyyy")," "),o(2),p("ngIf",e.summary)}}var Pe=Q("fadeIn",[Z(":enter",[I({opacity:0}),X("300ms ease-out",I({opacity:1}))])]),ee=class l{constructor(r,e,a){this.athleteService=r;this.profileCache=e;this.stravaService=a}profile=null;summary=null;isLoading=!0;error=null;destroy$=new T;ngOnInit(){this.profileCache.getProfileData$().pipe(F(this.destroy$)).subscribe(r=>{r.profile&&r.summary&&(this.profile=r.profile,this.summary=r.summary,this.isLoading=!1)}),this.loadProfile()}ngOnDestroy(){this.destroy$.next(),this.destroy$.complete()}formatDistance(r){return(r/1e3).toFixed(1)+" km"}formatDuration(r){let e=Math.floor(r/3600),a=Math.floor(r%3600/60);return`${e}h ${a}min`}formatElevation(r){return Math.round(r)+" m"}formatDate(r){return new Date(r).toLocaleDateString("fr-FR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}reconnect(){this.profileCache.clear(),this.stravaService.authenticate()}loadProfile(){if(!this.profileCache.needsRefresh()){this.isLoading=!1;return}this.isLoading=!0,this.error=null,Promise.all([this.athleteService.getAthleteProfile().toPromise(),this.athleteService.getAthleteSummary().toPromise()]).then(([r,e])=>{r&&e&&this.profileCache.setProfileData(r,e),this.isLoading=!1}).catch(r=>{console.error("Error loading profile:",r),this.error="Une erreur est survenue lors du chargement du profil.",this.isLoading=!1})}static \u0275fac=function(e){return new(e||l)(S(O),S(k),S(K))};static \u0275cmp=C({type:l,selectors:[["app-profile"]],standalone:!0,features:[E],decls:4,vars:3,consts:[[1,"profile-container"],[4,"ngIf"],["class","error-container",4,"ngIf"],["class","profile-content",4,"ngIf"],[1,"error-container"],[1,"error-message"],[1,"error-icon"],[1,"reconnect-button",3,"click"],[1,"profile-content"],[1,"profile-card"],[1,"profile-avatar"],[3,"src","alt"],[1,"profile-info"],[1,"profile-details"],["class","detail-item",4,"ngIf"],[1,"detail-item"],[1,"icon"],["class","stats-container",4,"ngIf"],[1,"stats-container"],[1,"stats-card","total-running"],[1,"stats-header"],[1,"stats-icon","running"],[1,"stats-body"],[1,"metric"],[1,"metric-value"],[1,"metric-label"],[1,"stats-card","total-cycling"],[1,"stats-icon","cycling"],[1,"stats-card"],[1,"stats-icon","trophy"],[1,"record-item"],[1,"record-info"],[1,"record-title"],[1,"record-value"],[1,"record-details"],[1,"record-date"],[1,"stats-card","ytd-running"],[1,"stats-card","ytd-cycling"]],template:function(e,a){e&1&&(t(0,"div",0),P(1,le,1,0,"app-profile-skeleton",1)(2,se,8,1,"div",2)(3,ce,15,11,"div",3),i()),e&2&&(o(),p("ngIf",a.isLoading),o(),p("ngIf",a.error),o(),p("ngIf",!a.isLoading&&!a.error&&a.profile))},dependencies:[G,q,W,M],styles:[".profile-container[_ngcontent-%COMP%]{max-width:1200px;margin:0 auto;padding:2rem}.profile-content[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:2rem}.profile-card[_ngcontent-%COMP%]{display:flex;align-items:center;gap:2rem;background:var(--bg-primary);padding:2rem;border-radius:16px;box-shadow:var(--shadow-sm)}.profile-avatar[_ngcontent-%COMP%]{width:150px;height:150px;border-radius:50%;overflow:hidden;flex-shrink:0}.profile-avatar[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:100%;height:100%;object-fit:cover}.profile-info[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%]{font-size:2rem;color:var(--text-primary);margin-bottom:1rem}.profile-details[_ngcontent-%COMP%]{display:flex;flex-wrap:wrap;gap:1.5rem}.detail-item[_ngcontent-%COMP%]{display:flex;align-items:center;gap:.5rem;color:var(--text-secondary);font-size:.95rem}.icon[_ngcontent-%COMP%]{font-size:1.2rem}.stats-container[_ngcontent-%COMP%]{display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:1.5rem}.stats-card[_ngcontent-%COMP%]{background:var(--bg-primary);border-radius:var(--radius-md);padding:1.5rem;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:1.5rem;transition:transform .2s,box-shadow .2s}.stats-card[_ngcontent-%COMP%]:hover{transform:translateY(-2px);box-shadow:0 4px 6px #0000001a}.stats-header[_ngcontent-%COMP%]{display:flex;align-items:center;gap:1rem}.stats-icon[_ngcontent-%COMP%]{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0}.stats-icon.running[_ngcontent-%COMP%]{background-color:#ffe0b2}.stats-icon.cycling[_ngcontent-%COMP%]{background-color:#b3e5fc}.stats-icon.trophy[_ngcontent-%COMP%]{background-color:#ffe0b2}.stats-header[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%]{font-size:1.1rem;color:var(--text-primary);margin:0}.stats-body[_ngcontent-%COMP%]{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem}.metric[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:.5rem}.metric-value[_ngcontent-%COMP%]{font-size:1.25rem;font-weight:600;color:var(--text-primary)}.metric-label[_ngcontent-%COMP%]{font-size:.85rem;color:var(--text-secondary)}.record-item[_ngcontent-%COMP%]{border-left:3px solid var(--primary-color);padding-left:1rem;margin-bottom:1rem}.record-info[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:.25rem}.record-title[_ngcontent-%COMP%]{font-size:.9rem;color:var(--gray-600);text-transform:uppercase}.record-value[_ngcontent-%COMP%]{font-size:1.5rem;font-weight:600;color:var(--gray-800)}.record-details[_ngcontent-%COMP%]{font-size:.9rem;color:var(--gray-800)}.record-date[_ngcontent-%COMP%]{font-size:.85rem;color:var(--gray-600);font-style:italic}.error-message[_ngcontent-%COMP%]{text-align:center;padding:2rem;color:var(--danger-color);background-color:#ffebee;border-radius:8px;margin:2rem 0}@media (max-width: 768px){.profile-container[_ngcontent-%COMP%]{padding:1rem}.profile-card[_ngcontent-%COMP%]{flex-direction:column;text-align:center;padding:1.5rem}.profile-avatar[_ngcontent-%COMP%]{width:120px;height:120px}.profile-details[_ngcontent-%COMP%]{justify-content:center}.stats-container[_ngcontent-%COMP%]{grid-template-columns:1fr}.stats-card[_ngcontent-%COMP%]{padding:1rem}.stats-body[_ngcontent-%COMP%]{grid-template-columns:repeat(2,1fr)}}@media (max-width: 480px){.stats-body[_ngcontent-%COMP%]{grid-template-columns:1fr}}.error-container[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center;padding:2rem}.error-message[_ngcontent-%COMP%]{background-color:#ffebee;border-radius:8px;padding:2rem;text-align:center;max-width:400px;width:100%}.error-icon[_ngcontent-%COMP%]{font-size:2rem;margin-bottom:1rem}.error-message[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{color:var(--danger-color);margin-bottom:1.5rem}.reconnect-button[_ngcontent-%COMP%]{background-color:var(--primary-color);color:#fff;border:none;padding:.75rem 1.5rem;border-radius:6px;font-size:1rem;font-weight:500;cursor:pointer;transition:background-color .2s}.reconnect-button[_ngcontent-%COMP%]:hover{background-color:var(--primary-dark)}.reconnect-button[_ngcontent-%COMP%]:active{transform:translateY(1px)}"]})};export{ee as ProfileComponent,Pe as fadeIn};
