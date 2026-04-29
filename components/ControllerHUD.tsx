"use client";

type HUDProps = {
  visible: boolean;
  videoEnded: boolean;
  isExiting: boolean;
  hasHotspots: boolean;
  hasPrev: boolean;
  hasNext: boolean;
};

type LegendRow = {
  icons: { label: string; color: string }[];
  text: string;
};

function buildLegend(
  videoEnded: boolean,
  isExiting: boolean,
  hasHotspots: boolean,
  hasPrev: boolean,
  hasNext: boolean,
): LegendRow[] {
  if (isExiting) return [];

  const rows: LegendRow[] = [];

  if (hasPrev || hasNext) {
    rows.push({
      icons: [
        { label: "◀", color: "#C800FF" },
        { label: "▶", color: "#C800FF" },
      ],
      text: "Prev / Next Section",
    });
  }

  if (videoEnded && hasHotspots) {
    rows.push({
      icons: [
        { label: "▼", color: "#FBB100" },
        { label: "▲", color: "#FFA200" },
      ],
      text: "Select Hotspot",
    });
  }

  rows.push({
    icons: [
      { label: "X", color: "#0095FF" },
      { label: "B", color: "#FF0000" },
    ],
    text: "Prev / Next Tab",
  });

  if (videoEnded && hasHotspots) {
    rows.push({
      icons: [{ label: "A", color: "#00DD66" }],
      text: "Confirm",
    });
  }

  rows.push({
    icons: [{ label: "Y", color: "#FFA100" }],
    text: "Home",
  });

  return rows;
}

