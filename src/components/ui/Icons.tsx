import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Shared stroke-based icon frame — 24x24, currentColor, 1.6 stroke. */
function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconLogo = (props: IconProps) => (
  <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
    <path
      d="M4 15.2 16 5l12 10.2"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 14v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V14"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M13 27v-7h6v7" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
  </svg>
);

export const IconSearch = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);

export const IconBed = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 18v-7h18v7" />
    <path d="M3 18v2M21 18v2M3 11V7" />
    <path d="M7 11V9a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M13 11V9a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
  </Icon>
);

export const IconBath = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3Z" />
    <path d="M6 12V6a2 2 0 0 1 4 0" />
    <path d="M9 6h2" />
    <path d="M7 19l-1 2M17 19l1 2" />
  </Icon>
);

export const IconArea = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M8 3v3M3 8h3M16 21v-3M21 16h-3" />
  </Icon>
);

export const IconHeart = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />
  </Icon>
);

export const IconPin = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </Icon>
);

export const IconPhone = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3h3l2 5-2.4 1.4a12 12 0 0 0 5 5L15 12l5 2v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4 5.2 2 2 0 0 1 6 3Z" />
  </Icon>
);

export const IconMail = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </Icon>
);

export const IconStar = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="m12 3.5 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.8l6-.8Z" />
  </svg>
);

export const IconChevronLeft = (p: IconProps) => (
  <Icon {...p}>
    <path d="m14.5 5-7 7 7 7" />
  </Icon>
);

export const IconChevronRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9.5 5 7 7-7 7" />
  </Icon>
);

export const IconChevronDown = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 9 7 7 7-7" />
  </Icon>
);

export const IconClose = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icon>
);

export const IconMenu = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);

export const IconExpand = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 9V4h5M20 15v5h-5M20 9V4h-5M4 15v5h5" />
  </Icon>
);

export const IconUpload = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 16V4M8 8l4-4 4 4" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </Icon>
);

export const IconTrash = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7M10 11v6M14 11v6" />
  </Icon>
);

export const IconSwap = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 8h13l-3-3M20 16H7l3 3" />
  </Icon>
);

export const IconWarning = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4.5 21 19.5H3Z" />
    <path d="M12 10v4M12 17h.01" />
  </Icon>
);

export const IconCheck = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Icon>
);

export const IconUser = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </Icon>
);

export const IconKey = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="12" r="4" />
    <path d="M12 12h9M17.5 12v3.5M20 12v2.5" />
  </Icon>
);

export const IconLeaf = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 19c0-8 5-13 14-13 0 9-5 14-12 14H5v-1Z" />
    <path d="M9 15c1.5-3 4-5 7-6.5" />
  </Icon>
);

export const IconCalendar = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="16" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Icon>
);

export const IconSofa = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
    <path d="M3 12a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v5H3Z" />
    <path d="M6 17v2M18 17v2" />
  </Icon>
);

export const IconCar = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 16v-3l2-5a2 2 0 0 1 1.9-1.3h8.2A2 2 0 0 1 18 8l2 5v3" />
    <path d="M4 13h16M4 16h16v2h-3v-2M7 18H4v-2" />
    <circle cx="7.5" cy="16.5" r=".8" fill="currentColor" />
    <circle cx="16.5" cy="16.5" r=".8" fill="currentColor" />
  </Icon>
);
