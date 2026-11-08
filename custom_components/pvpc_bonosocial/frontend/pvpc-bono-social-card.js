var xt=Object.defineProperty;var wt=(r,t,e)=>t in r?xt(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var I=(r,t,e)=>wt(r,typeof t!="symbol"?t+"":t,e);var se=globalThis,ie=se.ShadowRoot&&(se.ShadyCSS===void 0||se.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ye=Symbol(),De=new WeakMap,W=class{constructor(t,e,a){if(this._$cssResult$=!0,a!==ye)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(ie&&t===void 0){let a=e!==void 0&&e.length===1;a&&(t=De.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),a&&De.set(e,t))}return t}toString(){return this.cssText}},Be=r=>new W(typeof r=="string"?r:r+"",void 0,ye),$e=(r,...t)=>{let e=r.length===1?r[0]:t.reduce((a,o,s)=>a+(i=>{if(i._$cssResult$===!0)return i.cssText;if(typeof i=="number")return i;throw Error("Value passed to 'css' function must be a 'css' function result: "+i+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(o)+r[s+1],r[0]);return new W(e,r,ye)},Fe=(r,t)=>{if(ie)r.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let a=document.createElement("style"),o=se.litNonce;o!==void 0&&a.setAttribute("nonce",o),a.textContent=e.cssText,r.appendChild(a)}},xe=ie?r=>r:r=>r instanceof CSSStyleSheet?(t=>{let e="";for(let a of t.cssRules)e+=a.cssText;return Be(e)})(r):r;var{is:Ct,defineProperty:St,getOwnPropertyDescriptor:At,getOwnPropertyNames:Et,getOwnPropertySymbols:Pt,getPrototypeOf:Mt}=Object,ne=globalThis,Ue=ne.trustedTypes,kt=Ue?Ue.emptyScript:"",Nt=ne.reactiveElementPolyfillSupport,G=(r,t)=>r,we={toAttribute(r,t){switch(t){case Boolean:r=r?kt:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,t){let e=r;switch(t){case Boolean:e=r!==null;break;case Number:e=r===null?null:Number(r);break;case Object:case Array:try{e=JSON.parse(r)}catch{e=null}}return e}},Ie=(r,t)=>!Ct(r,t),Ve={attribute:!0,type:String,converter:we,reflect:!1,useDefault:!1,hasChanged:Ie};Symbol.metadata??=Symbol("metadata"),ne.litPropertyMetadata??=new WeakMap;var L=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=Ve){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let a=Symbol(),o=this.getPropertyDescriptor(t,a,e);o!==void 0&&St(this.prototype,t,o)}}static getPropertyDescriptor(t,e,a){let{get:o,set:s}=At(this.prototype,t)??{get(){return this[e]},set(i){this[e]=i}};return{get:o,set(i){let n=o?.call(this);s?.call(this,i),this.requestUpdate(t,n,a)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Ve}static _$Ei(){if(this.hasOwnProperty(G("elementProperties")))return;let t=Mt(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(G("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(G("properties"))){let e=this.properties,a=[...Et(e),...Pt(e)];for(let o of a)this.createProperty(o,e[o])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[a,o]of e)this.elementProperties.set(a,o)}this._$Eh=new Map;for(let[e,a]of this.elementProperties){let o=this._$Eu(e,a);o!==void 0&&this._$Eh.set(o,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let a=new Set(t.flat(1/0).reverse());for(let o of a)e.unshift(xe(o))}else t!==void 0&&e.push(xe(t));return e}static _$Eu(t,e){let a=e.attribute;return a===!1?void 0:typeof a=="string"?a:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let a of e.keys())this.hasOwnProperty(a)&&(t.set(a,this[a]),delete this[a]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Fe(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,a){this._$AK(t,a)}_$ET(t,e){let a=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,a);if(o!==void 0&&a.reflect===!0){let s=(a.converter?.toAttribute!==void 0?a.converter:we).toAttribute(e,a.type);this._$Em=t,s==null?this.removeAttribute(o):this.setAttribute(o,s),this._$Em=null}}_$AK(t,e){let a=this.constructor,o=a._$Eh.get(t);if(o!==void 0&&this._$Em!==o){let s=a.getPropertyOptions(o),i=typeof s.converter=="function"?{fromAttribute:s.converter}:s.converter?.fromAttribute!==void 0?s.converter:we;this._$Em=o;let n=i.fromAttribute(e,s.type);this[o]=n??this._$Ej?.get(o)??n,this._$Em=null}}requestUpdate(t,e,a,o=!1,s){if(t!==void 0){let i=this.constructor;if(o===!1&&(s=this[t]),a??=i.getPropertyOptions(t),!((a.hasChanged??Ie)(s,e)||a.useDefault&&a.reflect&&s===this._$Ej?.get(t)&&!this.hasAttribute(i._$Eu(t,a))))return;this.C(t,e,a)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:a,reflect:o,wrapped:s},i){a&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,i??e??this[t]),s!==!0||i!==void 0)||(this._$AL.has(t)||(this.hasUpdated||a||(e=void 0),this._$AL.set(t,e)),o===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[o,s]of this._$Ep)this[o]=s;this._$Ep=void 0}let a=this.constructor.elementProperties;if(a.size>0)for(let[o,s]of a){let{wrapped:i}=s,n=this[o];i!==!0||this._$AL.has(o)||n===void 0||this.C(o,void 0,s,n)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(a=>a.hostUpdate?.()),this.update(e)):this._$EM()}catch(a){throw t=!1,this._$EM(),a}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};L.elementStyles=[],L.shadowRootOptions={mode:"open"},L[G("elementProperties")]=new Map,L[G("finalized")]=new Map,Nt?.({ReactiveElement:L}),(ne.reactiveElementVersions??=[]).push("2.1.2");var ke=globalThis,We=r=>r,ce=ke.trustedTypes,Ge=ce?ce.createPolicy("lit-html",{createHTML:r=>r}):void 0,Xe="$lit$",q=`lit$${Math.random().toFixed(9).slice(2)}$`,et="?"+q,jt=`<${et}>`,D=document,Y=()=>D.createComment(""),K=r=>r===null||typeof r!="object"&&typeof r!="function",Ne=Array.isArray,Tt=r=>Ne(r)||typeof r?.[Symbol.iterator]=="function",Ce=`[ 	
\f\r]`,Z=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ze=/-->/g,Ye=/>/g,O=RegExp(`>|${Ce}(?:([^\\s"'>=/]+)(${Ce}*=${Ce}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ke=/'/g,Je=/"/g,tt=/^(?:script|style|textarea|title)$/i,je=r=>(t,...e)=>({_$litType$:r,strings:t,values:e}),f=je(1),M=je(2),Qt=je(3),B=Symbol.for("lit-noChange"),h=Symbol.for("lit-nothing"),Qe=new WeakMap,H=D.createTreeWalker(D,129);function at(r,t){if(!Ne(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ge!==void 0?Ge.createHTML(t):t}var Lt=(r,t)=>{let e=r.length-1,a=[],o,s=t===2?"<svg>":t===3?"<math>":"",i=Z;for(let n=0;n<e;n++){let c=r[n],l,m,d=-1,u=0;for(;u<c.length&&(i.lastIndex=u,m=i.exec(c),m!==null);)u=i.lastIndex,i===Z?m[1]==="!--"?i=Ze:m[1]!==void 0?i=Ye:m[2]!==void 0?(tt.test(m[2])&&(o=RegExp("</"+m[2],"g")),i=O):m[3]!==void 0&&(i=O):i===O?m[0]===">"?(i=o??Z,d=-1):m[1]===void 0?d=-2:(d=i.lastIndex-m[2].length,l=m[1],i=m[3]===void 0?O:m[3]==='"'?Je:Ke):i===Je||i===Ke?i=O:i===Ze||i===Ye?i=Z:(i=O,o=void 0);let v=i===O&&r[n+1].startsWith("/>")?" ":"";s+=i===Z?c+jt:d>=0?(a.push(l),c.slice(0,d)+Xe+c.slice(d)+q+v):c+q+(d===-2?n:v)}return[at(r,s+(r[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),a]},J=class r{constructor({strings:t,_$litType$:e},a){let o;this.parts=[];let s=0,i=0,n=t.length-1,c=this.parts,[l,m]=Lt(t,e);if(this.el=r.createElement(l,a),H.currentNode=this.el.content,e===2||e===3){let d=this.el.content.firstChild;d.replaceWith(...d.childNodes)}for(;(o=H.nextNode())!==null&&c.length<n;){if(o.nodeType===1){if(o.hasAttributes())for(let d of o.getAttributeNames())if(d.endsWith(Xe)){let u=m[i++],v=o.getAttribute(d).split(q),p=/([.?@])?(.*)/.exec(u);c.push({type:1,index:s,name:p[2],strings:v,ctor:p[1]==="."?Ae:p[1]==="?"?Ee:p[1]==="@"?Pe:U}),o.removeAttribute(d)}else d.startsWith(q)&&(c.push({type:6,index:s}),o.removeAttribute(d));if(tt.test(o.tagName)){let d=o.textContent.split(q),u=d.length-1;if(u>0){o.textContent=ce?ce.emptyScript:"";for(let v=0;v<u;v++)o.append(d[v],Y()),H.nextNode(),c.push({type:2,index:++s});o.append(d[u],Y())}}}else if(o.nodeType===8)if(o.data===et)c.push({type:2,index:s});else{let d=-1;for(;(d=o.data.indexOf(q,d+1))!==-1;)c.push({type:7,index:s}),d+=q.length-1}s++}}static createElement(t,e){let a=D.createElement("template");return a.innerHTML=t,a}};function F(r,t,e=r,a){if(t===B)return t;let o=a!==void 0?e._$Co?.[a]:e._$Cl,s=K(t)?void 0:t._$litDirective$;return o?.constructor!==s&&(o?._$AO?.(!1),s===void 0?o=void 0:(o=new s(r),o._$AT(r,e,a)),a!==void 0?(e._$Co??=[])[a]=o:e._$Cl=o),o!==void 0&&(t=F(r,o._$AS(r,t.values),o,a)),t}var Se=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:a}=this._$AD,o=(t?.creationScope??D).importNode(e,!0);H.currentNode=o;let s=H.nextNode(),i=0,n=0,c=a[0];for(;c!==void 0;){if(i===c.index){let l;c.type===2?l=new Q(s,s.nextSibling,this,t):c.type===1?l=new c.ctor(s,c.name,c.strings,this,t):c.type===6&&(l=new Me(s,this,t)),this._$AV.push(l),c=a[++n]}i!==c?.index&&(s=H.nextNode(),i++)}return H.currentNode=D,o}p(t){let e=0;for(let a of this._$AV)a!==void 0&&(a.strings!==void 0?(a._$AI(t,a,e),e+=a.strings.length-2):a._$AI(t[e])),e++}},Q=class r{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,a,o){this.type=2,this._$AH=h,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=a,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=F(this,t,e),K(t)?t===h||t==null||t===""?(this._$AH!==h&&this._$AR(),this._$AH=h):t!==this._$AH&&t!==B&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Tt(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==h&&K(this._$AH)?this._$AA.nextSibling.data=t:this.T(D.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:a}=t,o=typeof a=="number"?this._$AC(t):(a.el===void 0&&(a.el=J.createElement(at(a.h,a.h[0]),this.options)),a);if(this._$AH?._$AD===o)this._$AH.p(e);else{let s=new Se(o,this),i=s.u(this.options);s.p(e),this.T(i),this._$AH=s}}_$AC(t){let e=Qe.get(t.strings);return e===void 0&&Qe.set(t.strings,e=new J(t)),e}k(t){Ne(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,a,o=0;for(let s of t)o===e.length?e.push(a=new r(this.O(Y()),this.O(Y()),this,this.options)):a=e[o],a._$AI(s),o++;o<e.length&&(this._$AR(a&&a._$AB.nextSibling,o),e.length=o)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let a=We(t).nextSibling;We(t).remove(),t=a}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},U=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,a,o,s){this.type=1,this._$AH=h,this._$AN=void 0,this.element=t,this.name=e,this._$AM=o,this.options=s,a.length>2||a[0]!==""||a[1]!==""?(this._$AH=Array(a.length-1).fill(new String),this.strings=a):this._$AH=h}_$AI(t,e=this,a,o){let s=this.strings,i=!1;if(s===void 0)t=F(this,t,e,0),i=!K(t)||t!==this._$AH&&t!==B,i&&(this._$AH=t);else{let n=t,c,l;for(t=s[0],c=0;c<s.length-1;c++)l=F(this,n[a+c],e,c),l===B&&(l=this._$AH[c]),i||=!K(l)||l!==this._$AH[c],l===h?t=h:t!==h&&(t+=(l??"")+s[c+1]),this._$AH[c]=l}i&&!o&&this.j(t)}j(t){t===h?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},Ae=class extends U{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===h?void 0:t}},Ee=class extends U{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==h)}},Pe=class extends U{constructor(t,e,a,o,s){super(t,e,a,o,s),this.type=5}_$AI(t,e=this){if((t=F(this,t,e,0)??h)===B)return;let a=this._$AH,o=t===h&&a!==h||t.capture!==a.capture||t.once!==a.once||t.passive!==a.passive,s=t!==h&&(a===h||o);o&&this.element.removeEventListener(this.name,this,a),s&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},Me=class{constructor(t,e,a){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=a}get _$AU(){return this._$AM._$AU}_$AI(t){F(this,t)}};var zt=ke.litHtmlPolyfillSupport;zt?.(J,Q),(ke.litHtmlVersions??=[]).push("3.3.3");var ot=(r,t,e)=>{let a=e?.renderBefore??t,o=a._$litPart$;if(o===void 0){let s=e?.renderBefore??null;a._$litPart$=o=new Q(t.insertBefore(Y(),s),s,void 0,e??{})}return o._$AI(r),o};var Te=globalThis,z=class extends L{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=ot(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return B}};z._$litElement$=!0,z.finalized=!0,Te.litElementHydrateSupport?.({LitElement:z});var Rt=Te.litElementPolyfillSupport;Rt?.({LitElement:z});(Te.litElementVersions??=[]).push("4.2.2");var qt="1.2.4",he="pvpc-bono-social-card",rt=["var(--pvpc-bs-verde)","var(--pvpc-bs-amarillo)","var(--pvpc-bs-naranja)","var(--pvpc-bs-rojo)"],Ot={P1:3,P2:2,P3:0},te="#4269d0",Re="#f4bd4a";function Le(r,t){return Array.isArray(r)&&r.length===3&&r.every(e=>Number.isFinite(Number(e)))?`rgb(${r.map(Number).join(", ")})`:typeof r=="string"&&r.trim()?r.trim():t}var st=`conic-gradient(${["verde","amarillo","naranja","rojo"].map((r,t)=>`var(--pvpc-bs-${r}) ${t*25}% ${(t+1)*25}%`).join(", ")})`,it={min:"M1,3H23L12,22",max:"M1,21H23L12,2",min_hueco:"M12,22L1,3H23L12,22M12,17.5L19.5,5H4.5L12,17.5Z",max_hueco:"M12,2L1,21H23M12,6L19.53,19H4.47"},le={es:{titulo:"Precio de la luz",anterior:"Factura periodo anterior",en_curso:"Factura periodo en curso",estimada_cierre:"Factura estimada",facturas:"Facturas",sin_facturas:"A\xFAn no hay facturas cerradas",calculada:"calculada",abrir:"Ver todo",cerrar:"Cerrar",factura_real:"Factura real",calculada_consumo:"Calculada con el consumo",real:"real",sin_precio:"Sin precios",no_disponible:"No disponible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"llano",P3:"valle"},sin_entidad:"No se encuentra el sensor de precio de PVPC + Bono Social",comp:{boton:"Comparar tarifas",comparando:"Comparando\u2026",titulo:"Comparativa de tarifas",ultima:"\xDAltima comparaci\xF3n",facturas:r=>r===1?"1 factura":`${r} facturas`,dias:r=>`${r} d\xEDas`,ofertas:r=>`${r} ofertas de la CNMC`,tu_tarifa:"Tu tarifa actual",pvpc_bono:"PVPC con bono social",pvpc:"PVPC sin bono",al_anio:"/a\xF1o",sin_permanencia:"sin permanencia",permanencia:"permanencia",nuevos:"solo nuevos clientes",verde:"verde",espera:"Consultando la CNMC con tus facturas. Puede tardar unos segundos\u2026",error:"No se ha podido comparar",sin_datos:"A\xFAn no hay ninguna comparativa.",sin_suministro:"No se encuentra el suministro de la comparativa",estados:{sin_codigo_postal:"Falta el c\xF3digo postal del suministro (opciones del suministro).",sin_datos:"No hay facturas suficientes para comparar.",cnmc_no_responde:"El comparador de la CNMC no responde; int\xE9ntalo m\xE1s tarde."},veredictos:{quedarse_con_bono:["Sigue con PVPC + bono social","Con tu bono, el PVPC sigue siendo lo m\xE1s barato: la mejor oferta libre te costar\xEDa {x} m\xE1s al a\xF1o."],libre_aunque_pierde_bono:["Hay una oferta m\xE1s barata","La mejor oferta libre sale {x} m\xE1s barata al a\xF1o que lo que pagas con bono, aunque lo perder\xEDas. Comprueba las condiciones antes de cambiar."],mercado_libre:["Puedes ahorrar","Con la mejor oferta te ahorrar\xEDas {x} al a\xF1o."],quedarse:["Sigue con tu tarifa","Ninguna oferta mejora lo que pagas: la mejor te costar\xEDa {x} m\xE1s al a\xF1o."]},avisos:{pierde_bono:"Con otra comercializadora pierdes el bono social.",bono_perdido:"Ya no tienes bono social: se compara con lo que pagar\xEDas sin \xE9l.",bono_nuevo:"Parte de lo pagado no llevaba el bono que tienes ahora: el ahorro real ser\xEDa menor.",cobertura_incompleta:"No est\xE1n en el comparador: {ausentes}.",datos_extrapolados:"Solo hay {dias} d\xEDas de facturas: lo pagado y el consumo se han llevado a un a\xF1o.",facturas_estimadas:"Hay facturas estimadas: concilia las reales para afinar.",sin_ofertas:"La CNMC no ha devuelto ofertas para tu c\xF3digo postal."},cerrar:"Cerrar la comparativa",confirmar:"Los precios son los que publica la CNMC y pueden estar desfasados: conf\xEDrmalos con la comercializadora antes de contratar.",ficha:"Ficha de la oferta en la CNMC (con la web de la comercializadora)",cnmc:"Ver todas las ofertas en el comparador de la CNMC",cnmc_datos:r=>`${r?`Las ${r} ofertas`:"Todas las ofertas"}, calculadas con tu consumo y tu potencia`,pvpc_cnmc:(r,t,e)=>e?`PVPC seg\xFAn la CNMC: ${r} sin bono con los precios del \xFAltimo a\xF1o \xB7 previsi\xF3n pr\xF3ximo a\xF1o: ${t} sin bono, \u2248${e} con tu bono`:t?`PVPC sin bono seg\xFAn la CNMC: ${r} con los precios del \xFAltimo a\xF1o \xB7 previsi\xF3n pr\xF3ximo a\xF1o: ${t}`:`PVPC sin bono seg\xFAn la CNMC: ${r} con los precios del \xFAltimo a\xF1o`,enviar:r=>`Enviar a ${r}`,enviando:"Enviando\u2026",enviado:"Enviada \u2713"}},en:{titulo:"Electricity price",anterior:"Previous bill",en_curso:"Current bill",estimada_cierre:"Estimated bill",facturas:"Bills",sin_facturas:"No closed bills yet",calculada:"calculated",abrir:"Show everything",cerrar:"Close",factura_real:"Actual bill",calculada_consumo:"Calculated from consumption",real:"actual",sin_precio:"No prices",no_disponible:"Unavailable",hora_actual:"Current hour",periodos:{P1:"peak",P2:"standard",P3:"off-peak"},sin_entidad:"PVPC + Bono Social price sensor not found",comp:{boton:"Compare tariffs",comparando:"Comparing\u2026",titulo:"Tariff comparison",ultima:"Last comparison",facturas:r=>r===1?"1 bill":`${r} bills`,dias:r=>`${r} days`,ofertas:r=>`${r} CNMC offers`,tu_tarifa:"Your current tariff",pvpc_bono:"PVPC with social bonus",pvpc:"PVPC without bonus",al_anio:"/year",sin_permanencia:"no minimum stay",permanencia:"minimum stay",nuevos:"new customers only",verde:"green",espera:"Asking the CNMC with your bills. It may take a few seconds\u2026",error:"The comparison failed",sin_datos:"No comparison yet.",sin_suministro:"The supply for the comparison cannot be found",estados:{sin_codigo_postal:"The supply has no postal code (supply options).",sin_datos:"Not enough bills to compare.",cnmc_no_responde:"The CNMC comparator is not responding; try again later."},veredictos:{quedarse_con_bono:["Stay on PVPC + social bonus","With your bonus, PVPC is still the cheapest: the best free-market offer would cost you {x} more per year."],libre_aunque_pierde_bono:["There is a cheaper offer","The best free-market offer is {x} per year cheaper than what you pay with the bonus, although you would lose it. Check the conditions before switching."],mercado_libre:["You can save","With the best offer you would save {x} per year."],quedarse:["Keep your tariff","No offer beats what you pay: the best would cost you {x} more per year."]},avisos:{pierde_bono:"Switching retailer loses the social bonus.",bono_perdido:"You no longer have the social bonus: compared with what you would pay without it.",bono_nuevo:"Part of what you paid did not have your current bonus: real savings would be smaller.",cobertura_incompleta:"Not in the comparator: {ausentes}.",datos_extrapolados:"Only {dias} days of bills: payments and consumption extrapolated to a year.",facturas_estimadas:"Some bills are estimates: reconcile the real ones to refine.",sin_ofertas:"The CNMC returned no offers for your postal code."},cerrar:"Close the comparison",confirmar:"Prices are those published by the CNMC and may be out of date: confirm them with the retailer before signing up.",ficha:"Offer details at the CNMC (with the retailer website)",cnmc:"See all offers in the CNMC comparator",cnmc_datos:r=>`${r?`All ${r} offers`:"All offers"}, calculated with your consumption and power`,pvpc_cnmc:(r,t,e)=>e?`PVPC according to the CNMC: ${r} without bonus at last year's prices \xB7 next year's forecast: ${t} without bonus, \u2248${e} with your bonus`:t?`PVPC without bonus according to the CNMC: ${r} at last year's prices \xB7 next year's forecast: ${t}`:`PVPC without bonus according to the CNMC: ${r} at last year's prices`,enviar:r=>`Send to ${r}`,enviando:"Sending\u2026",enviado:"Sent \u2713"}},ca:{titulo:"Preu de la llum",anterior:"Factura del per\xEDode anterior",en_curso:"Factura del per\xEDode en curs",estimada_cierre:"Factura estimada",facturas:"Factures",sin_facturas:"Encara no hi ha factures tancades",calculada:"calculada",abrir:"Veure-ho tot",cerrar:"Tanca",factura_real:"Factura real",calculada_consumo:"Calculada amb el consum",real:"real",sin_precio:"Sense preus",no_disponible:"No disponible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"pla",P3:"vall"},sin_entidad:"No es troba el sensor de preu de PVPC + Bono Social"},gl:{titulo:"Prezo da luz",anterior:"Factura do per\xEDodo anterior",en_curso:"Factura do per\xEDodo en curso",estimada_cierre:"Factura estimada",facturas:"Facturas",sin_facturas:"A\xEDnda non hai facturas pechadas",calculada:"calculada",abrir:"Ver todo",cerrar:"Pechar",factura_real:"Factura real",calculada_consumo:"Calculada co consumo",real:"real",sin_precio:"Sen prezos",no_disponible:"Non dispo\xF1ible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"chan",P3:"val"},sin_entidad:"Non se atopa o sensor de prezo de PVPC + Bono Social"},eu:{titulo:"Argindarraren prezioa",anterior:"Aurreko aldiko faktura",en_curso:"Aldi honetako faktura",estimada_cierre:"Zenbatetsitako faktura",facturas:"Fakturak",sin_facturas:"Oraindik ez dago itxitako fakturarik",calculada:"kalkulatua",abrir:"Ikusi dena",cerrar:"Itxi",factura_real:"Benetako faktura",calculada_consumo:"Kontsumoarekin kalkulatua",real:"benetakoa",sin_precio:"Preziorik ez",no_disponible:"Ez dago erabilgarri",hora_actual:"Uneko ordua",periodos:{P1:"punta",P2:"laua",P3:"harana"},sin_entidad:"Ez da aurkitu PVPC + Bono Social-en prezio-sentsorea"}},qe=["ca","gl","eu"],de=480,Ht=.95,Dt=1.2;function nt(r,t,e){if(!r)return{ancho:de,alto:t};let a=Math.min(Math.max(r/de,Ht),Dt),o=Math.round(r/a),s=Math.round(t*o/de),i=o>de?Math.min(s,e):Math.max(s,Math.round(t*.8));return{ancho:o,alto:i}}function ze(r,t){return Math.max(1,Math.ceil(t/r))}function ue(r,t=!1){let e=t?"price_next_day_":"price_",a=[];for(let o=0;o<24;o++){let s=String(o).padStart(2,"0"),i=r?.[`${e}${s}h`];typeof i=="number"&&a.push({hora:o,precio:i});let n=r?.[`${e}${s}h_d`];typeof n=="number"&&a.push({hora:o,precio:n})}return a}var ct=new Map;function Bt(r){let t=r||"",e=ct.get(t);if(!e){let a={hourCycle:"h23",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric"};try{e=new Intl.DateTimeFormat("en-US",r?{...a,timeZone:r}:a)}catch{e=new Intl.DateTimeFormat("en-US",a)}ct.set(t,e)}return e}function ae(r=new Date,t){let e={};for(let{type:s,value:i}of Bt(t).formatToParts(r))e[s]=Number(i);let a={anio:e.year,mes:e.month,dia:e.day,hora:e.hour%24,minuto:e.minute},o=Date.UTC(a.anio,a.mes-1,a.dia,a.hora,a.minuto);return a.desfase=Math.round((o-Math.floor(r.getTime()/6e4)*6e4)/6e4),a}function V(r){return r?.config?.time_zone||void 0}function lt(r=new Date,t,e=0){let a=ae(r,t);return new Date(Date.UTC(a.anio,a.mes-1,a.dia+e)).toISOString().slice(0,10)}function dt(r=new Date,t){let e=ae(r,t);return`${e.anio}-${e.mes}-${e.dia}-${e.hora}-${e.desfase}`}function Ft(r,t=new Date,e){let a=ae(t,e).hora,o=r.findIndex(i=>i.hora===a);return ae(new Date(t.getTime()-36e5),e).hora===a&&r[o+1]?.hora===a?o+1:o}function pe(r){if(!r.length)return null;let t=0,e=0;return r.forEach((a,o)=>{a.precio<r[t].precio&&(t=o),a.precio>r[e].precio&&(e=o)}),{min:r[t],max:r[e]}}function ut(r){let t=pe(r);if(!t)return[];let e=t.max.precio-t.min.precio;return r.map(a=>e?Math.min(3,Math.floor((a.precio-t.min.precio)/e*4)):0)}function k(r,t,e=()=>!0){return Object.keys(r?.states||{}).filter(a=>a.startsWith(t)&&e(r.states[a])).sort()[0]}function me(r){return r?.states["sensor.pvpc_bs_precio"]?"sensor.pvpc_bs_precio":k(r,"sensor.",t=>"price_00h"in(t.attributes||{})&&String(t.attributes.attribution||"").includes("REE"))}var Ut={current:!0,details:!0,extremos:"columnas",graph:!0,next_day:!0,extremos_manana:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,icon_color:"price",colores:"fijo",color_hoy:te,color_manana:Re,bandas:!0,grafica_facturas:!1,facturas_meses:"6",facturas_importe:!0,grosor:"2.5",excedentes_grafica:!0};function ft(r){let t={};for(let[a,o]of[["show_current","current"],["show_details","details"],["show_graph","graph"]])typeof r[a]=="boolean"&&!(o in r)&&(t[o]=r[a]);typeof r.show_only_today=="boolean"&&!("next_day"in r)&&(t.next_day=!r.show_only_today);let e={...Ut,...t,...r};return!("extremos_manana"in r)&&e.next_day===!1&&(e.extremos_manana=!1),e}var X=class extends z{constructor(){super(...arguments);I(this,"_id",Math.random().toString(36).slice(2,8))}static async getConfigElement(){return await Wt(),document.createElement(_t)}static getStubConfig(e){return{entity:me(e)||"sensor.pvpc_bs_precio",entity_factura_actual:k(e,"sensor.pvpc_bs_factura_actual")||"sensor.pvpc_bs_factura_actual",entity_factura_anterior:k(e,"sensor.pvpc_bs_factura_anterior")||"sensor.pvpc_bs_factura_anterior",title:"PVPC",current:!0,icon_color:"price",factura:"header",factura_anterior:!1,factura_actual:!0,prevision:!0,details:!0,extremos_manana:!0,extremos:"columnas",graph:!0,next_day:!0,excedentes_grafica:!1,bandas:!0,titulo_grafica:"",grosor:"1.5",colores:"fijo",grafica_facturas:!1,facturas_importe:!0,facturas_tendencia:!0,facturas_meses:"12",grid_options:{columns:"full",rows:"auto"}}}setConfig(e){if(!e)throw new Error("Configuraci\xF3n no v\xE1lida");this._config=ft(e)}getCardSize(){return this._config?.graph===!1?3:7}getGridOptions(){return{columns:"full",rows:"auto",min_columns:6,min_rows:3}}get _cHoy(){return Le(this._config.color_hoy,te)}get _cManana(){return Le(this._config.color_manana,Re)}get _t(){return gt(this.hass)}get _idiomas(){let e=this.hass?.locale?.language||this.hass?.language||"es";return qe.includes(e.slice(0,2))?[e,"es"]:e}_num(e,a=3){return new Intl.NumberFormat(this._idiomas,{minimumFractionDigits:a,maximumFractionDigits:a}).format(e)}_entidadesVigiladas(e){let a=this._config;return[a.entity||me(e),a.entity_injection,"sensor.pvpc_bs_periodo",a.entity_factura_anterior||k(e,"sensor.pvpc_bs_factura_anterior"),a.entity_factura_actual||k(e,"sensor.pvpc_bs_factura_actual")].filter(Boolean)}shouldUpdate(e){if(!e.has("hass")||e.size>1||!this._config)return!0;let a=e.get("hass"),o=this.hass;if(!a||!o||a.locale!==o.locale||a.language!==o.language||a.themes!==o.themes)return!0;let s=new Set([...this._entidadesVigiladas(a),...this._entidadesVigiladas(o)]);for(let i of s)if(a.states[i]!==o.states[i])return!0;return this._horaPintada!==dt(new Date,V(o))}_programarCambioDeHora(){clearTimeout(this._temporizadorHora);let e=Date.now(),o=(60-ae(new Date(e),V(this.hass)).minuto)*6e4-e%6e4+1e3;this._temporizadorHora=setTimeout(()=>{this.requestUpdate(),this._programarCambioDeHora()},o)}render(){if(!this._config||!this.hass)return h;let e=V(this.hass),a=new Date;this._horaPintada=dt(a,e);let o=this._t,s=this._config.entity||me(this.hass),i=s&&this.hass.states[s];if(!i)return f`<ha-card><div class="aviso">${o.sin_entidad}</div></ha-card>`;let n=i.attributes||{},c=ue(n),l=ue(n,!0),m=this._config.next_day?l:[],d=this._config.extremos_manana!==!1?l:[],u=Array.isArray(n.colores_hoy)&&n.colores_hoy.length===c.length?n.colores_hoy:ut(c),v=Array.isArray(n.colores_manana)&&n.colores_manana.length===l.length?n.colores_manana:ut(l),p=Ft(c,a,e),x=this._config.entity_injection&&this.hass.states[this._config.entity_injection],N=x?ue(x.attributes,!0):[],w=x?{hoy:ue(x.attributes),manana:this._config.next_day?N:[]}:null,b=x?{hoy:w.hoy,manana:this._config.extremos_manana!==!1?N:[]}:null,A=this._config.bandas!==!1&&Array.isArray(n.periodos_hoy)&&n.periodos_hoy.length===c.length&&n.periodos_hoy.some(j=>j!=="P3")?n.periodos_hoy:null,C=Number(i.state),_=this._factura(),$=this._config.factura;return f`
      <ha-card>
        <div class="contenedor">
          ${f`<div class="cabecera">
                ${this._conVentana?f`<button class="abrir" aria-label=${o.abrir} @click=${()=>this._abrirVentana()}>
                      ${this._icono(p>=0?u[p]:void 0)}
                    </button>`:this._icono(p>=0?u[p]:void 0)}
                <div class="nombre">${this._config.title||""}</div>
                <div class="actual">
                  ${""}
                  <div class="precio ${this._config.current?"":"oculto"}" aria-hidden=${this._config.current?"false":"true"}>
                    ${Number.isFinite(C)?this._precioGrande(C):"\u2014"}
                    <span class="unidad"><span class="euro">€</span>/kWh</span>
                  </div>
                  ${x&&Number.isFinite(Number(x.state))?f`<div class="precio-iny ${this._config.current?"":"oculto"}" aria-hidden=${this._config.current?"false":"true"}>
                        ${this._precioIny(Number(x.state))}
                      </div>`:h}
                  ${$==="header"&&_?f`<div class="factura arriba">${_}</div>`:h}
                </div>
              </div>`}
          ${this._config.details?this._detalles(c,d,b):f`<div class="referencia" aria-hidden="true">${this._detalles(c,[],null)}</div>`}
          ${this._config.graph?this._grafica(c,m,u,v,p,A,this._config.excedentes_grafica===!1?null:w):h}
          ${_&&$==="below_chart"?f`<div class="factura abajo">${_}</div>`:h}
          ${_&&$==="below_chart_right"?f`<div class="factura abajo derecha">${_}</div>`:h}
          ${_&&$==="header"?f`<div class="factura abajo estrecha">${_}</div>`:h}
          ${this._config.grafica_facturas?this._graficaFacturas():h}
          ${this.enVentana&&k(this.hass,"button.pvpc_bs_comparar_tarifas")?f`<div class="comparar">
                <button
                  class="btn-comparar"
                  ?disabled=${this.comparando}
                  @click=${()=>this.dispatchEvent(new CustomEvent("pvpc-bs-comparar",{bubbles:!0,composed:!0}))}
                >
                  ${this.comparando?o.comp.comparando:o.comp.boton}
                </button>
              </div>`:h}
        </div>
      </ha-card>
      ${this._ventana?this._dialogo():h}
    `}get _conVentana(){return!this.enVentana}set configVentana(e){this.enVentana=!0,this.toggleAttribute("en-ventana",!0),this.setConfig(e)}_abrirVentana(){this._conVentana&&(this._ventana=!0)}_cerrarVentana(){this.renderRoot.querySelector("dialog.ventana")?.close()}_dialogo(){let e={...this._config,current:!0,details:!0,graph:!0,next_day:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,grafica_facturas:!0,extremos_manana:!0,title:""};return f`<dialog
      class="ventana ${this._anexo?"con-anexo":""}"
      @close=${()=>{this._ventana=!1,this._anexo=null}}
      @click=${a=>a.target===a.currentTarget&&this._cerrarVentana()}
      @pvpc-bs-comparar=${()=>this._comparar()}
    >
      <div class="ventana-cuerpo">
        <div class="ventana-principal">
        <div class="ventana-cabecera">
          <button class="cerrar" aria-label=${this._t.cerrar} @click=${()=>this._cerrarVentana()}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path>
            </svg>
          </button>
          <div class="ventana-titulo">${this._config.title||"PVPC + Bono Social"}</div>
        </div>
        <pvpc-bono-social-card
          .configVentana=${e}
          .hass=${this.hass}
          .comparando=${this._anexo?.estado==="cargando"}
        ></pvpc-bono-social-card>
        </div>
        ${this._anexo?this._anexoComparativa():h}
      </div>
    </dialog>`}async _comparar(){if(this._anexo?.estado==="cargando")return;let e=k(this.hass,"button.pvpc_bs_comparar_tarifas");if(e){this._anexo={estado:"cargando"},this._envio=null;try{let a=this.hass.entities?.[e]?.device_id;if(!a)throw new Error(this._t.comp.sin_suministro);await this.hass.callService("pvpc_bonosocial","comparar_tarifas",{suministro:a,enviar:!1,notificacion:!1}),this._anexo={estado:"ok"}}catch(a){this._anexo={estado:"error",mensaje:a?.message||String(a)}}await this.updateComplete,this.renderRoot.querySelector(".anexo")?.scrollIntoView?.({behavior:"smooth",block:"nearest"})}}_anexoComparativa(){let e=this._t.comp,a=f`<button class="cerrar" aria-label=${e.cerrar} @click=${()=>this._anexo=null}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path>
      </svg>
    </button>`,o=f`<div class="anexo-cabecera"><div class="ventana-titulo">${e.titulo}</div>${a}</div>`;if(this._anexo.estado==="cargando")return f`<aside class="anexo">${o}<div class="anexo-espera"><span class="girando"></span>${e.espera}</div></aside>`;let s=k(this.hass,"sensor.pvpc_bs_mejor_alternativa"),i=s&&this.hass.states[s],n=i?.attributes||{};if(this._anexo.estado==="error"||n.estado&&n.estado!=="ok"){let _=e.estados[n.estado]||this._anexo.mensaje||e.error;return f`<aside class="anexo">${o}<div class="anexo-aviso error">⚠️ ${e.error}: ${_}</div></aside>`}let c=Array.isArray(n.ofertas)?n.ofertas:[];if(!i||!n.fecha)return f`<aside class="anexo">${o}<div class="anexo-aviso">${e.sin_datos}</div></aside>`;if(!c.length)return f`<aside class="anexo">${o}<div class="anexo-aviso">${e.avisos.sin_ofertas}</div></aside>`;let l=Array.isArray(n.avisos)?n.avisos:[],m=l.includes("bono_perdido")||!["quedarse_con_bono","libre_aunque_pierde_bono"].includes(n.veredicto),d=l.includes("bono_perdido")?n.pagado_sin_bono_anual:n.pagado_anual,u=_=>`${this._num(_,2)} \u20AC`,v=typeof n.fecha=="string"?`${n.fecha.slice(8,10)}/${n.fecha.slice(5,7)} ${n.fecha.slice(11,16)}`:"",p=n.periodo||{},x=[v&&`${e.ultima}: ${v}`,p.facturas_conciliadas!==void 0&&`${e.facturas(p.facturas_conciliadas+(p.facturas_estimadas||0))}${p.dias?` (${e.dias(p.dias)})`:""}`,n.total_ofertas!==void 0&&e.ofertas(n.total_ofertas)].filter(Boolean).join(" \xB7 "),N=c[0],w=e.veredictos[n.veredicto],b=["quedarse_con_bono","quedarse"].includes(n.veredicto),A=_=>[_.oferta,_.permanencia?e.permanencia:e.sin_permanencia,_.solo_nuevos_clientes&&e.nuevos,_.verde&&e.verde].filter(Boolean).join(" \xB7 "),C=_=>(e.avisos[_]||"").replace("{ausentes}",(n.grandes_ausentes||[]).join(", ")).replace("{dias}",p.dias??"");return f`<aside class="anexo">
      ${o}
      <div class="anexo-resumen">${x}</div>
      ${w&&N?f`<div class="anexo-veredicto ${b?"bueno":"ahorro"}">
            <b>${b?"\u2705":"\u{1F4A1}"} ${w[0]}</b>
            <div>${w[1].replace("{x}",u(Math.abs(N.ahorro_anual)))}</div>
          </div>`:h}
      <div class="anexo-fila tuya">
        <div><div class="n">${e.tu_tarifa}</div><div class="o">${m?e.pvpc:e.pvpc_bono}</div></div>
        <div class="i">${u(d)}${e.al_anio}</div>
      </div>
      ${c.slice(0,4).map(_=>f`<div class="anexo-fila">
          <div>
            ${_.enlace?f`<a class="n enlace" href=${_.enlace} target="_blank" rel="noopener noreferrer" title=${e.ficha}
                  >${_.comercializadora} ↗</a
                >`:f`<div class="n">${_.comercializadora}</div>`}
            <div class="o">${A(_)}</div>
          </div>
          <div>
            <div class="i">${u(_.importe_primer_anio)}</div>
            <div class="d ${_.ahorro_anual>=0?"menos":"mas"}">
              ${_.ahorro_anual>=0?"\u2212":"+"}${u(Math.abs(_.ahorro_anual))}
            </div>
          </div>
        </div>`)}
      <div class="anexo-fila">
        <div>
          <a
            class="n enlace"
            href=${n.enlace_listado||"https://comparador.cnmc.gob.es/"}
            target="_blank"
            rel="noopener noreferrer"
            >${e.cnmc} ↗</a
          >
          <div class="o">${n.enlace_listado?e.cnmc_datos(n.total_ofertas):""}</div>
        </div>
      </div>
      ${n.pvpc_cnmc!=null?f`<div class="anexo-pvpc">
            ${e.pvpc_cnmc(u(n.pvpc_cnmc),n.pvpc_cnmc_prevision!=null?u(n.pvpc_cnmc_prevision):null,n.pvpc_cnmc_prevision_bono!=null?u(n.pvpc_cnmc_prevision_bono):null)}
          </div>`:h}
      ${l.filter(_=>e.avisos[_]).map(_=>f`<div class="anexo-nota">⚠️ ${C(_)}</div>`)}
      <div class="anexo-nota">ℹ️ ${e.confirmar}</div>
      ${n.destino?f`<div class="anexo-pie">${this._botonEnviar(s,n.destino)}</div>`:h}
    </aside>`}_botonEnviar(e,a){let o=this._t.comp,s=/telegram/i.test(a)?"Telegram":this.hass.states[a]?.attributes?.friendly_name||a,i=this.hass.entities?.[e]?.device_id;if(!i)return h;let n=async()=>{this._envio="enviando";try{await this.hass.callService("pvpc_bonosocial","enviar_comparativa",{suministro:i}),this._envio="ok"}catch(l){this._envio=l?.message||String(l)}},c=this._envio==="enviando"?o.enviando:this._envio==="ok"?o.enviado:o.enviar(s);return f`<div class="comparar">
        <button class="btn-comparar" ?disabled=${this._envio==="enviando"||this._envio==="ok"} @click=${n}>${c}</button>
      </div>
      ${this._envio&&!["enviando","ok"].includes(this._envio)?f`<div class="anexo-aviso error">⚠️ ${this._envio}</div>`:h}`}_precioGrande(e){let a=this._num(e,5),o=a.search(/[^-\d]/),s=a.slice(0,-2);return o<0?f`${s}<span class="cola">${a.slice(-2)}</span>`:f`${s.slice(0,o)}<span class="coma">${s[o]}</span>${s.slice(o+1)}<span class="cola"
            >${a.slice(-2)}</span
          >`}_precioIny(e){let a=this._num(e,5),o=a.search(/[^-\d]/),s=o<0?a:a.slice(0,o),i=o<0?"":a[o],n=o<0?"":a.slice(o+1);return f`<span class="iny-ent">${s}</span><span class="iny-coma">${i}</span><span class="iny-dec"
        >${n}</span
      ><span class="iny-hueco"> </span><span class="iny-euro">€</span>/kWh`}_icono(e){let a=e;if(this._config.icon_color==="period"){let i=this.hass.states["sensor.pvpc_bs_periodo"]?.state;a=Ot[i]}let o=this._config.icon_color==="fijo"||a===void 0?te:rt[a],s=`pvpc-bs-hueco-${this._id}`;return f`<svg class="icono" viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <mask id=${s}>
          <rect width="512" height="512" fill="#fff"></rect>
          <circle cx="256" cy="424" r="74" fill="#000"></circle>
        </mask>
      </defs>
      <g mask="url(#${s})" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M108 150 V170 M404 150 V170 M108 230 V250 M404 230 V250" stroke=${o} stroke-opacity="0.6" stroke-width="10"></path>
        <g fill=${o} fill-opacity="0.6">
          <rect x="88" y="168" width="40" height="14" rx="7"></rect>
          <rect x="384" y="168" width="40" height="14" rx="7"></rect>
          <rect x="88" y="248" width="40" height="14" rx="7"></rect>
          <rect x="384" y="248" width="40" height="14" rx="7"></rect>
        </g>
        <g stroke=${o} stroke-width="22">
          <path d="M100 150 H412 M100 150 L243.8 95 M412 150 L268.2 95"></path>
          <path d="M100 230 H412 M100 230 L228.7 178 M412 230 L283.3 178"></path>
          <path
            d="M233.8 150 L292.7 230 M278.2 150 L219.3 230 M219.3 230 L310.9 330 M292.7 230 L201.1 330 M201.1 330 L336 468 M310.9 330 L176 468"
          ></path>
          <path d="M176 468 L256 28 L336 468"></path>
        </g>
        <path d="M150 484 H362" stroke=${o} stroke-width="22"></path>
      </g>
      <circle cx="256" cy="424" r="60" fill=${o}></circle>
      <text x="256" y="426" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="84"
        text-anchor="middle" dominant-baseline="central">€</text>
    </svg>`}_hora(e){return`${String(e).padStart(2,"0")}:00`}_fecha(e=0){let a=new Date(`${lt(new Date,V(this.hass),e)}T12:00:00Z`);return new Intl.DateTimeFormat(this._idiomas,{timeZone:"UTC"}).format(a)}_triangulo(e,a){return f`<svg class="tri" viewBox="0 0 24 24" aria-hidden="true"><path d=${it[e]} fill=${a}></path></svg>`}_detalles(e,a,o){let s=this._t,i=(d,u,v)=>f`<div class="detalle">
        ${this._triangulo(d,u)}
        <div>
          ${v?f`<div class="valor">${this._num(v.precio,5)} €/kWh</div>
                <div class="horas">${this._hora(v.hora)} - ${this._hora(v.hora+1)}</div>`:f`<div class="valor">${s.no_disponible}</div>`}
        </div>
      </div>`,n=(d,u,v="")=>{let p=pe(d);return f`<div class="columna">${i(`min${v}`,u,p?.min)}${i(`max${v}`,u,p?.max)}</div>`},c=(d,u,v="")=>{let p=pe(d);return f`<div class="fila">${i(`min${v}`,u,p?.min)}${i(`max${v}`,u,p?.max)}</div>`},l=this._config.extremos==="filas"?c:n,m=(d,u,v)=>f`<div class="detalles ${this._config.extremos==="filas"?"en-filas":""}">
        ${l(d,this._cHoy,v)}${u.length?l(u,this._cManana,v):this._config.extremos==="filas"?h:this._columnaFantasma(i,v)}
      </div>`;return f`${m(e,a)}${o?m(o.hoy,o.manana,"_hueco"):h}`}_columnaFantasma(e,a){let o={precio:-1e-5,hora:0};return f`<div class="columna fantasma" aria-hidden="true">
      ${e(`min${a}`,this._cManana,o)}${e(`max${a}`,this._cManana,o)}
    </div>`}_factura(){let e=this._t;if(this._config.factura==="hidden")return null;let a=[],o=this._config.entity_factura_anterior||k(this.hass,"sensor.pvpc_bs_factura_anterior"),s=this._config.entity_factura_actual||k(this.hass,"sensor.pvpc_bs_factura_actual"),i=d=>typeof d=="string"?`${d.slice(8,10)}/${d.slice(5,7)}`:"",n=(d,u)=>d&&u?` (${i(d)} - ${i(u)})`:"",c=(d,u,v,p=h)=>f`<div>${d}<span class="sin-corte">${u}</span>: <b class="sin-corte">${this._num(v,2)} €</b>${p}</div>`,l=o&&this.hass.states[o];if(this._config.factura_anterior&&l&&Number.isFinite(Number(l.state))){let d=l.attributes||{};a.push(c(e.anterior,n(d.inicio,d.fin),Number(l.state)))}let m=s&&this.hass.states[s];if(m&&Number.isFinite(Number(m.state))){let d=m.attributes||{},u=lt(new Date,V(this.hass));this._config.factura_actual&&typeof d.acumulado=="number"&&a.push(c(e.en_curso,n(d.inicio,u),d.acumulado)),this._config.prevision!==!1&&a.push(c(e.estimada_cierre,n(d.inicio,d.fin_previsto),Number(m.state)))}return a.length?a:null}_grafica(e,a,o,s,i,n,c){let l=this._t;if(!e.length)return f`<div class="aviso">${l.sin_precio}</div>`;let m=this._cHoy,d=this._cManana,{ancho:u,alto:v}=nt(this._anchoUtil,190,300),p={izq:38,der:16,arr:24,aba:24},x=[{puntos:e,color:m},{puntos:a,color:d},...c?[{puntos:c.hoy,color:m,punteada:!0},{puntos:c.manana,color:d,punteada:!0}]:[]].filter(g=>g.puntos.length),N=x.flatMap(g=>g.puntos.map(E=>E.precio)),w=Math.min(0,...N),b=Math.max(...N);b-w<.01&&(b=w+.01);let A=(b-w)*.08;w-=Math.min(0,...N)<0?A:0,b+=A;let C=Math.max(e.length,a.length,24),_=(u-p.izq-p.der)/C,$=g=>p.izq+_*g,j=g=>$(g)+_/2,y=g=>p.arr+(v-p.arr-p.aba)*(1-(g-w)/(b-w)),T=g=>g.map((E,P)=>`${P?"V":`M${$(0).toFixed(1)},`}${y(E.precio).toFixed(1)}H${$(P+1).toFixed(1)}`).join(""),R=(g,E,P)=>M`<line class="tramo" x1=${$(P)} x2=${$(P+1)}
        y1=${y(g[P].precio)} y2=${y(g[P].precio)} stroke=${rt[E[P]??0]}></line>`,oe=(g,E,P)=>{let re=pe(g),yt=g.indexOf(re[P]),$t=y(re[P].precio)+(P==="max"?-11:4);return M`<svg class="marca" x=${j(yt)-4.5} y=${$t} width="9" height="9" viewBox="0 0 24 24">
        <path d=${it[P]} fill=${E}></path></svg>`},ge=(b-w)/4,vt=[0,1,2,3,4].map(g=>w+ge*g),S=this._cursor,Oe=(g,E,P,re)=>M`<circle class=${re} cx=${j(P)} cy=${y(g[P].precio)} r="3" fill=${E}></circle>`,ve=this._config.colores==="precio"||this._config.colores==="precio_ambos",be=this._config.colores==="precio_manana",bt=ze(_*3,28),He=this._config.titulo_grafica??"PVPC";return f`
      <div class="grafica">
        ${He?f`<div class="titulo-seccion">${He}</div>`:h}
        <svg
          viewBox="0 0 ${u} ${v}"
          role="img"
          style="--grosor: ${this._config.grosor==="1.5"?1.5:2.5}"
          aria-label=${l.titulo}
          @pointermove=${g=>this._mover(g,u,p,C)}
          @pointerleave=${()=>this._cursor=void 0}
        >
          <text class="eje" x=${p.izq-4} y=${p.arr-12} text-anchor="end">€/kWh</text>
          ${n?n.map((g,E)=>g==="P3"?h:M`<rect class=${g==="P1"?"banda-punta":"banda-llano"} x=${$(E)}
                      y=${p.arr} width=${_} height=${v-p.arr-p.aba}></rect>`):h}
          ${i>=0?M`<rect class="ahora" x=${$(i)} y=${p.arr} width=${_} height=${v-p.arr-p.aba}></rect>`:h}
          ${vt.map(g=>M`<line class="rejilla" x1=${p.izq} x2=${u-p.der} y1=${y(g)} y2=${y(g)}></line>
              <text class="eje" x=${p.izq-4} y=${y(g)+3} text-anchor="end">${this._num(Math.abs(g)<.005?0:g,2)}</text>`)}
          ${[0,3,6,9,12,15,18,21,24].map((g,E)=>M`<line class="rejilla" x1=${$(g)} x2=${$(g)} y1=${p.arr} y2=${v-p.aba}></line>
              ${E%bt?h:M`<text class="eje" x=${$(g)} y=${v-8} text-anchor="middle">${this._hora(g)}</text>`}`)}
          ${x.map(g=>M`<path class="serie ${g.punteada?"punteada":""}"
                d=${T(g.puntos)}
                stroke=${ve&&g.puntos===e||be&&g.puntos===a?"var(--secondary-text-color)":g.color}></path>`)}
          ${ve?e.map((g,E)=>R(e,o,E)):h}
          ${be?a.map((g,E)=>R(a,s,E)):h}
          ${x.flatMap(g=>[oe(g.puntos,g.color,"max"),oe(g.puntos,g.color,"min")])}
          ${S!==void 0?M`<line class="cursor" x1=${j(S)} x2=${j(S)} y1=${p.arr} y2=${v-p.aba}></line>`:h}
          ${S!==void 0&&S<e.length?Oe(e,m,S,"p-hoy"):h}
          ${S!==void 0&&S<a.length?Oe(a,d,S,"p-manana"):h}
        </svg>
        <div class="leyenda">
          ${S!==void 0?f`<span
                  ><b>${this._hora((e[S]??a[S])?.hora??S)} - ${this._hora(((e[S]??a[S])?.hora??S)+1)}</b>${n?.[S]?f` · ${l.periodos[n[S]]}`:h}</span
                >
                ${e[S]?f`<span><i class="bolita" style="background:${m}"></i>${this._num(e[S].precio,5)}</span>`:h}
                ${a[S]?f`<span><i class="bolita" style="background:${d}"></i>${this._num(a[S].precio,5)}</span>`:h}`:f`<span
                  ><i class="bolita" style="background:${ve?st:m}"></i>${this._fecha(0)}</span
                >${a.length?f`<span><i class="bolita" style="background:${be?st:d}"></i>${this._fecha(1)}</span>`:h}${i>=0?f`<span class="l-ahora">${l.hora_actual}</span>`:h}${n?f`<span class="l-punta">${l.periodos.P1}</span><span class="l-llano">${l.periodos.P2}</span>`:h}`}
        </div>
      </div>
    `}connectedCallback(){super.connectedCallback(),this._observador??=new ResizeObserver(()=>{this._medirAncho(),this._alinearFactura()}),this._observador.observe(this),this._programarCambioDeHora()}disconnectedCallback(){super.disconnectedCallback(),this._observador?.disconnect(),clearTimeout(this._temporizadorHora)}_medirAncho(){let e=this.renderRoot?.querySelector(".contenedor");if(!e?.clientWidth)return;let a=e.clientWidth-32;Math.abs(a-(this._anchoUtil??0))>=2&&(this._anchoUtil=a)}_alinearFactura(){let e=this.renderRoot?.querySelector(".cabecera .actual");if(!e)return;let a=e.querySelector(".precio"),o=[...e.querySelectorAll(".factura.arriba")],s=e.querySelector(".precio-iny");for(let b of[a,s,...o])b&&(b.style.marginRight="");let i=this.renderRoot.querySelector(".factura.derecha");i&&(i.style.marginRight="");let n=s?.querySelector(".iny-hueco");n&&(n.style.width="");let c=this.renderRoot.querySelectorAll(".detalles .columna"),l=this.renderRoot.querySelectorAll(".detalles .fila > .detalle:last-child"),m=this.renderRoot.querySelector(".cabecera .icono"),d=b=>{let A=[...b.querySelectorAll(".valor, .horas")],C=b.querySelector(".valor"),_=Math.max(0,...A.map($=>$.getBoundingClientRect().width));if(C){let $=C.cloneNode(!1);$.textContent=`-${this._num(0,5)} \u20AC/kWh`,$.style.cssText="position:absolute;visibility:hidden;white-space:nowrap",C.parentElement.appendChild($),_=Math.max(_,$.getBoundingClientRect().width),$.remove()}return _},u;if(c.length>=2){let b=c[1],A=b.parentElement.getBoundingClientRect(),C=parseFloat(getComputedStyle(b.parentElement).columnGap)||0,_=(A.width-C)/2,$=A.left+_+C+_/2,j=b.querySelector(".valor")?.getBoundingClientRect().width??0,y=b.getBoundingClientRect().width+Math.max(0,d(b)-j);u=$+y/2}else if(l.length){let b=l[0],A=b.closest(".detalles"),C=A.getBoundingClientRect(),_=parseFloat(getComputedStyle(A).columnGap)||0,$=(C.width-_)/2,j=C.left+$+_+$/2,y=b.querySelector(".valor")?.getBoundingClientRect().width??0,T=b.getBoundingClientRect().width+Math.max(0,d(b)-y);u=j+T/2}if(!Number.isFinite(u)||!e.offsetParent)return;let v=b=>m?b.getBoundingClientRect().left-m.getBoundingClientRect().right-12:1/0,p=(b,A)=>{let C=Math.min(A,v(b));C>0&&(b.style.marginRight=`${C}px`)},x=a?.querySelector(".euro");x&&p(a,x.getBoundingClientRect().right-u);let N=x?x.getBoundingClientRect().right:u;for(let b of o)p(b,b.getBoundingClientRect().right-N);this._alinearIny(a,s);let w=this.renderRoot.querySelector(".factura.derecha");if(w){w.style.marginRight="";let b=w.getBoundingClientRect().right-N;b>0&&(w.style.marginRight=`${b}px`)}}_alinearIny(e,a){let o=e?.querySelector(".coma"),s=e?.querySelector(".euro"),i=a?.querySelector(".iny-coma"),n=a?.querySelector(".iny-euro"),c=a?.querySelector(".iny-hueco");if(!o||!s||!i||!n||!c)return;let l=u=>u.getBoundingClientRect();c.style.width="0px";let m=l(s).left-l(o).left-(l(n).left-l(i).left);c.style.width=`${Math.max(0,m)}px`;let d=l(n).left-l(s).left;Math.abs(d)>.1&&(a.style.marginRight=`${d}px`)}updated(e){if(super.updated?.(e),["hass","_config","_anchoUtil","_facturas"].some(s=>e.has(s))&&(this._medirAncho(),this._alinearFactura()),e.has("_ventana")&&this._ventana){let s=this.renderRoot.querySelector("dialog.ventana");s&&!s.open&&s.showModal()}if(!this.hass||!this._config?.grafica_facturas||this._cargandoFacturas||this._facturasDelSensor())return;let a=`${this._config.estadistica_facturas||""}|${this._config.facturas_meses}`;(!this._facturasHora||Date.now()-this._facturasHora>3*3600*1e3||a!==this._facturasClave)&&this._cargarFacturas(a)}_facturasDelSensor(){if(this._config.estadistica_facturas)return null;let e=this._config.entity_factura_actual||k(this.hass,"sensor.pvpc_bs_factura_actual"),a=this.hass?.states[e]?.attributes?.facturas;if(!Array.isArray(a))return null;let o=Math.max(1,Number(this._config.facturas_meses)||6);return a.filter(s=>Number.isFinite(Number(s.total))&&s.inicio).map(s=>{let[i,n,c]=String(s.inicio).split("-").map(Number);return{inicio:new Date(Date.UTC(i,n-1,c+1,12)),total:Number(s.total),real:s.real!==!1}}).slice(-o)}async _cargarFacturas(e){this._cargandoFacturas=!0,this._facturasClave=e,this._facturasHora=Date.now();try{let a=this._config.estadistica_facturas;if(a||(a=(await this.hass.callWS({type:"recorder/list_statistic_ids",statistic_type:"mean"})).map(c=>c.statistic_id).find(c=>c.startsWith("pvpc_bonosocial:facturas_"))),!a){this._facturas=[];return}let o=Math.max(1,Number(this._config.facturas_meses)||6),s=new Date(Date.now()-(o+2)*35*86400*1e3),i=await this.hass.callWS({type:"recorder/statistics_during_period",start_time:s.toISOString(),statistic_ids:[a],period:"hour",types:["max"]});this._facturas=(i[a]||[]).filter(n=>Number.isFinite(Number(n.max))).map(n=>({inicio:new Date(n.start),total:Number(n.max),real:!0})).slice(-o)}catch(a){console.warn("pvpc-bono-social-card: no se pudieron leer las facturas",a),this._facturas=[]}finally{this._cargandoFacturas=!1}}_graficaFacturas(){let e=this._t,a=this._facturasDelSensor()??this._facturas,o=this._config.titulo_facturas??e.facturas,s=o?f`<div class="titulo-seccion">${o}</div>`:h;if(!a)return h;if(!a.length)return f`<div class="facturas">${s}<div class="aviso">${e.sin_facturas}</div></div>`;let i=Le(this._config.color_facturas,this._cHoy),n=this._config.facturas_importe!==!1,{ancho:c,alto:l}=nt(this._anchoUtil,150,220),m={izq:8,der:8,arr:n?18:6,aba:20},d=Math.max(...a.map(y=>y.total),1),u=(c-m.izq-m.der)/a.length,v=Math.min(u*.6,56),p=a.length-1,x=Math.max(...a.map(y=>this._num(y.total,2).length+2)),N=ze(u,x*6.2),w=y=>m.arr+(l-m.arr-m.aba)*(1-Math.max(y,0)/d),b=this._idiomas,A=V(this.hass),C;try{C=new Intl.DateTimeFormat(b,{month:"short",year:"2-digit",...A?{timeZone:A}:{}})}catch{C=new Intl.DateTimeFormat(b,{month:"short",year:"2-digit"})}let _={format:y=>{let T=C.formatToParts(y),R=oe=>T.find(ge=>ge.type===oe)?.value??"";return`${R("month")} ${R("year")}`}},$=Math.max(...a.map(y=>_.format(y.inicio).length)),j=ze(u,$*5.2);return f`
      <div class="facturas">
        ${s}
        <svg viewBox="0 0 ${c} ${l}" role="img" aria-label=${o||e.facturas}>
          <line class="rejilla" x1=${m.izq} x2=${c-m.der} y1=${l-m.aba} y2=${l-m.aba}></line>
          ${a.map((y,T)=>{let R=m.izq+u*(T+.5);return M`<rect class="barra ${y.real?"real":"calculada"}" x=${R-v/2+(y.real?0:1)}
                y=${w(y.total)+(y.real?0:1)} width=${v-(y.real?0:2)}
                height=${Math.max(l-m.aba-w(y.total)-(y.real?0:1),0)} rx="3"
                fill=${y.real?i:"none"} stroke=${i}>
                <title>${_.format(y.inicio)}: ${this._num(y.total,2)} € (${y.real?e.real:e.calculada})</title></rect>
              ${(p-T)%j?h:M`<text class="eje" x=${R} y=${l-6} text-anchor="middle">${_.format(y.inicio)}</text>`}`})}
          ${this._config.facturas_tendencia&&a.length>1?this._tendencia(a,u,m,w):h}
          ${n?a.map((y,T)=>(p-T)%N?h:M`<text class="importe" x=${m.izq+u*(T+.5)} y=${w(y.total)-5}
                    text-anchor="middle">${this._num(y.total,2)} €</text>`):h}
        </svg>
        ${a.some(y=>!y.real)?f`<div class="leyenda">
              ${a.some(y=>y.real)?f`<span><i class="bolita cuadro" style="background:${i}"></i>${e.factura_real}</span>`:h}
              <span><i class="bolita cuadro" style="border:2px solid ${i}"></i>${e.calculada_consumo}</span>
            </div>`:h}
      </div>
    `}_tendencia(e,a,o,s){let i=e.length,n=(i-1)/2,c=e.reduce((p,x)=>p+x.total,0)/i,l=0,m=0;e.forEach((p,x)=>{l+=(x-n)*(p.total-c),m+=(x-n)**2});let d=l/m,u=p=>c+d*(p-n),v=p=>o.izq+a*(p+.5);return M`<line class="tendencia" x1=${v(0)} y1=${s(u(0))} x2=${v(i-1)} y2=${s(u(i-1))}></line>`}_mover(e,a,o,s){let i=e.currentTarget.getBoundingClientRect(),n=(e.clientX-i.left)/i.width*a,c=Math.floor((n-o.izq)/(a-o.izq-o.der)*s);this._cursor=c>=0&&c<s?c:void 0}};I(X,"properties",{hass:{attribute:!1},_config:{state:!0},_cursor:{state:!0},_facturas:{state:!0},_ventana:{state:!0},_anexo:{state:!0},_envio:{state:!0},comparando:{attribute:!1},_anchoUtil:{state:!0}}),I(X,"styles",$e`
    :host {
      --pvpc-bs-verde: var(--success-color, #43a047);
      --pvpc-bs-amarillo: #f9c80e;
      --pvpc-bs-naranja: var(--warning-color, #fb8c00);
      --pvpc-bs-rojo: var(--error-color, #e53935);
    }
    /* Sin mínimos y máximos: su rejilla, invisible y sin alto, solo para alinear la cabecera igual. */
    .referencia {
      height: 0;
      overflow: hidden;
      visibility: hidden;
      margin-top: -12px;
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
    .iny-hueco {
      display: inline-block;
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
      color: var(--primary-text-color);
    }
    /* Hoy centrado en la mitad izquierda y mañana en la derecha (aunque mañana no esté). */
    .detalles {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 12px;
    }
    .columna.fantasma {
      visibility: hidden;
    }
    .columna {
      display: flex;
      flex-direction: column;
      gap: 8px;
      justify-self: center;
    }
    /* En filas: un día por fila, mínimo a la izquierda y máximo a la derecha. Las dos columnas
       miden lo que su dato más largo, para que los triángulos de hoy y mañana queden alineados. */
    .detalles.en-filas {
      grid-template-columns: repeat(2, max-content);
      justify-content: space-around;
      row-gap: 8px;
    }
    .fila {
      display: contents;
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
    /* Grosor de las líneas (opción «grosor»: 1,5 o 2,5). */
    .serie {
      fill: none;
      stroke-width: var(--grosor, 2.5);
    }
    /* Excedentes: mismo grosor que hoy y mañana, en puntos redondos (hueco proporcional). */
    .serie.punteada {
      stroke-width: var(--grosor, 2.5);
      stroke-dasharray: 0.1 calc(var(--grosor, 2.5) * 2);
      stroke-linecap: round;
    }
    .tramo {
      stroke-width: calc(var(--grosor, 2.5) + 0.5);
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
    /* Bajo la gráfica (izquierda o derecha) y en pantallas estrechas: mismo tamaño que en la cabecera. */
    .factura.abajo {
      font-size: 0.85em;
    }
    .precio.oculto,
    .precio-iny.oculto {
      visibility: hidden;
    }
    /* A la derecha, además, en la vertical de los € de la cabecera. */
    .factura.derecha {
      align-items: flex-end;
      text-align: right;
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
    /* Comparativa: anexo a la derecha de la ventana; en pantallas estrechas, debajo. */
    dialog.ventana.con-anexo {
      width: min(1060px, calc(100vw - 32px));
    }
    dialog.con-anexo .ventana-cuerpo {
      display: grid;
      grid-template-columns: minmax(0, 560px) minmax(0, 1fr);
      /* Las dos columnas igual de altas: «Enviar» queda a la altura de «Comparar tarifas» y solo
         baja si el anexo necesita más líneas. */
      align-items: stretch;
    }
    @media (max-width: 900px) {
      dialog.con-anexo .ventana-cuerpo {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    .anexo {
      display: flex;
      flex-direction: column;
      padding: 12px 18px 16px;
      border-left: 1px solid var(--divider-color, rgba(127, 127, 127, 0.25));
      font-size: 0.95em;
    }
    @media (max-width: 900px) {
      .anexo {
        border-left: none;
        border-top: 1px solid var(--divider-color, rgba(127, 127, 127, 0.25));
      }
    }
    .anexo-pvpc {
      padding: 8px 0 2px;
      font-size: 0.8em;
      font-style: italic;
      color: var(--secondary-text-color);
    }
    .anexo-pie {
      margin-top: auto;
      /* Mismo tamaño que «Comparar tarifas» (el anexo va al 0,95). */
      font-size: calc(1em / 0.95);
    }
    .anexo-cabecera {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 40px;
    }
    .anexo-resumen {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin: 2px 0 12px;
    }
    .anexo-veredicto {
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 10px;
      line-height: 1.4;
    }
    .anexo-veredicto b {
      display: block;
      font-size: 1.05em;
      margin-bottom: 2px;
    }
    .anexo-veredicto.bueno {
      background: rgba(67, 160, 71, 0.15);
      border: 1px solid rgba(67, 160, 71, 0.5);
    }
    .anexo-veredicto.ahorro {
      background: rgba(255, 179, 0, 0.14);
      border: 1px solid rgba(255, 179, 0, 0.5);
    }
    .anexo-fila {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color, rgba(127, 127, 127, 0.2));
    }
    .anexo-fila .n {
      font-weight: 600;
    }
    .enlace {
      color: inherit;
      text-decoration: none;
    }
    .enlace:hover {
      text-decoration: underline;
      color: var(--primary-color, #03a9f4);
    }
    a.n.enlace {
      display: inline-block;
    }
    .anexo-fila .o {
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }
    .anexo-fila .i {
      text-align: right;
      font-weight: 700;
      white-space: nowrap;
    }
    .anexo-fila .d {
      text-align: right;
      font-size: 0.8em;
      white-space: nowrap;
    }
    .anexo-fila .d.mas {
      color: var(--error-color, #e57373);
    }
    .anexo-fila .d.menos,
    .anexo-fila.tuya .i {
      color: var(--success-color, #43a047);
    }
    .anexo-nota {
      font-size: 0.78em;
      color: var(--secondary-text-color);
      margin-top: 8px;
      line-height: 1.35;
    }
    .anexo-aviso,
    .anexo-espera {
      padding: 16px 0;
      color: var(--secondary-text-color);
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .anexo-aviso.error {
      color: var(--error-color, #e57373);
    }
    .girando {
      width: 18px;
      height: 18px;
      flex: none;
      border: 2px solid var(--divider-color, rgba(127, 127, 127, 0.4));
      border-top-color: var(--primary-color, #03a9f4);
      border-radius: 50%;
      animation: girar 0.9s linear infinite;
    }
    @keyframes girar {
      to {
        transform: rotate(360deg);
      }
    }
    .comparar {
      display: flex;
      justify-content: center;
      margin: 14px 0 4px;
    }
    .btn-comparar {
      border: none;
      border-radius: 18px;
      padding: 8px 18px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      background: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
    }
    .btn-comparar:disabled {
      opacity: 0.6;
      cursor: progress;
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
  `);var _t=`${he}-editor`;function _e(r,t){let[e,a]=r.split(" / ");return["es",...qe].includes(t)?e:a??e}function Vt(r,t={}){let e=l=>({select:{mode:"dropdown",options:l.map(([m,d])=>({value:m,label:_e(d,r)}))}}),a=l=>({name:l,selector:{boolean:{}}}),o=(l,m,d,u)=>({type:"expandable",name:"",flatten:!0,title:_e(It[l],r),icon:m,expanded:d,schema:u.filter(Boolean)}),s=t.factura!=="hidden",i=t.graph!==!1,n=i&&t.next_day!==!1||t.details!==!1&&t.extremos_manana!==!1,c=!!t.grafica_facturas;return[o("cabecera","mdi:page-layout-header",!1,[a("current"),{name:"icon_color",selector:e([["price","Por precio / By price"],["period","Por periodo P1-P3 / By period"],["fijo","Azul fijo / Fixed blue"]])},{name:"title",selector:{text:{}}}]),o("factura","mdi:receipt-text-outline",!1,[s&&a("factura_anterior"),s&&a("factura_actual"),s&&a("prevision"),{name:"factura",selector:e([["header","Arriba, junto al precio / Top, next to the price"],["below_chart","Bajo la gr\xE1fica, a la izquierda / Below the chart, left"],["below_chart_right","Bajo la gr\xE1fica, a la derecha / Below the chart, right"],["hidden","No mostrar / Don't show"]])}]),o("extremos","mdi:arrow-up-down",!1,[a("details"),t.details!==!1&&a("extremos_manana"),(t.details!==!1||i)&&(t.hay_excedentes||t.entity_injection)&&a("mostrar_excedentes"),t.details!==!1&&{name:"extremos",selector:e([["columnas","Columnas: hoy | ma\xF1ana / Columns: today | tomorrow"],["filas","Filas: un d\xEDa por fila / Rows: one day per row"]])}]),o("grafica","mdi:chart-line",!1,[a("graph"),i&&a("next_day"),i&&t.entity_injection&&a("excedentes_grafica"),i&&a("bandas"),i&&{name:"titulo_grafica",selector:{text:{}}},i&&{name:"grosor",selector:e([["1.5","Fino (1,5) / Thin (1.5)"],["2.5","Normal (2,5) / Normal (2.5)"]])},i&&{name:"colores",selector:e([["fijo","Un color por d\xEDa / One colour per day"],["precio","Hoy por precio / Today by price"],t.next_day!==!1&&["precio_manana","Ma\xF1ana por precio / Tomorrow by price"]].filter(Boolean))},i&&{name:"color_hoy",selector:{color_rgb:{}}},n&&{name:"color_manana",selector:{color_rgb:{}}}]),o("facturas","mdi:chart-bar",!1,[a("grafica_facturas"),c&&a("facturas_importe"),c&&a("facturas_tendencia"),c&&{name:"facturas_meses",selector:e(["3","5","6","9","12"].map(l=>[l,l]))},c&&{name:"titulo_facturas",selector:{text:{}}},c&&{name:"color_facturas",selector:{color_rgb:{}}}]),o("avanzado","mdi:tune-variant",!1,[{name:"entity",selector:{entity:{domain:"sensor"}}},{name:"entity_factura_actual",selector:{entity:{domain:"sensor"}}},{name:"entity_factura_anterior",selector:{entity:{domain:"sensor"}}},{name:"entity_injection",selector:{entity:{domain:"sensor"}}}])]}var It={cabecera:"Cabecera / Header",factura:"Importes de la factura / Bill amounts",extremos:"M\xEDnimos y m\xE1ximos / Min and max",grafica:"Gr\xE1fica de precios / Price chart",facturas:"Facturas / Bills",avanzado:"Avanzado / Advanced"};function ee(r,t){if(Array.isArray(r)&&r.length===3)return r.map(Number);let e=typeof r=="string"?r.trim():"",a=/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(e)?.[1];if(a){let s=a.length===3?[...a].map(i=>i+i).join(""):a;return[0,2,4].map(i=>parseInt(s.slice(i,i+2),16))}let o=/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(e);if(o)return o.slice(1,4).map(Number);if(e){let s=document.createElement("canvas").getContext("2d");if(s.fillStyle="#000000",s.fillStyle=e,s.fillStyle!=="#000000"||e.toLowerCase()==="black")return ee(s.fillStyle)}return t===void 0?[0,0,0]:ee(t)}function ht(r,t){let e=ft(r);return{...e,entity:e.entity||me(t),entity_factura_actual:e.entity_factura_actual||k(t,"sensor.pvpc_bs_factura_actual"),entity_factura_anterior:e.entity_factura_anterior||k(t,"sensor.pvpc_bs_factura_anterior"),color_hoy:ee(e.color_hoy,te),color_manana:ee(e.color_manana,Re),color_facturas:ee(e.color_facturas??e.color_hoy,te),facturas_meses:String(e.facturas_meses),grafica_facturas:!!e.grafica_facturas,mostrar_excedentes:!!e.entity_injection,hay_excedentes:!!k(t,"sensor.pvpc_bs_precio_excedentes"),titulo_grafica:e.titulo_grafica??"PVPC",titulo_facturas:e.titulo_facturas??gt(t).facturas}}function gt(r){let t=(r?.locale?.language||r?.language||"es").slice(0,2);return qe.includes(t)?{...le.es,...le[t]}:le[t]||le.en}async function Wt(){if(!customElements.get("ha-form"))try{await(await(await window.loadCardHelpers?.())?.createCardElement({type:"entities",entities:[]}))?.constructor?.getConfigElement?.()}catch(r){console.warn("pvpc-bono-social-card: no se pudo cargar el editor",r)}}var fe=class extends z{setConfig(t){this._config=t}get _idioma(){return(this.hass?.locale?.language||this.hass?.language||"es").slice(0,2)}render(){if(!this._config||!this.hass)return h;let t=ht(this._config,this.hass);return f`<ha-form
      .hass=${this.hass}
      .data=${t}
      .schema=${Vt(this._idioma,t)}
      .computeLabel=${e=>pt[e.name]?_e(pt[e.name],this._idioma):e.title??e.name}
      .computeHelper=${e=>mt[e.name]?_e(mt[e.name],this._idioma):""}
      @value-changed=${this._alCambiar}
    ></ha-form>`}_alCambiar(t){t.stopPropagation();let e=t.detail.value,a=ht(this._config,this.hass),o={...this._config};for(let s of new Set([...Object.keys(e),...Object.keys(a)]))if(s!=="hay_excedentes"&&JSON.stringify(e[s])!==JSON.stringify(a[s])){if(s==="mostrar_excedentes"){e[s]?o.entity_injection=k(this.hass,"sensor.pvpc_bs_precio_excedentes"):delete o.entity_injection;continue}["title","titulo_grafica","titulo_facturas"].includes(s)&&e[s]===void 0?o[s]="":e[s]===void 0?delete o[s]:o[s]=e[s]}o.entity_injection||delete o.entity_injection,this._config=o,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:o},bubbles:!0,composed:!0}))}};I(fe,"properties",{hass:{attribute:!1},_config:{state:!0}});var pt={entity:"Sensor de precio / Price sensor",title:"T\xEDtulo de la tarjeta / Card title",factura:"Posici\xF3n en la tarjeta / Position on the card",factura_actual:"Factura periodo en curso / Current bill",factura_anterior:"Factura periodo anterior / Previous bill",prevision:"Factura estimada / Estimated bill",current:"Precio actual / Current price",details:"Mostrar m\xEDnimos y m\xE1ximos / Show min and max",extremos:"Disposici\xF3n / Layout",graph:"Mostrar la gr\xE1fica / Show the chart",next_day:"Mostrar ma\xF1ana / Show tomorrow",extremos_manana:"Mostrar ma\xF1ana / Show tomorrow",icon_color:"Color del icono / Icon colour",colores:"Colores de la gr\xE1fica / Chart colours",grosor:"Grosor de las l\xEDneas / Line width",color_hoy:"Color de hoy / Today's colour",color_manana:"Color de ma\xF1ana / Tomorrow's colour",bandas:"Punta y llano sombreados / Shade peak hours",entity_injection:"Sensor de precio de excedentes / Surplus price sensor",mostrar_excedentes:"Mostrar precios de los excedentes / Show surplus prices",excedentes_grafica:"Mostrar excedentes / Show surplus",grafica_facturas:"Mostrar facturas / Show bills",facturas_importe:"Importe sobre las barras / Amount above bars",facturas_tendencia:"L\xEDnea de tendencia / Trend line",facturas_meses:"Cantidad de facturas / Number of bills",color_facturas:"Color de las barras / Bar colour",titulo_grafica:"T\xEDtulo de la gr\xE1fica de precios / Price chart title",titulo_facturas:"T\xEDtulo de la gr\xE1fica / Chart title",entity_factura_actual:"Sensor de factura en curso / Current bill sensor",entity_factura_anterior:"Sensor de factura anterior / Previous bill sensor"},mt={current:"Precio de esta hora, en grande; el icono sigue / This hour's price, in large type; the icon stays",icon_color:"Por precio: verde barato, rojo caro / By price: green cheap, red expensive",title:"B\xF3rralo para dejar la tarjeta sin t\xEDtulo / Clear it to leave the card untitled",factura:"D\xF3nde van las l\xEDneas de factura / Where the bill lines go",factura_anterior:"\xDAltimo periodo cerrado / Last closed period",factura_actual:"Lo gastado en el periodo hasta hoy / Spent so far this period",prevision:"Lo que se prev\xE9 pagar al cerrar el periodo / Expected total at the end of the period",details:"Hora m\xE1s barata y m\xE1s cara de hoy y de ma\xF1ana / Cheapest and most expensive hour today and tomorrow",extremos:"Columnas: hoy a la izquierda y ma\xF1ana a la derecha. Filas: hoy arriba y ma\xF1ana debajo / Columns: today left, tomorrow right. Rows: today above, tomorrow below",graph:"Precio de cada hora en escalones / Hourly price as steps",next_day:"Solo en la gr\xE1fica, cuando ya hay precios (sobre las 20:30) / Chart only, once prices are out (around 20:30)",extremos_manana:"M\xEDnimo y m\xE1ximo de ma\xF1ana, cuando ya hay precios (sobre las 20:30) / Tomorrow's min and max, once prices are out (around 20:30)",titulo_grafica:"B\xF3rralo para dejar la gr\xE1fica sin t\xEDtulo / Clear it to leave the chart untitled",grosor:"De hoy, ma\xF1ana y excedentes / Today, tomorrow and surplus",colores:"\xABPor precio\xBB colorea cada hora del d\xEDa elegido seg\xFAn lo cara que es / \xABBy price\xBB colours each hour of that day by how expensive it is",color_hoy:"La l\xEDnea y los tri\xE1ngulos de hoy / Today's line and triangles",color_manana:"La l\xEDnea y los tri\xE1ngulos de ma\xF1ana / Tomorrow's line and triangles",facturas_importe:"El importe de cada factura encima de su barra / Each bill's amount above its bar",facturas_meses:"Cu\xE1ntas facturas cerradas se ven, las m\xE1s recientes / How many closed bills are shown, the latest",color_facturas:"El color de las barras / The bar colour",bandas:"Fondo de color en las horas punta y llano de los laborables / Shaded peak and standard hours on working days",entity_injection:"Se elige solo con \xABMostrar precios de los excedentes\xBB / Set by \xABShow surplus prices\xBB",mostrar_excedentes:"Activa los excedentes en la tarjeta (tri\xE1ngulos huecos); necesita la API privada de ESIOS / Enables surplus on the card (hollow triangles); needs the ESIOS private API",excedentes_grafica:"Su precio en punteado en la gr\xE1fica / Its price, dotted, on the chart",grafica_facturas:"Barras con las \xFAltimas facturas cerradas / Bars with the latest closed bills",facturas_tendencia:"L\xEDnea discontinua con la tendencia / Dashed trend line",titulo_facturas:"B\xF3rralo para dejar la gr\xE1fica sin t\xEDtulo / Clear it to leave the chart untitled",entity:"Se detecta sola; c\xE1mbialo solo si tienes varias entradas / Detected automatically; change it only with several entries",entity_factura_actual:"Se detecta solo / Detected automatically",entity_factura_anterior:"Se detecta solo / Detected automatically"};customElements.get(he)||(customElements.define(he,X),customElements.define(_t,fe),window.customCards=window.customCards||[],window.customCards.push({type:he,name:"PVPC + Bono Social",description:"Precio del PVPC de hoy y ma\xF1ana y la factura con o sin bono social.",preview:!0,documentationURL:"https://github.com/BaRDaHL/pvpc_bonosocial"}),console.info(`%c PVPC + Bono Social %c ${qt} `,"background:#43a047;color:#fff",""));
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
