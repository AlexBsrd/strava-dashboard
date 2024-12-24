import{a as L,b as N}from"./chunk-DT5GHXTD.js";import{$ as f,B as C,C as h,Ca as E,Da as I,Ea as D,Ga as k,Ia as T,M as o,N as O,T as p,V as s,Wa as F,Y as n,Z as r,_ as P,a as y,aa as _,b as u,ba as S,ca as b,da as d,ia as c,ja as v,ka as l,qa as M,sa as w,ta as A,x}from"./chunk-OOK45D6R.js";function K(i,t){i&1&&P(0,"app-spinner")}function R(i,t){if(i&1&&(n(0,"div",3),c(1),r()),i&2){let e=d();o(),l(" ",e.error," ")}}function V(i,t){if(i&1&&(f(0),n(1,"div",19)(2,"span",20),c(3,"Distance"),r(),n(4,"span",21),c(5),r()(),n(6,"div",19)(7,"span",20),c(8,"Dur\xE9e"),r(),n(9,"span",21),c(10),r()(),n(11,"div",19)(12,"span",20),c(13,"Vitesse moy."),r(),n(14,"span",21),c(15),r()(),n(16,"div",19)(17,"span",20),c(18,"D\xE9nivel\xE9"),r(),n(19,"span",21),c(20),r()(),_()),i&2){let e=d().$implicit,a=d(3);o(5),l("",e.distance.toFixed(1)," km"),o(5),v(a.formatDuration(e.elapsed_time)),o(5),l("",e.average_speed.toFixed(1)," km/h"),o(5),l("",e.total_elevation_gain,"m")}}function B(i,t){if(i&1&&(f(0),n(1,"div",22)(2,"span",20),c(3,"Dur\xE9e de s\xE9ance"),r(),n(4,"span",21),c(5),r()(),_()),i&2){let e=d().$implicit,a=d(3);o(5),v(a.formatDuration(e.elapsed_time))}}function U(i,t){if(i&1&&(n(0,"div",13)(1,"div",14)(2,"div",15),c(3),r(),n(4,"div",16),c(5),r()(),n(6,"h3",17),c(7),r(),n(8,"div",18),p(9,V,21,4,"ng-container",1)(10,B,6,1,"ng-container",1),r()()),i&2){let e=t.$implicit,a=d(3);s("ngClass",e.type.toLowerCase()),o(3),l(" ",e.type," "),o(2),l(" ",a.formatTime(e.start_date)," "),o(2),v(e.name),o(2),s("ngIf",a.isCardioActivity(e.type)),o(),s("ngIf",!a.isCardioActivity(e.type))}}function H(i,t){if(i&1&&(n(0,"div",8)(1,"div",9)(2,"div",10),c(3),r()(),n(4,"div",11),p(5,U,11,6,"div",12),r()()),i&2){let e=t.$implicit,a=d(2);o(3),l(" ",a.formatDayHeader(e.key)," "),o(2),s("ngForOf",e.value)}}function j(i,t){if(i&1){let e=S();n(0,"div")(1,"header",4)(2,"h1"),c(3,"Mes Activit\xE9s"),r(),n(4,"app-period-selector",5),b("periodChange",function(m){C(e);let g=d();return h(g.onPeriodChange(m))}),r()(),n(5,"div",6),p(6,H,6,2,"div",7),w(7,"keyvalue"),r()()}if(i&2){let e=d();o(4),s("selectedPeriod",e.selectedPeriod),o(2),s("ngForOf",A(7,2,e.groupedActivities,e.reverseOrder))}}var z=class i{constructor(t){this.stravaService=t}activities=[];groupedActivities={};isLoading=!1;error=null;selectedPeriod="week";cardioActivities=["RUN","RIDE","WALK","HIKE","ALPINESKI","BACKCOUNTRYSKI"];ngOnInit(){this.loadActivities()}onPeriodChange(t){this.selectedPeriod=t,this.loadActivities()}isCardioActivity(t){return this.cardioActivities.includes(t.toUpperCase())}formatDuration(t){let e=Math.floor(t/3600),a=Math.floor(t%3600/60);return e>0?`${e}h ${a}min`:`${a}min`}formatDayHeader(t){return new Date(t).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}formatTime(t){return new Date(t).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}reverseOrder=(t,e)=>t.key>e.key?-1:1;loadActivities(){this.isLoading=!0,this.error=null,this.stravaService.getActivities(this.selectedPeriod).subscribe({next:t=>{this.activities=t,this.groupActivitiesByDay(),this.isLoading=!1},error:t=>{console.error("Error loading activities:",t),this.isLoading=!1,this.error="Une erreur est survenue lors du chargement des activit\xE9s."}})}groupActivitiesByDay(){this.groupedActivities=this.activities.reduce((t,e)=>{let m=new Date(e.start_date).toISOString().split("T")[0];return t[m]||(t[m]=[]),t[m].push(u(y({},e),{start_date:new Date(e.start_date)})),t[m].sort((g,$)=>new Date($.start_date).getTime()-new Date(g.start_date).getTime()),t},{})}static \u0275fac=function(e){return new(e||i)(O(F))};static \u0275cmp=x({type:i,selectors:[["app-activities"]],standalone:!0,features:[M],decls:4,vars:3,consts:[[1,"activities-container"],[4,"ngIf"],["class","error-message",4,"ngIf"],[1,"error-message"],[1,"activities-header"],[3,"periodChange","selectedPeriod"],[1,"timeline"],["class","day-group",4,"ngFor","ngForOf"],[1,"day-group"],[1,"day-header"],[1,"date-badge"],[1,"activities-group"],["class","activity-card",3,"ngClass",4,"ngFor","ngForOf"],[1,"activity-card",3,"ngClass"],[1,"activity-header"],[1,"activity-type"],[1,"activity-time"],[1,"activity-name"],[1,"activity-stats"],[1,"stat"],[1,"stat-label"],[1,"stat-value"],[1,"stat","full-width"]],template:function(e,a){e&1&&(n(0,"div",0),p(1,K,1,0,"app-spinner",1)(2,R,2,1,"div",2)(3,j,8,5,"div",1),r()),e&2&&(o(),s("ngIf",a.isLoading),o(),s("ngIf",a.error),o(),s("ngIf",!a.isLoading&&!a.error))},dependencies:[T,E,I,D,k,L,N],styles:[".activities-container[_ngcontent-%COMP%]{padding:2rem;max-width:1200px;margin:0 auto}.activities-header[_ngcontent-%COMP%]{margin-bottom:2rem}.activities-header[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%]{font-size:2rem;color:var(--text-primary);margin-bottom:1rem}.timeline[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:2rem}.day-group[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:1rem}.day-header[_ngcontent-%COMP%]{display:flex;align-items:center;gap:1rem}.date-badge[_ngcontent-%COMP%]{background:var(--bg-primary);padding:.5rem 1rem;border-radius:20px;font-weight:500;color:var(--text-primary);font-size:.9rem;box-shadow:var(--shadow-sm)}.activities-group[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:1rem;margin-left:1rem}.activity-card[_ngcontent-%COMP%]{background:var(--bg-primary);border-radius:12px;padding:1.5rem;box-shadow:var(--shadow-sm);border-left:4px solid var(--gray-300);transition:transform .2s,box-shadow .2s}.activity-card[_ngcontent-%COMP%]:hover{transform:translate(4px);box-shadow:var(--shadow-md)}.activity-card.run[_ngcontent-%COMP%]{border-left-color:#ff5722}.activity-card.ride[_ngcontent-%COMP%]{border-left-color:#4caf50}.activity-card.walk[_ngcontent-%COMP%], .activity-card.hike[_ngcontent-%COMP%]{border-left-color:#ff9800}.activity-card.weighttraining[_ngcontent-%COMP%]{border-left-color:#9c27b0}.activity-card.alpineski[_ngcontent-%COMP%]{border-left-color:#2196f3}.activity-card.backcountryski[_ngcontent-%COMP%]{border-left-color:#1976d2}.activity-header[_ngcontent-%COMP%]{display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem;color:var(--text-secondary)}.activity-type[_ngcontent-%COMP%]{font-size:.85rem;font-weight:500;text-transform:uppercase;color:#666}.activity-time[_ngcontent-%COMP%]{font-size:.85rem;color:#666}.activity-name[_ngcontent-%COMP%]{font-size:1.1rem;font-weight:600;color:var(--text-primary);margin-bottom:1rem}.activity-stats[_ngcontent-%COMP%]{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}.stat[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:.25rem}.stat.full-width[_ngcontent-%COMP%]{grid-column:1 / -1}.stat-label[_ngcontent-%COMP%]{font-size:.75rem;color:#666;text-transform:uppercase}.stat-value[_ngcontent-%COMP%]{font-size:1rem;font-weight:500;color:#2d3748}.error-message[_ngcontent-%COMP%]{text-align:center;padding:2rem;color:var(--danger-color);background-color:#ffebee;border-radius:var(--radius-md);margin:2rem 0}@media (max-width: 768px){.activities-container[_ngcontent-%COMP%]{padding:1rem}.activity-stats[_ngcontent-%COMP%]{grid-template-columns:1fr}}"]})};export{z as ActivitiesComponent};
