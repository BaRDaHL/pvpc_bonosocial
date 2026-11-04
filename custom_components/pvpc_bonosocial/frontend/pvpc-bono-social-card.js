var ne=Object.defineProperty;var ce=(i,e,t)=>e in i?ne(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t;var Y=(i,e,t)=>ce(i,typeof e!="symbol"?e+"":e,t);var tt=globalThis,et=tt.ShadowRoot&&(tt.ShadyCSS===void 0||tt.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,nt=Symbol(),Pt=new WeakMap,F=class{constructor(e,t,a){if(this._$cssResult$=!0,a!==nt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(et&&e===void 0){let a=t!==void 0&&t.length===1;a&&(e=Pt.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),a&&Pt.set(t,e))}return e}toString(){return this.cssText}},Mt=i=>new F(typeof i=="string"?i:i+"",void 0,nt),ct=(i,...e)=>{let t=i.length===1?i[0]:e.reduce((a,r,o)=>a+(s=>{if(s._$cssResult$===!0)return s.cssText;if(typeof s=="number")return s;throw Error("Value passed to 'css' function must be a 'css' function result: "+s+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+i[o+1],i[0]);return new F(t,i,nt)},Tt=(i,e)=>{if(et)i.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let a=document.createElement("style"),r=tt.litNonce;r!==void 0&&a.setAttribute("nonce",r),a.textContent=t.cssText,i.appendChild(a)}},lt=et?i=>i:i=>i instanceof CSSStyleSheet?(e=>{let t="";for(let a of e.cssRules)t+=a.cssText;return Mt(t)})(i):i;var{is:le,defineProperty:he,getOwnPropertyDescriptor:de,getOwnPropertyNames:ue,getOwnPropertySymbols:pe,getPrototypeOf:fe}=Object,at=globalThis,Nt=at.trustedTypes,_e=Nt?Nt.emptyScript:"",me=at.reactiveElementPolyfillSupport,V=(i,e)=>i,ht={toAttribute(i,e){switch(e){case Boolean:i=i?_e:null;break;case Object:case Array:i=i==null?i:JSON.stringify(i)}return i},fromAttribute(i,e){let t=i;switch(e){case Boolean:t=i!==null;break;case Number:t=i===null?null:Number(i);break;case Object:case Array:try{t=JSON.parse(i)}catch{t=null}}return t}},zt=(i,e)=>!le(i,e),Ht={attribute:!0,type:String,converter:ht,reflect:!1,useDefault:!1,hasChanged:zt};Symbol.metadata??=Symbol("metadata"),at.litPropertyMetadata??=new WeakMap;var E=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Ht){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let a=Symbol(),r=this.getPropertyDescriptor(e,a,t);r!==void 0&&he(this.prototype,e,r)}}static getPropertyDescriptor(e,t,a){let{get:r,set:o}=de(this.prototype,e)??{get(){return this[t]},set(s){this[t]=s}};return{get:r,set(s){let l=r?.call(this);o?.call(this,s),this.requestUpdate(e,l,a)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Ht}static _$Ei(){if(this.hasOwnProperty(V("elementProperties")))return;let e=fe(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(V("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(V("properties"))){let t=this.properties,a=[...ue(t),...pe(t)];for(let r of a)this.createProperty(r,t[r])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[a,r]of t)this.elementProperties.set(a,r)}this._$Eh=new Map;for(let[t,a]of this.elementProperties){let r=this._$Eu(t,a);r!==void 0&&this._$Eh.set(r,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let a=new Set(e.flat(1/0).reverse());for(let r of a)t.unshift(lt(r))}else e!==void 0&&t.push(lt(e));return t}static _$Eu(e,t){let a=t.attribute;return a===!1?void 0:typeof a=="string"?a:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let a of t.keys())this.hasOwnProperty(a)&&(e.set(a,this[a]),delete this[a]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Tt(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,a){this._$AK(e,a)}_$ET(e,t){let a=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,a);if(r!==void 0&&a.reflect===!0){let o=(a.converter?.toAttribute!==void 0?a.converter:ht).toAttribute(t,a.type);this._$Em=e,o==null?this.removeAttribute(r):this.setAttribute(r,o),this._$Em=null}}_$AK(e,t){let a=this.constructor,r=a._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let o=a.getPropertyOptions(r),s=typeof o.converter=="function"?{fromAttribute:o.converter}:o.converter?.fromAttribute!==void 0?o.converter:ht;this._$Em=r;let l=s.fromAttribute(t,o.type);this[r]=l??this._$Ej?.get(r)??l,this._$Em=null}}requestUpdate(e,t,a,r=!1,o){if(e!==void 0){let s=this.constructor;if(r===!1&&(o=this[e]),a??=s.getPropertyOptions(e),!((a.hasChanged??zt)(o,t)||a.useDefault&&a.reflect&&o===this._$Ej?.get(e)&&!this.hasAttribute(s._$Eu(e,a))))return;this.C(e,t,a)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:a,reflect:r,wrapped:o},s){a&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,s??t??this[e]),o!==!0||s!==void 0)||(this._$AL.has(e)||(this.hasUpdated||a||(t=void 0),this._$AL.set(e,t)),r===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[r,o]of this._$Ep)this[r]=o;this._$Ep=void 0}let a=this.constructor.elementProperties;if(a.size>0)for(let[r,o]of a){let{wrapped:s}=o,l=this[r];s!==!0||this._$AL.has(r)||l===void 0||this.C(r,void 0,o,l)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(a=>a.hostUpdate?.()),this.update(t)):this._$EM()}catch(a){throw e=!1,this._$EM(),a}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};E.elementStyles=[],E.shadowRootOptions={mode:"open"},E[V("elementProperties")]=new Map,E[V("finalized")]=new Map,me?.({ReactiveElement:E}),(at.reactiveElementVersions??=[]).push("2.1.2");var gt=globalThis,Ot=i=>i,rt=gt.trustedTypes,Lt=rt?rt.createPolicy("lit-html",{createHTML:i=>i}):void 0,Vt="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,Bt="?"+M,ge=`<${Bt}>`,O=document,I=()=>O.createComment(""),q=i=>i===null||typeof i!="object"&&typeof i!="function",$t=Array.isArray,$e=i=>$t(i)||typeof i?.[Symbol.iterator]=="function",dt=`[ 	
\f\r]`,B=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Rt=/-->/g,jt=/>/g,H=RegExp(`>|${dt}(?:([^\\s"'>=/]+)(${dt}*=${dt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ut=/'/g,Dt=/"/g,It=/^(?:script|style|textarea|title)$/i,bt=i=>(e,...t)=>({_$litType$:i,strings:e,values:t}),m=bt(1),A=bt(2),He=bt(3),L=Symbol.for("lit-noChange"),u=Symbol.for("lit-nothing"),Ft=new WeakMap,z=O.createTreeWalker(O,129);function qt(i,e){if(!$t(i)||!i.hasOwnProperty("raw"))throw Error("invalid template strings array");return Lt!==void 0?Lt.createHTML(e):e}var be=(i,e)=>{let t=i.length-1,a=[],r,o=e===2?"<svg>":e===3?"<math>":"",s=B;for(let l=0;l<t;l++){let c=i[l],d,h,n=-1,_=0;for(;_<c.length&&(s.lastIndex=_,h=s.exec(c),h!==null);)_=s.lastIndex,s===B?h[1]==="!--"?s=Rt:h[1]!==void 0?s=jt:h[2]!==void 0?(It.test(h[2])&&(r=RegExp("</"+h[2],"g")),s=H):h[3]!==void 0&&(s=H):s===H?h[0]===">"?(s=r??B,n=-1):h[1]===void 0?n=-2:(n=s.lastIndex-h[2].length,d=h[1],s=h[3]===void 0?H:h[3]==='"'?Dt:Ut):s===Dt||s===Ut?s=H:s===Rt||s===jt?s=B:(s=H,r=void 0);let $=s===H&&i[l+1].startsWith("/>")?" ":"";o+=s===B?c+ge:n>=0?(a.push(d),c.slice(0,n)+Vt+c.slice(n)+M+$):c+M+(n===-2?l:$)}return[qt(i,o+(i[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),a]},W=class i{constructor({strings:e,_$litType$:t},a){let r;this.parts=[];let o=0,s=0,l=e.length-1,c=this.parts,[d,h]=be(e,t);if(this.el=i.createElement(d,a),z.currentNode=this.el.content,t===2||t===3){let n=this.el.content.firstChild;n.replaceWith(...n.childNodes)}for(;(r=z.nextNode())!==null&&c.length<l;){if(r.nodeType===1){if(r.hasAttributes())for(let n of r.getAttributeNames())if(n.endsWith(Vt)){let _=h[s++],$=r.getAttribute(n).split(M),f=/([.?@])?(.*)/.exec(_);c.push({type:1,index:o,name:f[2],strings:$,ctor:f[1]==="."?pt:f[1]==="?"?ft:f[1]==="@"?_t:j}),r.removeAttribute(n)}else n.startsWith(M)&&(c.push({type:6,index:o}),r.removeAttribute(n));if(It.test(r.tagName)){let n=r.textContent.split(M),_=n.length-1;if(_>0){r.textContent=rt?rt.emptyScript:"";for(let $=0;$<_;$++)r.append(n[$],I()),z.nextNode(),c.push({type:2,index:++o});r.append(n[_],I())}}}else if(r.nodeType===8)if(r.data===Bt)c.push({type:2,index:o});else{let n=-1;for(;(n=r.data.indexOf(M,n+1))!==-1;)c.push({type:7,index:o}),n+=M.length-1}o++}}static createElement(e,t){let a=O.createElement("template");return a.innerHTML=e,a}};function R(i,e,t=i,a){if(e===L)return e;let r=a!==void 0?t._$Co?.[a]:t._$Cl,o=q(e)?void 0:e._$litDirective$;return r?.constructor!==o&&(r?._$AO?.(!1),o===void 0?r=void 0:(r=new o(i),r._$AT(i,t,a)),a!==void 0?(t._$Co??=[])[a]=r:t._$Cl=r),r!==void 0&&(e=R(i,r._$AS(i,e.values),r,a)),e}var ut=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:a}=this._$AD,r=(e?.creationScope??O).importNode(t,!0);z.currentNode=r;let o=z.nextNode(),s=0,l=0,c=a[0];for(;c!==void 0;){if(s===c.index){let d;c.type===2?d=new Z(o,o.nextSibling,this,e):c.type===1?d=new c.ctor(o,c.name,c.strings,this,e):c.type===6&&(d=new mt(o,this,e)),this._$AV.push(d),c=a[++l]}s!==c?.index&&(o=z.nextNode(),s++)}return z.currentNode=O,r}p(e){let t=0;for(let a of this._$AV)a!==void 0&&(a.strings!==void 0?(a._$AI(e,a,t),t+=a.strings.length-2):a._$AI(e[t])),t++}},Z=class i{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,a,r){this.type=2,this._$AH=u,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=a,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=R(this,e,t),q(e)?e===u||e==null||e===""?(this._$AH!==u&&this._$AR(),this._$AH=u):e!==this._$AH&&e!==L&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):$e(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==u&&q(this._$AH)?this._$AA.nextSibling.data=e:this.T(O.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:a}=e,r=typeof a=="number"?this._$AC(e):(a.el===void 0&&(a.el=W.createElement(qt(a.h,a.h[0]),this.options)),a);if(this._$AH?._$AD===r)this._$AH.p(t);else{let o=new ut(r,this),s=o.u(this.options);o.p(t),this.T(s),this._$AH=o}}_$AC(e){let t=Ft.get(e.strings);return t===void 0&&Ft.set(e.strings,t=new W(e)),t}k(e){$t(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,a,r=0;for(let o of e)r===t.length?t.push(a=new i(this.O(I()),this.O(I()),this,this.options)):a=t[r],a._$AI(o),r++;r<t.length&&(this._$AR(a&&a._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let a=Ot(e).nextSibling;Ot(e).remove(),e=a}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},j=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,a,r,o){this.type=1,this._$AH=u,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=o,a.length>2||a[0]!==""||a[1]!==""?(this._$AH=Array(a.length-1).fill(new String),this.strings=a):this._$AH=u}_$AI(e,t=this,a,r){let o=this.strings,s=!1;if(o===void 0)e=R(this,e,t,0),s=!q(e)||e!==this._$AH&&e!==L,s&&(this._$AH=e);else{let l=e,c,d;for(e=o[0],c=0;c<o.length-1;c++)d=R(this,l[a+c],t,c),d===L&&(d=this._$AH[c]),s||=!q(d)||d!==this._$AH[c],d===u?e=u:e!==u&&(e+=(d??"")+o[c+1]),this._$AH[c]=d}s&&!r&&this.j(e)}j(e){e===u?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},pt=class extends j{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===u?void 0:e}},ft=class extends j{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==u)}},_t=class extends j{constructor(e,t,a,r,o){super(e,t,a,r,o),this.type=5}_$AI(e,t=this){if((e=R(this,e,t,0)??u)===L)return;let a=this._$AH,r=e===u&&a!==u||e.capture!==a.capture||e.once!==a.once||e.passive!==a.passive,o=e!==u&&(a===u||r);r&&this.element.removeEventListener(this.name,this,a),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},mt=class{constructor(e,t,a){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=a}get _$AU(){return this._$AM._$AU}_$AI(e){R(this,e)}};var ve=gt.litHtmlPolyfillSupport;ve?.(W,Z),(gt.litHtmlVersions??=[]).push("3.3.3");var Wt=(i,e,t)=>{let a=t?.renderBefore??e,r=a._$litPart$;if(r===void 0){let o=t?.renderBefore??null;a._$litPart$=r=new Z(e.insertBefore(I(),o),o,void 0,t??{})}return r._$AI(i),r};var vt=globalThis,T=class extends E{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Wt(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return L}};T._$litElement$=!0,T.finalized=!0,vt.litElementHydrateSupport?.({LitElement:T});var ye=vt.litElementPolyfillSupport;ye?.({LitElement:T});(vt.litElementVersions??=[]).push("4.2.2");var xe="1.2.0",yt="pvpc-bono-social-card",Zt=["var(--pvpc-bs-verde)","var(--pvpc-bs-amarillo)","var(--pvpc-bs-naranja)","var(--pvpc-bs-rojo)"],we={P1:3,P2:2,P3:0},xt="#4269d0",Gt="#f4bd4a";function wt(i,e){return Array.isArray(i)&&i.length===3&&i.every(t=>Number.isFinite(Number(t)))?`rgb(${i.map(Number).join(", ")})`:typeof i=="string"&&i.trim()?i.trim():e}var Ae=`conic-gradient(${["verde","amarillo","naranja","rojo"].map((i,e)=>`var(--pvpc-bs-${i}) ${e*25}% ${(e+1)*25}%`).join(", ")})`,Kt={min:"M1,3H23L12,22",max:"M1,21H23L12,2",min_hueco:"M12,22L1,3H23L12,22M12,17.5L19.5,5H4.5L12,17.5Z",max_hueco:"M12,2L1,21H23M12,6L19.53,19H4.47"},it={es:{titulo:"Precio de la luz",ahora:"Ahora",hoy:"Hoy",manana:"Ma\xF1ana",minimo:"M\xEDnimo",maximo:"M\xE1ximo",anterior:"Factura periodo anterior",en_curso:"Factura periodo en curso",prevision:"previsi\xF3n",estimada_cierre:"Factura estimada",facturas:"Facturas",sin_facturas:"A\xFAn no hay facturas cerradas",calculada:"calculada",abrir:"Ver todo",cerrar:"Cerrar",factura_real:"Factura real",calculada_consumo:"Calculada con el consumo",estimada:"estimada",desviacion:"desviaci\xF3n",real:"real",sin_precio:"Sin precios",no_disponible:"No disponible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"llano",P3:"valle"},sin_entidad:"No se encuentra el sensor de precio de PVPC + Bono Social"},en:{titulo:"Electricity price",ahora:"Now",hoy:"Today",manana:"Tomorrow",minimo:"Minimum",maximo:"Maximum",anterior:"Previous bill",en_curso:"Current bill",prevision:"forecast",estimada_cierre:"Estimated bill",facturas:"Bills",sin_facturas:"No closed bills yet",calculada:"calculated",abrir:"Show everything",cerrar:"Close",factura_real:"Actual bill",calculada_consumo:"Calculated from consumption",estimada:"estimated",desviacion:"deviation",real:"actual",sin_precio:"No prices",no_disponible:"Unavailable",hora_actual:"Current hour",periodos:{P1:"peak",P2:"standard",P3:"off-peak"},sin_entidad:"PVPC + Bono Social price sensor not found"},ca:{titulo:"Preu de la llum",anterior:"Factura del per\xEDode anterior",en_curso:"Factura del per\xEDode en curs",estimada_cierre:"Factura estimada",facturas:"Factures",sin_facturas:"Encara no hi ha factures tancades",calculada:"calculada",abrir:"Veure-ho tot",cerrar:"Tanca",factura_real:"Factura real",calculada_consumo:"Calculada amb el consum",real:"real",sin_precio:"Sense preus",no_disponible:"No disponible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"pla",P3:"vall"},sin_entidad:"No es troba el sensor de preu de PVPC + Bono Social"},gl:{titulo:"Prezo da luz",anterior:"Factura do per\xEDodo anterior",en_curso:"Factura do per\xEDodo en curso",estimada_cierre:"Factura estimada",facturas:"Facturas",sin_facturas:"A\xEDnda non hai facturas pechadas",calculada:"calculada",abrir:"Ver todo",cerrar:"Pechar",factura_real:"Factura real",calculada_consumo:"Calculada co consumo",real:"real",sin_precio:"Sen prezos",no_disponible:"Non dispo\xF1ible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"chan",P3:"val"},sin_entidad:"Non se atopa o sensor de prezo de PVPC + Bono Social"},eu:{titulo:"Argindarraren prezioa",anterior:"Aurreko aldiko faktura",en_curso:"Aldi honetako faktura",estimada_cierre:"Zenbatetsitako faktura",facturas:"Fakturak",sin_facturas:"Oraindik ez dago itxitako fakturarik",calculada:"kalkulatua",abrir:"Ikusi dena",cerrar:"Itxi",factura_real:"Benetako faktura",calculada_consumo:"Kontsumoarekin kalkulatua",real:"benetakoa",sin_precio:"Preziorik ez",no_disponible:"Ez dago erabilgarri",hora_actual:"Uneko ordua",periodos:{P1:"punta",P2:"laua",P3:"harana"},sin_entidad:"Ez da aurkitu PVPC + Bono Social-en prezio-sentsorea"}},Jt=["ca","gl","eu"];function ot(i,e=!1){let t=e?"price_next_day_":"price_",a=[];for(let r=0;r<24;r++){let o=String(r).padStart(2,"0"),s=i?.[`${t}${o}h`];typeof s=="number"&&a.push({hora:r,precio:s});let l=i?.[`${t}${o}h_d`];typeof l=="number"&&a.push({hora:r,precio:l})}return a}var Qt=new Map;function Se(i){let e=i||"",t=Qt.get(e);if(!t){let a={hourCycle:"h23",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric"};try{t=new Intl.DateTimeFormat("en-US",i?{...a,timeZone:i}:a)}catch{t=new Intl.DateTimeFormat("en-US",a)}Qt.set(e,t)}return t}function K(i=new Date,e){let t={};for(let{type:o,value:s}of Se(e).formatToParts(i))t[o]=Number(s);let a={anio:t.year,mes:t.month,dia:t.day,hora:t.hour%24,minuto:t.minute},r=Date.UTC(a.anio,a.mes-1,a.dia,a.hora,a.minuto);return a.desfase=Math.round((r-Math.floor(i.getTime()/6e4)*6e4)/6e4),a}function U(i){return i?.config?.time_zone||void 0}function Xt(i=new Date,e,t=0){let a=K(i,e);return new Date(Date.UTC(a.anio,a.mes-1,a.dia+t)).toISOString().slice(0,10)}function Yt(i=new Date,e){let t=K(i,e);return`${t.anio}-${t.mes}-${t.dia}-${t.hora}-${t.desfase}`}function Ce(i,e=new Date,t){let a=K(e,t).hora,r=i.findIndex(s=>s.hora===a);return K(new Date(e.getTime()-36e5),t).hora===a&&i[r+1]?.hora===a?r+1:r}function St(i){if(!i.length)return null;let e=0,t=0;return i.forEach((a,r)=>{a.precio<i[e].precio&&(e=r),a.precio>i[t].precio&&(t=r)}),{min:i[e],max:i[t]}}function te(i){let e=St(i);if(!e)return[];let t=e.max.precio-e.min.precio;return i.map(a=>t?Math.min(3,Math.floor((a.precio-e.min.precio)/t*4)):0)}function N(i,e,t=()=>!0){return Object.keys(i?.states||{}).filter(a=>a.startsWith(e)&&t(i.states[a])).sort()[0]}function At(i){return i?.states["sensor.pvpc_bs_precio"]?"sensor.pvpc_bs_precio":N(i,"sensor.",e=>"price_00h"in(e.attributes||{})&&String(e.attributes.attribution||"").includes("REE"))}var G=class extends T{constructor(){super(...arguments);Y(this,"_id",Math.random().toString(36).slice(2,8))}static getConfigForm(){return{schema:[{name:"entity",selector:{entity:{domain:"sensor"}}},{name:"title",selector:{text:{}}},{name:"factura",selector:{select:{mode:"dropdown",options:[{value:"below_chart",label:"Bajo la gr\xE1fica / Below the chart"},{value:"header",label:"Arriba / In the header"},{value:"hidden",label:"Oculta / Hidden"}]}}},{type:"grid",name:"",schema:[{name:"factura_actual",selector:{boolean:{}}},{name:"factura_anterior",selector:{boolean:{}}},{name:"prevision",selector:{boolean:{}}},{name:"current",selector:{boolean:{}}},{name:"details",selector:{boolean:{}}},{name:"graph",selector:{boolean:{}}},{name:"next_day",selector:{boolean:{}}},{name:"ventana",selector:{boolean:{}}}]},{name:"colores",selector:{select:{mode:"dropdown",options:[{value:"fijo",label:"Un color por d\xEDa / One colour per day"},{value:"precio",label:"Hoy por precio / Today by price"}]}}},{type:"grid",name:"",schema:[{name:"color_hoy",selector:{color_rgb:{}}},{name:"color_manana",selector:{color_rgb:{}}},{name:"bandas",selector:{boolean:{}}}]},{name:"entity_injection",selector:{entity:{domain:"sensor"}}},{name:"icon_color",selector:{select:{mode:"dropdown",options:[{value:"price",label:"Por precio / By price"},{value:"period",label:"Por periodo P1-P3 / By period"},{value:"fijo",label:"Azul fijo / Fixed blue"}]}}},{type:"grid",name:"",schema:[{name:"grafica_facturas",selector:{boolean:{}}},{name:"facturas_importe",selector:{boolean:{}}},{name:"facturas_tendencia",selector:{boolean:{}}},{name:"facturas_meses",selector:{select:{mode:"dropdown",options:["3","5","6","9","12"].map(t=>({value:t,label:t}))}}},{name:"color_facturas",selector:{color_rgb:{}}}]},{name:"titulo_grafica",selector:{text:{}}},{name:"titulo_facturas",selector:{text:{}}},{name:"entity_factura_actual",selector:{entity:{domain:"sensor"}}},{name:"entity_factura_anterior",selector:{entity:{domain:"sensor"}}}],computeLabel:t=>Ee[t.name]||t.name}}static getStubConfig(t){return{entity:At(t)||"sensor.pvpc_bs_precio",entity_factura_actual:N(t,"sensor.pvpc_bs_factura_actual")||"sensor.pvpc_bs_factura_actual",entity_factura_anterior:N(t,"sensor.pvpc_bs_factura_anterior")||"sensor.pvpc_bs_factura_anterior",current:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,grafica_facturas:!0,facturas_meses:"6",facturas_importe:!0,ventana:!0,details:!0,next_day:!0,graph:!0,bandas:!0,colores:"fijo",grid_options:{columns:"full",rows:"auto"}}}setConfig(t){if(!t)throw new Error("Configuraci\xF3n no v\xE1lida");let a={};for(let[r,o]of[["show_current","current"],["show_details","details"],["show_graph","graph"]])typeof t[r]=="boolean"&&!(o in t)&&(a[o]=t[r]);typeof t.show_only_today=="boolean"&&!("next_day"in t)&&(a.next_day=!t.show_only_today),this._config={current:!0,details:!0,graph:!0,next_day:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,icon_color:"price",colores:"fijo",color_hoy:xt,color_manana:Gt,bandas:!0,grafica_facturas:!1,facturas_meses:"6",facturas_importe:!0,ventana:!0,...a,...t}}getCardSize(){return this._config?.graph===!1?3:7}getGridOptions(){return{columns:"full",rows:"auto",min_columns:6,min_rows:3}}get _cHoy(){return wt(this._config.color_hoy,xt)}get _cManana(){return wt(this._config.color_manana,Gt)}get _t(){let t=(this.hass?.locale?.language||this.hass?.language||"es").slice(0,2);return Jt.includes(t)?{...it.es,...it[t]}:it[t]||it.en}get _idiomas(){let t=this.hass?.locale?.language||this.hass?.language||"es";return Jt.includes(t.slice(0,2))?[t,"es"]:t}_num(t,a=3){return new Intl.NumberFormat(this._idiomas,{minimumFractionDigits:a,maximumFractionDigits:a}).format(t)}_entidadesVigiladas(t){let a=this._config;return[a.entity||At(t),a.entity_injection,"sensor.pvpc_bs_periodo",a.entity_factura_anterior||N(t,"sensor.pvpc_bs_factura_anterior"),a.entity_factura_actual||N(t,"sensor.pvpc_bs_factura_actual")].filter(Boolean)}shouldUpdate(t){if(!t.has("hass")||t.size>1||!this._config)return!0;let a=t.get("hass"),r=this.hass;if(!a||!r||a.locale!==r.locale||a.language!==r.language||a.themes!==r.themes)return!0;let o=new Set([...this._entidadesVigiladas(a),...this._entidadesVigiladas(r)]);for(let s of o)if(a.states[s]!==r.states[s])return!0;return this._horaPintada!==Yt(new Date,U(r))}_programarCambioDeHora(){clearTimeout(this._temporizadorHora);let t=Date.now(),r=(60-K(new Date(t),U(this.hass)).minuto)*6e4-t%6e4+1e3;this._temporizadorHora=setTimeout(()=>{this.requestUpdate(),this._programarCambioDeHora()},r)}render(){if(!this._config||!this.hass)return u;let t=U(this.hass),a=new Date;this._horaPintada=Yt(a,t);let r=this._t,o=this._config.entity||At(this.hass),s=o&&this.hass.states[o];if(!s)return m`<ha-card><div class="aviso">${r.sin_entidad}</div></ha-card>`;let l=s.attributes||{},c=ot(l),d=this._config.next_day?ot(l,!0):[],h=Array.isArray(l.colores_hoy)&&l.colores_hoy.length===c.length?l.colores_hoy:te(c),n=Array.isArray(l.colores_manana)&&l.colores_manana.length===d.length?l.colores_manana:te(d),_=Ce(c,a,t),$=this._config.entity_injection&&this.hass.states[this._config.entity_injection],f=$?{hoy:ot($.attributes),manana:this._config.next_day?ot($.attributes,!0):[]}:null,x=this._config.bandas!==!1&&Array.isArray(l.periodos_hoy)&&l.periodos_hoy.length===c.length&&l.periodos_hoy.some(k=>k!=="P3")?l.periodos_hoy:null,C=Number(s.state),v=this._factura(),g=this._config.factura;return m`
      <ha-card>
        <div class="contenedor">
          ${this._config.current?m`<div class="cabecera">
                ${this._conVentana?m`<button class="abrir" aria-label=${r.abrir} @click=${()=>this._abrirVentana()}>
                      ${this._icono(_>=0?h[_]:void 0)}
                    </button>`:this._icono(_>=0?h[_]:void 0)}
                <div class="nombre">${this._config.title||""}</div>
                <div class="actual">
                  <div class="precio">
                    ${Number.isFinite(C)?this._precioGrande(C):"\u2014"}
                    <span class="unidad"><span class="euro">€</span>/kWh</span>
                  </div>
                  ${$&&Number.isFinite(Number($.state))?m`<div class="precio-iny">${this._num(Number($.state),5)} €/kWh</div>`:u}
                  ${g==="header"&&v?m`<div class="factura arriba">${v}</div>`:u}
                </div>
              </div>`:u}
          ${this._config.details?this._detalles(c,d,f):u}
          ${this._config.graph?this._grafica(c,d,h,n,_,x,f):u}
          ${v&&(g==="below_chart"||g==="header"&&!this._config.current)?m`<div class="factura abajo">${v}</div>`:u}
          ${v&&g==="header"&&this._config.current?m`<div class="factura abajo estrecha">${v}</div>`:u}
          ${this._config.grafica_facturas?this._graficaFacturas():u}
        </div>
      </ha-card>
      ${this._ventana?this._dialogo():u}
    `}get _conVentana(){return this._config.ventana!==!1&&!this.enVentana}set configVentana(t){this.enVentana=!0,this.toggleAttribute("en-ventana",!0),this.setConfig(t)}_abrirVentana(){this._conVentana&&(this._ventana=!0)}_cerrarVentana(){this.renderRoot.querySelector("dialog.ventana")?.close()}_dialogo(){let t={...this._config,current:!0,details:!0,graph:!0,next_day:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,grafica_facturas:!0,ventana:!1};return m`<dialog
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
        <pvpc-bono-social-card .configVentana=${t} .hass=${this.hass}></pvpc-bono-social-card>
      </div>
    </dialog>`}_precioGrande(t){let a=this._num(t,5);return m`${a.slice(0,-2)}<span class="cola">${a.slice(-2)}</span>`}_icono(t){let a=t;if(this._config.icon_color==="period"){let s=this.hass.states["sensor.pvpc_bs_periodo"]?.state;a=we[s]}let r=this._config.icon_color==="fijo"||a===void 0?xt:Zt[a],o=`pvpc-bs-hueco-${this._id}`;return m`<svg class="icono" viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <mask id=${o}>
          <rect width="512" height="512" fill="#fff"></rect>
          <circle cx="256" cy="424" r="74" fill="#000"></circle>
        </mask>
      </defs>
      <g mask="url(#${o})" fill="none" stroke-linecap="round" stroke-linejoin="round">
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
    </svg>`}_hora(t){return`${String(t).padStart(2,"0")}:00`}_fecha(t=0){let a=new Date(`${Xt(new Date,U(this.hass),t)}T12:00:00Z`);return new Intl.DateTimeFormat(this._idiomas,{timeZone:"UTC"}).format(a)}_triangulo(t,a){return m`<svg class="tri" viewBox="0 0 24 24" aria-hidden="true"><path d=${Kt[t]} fill=${a}></path></svg>`}_detalles(t,a,r){let o=this._t,s=(d,h,n)=>m`<div class="detalle">
        ${this._triangulo(d,h)}
        <div>
          ${n?m`<div class="valor">${this._num(n.precio,5)} €/kWh</div>
                <div class="horas">${this._hora(n.hora)} - ${this._hora(n.hora+1)}</div>`:m`<div class="valor">${o.no_disponible}</div>`}
        </div>
      </div>`,l=(d,h,n="")=>{let _=St(d);return m`<div class="columna">${s(`min${n}`,h,_?.min)}${s(`max${n}`,h,_?.max)}</div>`},c=(d,h,n)=>m`<div class="detalles">
        ${l(d,this._cHoy,n)}${h.length?l(h,this._cManana,n):u}
      </div>`;return m`${c(t,a)}${r?c(r.hoy,r.manana,"_hueco"):u}`}_factura(){let t=this._t;if(this._config.factura==="hidden")return null;let a=[],r=this._config.entity_factura_anterior||N(this.hass,"sensor.pvpc_bs_factura_anterior"),o=this._config.entity_factura_actual||N(this.hass,"sensor.pvpc_bs_factura_actual"),s=n=>typeof n=="string"?`${n.slice(8,10)}/${n.slice(5,7)}`:"",l=(n,_)=>n&&_?` (${s(n)} - ${s(_)})`:"",c=(n,_,$,f=u)=>m`<div>${n}${_}: <b>${this._num($,2)} €</b>${f}</div>`,d=r&&this.hass.states[r];if(this._config.factura_anterior&&d&&Number.isFinite(Number(d.state))){let n=d.attributes||{};a.push(c(t.anterior,l(n.inicio,n.fin),Number(d.state)))}let h=o&&this.hass.states[o];if(this._config.factura_actual&&h&&Number.isFinite(Number(h.state))){let n=h.attributes||{},_=Xt(new Date,U(this.hass));typeof n.acumulado=="number"&&a.push(c(t.en_curso,l(n.inicio,_),n.acumulado)),this._config.prevision!==!1&&a.push(c(t.estimada_cierre,l(n.inicio,n.fin_previsto),Number(h.state)))}return a.length?a:null}_grafica(t,a,r,o,s,l,c){let d=this._t;if(!t.length)return m`<div class="aviso">${d.sin_precio}</div>`;let h=this._cHoy,n=this._cManana,_=480,$=190,f={izq:38,der:16,arr:24,aba:24},x=[{puntos:t,color:h},{puntos:a,color:n},...c?[{puntos:c.hoy,color:h,punteada:!0},{puntos:c.manana,color:n,punteada:!0}]:[]].filter(p=>p.puntos.length),C=x.flatMap(p=>p.puntos.map(w=>w.precio)),v=Math.min(0,...C),g=Math.max(...C);g-v<.01&&(g=v+.01);let k=(g-v)*.08;v-=Math.min(0,...C)<0?k:0,g+=k;let D=Math.max(t.length,a.length,24),J=(_-f.izq-f.der)/D,S=p=>f.izq+J*p,Q=p=>S(p)+J/2,P=p=>f.arr+($-f.arr-f.aba)*(1-(p-v)/(g-v)),ee=p=>p.map((w,y)=>`${y?"V":`M${S(0).toFixed(1)},`}${P(w.precio).toFixed(1)}H${S(y+1).toFixed(1)}`).join(""),ae=(p,w,y)=>A`<line class="tramo" x1=${S(y)} x2=${S(y+1)} y1=${P(p[y].precio)} y2=${P(p[y].precio)}
        stroke=${Zt[w[y]??0]}></line>`,Ct=(p,w,y)=>{let X=St(p),oe=p.indexOf(X[y]),se=P(X[y].precio)+(y==="max"?-11:4);return A`<svg class="marca" x=${Q(oe)-4.5} y=${se} width="9" height="9" viewBox="0 0 24 24">
        <path d=${Kt[y]} fill=${w}></path></svg>`},re=(g-v)/4,ie=[0,1,2,3,4].map(p=>v+re*p),b=this._cursor,Et=(p,w,y,X)=>A`<circle class=${X} cx=${Q(y)} cy=${P(p[y].precio)} r="3" fill=${w}></circle>`,st=this._config.colores==="precio",kt=this._config.titulo_grafica??"PVPC";return m`
      <div class="grafica">
        ${kt?m`<div class="titulo-seccion">${kt}</div>`:u}
        <svg
          viewBox="0 0 ${_} ${$}"
          role="img"
          aria-label=${d.titulo}
          @pointermove=${p=>this._mover(p,_,f,D)}
          @pointerleave=${()=>this._cursor=void 0}
        >
          <text class="eje" x=${f.izq-4} y=${f.arr-12} text-anchor="end">€/kWh</text>
          ${l?l.map((p,w)=>p==="P3"?u:A`<rect class=${p==="P1"?"banda-punta":"banda-llano"} x=${S(w)}
                      y=${f.arr} width=${J} height=${$-f.arr-f.aba}></rect>`):u}
          ${s>=0?A`<rect class="ahora" x=${S(s)} y=${f.arr} width=${J} height=${$-f.arr-f.aba}></rect>`:u}
          ${ie.map(p=>A`<line class="rejilla" x1=${f.izq} x2=${_-f.der} y1=${P(p)} y2=${P(p)}></line>
              <text class="eje" x=${f.izq-4} y=${P(p)+3} text-anchor="end">${this._num(Math.abs(p)<.005?0:p,2)}</text>`)}
          ${[0,3,6,9,12,15,18,21,24].map(p=>A`<line class="rejilla" x1=${S(p)} x2=${S(p)} y1=${f.arr} y2=${$-f.aba}></line>
              <text class="eje" x=${S(p)} y=${$-8} text-anchor="middle">${this._hora(p)}</text>`)}
          ${x.map(p=>A`<path class="serie ${p.punteada?"punteada":""}" d=${ee(p.puntos)}
                stroke=${st&&p.puntos===t?"var(--secondary-text-color)":p.color}></path>`)}
          ${st?t.map((p,w)=>ae(t,r,w)):u}
          ${x.flatMap(p=>[Ct(p.puntos,p.color,"max"),Ct(p.puntos,p.color,"min")])}
          ${b!==void 0?A`<line class="cursor" x1=${Q(b)} x2=${Q(b)} y1=${f.arr} y2=${$-f.aba}></line>`:u}
          ${b!==void 0&&b<t.length?Et(t,h,b,"p-hoy"):u}
          ${b!==void 0&&b<a.length?Et(a,n,b,"p-manana"):u}
        </svg>
        <div class="leyenda">
          ${b!==void 0?m`<span
                  ><b>${this._hora((t[b]??a[b])?.hora??b)} - ${this._hora(((t[b]??a[b])?.hora??b)+1)}</b>${l?.[b]?m` · ${d.periodos[l[b]]}`:u}</span
                >
                ${t[b]?m`<span><i class="bolita" style="background:${h}"></i>${this._num(t[b].precio,5)}</span>`:u}
                ${a[b]?m`<span><i class="bolita" style="background:${n}"></i>${this._num(a[b].precio,5)}</span>`:u}`:m`<span
                  ><i class="bolita" style="background:${st?Ae:h}"></i>${this._fecha(0)}</span
                >${a.length?m`<span><i class="bolita" style="background:${n}"></i>${this._fecha(1)}</span>`:u}${s>=0?m`<span class="l-ahora">${d.hora_actual}</span>`:u}${l?m`<span class="l-punta">${d.periodos.P1}</span><span class="l-llano">${d.periodos.P2}</span>`:u}`}
        </div>
      </div>
    `}connectedCallback(){super.connectedCallback(),this._observador??=new ResizeObserver(()=>this._alinearFactura()),this._observador.observe(this),this._programarCambioDeHora()}disconnectedCallback(){super.disconnectedCallback(),this._observador?.disconnect(),clearTimeout(this._temporizadorHora)}_alinearFactura(){let t=this.renderRoot?.querySelector(".cabecera .actual");if(!t)return;let a=t.querySelector(".precio"),r=[...t.querySelectorAll(".precio-iny, .factura.arriba")];for(let n of[a,...r])n&&(n.style.marginRight="");let o=this.renderRoot.querySelectorAll(".detalles .columna"),s=this.renderRoot.querySelector(".cabecera .icono");if(o.length<2||!t.offsetParent)return;let l=Math.max(...[...o[1].querySelectorAll(".valor, .horas")].map(n=>n.getBoundingClientRect().right));if(!Number.isFinite(l))return;let c=n=>s?n.getBoundingClientRect().left-s.getBoundingClientRect().right-12:1/0,d=(n,_)=>{let $=Math.min(_,c(n));$>0&&(n.style.marginRight=`${$}px`)},h=a?.querySelector(".euro");h&&d(a,h.getBoundingClientRect().right-l);for(let n of r)d(n,n.getBoundingClientRect().right-l)}updated(t){if(super.updated?.(t),this._alinearFactura(),t.has("_ventana")&&this._ventana){let o=this.renderRoot.querySelector("dialog.ventana");o&&!o.open&&o.showModal()}if(!this.hass||!this._config?.grafica_facturas||this._cargandoFacturas||this._facturasDelSensor())return;let a=`${this._config.estadistica_facturas||""}|${this._config.facturas_meses}`;(!this._facturasHora||Date.now()-this._facturasHora>3*3600*1e3||a!==this._facturasClave)&&this._cargarFacturas(a)}_facturasDelSensor(){if(this._config.estadistica_facturas)return null;let t=this._config.entity_factura_actual||N(this.hass,"sensor.pvpc_bs_factura_actual"),a=this.hass?.states[t]?.attributes?.facturas;if(!Array.isArray(a))return null;let r=Math.max(1,Number(this._config.facturas_meses)||6);return a.filter(o=>Number.isFinite(Number(o.total))&&o.inicio).map(o=>{let[s,l,c]=String(o.inicio).split("-").map(Number);return{inicio:new Date(Date.UTC(s,l-1,c+1,12)),total:Number(o.total),real:o.real!==!1}}).slice(-r)}async _cargarFacturas(t){this._cargandoFacturas=!0,this._facturasClave=t,this._facturasHora=Date.now();try{let a=this._config.estadistica_facturas;if(a||(a=(await this.hass.callWS({type:"recorder/list_statistic_ids",statistic_type:"mean"})).map(c=>c.statistic_id).find(c=>c.startsWith("pvpc_bonosocial:facturas_"))),!a){this._facturas=[];return}let r=Math.max(1,Number(this._config.facturas_meses)||6),o=new Date(Date.now()-(r+2)*35*86400*1e3),s=await this.hass.callWS({type:"recorder/statistics_during_period",start_time:o.toISOString(),statistic_ids:[a],period:"hour",types:["max"]});this._facturas=(s[a]||[]).filter(l=>Number.isFinite(Number(l.max))).map(l=>({inicio:new Date(l.start),total:Number(l.max),real:!0})).slice(-r)}catch(a){console.warn("pvpc-bono-social-card: no se pudieron leer las facturas",a),this._facturas=[]}finally{this._cargandoFacturas=!1}}_graficaFacturas(){let t=this._t,a=this._facturasDelSensor()??this._facturas,r=this._config.titulo_facturas??t.facturas,o=r?m`<div class="titulo-seccion">${r}</div>`:u;if(!a)return u;if(!a.length)return m`<div class="facturas">${o}<div class="aviso">${t.sin_facturas}</div></div>`;let s=wt(this._config.color_facturas,this._cHoy),l=this._config.facturas_importe!==!1,c=480,d=150,h={izq:8,der:8,arr:l?18:6,aba:20},n=Math.max(...a.map(g=>g.total),1),_=(c-h.izq-h.der)/a.length,$=Math.min(_*.6,56),f=g=>h.arr+(d-h.arr-h.aba)*(1-Math.max(g,0)/n),x=this._idiomas,C=U(this.hass),v;try{v=new Intl.DateTimeFormat(x,{month:"short",year:"2-digit",...C?{timeZone:C}:{}})}catch{v=new Intl.DateTimeFormat(x,{month:"short",year:"2-digit"})}return m`
      <div class="facturas">
        ${o}
        <svg viewBox="0 0 ${c} ${d}" role="img" aria-label=${r||t.facturas}>
          <line class="rejilla" x1=${h.izq} x2=${c-h.der} y1=${d-h.aba} y2=${d-h.aba}></line>
          ${a.map((g,k)=>{let D=h.izq+_*(k+.5);return A`<rect class="barra ${g.real?"real":"calculada"}" x=${D-$/2+(g.real?0:1)}
                y=${f(g.total)+(g.real?0:1)} width=${$-(g.real?0:2)}
                height=${Math.max(d-h.aba-f(g.total)-(g.real?0:1),0)} rx="3"
                fill=${g.real?s:"none"} stroke=${s}>
                <title>${v.format(g.inicio)}: ${this._num(g.total,2)} € (${g.real?t.real:t.calculada})</title></rect>
              <text class="eje" x=${D} y=${d-6} text-anchor="middle">${v.format(g.inicio)}</text>`})}
          ${this._config.facturas_tendencia&&a.length>1?this._tendencia(a,_,h,f):u}
          ${l?a.map((g,k)=>A`<text class="importe" x=${h.izq+_*(k+.5)} y=${f(g.total)-5}
                    text-anchor="middle">${this._num(g.total,2)} €</text>`):u}
        </svg>
        ${a.some(g=>!g.real)?m`<div class="leyenda">
              ${a.some(g=>g.real)?m`<span><i class="bolita cuadro" style="background:${s}"></i>${t.factura_real}</span>`:u}
              <span><i class="bolita cuadro" style="border:2px solid ${s}"></i>${t.calculada_consumo}</span>
            </div>`:u}
      </div>
    `}_tendencia(t,a,r,o){let s=t.length,l=(s-1)/2,c=t.reduce((f,x)=>f+x.total,0)/s,d=0,h=0;t.forEach((f,x)=>{d+=(x-l)*(f.total-c),h+=(x-l)**2});let n=d/h,_=f=>c+n*(f-l),$=f=>r.izq+a*(f+.5);return A`<line class="tendencia" x1=${$(0)} y1=${o(_(0))} x2=${$(s-1)} y2=${o(_(s-1))}></line>`}_mover(t,a,r,o){let s=t.currentTarget.getBoundingClientRect(),l=(t.clientX-s.left)/s.width*a,c=Math.floor((l-r.izq)/(a-r.izq-r.der)*o);this._cursor=c>=0&&c<o?c:void 0}};Y(G,"properties",{hass:{attribute:!1},_config:{state:!0},_cursor:{state:!0},_facturas:{state:!0},_ventana:{state:!0}}),Y(G,"styles",ct`
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
  `);var Ee={entity:"Sensor de precio / Price sensor",title:"T\xEDtulo / Title",factura:"Factura / Bill",factura_actual:"Factura en curso / Current bill",factura_anterior:"Factura anterior / Previous bill",prevision:"Factura estimada al cierre / Estimated bill",current:"Precio actual / Current price",details:"M\xEDnimos y m\xE1ximos / Min and max",graph:"Gr\xE1fica / Chart",ventana:"Ventana con todo al pulsar el icono / Full view on icon tap",next_day:"Ma\xF1ana / Tomorrow",icon_color:"Color del icono / Icon colour",colores:"Colores de la gr\xE1fica / Chart colours",color_hoy:"Color de hoy / Today's colour",color_manana:"Color de ma\xF1ana / Tomorrow's colour",bandas:"Punta y llano sombreados / Shade peak hours",entity_injection:"Sensor de precio de excedentes (opcional) / Injection price sensor (optional)",grafica_facturas:"Gr\xE1fica de facturas / Bills chart",facturas_importe:"Importe sobre cada barra / Amount above bars",facturas_tendencia:"L\xEDnea de tendencia / Trend line",facturas_meses:"Cu\xE1ntas facturas / How many bills",color_facturas:"Color de las barras / Bar colour",titulo_grafica:"T\xEDtulo de la gr\xE1fica de precios / Price chart title",titulo_facturas:"T\xEDtulo de la gr\xE1fica de facturas / Bills chart title",entity_factura_actual:"Sensor de factura en curso / Current bill sensor",entity_factura_anterior:"Sensor de factura anterior / Previous bill sensor"};customElements.get(yt)||(customElements.define(yt,G),window.customCards=window.customCards||[],window.customCards.push({type:yt,name:"PVPC + Bono Social",description:"Precio del PVPC de hoy y ma\xF1ana y la factura con o sin bono social.",preview:!0,documentationURL:"https://github.com/BaRDaHL/pvpc_bonosocial"}),console.info(`%c PVPC + Bono Social %c ${xe} `,"background:#43a047;color:#fff",""));export{wt as colorCss,K as enZona,Xt as fechaIso,Yt as horaLocal,Ce as posicionActual,ot as serie,U as zonaDeHA};
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
