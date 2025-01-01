import{B as g,C as x,Ea as M,G as b,I as h,Ka as O,L as v,M as d,N as C,T as P,V as _,X as c,Y as o,Z as i,_ as y,ba as w,ca as m,da as f,ia as a,ka as S,qa as p,x as s}from"./chunk-UC6G6HHT.js";function H(n,t){if(n&1){let e=w();o(0,"button",3),m("click",function(){let u=g(e).$implicit,l=f();return x(l.onChange(u.value))}),a(1),i()}if(n&2){let e=t.$implicit,r=f();c("active",r.selectedPeriod===e.value),d(),S(" ",e.label," ")}}var k=class n{constructor(t){this.elementRef=t}selectedPeriod="week";periodChange=new b;isHidden=!1;periods=[{value:"week",label:"7 derniers jours"},{value:"month",label:"30 derniers jours"},{value:"current_year",label:"Depuis le 1er janvier"},{value:"2024",label:"Ann\xE9e 2024"}];lastScrollTop=0;scrollThreshold=50;onScroll(){let t=window.scrollY;t>this.scrollThreshold?t>this.lastScrollTop?this.isHidden=!0:this.isHidden=!1:this.isHidden=!1,this.lastScrollTop=t}onChange(t){this.selectedPeriod=t,this.periodChange.emit(t)}static \u0275fac=function(e){return new(e||n)(C(h))};static \u0275cmp=s({type:n,selectors:[["app-period-selector"]],hostBindings:function(e,r){e&1&&m("scroll",function(l){return r.onScroll(l)},!1,v)},inputs:{selectedPeriod:"selectedPeriod"},outputs:{periodChange:"periodChange"},standalone:!0,features:[p],decls:3,vars:3,consts:[[1,"period-selector-wrapper"],[1,"period-buttons"],["class","period-button",3,"active","click",4,"ngFor","ngForOf"],[1,"period-button",3,"click"]],template:function(e,r){e&1&&(o(0,"div",0)(1,"div",1),P(2,H,2,3,"button",2),i()()),e&2&&(c("hidden",r.isHidden),d(2),_("ngForOf",r.periods))},dependencies:[O,M],styles:[".period-selector-wrapper[_ngcontent-%COMP%]{position:sticky;top:120px;z-index:90;padding:1rem;display:flex;justify-content:center;transition:transform .3s ease}.period-selector-wrapper.hidden[_ngcontent-%COMP%]{transform:translateY(-150%)}.period-buttons[_ngcontent-%COMP%]{display:flex;gap:.75rem;padding:.75rem;background:rgba(var(--bg-primary-rgb),.95);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-radius:var(--radius-lg);box-shadow:0 2px 8px #0000001a,0 0 1px #00000026}.period-button[_ngcontent-%COMP%]{padding:.75rem 1.25rem;border:1px solid var(--gray-200);background:var(--bg-primary);border-radius:var(--radius-md);color:var(--text-primary);font-weight:500;font-size:.95rem;cursor:pointer;transition:all .2s ease;white-space:nowrap;min-height:44px}.period-button[_ngcontent-%COMP%]:hover{background:var(--primary-50);border-color:var(--primary-200);transform:translateY(-1px);box-shadow:0 2px 4px #0000000d}.period-button.active[_ngcontent-%COMP%]{background:var(--primary-500);border-color:var(--primary-600);color:#fff}@media (max-width: 768px){.period-selector-wrapper[_ngcontent-%COMP%]{top:180px;padding:.5rem}.period-buttons[_ngcontent-%COMP%]{flex-direction:column;width:calc(100% - 2rem);max-width:400px}.period-button[_ngcontent-%COMP%]{width:100%;text-align:center}}"]})};var T=class n{static \u0275fac=function(e){return new(e||n)};static \u0275cmp=s({type:n,selectors:[["app-spinner"]],standalone:!0,features:[p],decls:4,vars:0,consts:[[1,"spinner-overlay"],[1,"spinner"],[1,"spinner-text"]],template:function(e,r){e&1&&(o(0,"div",0),y(1,"div",1),o(2,"div",2),a(3,"Chargement des activit\xE9s..."),i()())},styles:[".spinner-overlay[_ngcontent-%COMP%]{position:fixed;top:0;left:0;width:100%;height:100%;background-color:#fffc;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:1000}.spinner[_ngcontent-%COMP%]{width:50px;height:50px;border:3px solid #f3f3f3;border-radius:50%;border-top:3px solid #2196F3;animation:_ngcontent-%COMP%_spin 1s linear infinite}.spinner-text[_ngcontent-%COMP%]{margin-top:1rem;color:#2196f3;font-weight:500}@keyframes _ngcontent-%COMP%_spin{0%{transform:rotate(0)}to{transform:rotate(360deg)}}@media (max-width: 768px){.spinner[_ngcontent-%COMP%]{width:40px;height:40px}.spinner-text[_ngcontent-%COMP%]{font-size:.9rem}}"]})};export{k as a,T as b};