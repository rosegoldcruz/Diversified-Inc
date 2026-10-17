import bpy, math
from mathutils import Vector, Euler
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene
def mat(n,c,m=0.6,r=0.3,e=None,es=0):
    M=bpy.data.materials.new(n);M.use_nodes=True;b=M.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value=(*c,1);b.inputs["Metallic"].default_value=m;b.inputs["Roughness"].default_value=r
    if e: b.inputs["Emission Color"].default_value=(*e,1);b.inputs["Emission Strength"].default_value=es
    return M
WHITE=mat("Shell",(0.85,0.88,0.92),0.3,0.35);DARK=mat("Joint",(0.05,0.07,0.1),0.8,0.4)
CY=(0.0,0.21,0.69)  # #017DD5 linear-ish
VIS=mat("Visor",(0.01,0.03,0.06),0.5,0.15,(0.0,0.49,0.84),4.0)
ACC=mat("Accent",(0.0,0.2,0.7),0.4,0.3,(0.0,0.49,0.84),2.0)
# armature
bpy.ops.object.armature_add(location=(0,0,0));arm=bpy.context.object;arm.name="Rig"
bpy.ops.object.mode_set(mode='EDIT');eb=arm.data.edit_bones;eb.remove(eb[0])
B={}
def bone(n,h,t,p=None):
    b=eb.new(n);b.head=h;b.tail=t
    if p: b.parent=eb[p]
    B[n]=(h,t)
bone("hips",(0,0,0.95),(0,0,1.05));bone("spine",(0,0,1.05),(0,0,1.4),"hips");bone("head",(0,0,1.45),(0,0,1.7),"spine")
for s,x in(("L",1),("R",-1)):
    bone("upperarm."+s,(0.22*x,0,1.38),(0.24*x,0,1.12),"spine");bone("forearm."+s,(0.24*x,0,1.12),(0.25*x,0,0.88),"upperarm."+s)
    bone("hand."+s,(0.25*x,0,0.88),(0.25*x,0,0.8),"forearm."+s)
    bone("thigh."+s,(0.1*x,0,0.92),(0.1*x,0,0.5),"hips");bone("shin."+s,(0.1*x,0,0.5),(0.1*x,0,0.1),"thigh."+s)
    bone("foot."+s,(0.1*x,0,0.1),(0.1*x,-0.12,0.04),"shin."+s)
bpy.ops.object.mode_set(mode='OBJECT')
parts=[]
def add(kind,loc,scale,m,bn,rot=(0,0,0),**kw):
    if kind=="cube": bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    elif kind=="sph": bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=0.5,location=loc)
    else: bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=0.5,depth=1,location=loc)
    o=bpy.context.object;o.scale=scale;o.rotation_euler=rot;o.data.materials.append(m)
    if kind=="cube":
        bv=o.modifiers.new("b","BEVEL");bv.width=kw.get("bev",0.03);bv.segments=3
    bpy.ops.object.modifier_apply if False else None
    o["bone"]=bn;parts.append(o);return o
add("cube",(0,0,1.25),(0.36,0.22,0.36),WHITE,"spine",bev=0.06)
add("cube",(0,-0.112,1.27),(0.14,0.01,0.08),ACC,"spine",bev=0.01)
add("cube",(0,0,1.0),(0.26,0.18,0.14),DARK,"hips",bev=0.04)
add("cyl",(0,0,1.44),(0.08,0.08,0.08),DARK,"head")
add("cube",(0,0,1.58),(0.26,0.24,0.24),WHITE,"head",bev=0.08)
add("cube",(0,-0.115,1.585),(0.21,0.03,0.08),VIS,"head",bev=0.02)
add("cyl",(0,0,1.73),(0.015,0.015,0.06),DARK,"head");add("sph",(0,0,1.765),(0.035,0.035,0.035),ACC,"head")
for s,x in(("L",1),("R",-1)):
    add("sph",(0.22*x,0,1.38),(0.13,0.13,0.13),WHITE,"upperarm."+s)
    add("cyl",(0.23*x,0,1.24),(0.08,0.08,0.22),WHITE,"upperarm."+s)
    add("sph",(0.24*x,0,1.12),(0.08,0.08,0.08),DARK,"forearm."+s)
    add("cyl",(0.245*x,0,1.0),(0.075,0.075,0.2),WHITE,"forearm."+s)
    add("cyl",(0.245*x,0,0.915),(0.078,0.078,0.02),ACC,"forearm."+s)
    add("cube",(0.25*x,0,0.84),(0.06,0.09,0.1),DARK,"hand."+s,bev=0.02)
    add("cyl",(0.1*x,0,0.72),(0.11,0.11,0.36),WHITE,"thigh."+s)
    add("sph",(0.1*x,0,0.5),(0.1,0.1,0.1),DARK,"shin."+s)
    add("cyl",(0.1*x,0,0.3),(0.1,0.1,0.36),WHITE,"shin."+s)
    add("cyl",(0.1*x,-0.051,0.32),(0.02,0.002,0.2),ACC,"shin."+s,rot=(0,0,0))
    add("cube",(0.1*x,-0.04,0.04),(0.13,0.26,0.08),DARK,"foot."+s,bev=0.025)
