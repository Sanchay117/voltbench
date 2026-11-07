"""Render a 30 FPS motion-graphics + actual 3D/preview capture demo for VoltBench AR with Deepgram Aura-2 narration."""
import json
import math
import pathlib
import subprocess
import sys
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path("/Users/sanchaysingh/Desktop/Hackathons/AR")
DEMO_DIR = ROOT / "demo"
CLIPS_DIR = DEMO_DIR / "clips"
CLIPS_DIR.mkdir(parents=True, exist_ok=True)
PREVIEW_DIR = ROOT / "Assets/GeneratedMeshes/preview"
SHOTS_DIR = ROOT / "devpost/screenshots"
SFX_DIR = ROOT / "Assets/GeneratedSFX"
SCENES = json.loads((DEMO_DIR / "scenes.json").read_text())

W, H, FPS = 1920, 1080, 30

# Palette: Optical Waveguide Dark + High-Contrast Spatial Telemetry
BG = "#090d14"
PANEL = "#111723"
CARD = "#161f30"
LINE = "#26334d"
INK = "#f4f7fc"
MUTED = "#8d9bb5"
CYAN = "#5ce1e6"
CYAN_DIM = "#153842"
EMERALD = "#52f59e"
EMERALD_DIM = "#143b2b"
AMBER = "#ffd166"
AMBER_DIM = "#3d3116"
CRIMSON = "#ff5c77"
CRIMSON_DIM = "#421622"

FONTS_DIR = "/System/Library/Fonts/Supplemental/"


@lru_cache(None)
def font(size, serif=False, bold=False):
    name = "Georgia Bold.ttf" if (serif and bold) else ("Georgia.ttf" if serif else ("Arial Bold.ttf" if bold else "Arial.ttf"))
    path = pathlib.Path(FONTS_DIR) / name
    if path.exists():
        return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def ease(v):
    v = max(0.0, min(1.0, float(v)))
    return 1.0 - (1.0 - v) ** 3


def text(d, xy, value, size=26, color=INK, serif=False, bold=False):
    d.text((int(xy[0]), int(xy[1])), str(value), font=font(size, serif, bold), fill=color)


def wrap(d, xy, value, width, size=24, color=INK, serif=False, bold=False, line_mult=1.36):
    words = str(value).split()
    lines = []
    cur = ""
    f = font(size, serif, bold)
    for w in words:
        trial = (cur + " " + w).strip()
        if d.textlength(trial, font=f) > width and cur:
            lines.append(cur)
            cur = w
        else:
            cur = trial
    if cur:
        lines.append(cur)
    for i, s in enumerate(lines):
        text(d, (xy[0], xy[1] + int(i * size * line_mult)), s, size, color, serif, bold)
    return len(lines) * size * line_mult


def box(d, rect, fill=PANEL, outline=LINE, r=20, width=2):
    d.rounded_rectangle(tuple(map(int, rect)), radius=int(r), fill=fill, outline=outline, width=int(width))


def pill(d, x, y, label, fill=CYAN_DIM, color=CYAN, outline=None, size=18):
    f = font(size, False, True)
    tw = d.textlength(str(label), font=f)
    box(d, (x, y, x + tw + 34, y + 40), fill=fill, outline=outline or color, r=20, width=2)
    text(d, (x + 17, y + 9), label, size, color, bold=True)
    return tw + 34


def arrow(d, a, b, color=CYAN, width=4, progress=1.0):
    p = max(0.0, min(1.0, float(progress)))
    if p <= 0.01:
        return
    x1, y1 = a
    x2, y2 = b
    ex, ey = x1 + (x2 - x1) * p, y1 + (y2 - y1) * p
    d.line([(int(x1), int(y1)), (int(ex), int(ey))], fill=color, width=int(width))
    if p > 0.92:
        ang = math.atan2(y2 - y1, x2 - x1)
        L = 14
        pts = [
            (int(ex), int(ey)),
            (int(ex - L * math.cos(ang - 0.5)), int(ey - L * math.sin(ang - 0.5))),
            (int(ex - L * math.cos(ang + 0.5)), int(ey - L * math.sin(ang + 0.5))),
        ]
        d.polygon(pts, fill=color)


