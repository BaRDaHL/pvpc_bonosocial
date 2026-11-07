var $e=Object.defineProperty;var ye=(i,t,e)=>t in i?$e(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var B=(i,t,e)=>ye(i,typeof t!="symbol"?t+"":t,e);var st=globalThis,ot=st.ShadowRoot&&(st.ShadyCSS===void 0||st.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,gt=Symbol(),jt=new WeakMap,W=class{constructor(t,e,a){if(this._$cssResult$=!0,a!==gt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(ot&&t===void 0){let a=e!==void 0&&e.length===1;a&&(t=jt.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),a&&jt.set(e,t))}return t}toString(){return this.cssText}},Ut=i=>new W(typeof i=="string"?i:i+"",void 0,gt),$t=(i,...t)=>{let e=i.length===1?i[0]:t.reduce((a,r,s)=>a+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+i[s+1],i[0]);return new W(e,i,gt)},Dt=(i,t)=>{if(ot)i.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let a=document.createElement("style"),r=st.litNonce;r!==void 0&&a.setAttribute("nonce",r),a.textContent=e.cssText,i.appendChild(a)}},yt=ot?i=>i:i=>i instanceof CSSStyleSheet?(t=>{let e="";for(let a of t.cssRules)e+=a.cssText;return Ut(e)})(i):i;var{is:be,defineProperty:ve,getOwnPropertyDescriptor:xe,getOwnPropertyNames:we,getOwnPropertySymbols:Ae,getPrototypeOf:Se}=Object,nt=globalThis,Ft=nt.trustedTypes,Ce=Ft?Ft.emptyScript:"",Ee=nt.reactiveElementPolyfillSupport,Z=(i,t)=>i,bt={toAttribute(i,t){switch(t){case Boolean:i=i?Ce:null;break;case Object:case Array:i=i==null?i:JSON.stringify(i)}return i},fromAttribute(i,t){let e=i;switch(t){case Boolean:e=i!==null;break;case Number:e=i===null?null:Number(i);break;case Object:case Array:try{e=JSON.parse(i)}catch{e=null}}return e}},Vt=(i,t)=>!be(i,t),It={attribute:!0,type:String,converter:bt,reflect:!1,useDefault:!1,hasChanged:Vt};Symbol.metadata??=Symbol("metadata"),nt.litPropertyMetadata??=new WeakMap;var M=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=It){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let a=Symbol(),r=this.getPropertyDescriptor(t,a,e);r!==void 0&&ve(this.prototype,t,r)}}static getPropertyDescriptor(t,e,a){let{get:r,set:s}=xe(this.prototype,t)??{get(){return this[e]},set(o){this[e]=o}};return{get:r,set(o){let l=r?.call(this);s?.call(this,o),this.requestUpdate(t,l,a)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??It}static _$Ei(){if(this.hasOwnProperty(Z("elementProperties")))return;let t=Se(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(Z("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Z("properties"))){let e=this.properties,a=[...we(e),...Ae(e)];for(let r of a)this.createProperty(r,e[r])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[a,r]of e)this.elementProperties.set(a,r)}this._$Eh=new Map;for(let[e,a]of this.elementProperties){let r=this._$Eu(e,a);r!==void 0&&this._$Eh.set(r,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let a=new Set(t.flat(1/0).reverse());for(let r of a)e.unshift(yt(r))}else t!==void 0&&e.push(yt(t));return e}static _$Eu(t,e){let a=e.attribute;return a===!1?void 0:typeof a=="string"?a:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let a of e.keys())this.hasOwnProperty(a)&&(t.set(a,this[a]),delete this[a]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Dt(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,a){this._$AK(t,a)}_$ET(t,e){let a=this.constructor.elementProperties.get(t),r=this.constructor._$Eu(t,a);if(r!==void 0&&a.reflect===!0){let s=(a.converter?.toAttribute!==void 0?a.converter:bt).toAttribute(e,a.type);this._$Em=t,s==null?this.removeAttribute(r):this.setAttribute(r,s),this._$Em=null}}_$AK(t,e){let a=this.constructor,r=a._$Eh.get(t);if(r!==void 0&&this._$Em!==r){let s=a.getPropertyOptions(r),o=typeof s.converter=="function"?{fromAttribute:s.converter}:s.converter?.fromAttribute!==void 0?s.converter:bt;this._$Em=r;let l=o.fromAttribute(e,s.type);this[r]=l??this._$Ej?.get(r)??l,this._$Em=null}}requestUpdate(t,e,a,r=!1,s){if(t!==void 0){let o=this.constructor;if(r===!1&&(s=this[t]),a??=o.getPropertyOptions(t),!((a.hasChanged??Vt)(s,e)||a.useDefault&&a.reflect&&s===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,a))))return;this.C(t,e,a)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:a,reflect:r,wrapped:s},o){a&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),s!==!0||o!==void 0)||(this._$AL.has(t)||(this.hasUpdated||a||(e=void 0),this._$AL.set(t,e)),r===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[r,s]of this._$Ep)this[r]=s;this._$Ep=void 0}let a=this.constructor.elementProperties;if(a.size>0)for(let[r,s]of a){let{wrapped:o}=s,l=this[r];o!==!0||this._$AL.has(r)||l===void 0||this.C(r,void 0,s,l)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(a=>a.hostUpdate?.()),this.update(e)):this._$EM()}catch(a){throw t=!1,this._$EM(),a}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};M.elementStyles=[],M.shadowRootOptions={mode:"open"},M[Z("elementProperties")]=new Map,M[Z("finalized")]=new Map,Ee?.({ReactiveElement:M}),(nt.reactiveElementVersions??=[]).push("2.1.2");var Et=globalThis,qt=i=>i,ct=Et.trustedTypes,Bt=ct?ct.createPolicy("lit-html",{createHTML:i=>i}):void 0,Qt="$lit$",z=`lit$${Math.random().toFixed(9).slice(2)}$`,Xt="?"+z,ke=`<${Xt}>`,j=document,K=()=>j.createComment(""),J=i=>i===null||typeof i!="object"&&typeof i!="function",kt=Array.isArray,Pe=i=>kt(i)||typeof i?.[Symbol.iterator]=="function",vt=`[ 	
\f\r]`,G=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Wt=/-->/g,Zt=/>/g,L=RegExp(`>|${vt}(?:([^\\s"'>=/]+)(${vt}*=${vt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Gt=/'/g,Kt=/"/g,Yt=/^(?:script|style|textarea|title)$/i,Pt=i=>(t,...e)=>({_$litType$:i,strings:t,values:e}),g=Pt(1),w=Pt(2),Ge=Pt(3),U=Symbol.for("lit-noChange"),u=Symbol.for("lit-nothing"),Jt=new WeakMap,R=j.createTreeWalker(j,129);function te(i,t){if(!kt(i)||!i.hasOwnProperty("raw"))throw Error("invalid template strings array");return Bt!==void 0?Bt.createHTML(t):t}var Me=(i,t)=>{let e=i.length-1,a=[],r,s=t===2?"<svg>":t===3?"<math>":"",o=G;for(let l=0;l<e;l++){let c=i[l],d,h,n=-1,_=0;for(;_<c.length&&(o.lastIndex=_,h=o.exec(c),h!==null);)_=o.lastIndex,o===G?h[1]==="!--"?o=Wt:h[1]!==void 0?o=Zt:h[2]!==void 0?(Yt.test(h[2])&&(r=RegExp("</"+h[2],"g")),o=L):h[3]!==void 0&&(o=L):o===L?h[0]===">"?(o=r??G,n=-1):h[1]===void 0?n=-2:(n=o.lastIndex-h[2].length,d=h[1],o=h[3]===void 0?L:h[3]==='"'?Kt:Gt):o===Kt||o===Gt?o=L:o===Wt||o===Zt?o=G:(o=L,r=void 0);let $=o===L&&i[l+1].startsWith("/>")?" ":"";s+=o===G?c+ke:n>=0?(a.push(d),c.slice(0,n)+Qt+c.slice(n)+z+$):c+z+(n===-2?l:$)}return[te(i,s+(i[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),a]},Q=class i{constructor({strings:t,_$litType$:e},a){let r;this.parts=[];let s=0,o=0,l=t.length-1,c=this.parts,[d,h]=Me(t,e);if(this.el=i.createElement(d,a),R.currentNode=this.el.content,e===2||e===3){let n=this.el.content.firstChild;n.replaceWith(...n.childNodes)}for(;(r=R.nextNode())!==null&&c.length<l;){if(r.nodeType===1){if(r.hasAttributes())for(let n of r.getAttributeNames())if(n.endsWith(Qt)){let _=h[o++],$=r.getAttribute(n).split(z),f=/([.?@])?(.*)/.exec(_);c.push({type:1,index:s,name:f[2],strings:$,ctor:f[1]==="."?wt:f[1]==="?"?At:f[1]==="@"?St:V}),r.removeAttribute(n)}else n.startsWith(z)&&(c.push({type:6,index:s}),r.removeAttribute(n));if(Yt.test(r.tagName)){let n=r.textContent.split(z),_=n.length-1;if(_>0){r.textContent=ct?ct.emptyScript:"";for(let $=0;$<_;$++)r.append(n[$],K()),R.nextNode(),c.push({type:2,index:++s});r.append(n[_],K())}}}else if(r.nodeType===8)if(r.data===Xt)c.push({type:2,index:s});else{let n=-1;for(;(n=r.data.indexOf(z,n+1))!==-1;)c.push({type:7,index:s}),n+=z.length-1}s++}}static createElement(t,e){let a=j.createElement("template");return a.innerHTML=t,a}};function I(i,t,e=i,a){if(t===U)return t;let r=a!==void 0?e._$Co?.[a]:e._$Cl,s=J(t)?void 0:t._$litDirective$;return r?.constructor!==s&&(r?._$AO?.(!1),s===void 0?r=void 0:(r=new s(i),r._$AT(i,e,a)),a!==void 0?(e._$Co??=[])[a]=r:e._$Cl=r),r!==void 0&&(t=I(i,r._$AS(i,t.values),r,a)),t}var xt=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:a}=this._$AD,r=(t?.creationScope??j).importNode(e,!0);R.currentNode=r;let s=R.nextNode(),o=0,l=0,c=a[0];for(;c!==void 0;){if(o===c.index){let d;c.type===2?d=new X(s,s.nextSibling,this,t):c.type===1?d=new c.ctor(s,c.name,c.strings,this,t):c.type===6&&(d=new Ct(s,this,t)),this._$AV.push(d),c=a[++l]}o!==c?.index&&(s=R.nextNode(),o++)}return R.currentNode=j,r}p(t){let e=0;for(let a of this._$AV)a!==void 0&&(a.strings!==void 0?(a._$AI(t,a,e),e+=a.strings.length-2):a._$AI(t[e])),e++}},X=class i{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,a,r){this.type=2,this._$AH=u,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=a,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=I(this,t,e),J(t)?t===u||t==null||t===""?(this._$AH!==u&&this._$AR(),this._$AH=u):t!==this._$AH&&t!==U&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Pe(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==u&&J(this._$AH)?this._$AA.nextSibling.data=t:this.T(j.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:a}=t,r=typeof a=="number"?this._$AC(t):(a.el===void 0&&(a.el=Q.createElement(te(a.h,a.h[0]),this.options)),a);if(this._$AH?._$AD===r)this._$AH.p(e);else{let s=new xt(r,this),o=s.u(this.options);s.p(e),this.T(o),this._$AH=s}}_$AC(t){let e=Jt.get(t.strings);return e===void 0&&Jt.set(t.strings,e=new Q(t)),e}k(t){kt(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,a,r=0;for(let s of t)r===e.length?e.push(a=new i(this.O(K()),this.O(K()),this,this.options)):a=e[r],a._$AI(s),r++;r<e.length&&(this._$AR(a&&a._$AB.nextSibling,r),e.length=r)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let a=qt(t).nextSibling;qt(t).remove(),t=a}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},V=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,a,r,s){this.type=1,this._$AH=u,this._$AN=void 0,this.element=t,this.name=e,this._$AM=r,this.options=s,a.length>2||a[0]!==""||a[1]!==""?(this._$AH=Array(a.length-1).fill(new String),this.strings=a):this._$AH=u}_$AI(t,e=this,a,r){let s=this.strings,o=!1;if(s===void 0)t=I(this,t,e,0),o=!J(t)||t!==this._$AH&&t!==U,o&&(this._$AH=t);else{let l=t,c,d;for(t=s[0],c=0;c<s.length-1;c++)d=I(this,l[a+c],e,c),d===U&&(d=this._$AH[c]),o||=!J(d)||d!==this._$AH[c],d===u?t=u:t!==u&&(t+=(d??"")+s[c+1]),this._$AH[c]=d}o&&!r&&this.j(t)}j(t){t===u?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},wt=class extends V{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===u?void 0:t}},At=class extends V{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==u)}},St=class extends V{constructor(t,e,a,r,s){super(t,e,a,r,s),this.type=5}_$AI(t,e=this){if((t=I(this,t,e,0)??u)===U)return;let a=this._$AH,r=t===u&&a!==u||t.capture!==a.capture||t.once!==a.once||t.passive!==a.passive,s=t!==u&&(a===u||r);r&&this.element.removeEventListener(this.name,this,a),s&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},Ct=class{constructor(t,e,a){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=a}get _$AU(){return this._$AM._$AU}_$AI(t){I(this,t)}};var Ne=Et.litHtmlPolyfillSupport;Ne?.(Q,X),(Et.litHtmlVersions??=[]).push("3.3.3");var ee=(i,t,e)=>{let a=e?.renderBefore??t,r=a._$litPart$;if(r===void 0){let s=e?.renderBefore??null;a._$litPart$=r=new X(t.insertBefore(K(),s),s,void 0,e??{})}return r._$AI(i),r};var Mt=globalThis,N=class extends M{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=ee(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return U}};N._$litElement$=!0,N.finalized=!0,Mt.litElementHydrateSupport?.({LitElement:N});var Te=Mt.litElementPolyfillSupport;Te?.({LitElement:N});(Mt.litElementVersions??=[]).push("4.2.2");var ze="1.2.2",dt="pvpc-bono-social-card",ae=["var(--pvpc-bs-verde)","var(--pvpc-bs-amarillo)","var(--pvpc-bs-naranja)","var(--pvpc-bs-rojo)"],Oe={P1:3,P2:2,P3:0},et="#4269d0",Ht="#f4bd4a";function Nt(i,t){return Array.isArray(i)&&i.length===3&&i.every(e=>Number.isFinite(Number(e)))?`rgb(${i.map(Number).join(", ")})`:typeof i=="string"&&i.trim()?i.trim():t}var He=`conic-gradient(${["verde","amarillo","naranja","rojo"].map((i,t)=>`var(--pvpc-bs-${i}) ${t*25}% ${(t+1)*25}%`).join(", ")})`,re={min:"M1,3H23L12,22",max:"M1,21H23L12,2",min_hueco:"M12,22L1,3H23L12,22M12,17.5L19.5,5H4.5L12,17.5Z",max_hueco:"M12,2L1,21H23M12,6L19.53,19H4.47"},lt={es:{titulo:"Precio de la luz",anterior:"Factura periodo anterior",en_curso:"Factura periodo en curso",estimada_cierre:"Factura estimada",facturas:"Facturas",sin_facturas:"A\xFAn no hay facturas cerradas",calculada:"calculada",abrir:"Ver todo",cerrar:"Cerrar",factura_real:"Factura real",calculada_consumo:"Calculada con el consumo",real:"real",sin_precio:"Sin precios",no_disponible:"No disponible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"llano",P3:"valle"},sin_entidad:"No se encuentra el sensor de precio de PVPC + Bono Social"},en:{titulo:"Electricity price",anterior:"Previous bill",en_curso:"Current bill",estimada_cierre:"Estimated bill",facturas:"Bills",sin_facturas:"No closed bills yet",calculada:"calculated",abrir:"Show everything",cerrar:"Close",factura_real:"Actual bill",calculada_consumo:"Calculated from consumption",real:"actual",sin_precio:"No prices",no_disponible:"Unavailable",hora_actual:"Current hour",periodos:{P1:"peak",P2:"standard",P3:"off-peak"},sin_entidad:"PVPC + Bono Social price sensor not found"},ca:{titulo:"Preu de la llum",anterior:"Factura del per\xEDode anterior",en_curso:"Factura del per\xEDode en curs",estimada_cierre:"Factura estimada",facturas:"Factures",sin_facturas:"Encara no hi ha factures tancades",calculada:"calculada",abrir:"Veure-ho tot",cerrar:"Tanca",factura_real:"Factura real",calculada_consumo:"Calculada amb el consum",real:"real",sin_precio:"Sense preus",no_disponible:"No disponible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"pla",P3:"vall"},sin_entidad:"No es troba el sensor de preu de PVPC + Bono Social"},gl:{titulo:"Prezo da luz",anterior:"Factura do per\xEDodo anterior",en_curso:"Factura do per\xEDodo en curso",estimada_cierre:"Factura estimada",facturas:"Facturas",sin_facturas:"A\xEDnda non hai facturas pechadas",calculada:"calculada",abrir:"Ver todo",cerrar:"Pechar",factura_real:"Factura real",calculada_consumo:"Calculada co consumo",real:"real",sin_precio:"Sen prezos",no_disponible:"Non dispo\xF1ible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"chan",P3:"val"},sin_entidad:"Non se atopa o sensor de prezo de PVPC + Bono Social"},eu:{titulo:"Argindarraren prezioa",anterior:"Aurreko aldiko faktura",en_curso:"Aldi honetako faktura",estimada_cierre:"Zenbatetsitako faktura",facturas:"Fakturak",sin_facturas:"Oraindik ez dago itxitako fakturarik",calculada:"kalkulatua",abrir:"Ikusi dena",cerrar:"Itxi",factura_real:"Benetako faktura",calculada_consumo:"Kontsumoarekin kalkulatua",real:"benetakoa",sin_precio:"Preziorik ez",no_disponible:"Ez dago erabilgarri",hora_actual:"Uneko ordua",periodos:{P1:"punta",P2:"laua",P3:"harana"},sin_entidad:"Ez da aurkitu PVPC + Bono Social-en prezio-sentsorea"}},zt=["ca","gl","eu"],ht=480,Le=.95,Re=1.2;function ie(i,t,e){if(!i)return{ancho:ht,alto:t};let a=Math.min(Math.max(i/ht,Le),Re),r=Math.round(i/a),s=Math.round(t*r/ht),o=r>ht?Math.min(s,e):Math.max(s,Math.round(t*.8));return{ancho:r,alto:o}}function Tt(i,t){return Math.max(1,Math.ceil(t/i))}function ut(i,t=!1){let e=t?"price_next_day_":"price_",a=[];for(let r=0;r<24;r++){let s=String(r).padStart(2,"0"),o=i?.[`${e}${s}h`];typeof o=="number"&&a.push({hora:r,precio:o});let l=i?.[`${e}${s}h_d`];typeof l=="number"&&a.push({hora:r,precio:l})}return a}var se=new Map;function je(i){let t=i||"",e=se.get(t);if(!e){let a={hourCycle:"h23",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric"};try{e=new Intl.DateTimeFormat("en-US",i?{...a,timeZone:i}:a)}catch{e=new Intl.DateTimeFormat("en-US",a)}se.set(t,e)}return e}function at(i=new Date,t){let e={};for(let{type:s,value:o}of je(t).formatToParts(i))e[s]=Number(o);let a={anio:e.year,mes:e.month,dia:e.day,hora:e.hour%24,minuto:e.minute},r=Date.UTC(a.anio,a.mes-1,a.dia,a.hora,a.minuto);return a.desfase=Math.round((r-Math.floor(i.getTime()/6e4)*6e4)/6e4),a}function q(i){return i?.config?.time_zone||void 0}function oe(i=new Date,t,e=0){let a=at(i,t);return new Date(Date.UTC(a.anio,a.mes-1,a.dia+e)).toISOString().slice(0,10)}function ne(i=new Date,t){let e=at(i,t);return`${e.anio}-${e.mes}-${e.dia}-${e.hora}-${e.desfase}`}function Ue(i,t=new Date,e){let a=at(t,e).hora,r=i.findIndex(o=>o.hora===a);return at(new Date(t.getTime()-36e5),e).hora===a&&i[r+1]?.hora===a?r+1:r}function Ot(i){if(!i.length)return null;let t=0,e=0;return i.forEach((a,r)=>{a.precio<i[t].precio&&(t=r),a.precio>i[e].precio&&(e=r)}),{min:i[t],max:i[e]}}function ce(i){let t=Ot(i);if(!t)return[];let e=t.max.precio-t.min.precio;return i.map(a=>e?Math.min(3,Math.floor((a.precio-t.min.precio)/e*4)):0)}function E(i,t,e=()=>!0){return Object.keys(i?.states||{}).filter(a=>a.startsWith(t)&&e(i.states[a])).sort()[0]}function pt(i){return i?.states["sensor.pvpc_bs_precio"]?"sensor.pvpc_bs_precio":E(i,"sensor.",t=>"price_00h"in(t.attributes||{})&&String(t.attributes.attribution||"").includes("REE"))}var De={current:!0,details:!0,graph:!0,next_day:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,icon_color:"price",colores:"fijo",color_hoy:et,color_manana:Ht,bandas:!0,grafica_facturas:!1,facturas_meses:"6",facturas_importe:!0,ventana:!0};function ue(i){let t={};for(let[e,a]of[["show_current","current"],["show_details","details"],["show_graph","graph"]])typeof i[e]=="boolean"&&!(a in i)&&(t[a]=i[e]);return typeof i.show_only_today=="boolean"&&!("next_day"in i)&&(t.next_day=!i.show_only_today),{...De,...t,...i}}var Y=class extends N{constructor(){super(...arguments);B(this,"_id",Math.random().toString(36).slice(2,8))}static async getConfigElement(){return await Ie(),document.createElement(de)}static getStubConfig(e){return{entity:pt(e)||"sensor.pvpc_bs_precio",entity_factura_actual:E(e,"sensor.pvpc_bs_factura_actual")||"sensor.pvpc_bs_factura_actual",entity_factura_anterior:E(e,"sensor.pvpc_bs_factura_anterior")||"sensor.pvpc_bs_factura_anterior",current:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,grafica_facturas:!0,facturas_meses:"6",facturas_importe:!0,ventana:!0,details:!0,next_day:!0,graph:!0,bandas:!0,colores:"fijo",grid_options:{columns:"full",rows:"auto"}}}setConfig(e){if(!e)throw new Error("Configuraci\xF3n no v\xE1lida");this._config=ue(e)}getCardSize(){return this._config?.graph===!1?3:7}getGridOptions(){return{columns:"full",rows:"auto",min_columns:6,min_rows:3}}get _cHoy(){return Nt(this._config.color_hoy,et)}get _cManana(){return Nt(this._config.color_manana,Ht)}get _t(){let e=(this.hass?.locale?.language||this.hass?.language||"es").slice(0,2);return zt.includes(e)?{...lt.es,...lt[e]}:lt[e]||lt.en}get _idiomas(){let e=this.hass?.locale?.language||this.hass?.language||"es";return zt.includes(e.slice(0,2))?[e,"es"]:e}_num(e,a=3){return new Intl.NumberFormat(this._idiomas,{minimumFractionDigits:a,maximumFractionDigits:a}).format(e)}_entidadesVigiladas(e){let a=this._config;return[a.entity||pt(e),a.entity_injection,"sensor.pvpc_bs_periodo",a.entity_factura_anterior||E(e,"sensor.pvpc_bs_factura_anterior"),a.entity_factura_actual||E(e,"sensor.pvpc_bs_factura_actual")].filter(Boolean)}shouldUpdate(e){if(!e.has("hass")||e.size>1||!this._config)return!0;let a=e.get("hass"),r=this.hass;if(!a||!r||a.locale!==r.locale||a.language!==r.language||a.themes!==r.themes)return!0;let s=new Set([...this._entidadesVigiladas(a),...this._entidadesVigiladas(r)]);for(let o of s)if(a.states[o]!==r.states[o])return!0;return this._horaPintada!==ne(new Date,q(r))}_programarCambioDeHora(){clearTimeout(this._temporizadorHora);let e=Date.now(),r=(60-at(new Date(e),q(this.hass)).minuto)*6e4-e%6e4+1e3;this._temporizadorHora=setTimeout(()=>{this.requestUpdate(),this._programarCambioDeHora()},r)}render(){if(!this._config||!this.hass)return u;let e=q(this.hass),a=new Date;this._horaPintada=ne(a,e);let r=this._t,s=this._config.entity||pt(this.hass),o=s&&this.hass.states[s];if(!o)return g`<ha-card><div class="aviso">${r.sin_entidad}</div></ha-card>`;let l=o.attributes||{},c=ut(l),d=this._config.next_day?ut(l,!0):[],h=Array.isArray(l.colores_hoy)&&l.colores_hoy.length===c.length?l.colores_hoy:ce(c),n=Array.isArray(l.colores_manana)&&l.colores_manana.length===d.length?l.colores_manana:ce(d),_=Ue(c,a,e),$=this._config.entity_injection&&this.hass.states[this._config.entity_injection],f=$?{hoy:ut($.attributes),manana:this._config.next_day?ut($.attributes,!0):[]}:null,S=this._config.bandas!==!1&&Array.isArray(l.periodos_hoy)&&l.periodos_hoy.length===c.length&&l.periodos_hoy.some(O=>O!=="P3")?l.periodos_hoy:null,T=Number(o.state),b=this._factura(),A=this._config.factura;return g`
      <ha-card>
        <div class="contenedor">
          ${this._config.current?g`<div class="cabecera">
                ${this._conVentana?g`<button class="abrir" aria-label=${r.abrir} @click=${()=>this._abrirVentana()}>
                      ${this._icono(_>=0?h[_]:void 0)}
                    </button>`:this._icono(_>=0?h[_]:void 0)}
                <div class="nombre">${this._config.title||""}</div>
                <div class="actual">
                  <div class="precio">
                    ${Number.isFinite(T)?this._precioGrande(T):"\u2014"}
                    <span class="unidad"><span class="euro">€</span>/kWh</span>
                  </div>
                  ${$&&Number.isFinite(Number($.state))?g`<div class="precio-iny">${this._num(Number($.state),5)} €/kWh</div>`:u}
                  ${A==="header"&&b?g`<div class="factura arriba">${b}</div>`:u}
                </div>
              </div>`:u}
          ${this._config.details?this._detalles(c,d,f):u}
          ${this._config.graph?this._grafica(c,d,h,n,_,S,f):u}
          ${b&&(A==="below_chart"||A==="header"&&!this._config.current)?g`<div class="factura abajo">${b}</div>`:u}
          ${b&&A==="header"&&this._config.current?g`<div class="factura abajo estrecha">${b}</div>`:u}
          ${this._config.grafica_facturas?this._graficaFacturas():u}
        </div>
      </ha-card>
      ${this._ventana?this._dialogo():u}
    `}get _conVentana(){return this._config.ventana!==!1&&!this.enVentana}set configVentana(e){this.enVentana=!0,this.toggleAttribute("en-ventana",!0),this.setConfig(e)}_abrirVentana(){this._conVentana&&(this._ventana=!0)}_cerrarVentana(){this.renderRoot.querySelector("dialog.ventana")?.close()}_dialogo(){let e={...this._config,current:!0,details:!0,graph:!0,next_day:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,grafica_facturas:!0,ventana:!1};return g`<dialog
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
    </dialog>`}_precioGrande(e){let a=this._num(e,5);return g`${a.slice(0,-2)}<span class="cola">${a.slice(-2)}</span>`}_icono(e){let a=e;if(this._config.icon_color==="period"){let o=this.hass.states["sensor.pvpc_bs_periodo"]?.state;a=Oe[o]}let r=this._config.icon_color==="fijo"||a===void 0?et:ae[a],s=`pvpc-bs-hueco-${this._id}`;return g`<svg class="icono" viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <mask id=${s}>
          <rect width="512" height="512" fill="#fff"></rect>
          <circle cx="256" cy="424" r="74" fill="#000"></circle>
        </mask>
      </defs>
      <g mask="url(#${s})" fill="none" stroke-linecap="round" stroke-linejoin="round">
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
    </svg>`}_hora(e){return`${String(e).padStart(2,"0")}:00`}_fecha(e=0){let a=new Date(`${oe(new Date,q(this.hass),e)}T12:00:00Z`);return new Intl.DateTimeFormat(this._idiomas,{timeZone:"UTC"}).format(a)}_triangulo(e,a){return g`<svg class="tri" viewBox="0 0 24 24" aria-hidden="true"><path d=${re[e]} fill=${a}></path></svg>`}_detalles(e,a,r){let s=this._t,o=(d,h,n)=>g`<div class="detalle">
        ${this._triangulo(d,h)}
        <div>
          ${n?g`<div class="valor">${this._num(n.precio,5)} €/kWh</div>
                <div class="horas">${this._hora(n.hora)} - ${this._hora(n.hora+1)}</div>`:g`<div class="valor">${s.no_disponible}</div>`}
        </div>
      </div>`,l=(d,h,n="")=>{let _=Ot(d);return g`<div class="columna">${o(`min${n}`,h,_?.min)}${o(`max${n}`,h,_?.max)}</div>`},c=(d,h,n)=>g`<div class="detalles">
        ${l(d,this._cHoy,n)}${h.length?l(h,this._cManana,n):u}
      </div>`;return g`${c(e,a)}${r?c(r.hoy,r.manana,"_hueco"):u}`}_factura(){let e=this._t;if(this._config.factura==="hidden")return null;let a=[],r=this._config.entity_factura_anterior||E(this.hass,"sensor.pvpc_bs_factura_anterior"),s=this._config.entity_factura_actual||E(this.hass,"sensor.pvpc_bs_factura_actual"),o=n=>typeof n=="string"?`${n.slice(8,10)}/${n.slice(5,7)}`:"",l=(n,_)=>n&&_?` (${o(n)} - ${o(_)})`:"",c=(n,_,$,f=u)=>g`<div>${n}<span class="sin-corte">${_}</span>: <b class="sin-corte">${this._num($,2)} €</b>${f}</div>`,d=r&&this.hass.states[r];if(this._config.factura_anterior&&d&&Number.isFinite(Number(d.state))){let n=d.attributes||{};a.push(c(e.anterior,l(n.inicio,n.fin),Number(d.state)))}let h=s&&this.hass.states[s];if(this._config.factura_actual&&h&&Number.isFinite(Number(h.state))){let n=h.attributes||{},_=oe(new Date,q(this.hass));typeof n.acumulado=="number"&&a.push(c(e.en_curso,l(n.inicio,_),n.acumulado)),this._config.prevision!==!1&&a.push(c(e.estimada_cierre,l(n.inicio,n.fin_previsto),Number(h.state)))}return a.length?a:null}_grafica(e,a,r,s,o,l,c){let d=this._t;if(!e.length)return g`<div class="aviso">${d.sin_precio}</div>`;let h=this._cHoy,n=this._cManana,{ancho:_,alto:$}=ie(this._anchoUtil,190,300),f={izq:38,der:16,arr:24,aba:24},S=[{puntos:e,color:h},{puntos:a,color:n},...c?[{puntos:c.hoy,color:h,punteada:!0},{puntos:c.manana,color:n,punteada:!0}]:[]].filter(p=>p.puntos.length),T=S.flatMap(p=>p.puntos.map(x=>x.precio)),b=Math.min(0,...T),A=Math.max(...T);A-b<.01&&(A=b+.01);let O=(A-b)*.08;b-=Math.min(0,...T)<0?O:0,A+=O;let D=Math.max(e.length,a.length,24),k=(_-f.izq-f.der)/D,C=p=>f.izq+k*p,F=p=>C(p)+k/2,m=p=>f.arr+($-f.arr-f.aba)*(1-(p-b)/(A-b)),P=p=>p.map((x,v)=>`${v?"V":`M${C(0).toFixed(1)},`}${m(x.precio).toFixed(1)}H${C(v+1).toFixed(1)}`).join(""),H=(p,x,v)=>w`<line class="tramo" x1=${C(v)} x2=${C(v+1)} y1=${m(p[v].precio)} y2=${m(p[v].precio)}
        stroke=${ae[x[v]??0]}></line>`,rt=(p,x,v)=>{let it=Ot(p),me=p.indexOf(it[v]),ge=m(it[v].precio)+(v==="max"?-11:4);return w`<svg class="marca" x=${F(me)-4.5} y=${ge} width="9" height="9" viewBox="0 0 24 24">
        <path d=${re[v]} fill=${x}></path></svg>`},_t=(A-b)/4,fe=[0,1,2,3,4].map(p=>b+_t*p),y=this._cursor,Lt=(p,x,v,it)=>w`<circle class=${it} cx=${F(v)} cy=${m(p[v].precio)} r="3" fill=${x}></circle>`,mt=this._config.colores==="precio",_e=Tt(k*3,28),Rt=this._config.titulo_grafica??"PVPC";return g`
      <div class="grafica">
        ${Rt?g`<div class="titulo-seccion">${Rt}</div>`:u}
        <svg
          viewBox="0 0 ${_} ${$}"
          role="img"
          aria-label=${d.titulo}
          @pointermove=${p=>this._mover(p,_,f,D)}
          @pointerleave=${()=>this._cursor=void 0}
        >
          <text class="eje" x=${f.izq-4} y=${f.arr-12} text-anchor="end">€/kWh</text>
          ${l?l.map((p,x)=>p==="P3"?u:w`<rect class=${p==="P1"?"banda-punta":"banda-llano"} x=${C(x)}
                      y=${f.arr} width=${k} height=${$-f.arr-f.aba}></rect>`):u}
          ${o>=0?w`<rect class="ahora" x=${C(o)} y=${f.arr} width=${k} height=${$-f.arr-f.aba}></rect>`:u}
          ${fe.map(p=>w`<line class="rejilla" x1=${f.izq} x2=${_-f.der} y1=${m(p)} y2=${m(p)}></line>
              <text class="eje" x=${f.izq-4} y=${m(p)+3} text-anchor="end">${this._num(Math.abs(p)<.005?0:p,2)}</text>`)}
          ${[0,3,6,9,12,15,18,21,24].map((p,x)=>w`<line class="rejilla" x1=${C(p)} x2=${C(p)} y1=${f.arr} y2=${$-f.aba}></line>
              ${x%_e?u:w`<text class="eje" x=${C(p)} y=${$-8} text-anchor="middle">${this._hora(p)}</text>`}`)}
          ${S.map(p=>w`<path class="serie ${p.punteada?"punteada":""}" d=${P(p.puntos)}
                stroke=${mt&&p.puntos===e?"var(--secondary-text-color)":p.color}></path>`)}
          ${mt?e.map((p,x)=>H(e,r,x)):u}
          ${S.flatMap(p=>[rt(p.puntos,p.color,"max"),rt(p.puntos,p.color,"min")])}
          ${y!==void 0?w`<line class="cursor" x1=${F(y)} x2=${F(y)} y1=${f.arr} y2=${$-f.aba}></line>`:u}
          ${y!==void 0&&y<e.length?Lt(e,h,y,"p-hoy"):u}
          ${y!==void 0&&y<a.length?Lt(a,n,y,"p-manana"):u}
        </svg>
        <div class="leyenda">
          ${y!==void 0?g`<span
                  ><b>${this._hora((e[y]??a[y])?.hora??y)} - ${this._hora(((e[y]??a[y])?.hora??y)+1)}</b>${l?.[y]?g` · ${d.periodos[l[y]]}`:u}</span
                >
                ${e[y]?g`<span><i class="bolita" style="background:${h}"></i>${this._num(e[y].precio,5)}</span>`:u}
                ${a[y]?g`<span><i class="bolita" style="background:${n}"></i>${this._num(a[y].precio,5)}</span>`:u}`:g`<span
                  ><i class="bolita" style="background:${mt?He:h}"></i>${this._fecha(0)}</span
                >${a.length?g`<span><i class="bolita" style="background:${n}"></i>${this._fecha(1)}</span>`:u}${o>=0?g`<span class="l-ahora">${d.hora_actual}</span>`:u}${l?g`<span class="l-punta">${d.periodos.P1}</span><span class="l-llano">${d.periodos.P2}</span>`:u}`}
        </div>
      </div>
    `}connectedCallback(){super.connectedCallback(),this._observador??=new ResizeObserver(()=>{this._medirAncho(),this._alinearFactura()}),this._observador.observe(this),this._programarCambioDeHora()}disconnectedCallback(){super.disconnectedCallback(),this._observador?.disconnect(),clearTimeout(this._temporizadorHora)}_medirAncho(){let e=this.renderRoot?.querySelector(".contenedor");if(!e?.clientWidth)return;let a=e.clientWidth-32;Math.abs(a-(this._anchoUtil??0))>=2&&(this._anchoUtil=a)}_alinearFactura(){let e=this.renderRoot?.querySelector(".cabecera .actual");if(!e)return;let a=e.querySelector(".precio"),r=[...e.querySelectorAll(".precio-iny, .factura.arriba")];for(let n of[a,...r])n&&(n.style.marginRight="");let s=this.renderRoot.querySelectorAll(".detalles .columna"),o=this.renderRoot.querySelector(".cabecera .icono");if(s.length<2||!e.offsetParent)return;let l=Math.max(...[...s[1].querySelectorAll(".valor, .horas")].map(n=>n.getBoundingClientRect().right));if(!Number.isFinite(l))return;let c=n=>o?n.getBoundingClientRect().left-o.getBoundingClientRect().right-12:1/0,d=(n,_)=>{let $=Math.min(_,c(n));$>0&&(n.style.marginRight=`${$}px`)},h=a?.querySelector(".euro");h&&d(a,h.getBoundingClientRect().right-l);for(let n of r)d(n,n.getBoundingClientRect().right-l)}updated(e){if(super.updated?.(e),this._medirAncho(),this._alinearFactura(),e.has("_ventana")&&this._ventana){let s=this.renderRoot.querySelector("dialog.ventana");s&&!s.open&&s.showModal()}if(!this.hass||!this._config?.grafica_facturas||this._cargandoFacturas||this._facturasDelSensor())return;let a=`${this._config.estadistica_facturas||""}|${this._config.facturas_meses}`;(!this._facturasHora||Date.now()-this._facturasHora>3*3600*1e3||a!==this._facturasClave)&&this._cargarFacturas(a)}_facturasDelSensor(){if(this._config.estadistica_facturas)return null;let e=this._config.entity_factura_actual||E(this.hass,"sensor.pvpc_bs_factura_actual"),a=this.hass?.states[e]?.attributes?.facturas;if(!Array.isArray(a))return null;let r=Math.max(1,Number(this._config.facturas_meses)||6);return a.filter(s=>Number.isFinite(Number(s.total))&&s.inicio).map(s=>{let[o,l,c]=String(s.inicio).split("-").map(Number);return{inicio:new Date(Date.UTC(o,l-1,c+1,12)),total:Number(s.total),real:s.real!==!1}}).slice(-r)}async _cargarFacturas(e){this._cargandoFacturas=!0,this._facturasClave=e,this._facturasHora=Date.now();try{let a=this._config.estadistica_facturas;if(a||(a=(await this.hass.callWS({type:"recorder/list_statistic_ids",statistic_type:"mean"})).map(c=>c.statistic_id).find(c=>c.startsWith("pvpc_bonosocial:facturas_"))),!a){this._facturas=[];return}let r=Math.max(1,Number(this._config.facturas_meses)||6),s=new Date(Date.now()-(r+2)*35*86400*1e3),o=await this.hass.callWS({type:"recorder/statistics_during_period",start_time:s.toISOString(),statistic_ids:[a],period:"hour",types:["max"]});this._facturas=(o[a]||[]).filter(l=>Number.isFinite(Number(l.max))).map(l=>({inicio:new Date(l.start),total:Number(l.max),real:!0})).slice(-r)}catch(a){console.warn("pvpc-bono-social-card: no se pudieron leer las facturas",a),this._facturas=[]}finally{this._cargandoFacturas=!1}}_graficaFacturas(){let e=this._t,a=this._facturasDelSensor()??this._facturas,r=this._config.titulo_facturas??e.facturas,s=r?g`<div class="titulo-seccion">${r}</div>`:u;if(!a)return u;if(!a.length)return g`<div class="facturas">${s}<div class="aviso">${e.sin_facturas}</div></div>`;let o=Nt(this._config.color_facturas,this._cHoy),l=this._config.facturas_importe!==!1,{ancho:c,alto:d}=ie(this._anchoUtil,150,220),h={izq:8,der:8,arr:l?18:6,aba:20},n=Math.max(...a.map(m=>m.total),1),_=(c-h.izq-h.der)/a.length,$=Math.min(_*.6,56),f=a.length-1,S=Math.max(...a.map(m=>this._num(m.total,2).length+2)),T=Tt(_,S*6.2),b=m=>h.arr+(d-h.arr-h.aba)*(1-Math.max(m,0)/n),A=this._idiomas,O=q(this.hass),D;try{D=new Intl.DateTimeFormat(A,{month:"short",year:"2-digit",...O?{timeZone:O}:{}})}catch{D=new Intl.DateTimeFormat(A,{month:"short",year:"2-digit"})}let k={format:m=>{let P=D.formatToParts(m),H=rt=>P.find(_t=>_t.type===rt)?.value??"";return`${H("month")} ${H("year")}`}},C=Math.max(...a.map(m=>k.format(m.inicio).length)),F=Tt(_,C*5.2);return g`
      <div class="facturas">
        ${s}
        <svg viewBox="0 0 ${c} ${d}" role="img" aria-label=${r||e.facturas}>
          <line class="rejilla" x1=${h.izq} x2=${c-h.der} y1=${d-h.aba} y2=${d-h.aba}></line>
          ${a.map((m,P)=>{let H=h.izq+_*(P+.5);return w`<rect class="barra ${m.real?"real":"calculada"}" x=${H-$/2+(m.real?0:1)}
                y=${b(m.total)+(m.real?0:1)} width=${$-(m.real?0:2)}
                height=${Math.max(d-h.aba-b(m.total)-(m.real?0:1),0)} rx="3"
                fill=${m.real?o:"none"} stroke=${o}>
                <title>${k.format(m.inicio)}: ${this._num(m.total,2)} € (${m.real?e.real:e.calculada})</title></rect>
              ${(f-P)%F?u:w`<text class="eje" x=${H} y=${d-6} text-anchor="middle">${k.format(m.inicio)}</text>`}`})}
          ${this._config.facturas_tendencia&&a.length>1?this._tendencia(a,_,h,b):u}
          ${l?a.map((m,P)=>(f-P)%T?u:w`<text class="importe" x=${h.izq+_*(P+.5)} y=${b(m.total)-5}
                    text-anchor="middle">${this._num(m.total,2)} €</text>`):u}
        </svg>
        ${a.some(m=>!m.real)?g`<div class="leyenda">
              ${a.some(m=>m.real)?g`<span><i class="bolita cuadro" style="background:${o}"></i>${e.factura_real}</span>`:u}
              <span><i class="bolita cuadro" style="border:2px solid ${o}"></i>${e.calculada_consumo}</span>
            </div>`:u}
      </div>
    `}_tendencia(e,a,r,s){let o=e.length,l=(o-1)/2,c=e.reduce((f,S)=>f+S.total,0)/o,d=0,h=0;e.forEach((f,S)=>{d+=(S-l)*(f.total-c),h+=(S-l)**2});let n=d/h,_=f=>c+n*(f-l),$=f=>r.izq+a*(f+.5);return w`<line class="tendencia" x1=${$(0)} y1=${s(_(0))} x2=${$(o-1)} y2=${s(_(o-1))}></line>`}_mover(e,a,r,s){let o=e.currentTarget.getBoundingClientRect(),l=(e.clientX-o.left)/o.width*a,c=Math.floor((l-r.izq)/(a-r.izq-r.der)*s);this._cursor=c>=0&&c<s?c:void 0}};B(Y,"properties",{hass:{attribute:!1},_config:{state:!0},_cursor:{state:!0},_facturas:{state:!0},_ventana:{state:!0},_anchoUtil:{state:!0}}),B(Y,"styles",$t`
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
    .sin-corte {
      white-space: nowrap;
    }
    .precio {
      white-space: nowrap;
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
    /* El mínimo que anuncia la tarjeta (6 columnas): dos columnas de precios tienen que caber. */
    @container (max-width: 250px) {
      .precio {
        font-size: 1.4em;
      }
      .detalles {
        column-gap: 6px;
      }
      .detalle {
        gap: 3px;
      }
      .tri {
        width: 14px;
        height: 14px;
      }
      .detalle .valor {
        font-size: 0.78em;
      }
      .detalle .horas {
        font-size: 0.72em;
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
      stroke-width: 2.5;
    }
    .serie.punteada {
      stroke-width: 1.5;
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
  `);var de=`${dt}-editor`;function pe(i,t){let[e,a]=i.split(" / ");return["es",...zt].includes(t)?e:a??e}function Fe(i){let t=a=>({select:{mode:"dropdown",options:a.map(([r,s])=>({value:r,label:pe(s,i)}))}}),e=(...a)=>a.map(r=>({name:r,selector:{boolean:{}}}));return[{name:"entity",selector:{entity:{domain:"sensor"}}},{name:"title",selector:{text:{}}},{name:"factura",selector:t([["below_chart","Bajo la gr\xE1fica / Below the chart"],["header","Arriba / In the header"],["hidden","Oculta / Hidden"]])},{type:"grid",name:"",schema:e("factura_actual","factura_anterior","prevision","current","details","graph","next_day","ventana")},{name:"colores",selector:t([["fijo","Un color por d\xEDa / One colour per day"],["precio","Hoy por precio / Today by price"]])},{type:"grid",name:"",schema:[{name:"color_hoy",selector:{color_rgb:{}}},{name:"color_manana",selector:{color_rgb:{}}},...e("bandas")]},{name:"entity_injection",selector:{entity:{domain:"sensor"}}},{name:"icon_color",selector:t([["price","Por precio / By price"],["period","Por periodo P1-P3 / By period"],["fijo","Azul fijo / Fixed blue"]])},{type:"grid",name:"",schema:[...e("grafica_facturas","facturas_importe","facturas_tendencia"),{name:"facturas_meses",selector:t(["3","5","6","9","12"].map(a=>[a,a]))},{name:"color_facturas",selector:{color_rgb:{}}}]},{name:"titulo_grafica",selector:{text:{}}},{name:"titulo_facturas",selector:{text:{}}},{name:"entity_factura_actual",selector:{entity:{domain:"sensor"}}},{name:"entity_factura_anterior",selector:{entity:{domain:"sensor"}}}]}function tt(i,t){if(Array.isArray(i)&&i.length===3)return i.map(Number);let e=typeof i=="string"?i.trim():"",a=/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(e)?.[1];if(a){let s=a.length===3?[...a].map(o=>o+o).join(""):a;return[0,2,4].map(o=>parseInt(s.slice(o,o+2),16))}let r=/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(e);if(r)return r.slice(1,4).map(Number);if(e){let s=document.createElement("canvas").getContext("2d");if(s.fillStyle="#000000",s.fillStyle=e,s.fillStyle!=="#000000"||e.toLowerCase()==="black")return tt(s.fillStyle)}return t===void 0?[0,0,0]:tt(t)}function le(i,t){let e=ue(i);return{...e,entity:e.entity||pt(t),entity_factura_actual:e.entity_factura_actual||E(t,"sensor.pvpc_bs_factura_actual"),entity_factura_anterior:e.entity_factura_anterior||E(t,"sensor.pvpc_bs_factura_anterior"),color_hoy:tt(e.color_hoy,et),color_manana:tt(e.color_manana,Ht),color_facturas:tt(e.color_facturas??e.color_hoy,et),facturas_meses:String(e.facturas_meses),grafica_facturas:!!e.grafica_facturas}}async function Ie(){if(!customElements.get("ha-form"))try{await(await(await window.loadCardHelpers?.())?.createCardElement({type:"entities",entities:[]}))?.constructor?.getConfigElement?.()}catch(i){console.warn("pvpc-bono-social-card: no se pudo cargar el editor",i)}}var ft=class extends N{setConfig(t){this._config=t}get _idioma(){return(this.hass?.locale?.language||this.hass?.language||"es").slice(0,2)}render(){return!this._config||!this.hass?u:g`<ha-form
      .hass=${this.hass}
      .data=${le(this._config,this.hass)}
      .schema=${Fe(this._idioma)}
      .computeLabel=${t=>he[t.name]?pe(he[t.name],this._idioma):t.name}
      @value-changed=${this._alCambiar}
    ></ha-form>`}_alCambiar(t){t.stopPropagation();let e=t.detail.value,a=le(this._config,this.hass),r={...this._config};for(let s of new Set([...Object.keys(e),...Object.keys(a)]))JSON.stringify(e[s])!==JSON.stringify(a[s])&&(e[s]===void 0?delete r[s]:r[s]=e[s]);this._config=r,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:r},bubbles:!0,composed:!0}))}};B(ft,"properties",{hass:{attribute:!1},_config:{state:!0}});var he={entity:"Sensor de precio / Price sensor",title:"T\xEDtulo / Title",factura:"Factura / Bill",factura_actual:"Factura en curso / Current bill",factura_anterior:"Factura anterior / Previous bill",prevision:"Factura estimada al cierre / Estimated bill",current:"Precio actual / Current price",details:"M\xEDnimos y m\xE1ximos / Min and max",graph:"Gr\xE1fica / Chart",ventana:"Ventana con todo al pulsar el icono / Full view on icon tap",next_day:"Ma\xF1ana / Tomorrow",icon_color:"Color del icono / Icon colour",colores:"Colores de la gr\xE1fica / Chart colours",color_hoy:"Color de hoy / Today's colour",color_manana:"Color de ma\xF1ana / Tomorrow's colour",bandas:"Punta y llano sombreados / Shade peak hours",entity_injection:"Sensor de precio de excedentes (opcional) / Injection price sensor (optional)",grafica_facturas:"Gr\xE1fica de facturas / Bills chart",facturas_importe:"Importe sobre cada barra / Amount above bars",facturas_tendencia:"L\xEDnea de tendencia / Trend line",facturas_meses:"Cu\xE1ntas facturas / How many bills",color_facturas:"Color de las barras / Bar colour",titulo_grafica:"T\xEDtulo de la gr\xE1fica de precios / Price chart title",titulo_facturas:"T\xEDtulo de la gr\xE1fica de facturas / Bills chart title",entity_factura_actual:"Sensor de factura en curso / Current bill sensor",entity_factura_anterior:"Sensor de factura anterior / Previous bill sensor"};customElements.get(dt)||(customElements.define(dt,Y),customElements.define(de,ft),window.customCards=window.customCards||[],window.customCards.push({type:dt,name:"PVPC + Bono Social",description:"Precio del PVPC de hoy y ma\xF1ana y la factura con o sin bono social.",preview:!0,documentationURL:"https://github.com/BaRDaHL/pvpc_bonosocial"}),console.info(`%c PVPC + Bono Social %c ${ze} `,"background:#43a047;color:#fff",""));
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
