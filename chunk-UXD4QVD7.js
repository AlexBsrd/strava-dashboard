import{B as u,C as f,Da as S,G as g,I as b,Ia as k,L as h,M as n,N as v,T as x,V as P,X as a,Y as s,Z as l,ba as C,ca as d,da as p,ia as _,ka as w,qa as y,x as m}from"./chunk-OOK45D6R.js";function T(o,e){if(o&1){let t=C();s(0,"button",3),d("click",function(){let c=u(t).$implicit,i=p();return f(i.onChange(c.value))}),_(1),l()}if(o&2){let t=e.$implicit,r=p();a("active",r.selectedPeriod===t.value),n(),w(" ",t.label," ")}}var O=class o{constructor(e){this.elementRef=e}selectedPeriod="week";periodChange=new g;isHidden=!1;periods=[{value:"week",label:"7 derniers jours"},{value:"month",label:"30 derniers jours"},{value:"current_year",label:"Depuis le 1er janvier"}];lastScrollTop=0;scrollThreshold=50;onScroll(){let e=window.scrollY;e>this.scrollThreshold?e>this.lastScrollTop?this.isHidden=!0:this.isHidden=!1:this.isHidden=!1,this.lastScrollTop=e}onChange(e){this.selectedPeriod=e,this.periodChange.emit(e)}static \u0275fac=function(t){return new(t||o)(v(b))};static \u0275cmp=m({type:o,selectors:[["app-period-selector"]],hostBindings:function(t,r){t&1&&d("scroll",function(i){return r.onScroll(i)},!1,h)},inputs:{selectedPeriod:"selectedPeriod"},outputs:{periodChange:"periodChange"},standalone:!0,features:[y],decls:3,vars:3,consts:[[1,"period-selector-wrapper"],[1,"period-buttons"],["class","period-button",3,"active","click",4,"ngFor","ngForOf"],[1,"period-button",3,"click"]],template:function(t,r){t&1&&(s(0,"div",0)(1,"div",1),x(2,T,2,3,"button",2),l()()),t&2&&(a("hidden",r.isHidden),n(2),P("ngForOf",r.periods))},dependencies:[k,S],styles:[".period-selector-wrapper[_ngcontent-%COMP%]{position:sticky;top:120px;z-index:90;padding:1rem;display:flex;justify-content:center;transition:transform .3s ease}.period-selector-wrapper.hidden[_ngcontent-%COMP%]{transform:translateY(-150%)}.period-buttons[_ngcontent-%COMP%]{display:flex;gap:.75rem;padding:.75rem;background:rgba(var(--bg-primary-rgb),.95);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-radius:var(--radius-lg);box-shadow:0 2px 8px #0000001a,0 0 1px #00000026}.period-button[_ngcontent-%COMP%]{padding:.75rem 1.25rem;border:1px solid var(--gray-200);background:var(--bg-primary);border-radius:var(--radius-md);color:var(--text-primary);font-weight:500;font-size:.95rem;cursor:pointer;transition:all .2s ease;white-space:nowrap;min-height:44px}.period-button[_ngcontent-%COMP%]:hover{background:var(--primary-50);border-color:var(--primary-200);transform:translateY(-1px);box-shadow:0 2px 4px #0000000d}.period-button.active[_ngcontent-%COMP%]{background:var(--primary-500);border-color:var(--primary-600);color:#fff}@media (max-width: 768px){.period-selector-wrapper[_ngcontent-%COMP%]{top:180px;padding:.5rem}.period-buttons[_ngcontent-%COMP%]{flex-direction:column;width:calc(100% - 2rem);max-width:400px}.period-button[_ngcontent-%COMP%]{width:100%;text-align:center}}"]})};export{O as a};
