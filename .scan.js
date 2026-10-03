const fs=require('fs'),zlib=require('zlib');
const buf=fs.readFileSync('.repro.png');
let off=8,w,h,type,ids=[];
while(off<buf.length){const len=buf.readUInt32BE(off);const name=buf.toString('ascii',off+4,off+8);const data=buf.slice(off+8,off+8+len);
 if(name==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);type=data[9];}
 if(name==='IDAT')ids.push(data);
 off+=12+len;if(name==='IEND')break;}
const raw=zlib.inflateSync(Buffer.concat(ids));
const bpp=type===6?4:3, stride=w*bpp;
const px=Buffer.alloc(h*stride);
let pos=0;
function paeth(a,b,c){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:(pb<=pc?b:c);}
for(let y=0;y<h;y++){const f=raw[pos++];for(let x=0;x<stride;x++){const v=raw[pos++];const a=x>=bpp?px[y*stride+x-bpp]:0;const b=y>0?px[(y-1)*stride+x]:0;const c=(y>0&&x>=bpp)?px[(y-1)*stride+x-bpp]:0;let out;
 if(f===0)out=v;else if(f===1)out=v+a;else if(f===2)out=v+b;else if(f===3)out=v+((a+b)>>1);else out=v+paeth(a,b,c);
 px[y*stride+x]=out&255;}}
const bg=[px[170*stride+5],px[170*stride+6],px[170*stride+7]];
console.log('PNG',w,h,'type',type,'bg',bg);
for(let y=175;y<=198;y++){let rowMin=1e9,rowMax=-1;
 for(let x=60;x<700;x++){const i=y*stride+x*bpp;
  const d=Math.abs(px[i]-bg[0])+Math.abs(px[i+1]-bg[1])+Math.abs(px[i+2]-bg[2]);
  if(d>40){if(x<rowMin)rowMin=x;if(x>rowMax)rowMax=x;}}
 if(rowMax>=0)console.log('y='+y+' widgetPixels x=['+rowMin+'..'+rowMax+']');}
