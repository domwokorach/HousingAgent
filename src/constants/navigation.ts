/** Route paths in one place, so links never drift from the app directory. */
export const ROUTES = {
  home: "/",
  properties: "/properties",
  rent: "/rent",
  buy: "/buy",
  propertyCreate: "/properties/create",
  property: (id: string) => `/properties/${id}`,
  propertyEdit: (id: string) => `/properties/edit/${id}`,
  agents: "/agents",
  agent: (id: string) => `/agents/${id}`,
  saved: "/saved",
  account: "/account",
  profile: "/account/profile",
  myProperties: "/account/my-properties",
  settings: "/account/settings",
  deleteAccount: "/account/delete",
  login: "/auth/login",
  register: "/auth/register",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  terms: "/terms",
} as const;

export interface NavItem {
  href: string;
  label: string;
}

/** Primary navigation, shown to everyone. */
export const MAIN_NAV: NavItem[] = [
  { href: ROUTES.home, label: "Home" },
  { href: ROUTES.rent, label: "Rent" },
  { href: ROUTES.buy, label: "Buy" },
  { href: ROUTES.agents, label: "Find an Agent" },
  { href: ROUTES.saved, label: "Saved Properties" },
  { href: ROUTES.account, label: "Account" },
];

/** Shown in the header and mobile menu when signed out. */
export const SIGNED_OUT_NAV: NavItem[] = [
  { href: ROUTES.register, label: "Create Account" },
  { href: ROUTES.login, label: "Login" },
];

/** The account area: profile menu, mobile menu and the account sidebar. */
export const ACCOUNT_NAV: NavItem[] = [
  { href: ROUTES.profile, label: "Profile" },
  { href: ROUTES.myProperties, label: "My Properties" },
  { href: ROUTES.saved, label: "Saved Properties" },
  { href: ROUTES.settings, label: "Settings" },
];

export const FOOTER_COLUMNS: Array<{ title: string; links: NavItem[] }> = [
  {
    title: "Find a home",
    links: [
      { href: ROUTES.rent, label: "Property to rent" },
      { href: ROUTES.buy, label: "Property for sale" },
      { href: ROUTES.properties, label: "Search by postcode" },
      { href: ROUTES.saved, label: "Saved properties" },
    ],
  },
  {
    title: "Agents",
    links: [
      { href: ROUTES.agents, label: "Find an agent" },
      { href: ROUTES.propertyCreate, label: "List a property" },
      { href: ROUTES.register, label: "Create an agent account" },
    ],
  },
  {
    title: "Your account",
    links: [
      { href: ROUTES.login, label: "Login" },
      { href: ROUTES.register, label: "Create account" },
      { href: ROUTES.profile, label: "Profile" },
      { href: ROUTES.settings, label: "Settings" },
    ],
  },
];

export const POPULAR_AREAS = [
  { label: "Battersea", postcode: "SW11" },
  { label: "Didsbury", postcode: "M20" },
  { label: "Clifton", postcode: "BS8" },
  { label: "Headingley", postcode: "LS6" },
  { label: "Edgbaston", postcode: "B15" },
  { label: "Jesmond", postcode: "NE2" },
  { label: "New Town", postcode: "EH3" },
  { label: "Trumpington", postcode: "CB1" },
];
