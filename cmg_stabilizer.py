import sys
import subprocess

def ensure_vpython():
    try:
        import vpython
    except ImportError:
        print("VPython library not found. Installing now. Please wait...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "vpython"])

ensure_vpython()

from vpython import *

def make_gear(radius, gear_color, thickness=0.4, teeth=24):
    parts = []
    
    # Base central mass cylinder
    c = cylinder(pos=vector(-thickness/2, 0, 0), axis=vector(thickness, 0, 0), radius=radius*0.85, color=gear_color)
    parts.append(c)
        
    # Extricate the gear teeth
    for i in range(teeth):
        angle = (2 * pi / teeth) * i
        tooth_pos = vector(0, cos(angle)*radius*0.95, sin(angle)*radius*0.95)
        
        t = box(pos=tooth_pos, length=thickness, height=radius*0.3, width=max(0.1, radius*0.15), color=gear_color)
        t.axis = vector(1,0,0)
        t.up = vector(0, cos(angle), sin(angle))
        parts.append(t)
        
    g = compound(parts)
    return g

def main():
    print("=== 3D Satellite Attitude Control Stabilizer (CMG) ===")
    print("Building CAD model...")
    print("\n* Remember: Hold CTRL + Left-Click to smoothly Look Around!")
    
    scene = canvas(title='Satellite CMG (Control Moment Gyroscope) Simulator', width=1200, height=850)
    scene.background = color.gray(0.05)
    
    # Real-time Satellite Attitude Control Interface
    scene.append_to_caption('\n<h3>Attitude Command Protocol</h3>')
    
    global target_yaw, target_pitch, rotor_speed
    target_yaw = 0.0
    target_pitch = 0.0
    rotor_speed = 7.0
    
    def set_yaw(s): global target_yaw; target_yaw = s.value
    def set_pitch(s): global target_pitch; target_pitch = s.value
    def set_rotor(s): global rotor_speed; rotor_speed = s.value
    
    scene.append_to_caption('<div style="display:flex; flex-direction:column; gap: 10px;">')
    
    scene.append_to_caption('<div><b>Y-Axis Base Gear (Yaw Gimbal Actuator Command)</b><br>')
    slider(min=-pi, max=pi, value=0, length=400, bind=set_yaw)
    scene.append_to_caption('</div>')
    
    scene.append_to_caption('<div><b>X-Axis Side Gear (Pitch Gimbal Actuator Command)</b><br>')
    slider(min=-pi/2, max=pi/2, value=0, length=400, bind=set_pitch)
    scene.append_to_caption('</div>')

    scene.append_to_caption('<div><b>Z-Axis Core Gear (Reaction Mass Spin Speed)</b><br>')
    slider(min=0, max=25, value=7.0, length=400, bind=set_rotor)
    scene.append_to_caption('</div>')
    
    scene.append_to_caption('</div>')

    # Build the Static Support Chassis (Testing Bench)
    bench = box(pos=vector(0,-4.5,0), length=8, height=0.5, width=8, color=vector(0.15, 0.15, 0.18))
    pillar = cylinder(pos=vector(0,-4.5,0), axis=vector(0,1.2,0), radius=1.0, color=color.gray(0.3))

    # ==== GIMBAL 1: YAW SYSTEM ====
    yaw_gear = make_gear(radius=2.5, gear_color=color.cyan, thickness=0.4, teeth=36)
    yaw_gear.pos = vector(0, -3.0, 0)
    yaw_gear.axis = vector(0, 1, 0) 
    
    # U-bracket arms connecting gear to the outer suspension ring
    yaw_arm1 = cylinder(pos=vector(-2.2, -3.0, 0), axis=vector(0, 3.0, 0), radius=0.15, color=color.white)
    yaw_arm2 = cylinder(pos=vector(2.2, -3.0, 0), axis=vector(0, 3.0, 0), radius=0.15, color=color.white)
    
    # Outer Suspension Ring (XZ plane facing out)
    yaw_ring = ring(pos=vector(0,0,0), axis=vector(0,1,0), radius=2.2, thickness=0.12, color=color.cyan)
    
    yaw_objects = [yaw_gear, yaw_arm1, yaw_arm2, yaw_ring]

    # ==== GIMBAL 2: PITCH SYSTEM ====
    pitch_gear = make_gear(radius=1.2, gear_color=color.magenta, thickness=0.3, teeth=20)
    pitch_gear.pos = vector(2.2, 0, 0)
    pitch_gear.axis = vector(1, 0, 0) 
    
    # Middle inner ring (YZ plane facing sideways)
    pitch_ring = ring(pos=vector(0,0,0), axis=vector(1,0,0), radius=1.6, thickness=0.1, color=color.magenta)
    pitch_pivot = cylinder(pos=vector(-2.2, 0, 0), axis=vector(0.6, 0, 0), radius=0.12, color=color.white)
    
    pitch_objects = [pitch_gear, pitch_ring, pitch_pivot]

    # ==== GIMBAL 3: THE SPINNING REACTION ROTOR ====
    # High mass inner gear that generates the stabilization angular momentum!
    rotor_gear = make_gear(radius=1.3, gear_color=vector(1.0, 0.7, 0.1), thickness=0.8, teeth=16)
    rotor_gear.pos = vector(0,0,0)
    rotor_gear.axis = vector(0,0,1)
    
    rotor_shaft = cylinder(pos=vector(0,0,-1.6), axis=vector(0,0,3.2), radius=0.1, color=color.white)
    
    # Tracker point sitting natively on the edge of the rotor (radius 1.3 straight up)
    tracker = sphere(pos=vector(0, 1.3, 0), radius=0.1, color=color.yellow, make_trail=True, retain=200)
    
    rotor_objects = [rotor_gear, rotor_shaft, tracker]

    current_yaw = 0.0
    current_pitch = 0.0
    dt = 0.01

    while True:
        rate(100)
        origin = vector(0,0,0)
        
        # 1. Pitch & Yaw Mechanics smoothly track your UI Sliders mathematically!
        error_yaw = target_yaw - current_yaw
        dyaw = error_yaw * 2.5 * dt
        current_yaw += dyaw
        
        global_Y = vector(0,1,0)
        # We rotate all 3 sub-assemblies inside the base gimbal ring
        for obj in yaw_objects + pitch_objects + rotor_objects:
            obj.rotate(angle=dyaw, axis=global_Y, origin=origin)
            
        error_pitch = target_pitch - current_pitch
        dpitch = error_pitch * 2.5 * dt
        current_pitch += dpitch
        
        local_X = pitch_gear.axis
        # We rotate only the inner 2 sub-assemblies inside the middle gimbal
        for obj in pitch_objects + rotor_objects:
            obj.rotate(angle=dpitch, axis=local_X, origin=origin)
            
        # 3. The Reaction Rotor spins furiously to generate absolute inertia!
        drotor = rotor_speed * dt
        local_Z = rotor_gear.axis
        for obj in rotor_objects:
            obj.rotate(angle=drotor, axis=local_Z, origin=origin)

if __name__ == '__main__':
    main()
