#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Architecture diagrams (As-Is / To-Be) for the Airtel Champions App Shadow IT
/ VM-approval document. Pure matplotlib, offline."""

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle
from matplotlib.lines import Line2D
import os

# Figures are written next to this script (docs/vm-approval), where gen_docx.py
# reads them from.
OUT = os.path.dirname(os.path.abspath(__file__))

RED="#E4002B"; INK="#1A2233"; BOXEDGE="#3B4A6B"; NOTE="#5A6B87"
USERFILL="#FFF6E6"; USEREDGE="#C98A00"
EXT_E="#E4002B"; EXT_F="#FDECEC"
AIR_E="#00A19A"; AIR_F="#E7F5F3"
BLUE="#2C5AA0"; GREEN="#1E8C5A"; GOLD="#B5791A"

plt.rcParams["font.family"]="DejaVu Sans"

def box(ax,x,y,w,h,text,fill="#FFFFFF",edge=BOXEDGE,fs=9.2,bold=False,tcolor=INK,lw=1.4):
    ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle="round,pad=0.02,rounding_size=0.05",
                 linewidth=lw,edgecolor=edge,facecolor=fill,zorder=3))
    ax.text(x+w/2,y+h/2,text,ha="center",va="center",fontsize=fs,color=tcolor,
            fontweight="bold" if bold else "normal",zorder=4)

def band(ax,x,y,w,h,fill,edge,dashed=True):
    ls=(0,(6,3)) if dashed else "-"
    ax.add_patch(Rectangle((x,y),w,h,linewidth=1.7,edgecolor=edge,facecolor=fill,
                 zorder=1,linestyle=ls,alpha=0.92))

def tab(ax,x,y,text,color,fs=10):
    ax.text(x,y,text,ha="left",va="center",fontsize=fs,color=color,fontweight="bold",
            zorder=8,bbox=dict(boxstyle="round,pad=0.22",fc="white",ec=color,lw=1.1))

def arrow(ax,p1,p2,text="",color=BOXEDGE,ls="-",fs=8.2,rad=0.0,toff=(0,0),tw=1.5):
    ax.add_patch(FancyArrowPatch(p1,p2,arrowstyle="-|>",mutation_scale=13,linewidth=tw,
                 color=color,zorder=5,connectionstyle=f"arc3,rad={rad}",linestyle=ls))
    if text:
        mx,my=(p1[0]+p2[0])/2+toff[0],(p1[1]+p2[1])/2+toff[1]
        ax.text(mx,my,text,ha="center",va="center",fontsize=fs,color=color,style="italic",
                zorder=9,bbox=dict(boxstyle="round,pad=0.14",fc="white",ec="none",alpha=0.9))

def frame(title):
    fig,ax=plt.subplots(figsize=(12.6,8.6))
    ax.set_xlim(0,16); ax.set_ylim(0,12.8); ax.axis("off")
    ax.text(0.1,12.45,title,ha="left",va="center",fontsize=14.5,fontweight="bold",color=RED)
    ax.add_line(Line2D([0.1,15.9],[12.15,12.15],color=RED,lw=2.2))
    return fig,ax

def caption(ax,text,color):
    ax.text(0.1,0.12,text,ha="left",va="center",fontsize=8.1,color=color,style="italic")

# ===========================================================================
# FIGURE 1 — AS-IS
# ===========================================================================
fig,ax=frame("Figure 1  |  Existing (As-Is) Architecture  -  External SaaS (Shadow IT)")

# USER band (tall, title strip on top)
band(ax,0.2,10.55,15.6,1.35,"#EEF2FB","#3B4A6B")
tab(ax,0.45,11.62,"USER TIER  -  field + office, personal / BYOD devices","#3B4A6B",9.5)
box(ax,0.7,10.7,3.4,0.7,"Champions / SE / DSE\nInstaller PWA (browser)",USERFILL,USEREDGE,8.3)
box(ax,4.3,10.7,3.4,0.7,"HBB / CX / Warehouse\nHQ dashboards (desktop)",USERFILL,USEREDGE,8.3)
box(ax,7.9,10.7,3.4,0.7,"Native app (Capacitor)\nAndroid / iOS",USERFILL,USEREDGE,8.3)
box(ax,11.5,10.7,3.9,0.7,"Airtel Money / Sales / HBB\nroles  (phone + PIN)",USERFILL,USEREDGE,8.3)

# EXTERNAL boundary
band(ax,0.2,0.35,15.6,9.75,EXT_F,EXT_E)
tab(ax,0.45,10.22,"EXTERNAL SaaS  -  OUTSIDE AIRTEL IT CONTROL  (Shadow IT boundary)",EXT_E,9.5)

# left column: Vercel, Capgo, map, whatsapp
box(ax,0.9,8.0,4.5,1.15,"Vercel CDN / Edge\nStatic PWA hosting (dist/)\n@vercel/static-build",
    "#FFFFFF",BLUE,8.4,bold=True)
box(ax,0.9,6.35,4.5,1.05,"Capgo OTA server  ->  native app\n(live JS bundle push)","#FFFFFF",BLUE,8.1)
box(ax,0.9,2.6,4.5,1.0,"OpenStreetMap tiles + cdnjs\n(Leaflet, browser-direct HTTPS)","#FFFFFF",BOXEDGE,8.0)
box(ax,0.9,1.3,4.5,1.0,"WhatsApp (wa.me)\nclick-to-chat (browser-direct)","#FFFFFF",BOXEDGE,8.0)

# right: Supabase cloud sub-band
band(ax,6.1,1.05,9.5,8.05,"#EAF1FF",BLUE,dashed=False)
tab(ax,6.35,8.82,"Supabase Cloud  (managed, project xspogpfohjmkykfjadhk)",BLUE,9.2)
box(ax,6.45,7.35,8.9,1.1,"~20 Edge Functions  (Deno runtime, Hono framework)\n"
    "auth-login, hbb-*, service-requests, make-server-28f2f653 ...  [verify_jwt = false]",
    "#FFFFFF",BLUE,7.9)
box(ax,6.45,5.55,4.2,1.35,"PostgREST\nauto REST API\n(anon / service-role keys)","#FFFFFF",BLUE,8.3)
box(ax,11.15,5.55,4.2,1.35,"Realtime\n(WebSocket / WSS)","#FFFFFF",BLUE,8.3)
box(ax,6.45,3.6,4.2,1.5,"PostgreSQL\nRLS + SECURITY DEFINER RPCs\npg_cron\n(single managed node)",
    "#FFFFFF",BLUE,8.2,bold=True)
box(ax,11.15,3.6,4.2,1.5,"Supabase Storage\n(object buckets:\nodu_documents, photos)","#FFFFFF",BLUE,8.3)
box(ax,6.45,1.35,8.9,0.95,"GoTrue Auth  -  present but UNUSED (app uses custom phone + PIN + session token)",
    "#F1F1F1","#8892A6",7.9)

# arrows (routed in clear columns)
arrow(ax,(2.4,10.7),(2.9,9.15),"HTTPS",RED,toff=(-0.5,0),rad=0.05)      # user->Vercel
arrow(ax,(9.6,10.7),(9.6,8.47),"HTTPS/REST + WSS",BLUE,toff=(0,0.15))    # user->Edge
arrow(ax,(9.0,7.35),(8.55,6.9),"",BLUE)                                  # edge->postgrest
arrow(ax,(12.6,7.35),(13.25,6.9),"",BLUE)                                # edge->realtime
arrow(ax,(8.55,5.55),(8.55,5.1),"SQL",BLUE,toff=(0.35,0))                # postgrest->pg

caption(ax,"Data at rest and in transit leave Airtel's managed estate. Customer PII and (with ODU) payment records sit on third-party infrastructure; "
           "no central IT visibility, no Airtel WAF, API keys distributed to browser clients.",EXT_E)
fig.savefig(f"{OUT}/fig1_asis.png",dpi=185,bbox_inches="tight",facecolor="white"); plt.close(fig)

# ===========================================================================
# FIGURE 2 — TO-BE
# ===========================================================================
fig,ax=frame("Figure 2  |  Proposed (To-Be) Architecture  -  Airtel-Managed VMs / Private Cloud")

# USER band
band(ax,0.2,11.15,15.6,0.95,"#EEF2FB","#3B4A6B")
tab(ax,0.45,11.92,"USER TIER  -  managed / BYOD devices","#3B4A6B",9.3)
box(ax,3.0,11.25,3.8,0.6,"PWA (browser) + Capacitor app",USERFILL,USEREDGE,8.4)
box(ax,7.0,11.25,3.9,0.6,"HQ / CX / Warehouse dashboards",USERFILL,USEREDGE,8.4)
box(ax,11.1,11.25,4.3,0.6,"Airtel Money / Sales / HBB roles",USERFILL,USEREDGE,8.4)

# DC boundary
band(ax,0.2,0.35,15.6,10.35,AIR_F,AIR_E)
tab(ax,0.45,10.85,"AIRTEL DATA CENTRE / PRIVATE CLOUD  (under Group IT control)",AIR_E,9.5)

# WAF/LB (clear column, below tab)
box(ax,5.3,9.35,5.4,0.8,"Airtel WAF  +  Load Balancer\n(active/active, TLS 1.2+ termination)",
    "#FFF0F0",RED,8.6,bold=True,tcolor=RED)

# WEB zone
band(ax,0.5,6.75,7.0,1.95,"#F0F4FF",BLUE)
tab(ax,0.7,8.5,"WEB ZONE (DMZ)",BLUE,8.8)
box(ax,0.9,6.95,2.95,1.1,"Web VM #1\nNginx + PWA static","#FFFFFF",BLUE,8.4)
box(ax,4.05,6.95,2.95,1.1,"Web VM #2\nNginx + PWA static","#FFFFFF",BLUE,8.4)

# APP zone
band(ax,8.1,6.75,7.3,1.95,"#F0F4FF",BLUE)
tab(ax,8.3,8.5,"APPLICATION ZONE",BLUE,8.8)
box(ax,8.5,6.95,3.2,1.1,"API VM #1\nNode/Deno functions\n(containerised)","#FFFFFF",BLUE,8.2)
box(ax,11.95,6.95,3.2,1.1,"API VM #2\nNode/Deno functions\n(containerised)","#FFFFFF",BLUE,8.2)

# DATA zone
band(ax,0.5,2.1,10.3,4.05,"#EAF7F0",GREEN)
tab(ax,0.7,5.95,"DATA ZONE  (private subnet, no inbound Internet)",GREEN,8.8)
box(ax,0.9,4.35,4.5,1.05,"PgBouncer pooler\n+ PostgREST (REST layer)","#FFFFFF",GREEN,8.3)
box(ax,5.7,4.35,4.6,1.05,"MinIO object storage\n(photos / documents, SSE)","#FFFFFF",GREEN,8.3)
box(ax,0.9,2.55,4.5,1.4,"PostgreSQL PRIMARY\nRLS + RPCs + pg_cron\n(Patroni-managed HA)","#FFFFFF",GREEN,8.3,bold=True)
box(ax,5.7,2.55,4.6,1.4,"PostgreSQL REPLICA\n(streaming replication,\nread + failover)","#FFFFFF",GREEN,8.3)

# MGMT zone
band(ax,11.2,2.1,4.2,4.05,"#FBF3E7",GOLD)
tab(ax,11.4,5.95,"MANAGEMENT ZONE",GOLD,8.8)
box(ax,11.5,4.9,3.7,0.85,"Bastion / Jump host\n(SSH, MFA)","#FFFFFF",GOLD,8.2)
box(ax,11.5,3.85,3.7,0.85,"Backup + WAL archive\n(AAISP retention)","#FFFFFF",GOLD,8.2)
box(ax,11.5,2.55,3.7,1.05,"Monitoring / SIEM\n+ Vault (secrets)","#FFFFFF",GOLD,8.2)

# approved/support row
box(ax,0.6,0.6,4.6,0.9,"Approved map tiles\n(self-hosted / sanctioned)","#FFFFFF",BOXEDGE,8.0)
box(ax,5.4,0.6,4.6,0.9,"Airtel PKI / CA\n(TLS material)","#FFFFFF",BOXEDGE,8.0)
box(ax,10.2,0.6,5.2,0.9,"Airtel AD / SSO (future) + IT change / patch mgmt","#FFFFFF",BOXEDGE,8.0)

# arrows
arrow(ax,(8.0,11.25),(8.0,10.15),"HTTPS",RED,toff=(0.65,0.02))      # user->WAF (label clear of tab)
arrow(ax,(6.8,9.35),(3.7,8.05),"HTTPS",BLUE,rad=0.12)              # WAF->web
arrow(ax,(10.3,9.35),(11.5,8.05),"HTTPS/REST",BLUE,rad=-0.08,toff=(0.55,0.12)) # WAF->app (clear of tab)
arrow(ax,(7.0,7.5),(8.5,7.5),"internal REST",BLUE,toff=(0,0.28))  # web->app
arrow(ax,(9.6,6.95),(4.8,5.4),"libpq / SQL",GREEN,rad=0.1)        # app->db pooler
arrow(ax,(9.9,6.95),(8.0,5.4),"S3 API",GREEN,rad=-0.08,toff=(0.7,0)) # app->minio
arrow(ax,(3.15,4.35),(3.15,3.95),"",GREEN)                        # pooler->primary
arrow(ax,(5.4,3.25),(5.7,3.25),"streaming repl.",GREEN,toff=(0,-0.32)) # primary->replica

caption(ax,"All PII and payment data remain inside Airtel's estate; single ingress via Airtel WAF/LB; secrets in Vault; "
           "DB on a private subnet with HA replica and off-box backups per AAISP.",GREEN)
fig.savefig(f"{OUT}/fig2_tobe.png",dpi=185,bbox_inches="tight",facecolor="white"); plt.close(fig)

print("ok")