function IconBadge({ label, color }: { label: string; color: string }) {
  const isArrow = "◀▶▲▼".includes(label);
  const size = isArrow ? "w-4 h-4" : "w-4 h-4";
  const fontSize = isArrow ? "text-[9px]" : "text-[10px]";

  return (
    <span
      className={`${size} ${fontSize} inline-flex items-center justify-center rounded-sm text-white font-bold shrink-0`}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}


export default function ControllerHUD({
  visible,
  videoEnded,
  isExiting,
  hasHotspots,
  hasPrev,
  hasNext,
}: HUDProps) {
  const legend = buildLegend(videoEnded, isExiting, hasHotspots, hasPrev, hasNext);
  if (!visible || legend.length === 0) return null;

  return (
    <div className="controller-hud absolute top-8 left-8 z-50 pointer-events-none">
      <div className="hud-panel flex items-center gap-4 py-3">

        {/* Controller graphic */}
        <svg
          viewBox="0 0 610 424"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-32.5 h-auto shrink-0"
        >
          {/* Body */}
          <path
            d="M190.517 304.5L159.517 324.5L75.017 422H50.017L20.017 400.5L5.517 367.5L2.017 324.5L20.017 240L75.017 82L95.017 47L138.517 25.5L228.017 13H375.082L467.13 25.5L511.869 47L532.438 82L589.005 240L607.517 324.5L603.917 367.5L589.005 400.5L558.15 422H532.438L445.532 324.5L413.649 304.5H190.517Z"
            fill="#1a1a1a" stroke="white" strokeWidth="2.5" strokeOpacity="0.3"
          />
          {/* Bumpers */}
          <path d="M121.517 20.5L104.517 38.5L141.017 26L207.517 13.5L200.017 4H160.517Z" fill="#0095FF" fillOpacity="0.7" />
          <path d="M488.517 20.5L505.517 38.5L469.017 26L402.517 13.5L410.017 4H449.517Z" fill="#FF0000" fillOpacity="0.7" />
          {/* Y */}
          <circle cx="463.5" cy="78" r="21" fill="#FFA100" fillOpacity="0.85" />
          <path d="M454.969 68.5455H459.682L463.372 75.8494H463.526L467.216 68.5455H471.929L465.546 80.1705V86H461.352V80.1705L454.969 68.5455Z" fill="white" />
          {/* X */}
          <circle cx="421.5" cy="118" r="21" fill="#0095FF" fillOpacity="0.85" />
          <path d="M418.108 109.545L421.296 115.06H421.432L424.653 109.545H429.375L424.108 118.273L429.546 127H424.705L421.432 121.426H421.296L418.023 127H413.216L418.628 118.273L413.352 109.545H418.108Z" fill="white" />
          {/* B */}
          <circle cx="505.5" cy="118" r="21" fill="#FF0000" fillOpacity="0.85" />
          <path d="M498.838 127V109.545H506.117C507.423 109.545 508.517 109.73 509.398 110.099C510.284 110.469 510.949 110.986 511.392 111.651C511.841 112.315 512.065 113.085 512.065 113.96C512.065 114.625 511.926 115.219 511.648 115.741C511.369 116.259 510.986 116.688 510.497 117.028C510.009 117.369 509.443 117.608 508.801 117.744V117.915C509.506 117.949 510.156 118.139 510.753 118.486C511.355 118.832 511.838 119.315 512.202 119.935C512.565 120.548 512.747 121.276 512.747 122.116C512.747 123.054 512.509 123.892 512.031 124.631C511.554 125.364 510.864 125.943 509.96 126.369C509.057 126.79 507.96 127 506.671 127H498.838ZM503.057 123.599H505.665C506.58 123.599 507.253 123.426 507.685 123.08C508.122 122.733 508.341 122.25 508.341 121.631C508.341 121.182 508.236 120.795 508.026 120.472C507.815 120.142 507.517 119.889 507.131 119.713C506.744 119.531 506.281 119.44 505.742 119.44H503.057V123.599ZM503.057 116.722H505.392C505.852 116.722 506.261 116.645 506.619 116.491C506.977 116.338 507.256 116.116 507.455 115.827C507.659 115.537 507.761 115.188 507.761 114.778C507.761 114.193 507.554 113.733 507.139 113.398C506.724 113.063 506.165 112.895 505.46 112.895H503.057V116.722Z" fill="white" />
          {/* A */}
          <circle cx="463.5" cy="160" r="21" fill="#00DD66" fillOpacity="0.85" />
          <path d="M459.614 169H455.08L460.969 151.545H466.585L472.474 169H467.94L463.841 155.943H463.705L459.614 169ZM459.009 162.131H468.486V165.335H459.009V162.131Z" fill="white" />
          {/* D-pad */}
          <rect x="212.5" y="199" width="30" height="30" fill="#404040" />
          <rect x="212.5" y="169" width="30" height="30" fill="#FFA200" fillOpacity="0.7" />
          <rect x="182.5" y="199" width="30" height="30" fill="#C800FF" fillOpacity="0.7" />
          <rect x="242.5" y="199" width="30" height="30" fill="#C800FF" fillOpacity="0.7" />
          <rect x="212.5" y="229" width="30" height="30" fill="#FBB100" fillOpacity="0.7" />
          <polygon points="227.5,174 216.5,193 238.5,193" fill="white" />
          <polygon points="227.5,254 216.5,235 238.5,235" fill="white" />
          <polygon points="267.5,214 248.5,203 248.5,225" fill="white" />
          <polygon points="188.5,214 207.5,203 207.5,225" fill="white" />
          {/* Sticks */}
          <circle cx="151.5" cy="115" r="28" fill="#333" />
          <circle cx="387.5" cy="209" r="28" fill="#333" />
          {/* Menu / Select / Guide */}
          <circle cx="262.5" cy="115" r="12" fill="#333" />
          <circle cx="350.5" cy="115" r="12" fill="#333" />
          <ellipse cx="306.5" cy="148" rx="14" ry="12" fill="#333" />
          <circle cx="306.5" cy="55" r="22" fill="#D9D9D9" fillOpacity="0.15" />
        </svg>

        {/* Legend */}
        <div className="legend flex flex-col gap-2">
          {legend.map((row) => (
            <div key={row.text} className="legend-row flex items-center gap-2">
              <div className="legend-icons flex items-center gap-0.5">
                {row.icons.map((icon, i) => (
                  <IconBadge key={i} label={icon.label} color={icon.color} />
                ))}
              </div>
              <span className="legend-text text-[10px] font-medium whitespace-nowrap">
                {row.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}