// Hand-drawn, geometric line-art — no photos or stock icon sets. Each
// illustration abstracts the actual mechanic it represents (the
// neck-torso angle scoring.ts measures, a GSR/PPG waveform, the
// posture/hydration correlation the dashboard charts) rather than a
// generic stand-in icon.

function ViewfinderCorners() {
  return (
    <g stroke="currentColor" className="text-text-dim" strokeWidth={1.5} fill="none">
      <path d="M14 30V16h14" />
      <path d="M226 30V16h-14" />
      <path d="M14 170v14h14" />
      <path d="M226 170v14h-14" />
    </g>
  );
}

export function PostureIllustration() {
  return (
    <svg viewBox="0 0 240 200" className="h-full w-full" fill="none" aria-hidden>
      <ViewfinderCorners />

      {/* Reference vertical (the "perpendicular to the shoulder line" axis) */}
      <line x1="120" y1="30" x2="120" y2="95" stroke="currentColor" className="text-text-dim" strokeWidth={1} strokeDasharray="3 4" />

      {/* Measured angle arc, between the reference line and the neck line */}
      <path d="M120 80a15 15 0 0 1 9 14" stroke="currentColor" className="text-text-dim" strokeWidth={1} strokeDasharray="3 4" />

      {/* Head */}
      <circle cx="120" cy="52" r="18" className="stroke-posture" strokeWidth={1.75} />

      {/* Neck */}
      <line x1="120" y1="70" x2="129" y2="94" className="stroke-posture" strokeWidth={1.75} strokeLinecap="round" />

      {/* Shoulder line */}
      <line x1="76" y1="100" x2="164" y2="100" className="stroke-posture" strokeWidth={1.75} strokeLinecap="round" />
      <circle cx="76" cy="100" r="3.5" className="fill-posture" />
      <circle cx="164" cy="100" r="3.5" className="fill-posture" />

      {/* Torso */}
      <path d="M76 100 84 172M164 100 156 172" className="stroke-posture" strokeWidth={1.75} strokeLinecap="round" />
    </svg>
  );
}

export function HydrationIllustration() {
  return (
    <svg viewBox="0 0 240 200" className="h-full w-full" fill="none" aria-hidden>
      {/* Mouse body */}
      <path
        d="M70 45c24 0 38 20 38 55v30c0 24-17 40-38 40s-38-16-38-40V100c0-35 14-55 38-55Z"
        className="stroke-hydration"
        strokeWidth={1.75}
      />
      <line x1="70" y1="45" x2="70" y2="95" className="stroke-hydration" strokeWidth={1.75} strokeLinecap="round" />
      <line x1="70" y1="60" x2="70" y2="76" className="stroke-hydration" strokeWidth={2.5} strokeLinecap="round" />

      {/* GSR/PPG waveform streaming off the mouse */}
      <path
        d="M118 120h20l8-28 10 50 9-36 8 14h57"
        className="stroke-hydration"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Wireless signal arcs */}
      <g stroke="currentColor" className="text-text-dim" strokeWidth={1.5} strokeLinecap="round">
        <path d="M150 55a34 34 0 0 1 40 0" />
        <path d="M160 66a20 20 0 0 1 22 0" />
      </g>
      <circle cx="171" cy="78" r="3" className="fill-text-dim" />
    </svg>
  );
}

export function DashboardIllustration() {
  return (
    <svg viewBox="0 0 240 200" className="h-full w-full" fill="none" aria-hidden>
      {/* Axes */}
      <path d="M24 26v144h192" stroke="currentColor" className="text-text-dim" strokeWidth={1} />

      {/* Posture trace */}
      <path
        d="M24 140 64 118 104 88 144 98 184 66 216 58"
        className="stroke-posture"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Hydration trace */}
      <path
        d="M24 150 64 128 104 108 144 78 184 90 216 48"
        className="stroke-hydration"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Correlation highlight, where the two traces converge */}
      <circle cx="144" cy="88" r="13" stroke="currentColor" className="text-text-dim" strokeWidth={1} strokeDasharray="3 4" />
    </svg>
  );
}
