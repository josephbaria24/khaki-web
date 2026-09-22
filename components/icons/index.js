import data from "./hugeicons-data.json";

export default function HugeIcon({
  name,
  className = "h-5 w-5",
  size,
  strokeWidth = 1.5,
  color = "currentColor",
  style,
  ...props
}) {
  const icon = data[name];
  if (!icon) return null;

  const dimStyle = size
    ? { width: size, height: size, ...style }
    : style;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={icon.viewBox}
      fill="none"
      aria-hidden="true"
      className={className}
      style={dimStyle}
      {...props}
      dangerouslySetInnerHTML={{
        __html: icon.body
          .replace(/stroke="currentColor"/g, `stroke="${color}"`)
          .replace(/stroke-width="1\.5"/g, `stroke-width="${strokeWidth}"`),
      }}
    />
  );
}

function make(name) {
  function Icon(props) {
    return <HugeIcon name={name} {...props} />;
  }
  Icon.displayName = name;
  return Icon;
}

export const Home = make("Home");
export const Briefcase = make("Briefcase");
export const Plus = make("Plus");
export const MessageSquare = make("MessageSquare");
export const User = make("User");
export const Bell = make("Bell");
export const Wallet = make("Wallet");
export const Search = make("Search");
export const MapPin = make("MapPin");
export const Clock = make("Clock");
export const ChevronLeft = make("ChevronLeft");
export const ArrowRight = make("ArrowRight");
export const Lock = make("Lock");
export const Unlock = make("Unlock");
export const ShieldCheck = make("ShieldCheck");
export const Menu = make("Menu");
export const X = make("X");
export const Mail = make("Mail");
export const Loader2 = make("Loader2");
export const Leaf = make("Leaf");

export function Eye({ className = "h-4 w-4", color = "currentColor", ...props }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className} {...props}>
      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function EyeOff({ className = "h-4 w-4", color = "currentColor", ...props }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className} {...props}>
      <path d="m3 3 18 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.9 5.2A10.4 10.4 0 0 1 12 5c6 0 9.5 7 9.5 7a16.6 16.6 0 0 1-2.3 3.2M6.6 6.6C4.2 8.4 2.5 12 2.5 12s3.5 7 9.5 7c1.7 0 3.2-.4 4.5-1.1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
