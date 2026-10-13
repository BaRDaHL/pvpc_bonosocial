var ee=Object.defineProperty;var se=(i,t,e)=>t in i?ee(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var J=(i,t,e)=>se(i,typeof t!="symbol"?t+"":t,e);var Q=globalThis,X=Q.ShadowRoot&&(Q.ShadyCSS===void 0||Q.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,at=Symbol(),wt=new WeakMap,R=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==at)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(X&&t===void 0){let s=e!==void 0&&e.length===1;s&&(t=wt.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&wt.set(e,t))}return t}toString(){return this.cssText}},St=i=>new R(typeof i=="string"?i:i+"",void 0,at),it=(i,...t)=>{let e=i.length===1?i[0]:t.reduce((s,a,r)=>s+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(a)+i[r+1],i[0]);return new R(e,i,at)},Et=(i,t)=>{if(X)i.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let s=document.createElement("style"),a=Q.litNonce;a!==void 0&&s.setAttribute("nonce",a),s.textContent=e.cssText,i.appendChild(s)}},rt=X?i=>i:i=>i instanceof CSSStyleSheet?(t=>{let e="";for(let s of t.cssRules)e+=s.cssText;return St(e)})(i):i;var{is:ae,defineProperty:ie,getOwnPropertyDescriptor:re,getOwnPropertyNames:oe,getOwnPropertySymbols:ne,getPrototypeOf:ce}=Object,Z=globalThis,Ct=Z.trustedTypes,le=Ct?Ct.emptyScript:"",he=Z.reactiveElementPolyfillSupport,D=(i,t)=>i,ot={toAttribute(i,t){switch(t){case Boolean:i=i?le:null;break;case Object:case Array:i=i==null?i:JSON.stringify(i)}return i},fromAttribute(i,t){let e=i;switch(t){case Boolean:e=i!==null;break;case Number:e=i===null?null:Number(i);break;case Object:case Array:try{e=JSON.parse(i)}catch{e=null}}return e}},Pt=(i,t)=>!ae(i,t),Mt={attribute:!0,type:String,converter:ot,reflect:!1,useDefault:!1,hasChanged:Pt};Symbol.metadata??=Symbol("metadata"),Z.litPropertyMetadata??=new WeakMap;var C=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=Mt){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let s=Symbol(),a=this.getPropertyDescriptor(t,s,e);a!==void 0&&ie(this.prototype,t,a)}}static getPropertyDescriptor(t,e,s){let{get:a,set:r}=re(this.prototype,t)??{get(){return this[e]},set(o){this[e]=o}};return{get:a,set(o){let h=a?.call(this);r?.call(this,o),this.requestUpdate(t,h,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Mt}static _$Ei(){if(this.hasOwnProperty(D("elementProperties")))return;let t=ce(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(D("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(D("properties"))){let e=this.properties,s=[...oe(e),...ne(e)];for(let a of s)this.createProperty(a,e[a])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[s,a]of e)this.elementProperties.set(s,a)}this._$Eh=new Map;for(let[e,s]of this.elementProperties){let a=this._$Eu(e,s);a!==void 0&&this._$Eh.set(a,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let a of s)e.unshift(rt(a))}else t!==void 0&&e.push(rt(t));return e}static _$Eu(t,e){let s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Et(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){let s=this.constructor.elementProperties.get(t),a=this.constructor._$Eu(t,s);if(a!==void 0&&s.reflect===!0){let r=(s.converter?.toAttribute!==void 0?s.converter:ot).toAttribute(e,s.type);this._$Em=t,r==null?this.removeAttribute(a):this.setAttribute(a,r),this._$Em=null}}_$AK(t,e){let s=this.constructor,a=s._$Eh.get(t);if(a!==void 0&&this._$Em!==a){let r=s.getPropertyOptions(a),o=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:ot;this._$Em=a;let h=o.fromAttribute(e,r.type);this[a]=h??this._$Ej?.get(a)??h,this._$Em=null}}requestUpdate(t,e,s,a=!1,r){if(t!==void 0){let o=this.constructor;if(a===!1&&(r=this[t]),s??=o.getPropertyOptions(t),!((s.hasChanged??Pt)(r,e)||s.useDefault&&s.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,s))))return;this.C(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:a,wrapped:r},o){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),r!==!0||o!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),a===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[a,r]of this._$Ep)this[a]=r;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[a,r]of s){let{wrapped:o}=r,h=this[a];o!==!0||this._$AL.has(a)||h===void 0||this.C(a,void 0,r,h)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(e)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};C.elementStyles=[],C.shadowRootOptions={mode:"open"},C[D("elementProperties")]=new Map,C[D("finalized")]=new Map,he?.({ReactiveElement:C}),(Z.reactiveElementVersions??=[]).push("2.1.2");var pt=globalThis,kt=i=>i,tt=pt.trustedTypes,Ht=tt?tt.createPolicy("lit-html",{createHTML:i=>i}):void 0,zt="$lit$",P=`lit$${Math.random().toFixed(9).slice(2)}$`,Ut="?"+P,de=`<${Ut}>`,O=document,B=()=>O.createComment(""),I=i=>i===null||typeof i!="object"&&typeof i!="function",ft=Array.isArray,ue=i=>ft(i)||typeof i?.[Symbol.iterator]=="function",nt=`[ 	
\f\r]`,F=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Nt=/-->/g,Ot=/>/g,H=RegExp(`>|${nt}(?:([^\\s"'>=/]+)(${nt}*=${nt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),jt=/'/g,Tt=/"/g,Rt=/^(?:script|style|textarea|title)$/i,_t=i=>(t,...e)=>({_$litType$:i,strings:t,values:e}),m=_t(1),A=_t(2),Ee=_t(3),j=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),Lt=new WeakMap,N=O.createTreeWalker(O,129);function Dt(i,t){if(!ft(i)||!i.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ht!==void 0?Ht.createHTML(t):t}var pe=(i,t)=>{let e=i.length-1,s=[],a,r=t===2?"<svg>":t===3?"<math>":"",o=F;for(let h=0;h<e;h++){let c=i[h],d,l,n=-1,_=0;for(;_<c.length&&(o.lastIndex=_,l=o.exec(c),l!==null);)_=o.lastIndex,o===F?l[1]==="!--"?o=Nt:l[1]!==void 0?o=Ot:l[2]!==void 0?(Rt.test(l[2])&&(a=RegExp("</"+l[2],"g")),o=H):l[3]!==void 0&&(o=H):o===H?l[0]===">"?(o=a??F,n=-1):l[1]===void 0?n=-2:(n=o.lastIndex-l[2].length,d=l[1],o=l[3]===void 0?H:l[3]==='"'?Tt:jt):o===Tt||o===jt?o=H:o===Nt||o===Ot?o=F:(o=H,a=void 0);let $=o===H&&i[h+1].startsWith("/>")?" ":"";r+=o===F?c+de:n>=0?(s.push(d),c.slice(0,n)+zt+c.slice(n)+P+$):c+P+(n===-2?h:$)}return[Dt(i,r+(i[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]},q=class i{constructor({strings:t,_$litType$:e},s){let a;this.parts=[];let r=0,o=0,h=t.length-1,c=this.parts,[d,l]=pe(t,e);if(this.el=i.createElement(d,s),N.currentNode=this.el.content,e===2||e===3){let n=this.el.content.firstChild;n.replaceWith(...n.childNodes)}for(;(a=N.nextNode())!==null&&c.length<h;){if(a.nodeType===1){if(a.hasAttributes())for(let n of a.getAttributeNames())if(n.endsWith(zt)){let _=l[o++],$=a.getAttribute(n).split(P),f=/([.?@])?(.*)/.exec(_);c.push({type:1,index:r,name:f[2],strings:$,ctor:f[1]==="."?lt:f[1]==="?"?ht:f[1]==="@"?dt:L}),a.removeAttribute(n)}else n.startsWith(P)&&(c.push({type:6,index:r}),a.removeAttribute(n));if(Rt.test(a.tagName)){let n=a.textContent.split(P),_=n.length-1;if(_>0){a.textContent=tt?tt.emptyScript:"";for(let $=0;$<_;$++)a.append(n[$],B()),N.nextNode(),c.push({type:2,index:++r});a.append(n[_],B())}}}else if(a.nodeType===8)if(a.data===Ut)c.push({type:2,index:r});else{let n=-1;for(;(n=a.data.indexOf(P,n+1))!==-1;)c.push({type:7,index:r}),n+=P.length-1}r++}}static createElement(t,e){let s=O.createElement("template");return s.innerHTML=t,s}};function T(i,t,e=i,s){if(t===j)return t;let a=s!==void 0?e._$Co?.[s]:e._$Cl,r=I(t)?void 0:t._$litDirective$;return a?.constructor!==r&&(a?._$AO?.(!1),r===void 0?a=void 0:(a=new r(i),a._$AT(i,e,s)),s!==void 0?(e._$Co??=[])[s]=a:e._$Cl=a),a!==void 0&&(t=T(i,a._$AS(i,t.values),a,s)),t}var ct=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:s}=this._$AD,a=(t?.creationScope??O).importNode(e,!0);N.currentNode=a;let r=N.nextNode(),o=0,h=0,c=s[0];for(;c!==void 0;){if(o===c.index){let d;c.type===2?d=new V(r,r.nextSibling,this,t):c.type===1?d=new c.ctor(r,c.name,c.strings,this,t):c.type===6&&(d=new ut(r,this,t)),this._$AV.push(d),c=s[++h]}o!==c?.index&&(r=N.nextNode(),o++)}return N.currentNode=O,a}p(t){let e=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}},V=class i{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,a){this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=a,this._$Cv=a?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=T(this,t,e),I(t)?t===p||t==null||t===""?(this._$AH!==p&&this._$AR(),this._$AH=p):t!==this._$AH&&t!==j&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):ue(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==p&&I(this._$AH)?this._$AA.nextSibling.data=t:this.T(O.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:s}=t,a=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=q.createElement(Dt(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===a)this._$AH.p(e);else{let r=new ct(a,this),o=r.u(this.options);r.p(e),this.T(o),this._$AH=r}}_$AC(t){let e=Lt.get(t.strings);return e===void 0&&Lt.set(t.strings,e=new q(t)),e}k(t){ft(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,a=0;for(let r of t)a===e.length?e.push(s=new i(this.O(B()),this.O(B()),this,this.options)):s=e[a],s._$AI(r),a++;a<e.length&&(this._$AR(s&&s._$AB.nextSibling,a),e.length=a)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let s=kt(t).nextSibling;kt(t).remove(),t=s}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},L=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,a,r){this.type=1,this._$AH=p,this._$AN=void 0,this.element=t,this.name=e,this._$AM=a,this.options=r,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=p}_$AI(t,e=this,s,a){let r=this.strings,o=!1;if(r===void 0)t=T(this,t,e,0),o=!I(t)||t!==this._$AH&&t!==j,o&&(this._$AH=t);else{let h=t,c,d;for(t=r[0],c=0;c<r.length-1;c++)d=T(this,h[s+c],e,c),d===j&&(d=this._$AH[c]),o||=!I(d)||d!==this._$AH[c],d===p?t=p:t!==p&&(t+=(d??"")+r[c+1]),this._$AH[c]=d}o&&!a&&this.j(t)}j(t){t===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},lt=class extends L{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===p?void 0:t}},ht=class extends L{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==p)}},dt=class extends L{constructor(t,e,s,a,r){super(t,e,s,a,r),this.type=5}_$AI(t,e=this){if((t=T(this,t,e,0)??p)===j)return;let s=this._$AH,a=t===p&&s!==p||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,r=t!==p&&(s===p||a);a&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},ut=class{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){T(this,t)}};var fe=pt.litHtmlPolyfillSupport;fe?.(q,V),(pt.litHtmlVersions??=[]).push("3.3.3");var Ft=(i,t,e)=>{let s=e?.renderBefore??t,a=s._$litPart$;if(a===void 0){let r=e?.renderBefore??null;s._$litPart$=a=new V(t.insertBefore(B(),r),r,void 0,e??{})}return a._$AI(i),a};var mt=globalThis,k=class extends C{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Ft(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return j}};k._$litElement$=!0,k.finalized=!0,mt.litElementHydrateSupport?.({LitElement:k});var _e=mt.litElementPolyfillSupport;_e?.({LitElement:k});(mt.litElementVersions??=[]).push("4.2.2");var me="1.1.5",$t="pvpc-bono-social-card",Bt="pvpc-hourly-pricing-card",It=["var(--pvpc-bs-verde)","var(--pvpc-bs-amarillo)","var(--pvpc-bs-naranja)","var(--pvpc-bs-rojo)"],$e={P1:3,P2:2,P3:0},gt="#4269d0",qt="#f4bd4a";function yt(i,t){return Array.isArray(i)&&i.length===3&&i.every(e=>Number.isFinite(Number(e)))?`rgb(${i.map(Number).join(", ")})`:typeof i=="string"&&i.trim()?i.trim():t}var ge=`conic-gradient(${["verde","amarillo","naranja","rojo"].map((i,t)=>`var(--pvpc-bs-${i}) ${t*25}% ${(t+1)*25}%`).join(", ")})`,Vt={min:"M1,3H23L12,22",max:"M1,21H23L12,2",min_hueco:"M12,22L1,3H23L12,22M12,17.5L19.5,5H4.5L12,17.5Z",max_hueco:"M12,2L1,21H23M12,6L19.53,19H4.47"},Wt={es:{titulo:"Precio de la luz",ahora:"Ahora",hoy:"Hoy",manana:"Ma\xF1ana",minimo:"M\xEDnimo",maximo:"M\xE1ximo",anterior:"Factura periodo anterior",en_curso:"Factura periodo en curso",prevision:"previsi\xF3n",estimada_cierre:"Factura estimada",facturas:"Facturas",sin_facturas:"A\xFAn no hay facturas cerradas",estimada:"estimada",desviacion:"desviaci\xF3n",real:"real",sin_precio:"Sin precios",no_disponible:"No disponible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"llano",P3:"valle"},sin_entidad:"No se encuentra el sensor de precio de PVPC + Bono Social"},en:{titulo:"Electricity price",ahora:"Now",hoy:"Today",manana:"Tomorrow",minimo:"Minimum",maximo:"Maximum",anterior:"Previous bill",en_curso:"Current bill",prevision:"forecast",estimada_cierre:"Estimated bill",facturas:"Bills",sin_facturas:"No closed bills yet",estimada:"estimated",desviacion:"deviation",real:"actual",sin_precio:"No prices",no_disponible:"Unavailable",hora_actual:"Current hour",periodos:{P1:"peak",P2:"standard",P3:"off-peak"},sin_entidad:"PVPC + Bono Social price sensor not found"}};function et(i,t=!1){let e=t?"price_next_day_":"price_",s=[];for(let a=0;a<24;a++){let r=String(a).padStart(2,"0"),o=i?.[`${e}${r}h`];typeof o=="number"&&s.push({hora:a,precio:o});let h=i?.[`${e}${r}h_d`];typeof h=="number"&&s.push({hora:a,precio:h})}return s}function ye(i,t=new Date){let e=t.getHours();return i.findIndex(s=>s.hora===e)}function vt(i){if(!i.length)return null;let t=0,e=0;return i.forEach((s,a)=>{s.precio<i[t].precio&&(t=a),s.precio>i[e].precio&&(e=a)}),{min:i[t],max:i[e]}}function Gt(i){let t=vt(i);if(!t)return[];let e=t.max.precio-t.min.precio;return i.map(s=>e?Math.min(3,Math.floor((s.precio-t.min.precio)/e*4)):0)}function W(i,t,e=()=>!0){return Object.keys(i?.states||{}).filter(s=>s.startsWith(t)&&e(i.states[s])).sort()[0]}function Kt(i){return i?.states["sensor.pvpc_bs_precio"]?"sensor.pvpc_bs_precio":W(i,"sensor.",t=>"price_00h"in(t.attributes||{})&&String(t.attributes.attribution||"").includes("REE"))}var z=class extends k{constructor(){super(...arguments);J(this,"_id",Math.random().toString(36).slice(2,8))}static getConfigForm(){return{schema:[{name:"entity",selector:{entity:{domain:"sensor"}}},{name:"title",selector:{text:{}}},{name:"factura",selector:{select:{mode:"dropdown",options:[{value:"below_chart",label:"Bajo la gr\xE1fica / Below the chart"},{value:"header",label:"Arriba / In the header"},{value:"hidden",label:"Oculta / Hidden"}]}}},{type:"grid",name:"",schema:[{name:"factura_actual",selector:{boolean:{}}},{name:"factura_anterior",selector:{boolean:{}}},{name:"prevision",selector:{boolean:{}}},{name:"current",selector:{boolean:{}}},{name:"details",selector:{boolean:{}}},{name:"graph",selector:{boolean:{}}},{name:"next_day",selector:{boolean:{}}}]},{name:"colores",selector:{select:{mode:"dropdown",options:[{value:"fijo",label:"Un color por d\xEDa / One colour per day"},{value:"precio",label:"Hoy por precio / Today by price"}]}}},{type:"grid",name:"",schema:[{name:"color_hoy",selector:{color_rgb:{}}},{name:"color_manana",selector:{color_rgb:{}}},{name:"bandas",selector:{boolean:{}}}]},{name:"entity_injection",selector:{entity:{domain:"sensor"}}},{name:"icon_color",selector:{select:{mode:"dropdown",options:[{value:"price",label:"Por precio / By price"},{value:"period",label:"Por periodo P1-P3 / By period"},{value:"fijo",label:"Azul fijo / Fixed blue"}]}}},{type:"grid",name:"",schema:[{name:"grafica_facturas",selector:{boolean:{}}},{name:"facturas_importe",selector:{boolean:{}}},{name:"facturas_tendencia",selector:{boolean:{}}},{name:"facturas_meses",selector:{select:{mode:"dropdown",options:["3","5","6","9","12"].map(e=>({value:e,label:e}))}}},{name:"color_facturas",selector:{color_rgb:{}}}]},{name:"titulo_facturas",selector:{text:{}}},{name:"estadistica_facturas",selector:{statistic:{}}},{name:"entity_factura_actual",selector:{entity:{domain:"sensor"}}},{name:"entity_factura_anterior",selector:{entity:{domain:"sensor"}}}],computeLabel:e=>ve[e.name]||e.name}}static getStubConfig(e){return{entity:Kt(e)||"sensor.pvpc_bs_precio",entity_factura_actual:W(e,"sensor.pvpc_bs_factura_actual")||"sensor.pvpc_bs_factura_actual",entity_factura_anterior:W(e,"sensor.pvpc_bs_factura_anterior")||"sensor.pvpc_bs_factura_anterior",current:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,grafica_facturas:!0,facturas_meses:"6",facturas_importe:!0,details:!0,next_day:!0,graph:!0,bandas:!0,colores:"fijo",grid_options:{columns:"full",rows:"auto"}}}setConfig(e){if(!e)throw new Error("Configuraci\xF3n no v\xE1lida");let s={};for(let[a,r]of[["show_current","current"],["show_details","details"],["show_graph","graph"]])typeof e[a]=="boolean"&&!(r in e)&&(s[r]=e[a]);typeof e.show_only_today=="boolean"&&!("next_day"in e)&&(s.next_day=!e.show_only_today),this._config={current:!0,details:!0,graph:!0,next_day:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,icon_color:"price",colores:"fijo",color_hoy:gt,color_manana:qt,bandas:!0,grafica_facturas:!1,facturas_meses:"6",facturas_importe:!0,...s,...e}}getCardSize(){return this._config?.graph===!1?3:7}getGridOptions(){return{columns:"full",rows:"auto",min_columns:6,min_rows:3}}get _cHoy(){return yt(this._config.color_hoy,gt)}get _cManana(){return yt(this._config.color_manana,qt)}get _t(){let e=(this.hass?.locale?.language||this.hass?.language||"es").slice(0,2);return Wt[e]||Wt.en}_num(e,s=3){let a=this.hass?.locale?.language||this.hass?.language||"es";return new Intl.NumberFormat(a,{minimumFractionDigits:s,maximumFractionDigits:s}).format(e)}render(){if(!this._config||!this.hass)return p;let e=this._t,s=this._config.entity||Kt(this.hass),a=s&&this.hass.states[s];if(!a)return m`<ha-card><div class="aviso">${e.sin_entidad}</div></ha-card>`;let r=a.attributes||{},o=et(r),h=this._config.next_day?et(r,!0):[],c=Array.isArray(r.colores_hoy)&&r.colores_hoy.length===o.length?r.colores_hoy:Gt(o),d=Array.isArray(r.colores_manana)&&r.colores_manana.length===h.length?r.colores_manana:Gt(h),l=ye(o),n=this._config.entity_injection&&this.hass.states[this._config.entity_injection],_=n?{hoy:et(n.attributes),manana:this._config.next_day?et(n.attributes,!0):[]}:null,$=this._config.bandas!==!1&&Array.isArray(r.periodos_hoy)&&r.periodos_hoy.length===o.length&&r.periodos_hoy.some(g=>g!=="P3")?r.periodos_hoy:null,f=Number(a.state),v=this._factura(),w=this._config.factura;return m`
      <ha-card>
        <div class="contenedor">
          ${this._config.current?m`<div class="cabecera">
                ${this._icono(l>=0?c[l]:void 0)}
                <div class="nombre">${this._config.title||""}</div>
                <div class="actual">
                  <div class="precio">
                    ${Number.isFinite(f)?this._precioGrande(f):"\u2014"}
                    <span class="unidad">€/kWh</span>
                  </div>
                  ${n&&Number.isFinite(Number(n.state))?m`<div class="precio-iny">${this._num(Number(n.state),5)} €/kWh</div>`:p}
                  ${w==="header"&&v?m`<div class="factura arriba">${v}</div>`:p}
                </div>
              </div>`:p}
          ${this._config.details?this._detalles(o,h,_):p}
          ${this._config.graph?this._grafica(o,h,c,d,l,$,_):p}
          ${v&&(w==="below_chart"||w==="header"&&!this._config.current)?m`<div class="factura abajo">${v}</div>`:p}
          ${v&&w==="header"&&this._config.current?m`<div class="factura abajo estrecha">${v}</div>`:p}
          ${this._config.grafica_facturas?this._graficaFacturas():p}
        </div>
      </ha-card>
    `}_precioGrande(e){let s=this._num(e,5);return m`${s.slice(0,-2)}<span class="cola">${s.slice(-2)}</span>`}_icono(e){let s=e;if(this._config.icon_color==="period"){let o=this.hass.states["sensor.pvpc_bs_periodo"]?.state;s=$e[o]}let a=this._config.icon_color==="fijo"||s===void 0?gt:It[s],r=`pvpc-bs-hueco-${this._id}`;return m`<svg class="icono" viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <mask id=${r}>
          <rect width="512" height="512" fill="#fff"></rect>
          <circle cx="256" cy="424" r="74" fill="#000"></circle>
        </mask>
      </defs>
      <g mask="url(#${r})" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M108 150 V170 M404 150 V170 M108 230 V250 M404 230 V250" stroke=${a} stroke-opacity="0.6" stroke-width="10"></path>
        <g fill=${a} fill-opacity="0.6">
          <rect x="88" y="168" width="40" height="14" rx="7"></rect>
          <rect x="384" y="168" width="40" height="14" rx="7"></rect>
          <rect x="88" y="248" width="40" height="14" rx="7"></rect>
          <rect x="384" y="248" width="40" height="14" rx="7"></rect>
        </g>
        <g stroke=${a} stroke-width="22">
          <path d="M100 150 H412 M100 150 L243.8 95 M412 150 L268.2 95"></path>
          <path d="M100 230 H412 M100 230 L228.7 178 M412 230 L283.3 178"></path>
          <path
            d="M233.8 150 L292.7 230 M278.2 150 L219.3 230 M219.3 230 L310.9 330 M292.7 230 L201.1 330 M201.1 330 L336 468 M310.9 330 L176 468"
          ></path>
          <path d="M176 468 L256 28 L336 468"></path>
        </g>
        <path d="M150 484 H362" stroke=${a} stroke-width="22"></path>
      </g>
      <circle cx="256" cy="424" r="60" fill=${a}></circle>
      <text x="256" y="426" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="84"
        text-anchor="middle" dominant-baseline="central">€</text>
    </svg>`}_hora(e){return`${String(e).padStart(2,"0")}:00`}_fecha(e=0){let s=new Date;return s.setDate(s.getDate()+e),new Intl.DateTimeFormat(this.hass?.locale?.language||this.hass?.language||"es").format(s)}_triangulo(e,s){return m`<svg class="tri" viewBox="0 0 24 24" aria-hidden="true"><path d=${Vt[e]} fill=${s}></path></svg>`}_detalles(e,s,a){let r=this._t,o=(d,l,n)=>m`<div class="detalle">
        ${this._triangulo(d,l)}
        <div>
          ${n?m`<div class="valor">${this._num(n.precio,5)} €/kWh</div>
                <div class="horas">${this._hora(n.hora)} - ${this._hora(n.hora+1)}</div>`:m`<div class="valor">${r.no_disponible}</div>`}
        </div>
      </div>`,h=(d,l,n="")=>{let _=vt(d);return m`<div class="columna">${o(`min${n}`,l,_?.min)}${o(`max${n}`,l,_?.max)}</div>`},c=(d,l,n)=>m`<div class="detalles">
        ${h(d,this._cHoy,n)}${l.length?h(l,this._cManana,n):p}
      </div>`;return m`${c(e,s)}${a?c(a.hoy,a.manana,"_hueco"):p}`}_factura(){let e=this._t;if(this._config.factura==="hidden")return null;let s=[],a=this._config.entity_factura_anterior||W(this.hass,"sensor.pvpc_bs_factura_anterior"),r=this._config.entity_factura_actual||W(this.hass,"sensor.pvpc_bs_factura_actual"),o=n=>typeof n=="string"?`${n.slice(8,10)}/${n.slice(5,7)}`:"",h=(n,_)=>n&&_?` (${o(n)} - ${o(_)})`:"",c=(n,_,$,f=p)=>m`<div>${n}${_}: <b>${this._num($,2)} €</b>${f}</div>`,d=a&&this.hass.states[a];if(this._config.factura_anterior&&d&&Number.isFinite(Number(d.state))){let n=d.attributes||{};s.push(c(e.anterior,h(n.inicio,n.fin),Number(d.state)))}let l=r&&this.hass.states[r];if(this._config.factura_actual&&l&&Number.isFinite(Number(l.state))){let n=l.attributes||{},_=new Date,$=`${_.getFullYear()}-${String(_.getMonth()+1).padStart(2,"0")}-${String(_.getDate()).padStart(2,"0")}`;typeof n.acumulado=="number"&&s.push(c(e.en_curso,h(n.inicio,$),n.acumulado)),this._config.prevision!==!1&&s.push(c(e.estimada_cierre,h(n.inicio,n.fin_previsto),Number(l.state)))}return s.length?s:null}_grafica(e,s,a,r,o,h,c){let d=this._t;if(!e.length)return m`<div class="aviso">${d.sin_precio}</div>`;let l=this._cHoy,n=this._cManana,_=480,$=190,f={izq:38,der:16,arr:24,aba:24},v=[{puntos:e,color:l},{puntos:s,color:n},...c?[{puntos:c.hoy,color:l,punteada:!0},{puntos:c.manana,color:n,punteada:!0}]:[]].filter(u=>u.puntos.length),w=v.flatMap(u=>u.puntos.map(x=>x.precio)),g=Math.min(0,...w),S=Math.max(...w);S-g<.01&&(S=g+.01);let U=(S-g)*.08;g-=Math.min(0,...w)<0?U:0,S+=U;let bt=Math.max(e.length,s.length,24),G=(_-f.izq-f.der)/bt,E=u=>f.izq+G*u,K=u=>E(u)+G/2,M=u=>f.arr+($-f.arr-f.aba)*(1-(u-g)/(S-g)),Yt=u=>u.map((x,b)=>`${b?"V":`M${E(0).toFixed(1)},`}${M(x.precio).toFixed(1)}H${E(b+1).toFixed(1)}`).join(""),Jt=(u,x,b)=>A`<line class="tramo" x1=${E(b)} x2=${E(b+1)} y1=${M(u[b].precio)} y2=${M(u[b].precio)}
        stroke=${It[x[b]??0]}></line>`,xt=(u,x,b)=>{let Y=vt(u),Zt=u.indexOf(Y[b]),te=M(Y[b].precio)+(b==="max"?-11:4);return A`<svg class="marca" x=${K(Zt)-4.5} y=${te} width="9" height="9" viewBox="0 0 24 24">
        <path d=${Vt[b]} fill=${x}></path></svg>`},Qt=(S-g)/4,Xt=[0,1,2,3,4].map(u=>g+Qt*u),y=this._cursor,At=(u,x,b,Y)=>A`<circle class=${Y} cx=${K(b)} cy=${M(u[b].precio)} r="3" fill=${x}></circle>`,st=this._config.colores==="precio";return m`
      <div class="grafica">
        <svg
          viewBox="0 0 ${_} ${$}"
          role="img"
          aria-label=${d.titulo}
          @pointermove=${u=>this._mover(u,_,f,bt)}
          @pointerleave=${()=>this._cursor=void 0}
        >
          <text class="eje" x=${f.izq-4} y=${f.arr-12} text-anchor="end">€/kWh</text>
          ${h?h.map((u,x)=>u==="P3"?p:A`<rect class=${u==="P1"?"banda-punta":"banda-llano"} x=${E(x)}
                      y=${f.arr} width=${G} height=${$-f.arr-f.aba}></rect>`):p}
          ${o>=0?A`<rect class="ahora" x=${E(o)} y=${f.arr} width=${G} height=${$-f.arr-f.aba}></rect>`:p}
          ${Xt.map(u=>A`<line class="rejilla" x1=${f.izq} x2=${_-f.der} y1=${M(u)} y2=${M(u)}></line>
              <text class="eje" x=${f.izq-4} y=${M(u)+3} text-anchor="end">${this._num(Math.abs(u)<.005?0:u,2)}</text>`)}
          ${[0,3,6,9,12,15,18,21,24].map(u=>A`<line class="rejilla" x1=${E(u)} x2=${E(u)} y1=${f.arr} y2=${$-f.aba}></line>
              <text class="eje" x=${E(u)} y=${$-8} text-anchor="middle">${this._hora(u)}</text>`)}
          ${v.map(u=>A`<path class="serie ${u.punteada?"punteada":""}" d=${Yt(u.puntos)}
                stroke=${st&&u.puntos===e?"var(--secondary-text-color)":u.color}></path>`)}
          ${st?e.map((u,x)=>Jt(e,a,x)):p}
          ${v.flatMap(u=>[xt(u.puntos,u.color,"max"),xt(u.puntos,u.color,"min")])}
          ${y!==void 0?A`<line class="cursor" x1=${K(y)} x2=${K(y)} y1=${f.arr} y2=${$-f.aba}></line>`:p}
          ${y!==void 0&&y<e.length?At(e,l,y,"p-hoy"):p}
          ${y!==void 0&&y<s.length?At(s,n,y,"p-manana"):p}
        </svg>
        <div class="leyenda">
          ${y!==void 0?m`<span
                  ><b>${this._hora((e[y]??s[y])?.hora??y)} - ${this._hora(((e[y]??s[y])?.hora??y)+1)}</b>${h?.[y]?m` · ${d.periodos[h[y]]}`:p}</span
                >
                ${e[y]?m`<span><i class="bolita" style="background:${l}"></i>${this._num(e[y].precio,5)}</span>`:p}
                ${s[y]?m`<span><i class="bolita" style="background:${n}"></i>${this._num(s[y].precio,5)}</span>`:p}`:m`<span
                  ><i class="bolita" style="background:${st?ge:l}"></i>${this._fecha(0)}</span
                >${s.length?m`<span><i class="bolita" style="background:${n}"></i>${this._fecha(1)}</span>`:p}${o>=0?m`<span class="l-ahora">${d.hora_actual}</span>`:p}${h?m`<span class="l-punta">${d.periodos.P1}</span><span class="l-llano">${d.periodos.P2}</span>`:p}`}
        </div>
      </div>
    `}updated(e){if(super.updated?.(e),!this.hass||!this._config?.grafica_facturas||this._cargandoFacturas)return;let s=`${this._config.estadistica_facturas||""}|${this._config.facturas_meses}`;(!this._facturasHora||Date.now()-this._facturasHora>3*3600*1e3||s!==this._facturasClave)&&this._cargarFacturas(s)}async _cargarFacturas(e){this._cargandoFacturas=!0,this._facturasClave=e,this._facturasHora=Date.now();try{let s=this._config.estadistica_facturas;if(s||(s=(await this.hass.callWS({type:"recorder/list_statistic_ids",statistic_type:"mean"})).map(c=>c.statistic_id).find(c=>c.startsWith("pvpc_bonosocial:facturas_"))),!s){this._facturas=[];return}let a=Math.max(1,Number(this._config.facturas_meses)||6),r=new Date(Date.now()-(a+2)*35*86400*1e3),o=await this.hass.callWS({type:"recorder/statistics_during_period",start_time:r.toISOString(),statistic_ids:[s],period:"hour",types:["max"]});this._facturas=(o[s]||[]).filter(h=>Number.isFinite(Number(h.max))).map(h=>({inicio:new Date(h.start),total:Number(h.max)})).slice(-a)}catch(s){console.warn("pvpc-bono-social-card: no se pudieron leer las facturas",s),this._facturas=[]}finally{this._cargandoFacturas=!1}}_graficaFacturas(){let e=this._t,s=this._facturas,a=this._config.titulo_facturas??e.facturas,r=a?m`<div class="titulo-facturas">${a}</div>`:p;if(!s)return p;if(!s.length)return m`<div class="facturas">${r}<div class="aviso">${e.sin_facturas}</div></div>`;let o=yt(this._config.color_facturas,this._cHoy),h=this._config.facturas_importe!==!1,c=480,d=150,l={izq:8,der:8,arr:h?18:6,aba:20},n=Math.max(...s.map(g=>g.total),1),_=(c-l.izq-l.der)/s.length,$=Math.min(_*.6,56),f=g=>l.arr+(d-l.arr-l.aba)*(1-Math.max(g,0)/n),v=this.hass?.locale?.language||this.hass?.language||"es",w=new Intl.DateTimeFormat(v,{month:"short",year:"2-digit"});return m`
      <div class="facturas">
        ${r}
        <svg viewBox="0 0 ${c} ${d}" role="img" aria-label=${a||e.facturas}>
          <line class="rejilla" x1=${l.izq} x2=${c-l.der} y1=${d-l.aba} y2=${d-l.aba}></line>
          ${s.map((g,S)=>{let U=l.izq+_*(S+.5);return A`<rect class="barra" x=${U-$/2} y=${f(g.total)} width=${$}
                height=${d-l.aba-f(g.total)} rx="3" fill=${o}>
                <title>${w.format(g.inicio)}: ${this._num(g.total,2)} €</title></rect>
              <text class="eje" x=${U} y=${d-6} text-anchor="middle">${w.format(g.inicio)}</text>`})}
          ${this._config.facturas_tendencia&&s.length>1?this._tendencia(s,_,l,f):p}
          ${h?s.map((g,S)=>A`<text class="importe" x=${l.izq+_*(S+.5)} y=${f(g.total)-5}
                    text-anchor="middle">${this._num(g.total,2)} €</text>`):p}
        </svg>
      </div>
    `}_tendencia(e,s,a,r){let o=e.length,h=(o-1)/2,c=e.reduce((f,v)=>f+v.total,0)/o,d=0,l=0;e.forEach((f,v)=>{d+=(v-h)*(f.total-c),l+=(v-h)**2});let n=d/l,_=f=>c+n*(f-h),$=f=>a.izq+s*(f+.5);return A`<line class="tendencia" x1=${$(0)} y1=${r(_(0))} x2=${$(o-1)} y2=${r(_(o-1))}></line>`}_mover(e,s,a,r){let o=e.currentTarget.getBoundingClientRect(),h=(e.clientX-o.left)/o.width*s,c=Math.floor((h-a.izq)/(s-a.izq-a.der)*r);this._cursor=c>=0&&c<r?c:void 0}};J(z,"properties",{hass:{attribute:!1},_config:{state:!0},_cursor:{state:!0},_facturas:{state:!0}}),J(z,"styles",it`
    :host {
      --pvpc-bs-verde: var(--success-color, #43a047);
      --pvpc-bs-amarillo: #f9c80e;
      --pvpc-bs-naranja: var(--warning-color, #fb8c00);
      --pvpc-bs-rojo: var(--error-color, #e53935);
    }
    .contenedor {
      container-type: inline-size;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    /* El icono a la izquierda; el precio y las facturas, en la columna de la derecha. */
    .cabecera {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .icono {
      flex: none;
      width: 75px;
      height: 75px;
    }
    .nombre {
      flex: 1;
      min-width: 0;
      font-size: 1.15em;
      color: var(--primary-text-color);
    }
    @container (max-width: 380px) {
      .nombre {
        font-size: 1em;
      }
      .precio {
        font-size: 1.6em;
      }
    }
    .actual {
      text-align: right;
    }
    .precio {
      font-size: 1.9em;
      font-weight: 700;
      line-height: 1.1;
      color: var(--primary-text-color);
    }
    .precio-iny {
      font-size: 0.9em;
      color: var(--secondary-text-color);
    }
    .cola {
      font-size: 0.45em;
    }
    .unidad {
      font-size: 0.45em;
      color: var(--secondary-text-color);
    }
    /* Hoy centrado en la mitad izquierda y mañana en la derecha (aunque mañana no esté). */
    .detalles {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 12px;
    }
    .columna {
      display: flex;
      flex-direction: column;
      gap: 8px;
      justify-self: center;
    }
    .detalle {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .tri {
      flex: none;
      width: 24px;
      height: 24px;
      margin: 0 4px;
    }
    .detalle .valor {
      font-weight: 700;
      font-size: 0.95em;
      color: var(--primary-text-color);
    }
    .detalle .horas {
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }
    .detalle .valor,
    .detalle .horas {
      white-space: nowrap;
    }
    @container (max-width: 380px) {
      .detalle {
        gap: 6px;
      }
      .tri {
        width: 18px;
        height: 18px;
        margin: 0;
      }
      .detalle .valor {
        font-size: 0.85em;
      }
    }
    .grafica > svg {
      width: 100%;
      height: auto;
      display: block;
      touch-action: pan-y;
    }
    .rejilla {
      stroke: var(--divider-color, #e0e0e0);
      stroke-width: 1;
    }
    .eje {
      fill: var(--secondary-text-color);
      font-size: 10px;
    }
    .serie {
      fill: none;
      stroke-width: 1.5;
    }
    .serie.punteada {
      stroke-dasharray: 2 3;
    }
    .tramo {
      stroke-width: 3;
      stroke-linecap: square;
    }
    .titulo-facturas {
      font-size: 0.95em;
      color: var(--secondary-text-color);
      margin-bottom: 4px;
    }
    .facturas > svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .tendencia {
      stroke: var(--primary-text-color);
      stroke-width: 1.5;
      stroke-dasharray: 5 4;
      opacity: 0.7;
    }
    .importe {
      fill: var(--primary-text-color);
      stroke: var(--card-background-color, var(--ha-card-background, #fff));
      stroke-width: 3px;
      paint-order: stroke;
      font-size: 12px;
      font-weight: 600;
    }
    .banda-punta {
      fill: var(--pvpc-bs-rojo);
      fill-opacity: 0.08;
    }
    .banda-llano {
      fill: var(--pvpc-bs-amarillo);
      fill-opacity: 0.1;
    }
    .l-punta,
    .l-llano {
      text-transform: capitalize;
    }
    .l-punta::before,
    .l-llano::before {
      content: "";
      display: inline-block;
      width: 10px;
      height: 10px;
      margin-right: 4px;
      vertical-align: middle;
      background: var(--pvpc-bs-rojo);
      opacity: 0.25;
    }
    .l-llano::before {
      background: var(--pvpc-bs-amarillo);
      opacity: 0.4;
    }
    .l-ahora::before {
      content: "";
      display: inline-block;
      width: 10px;
      height: 10px;
      margin-right: 4px;
      vertical-align: middle;
      background: var(--divider-color, #e0e0e0);
    }
    .ahora {
      fill: var(--divider-color, #e0e0e0);
      fill-opacity: 0.8;
    }
    .cursor {
      stroke: var(--primary-text-color);
      stroke-opacity: 0.4;
      stroke-width: 1;
    }
    .leyenda {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 12px;
      justify-content: center;
      font-size: 0.85em;
      color: var(--secondary-text-color);
      min-height: 1.3em;
    }
    .bolita {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 6px;
      vertical-align: -1px;
    }
    .factura {
      display: flex;
      flex-direction: column;
      gap: 2px;
      color: var(--primary-text-color);
    }
    .factura.arriba {
      font-size: 0.85em;
      align-items: flex-end;
      text-align: right;
      margin-top: 6px;
    }
    .factura .grande {
      font-size: 1.2em;
    }
    .suave {
      color: var(--secondary-text-color);
      white-space: nowrap;
    }
    .factura.estrecha {
      display: none;
    }
    /* En pantallas estrechas la factura de la cabecera pasa abajo. */
    @container (max-width: 380px) {
      .factura.arriba {
        display: none;
      }
      .factura.estrecha {
        display: flex;
      }
    }
    .aviso {
      padding: 16px;
      color: var(--secondary-text-color);
    }
  `);var ve={entity:"Sensor de precio / Price sensor",title:"T\xEDtulo / Title",factura:"Factura / Bill",factura_actual:"Factura en curso / Current bill",factura_anterior:"Factura anterior / Previous bill",prevision:"Factura estimada al cierre / Estimated bill",current:"Precio actual / Current price",details:"M\xEDnimos y m\xE1ximos / Min and max",graph:"Gr\xE1fica / Chart",next_day:"Ma\xF1ana / Tomorrow",icon_color:"Color del icono / Icon colour",colores:"Colores de la gr\xE1fica / Chart colours",color_hoy:"Color de hoy / Today's colour",color_manana:"Color de ma\xF1ana / Tomorrow's colour",bandas:"Punta y llano sombreados / Shade peak hours",entity_injection:"Sensor de precio de excedentes (opcional) / Injection price sensor (optional)",grafica_facturas:"Gr\xE1fica de facturas / Bills chart",facturas_importe:"Importe sobre cada barra / Amount above bars",facturas_tendencia:"L\xEDnea de tendencia / Trend line",facturas_meses:"Cu\xE1ntas facturas / How many bills",color_facturas:"Color de las barras / Bar colour",titulo_facturas:"T\xEDtulo de la gr\xE1fica de facturas / Bills chart title",estadistica_facturas:"Estad\xEDstica de facturas (opcional) / Bills statistic (optional)",entity_factura_actual:"Sensor de factura en curso / Current bill sensor",entity_factura_anterior:"Sensor de factura anterior / Previous bill sensor"};customElements.get($t)||(customElements.define($t,z),window.customCards=window.customCards||[],window.customCards.push({type:$t,name:"PVPC + Bono Social",description:"Precio del PVPC de hoy y ma\xF1ana y la factura con o sin bono social.",preview:!0,documentationURL:"https://github.com/BaRDaHL/pvpc_bonosocial"}),console.info(`%c PVPC + Bono Social %c ${me} `,"background:#43a047;color:#fff",""));customElements.get(Bt)||customElements.define(Bt,class extends z{});export{yt as colorCss,ye as posicionActual,et as serie};
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/lit-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-element/lit-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
