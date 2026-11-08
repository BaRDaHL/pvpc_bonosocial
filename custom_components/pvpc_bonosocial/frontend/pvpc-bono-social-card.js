var vt=Object.defineProperty;var bt=(o,t,e)=>t in o?vt(o,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):o[t]=e;var B=(o,t,e)=>bt(o,typeof t!="symbol"?t+"":t,e);var ie=globalThis,se=ie.ShadowRoot&&(ie.ShadyCSS===void 0||ie.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ve=Symbol(),Re=new WeakMap,W=class{constructor(t,e,a){if(this._$cssResult$=!0,a!==ve)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(se&&t===void 0){let a=e!==void 0&&e.length===1;a&&(t=Re.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),a&&Re.set(e,t))}return t}toString(){return this.cssText}},qe=o=>new W(typeof o=="string"?o:o+"",void 0,ve),be=(o,...t)=>{let e=o.length===1?o[0]:t.reduce((a,r,i)=>a+(s=>{if(s._$cssResult$===!0)return s.cssText;if(typeof s=="number")return s;throw Error("Value passed to 'css' function must be a 'css' function result: "+s+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+o[i+1],o[0]);return new W(e,o,ve)},Ue=(o,t)=>{if(se)o.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let a=document.createElement("style"),r=ie.litNonce;r!==void 0&&a.setAttribute("nonce",r),a.textContent=e.cssText,o.appendChild(a)}},$e=se?o=>o:o=>o instanceof CSSStyleSheet?(t=>{let e="";for(let a of t.cssRules)e+=a.cssText;return qe(e)})(o):o;var{is:$t,defineProperty:yt,getOwnPropertyDescriptor:xt,getOwnPropertyNames:wt,getOwnPropertySymbols:Ct,getPrototypeOf:At}=Object,ne=globalThis,De=ne.trustedTypes,St=De?De.emptyScript:"",Et=ne.reactiveElementPolyfillSupport,Z=(o,t)=>o,ye={toAttribute(o,t){switch(t){case Boolean:o=o?St:null;break;case Object:case Array:o=o==null?o:JSON.stringify(o)}return o},fromAttribute(o,t){let e=o;switch(t){case Boolean:e=o!==null;break;case Number:e=o===null?null:Number(o);break;case Object:case Array:try{e=JSON.parse(o)}catch{e=null}}return e}},Fe=(o,t)=>!$t(o,t),Ve={attribute:!0,type:String,converter:ye,reflect:!1,useDefault:!1,hasChanged:Fe};Symbol.metadata??=Symbol("metadata"),ne.litPropertyMetadata??=new WeakMap;var L=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=Ve){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let a=Symbol(),r=this.getPropertyDescriptor(t,a,e);r!==void 0&&yt(this.prototype,t,r)}}static getPropertyDescriptor(t,e,a){let{get:r,set:i}=xt(this.prototype,t)??{get(){return this[e]},set(s){this[e]=s}};return{get:r,set(s){let n=r?.call(this);i?.call(this,s),this.requestUpdate(t,n,a)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Ve}static _$Ei(){if(this.hasOwnProperty(Z("elementProperties")))return;let t=At(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(Z("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Z("properties"))){let e=this.properties,a=[...wt(e),...Ct(e)];for(let r of a)this.createProperty(r,e[r])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[a,r]of e)this.elementProperties.set(a,r)}this._$Eh=new Map;for(let[e,a]of this.elementProperties){let r=this._$Eu(e,a);r!==void 0&&this._$Eh.set(r,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let a=new Set(t.flat(1/0).reverse());for(let r of a)e.unshift($e(r))}else t!==void 0&&e.push($e(t));return e}static _$Eu(t,e){let a=e.attribute;return a===!1?void 0:typeof a=="string"?a:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let a of e.keys())this.hasOwnProperty(a)&&(t.set(a,this[a]),delete this[a]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Ue(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,a){this._$AK(t,a)}_$ET(t,e){let a=this.constructor.elementProperties.get(t),r=this.constructor._$Eu(t,a);if(r!==void 0&&a.reflect===!0){let i=(a.converter?.toAttribute!==void 0?a.converter:ye).toAttribute(e,a.type);this._$Em=t,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(t,e){let a=this.constructor,r=a._$Eh.get(t);if(r!==void 0&&this._$Em!==r){let i=a.getPropertyOptions(r),s=typeof i.converter=="function"?{fromAttribute:i.converter}:i.converter?.fromAttribute!==void 0?i.converter:ye;this._$Em=r;let n=s.fromAttribute(e,i.type);this[r]=n??this._$Ej?.get(r)??n,this._$Em=null}}requestUpdate(t,e,a,r=!1,i){if(t!==void 0){let s=this.constructor;if(r===!1&&(i=this[t]),a??=s.getPropertyOptions(t),!((a.hasChanged??Fe)(i,e)||a.useDefault&&a.reflect&&i===this._$Ej?.get(t)&&!this.hasAttribute(s._$Eu(t,a))))return;this.C(t,e,a)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:a,reflect:r,wrapped:i},s){a&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,s??e??this[t]),i!==!0||s!==void 0)||(this._$AL.has(t)||(this.hasUpdated||a||(e=void 0),this._$AL.set(t,e)),r===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[r,i]of this._$Ep)this[r]=i;this._$Ep=void 0}let a=this.constructor.elementProperties;if(a.size>0)for(let[r,i]of a){let{wrapped:s}=i,n=this[r];s!==!0||this._$AL.has(r)||n===void 0||this.C(r,void 0,i,n)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(a=>a.hostUpdate?.()),this.update(e)):this._$EM()}catch(a){throw t=!1,this._$EM(),a}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};L.elementStyles=[],L.shadowRootOptions={mode:"open"},L[Z("elementProperties")]=new Map,L[Z("finalized")]=new Map,Et?.({ReactiveElement:L}),(ne.reactiveElementVersions??=[]).push("2.1.2");var Pe=globalThis,Ie=o=>o,ce=Pe.trustedTypes,Be=ce?ce.createPolicy("lit-html",{createHTML:o=>o}):void 0,Je="$lit$",j=`lit$${Math.random().toFixed(9).slice(2)}$`,Qe="?"+j,Pt=`<${Qe}>`,q=document,K=()=>q.createComment(""),Y=o=>o===null||typeof o!="object"&&typeof o!="function",ke=Array.isArray,kt=o=>ke(o)||typeof o?.[Symbol.iterator]=="function",xe=`[ 	
\f\r]`,G=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,We=/-->/g,Ze=/>/g,H=RegExp(`>|${xe}(?:([^\\s"'>=/]+)(${xe}*=${xe}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ge=/'/g,Ke=/"/g,Xe=/^(?:script|style|textarea|title)$/i,Me=o=>(t,...e)=>({_$litType$:o,strings:t,values:e}),_=Me(1),S=Me(2),Gt=Me(3),U=Symbol.for("lit-noChange"),d=Symbol.for("lit-nothing"),Ye=new WeakMap,R=q.createTreeWalker(q,129);function et(o,t){if(!ke(o)||!o.hasOwnProperty("raw"))throw Error("invalid template strings array");return Be!==void 0?Be.createHTML(t):t}var Mt=(o,t)=>{let e=o.length-1,a=[],r,i=t===2?"<svg>":t===3?"<math>":"",s=G;for(let n=0;n<e;n++){let c=o[n],p,f,l=-1,m=0;for(;m<c.length&&(s.lastIndex=m,f=s.exec(c),f!==null);)m=s.lastIndex,s===G?f[1]==="!--"?s=We:f[1]!==void 0?s=Ze:f[2]!==void 0?(Xe.test(f[2])&&(r=RegExp("</"+f[2],"g")),s=H):f[3]!==void 0&&(s=H):s===H?f[0]===">"?(s=r??G,l=-1):f[1]===void 0?l=-2:(l=s.lastIndex-f[2].length,p=f[1],s=f[3]===void 0?H:f[3]==='"'?Ke:Ge):s===Ke||s===Ge?s=H:s===We||s===Ze?s=G:(s=H,r=void 0);let u=s===H&&o[n+1].startsWith("/>")?" ":"";i+=s===G?c+Pt:l>=0?(a.push(p),c.slice(0,l)+Je+c.slice(l)+j+u):c+j+(l===-2?n:u)}return[et(o,i+(o[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),a]},J=class o{constructor({strings:t,_$litType$:e},a){let r;this.parts=[];let i=0,s=0,n=t.length-1,c=this.parts,[p,f]=Mt(t,e);if(this.el=o.createElement(p,a),R.currentNode=this.el.content,e===2||e===3){let l=this.el.content.firstChild;l.replaceWith(...l.childNodes)}for(;(r=R.nextNode())!==null&&c.length<n;){if(r.nodeType===1){if(r.hasAttributes())for(let l of r.getAttributeNames())if(l.endsWith(Je)){let m=f[s++],u=r.getAttribute(l).split(j),h=/([.?@])?(.*)/.exec(m);c.push({type:1,index:i,name:h[2],strings:u,ctor:h[1]==="."?Ce:h[1]==="?"?Ae:h[1]==="@"?Se:F}),r.removeAttribute(l)}else l.startsWith(j)&&(c.push({type:6,index:i}),r.removeAttribute(l));if(Xe.test(r.tagName)){let l=r.textContent.split(j),m=l.length-1;if(m>0){r.textContent=ce?ce.emptyScript:"";for(let u=0;u<m;u++)r.append(l[u],K()),R.nextNode(),c.push({type:2,index:++i});r.append(l[m],K())}}}else if(r.nodeType===8)if(r.data===Qe)c.push({type:2,index:i});else{let l=-1;for(;(l=r.data.indexOf(j,l+1))!==-1;)c.push({type:7,index:i}),l+=j.length-1}i++}}static createElement(t,e){let a=q.createElement("template");return a.innerHTML=t,a}};function V(o,t,e=o,a){if(t===U)return t;let r=a!==void 0?e._$Co?.[a]:e._$Cl,i=Y(t)?void 0:t._$litDirective$;return r?.constructor!==i&&(r?._$AO?.(!1),i===void 0?r=void 0:(r=new i(o),r._$AT(o,e,a)),a!==void 0?(e._$Co??=[])[a]=r:e._$Cl=r),r!==void 0&&(t=V(o,r._$AS(o,t.values),r,a)),t}var we=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:a}=this._$AD,r=(t?.creationScope??q).importNode(e,!0);R.currentNode=r;let i=R.nextNode(),s=0,n=0,c=a[0];for(;c!==void 0;){if(s===c.index){let p;c.type===2?p=new Q(i,i.nextSibling,this,t):c.type===1?p=new c.ctor(i,c.name,c.strings,this,t):c.type===6&&(p=new Ee(i,this,t)),this._$AV.push(p),c=a[++n]}s!==c?.index&&(i=R.nextNode(),s++)}return R.currentNode=q,r}p(t){let e=0;for(let a of this._$AV)a!==void 0&&(a.strings!==void 0?(a._$AI(t,a,e),e+=a.strings.length-2):a._$AI(t[e])),e++}},Q=class o{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,a,r){this.type=2,this._$AH=d,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=a,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=V(this,t,e),Y(t)?t===d||t==null||t===""?(this._$AH!==d&&this._$AR(),this._$AH=d):t!==this._$AH&&t!==U&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):kt(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==d&&Y(this._$AH)?this._$AA.nextSibling.data=t:this.T(q.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:a}=t,r=typeof a=="number"?this._$AC(t):(a.el===void 0&&(a.el=J.createElement(et(a.h,a.h[0]),this.options)),a);if(this._$AH?._$AD===r)this._$AH.p(e);else{let i=new we(r,this),s=i.u(this.options);i.p(e),this.T(s),this._$AH=i}}_$AC(t){let e=Ye.get(t.strings);return e===void 0&&Ye.set(t.strings,e=new J(t)),e}k(t){ke(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,a,r=0;for(let i of t)r===e.length?e.push(a=new o(this.O(K()),this.O(K()),this,this.options)):a=e[r],a._$AI(i),r++;r<e.length&&(this._$AR(a&&a._$AB.nextSibling,r),e.length=r)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let a=Ie(t).nextSibling;Ie(t).remove(),t=a}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},F=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,a,r,i){this.type=1,this._$AH=d,this._$AN=void 0,this.element=t,this.name=e,this._$AM=r,this.options=i,a.length>2||a[0]!==""||a[1]!==""?(this._$AH=Array(a.length-1).fill(new String),this.strings=a):this._$AH=d}_$AI(t,e=this,a,r){let i=this.strings,s=!1;if(i===void 0)t=V(this,t,e,0),s=!Y(t)||t!==this._$AH&&t!==U,s&&(this._$AH=t);else{let n=t,c,p;for(t=i[0],c=0;c<i.length-1;c++)p=V(this,n[a+c],e,c),p===U&&(p=this._$AH[c]),s||=!Y(p)||p!==this._$AH[c],p===d?t=d:t!==d&&(t+=(p??"")+i[c+1]),this._$AH[c]=p}s&&!r&&this.j(t)}j(t){t===d?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},Ce=class extends F{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===d?void 0:t}},Ae=class extends F{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==d)}},Se=class extends F{constructor(t,e,a,r,i){super(t,e,a,r,i),this.type=5}_$AI(t,e=this){if((t=V(this,t,e,0)??d)===U)return;let a=this._$AH,r=t===d&&a!==d||t.capture!==a.capture||t.once!==a.once||t.passive!==a.passive,i=t!==d&&(a===d||r);r&&this.element.removeEventListener(this.name,this,a),i&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},Ee=class{constructor(t,e,a){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=a}get _$AU(){return this._$AM._$AU}_$AI(t){V(this,t)}};var Nt=Pe.litHtmlPolyfillSupport;Nt?.(J,Q),(Pe.litHtmlVersions??=[]).push("3.3.3");var tt=(o,t,e)=>{let a=e?.renderBefore??t,r=a._$litPart$;if(r===void 0){let i=e?.renderBefore??null;a._$litPart$=r=new Q(t.insertBefore(K(),i),i,void 0,e??{})}return r._$AI(o),r};var Ne=globalThis,z=class extends L{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=tt(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return U}};z._$litElement$=!0,z.finalized=!0,Ne.litElementHydrateSupport?.({LitElement:z});var Lt=Ne.litElementPolyfillSupport;Lt?.({LitElement:z});(Ne.litElementVersions??=[]).push("4.2.2");var zt="1.2.3",he="pvpc-bono-social-card",at=["var(--pvpc-bs-verde)","var(--pvpc-bs-amarillo)","var(--pvpc-bs-naranja)","var(--pvpc-bs-rojo)"],Tt={P1:3,P2:2,P3:0},te="#4269d0",je="#f4bd4a";function Le(o,t){return Array.isArray(o)&&o.length===3&&o.every(e=>Number.isFinite(Number(e)))?`rgb(${o.map(Number).join(", ")})`:typeof o=="string"&&o.trim()?o.trim():t}var jt=`conic-gradient(${["verde","amarillo","naranja","rojo"].map((o,t)=>`var(--pvpc-bs-${o}) ${t*25}% ${(t+1)*25}%`).join(", ")})`,ot={min:"M1,3H23L12,22",max:"M1,21H23L12,2",min_hueco:"M12,22L1,3H23L12,22M12,17.5L19.5,5H4.5L12,17.5Z",max_hueco:"M12,2L1,21H23M12,6L19.53,19H4.47"},le={es:{titulo:"Precio de la luz",anterior:"Factura periodo anterior",en_curso:"Factura periodo en curso",estimada_cierre:"Factura estimada",facturas:"Facturas",sin_facturas:"A\xFAn no hay facturas cerradas",calculada:"calculada",abrir:"Ver todo",cerrar:"Cerrar",factura_real:"Factura real",calculada_consumo:"Calculada con el consumo",real:"real",sin_precio:"Sin precios",no_disponible:"No disponible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"llano",P3:"valle"},sin_entidad:"No se encuentra el sensor de precio de PVPC + Bono Social",comp:{boton:"Comparar tarifas",comparando:"Comparando\u2026",titulo:"Comparativa de tarifas",ultima:"\xDAltima comparaci\xF3n",facturas:o=>o===1?"1 factura":`${o} facturas`,dias:o=>`${o} d\xEDas`,ofertas:o=>`${o} ofertas de la CNMC`,tu_tarifa:"Tu tarifa actual",pvpc_bono:"PVPC con bono social",pvpc:"PVPC sin bono",al_anio:"/a\xF1o",primer_anio:"1.er a\xF1o",sin_permanencia:"sin permanencia",permanencia:"permanencia",nuevos:"solo nuevos clientes",verde:"verde",mas:"m\xE1s",menos:"menos",espera:"Consultando la CNMC con tus facturas. Puede tardar unos segundos\u2026",error:"No se ha podido comparar",sin_datos:"A\xFAn no hay ninguna comparativa.",estados:{sin_codigo_postal:"Falta el c\xF3digo postal del suministro (opciones del suministro).",sin_datos:"No hay facturas suficientes para comparar.",cnmc_no_responde:"El comparador de la CNMC no responde; int\xE9ntalo m\xE1s tarde."},veredictos:{quedarse_con_bono:["Sigue con PVPC + bono social","Con tu bono, el PVPC sigue siendo lo m\xE1s barato: la mejor oferta libre te costar\xEDa {x} m\xE1s al a\xF1o."],libre_aunque_pierde_bono:["Hay una oferta m\xE1s barata","La mejor oferta libre sale {x} m\xE1s barata al a\xF1o que lo que pagas con bono, aunque lo perder\xEDas. Comprueba las condiciones antes de cambiar."],mercado_libre:["Puedes ahorrar","Con la mejor oferta te ahorrar\xEDas {x} al a\xF1o."],quedarse:["Sigue con tu tarifa","Ninguna oferta mejora lo que pagas: la mejor te costar\xEDa {x} m\xE1s al a\xF1o."]},avisos:{pierde_bono:"Con otra comercializadora pierdes el bono social.",bono_perdido:"Ya no tienes bono social: se compara con lo que pagar\xEDas sin \xE9l.",bono_nuevo:"Parte de lo pagado no llevaba el bono que tienes ahora: el ahorro real ser\xEDa menor.",cobertura_incompleta:"No est\xE1n en el comparador: {ausentes}.",datos_extrapolados:"Solo hay {dias} d\xEDas de facturas: lo pagado y el consumo se han llevado a un a\xF1o.",facturas_estimadas:"Hay facturas estimadas: concilia las reales para afinar.",sin_ofertas:"La CNMC no ha devuelto ofertas para tu c\xF3digo postal."},cerrar:"Cerrar la comparativa",confirmar:"Los precios son los que publica la CNMC y pueden estar desfasados: conf\xEDrmalos con la comercializadora antes de contratar.",ficha:"Ficha de la oferta en la CNMC (con la web de la comercializadora)",cnmc:"Ver todas las ofertas en el comparador de la CNMC",cnmc_datos:o=>`${o?`Las ${o} ofertas`:"Todas las ofertas"}, calculadas con tu consumo y tu potencia`,pvpc_cnmc:(o,t,e)=>e?`PVPC seg\xFAn la CNMC: ${o} sin bono con los precios del \xFAltimo a\xF1o \xB7 previsi\xF3n pr\xF3ximo a\xF1o: ${t} sin bono, \u2248${e} con tu bono`:t?`PVPC sin bono seg\xFAn la CNMC: ${o} con los precios del \xFAltimo a\xF1o \xB7 previsi\xF3n pr\xF3ximo a\xF1o: ${t}`:`PVPC sin bono seg\xFAn la CNMC: ${o} con los precios del \xFAltimo a\xF1o`,enviar:o=>`Enviar a ${o}`,enviando:"Enviando\u2026",enviado:"Enviada \u2713"}},en:{titulo:"Electricity price",anterior:"Previous bill",en_curso:"Current bill",estimada_cierre:"Estimated bill",facturas:"Bills",sin_facturas:"No closed bills yet",calculada:"calculated",abrir:"Show everything",cerrar:"Close",factura_real:"Actual bill",calculada_consumo:"Calculated from consumption",real:"actual",sin_precio:"No prices",no_disponible:"Unavailable",hora_actual:"Current hour",periodos:{P1:"peak",P2:"standard",P3:"off-peak"},sin_entidad:"PVPC + Bono Social price sensor not found",comp:{boton:"Compare tariffs",comparando:"Comparing\u2026",titulo:"Tariff comparison",ultima:"Last comparison",facturas:o=>o===1?"1 bill":`${o} bills`,dias:o=>`${o} days`,ofertas:o=>`${o} CNMC offers`,tu_tarifa:"Your current tariff",pvpc_bono:"PVPC with social bonus",pvpc:"PVPC without bonus",al_anio:"/year",primer_anio:"1st year",sin_permanencia:"no minimum stay",permanencia:"minimum stay",nuevos:"new customers only",verde:"green",mas:"more",menos:"less",espera:"Asking the CNMC with your bills. It may take a few seconds\u2026",error:"The comparison failed",sin_datos:"No comparison yet.",estados:{sin_codigo_postal:"The supply has no postal code (supply options).",sin_datos:"Not enough bills to compare.",cnmc_no_responde:"The CNMC comparator is not responding; try again later."},veredictos:{quedarse_con_bono:["Stay on PVPC + social bonus","With your bonus, PVPC is still the cheapest: the best free-market offer would cost you {x} more per year."],libre_aunque_pierde_bono:["There is a cheaper offer","The best free-market offer is {x} per year cheaper than what you pay with the bonus, although you would lose it. Check the conditions before switching."],mercado_libre:["You can save","With the best offer you would save {x} per year."],quedarse:["Keep your tariff","No offer beats what you pay: the best would cost you {x} more per year."]},avisos:{pierde_bono:"Switching retailer loses the social bonus.",bono_perdido:"You no longer have the social bonus: compared with what you would pay without it.",bono_nuevo:"Part of what you paid did not have your current bonus: real savings would be smaller.",cobertura_incompleta:"Not in the comparator: {ausentes}.",datos_extrapolados:"Only {dias} days of bills: payments and consumption extrapolated to a year.",facturas_estimadas:"Some bills are estimates: reconcile the real ones to refine.",sin_ofertas:"The CNMC returned no offers for your postal code."},cerrar:"Close the comparison",confirmar:"Prices are those published by the CNMC and may be out of date: confirm them with the retailer before signing up.",ficha:"Offer details at the CNMC (with the retailer website)",cnmc:"See all offers in the CNMC comparator",cnmc_datos:o=>`${o?`All ${o} offers`:"All offers"}, calculated with your consumption and power`,pvpc_cnmc:(o,t,e)=>e?`PVPC according to the CNMC: ${o} without bonus at last year's prices \xB7 next year's forecast: ${t} without bonus, \u2248${e} with your bonus`:t?`PVPC without bonus according to the CNMC: ${o} at last year's prices \xB7 next year's forecast: ${t}`:`PVPC without bonus according to the CNMC: ${o} at last year's prices`,enviar:o=>`Send to ${o}`,enviando:"Sending\u2026",enviado:"Sent \u2713"}},ca:{titulo:"Preu de la llum",anterior:"Factura del per\xEDode anterior",en_curso:"Factura del per\xEDode en curs",estimada_cierre:"Factura estimada",facturas:"Factures",sin_facturas:"Encara no hi ha factures tancades",calculada:"calculada",abrir:"Veure-ho tot",cerrar:"Tanca",factura_real:"Factura real",calculada_consumo:"Calculada amb el consum",real:"real",sin_precio:"Sense preus",no_disponible:"No disponible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"pla",P3:"vall"},sin_entidad:"No es troba el sensor de preu de PVPC + Bono Social"},gl:{titulo:"Prezo da luz",anterior:"Factura do per\xEDodo anterior",en_curso:"Factura do per\xEDodo en curso",estimada_cierre:"Factura estimada",facturas:"Facturas",sin_facturas:"A\xEDnda non hai facturas pechadas",calculada:"calculada",abrir:"Ver todo",cerrar:"Pechar",factura_real:"Factura real",calculada_consumo:"Calculada co consumo",real:"real",sin_precio:"Sen prezos",no_disponible:"Non dispo\xF1ible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"chan",P3:"val"},sin_entidad:"Non se atopa o sensor de prezo de PVPC + Bono Social"},eu:{titulo:"Argindarraren prezioa",anterior:"Aurreko aldiko faktura",en_curso:"Aldi honetako faktura",estimada_cierre:"Zenbatetsitako faktura",facturas:"Fakturak",sin_facturas:"Oraindik ez dago itxitako fakturarik",calculada:"kalkulatua",abrir:"Ikusi dena",cerrar:"Itxi",factura_real:"Benetako faktura",calculada_consumo:"Kontsumoarekin kalkulatua",real:"benetakoa",sin_precio:"Preziorik ez",no_disponible:"Ez dago erabilgarri",hora_actual:"Uneko ordua",periodos:{P1:"punta",P2:"laua",P3:"harana"},sin_entidad:"Ez da aurkitu PVPC + Bono Social-en prezio-sentsorea"}},Te=["ca","gl","eu"],de=480,Ot=.95,Ht=1.2;function rt(o,t,e){if(!o)return{ancho:de,alto:t};let a=Math.min(Math.max(o/de,Ot),Ht),r=Math.round(o/a),i=Math.round(t*r/de),s=r>de?Math.min(i,e):Math.max(i,Math.round(t*.8));return{ancho:r,alto:s}}function ze(o,t){return Math.max(1,Math.ceil(t/o))}function ue(o,t=!1){let e=t?"price_next_day_":"price_",a=[];for(let r=0;r<24;r++){let i=String(r).padStart(2,"0"),s=o?.[`${e}${i}h`];typeof s=="number"&&a.push({hora:r,precio:s});let n=o?.[`${e}${i}h_d`];typeof n=="number"&&a.push({hora:r,precio:n})}return a}var it=new Map;function Rt(o){let t=o||"",e=it.get(t);if(!e){let a={hourCycle:"h23",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric"};try{e=new Intl.DateTimeFormat("en-US",o?{...a,timeZone:o}:a)}catch{e=new Intl.DateTimeFormat("en-US",a)}it.set(t,e)}return e}function ae(o=new Date,t){let e={};for(let{type:i,value:s}of Rt(t).formatToParts(o))e[i]=Number(s);let a={anio:e.year,mes:e.month,dia:e.day,hora:e.hour%24,minuto:e.minute},r=Date.UTC(a.anio,a.mes-1,a.dia,a.hora,a.minuto);return a.desfase=Math.round((r-Math.floor(o.getTime()/6e4)*6e4)/6e4),a}function I(o){return o?.config?.time_zone||void 0}function st(o=new Date,t,e=0){let a=ae(o,t);return new Date(Date.UTC(a.anio,a.mes-1,a.dia+e)).toISOString().slice(0,10)}function nt(o=new Date,t){let e=ae(o,t);return`${e.anio}-${e.mes}-${e.dia}-${e.hora}-${e.desfase}`}function qt(o,t=new Date,e){let a=ae(t,e).hora,r=o.findIndex(s=>s.hora===a);return ae(new Date(t.getTime()-36e5),e).hora===a&&o[r+1]?.hora===a?r+1:r}function pe(o){if(!o.length)return null;let t=0,e=0;return o.forEach((a,r)=>{a.precio<o[t].precio&&(t=r),a.precio>o[e].precio&&(e=r)}),{min:o[t],max:o[e]}}function ct(o){let t=pe(o);if(!t)return[];let e=t.max.precio-t.min.precio;return o.map(a=>e?Math.min(3,Math.floor((a.precio-t.min.precio)/e*4)):0)}function E(o,t,e=()=>!0){return Object.keys(o?.states||{}).filter(a=>a.startsWith(t)&&e(o.states[a])).sort()[0]}function me(o){return o?.states["sensor.pvpc_bs_precio"]?"sensor.pvpc_bs_precio":E(o,"sensor.",t=>"price_00h"in(t.attributes||{})&&String(t.attributes.attribution||"").includes("REE"))}var Ut={current:!0,details:!0,extremos:"columnas",graph:!0,next_day:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,icon_color:"price",colores:"fijo",color_hoy:te,color_manana:je,bandas:!0,grafica_facturas:!1,facturas_meses:"6",facturas_importe:!0,ventana:!0};function ut(o){let t={};for(let[e,a]of[["show_current","current"],["show_details","details"],["show_graph","graph"]])typeof o[e]=="boolean"&&!(a in o)&&(t[a]=o[e]);return typeof o.show_only_today=="boolean"&&!("next_day"in o)&&(t.next_day=!o.show_only_today),{...Ut,...t,...o}}var X=class extends z{constructor(){super(...arguments);B(this,"_id",Math.random().toString(36).slice(2,8))}static async getConfigElement(){return await Vt(),document.createElement(ht)}static getStubConfig(e){return{entity:me(e)||"sensor.pvpc_bs_precio",entity_factura_actual:E(e,"sensor.pvpc_bs_factura_actual")||"sensor.pvpc_bs_factura_actual",entity_factura_anterior:E(e,"sensor.pvpc_bs_factura_anterior")||"sensor.pvpc_bs_factura_anterior",current:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,grafica_facturas:!0,facturas_meses:"6",facturas_importe:!0,ventana:!0,details:!0,next_day:!0,graph:!0,bandas:!0,colores:"fijo",grid_options:{columns:"full",rows:"auto"}}}setConfig(e){if(!e)throw new Error("Configuraci\xF3n no v\xE1lida");this._config=ut(e)}getCardSize(){return this._config?.graph===!1?3:7}getGridOptions(){return{columns:"full",rows:"auto",min_columns:6,min_rows:3}}get _cHoy(){return Le(this._config.color_hoy,te)}get _cManana(){return Le(this._config.color_manana,je)}get _t(){let e=(this.hass?.locale?.language||this.hass?.language||"es").slice(0,2);return Te.includes(e)?{...le.es,...le[e]}:le[e]||le.en}get _idiomas(){let e=this.hass?.locale?.language||this.hass?.language||"es";return Te.includes(e.slice(0,2))?[e,"es"]:e}_num(e,a=3){return new Intl.NumberFormat(this._idiomas,{minimumFractionDigits:a,maximumFractionDigits:a}).format(e)}_entidadesVigiladas(e){let a=this._config;return[a.entity||me(e),a.entity_injection,"sensor.pvpc_bs_periodo",a.entity_factura_anterior||E(e,"sensor.pvpc_bs_factura_anterior"),a.entity_factura_actual||E(e,"sensor.pvpc_bs_factura_actual")].filter(Boolean)}shouldUpdate(e){if(!e.has("hass")||e.size>1||!this._config)return!0;let a=e.get("hass"),r=this.hass;if(!a||!r||a.locale!==r.locale||a.language!==r.language||a.themes!==r.themes)return!0;let i=new Set([...this._entidadesVigiladas(a),...this._entidadesVigiladas(r)]);for(let s of i)if(a.states[s]!==r.states[s])return!0;return this._horaPintada!==nt(new Date,I(r))}_programarCambioDeHora(){clearTimeout(this._temporizadorHora);let e=Date.now(),r=(60-ae(new Date(e),I(this.hass)).minuto)*6e4-e%6e4+1e3;this._temporizadorHora=setTimeout(()=>{this.requestUpdate(),this._programarCambioDeHora()},r)}render(){if(!this._config||!this.hass)return d;let e=I(this.hass),a=new Date;this._horaPintada=nt(a,e);let r=this._t,i=this._config.entity||me(this.hass),s=i&&this.hass.states[i];if(!s)return _`<ha-card><div class="aviso">${r.sin_entidad}</div></ha-card>`;let n=s.attributes||{},c=ue(n),p=this._config.next_day?ue(n,!0):[],f=Array.isArray(n.colores_hoy)&&n.colores_hoy.length===c.length?n.colores_hoy:ct(c),l=Array.isArray(n.colores_manana)&&n.colores_manana.length===p.length?n.colores_manana:ct(p),m=qt(c,a,e),u=this._config.entity_injection&&this.hass.states[this._config.entity_injection],h=u?{hoy:ue(u.attributes),manana:this._config.next_day?ue(u.attributes,!0):[]}:null,x=this._config.bandas!==!1&&Array.isArray(n.periodos_hoy)&&n.periodos_hoy.length===c.length&&n.periodos_hoy.some(M=>M!=="P3")?n.periodos_hoy:null,k=Number(s.state),$=this._factura(),w=this._config.factura;return _`
      <ha-card>
        <div class="contenedor">
          ${this._config.current?_`<div class="cabecera">
                ${this._conVentana?_`<button class="abrir" aria-label=${r.abrir} @click=${()=>this._abrirVentana()}>
                      ${this._icono(m>=0?f[m]:void 0)}
                    </button>`:this._icono(m>=0?f[m]:void 0)}
                <div class="nombre">${this._config.title||""}</div>
                <div class="actual">
                  <div class="precio">
                    ${Number.isFinite(k)?this._precioGrande(k):"\u2014"}
                    <span class="unidad"><span class="euro">€</span>/kWh</span>
                  </div>
                  ${u&&Number.isFinite(Number(u.state))?_`<div class="precio-iny">${this._num(Number(u.state),5)} €/kWh</div>`:d}
                  ${w==="header"&&$?_`<div class="factura arriba">${$}</div>`:d}
                </div>
              </div>`:d}
          ${this._config.details?this._detalles(c,p,h):d}
          ${this._config.graph?this._grafica(c,p,f,l,m,x,h):d}
          ${$&&(w==="below_chart"||w==="header"&&!this._config.current)?_`<div class="factura abajo">${$}</div>`:d}
          ${$&&w==="header"&&this._config.current?_`<div class="factura abajo estrecha">${$}</div>`:d}
          ${this._config.grafica_facturas?this._graficaFacturas():d}
          ${this.enVentana&&E(this.hass,"button.pvpc_bs_comparar_tarifas")?_`<div class="comparar">
                <button
                  class="btn-comparar"
                  ?disabled=${this.comparando}
                  @click=${()=>this.dispatchEvent(new CustomEvent("pvpc-bs-comparar",{bubbles:!0,composed:!0}))}
                >
                  ${this.comparando?r.comp.comparando:r.comp.boton}
                </button>
              </div>`:d}
        </div>
      </ha-card>
      ${this._ventana?this._dialogo():d}
    `}get _conVentana(){return this._config.ventana!==!1&&!this.enVentana}set configVentana(e){this.enVentana=!0,this.toggleAttribute("en-ventana",!0),this.setConfig(e)}_abrirVentana(){this._conVentana&&(this._ventana=!0)}_cerrarVentana(){this.renderRoot.querySelector("dialog.ventana")?.close()}_dialogo(){let e={...this._config,current:!0,details:!0,graph:!0,next_day:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,grafica_facturas:!0,ventana:!1};return _`<dialog
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
        ${this._anexo?this._anexoComparativa():d}
      </div>
    </dialog>`}async _comparar(){if(this._anexo?.estado==="cargando")return;let e=E(this.hass,"button.pvpc_bs_comparar_tarifas");if(e){this._anexo={estado:"cargando"},this._envio=null;try{let a=this.hass.entities?.[e]?.device_id;a?await this.hass.callService("pvpc_bonosocial","comparar_tarifas",{suministro:a,enviar:!1,notificacion:!1}):await this.hass.callService("button","press",{entity_id:e}),this._anexo={estado:"ok"}}catch(a){this._anexo={estado:"error",mensaje:a?.message||String(a)}}await this.updateComplete,this.renderRoot.querySelector(".anexo")?.scrollIntoView?.({behavior:"smooth",block:"nearest"})}}_anexoComparativa(){let e=this._t.comp,a=_`<button class="cerrar" aria-label=${e.cerrar} @click=${()=>this._anexo=null}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path>
      </svg>
    </button>`,r=_`<div class="anexo-cabecera"><div class="ventana-titulo">${e.titulo}</div>${a}</div>`;if(this._anexo.estado==="cargando")return _`<aside class="anexo">${r}<div class="anexo-espera"><span class="girando"></span>${e.espera}</div></aside>`;let i=E(this.hass,"sensor.pvpc_bs_mejor_alternativa"),s=i&&this.hass.states[i],n=s?.attributes||{};if(this._anexo.estado==="error"||n.estado&&n.estado!=="ok"){let b=e.estados[n.estado]||this._anexo.mensaje||e.error;return _`<aside class="anexo">${r}<div class="anexo-aviso error">⚠️ ${e.error}: ${b}</div></aside>`}let c=Array.isArray(n.ofertas)?n.ofertas:[];if(!s||!c.length&&!n.veredicto)return _`<aside class="anexo">${r}<div class="anexo-aviso">${e.sin_datos}</div></aside>`;let p=Array.isArray(n.avisos)?n.avisos:[],f=p.includes("bono_perdido")||!["quedarse_con_bono","libre_aunque_pierde_bono"].includes(n.veredicto),l=p.includes("bono_perdido")?n.pagado_sin_bono_anual:n.pagado_anual,m=b=>`${this._num(b,2)} \u20AC`,u=typeof n.fecha=="string"?`${n.fecha.slice(8,10)}/${n.fecha.slice(5,7)} ${n.fecha.slice(11,16)}`:"",h=n.periodo||{},x=[u&&`${e.ultima}: ${u}`,h.facturas_conciliadas!==void 0&&`${e.facturas(h.facturas_conciliadas+(h.facturas_estimadas||0))}${h.dias?` (${e.dias(h.dias)})`:""}`,n.total_ofertas!==void 0&&e.ofertas(n.total_ofertas)].filter(Boolean).join(" \xB7 "),k=c[0],$=e.veredictos[n.veredicto],w=["quedarse_con_bono","quedarse"].includes(n.veredicto),M=b=>[b.oferta,b.permanencia?e.permanencia:e.sin_permanencia,b.solo_nuevos_clientes&&e.nuevos,b.verde&&e.verde].filter(Boolean).join(" \xB7 "),T=b=>(e.avisos[b]||"").replace("{ausentes}",(n.grandes_ausentes||[]).join(", ")).replace("{dias}",h.dias??"");return _`<aside class="anexo">
      ${r}
      <div class="anexo-resumen">${x}</div>
      ${$&&k?_`<div class="anexo-veredicto ${w?"bueno":"ahorro"}">
            <b>${w?"\u2705":"\u{1F4A1}"} ${$[0]}</b>
            <div>${$[1].replace("{x}",m(Math.abs(k.ahorro_anual)))}</div>
          </div>`:d}
      <div class="anexo-fila tuya">
        <div><div class="n">${e.tu_tarifa}</div><div class="o">${f?e.pvpc:e.pvpc_bono}</div></div>
        <div class="i">${m(l)}${e.al_anio}</div>
      </div>
      ${c.slice(0,5).map(b=>_`<div class="anexo-fila">
          <div>
            ${b.enlace?_`<a class="n enlace" href=${b.enlace} target="_blank" rel="noopener noreferrer" title=${e.ficha}
                  >${b.comercializadora} ↗</a
                >`:_`<div class="n">${b.comercializadora}</div>`}
            <div class="o">${M(b)}</div>
          </div>
          <div>
            <div class="i">${m(b.importe_primer_anio)}</div>
            <div class="d ${b.ahorro_anual>=0?"menos":"mas"}">
              ${b.ahorro_anual>=0?"\u2212":"+"}${m(Math.abs(b.ahorro_anual))}
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
      ${n.pvpc_cnmc!=null?_`<div class="anexo-pvpc">
            ${e.pvpc_cnmc(m(n.pvpc_cnmc),n.pvpc_cnmc_prevision!=null?m(n.pvpc_cnmc_prevision):null,n.pvpc_cnmc_prevision_bono!=null?m(n.pvpc_cnmc_prevision_bono):null)}
          </div>`:d}
      ${p.filter(b=>e.avisos[b]).map(b=>_`<div class="anexo-nota">⚠️ ${T(b)}</div>`)}
      <div class="anexo-nota">ℹ️ ${e.confirmar}</div>
      ${n.destino?_`<div class="anexo-pie">${this._botonEnviar(i,n.destino)}</div>`:d}
    </aside>`}_botonEnviar(e,a){let r=this._t.comp,i=/telegram/i.test(a)?"Telegram":this.hass.states[a]?.attributes?.friendly_name||a,s=this.hass.entities?.[e]?.device_id;if(!s)return d;let n=async()=>{this._envio="enviando";try{await this.hass.callService("pvpc_bonosocial","enviar_comparativa",{suministro:s}),this._envio="ok"}catch(p){this._envio=p?.message||String(p)}},c=this._envio==="enviando"?r.enviando:this._envio==="ok"?r.enviado:r.enviar(i);return _`<div class="comparar">
        <button class="btn-comparar" ?disabled=${this._envio==="enviando"||this._envio==="ok"} @click=${n}>${c}</button>
      </div>
      ${this._envio&&!["enviando","ok"].includes(this._envio)?_`<div class="anexo-aviso error">⚠️ ${this._envio}</div>`:d}`}_precioGrande(e){let a=this._num(e,5);return _`${a.slice(0,-2)}<span class="cola">${a.slice(-2)}</span>`}_icono(e){let a=e;if(this._config.icon_color==="period"){let s=this.hass.states["sensor.pvpc_bs_periodo"]?.state;a=Tt[s]}let r=this._config.icon_color==="fijo"||a===void 0?te:at[a],i=`pvpc-bs-hueco-${this._id}`;return _`<svg class="icono" viewBox="0 0 512 512" aria-hidden="true">
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
    </svg>`}_hora(e){return`${String(e).padStart(2,"0")}:00`}_fecha(e=0){let a=new Date(`${st(new Date,I(this.hass),e)}T12:00:00Z`);return new Intl.DateTimeFormat(this._idiomas,{timeZone:"UTC"}).format(a)}_triangulo(e,a){return _`<svg class="tri" viewBox="0 0 24 24" aria-hidden="true"><path d=${ot[e]} fill=${a}></path></svg>`}_detalles(e,a,r){let i=this._t,s=(l,m,u)=>_`<div class="detalle">
        ${this._triangulo(l,m)}
        <div>
          ${u?_`<div class="valor">${this._num(u.precio,5)} €/kWh</div>
                <div class="horas">${this._hora(u.hora)} - ${this._hora(u.hora+1)}</div>`:_`<div class="valor">${i.no_disponible}</div>`}
        </div>
      </div>`,n=(l,m,u="")=>{let h=pe(l);return _`<div class="columna">${s(`min${u}`,m,h?.min)}${s(`max${u}`,m,h?.max)}</div>`},c=(l,m,u="")=>{let h=pe(l);return _`<div class="fila">${s(`min${u}`,m,h?.min)}${s(`max${u}`,m,h?.max)}</div>`},p=this._config.extremos==="filas"?c:n,f=(l,m,u)=>_`<div class="detalles ${this._config.extremos==="filas"?"en-filas":""}">
        ${p(l,this._cHoy,u)}${m.length?p(m,this._cManana,u):d}
      </div>`;return _`${f(e,a)}${r?f(r.hoy,r.manana,"_hueco"):d}`}_factura(){let e=this._t;if(this._config.factura==="hidden")return null;let a=[],r=this._config.entity_factura_anterior||E(this.hass,"sensor.pvpc_bs_factura_anterior"),i=this._config.entity_factura_actual||E(this.hass,"sensor.pvpc_bs_factura_actual"),s=l=>typeof l=="string"?`${l.slice(8,10)}/${l.slice(5,7)}`:"",n=(l,m)=>l&&m?` (${s(l)} - ${s(m)})`:"",c=(l,m,u,h=d)=>_`<div>${l}<span class="sin-corte">${m}</span>: <b class="sin-corte">${this._num(u,2)} €</b>${h}</div>`,p=r&&this.hass.states[r];if(this._config.factura_anterior&&p&&Number.isFinite(Number(p.state))){let l=p.attributes||{};a.push(c(e.anterior,n(l.inicio,l.fin),Number(p.state)))}let f=i&&this.hass.states[i];if(this._config.factura_actual&&f&&Number.isFinite(Number(f.state))){let l=f.attributes||{},m=st(new Date,I(this.hass));typeof l.acumulado=="number"&&a.push(c(e.en_curso,n(l.inicio,m),l.acumulado)),this._config.prevision!==!1&&a.push(c(e.estimada_cierre,n(l.inicio,l.fin_previsto),Number(f.state)))}return a.length?a:null}_grafica(e,a,r,i,s,n,c){let p=this._t;if(!e.length)return _`<div class="aviso">${p.sin_precio}</div>`;let f=this._cHoy,l=this._cManana,{ancho:m,alto:u}=rt(this._anchoUtil,190,300),h={izq:38,der:16,arr:24,aba:24},x=[{puntos:e,color:f},{puntos:a,color:l},...c?[{puntos:c.hoy,color:f,punteada:!0},{puntos:c.manana,color:l,punteada:!0}]:[]].filter(g=>g.puntos.length),k=x.flatMap(g=>g.puntos.map(A=>A.precio)),$=Math.min(0,...k),w=Math.max(...k);w-$<.01&&(w=$+.01);let M=(w-$)*.08;$-=Math.min(0,...k)<0?M:0,w+=M;let T=Math.max(e.length,a.length,24),b=(m-h.izq-h.der)/T,P=g=>h.izq+b*g,D=g=>P(g)+b/2,v=g=>h.arr+(u-h.arr-h.aba)*(1-(g-$)/(w-$)),N=g=>g.map((A,C)=>`${C?"V":`M${P(0).toFixed(1)},`}${v(A.precio).toFixed(1)}H${P(C+1).toFixed(1)}`).join(""),O=(g,A,C)=>S`<line class="tramo" x1=${P(C)} x2=${P(C+1)} y1=${v(g[C].precio)} y2=${v(g[C].precio)}
        stroke=${at[A[C]??0]}></line>`,oe=(g,A,C)=>{let re=pe(g),_t=g.indexOf(re[C]),gt=v(re[C].precio)+(C==="max"?-11:4);return S`<svg class="marca" x=${D(_t)-4.5} y=${gt} width="9" height="9" viewBox="0 0 24 24">
        <path d=${ot[C]} fill=${A}></path></svg>`},_e=(w-$)/4,mt=[0,1,2,3,4].map(g=>$+_e*g),y=this._cursor,Oe=(g,A,C,re)=>S`<circle class=${re} cx=${D(C)} cy=${v(g[C].precio)} r="3" fill=${A}></circle>`,ge=this._config.colores==="precio",ft=ze(b*3,28),He=this._config.titulo_grafica??"PVPC";return _`
      <div class="grafica">
        ${He?_`<div class="titulo-seccion">${He}</div>`:d}
        <svg
          viewBox="0 0 ${m} ${u}"
          role="img"
          aria-label=${p.titulo}
          @pointermove=${g=>this._mover(g,m,h,T)}
          @pointerleave=${()=>this._cursor=void 0}
        >
          <text class="eje" x=${h.izq-4} y=${h.arr-12} text-anchor="end">€/kWh</text>
          ${n?n.map((g,A)=>g==="P3"?d:S`<rect class=${g==="P1"?"banda-punta":"banda-llano"} x=${P(A)}
                      y=${h.arr} width=${b} height=${u-h.arr-h.aba}></rect>`):d}
          ${s>=0?S`<rect class="ahora" x=${P(s)} y=${h.arr} width=${b} height=${u-h.arr-h.aba}></rect>`:d}
          ${mt.map(g=>S`<line class="rejilla" x1=${h.izq} x2=${m-h.der} y1=${v(g)} y2=${v(g)}></line>
              <text class="eje" x=${h.izq-4} y=${v(g)+3} text-anchor="end">${this._num(Math.abs(g)<.005?0:g,2)}</text>`)}
          ${[0,3,6,9,12,15,18,21,24].map((g,A)=>S`<line class="rejilla" x1=${P(g)} x2=${P(g)} y1=${h.arr} y2=${u-h.aba}></line>
              ${A%ft?d:S`<text class="eje" x=${P(g)} y=${u-8} text-anchor="middle">${this._hora(g)}</text>`}`)}
          ${x.map(g=>S`<path class="serie ${g.punteada?"punteada":""}" d=${N(g.puntos)}
                stroke=${ge&&g.puntos===e?"var(--secondary-text-color)":g.color}></path>`)}
          ${ge?e.map((g,A)=>O(e,r,A)):d}
          ${x.flatMap(g=>[oe(g.puntos,g.color,"max"),oe(g.puntos,g.color,"min")])}
          ${y!==void 0?S`<line class="cursor" x1=${D(y)} x2=${D(y)} y1=${h.arr} y2=${u-h.aba}></line>`:d}
          ${y!==void 0&&y<e.length?Oe(e,f,y,"p-hoy"):d}
          ${y!==void 0&&y<a.length?Oe(a,l,y,"p-manana"):d}
        </svg>
        <div class="leyenda">
          ${y!==void 0?_`<span
                  ><b>${this._hora((e[y]??a[y])?.hora??y)} - ${this._hora(((e[y]??a[y])?.hora??y)+1)}</b>${n?.[y]?_` · ${p.periodos[n[y]]}`:d}</span
                >
                ${e[y]?_`<span><i class="bolita" style="background:${f}"></i>${this._num(e[y].precio,5)}</span>`:d}
                ${a[y]?_`<span><i class="bolita" style="background:${l}"></i>${this._num(a[y].precio,5)}</span>`:d}`:_`<span
                  ><i class="bolita" style="background:${ge?jt:f}"></i>${this._fecha(0)}</span
                >${a.length?_`<span><i class="bolita" style="background:${l}"></i>${this._fecha(1)}</span>`:d}${s>=0?_`<span class="l-ahora">${p.hora_actual}</span>`:d}${n?_`<span class="l-punta">${p.periodos.P1}</span><span class="l-llano">${p.periodos.P2}</span>`:d}`}
        </div>
      </div>
    `}connectedCallback(){super.connectedCallback(),this._observador??=new ResizeObserver(()=>{this._medirAncho(),this._alinearFactura()}),this._observador.observe(this),this._programarCambioDeHora()}disconnectedCallback(){super.disconnectedCallback(),this._observador?.disconnect(),clearTimeout(this._temporizadorHora)}_medirAncho(){let e=this.renderRoot?.querySelector(".contenedor");if(!e?.clientWidth)return;let a=e.clientWidth-32;Math.abs(a-(this._anchoUtil??0))>=2&&(this._anchoUtil=a)}_alinearFactura(){let e=this.renderRoot?.querySelector(".cabecera .actual");if(!e)return;let a=e.querySelector(".precio"),r=[...e.querySelectorAll(".precio-iny, .factura.arriba")];for(let u of[a,...r])u&&(u.style.marginRight="");let i=this.renderRoot.querySelectorAll(".detalles .columna"),s=this.renderRoot.querySelectorAll(".detalles .fila > .detalle:last-child"),n=this.renderRoot.querySelector(".cabecera .icono"),c=i.length>=2?[i[1]]:s.length>=2?[...s]:[];if(!c.length||!e.offsetParent)return;let p=Math.max(...c.flatMap(u=>[...u.querySelectorAll(".valor, .horas")].map(h=>h.getBoundingClientRect().right)));if(!Number.isFinite(p))return;let f=u=>n?u.getBoundingClientRect().left-n.getBoundingClientRect().right-12:1/0,l=(u,h)=>{let x=Math.min(h,f(u));x>0&&(u.style.marginRight=`${x}px`)},m=a?.querySelector(".euro");m&&l(a,m.getBoundingClientRect().right-p);for(let u of r)l(u,u.getBoundingClientRect().right-p)}updated(e){if(super.updated?.(e),this._medirAncho(),this._alinearFactura(),e.has("_ventana")&&this._ventana){let i=this.renderRoot.querySelector("dialog.ventana");i&&!i.open&&i.showModal()}if(!this.hass||!this._config?.grafica_facturas||this._cargandoFacturas||this._facturasDelSensor())return;let a=`${this._config.estadistica_facturas||""}|${this._config.facturas_meses}`;(!this._facturasHora||Date.now()-this._facturasHora>3*3600*1e3||a!==this._facturasClave)&&this._cargarFacturas(a)}_facturasDelSensor(){if(this._config.estadistica_facturas)return null;let e=this._config.entity_factura_actual||E(this.hass,"sensor.pvpc_bs_factura_actual"),a=this.hass?.states[e]?.attributes?.facturas;if(!Array.isArray(a))return null;let r=Math.max(1,Number(this._config.facturas_meses)||6);return a.filter(i=>Number.isFinite(Number(i.total))&&i.inicio).map(i=>{let[s,n,c]=String(i.inicio).split("-").map(Number);return{inicio:new Date(Date.UTC(s,n-1,c+1,12)),total:Number(i.total),real:i.real!==!1}}).slice(-r)}async _cargarFacturas(e){this._cargandoFacturas=!0,this._facturasClave=e,this._facturasHora=Date.now();try{let a=this._config.estadistica_facturas;if(a||(a=(await this.hass.callWS({type:"recorder/list_statistic_ids",statistic_type:"mean"})).map(c=>c.statistic_id).find(c=>c.startsWith("pvpc_bonosocial:facturas_"))),!a){this._facturas=[];return}let r=Math.max(1,Number(this._config.facturas_meses)||6),i=new Date(Date.now()-(r+2)*35*86400*1e3),s=await this.hass.callWS({type:"recorder/statistics_during_period",start_time:i.toISOString(),statistic_ids:[a],period:"hour",types:["max"]});this._facturas=(s[a]||[]).filter(n=>Number.isFinite(Number(n.max))).map(n=>({inicio:new Date(n.start),total:Number(n.max),real:!0})).slice(-r)}catch(a){console.warn("pvpc-bono-social-card: no se pudieron leer las facturas",a),this._facturas=[]}finally{this._cargandoFacturas=!1}}_graficaFacturas(){let e=this._t,a=this._facturasDelSensor()??this._facturas,r=this._config.titulo_facturas??e.facturas,i=r?_`<div class="titulo-seccion">${r}</div>`:d;if(!a)return d;if(!a.length)return _`<div class="facturas">${i}<div class="aviso">${e.sin_facturas}</div></div>`;let s=Le(this._config.color_facturas,this._cHoy),n=this._config.facturas_importe!==!1,{ancho:c,alto:p}=rt(this._anchoUtil,150,220),f={izq:8,der:8,arr:n?18:6,aba:20},l=Math.max(...a.map(v=>v.total),1),m=(c-f.izq-f.der)/a.length,u=Math.min(m*.6,56),h=a.length-1,x=Math.max(...a.map(v=>this._num(v.total,2).length+2)),k=ze(m,x*6.2),$=v=>f.arr+(p-f.arr-f.aba)*(1-Math.max(v,0)/l),w=this._idiomas,M=I(this.hass),T;try{T=new Intl.DateTimeFormat(w,{month:"short",year:"2-digit",...M?{timeZone:M}:{}})}catch{T=new Intl.DateTimeFormat(w,{month:"short",year:"2-digit"})}let b={format:v=>{let N=T.formatToParts(v),O=oe=>N.find(_e=>_e.type===oe)?.value??"";return`${O("month")} ${O("year")}`}},P=Math.max(...a.map(v=>b.format(v.inicio).length)),D=ze(m,P*5.2);return _`
      <div class="facturas">
        ${i}
        <svg viewBox="0 0 ${c} ${p}" role="img" aria-label=${r||e.facturas}>
          <line class="rejilla" x1=${f.izq} x2=${c-f.der} y1=${p-f.aba} y2=${p-f.aba}></line>
          ${a.map((v,N)=>{let O=f.izq+m*(N+.5);return S`<rect class="barra ${v.real?"real":"calculada"}" x=${O-u/2+(v.real?0:1)}
                y=${$(v.total)+(v.real?0:1)} width=${u-(v.real?0:2)}
                height=${Math.max(p-f.aba-$(v.total)-(v.real?0:1),0)} rx="3"
                fill=${v.real?s:"none"} stroke=${s}>
                <title>${b.format(v.inicio)}: ${this._num(v.total,2)} € (${v.real?e.real:e.calculada})</title></rect>
              ${(h-N)%D?d:S`<text class="eje" x=${O} y=${p-6} text-anchor="middle">${b.format(v.inicio)}</text>`}`})}
          ${this._config.facturas_tendencia&&a.length>1?this._tendencia(a,m,f,$):d}
          ${n?a.map((v,N)=>(h-N)%k?d:S`<text class="importe" x=${f.izq+m*(N+.5)} y=${$(v.total)-5}
                    text-anchor="middle">${this._num(v.total,2)} €</text>`):d}
        </svg>
        ${a.some(v=>!v.real)?_`<div class="leyenda">
              ${a.some(v=>v.real)?_`<span><i class="bolita cuadro" style="background:${s}"></i>${e.factura_real}</span>`:d}
              <span><i class="bolita cuadro" style="border:2px solid ${s}"></i>${e.calculada_consumo}</span>
            </div>`:d}
      </div>
    `}_tendencia(e,a,r,i){let s=e.length,n=(s-1)/2,c=e.reduce((h,x)=>h+x.total,0)/s,p=0,f=0;e.forEach((h,x)=>{p+=(x-n)*(h.total-c),f+=(x-n)**2});let l=p/f,m=h=>c+l*(h-n),u=h=>r.izq+a*(h+.5);return S`<line class="tendencia" x1=${u(0)} y1=${i(m(0))} x2=${u(s-1)} y2=${i(m(s-1))}></line>`}_mover(e,a,r,i){let s=e.currentTarget.getBoundingClientRect(),n=(e.clientX-s.left)/s.width*a,c=Math.floor((n-r.izq)/(a-r.izq-r.der)*i);this._cursor=c>=0&&c<i?c:void 0}};B(X,"properties",{hass:{attribute:!1},_config:{state:!0},_cursor:{state:!0},_facturas:{state:!0},_ventana:{state:!0},_anexo:{state:!0},_envio:{state:!0},comparando:{attribute:!1},_anchoUtil:{state:!0}}),B(X,"styles",be`
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
  `);var ht=`${he}-editor`;function pt(o,t){let[e,a]=o.split(" / ");return["es",...Te].includes(t)?e:a??e}function Dt(o){let t=a=>({select:{mode:"dropdown",options:a.map(([r,i])=>({value:r,label:pt(i,o)}))}}),e=(...a)=>a.map(r=>({name:r,selector:{boolean:{}}}));return[{name:"entity",selector:{entity:{domain:"sensor"}}},{name:"title",selector:{text:{}}},{name:"factura",selector:t([["below_chart","Bajo la gr\xE1fica / Below the chart"],["header","Arriba / In the header"],["hidden","Oculta / Hidden"]])},{type:"grid",name:"",schema:e("factura_actual","factura_anterior","prevision","current","details","graph","next_day","ventana")},{name:"extremos",selector:t([["columnas","Columnas / Columns"],["filas","Filas / Rows"]])},{name:"colores",selector:t([["fijo","Un color por d\xEDa / One colour per day"],["precio","Hoy por precio / Today by price"]])},{type:"grid",name:"",schema:[{name:"color_hoy",selector:{color_rgb:{}}},{name:"color_manana",selector:{color_rgb:{}}},...e("bandas")]},{name:"entity_injection",selector:{entity:{domain:"sensor"}}},{name:"icon_color",selector:t([["price","Por precio / By price"],["period","Por periodo P1-P3 / By period"],["fijo","Azul fijo / Fixed blue"]])},{type:"grid",name:"",schema:[...e("grafica_facturas","facturas_importe","facturas_tendencia"),{name:"facturas_meses",selector:t(["3","5","6","9","12"].map(a=>[a,a]))},{name:"color_facturas",selector:{color_rgb:{}}}]},{name:"titulo_grafica",selector:{text:{}}},{name:"titulo_facturas",selector:{text:{}}},{name:"entity_factura_actual",selector:{entity:{domain:"sensor"}}},{name:"entity_factura_anterior",selector:{entity:{domain:"sensor"}}}]}function ee(o,t){if(Array.isArray(o)&&o.length===3)return o.map(Number);let e=typeof o=="string"?o.trim():"",a=/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(e)?.[1];if(a){let i=a.length===3?[...a].map(s=>s+s).join(""):a;return[0,2,4].map(s=>parseInt(i.slice(s,s+2),16))}let r=/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(e);if(r)return r.slice(1,4).map(Number);if(e){let i=document.createElement("canvas").getContext("2d");if(i.fillStyle="#000000",i.fillStyle=e,i.fillStyle!=="#000000"||e.toLowerCase()==="black")return ee(i.fillStyle)}return t===void 0?[0,0,0]:ee(t)}function lt(o,t){let e=ut(o);return{...e,entity:e.entity||me(t),entity_factura_actual:e.entity_factura_actual||E(t,"sensor.pvpc_bs_factura_actual"),entity_factura_anterior:e.entity_factura_anterior||E(t,"sensor.pvpc_bs_factura_anterior"),color_hoy:ee(e.color_hoy,te),color_manana:ee(e.color_manana,je),color_facturas:ee(e.color_facturas??e.color_hoy,te),facturas_meses:String(e.facturas_meses),grafica_facturas:!!e.grafica_facturas}}async function Vt(){if(!customElements.get("ha-form"))try{await(await(await window.loadCardHelpers?.())?.createCardElement({type:"entities",entities:[]}))?.constructor?.getConfigElement?.()}catch(o){console.warn("pvpc-bono-social-card: no se pudo cargar el editor",o)}}var fe=class extends z{setConfig(t){this._config=t}get _idioma(){return(this.hass?.locale?.language||this.hass?.language||"es").slice(0,2)}render(){return!this._config||!this.hass?d:_`<ha-form
      .hass=${this.hass}
      .data=${lt(this._config,this.hass)}
      .schema=${Dt(this._idioma)}
      .computeLabel=${t=>dt[t.name]?pt(dt[t.name],this._idioma):t.name}
      @value-changed=${this._alCambiar}
    ></ha-form>`}_alCambiar(t){t.stopPropagation();let e=t.detail.value,a=lt(this._config,this.hass),r={...this._config};for(let i of new Set([...Object.keys(e),...Object.keys(a)]))JSON.stringify(e[i])!==JSON.stringify(a[i])&&(e[i]===void 0?delete r[i]:r[i]=e[i]);this._config=r,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:r},bubbles:!0,composed:!0}))}};B(fe,"properties",{hass:{attribute:!1},_config:{state:!0}});var dt={entity:"Sensor de precio / Price sensor",title:"T\xEDtulo / Title",factura:"Factura / Bill",factura_actual:"Factura en curso / Current bill",factura_anterior:"Factura anterior / Previous bill",prevision:"Factura estimada al cierre / Estimated bill",current:"Precio actual / Current price",details:"M\xEDnimos y m\xE1ximos / Min and max",extremos:"M\xEDnimo y m\xE1ximo diarios / Daily min and max",graph:"Gr\xE1fica / Chart",ventana:"Ventana con todo al pulsar el icono / Full view on icon tap",next_day:"Ma\xF1ana / Tomorrow",icon_color:"Color del icono / Icon colour",colores:"Colores de la gr\xE1fica / Chart colours",color_hoy:"Color de hoy / Today's colour",color_manana:"Color de ma\xF1ana / Tomorrow's colour",bandas:"Punta y llano sombreados / Shade peak hours",entity_injection:"Sensor de precio de excedentes (opcional) / Injection price sensor (optional)",grafica_facturas:"Gr\xE1fica de facturas / Bills chart",facturas_importe:"Importe sobre cada barra / Amount above bars",facturas_tendencia:"L\xEDnea de tendencia / Trend line",facturas_meses:"Cu\xE1ntas facturas / How many bills",color_facturas:"Color de las barras / Bar colour",titulo_grafica:"T\xEDtulo de la gr\xE1fica de precios / Price chart title",titulo_facturas:"T\xEDtulo de la gr\xE1fica de facturas / Bills chart title",entity_factura_actual:"Sensor de factura en curso / Current bill sensor",entity_factura_anterior:"Sensor de factura anterior / Previous bill sensor"};customElements.get(he)||(customElements.define(he,X),customElements.define(ht,fe),window.customCards=window.customCards||[],window.customCards.push({type:he,name:"PVPC + Bono Social",description:"Precio del PVPC de hoy y ma\xF1ana y la factura con o sin bono social.",preview:!0,documentationURL:"https://github.com/BaRDaHL/pvpc_bonosocial"}),console.info(`%c PVPC + Bono Social %c ${zt} `,"background:#43a047;color:#fff",""));
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