@lru_cache(None)
def load_rgba(path_str, max_w, max_h):
    im = Image.open(path_str).convert("RGBA")
    im.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    return im


def paste_rgba(base_im, path_obj, center_xy, max_wh):
    if not path_obj.exists():
        return
    ov = load_rgba(str(path_obj), max_wh[0], max_wh[1])
    x = int(center_xy[0] - ov.width // 2)
    y = int(center_xy[1] - ov.height // 2)
    base_im.alpha_composite(ov, (x, y))


def capture_card(im, d, shot_name, x, y, w=820, h=462, badge="SPECTACLES INTERACTIVE PREVIEW"):
    box(d, (x - 4, y - 4, x + w + 4, y + h + 4), fill=CARD, outline=CYAN, r=22, width=2)
    shot = load_rgba(str(SHOTS_DIR / shot_name), w - 12, h - 12)
    im.alpha_composite(shot, (int(x + (w - shot.width) // 2), int(y + (h - shot.height) // 2)))
    pill(d, x + 16, y - 48, badge, fill=CYAN_DIM, color=CYAN, size=16)


def anim_keyframe_tag(t):
    frames = ["001", "016", "032", "048"]
    idx = int((t * 3.5) % len(frames))
    return frames[idx]


def base_frame(index, t, duration):
    im = Image.new("RGBA", (W, H), (9, 13, 20, 255))
    d = ImageDraw.Draw(im)

    # Subtle animated spatial waveguide dot-matrix grid
    drift = int((t * 18) % 60)
    for gx in range(70, 1860, 60):
        for gy in range(230, 960, 60):
            px = gx + (drift if (gy // 60) % 2 == 0 else 0)
            if px < 1860:
                d.ellipse((px, gy, px + 2, gy + 2), fill="#1c273b")

    # Top editorial header bar
    chapter_str = SCENES[index]["chapter"]
    pill(d, 84, 38, chapter_str, fill=CYAN_DIM, color=CYAN, size=17)
    text(d, (1580, 38), "VOLTBENCH AR", 30, CYAN, bold=True)
    text(d, (1580, 74), "SNAP SPECTACLES · CLAD + LEAF", 14, MUTED, bold=True)

    # Animated title + subtitle entrance
    head_p = ease(t / 0.7)
    ty = 98 + int((1.0 - head_p) * 22)
    text(d, (84, ty), SCENES[index]["title"], 48, INK, serif=True, bold=True)
    text(d, (86, ty + 62), SCENES[index]["subtitle"], 23, MUTED)

    # Bottom timeline progress bar
    d.line((84, 996, 1836, 996), fill=LINE, width=3)
    prog = (index + min(1.0, t / max(0.1, duration))) / len(SCENES)
    d.line((84, 996, int(84 + 1752 * prog), 996), fill=CYAN, width=5)
    text(d, (84, 1018), "VoltBench AR · Hands-Free Spatial PCB Diagnostics Coach (z = -110 cm)", 20, CYAN, bold=True)
    text(d, (1320, 1020), f"Chapter {index + 1} of {len(SCENES)} · Deepgram Aura-2 + Blender 4.4 GLB", 18, MUTED)
    return im, d


def draw_workbench_stage(im, d, t, x=980, y=260, w=850, h=680, active_idx=0, verified=(False, False, False), thermal=False):
    box(d, (x, y, x + w, y + h), fill="#0d131f", outline=CRIMSON if thermal else CYAN, r=26, width=2)
    pill(d, x + 22, y + 18, "SPECS 37° × 32° FOV (53 × 77 CM @ Z = -110 CM)", fill=CYAN_DIM, color=CYAN, size=15)

    if thermal:
        pulse = int(6 * math.sin(t * 8.0))
        box(
            d,
            (x + 90 - pulse, y + 68, x + w - 90 + pulse, y + 118),
            fill=CRIMSON_DIM,
            outline=CRIMSON,
            r=24,
            width=3,
        )
        text(d, (x + 125, y + 81), "!! THERMAL SPIKE (94.6 °C) OFF-AXIS: LOOK RIGHT [STATION C >>] !!", 19, "#ffdce2", bold=True)

    kf = anim_keyframe_tag(t)
    cx = x + w // 2
    cy = y + 465
    paste_rgba(im, PREVIEW_DIR / "workbench_pcb_3quarter.png", (cx, cy + 55), (620, 420))

    st_xs = [cx - 210, cx, cx + 210]
    st_files = [
        f"station_regulator_anim_{kf}.png",
        f"station_mcu_anim_{kf}.png",
        f"station_thermal_anim_{kf}.png",
    ]
    for i, sx in enumerate(st_xs):
        paste_rgba(im, PREVIEW_DIR / st_files[i], (sx, cy - 55), (220, 220))

    # Smoothly gliding 3D Signal Beacon & Logic Probe
    bx = st_xs[active_idx]
    bob = int(12 * math.sin(t * 4.5))
    paste_rgba(im, PREVIEW_DIR / "signal_beacon_front.png", (bx, cy - 235 + bob), (135, 135))
    paste_rgba(im, PREVIEW_DIR / "logic_probe_3quarter.png", (bx - 52, cy - 150 - bob // 2), (145, 185))

    d = ImageDraw.Draw(im)
    codes = ["ST-A: 5V BUCK", "ST-B: MCU BUS", "ST-C: THERMAL"]
    coords = ["(-12, -10, -108) cm", "(0, -10, -108) cm", "(+12, -10, -108) cm"]
    for i, sx in enumerate(st_xs):
        is_v = verified[i]
        is_a = i == active_idx
        col = CRIMSON if (i == 2 and thermal) else (EMERALD if is_v else (CYAN if is_a else MUTED))
        fill_c = CRIMSON_DIM if (i == 2 and thermal) else (EMERALD_DIM if is_v else (CYAN_DIM if is_a else PANEL))
        box(d, (sx - 96, y + h - 98, sx + 96, y + h - 30), fill=fill_c, outline=col, r=14, width=2)
        tag = "94.6°C ALERT" if (i == 2 and thermal) else ("PASS [OK]" if is_v else ("ACTIVE" if is_a else "PENDING"))
        text(d, (sx - 82, y + h - 88), f"{codes[i]}", 15, col, bold=True)
        text(d, (sx - 82, y + h - 62), f"{tag} · {coords[i]}", 12, INK)


def draw_scene(index, t, duration):
    im, d = base_frame(index, t, duration)

    if index == 0:
        # Chapter 1: The Problem (Schematic Whiplash vs Eyes-Up AR)
        cards = [
            ("LEFT HAND OCCUPIED", "Holding 380 °C soldering iron on live power stage", CRIMSON, CRIMSON_DIM),
            ("RIGHT HAND OCCUPIED", "Holding multimeter continuity probe on 0.5 mm IC pin", AMBER, AMBER_DIM),
            ("VOLTBENCH SPATIAL FIX", "3D pinout & voltage rails anchored directly on the PCB", EMERALD, EMERALD_DIM),
        ]
        for i, (kicker, desc, col, bg_c) in enumerate(cards):
            p = ease((t - 0.4 - i * 1.1) / 0.9)
            if p > 0:
                xx = 84 + int((1.0 - p) * 90)
                yy = 265 + i * 175
                box(d, (xx, yy, xx + 830, yy + 145), fill=CARD, outline=col, r=20, width=3)
                pill(d, xx + 24, yy + 20, f"0{i + 1} · {kicker}", fill=bg_c, color=col, size=16)
                wrap(d, (xx + 24, yy + 74), desc, 780, size=25, color=INK, bold=True)

        draw_workbench_stage(im, d, t, active_idx=0, verified=(False, False, False))

    elif index == 1:
        # Chapter 2: The 3 Strengths of Glasses (ar-design-rules.md)
        pillars = [
            ("1. SHARES YOUR VIEW", "Looks down at the exact PCB traces you are inspecting — zero mental rotation from a 2D laptop schematic.", CYAN),
            ("2. DRAWS IN THE WORLD", "6 canonical Blender voxel GLBs anchored at z = -108 cm in real-world centimeters with depthTest = true.", EMERALD),
            ("3. LEAVES YOUR BODY FREE", "Hands stay on physical tools; eyes stay up on energized hardware. Pinch is the new tap.", AMBER),
        ]
        for i, (title_p, body_p, col) in enumerate(pillars):
            p = ease((t - 0.3 - i * 1.2) / 0.9)
            if p > 0:
                xx = 84 + int((1.0 - p) * 80)
                yy = 260 + i * 215
                box(d, (xx, yy, xx + 830, yy + 188), fill=CARD, outline=col, r=20, width=2)
                text(d, (xx + 26, yy + 22), title_p, 26, col, bold=True)
                wrap(d, (xx + 26, yy + 68), body_p, 775, size=22, color=INK)

        active_cycle = int((t / 2.2) % 3)
        draw_workbench_stage(im, d, t, active_idx=active_cycle, verified=(active_cycle > 0, active_cycle > 1, False))

    elif index == 2:
        # Chapter 3: SPECS 37x32° FOV Diagram & Explicit Preview Stand-ins
        box(d, (84, 260, 920, 940), fill=CARD, outline=CYAN, r=24, width=2)
        pill(d, 112, 286, "OPTICAL WAVEGUIDE FOV MAP (TOP-DOWN)", fill=CYAN_DIM, color=CYAN, size=17)

        # Animated FOV cone from Wearer (bottom center of diagram) to z = -110 cm focal plane
        wearer_xy = (502, 865)
        left_fov = (170, 410)
        right_fov = (834, 410)
        cone_p = ease(t / 1.1)
        arrow(d, wearer_xy, left_fov, color=CYAN, width=3, progress=cone_p)
        arrow(d, wearer_xy, right_fov, color=CYAN, width=3, progress=cone_p)
        d.line([left_fov, right_fov], fill=AMBER, width=3)
        text(d, (335, 372), "z = -110 cm Focal Plane (53 × 77 cm)", 20, AMBER, bold=True)
        pill(d, 412, 880, "WEARER GLASSES (0, 0, 0)", fill=PANEL, color=INK, size=15)

        # Show Left Dock (-21 cm), Center PCB (0 cm), Right Inspector (+21 cm)
        nodes = [
            (150, 450, 210, 120, "Left UIKit Dock", "(-21, -1, -110) cm", CYAN),
            (395, 450, 215, 120, "3D PCB & Stations", "(0, -14, -110) cm", EMERALD),
            (645, 450, 210, 120, "Right Inspector UI", "(+21, -1, -110) cm", CYAN),
        ]
        for nx, ny, nw, nh, n_title, n_pos, ncol in nodes:
            box(d, (nx, ny, nx + nw, ny + nh), fill=PANEL, outline=ncol, r=16, width=2)
            text(d, (nx + 16, ny + 24), n_title, 19, ncol, bold=True)
            text(d, (nx + 16, ny + 62), n_pos, 16, INK)

        box(d, (130, 620, 874, 830), fill="#0d131f", outline=AMBER, r=18, width=2)
        text(d, (156, 642), "PREVIEW LIMITS STAND-IN PATTERN (preview-limits.md)", 20, AMBER, bold=True)
        wrap(
            d,
            (156, 682),
            "• [Simulate Probe Contact] stands in for BLE multimeter probe continuity.\n• [Simulate Thermal Spike] stands in for off-axis IR thermal camera threshold.",
            700,
            size=21,
            color=INK,
        )

        capture_card(im, d, "01_workbench_overview.png", 965, 320, w=870, h=490, badge="CRITERION 1: FOV & STAND-IN DOCK")
        pill(d, 965, 845, "ADDITIVE DISPLAY: BLACK = TRANSPARENT", fill=CYAN_DIM, color=CYAN, size=18)
        pill(d, 1435, 845, "ALL TARGETS >= 6 CM", fill=EMERALD_DIM, color=EMERALD, size=18)

    elif index == 3:
        # Chapter 4: Probe Continuity & Auto-Advancing 3D Beacon
        stage = 0 if t < 2.5 else (1 if t < 5.5 else 2)
        ver = (stage >= 1, stage >= 2, False)
        active = min(2, stage)
        draw_workbench_stage(im, d, t, active_idx=active, verified=ver, thermal=False)

        steps = [
            ("STEP 1 · PINCH [SIMULATE PROBE CONTACT]", "Station A (5V Buck): Locks 5.02 V DC | Ripple 11 mV [PASS]", stage >= 1),
            ("STEP 2 · AUTO-ADVANCE 3D BEACON TO ST-B", "Beacon glides from (-12, 2, -108) -> (0, 2, -108) cm automatically", stage >= 1),
            ("STEP 3 · PROBE STATION B (48 MHz MCU BUS)", "Locks 48.00 MHz CMOS clock [SYNC] & advances beacon to Station C", stage >= 2),
        ]
        for i, (st_title, st_desc, done) in enumerate(steps):
            yy = 265 + i * 215
            col = EMERALD if done else CYAN
            box(d, (84, yy, 920, yy + 185), fill=CARD, outline=col, r=20, width=3 if done else 2)
            pill(d, 110, yy + 22, "VERIFIED [PASS]" if done else "ACTIVE STEP", fill=EMERALD_DIM if done else CYAN_DIM, color=col, size=16)
            text(d, (110, yy + 76), st_title, 23, col, bold=True)
            wrap(d, (110, yy + 114), st_desc, 780, size=20, color=INK)

    elif index == 4:
        # Chapter 5: Out-of-FOV Thermal Runaway & Directional Arrow Resolution
        resolved = t > duration * 0.64
        draw_workbench_stage(
            im,
            d,
            t,
            active_idx=2 if t > duration * 0.35 else 0,
            verified=(True, True, resolved),
            thermal=not resolved,
        )

        box(d, (84, 260, 920, 565), fill=CRIMSON_DIM if not resolved else EMERALD_DIM, outline=CRIMSON if not resolved else EMERALD, r=22, width=3)
        pill(
            d,
            112,
            286,
            "HABIT 4: OUT-OF-FOV ATTENTION CUE",
            fill=PANEL,
            color=CRIMSON if not resolved else EMERALD,
            size=17,
        )
        if not resolved:
            text(d, (112, 345), "94.6 °C OVERHEAT!", 64, CRIMSON, serif=True, bold=True)
            wrap(
                d,
                (112, 435),
                "Station C (+12 cm right) spikes outside central focus. VoltBench plays sfx_thermal_alert.wav (LowLatency) + shows directional HUD arrow [STATION C >>].",
                770,
                size=21,
                color=INK,
            )
        else:
            text(d, (112, 345), "41.8 °C NOMINAL", 64, EMERALD, serif=True, bold=True)
            wrap(
                d,
                (112, 435),
                "Wearer follows the directional arrow to Station C and pinches [Simulate Probe Contact]. Gate bias calibrates & hazard banner clears.",
                770,
                size=21,
                color=INK,
            )

        capture_card(
            im,
            d,
            "03_off_fov_thermal_alert.png" if not resolved else "05_leaf_test_suite_5_of_5_pass.png",
            84,
            625,
            w=836,
            h=315,
            badge="CRITERION 4: DIRECTIONAL HAZARD CUE",
        )

    elif index == 5:
        # Chapter 6: Progressive Disclosure (Focus Mode)
        focused = t > 2.2
        for idx_card, (x_c, title_c, is_foc) in enumerate([(84, "STANDARD INSPECTOR MODE", False), (520, "EYES-UP FOCUS MODE", True)]):
            active_card = (is_foc and focused) or (not is_foc and not focused)
            col = EMERALD if active_card else LINE
            box(d, (x_c, 260, x_c + 405, 920), fill=CARD, outline=col, r=22, width=3 if active_card else 2)
            pill(d, x_c + 22, 285, title_c, fill=EMERALD_DIM if active_card else PANEL, color=EMERALD if active_card else MUTED, size=16)
            box(d, (x_c + 22, 348, x_c + 383, 425), fill=PANEL, outline=CYAN, r=14)
            text(d, (x_c + 38, 374), "Station C: MOSFET Stage", 22, INK, bold=True)

            if not is_foc:
                for r_i, r_txt in enumerate(["Pinout: TP3 Q4 DRAIN / NTC", "Spec: < 65.0 °C @ 2.4A Load", "Coach: Probe TP3 thermistor pad", "Telemetry: 41.8 °C [NOMINAL]"]):
                    ry = 450 + r_i * 92
                    box(d, (x_c + 22, ry, x_c + 383, ry + 74), fill="#0d131f", outline=LINE, r=12)
                    text(d, (x_c + 36, ry + 24), r_txt, 18, INK)
            else:
                box(d, (x_c + 22, 455, x_c + 383, 565), fill=CYAN_DIM, outline=CYAN, r=16, width=2)
                text(d, (x_c + 38, 478), "FOCUS MODE: COMPACT HUD", 19, CYAN, bold=True)
                text(d, (x_c + 38, 514), "Secondary rows collapsed!", 18, INK)
                box(d, (x_c + 22, 600, x_c + 383, 860), fill="#0b101a", outline=EMERALD, r=16, width=2)
                wrap(
                    d,
                    (x_c + 38, 635),
                    "Unobstructed view of physical solder joints while hands are actively working.",
                    325,
                    size=22,
                    color=EMERALD,
                    bold=True,
                )

        capture_card(im, d, "04_focus_mode_progressive_disclosure.png", 965, 320, w=870, h=490, badge="CRITERION 5: PROGRESSIVE DISCLOSURE")
        pill(d, 965, 845, "HABIT 2: SHOW ONLY WHEN NEEDED; RECEDE WHEN DONE", fill=CYAN_DIM, color=CYAN, size=17)

    elif index == 6:
        # Chapter 7: CLAD Architecture & 5/5 LEAF Automated Scenario Suite
        scenarios = [
            ("Criterion 1: Spatial Workbench & FOV Layout", "6 GLB meshes + 2 UIKit Frames inside z = -110 cm"),
            ("Criterion 2: Direct 3D Station Pinch & Beacon", "SIK Interactable pinch re-anchors signal_beacon.glb"),
            ("Criterion 3: Probe Continuity & 3/3 Completion", "Stand-in button + 3D probe lock 3/3 stations PASS"),
            ("Criterion 4: Out-of-FOV Thermal Alert & Cue", "94.6 °C spike fires chime + arrow; probe resolves"),
            ("Criterion 5: Focus Mode, Reset & IK Reachability", "createIKInteractor() verifies hand reachability"),
        ]
        for i, (s_title, s_sub) in enumerate(scenarios):
            p = ease((t - i * 0.7) / 0.7)
            if p > 0:
                xx = 84 + int((1.0 - p) * 70)
                yy = 255 + i * 134
                box(d, (xx, yy, xx + 845, yy + 118), fill=CARD, outline=EMERALD, r=18, width=2)
                pill(d, xx + 20, yy + 18, "LEAF PASS [OK]", fill=EMERALD_DIM, color=EMERALD, size=15)
                text(d, (xx + 195, yy + 22), s_title, 21, INK, bold=True)
                text(d, (xx + 24, yy + 72), s_sub, 18, MUTED)

        capture_card(im, d, "05_leaf_test_suite_5_of_5_pass.png", 965, 290, w=870, h=490, badge="LEAF.LSPKG: 5 / 5 SCENARIOS PASSING")
        box(d, (965, 800, 1835, 925), fill=EMERALD_DIM, outline=EMERALD, r=18, width=2)
        text(d, (992, 822), "CLAD PHASE 3C STATIC VERIFICATION: 100% PASS (0 VIOLATIONS)", 20, EMERALD, bold=True)
        text(d, (992, 862), "requireAsset: OK · UIKit *UI.ts isolation: OK · LowPower/LowLatency Audio: OK · @input: OK", 17, INK)

    else:
        # Chapter 8: Closing Hero Summary
        d.rectangle((0, 0, W, H), fill="#070b12")
        pill(d, 84, 52, "LEARN AR WITH SPECS HACKATHON · SNAP INC.", fill=CYAN_DIM, color=CYAN, size=18)
        lines = [
            "Eyes on the board.",
            "Hands on the tools.",
            "Proven in Spectacles Preview.",
        ]
        for i, line in enumerate(lines):
            p = ease((t - i * 0.7) / 0.9)
            if p > 0:
                text(d, (84 + int((1.0 - p) * 70), 160 + i * 100), line, 50, INK if i < 2 else CYAN, serif=True, bold=True)

        badges = [
            ("status: approved", "devpost/design-brief.md", CYAN, CYAN_DIM),
            ("6 Blender 4.4 GLBs", "Normalized + AABB Colliders", EMERALD, EMERALD_DIM),
            ("5 Synthesized WAVs", "LowPower Loop + LowLatency SFX", AMBER, AMBER_DIM),
            ("5 / 5 LEAF Scenarios", "Logic Proven + IK Hand Tested", EMERALD, EMERALD_DIM),
        ]
        for i, (b_top, b_bot, col, bg_c) in enumerate(badges):
            bx = 84 + (i % 2) * 425
            by = 530 + (i // 2) * 155
            box(d, (bx, by, bx + 400, by + 132), fill=bg_c, outline=col, r=18, width=2)
            text(d, (bx + 24, by + 26), b_top, 26, col, bold=True)
            text(d, (bx + 24, by + 72), b_bot, 19, INK)

        draw_workbench_stage(im, d, t, active_idx=2, verified=(True, True, True), thermal=False)

    return im.convert("RGB")


def audio_duration(scene):
    mp3_path = DEMO_DIR / f"audio/{scene['id']}.mp3"
    out = subprocess.check_output(
        [
            "/opt/homebrew/bin/ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=nw=1:nk=1",
            str(mp3_path),
        ]
    )
    return float(out.decode().strip()) + 0.45


def fmt_srt_time(seconds):
    ms = int(round((seconds - int(seconds)) * 1000))
    s = int(seconds) % 60
    m = (int(seconds) // 60) % 60
    h = int(seconds) // 3600
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_srt(durations):
    srt_lines = []
    cur = 0.0
    for i, (scene, dur) in enumerate(zip(SCENES, durations), start=1):
        start_s = cur + 0.1
        end_s = cur + dur - 0.15
        srt_lines.append(f"{i}\n{fmt_srt_time(start_s)} --> {fmt_srt_time(end_s)}\n{scene['text']}\n")
        cur += dur
    srt_path = DEMO_DIR / "voltbench-captions.srt"
    srt_path.write_text("\n".join(srt_lines), encoding="utf8")
    return srt_path


if "--preview" in sys.argv:
    contact = Image.new("RGB", (1920, 1080), BG)
    for i, s in enumerate(SCENES):
        dur = audio_duration(s)
        im = draw_scene(i, dur * 0.65, dur)
        im.save(DEMO_DIR / f"motion-{i + 1:02d}-qa.png")
        thumb = im.resize((480, 270), Image.Resampling.LANCZOS)
        contact.paste(thumb, ((i % 4) * 480, (i // 4) * 540 + 135))
    contact.save(DEMO_DIR / "motion-contact-sheet.png")
    print("Motion QA previews and contact sheet generated.")
    sys.exit(0)

durations = [audio_duration(s) for s in SCENES]
srt_path = write_srt(durations)

clip_files = []
for i, (s, duration) in enumerate(zip(SCENES, durations)):
    clip_path = CLIPS_DIR / f"{s['id']}.mp4"
    narration_mp3 = DEMO_DIR / f"audio/{s['id']}.mp3"
    bg_wav = SFX_DIR / "bg_lab_ambient.wav"

    # Mix narration (foreground) + ducked ambient synth-lab loop (background)
    filter_complex = (
        "[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,apad=pad_dur=0.45[vo];"
        "[2:a]aloop=loop=-1:size=2e+09,volume=0.12[bg];"
        "[vo][bg]amix=inputs=2:duration=first:dropout_transition=2[aout]"
    )
    cmd = [
        "/opt/homebrew/bin/ffmpeg",
        "-y",
        "-v", "error",
        "-f", "rawvideo",
        "-pix_fmt", "rgb24",
        "-s", f"{W}x{H}",
        "-r", str(FPS),
        "-i", "pipe:0",
        "-i", str(narration_mp3),
        "-i", str(bg_wav),
        "-filter_complex", filter_complex,
        "-map", "0:v",
        "-map", "[aout]",
        "-t", f"{duration:.3f}",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "19",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-ar", "48000",
        "-ac", "2",
        "-movflags", "+faststart",
        str(clip_path),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    total_frames = math.ceil(duration * FPS)
    try:
        for frame_idx in range(total_frames):
            frame_rgb = draw_scene(i, frame_idx / FPS, duration)
            proc.stdin.write(frame_rgb.tobytes())
        proc.stdin.close()
        rc = proc.wait()
        if rc != 0:
            raise RuntimeError(f"FFmpeg failed on {s['id']} with code {rc}")
    except BaseException:
        proc.kill()
        raise
    clip_files.append(f"file '{clip_path}'")
    print(f"Rendered motion chapter {i + 1}/{len(SCENES)}: {s['id']} ({duration:.1f}s, {total_frames} frames)", flush=True)

concat_txt = CLIPS_DIR / "concat.txt"
concat_txt.write_text("\n".join(clip_files) + "\n", encoding="utf8")

final_demo_mp4 = DEMO_DIR / "voltbench-motion-demo.mp4"
devpost_demo_mp4 = ROOT / "devpost/voltbench-demo.mp4"

subprocess.run(
    [
        "/opt/homebrew/bin/ffmpeg",
        "-y",
        "-v", "error",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_txt),
        "-i", str(srt_path),
        "-map", "0:v",
        "-map", "0:a",
        "-map", "1:s",
        "-c:v", "copy",
        "-c:a", "copy",
        "-c:s", "mov_text",
        "-metadata:s:s:0", "language=eng",
        "-movflags", "+faststart",
        str(final_demo_mp4),
    ],
    check=True,
)

# Copy to devpost/voltbench-demo.mp4 and save poster + contact sheet
devpost_demo_mp4.write_bytes(final_demo_mp4.read_bytes())
poster = draw_scene(0, durations[0] * 0.7, durations[0])
poster.save(DEMO_DIR / "voltbench-motion-poster.jpg", quality=92)
print(f"=== COMPLETED MOTION DEMO VIDEO: {devpost_demo_mp4} ({sum(durations):.1f}s total) ===", flush=True)
