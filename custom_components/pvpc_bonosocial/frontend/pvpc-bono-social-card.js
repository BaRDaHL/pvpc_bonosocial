var zt=Object.defineProperty;var jt=(r,t,e)=>t in r?zt(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var V=(r,t,e)=>jt(r,typeof t!="symbol"?t+"":t,e);var B=globalThis,I=B.ShadowRoot&&(B.ShadyCSS===void 0||B.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,W=Symbol(),ht=new WeakMap,R=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==W)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(I&&t===void 0){let s=e!==void 0&&e.length===1;s&&(t=ht.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&ht.set(e,t))}return t}toString(){return this.cssText}},dt=r=>new R(typeof r=="string"?r:r+"",void 0,W),K=(r,...t)=>{let e=r.length===1?r[0]:t.reduce((s,i,o)=>s+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+r[o+1],r[0]);return new R(e,r,W)},pt=(r,t)=>{if(I)r.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let s=document.createElement("style"),i=B.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=e.cssText,r.appendChild(s)}},G=I?r=>r:r=>r instanceof CSSStyleSheet?(t=>{let e="";for(let s of t.cssRules)e+=s.cssText;return dt(e)})(r):r;var{is:Lt,defineProperty:Dt,getOwnPropertyDescriptor:Bt,getOwnPropertyNames:It,getOwnPropertySymbols:qt,getPrototypeOf:Ft}=Object,q=globalThis,ut=q.trustedTypes,Vt=ut?ut.emptyScript:"",Wt=q.reactiveElementPolyfillSupport,k=(r,t)=>r,J={toAttribute(r,t){switch(t){case Boolean:r=r?Vt:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,t){let e=r;switch(t){case Boolean:e=r!==null;break;case Number:e=r===null?null:Number(r);break;case Object:case Array:try{e=JSON.parse(r)}catch{e=null}}return e}},ft=(r,t)=>!Lt(r,t),mt={attribute:!0,type:String,converter:J,reflect:!1,useDefault:!1,hasChanged:ft};Symbol.metadata??=Symbol("metadata"),q.litPropertyMetadata??=new WeakMap;var y=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=mt){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let s=Symbol(),i=this.getPropertyDescriptor(t,s,e);i!==void 0&&Dt(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){let{get:i,set:o}=Bt(this.prototype,t)??{get(){return this[e]},set(n){this[e]=n}};return{get:i,set(n){let a=i?.call(this);o?.call(this,n),this.requestUpdate(t,a,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??mt}static _$Ei(){if(this.hasOwnProperty(k("elementProperties")))return;let t=Ft(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(k("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(k("properties"))){let e=this.properties,s=[...It(e),...qt(e)];for(let i of s)this.createProperty(i,e[i])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[s,i]of e)this.elementProperties.set(s,i)}this._$Eh=new Map;for(let[e,s]of this.elementProperties){let i=this._$Eu(e,s);i!==void 0&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let i of s)e.unshift(G(i))}else t!==void 0&&e.push(G(t));return e}static _$Eu(t,e){let s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return pt(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){let s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(i!==void 0&&s.reflect===!0){let o=(s.converter?.toAttribute!==void 0?s.converter:J).toAttribute(e,s.type);this._$Em=t,o==null?this.removeAttribute(i):this.setAttribute(i,o),this._$Em=null}}_$AK(t,e){let s=this.constructor,i=s._$Eh.get(t);if(i!==void 0&&this._$Em!==i){let o=s.getPropertyOptions(i),n=typeof o.converter=="function"?{fromAttribute:o.converter}:o.converter?.fromAttribute!==void 0?o.converter:J;this._$Em=i;let a=n.fromAttribute(e,o.type);this[i]=a??this._$Ej?.get(i)??a,this._$Em=null}}requestUpdate(t,e,s,i=!1,o){if(t!==void 0){let n=this.constructor;if(i===!1&&(o=this[t]),s??=n.getPropertyOptions(t),!((s.hasChanged??ft)(o,e)||s.useDefault&&s.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(n._$Eu(t,s))))return;this.C(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:o},n){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),o!==!0||n!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),i===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[i,o]of this._$Ep)this[i]=o;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[i,o]of s){let{wrapped:n}=o,a=this[i];n!==!0||this._$AL.has(i)||a===void 0||this.C(i,void 0,o,a)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(e)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};y.elementStyles=[],y.shadowRootOptions={mode:"open"},y[k("elementProperties")]=new Map,y[k("finalized")]=new Map,Wt?.({ReactiveElement:y}),(q.reactiveElementVersions??=[]).push("2.1.2");var st=globalThis,_t=r=>r,F=st.trustedTypes,$t=F?F.createPolicy("lit-html",{createHTML:r=>r}):void 0,At="$lit$",b=`lit$${Math.random().toFixed(9).slice(2)}$`,Et="?"+b,Kt=`<${Et}>`,P=document,z=()=>P.createComment(""),j=r=>r===null||typeof r!="object"&&typeof r!="function",it=Array.isArray,Gt=r=>it(r)||typeof r?.[Symbol.iterator]=="function",Q=`[ 	
\f\r]`,H=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,gt=/-->/g,yt=/>/g,S=RegExp(`>|${Q}(?:([^\\s"'>=/]+)(${Q}*=${Q}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),vt=/'/g,bt=/"/g,St=/^(?:script|style|textarea|title)$/i,rt=r=>(t,...e)=>({_$litType$:r,strings:t,values:e}),f=rt(1),x=rt(2),ae=rt(3),C=Symbol.for("lit-noChange"),h=Symbol.for("lit-nothing"),xt=new WeakMap,w=P.createTreeWalker(P,129);function wt(r,t){if(!it(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return $t!==void 0?$t.createHTML(t):t}var Jt=(r,t)=>{let e=r.length-1,s=[],i,o=t===2?"<svg>":t===3?"<math>":"",n=H;for(let a=0;a<e;a++){let c=r[a],p,l,d=-1,m=0;for(;m<c.length&&(n.lastIndex=m,l=n.exec(c),l!==null);)m=n.lastIndex,n===H?l[1]==="!--"?n=gt:l[1]!==void 0?n=yt:l[2]!==void 0?(St.test(l[2])&&(i=RegExp("</"+l[2],"g")),n=S):l[3]!==void 0&&(n=S):n===S?l[0]===">"?(n=i??H,d=-1):l[1]===void 0?d=-2:(d=n.lastIndex-l[2].length,p=l[1],n=l[3]===void 0?S:l[3]==='"'?bt:vt):n===bt||n===vt?n=S:n===gt||n===yt?n=H:(n=S,i=void 0);let _=n===S&&r[a+1].startsWith("/>")?" ":"";o+=n===H?c+Kt:d>=0?(s.push(p),c.slice(0,d)+At+c.slice(d)+b+_):c+b+(d===-2?a:_)}return[wt(r,o+(r[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]},L=class r{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let o=0,n=0,a=t.length-1,c=this.parts,[p,l]=Jt(t,e);if(this.el=r.createElement(p,s),w.currentNode=this.el.content,e===2||e===3){let d=this.el.content.firstChild;d.replaceWith(...d.childNodes)}for(;(i=w.nextNode())!==null&&c.length<a;){if(i.nodeType===1){if(i.hasAttributes())for(let d of i.getAttributeNames())if(d.endsWith(At)){let m=l[n++],_=i.getAttribute(d).split(b),g=/([.?@])?(.*)/.exec(m);c.push({type:1,index:o,name:g[2],strings:_,ctor:g[1]==="."?Z:g[1]==="?"?Y:g[1]==="@"?tt:O}),i.removeAttribute(d)}else d.startsWith(b)&&(c.push({type:6,index:o}),i.removeAttribute(d));if(St.test(i.tagName)){let d=i.textContent.split(b),m=d.length-1;if(m>0){i.textContent=F?F.emptyScript:"";for(let _=0;_<m;_++)i.append(d[_],z()),w.nextNode(),c.push({type:2,index:++o});i.append(d[m],z())}}}else if(i.nodeType===8)if(i.data===Et)c.push({type:2,index:o});else{let d=-1;for(;(d=i.data.indexOf(b,d+1))!==-1;)c.push({type:7,index:o}),d+=b.length-1}o++}}static createElement(t,e){let s=P.createElement("template");return s.innerHTML=t,s}};function N(r,t,e=r,s){if(t===C)return t;let i=s!==void 0?e._$Co?.[s]:e._$Cl,o=j(t)?void 0:t._$litDirective$;return i?.constructor!==o&&(i?._$AO?.(!1),o===void 0?i=void 0:(i=new o(r),i._$AT(r,e,s)),s!==void 0?(e._$Co??=[])[s]=i:e._$Cl=i),i!==void 0&&(t=N(r,i._$AS(r,t.values),i,s)),t}var X=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??P).importNode(e,!0);w.currentNode=i;let o=w.nextNode(),n=0,a=0,c=s[0];for(;c!==void 0;){if(n===c.index){let p;c.type===2?p=new D(o,o.nextSibling,this,t):c.type===1?p=new c.ctor(o,c.name,c.strings,this,t):c.type===6&&(p=new et(o,this,t)),this._$AV.push(p),c=s[++a]}n!==c?.index&&(o=w.nextNode(),n++)}return w.currentNode=P,i}p(t){let e=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}},D=class r{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=h,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=N(this,t,e),j(t)?t===h||t==null||t===""?(this._$AH!==h&&this._$AR(),this._$AH=h):t!==this._$AH&&t!==C&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Gt(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==h&&j(this._$AH)?this._$AA.nextSibling.data=t:this.T(P.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:s}=t,i=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=L.createElement(wt(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{let o=new X(i,this),n=o.u(this.options);o.p(e),this.T(n),this._$AH=o}}_$AC(t){let e=xt.get(t.strings);return e===void 0&&xt.set(t.strings,e=new L(t)),e}k(t){it(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,i=0;for(let o of t)i===e.length?e.push(s=new r(this.O(z()),this.O(z()),this,this.options)):s=e[i],s._$AI(o),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let s=_t(t).nextSibling;_t(t).remove(),t=s}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},O=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,o){this.type=1,this._$AH=h,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=o,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=h}_$AI(t,e=this,s,i){let o=this.strings,n=!1;if(o===void 0)t=N(this,t,e,0),n=!j(t)||t!==this._$AH&&t!==C,n&&(this._$AH=t);else{let a=t,c,p;for(t=o[0],c=0;c<o.length-1;c++)p=N(this,a[s+c],e,c),p===C&&(p=this._$AH[c]),n||=!j(p)||p!==this._$AH[c],p===h?t=h:t!==h&&(t+=(p??"")+o[c+1]),this._$AH[c]=p}n&&!i&&this.j(t)}j(t){t===h?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},Z=class extends O{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===h?void 0:t}},Y=class extends O{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==h)}},tt=class extends O{constructor(t,e,s,i,o){super(t,e,s,i,o),this.type=5}_$AI(t,e=this){if((t=N(this,t,e,0)??h)===C)return;let s=this._$AH,i=t===h&&s!==h||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==h&&(s===h||i);i&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},et=class{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){N(this,t)}};var Qt=st.litHtmlPolyfillSupport;Qt?.(L,D),(st.litHtmlVersions??=[]).push("3.3.3");var Pt=(r,t,e)=>{let s=e?.renderBefore??t,i=s._$litPart$;if(i===void 0){let o=e?.renderBefore??null;s._$litPart$=i=new D(t.insertBefore(z(),o),o,void 0,e??{})}return i._$AI(r),i};var ot=globalThis,A=class extends y{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Pt(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return C}};A._$litElement$=!0,A.finalized=!0,ot.litElementHydrateSupport?.({LitElement:A});var Xt=ot.litElementPolyfillSupport;Xt?.({LitElement:A});(ot.litElementVersions??=[]).push("4.2.2");var Zt="1.0.0",nt="pvpc-bono-social-card",Ct="pvpc-hourly-pricing-card",Mt=["var(--pvpc-bs-verde)","var(--pvpc-bs-amarillo)","var(--pvpc-bs-naranja)","var(--pvpc-bs-rojo)"],Yt={P1:3,P2:2,P3:0},Nt={es:{titulo:"Precio de la luz",ahora:"Ahora",hoy:"Hoy",manana:"Ma\xF1ana",minimo:"M\xEDnimo",maximo:"M\xE1ximo",anterior:"Factura periodo anterior",en_curso:"Factura periodo en curso",prevision:"previsi\xF3n",estimada:"estimada",desviacion:"desviaci\xF3n",real:"real",sin_precio:"Sin precios",periodos:{P1:"punta",P2:"llano",P3:"valle"},sin_entidad:"No se encuentra el sensor de precio de PVPC + Bono Social"},en:{titulo:"Electricity price",ahora:"Now",hoy:"Today",manana:"Tomorrow",minimo:"Minimum",maximo:"Maximum",anterior:"Previous bill",en_curso:"Current bill",prevision:"forecast",estimada:"estimated",desviacion:"deviation",real:"actual",sin_precio:"No prices",periodos:{P1:"peak",P2:"standard",P3:"off-peak"},sin_entidad:"PVPC + Bono Social price sensor not found"}};function Ot(r,t=!1){let e=t?"price_next_day_":"price_",s=[];for(let i=0;i<24;i++){let o=String(i).padStart(2,"0"),n=r?.[`${e}${o}h`];typeof n=="number"&&s.push({hora:i,precio:n});let a=r?.[`${e}${o}h_d`];typeof a=="number"&&s.push({hora:i,precio:a})}return s}function te(r,t=new Date){let e=t.getHours();return r.findIndex(s=>s.hora===e)}function Rt(r){if(!r.length)return null;let t=0,e=0;return r.forEach((s,i)=>{s.precio<r[t].precio&&(t=i),s.precio>r[e].precio&&(e=i)}),{min:r[t],max:r[e]}}function Tt(r){let t=Rt(r);if(!t)return[];let e=t.max.precio-t.min.precio;return r.map(s=>e?Math.min(3,Math.floor((s.precio-t.min.precio)/e*4)):0)}function at(r,t,e=()=>!0){return Object.keys(r?.states||{}).filter(s=>s.startsWith(t)&&e(r.states[s])).sort()[0]}function Ut(r){return r?.states["sensor.pvpc_bs_precio"]?"sensor.pvpc_bs_precio":at(r,"sensor.",t=>"price_00h"in(t.attributes||{})&&String(t.attributes.attribution||"").includes("REE"))}var T=class extends A{static getConfigForm(){return{schema:[{name:"entity",selector:{entity:{domain:"sensor"}}},{name:"title",selector:{text:{}}},{name:"factura",selector:{select:{mode:"dropdown",options:[{value:"below_chart",label:"Bajo la gr\xE1fica / Below the chart"},{value:"header",label:"Arriba / In the header"},{value:"hidden",label:"Oculta / Hidden"}]}}},{type:"grid",name:"",schema:[{name:"factura_actual",selector:{boolean:{}}},{name:"factura_anterior",selector:{boolean:{}}},{name:"current",selector:{boolean:{}}},{name:"details",selector:{boolean:{}}},{name:"graph",selector:{boolean:{}}},{name:"next_day",selector:{boolean:{}}}]},{name:"icon_color",selector:{select:{mode:"dropdown",options:[{value:"price",label:"Por precio / By price"},{value:"period",label:"Por periodo P1-P3 / By period"}]}}},{name:"entity_factura_actual",selector:{entity:{domain:"sensor"}}},{name:"entity_factura_anterior",selector:{entity:{domain:"sensor"}}}],computeLabel:t=>ee[t.name]||t.name}}static getStubConfig(t){return{entity:Ut(t)||"sensor.pvpc_bs_precio"}}setConfig(t){if(!t)throw new Error("Configuraci\xF3n no v\xE1lida");this._config={current:!0,details:!0,graph:!0,next_day:!0,factura:"below_chart",factura_actual:!0,factura_anterior:!0,icon_color:"price",...t}}getCardSize(){return this._config?.graph===!1?3:7}getGridOptions(){return{columns:12,min_columns:6,rows:this._config?.graph===!1?3:7,min_rows:3}}get _t(){let t=(this.hass?.locale?.language||this.hass?.language||"es").slice(0,2);return Nt[t]||Nt.en}_num(t,e=3){let s=this.hass?.locale?.language||this.hass?.language||"es";return new Intl.NumberFormat(s,{minimumFractionDigits:e,maximumFractionDigits:e}).format(t)}render(){if(!this._config||!this.hass)return h;let t=this._t,e=this._config.entity||Ut(this.hass),s=e&&this.hass.states[e];if(!s)return f`<ha-card><div class="aviso">${t.sin_entidad}</div></ha-card>`;let i=s.attributes||{},o=Ot(i),n=this._config.next_day?Ot(i,!0):[],a=Array.isArray(i.colores_hoy)&&i.colores_hoy.length===o.length?i.colores_hoy:Tt(o),c=Array.isArray(i.colores_manana)&&i.colores_manana.length===n.length?i.colores_manana:Tt(n),p=te(o),l=Array.isArray(i.periodos_hoy)&&i.periodos_hoy.length===o.length&&i.periodos_hoy.some(g=>g!=="P3")?i.periodos_hoy:null,d=Number(s.state),m=this._factura(),_=this._config.factura;return f`
      <ha-card>
        <div class="contenedor">
          ${this._config.current?f`<div class="cabecera">
                ${this._icono(p>=0?a[p]:void 0)}
                <div class="nombre">${this._config.title||t.titulo}</div>
                <div class="actual">
                  <div class="precio">
                    ${Number.isFinite(d)?this._num(d):"\u2014"}
                    <span class="unidad">€/kWh</span>
                  </div>
                </div>
              </div>
              ${_==="header"&&m?f`<div class="factura arriba">${m}</div>`:h}`:h}
          ${this._config.details?this._detalles(o,n):h}
          ${this._config.graph?this._grafica(o,n,a,c,p,l):h}
          ${m&&(_==="below_chart"||_==="header"&&!this._config.current)?f`<div class="factura abajo">${m}</div>`:h}
          ${m&&_==="header"&&this._config.current?f`<div class="factura abajo estrecha">${m}</div>`:h}
        </div>
      </ha-card>
    `}_icono(t){let e=t;if(this._config.icon_color==="period"){let i=this.hass.states["sensor.pvpc_bs_periodo"]?.state;e=Yt[i]}let s=e===void 0?"var(--secondary-text-color)":Mt[e];return f`<div class="icono" style="background:${s}" aria-hidden="true">€</div>`}_detalles(t,e){let s=this._t,i=(o,n)=>{let a=Rt(n);return a?f`<span class="dia">${o}</span>
        <span><span class="et">${s.minimo}</span> <b>${this._num(a.min.precio)}</b> · ${a.min.hora} h</span>
        <span><span class="et">${s.maximo}</span> <b>${this._num(a.max.precio)}</b> · ${a.max.hora} h</span>`:h};return f`<div class="detalles">${i(s.hoy,t)}${e.length?i(s.manana,e):h}</div>`}_factura(){let t=this._t;if(this._config.factura==="hidden")return null;let e=[],s=this._config.entity_factura_anterior||at(this.hass,"sensor.pvpc_bs_factura_anterior"),i=this._config.entity_factura_actual||at(this.hass,"sensor.pvpc_bs_factura_actual"),o=s&&this.hass.states[s];if(this._config.factura_anterior&&o&&Number.isFinite(Number(o.state))){let a=o.attributes||{},c=a.estado==="conciliada"&&typeof a.estimada=="number"?f` <span class="suave">(${t.estimada} ${this._num(a.estimada,2)} €, ${t.desviacion}
              ${this._num(a.desviacion??a.estimada-Number(o.state),2)} €)</span>`:h;e.push(f`<div>${t.anterior}: <b>${this._num(Number(o.state),2)} €</b>${c}</div>`)}let n=i&&this.hass.states[i];if(this._config.factura_actual&&n&&Number.isFinite(Number(n.state))){let a=n.attributes?.acumulado;e.push(typeof a=="number"?f`<div>
              ${t.en_curso}: <b class="grande">${this._num(a,2)} €</b>
              <span class="suave">(${t.prevision} ${this._num(Number(n.state),2)} €)</span>
            </div>`:f`<div>${t.en_curso}: <span class="suave">${t.prevision}</span> <b>${this._num(Number(n.state),2)} €</b></div>`)}return e.length?e:null}_grafica(t,e,s,i,o,n){let a=this._t;if(!t.length)return f`<div class="aviso">${a.sin_precio}</div>`;let c=480,p=170,l={izq:34,der:8,arr:10,aba:22},d=[...t,...e].map(u=>u.precio),m=Math.min(0,...d),_=Math.max(...d);_-m<.01&&(_=m+.01);let g=Math.max(t.length,e.length,24),v=u=>l.izq+(c-l.izq-l.der)*(u+.5)/g,U=u=>l.arr+(p-l.arr-l.aba)*(1-(u-m)/(_-m)),ct=u=>u.map((E,M)=>`${M?"L":"M"}${v(M).toFixed(1)},${U(E.precio).toFixed(1)}`).join(""),kt=[m,(m+_)/2,_],$=this._cursor,lt=(u,E,M,Ht)=>x`<circle class=${Ht} cx=${v(M)} cy=${U(u[M].precio)} r="3" fill=${Mt[E[M]??0]}></circle>`;return f`
      <div class="grafica">
        <svg
          viewBox="0 0 ${c} ${p}"
          role="img"
          aria-label=${a.titulo}
          @pointermove=${u=>this._mover(u,c,l,g)}
          @pointerleave=${()=>this._cursor=void 0}
        >
          ${n?n.map((u,E)=>u==="P3"?h:x`<rect class=${u==="P1"?"banda-punta":"banda-llano"} x=${v(E)-(c-l.izq-l.der)/g/2}
                      y=${l.arr} width=${(c-l.izq-l.der)/g} height=${p-l.arr-l.aba}></rect>`):h}
          ${kt.map(u=>x`<line class="rejilla" x1=${l.izq} x2=${c-l.der} y1=${U(u)} y2=${U(u)}></line>
              <text class="eje" x=${l.izq-4} y=${U(u)+3} text-anchor="end">${this._num(Math.abs(u)<.005?0:u,2)}</text>`)}
          ${[0,3,6,9,12,15,18,21].map(u=>x`<text class="eje" x=${v(u)} y=${p-6} text-anchor="middle">${u}</text>`)}
          ${o>=0?x`<line class="ahora" x1=${v(o)} x2=${v(o)} y1=${l.arr} y2=${p-l.aba}></line>`:h}
          ${e.length?x`<path class="manana" d=${ct(e)}></path>`:h}
          <path class="hoy" d=${ct(t)}></path>
          ${t.map((u,E)=>lt(t,s,E,"p-hoy"))}
          ${$!==void 0&&$<e.length?lt(e,i,$,"p-manana"):h}
          ${$!==void 0?x`<line class="cursor" x1=${v($)} x2=${v($)} y1=${l.arr} y2=${p-l.aba}></line>`:h}
        </svg>
        <div class="leyenda">
          ${$!==void 0?f`<span
                  ><b>${(t[$]??e[$])?.hora??$} h</b>${n?.[$]?f` · ${a.periodos[n[$]]}`:h}</span
                >
                ${t[$]?f`<span class="l-hoy">${a.hoy} ${this._num(t[$].precio)}</span>`:h}
                ${e[$]?f`<span class="l-manana">${a.manana} ${this._num(e[$].precio)}</span>`:h}`:f`<span class="l-hoy">${a.hoy}</span>${e.length?f`<span class="l-manana">${a.manana}</span>`:h}${n?f`<span class="l-punta">${a.periodos.P1}</span><span class="l-llano">${a.periodos.P2}</span>`:h}`}
        </div>
      </div>
    `}_mover(t,e,s,i){let o=t.currentTarget.getBoundingClientRect(),n=(t.clientX-o.left)/o.width*e,a=Math.floor((n-s.izq)/(e-s.izq-s.der)*i);this._cursor=a>=0&&a<i?a:void 0}};V(T,"properties",{hass:{attribute:!1},_config:{state:!0},_cursor:{state:!0}}),V(T,"styles",K`
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
      font-weight: 500;
      line-height: 1.1;
      color: var(--primary-text-color);
    }
    .unidad {
      font-size: 0.45em;
      color: var(--secondary-text-color);
    }
    .detalles {
      display: grid;
      grid-template-columns: auto 1fr 1fr;
      gap: 4px 12px;
      font-size: 0.9em;
      color: var(--secondary-text-color);
      white-space: nowrap;
    }
    .detalles .dia {
      color: var(--primary-text-color);
    }
    @container (max-width: 380px) {
      .detalles .et {
        display: none;
      }
    }
    .grafica svg {
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
    .hoy {
      fill: none;
      stroke: var(--primary-color);
      stroke-width: 2;
    }
    .manana {
      fill: none;
      stroke: var(--secondary-text-color);
      stroke-width: 1.5;
      stroke-dasharray: 4 3;
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
    .ahora {
      stroke: var(--primary-color);
      stroke-opacity: 0.35;
      stroke-width: 6;
    }
    .cursor {
      stroke: var(--primary-text-color);
      stroke-opacity: 0.4;
      stroke-width: 1;
    }
    .leyenda {
      display: flex;
      gap: 12px;
      justify-content: center;
      font-size: 0.85em;
      color: var(--secondary-text-color);
      min-height: 1.3em;
    }
    .l-hoy::before,
    .l-manana::before {
      content: "";
      display: inline-block;
      width: 14px;
      height: 0;
      margin-right: 4px;
      vertical-align: middle;
      border-top: 2px solid var(--primary-color);
    }
    .l-manana::before {
      border-top: 2px dashed var(--secondary-text-color);
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
  `);var ee={entity:"Sensor de precio / Price sensor",title:"T\xEDtulo / Title",factura:"Factura / Bill",factura_actual:"Factura en curso / Current bill",factura_anterior:"Factura anterior / Previous bill",current:"Precio actual / Current price",details:"M\xEDnimos y m\xE1ximos / Min and max",graph:"Gr\xE1fica / Chart",next_day:"Ma\xF1ana / Tomorrow",icon_color:"Color del icono / Icon colour",entity_factura_actual:"Sensor de factura en curso / Current bill sensor",entity_factura_anterior:"Sensor de factura anterior / Previous bill sensor"};customElements.get(nt)||(customElements.define(nt,T),window.customCards=window.customCards||[],window.customCards.push({type:nt,name:"PVPC + Bono Social",description:"Precio del PVPC de hoy y ma\xF1ana y la factura con o sin bono social.",preview:!0,documentationURL:"https://github.com/BaRDaHL/pvpc_bonosocial"}),console.info(`%c PVPC + Bono Social %c ${Zt} `,"background:#43a047;color:#fff",""));customElements.get(Ct)||customElements.define(Ct,class extends T{});export{te as posicionActual,Ot as serie};
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
