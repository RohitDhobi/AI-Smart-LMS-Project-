const fs=require('fs'),zlib=require('zlib');
const buf=fs.readFileSync('.repro.png');
let off=8,w,h,type,bit,ids=[];
while(off<buf.length){const len=buf.readUInt32BE(off);const name=buf.toString('ascii',off+4,off+8);const data=buf.slice(off+8,off+8+len);
 if(name==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);bit=data[8];type=data[9];}
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
function P(x,y){const i=y*stride+x*bpp;return [px[i],px[i+1],px[i+2]];}
// labels are dark text on white; exclude label area (x<200 above y=165). Check checkbox band y=178..195.
// Card spans x=70..730, white bg. Find dark/colored pixels per row in that band.
for(let y=177;y<=197;y++){
  let minx=1e9,maxx=-1,n=0;
  for(let x=72;x<700;x++){const p=P(x,y);
    if(p[0]<235||p[1]<235||p[2]<235){if(x<minx)minx=x;if(x>maxx)maxx=x;n++;}}
  if(n>0)console.log('y='+y+' nonWhite x=['+minx+'..'+maxx+'] n='+n+' sample='+P(minx,y));
}
