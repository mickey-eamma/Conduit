import type { DeployPayload } from './deployTypes';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

/**
 * Mirrors the original's `viewerHTMLFromPayload` near-verbatim. This produces a
 * fully self-contained standalone HTML document (its own CSS + vanilla-JS
 * runtime, no dependency on this app at all) — deliberately NOT rebuilt as
 * React per the migration plan, since the whole point is that it runs in a
 * completely separate document with zero framework dependency. The embedded
 * runtime script is plain string content, not TypeScript executed here.
 */
export function viewerHtmlFromPayload(payload: DeployPayload): string {
  const dataJSON = JSON.stringify(payload).replace(/</g, '\\u003c');
  const title = escapeHtml(payload.client) + ' — Asset Map';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{--bg:#f3f1ec;--panel:#ffffff;--line:#e6e2d9;--line-soft:#efece4;--ink:#2c3038;--ink-dim:#6c7480;--ink-faint:#9aa1ac;--shadow-sm:0 2px 8px -3px rgba(40,44,52,.18);--ui:'Figtree',system-ui,-apple-system,sans-serif}
  *{box-sizing:border-box;margin:0;padding:0}
  [hidden]{display:none!important}
  html,body{height:100%}
  body{font-family:var(--ui);background:var(--bg);color:var(--ink);display:flex;flex-direction:column;overflow:hidden;-webkit-font-smoothing:antialiased}
  header{display:flex;align-items:center;gap:14px;height:56px;flex:0 0 56px;padding:0 18px;background:var(--panel);border-bottom:1px solid var(--line);z-index:1200}
  .mark{width:20px;height:20px;border-radius:6px;background:conic-gradient(from 200deg,#7c4ddb,#0891b2,#e08700,#e11d48,#7c4ddb);box-shadow:var(--shadow-sm)}
  .nm{font-weight:700;font-size:17px;letter-spacing:-.3px;white-space:nowrap}
  .badge{font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#7c4ddb;background:#f2ecfc;border:1px solid #e2d5f7;border-radius:7px;padding:4px 9px;white-space:nowrap}
  .client{font-size:14px;font-weight:600;color:var(--ink);padding-left:13px;border-left:1px solid var(--line);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .spacer{flex:1}
  .gen{font-size:12px;color:var(--ink-faint);white-space:nowrap}
  #mapwrap{flex:1;position:relative}
  #map{position:absolute;inset:0}
  #wl{position:absolute;inset:0;z-index:1000;pointer-events:none}
  .w-text{position:absolute;max-width:340px;background:rgba(255,255,255,.94);border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow-sm);padding:9px 13px;font-weight:600;color:var(--ink);line-height:1.35;white-space:pre-wrap}
  .w-legend,.w-layers{position:absolute;background:rgba(255,255,255,.96);border:1px solid var(--line);border-radius:11px;box-shadow:var(--shadow-sm);padding:11px 14px;min-width:175px}
  .w-layers{pointer-events:auto}
  .w-leg-title{font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--ink-faint);margin-bottom:7px}
  .w-leg-row{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:var(--ink);padding:3px 0}
  .w-leg-row .sw{width:18px;height:3.5px;border-radius:2px;flex:0 0 18px}
  .w-leg-row b,.w-lyrrow b{margin-left:auto;padding-left:14px;color:var(--ink-dim);font-weight:600;font-variant-numeric:tabular-nums}
  .w-lyrrow{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:var(--ink);padding:3px 0;cursor:pointer}
  .w-lyrrow input{width:14px;height:14px;accent-color:#1f2430;cursor:pointer}
  .w-lyrrow .dot{width:10px;height:10px;border-radius:3px}
  .w-scale{position:absolute;background:rgba(255,255,255,.94);border:1px solid var(--line);border-radius:9px;box-shadow:var(--shadow-sm);padding:7px 11px 8px}
  .ws-bar{height:5px;background:#2c3038;border-radius:2px;position:relative;min-width:24px}
  .ws-bar::before,.ws-bar::after{content:'';position:absolute;top:-4px;bottom:-4px;width:2px;background:#2c3038}
  .ws-bar::before{left:0}
  .ws-bar::after{right:0}
  .ws-lab{font-size:11px;font-weight:700;color:var(--ink);margin-top:6px;text-align:center;font-variant-numeric:tabular-nums}
  .w-north{position:absolute;background:rgba(255,255,255,.94);border:1px solid var(--line);border-radius:50%;box-shadow:var(--shadow-sm);width:46px;height:46px;display:flex;align-items:center;justify-content:center}
  .w-north svg{width:32px;height:32px}
  .pt-wrap{background:none;border:none}
  .pt{width:18px;height:18px}
  .pt-source{width:13px;height:13px;margin:2px;background:var(--c);transform:rotate(45deg);border:2px solid #fff;box-shadow:0 0 0 1px var(--c),var(--shadow-sm)}
  .pt-join{width:14px;height:14px;margin:2px;border-radius:50%;border:3.5px solid var(--c);background:#fff;box-shadow:var(--shadow-sm)}
  .pt-delivery{width:13px;height:13px;margin:2.5px;border-radius:3px;background:var(--c);border:2px solid #fff;box-shadow:0 0 0 1px var(--c),var(--shadow-sm)}
  .feat-tip{background:#fff!important;color:var(--ink)!important;border:1px solid var(--line)!important;border-radius:7px!important;box-shadow:var(--shadow-sm)!important;font-size:12px!important;font-weight:600!important;padding:4px 9px!important}
  .feat-tip::before{display:none!important}
  .leaflet-popup-content-wrapper{border-radius:11px;box-shadow:0 10px 28px -10px rgba(40,44,52,.4);font-family:var(--ui)}
  .leaflet-popup-content{margin:12px 15px;min-width:190px}
  .pp-code{font-size:11px;font-weight:700;letter-spacing:.4px;color:var(--ink-faint)}
  .pp-name{font-size:14.5px;font-weight:700;margin:2px 0 8px}
  .pr{display:flex;justify-content:space-between;gap:14px;font-size:12.5px;padding:3.5px 0;border-top:1px solid var(--line-soft)}
  .pr span{color:var(--ink-dim)}
  .pr b{color:var(--ink);font-weight:600;text-align:right}
  .empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:900;pointer-events:none}
  .empty .card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px 26px;font-size:14px;color:var(--ink-dim);box-shadow:var(--shadow-sm)}
  .w-tool{position:absolute;background:rgba(255,255,255,.96);border:1px solid var(--line);border-radius:11px;box-shadow:var(--shadow-sm);padding:11px 13px;max-width:230px}
  .w-tool .wt-title{font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--ink-faint);margin-bottom:5px}
  .w-tool .wt-hint{font-size:11.5px;color:var(--ink-dim);line-height:1.4}
  .pp-tools{margin-top:9px;display:flex;flex-wrap:wrap;gap:6px}
  .pp-btn{font-family:var(--ui);font-size:11.5px;font-weight:700;color:#fff;background:#1f2430;border:1px solid #1f2430;border-radius:8px;padding:6px 11px;cursor:pointer}
  .pp-btn:hover{filter:brightness(1.12)}
  .pp-btn.ghost{color:var(--ink);background:#fff;border-color:var(--line)}
  .fiber-modal{position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;background:rgba(28,32,38,.46)}
  .fiber-dialog{background:#fff;width:min(640px,95vw);max-height:88vh;border-radius:16px;box-shadow:0 30px 80px -22px rgba(0,0,0,.55);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--line)}
  .fiber-dlg-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:16px 18px;border-bottom:1px solid var(--line)}
  .fiber-dlg-head .t{font-weight:700;font-size:15.5px}
  .fiber-dlg-head .s{font-size:12px;color:var(--ink-dim);margin-top:3px;line-height:1.4}
  .fiber-dlg-head .x{flex:0 0 auto;width:30px;height:30px;border:1px solid var(--line);background:var(--panel);border-radius:8px;color:var(--ink-dim);font-size:19px;line-height:1;cursor:pointer}
  .fiber-stage-wrap{flex:1;overflow:auto;padding:16px 20px;background:#faf9f6}
  .fiber-stage{position:relative;display:flex;justify-content:space-between;gap:90px;min-height:100%}
  .fiber-col{display:flex;flex-direction:column;gap:4px;position:relative;z-index:2;min-width:140px}
  .fiber-col.right{align-items:stretch}
  .col-h{font-size:10.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--ink-faint);margin-bottom:4px}
  .fiber-col.right .col-h{text-align:right}
  .tube-h{font-size:10px;font-weight:700;color:var(--ink-faint);margin:8px 0 2px}
  .branch-group{margin-bottom:12px}
  .branch-group .bg-h{font-size:11px;font-weight:700;color:var(--ink-dim);margin-bottom:4px;text-align:right}
  .branch-group .bg-sub{font-weight:500;color:var(--ink-faint)}
  .fib{display:flex;align-items:center;gap:7px;padding:3px 7px;border:1px solid var(--line);border-radius:8px;background:#fff;user-select:none}
  .fib.on{border-color:#7c4ddb;box-shadow:0 0 0 2px color-mix(in srgb,#7c4ddb 22%,transparent)}
  .fiber-col.right .fib{justify-content:flex-start}
  .fib-dot{width:14px;height:14px;border-radius:50%;border:1px solid rgba(0,0,0,.22);flex:0 0 14px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)}
  .fib-no{font-size:11px;font-weight:700;width:24px;text-align:center;font-variant-numeric:tabular-nums;color:var(--ink)}
  .fib-nm{font-size:10.5px;color:var(--ink-dim);flex:1}
  .fiber-col.right .fib-nm{text-align:right}
  .fiber-wires{position:absolute;top:0;left:0;z-index:1;overflow:visible;pointer-events:none}
  .fiber-dlg-foot{display:flex;gap:8px;padding:13px 18px;border-top:1px solid var(--line);align-items:center}
  .fiber-dlg-foot .sp{flex:1;font-size:12px;color:var(--ink-dim)}
  .fiber-dlg-foot .sp b{color:var(--ink);font-weight:700}
  .ft-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--line-soft);border-radius:9px;margin-bottom:5px;cursor:pointer;background:#fff}
  .ft-row:hover{border-color:#7c4ddb;background:color-mix(in srgb,#7c4ddb 6%,#fff)}
  .ft-row .ft-no{font-size:12.5px;font-weight:700;width:26px;text-align:center;font-variant-numeric:tabular-nums}
  .ft-row .ft-nm{font-size:12.5px;color:var(--ink-dim);flex:1}
  .ft-row .ft-sig{font-size:10.5px;font-weight:600;color:var(--ink-faint)}
  .ft-row .ft-sig.on{color:#16a34a}
  .ft-row .ft-go{font-size:11.5px;font-weight:700;color:#7c4ddb}
  .trace-panel{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2500;width:min(820px,94vw);background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 22px 60px -20px rgba(0,0,0,.5);overflow:hidden}
  .trace-head{display:flex;align-items:center;gap:12px;padding:11px 16px;border-bottom:1px solid var(--line);font-size:13.5px}
  .trace-head b{font-weight:700}
  .trace-head .trace-meta{font-size:12px;color:var(--ink-dim)}
  .trace-head .x{margin-left:auto;width:28px;height:28px;border:1px solid var(--line);background:var(--panel);border-radius:8px;color:var(--ink-dim);font-size:18px;line-height:1;cursor:pointer}
  .trace-chain{display:flex;align-items:stretch;gap:0;padding:16px;overflow-x:auto}
  .trace-empty{font-size:12.5px;color:var(--ink-faint);padding:6px 2px}
  .trace-card{flex:0 0 auto;min-width:150px;border:1px solid var(--line);border-radius:11px;padding:11px 13px;background:#faf9f6}
  .trace-card.start{border-color:#7c4ddb;box-shadow:0 0 0 2px color-mix(in srgb,#7c4ddb 22%,transparent)}
  .trace-card.flow-start{border-color:var(--c);box-shadow:0 0 0 2px color-mix(in srgb,var(--c) 24%,transparent)}
  .flow-col{display:flex;flex-direction:column;gap:8px;justify-content:center;flex:0 0 auto}
  .flow-link{flex:0 0 auto;align-self:center;display:flex;align-items:center;justify-content:center;padding:0 6px;min-width:34px}
  .flow-link .fl-arrow{color:var(--c,var(--ink-faint));font-size:20px;font-weight:700;line-height:1}
  .trace-card .tc-strand{height:5px;border-radius:3px;margin:-2px -4px 9px;border:1px solid rgba(0,0,0,.12)}
  .trace-card .tc-name{font-weight:700;font-size:13.5px;margin-bottom:6px}
  .trace-card .tc-fiber{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--ink);margin-bottom:4px}
  .trace-card .tc-tube{font-size:10.5px;color:var(--ink-faint);margin-bottom:7px;font-variant-numeric:tabular-nums}
  .trace-card .tc-place{display:inline-block;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:20px}
  .trace-card .tc-place.ae{color:#0b6b58;background:#dff5ef}
  .trace-card .tc-place.ug{color:#7a4a1e;background:#f3e8db}
  .trace-link{flex:0 0 auto;align-self:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:0 8px;min-width:92px;position:relative}
  .trace-link::before{content:"";position:absolute;left:0;right:0;top:50%;height:3px;background:var(--c,#7c4ddb);opacity:.65;transform:translateY(-50%)}
  .trace-link .tl-fibers{position:relative;background:var(--c,#7c4ddb);color:#fff;border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums;box-shadow:0 1px 3px rgba(0,0,0,.18)}
  .trace-link .tl-label{position:relative;background:#fff;border:1px solid var(--line);border-radius:20px;padding:1px 8px;font-size:9.5px;font-weight:700;color:var(--ink-dim);white-space:nowrap}
</style>
</head>
<body>
<header>
  <span class="mark"></span><span class="nm">Conduit</span>
  <span class="badge">Asset map · Read-only</span>
  <span class="client" id="clientName"></span>
  <div class="spacer"></div>
  <span class="gen" id="gen"></span>
</header>
<div id="mapwrap">
  <div id="map"></div>
  <div id="wl"></div>
</div>
<script id="conduit-data" type="application/json">${dataJSON}</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
<script>
var DATA=JSON.parse(document.getElementById('conduit-data').textContent);
function hasWidget(t){ return (DATA.widgets||[]).some(function(w){return w.type===t;}); }
var UTILS={
  telecom:{label:'Telecom',color:'#7c4ddb',terms:{line:'Fiber cable',source:'Central office / headend',join:'Splice point',delivery:'Service drop'}},
  water:{label:'Water',color:'#0891b2',terms:{line:'Water main',source:'Treatment plant / pump',join:'Valve / fitting',delivery:'Service meter'}},
  electric:{label:'Electric',color:'#e08700',terms:{line:'Distribution line',source:'Substation / generation',join:'Transformer / junction',delivery:'Service meter'}},
  oilgas:{label:'Oil & Gas',color:'#e11d48',terms:{line:'Pipeline',source:'Wellhead / refinery',join:'Joint / fitting',delivery:'City gate / delivery'}}
};
var ORDER=['telecom','water','electric','oilgas'];
var STATUS_DASH={Active:null,Construction:'2 6',Planned:'9 7',Abandoned:'7 7'};
var STATUS_OPACITY={Active:.95,Construction:.92,Planned:.85,Abandoned:.5};
var LCONF=DATA.layers||{};
function cfg(id){ return LCONF[id]||{visible:true,color:UTILS[id].color,weight:3.5,opacity:1,popup:{enabled:true,fields:{}}}; }
var BASEMAPS={
  gray:[['https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',{attribution:'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',maxNativeZoom:16,maxZoom:19}],
        ['https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',{maxNativeZoom:16,maxZoom:19}]],
  streets:[['https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{attribution:'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',maxZoom:19}]],
  imagery:[['https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',maxZoom:19}]]
};
document.getElementById('clientName').textContent=DATA.client;
document.getElementById('gen').textContent='Deployed '+DATA.generated;
document.title=DATA.client+' — Asset Map';
var map=L.map('map',{zoomControl:true}).setView([32.74,-97.05],12);
(BASEMAPS[DATA.basemap]||BASEMAPS.gray).forEach(function(t){L.tileLayer(t[0],t[1]).addTo(map);});
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function fmtLen(m){return m>=1000?(m/1000).toFixed(2)+' km':Math.round(m)+' m';}
function lineLen(arr){var t=0;for(var i=1;i<arr.length;i++)t+=map.distance(arr[i-1],arr[i]);return t;}
function popupHTML(id,f,len){
  var c=cfg(id), enabled=!(c.popup&&c.popup.enabled===false), Fd=(c.popup&&c.popup.fields)||{}, u=UTILS[id];
  var tools='';
  if(id==='telecom'&&hasWidget('fibertools')){
    if(f.type==='join') tools+='<button class="pp-btn" data-tool="matrix" data-util="telecom" data-code="'+esc(f.code)+'">Splice matrix</button>';
    else if(f.type==='line') tools+='<button class="pp-btn" data-tool="fiber" data-util="telecom" data-code="'+esc(f.code)+'">Trace fibers</button>';
  }
  if((id==='water'||id==='oilgas')&&hasWidget('pipeflow')&&f.type==='line'){
    tools+='<button class="pp-btn" data-tool="down" data-util="'+id+'" data-code="'+esc(f.code)+'">Downstream</button>';
    tools+='<button class="pp-btn ghost" data-tool="up" data-util="'+id+'" data-code="'+esc(f.code)+'">Upstream</button>';
  }
  if(!enabled) return tools?('<div class="pp-name">'+esc(f.props.name||u.terms[f.type])+'</div><div class="pp-tools">'+tools+'</div>'):null;
  var h='';
  if(Fd.code!==false) h+='<div class="pp-code">'+esc(f.code)+'</div>';
  h+='<div class="pp-name">'+esc(f.props.name||u.terms[f.type])+'</div>';
  var rows=[];
  if(Fd.type!==false){ rows.push(['Type',u.terms[f.type]]); rows.push(['Network',u.label]); }
  if(Fd.status!==false) rows.push(['Status',f.props.status||'Active']);
  if(f.type==='line'&&Fd.length!==false) rows.push(['Length',fmtLen(len)]);
  if(id==='telecom'&&f.type==='line'&&Fd.fiber!==false){ rows.push(['Fibers',f.props.fiberCount||null]); rows.push(['Placement',f.props.placement||'Aerial']); }
  if(f.type==='join'&&Fd.links!==false){
    if(id==='telecom'){
      rows.push(['Parent line',f.props.parentLine||null]);
      var br=(f.props.branches||[]).filter(function(b){return b.line;}); if(br.length)rows.push(['Branches',br.length]);
      var sp=(f.props.splices||[]); if(sp.length)rows.push(['Fiber splices',sp.length]);
    } else if(id==='water'||id==='oilgas'){
      rows.push(['Upstream',f.props.fromLine||null]);
      var dn=(f.props.toLines||(f.props.toLine?[f.props.toLine]:[])).filter(function(x){return x;});
      if(dn.length) rows.push(['Downstream',dn.length]);
    } else { rows.push(['From line',f.props.fromLine||null]); rows.push(['To line',f.props.toLine||null]); }
  }
  for(var i=0;i<rows.length;i++){var r=rows[i];if(r[1]==null||r[1]==='')continue;h+='<div class="pr"><span>'+esc(r[0])+'</span><b>'+esc(String(r[1]))+'</b></div>';}
  if(tools) h+='<div class="pp-tools">'+tools+'</div>';
  return h;
}
var groups={},nCounts={},all=[];
ORDER.forEach(function(id){
  var c=cfg(id),g=L.layerGroup();groups[id]=g;nCounts[id]=0;
  if(c.visible!==false)g.addTo(map);
  var feats=(DATA.networks[id]||{}).features||[];
  feats.forEach(function(f){
    nCounts[id]++;var s=f.props.status||'Active';
    if(f.type==='line'){
      var pts=f.latlngs.map(function(p){return L.latLng(p[0],p[1]);});
      pts.forEach(function(ll){all.push(ll);});
      var dash=(id==='telecom')?(f.props.placement==='Underground'?'11 7':(s==='Construction'?'2 6':null)):(STATUS_DASH[s]||null);
      L.polyline(pts,{color:'#ffffff',weight:c.weight+3.5,opacity:.9*c.opacity,interactive:false}).addTo(g);
      var main=L.polyline(pts,{color:c.color,weight:c.weight,opacity:(STATUS_OPACITY[s]!=null?STATUS_OPACITY[s]:.95)*c.opacity,dashArray:dash}).addTo(g);
      main.bindTooltip(f.props.name||f.code,{className:'feat-tip',direction:'top',opacity:1});
      var pop=popupHTML(id,f,lineLen(pts)); if(pop)main.bindPopup(pop);
    }else{
      var ll=L.latLng(f.latlng[0],f.latlng[1]);all.push(ll);
      var cls=f.type==='source'?'pt-source':f.type==='join'?'pt-join':'pt-delivery';
      var op=(s==='Abandoned'?.5:1)*c.opacity;
      var xtr=((s==='Planned'||s==='Construction')?'border-style:dashed;':'')+'opacity:'+op+';';
      var icon=L.divIcon({className:'pt-wrap',html:'<div class="pt '+cls+'" style="--c:'+c.color+';'+xtr+'"></div>',iconSize:[18,18],iconAnchor:[9,9]});
      var m=L.marker(ll,{icon:icon}).addTo(g);
      m.bindTooltip(f.props.name||f.code,{className:'feat-tip',direction:'top',offset:[0,-6],opacity:1});
      var pop=popupHTML(id,f,0); if(pop)m.bindPopup(pop);
    }
  });
});
/* risers: telecom aerial meets underground */
(function(){
  function co(a,b){return Math.abs(a[0]-b[0])<1e-7&&Math.abs(a[1]-b[1])<1e-7;}
  var lines=((DATA.networks.telecom||{}).features||[]).filter(function(f){return f.type==='line';});
  var aerial=lines.filter(function(l){return (l.props.placement||'Aerial')==='Aerial';});
  var under=lines.filter(function(l){return l.props.placement==='Underground';});
  var spots=[];
  aerial.forEach(function(a){under.forEach(function(u){a.latlngs.forEach(function(pa){u.latlngs.forEach(function(pu){
    if(co(pa,pu)&&!spots.some(function(s){return co(s,pa);}))spots.push(pa);
  });});});});
  spots.forEach(function(p){
    var icon=L.divIcon({className:'pt-wrap',iconSize:[22,22],iconAnchor:[11,11],html:'<svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="8.5" fill="#fff" stroke="#3a3f47" stroke-width="1.6"/><path d="M11 15.5V7M7.6 10.4 11 7l3.4 3.4" fill="none" stroke="#3a3f47" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'});
    var m=L.marker(L.latLng(p[0],p[1]),{icon:icon});
    m.bindTooltip('Riser · aerial ⇄ underground',{className:'feat-tip',direction:'top',offset:[0,-9]});
    m.addTo(groups.telecom);
  });
})();
/* ArcGIS REST layers */
function agsPopupV(p){
  var keys=Object.keys(p||{}).slice(0,12),h='<div class="pp-name">Feature</div>';
  for(var i=0;i<keys.length;i++){var k=keys[i],v=p[k];if(v==null||v==='')continue;h+='<div class="pr"><span>'+esc(k)+'</span><b>'+esc(String(v))+'</b></div>';}
  return h;
}
var agsGroups={};
(DATA.arcgis||[]).forEach(function(a,i){
  var layer;
  if(a.kind==='tiles'){ layer=L.tileLayer(a.tileUrl,a.tileOpts||{}); }
  else{
    layer=L.geoJSON(a.geojson,{
      style:{color:a.color,weight:2.5,opacity:.9,fillColor:a.color,fillOpacity:.15},
      pointToLayer:function(f,ll){return L.circleMarker(ll,{radius:5,color:'#fff',weight:1.5,fillColor:a.color,fillOpacity:.95});},
      onEachFeature:function(f,l){ l.bindPopup(agsPopupV(f.properties)); }
    });
    try{ layer.eachLayer(function(l){ if(l.getLatLng) all.push(l.getLatLng()); else if(l.getBounds){var b=l.getBounds();if(b.isValid()){all.push(b.getNorthEast());all.push(b.getSouthWest());}} }); }catch(e){}
  }
  a._key='ags'+i;
  if(a.visible!==false) layer.addTo(map);
  agsGroups[a._key]={rec:a,layer:layer};
});
/* ---- interactive tool widgets: fiber splice matrix, signal trace, pipe flow ---- */
var FIBER_COLORS=['#1f6feb','#ff8a1e','#1fa83a','#7a4a1e','#8a93a0','#f4f4f4','#e0212c','#222222','#f4c20d','#7e2fd0','#ff77b0','#37c7c0'];
var FIBER_NAMES=['Blue','Orange','Green','Brown','Slate','White','Red','Black','Yellow','Violet','Rose','Aqua'];
function fiberColor(n){return FIBER_COLORS[(n-1)%12];}
function fiberName(n){return FIBER_NAMES[(n-1)%12];}
function featsV(util){ return (DATA.networks[util]||{}).features||[]; }
function lineByCodeV(util,code){ var fs=featsV(util); for(var i=0;i<fs.length;i++){ if(fs[i].type==='line'&&fs[i].code===code) return fs[i]; } return null; }
function jointsV(util){ return featsV(util).filter(function(f){return f.type==='join';}); }
function lineLenV(arr){ var t=0; for(var i=1;i<arr.length;i++)t+=map.distance(L.latLng(arr[i-1][0],arr[i-1][1]),L.latLng(arr[i][0],arr[i][1])); return t; }
function branchAssignV(code){
  var js=jointsV('telecom');
  for(var i=0;i<js.length;i++){ var brs=js[i].props.branches||[];
    for(var k=0;k<brs.length;k++){ var b=brs[k]; if(b.line===code){ var f=parseInt(b.from),t=parseInt(b.to); if(!isNaN(f)&&!isNaN(t)&&t>=f) return {from:f,to:t,count:t-f+1}; } } }
  return null;
}
function effFiberCount(ln){ var a=branchAssignV(ln.code); return a?a.count:(ln.props.fiberCount||0); }
function parentFiberCountV(j){ var ln=lineByCodeV('telecom',j.props.parentLine); return ln?effFiberCount(ln):0; }
function validBranchesV(j){
  return (j.props.branches||[]).filter(function(b){ if(!b.line||!lineByCodeV('telecom',b.line))return false; var f=parseInt(b.from),t=parseInt(b.to); return !isNaN(f)&&!isNaN(t)&&t>=f; })
    .map(function(b){return {line:b.line,from:parseInt(b.from),to:parseInt(b.to),count:parseInt(b.to)-parseInt(b.from)+1};});
}
var vModal=null, vTrace=null, toolHalos=[];
function closeVModal(){ if(vModal){vModal.remove();vModal=null;} }
function clearToolHalos(){ for(var i=0;i<toolHalos.length;i++)map.removeLayer(toolHalos[i]); toolHalos=[]; }
function closeTraceV(keep){ if(vTrace){vTrace.remove();vTrace=null;} if(!keep)clearToolHalos(); }
document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ closeVModal(); closeTraceV(); closeFlowV(); } });
function fibNodeV(side,line,fiber){
  var c=fiberColor(fiber);
  var inner=side==='in'
    ? '<span class="fib-nm">'+fiberName(fiber)+'</span><span class="fib-no">'+fiber+'</span><span class="fib-dot" style="background:'+c+'"></span>'
    : '<span class="fib-dot" style="background:'+c+'"></span><span class="fib-no">'+fiber+'</span><span class="fib-nm">'+fiberName(fiber)+'</span>';
  return '<div class="fib" data-side="'+side+'"'+(line?' data-line="'+line+'"':'')+' data-fiber="'+fiber+'">'+inner+'</div>';
}
function drawWiresV(j){
  if(!vModal)return; var stage=vModal.querySelector('.fiber-stage'), svg=vModal.querySelector('.fiber-wires'); if(!stage||!svg)return;
  svg.style.width=stage.scrollWidth+'px'; svg.style.height=stage.scrollHeight+'px';
  function rel(el){ var r=el.getBoundingClientRect(),s=stage.getBoundingClientRect(); return {left:r.left-s.left,right:r.right-s.left,top:r.top-s.top,h:r.height}; }
  function pth(x1,y1,x2,y2){ var mx=(x1+x2)/2; return 'M'+x1+','+y1+' C'+mx+','+y1+' '+mx+','+y2+' '+x2+','+y2; }
  var html='';
  (j.props.splices||[]).forEach(function(c){
    var ln=stage.querySelector('.fib[data-side="in"][data-fiber="'+c.inFiber+'"]');
    var rn=stage.querySelector('.fib[data-side="out"][data-line="'+c.outLine+'"][data-fiber="'+c.outFiber+'"]');
    if(!ln||!rn)return; var a=rel(ln),b=rel(rn);
    html+='<path d="'+pth(a.right,a.top+a.h/2,b.left,b.top+b.h/2)+'" fill="none" stroke="'+fiberColor(c.inFiber)+'" stroke-width="2.6"/>';
  });
  svg.innerHTML=html;
  var ns=stage.querySelectorAll('.fib'); for(var i=0;i<ns.length;i++)ns[i].classList.remove('on');
  (j.props.splices||[]).forEach(function(c){
    var ln=stage.querySelector('.fib[data-side="in"][data-fiber="'+c.inFiber+'"]'); if(ln)ln.classList.add('on');
    var rn=stage.querySelector('.fib[data-side="out"][data-line="'+c.outLine+'"][data-fiber="'+c.outFiber+'"]'); if(rn)rn.classList.add('on');
  });
}
function openMatrixV(code){
  closeVModal();
  var js=jointsV('telecom'), j=null; for(var i=0;i<js.length;i++){ if(js[i].code===code){j=js[i];break;} } if(!j)return;
  var X=parentFiberCountV(j), br=validBranchesV(j), inCable=lineByCodeV('telecom',j.props.parentLine);
  var m=document.createElement('div'); m.className='fiber-modal'; vModal=m;
  m.addEventListener('pointerdown',function(e){if(e.target===m)closeVModal();});
  if(!inCable||!br.length){
    m.innerHTML='<div class="fiber-dialog"><div class="fiber-dlg-head"><div><div class="t">Fiber splice matrix</div></div><button class="x" id="fmX">&times;</button></div><div class="fiber-stage-wrap"><p style="padding:20px;color:#9aa1ac;font-size:12.5px">This splice has no incoming cable or branches assigned.</p></div></div>';
    document.body.appendChild(m); m.querySelector('#fmX').onclick=closeVModal; return;
  }
  var left=''; for(var n=1;n<=X;n++){ if((n-1)%12===0) left+='<div class="tube-h">Tube '+(Math.floor((n-1)/12)+1)+' · '+fiberName(n)+'</div>'; left+=fibNodeV('in',null,n); }
  var right=''; br.forEach(function(b){ var ln=lineByCodeV('telecom',b.line); var nm=ln?(ln.props.name||ln.code):b.line;
    right+='<div class="branch-group"><div class="bg-h">'+esc(nm)+' · '+b.count+'f <span class="bg-sub">(feeder '+b.from+'–'+b.to+')</span></div>';
    for(var mm=1;mm<=b.count;mm++) right+=fibNodeV('out',b.line,mm); right+='</div>'; });
  m.innerHTML='<div class="fiber-dialog"><div class="fiber-dlg-head"><div><div class="t">Fiber splice matrix · '+esc(j.props.name||j.code)+'</div><div class="s">Incoming: '+esc(inCable.props.name||inCable.code)+' ('+X+'f) — read-only view</div></div><button class="x" id="fmX">&times;</button></div>'
    +'<div class="fiber-stage-wrap"><div class="fiber-stage"><div class="fiber-col left"><div class="col-h">Incoming</div>'+left+'</div><svg class="fiber-wires"></svg><div class="fiber-col right"><div class="col-h">Outgoing</div>'+right+'</div></div></div>'
    +'<div class="fiber-dlg-foot"><span class="sp"><b>'+(j.props.splices||[]).length+' spliced</b> of '+X+'</span></div></div>';
  document.body.appendChild(m);
  m.querySelector('#fmX').onclick=closeVModal;
  m.querySelector('.fiber-stage-wrap').addEventListener('scroll',function(){drawWiresV(j);});
  requestAnimationFrame(function(){drawWiresV(j);});
}
function fiberAdjV(){
  var adj={}; function key(c,f){return c+'|'+f;} function add(k,v){ if(!adj[k])adj[k]=[]; adj[k].push(v); }
  jointsV('telecom').forEach(function(j){ (j.props.splices||[]).forEach(function(c){
    var A={cable:j.props.parentLine,fiber:c.inFiber}, B={cable:c.outLine,fiber:c.outFiber}; if(!A.cable||!B.cable)return;
    add(key(A.cable,A.fiber),{node:B,splice:j}); add(key(B.cable,B.fiber),{node:A,splice:j});
  }); });
  return {adj:adj,key:key};
}
function fiberHasSignalV(cable,fiber){ var a=fiberAdjV(); return (a.adj[a.key(cable,fiber)]||[]).length>0; }
function fiberTraceV(startCable,startFiber){
  var a=fiberAdjV(), adj=a.adj, key=a.key, start={cable:startCable,fiber:startFiber};
  var comp={}; comp[key(start.cable,start.fiber)]=1; var q=[start];
  while(q.length){ var n=q.shift(); (adj[key(n.cable,n.fiber)]||[]).forEach(function(e){ var kk=key(e.node.cable,e.node.fiber); if(!comp[kk]){comp[kk]=1;q.push(e.node);} }); }
  var head=start; for(var kk in comp){ if((adj[kk]||[]).length<=1){ var p=kk.split('|'); head={cable:p[0],fiber:+p[1]}; break; } }
  var seq=[], seen={}, cur=head, prevKey=null;
  while(cur){ var ck=key(cur.cable,cur.fiber); if(seen[ck])break; seen[ck]=1;
    var nbrs=(adj[ck]||[]).filter(function(e){ return key(e.node.cable,e.node.fiber)!==prevKey && !seen[key(e.node.cable,e.node.fiber)]; });
    var next=nbrs[0]; seq.push({cable:cur.cable,fiber:cur.fiber,splice:next?next.splice:null}); prevKey=ck; cur=next?next.node:null; }
  return seq;
}
function openFiberTableV(code){
  closeVModal(); var ln=lineByCodeV('telecom',code); if(!ln)return;
  var count=effFiberCount(ln), nm=ln.props.name||ln.code, rows='';
  for(var n=1;n<=count;n++){ var sig=fiberHasSignalV(code,n);
    rows+='<div class="ft-row" data-fiber="'+n+'"><span class="fib-dot" style="background:'+fiberColor(n)+'"></span><span class="ft-no">'+n+'</span><span class="ft-nm">'+fiberName(n)+'</span><span class="ft-sig'+(sig?' on':'')+'">'+(sig?'spliced':'—')+'</span><span class="ft-go">Trace ›</span></div>'; }
  var m=document.createElement('div'); m.className='fiber-modal'; vModal=m;
  m.addEventListener('pointerdown',function(e){if(e.target===m)closeVModal();});
  m.innerHTML='<div class="fiber-dialog" style="width:min(460px,94vw)"><div class="fiber-dlg-head"><div><div class="t">Fibers · '+esc(nm)+'</div><div class="s">'+count+' strands — click a fiber to trace its signal path</div></div><button class="x" id="ftX">&times;</button></div><div class="fiber-stage-wrap" style="padding:10px 14px">'+(rows||'<p style="padding:16px;color:#9aa1ac">This cable has no fibers.</p>')+'</div></div>';
  document.body.appendChild(m); m.querySelector('#ftX').onclick=closeVModal;
  var rws=m.querySelectorAll('.ft-row'); for(var i=0;i<rws.length;i++){ (function(r){ r.onclick=function(){ var f=+r.getAttribute('data-fiber'); closeVModal(); runTraceV(code,f); }; })(rws[i]); }
}
function runTraceV(cable,fiber){
  var seq=fiberTraceV(cable,fiber); clearToolHalos(); var all=[], seen={};
  seq.forEach(function(s){ if(seen[s.cable])return; seen[s.cable]=1; var ln=lineByCodeV('telecom',s.cable); if(ln){ var pts=ln.latlngs.map(function(p){return L.latLng(p[0],p[1]);}); toolHalos.push(L.polyline(pts,{color:UTILS.telecom.color,weight:11,opacity:.32,interactive:false}).addTo(map)); pts.forEach(function(ll){all.push(ll);}); } });
  if(all.length) map.fitBounds(L.latLngBounds(all).pad(0.35));
  openTraceGraphV(seq,cable,fiber);
}
function openTraceGraphV(seq,startCable,startFiber){
  closeTraceV(true); closeFlowV(); var tm=document.createElement('div'); tm.className='trace-panel'; vTrace=tm;
  var sln=lineByCodeV('telecom',startCable), startNm=sln?(sln.props.name||startCable):startCable, chain='';
  seq.forEach(function(s,i){ var ln=lineByCodeV('telecom',s.cable), nm=ln?(ln.props.name||ln.code):s.cable;
    var place=ln&&ln.props.placement==='Underground'?'Underground':'Aerial', isStart=s.cable===startCable&&s.fiber===startFiber;
    var tube=Math.ceil(s.fiber/12), pos=((s.fiber-1)%12)+1, c=fiberColor(s.fiber);
    chain+='<div class="trace-card'+(isStart?' start':'')+'"><div class="tc-strand" style="background:'+c+'"></div><div class="tc-name">'+esc(nm)+'</div><div class="tc-fiber"><span class="fib-dot" style="background:'+c+'"></span>Fiber '+s.fiber+' · '+fiberName(s.fiber)+'</div><div class="tc-tube">Tube '+tube+' · position '+pos+'</div><div class="tc-place '+(place==='Underground'?'ug':'ae')+'">'+place+'</div></div>';
    if(s.splice){ var sn=s.splice.props.name||s.splice.code, toF=seq[i+1]?seq[i+1].fiber:s.fiber;
      chain+='<div class="trace-link" style="--c:'+c+'"><span class="tl-fibers">F'+s.fiber+' → F'+toF+'</span><span class="tl-label">'+esc(sn)+'</span></div>'; } });
  var hops=0; for(var hi=0;hi<seq.length;hi++)if(seq[hi].splice)hops++;
  var uq={}; seq.forEach(function(s){uq[s.cable]=1;}); var uniq=Object.keys(uq), totalM=0;
  uniq.forEach(function(c){var ln=lineByCodeV('telecom',c); if(ln)totalM+=lineLenV(ln.latlngs);});
  tm.innerHTML='<div class="trace-head"><div><b>Signal trace</b> · '+esc(startNm)+' fiber '+startFiber+'</div><div class="trace-meta">'+uniq.length+' cable'+(uniq.length!==1?'s':'')+' · '+hops+' splice'+(hops!==1?'s':'')+' · '+fmtLen(totalM)+' run</div><button class="x" id="trX">&times;</button></div><div class="trace-chain">'+(seq.length?chain:'<span class="trace-empty">This fiber isn’t spliced to anything yet.</span>')+'</div>';
  document.body.appendChild(tm); tm.querySelector('#trX').onclick=function(){closeTraceV();};
}
function flowAdjV(util,rev){
  var adj={}; jointsV(util).forEach(function(j){ if(!j.props.fromLine)return; var dn=j.props.toLines||(j.props.toLine?[j.props.toLine]:[]);
    dn.forEach(function(to){ if(!to)return; var a=rev?to:j.props.fromLine, b=rev?j.props.fromLine:to; if(!adj[a])adj[a]=[]; adj[a].push(b); }); });
  return adj;
}
function flowLevelsV(util,code,dir){
  var adj=flowAdjV(util,dir==='up'), levels=[[code]], seen={}; seen[code]=1; var frontier=[code];
  while(frontier.length){ var next=[]; frontier.forEach(function(cur){ (adj[cur]||[]).forEach(function(n){ if(!seen[n]){seen[n]=1;next.push(n);} }); }); if(next.length)levels.push(next); frontier=next; }
  return levels;
}
var vFlow=null;
function closeFlowV(){ if(vFlow){vFlow.remove();vFlow=null;} }
function traceFlowV(code,dir,util){
  clearToolHalos(); closeTraceV(true); closeFlowV();
  if(!util){ if(lineByCodeV('water',code))util='water'; else if(lineByCodeV('oilgas',code))util='oilgas'; }
  if(!util)return;
  var levels=flowLevelsV(util,code,dir), codes=[]; levels.forEach(function(l){codes=codes.concat(l);});
  var color=UTILS[util].color, all=[], count=0, totalM=0;
  codes.forEach(function(cc){ var ln=lineByCodeV(util,cc); if(!ln)return; var start=cc===code, pts=ln.latlngs.map(function(p){return L.latLng(p[0],p[1]);});
    toolHalos.push(L.polyline(pts,{color:start?'#1f2430':color,weight:start?7:11,opacity:start?.55:.34,interactive:false}).addTo(map)); pts.forEach(function(ll){all.push(ll);}); if(!start){count++;totalM+=lineLenV(ln.latlngs);} });
  if(all.length)map.fitBounds(L.latLngBounds(all).pad(0.3));
  openFlowGraphV(code,dir,util,levels,count,totalM);
}
function openFlowGraphV(startCode,dir,util,levels,count,totalM){
  closeFlowV(); closeTraceV(true);
  var color=UTILS[util].color, term=UTILS[util].terms.line, dirWord=dir==='up'?'upstream':'downstream';
  var startLn=lineByCodeV(util,startCode), startNm=startLn?(startLn.props.name||startCode):startCode;
  var cols=dir==='up'?levels.slice().reverse():levels, chain='';
  cols.forEach(function(col,ci){
    var cards='';
    col.forEach(function(cc){ var ln=lineByCodeV(util,cc); if(!ln)return; var isStart=cc===startCode, st=ln.props.status||'Active';
      cards+='<div class="trace-card'+(isStart?' flow-start':'')+'" style="--c:'+color+'"><div class="tc-strand" style="background:'+color+'"></div><div class="tc-name">'+esc(ln.props.name||ln.code)+'</div><div class="tc-fiber">'+esc(term)+' · '+fmtLen(lineLenV(ln.latlngs))+'</div><div class="tc-tube">'+st+'</div></div>'; });
    chain+='<div class="flow-col">'+cards+'</div>';
    if(ci<cols.length-1) chain+='<div class="flow-link" style="--c:'+color+'"><span class="fl-arrow">→</span></div>';
  });
  var tm=document.createElement('div'); tm.className='trace-panel'; vFlow=tm;
  tm.innerHTML='<div class="trace-head"><div><b>'+(dir==='up'?'Upstream':'Downstream')+' flow</b> · '+esc(startNm)+'</div><div class="trace-meta">'+count+' '+dirWord+' '+term.toLowerCase()+(count!==1?'s':'')+' · '+fmtLen(totalM)+' run</div><button class="x" id="flX">&times;</button></div><div class="trace-chain">'+(count?chain:'<span class="trace-empty">No '+dirWord+' '+term.toLowerCase()+'s from here.</span>')+'</div>';
  document.body.appendChild(tm); tm.querySelector('#flX').onclick=closeFlowV;
}
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest?e.target.closest('.pp-btn'):null; if(!b)return;
  var tool=b.getAttribute('data-tool'), code=b.getAttribute('data-code'), util=b.getAttribute('data-util');
  map.closePopup();
  if(tool==='matrix')openMatrixV(code);
  else if(tool==='fiber')openFiberTableV(code);
  else if(tool==='down')traceFlowV(code,'down',util);
  else if(tool==='up')traceFlowV(code,'up',util);
});
/* composed widgets */
var wl=document.getElementById('wl');
function legendRowsHTML(){
  var h='';
  ORDER.forEach(function(id){ if(!nCounts[id]||cfg(id).visible===false)return;
    h+='<div class="w-leg-row"><span class="sw" style="background:'+cfg(id).color+'"></span>'+UTILS[id].label+'<b>'+nCounts[id]+'</b></div>'; });
  (DATA.arcgis||[]).forEach(function(a){ if(a.kind!=='features'||a.visible===false)return;
    h+='<div class="w-leg-row"><span class="sw" style="background:'+(a.color||'#64748b')+'"></span>'+esc(a.title)+'<b>'+((a.geojson.features||[]).length)+'</b></div>'; });
  return '<div class="w-leg-title">Legend</div>'+(h||'<div class="w-leg-row">No visible layers</div>');
}
function layerListRowsHTML(){
  var h='';
  ORDER.forEach(function(id){ if(!nCounts[id])return;
    h+='<label class="w-lyrrow"><input type="checkbox" data-ll="'+id+'"'+(cfg(id).visible!==false?' checked':'')+'><span class="dot" style="background:'+cfg(id).color+'"></span>'+UTILS[id].label+'<b>'+nCounts[id]+'</b></label>'; });
  (DATA.arcgis||[]).forEach(function(a){ var cnt=a.kind==='features'?((a.geojson.features||[]).length):'';
    h+='<label class="w-lyrrow"><input type="checkbox" data-ags="'+a._key+'"'+(a.visible!==false?' checked':'')+'><span class="dot" style="background:'+(a.color||'#64748b')+'"></span>'+esc(a.title)+(cnt!==''?'<b>'+cnt+'</b>':'')+'</label>'; });
  return '<div class="w-leg-title">Layers</div>'+(h||'<div class="w-leg-row">No assets</div>');
}
var NORTH='<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="none" stroke="#2c3038" stroke-width="1.6"/><path d="M16 6.5 20 22l-4-3-4 3Z" fill="#2c3038"/><path d="M16 6.5 12 22l4-3v-12.5Z" fill="#e11d48"/><text x="16" y="30.5" text-anchor="middle" font-family="Figtree,sans-serif" font-size="7" font-weight="700" fill="#2c3038">N</text></svg>';
function niceScale(m,maxPx){
  var y=Math.round(m.getSize().y/2);
  var d=m.distance(m.containerPointToLatLng([0,y]),m.containerPointToLatLng([maxPx,y]));
  if(!(d>0)) return {px:maxPx,label:''};
  var pow=Math.pow(10,Math.floor(Math.log(d)/Math.LN10));
  var best=pow,c=[1,1.5,2,3,5,10];
  for(var i=0;i<c.length;i++){ if(c[i]*pow<=d) best=c[i]*pow; }
  var label=best>=1000?(Math.round(best/100)/10)+' km':Math.round(best)+' m';
  return {px:Math.round(maxPx*best/d),label:label};
}
var scaleEls=[];
(DATA.widgets||[]).forEach(function(w){
  var d=document.createElement('div');
  d.style.left=(w.x*100)+'%'; d.style.top=(w.y*100)+'%';
  if(w.type==='text'){ d.className='w-text'; d.style.fontSize=(w.fontSize||16)+'px'; d.textContent=w.text||''; }
  else if(w.type==='legend'){ d.className='w-legend'; d.innerHTML=legendRowsHTML(); }
  else if(w.type==='layerlist'){
    d.className='w-layers'; d.innerHTML=layerListRowsHTML();
    d.addEventListener('change',function(ev){
      var id=ev.target.getAttribute('data-ll');
      if(id){ if(ev.target.checked) groups[id].addTo(map); else map.removeLayer(groups[id]); return; }
      var ak=ev.target.getAttribute('data-ags');
      if(ak&&agsGroups[ak]){ if(ev.target.checked) agsGroups[ak].layer.addTo(map); else map.removeLayer(agsGroups[ak].layer); }
    });
  }
  else if(w.type==='scalebar'){ d.className='w-scale'; d.innerHTML='<div class="ws-bar"></div><div class="ws-lab"></div>'; scaleEls.push(d); }
  else if(w.type==='northarrow'){ d.className='w-north'; d.innerHTML=NORTH; }
  else if(w.type==='fibertools'){ d.className='w-tool'; d.innerHTML='<div class="wt-title">Fiber tools</div><div class="wt-hint">Click a splice point for its splice matrix, or a fiber cable to trace a strand.</div>'; }
  else if(w.type==='pipeflow'){ d.className='w-tool'; d.innerHTML='<div class="wt-title">Pipe flow</div><div class="wt-hint">Click a pipe, then trace it upstream or downstream.</div>'; }
  wl.appendChild(d);
});
function updateScales(){
  if(!scaleEls.length)return;
  var s=niceScale(map,120);
  scaleEls.forEach(function(el){ el.querySelector('.ws-bar').style.width=s.px+'px'; el.querySelector('.ws-lab').textContent=s.label; });
}
map.on('zoomend moveend',updateScales);
/* framing */
if(DATA.view&&DATA.view.center){ map.setView(DATA.view.center,DATA.view.zoom); }
else if(all.length){ map.fitBounds(L.latLngBounds(all).pad(0.25)); }
updateScales();
if(!all.length){var e=document.createElement('div');e.className='empty';e.innerHTML='<div class="card">No assets in this project yet.</div>';document.getElementById('mapwrap').appendChild(e);}
</script>
</body>
</html>`;
}
