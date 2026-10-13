var ee=Object.defineProperty;var se=(r,t,e)=>t in r?ee(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var J=(r,t,e)=>se(r,typeof t!="symbol"?t+"":t,e);var Q=globalThis,X=Q.ShadowRoot&&(Q.ShadyCSS===void 0||Q.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,st=Symbol(),At=new WeakMap,R=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==st)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(X&&t===void 0){let s=e!==void 0&&e.length===1;s&&(t=At.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&At.set(e,t))}return t}toString(){return this.cssText}},wt=r=>new R(typeof r=="string"?r:r+"",void 0,st),it=(r,...t)=>{let e=r.length===1?r[0]:t.reduce((s,i,o)=>s+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+r[o+1],r[0]);return new R(e,r,st)},St=(r,t)=>{if(X)r.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let s=document.createElement("style"),i=Q.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=e.cssText,r.appendChild(s)}},rt=X?r=>r:r=>r instanceof CSSStyleSheet?(t=>{let e="";for(let s of t.cssRules)e+=s.cssText;return wt(e)})(r):r;var{is:ie,defineProperty:re,getOwnPropertyDescriptor:oe,getOwnPropertyNames:ae,getOwnPropertySymbols:ne,getPrototypeOf:ce}=Object,Y=globalThis,Et=Y.trustedTypes,le=Et?Et.emptyScript:"",he=Y.reactiveElementPolyfillSupport,z=(r,t)=>r,ot={toAttribute(r,t){switch(t){case Boolean:r=r?le:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,t){let e=r;switch(t){case Boolean:e=r!==null;break;case Number:e=r===null?null:Number(r);break;case Object:case Array:try{e=JSON.parse(r)}catch{e=null}}return e}},Mt=(r,t)=>!ie(r,t),Ct={attribute:!0,type:String,converter:ot,reflect:!1,useDefault:!1,hasChanged:Mt};Symbol.metadata??=Symbol("metadata"),Y.litPropertyMetadata??=new WeakMap;var S=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=Ct){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let s=Symbol(),i=this.getPropertyDescriptor(t,s,e);i!==void 0&&re(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){let{get:i,set:o}=oe(this.prototype,t)??{get(){return this[e]},set(a){this[e]=a}};return{get:i,set(a){let d=i?.call(this);o?.call(this,a),this.requestUpdate(t,d,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Ct}static _$Ei(){if(this.hasOwnProperty(z("elementProperties")))return;let t=ce(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(z("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(z("properties"))){let e=this.properties,s=[...ae(e),...ne(e)];for(let i of s)this.createProperty(i,e[i])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[s,i]of e)this.elementProperties.set(s,i)}this._$Eh=new Map;for(let[e,s]of this.elementProperties){let i=this._$Eu(e,s);i!==void 0&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let i of s)e.unshift(rt(i))}else t!==void 0&&e.push(rt(t));return e}static _$Eu(t,e){let s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return St(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){let s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(i!==void 0&&s.reflect===!0){let o=(s.converter?.toAttribute!==void 0?s.converter:ot).toAttribute(e,s.type);this._$Em=t,o==null?this.removeAttribute(i):this.setAttribute(i,o),this._$Em=null}}_$AK(t,e){let s=this.constructor,i=s._$Eh.get(t);if(i!==void 0&&this._$Em!==i){let o=s.getPropertyOptions(i),a=typeof o.converter=="function"?{fromAttribute:o.converter}:o.converter?.fromAttribute!==void 0?o.converter:ot;this._$Em=i;let d=a.fromAttribute(e,o.type);this[i]=d??this._$Ej?.get(i)??d,this._$Em=null}}requestUpdate(t,e,s,i=!1,o){if(t!==void 0){let a=this.constructor;if(i===!1&&(o=this[t]),s??=a.getPropertyOptions(t),!((s.hasChanged??Mt)(o,e)||s.useDefault&&s.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(a._$Eu(t,s))))return;this.C(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:o},a){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??e??this[t]),o!==!0||a!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),i===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[i,o]of this._$Ep)this[i]=o;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[i,o]of s){let{wrapped:a}=o,d=this[i];a!==!0||this._$AL.has(i)||d===void 0||this.C(i,void 0,o,d)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(e)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};S.elementStyles=[],S.shadowRootOptions={mode:"open"},S[z("elementProperties")]=new Map,S[z("finalized")]=new Map,he?.({ReactiveElement:S}),(Y.reactiveElementVersions??=[]).push("2.1.2");var pt=globalThis,Pt=r=>r,Z=pt.trustedTypes,kt=Z?Z.createPolicy("lit-html",{createHTML:r=>r}):void 0,Lt="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,Ut="?"+M,de=`<${Ut}>`,O=document,I=()=>O.createComment(""),B=r=>r===null||typeof r!="object"&&typeof r!="function",ut=Array.isArray,pe=r=>ut(r)||typeof r?.[Symbol.iterator]=="function",at=`[ 	
\f\r]`,D=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ht=/-->/g,Ot=/>/g,k=RegExp(`>|${at}(?:([^\\s"'>=/]+)(${at}*=${at}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Nt=/'/g,jt=/"/g,Rt=/^(?:script|style|textarea|title)$/i,ft=r=>(t,...e)=>({_$litType$:r,strings:t,values:e}),m=ft(1),w=ft(2),Ee=ft(3),N=Symbol.for("lit-noChange"),h=Symbol.for("lit-nothing"),Tt=new WeakMap,H=O.createTreeWalker(O,129);function zt(r,t){if(!ut(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return kt!==void 0?kt.createHTML(t):t}var ue=(r,t)=>{let e=r.length-1,s=[],i,o=t===2?"<svg>":t===3?"<math>":"",a=D;for(let d=0;d<e;d++){let c=r[d],u,p,n=-1,_=0;for(;_<c.length&&(a.lastIndex=_,p=a.exec(c),p!==null);)_=a.lastIndex,a===D?p[1]==="!--"?a=Ht:p[1]!==void 0?a=Ot:p[2]!==void 0?(Rt.test(p[2])&&(i=RegExp("</"+p[2],"g")),a=k):p[3]!==void 0&&(a=k):a===k?p[0]===">"?(a=i??D,n=-1):p[1]===void 0?n=-2:(n=a.lastIndex-p[2].length,u=p[1],a=p[3]===void 0?k:p[3]==='"'?jt:Nt):a===jt||a===Nt?a=k:a===Ht||a===Ot?a=D:(a=k,i=void 0);let $=a===k&&r[d+1].startsWith("/>")?" ":"";o+=a===D?c+de:n>=0?(s.push(u),c.slice(0,n)+Lt+c.slice(n)+M+$):c+M+(n===-2?d:$)}return[zt(r,o+(r[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]},F=class r{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let o=0,a=0,d=t.length-1,c=this.parts,[u,p]=ue(t,e);if(this.el=r.createElement(u,s),H.currentNode=this.el.content,e===2||e===3){let n=this.el.content.firstChild;n.replaceWith(...n.childNodes)}for(;(i=H.nextNode())!==null&&c.length<d;){if(i.nodeType===1){if(i.hasAttributes())for(let n of i.getAttributeNames())if(n.endsWith(Lt)){let _=p[a++],$=i.getAttribute(n).split(M),f=/([.?@])?(.*)/.exec(_);c.push({type:1,index:o,name:f[2],strings:$,ctor:f[1]==="."?ct:f[1]==="?"?lt:f[1]==="@"?ht:L}),i.removeAttribute(n)}else n.startsWith(M)&&(c.push({type:6,index:o}),i.removeAttribute(n));if(Rt.test(i.tagName)){let n=i.textContent.split(M),_=n.length-1;if(_>0){i.textContent=Z?Z.emptyScript:"";for(let $=0;$<_;$++)i.append(n[$],I()),H.nextNode(),c.push({type:2,index:++o});i.append(n[_],I())}}}else if(i.nodeType===8)if(i.data===Ut)c.push({type:2,index:o});else{let n=-1;for(;(n=i.data.indexOf(M,n+1))!==-1;)c.push({type:7,index:o}),n+=M.length-1}o++}}static createElement(t,e){let s=O.createElement("template");return s.innerHTML=t,s}};function T(r,t,e=r,s){if(t===N)return t;let i=s!==void 0?e._$Co?.[s]:e._$Cl,o=B(t)?void 0:t._$litDirective$;return i?.constructor!==o&&(i?._$AO?.(!1),o===void 0?i=void 0:(i=new o(r),i._$AT(r,e,s)),s!==void 0?(e._$Co??=[])[s]=i:e._$Cl=i),i!==void 0&&(t=T(r,i._$AS(r,t.values),i,s)),t}var nt=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??O).importNode(e,!0);H.currentNode=i;let o=H.nextNode(),a=0,d=0,c=s[0];for(;c!==void 0;){if(a===c.index){let u;c.type===2?u=new q(o,o.nextSibling,this,t):c.type===1?u=new c.ctor(o,c.name,c.strings,this,t):c.type===6&&(u=new dt(o,this,t)),this._$AV.push(u),c=s[++d]}a!==c?.index&&(o=H.nextNode(),a++)}return H.currentNode=O,i}p(t){let e=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}},q=class r{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=h,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=T(this,t,e),B(t)?t===h||t==null||t===""?(this._$AH!==h&&this._$AR(),this._$AH=h):t!==this._$AH&&t!==N&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):pe(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==h&&B(this._$AH)?this._$AA.nextSibling.data=t:this.T(O.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:s}=t,i=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=F.createElement(zt(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{let o=new nt(i,this),a=o.u(this.options);o.p(e),this.T(a),this._$AH=o}}_$AC(t){let e=Tt.get(t.strings);return e===void 0&&Tt.set(t.strings,e=new F(t)),e}k(t){ut(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,i=0;for(let o of t)i===e.length?e.push(s=new r(this.O(I()),this.O(I()),this,this.options)):s=e[i],s._$AI(o),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let s=Pt(t).nextSibling;Pt(t).remove(),t=s}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},L=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,o){this.type=1,this._$AH=h,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=o,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=h}_$AI(t,e=this,s,i){let o=this.strings,a=!1;if(o===void 0)t=T(this,t,e,0),a=!B(t)||t!==this._$AH&&t!==N,a&&(this._$AH=t);else{let d=t,c,u;for(t=o[0],c=0;c<o.length-1;c++)u=T(this,d[s+c],e,c),u===N&&(u=this._$AH[c]),a||=!B(u)||u!==this._$AH[c],u===h?t=h:t!==h&&(t+=(u??"")+o[c+1]),this._$AH[c]=u}a&&!i&&this.j(t)}j(t){t===h?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},ct=class extends L{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===h?void 0:t}},lt=class extends L{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==h)}},ht=class extends L{constructor(t,e,s,i,o){super(t,e,s,i,o),this.type=5}_$AI(t,e=this){if((t=T(this,t,e,0)??h)===N)return;let s=this._$AH,i=t===h&&s!==h||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==h&&(s===h||i);i&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},dt=class{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){T(this,t)}};var fe=pt.litHtmlPolyfillSupport;fe?.(F,q),(pt.litHtmlVersions??=[]).push("3.3.3");var Dt=(r,t,e)=>{let s=e?.renderBefore??t,i=s._$litPart$;if(i===void 0){let o=e?.renderBefore??null;s._$litPart$=i=new q(t.insertBefore(I(),o),o,void 0,e??{})}return i._$AI(r),i};var _t=globalThis,P=class extends S{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Dt(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return N}};P._$litElement$=!0,P.finalized=!0,_t.litElementHydrateSupport?.({LitElement:P});var _e=_t.litElementPolyfillSupport;_e?.({LitElement:P});(_t.litElementVersions??=[]).push("4.2.2");var me="1.1.4",mt="pvpc-bono-social-card",It="pvpc-hourly-pricing-card",Bt=["var(--pvpc-bs-verde)","var(--pvpc-bs-amarillo)","var(--pvpc-bs-naranja)","var(--pvpc-bs-rojo)"],$e={P1:3,P2:2,P3:0},$t="#4269d0",Ft="#f4bd4a";function qt(r,t){return Array.isArray(r)&&r.length===3&&r.every(e=>Number.isFinite(Number(e)))?`rgb(${r.map(Number).join(", ")})`:typeof r=="string"&&r.trim()?r.trim():t}var ge=`conic-gradient(${["verde","amarillo","naranja","rojo"].map((r,t)=>`var(--pvpc-bs-${r}) ${t*25}% ${(t+1)*25}%`).join(", ")})`,Vt={min:"M1,3H23L12,22",max:"M1,21H23L12,2",min_hueco:"M12,22L1,3H23L12,22M12,17.5L19.5,5H4.5L12,17.5Z",max_hueco:"M12,2L1,21H23M12,6L19.53,19H4.47"},Wt={es:{titulo:"Precio de la luz",ahora:"Ahora",hoy:"Hoy",manana:"Ma\xF1ana",minimo:"M\xEDnimo",maximo:"M\xE1ximo",anterior:"Factura periodo anterior",en_curso:"Factura periodo en curso",prevision:"previsi\xF3n",estimada_cierre:"Factura estimada",estimada:"estimada",desviacion:"desviaci\xF3n",real:"real",sin_precio:"Sin precios",no_disponible:"No disponible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"llano",P3:"valle"},sin_entidad:"No se encuentra el sensor de precio de PVPC + Bono Social"},en:{titulo:"Electricity price",ahora:"Now",hoy:"Today",manana:"Tomorrow",minimo:"Minimum",maximo:"Maximum",anterior:"Previous bill",en_curso:"Current bill",prevision:"forecast",estimada_cierre:"Estimated bill",estimada:"estimated",desviacion:"deviation",real:"actual",sin_precio:"No prices",no_disponible:"Unavailable",hora_actual:"Current hour",periodos:{P1:"peak",P2:"standard",P3:"off-peak"},sin_entidad:"PVPC + Bono Social price sensor not found"}};function tt(r,t=!1){let e=t?"price_next_day_":"price_",s=[];for(let i=0;i<24;i++){let o=String(i).padStart(2,"0"),a=r?.[`${e}${o}h`];typeof a=="number"&&s.push({hora:i,precio:a});let d=r?.[`${e}${o}h_d`];typeof d=="number"&&s.push({hora:i,precio:d})}return s}function ye(r,t=new Date){let e=t.getHours();return r.findIndex(s=>s.hora===e)}function gt(r){if(!r.length)return null;let t=0,e=0;return r.forEach((s,i)=>{s.precio<r[t].precio&&(t=i),s.precio>r[e].precio&&(e=i)}),{min:r[t],max:r[e]}}function Gt(r){let t=gt(r);if(!t)return[];let e=t.max.precio-t.min.precio;return r.map(s=>e?Math.min(3,Math.floor((s.precio-t.min.precio)/e*4)):0)}function V(r,t,e=()=>!0){return Object.keys(r?.states||{}).filter(s=>s.startsWith(t)&&e(r.states[s])).sort()[0]}function Kt(r){return r?.states["sensor.pvpc_bs_precio"]?"sensor.pvpc_bs_precio":V(r,"sensor.",t=>"price_00h"in(t.attributes||{})&&String(t.attributes.attribution||"").includes("REE"))}var U=class extends P{constructor(){super(...arguments);J(this,"_id",Math.random().toString(36).slice(2,8))}static getConfigForm(){return{schema:[{name:"entity",selector:{entity:{domain:"sensor"}}},{name:"title",selector:{text:{}}},{name:"factura",selector:{select:{mode:"dropdown",options:[{value:"below_chart",label:"Bajo la gr\xE1fica / Below the chart"},{value:"header",label:"Arriba / In the header"},{value:"hidden",label:"Oculta / Hidden"}]}}},{type:"grid",name:"",schema:[{name:"factura_actual",selector:{boolean:{}}},{name:"factura_anterior",selector:{boolean:{}}},{name:"prevision",selector:{boolean:{}}},{name:"current",selector:{boolean:{}}},{name:"details",selector:{boolean:{}}},{name:"graph",selector:{boolean:{}}},{name:"next_day",selector:{boolean:{}}}]},{name:"colores",selector:{select:{mode:"dropdown",options:[{value:"fijo",label:"Un color por d\xEDa / One colour per day"},{value:"precio",label:"Hoy por precio / Today by price"}]}}},{type:"grid",name:"",schema:[{name:"color_hoy",selector:{color_rgb:{}}},{name:"color_manana",selector:{color_rgb:{}}},{name:"bandas",selector:{boolean:{}}}]},{name:"entity_injection",selector:{entity:{domain:"sensor"}}},{name:"icon_color",selector:{select:{mode:"dropdown",options:[{value:"price",label:"Por precio / By price"},{value:"period",label:"Por periodo P1-P3 / By period"},{value:"fijo",label:"Azul fijo / Fixed blue"}]}}},{name:"entity_factura_actual",selector:{entity:{domain:"sensor"}}},{name:"entity_factura_anterior",selector:{entity:{domain:"sensor"}}}],computeLabel:e=>ve[e.name]||e.name}}static getStubConfig(e){return{entity:Kt(e)||"sensor.pvpc_bs_precio",entity_factura_actual:V(e,"sensor.pvpc_bs_factura_actual")||"sensor.pvpc_bs_factura_actual",entity_factura_anterior:V(e,"sensor.pvpc_bs_factura_anterior")||"sensor.pvpc_bs_factura_anterior",current:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,details:!0,next_day:!0,graph:!0,bandas:!0,colores:"fijo",grid_options:{columns:"full",rows:"auto"}}}setConfig(e){if(!e)throw new Error("Configuraci\xF3n no v\xE1lida");let s={};for(let[i,o]of[["show_current","current"],["show_details","details"],["show_graph","graph"]])typeof e[i]=="boolean"&&!(o in e)&&(s[o]=e[i]);typeof e.show_only_today=="boolean"&&!("next_day"in e)&&(s.next_day=!e.show_only_today),this._config={current:!0,details:!0,graph:!0,next_day:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,icon_color:"price",colores:"fijo",color_hoy:$t,color_manana:Ft,bandas:!0,...s,...e}}getCardSize(){return this._config?.graph===!1?3:7}getGridOptions(){return{columns:"full",rows:"auto",min_columns:6,min_rows:3}}get _cHoy(){return qt(this._config.color_hoy,$t)}get _cManana(){return qt(this._config.color_manana,Ft)}get _t(){let e=(this.hass?.locale?.language||this.hass?.language||"es").slice(0,2);return Wt[e]||Wt.en}_num(e,s=3){let i=this.hass?.locale?.language||this.hass?.language||"es";return new Intl.NumberFormat(i,{minimumFractionDigits:s,maximumFractionDigits:s}).format(e)}render(){if(!this._config||!this.hass)return h;let e=this._t,s=this._config.entity||Kt(this.hass),i=s&&this.hass.states[s];if(!i)return m`<ha-card><div class="aviso">${e.sin_entidad}</div></ha-card>`;let o=i.attributes||{},a=tt(o),d=this._config.next_day?tt(o,!0):[],c=Array.isArray(o.colores_hoy)&&o.colores_hoy.length===a.length?o.colores_hoy:Gt(a),u=Array.isArray(o.colores_manana)&&o.colores_manana.length===d.length?o.colores_manana:Gt(d),p=ye(a),n=this._config.entity_injection&&this.hass.states[this._config.entity_injection],_=n?{hoy:tt(n.attributes),manana:this._config.next_day?tt(n.attributes,!0):[]}:null,$=this._config.bandas!==!1&&Array.isArray(o.periodos_hoy)&&o.periodos_hoy.length===a.length&&o.periodos_hoy.some(x=>x!=="P3")?o.periodos_hoy:null,f=Number(i.state),b=this._factura(),E=this._config.factura;return m`
      <ha-card>
        <div class="contenedor">
          ${this._config.current?m`<div class="cabecera">
                ${this._icono(p>=0?c[p]:void 0)}
                <div class="nombre">${this._config.title||""}</div>
                <div class="actual">
                  <div class="precio">
                    ${Number.isFinite(f)?this._precioGrande(f):"\u2014"}
                    <span class="unidad">€/kWh</span>
                  </div>
                  ${n&&Number.isFinite(Number(n.state))?m`<div class="precio-iny">${this._num(Number(n.state),5)} €/kWh</div>`:h}
                  ${E==="header"&&b?m`<div class="factura arriba">${b}</div>`:h}
                </div>
              </div>`:h}
          ${this._config.details?this._detalles(a,d,_):h}
          ${this._config.graph?this._grafica(a,d,c,u,p,$,_):h}
          ${b&&(E==="below_chart"||E==="header"&&!this._config.current)?m`<div class="factura abajo">${b}</div>`:h}
          ${b&&E==="header"&&this._config.current?m`<div class="factura abajo estrecha">${b}</div>`:h}
        </div>
      </ha-card>
    `}_precioGrande(e){let s=this._num(e,5);return m`${s.slice(0,-2)}<span class="cola">${s.slice(-2)}</span>`}_icono(e){let s=e;if(this._config.icon_color==="period"){let a=this.hass.states["sensor.pvpc_bs_periodo"]?.state;s=$e[a]}let i=this._config.icon_color==="fijo"||s===void 0?$t:Bt[s],o=`pvpc-bs-hueco-${this._id}`;return m`<svg class="icono" viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <mask id=${o}>
          <rect width="512" height="512" fill="#fff"></rect>
          <circle cx="256" cy="424" r="74" fill="#000"></circle>
        </mask>
      </defs>
      <g mask="url(#${o})" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M108 150 V170 M404 150 V170 M108 230 V250 M404 230 V250" stroke=${i} stroke-opacity="0.6" stroke-width="10"></path>
        <g fill=${i} fill-opacity="0.6">
          <rect x="88" y="168" width="40" height="14" rx="7"></rect>
          <rect x="384" y="168" width="40" height="14" rx="7"></rect>
          <rect x="88" y="248" width="40" height="14" rx="7"></rect>
          <rect x="384" y="248" width="40" height="14" rx="7"></rect>
        </g>
        <g stroke=${i} stroke-width="22">
          <path d="M100 150 H412 M100 150 L243.8 95 M412 150 L268.2 95"></path>
          <path d="M100 230 H412 M100 230 L228.7 178 M412 230 L283.3 178"></path>
          <path
            d="M233.8 150 L292.7 230 M278.2 150 L219.3 230 M219.3 230 L310.9 330 M292.7 230 L201.1 330 M201.1 330 L336 468 M310.9 330 L176 468"
          ></path>
          <path d="M176 468 L256 28 L336 468"></path>
        </g>
        <path d="M150 484 H362" stroke=${i} stroke-width="22"></path>
      </g>
      <circle cx="256" cy="424" r="60" fill=${i}></circle>
      <text x="256" y="426" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="84"
        text-anchor="middle" dominant-baseline="central">€</text>
    </svg>`}_hora(e){return`${String(e).padStart(2,"0")}:00`}_fecha(e=0){let s=new Date;return s.setDate(s.getDate()+e),new Intl.DateTimeFormat(this.hass?.locale?.language||this.hass?.language||"es").format(s)}_triangulo(e,s){return m`<svg class="tri" viewBox="0 0 24 24" aria-hidden="true"><path d=${Vt[e]} fill=${s}></path></svg>`}_detalles(e,s,i){let o=this._t,a=(u,p,n)=>m`<div class="detalle">
        ${this._triangulo(u,p)}
        <div>
          ${n?m`<div class="valor">${this._num(n.precio,5)} €/kWh</div>
                <div class="horas">${this._hora(n.hora)} - ${this._hora(n.hora+1)}</div>`:m`<div class="valor">${o.no_disponible}</div>`}
        </div>
      </div>`,d=(u,p,n="")=>{let _=gt(u);return m`<div class="columna">${a(`min${n}`,p,_?.min)}${a(`max${n}`,p,_?.max)}</div>`},c=(u,p,n)=>m`<div class="detalles">
        ${d(u,this._cHoy,n)}${p.length?d(p,this._cManana,n):h}
      </div>`;return m`${c(e,s)}${i?c(i.hoy,i.manana,"_hueco"):h}`}_factura(){let e=this._t;if(this._config.factura==="hidden")return null;let s=[],i=this._config.entity_factura_anterior||V(this.hass,"sensor.pvpc_bs_factura_anterior"),o=this._config.entity_factura_actual||V(this.hass,"sensor.pvpc_bs_factura_actual"),a=n=>typeof n=="string"?`${n.slice(8,10)}/${n.slice(5,7)}`:"",d=(n,_)=>n&&_?` (${a(n)} - ${a(_)})`:"",c=(n,_,$,f=h)=>m`<div>${n}${_}: <b>${this._num($,2)} €</b>${f}</div>`,u=i&&this.hass.states[i];if(this._config.factura_anterior&&u&&Number.isFinite(Number(u.state))){let n=u.attributes||{};s.push(c(e.anterior,d(n.inicio,n.fin),Number(u.state)))}let p=o&&this.hass.states[o];if(this._config.factura_actual&&p&&Number.isFinite(Number(p.state))){let n=p.attributes||{},_=new Date,$=`${_.getFullYear()}-${String(_.getMonth()+1).padStart(2,"0")}-${String(_.getDate()).padStart(2,"0")}`;typeof n.acumulado=="number"&&s.push(c(e.en_curso,d(n.inicio,$),n.acumulado)),this._config.prevision!==!1&&s.push(c(e.estimada_cierre,d(n.inicio,n.fin_previsto),Number(p.state)))}return s.length?s:null}_grafica(e,s,i,o,a,d,c){let u=this._t;if(!e.length)return m`<div class="aviso">${u.sin_precio}</div>`;let p=this._cHoy,n=this._cManana,_=480,$=190,f={izq:38,der:16,arr:24,aba:24},b=[{puntos:e,color:p},{puntos:s,color:n},...c?[{puntos:c.hoy,color:p,punteada:!0},{puntos:c.manana,color:n,punteada:!0}]:[]].filter(l=>l.puntos.length),E=b.flatMap(l=>l.puntos.map(v=>v.precio)),x=Math.min(0,...E),j=Math.max(...E);j-x<.01&&(j=x+.01);let yt=(j-x)*.08;x-=Math.min(0,...E)<0?yt:0,j+=yt;let vt=Math.max(e.length,s.length,24),W=(_-f.izq-f.der)/vt,A=l=>f.izq+W*l,G=l=>A(l)+W/2,C=l=>f.arr+($-f.arr-f.aba)*(1-(l-x)/(j-x)),Jt=l=>l.map((v,y)=>`${y?"V":`M${A(0).toFixed(1)},`}${C(v.precio).toFixed(1)}H${A(y+1).toFixed(1)}`).join(""),Qt=(l,v,y)=>w`<line class="tramo" x1=${A(y)} x2=${A(y+1)} y1=${C(l[y].precio)} y2=${C(l[y].precio)}
        stroke=${Bt[v[y]??0]}></line>`,bt=(l,v,y)=>{let K=gt(l),Zt=l.indexOf(K[y]),te=C(K[y].precio)+(y==="max"?-11:4);return w`<svg class="marca" x=${G(Zt)-4.5} y=${te} width="9" height="9" viewBox="0 0 24 24">
        <path d=${Vt[y]} fill=${v}></path></svg>`},Xt=(j-x)/4,Yt=[0,1,2,3,4].map(l=>x+Xt*l),g=this._cursor,xt=(l,v,y,K)=>w`<circle class=${K} cx=${G(y)} cy=${C(l[y].precio)} r="3" fill=${v}></circle>`,et=this._config.colores==="precio";return m`
      <div class="grafica">
        <svg
          viewBox="0 0 ${_} ${$}"
          role="img"
          aria-label=${u.titulo}
          @pointermove=${l=>this._mover(l,_,f,vt)}
          @pointerleave=${()=>this._cursor=void 0}
        >
          <text class="eje" x=${f.izq-4} y=${f.arr-12} text-anchor="end">€/kWh</text>
          ${d?d.map((l,v)=>l==="P3"?h:w`<rect class=${l==="P1"?"banda-punta":"banda-llano"} x=${A(v)}
                      y=${f.arr} width=${W} height=${$-f.arr-f.aba}></rect>`):h}
          ${a>=0?w`<rect class="ahora" x=${A(a)} y=${f.arr} width=${W} height=${$-f.arr-f.aba}></rect>`:h}
          ${Yt.map(l=>w`<line class="rejilla" x1=${f.izq} x2=${_-f.der} y1=${C(l)} y2=${C(l)}></line>
              <text class="eje" x=${f.izq-4} y=${C(l)+3} text-anchor="end">${this._num(Math.abs(l)<.005?0:l,2)}</text>`)}
          ${[0,3,6,9,12,15,18,21,24].map(l=>w`<line class="rejilla" x1=${A(l)} x2=${A(l)} y1=${f.arr} y2=${$-f.aba}></line>
              <text class="eje" x=${A(l)} y=${$-8} text-anchor="middle">${this._hora(l)}</text>`)}
          ${b.map(l=>w`<path class="serie ${l.punteada?"punteada":""}" d=${Jt(l.puntos)}
                stroke=${et&&l.puntos===e?"var(--secondary-text-color)":l.color}></path>`)}
          ${et?e.map((l,v)=>Qt(e,i,v)):h}
          ${b.flatMap(l=>[bt(l.puntos,l.color,"max"),bt(l.puntos,l.color,"min")])}
          ${g!==void 0?w`<line class="cursor" x1=${G(g)} x2=${G(g)} y1=${f.arr} y2=${$-f.aba}></line>`:h}
          ${g!==void 0&&g<e.length?xt(e,p,g,"p-hoy"):h}
          ${g!==void 0&&g<s.length?xt(s,n,g,"p-manana"):h}
        </svg>
        <div class="leyenda">
          ${g!==void 0?m`<span
                  ><b>${this._hora((e[g]??s[g])?.hora??g)} - ${this._hora(((e[g]??s[g])?.hora??g)+1)}</b>${d?.[g]?m` · ${u.periodos[d[g]]}`:h}</span
                >
                ${e[g]?m`<span><i class="bolita" style="background:${p}"></i>${this._num(e[g].precio,5)}</span>`:h}
                ${s[g]?m`<span><i class="bolita" style="background:${n}"></i>${this._num(s[g].precio,5)}</span>`:h}`:m`<span
                  ><i class="bolita" style="background:${et?ge:p}"></i>${this._fecha(0)}</span
                >${s.length?m`<span><i class="bolita" style="background:${n}"></i>${this._fecha(1)}</span>`:h}${a>=0?m`<span class="l-ahora">${u.hora_actual}</span>`:h}${d?m`<span class="l-punta">${u.periodos.P1}</span><span class="l-llano">${u.periodos.P2}</span>`:h}`}
        </div>
      </div>
    `}_mover(e,s,i,o){let a=e.currentTarget.getBoundingClientRect(),d=(e.clientX-a.left)/a.width*s,c=Math.floor((d-i.izq)/(s-i.izq-i.der)*o);this._cursor=c>=0&&c<o?c:void 0}};J(U,"properties",{hass:{attribute:!1},_config:{state:!0},_cursor:{state:!0}}),J(U,"styles",it`
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
  `);var ve={entity:"Sensor de precio / Price sensor",title:"T\xEDtulo / Title",factura:"Factura / Bill",factura_actual:"Factura en curso / Current bill",factura_anterior:"Factura anterior / Previous bill",prevision:"Factura estimada al cierre / Estimated bill",current:"Precio actual / Current price",details:"M\xEDnimos y m\xE1ximos / Min and max",graph:"Gr\xE1fica / Chart",next_day:"Ma\xF1ana / Tomorrow",icon_color:"Color del icono / Icon colour",colores:"Colores de la gr\xE1fica / Chart colours",color_hoy:"Color de hoy / Today's colour",color_manana:"Color de ma\xF1ana / Tomorrow's colour",bandas:"Punta y llano sombreados / Shade peak hours",entity_injection:"Sensor de precio de excedentes (opcional) / Injection price sensor (optional)",entity_factura_actual:"Sensor de factura en curso / Current bill sensor",entity_factura_anterior:"Sensor de factura anterior / Previous bill sensor"};customElements.get(mt)||(customElements.define(mt,U),window.customCards=window.customCards||[],window.customCards.push({type:mt,name:"PVPC + Bono Social",description:"Precio del PVPC de hoy y ma\xF1ana y la factura con o sin bono social.",preview:!0,documentationURL:"https://github.com/BaRDaHL/pvpc_bonosocial"}),console.info(`%c PVPC + Bono Social %c ${me} `,"background:#43a047;color:#fff",""));customElements.get(It)||customElements.define(It,class extends U{});export{qt as colorCss,ye as posicionActual,tt as serie};
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
