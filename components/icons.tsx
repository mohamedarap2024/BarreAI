import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function IconPlus(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function IconSearch(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  );
}
export function IconMenu(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
export function IconChevronLeft(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
/** ChatGPT-style open/close sidebar control */
export function IconSidebar(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </svg>
  );
}
export function IconSidebarOpen(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16M13 9l3 3-3 3" />
    </svg>
  );
}
export function IconMore(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}
export function IconPencil(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
export function IconTrash(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  );
}
/** Clear light-mode / sun control */
export function IconSun(p: IconProps) {
  return (
    <svg {...base({ strokeWidth: 1.75, ...p })}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77" />
    </svg>
  );
}
export function IconMoon(p: IconProps) {
  return (
    <svg {...base({ strokeWidth: 1.75, ...p })}>
      <path d="M21 14.2A8.4 8.4 0 1 1 9.8 3a6.8 6.8 0 0 0 11.2 11.2Z" />
    </svg>
  );
}
/** Explicit light-mode switch (sun with soft glow ring) */
export function IconLightMode(p: IconProps) {
  return (
    <svg {...base({ strokeWidth: 1.75, ...p })}>
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="12" cy="12" r="7" opacity="0.35" />
      <path d="M12 1.8v1.8M12 20.4v1.8M1.8 12h1.8M20.4 12h1.8M4.4 4.4l1.3 1.3M18.3 18.3l1.3 1.3M4.4 19.6l1.3-1.3M18.3 5.7l1.3-1.3" />
    </svg>
  );
}
export function IconUser(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}
export function IconSettings(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}
export function IconLogout(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  );
}
export function IconCopy(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
export function IconCheck(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}
export function IconRefresh(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}
export function IconArrowUp(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
export function IconStop(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="7" y="7" width="10" height="10" rx="1" fill="currentColor" />
    </svg>
  );
}
export function IconLightbulb(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M9 18h6M10 22h4M8 14a5 5 0 1 1 8 0c-.8.9-1.3 1.6-1.5 2.5H9.5C9.3 15.6 8.8 14.9 8 14Z" />
    </svg>
  );
}
export function IconPen(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
export function IconCode(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  );
}
export function IconTranslate(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M5 8h8M9 8c0 5-2 8-6 10M12 8c0 5 2 8 6 10" />
      <path d="m14 20 4-10 4 10M15.5 16h5" />
    </svg>
  );
}
