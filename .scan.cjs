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
console.log('depth',bit,'type',type,'size',w,h);
console.log('body bg(5,170)',P(5,170),' card bg(90,170)',P(90,170),' (90,60)',P(90,60));
// unchecked checkbox expected around y=180..193, box x=78..685
for(let y=176;y<=196;y+=4){
  let seg='';
  for(let x=70;x<700;x+=1){const p=P(x,y);const bright=(p[0]+p[1]+p[2])>330; // white-ish widget
    if(bright)seg+=x+',';}
  console.log('y='+y+' brightX:', seg? seg.split(',').slice(0,8).join(' ')+' ... last: '+seg.split(',').slice(-3).join(' ') : 'none');
}
