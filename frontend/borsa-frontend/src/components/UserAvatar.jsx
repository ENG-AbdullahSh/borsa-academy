import { useState } from 'react';

// ─────────────────────────────────────────────────────────────
// AVATAR COLOR PALETTE — curated for dark themes
// Each entry: [background, text/initials color]
// ─────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ['#1E3A5F', '#81cfff'], // electric blue
  ['#1A3828', '#75ff9e'], // cyber green
  ['#3B2F4A', '#C084FC'], // violet
  ['#3B2020', '#F87171'], // crimson
  ['#2A2818', '#FBBF24'], // amber
  ['#1A3040', '#34D399'], // teal
  ['#2D2020', '#FB923C'], // orange
  ['#1F1F3A', '#818CF8'], // indigo
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Returns a deterministic color pair based on the name string. */
function getColorForName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Extracts initials from a full name.
 * 'Abdullah Shaher' → 'AS'
 * 'Abdullah'        → 'A'
 * ''                → '?'
 */
function getInitials(name = '') {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
//
// PRIORITY LOGIC (in order):
//   1. avatarUrl is provided AND hasn't failed to load
//      → Render <img> with the uploaded photo
//   2. avatarUrl is null / empty / file returned 404
//      → Render initials fallback circle
//
// The `imgFailed` state is the critical bridge between both:
//   - Starts as false (assume image is valid)
//   - Set to true via onError if the file is broken/missing
//   - Once true, the initials fallback is shown permanently
// ─────────────────────────────────────────────────────────────

/**
 * UserAvatar
 *
 * @param {string}  name      - User's full name (for initials + color)
 * @param {string?} avatarUrl - Full URL from backend `avatar_url` field
 * @param {number}  size      - Diameter in px (default: 40)
 * @param {string}  className - Extra CSS classes
 * @param {object}  style     - Extra inline styles
 */
export default function UserAvatar({
  name = '',
  avatarUrl = null,
  size = 40,
  className = '',
  style = {},
}) {
  // ── STEP 1: Track whether the image URL has failed ───────────
  const [imgFailed, setImgFailed] = useState(false);

  // ── STEP 2: Decide which branch to render ────────────────────
  //   CONDITION: avatarUrl must be a non-empty string AND not failed
  const shouldShowImage = Boolean(avatarUrl) && !imgFailed;

  // ── STEP 3: Prepare initials fallback data ────────────────────
  const initials = getInitials(name);
  const [bgColor, textColor] = getColorForName(name);

  // ── Shared container style ────────────────────────────────────
  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    flexShrink: 0,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  };

  // ════════════════════════════════════════════════════════
  // BRANCH A: Render the user's uploaded image
  // Triggered when: avatarUrl is valid AND imgFailed === false
  // ════════════════════════════════════════════════════════
  if (shouldShowImage) {
    return (
      <div style={containerStyle} className={className}>
        <img
          src={avatarUrl}
          alt={name || 'User avatar'}
          // ── KEY: If this fires (404/network error), flip imgFailed
          //    to true. React re-renders → falls into BRANCH B below.
          onError={() => setImgFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // BRANCH B: Render initials fallback circle
  // Triggered when: avatarUrl is null/empty OR imgFailed === true
  // ════════════════════════════════════════════════════════
  return (
    <div
      className={className}
      title={name}
      aria-label={`صورة ${name}`}
      style={{
        ...containerStyle,
        background: bgColor,
        border: `1px solid ${textColor}33`,
      }}
    >
      <span
        style={{
          color: textColor,
          fontWeight: 700,
          fontSize: `${Math.round(size * 0.38)}px`,
          fontFamily: 'var(--font-sans, "Cairo", sans-serif)',
          lineHeight: 1,
          userSelect: 'none',
          letterSpacing: '0.03em',
        }}
      >
        {initials}
      </span>
    </div>
  );
}
