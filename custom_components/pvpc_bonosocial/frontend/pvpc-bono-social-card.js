var Ce=Object.defineProperty;var we=(o,e,a)=>e in o?Ce(o,e,{enumerable:!0,configurable:!0,writable:!0,value:a}):o[e]=a;var U=(o,e,a)=>we(o,typeof e!="symbol"?e+"":e,a);var ca=globalThis,la=ca.ShadowRoot&&(ca.ShadyCSS===void 0||ca.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,$a=Symbol(),Ba=new WeakMap,K=class{constructor(e,a,t){if(this._$cssResult$=!0,t!==$a)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=a}get styleSheet(){let e=this.o,a=this.t;if(la&&e===void 0){let t=a!==void 0&&a.length===1;t&&(e=Ba.get(a)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&Ba.set(a,e))}return e}toString(){return this.cssText}},Ia=o=>new K(typeof o=="string"?o:o+"",void 0,$a),ya=(o,...e)=>{let a=o.length===1?o[0]:e.reduce((t,r,i)=>t+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+o[i+1],o[0]);return new K(a,o,$a)},Ua=(o,e)=>{if(la)o.adoptedStyleSheets=e.map(a=>a instanceof CSSStyleSheet?a:a.styleSheet);else for(let a of e){let t=document.createElement("style"),r=ca.litNonce;r!==void 0&&t.setAttribute("nonce",r),t.textContent=a.cssText,o.appendChild(t)}},xa=la?o=>o:o=>o instanceof CSSStyleSheet?(e=>{let a="";for(let t of e.cssRules)a+=t.cssText;return Ia(a)})(o):o;var{is:ze,defineProperty:Pe,getOwnPropertyDescriptor:Ae,getOwnPropertyNames:Se,getOwnPropertySymbols:Me,getPrototypeOf:Ee}=Object,da=globalThis,Wa=da.trustedTypes,Ne=Wa?Wa.emptyScript:"",qe=da.reactiveElementPolyfillSupport,J=(o,e)=>o,ka={toAttribute(o,e){switch(e){case Boolean:o=o?Ne:null;break;case Object:case Array:o=o==null?o:JSON.stringify(o)}return o},fromAttribute(o,e){let a=o;switch(e){case Boolean:a=o!==null;break;case Number:a=o===null?null:Number(o);break;case Object:case Array:try{a=JSON.parse(o)}catch{a=null}}return a}},Za=(o,e)=>!ze(o,e),Ga={attribute:!0,type:String,converter:ka,reflect:!1,useDefault:!1,hasChanged:Za};Symbol.metadata??=Symbol("metadata"),da.litPropertyMetadata??=new WeakMap;var T=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,a=Ga){if(a.state&&(a.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((a=Object.create(a)).wrapped=!0),this.elementProperties.set(e,a),!a.noAccessor){let t=Symbol(),r=this.getPropertyDescriptor(e,t,a);r!==void 0&&Pe(this.prototype,e,r)}}static getPropertyDescriptor(e,a,t){let{get:r,set:i}=Ae(this.prototype,e)??{get(){return this[a]},set(n){this[a]=n}};return{get:r,set(n){let s=r?.call(this);i?.call(this,n),this.requestUpdate(e,s,t)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Ga}static _$Ei(){if(this.hasOwnProperty(J("elementProperties")))return;let e=Ee(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(J("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(J("properties"))){let a=this.properties,t=[...Se(a),...Me(a)];for(let r of t)this.createProperty(r,a[r])}let e=this[Symbol.metadata];if(e!==null){let a=litPropertyMetadata.get(e);if(a!==void 0)for(let[t,r]of a)this.elementProperties.set(t,r)}this._$Eh=new Map;for(let[a,t]of this.elementProperties){let r=this._$Eu(a,t);r!==void 0&&this._$Eh.set(r,a)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let a=[];if(Array.isArray(e)){let t=new Set(e.flat(1/0).reverse());for(let r of t)a.unshift(xa(r))}else e!==void 0&&a.push(xa(e));return a}static _$Eu(e,a){let t=a.attribute;return t===!1?void 0:typeof t=="string"?t:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,a=this.constructor.elementProperties;for(let t of a.keys())this.hasOwnProperty(t)&&(e.set(t,this[t]),delete this[t]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Ua(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,a,t){this._$AK(e,t)}_$ET(e,a){let t=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,t);if(r!==void 0&&t.reflect===!0){let i=(t.converter?.toAttribute!==void 0?t.converter:ka).toAttribute(a,t.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,a){let t=this.constructor,r=t._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let i=t.getPropertyOptions(r),n=typeof i.converter=="function"?{fromAttribute:i.converter}:i.converter?.fromAttribute!==void 0?i.converter:ka;this._$Em=r;let s=n.fromAttribute(a,i.type);this[r]=s??this._$Ej?.get(r)??s,this._$Em=null}}requestUpdate(e,a,t,r=!1,i){if(e!==void 0){let n=this.constructor;if(r===!1&&(i=this[e]),t??=n.getPropertyOptions(e),!((t.hasChanged??Za)(i,a)||t.useDefault&&t.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(n._$Eu(e,t))))return;this.C(e,a,t)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,a,{useDefault:t,reflect:r,wrapped:i},n){t&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,n??a??this[e]),i!==!0||n!==void 0)||(this._$AL.has(e)||(this.hasUpdated||t||(a=void 0),this._$AL.set(e,a)),r===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(a){Promise.reject(a)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[r,i]of this._$Ep)this[r]=i;this._$Ep=void 0}let t=this.constructor.elementProperties;if(t.size>0)for(let[r,i]of t){let{wrapped:n}=i,s=this[r];n!==!0||this._$AL.has(r)||s===void 0||this.C(r,void 0,i,s)}}let e=!1,a=this._$AL;try{e=this.shouldUpdate(a),e?(this.willUpdate(a),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(a)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(a)}willUpdate(e){}_$AE(e){this._$EO?.forEach(a=>a.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(a=>this._$ET(a,this[a])),this._$EM()}updated(e){}firstUpdated(e){}};T.elementStyles=[],T.shadowRootOptions={mode:"open"},T[J("elementProperties")]=new Map,T[J("finalized")]=new Map,qe?.({ReactiveElement:T}),(da.reactiveElementVersions??=[]).push("2.1.2");var Ma=globalThis,Ka=o=>o,ua=Ma.trustedTypes,Ja=ua?ua.createPolicy("lit-html",{createHTML:o=>o}):void 0,te="$lit$",D=`lit$${Math.random().toFixed(9).slice(2)}$`,oe="?"+D,je=`<${oe}>`,R=document,X=()=>R.createComment(""),Y=o=>o===null||typeof o!="object"&&typeof o!="function",Ea=Array.isArray,Le=o=>Ea(o)||typeof o?.[Symbol.iterator]=="function",Ca=`[ 	
\f\r]`,Q=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Qa=/-->/g,Xa=/>/g,O=RegExp(`>|${Ca}(?:([^\\s"'>=/]+)(${Ca}*=${Ca}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ya=/'/g,ae=/"/g,re=/^(?:script|style|textarea|title)$/i,Na=o=>(e,...a)=>({_$litType$:o,strings:e,values:a}),u=Na(1),E=Na(2),at=Na(3),B=Symbol.for("lit-noChange"),h=Symbol.for("lit-nothing"),ee=new WeakMap,H=R.createTreeWalker(R,129);function ie(o,e){if(!Ea(o)||!o.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ja!==void 0?Ja.createHTML(e):e}var Fe=(o,e)=>{let a=o.length-1,t=[],r,i=e===2?"<svg>":e===3?"<math>":"",n=Q;for(let s=0;s<a;s++){let c=o[s],d,l,p=-1,m=0;for(;m<c.length&&(n.lastIndex=m,l=n.exec(c),l!==null);)m=n.lastIndex,n===Q?l[1]==="!--"?n=Qa:l[1]!==void 0?n=Xa:l[2]!==void 0?(re.test(l[2])&&(r=RegExp("</"+l[2],"g")),n=O):l[3]!==void 0&&(n=O):n===O?l[0]===">"?(n=r??Q,p=-1):l[1]===void 0?p=-2:(p=n.lastIndex-l[2].length,d=l[1],n=l[3]===void 0?O:l[3]==='"'?ae:Ya):n===ae||n===Ya?n=O:n===Qa||n===Xa?n=Q:(n=O,r=void 0);let _=n===O&&o[s+1].startsWith("/>")?" ":"";i+=n===Q?c+je:p>=0?(t.push(d),c.slice(0,p)+te+c.slice(p)+D+_):c+D+(p===-2?s:_)}return[ie(o,i+(o[a]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),t]},aa=class o{constructor({strings:e,_$litType$:a},t){let r;this.parts=[];let i=0,n=0,s=e.length-1,c=this.parts,[d,l]=Fe(e,a);if(this.el=o.createElement(d,t),H.currentNode=this.el.content,a===2||a===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(r=H.nextNode())!==null&&c.length<s;){if(r.nodeType===1){if(r.hasAttributes())for(let p of r.getAttributeNames())if(p.endsWith(te)){let m=l[n++],_=r.getAttribute(p).split(D),f=/([.?@])?(.*)/.exec(m);c.push({type:1,index:i,name:f[2],strings:_,ctor:f[1]==="."?za:f[1]==="?"?Pa:f[1]==="@"?Aa:G}),r.removeAttribute(p)}else p.startsWith(D)&&(c.push({type:6,index:i}),r.removeAttribute(p));if(re.test(r.tagName)){let p=r.textContent.split(D),m=p.length-1;if(m>0){r.textContent=ua?ua.emptyScript:"";for(let _=0;_<m;_++)r.append(p[_],X()),H.nextNode(),c.push({type:2,index:++i});r.append(p[m],X())}}}else if(r.nodeType===8)if(r.data===oe)c.push({type:2,index:i});else{let p=-1;for(;(p=r.data.indexOf(D,p+1))!==-1;)c.push({type:7,index:i}),p+=D.length-1}i++}}static createElement(e,a){let t=R.createElement("template");return t.innerHTML=e,t}};function W(o,e,a=o,t){if(e===B)return e;let r=t!==void 0?a._$Co?.[t]:a._$Cl,i=Y(e)?void 0:e._$litDirective$;return r?.constructor!==i&&(r?._$AO?.(!1),i===void 0?r=void 0:(r=new i(o),r._$AT(o,a,t)),t!==void 0?(a._$Co??=[])[t]=r:a._$Cl=r),r!==void 0&&(e=W(o,r._$AS(o,e.values),r,t)),e}var wa=class{constructor(e,a){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=a}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:a},parts:t}=this._$AD,r=(e?.creationScope??R).importNode(a,!0);H.currentNode=r;let i=H.nextNode(),n=0,s=0,c=t[0];for(;c!==void 0;){if(n===c.index){let d;c.type===2?d=new ea(i,i.nextSibling,this,e):c.type===1?d=new c.ctor(i,c.name,c.strings,this,e):c.type===6&&(d=new Sa(i,this,e)),this._$AV.push(d),c=t[++s]}n!==c?.index&&(i=H.nextNode(),n++)}return H.currentNode=R,r}p(e){let a=0;for(let t of this._$AV)t!==void 0&&(t.strings!==void 0?(t._$AI(e,t,a),a+=t.strings.length-2):t._$AI(e[a])),a++}},ea=class o{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,a,t,r){this.type=2,this._$AH=h,this._$AN=void 0,this._$AA=e,this._$AB=a,this._$AM=t,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,a=this._$AM;return a!==void 0&&e?.nodeType===11&&(e=a.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,a=this){e=W(this,e,a),Y(e)?e===h||e==null||e===""?(this._$AH!==h&&this._$AR(),this._$AH=h):e!==this._$AH&&e!==B&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Le(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==h&&Y(this._$AH)?this._$AA.nextSibling.data=e:this.T(R.createTextNode(e)),this._$AH=e}$(e){let{values:a,_$litType$:t}=e,r=typeof t=="number"?this._$AC(e):(t.el===void 0&&(t.el=aa.createElement(ie(t.h,t.h[0]),this.options)),t);if(this._$AH?._$AD===r)this._$AH.p(a);else{let i=new wa(r,this),n=i.u(this.options);i.p(a),this.T(n),this._$AH=i}}_$AC(e){let a=ee.get(e.strings);return a===void 0&&ee.set(e.strings,a=new aa(e)),a}k(e){Ea(this._$AH)||(this._$AH=[],this._$AR());let a=this._$AH,t,r=0;for(let i of e)r===a.length?a.push(t=new o(this.O(X()),this.O(X()),this,this.options)):t=a[r],t._$AI(i),r++;r<a.length&&(this._$AR(t&&t._$AB.nextSibling,r),a.length=r)}_$AR(e=this._$AA.nextSibling,a){for(this._$AP?.(!1,!0,a);e!==this._$AB;){let t=Ka(e).nextSibling;Ka(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},G=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,a,t,r,i){this.type=1,this._$AH=h,this._$AN=void 0,this.element=e,this.name=a,this._$AM=r,this.options=i,t.length>2||t[0]!==""||t[1]!==""?(this._$AH=Array(t.length-1).fill(new String),this.strings=t):this._$AH=h}_$AI(e,a=this,t,r){let i=this.strings,n=!1;if(i===void 0)e=W(this,e,a,0),n=!Y(e)||e!==this._$AH&&e!==B,n&&(this._$AH=e);else{let s=e,c,d;for(e=i[0],c=0;c<i.length-1;c++)d=W(this,s[t+c],a,c),d===B&&(d=this._$AH[c]),n||=!Y(d)||d!==this._$AH[c],d===h?e=h:e!==h&&(e+=(d??"")+i[c+1]),this._$AH[c]=d}n&&!r&&this.j(e)}j(e){e===h?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},za=class extends G{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===h?void 0:e}},Pa=class extends G{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==h)}},Aa=class extends G{constructor(e,a,t,r,i){super(e,a,t,r,i),this.type=5}_$AI(e,a=this){if((e=W(this,e,a,0)??h)===B)return;let t=this._$AH,r=e===h&&t!==h||e.capture!==t.capture||e.once!==t.once||e.passive!==t.passive,i=e!==h&&(t===h||r);r&&this.element.removeEventListener(this.name,this,t),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Sa=class{constructor(e,a,t){this.element=e,this.type=6,this._$AN=void 0,this._$AM=a,this.options=t}get _$AU(){return this._$AM._$AU}_$AI(e){W(this,e)}};var Te=Ma.litHtmlPolyfillSupport;Te?.(aa,ea),(Ma.litHtmlVersions??=[]).push("3.3.3");var se=(o,e,a)=>{let t=a?.renderBefore??e,r=t._$litPart$;if(r===void 0){let i=a?.renderBefore??null;t._$litPart$=r=new ea(e.insertBefore(X(),i),i,void 0,a??{})}return r._$AI(o),r};var qa=globalThis,V=class extends T{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let a=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=se(a,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return B}};V._$litElement$=!0,V.finalized=!0,qa.litElementHydrateSupport?.({LitElement:V});var Ve=qa.litElementPolyfillSupport;Ve?.({LitElement:V});(qa.litElementVersions??=[]).push("4.2.2");var De="2.0.0",ma="pvpc-bono-social-card",ne=["var(--pvpc-bs-verde)","var(--pvpc-bs-amarillo)","var(--pvpc-bs-naranja)","var(--pvpc-bs-rojo)"],Oe={P1:3,P2:2,P3:0},ra="#4269d0",Oa="#f4bd4a",ja=["pierde_bono","bono_perdido","bono_nuevo","bono_termico","prevision_volatil","cobertura_incompleta","datos_extrapolados","facturas_estimadas","revision_precios","sin_ofertas"],ce=o=>ja.includes(o)?ja.indexOf(o):ja.length;function La(o,e){return Array.isArray(o)&&o.length===3&&o.every(a=>Number.isFinite(Number(a)))?`rgb(${o.map(Number).join(", ")})`:typeof o=="string"&&o.trim()?o.trim():e}var le=`conic-gradient(${["verde","amarillo","naranja","rojo"].map((o,e)=>`var(--pvpc-bs-${o}) ${e*25}% ${(e+1)*25}%`).join(", ")})`,de={min:"M1,3H23L12,22",max:"M1,21H23L12,2",min_hueco:"M12,22L1,3H23L12,22M12,17.5L19.5,5H4.5L12,17.5Z",max_hueco:"M12,2L1,21H23M12,6L19.53,19H4.47"},Va={es:{titulo:"Precio de la luz",anterior:"Factura periodo anterior",en_curso:"Factura periodo en curso",estimada_cierre:"Factura estimada",anterior_corto:"Anterior",en_curso_corto:"En curso",estimada_corto:"Estimada",facturas:"Facturas",sin_facturas:"A\xFAn no hay facturas cerradas",calculada:"calculada",abrir:"Ver todo",cerrar:"Cerrar",factura_real:"Factura real",calculada_consumo:"Calculada con el consumo",real:"real",sin_precio:"Sin precios",no_disponible:"No disponible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"llano",P3:"valle"},sin_entidad:"No se encuentra el sensor de precio de PVPC + Bono Social",comp:{boton:"Comparar tarifas",comparando:"Comparando\u2026",titulo:"Comparativa de tarifas",ultima:"\xDAltima comparaci\xF3n",facturas:o=>o===1?"1 factura":`${o} facturas`,dias:o=>`${o} d\xEDas`,ofertas:o=>`${o} ofertas de la CNMC`,tu_tarifa:"Lo que pagaste (\xFAltimo a\xF1o)",prevision:"PVPC previsto (CNMC, pr\xF3ximos 12 meses)",prevision_bono:"con tu bono, si se cumple la previsi\xF3n",prevision_sin_bono:"sin bono, si se cumple la previsi\xF3n",ultimo_anio:"\xFAltimo a\xF1o",con_prevision:"previsi\xF3n",revision:o=>`revisi\xF3n ${o}`,revisiones:{mensual:"mensual",trimestral:"trimestral",cuatrimestral:"tres veces al a\xF1o",semestral:"semestral",anual:"anual",bienal:"cada dos a\xF1os",trienal:"cada tres a\xF1os",quinquenal:"cada cinco a\xF1os"},depende:(o,e,a,t)=>`${o?`Con los precios del \xFAltimo a\xF1o, la mejor oferta te habr\xEDa salido ${e} m\xE1s barata`:`Con los precios del \xFAltimo a\xF1o, el PVPC te sali\xF3 ${e} m\xE1s barato que la mejor oferta`}; ${a?`con la previsi\xF3n de la CNMC para los pr\xF3ximos 12 meses, la mejor oferta saldr\xEDa ${t} m\xE1s barata`:`con la previsi\xF3n de la CNMC para los pr\xF3ximos 12 meses, el PVPC saldr\xEDa ${t} m\xE1s barato`}. Vuelve a comparar antes de decidir.`,pvpc_bono:"PVPC con bono social",pvpc:"PVPC sin bono",al_anio:"/a\xF1o",sin_permanencia:"sin permanencia",permanencia:"permanencia",nuevos:"solo nuevos clientes",verde:"verde",espera:"Consultando la CNMC con tus facturas. Puede tardar unos segundos\u2026",error:"No se ha podido comparar",sin_datos:"A\xFAn no hay ninguna comparativa.",sin_suministro:"No se encuentra el suministro de la comparativa",estados:{sin_codigo_postal:"Falta el c\xF3digo postal del suministro (opciones del suministro).",sin_datos:"No hay facturas suficientes para comparar.",cnmc_no_responde:"El comparador de la CNMC no responde; int\xE9ntalo m\xE1s tarde."},veredictos:{quedarse_con_bono:["Sigue con PVPC + bono social","Con tu bono, el PVPC sigue siendo lo m\xE1s barato: la mejor oferta libre te costar\xEDa {x} m\xE1s al a\xF1o."],libre_aunque_pierde_bono:["Hay una oferta m\xE1s barata","La mejor oferta libre sale {x} m\xE1s barata al a\xF1o que lo que pagas con bono, aunque lo perder\xEDas. Comprueba las condiciones antes de cambiar."],mercado_libre:["Puedes ahorrar","Con la mejor oferta te ahorrar\xEDas {x} al a\xF1o."],quedarse:["Sigue con tu tarifa","Ninguna oferta mejora lo que pagas: la mejor te costar\xEDa {x} m\xE1s al a\xF1o."],depende_precios:["Depende de los precios",""]},avisos:{pierde_bono:"Con otra comercializadora pierdes el bono social.",bono_perdido:"Ya no tienes bono social: se compara con lo que pagar\xEDas sin \xE9l.",bono_nuevo:"Parte de lo pagado no llevaba el bono que tienes ahora: el ahorro real ser\xEDa menor.",cobertura_incompleta:"No est\xE1n en el comparador: {ausentes}.",datos_extrapolados:"Solo hay {dias} d\xEDas de facturas: lo pagado y el consumo se han llevado a un a\xF1o.",facturas_estimadas:"Hay facturas estimadas: concilia las reales para afinar.",sin_ofertas:"La CNMC no ha devuelto ofertas para tu c\xF3digo postal.",revision_precios:"La mejor oferta revisa sus precios ({revision}); la CNMC calcula sus importes sin esas revisiones.",prevision_volatil:"La previsi\xF3n de la CNMC para el PVPC sale de los precios del mercado de futuros de hoy y cambia mucho de un mes a otro: es un escenario, no lo que vas a pagar.",bono_termico:"Si cambias de comercializadora antes del 1 de enero, no tendr\xE1s el bono social a 31 de diciembre y perder\xE1s el bono social t\xE9rmico que se cobra el pr\xF3ximo a\xF1o: una ayuda en dinero (m\xEDnimo 50 \u20AC) que recibes aunque no tengas gas. Para no perderlo, c\xE1mbiate a partir del 1 de enero."},cerrar:"Cerrar la comparativa",leer_avisos:"\u{1F447} Antes de decidir, lee los avisos del final.",leer_avisos_termico:"\u{1F447} Antes de decidir, lee los avisos del final: hay uno importante sobre el bono social t\xE9rmico.",confirmar:"Los precios son los que publica la CNMC y pueden estar desfasados: conf\xEDrmalos con la comercializadora antes de contratar.",ficha:"Ficha de la oferta en la CNMC (con la web de la comercializadora)",cnmc:"Ver todas las ofertas en el comparador de la CNMC",cnmc_datos:o=>`${o?`Las ${o} ofertas`:"Todas las ofertas"}, calculadas con tu consumo y tu potencia`,pvpc_cnmc:(o,e,a)=>a?`PVPC seg\xFAn la CNMC: ${o} sin bono con los precios del \xFAltimo a\xF1o \xB7 previsi\xF3n pr\xF3ximo a\xF1o: ${e} sin bono, \u2248${a} con tu bono`:e?`PVPC sin bono seg\xFAn la CNMC: ${o} con los precios del \xFAltimo a\xF1o \xB7 previsi\xF3n pr\xF3ximo a\xF1o: ${e}`:`PVPC sin bono seg\xFAn la CNMC: ${o} con los precios del \xFAltimo a\xF1o`,enviar:o=>`Enviar a ${o}`,enviando:"Enviando\u2026",enviado:"Enviada \u2713",termometro:(o,e,a,t,r,i,n)=>o==="mas_barata"?`La mejor oferta de hoy (${a}) es la m\xE1s barata (en \u20AC/kWh) de los \xFAltimos ${e} meses.`:o==="mas_cara"?`La mejor oferta de hoy (${a}) es la m\xE1s cara (en \u20AC/kWh) de los \xFAltimos ${e} meses.`:`La mejor oferta de hoy (${a}) est\xE1 entre la m\xE1s barata (${t}, ${r}) y la m\xE1s cara (${i}, ${n}) de los \xFAltimos ${e} meses.`},hist:{boton:"Hist\xF3rico",titulo:"Hist\xF3rico de comparativas",intro:"Las 3 ofertas m\xE1s baratas de cada mes (importe del primer a\xF1o), la previsi\xF3n m\xE1s baja de la CNMC para el PVPC y lo pagado seg\xFAn la \xFAltima comparativa del mes.",vacio:"A\xFAn no hay comparativas guardadas.",mejor:"mejor oferta",prevision:"CNMC",pagado:"pagado",kwh:o=>`${o} kWh/a\xF1o`,cerrar:"Cerrar el hist\xF3rico"},sub:{boton:"Subir factura",titulo:"Subir factura",intro:"Elige el PDF de la factura, varios a la vez o un ZIP con varias: se leen sus datos para que los revises antes de guardarlos. Solo se leen las facturas de la Comercializadora Regulada, Gas & Power (Naturgy); con otras, a\xF1\xE1dela a mano.",elegir:"Elegir PDF o ZIP",a_mano:"A\xF1adir a mano",leyendo:"Leyendo las facturas\u2026",manual:"Factura a mano",quitar:"Quitar",campos:{inicio:"Inicio del periodo",fin:"Fin del periodo",emision:"Fecha de emisi\xF3n",total:"Total de la factura (\u20AC)",kwh_p1:"Consumo en P1 (kWh)",kwh_p2:"Consumo en P2 (kWh)",kwh_p3:"Consumo en P3 (kWh)",kwh_bonificados:"Consumo bonificado (kWh)"},revisar:"Revisa los datos tal como vienen en la factura. Una factura que se solape con otra ya introducida (por ejemplo, una rectificativa) la sustituye.",fuera:"Se quedan fuera:",guardar:o=>o===1?"Guardar la factura":`Guardar ${o} facturas`,guardando:"Guardando\u2026",hechas:o=>o===1?"Factura introducida \u2713":`${o} facturas introducidas \u2713`,faltan:"Faltan datos: las fechas del periodo, el consumo de P1, P2 y P3 y el total son obligatorios.",demasiados:o=>`Como mucho ${o} archivos a la vez.`,no_subido:"no se ha podido subir",error:"No se han podido leer las facturas",cerrar:"Cerrar",sin_suministro:"No se encuentra el suministro de la factura"}},en:{titulo:"Electricity price",anterior:"Previous bill",en_curso:"Current bill",estimada_cierre:"Estimated bill",anterior_corto:"Previous",en_curso_corto:"Current",estimada_corto:"Estimated",facturas:"Bills",sin_facturas:"No closed bills yet",calculada:"calculated",abrir:"Show everything",cerrar:"Close",factura_real:"Actual bill",calculada_consumo:"Calculated from consumption",real:"actual",sin_precio:"No prices",no_disponible:"Unavailable",hora_actual:"Current hour",periodos:{P1:"peak",P2:"standard",P3:"off-peak"},sin_entidad:"PVPC + Bono Social price sensor not found",comp:{boton:"Compare tariffs",comparando:"Comparing\u2026",titulo:"Tariff comparison",ultima:"Last comparison",facturas:o=>o===1?"1 bill":`${o} bills`,dias:o=>`${o} days`,ofertas:o=>`${o} CNMC offers`,tu_tarifa:"What you paid (last year)",prevision:"Forecast PVPC (CNMC, next 12 months)",prevision_bono:"with your bonus, if the forecast holds",prevision_sin_bono:"without bonus, if the forecast holds",ultimo_anio:"last year",con_prevision:"forecast",revision:o=>`review ${o}`,revisiones:{mensual:"monthly",trimestral:"quarterly",cuatrimestral:"three times a year",semestral:"every six months",anual:"yearly",bienal:"every two years",trienal:"every three years",quinquenal:"every five years"},depende:(o,e,a,t)=>`${o?`At last year's prices, the best offer would have been ${e} cheaper`:`At last year's prices, PVPC was ${e} cheaper than the best offer`}; ${a?`with the CNMC forecast for the next 12 months, the best offer would be ${t} cheaper`:`with the CNMC forecast for the next 12 months, PVPC would be ${t} cheaper`}. Compare again before deciding.`,pvpc_bono:"PVPC with social bonus",pvpc:"PVPC without bonus",al_anio:"/year",sin_permanencia:"no minimum stay",permanencia:"minimum stay",nuevos:"new customers only",verde:"green",espera:"Asking the CNMC with your bills. It may take a few seconds\u2026",error:"The comparison failed",sin_datos:"No comparison yet.",sin_suministro:"The supply for the comparison cannot be found",estados:{sin_codigo_postal:"The supply has no postal code (supply options).",sin_datos:"Not enough bills to compare.",cnmc_no_responde:"The CNMC comparator is not responding; try again later."},veredictos:{quedarse_con_bono:["Stay on PVPC + social bonus","With your bonus, PVPC is still the cheapest: the best free-market offer would cost you {x} more per year."],libre_aunque_pierde_bono:["There is a cheaper offer","The best free-market offer is {x} per year cheaper than what you pay with the bonus, although you would lose it. Check the conditions before switching."],mercado_libre:["You can save","With the best offer you would save {x} per year."],quedarse:["Keep your tariff","No offer beats what you pay: the best would cost you {x} more per year."],depende_precios:["It depends on prices",""]},avisos:{pierde_bono:"Switching retailer loses the social bonus.",bono_perdido:"You no longer have the social bonus: compared with what you would pay without it.",bono_nuevo:"Part of what you paid did not have your current bonus: real savings would be smaller.",cobertura_incompleta:"Not in the comparator: {ausentes}.",datos_extrapolados:"Only {dias} days of bills: payments and consumption extrapolated to a year.",facturas_estimadas:"Some bills are estimates: reconcile the real ones to refine.",sin_ofertas:"The CNMC returned no offers for your postal code.",revision_precios:"The best offer reviews its prices ({revision}); the CNMC works out its amounts without those reviews.",prevision_volatil:"The CNMC forecast for PVPC comes from today's futures market prices and changes a lot from month to month: it is a scenario, not what you will pay.",bono_termico:"If you switch retailer before 1 January, you won't have the social bonus on 31 December and you'll lose the thermal social bonus paid next year: a cash aid (at least \u20AC50) you get even if you have no gas. To keep it, switch on or after 1 January."},cerrar:"Close the comparison",leer_avisos:"\u{1F447} Before deciding, read the notes at the end.",leer_avisos_termico:"\u{1F447} Before deciding, read the notes at the end: there is an important one about the thermal social bonus.",confirmar:"Prices are those published by the CNMC and may be out of date: confirm them with the retailer before signing up.",ficha:"Offer details at the CNMC (with the retailer website)",cnmc:"See all offers in the CNMC comparator",cnmc_datos:o=>`${o?`All ${o} offers`:"All offers"}, calculated with your consumption and power`,pvpc_cnmc:(o,e,a)=>a?`PVPC according to the CNMC: ${o} without bonus at last year's prices \xB7 next year's forecast: ${e} without bonus, \u2248${a} with your bonus`:e?`PVPC without bonus according to the CNMC: ${o} at last year's prices \xB7 next year's forecast: ${e}`:`PVPC without bonus according to the CNMC: ${o} at last year's prices`,enviar:o=>`Send to ${o}`,enviando:"Sending\u2026",enviado:"Sent \u2713",termometro:(o,e,a,t,r,i,n)=>o==="mas_barata"?`Today's best offer (${a}) is the cheapest (per kWh) of the last ${e} months.`:o==="mas_cara"?`Today's best offer (${a}) is the most expensive (per kWh) of the last ${e} months.`:`Today's best offer (${a}) is between the cheapest (${t}, ${r}) and the most expensive (${i}, ${n}) of the last ${e} months.`},hist:{boton:"History",titulo:"Comparison history",intro:"The 3 cheapest offers of each month (first-year amount), the lowest CNMC forecast for PVPC and what you paid according to the month's last comparison.",vacio:"No saved comparisons yet.",mejor:"best offer",prevision:"CNMC",pagado:"paid",kwh:o=>`${o} kWh/year`,cerrar:"Close the history"},sub:{boton:"Upload bill",titulo:"Upload bill",intro:"Choose the bill PDF, several at once or a ZIP with several: their data is read so you can review it before saving. Only bills from Comercializadora Regulada, Gas & Power (Naturgy) are read; for others, add it by hand.",elegir:"Choose PDF or ZIP",a_mano:"Add by hand",leyendo:"Reading the bills\u2026",manual:"Bill entered by hand",quitar:"Remove",campos:{inicio:"Period start",fin:"Period end",emision:"Issue date",total:"Bill total (\u20AC)",kwh_p1:"P1 consumption (kWh)",kwh_p2:"P2 consumption (kWh)",kwh_p3:"P3 consumption (kWh)",kwh_bonificados:"Discounted consumption (kWh)"},revisar:"Check the data exactly as it appears on the bill. A bill overlapping one already entered (for example, a corrective bill) replaces it.",fuera:"Left out:",guardar:o=>o===1?"Save the bill":`Save ${o} bills`,guardando:"Saving\u2026",hechas:o=>o===1?"Bill entered \u2713":`${o} bills entered \u2713`,faltan:"Missing data: the period dates, P1, P2 and P3 consumption and the total are required.",demasiados:o=>`At most ${o} files at a time.`,no_subido:"could not be uploaded",error:"The bills could not be read",cerrar:"Close",sin_suministro:"The supply of the bill cannot be found"}},ca:{titulo:"Preu de la llum",anterior:"Factura del per\xEDode anterior",en_curso:"Factura del per\xEDode en curs",estimada_cierre:"Factura estimada",anterior_corto:"Anterior",en_curso_corto:"En curs",estimada_corto:"Estimada",facturas:"Factures",sin_facturas:"Encara no hi ha factures tancades",calculada:"calculada",abrir:"Veure-ho tot",cerrar:"Tanca",factura_real:"Factura real",calculada_consumo:"Calculada amb el consum",real:"real",sin_precio:"Sense preus",no_disponible:"No disponible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"pla",P3:"vall"},sin_entidad:"No es troba el sensor de preu de PVPC + Bono Social",comp:{boton:"Comparar tarifes",comparando:"Comparant\u2026",titulo:"Comparativa de tarifes",ultima:"\xDAltima comparaci\xF3",facturas:o=>o===1?"1 factura":`${o} factures`,dias:o=>`${o} dies`,ofertas:o=>`${o} ofertes de la CNMC`,tu_tarifa:"El que vas pagar (\xFAltim any)",prevision:"PVPC previst (CNMC, pr\xF2xims 12 mesos)",prevision_bono:"amb el teu bo, si es compleix la previsi\xF3",prevision_sin_bono:"sense bo, si es compleix la previsi\xF3",ultimo_anio:"\xFAltim any",con_prevision:"previsi\xF3",revision:o=>`revisi\xF3 ${o}`,revisiones:{mensual:"mensual",trimestral:"trimestral",cuatrimestral:"tres vegades l'any",semestral:"semestral",anual:"anual",bienal:"cada dos anys",trienal:"cada tres anys",quinquenal:"cada cinc anys"},depende:(o,e,a,t)=>`${o?`Amb els preus de l'\xFAltim any, la millor oferta t'hauria sortit ${e} m\xE9s barata`:`Amb els preus de l'\xFAltim any, el PVPC et va sortir ${e} m\xE9s barat que la millor oferta`}; ${a?`amb la previsi\xF3 de la CNMC per als pr\xF2xims 12 mesos, la millor oferta sortiria ${t} m\xE9s barata`:`amb la previsi\xF3 de la CNMC per als pr\xF2xims 12 mesos, el PVPC sortiria ${t} m\xE9s barat`}. Torna a comparar abans de decidir.`,pvpc_bono:"PVPC amb bo social",pvpc:"PVPC sense bo",al_anio:"/any",sin_permanencia:"sense perman\xE8ncia",permanencia:"perman\xE8ncia",nuevos:"nom\xE9s clients nous",verde:"verda",espera:"Consultant la CNMC amb les teves factures. Pot trigar uns segons\u2026",error:"No s'ha pogut comparar",sin_datos:"Encara no hi ha cap comparativa.",sin_suministro:"No es troba el subministrament de la comparativa",estados:{sin_codigo_postal:"Falta el codi postal del subministrament (opcions del subministrament).",sin_datos:"No hi ha prou factures per comparar.",cnmc_no_responde:"El comparador de la CNMC no respon; torna-ho a provar m\xE9s tard."},veredictos:{quedarse_con_bono:["Continua amb PVPC + bo social","Amb el teu bo, el PVPC continua sent el m\xE9s barat: la millor oferta lliure et costaria {x} m\xE9s l'any."],libre_aunque_pierde_bono:["Hi ha una oferta m\xE9s barata","La millor oferta lliure surt {x} m\xE9s barata l'any que el que pagues amb bo, tot i que el perdries. Comprova les condicions abans de canviar."],mercado_libre:["Pots estalviar","Amb la millor oferta t'estalviaries {x} l'any."],quedarse:["Continua amb la teva tarifa","Cap oferta millora el que pagues: la millor et costaria {x} m\xE9s l'any."],depende_precios:["Dep\xE8n dels preus",""]},avisos:{pierde_bono:"Amb una altra comercialitzadora perds el bo social.",bono_perdido:"Ja no tens bo social: es compara amb el que pagaries sense.",bono_nuevo:"Part del que s'ha pagat no portava el bo que tens ara: l'estalvi real seria menor.",cobertura_incompleta:"No s\xF3n al comparador: {ausentes}.",datos_extrapolados:"Nom\xE9s hi ha {dias} dies de factures: el que s'ha pagat i el consum s'han extrapolat a un any.",facturas_estimadas:"Hi ha factures estimades: concilia les reals per afinar.",sin_ofertas:"La CNMC no ha retornat ofertes per al teu codi postal.",revision_precios:"La millor oferta revisa els seus preus ({revision}); la CNMC en calcula els imports sense aquestes revisions.",prevision_volatil:"La previsi\xF3 de la CNMC per al PVPC surt dels preus del mercat de futurs d'avui i canvia molt d'un mes a l'altre: \xE9s un escenari, no el que pagar\xE0s.",bono_termico:"Si canvies de comercialitzadora abans de l'1 de gener, no tindr\xE0s el bo social a 31 de desembre i perdr\xE0s el bo social t\xE8rmic que es cobra l'any vinent: un ajut en diners (m\xEDnim 50 \u20AC) que reps encara que no tinguis gas. Per no perdre'l, canvia a partir de l'1 de gener."},cerrar:"Tanca la comparativa",leer_avisos:"\u{1F447} Abans de decidir, llegeix els avisos del final.",leer_avisos_termico:"\u{1F447} Abans de decidir, llegeix els avisos del final: n'hi ha un d'important sobre el bo social t\xE8rmic.",confirmar:"Els preus s\xF3n els que publica la CNMC i poden estar desfasats: confirma'ls amb la comercialitzadora abans de contractar.",ficha:"Fitxa de l'oferta a la CNMC (amb el web de la comercialitzadora)",cnmc:"Veure totes les ofertes al comparador de la CNMC",cnmc_datos:o=>`${o?`Les ${o} ofertes`:"Totes les ofertes"}, calculades amb el teu consum i la teva pot\xE8ncia`,pvpc_cnmc:(o,e,a)=>a?`PVPC segons la CNMC: ${o} sense bo amb els preus de l'\xFAltim any \xB7 previsi\xF3 per a l'any vinent: ${e} sense bo, \u2248${a} amb el teu bo`:e?`PVPC sense bo segons la CNMC: ${o} amb els preus de l'\xFAltim any \xB7 previsi\xF3 per a l'any vinent: ${e}`:`PVPC sense bo segons la CNMC: ${o} amb els preus de l'\xFAltim any`,enviar:o=>`Envia a ${o}`,enviando:"Enviant\u2026",enviado:"Enviada \u2713",termometro:(o,e,a,t,r,i,n)=>o==="mas_barata"?`La millor oferta d'avui (${a}) \xE9s la m\xE9s barata (en \u20AC/kWh) dels \xFAltims ${e} mesos.`:o==="mas_cara"?`La millor oferta d'avui (${a}) \xE9s la m\xE9s cara (en \u20AC/kWh) dels \xFAltims ${e} mesos.`:`La millor oferta d'avui (${a}) est\xE0 entre la m\xE9s barata (${t}, ${r}) i la m\xE9s cara (${i}, ${n}) dels \xFAltims ${e} mesos.`},hist:{boton:"Hist\xF2ric",titulo:"Hist\xF2ric de comparatives",intro:"Les 3 ofertes m\xE9s barates de cada mes (import del primer any), la previsi\xF3 m\xE9s baixa de la CNMC per al PVPC i el que s'ha pagat segons l'\xFAltima comparativa del mes.",vacio:"Encara no hi ha comparatives desades.",mejor:"millor oferta",prevision:"CNMC",pagado:"pagat",kwh:o=>`${o} kWh/any`,cerrar:"Tanca l'hist\xF2ric"},sub:{boton:"Pujar factura",titulo:"Pujar factura",intro:"Tria el PDF de la factura, diversos alhora o un ZIP amb diverses factures: se'n llegeixen les dades perqu\xE8 les revisis abans de desar-les. Nom\xE9s es llegeixen les factures de la Comercializadora Regulada, Gas & Power (Naturgy); amb altres, afegeix-la a m\xE0.",elegir:"Tria un PDF o ZIP",a_mano:"Afegeix a m\xE0",leyendo:"Llegint les factures\u2026",manual:"Factura a m\xE0",quitar:"Treu",campos:{inicio:"Inici del per\xEDode",fin:"Fi del per\xEDode",emision:"Data d'emissi\xF3",total:"Total de la factura (\u20AC)",kwh_p1:"Consum en P1 (kWh)",kwh_p2:"Consum en P2 (kWh)",kwh_p3:"Consum en P3 (kWh)",kwh_bonificados:"Consum bonificat (kWh)"},revisar:"Revisa les dades tal com figuren a la factura. Una factura que se solapi amb una altra ja introdu\xEFda (per exemple, una rectificativa) la substitueix.",fuera:"Queden fora:",guardar:o=>o===1?"Desa la factura":`Desa ${o} factures`,guardando:"Desant\u2026",hechas:o=>o===1?"Factura introdu\xEFda \u2713":`${o} factures introdu\xEFdes \u2713`,faltan:"Falten dades: les dates del per\xEDode, el consum de P1, P2 i P3 i el total s\xF3n obligatoris.",demasiados:o=>`Com a m\xE0xim ${o} fitxers alhora.`,no_subido:"no s'ha pogut pujar",error:"No s'han pogut llegir les factures",cerrar:"Tanca",sin_suministro:"No es troba el subministrament de la factura"}},gl:{titulo:"Prezo da luz",anterior:"Factura do per\xEDodo anterior",en_curso:"Factura do per\xEDodo en curso",estimada_cierre:"Factura estimada",anterior_corto:"Anterior",en_curso_corto:"En curso",estimada_corto:"Estimada",facturas:"Facturas",sin_facturas:"A\xEDnda non hai facturas pechadas",calculada:"calculada",abrir:"Ver todo",cerrar:"Pechar",factura_real:"Factura real",calculada_consumo:"Calculada co consumo",real:"real",sin_precio:"Sen prezos",no_disponible:"Non dispo\xF1ible",hora_actual:"Hora actual",periodos:{P1:"punta",P2:"chan",P3:"val"},sin_entidad:"Non se atopa o sensor de prezo de PVPC + Bono Social",comp:{boton:"Comparar tarifas",comparando:"Comparando\u2026",titulo:"Comparativa de tarifas",ultima:"\xDAltima comparaci\xF3n",facturas:o=>o===1?"1 factura":`${o} facturas`,dias:o=>`${o} d\xEDas`,ofertas:o=>`${o} ofertas da CNMC`,tu_tarifa:"O que pagaches (\xFAltimo ano)",prevision:"PVPC previsto (CNMC, pr\xF3ximos 12 meses)",prevision_bono:"co teu bono, se se cumpre a previsi\xF3n",prevision_sin_bono:"sen bono, se se cumpre a previsi\xF3n",ultimo_anio:"\xFAltimo ano",con_prevision:"previsi\xF3n",revision:o=>`revisi\xF3n ${o}`,revisiones:{mensual:"mensual",trimestral:"trimestral",cuatrimestral:"tres veces ao ano",semestral:"semestral",anual:"anual",bienal:"cada dous anos",trienal:"cada tres anos",quinquenal:"cada cinco anos"},depende:(o,e,a,t)=>`${o?`Cos prezos do \xFAltimo ano, a mellor oferta sa\xEDriache ${e} m\xE1is barata`:`Cos prezos do \xFAltimo ano, o PVPC sa\xEDuche ${e} m\xE1is barato que a mellor oferta`}; ${a?`coa previsi\xF3n da CNMC para os pr\xF3ximos 12 meses, a mellor oferta sair\xEDa ${t} m\xE1is barata`:`coa previsi\xF3n da CNMC para os pr\xF3ximos 12 meses, o PVPC sair\xEDa ${t} m\xE1is barato`}. Volve comparar antes de decidir.`,pvpc_bono:"PVPC con bono social",pvpc:"PVPC sen bono",al_anio:"/ano",sin_permanencia:"sen permanencia",permanencia:"permanencia",nuevos:"s\xF3 clientes novos",verde:"verde",espera:"Consultando a CNMC coas t\xFAas facturas. Pode tardar uns segundos\u2026",error:"Non foi posible comparar",sin_datos:"A\xEDnda non hai ningunha comparativa.",sin_suministro:"Non se atopa a subministraci\xF3n da comparativa",estados:{sin_codigo_postal:"Falta o c\xF3digo postal da subministraci\xF3n (opci\xF3ns da subministraci\xF3n).",sin_datos:"Non hai facturas suficientes para comparar.",cnmc_no_responde:"O comparador da CNMC non responde; t\xE9ntao m\xE1is tarde."},veredictos:{quedarse_con_bono:["Segue co PVPC + bono social","Co teu bono, o PVPC segue sendo o m\xE1is barato: a mellor oferta libre custar\xEDache {x} m\xE1is ao ano."],libre_aunque_pierde_bono:["Hai unha oferta m\xE1is barata","A mellor oferta libre sae {x} m\xE1is barata ao ano do que pagas con bono, a\xEDnda que o perder\xEDas. Comproba as condici\xF3ns antes de cambiar."],mercado_libre:["Podes aforrar","Coa mellor oferta aforrar\xEDas {x} ao ano."],quedarse:["Segue coa t\xFAa tarifa","Ningunha oferta mellora o que pagas: a mellor custar\xEDache {x} m\xE1is ao ano."],depende_precios:["Depende dos prezos",""]},avisos:{pierde_bono:"Con outra comercializadora perdes o bono social.",bono_perdido:"Xa non tes bono social: comp\xE1rase co que pagar\xEDas sen el.",bono_nuevo:"Parte do pagado non levaba o bono que tes agora: o aforro real ser\xEDa menor.",cobertura_incompleta:"Non est\xE1n no comparador: {ausentes}.",datos_extrapolados:"S\xF3 hai {dias} d\xEDas de facturas: o pagado e o consumo lev\xE1ronse a un ano.",facturas_estimadas:"Hai facturas estimadas: concilia as reais para afinar.",sin_ofertas:"A CNMC non devolveu ofertas para o teu c\xF3digo postal.",revision_precios:"A mellor oferta revisa os seus prezos ({revision}); a CNMC calcula os seus importes sen esas revisi\xF3ns.",prevision_volatil:"A previsi\xF3n da CNMC para o PVPC sae dos prezos do mercado de futuros de hoxe e cambia moito dun mes a outro: \xE9 un escenario, non o que vas pagar.",bono_termico:"Se cambias de comercializadora antes do 1 de xaneiro, non ter\xE1s o bono social a 31 de decembro e perder\xE1s o bono social t\xE9rmico que se cobra o pr\xF3ximo ano: unha axuda en di\xF1eiro (m\xEDnimo 50 \u20AC) que recibes a\xEDnda que non te\xF1as gas. Para non perdelo, cambia a partir do 1 de xaneiro."},cerrar:"Pechar a comparativa",leer_avisos:"\u{1F447} Antes de decidir, le os avisos do final.",leer_avisos_termico:"\u{1F447} Antes de decidir, le os avisos do final: hai un importante sobre o bono social t\xE9rmico.",confirmar:"Os prezos son os que publica a CNMC e poden estar desfasados: conf\xEDrmaos coa comercializadora antes de contratar.",ficha:"Ficha da oferta na CNMC (coa web da comercializadora)",cnmc:"Ver todas as ofertas no comparador da CNMC",cnmc_datos:o=>`${o?`As ${o} ofertas`:"Todas as ofertas"}, calculadas co teu consumo e a t\xFAa potencia`,pvpc_cnmc:(o,e,a)=>a?`PVPC segundo a CNMC: ${o} sen bono cos prezos do \xFAltimo ano \xB7 previsi\xF3n para o pr\xF3ximo ano: ${e} sen bono, \u2248${a} co teu bono`:e?`PVPC sen bono segundo a CNMC: ${o} cos prezos do \xFAltimo ano \xB7 previsi\xF3n para o pr\xF3ximo ano: ${e}`:`PVPC sen bono segundo a CNMC: ${o} cos prezos do \xFAltimo ano`,enviar:o=>`Enviar a ${o}`,enviando:"Enviando\u2026",enviado:"Enviada \u2713",termometro:(o,e,a,t,r,i,n)=>o==="mas_barata"?`A mellor oferta de hoxe (${a}) \xE9 a m\xE1is barata (en \u20AC/kWh) dos \xFAltimos ${e} meses.`:o==="mas_cara"?`A mellor oferta de hoxe (${a}) \xE9 a m\xE1is cara (en \u20AC/kWh) dos \xFAltimos ${e} meses.`:`A mellor oferta de hoxe (${a}) est\xE1 entre a m\xE1is barata (${t}, ${r}) e a m\xE1is cara (${i}, ${n}) dos \xFAltimos ${e} meses.`},hist:{boton:"Hist\xF3rico",titulo:"Hist\xF3rico de comparativas",intro:"As 3 ofertas m\xE1is baratas de cada mes (importe do primeiro ano), a previsi\xF3n m\xE1is baixa da CNMC para o PVPC e o pagado segundo a \xFAltima comparativa do mes.",vacio:"A\xEDnda non hai comparativas gardadas.",mejor:"mellor oferta",prevision:"CNMC",pagado:"pagado",kwh:o=>`${o} kWh/ano`,cerrar:"Pechar o hist\xF3rico"},sub:{boton:"Subir factura",titulo:"Subir factura",intro:"Escolle o PDF da factura, varios \xE1 vez ou un ZIP con varias: lense os seus datos para que os revises antes de gardalos. S\xF3 se len as facturas da Comercializadora Regulada, Gas & Power (Naturgy); con outras, eng\xE1dea a man.",elegir:"Escoller PDF ou ZIP",a_mano:"Engadir a man",leyendo:"Lendo as facturas\u2026",manual:"Factura a man",quitar:"Quitar",campos:{inicio:"Inicio do per\xEDodo",fin:"Fin do per\xEDodo",emision:"Data de emisi\xF3n",total:"Total da factura (\u20AC)",kwh_p1:"Consumo en P1 (kWh)",kwh_p2:"Consumo en P2 (kWh)",kwh_p3:"Consumo en P3 (kWh)",kwh_bonificados:"Consumo bonificado (kWh)"},revisar:"Revisa os datos tal como ve\xF1en na factura. Unha factura que se solape con outra xa introducida (por exemplo, unha rectificativa) substit\xFAea.",fuera:"Quedan f\xF3ra:",guardar:o=>o===1?"Gardar a factura":`Gardar ${o} facturas`,guardando:"Gardando\u2026",hechas:o=>o===1?"Factura introducida \u2713":`${o} facturas introducidas \u2713`,faltan:"Faltan datos: as datas do per\xEDodo, o consumo de P1, P2 e P3 e o total son obrigatorios.",demasiados:o=>`Como moito ${o} ficheiros \xE1 vez.`,no_subido:"non foi posible subilo",error:"Non foi posible ler as facturas",cerrar:"Pechar",sin_suministro:"Non se atopa a subministraci\xF3n da factura"}},eu:{titulo:"Argindarraren prezioa",anterior:"Aurreko aldiko faktura",en_curso:"Aldi honetako faktura",estimada_cierre:"Zenbatetsitako faktura",anterior_corto:"Aurrekoa",en_curso_corto:"Oraingoa",estimada_corto:"Zenbatetsia",facturas:"Fakturak",sin_facturas:"Oraindik ez dago itxitako fakturarik",calculada:"kalkulatua",abrir:"Ikusi dena",cerrar:"Itxi",factura_real:"Benetako faktura",calculada_consumo:"Kontsumoarekin kalkulatua",real:"benetakoa",sin_precio:"Preziorik ez",no_disponible:"Ez dago erabilgarri",hora_actual:"Uneko ordua",periodos:{P1:"puntakoa",P2:"laua",P3:"harana"},sin_entidad:"Ez da aurkitu PVPC + Bono Social integrazioaren prezio-sentsorea",comp:{boton:"Alderatu tarifak",comparando:"Alderatzen\u2026",titulo:"Tarifen konparaketa",ultima:"Azken konparaketa",facturas:o=>o===1?"1 faktura":`${o} faktura`,dias:o=>`${o} egun`,ofertas:o=>`CNMCren ${o} eskaintza`,tu_tarifa:"Ordaindu zenuena (azken urtea)",prevision:"Aurreikusitako PVPC (CNMC, hurrengo 12 hilabeteak)",prevision_bono:"zure bonuarekin, aurreikuspena betetzen bada",prevision_sin_bono:"bonurik gabe, aurreikuspena betetzen bada",ultimo_anio:"azken urtea",con_prevision:"aurreikuspena",revision:o=>`berrikuspena: ${o}`,revisiones:{mensual:"hilero",trimestral:"hiru hilean behin",cuatrimestral:"urtean hiru aldiz",semestral:"sei hilean behin",anual:"urtero",bienal:"bi urtean behin",trienal:"hiru urtean behin",quinquenal:"bost urtean behin"},depende:(o,e,a,t)=>`${o?`Azken urteko prezioekin, eskaintza onenarekin ${e} gutxiago ordainduko zenukeen`:`Azken urteko prezioekin, PVPCarekin ${e} gutxiago ordaindu zenuen eskaintza onenarekin baino`}; ${a?`CNMCk hurrengo 12 hilabeteetarako egindako aurreikuspenarekin, eskaintza onenarekin ${t} gutxiago ordainduko zenuke`:`CNMCk hurrengo 12 hilabeteetarako egindako aurreikuspenarekin, PVPCarekin ${t} gutxiago ordainduko zenuke`}. Alderatu berriro erabaki aurretik.`,pvpc_bono:"PVPC gizarte-bonuarekin",pvpc:"PVPC bonurik gabe",al_anio:"/urte",sin_permanencia:"iraunkortasunik gabe",permanencia:"iraunkortasuna",nuevos:"bezero berrientzat soilik",verde:"berdea",espera:"CNMCri kontsultatzen zure fakturekin. Segundo batzuk behar izan ditzake\u2026",error:"Ezin izan da alderatu",sin_datos:"Oraindik ez dago konparaketarik.",sin_suministro:"Ez da aurkitu konparaketaren hornidura",estados:{sin_codigo_postal:"Hornidurako posta-kodea falta da (hornidurako aukerak).",sin_datos:"Ez dago alderatzeko adina faktura.",cnmc_no_responde:"CNMCren konparatzaileak ez du erantzuten; saiatu berriro geroago."},veredictos:{quedarse_con_bono:["Jarraitu PVPC + gizarte-bonuarekin","Zure bonuarekin, PVPC da oraindik merkeena: eskaintza libre onenak {x} gehiago kostatuko litzaizuke urtean."],libre_aunque_pierde_bono:["Eskaintza merkeago bat dago","Eskaintza libre onena urtean {x} merkeagoa da bonuarekin ordaintzen duzuna baino, nahiz eta bonua galdu. Egiaztatu baldintzak aldatu aurretik."],mercado_libre:["Aurreztu dezakezu","Eskaintza onenarekin {x} aurreztuko zenuke urtean."],quedarse:["Jarraitu zure tarifarekin","Eskaintza batek ere ez du hobetzen ordaintzen duzuna: onenak {x} gehiago kostatuko litzaizuke urtean."],depende_precios:["Prezioen araberakoa da",""]},avisos:{pierde_bono:"Beste merkaturatzaile batekin, gizarte-bonua galtzen duzu.",bono_perdido:"Jada ez duzu gizarte-bonurik: bonurik gabe ordainduko zenukeenarekin alderatzen da.",bono_nuevo:"Ordaindutakoaren zati batek ez zuen orain duzun bonua: benetako aurrezpena txikiagoa izango litzateke.",cobertura_incompleta:"Hauek ez daude konparatzailean: {ausentes}.",datos_extrapolados:"{dias} egunetako fakturak baino ez daude: ordaindutakoa eta kontsumoa urtebetera eraman dira.",facturas_estimadas:"Faktura zenbatetsiak daude: bateratu benetakoak doitzeko.",sin_ofertas:"CNMCk ez du eskaintzarik itzuli zure posta-koderako.",revision_precios:"Eskaintza onenak bere prezioak berrikusten ditu ({revision}); CNMCk berrikuspen horiek gabe kalkulatzen ditu zenbatekoak.",prevision_volatil:"CNMCk PVPCrako egiten duen aurreikuspena gaurko etorkizun-merkatuko prezioetatik ateratzen da, eta asko aldatzen da hilabete batetik bestera: agertoki bat da, ez ordainduko duzuna.",bono_termico:"Urtarrilaren 1a baino lehen merkaturatzailez aldatzen bazara, ez duzu gizarte-bonurik izango abenduaren 31n, eta hurrengo urtean kobratzen den gizarte-bono termikoa galduko duzu: diru-laguntza bat (gutxienez 50 \u20AC), gasik ez baduzu ere jasotzen duzuna. Ez galtzeko, aldatu urtarrilaren 1etik aurrera."},cerrar:"Itxi konparaketa",leer_avisos:"\u{1F447} Erabaki aurretik, irakurri amaierako abisuak.",leer_avisos_termico:"\u{1F447} Erabaki aurretik, irakurri amaierako abisuak: bat garrantzitsua da gizarte-bono termikoari buruz.",confirmar:"Prezioak CNMCk argitaratutakoak dira, eta zaharkituta egon daitezke: berretsi merkaturatzailearekin kontratatu aurretik.",ficha:"Eskaintzaren fitxa CNMCn (merkaturatzailearen webgunearekin)",cnmc:"Ikusi eskaintza guztiak CNMCren konparatzailean",cnmc_datos:o=>`${o?`${o} eskaintzak`:"Eskaintza guztiak"}, zure kontsumoarekin eta potentziarekin kalkulatuta`,pvpc_cnmc:(o,e,a)=>a?`PVPC, CNMCren arabera: ${o} bonurik gabe, azken urteko prezioekin \xB7 hurrengo urteko aurreikuspena: ${e} bonurik gabe, \u2248${a} zure bonuarekin`:e?`PVPC bonurik gabe, CNMCren arabera: ${o}, azken urteko prezioekin \xB7 hurrengo urteko aurreikuspena: ${e}`:`PVPC bonurik gabe, CNMCren arabera: ${o}, azken urteko prezioekin`,enviar:o=>`Bidali hona: ${o}`,enviando:"Bidaltzen\u2026",enviado:"Bidalita \u2713",termometro:(o,e,a,t,r,i,n)=>o==="mas_barata"?`Gaurko eskaintza onena (${a}) azken ${e} hilabeteetako merkeena da (\u20AC/kWh-tan).`:o==="mas_cara"?`Gaurko eskaintza onena (${a}) azken ${e} hilabeteetako garestiena da (\u20AC/kWh-tan).`:`Gaurko eskaintza onena (${a}) azken ${e} hilabeteetako merkeenaren (${t}, ${r}) eta garestienaren (${i}, ${n}) artean dago.`},hist:{boton:"Historikoa",titulo:"Konparaketen historikoa",intro:"Hilabete bakoitzeko 3 eskaintza merkeenak (lehen urteko zenbatekoa), CNMCk PVPCrako egindako aurreikuspen baxuena eta ordaindutakoa, hilabeteko azken konparaketaren arabera.",vacio:"Oraindik ez dago gordetako konparaketarik.",mejor:"eskaintza onena",prevision:"CNMC",pagado:"ordaindua",kwh:o=>`${o} kWh/urte`,cerrar:"Itxi historikoa"},sub:{boton:"Igo faktura",titulo:"Igo faktura",intro:"Aukeratu fakturaren PDFa, hainbat batera edo hainbat dituen ZIP bat: haien datuak irakurtzen dira, gorde aurretik berrikus ditzazun. Comercializadora Regulada, Gas & Power (Naturgy) merkaturatzailearen fakturak soilik irakurtzen dira; besteekin, gehitu eskuz.",elegir:"Aukeratu PDFa edo ZIPa",a_mano:"Gehitu eskuz",leyendo:"Fakturak irakurtzen\u2026",manual:"Eskuzko faktura",quitar:"Kendu",campos:{inicio:"Aldiaren hasiera",fin:"Aldiaren amaiera",emision:"Jaulkipen-data",total:"Fakturaren guztizkoa (\u20AC)",kwh_p1:"Kontsumoa P1 aldian (kWh)",kwh_p2:"Kontsumoa P2 aldian (kWh)",kwh_p3:"Kontsumoa P3 aldian (kWh)",kwh_bonificados:"Kontsumo hobariduna (kWh)"},revisar:"Berrikusi datuak fakturan datozen bezala. Jada sartutako beste batekin gainjartzen den faktura batek (adibidez, faktura zuzentzaile batek) hura ordezten du.",fuera:"Kanpoan geratzen dira:",guardar:o=>o===1?"Gorde faktura":`Gorde ${o} faktura`,guardando:"Gordetzen\u2026",hechas:o=>o===1?"Faktura sartu da \u2713":`${o} faktura sartu dira \u2713`,faltan:"Datuak falta dira: aldiaren datak, P1, P2 eta P3 aldietako kontsumoa eta guztizkoa derrigorrezkoak dira.",demasiados:o=>`Gehienez ${o} fitxategi aldi berean.`,no_subido:"ezin izan da igo",error:"Ezin izan dira fakturak irakurri",cerrar:"Itxi",sin_suministro:"Ez da aurkitu fakturaren hornidura"}}},ue=12,He=["ca","gl","eu"],pa=480,Re=.95,Be=1.2;function pe(o,e,a){if(!o)return{ancho:pa,alto:e};let t=Math.min(Math.max(o/pa,Re),Be),r=Math.round(o/t),i=Math.round(e*r/pa),n=r>pa?Math.min(i,a):Math.max(i,Math.round(e*.8));return{ancho:r,alto:n}}function Fa(o,e){return Math.max(1,Math.ceil(e/o))}function ha(o,e=!1){let a=e?"price_next_day_":"price_",t=[];for(let r=0;r<24;r++){let i=String(r).padStart(2,"0"),n=o?.[`${a}${i}h`];typeof n=="number"&&t.push({hora:r,precio:n});let s=o?.[`${a}${i}h_d`];typeof s=="number"&&t.push({hora:r,precio:s})}return t}var he=new Map;function Ie(o){let e=o||"",a=he.get(e);if(!a){let t={hourCycle:"h23",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric"};try{a=new Intl.DateTimeFormat("en-US",o?{...t,timeZone:o}:t)}catch{a=new Intl.DateTimeFormat("en-US",t)}he.set(e,a)}return a}function ia(o=new Date,e){let a={};for(let{type:i,value:n}of Ie(e).formatToParts(o))a[i]=Number(n);let t={anio:a.year,mes:a.month,dia:a.day,hora:a.hour%24,minuto:a.minute},r=Date.UTC(t.anio,t.mes-1,t.dia,t.hora,t.minuto);return t.desfase=Math.round((r-Math.floor(o.getTime()/6e4)*6e4)/6e4),t}function I(o){return o?.config?.time_zone||void 0}function Ta(o=new Date,e,a=0){let t=ia(o,e);return new Date(Date.UTC(t.anio,t.mes-1,t.dia+a)).toISOString().slice(0,10)}function me(o=new Date,e){let a=ia(o,e);return`${a.anio}-${a.mes}-${a.dia}-${a.hora}-${a.desfase}`}function Ue(o,e=new Date,a){let t=ia(e,a).hora,r=o.findIndex(n=>n.hora===t);return ia(new Date(e.getTime()-36e5),a).hora===t&&o[r+1]?.hora===t?r+1:r}function fa(o){if(!o.length)return null;let e=0,a=0;return o.forEach((t,r)=>{t.precio<o[e].precio&&(e=r),t.precio>o[a].precio&&(a=r)}),{min:o[e],max:o[a]}}function fe(o){let e=fa(o);if(!e)return[];let a=e.max.precio-e.min.precio;return o.map(t=>a?Math.min(3,Math.floor((t.precio-e.min.precio)/a*4)):0)}function A(o,e,a=()=>!0){return Object.keys(o?.states||{}).filter(t=>t.startsWith(e)&&a(o.states[t])).sort()[0]}function _a(o){return o?.states["sensor.pvpc_bs_precio"]?"sensor.pvpc_bs_precio":A(o,"sensor.",e=>"price_00h"in(e.attributes||{})&&String(e.attributes.attribution||"").includes("REE"))}var We={current:!0,details:!0,extremos:"columnas",graph:!0,next_day:!0,extremos_manana:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,icon_color:"price",colores:"fijo",color_hoy:ra,color_manana:Oa,bandas:!0,grafica_facturas:!1,facturas_meses:"6",facturas_importe:!0,grosor:"2.5",excedentes_grafica:!0};function be(o){let e={};for(let[t,r]of[["show_current","current"],["show_details","details"],["show_graph","graph"]])typeof o[t]=="boolean"&&!(r in o)&&(e[r]=o[t]);typeof o.show_only_today=="boolean"&&!("next_day"in o)&&(e.next_day=!o.show_only_today);let a={...We,...e,...o};return!("extremos_manana"in o)&&a.next_day===!1&&(a.extremos_manana=!1),a}var ta=class extends V{constructor(){super(...arguments);U(this,"_id",Math.random().toString(36).slice(2,8));U(this,"_claveFactura",0)}static async getConfigElement(){return await Ze(),document.createElement(ge)}static get textos(){return{tarjeta:Va,editor:Da}}static getStubConfig(a){return{entity:_a(a)||"sensor.pvpc_bs_precio",entity_factura_actual:A(a,"sensor.pvpc_bs_factura_actual")||"sensor.pvpc_bs_factura_actual",entity_factura_anterior:A(a,"sensor.pvpc_bs_factura_anterior")||"sensor.pvpc_bs_factura_anterior",title:"PVPC",current:!0,icon_color:"price",factura:"header",factura_anterior:!1,factura_actual:!0,prevision:!0,details:!0,extremos_manana:!0,extremos:"columnas",graph:!0,next_day:!0,excedentes_grafica:!1,bandas:!0,titulo_grafica:"",grosor:"1.5",colores:"fijo",grafica_facturas:!1,facturas_importe:!0,facturas_tendencia:!0,facturas_meses:"12",grid_options:{columns:"full",rows:"auto"}}}setConfig(a){if(!a)throw new Error(sa(ve()).config_no_valida);this._config=be(a)}getCardSize(){return this._config?.graph===!1?3:7}getGridOptions(){return{columns:"full",rows:"auto",min_columns:6,min_rows:3}}get _cHoy(){return La(this._config.color_hoy,ra)}get _cManana(){return La(this._config.color_manana,Oa)}get _t(){return $e(this.hass)}async _mensajeError(a){let{translation_domain:t,translation_key:r,translation_placeholders:i}=a||{};if(t&&r&&this.hass?.loadBackendTranslation)try{let s=(await this.hass.loadBackendTranslation("exceptions",t))(`component.${t}.exceptions.${r}.message`,i||{});if(s)return s}catch{}return a?.message||String(a)}get _idiomas(){let a=this.hass?.locale?.language||this.hass?.language||"es";return He.includes(a.slice(0,2))?[a,"es"]:a}_num(a,t=3){return new Intl.NumberFormat(this._idiomas,{minimumFractionDigits:t,maximumFractionDigits:t}).format(a)}_entidadesVigiladas(a){let t=this._config;return[t.entity||_a(a),t.entity_injection,"sensor.pvpc_bs_periodo",t.entity_factura_anterior||A(a,"sensor.pvpc_bs_factura_anterior"),t.entity_factura_actual||A(a,"sensor.pvpc_bs_factura_actual")].filter(Boolean)}shouldUpdate(a){if(!a.has("hass")||a.size>1||!this._config)return!0;let t=a.get("hass"),r=this.hass;if(!t||!r||t.locale!==r.locale||t.language!==r.language||t.themes!==r.themes)return!0;let i=new Set([...this._entidadesVigiladas(t),...this._entidadesVigiladas(r)]);for(let n of i)if(t.states[n]!==r.states[n])return!0;return this._horaPintada!==me(new Date,I(r))}_programarCambioDeHora(){clearTimeout(this._temporizadorHora);let a=Date.now(),r=(60-ia(new Date(a),I(this.hass)).minuto)*6e4-a%6e4+1e3;this._temporizadorHora=setTimeout(()=>{this.requestUpdate(),this._programarCambioDeHora()},r)}render(){if(!this._config||!this.hass)return h;let a=I(this.hass),t=new Date;this._horaPintada=me(t,a);let r=this._t,i=this._config.entity||_a(this.hass),n=i&&this.hass.states[i];if(!n)return u`<ha-card><div class="aviso">${r.sin_entidad}</div></ha-card>`;let s=n.attributes||{},c=ha(s),d=ha(s,!0),l=this._config.next_day?d:[],p=this._config.extremos_manana!==!1?d:[],m=Array.isArray(s.colores_hoy)&&s.colores_hoy.length===c.length?s.colores_hoy:fe(c),_=Array.isArray(s.colores_manana)&&s.colores_manana.length===d.length?s.colores_manana:fe(d),f=Ue(c,t,a),y=this._config.entity_injection&&this.hass.states[this._config.entity_injection],j=y?ha(y.attributes,!0):[],k=y?{hoy:ha(y.attributes),manana:this._config.next_day?j:[]}:null,$=y?{hoy:k.hoy,manana:this._config.extremos_manana!==!1?j:[]}:null,P=this._config.bandas!==!1&&Array.isArray(s.periodos_hoy)&&s.periodos_hoy.length===c.length&&s.periodos_hoy.some(N=>N!=="P3")?s.periodos_hoy:null,w=Number(n.state),C=this._factura(),x=this._config.factura;return u`
      <ha-card>
        <div class="contenedor">
          ${u`<div class="cabecera">
                ${this._conVentana?u`<button class="abrir" aria-label=${r.abrir} @click=${()=>this._abrirVentana()}>
                      ${this._icono(f>=0?m[f]:void 0)}
                    </button>`:this._icono(f>=0?m[f]:void 0)}
                <div class="nombre">${this._config.title||""}</div>
                <div class="actual">
                  ${""}
                  <div class="precio ${this._config.current?"":"oculto"}" aria-hidden=${this._config.current?"false":"true"}>
                    ${Number.isFinite(w)?this._precioGrande(w):"\u2014"}
                    <span class="unidad"><span class="euro">€</span>/kWh</span>
                  </div>
                  ${y&&Number.isFinite(Number(y.state))?u`<div class="precio-iny ${this._config.current?"":"oculto"}" aria-hidden=${this._config.current?"false":"true"}>
                        ${this._precioIny(Number(y.state))}
                      </div>`:h}
                  ${x==="header"&&C?u`<div class="factura arriba">${C}</div>`:h}
                </div>
              </div>`}
          ${this._config.details?this._detalles(c,p,$):u`<div class="referencia" aria-hidden="true">${this._detalles(c,[],null)}</div>`}
          ${this._config.graph?this._grafica(c,l,m,_,f,P,this._config.excedentes_grafica===!1?null:k):h}
          ${C&&x==="below_chart"?u`<div class="factura abajo">${C}</div>`:h}
          ${C&&x==="below_chart_right"?u`<div class="factura abajo derecha">${C}</div>`:h}
          ${this._config.grafica_facturas?this._graficaFacturas():h}
          ${this.enVentana&&(A(this.hass,"button.pvpc_bs_comparar_tarifas")||this._suministroFactura||this._conHistorico)?u`<div class="comparar">
                ${this._suministroFactura?u`<button
                      class="btn-subir"
                      @click=${()=>this.dispatchEvent(new CustomEvent("pvpc-bs-subir",{bubbles:!0,composed:!0}))}
                    >
                      ${r.sub.boton}
                    </button>`:h}
                ${A(this.hass,"button.pvpc_bs_comparar_tarifas")?u`<button
                      class="btn-comparar"
                      ?disabled=${this.comparando}
                      @click=${()=>this.dispatchEvent(new CustomEvent("pvpc-bs-comparar",{bubbles:!0,composed:!0}))}
                    >
                      ${this.comparando?r.comp.comparando:r.comp.boton}
                    </button>`:h}
                ${this._conHistorico?u`<button
                      class="btn-historico"
                      @click=${()=>this.dispatchEvent(new CustomEvent("pvpc-bs-historico",{bubbles:!0,composed:!0}))}
                    >
                      ${r.hist.boton}
                    </button>`:h}
              </div>`:h}
        </div>
      </ha-card>
      ${this._ventana?this._dialogo():h}
    `}get _conVentana(){return!this.enVentana}set configVentana(a){this.enVentana=!0,this.toggleAttribute("en-ventana",!0),this.setConfig(a)}_abrirVentana(){this._conVentana&&(this._ventana=!0)}_cerrarVentana(){this.renderRoot.querySelector("dialog.ventana")?.close()}_dialogo(){let a={...this._config,current:!0,details:!0,graph:!0,next_day:!0,factura:"header",factura_actual:!0,factura_anterior:!0,prevision:!0,grafica_facturas:!0,extremos_manana:!0,title:""};return u`<dialog
      class="ventana ${this._anexo||this._subida||this._historico?"con-anexo":""}"
      @close=${()=>{this._ventana=!1,this._anexo=null,this._subida=null,this._historico=null}}
      @click=${t=>t.target===t.currentTarget&&this._cerrarVentana()}
      @pvpc-bs-comparar=${()=>this._comparar()}
      @pvpc-bs-subir=${()=>this._abrirSubida()}
      @pvpc-bs-historico=${()=>this._abrirHistorico()}
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
          .configVentana=${a}
          .hass=${this.hass}
          .comparando=${this._anexo?.estado==="cargando"}
        ></pvpc-bono-social-card>
        </div>
        ${this._anexo?this._anexoComparativa():this._subida?this._anexoSubida():this._historico?this._anexoHistorico():h}
      </div>
    </dialog>`}async _comparar(){if(this._anexo?.estado==="cargando")return;let a=A(this.hass,"button.pvpc_bs_comparar_tarifas");if(a){this._subida=null,this._historico=null,this._anexo={estado:"cargando"},this._envio=null;try{let t=this.hass.entities?.[a]?.device_id;if(!t)throw new Error(this._t.comp.sin_suministro);await this.hass.callService("pvpc_bonosocial","comparar_tarifas",{suministro:t,enviar:!1,notificacion:!1}),this._anexo={estado:"ok"}}catch(t){this._anexo={estado:"error",mensaje:await this._mensajeError(t)}}await this.updateComplete,this.renderRoot.querySelector(".anexo")?.scrollIntoView?.({behavior:"smooth",block:"nearest"})}}_anexoComparativa(){let a=this._t.comp,t=u`<button class="cerrar" aria-label=${a.cerrar} @click=${()=>this._anexo=null}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path>
      </svg>
    </button>`,r=u`<div class="anexo-cabecera"><div class="ventana-titulo">${a.titulo}</div>${t}</div>`;if(this._anexo.estado==="cargando")return u`<aside class="anexo">${r}<div class="anexo-espera"><span class="girando"></span>${a.espera}</div></aside>`;let i=A(this.hass,"sensor.pvpc_bs_mejor_alternativa"),n=i&&this.hass.states[i],s=n?.attributes||{};if(this._anexo.estado==="error"||s.estado&&s.estado!=="ok"){let g=a.estados[s.estado]||this._anexo.mensaje||a.error;return u`<aside class="anexo">${r}<div class="anexo-aviso error">⚠️ ${a.error}: ${g}</div></aside>`}let c=Array.isArray(s.ofertas)?s.ofertas:[];if(!n||!s.fecha)return u`<aside class="anexo">${r}<div class="anexo-aviso">${a.sin_datos}</div></aside>`;if(!c.length)return u`<aside class="anexo">${r}<div class="anexo-aviso">${a.avisos.sin_ofertas}</div></aside>`;let d=Array.isArray(s.avisos)?s.avisos:[],l=d.includes("bono_termico")&&new Date().getMonth()>=7,p=d.includes("bono_perdido")||!d.includes("pierde_bono"),m=d.includes("bono_perdido")?s.pagado_sin_bono_anual:s.pagado_anual,_=g=>`${this._num(g,2)} \u20AC`,f=typeof s.fecha=="string"?`${s.fecha.slice(8,10)}/${s.fecha.slice(5,7)} ${s.fecha.slice(11,16)}`:"",y=s.periodo||{},j=[f&&`${a.ultima}: ${f}`,y.facturas_conciliadas!==void 0&&`${a.facturas(y.facturas_conciliadas+(y.facturas_estimadas||0))}${y.dias?` (${a.dias(y.dias)})`:""}`,s.total_ofertas!==void 0&&a.ofertas(s.total_ofertas)].filter(Boolean).join(" \xB7 "),k=c[0],$=a.veredictos[s.veredicto],P=["quedarse_con_bono","quedarse"].includes(s.veredicto),w=s.veredicto==="depende_precios",C=w?a.depende(k.ahorro_anual>0,_(Math.abs(k.ahorro_anual)),(k.ahorro_prevision??0)>0,_(Math.abs(k.ahorro_prevision??0))):$?.[1].replace("{x}",_(Math.abs(k.ahorro_anual))),x=p?s.pvpc_cnmc_prevision:s.pvpc_cnmc_prevision_bono,N=g=>g.revision?a.revision(a.revisiones[g.revision]||g.revision):null,v=g=>[g.oferta,g.permanencia?a.permanencia:a.sin_permanencia,N(g),g.solo_nuevos_clientes&&a.nuevos,g.verde&&a.verde].filter(Boolean).join(" \xB7 "),L=g=>(a.avisos[g]||"").replace("{ausentes}",(s.grandes_ausentes||[]).join(", ")).replace("{dias}",y.dias??"").replace("{revision}",k.revision?a.revisiones[k.revision]||k.revision:""),F=(g,q)=>u`<div class="d ${g>=0?"menos":"mas"}">${g>=0?"\u2212":"+"}${_(Math.abs(g))}${x!=null?u` <span class="base">${q}</span>`:h}</div>`;return u`<aside class="anexo">
      ${r}
      <div class="anexo-resumen">${j}</div>
      ${$&&k?u`<div class="anexo-veredicto ${P?"bueno":w?"depende":"ahorro"}">
            <b>${P?"\u2705":w?"\u2696\uFE0F":"\u{1F4A1}"} ${$[0]}</b>
            <div>${C}</div>
            ${this._termometro(s.termometro)}
          </div>
          <div class="anexo-leer"><b>${l?a.leer_avisos_termico:a.leer_avisos}</b></div>`:h}
      <div class="anexo-fila tuya">
        <div><div class="n">${a.tu_tarifa}</div><div class="o">${p?a.pvpc:a.pvpc_bono}</div></div>
        <div class="i">${_(m)}${a.al_anio}</div>
      </div>
      ${x!=null?u`<div class="anexo-fila tuya prevista">
            <div><div class="n">${a.prevision}</div><div class="o">${p?a.prevision_sin_bono:a.prevision_bono}</div></div>
            <div class="i">≈${_(x)}${a.al_anio}</div>
          </div>`:h}
      ${c.slice(0,3).map(g=>u`<div class="anexo-fila">
          <div>
            ${g.enlace?u`<a class="n enlace" href=${g.enlace} target="_blank" rel="noopener noreferrer" title=${a.ficha}
                  >${g.comercializadora} ↗</a
                >`:u`<div class="n">${g.comercializadora}</div>`}
            <div class="o">${v(g)}</div>
          </div>
          <div>
            <div class="i">${_(g.importe_primer_anio)}</div>
            ${F(g.ahorro_anual,a.ultimo_anio)}
            ${g.ahorro_prevision!=null&&x!=null?F(g.ahorro_prevision,a.con_prevision):h}
          </div>
        </div>`)}
      <div class="anexo-fila">
        <div>
          <a
            class="n enlace"
            href=${s.enlace_listado||"https://comparador.cnmc.gob.es/"}
            target="_blank"
            rel="noopener noreferrer"
            >${a.cnmc} ↗</a
          >
          <div class="o">${s.enlace_listado?a.cnmc_datos(s.total_ofertas):""}</div>
        </div>
      </div>
      ${s.pvpc_cnmc!=null?u`<div class="anexo-pvpc">
            ${a.pvpc_cnmc(_(s.pvpc_cnmc),s.pvpc_cnmc_prevision!=null?_(s.pvpc_cnmc_prevision):null,s.pvpc_cnmc_prevision_bono!=null?_(s.pvpc_cnmc_prevision_bono):null)}
          </div>`:h}
      ${""}
      ${[...d].filter(g=>a.avisos[g]&&(g!=="bono_termico"||l)).sort((g,q)=>ce(g)-ce(q)).map(g=>{let q=L(g),Z=q.indexOf(": ");if(g==="bono_termico")return u`<div class="anexo-nota destacado"><b>🛑 ${q}</b></div>`;if(g==="pierde_bono")return u`<div class="anexo-nota"><b>⚠️ ${q}</b></div>`;if(g==="prevision_volatil"&&Z>0)return u`<div class="anexo-nota">⚠️ <u>${q.slice(0,Z)}</u>: <b>${q.slice(Z+2)}</b></div>`;let z=["cobertura_incompleta","datos_extrapolados","revision_precios"].includes(g);return u`<div class="anexo-nota">${z?"\u2139\uFE0F":"\u26A0\uFE0F"} ${q}</div>`})}
      <div class="anexo-nota">ℹ️ ${a.confirmar}</div>
      ${s.destino?u`<div class="anexo-pie">${this._botonEnviar(i,s.destino)}</div>`:h}
    </aside>`}_nombreMes(a,t="long"){let[r,i]=String(a).split("-").map(Number);return!r||!i?String(a):new Intl.DateTimeFormat(this._idiomas,{month:t,year:"numeric",timeZone:"UTC"}).format(new Date(Date.UTC(r,i-1,15)))}_termometro(a){if(!a||!a.mas_barata||!a.mas_cara)return h;let t=i=>`${this._num(i,3)} \u20AC/kWh`,r=this._t.comp.termometro(a.posicion,a.meses,t(a.eur_kwh),this._nombreMes(a.mas_barata.mes),t(a.mas_barata.eur_kwh),this._nombreMes(a.mas_cara.mes),t(a.mas_cara.eur_kwh));return u`<div class="anexo-termometro">🌡️ ${r}</div>`}get _conHistorico(){let a=A(this.hass,"sensor.pvpc_bs_mejor_alternativa");return!!a&&Array.isArray(this.hass.states[a]?.attributes?.historico)}_abrirHistorico(){this._anexo=null,this._subida=null,this._historico=!0}_anexoHistorico(){let a=this._t.hist,t=this._t.comp,r=u`<button class="cerrar" aria-label=${a.cerrar} @click=${()=>this._historico=null}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path>
      </svg>
    </button>`,i=A(this.hass,"sensor.pvpc_bs_mejor_alternativa"),n=i&&this.hass.states[i]?.attributes?.historico||[],s=l=>`${this._num(l,2)} \u20AC`,c=l=>typeof l=="string"?`${l.slice(8,10)}/${l.slice(5,7)}`:"",d=(l,p)=>[l.oferta,l.permanencia?t.permanencia:t.sin_permanencia,l.revision&&t.revision(t.revisiones[l.revision]||l.revision),l.solo_nuevos_clientes&&t.nuevos,c(l.fecha),l.kwh?.total&&l.kwh.total!==p&&a.kwh(this._num(l.kwh.total,0))].filter(Boolean).join(" \xB7 ");return u`<aside class="anexo historico">
      <div class="anexo-cabecera"><div class="ventana-titulo">${a.titulo}</div>${r}</div>
      <div class="anexo-resumen">${a.intro}</div>
      ${n.length?n.map(l=>{let p=Array.isArray(l.ofertas)?l.ofertas:[],m=p[0],_=l.kwh?.total,f=[l.prevision!=null&&`${a.prevision} \u2248${s(l.prevision)}`,l.pagado_anual!=null&&`${a.pagado} ${s(l.pagado_anual)}`].filter(Boolean).join(" \xB7 ");return u`<details class="hist-mes">
              <summary class="anexo-fila">
                <div>
                  <div class="n"><span class="flecha" aria-hidden="true">›</span>${this._nombreMes(l.mes)}</div>
                  ${f?u`<div class="o">${f}</div>`:h}
                  ${_?u`<div class="o kwh">${a.kwh(this._num(_,0))}</div>`:h}
                </div>
                <div>
                  <div class="i">${m?s(m.importe_primer_anio):"\u2014"}</div>
                  ${m?u`<div class="d">${a.mejor}</div>`:h}
                </div>
              </summary>
              ${p.length?p.map(y=>u`<div class="anexo-fila hist-oferta">
                      <div>
                        ${y.enlace?u`<a class="n enlace" href=${y.enlace} target="_blank" rel="noopener noreferrer" title=${t.ficha}
                              >${y.comercializadora} ↗</a
                            >`:u`<div class="n">${y.comercializadora}</div>`}
                        <div class="o">${d(y,_)}</div>
                      </div>
                      <div class="i">${s(y.importe_primer_anio)}</div>
                    </div>`):u`<div class="anexo-nota">${t.avisos.sin_ofertas}</div>`}
            </details>`}):u`<div class="anexo-aviso">${a.vacio}</div>`}
    </aside>`}get _suministroFactura(){let a=this._config.entity_factura_actual||A(this.hass,"sensor.pvpc_bs_factura_actual");return a&&this.hass.entities?.[a]?.device_id||null}_abrirSubida(){this._anexo=null,this._historico=null,this._subida||(this._subida={estado:"elegir",facturas:[],rechazadas:[],hechas:0})}async _leerArchivos(a){let t=this._t.sub,r=[...a.target.files||[]];a.target.value="";let i=this._subida;if(!r.length||!i||i.estado!=="elegir")return;if(i.mensaje=null,r.length>ue){i.mensaje=t.demasiados(ue),this.requestUpdate();return}let n=this._suministroFactura;if(!n){i.mensaje=t.sin_suministro,this.requestUpdate();return}i.estado="leyendo",this.requestUpdate();let s={};try{for(let c of r)try{let d=new FormData;d.append("file",c);let l=await this.hass.fetchWithAuth("/api/file_upload",{method:"POST",body:d});if(!l.ok)throw new Error(`${l.status}`);s[(await l.json()).file_id]=c.name}catch(d){i.rechazadas.push({archivo:c.name,texto:`${t.no_subido} (${d?.message||d})`})}if(Object.keys(s).length){let{response:c}=await this.hass.callWS({type:"call_service",domain:"pvpc_bonosocial",service:"leer_facturas",service_data:{suministro:n,archivos:Object.keys(s)},return_response:!0});for(let d of c?.facturas||[]){let{id:l,archivo:p,...m}=d;i.facturas.push({clave:++this._claveFactura,archivo:p||s[l],datos:m})}for(let d of c?.rechazadas||[])i.rechazadas.push({archivo:d.archivo||s[d.id],texto:d.texto||d.motivo})}}catch(c){i.mensaje=`${t.error}: ${await this._mensajeError(c)}`}i.estado="elegir",i.hechas=0,this.requestUpdate()}_anadirAMano(){let a=this._subida;if(!a||a.estado!=="elegir")return;let t=a.facturas.find(i=>!i.archivo&&Object.values(i.datos).every(n=>n==null||String(n).trim()===""));t||a.facturas.push({clave:++this._claveFactura,archivo:null,datos:{}});let r=t?t.clave:this._claveFactura;a.hechas=0,this.requestUpdate(),this.updateComplete.then(()=>{let i=this.renderRoot.querySelector(`.sub-factura[data-clave="${r}"]`);i?.scrollIntoView({block:"nearest",behavior:"smooth"}),i?.querySelector("input")?.focus({preventScroll:!0})})}_quitarFactura(a){let t=this._subida;!t||t.estado!=="elegir"||(t.facturas=t.facturas.filter(r=>r!==a),this.requestUpdate())}async _guardarFacturas(){let a=this._t.sub,t=this._subida,r=this._suministroFactura;if(!t||t.estado!=="elegir"||!t.facturas.length||!r)return;let i=s=>s===""||s==null||!Number.isFinite(Number(s))?null:Number(s),n=[];for(let s of t.facturas){let c=s.datos,d={inicio:c.inicio||null,fin:c.fin||null,kwh_p1:i(c.kwh_p1),kwh_p2:i(c.kwh_p2),kwh_p3:i(c.kwh_p3),total:i(c.total)};s.error=Object.values(d).some(l=>l==null)?a.faltan:null,c.emision&&(d.emision=c.emision),i(c.kwh_bonificados)!=null&&(d.kwh_bonificados=i(c.kwh_bonificados)),s.error||n.push([s,d])}n.sort(([,s],[,c])=>s.inicio<c.inicio?-1:s.inicio>c.inicio?1:0),t.estado="guardando",t.hechas=0,this.requestUpdate();for(let[s,[c,d]]of n.entries()){try{await this.hass.callWS({type:"call_service",domain:"pvpc_bonosocial",service:"conciliar_factura",service_data:{suministro:r,...d,comprobar:s===n.length-1}}),c.hecha=!0,t.hechas+=1}catch(l){c.error=await this._mensajeError(l)}this.requestUpdate()}t.facturas=t.facturas.filter(s=>!s.hecha),t.facturas.length||(t.rechazadas=[]),t.estado="elegir",this.requestUpdate()}_anexoSubida(){let a=this._t.sub,t=this._subida,r=t.estado!=="elegir",i=u`<button class="cerrar" aria-label=${a.cerrar} @click=${()=>this._subida=null}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path>
      </svg>
    </button>`,n=(s,c,d)=>u`<label class="sub-campo">
        <span>${a.campos[c]}</span>
        <input
          type=${d}
          name=${c}
          min=${d==="number"?"0":h}
          step=${d==="number"?c==="total"?"0.01":"1":h}
          inputmode=${d==="number"?c==="total"?"decimal":"numeric":h}
          .value=${s.datos[c]==null?"":String(s.datos[c])}
          ?disabled=${r}
          @input=${l=>s.datos[c]=l.target.value}
        />
      </label>`;return u`<aside class="anexo subida">
      <div class="anexo-cabecera"><div class="ventana-titulo">${a.titulo}</div>${i}</div>
      <div class="anexo-resumen">${a.intro}</div>
      <input class="sub-archivos" type="file" multiple accept=".pdf,.zip,application/pdf,application/zip" hidden @change=${s=>this._leerArchivos(s)} />
      <div class="sub-acciones">
        <button class="btn-subir" ?disabled=${r} @click=${()=>this.renderRoot.querySelector("input.sub-archivos")?.click()}>${a.elegir}</button>
        <button class="btn-subir secundario" ?disabled=${r} @click=${()=>this._anadirAMano()}>${a.a_mano}</button>
      </div>
      ${t.estado==="leyendo"?u`<div class="anexo-espera"><span class="girando"></span>${a.leyendo}</div>`:h}
      ${t.mensaje?u`<div class="anexo-aviso error">⚠️ ${t.mensaje}</div>`:h}
      ${t.hechas&&!r?u`<div class="anexo-aviso hecho">${a.hechas(t.hechas)}</div>`:h}
      ${t.facturas.length?u`<div class="anexo-nota">${a.revisar}</div>`:h}
      ${t.facturas.map(s=>u`<div class="sub-factura ${s.error?"con-error":""}" data-clave=${s.clave}>
          <div class="sub-cabecera">
            <b>${s.archivo||a.manual}</b>
            <button class="sub-quitar" ?disabled=${r} @click=${()=>this._quitarFactura(s)}>${a.quitar}</button>
          </div>
          <div class="sub-campos">
            ${n(s,"inicio","date")}${n(s,"fin","date")}${n(s,"emision","date")}${n(s,"total","number")}
            ${n(s,"kwh_p1","number")}${n(s,"kwh_p2","number")}${n(s,"kwh_p3","number")}${n(s,"kwh_bonificados","number")}
          </div>
          ${s.error?u`<div class="anexo-aviso error">⚠️ ${s.error}</div>`:h}
        </div>`)}
      ${t.rechazadas.length?u`<div class="anexo-nota sub-fuera">
            ${a.fuera}
            <ul>
              ${t.rechazadas.map(s=>u`<li><b>${s.archivo}</b>: ${s.texto}</li>`)}
            </ul>
          </div>`:h}
      ${t.facturas.length?u`<div class="anexo-pie">
            <div class="comparar">
              <button class="btn-subir" ?disabled=${r} @click=${()=>this._guardarFacturas()}>
                ${t.estado==="guardando"?a.guardando:a.guardar(t.facturas.length)}
              </button>
            </div>
          </div>`:h}
    </aside>`}_botonEnviar(a,t){let r=this._t.comp,i=/telegram/i.test(t)?"Telegram":this.hass.states[t]?.attributes?.friendly_name||t,n=this.hass.entities?.[a]?.device_id;if(!n)return h;let s=async()=>{this._envio="enviando";try{await this.hass.callService("pvpc_bonosocial","enviar_comparativa",{suministro:n}),this._envio="ok"}catch(d){this._envio=await this._mensajeError(d)}},c=this._envio==="enviando"?r.enviando:this._envio==="ok"?r.enviado:r.enviar(i);return u`<div class="comparar">
        <button class="btn-comparar" ?disabled=${this._envio==="enviando"||this._envio==="ok"} @click=${s}>${c}</button>
      </div>
      ${this._envio&&!["enviando","ok"].includes(this._envio)?u`<div class="anexo-aviso error">⚠️ ${this._envio}</div>`:h}`}_precioGrande(a){let t=this._num(a,5),r=t.search(/[^-\d]/),i=t.slice(0,-2);return r<0?u`${i}<span class="cola">${t.slice(-2)}</span>`:u`${i.slice(0,r)}<span class="coma">${i[r]}</span>${i.slice(r+1)}<span class="cola"
            >${t.slice(-2)}</span
          >`}_precioIny(a){let t=this._num(a,5),r=t.search(/[^-\d]/),i=r<0?t:t.slice(0,r),n=r<0?"":t[r],s=r<0?"":t.slice(r+1);return u`<span class="iny-ent">${i}</span><span class="iny-coma">${n}</span><span class="iny-dec"
        >${s}</span
      ><span class="iny-hueco"> </span><span class="iny-euro">€</span>/kWh`}_icono(a){let t=a;if(this._config.icon_color==="period"){let n=this.hass.states["sensor.pvpc_bs_periodo"]?.state;t=Oe[n]}let r=this._config.icon_color==="fijo"||t===void 0?ra:ne[t],i=`pvpc-bs-hueco-${this._id}`;return u`<svg class="icono" viewBox="0 0 512 512" aria-hidden="true">
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
    </svg>`}_hora(a){return`${String(a).padStart(2,"0")}:00`}_fecha(a=0){let t=new Date(`${Ta(new Date,I(this.hass),a)}T12:00:00Z`);return new Intl.DateTimeFormat(this._idiomas,{timeZone:"UTC"}).format(t)}_triangulo(a,t){return u`<svg class="tri" viewBox="0 0 24 24" aria-hidden="true"><path d=${de[a]} fill=${t}></path></svg>`}_detalles(a,t,r){let i=this._t,n=(p,m,_)=>u`<div class="detalle">
        ${this._triangulo(p,m)}
        <div>
          ${_?u`<div class="valor">${this._num(_.precio,5)} €/kWh</div>
                <div class="horas">${this._hora(_.hora)} - ${this._hora(_.hora+1)}</div>`:u`<div class="valor">${i.no_disponible}</div>`}
        </div>
      </div>`,s=(p,m,_="")=>{let f=fa(p);return u`<div class="columna">${n(`min${_}`,m,f?.min)}${n(`max${_}`,m,f?.max)}</div>`},c=(p,m,_="")=>{let f=fa(p);return u`<div class="fila">${n(`min${_}`,m,f?.min)}${n(`max${_}`,m,f?.max)}</div>`},d=this._config.extremos==="filas"?c:s,l=(p,m,_)=>u`<div class="detalles ${this._config.extremos==="filas"?"en-filas":""}">
        ${d(p,this._cHoy,_)}${m.length?d(m,this._cManana,_):this._config.extremos==="filas"?h:this._columnaFantasma(n,_)}
      </div>`;return u`${l(a,t)}${r?l(r.hoy,r.manana,"_hueco"):h}`}_columnaFantasma(a,t){let r={precio:-1e-5,hora:0};return u`<div class="columna fantasma" aria-hidden="true">
      ${a(`min${t}`,this._cManana,r)}${a(`max${t}`,this._cManana,r)}
    </div>`}_factura(){let a=this._t;if(this._config.factura==="hidden")return null;let t=[],r=this._config.entity_factura_anterior||A(this.hass,"sensor.pvpc_bs_factura_anterior"),i=this._config.entity_factura_actual||A(this.hass,"sensor.pvpc_bs_factura_actual"),n=p=>typeof p=="string"?`${p.slice(8,10)}/${p.slice(5,7)}`:"",s=(p,m)=>p&&m?` (${n(p)} - ${n(m)})`:"",c=(p,m,_,f,y=!1)=>u`<div><span class="txt-largo">${p}<span class="sin-corte">${m}</span></span><span class="txt-corto" data-t=${f}></span>: <b class="sin-corte">${y?"\u2248":""}${this._num(_,2)} €</b></div>`,d=r&&this.hass.states[r];if(this._config.factura_anterior&&d&&Number.isFinite(Number(d.state))){let p=d.attributes||{};t.push(c(a.anterior,s(p.inicio,p.fin),Number(d.state),a.anterior_corto))}let l=i&&this.hass.states[i];if(l&&Number.isFinite(Number(l.state))){let p=l.attributes||{},_=Ta(new Date,I(this.hass));if(p.provisional&&p.factura_en_curso==="recibido"&&typeof p.datos_hasta=="string"){let f=new Date(new Date(p.datos_hasta).getTime()-1e3);_=Ta(f,I(this.hass))}if(this._config.factura_actual&&typeof p.acumulado=="number"){let f=p.provisional===!0&&p.factura_en_curso!=="recibido";t.push(c(a.en_curso,s(p.inicio,_),p.acumulado,a.en_curso_corto,f))}this._config.prevision!==!1&&t.push(c(a.estimada_cierre,s(p.inicio,p.fin_previsto),Number(l.state),a.estimada_corto,p.aproximada===!0))}return t.length?t:null}_grafica(a,t,r,i,n,s,c){let d=this._t;if(!a.length)return u`<div class="aviso">${d.sin_precio}</div>`;let l=this._cHoy,p=this._cManana,{ancho:m,alto:_}=pe(this._anchoUtil,190,300),f={izq:38,der:16,arr:24,aba:24},y=[{puntos:a,color:l},{puntos:t,color:p},...c?[{puntos:c.hoy,color:l,punteada:!0},{puntos:c.manana,color:p,punteada:!0}]:[]].filter(b=>b.puntos.length),j=y.flatMap(b=>b.puntos.map(S=>S.precio)),k=Math.min(0,...j),$=Math.max(...j);$-k<.01&&($=k+.01);let P=($-k)*.08;k-=Math.min(0,...j)<0?P:0,$+=P;let w=Math.max(a.length,t.length,24),C=(m-f.izq-f.der)/w,x=b=>f.izq+C*b,N=b=>x(b)+C/2,v=b=>f.arr+(_-f.arr-f.aba)*(1-(b-k)/($-k)),L=b=>b.map((S,M)=>`${M?"V":`M${x(0).toFixed(1)},`}${v(S.precio).toFixed(1)}H${x(M+1).toFixed(1)}`).join(""),F=(b,S,M)=>E`<line class="tramo" x1=${x(M)} x2=${x(M+1)}
        y1=${v(b[M].precio)} y2=${v(b[M].precio)} stroke=${ne[S[M]??0]}></line>`,g=(b,S,M)=>{let na=fa(b),xe=b.indexOf(na[M]),ke=v(na[M].precio)+(M==="max"?-11:4);return E`<svg class="marca" x=${N(xe)-4.5} y=${ke} width="9" height="9" viewBox="0 0 24 24">
        <path d=${de[M]} fill=${S}></path></svg>`},q=($-k)/4,Z=[0,1,2,3,4].map(b=>k+q*b),z=this._cursor,Ha=(b,S,M,na)=>E`<circle class=${na} cx=${N(M)} cy=${v(b[M].precio)} r="3" fill=${S}></circle>`,ga=this._config.colores==="precio"||this._config.colores==="precio_ambos",va=this._config.colores==="precio_manana",ye=Fa(C*3,28),Ra=this._config.titulo_grafica??"PVPC";return u`
      <div class="grafica">
        ${Ra?u`<div class="titulo-seccion">${Ra}</div>`:h}
        <svg
          viewBox="0 0 ${m} ${_}"
          role="img"
          style="--grosor: ${this._config.grosor==="1.5"?1.5:2.5}"
          aria-label=${d.titulo}
          @pointermove=${b=>this._mover(b,m,f,w)}
          @pointerleave=${()=>this._cursor=void 0}
        >
          <text class="eje" x=${f.izq-4} y=${f.arr-12} text-anchor="end">€/kWh</text>
          ${s?s.map((b,S)=>b==="P3"?h:E`<rect class=${b==="P1"?"banda-punta":"banda-llano"} x=${x(S)}
                      y=${f.arr} width=${C} height=${_-f.arr-f.aba}></rect>`):h}
          ${n>=0?E`<rect class="ahora" x=${x(n)} y=${f.arr} width=${C} height=${_-f.arr-f.aba}></rect>`:h}
          ${Z.map(b=>E`<line class="rejilla" x1=${f.izq} x2=${m-f.der} y1=${v(b)} y2=${v(b)}></line>
              <text class="eje" x=${f.izq-4} y=${v(b)+3} text-anchor="end">${this._num(Math.abs(b)<.005?0:b,2)}</text>`)}
          ${[0,3,6,9,12,15,18,21,24].map((b,S)=>E`<line class="rejilla" x1=${x(b)} x2=${x(b)} y1=${f.arr} y2=${_-f.aba}></line>
              ${S%ye?h:E`<text class="eje" x=${x(b)} y=${_-8} text-anchor="middle">${this._hora(b)}</text>`}`)}
          ${y.map(b=>E`<path class="serie ${b.punteada?"punteada":""}"
                d=${L(b.puntos)}
                stroke=${ga&&b.puntos===a||va&&b.puntos===t?"var(--secondary-text-color)":b.color}></path>`)}
          ${ga?a.map((b,S)=>F(a,r,S)):h}
          ${va?t.map((b,S)=>F(t,i,S)):h}
          ${y.flatMap(b=>[g(b.puntos,b.color,"max"),g(b.puntos,b.color,"min")])}
          ${z!==void 0?E`<line class="cursor" x1=${N(z)} x2=${N(z)} y1=${f.arr} y2=${_-f.aba}></line>`:h}
          ${z!==void 0&&z<a.length?Ha(a,l,z,"p-hoy"):h}
          ${z!==void 0&&z<t.length?Ha(t,p,z,"p-manana"):h}
        </svg>
        <div class="leyenda">
          ${z!==void 0?u`<span
                  ><b>${this._hora((a[z]??t[z])?.hora??z)} - ${this._hora(((a[z]??t[z])?.hora??z)+1)}</b>${s?.[z]?u` · ${d.periodos[s[z]]}`:h}</span
                >
                ${a[z]?u`<span><i class="bolita" style="background:${l}"></i>${this._num(a[z].precio,5)}</span>`:h}
                ${t[z]?u`<span><i class="bolita" style="background:${p}"></i>${this._num(t[z].precio,5)}</span>`:h}`:u`<span
                  ><i class="bolita" style="background:${ga?le:l}"></i>${this._fecha(0)}</span
                >${t.length?u`<span><i class="bolita" style="background:${va?le:p}"></i>${this._fecha(1)}</span>`:h}${n>=0?u`<span class="l-ahora">${d.hora_actual}</span>`:h}${s?u`<span class="l-punta">${d.periodos.P1}</span><span class="l-llano">${d.periodos.P2}</span>`:h}`}
        </div>
      </div>
    `}connectedCallback(){super.connectedCallback(),this._observador??=new ResizeObserver(()=>{this._medirAncho(),this._alinearFactura()}),this._observador.observe(this),this._programarCambioDeHora()}disconnectedCallback(){super.disconnectedCallback(),this._observador?.disconnect(),clearTimeout(this._temporizadorHora)}_medirAncho(){let a=this.renderRoot?.querySelector(".contenedor");if(!a?.clientWidth)return;let t=a.clientWidth-32;Math.abs(t-(this._anchoUtil??0))>=2&&(this._anchoUtil=t)}_alinearFactura(){let a=this.renderRoot?.querySelector(".cabecera .actual");if(!a)return;let t=a.querySelector(".precio"),r=[...a.querySelectorAll(".factura.arriba")],i=a.querySelector(".precio-iny");for(let $ of[t,i,...r])$&&($.style.marginRight="");let n=this.renderRoot.querySelector(".factura.derecha");n&&(n.style.marginRight="");let s=i?.querySelector(".iny-hueco");s&&(s.style.width="");let c=this.renderRoot.querySelectorAll(".detalles .columna"),d=this.renderRoot.querySelectorAll(".detalles .fila > .detalle:last-child"),l=this.renderRoot.querySelector(".cabecera .icono"),p=$=>{let P=[...$.querySelectorAll(".valor, .horas")],w=$.querySelector(".valor"),C=Math.max(0,...P.map(x=>x.getBoundingClientRect().width));if(w){let x=w.cloneNode(!1);x.textContent=`-${this._num(0,5)} \u20AC/kWh`,x.style.cssText="position:absolute;visibility:hidden;white-space:nowrap",w.parentElement.appendChild(x),C=Math.max(C,x.getBoundingClientRect().width),x.remove()}return C},m;if(c.length>=2){let $=c[1],P=$.parentElement.getBoundingClientRect(),w=parseFloat(getComputedStyle($.parentElement).columnGap)||0,C=(P.width-w)/2,x=P.left+C+w+C/2,N=$.querySelector(".valor")?.getBoundingClientRect().width??0,v=$.getBoundingClientRect().width+Math.max(0,p($)-N);m=x+v/2}else if(d.length){let $=d[0],P=$.closest(".detalles"),w=P.getBoundingClientRect(),C=parseFloat(getComputedStyle(P).columnGap)||0,x=(w.width-C)/2,N=w.left+x+C+x/2,v=$.querySelector(".valor")?.getBoundingClientRect().width??0,L=$.getBoundingClientRect().width+Math.max(0,p($)-v);m=N+L/2}if(!Number.isFinite(m)||!a.offsetParent)return;let _=$=>l?$.getBoundingClientRect().left-l.getBoundingClientRect().right-12:1/0,f=($,P)=>{let w=Math.min(P,_($));w>0&&($.style.marginRight=`${w}px`)},y=t?.querySelector(".euro");y&&f(t,y.getBoundingClientRect().right-m);let j=y?y.getBoundingClientRect().right:m;for(let $ of r)f($,$.getBoundingClientRect().right-j);this._alinearIny(t,i);let k=this.renderRoot.querySelector(".factura.derecha");if(k){k.style.marginRight="";let $=k.getBoundingClientRect().right-j;$>0&&(k.style.marginRight=`${$}px`)}}_alinearIny(a,t){let r=a?.querySelector(".coma"),i=a?.querySelector(".euro"),n=t?.querySelector(".iny-coma"),s=t?.querySelector(".iny-euro"),c=t?.querySelector(".iny-hueco");if(!r||!i||!n||!s||!c)return;let d=m=>m.getBoundingClientRect();c.style.width="0px";let l=d(i).left-d(r).left-(d(s).left-d(n).left);c.style.width=`${Math.max(0,l)}px`;let p=d(s).left-d(i).left;Math.abs(p)>.1&&(t.style.marginRight=`${p}px`)}updated(a){if(super.updated?.(a),["hass","_config","_anchoUtil","_facturas"].some(i=>a.has(i))&&(this._medirAncho(),this._alinearFactura()),a.has("_ventana")&&this._ventana){let i=this.renderRoot.querySelector("dialog.ventana");i&&!i.open&&i.showModal()}if(!this.hass||!this._config?.grafica_facturas||this._cargandoFacturas||this._facturasDelSensor())return;let t=`${this._config.estadistica_facturas||""}|${this._config.facturas_meses}`;(!this._facturasHora||Date.now()-this._facturasHora>3*3600*1e3||t!==this._facturasClave)&&this._cargarFacturas(t)}_facturasDelSensor(){if(this._config.estadistica_facturas)return null;let a=this._config.entity_factura_actual||A(this.hass,"sensor.pvpc_bs_factura_actual"),t=this.hass?.states[a]?.attributes?.facturas;if(!Array.isArray(t))return null;let r=Math.max(1,Number(this._config.facturas_meses)||6);return t.filter(i=>Number.isFinite(Number(i.total))&&i.inicio).map(i=>{let[n,s,c]=String(i.inicio).split("-").map(Number);return{inicio:new Date(Date.UTC(n,s-1,c+1,12)),total:Number(i.total),real:i.real!==!1}}).slice(-r)}async _cargarFacturas(a){this._cargandoFacturas=!0,this._facturasClave=a,this._facturasHora=Date.now();try{let t=this._config.estadistica_facturas;if(t||(t=(await this.hass.callWS({type:"recorder/list_statistic_ids",statistic_type:"mean"})).map(c=>c.statistic_id).find(c=>c.startsWith("pvpc_bonosocial:facturas_"))),!t){this._facturas=[];return}let r=Math.max(1,Number(this._config.facturas_meses)||6),i=new Date(Date.now()-(r+2)*35*86400*1e3),n=await this.hass.callWS({type:"recorder/statistics_during_period",start_time:i.toISOString(),statistic_ids:[t],period:"hour",types:["max"]});this._facturas=(n[t]||[]).filter(s=>Number.isFinite(Number(s.max))).map(s=>({inicio:new Date(s.start),total:Number(s.max),real:!0})).slice(-r)}catch(t){console.warn("pvpc-bono-social-card: no se pudieron leer las facturas",t),this._facturas=[]}finally{this._cargandoFacturas=!1}}_graficaFacturas(){let a=this._t,t=this._facturasDelSensor()??this._facturas,r=this._config.titulo_facturas??a.facturas,i=r?u`<div class="titulo-seccion">${r}</div>`:h;if(!t)return h;if(!t.length)return u`<div class="facturas">${i}<div class="aviso">${a.sin_facturas}</div></div>`;let n=La(this._config.color_facturas,this._cHoy),s=this._config.facturas_importe!==!1,{ancho:c,alto:d}=pe(this._anchoUtil,150,220),l={izq:8,der:8,arr:s?18:6,aba:20},p=Math.max(...t.map(v=>v.total),1),m=(c-l.izq-l.der)/t.length,_=Math.min(m*.6,56),f=t.length-1,y=Math.max(...t.map(v=>this._num(v.total,2).length+2)),j=Fa(m,y*6.2),k=v=>l.arr+(d-l.arr-l.aba)*(1-Math.max(v,0)/p),$=this._idiomas,P=I(this.hass),w;try{w=new Intl.DateTimeFormat($,{month:"short",year:"2-digit",...P?{timeZone:P}:{}})}catch{w=new Intl.DateTimeFormat($,{month:"short",year:"2-digit"})}let C={format:v=>{let L=w.formatToParts(v),F=g=>L.find(q=>q.type===g)?.value??"";return`${F("month")} ${F("year")}`}},x=Math.max(...t.map(v=>C.format(v.inicio).length)),N=Fa(m,x*5.2);return u`
      <div class="facturas">
        ${i}
        <svg viewBox="0 0 ${c} ${d}" role="img" aria-label=${r||a.facturas}>
          <line class="rejilla" x1=${l.izq} x2=${c-l.der} y1=${d-l.aba} y2=${d-l.aba}></line>
          ${t.map((v,L)=>{let F=l.izq+m*(L+.5);return E`<rect class="barra ${v.real?"real":"calculada"}" x=${F-_/2+(v.real?0:1)}
                y=${k(v.total)+(v.real?0:1)} width=${_-(v.real?0:2)}
                height=${Math.max(d-l.aba-k(v.total)-(v.real?0:1),0)} rx="3"
                fill=${v.real?n:"none"} stroke=${n}>
                <title>${C.format(v.inicio)}: ${this._num(v.total,2)} € (${v.real?a.real:a.calculada})</title></rect>
              ${(f-L)%N?h:E`<text class="eje" x=${F} y=${d-6} text-anchor="middle">${C.format(v.inicio)}</text>`}`})}
          ${this._config.facturas_tendencia&&t.length>1?this._tendencia(t,m,l,k):h}
          ${s?t.map((v,L)=>(f-L)%j?h:E`<text class="importe" x=${l.izq+m*(L+.5)} y=${k(v.total)-5}
                    text-anchor="middle">${this._num(v.total,2)} €</text>`):h}
        </svg>
        ${t.some(v=>!v.real)?u`<div class="leyenda">
              ${t.some(v=>v.real)?u`<span><i class="bolita cuadro" style="background:${n}"></i>${a.factura_real}</span>`:h}
              <span><i class="bolita cuadro" style="border:2px solid ${n}"></i>${a.calculada_consumo}</span>
            </div>`:h}
      </div>
    `}_tendencia(a,t,r,i){let n=a.length,s=(n-1)/2,c=a.reduce((f,y)=>f+y.total,0)/n,d=0,l=0;a.forEach((f,y)=>{d+=(y-s)*(f.total-c),l+=(y-s)**2});let p=d/l,m=f=>c+p*(f-s),_=f=>r.izq+t*(f+.5);return E`<line class="tendencia" x1=${_(0)} y1=${i(m(0))} x2=${_(n-1)} y2=${i(m(n-1))}></line>`}_mover(a,t,r,i){let n=a.currentTarget.getBoundingClientRect(),s=(a.clientX-n.left)/n.width*t,c=Math.floor((s-r.izq)/(t-r.izq-r.der)*i);this._cursor=c>=0&&c<i?c:void 0}};U(ta,"properties",{hass:{attribute:!1},_config:{state:!0},_cursor:{state:!0},_facturas:{state:!0},_ventana:{state:!0},_anexo:{state:!0},_envio:{state:!0},_subida:{state:!0},_historico:{state:!0},comparando:{attribute:!1},_anchoUtil:{state:!0}}),U(ta,"styles",ya`
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
    /* Bajo la gráfica (izquierda o derecha): mismo tamaño que en la cabecera. */
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
    .factura .txt-corto {
      display: none;
    }
    .factura .txt-corto::before {
      content: attr(data-t);
    }
    /* En pantallas estrechas la factura de la cabecera se queda arriba con el texto corto. */
    @container (max-width: 380px) {
      .factura.arriba .txt-largo {
        display: none;
      }
      .factura.arriba .txt-corto {
        display: inline;
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
    .anexo-leer {
      font-size: 0.85em;
      margin: -2px 0 10px;
      line-height: 1.35;
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
    .anexo-veredicto.depende {
      background: rgba(66, 165, 245, 0.12);
      border: 1px solid rgba(66, 165, 245, 0.5);
    }
    .anexo-fila.tuya.prevista .i {
      color: var(--primary-text-color);
    }
    .anexo-fila .d .base {
      color: var(--secondary-text-color);
      font-size: 0.9em;
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
    .anexo-nota.destacado {
      font-size: 0.85em;
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
    .anexo-termometro {
      margin-top: 6px;
      font-size: 0.9em;
    }
    /* Histórico: un mes por fila; al tocarlo, sus 3 ofertas. */
    .hist-mes summary {
      list-style: none;
      cursor: pointer;
    }
    .hist-mes summary::-webkit-details-marker {
      display: none;
    }
    .hist-mes .flecha {
      display: inline-block;
      width: 1em;
      transition: transform 0.15s;
    }
    .hist-mes[open] .flecha {
      transform: rotate(90deg);
    }
    .hist-mes[open] summary {
      border-bottom-style: dashed;
    }
    .hist-oferta {
      padding-left: 1em;
    }
    .hist-oferta .i {
      font-weight: 600;
    }
    .anexo-fila .o.kwh {
      opacity: 0.8;
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
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
      margin: 14px 0 4px;
    }
    .btn-comparar,
    .btn-subir,
    .btn-historico {
      border: none;
      border-radius: 18px;
      padding: 8px 18px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      background: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
    }
    .btn-comparar:disabled,
    .btn-subir:disabled {
      opacity: 0.6;
      cursor: progress;
    }
    .btn-subir.secundario {
      background: none;
      color: var(--primary-color, #03a9f4);
      box-shadow: inset 0 0 0 1px var(--primary-color, #03a9f4);
    }
    .sub-acciones {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
      margin: 14px 0 4px;
    }
    .sub-factura {
      border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.25));
      border-radius: 10px;
      padding: 8px 12px 10px;
      margin-top: 10px;
    }
    .sub-factura.con-error {
      border-color: var(--error-color, #e57373);
    }
    .sub-cabecera {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
      overflow-wrap: anywhere;
    }
    .sub-quitar {
      border: none;
      background: none;
      font: inherit;
      font-size: 0.85em;
      color: var(--secondary-text-color);
      cursor: pointer;
      text-decoration: underline;
    }
    .sub-campos {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 8px 10px;
    }
    .sub-campo {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }
    .sub-campo input {
      font: inherit;
      font-size: 1.15em;
      padding: 5px 6px;
      border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.4));
      border-radius: 6px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      min-width: 0;
    }
    .sub-fuera ul {
      margin: 4px 0 0;
      padding-left: 18px;
    }
    .anexo-aviso.hecho {
      color: var(--success-color, #43a047);
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
  `);var ge=`${ma}-editor`;function ve(){return(document.documentElement.lang||navigator.language||"en").slice(0,2)}function sa(o){return Da[o]||Da.en}function Ge(o,e={}){let a=sa(o),t=(l,p)=>({select:{mode:"dropdown",options:p.map(m=>({value:m,label:a.opciones[l]?.[m]??m}))}}),r=l=>({name:l,selector:{boolean:{}}}),i=(l,p,m,_)=>({type:"expandable",name:"",flatten:!0,title:a.secciones[l],icon:p,expanded:m,schema:_.filter(Boolean)}),n=e.factura!=="hidden",s=e.graph!==!1,c=s&&e.next_day!==!1||e.details!==!1&&e.extremos_manana!==!1,d=!!e.grafica_facturas;return[i("cabecera","mdi:page-layout-header",!1,[r("current"),{name:"icon_color",selector:t("icon_color",["price","period","fijo"])},{name:"title",selector:{text:{}}}]),i("factura","mdi:receipt-text-outline",!1,[n&&r("factura_anterior"),n&&r("factura_actual"),n&&r("prevision"),{name:"factura",selector:t("factura",["header","below_chart","below_chart_right","hidden"])}]),i("extremos","mdi:arrow-up-down",!1,[r("details"),e.details!==!1&&r("extremos_manana"),(e.details!==!1||s)&&(e.hay_excedentes||e.entity_injection)&&r("mostrar_excedentes"),e.details!==!1&&{name:"extremos",selector:t("extremos",["columnas","filas"])}]),i("grafica","mdi:chart-line",!1,[r("graph"),s&&r("next_day"),s&&e.entity_injection&&r("excedentes_grafica"),s&&r("bandas"),s&&{name:"titulo_grafica",selector:{text:{}}},s&&{name:"grosor",selector:t("grosor",["1.5","2.5"])},s&&{name:"colores",selector:t("colores",["fijo","precio",e.next_day!==!1&&"precio_manana"].filter(Boolean))},s&&{name:"color_hoy",selector:{color_rgb:{}}},c&&{name:"color_manana",selector:{color_rgb:{}}}]),i("facturas","mdi:chart-bar",!1,[r("grafica_facturas"),d&&r("facturas_importe"),d&&r("facturas_tendencia"),d&&{name:"facturas_meses",selector:t("facturas_meses",["3","5","6","9","12"])},d&&{name:"titulo_facturas",selector:{text:{}}},d&&{name:"color_facturas",selector:{color_rgb:{}}}]),i("avanzado","mdi:tune-variant",!1,[{name:"entity",selector:{entity:{domain:"sensor"}}},{name:"entity_factura_actual",selector:{entity:{domain:"sensor"}}},{name:"entity_factura_anterior",selector:{entity:{domain:"sensor"}}},{name:"entity_injection",selector:{entity:{domain:"sensor"}}}])]}function oa(o,e){if(Array.isArray(o)&&o.length===3)return o.map(Number);let a=typeof o=="string"?o.trim():"",t=/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(a)?.[1];if(t){let i=t.length===3?[...t].map(n=>n+n).join(""):t;return[0,2,4].map(n=>parseInt(i.slice(n,n+2),16))}let r=/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(a);if(r)return r.slice(1,4).map(Number);if(a){let i=document.createElement("canvas").getContext("2d");if(i.fillStyle="#000000",i.fillStyle=a,i.fillStyle!=="#000000"||a.toLowerCase()==="black")return oa(i.fillStyle)}return e===void 0?[0,0,0]:oa(e)}function _e(o,e){let a=be(o);return{...a,entity:a.entity||_a(e),entity_factura_actual:a.entity_factura_actual||A(e,"sensor.pvpc_bs_factura_actual"),entity_factura_anterior:a.entity_factura_anterior||A(e,"sensor.pvpc_bs_factura_anterior"),color_hoy:oa(a.color_hoy,ra),color_manana:oa(a.color_manana,Oa),color_facturas:oa(a.color_facturas??a.color_hoy,ra),facturas_meses:String(a.facturas_meses),grafica_facturas:!!a.grafica_facturas,mostrar_excedentes:!!a.entity_injection,hay_excedentes:!!A(e,"sensor.pvpc_bs_precio_excedentes"),titulo_grafica:a.titulo_grafica??"PVPC",titulo_facturas:a.titulo_facturas??$e(e).facturas}}function $e(o){let e=(o?.locale?.language||o?.language||"es").slice(0,2);return Va[e]||Va.en}async function Ze(){if(!customElements.get("ha-form"))try{await(await(await window.loadCardHelpers?.())?.createCardElement({type:"entities",entities:[]}))?.constructor?.getConfigElement?.()}catch(o){console.warn("pvpc-bono-social-card: no se pudo cargar el editor",o)}}var ba=class extends V{setConfig(e){this._config=e}get _idioma(){return(this.hass?.locale?.language||this.hass?.language||"es").slice(0,2)}render(){if(!this._config||!this.hass)return h;let e=_e(this._config,this.hass);return u`<ha-form
      .hass=${this.hass}
      .data=${e}
      .schema=${Ge(this._idioma,e)}
      .computeLabel=${a=>sa(this._idioma).etiquetas[a.name]??a.title??a.name}
      .computeHelper=${a=>sa(this._idioma).ayudas[a.name]??""}
      @value-changed=${this._alCambiar}
    ></ha-form>`}_alCambiar(e){e.stopPropagation();let a=e.detail.value,t=_e(this._config,this.hass),r={...this._config};for(let i of new Set([...Object.keys(a),...Object.keys(t)]))if(i!=="hay_excedentes"&&JSON.stringify(a[i])!==JSON.stringify(t[i])){if(i==="mostrar_excedentes"){a[i]?r.entity_injection=A(this.hass,"sensor.pvpc_bs_precio_excedentes"):delete r.entity_injection;continue}["title","titulo_grafica","titulo_facturas"].includes(i)&&a[i]===void 0?r[i]="":a[i]===void 0?delete r[i]:r[i]=a[i]}r.entity_injection||delete r.entity_injection,this._config=r,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:r},bubbles:!0,composed:!0}))}};U(ba,"properties",{hass:{attribute:!1},_config:{state:!0}});var Da={es:{descripcion:"Precio del PVPC de hoy y ma\xF1ana y la factura con o sin bono social.",config_no_valida:"Configuraci\xF3n no v\xE1lida",secciones:{cabecera:"Cabecera",factura:"Importes de la factura",extremos:"M\xEDnimos y m\xE1ximos",grafica:"Gr\xE1fica de precios",facturas:"Facturas",avanzado:"Avanzado"},opciones:{icon_color:{price:"Por precio",period:"Por periodo P1-P3",fijo:"Azul fijo"},factura:{header:"Arriba, junto al precio",below_chart:"Bajo la gr\xE1fica, a la izquierda",below_chart_right:"Bajo la gr\xE1fica, a la derecha",hidden:"No mostrar"},extremos:{columnas:"Columnas: hoy | ma\xF1ana",filas:"Filas: un d\xEDa por fila"},grosor:{"1.5":"Fino (1,5)","2.5":"Normal (2,5)"},colores:{fijo:"Un color por d\xEDa",precio:"Hoy por precio",precio_manana:"Ma\xF1ana por precio"}},etiquetas:{entity:"Sensor de precio",title:"T\xEDtulo de la tarjeta",factura:"Posici\xF3n en la tarjeta",factura_actual:"Factura periodo en curso",factura_anterior:"Factura periodo anterior",prevision:"Factura estimada",current:"Precio actual",details:"Mostrar m\xEDnimos y m\xE1ximos",extremos:"Disposici\xF3n",graph:"Mostrar la gr\xE1fica",next_day:"Mostrar ma\xF1ana",extremos_manana:"Mostrar ma\xF1ana",icon_color:"Color del icono",colores:"Colores de la gr\xE1fica",grosor:"Grosor de las l\xEDneas",color_hoy:"Color de hoy",color_manana:"Color de ma\xF1ana",bandas:"Punta y llano sombreados",entity_injection:"Sensor de precio de excedentes",mostrar_excedentes:"Mostrar precios de los excedentes",excedentes_grafica:"Mostrar excedentes",grafica_facturas:"Mostrar facturas",facturas_importe:"Importe sobre las barras",facturas_tendencia:"L\xEDnea de tendencia",facturas_meses:"Cantidad de facturas",color_facturas:"Color de las barras",titulo_grafica:"T\xEDtulo de la gr\xE1fica de precios",titulo_facturas:"T\xEDtulo de la gr\xE1fica",entity_factura_actual:"Sensor de factura en curso",entity_factura_anterior:"Sensor de factura anterior"},ayudas:{current:"Precio de esta hora, en grande; el icono sigue",icon_color:"Por precio: verde barato, rojo caro",title:"B\xF3rralo para dejar la tarjeta sin t\xEDtulo",factura:"D\xF3nde van las l\xEDneas de factura",factura_anterior:"\xDAltimo periodo cerrado",factura_actual:"Lo gastado en el periodo hasta hoy",prevision:"Lo que se prev\xE9 pagar al cerrar el periodo",details:"Hora m\xE1s barata y m\xE1s cara de hoy y de ma\xF1ana",extremos:"Columnas: hoy a la izquierda y ma\xF1ana a la derecha. Filas: hoy arriba y ma\xF1ana debajo",graph:"Precio de cada hora en escalones",next_day:"Solo en la gr\xE1fica, cuando ya hay precios (sobre las 20:30)",extremos_manana:"M\xEDnimo y m\xE1ximo de ma\xF1ana, cuando ya hay precios (sobre las 20:30)",titulo_grafica:"B\xF3rralo para dejar la gr\xE1fica sin t\xEDtulo",grosor:"De hoy, ma\xF1ana y excedentes",colores:"\xABPor precio\xBB colorea cada hora del d\xEDa elegido seg\xFAn lo cara que es",color_hoy:"La l\xEDnea y los tri\xE1ngulos de hoy",color_manana:"La l\xEDnea y los tri\xE1ngulos de ma\xF1ana",facturas_importe:"El importe de cada factura encima de su barra",facturas_meses:"Cu\xE1ntas facturas cerradas se ven, las m\xE1s recientes",color_facturas:"El color de las barras",bandas:"Fondo de color en las horas punta y llano de los laborables",entity_injection:"Se elige solo con \xABMostrar precios de los excedentes\xBB",mostrar_excedentes:"Activa los excedentes en la tarjeta (tri\xE1ngulos huecos); necesita la API privada de ESIOS",excedentes_grafica:"Su precio en punteado en la gr\xE1fica",grafica_facturas:"Barras con las \xFAltimas facturas cerradas",facturas_tendencia:"L\xEDnea discontinua con la tendencia",titulo_facturas:"B\xF3rralo para dejar la gr\xE1fica sin t\xEDtulo",entity:"Se detecta sola; c\xE1mbialo solo si tienes varias entradas",entity_factura_actual:"Se detecta solo",entity_factura_anterior:"Se detecta solo"}},en:{descripcion:"Today's and tomorrow's PVPC price and the bill with or without the social bonus.",config_no_valida:"Invalid configuration",secciones:{cabecera:"Header",factura:"Bill amounts",extremos:"Min and max",grafica:"Price chart",facturas:"Bills",avanzado:"Advanced"},opciones:{icon_color:{price:"By price",period:"By period",fijo:"Fixed blue"},factura:{header:"Top, next to the price",below_chart:"Below the chart, left",below_chart_right:"Below the chart, right",hidden:"Don't show"},extremos:{columnas:"Columns: today | tomorrow",filas:"Rows: one day per row"},grosor:{"1.5":"Thin (1.5)","2.5":"Normal (2.5)"},colores:{fijo:"One colour per day",precio:"Today by price",precio_manana:"Tomorrow by price"}},etiquetas:{entity:"Price sensor",title:"Card title",factura:"Position on the card",factura_actual:"Current bill",factura_anterior:"Previous bill",prevision:"Estimated bill",current:"Current price",details:"Show min and max",extremos:"Layout",graph:"Show the chart",next_day:"Show tomorrow",extremos_manana:"Show tomorrow",icon_color:"Icon colour",colores:"Chart colours",grosor:"Line width",color_hoy:"Today's colour",color_manana:"Tomorrow's colour",bandas:"Shade peak hours",entity_injection:"Surplus price sensor",mostrar_excedentes:"Show surplus prices",excedentes_grafica:"Show surplus",grafica_facturas:"Show bills",facturas_importe:"Amount above bars",facturas_tendencia:"Trend line",facturas_meses:"Number of bills",color_facturas:"Bar colour",titulo_grafica:"Price chart title",titulo_facturas:"Chart title",entity_factura_actual:"Current bill sensor",entity_factura_anterior:"Previous bill sensor"},ayudas:{current:"This hour's price, in large type; the icon stays",icon_color:"By price: green cheap, red expensive",title:"Clear it to leave the card untitled",factura:"Where the bill lines go",factura_anterior:"Last closed period",factura_actual:"Spent so far this period",prevision:"Expected total at the end of the period",details:"Cheapest and most expensive hour today and tomorrow",extremos:"Columns: today left, tomorrow right. Rows: today above, tomorrow below",graph:"Hourly price as steps",next_day:"Chart only, once prices are out (around 20:30)",extremos_manana:"Tomorrow's min and max, once prices are out (around 20:30)",titulo_grafica:"Clear it to leave the chart untitled",grosor:"Today, tomorrow and surplus",colores:"\xABBy price\xBB colours each hour of that day by how expensive it is",color_hoy:"Today's line and triangles",color_manana:"Tomorrow's line and triangles",facturas_importe:"Each bill's amount above its bar",facturas_meses:"How many closed bills are shown, the latest",color_facturas:"The bar colour",bandas:"Shaded peak and standard hours on working days",entity_injection:"Set by \xABShow surplus prices\xBB",mostrar_excedentes:"Enables surplus on the card (hollow triangles); needs the ESIOS private API",excedentes_grafica:"Its price, dotted, on the chart",grafica_facturas:"Bars with the latest closed bills",facturas_tendencia:"Dashed trend line",titulo_facturas:"Clear it to leave the chart untitled",entity:"Detected automatically; change it only with several entries",entity_factura_actual:"Detected automatically",entity_factura_anterior:"Detected automatically"}},ca:{descripcion:"Preu del PVPC d'avui i de dem\xE0 i la factura amb bo social o sense.",config_no_valida:"Configuraci\xF3 no v\xE0lida",secciones:{cabecera:"Cap\xE7alera",factura:"Imports de la factura",extremos:"M\xEDnims i m\xE0xims",grafica:"Gr\xE0fic de preus",facturas:"Factures",avanzado:"Avan\xE7at"},opciones:{icon_color:{price:"Per preu",period:"Per per\xEDode P1-P3",fijo:"Blau fix"},factura:{header:"A dalt, al costat del preu",below_chart:"Sota el gr\xE0fic, a l'esquerra",below_chart_right:"Sota el gr\xE0fic, a la dreta",hidden:"No mostrar"},extremos:{columnas:"Columnes: avui | dem\xE0",filas:"Files: un dia per fila"},grosor:{"1.5":"Fina (1,5)","2.5":"Normal (2,5)"},colores:{fijo:"Un color per dia",precio:"Avui per preu",precio_manana:"Dem\xE0 per preu"}},etiquetas:{entity:"Sensor de preu",title:"T\xEDtol de la targeta",factura:"Posici\xF3 a la targeta",factura_actual:"Factura del per\xEDode en curs",factura_anterior:"Factura del per\xEDode anterior",prevision:"Factura estimada",current:"Preu actual",details:"Mostrar m\xEDnims i m\xE0xims",extremos:"Disposici\xF3",graph:"Mostrar el gr\xE0fic",next_day:"Mostrar dem\xE0",extremos_manana:"Mostrar dem\xE0",icon_color:"Color de la icona",colores:"Colors del gr\xE0fic",grosor:"Gruix de les l\xEDnies",color_hoy:"Color d'avui",color_manana:"Color de dem\xE0",bandas:"Punta i pla ombrejats",entity_injection:"Sensor de preu dels excedents",mostrar_excedentes:"Mostrar els preus dels excedents",excedentes_grafica:"Mostrar els excedents",grafica_facturas:"Mostrar les factures",facturas_importe:"Import sobre les barres",facturas_tendencia:"L\xEDnia de tend\xE8ncia",facturas_meses:"Nombre de factures",color_facturas:"Color de les barres",titulo_grafica:"T\xEDtol del gr\xE0fic de preus",titulo_facturas:"T\xEDtol del gr\xE0fic",entity_factura_actual:"Sensor de la factura en curs",entity_factura_anterior:"Sensor de la factura anterior"},ayudas:{current:"Preu d'aquesta hora, en gran; la icona es mant\xE9",icon_color:"Per preu: verd barat, vermell car",title:"Esborra'l per deixar la targeta sense t\xEDtol",factura:"On van les l\xEDnies de factura",factura_anterior:"\xDAltim per\xEDode tancat",factura_actual:"El que s'ha gastat en el per\xEDode fins avui",prevision:"El que es preveu pagar en tancar el per\xEDode",details:"Hora m\xE9s barata i m\xE9s cara d'avui i de dem\xE0",extremos:"Columnes: avui a l'esquerra i dem\xE0 a la dreta. Files: avui a dalt i dem\xE0 a sota",graph:"Preu de cada hora en esglaons",next_day:"Nom\xE9s al gr\xE0fic, quan ja hi ha preus (cap a les 20:30)",extremos_manana:"M\xEDnim i m\xE0xim de dem\xE0, quan ja hi ha preus (cap a les 20:30)",titulo_grafica:"Esborra'l per deixar el gr\xE0fic sense t\xEDtol",grosor:"D'avui, de dem\xE0 i dels excedents",colores:"\xABPer preu\xBB pinta cada hora del dia triat segons com n'\xE9s de car",color_hoy:"La l\xEDnia i els triangles d'avui",color_manana:"La l\xEDnia i els triangles de dem\xE0",facturas_importe:"L'import de cada factura damunt de la seva barra",facturas_meses:"Quantes factures tancades es veuen, les m\xE9s recents",color_facturas:"El color de les barres",bandas:"Fons de color a les hores punta i pla dels dies feiners",entity_injection:"Es tria sol en activar \xABMostrar els preus dels excedents\xBB",mostrar_excedentes:"Activa els excedents a la targeta (triangles buits); cal l'API privada d'ESIOS",excedentes_grafica:"El seu preu en puntejat al gr\xE0fic",grafica_facturas:"Barres amb les \xFAltimes factures tancades",facturas_tendencia:"L\xEDnia discont\xEDnua amb la tend\xE8ncia",titulo_facturas:"Esborra'l per deixar el gr\xE0fic sense t\xEDtol",entity:"Es detecta sol; canvia'l nom\xE9s si tens diverses entrades",entity_factura_actual:"Es detecta sol",entity_factura_anterior:"Es detecta sol"}},gl:{descripcion:"Prezo do PVPC de hoxe e ma\xF1\xE1 e a factura con ou sen bono social.",config_no_valida:"Configuraci\xF3n non v\xE1lida",secciones:{cabecera:"Cabeceira",factura:"Importes da factura",extremos:"M\xEDnimos e m\xE1ximos",grafica:"Gr\xE1fica de prezos",facturas:"Facturas",avanzado:"Avanzado"},opciones:{icon_color:{price:"Por prezo",period:"Por per\xEDodo P1-P3",fijo:"Azul fixo"},factura:{header:"Arriba, xunto ao prezo",below_chart:"Debaixo da gr\xE1fica, \xE1 esquerda",below_chart_right:"Debaixo da gr\xE1fica, \xE1 dereita",hidden:"Non amosar"},extremos:{columnas:"Columnas: hoxe | ma\xF1\xE1",filas:"Filas: un d\xEDa por fila"},grosor:{"1.5":"Fina (1,5)","2.5":"Normal (2,5)"},colores:{fijo:"Unha cor por d\xEDa",precio:"Hoxe por prezo",precio_manana:"Ma\xF1\xE1 por prezo"}},etiquetas:{entity:"Sensor de prezo",title:"T\xEDtulo da tarxeta",factura:"Posici\xF3n na tarxeta",factura_actual:"Factura do per\xEDodo en curso",factura_anterior:"Factura do per\xEDodo anterior",prevision:"Factura estimada",current:"Prezo actual",details:"Amosar m\xEDnimos e m\xE1ximos",extremos:"Disposici\xF3n",graph:"Amosar a gr\xE1fica",next_day:"Amosar ma\xF1\xE1",extremos_manana:"Amosar ma\xF1\xE1",icon_color:"Cor da icona",colores:"Cores da gr\xE1fica",grosor:"Grosor das li\xF1as",color_hoy:"Cor de hoxe",color_manana:"Cor de ma\xF1\xE1",bandas:"Punta e chan sombreados",entity_injection:"Sensor de prezo dos excedentes",mostrar_excedentes:"Amosar os prezos dos excedentes",excedentes_grafica:"Amosar os excedentes",grafica_facturas:"Amosar as facturas",facturas_importe:"Importe sobre as barras",facturas_tendencia:"Li\xF1a de tendencia",facturas_meses:"Cantidade de facturas",color_facturas:"Cor das barras",titulo_grafica:"T\xEDtulo da gr\xE1fica de prezos",titulo_facturas:"T\xEDtulo da gr\xE1fica",entity_factura_actual:"Sensor de factura en curso",entity_factura_anterior:"Sensor de factura anterior"},ayudas:{current:"Prezo desta hora, en grande; a icona mantense",icon_color:"Por prezo: verde barato, vermello caro",title:"B\xF3rrao para deixar a tarxeta sen t\xEDtulo",factura:"Onde van as li\xF1as de factura",factura_anterior:"\xDAltimo per\xEDodo pechado",factura_actual:"O gastado no per\xEDodo ata hoxe",prevision:"O que se prev\xE9 pagar ao pechar o per\xEDodo",details:"Hora m\xE1is barata e m\xE1is cara de hoxe e de ma\xF1\xE1",extremos:"Columnas: hoxe \xE1 esquerda e ma\xF1\xE1 \xE1 dereita. Filas: hoxe arriba e ma\xF1\xE1 debaixo",graph:"Prezo de cada hora en chanzos",next_day:"S\xF3 na gr\xE1fica, cando xa hai prezos (arredor das 20:30)",extremos_manana:"M\xEDnimo e m\xE1ximo de ma\xF1\xE1, cando xa hai prezos (arredor das 20:30)",titulo_grafica:"B\xF3rrao para deixar a gr\xE1fica sen t\xEDtulo",grosor:"De hoxe, ma\xF1\xE1 e excedentes",colores:"\xABPor prezo\xBB colorea cada hora do d\xEDa escollido segundo o cara que sexa",color_hoy:"A li\xF1a e os tri\xE1ngulos de hoxe",color_manana:"A li\xF1a e os tri\xE1ngulos de ma\xF1\xE1",facturas_importe:"O importe de cada factura enriba da s\xFAa barra",facturas_meses:"Cantas facturas pechadas se ven, as m\xE1is recentes",color_facturas:"A cor das barras",bandas:"Fondo de cor nas horas punta e chan dos laborables",entity_injection:"Esc\xF3llese s\xF3 con \xABAmosar os prezos dos excedentes\xBB",mostrar_excedentes:"Activa os excedentes na tarxeta (tri\xE1ngulos baleiros); necesita a API privada de ESIOS",excedentes_grafica:"O seu prezo con li\xF1a de puntos na gr\xE1fica",grafica_facturas:"Barras coas \xFAltimas facturas pechadas",facturas_tendencia:"Li\xF1a descontinua coa tendencia",titulo_facturas:"B\xF3rrao para deixar a gr\xE1fica sen t\xEDtulo",entity:"Det\xE9ctase s\xF3; c\xE1mbiao s\xF3 se tes varias entradas",entity_factura_actual:"Det\xE9ctase s\xF3",entity_factura_anterior:"Det\xE9ctase s\xF3"}},eu:{descripcion:"Gaurko eta biharko PVPC prezioa eta faktura, gizarte-bonuarekin edo gabe.",config_no_valida:"Konfigurazio baliogabea",secciones:{cabecera:"Goiburua",factura:"Fakturaren zenbatekoak",extremos:"Gutxienekoak eta gehienekoak",grafica:"Prezioen grafikoa",facturas:"Fakturak",avanzado:"Aurreratua"},opciones:{icon_color:{price:"Prezioaren arabera",period:"P1-P3 aldiaren arabera",fijo:"Urdin finkoa"},factura:{header:"Goian, prezioaren ondoan",below_chart:"Grafikoaren azpian, ezkerrean",below_chart_right:"Grafikoaren azpian, eskuinean",hidden:"Ez erakutsi"},extremos:{columnas:"Zutabeak: gaur | bihar",filas:"Errenkadak: egun bat errenkada bakoitzeko"},grosor:{"1.5":"Mehea (1,5)","2.5":"Normala (2,5)"},colores:{fijo:"Kolore bat egun bakoitzeko",precio:"Gaur, prezioaren arabera",precio_manana:"Bihar, prezioaren arabera"}},etiquetas:{entity:"Prezio-sentsorea",title:"Txartelaren izenburua",factura:"Kokapena txartelean",factura_actual:"Uneko aldiko faktura",factura_anterior:"Aurreko aldiko faktura",prevision:"Zenbatetsitako faktura",current:"Uneko prezioa",details:"Erakutsi gutxienekoak eta gehienekoak",extremos:"Antolaera",graph:"Erakutsi grafikoa",next_day:"Erakutsi bihar",extremos_manana:"Erakutsi bihar",icon_color:"Ikonoaren kolorea",colores:"Grafikoaren koloreak",grosor:"Marren lodiera",color_hoy:"Gaurko kolorea",color_manana:"Biharko kolorea",bandas:"Puntakoa eta laua itzalduta",entity_injection:"Soberakinen prezio-sentsorea",mostrar_excedentes:"Erakutsi soberakinen prezioak",excedentes_grafica:"Erakutsi soberakinak",grafica_facturas:"Erakutsi fakturak",facturas_importe:"Zenbatekoa barren gainean",facturas_tendencia:"Joera-marra",facturas_meses:"Faktura kopurua",color_facturas:"Barren kolorea",titulo_grafica:"Prezioen grafikoaren izenburua",titulo_facturas:"Grafikoaren izenburua",entity_factura_actual:"Uneko fakturaren sentsorea",entity_factura_anterior:"Aurreko fakturaren sentsorea"},ayudas:{current:"Ordu honetako prezioa, handian; ikonoa mantentzen da",icon_color:"Prezioaren arabera: berdea merkea, gorria garestia",title:"Ezabatu txartela izenbururik gabe uzteko",factura:"Fakturaren lerroak non doazen",factura_anterior:"Itxitako azken aldia",factura_actual:"Aldian gaur arte gastatutakoa",prevision:"Aldia ixtean ordaintzea aurreikusten dena",details:"Gaurko eta biharko ordu merkeena eta garestiena",extremos:"Zutabeak: gaur ezkerrean eta bihar eskuinean. Errenkadak: gaur goian eta bihar behean",graph:"Ordu bakoitzeko prezioa, mailaka",next_day:"Grafikoan soilik, prezioak daudenean (20:30 aldera)",extremos_manana:"Biharko gutxienekoa eta gehienekoa, prezioak daudenean (20:30 aldera)",titulo_grafica:"Ezabatu grafikoa izenbururik gabe uzteko",grosor:"Gaurkoa, biharkoa eta soberakinak",colores:"\xABPrezioaren arabera\xBB aukerak aukeratutako eguneko ordu bakoitza koloreztatzen du, zein garestia den kontuan hartuta",color_hoy:"Gaurko marra eta triangeluak",color_manana:"Biharko marra eta triangeluak",facturas_importe:"Faktura bakoitzaren zenbatekoa bere barraren gainean",facturas_meses:"Zenbat faktura itxi ikusten diren, berrienak",color_facturas:"Barren kolorea",bandas:"Kolorezko hondoa lanegunetako aldi puntakoan eta lauan",entity_injection:"\xABErakutsi soberakinen prezioak\xBB aktibatuta dagoenean bakarrik aukeratzen da",mostrar_excedentes:"Soberakinak aktibatzen ditu txartelean (triangelu hutsak); ESIOSen API pribatua behar du",excedentes_grafica:"Haien prezioa, puntuz, grafikoan",grafica_facturas:"Itxitako azken fakturen barrak",facturas_tendencia:"Joera erakusten duen marra etena",titulo_facturas:"Ezabatu grafikoa izenbururik gabe uzteko",entity:"Bere kabuz detektatzen da; aldatu hainbat sarrera badituzu soilik",entity_factura_actual:"Bere kabuz detektatzen da",entity_factura_anterior:"Bere kabuz detektatzen da"}}};customElements.get(ma)||(customElements.define(ma,ta),customElements.define(ge,ba),window.customCards=window.customCards||[],window.customCards.push({type:ma,name:"PVPC + Bono Social",description:sa(ve()).descripcion,preview:!0,documentationURL:"https://github.com/BaRDaHL/pvpc_bonosocial"}),console.info(`%c PVPC + Bono Social %c ${De} `,"background:#43a047;color:#fff",""));
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
