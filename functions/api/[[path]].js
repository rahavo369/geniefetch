const COOKIE="gf_admin";
const enc=new TextEncoder();
function b64(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
function unb64(s){s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function sign(value,secret){const key=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"]);return b64(await crypto.subtle.sign("HMAC",key,enc.encode(value)))}
async function valid(req,env){const c=req.headers.get("Cookie")||"",m=c.match(new RegExp(COOKIE+"=([^;]+)"));if(!m||!env.ADMIN_PASSWORD||!env.SESSION_SECRET)return false;const [payload,sig]=m[1].split(".");if(!payload||!sig)return false;try{const raw=new TextDecoder().decode(unb64(payload));const data=JSON.parse(raw);if(data.exp<Date.now())return false;const expected=await sign(payload,env.SESSION_SECRET);return expected===sig}catch{return false}}
function cookie(value,maxAge){return `${COOKIE}=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`}
async function body(req){return await req.json()}
const allowed={
 products:["name","type","category","season","video_number","video_title","image_url","price_text","purchase_url","serial_no","description"],
 videos:["video_number","title","season","publish_date","status","video_url","description"],
 seasons:["name","slug","start_date","end_date","status","image_url","description"],
 upcoming:["title","type","season","expected_date","image_url","status","description"]
};
const tableName={products:"products",videos:"videos",seasons:"seasons",upcoming:"upcoming"};
function clean(obj,keys){const out={};for(const k of keys)if(Object.prototype.hasOwnProperty.call(obj,k))out[k]=obj[k]===""?null:obj[k];return out}
function safeText(v,max=5000){return typeof v==="string"?v.slice(0,max):v}
export async function onRequest({request,env}) {
 const url=new URL(request.url), path=url.pathname.replace(/^\/api\/?/,"").split("/").filter(Boolean), method=request.method;
 if(path[0]==="auth"&&path[1]==="login"&&method==="POST"){
   const data=await body(request);if(!env.ADMIN_PASSWORD||!env.SESSION_SECRET)return Response.json({error:"Admin secrets are not configured."},{status:500});
   if(typeof data.password!=="string"||data.password.length>300||data.password!==env.ADMIN_PASSWORD)return Response.json({error:"Incorrect password."},{status:401});
   const payload=b64(enc.encode(JSON.stringify({exp:Date.now()+8*60*60*1000}))),sig=await sign(payload,env.SESSION_SECRET);
   return new Response(JSON.stringify({ok:true}),{headers:{"Content-Type":"application/json","Set-Cookie":cookie(payload+"."+sig,8*60*60)}});
 }
 if(path[0]==="auth"&&path[1]==="logout"&&method==="POST")return new Response(JSON.stringify({ok:true}),{headers:{"Content-Type":"application/json","Set-Cookie":cookie("deleted",0)}});
 if(path[0]==="me"&&method==="GET")return valid(request,env)?Response.json({ok:true}):Response.json({error:"Not signed in."},{status:401});
 if(path[0]!=="admin")return Response.json({error:"Not found."},{status:404});
 if(!await valid(request,env))return Response.json({error:"Please sign in again."},{status:401});
 if(path[1]==="data"&&method==="GET"){
   const out={};for(const [key,t] of Object.entries(tableName)){const r=await env.DB.prepare(`SELECT * FROM ${t} ORDER BY id DESC`).all();out[key]=r.results;}return Response.json(out);
 }
 const key=path[1],table=tableName[key];if(!table)return Response.json({error:"Unknown content type."},{status:404});
 if(method==="GET")return Response.json({error:"Not found."},{status:404});
 if(method==="POST"){
   const data=clean(await body(request),allowed[key]);if(!data.name&&!data.title)return Response.json({error:"A name or title is required."},{status:400});
   for(const [k,v] of Object.entries(data))if(typeof v==="string")data[k]=safeText(v,k.includes("description")?5000:1000);
   if(key==="products"&&!data.serial_no){const r=await env.DB.prepare("SELECT COALESCE(MAX(serial_no),0)+1 AS n FROM products").first();data.serial_no=r.n;}
   const cols=Object.keys(data);const sql=`INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map(()=>"?").join(",")})`;
   const result=await env.DB.prepare(sql).bind(...cols.map(k=>data[k])).run();return Response.json({ok:true,id:result.meta.last_row_id,serial_no:data.serial_no||null});
 }
 const id=Number(path[2]);if(!Number.isInteger(id)||id<1)return Response.json({error:"Invalid item ID."},{status:400});
 if(method==="PUT"){
   const data=clean(await body(request),allowed[key]);for(const [k,v] of Object.entries(data))if(typeof v==="string")data[k]=safeText(v,k.includes("description")?5000:1000);
   const cols=Object.keys(data);if(!cols.length)return Response.json({error:"No changes supplied."},{status:400});
   await env.DB.prepare(`UPDATE ${table} SET ${cols.map(k=>k+"=?").join(",")} WHERE id=?`).bind(...cols.map(k=>data[k]),id).run();return Response.json({ok:true});
 }
 if(method==="DELETE"){await env.DB.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run();return Response.json({ok:true});}
 return Response.json({error:"Method not allowed."},{status:405});
}