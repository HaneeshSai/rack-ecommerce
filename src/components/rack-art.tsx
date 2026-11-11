// Decorative rack illustration. `units` controls how many 1U slots are drawn.
export function RackArt({ units = 12, className = "", dark = false }: { units?: number; className?: string; dark?: boolean }) {
  const n = Math.max(2, Math.min(units, 24));
  const slot = 14;
  const h = n * slot + 24;
  const frame = dark ? "#33466f" : "#cbd2e0";
  const fill = dark ? "#16264a" : "#eef1f7";
  const unit = dark ? "#22345e" : "#ffffff";
  const stroke = dark ? "#3d5287" : "#d5dbe7";
  return (
    <svg viewBox={`0 0 120 ${h}`} className={className} role="img" aria-label={`${units}U rack`} preserveAspectRatio="xMidYMid meet">
      <rect x="6" y="2" width="108" height={h - 4} rx="6" fill={fill} stroke={frame} strokeWidth="3" />
      <rect x="14" y="10" width="92" height={h - 20} rx="3" fill={dark ? "#0c1730" : "#dfe4ee"} />
      {Array.from({ length: n }).map((_, i) => {
        const y = 12 + i * slot;
        const lit = (i * 7 + n) % 5 === 0;
        return (
          <g key={i}>
            <rect x="17" y={y} width="86" height={slot - 3} rx="2" fill={unit} stroke={stroke} strokeWidth="0.8" />
            <rect x="22" y={y + 3.5} width="34" height="2" rx="1" fill={stroke} />
            <circle cx="92" cy={y + (slot - 3) / 2} r="1.7" fill={lit ? "#f26a1b" : "#34d399"} className={lit ? "led" : undefined} />
            <circle cx="97" cy={y + (slot - 3) / 2} r="1.7" fill={dark ? "#3d5287" : "#c3cbdb"} />
          </g>
        );
      })}
    </svg>
  );
}
