# EZ-Claw UI Design System (Premium OLED)

This document defines the visual language and design tokens used in the EZ-Claw renovation.

## Visual Identity (OLED-Centric)

The system is optimized for OLED displays with true black backgrounds, neon accents, and high-contrast typography.

### 1. Color Palette (True-Black/Neon)

| Token | HSL / Value | Purpose |
| :--- | :--- | :--- |
| **`--color-bg`** | `#000000` | True-Black background for OLED power savings. |
| **`--color-primary`** | `#7C3AED` | Vibrant violet for accent buttons and icons. |
| **`--color-secondary`** | `#2DD4BF` | Teal for success status and terminal output. |
| **`--color-surface-base`** | `hsl(240, 10%, 8%)` | Elevated surface for bubbles and modals. |
| **`--color-surface-elevated`** | `hsl(240, 10%, 12%)` | Higher elevation for active items and inputs. |

### 2. Typography

- **Primary**: `Inter` / `Outfit` / `Roboto` (San-serif) — High readability.
- **Mono**: `JetBrains Mono` / `Fira Code` (Monospace) — Clear coding and terminal text.

### 3. Surface & Elevation

- **Borders**: All borders are low-contrast ( `rgba(255,255,255,0.05)` to `0.15`) to maintain the OLED feel.
- **Shadows**: Large, soft glows using `--color-primary-glow` instead of traditional black shadows.
- **Radii**: Soft corners (`8px` to `16px`) for a premium modern app feel.

## Component Implementation Rules

1.  **Never Use Pure Gray**: Always tint grays with a hint of blue or violet (`hsl(240, 10%, ...)`).
2.  **Neon Glows**: Use `box-shadow: 0 0 10px var(--color-glow)` sparingly for active states or notifications.
3.  **Perfect Black Integration**: Borders should only appear when surfaces overlap or to define layout edges.
4.  **Transitions**: All interactive elements MUST have a `var(--transition-fast)` (150ms) hover/active animation.

## UI Tokens Usage

- **Primary Glow**: `rgba(124, 58, 237, 0.4)`
- **Secondary Glow**: `rgba(45, 212, 191, 0.3)`
- **Error Glow**: `rgba(244, 63, 94, 0.3)`
