var te=Object.defineProperty;var ee=(o,t,e)=>t in o?te(o,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):o[t]=e;var Y=(o,t,e)=>ee(o,typeof t!="symbol"?t+"":t,e);var G=globalThis,K=G.ShadowRoot&&(G.ShadyCSS===void 0||G.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,tt=Symbol(),bt=new WeakMap,R=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==tt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(K&&t===void 0){let s=e!==void 0&&e.length===1;s&&(t=bt.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&bt.set(e,t))}return t}toString(){return this.cssText}},xt=o=>new R(typeof o=="string"?o:o+"",void 0,tt),et=(o,...t)=>{let e=o.length===1?o[0]:t.reduce((s,i,r)=>s+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+o[r+1],o[0]);return new R(e,o,tt)},At=(o,t)=>{if(K)o.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let s=document.createElement("style"),i=G.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=e.cssText,o.appendChild(s)}},st=K?o=>o:o=>o instanceof CSSStyleSheet?(t=>{let e="";for(let s of t.cssRules)e+=s.cssText;return xt(e)})(o):o;var{is:se,defineProperty:ie,getOwnPropertyDescriptor:oe,getOwnPropertyNames:re,getOwnPropertySymbols:ae,getPrototypeOf:ne}=Object,J=globalThis,wt=J.trustedTypes,ce=wt?wt.emptyScript:"",le=J.reactiveElementPolyfillSupport,z=(o,t)=>o,it={toAttribute(o,t){switch(t){case Boolean:o=o?ce:null;break;case Object:case Array:o=o==null?o:JSON.stringify(o)}return o},fromAttribute(o,t){let e=o;switch(t){case Boolean:e=o!==null;break;case Number:e=o===null?null:Number(o);break;case Object:case Array:try{e=JSON.parse(o)}catch{e=null}}return e}},Et=(o,t)=>!se(o,t),St={attribute:!0,type:String,converter:it,reflect:!1,useDefault:!1,hasChanged:Et};Symbol.metadata??=Symbol("metadata"),J.litPropertyMetadata??=new WeakMap;var w=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=St){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let s=Symbol(),i=this.getPropertyDescriptor(t,s,e);i!==void 0&&ie(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){let{get:i,set:r}=oe(this.prototype,t)??{get(){return this[e]},set(a){this[e]=a}};return{get:i,set(a){let n=i?.call(this);r?.call(this,a),this.requestUpdate(t,n,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??St}static _$Ei(){if(this.hasOwnProperty(z("elementProperties")))return;let t=ne(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(z("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(z("properties"))){let e=this.properties,s=[...re(e),...ae(e)];for(let i of s)this.createProperty(i,e[i])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[s,i]of e)this.elementProperties.set(s,i)}this._$Eh=new Map;for(let[e,s]of this.elementProperties){let i=this._$Eu(e,s);i!==void 0&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let i of s)e.unshift(st(i))}else t!==void 0&&e.push(st(t));return e}static _$Eu(t,e){let s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return At(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){let s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(i!==void 0&&s.reflect===!0){let r=(s.converter?.toAttribute!==void 0?s.converter:it).toAttribute(e,s.type);this._$Em=t,r==null?this.removeAttribute(i):this.setAttribute(i,r),this._$Em=null}}_$AK(t,e){let s=this.constructor,i=s._$Eh.get(t);if(i!==void 0&&this._$Em!==i){let r=s.getPropertyOptions(i),a=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:it;this._$Em=i;let n=a.fromAttribute(e,r.type);this[i]=n??this._$Ej?.get(i)??n,this._$Em=null}}requestUpdate(t,e,s,i=!1,r){if(t!==void 0){let a=this.constructor;if(i===!1&&(r=this[t]),s??=a.getPropertyOptions(t),!((s.hasChanged??Et)(r,e)||s.useDefault&&s.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(a._$Eu(t,s))))return;this.C(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:r},a){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??e??this[t]),r!==!0||a!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),i===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[i,r]of this._$Ep)this[i]=r;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[i,r]of s){let{wrapped:a}=r,n=this[i];a!==!0||this._$AL.has(i)||n===void 0||this.C(i,void 0,r,n)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(e)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[z("elementProperties")]=new Map,w[z("finalized")]=new Map,le?.({ReactiveElement:w}),(J.reactiveElementVersions??=[]).push("2.1.2");var ht=globalThis,Ct=o=>o,Q=ht.trustedTypes,Pt=Q?Q.createPolicy("lit-html",{createHTML:o=>o}):void 0,jt="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,kt="?"+C,he=`<${kt}>`,O=document,D=()=>O.createComment(""),I=o=>o===null||typeof o!="object"&&typeof o!="function",dt=Array.isArray,de=o=>dt(o)||typeof o?.[Symbol.iterator]=="function",ot=`[ 	
\f\r]`,L=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Mt=/-->/g,Nt=/>/g,M=RegExp(`>|${ot}(?:([^\\s"'>=/]+)(${ot}*=${ot}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ot=/'/g,Ht=/"/g,Ut=/^(?:script|style|textarea|title)$/i,pt=o=>(t,...e)=>({_$litType$:o,strings:t,values:e}),_=pt(1),A=pt(2),Se=pt(3),H=Symbol.for("lit-noChange"),h=Symbol.for("lit-nothing"),Tt=new WeakMap,N=O.createTreeWalker(O,129);function Rt(o,t){if(!dt(o)||!o.hasOwnProperty("raw"))throw Error("invalid template strings array");return Pt!==void 0?Pt.createHTML(t):t}var pe=(o,t)=>{let e=o.length-1,s=[],i,r=t===2?"<svg>":t===3?"<math>":"",a=L;for(let n=0;n<e;n++){let c=o[n],p,d,u=-1,f=0;for(;f<c.length&&(a.lastIndex=f,d=a.exec(c),d!==null);)f=a.lastIndex,a===L?d[1]==="!--"?a=Mt:d[1]!==void 0?a=Nt:d[2]!==void 0?(Ut.test(d[2])&&(i=RegExp("</"+d[2],"g")),a=M):d[3]!==void 0&&(a=M):a===M?d[0]===">"?(a=i??L,u=-1):d[1]===void 0?u=-2:(u=a.lastIndex-d[2].length,p=d[1],a=d[3]===void 0?M:d[3]==='"'?Ht:Ot):a===Ht||a===Ot?a=M:a===Mt||a===Nt?a=L:(a=M,i=void 0);let m=a===M&&o[n+1].startsWith("/>")?" ":"";r+=a===L?c+he:u>=0?(s.push(p),c.slice(0,u)+jt+c.slice(u)+C+m):c+C+(u===-2?n:m)}return[Rt(o,r+(o[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]},B=class o{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let r=0,a=0,n=t.length-1,c=this.parts,[p,d]=pe(t,e);if(this.el=o.createElement(p,s),N.currentNode=this.el.content,e===2||e===3){let u=this.el.content.firstChild;u.replaceWith(...u.childNodes)}for(;(i=N.nextNode())!==null&&c.length<n;){if(i.nodeType===1){if(i.hasAttributes())for(let u of i.getAttributeNames())if(u.endsWith(jt)){let f=d[a++],m=i.getAttribute(u).split(C),y=/([.?@])?(.*)/.exec(f);c.push({type:1,index:r,name:y[2],strings:m,ctor:y[1]==="."?at:y[1]==="?"?nt:y[1]==="@"?ct:k}),i.removeAttribute(u)}else u.startsWith(C)&&(c.push({type:6,index:r}),i.removeAttribute(u));if(Ut.test(i.tagName)){let u=i.textContent.split(C),f=u.length-1;if(f>0){i.textContent=Q?Q.emptyScript:"";for(let m=0;m<f;m++)i.append(u[m],D()),N.nextNode(),c.push({type:2,index:++r});i.append(u[f],D())}}}else if(i.nodeType===8)if(i.data===kt)c.push({type:2,index:r});else{let u=-1;for(;(u=i.data.indexOf(C,u+1))!==-1;)c.push({type:7,index:r}),u+=C.length-1}r++}}static createElement(t,e){let s=O.createElement("template");return s.innerHTML=t,s}};function j(o,t,e=o,s){if(t===H)return t;let i=s!==void 0?e._$Co?.[s]:e._$Cl,r=I(t)?void 0:t._$litDirective$;return i?.constructor!==r&&(i?._$AO?.(!1),r===void 0?i=void 0:(i=new r(o),i._$AT(o,e,s)),s!==void 0?(e._$Co??=[])[s]=i:e._$Cl=i),i!==void 0&&(t=j(o,i._$AS(o,t.values),i,s)),t}var rt=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??O).importNode(e,!0);N.currentNode=i;let r=N.nextNode(),a=0,n=0,c=s[0];for(;c!==void 0;){if(a===c.index){let p;c.type===2?p=new F(r,r.nextSibling,this,t):c.type===1?p=new c.ctor(r,c.name,c.strings,this,t):c.type===6&&(p=new lt(r,this,t)),this._$AV.push(p),c=s[++n]}a!==c?.index&&(r=N.nextNode(),a++)}return N.currentNode=O,i}p(t){let e=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}},F=class o{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=h,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=j(this,t,e),I(t)?t===h||t==null||t===""?(this._$AH!==h&&this._$AR(),this._$AH=h):t!==this._$AH&&t!==H&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):de(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==h&&I(this._$AH)?this._$AA.nextSibling.data=t:this.T(O.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:s}=t,i=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=B.createElement(Rt(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{let r=new rt(i,this),a=r.u(this.options);r.p(e),this.T(a),this._$AH=r}}_$AC(t){let e=Tt.get(t.strings);return e===void 0&&Tt.set(t.strings,e=new B(t)),e}k(t){dt(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,i=0;for(let r of t)i===e.length?e.push(s=new o(this.O(D()),this.O(D()),this,this.options)):s=e[i],s._$AI(r),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let s=Ct(t).nextSibling;Ct(t).remove(),t=s}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},k=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,r){this.type=1,this._$AH=h,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=r,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=h}_$AI(t,e=this,s,i){let r=this.strings,a=!1;if(r===void 0)t=j(this,t,e,0),a=!I(t)||t!==this._$AH&&t!==H,a&&(this._$AH=t);else{let n=t,c,p;for(t=r[0],c=0;c<r.length-1;c++)p=j(this,n[s+c],e,c),p===H&&(p=this._$AH[c]),a||=!I(p)||p!==this._$AH[c],p===h?t=h:t!==h&&(t+=(p??"")+r[c+1]),this._$AH[c]=p}a&&!i&&this.j(t)}j(t){t===h?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},at=class extends k{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===h?void 0:t}},nt=class extends k{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==h)}},ct=class extends k{constructor(t,e,s,i,r){super(t,e,s,i,r),this.type=5}_$AI(t,e=this){if((t=j(this,t,e,0)??h)===H)return;let s=this._$AH,i=t===h&&s!==h||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,r=t!==h&&(s===h||i);i&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},lt=class{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){j(this,t)}};var ue=ht.litHtmlPolyfillSupport;ue?.(B,F),(ht.litHtmlVersions??=[]).push("3.3.3");var zt=(o,t,e)=>{let s=e?.renderBefore??t,i=s._$litPart$;if(i===void 0){let r=e?.renderBefore??null;s._$litPart$=i=new F(t.insertBefore(D(),r),r,void 0,e??{})}return i._$AI(o),i};var ut=globalThis,P=class extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=zt(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return H}};P._$litElement$=!0,P.finalized=!0,ut.litElementHydrateSupport?.({LitElement:P});var me=ut.litElementPolyfillSupport;me?.({LitElement:P});(ut.litElementVersions??=[]).push("4.2.2");var _e="1.1.2",mt="pvpc-bono-social-card",Lt="pvpc-hourly-pricing-card",Dt=["var(--pvpc-bs-verde)","var(--pvpc-bs-amarillo)","var(--pvpc-bs-naranja)","var(--pvpc-bs-rojo)"],fe={P1:3,P2:2,P3:0},It="#4269d0",Bt="#f4bd4a";function Ft(o,t){return Array.isArray(o)&&o.length===3&&o.every(e=>Number.isFinite(Number(e)))?`rgb(${o.map(Number).join(", ")})`:typeof o=="string"&&o.trim()?o.trim():t}var $e=`conic-gradient(${["verde","amarillo","naranja","rojo"].map((o,t)=>`var(--pvpc-bs-${o}) ${t*25}% ${(t+1)*25}%`).join(", ")})`,qt={min:"M1,3H23L12,22",max:"M1,21H23L12,2",min_hueco:"M12,22L1,3H23L12,22M12,17.5L19.5,5H4.5L12,17.5Z",max_hueco:"M12,2L1,21H23M12,6L19.53,19H4.47"},Vt={es:{titulo:"Precio de la luz",ahora:"Ahora",hoy:"Hoy",manana:"Ma\xF1ana",minimo:"M\xEDnimo",maximo:"M\xE1ximo",anterior:"Factura periodo anterior",en_curso:"Factura periodo en curso",prevision:"previsi\xF3n",estimada:"estimada",desviacion:"desviaci\xF3n",real:"real",sin_precio:"Sin precios",no_disponible:"No disponible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"llano",P3:"valle"},sin_entidad:"No se encuentra el sensor de precio de PVPC + Bono Social"},en:{titulo:"Electricity price",ahora:"Now",hoy:"Today",manana:"Tomorrow",minimo:"Minimum",maximo:"Maximum",anterior:"Previous bill",en_curso:"Current bill",prevision:"forecast",estimada:"estimated",desviacion:"deviation",real:"actual",sin_precio:"No prices",no_disponible:"Unavailable",hora_actual:"Current hour",periodos:{P1:"peak",P2:"standard",P3:"off-peak"},sin_entidad:"PVPC + Bono Social price sensor not found"}};function X(o,t=!1){let e=t?"price_next_day_":"price_",s=[];for(let i=0;i<24;i++){let r=String(i).padStart(2,"0"),a=o?.[`${e}${r}h`];typeof a=="number"&&s.push({hora:i,precio:a});let n=o?.[`${e}${r}h_d`];typeof n=="number"&&s.push({hora:i,precio:n})}return s}function ge(o,t=new Date){let e=t.getHours();return o.findIndex(s=>s.hora===e)}function _t(o){if(!o.length)return null;let t=0,e=0;return o.forEach((s,i)=>{s.precio<o[t].precio&&(t=i),s.precio>o[e].precio&&(e=i)}),{min:o[t],max:o[e]}}function Wt(o){let t=_t(o);if(!t)return[];let e=t.max.precio-t.min.precio;return o.map(s=>e?Math.min(3,Math.floor((s.precio-t.min.precio)/e*4)):0)}function ft(o,t,e=()=>!0){return Object.keys(o?.states||{}).filter(s=>s.startsWith(t)&&e(o.states[s])).sort()[0]}function Gt(o){return o?.states["sensor.pvpc_bs_precio"]?"sensor.pvpc_bs_precio":ft(o,"sensor.",t=>"price_00h"in(t.attributes||{})&&String(t.attributes.attribution||"").includes("REE"))}var U=class extends P{static getConfigForm(){return{schema:[{name:"entity",selector:{entity:{domain:"sensor"}}},{name:"title",selector:{text:{}}},{name:"factura",selector:{select:{mode:"dropdown",options:[{value:"below_chart",label:"Bajo la gr\xE1fica / Below the chart"},{value:"header",label:"Arriba / In the header"},{value:"hidden",label:"Oculta / Hidden"}]}}},{type:"grid",name:"",schema:[{name:"factura_actual",selector:{boolean:{}}},{name:"factura_anterior",selector:{boolean:{}}},{name:"current",selector:{boolean:{}}},{name:"details",selector:{boolean:{}}},{name:"graph",selector:{boolean:{}}},{name:"next_day",selector:{boolean:{}}}]},{name:"colores",selector:{select:{mode:"dropdown",options:[{value:"fijo",label:"Un color por d\xEDa / One colour per day"},{value:"precio",label:"Hoy por precio / Today by price"}]}}},{type:"grid",name:"",schema:[{name:"color_hoy",selector:{color_rgb:{}}},{name:"color_manana",selector:{color_rgb:{}}},{name:"bandas",selector:{boolean:{}}}]},{name:"entity_injection",selector:{entity:{domain:"sensor"}}},{name:"icon_color",selector:{select:{mode:"dropdown",options:[{value:"price",label:"Por precio / By price"},{value:"period",label:"Por periodo P1-P3 / By period"}]}}},{name:"entity_factura_actual",selector:{entity:{domain:"sensor"}}},{name:"entity_factura_anterior",selector:{entity:{domain:"sensor"}}}],computeLabel:t=>ye[t.name]||t.name}}static getStubConfig(t){return{entity:Gt(t)||"sensor.pvpc_bs_precio"}}setConfig(t){if(!t)throw new Error("Configuraci\xF3n no v\xE1lida");let e={};for(let[s,i]of[["show_current","current"],["show_details","details"],["show_graph","graph"]])typeof t[s]=="boolean"&&!(i in t)&&(e[i]=t[s]);typeof t.show_only_today=="boolean"&&!("next_day"in t)&&(e.next_day=!t.show_only_today),this._config={current:!0,details:!0,graph:!0,next_day:!0,factura:"below_chart",factura_actual:!0,factura_anterior:!0,icon_color:"price",colores:"fijo",color_hoy:It,color_manana:Bt,bandas:!0,...e,...t}}getCardSize(){return this._config?.graph===!1?3:7}getGridOptions(){return{columns:12,min_columns:6,rows:this._config?.graph===!1?3:7,min_rows:3}}get _cHoy(){return Ft(this._config.color_hoy,It)}get _cManana(){return Ft(this._config.color_manana,Bt)}get _t(){let t=(this.hass?.locale?.language||this.hass?.language||"es").slice(0,2);return Vt[t]||Vt.en}_num(t,e=3){let s=this.hass?.locale?.language||this.hass?.language||"es";return new Intl.NumberFormat(s,{minimumFractionDigits:e,maximumFractionDigits:e}).format(t)}render(){if(!this._config||!this.hass)return h;let t=this._t,e=this._config.entity||Gt(this.hass),s=e&&this.hass.states[e];if(!s)return _`<ha-card><div class="aviso">${t.sin_entidad}</div></ha-card>`;let i=s.attributes||{},r=X(i),a=this._config.next_day?X(i,!0):[],n=Array.isArray(i.colores_hoy)&&i.colores_hoy.length===r.length?i.colores_hoy:Wt(r),c=Array.isArray(i.colores_manana)&&i.colores_manana.length===a.length?i.colores_manana:Wt(a),p=ge(r),d=this._config.entity_injection&&this.hass.states[this._config.entity_injection],u=d?{hoy:X(d.attributes),manana:this._config.next_day?X(d.attributes,!0):[]}:null,f=this._config.bandas!==!1&&Array.isArray(i.periodos_hoy)&&i.periodos_hoy.length===r.length&&i.periodos_hoy.some(b=>b!=="P3")?i.periodos_hoy:null,m=Number(s.state),y=this._factura(),S=this._config.factura;return _`
      <ha-card>
        <div class="contenedor">
          ${this._config.current?_`<div class="cabecera">
                ${this._icono(p>=0?n[p]:void 0)}
                <div class="nombre">${this._config.title||""}</div>
                <div class="actual">
                  <div class="precio">
                    ${Number.isFinite(m)?this._precioGrande(m):"\u2014"}
                    <span class="unidad">€/kWh</span>
                  </div>
                  ${d&&Number.isFinite(Number(d.state))?_`<div class="precio-iny">${this._num(Number(d.state),5)} €/kWh</div>`:h}
                </div>
              </div>
              ${S==="header"&&y?_`<div class="factura arriba">${y}</div>`:h}`:h}
          ${this._config.details?this._detalles(r,a,u):h}
          ${this._config.graph?this._grafica(r,a,n,c,p,f,u):h}
          ${y&&(S==="below_chart"||S==="header"&&!this._config.current)?_`<div class="factura abajo">${y}</div>`:h}
          ${y&&S==="header"&&this._config.current?_`<div class="factura abajo estrecha">${y}</div>`:h}
        </div>
      </ha-card>
    `}_precioGrande(t){let e=this._num(t,5);return _`${e.slice(0,-2)}<span class="cola">${e.slice(-2)}</span>`}_icono(t){let e=t;if(this._config.icon_color==="period"){let i=this.hass.states["sensor.pvpc_bs_periodo"]?.state;e=fe[i]}let s=e===void 0?"var(--secondary-text-color)":Dt[e];return _`<div class="icono" style="background:${s}" aria-hidden="true">€</div>`}_hora(t){return`${String(t).padStart(2,"0")}:00`}_fecha(t=0){let e=new Date;return e.setDate(e.getDate()+t),new Intl.DateTimeFormat(this.hass?.locale?.language||this.hass?.language||"es").format(e)}_triangulo(t,e){return _`<svg class="tri" viewBox="0 0 24 24" aria-hidden="true"><path d=${qt[t]} fill=${e}></path></svg>`}_detalles(t,e,s){let i=this._t,r=(c,p,d)=>_`<div class="detalle">
        ${this._triangulo(c,p)}
        <div>
          ${d?_`<div class="valor">${this._num(d.precio,5)} €/kWh</div>
                <div class="horas">${this._hora(d.hora)} - ${this._hora(d.hora+1)}</div>`:_`<div class="valor">${i.no_disponible}</div>`}
        </div>
      </div>`,a=(c,p,d="")=>{let u=_t(c);return _`<div class="columna">${r(`min${d}`,p,u?.min)}${r(`max${d}`,p,u?.max)}</div>`},n=(c,p,d)=>_`<div class="detalles">
        ${a(c,this._cHoy,d)}${p.length?a(p,this._cManana,d):h}
      </div>`;return _`${n(t,e)}${s?n(s.hoy,s.manana,"_hueco"):h}`}_factura(){let t=this._t;if(this._config.factura==="hidden")return null;let e=[],s=this._config.entity_factura_anterior||ft(this.hass,"sensor.pvpc_bs_factura_anterior"),i=this._config.entity_factura_actual||ft(this.hass,"sensor.pvpc_bs_factura_actual"),r=i&&this.hass.states[i];if(this._config.factura_actual&&r&&Number.isFinite(Number(r.state))){let n=r.attributes?.acumulado;e.push(typeof n=="number"?_`<div>
              ${t.en_curso}: <b class="grande">${this._num(n,2)} €</b>
              <span class="suave">(${t.prevision} ${this._num(Number(r.state),2)} €)</span>
            </div>`:_`<div>${t.en_curso}: <span class="suave">${t.prevision}</span> <b>${this._num(Number(r.state),2)} €</b></div>`)}let a=s&&this.hass.states[s];if(this._config.factura_anterior&&a&&Number.isFinite(Number(a.state))){let n=a.attributes||{},c=n.estado==="conciliada"&&typeof n.estimada=="number"?_` <span class="suave">(${t.estimada} ${this._num(n.estimada,2)} €, ${t.desviacion}
              ${this._num(n.desviacion??n.estimada-Number(a.state),2)} €)</span>`:h,p=typeof n.cnmc=="number"?_` <span class="suave">· CNMC ${this._num(n.cnmc,2)} €</span>`:h,d=f=>typeof f=="string"?`${f.slice(8,10)}/${f.slice(5,7)}`:"",u=n.inicio&&n.fin?` (${d(n.inicio)}\u2013${d(n.fin)})`:"";e.push(_`<div>${t.anterior}${u}: <b>${this._num(Number(a.state),2)} €</b>${c}${p}</div>`)}return e.length?e:null}_grafica(t,e,s,i,r,a,n){let c=this._t;if(!t.length)return _`<div class="aviso">${c.sin_precio}</div>`;let p=this._cHoy,d=this._cManana,u=480,f=190,m={izq:38,der:16,arr:24,aba:24},y=[{puntos:t,color:p},{puntos:e,color:d},...n?[{puntos:n.hoy,color:p,punteada:!0},{puntos:n.manana,color:d,punteada:!0}]:[]].filter(l=>l.puntos.length),S=y.flatMap(l=>l.puntos.map(v=>v.precio)),b=Math.min(0,...S),T=Math.max(...S);T-b<.01&&(T=b+.01);let $t=(T-b)*.08;b-=Math.min(0,...S)<0?$t:0,T+=$t;let gt=Math.max(t.length,e.length,24),q=(u-m.izq-m.der)/gt,x=l=>m.izq+q*l,V=l=>x(l)+q/2,E=l=>m.arr+(f-m.arr-m.aba)*(1-(l-b)/(T-b)),Kt=l=>l.map((v,g)=>`${g?"V":`M${x(0).toFixed(1)},`}${E(v.precio).toFixed(1)}H${x(g+1).toFixed(1)}`).join(""),Jt=(l,v,g)=>A`<line class="tramo" x1=${x(g)} x2=${x(g+1)} y1=${E(l[g].precio)} y2=${E(l[g].precio)}
        stroke=${Dt[v[g]??0]}></line>`,yt=(l,v,g)=>{let W=_t(l),Zt=l.indexOf(W[g]),Yt=E(W[g].precio)+(g==="max"?-11:4);return A`<svg class="marca" x=${V(Zt)-4.5} y=${Yt} width="9" height="9" viewBox="0 0 24 24">
        <path d=${qt[g]} fill=${v}></path></svg>`},Qt=(T-b)/4,Xt=[0,1,2,3,4].map(l=>b+Qt*l),$=this._cursor,vt=(l,v,g,W)=>A`<circle class=${W} cx=${V(g)} cy=${E(l[g].precio)} r="3" fill=${v}></circle>`,Z=this._config.colores==="precio";return _`
      <div class="grafica">
        <svg
          viewBox="0 0 ${u} ${f}"
          role="img"
          aria-label=${c.titulo}
          @pointermove=${l=>this._mover(l,u,m,gt)}
          @pointerleave=${()=>this._cursor=void 0}
        >
          <text class="eje" x=${m.izq-4} y=${m.arr-12} text-anchor="end">€/kWh</text>
          ${a?a.map((l,v)=>l==="P3"?h:A`<rect class=${l==="P1"?"banda-punta":"banda-llano"} x=${x(v)}
                      y=${m.arr} width=${q} height=${f-m.arr-m.aba}></rect>`):h}
          ${r>=0?A`<rect class="ahora" x=${x(r)} y=${m.arr} width=${q} height=${f-m.arr-m.aba}></rect>`:h}
          ${Xt.map(l=>A`<line class="rejilla" x1=${m.izq} x2=${u-m.der} y1=${E(l)} y2=${E(l)}></line>
              <text class="eje" x=${m.izq-4} y=${E(l)+3} text-anchor="end">${this._num(Math.abs(l)<.005?0:l,2)}</text>`)}
          ${[0,3,6,9,12,15,18,21,24].map(l=>A`<line class="rejilla" x1=${x(l)} x2=${x(l)} y1=${m.arr} y2=${f-m.aba}></line>
              <text class="eje" x=${x(l)} y=${f-8} text-anchor="middle">${this._hora(l)}</text>`)}
          ${y.map(l=>A`<path class="serie ${l.punteada?"punteada":""}" d=${Kt(l.puntos)}
                stroke=${Z&&l.puntos===t?"var(--secondary-text-color)":l.color}></path>`)}
          ${Z?t.map((l,v)=>Jt(t,s,v)):h}
          ${y.flatMap(l=>[yt(l.puntos,l.color,"max"),yt(l.puntos,l.color,"min")])}
          ${$!==void 0?A`<line class="cursor" x1=${V($)} x2=${V($)} y1=${m.arr} y2=${f-m.aba}></line>`:h}
          ${$!==void 0&&$<t.length?vt(t,p,$,"p-hoy"):h}
          ${$!==void 0&&$<e.length?vt(e,d,$,"p-manana"):h}
        </svg>
        <div class="leyenda">
          ${$!==void 0?_`<span
                  ><b>${this._hora((t[$]??e[$])?.hora??$)} - ${this._hora(((t[$]??e[$])?.hora??$)+1)}</b>${a?.[$]?_` · ${c.periodos[a[$]]}`:h}</span
                >
                ${t[$]?_`<span><i class="bolita" style="background:${p}"></i>${this._num(t[$].precio,5)}</span>`:h}
                ${e[$]?_`<span><i class="bolita" style="background:${d}"></i>${this._num(e[$].precio,5)}</span>`:h}`:_`<span
                  ><i class="bolita" style="background:${Z?$e:p}"></i>${this._fecha(0)}</span
                >${e.length?_`<span><i class="bolita" style="background:${d}"></i>${this._fecha(1)}</span>`:h}${r>=0?_`<span class="l-ahora">${c.hora_actual}</span>`:h}${a?_`<span class="l-punta">${c.periodos.P1}</span><span class="l-llano">${c.periodos.P2}</span>`:h}`}
        </div>
      </div>
    `}_mover(t,e,s,i){let r=t.currentTarget.getBoundingClientRect(),a=(t.clientX-r.left)/r.width*e,n=Math.floor((a-s.izq)/(e-s.izq-s.der)*i);this._cursor=n>=0&&n<i?n:void 0}};Y(U,"properties",{hass:{attribute:!1},_config:{state:!0},_cursor:{state:!0}}),Y(U,"styles",et`
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
    .cabecera {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .icono {
      flex: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: #fff;
      font-weight: 700;
      font-size: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
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
      margin-top: -8px;
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
  `);var ye={entity:"Sensor de precio / Price sensor",title:"T\xEDtulo / Title",factura:"Factura / Bill",factura_actual:"Factura en curso / Current bill",factura_anterior:"Factura anterior / Previous bill",current:"Precio actual / Current price",details:"M\xEDnimos y m\xE1ximos / Min and max",graph:"Gr\xE1fica / Chart",next_day:"Ma\xF1ana / Tomorrow",icon_color:"Color del icono / Icon colour",colores:"Colores de la gr\xE1fica / Chart colours",color_hoy:"Color de hoy / Today's colour",color_manana:"Color de ma\xF1ana / Tomorrow's colour",bandas:"Punta y llano sombreados / Shade peak hours",entity_injection:"Sensor de precio de excedentes (opcional) / Injection price sensor (optional)",entity_factura_actual:"Sensor de factura en curso / Current bill sensor",entity_factura_anterior:"Sensor de factura anterior / Previous bill sensor"};customElements.get(mt)||(customElements.define(mt,U),window.customCards=window.customCards||[],window.customCards.push({type:mt,name:"PVPC + Bono Social",description:"Precio del PVPC de hoy y ma\xF1ana y la factura con o sin bono social.",preview:!0,documentationURL:"https://github.com/BaRDaHL/pvpc_bonosocial"}),console.info(`%c PVPC + Bono Social %c ${_e} `,"background:#43a047;color:#fff",""));customElements.get(Lt)||customElements.define(Lt,class extends U{});export{Ft as colorCss,ge as posicionActual,X as serie};
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
