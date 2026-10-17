var ae=Object.defineProperty;var re=(s,t,e)=>t in s?ae(s,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[t]=e;var Z=(s,t,e)=>re(s,typeof t!="symbol"?t+"":t,e);var J=globalThis,Q=J.ShadowRoot&&(J.ShadyCSS===void 0||J.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,rt=Symbol(),St=new WeakMap,F=class{constructor(t,e,a){if(this._$cssResult$=!0,a!==rt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(Q&&t===void 0){let a=e!==void 0&&e.length===1;a&&(t=St.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),a&&St.set(e,t))}return t}toString(){return this.cssText}},Et=s=>new F(typeof s=="string"?s:s+"",void 0,rt),st=(s,...t)=>{let e=s.length===1?s[0]:t.reduce((a,r,i)=>a+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+s[i+1],s[0]);return new F(e,s,rt)},Ct=(s,t)=>{if(Q)s.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let a=document.createElement("style"),r=J.litNonce;r!==void 0&&a.setAttribute("nonce",r),a.textContent=e.cssText,s.appendChild(a)}},it=Q?s=>s:s=>s instanceof CSSStyleSheet?(t=>{let e="";for(let a of t.cssRules)e+=a.cssText;return Et(e)})(s):s;var{is:se,defineProperty:ie,getOwnPropertyDescriptor:oe,getOwnPropertyNames:ne,getOwnPropertySymbols:ce,getPrototypeOf:le}=Object,X=globalThis,Mt=X.trustedTypes,he=Mt?Mt.emptyScript:"",de=X.reactiveElementPolyfillSupport,D=(s,t)=>s,ot={toAttribute(s,t){switch(t){case Boolean:s=s?he:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,t){let e=s;switch(t){case Boolean:e=s!==null;break;case Number:e=s===null?null:Number(s);break;case Object:case Array:try{e=JSON.parse(s)}catch{e=null}}return e}},Pt=(s,t)=>!se(s,t),kt={attribute:!0,type:String,converter:ot,reflect:!1,useDefault:!1,hasChanged:Pt};Symbol.metadata??=Symbol("metadata"),X.litPropertyMetadata??=new WeakMap;var C=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=kt){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let a=Symbol(),r=this.getPropertyDescriptor(t,a,e);r!==void 0&&ie(this.prototype,t,r)}}static getPropertyDescriptor(t,e,a){let{get:r,set:i}=oe(this.prototype,t)??{get(){return this[e]},set(o){this[e]=o}};return{get:r,set(o){let l=r?.call(this);i?.call(this,o),this.requestUpdate(t,l,a)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??kt}static _$Ei(){if(this.hasOwnProperty(D("elementProperties")))return;let t=le(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(D("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(D("properties"))){let e=this.properties,a=[...ne(e),...ce(e)];for(let r of a)this.createProperty(r,e[r])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[a,r]of e)this.elementProperties.set(a,r)}this._$Eh=new Map;for(let[e,a]of this.elementProperties){let r=this._$Eu(e,a);r!==void 0&&this._$Eh.set(r,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let a=new Set(t.flat(1/0).reverse());for(let r of a)e.unshift(it(r))}else t!==void 0&&e.push(it(t));return e}static _$Eu(t,e){let a=e.attribute;return a===!1?void 0:typeof a=="string"?a:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let a of e.keys())this.hasOwnProperty(a)&&(t.set(a,this[a]),delete this[a]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Ct(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,a){this._$AK(t,a)}_$ET(t,e){let a=this.constructor.elementProperties.get(t),r=this.constructor._$Eu(t,a);if(r!==void 0&&a.reflect===!0){let i=(a.converter?.toAttribute!==void 0?a.converter:ot).toAttribute(e,a.type);this._$Em=t,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(t,e){let a=this.constructor,r=a._$Eh.get(t);if(r!==void 0&&this._$Em!==r){let i=a.getPropertyOptions(r),o=typeof i.converter=="function"?{fromAttribute:i.converter}:i.converter?.fromAttribute!==void 0?i.converter:ot;this._$Em=r;let l=o.fromAttribute(e,i.type);this[r]=l??this._$Ej?.get(r)??l,this._$Em=null}}requestUpdate(t,e,a,r=!1,i){if(t!==void 0){let o=this.constructor;if(r===!1&&(i=this[t]),a??=o.getPropertyOptions(t),!((a.hasChanged??Pt)(i,e)||a.useDefault&&a.reflect&&i===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,a))))return;this.C(t,e,a)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:a,reflect:r,wrapped:i},o){a&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),i!==!0||o!==void 0)||(this._$AL.has(t)||(this.hasUpdated||a||(e=void 0),this._$AL.set(t,e)),r===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[r,i]of this._$Ep)this[r]=i;this._$Ep=void 0}let a=this.constructor.elementProperties;if(a.size>0)for(let[r,i]of a){let{wrapped:o}=i,l=this[r];o!==!0||this._$AL.has(r)||l===void 0||this.C(r,void 0,i,l)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(a=>a.hostUpdate?.()),this.update(e)):this._$EM()}catch(a){throw t=!1,this._$EM(),a}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};C.elementStyles=[],C.shadowRootOptions={mode:"open"},C[D("elementProperties")]=new Map,C[D("finalized")]=new Map,de?.({ReactiveElement:C}),(X.reactiveElementVersions??=[]).push("2.1.2");var pt=globalThis,Nt=s=>s,tt=pt.trustedTypes,Lt=tt?tt.createPolicy("lit-html",{createHTML:s=>s}):void 0,zt="$lit$",k=`lit$${Math.random().toFixed(9).slice(2)}$`,Ut="?"+k,ue=`<${Ut}>`,H=document,V=()=>H.createComment(""),q=s=>s===null||typeof s!="object"&&typeof s!="function",ft=Array.isArray,pe=s=>ft(s)||typeof s?.[Symbol.iterator]=="function",nt=`[ 	
\f\r]`,B=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ht=/-->/g,Ot=/>/g,N=RegExp(`>|${nt}(?:([^\\s"'>=/]+)(${nt}*=${nt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Rt=/'/g,Tt=/"/g,Ft=/^(?:script|style|textarea|title)$/i,_t=s=>(t,...e)=>({_$litType$:s,strings:t,values:e}),m=_t(1),A=_t(2),Ce=_t(3),O=Symbol.for("lit-noChange"),d=Symbol.for("lit-nothing"),jt=new WeakMap,L=H.createTreeWalker(H,129);function Dt(s,t){if(!ft(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return Lt!==void 0?Lt.createHTML(t):t}var fe=(s,t)=>{let e=s.length-1,a=[],r,i=t===2?"<svg>":t===3?"<math>":"",o=B;for(let l=0;l<e;l++){let c=s[l],u,h,n=-1,_=0;for(;_<c.length&&(o.lastIndex=_,h=o.exec(c),h!==null);)_=o.lastIndex,o===B?h[1]==="!--"?o=Ht:h[1]!==void 0?o=Ot:h[2]!==void 0?(Ft.test(h[2])&&(r=RegExp("</"+h[2],"g")),o=N):h[3]!==void 0&&(o=N):o===N?h[0]===">"?(o=r??B,n=-1):h[1]===void 0?n=-2:(n=o.lastIndex-h[2].length,u=h[1],o=h[3]===void 0?N:h[3]==='"'?Tt:Rt):o===Tt||o===Rt?o=N:o===Ht||o===Ot?o=B:(o=N,r=void 0);let $=o===N&&s[l+1].startsWith("/>")?" ":"";i+=o===B?c+ue:n>=0?(a.push(u),c.slice(0,n)+zt+c.slice(n)+k+$):c+k+(n===-2?l:$)}return[Dt(s,i+(s[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),a]},I=class s{constructor({strings:t,_$litType$:e},a){let r;this.parts=[];let i=0,o=0,l=t.length-1,c=this.parts,[u,h]=fe(t,e);if(this.el=s.createElement(u,a),L.currentNode=this.el.content,e===2||e===3){let n=this.el.content.firstChild;n.replaceWith(...n.childNodes)}for(;(r=L.nextNode())!==null&&c.length<l;){if(r.nodeType===1){if(r.hasAttributes())for(let n of r.getAttributeNames())if(n.endsWith(zt)){let _=h[o++],$=r.getAttribute(n).split(k),f=/([.?@])?(.*)/.exec(_);c.push({type:1,index:i,name:f[2],strings:$,ctor:f[1]==="."?lt:f[1]==="?"?ht:f[1]==="@"?dt:T}),r.removeAttribute(n)}else n.startsWith(k)&&(c.push({type:6,index:i}),r.removeAttribute(n));if(Ft.test(r.tagName)){let n=r.textContent.split(k),_=n.length-1;if(_>0){r.textContent=tt?tt.emptyScript:"";for(let $=0;$<_;$++)r.append(n[$],V()),L.nextNode(),c.push({type:2,index:++i});r.append(n[_],V())}}}else if(r.nodeType===8)if(r.data===Ut)c.push({type:2,index:i});else{let n=-1;for(;(n=r.data.indexOf(k,n+1))!==-1;)c.push({type:7,index:i}),n+=k.length-1}i++}}static createElement(t,e){let a=H.createElement("template");return a.innerHTML=t,a}};function R(s,t,e=s,a){if(t===O)return t;let r=a!==void 0?e._$Co?.[a]:e._$Cl,i=q(t)?void 0:t._$litDirective$;return r?.constructor!==i&&(r?._$AO?.(!1),i===void 0?r=void 0:(r=new i(s),r._$AT(s,e,a)),a!==void 0?(e._$Co??=[])[a]=r:e._$Cl=r),r!==void 0&&(t=R(s,r._$AS(s,t.values),r,a)),t}var ct=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:a}=this._$AD,r=(t?.creationScope??H).importNode(e,!0);L.currentNode=r;let i=L.nextNode(),o=0,l=0,c=a[0];for(;c!==void 0;){if(o===c.index){let u;c.type===2?u=new W(i,i.nextSibling,this,t):c.type===1?u=new c.ctor(i,c.name,c.strings,this,t):c.type===6&&(u=new ut(i,this,t)),this._$AV.push(u),c=a[++l]}o!==c?.index&&(i=L.nextNode(),o++)}return L.currentNode=H,r}p(t){let e=0;for(let a of this._$AV)a!==void 0&&(a.strings!==void 0?(a._$AI(t,a,e),e+=a.strings.length-2):a._$AI(t[e])),e++}},W=class s{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,a,r){this.type=2,this._$AH=d,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=a,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=R(this,t,e),q(t)?t===d||t==null||t===""?(this._$AH!==d&&this._$AR(),this._$AH=d):t!==this._$AH&&t!==O&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):pe(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==d&&q(this._$AH)?this._$AA.nextSibling.data=t:this.T(H.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:a}=t,r=typeof a=="number"?this._$AC(t):(a.el===void 0&&(a.el=I.createElement(Dt(a.h,a.h[0]),this.options)),a);if(this._$AH?._$AD===r)this._$AH.p(e);else{let i=new ct(r,this),o=i.u(this.options);i.p(e),this.T(o),this._$AH=i}}_$AC(t){let e=jt.get(t.strings);return e===void 0&&jt.set(t.strings,e=new I(t)),e}k(t){ft(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,a,r=0;for(let i of t)r===e.length?e.push(a=new s(this.O(V()),this.O(V()),this,this.options)):a=e[r],a._$AI(i),r++;r<e.length&&(this._$AR(a&&a._$AB.nextSibling,r),e.length=r)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let a=Nt(t).nextSibling;Nt(t).remove(),t=a}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},T=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,a,r,i){this.type=1,this._$AH=d,this._$AN=void 0,this.element=t,this.name=e,this._$AM=r,this.options=i,a.length>2||a[0]!==""||a[1]!==""?(this._$AH=Array(a.length-1).fill(new String),this.strings=a):this._$AH=d}_$AI(t,e=this,a,r){let i=this.strings,o=!1;if(i===void 0)t=R(this,t,e,0),o=!q(t)||t!==this._$AH&&t!==O,o&&(this._$AH=t);else{let l=t,c,u;for(t=i[0],c=0;c<i.length-1;c++)u=R(this,l[a+c],e,c),u===O&&(u=this._$AH[c]),o||=!q(u)||u!==this._$AH[c],u===d?t=d:t!==d&&(t+=(u??"")+i[c+1]),this._$AH[c]=u}o&&!r&&this.j(t)}j(t){t===d?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},lt=class extends T{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===d?void 0:t}},ht=class extends T{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==d)}},dt=class extends T{constructor(t,e,a,r,i){super(t,e,a,r,i),this.type=5}_$AI(t,e=this){if((t=R(this,t,e,0)??d)===O)return;let a=this._$AH,r=t===d&&a!==d||t.capture!==a.capture||t.once!==a.once||t.passive!==a.passive,i=t!==d&&(a===d||r);r&&this.element.removeEventListener(this.name,this,a),i&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},ut=class{constructor(t,e,a){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=a}get _$AU(){return this._$AM._$AU}_$AI(t){R(this,t)}};var _e=pt.litHtmlPolyfillSupport;_e?.(I,W),(pt.litHtmlVersions??=[]).push("3.3.3");var Bt=(s,t,e)=>{let a=e?.renderBefore??t,r=a._$litPart$;if(r===void 0){let i=e?.renderBefore??null;a._$litPart$=r=new W(t.insertBefore(V(),i),i,void 0,e??{})}return r._$AI(s),r};var mt=globalThis,P=class extends C{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Bt(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return O}};P._$litElement$=!0,P.finalized=!0,mt.litElementHydrateSupport?.({LitElement:P});var me=mt.litElementPolyfillSupport;me?.({LitElement:P});(mt.litElementVersions??=[]).push("4.2.2");var ge="1.1.9",gt="pvpc-bono-social-card",Vt="pvpc-hourly-pricing-card",qt=["var(--pvpc-bs-verde)","var(--pvpc-bs-amarillo)","var(--pvpc-bs-naranja)","var(--pvpc-bs-rojo)"],$e={P1:3,P2:2,P3:0},$t="#4269d0",It="#f4bd4a";function vt(s,t){return Array.isArray(s)&&s.length===3&&s.every(e=>Number.isFinite(Number(e)))?`rgb(${s.map(Number).join(", ")})`:typeof s=="string"&&s.trim()?s.trim():t}var ve=`conic-gradient(${["verde","amarillo","naranja","rojo"].map((s,t)=>`var(--pvpc-bs-${s}) ${t*25}% ${(t+1)*25}%`).join(", ")})`,Wt={min:"M1,3H23L12,22",max:"M1,21H23L12,2",min_hueco:"M12,22L1,3H23L12,22M12,17.5L19.5,5H4.5L12,17.5Z",max_hueco:"M12,2L1,21H23M12,6L19.53,19H4.47"},Gt={es:{titulo:"Precio de la luz",ahora:"Ahora",hoy:"Hoy",manana:"Ma\xF1ana",minimo:"M\xEDnimo",maximo:"M\xE1ximo",anterior:"Factura periodo anterior",en_curso:"Factura periodo en curso",prevision:"previsi\xF3n",estimada_cierre:"Factura estimada",facturas:"Facturas",sin_facturas:"A\xFAn no hay facturas cerradas",calculada:"calculada",abrir:"Ver todo",cerrar:"Cerrar",factura_real:"Factura real",calculada_consumo:"Calculada con el consumo",estimada:"estimada",desviacion:"desviaci\xF3n",real:"real",sin_precio:"Sin precios",no_disponible:"No disponible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"llano",P3:"valle"},sin_entidad:"No se encuentra el sensor de precio de PVPC + Bono Social"},en:{titulo:"Electricity price",ahora:"Now",hoy:"Today",manana:"Tomorrow",minimo:"Minimum",maximo:"Maximum",anterior:"Previous bill",en_curso:"Current bill",prevision:"forecast",estimada_cierre:"Estimated bill",facturas:"Bills",sin_facturas:"No closed bills yet",calculada:"calculated",abrir:"Show everything",cerrar:"Close",factura_real:"Actual bill",calculada_consumo:"Calculated from consumption",estimada:"estimated",desviacion:"deviation",real:"actual",sin_precio:"No prices",no_disponible:"Unavailable",hora_actual:"Current hour",periodos:{P1:"peak",P2:"standard",P3:"off-peak"},sin_entidad:"PVPC + Bono Social price sensor not found"}};function et(s,t=!1){let e=t?"price_next_day_":"price_",a=[];for(let r=0;r<24;r++){let i=String(r).padStart(2,"0"),o=s?.[`${e}${i}h`];typeof o=="number"&&a.push({hora:r,precio:o});let l=s?.[`${e}${i}h_d`];typeof l=="number"&&a.push({hora:r,precio:l})}return a}function be(s,t=new Date){let e=t.getHours();return s.findIndex(a=>a.hora===e)}function bt(s){if(!s.length)return null;let t=0,e=0;return s.forEach((a,r)=>{a.precio<s[t].precio&&(t=r),a.precio>s[e].precio&&(e=r)}),{min:s[t],max:s[e]}}function Kt(s){let t=bt(s);if(!t)return[];let e=t.max.precio-t.min.precio;return s.map(a=>e?Math.min(3,Math.floor((a.precio-t.min.precio)/e*4)):0)}function j(s,t,e=()=>!0){return Object.keys(s?.states||{}).filter(a=>a.startsWith(t)&&e(s.states[a])).sort()[0]}function Yt(s){return s?.states["sensor.pvpc_bs_precio"]?"sensor.pvpc_bs_precio":j(s,"sensor.",t=>"price_00h"in(t.attributes||{})&&String(t.attributes.attribution||"").includes("REE"))}var z=class extends P{constructor(){super(...arguments);Z(this,"_id",Math.random().toString(36).slice(2,8))}static getConfigForm(){return{schema:[{name:"entity",selector:{entity:{domain:"sensor"}}},{name:"title",selector:{text:{}}},{name:"factura",selector:{select:{mode:"dropdown",options:[{value:"below_chart",label:"Bajo la gr\xE1fica / Below the chart"},{value:"header",label:"Arriba / In the header"},{value:"hidden",label:"Oculta / Hidden"}]}}},{type:"grid",name:"",schema:[{name:"factura_actual",selector:{boolean:{}}},{name:"factura_anterior",selector:{boolean:{}}},{name:"prevision",selector:{boolean:{}}},{name:"current",selector:{boolean:{}}},{name:"details",selector:{boolean:{}}},{name:"graph",selector:{boolean:{}}},{name:"next_day",selector:{boolean:{}}},{name:"ventana",selector:{boolean:{}}}]},{name:"colores",selector:{select:{mode:"dropdown",options:[{value:"fijo",label:"Un color por d\xEDa / One colour per day"},{value:"precio",label:"Hoy por precio / Today by price"}]}}},{type:"grid",name:"",schema:[{name:"color_hoy",selector:{color_rgb:{}}},{name:"color_manana",selector:{color_rgb:{}}},{name:"bandas",selector:{boolean:{}}}]},{name:"entity_injection",selector:{entity:{domain:"sensor"}}},{name:"icon_color",selector:{select:{mode:"dropdown",options:[{value:"price",label:"Por precio / By price"},{value:"period",label:"Por periodo P1-P3 / By period"},{value:"fijo",label:"Azul fijo / Fixed blue"}]}}},{type:"grid",name:"",schema:[{name:"grafica_facturas",selector:{boolean:{}}},{name:"facturas_importe",selector:{boolean:{}}},{name:"facturas_tendencia",selector:{boolean:{}}},{name:"facturas_meses",selector:{select:{mode:"dropdown",options:["3","5","6","9","12"].map(e=>({value:e,label:e}))}}},{name:"color_facturas",selector:{color_rgb:{}}}]},{name:"titulo_grafica",selector:{text:{}}},{name:"titulo_facturas",selector:{text:{}}},{name:"entity_factura_actual",selector:{entity:{domain:"sensor"}}},{name:"entity_factura_anterior",selector:{entity:{domain:"sensor"}}}],computeLabel:e=>ye[e.name]||e.name}}static getStubConfig(e){return{entity:Yt(e)||"sensor.pvpc_bs_precio",entity_factura_actual:j(e,"sensor.pvpc_bs_factura_actual")||"sensor.pvpc_bs_factura_actual",entity_factura_anterior:j(e,"sensor.pvpc_bs_factura_anterior")||"sensor.pvpc_bs_factura_anterior",current:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,grafica_facturas:!0,facturas_meses:"6",facturas_importe:!0,ventana:!0,details:!0,next_day:!0,graph:!0,bandas:!0,colores:"fijo",grid_options:{columns:"full",rows:"auto"}}}setConfig(e){if(!e)throw new Error("Configuraci\xF3n no v\xE1lida");let a={};for(let[r,i]of[["show_current","current"],["show_details","details"],["show_graph","graph"]])typeof e[r]=="boolean"&&!(i in e)&&(a[i]=e[r]);typeof e.show_only_today=="boolean"&&!("next_day"in e)&&(a.next_day=!e.show_only_today),this._config={current:!0,details:!0,graph:!0,next_day:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,icon_color:"price",colores:"fijo",color_hoy:$t,color_manana:It,bandas:!0,grafica_facturas:!1,facturas_meses:"6",facturas_importe:!0,ventana:!0,...a,...e}}getCardSize(){return this._config?.graph===!1?3:7}getGridOptions(){return{columns:"full",rows:"auto",min_columns:6,min_rows:3}}get _cHoy(){return vt(this._config.color_hoy,$t)}get _cManana(){return vt(this._config.color_manana,It)}get _t(){let e=(this.hass?.locale?.language||this.hass?.language||"es").slice(0,2);return Gt[e]||Gt.en}_num(e,a=3){let r=this.hass?.locale?.language||this.hass?.language||"es";return new Intl.NumberFormat(r,{minimumFractionDigits:a,maximumFractionDigits:a}).format(e)}render(){if(!this._config||!this.hass)return d;let e=this._t,a=this._config.entity||Yt(this.hass),r=a&&this.hass.states[a];if(!r)return m`<ha-card><div class="aviso">${e.sin_entidad}</div></ha-card>`;let i=r.attributes||{},o=et(i),l=this._config.next_day?et(i,!0):[],c=Array.isArray(i.colores_hoy)&&i.colores_hoy.length===o.length?i.colores_hoy:Kt(o),u=Array.isArray(i.colores_manana)&&i.colores_manana.length===l.length?i.colores_manana:Kt(l),h=be(o),n=this._config.entity_injection&&this.hass.states[this._config.entity_injection],_=n?{hoy:et(n.attributes),manana:this._config.next_day?et(n.attributes,!0):[]}:null,$=this._config.bandas!==!1&&Array.isArray(i.periodos_hoy)&&i.periodos_hoy.length===o.length&&i.periodos_hoy.some(g=>g!=="P3")?i.periodos_hoy:null,f=Number(r.state),b=this._factura(),w=this._config.factura;return m`
      <ha-card>
        <div class="contenedor">
          ${this._config.current?m`<div class="cabecera">
                ${this._conVentana?m`<button class="abrir" aria-label=${e.abrir} @click=${()=>this._abrirVentana()}>
                      ${this._icono(h>=0?c[h]:void 0)}
                    </button>`:this._icono(h>=0?c[h]:void 0)}
                <div class="nombre">${this._config.title||""}</div>
                <div class="actual">
                  <div class="precio">
                    ${Number.isFinite(f)?this._precioGrande(f):"\u2014"}
                    <span class="unidad"><span class="euro">€</span>/kWh</span>
                  </div>
                  ${n&&Number.isFinite(Number(n.state))?m`<div class="precio-iny">${this._num(Number(n.state),5)} €/kWh</div>`:d}
                  ${w==="header"&&b?m`<div class="factura arriba">${b}</div>`:d}
                </div>
              </div>`:d}
          ${this._config.details?this._detalles(o,l,_):d}
          ${this._config.graph?this._grafica(o,l,c,u,h,$,_):d}
          ${b&&(w==="below_chart"||w==="header"&&!this._config.current)?m`<div class="factura abajo">${b}</div>`:d}
          ${b&&w==="header"&&this._config.current?m`<div class="factura abajo estrecha">${b}</div>`:d}
          ${this._config.grafica_facturas?this._graficaFacturas():d}
        </div>
      </ha-card>
      ${this._ventana?this._dialogo():d}
    `}get _conVentana(){return this._config.ventana!==!1&&!this.enVentana}set configVentana(e){this.enVentana=!0,this.toggleAttribute("en-ventana",!0),this.setConfig(e)}_abrirVentana(){this._conVentana&&(this._ventana=!0)}_cerrarVentana(){this.renderRoot.querySelector("dialog.ventana")?.close()}_dialogo(){let e={...this._config,current:!0,details:!0,graph:!0,next_day:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,grafica_facturas:!0,ventana:!1};return m`<dialog
      class="ventana"
      @close=${()=>this._ventana=!1}
      @click=${a=>a.target===a.currentTarget&&this._cerrarVentana()}
    >
      <div class="ventana-cuerpo">
        <div class="ventana-cabecera">
          <button class="cerrar" aria-label=${this._t.cerrar} @click=${()=>this._cerrarVentana()}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path>
            </svg>
          </button>
          <div class="ventana-titulo">${this._config.title||"PVPC + Bono Social"}</div>
        </div>
        <pvpc-bono-social-card .configVentana=${e} .hass=${this.hass}></pvpc-bono-social-card>
      </div>
    </dialog>`}_precioGrande(e){let a=this._num(e,5);return m`${a.slice(0,-2)}<span class="cola">${a.slice(-2)}</span>`}_icono(e){let a=e;if(this._config.icon_color==="period"){let o=this.hass.states["sensor.pvpc_bs_periodo"]?.state;a=$e[o]}let r=this._config.icon_color==="fijo"||a===void 0?$t:qt[a],i=`pvpc-bs-hueco-${this._id}`;return m`<svg class="icono" viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <mask id=${i}>
          <rect width="512" height="512" fill="#fff"></rect>
          <circle cx="256" cy="424" r="74" fill="#000"></circle>
        </mask>
      </defs>
      <g mask="url(#${i})" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M108 150 V170 M404 150 V170 M108 230 V250 M404 230 V250" stroke=${r} stroke-opacity="0.6" stroke-width="10"></path>
        <g fill=${r} fill-opacity="0.6">
          <rect x="88" y="168" width="40" height="14" rx="7"></rect>
          <rect x="384" y="168" width="40" height="14" rx="7"></rect>
          <rect x="88" y="248" width="40" height="14" rx="7"></rect>
          <rect x="384" y="248" width="40" height="14" rx="7"></rect>
        </g>
        <g stroke=${r} stroke-width="22">
          <path d="M100 150 H412 M100 150 L243.8 95 M412 150 L268.2 95"></path>
          <path d="M100 230 H412 M100 230 L228.7 178 M412 230 L283.3 178"></path>
          <path
            d="M233.8 150 L292.7 230 M278.2 150 L219.3 230 M219.3 230 L310.9 330 M292.7 230 L201.1 330 M201.1 330 L336 468 M310.9 330 L176 468"
          ></path>
          <path d="M176 468 L256 28 L336 468"></path>
        </g>
        <path d="M150 484 H362" stroke=${r} stroke-width="22"></path>
      </g>
      <circle cx="256" cy="424" r="60" fill=${r}></circle>
      <text x="256" y="426" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="84"
        text-anchor="middle" dominant-baseline="central">€</text>
    </svg>`}_hora(e){return`${String(e).padStart(2,"0")}:00`}_fecha(e=0){let a=new Date;return a.setDate(a.getDate()+e),new Intl.DateTimeFormat(this.hass?.locale?.language||this.hass?.language||"es").format(a)}_triangulo(e,a){return m`<svg class="tri" viewBox="0 0 24 24" aria-hidden="true"><path d=${Wt[e]} fill=${a}></path></svg>`}_detalles(e,a,r){let i=this._t,o=(u,h,n)=>m`<div class="detalle">
        ${this._triangulo(u,h)}
        <div>
          ${n?m`<div class="valor">${this._num(n.precio,5)} €/kWh</div>
                <div class="horas">${this._hora(n.hora)} - ${this._hora(n.hora+1)}</div>`:m`<div class="valor">${i.no_disponible}</div>`}
        </div>
      </div>`,l=(u,h,n="")=>{let _=bt(u);return m`<div class="columna">${o(`min${n}`,h,_?.min)}${o(`max${n}`,h,_?.max)}</div>`},c=(u,h,n)=>m`<div class="detalles">
        ${l(u,this._cHoy,n)}${h.length?l(h,this._cManana,n):d}
      </div>`;return m`${c(e,a)}${r?c(r.hoy,r.manana,"_hueco"):d}`}_factura(){let e=this._t;if(this._config.factura==="hidden")return null;let a=[],r=this._config.entity_factura_anterior||j(this.hass,"sensor.pvpc_bs_factura_anterior"),i=this._config.entity_factura_actual||j(this.hass,"sensor.pvpc_bs_factura_actual"),o=n=>typeof n=="string"?`${n.slice(8,10)}/${n.slice(5,7)}`:"",l=(n,_)=>n&&_?` (${o(n)} - ${o(_)})`:"",c=(n,_,$,f=d)=>m`<div>${n}${_}: <b>${this._num($,2)} €</b>${f}</div>`,u=r&&this.hass.states[r];if(this._config.factura_anterior&&u&&Number.isFinite(Number(u.state))){let n=u.attributes||{};a.push(c(e.anterior,l(n.inicio,n.fin),Number(u.state)))}let h=i&&this.hass.states[i];if(this._config.factura_actual&&h&&Number.isFinite(Number(h.state))){let n=h.attributes||{},_=new Date,$=`${_.getFullYear()}-${String(_.getMonth()+1).padStart(2,"0")}-${String(_.getDate()).padStart(2,"0")}`;typeof n.acumulado=="number"&&a.push(c(e.en_curso,l(n.inicio,$),n.acumulado)),this._config.prevision!==!1&&a.push(c(e.estimada_cierre,l(n.inicio,n.fin_previsto),Number(h.state)))}return a.length?a:null}_grafica(e,a,r,i,o,l,c){let u=this._t;if(!e.length)return m`<div class="aviso">${u.sin_precio}</div>`;let h=this._cHoy,n=this._cManana,_=480,$=190,f={izq:38,der:16,arr:24,aba:24},b=[{puntos:e,color:h},{puntos:a,color:n},...c?[{puntos:c.hoy,color:h,punteada:!0},{puntos:c.manana,color:n,punteada:!0}]:[]].filter(p=>p.puntos.length),w=b.flatMap(p=>p.puntos.map(x=>x.precio)),g=Math.min(0,...w),S=Math.max(...w);S-g<.01&&(S=g+.01);let U=(S-g)*.08;g-=Math.min(0,...w)<0?U:0,S+=U;let yt=Math.max(e.length,a.length,24),G=(_-f.izq-f.der)/yt,E=p=>f.izq+G*p,K=p=>E(p)+G/2,M=p=>f.arr+($-f.arr-f.aba)*(1-(p-g)/(S-g)),Zt=p=>p.map((x,y)=>`${y?"V":`M${E(0).toFixed(1)},`}${M(x.precio).toFixed(1)}H${E(y+1).toFixed(1)}`).join(""),Jt=(p,x,y)=>A`<line class="tramo" x1=${E(y)} x2=${E(y+1)} y1=${M(p[y].precio)} y2=${M(p[y].precio)}
        stroke=${qt[x[y]??0]}></line>`,xt=(p,x,y)=>{let Y=bt(p),te=p.indexOf(Y[y]),ee=M(Y[y].precio)+(y==="max"?-11:4);return A`<svg class="marca" x=${K(te)-4.5} y=${ee} width="9" height="9" viewBox="0 0 24 24">
        <path d=${Wt[y]} fill=${x}></path></svg>`},Qt=(S-g)/4,Xt=[0,1,2,3,4].map(p=>g+Qt*p),v=this._cursor,At=(p,x,y,Y)=>A`<circle class=${Y} cx=${K(y)} cy=${M(p[y].precio)} r="3" fill=${x}></circle>`,at=this._config.colores==="precio",wt=this._config.titulo_grafica??"PVPC";return m`
      <div class="grafica">
        ${wt?m`<div class="titulo-seccion">${wt}</div>`:d}
        <svg
          viewBox="0 0 ${_} ${$}"
          role="img"
          aria-label=${u.titulo}
          @pointermove=${p=>this._mover(p,_,f,yt)}
          @pointerleave=${()=>this._cursor=void 0}
        >
          <text class="eje" x=${f.izq-4} y=${f.arr-12} text-anchor="end">€/kWh</text>
          ${l?l.map((p,x)=>p==="P3"?d:A`<rect class=${p==="P1"?"banda-punta":"banda-llano"} x=${E(x)}
                      y=${f.arr} width=${G} height=${$-f.arr-f.aba}></rect>`):d}
          ${o>=0?A`<rect class="ahora" x=${E(o)} y=${f.arr} width=${G} height=${$-f.arr-f.aba}></rect>`:d}
          ${Xt.map(p=>A`<line class="rejilla" x1=${f.izq} x2=${_-f.der} y1=${M(p)} y2=${M(p)}></line>
              <text class="eje" x=${f.izq-4} y=${M(p)+3} text-anchor="end">${this._num(Math.abs(p)<.005?0:p,2)}</text>`)}
          ${[0,3,6,9,12,15,18,21,24].map(p=>A`<line class="rejilla" x1=${E(p)} x2=${E(p)} y1=${f.arr} y2=${$-f.aba}></line>
              <text class="eje" x=${E(p)} y=${$-8} text-anchor="middle">${this._hora(p)}</text>`)}
          ${b.map(p=>A`<path class="serie ${p.punteada?"punteada":""}" d=${Zt(p.puntos)}
                stroke=${at&&p.puntos===e?"var(--secondary-text-color)":p.color}></path>`)}
          ${at?e.map((p,x)=>Jt(e,r,x)):d}
          ${b.flatMap(p=>[xt(p.puntos,p.color,"max"),xt(p.puntos,p.color,"min")])}
          ${v!==void 0?A`<line class="cursor" x1=${K(v)} x2=${K(v)} y1=${f.arr} y2=${$-f.aba}></line>`:d}
          ${v!==void 0&&v<e.length?At(e,h,v,"p-hoy"):d}
          ${v!==void 0&&v<a.length?At(a,n,v,"p-manana"):d}
        </svg>
        <div class="leyenda">
          ${v!==void 0?m`<span
                  ><b>${this._hora((e[v]??a[v])?.hora??v)} - ${this._hora(((e[v]??a[v])?.hora??v)+1)}</b>${l?.[v]?m` · ${u.periodos[l[v]]}`:d}</span
                >
                ${e[v]?m`<span><i class="bolita" style="background:${h}"></i>${this._num(e[v].precio,5)}</span>`:d}
                ${a[v]?m`<span><i class="bolita" style="background:${n}"></i>${this._num(a[v].precio,5)}</span>`:d}`:m`<span
                  ><i class="bolita" style="background:${at?ve:h}"></i>${this._fecha(0)}</span
                >${a.length?m`<span><i class="bolita" style="background:${n}"></i>${this._fecha(1)}</span>`:d}${o>=0?m`<span class="l-ahora">${u.hora_actual}</span>`:d}${l?m`<span class="l-punta">${u.periodos.P1}</span><span class="l-llano">${u.periodos.P2}</span>`:d}`}
        </div>
      </div>
    `}connectedCallback(){super.connectedCallback(),this._observador??=new ResizeObserver(()=>this._alinearFactura()),this._observador.observe(this)}disconnectedCallback(){super.disconnectedCallback(),this._observador?.disconnect()}_alinearFactura(){let e=this.renderRoot?.querySelector(".cabecera .actual");if(!e)return;let a=e.querySelector(".precio"),r=[...e.querySelectorAll(".precio-iny, .factura.arriba")];for(let n of[a,...r])n&&(n.style.marginRight="");let i=this.renderRoot.querySelectorAll(".detalles .columna"),o=this.renderRoot.querySelector(".cabecera .icono");if(i.length<2||!e.offsetParent)return;let l=Math.max(...[...i[1].querySelectorAll(".valor, .horas")].map(n=>n.getBoundingClientRect().right));if(!Number.isFinite(l))return;let c=n=>o?n.getBoundingClientRect().left-o.getBoundingClientRect().right-12:1/0,u=(n,_)=>{let $=Math.min(_,c(n));$>0&&(n.style.marginRight=`${$}px`)},h=a?.querySelector(".euro");h&&u(a,h.getBoundingClientRect().right-l);for(let n of r)u(n,n.getBoundingClientRect().right-l)}updated(e){if(super.updated?.(e),this._alinearFactura(),e.has("_ventana")&&this._ventana){let i=this.renderRoot.querySelector("dialog.ventana");i&&!i.open&&i.showModal()}if(!this.hass||!this._config?.grafica_facturas||this._cargandoFacturas||this._facturasDelSensor())return;let a=`${this._config.estadistica_facturas||""}|${this._config.facturas_meses}`;(!this._facturasHora||Date.now()-this._facturasHora>3*3600*1e3||a!==this._facturasClave)&&this._cargarFacturas(a)}_facturasDelSensor(){if(this._config.estadistica_facturas)return null;let e=this._config.entity_factura_actual||j(this.hass,"sensor.pvpc_bs_factura_actual"),a=this.hass?.states[e]?.attributes?.facturas;if(!Array.isArray(a))return null;let r=Math.max(1,Number(this._config.facturas_meses)||6);return a.filter(i=>Number.isFinite(Number(i.total))&&i.inicio).map(i=>{let[o,l,c]=String(i.inicio).split("-").map(Number);return{inicio:new Date(o,l-1,c+1),total:Number(i.total),real:i.real!==!1}}).slice(-r)}async _cargarFacturas(e){this._cargandoFacturas=!0,this._facturasClave=e,this._facturasHora=Date.now();try{let a=this._config.estadistica_facturas;if(a||(a=(await this.hass.callWS({type:"recorder/list_statistic_ids",statistic_type:"mean"})).map(c=>c.statistic_id).find(c=>c.startsWith("pvpc_bonosocial:facturas_"))),!a){this._facturas=[];return}let r=Math.max(1,Number(this._config.facturas_meses)||6),i=new Date(Date.now()-(r+2)*35*86400*1e3),o=await this.hass.callWS({type:"recorder/statistics_during_period",start_time:i.toISOString(),statistic_ids:[a],period:"hour",types:["max"]});this._facturas=(o[a]||[]).filter(l=>Number.isFinite(Number(l.max))).map(l=>({inicio:new Date(l.start),total:Number(l.max),real:!0})).slice(-r)}catch(a){console.warn("pvpc-bono-social-card: no se pudieron leer las facturas",a),this._facturas=[]}finally{this._cargandoFacturas=!1}}_graficaFacturas(){let e=this._t,a=this._facturasDelSensor()??this._facturas,r=this._config.titulo_facturas??e.facturas,i=r?m`<div class="titulo-seccion">${r}</div>`:d;if(!a)return d;if(!a.length)return m`<div class="facturas">${i}<div class="aviso">${e.sin_facturas}</div></div>`;let o=vt(this._config.color_facturas,this._cHoy),l=this._config.facturas_importe!==!1,c=480,u=150,h={izq:8,der:8,arr:l?18:6,aba:20},n=Math.max(...a.map(g=>g.total),1),_=(c-h.izq-h.der)/a.length,$=Math.min(_*.6,56),f=g=>h.arr+(u-h.arr-h.aba)*(1-Math.max(g,0)/n),b=this.hass?.locale?.language||this.hass?.language||"es",w=new Intl.DateTimeFormat(b,{month:"short",year:"2-digit"});return m`
      <div class="facturas">
        ${i}
        <svg viewBox="0 0 ${c} ${u}" role="img" aria-label=${r||e.facturas}>
          <line class="rejilla" x1=${h.izq} x2=${c-h.der} y1=${u-h.aba} y2=${u-h.aba}></line>
          ${a.map((g,S)=>{let U=h.izq+_*(S+.5);return A`<rect class="barra ${g.real?"real":"calculada"}" x=${U-$/2+(g.real?0:1)}
                y=${f(g.total)+(g.real?0:1)} width=${$-(g.real?0:2)}
                height=${Math.max(u-h.aba-f(g.total)-(g.real?0:1),0)} rx="3"
                fill=${g.real?o:"none"} stroke=${o}>
                <title>${w.format(g.inicio)}: ${this._num(g.total,2)} € (${g.real?e.real:e.calculada})</title></rect>
              <text class="eje" x=${U} y=${u-6} text-anchor="middle">${w.format(g.inicio)}</text>`})}
          ${this._config.facturas_tendencia&&a.length>1?this._tendencia(a,_,h,f):d}
          ${l?a.map((g,S)=>A`<text class="importe" x=${h.izq+_*(S+.5)} y=${f(g.total)-5}
                    text-anchor="middle">${this._num(g.total,2)} €</text>`):d}
        </svg>
        ${a.some(g=>!g.real)?m`<div class="leyenda">
              ${a.some(g=>g.real)?m`<span><i class="bolita cuadro" style="background:${o}"></i>${e.factura_real}</span>`:d}
              <span><i class="bolita cuadro" style="border:2px solid ${o}"></i>${e.calculada_consumo}</span>
            </div>`:d}
      </div>
    `}_tendencia(e,a,r,i){let o=e.length,l=(o-1)/2,c=e.reduce((f,b)=>f+b.total,0)/o,u=0,h=0;e.forEach((f,b)=>{u+=(b-l)*(f.total-c),h+=(b-l)**2});let n=u/h,_=f=>c+n*(f-l),$=f=>r.izq+a*(f+.5);return A`<line class="tendencia" x1=${$(0)} y1=${i(_(0))} x2=${$(o-1)} y2=${i(_(o-1))}></line>`}_mover(e,a,r,i){let o=e.currentTarget.getBoundingClientRect(),l=(e.clientX-o.left)/o.width*a,c=Math.floor((l-r.izq)/(a-r.izq-r.der)*i);this._cursor=c>=0&&c<i?c:void 0}};Z(z,"properties",{hass:{attribute:!1},_config:{state:!0},_cursor:{state:!0},_facturas:{state:!0},_ventana:{state:!0}}),Z(z,"styles",st`
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
    .titulo-seccion {
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
    .barra.calculada {
      stroke-width: 2;
    }
    .bolita.cuadro {
      border-radius: 2px;
      box-sizing: border-box;
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
    button.abrir {
      flex: none;
      padding: 0;
      border: none;
      background: none;
      cursor: pointer;
      border-radius: 12px;
      line-height: 0;
    }
    button.abrir:focus-visible {
      outline: 2px solid var(--primary-color);
    }
    dialog.ventana {
      padding: 0;
      border: none;
      border-radius: var(--ha-dialog-border-radius, 24px);
      width: min(560px, calc(100vw - 32px));
      max-height: calc(100vh - 64px);
      background: var(--card-background-color, var(--ha-card-background, #fff));
      color: var(--primary-text-color);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
      overflow: auto;
    }
    dialog.ventana::backdrop {
      background: rgba(0, 0, 0, 0.5);
    }
    @media (max-width: 600px) {
      dialog.ventana {
        width: 100vw;
        max-width: 100vw;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
      }
    }
    .ventana-cabecera {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px 0;
      position: sticky;
      top: 0;
      z-index: 1;
      background: inherit;
    }
    .ventana-titulo {
      font-size: 1.3em;
      font-weight: 500;
    }
    button.cerrar {
      width: 40px;
      height: 40px;
      padding: 8px;
      border: none;
      border-radius: 50%;
      background: none;
      cursor: pointer;
      color: var(--primary-text-color);
    }
    button.cerrar:hover {
      background: var(--secondary-background-color, rgba(127, 127, 127, 0.15));
    }
    button.cerrar svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    .ventana-cuerpo {
      background: var(--card-background-color, var(--ha-card-background, #fff));
    }
    :host([en-ventana]) ha-card {
      box-shadow: none;
      border: none;
      background: transparent;
    }
    .aviso {
      padding: 16px;
      color: var(--secondary-text-color);
    }
  `);var ye={entity:"Sensor de precio / Price sensor",title:"T\xEDtulo / Title",factura:"Factura / Bill",factura_actual:"Factura en curso / Current bill",factura_anterior:"Factura anterior / Previous bill",prevision:"Factura estimada al cierre / Estimated bill",current:"Precio actual / Current price",details:"M\xEDnimos y m\xE1ximos / Min and max",graph:"Gr\xE1fica / Chart",ventana:"Ventana con todo al pulsar el icono / Full view on icon tap",next_day:"Ma\xF1ana / Tomorrow",icon_color:"Color del icono / Icon colour",colores:"Colores de la gr\xE1fica / Chart colours",color_hoy:"Color de hoy / Today's colour",color_manana:"Color de ma\xF1ana / Tomorrow's colour",bandas:"Punta y llano sombreados / Shade peak hours",entity_injection:"Sensor de precio de excedentes (opcional) / Injection price sensor (optional)",grafica_facturas:"Gr\xE1fica de facturas / Bills chart",facturas_importe:"Importe sobre cada barra / Amount above bars",facturas_tendencia:"L\xEDnea de tendencia / Trend line",facturas_meses:"Cu\xE1ntas facturas / How many bills",color_facturas:"Color de las barras / Bar colour",titulo_grafica:"T\xEDtulo de la gr\xE1fica de precios / Price chart title",titulo_facturas:"T\xEDtulo de la gr\xE1fica de facturas / Bills chart title",entity_factura_actual:"Sensor de factura en curso / Current bill sensor",entity_factura_anterior:"Sensor de factura anterior / Previous bill sensor"};customElements.get(gt)||(customElements.define(gt,z),window.customCards=window.customCards||[],window.customCards.push({type:gt,name:"PVPC + Bono Social",description:"Precio del PVPC de hoy y ma\xF1ana y la factura con o sin bono social.",preview:!0,documentationURL:"https://github.com/BaRDaHL/pvpc_bonosocial"}),console.info(`%c PVPC + Bono Social %c ${ge} `,"background:#43a047;color:#fff",""));customElements.get(Vt)||customElements.define(Vt,class extends z{});export{vt as colorCss,be as posicionActual,et as serie};
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
