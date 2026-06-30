from PIL import Image, ImageDraw
import math
def rrect(d, box, r, **kw): d.rounded_rectangle(box, radius=r, **kw)
def make_icon(size):
    S=size; SS=4; s=S*SS
    img=Image.new("RGB",(s,s),"#171009"); d=ImageDraw.Draw(img,"RGBA"); cx=s/2
    for i in range(s):
        t=i/s; r=int(0x2c-t*0x1c); g=int(0x21-t*0x15); b=int(0x15-t*0x0d)
        d.line([(0,i),(s,i)],fill=(max(r,0),max(g,0),max(b,0)))
    gy=s*0.74
    d.ellipse([s*0.12,gy-s*0.05,s*0.88,gy+s*0.16],fill=(0,0,0,90))
    stone="#8b97a3"; stone_d="#5f6a76"
    gw=s*0.40; gh=s*0.46; gx0=cx-gw/2; gx1=cx+gw/2; gtop=s*0.235; gbot=gy+s*0.02
    rrect(d,[gx0,gtop,gx1,gbot],r=gw*0.46,fill=stone)
    d.rectangle([gx0,gtop+gw*0.5,gx1,gbot],fill=stone)
    d.rectangle([gx1-gw*0.16,gtop+gw*0.4,gx1,gbot],fill=stone_d)
    # crossed swords engraved
    eng=(70,79,90,255); midy=gtop+gh*0.42
    def sword(angle):
        L=gh*0.40; a=math.radians(angle); dx=math.cos(a); dy=math.sin(a); bw=gw*0.05
        d.line([(cx-dx*L,midy-dy*L),(cx+dx*L,midy+dy*L)],fill=eng,width=int(bw))
        gxp=cx-dx*L*0.62; gyp=midy-dy*L*0.62; pdx=-dy; pdy=dx; gl=gw*0.10
        d.line([(gxp-pdx*gl,gyp-pdy*gl),(gxp+pdx*gl,gyp+pdy*gl)],fill=eng,width=int(bw*0.8))
    sword(58); sword(122)
    gold="#e7c14a"; gold_edge="#9c7916"; gold_hi="#f6e08a"
    def coin(cxp,cyp,rr,tilt=0.40):
        d.ellipse([cxp-rr,cyp-rr*tilt,cxp+rr,cyp+rr*tilt],fill=gold_edge)
        d.ellipse([cxp-rr,cyp-rr*tilt-rr*0.16,cxp+rr,cyp+rr*tilt-rr*0.16],fill=gold)
        d.ellipse([cxp-rr*0.66,cyp-rr*tilt*0.66-rr*0.16,cxp+rr*0.66,cyp+rr*tilt*0.66-rr*0.16],outline=gold_edge,width=max(2,s//300))
        d.ellipse([cxp-rr*0.5,cyp-rr*tilt*0.7-rr*0.22,cxp-rr*0.1,cyp-rr*tilt*0.2-rr*0.22],fill=gold_hi)
    base_y=gy+s*0.085; cr=s*0.085
    coin(cx-s*0.20,base_y,cr*1.05); coin(cx+s*0.205,base_y+s*0.012,cr*1.05); coin(cx-s*0.025,base_y+s*0.045,cr*1.15)
    lx=cx+s*0.155; ly=gy-s*0.02; rr=s*0.072
    d.ellipse([lx-rr,ly-rr,lx+rr,ly+rr],fill=gold_edge); d.ellipse([lx-rr*0.9,ly-rr*0.92,lx+rr*0.9,ly+rr*0.88],fill=gold)
    d.ellipse([lx-rr*0.55,ly-rr*0.58,lx+rr*0.55,ly+rr*0.52],outline=gold_edge,width=max(2,s//300))
    d.ellipse([lx-rr*0.45,ly-rr*0.5,lx-rr*0.05,ly-rr*0.05],fill=gold_hi)
    return img.resize((S,S),Image.LANCZOS)
for sz in (192,512):
    make_icon(sz).save(f"/home/claude/coin-and-kin/public/icon-{sz}.png"); print(f"icon-{sz}.png written")