for o in parts:
    bpy.context.view_layer.objects.active=o
    for md in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)
    vg=o.vertex_groups.new(name=o["bone"]);vg.add(list(range(len(o.data.vertices))),1.0,'REPLACE')
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();body=bpy.context.object;body.name="RobotBody"
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
for k in list(body.keys()): del body[k]
body.parent=arm;md=body.modifiers.new("Armature","ARMATURE");md.object=arm
bpy.ops.object.shade_smooth()
# animations
sc.render.fps=30
pb=arm.pose.bones
for p in pb:p.rotation_mode='XYZ'
def act(name,frames,fn):
    a=bpy.data.actions.new(name);arm.animation_data_create();arm.animation_data.action=a
    for f in frames:
        for p in pb:p.rotation_euler=(0,0,0);p.location=(0,0,0)
        fn(f)
        for p in pb:
            p.keyframe_insert("rotation_euler",frame=f);p.keyframe_insert("location",frame=f)
    tr=arm.animation_data.nla_tracks.new();tr.name=name;tr.strips.new(name,int(frames[0]),a);arm.animation_data.action=None
S=math.sin;r=math.radians;TAU=2*math.pi
def base(t):  # arms down relaxed
    pb["upperarm.L"].rotation_euler.y=r(-4);pb["upperarm.R"].rotation_euler.y=r(4)
def idle(f):
    t=f/60*TAU;base(t);pb["spine"].rotation_euler.x=r(1.5)*S(t);pb["hips"].location.y=0.006*S(t)
    pb["head"].rotation_euler.z=r(4)*S(t/2*2)
act("idle",range(0,61,6),idle)
def walk(f):
    t=f/30*TAU;base(t);sw=S(t)
    pb["thigh.L"].rotation_euler.x=r(28)*sw;pb["thigh.R"].rotation_euler.x=-r(28)*sw
    pb["shin.L"].rotation_euler.x=-r(30)*max(0,-S(t+0.6));pb["shin.R"].rotation_euler.x=-r(30)*max(0,S(t+0.6))
    pb["upperarm.L"].rotation_euler.x=-r(22)*sw;pb["upperarm.R"].rotation_euler.x=r(22)*sw
    pb["forearm.L"].rotation_euler.x=r(-15);pb["forearm.R"].rotation_euler.x=r(-15)
    pb["hips"].location.y=0.025*abs(S(t));pb["spine"].rotation_euler.z=r(5)*sw
act("walk",range(0,31,3),walk)
def wave(f):
    base(0);u=min(1,f/10) if f<40 else max(0,(50-f)/10)
    pb["upperarm.R"].rotation_euler.y=r(4)+r(150)*u;pb["forearm.R"].rotation_euler.y=r(25)*u
    pb["hand.R"].rotation_euler.y=r(25)*S(f/8*TAU)*u;pb["head"].rotation_euler.y=r(-6)*u
act("wave",range(0,51,2),wave)
def talk(f):
    t=f/40*TAU;base(t);pb["head"].rotation_euler.x=r(4)*S(t*2);pb["spine"].rotation_euler.x=r(2)*S(t)
    pb["upperarm.L"].rotation_euler.x=-r(25);pb["forearm.L"].rotation_euler.x=-r(40)-r(15)*S(t)
    pb["upperarm.R"].rotation_euler.x=-r(20);pb["forearm.R"].rotation_euler.x=-r(35)-r(15)*S(t+1.5)
act("talk",range(0,41,4),talk)
def point(f):
    base(0);u=min(1,f/10) if f<40 else max(0,(50-f)/10)
    pb["upperarm.R"].rotation_euler.x=-r(80)*u;pb["upperarm.R"].rotation_euler.y=r(4)+r(25)*u
    pb["spine"].rotation_euler.z=r(-10)*u;pb["head"].rotation_euler.z=r(-12)*u
act("point",range(0,51,5),point)
def listen(f):
    t=f/60*TAU;base(t);pb["head"].rotation_euler.y=r(12);pb["head"].rotation_euler.x=r(-5)+r(2)*S(t)
    pb["upperarm.L"].rotation_euler.x=-r(15);pb["forearm.L"].rotation_euler.x=-r(70)
act("listen",range(0,61,6),listen)
bpy.ops.export_scene.gltf(filepath="/workspace/Diversified-Inc/public/models/robot.glb",export_format='GLB',
  export_animation_mode='NLA_TRACKS',export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_yup=True)
# preview render
for p in pb:p.rotation_euler=(0,0,0)
arm.animation_data.nla_tracks["wave"].strips[0];sc.frame_set(25)
bpy.ops.object.camera_add(location=(1.6,-3.2,1.5));cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,0.95))-cam.location).to_track_quat('-Z','Y').to_euler();sc.camera=cam;cam.data.lens=50
for loc,e in(((2,-2,3),600),((-2,-1,2),300),((0,2,2),400)):
    bpy.ops.object.light_add(type='AREA',location=loc);L=bpy.context.object;L.data.energy=e;L.data.size=2
    L.rotation_euler=(Vector((0,0,1))-L.location).to_track_quat('-Z','Y').to_euler()
w=bpy.data.worlds.new("w");sc.world=w;w.use_nodes=True;w.node_tree.nodes["Background"].inputs[0].default_value=(0.01,0.015,0.03,1)
sc.render.engine='CYCLES';sc.cycles.device='CPU';sc.cycles.samples=48;sc.render.resolution_x=800;sc.render.resolution_y=1000
sc.render.filepath="/workspace/screenshots/diversified-ui/robot-preview.png";bpy.ops.render.render(write_still=True)
