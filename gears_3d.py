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

def make_gear(radius, gear_color, thickness=0.4, teeth=20):
    """
    Constructs a 3D gear at the origin, with its default rotation axis facing +X (1,0,0).
    """
    parts = []
    
    # Central cylinder body lying along the X-axis
    c = cylinder(pos=vector(-thickness/2, 0, 0), axis=vector(thickness, 0, 0), radius=radius*0.85, color=gear_color)
    parts.append(c)
    
    # Generate the teeth in the YZ plane
    for i in range(teeth):
        angle = (2 * pi / teeth) * i
        tooth_pos = vector(0, cos(angle)*radius*0.95, sin(angle)*radius*0.95)
        
        # Tooth box
        t = box(pos=tooth_pos, length=thickness, height=radius*0.3, width=max(0.1, radius*0.15), color=gear_color)
        t.axis = vector(1,0,0)
        t.up = vector(0, cos(angle), sin(angle))
        parts.append(t)
        
    g = compound(parts)
    return g

def main():
    print("=== 3D Orthogonal Planetary Gears ===")
    
    try:
        r1 = float(input("Enter radius for Z-Axis Gear (e.g., 2.0): "))
        r2 = float(input("Enter radius for Y-Axis Gear (e.g., 3.0): "))
        r3 = float(input("Enter radius for X-Axis Gear (e.g., 4.0): "))
    except ValueError:
        print("Invalid inputs detected. Defaulting to radii: 2.0, 3.0, 4.0")
        r1, r2, r3 = 2.0, 3.0, 4.0

    print("\nDo you want to track a point on the X-Axis Gear? (y/n)")
    track_ans = input().strip().lower()
    track_point = track_ans in ['y', 'yes']

    point_color = color.red
    if track_point:
        print("Enter a color for the tracked point (red, green, blue, yellow, magenta, cyan). Default is red:")
        col_ans = input().strip().lower()
        color_map = {
            'red': color.red, 'green': color.green, 'blue': color.blue,
            'yellow': color.yellow, 'magenta': color.magenta, 'cyan': color.cyan, 'white': color.white
        }
        point_color = color_map.get(col_ans, color.red)

    print("\nStarting 3D Epicyclic environment...")
    print("\n*** NEW ADVANCED 3D CONTROLS ***")
    print(" - LOOK AROUND : Arrow Keys (or CTRL + Left-Click)")
    print(" - ZOOM        : Scroll wheel")
    print(" - MOVE (Fly)  : W, A, S, D")
    print(" - FLY UP/DOWN : E / Q")
    
    scene = canvas(title='Orthogonal Planetary 3D Gears', width=1200, height=800)
    scene.background = color.gray(0.1)

    # Add real-time UI controls below the canvas
    scene.append_to_caption('\n<h3>Controls</h3>')
    scene.append_to_caption('<b>Speed Control: </b>')
    def set_speed(s):
        pass # The loop reads s.value directly, so we just need a dummy bind
    speed_slider = slider(min=-3.0, max=3.0, value=1.0, length=400, bind=set_speed)
    scene.append_to_caption('  <i>(Drag left to reverse gear directions!)</i>\n')

    # WASD Custom Keyboard Controller
    keys_down = set()
    def keydown(evt):
        keys_down.add(evt.key.lower())
    def keyup(evt):
        k = evt.key.lower()
        if k in keys_down:
            keys_down.remove(k)
    scene.bind('keydown', keydown)
    scene.bind('keyup', keyup)

    # 1. Gear Z (Stationary translation, purely rotational)
    gearZ = make_gear(r1, color.cyan, teeth=max(6, int(r1*8)))
    gearZ.pos = vector(0,0,0)
    gearZ.axis = vector(0,0,1) # Rotates on Z axis

    # 2. Gear Y (Translates around Z, spins on its own Y axis!)
    gearY = make_gear(r2, color.magenta, teeth=max(6, int(r2*8)))
    gearY.pos = vector(0, r1, r2)
    gearY.axis = vector(0,1,0) # Rotates on Y axis

    # 3. Gear X (Translates around Y, spins on its own X axis!)
    gearX = make_gear(r3, color.yellow, teeth=max(6, int(r3*8)))
    gearX.pos = vector(r2, r1+r3, r2)
    gearX.axis = vector(1,0,0) # Rotates on X axis

    # --- Construct the "L Joints" holding the system together ---
    # Arm 1: Connects system origin (Z gear) to Gear Y
    arm1_part1 = cylinder(pos=vector(0,0,-0.2), axis=vector(0,0,r2+0.2), radius=r1*0.08, color=color.white)
    arm1_part2 = cylinder(pos=vector(0,0,r2), axis=vector(0,r1,0), radius=r1*0.08, color=color.white)
    arm1 = compound([arm1_part1, arm1_part2])

    # Arm 2: Connects Gear Y to Gear X
    arm2_part1 = cylinder(pos=vector(0, r1, r2), axis=vector(0, r3, 0), radius=r2*0.08, color=color.white)
    arm2_part2 = cylinder(pos=vector(0, r1+r3, r2), axis=vector(r2, 0, 0), radius=r2*0.08, color=color.white)
    arm2 = compound([arm2_part1, arm2_part2])

    # Tracker point on Gear X rim
    tracker = None
    if track_point:
        tracker = sphere(pos=gearX.pos + vector(0,0,r3), radius=min(r1,r2,r3)*0.15, color=point_color, make_trail=True)

    dt = 0.01

    while True:
        rate(100)
        
        # Check Custom Keyboard Flycam Controls
        move_speed = 0.15
        if 'w' in keys_down:
            scene.camera.pos += norm(scene.camera.axis) * move_speed
            scene.center += norm(scene.camera.axis) * move_speed
        if 's' in keys_down:
            scene.camera.pos -= norm(scene.camera.axis) * move_speed
            scene.center -= norm(scene.camera.axis) * move_speed
        if 'a' in keys_down:
            right = norm(cross(scene.camera.axis, scene.camera.up))
            scene.camera.pos -= right * move_speed
            scene.center -= right * move_speed
        if 'd' in keys_down:
            right = norm(cross(scene.camera.axis, scene.camera.up))
            scene.camera.pos += right * move_speed
            scene.center += right * move_speed
        if 'q' in keys_down: # Down
            scene.camera.pos -= norm(scene.camera.up) * move_speed
            scene.center -= norm(scene.camera.up) * move_speed
        if 'e' in keys_down: # Up
            scene.camera.pos += norm(scene.camera.up) * move_speed
            scene.center += norm(scene.camera.up) * move_speed
            
        look_speed = 0.03
        if 'left' in keys_down:
            scene.forward = scene.forward.rotate(angle=look_speed, axis=vector(0,1,0))
        if 'right' in keys_down:
            scene.forward = scene.forward.rotate(angle=-look_speed, axis=vector(0,1,0))
        if 'up' in keys_down:
            right_axis = norm(cross(scene.forward, scene.up))
            scene.forward = scene.forward.rotate(angle=look_speed, axis=right_axis)
        if 'down' in keys_down:
            right_axis = norm(cross(scene.forward, scene.up))
            scene.forward = scene.forward.rotate(angle=-look_speed, axis=right_axis)

        # Live Dynamic Speed Slider Controller
        speed_factor = speed_slider.value
        w_z = 2.0 * speed_factor       # Z gear drives everything
        w_arm1 = 0.5 * speed_factor    # Arm 1 sweeps around Z
        w_y = (w_z - w_arm1) * (r1 / r2)  # Y rolls exactly on Z's face
        
        w_arm2 = 0.8 * speed_factor    # Arm 2 sweeps around Y independently
        w_x = (w_y - w_arm2) * (r2 / r3)  # X rolls exactly on Y's face

        # 1. Base Z-Gear spins
        gearZ.rotate(angle=w_z*dt, axis=vector(0,0,1), origin=vector(0,0,0))
        
        # 2. Arm 1 rotates around the global Z-axis...
        # ...carrying Gear Y, Arm 2, Gear X, and Tracker with it!
        d_phi1 = w_arm1 * dt
        global_z = vector(0,0,1)
        origin_0 = vector(0,0,0)
        
        arm1.rotate(angle=d_phi1, axis=global_z, origin=origin_0)
        gearY.rotate(angle=d_phi1, axis=global_z, origin=origin_0)
        arm2.rotate(angle=d_phi1, axis=global_z, origin=origin_0)
        gearX.rotate(angle=d_phi1, axis=global_z, origin=origin_0)
        if tracker: tracker.rotate(angle=d_phi1, axis=global_z, origin=origin_0)
        
        # 3. Gear Y spins on its own axis (rolling on Gear Z!)
        d_thetaY = w_y * dt
        axis_y = gearY.axis
        pos_y = gearY.pos
        gearY.rotate(angle=d_thetaY, axis=axis_y, origin=pos_y)
        
        # 4. Arm 2 rotates around Gear Y's axis...
        # ...carrying Gear X and Tracker translationally!
        d_phi2 = w_arm2 * dt
        arm2.rotate(angle=d_phi2, axis=axis_y, origin=pos_y)
        gearX.rotate(angle=d_phi2, axis=axis_y, origin=pos_y)
        if tracker: tracker.rotate(angle=d_phi2, axis=axis_y, origin=pos_y)
        
        # 5. Gear X spins on its own axis (rolling on Gear Y!)
        d_thetaX = w_x * dt
        axis_x = gearX.axis
        pos_x = gearX.pos
        gearX.rotate(angle=d_thetaX, axis=axis_x, origin=pos_x)
        if tracker: tracker.rotate(angle=d_thetaX, axis=axis_x, origin=pos_x)

if __name__ == '__main__':
    main()
