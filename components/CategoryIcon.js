/** Simple line icons for job category tiles. */

export default function CategoryIcon({ name, className = "h-7 w-7", color = "#2A3F4D", size }) {
  const dim = size ? { width: size, height: size } : undefined;
  const common = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true,
    className,
    style: dim,
  };
  const stroke = { stroke: color, strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };

  switch (name) {
    case "bag":
      return (
        <svg {...common}>
          <path d="M6 8h12l-1 12H7L6 8Z" {...stroke} />
          <path d="M9 8V7a3 3 0 0 1 6 0v1" {...stroke} />
        </svg>
      );
    case "car":
      return (
        <svg {...common}>
          <path d="M4 14h16v4H4z" {...stroke} />
          <path d="M6 14 8 8h8l2 6" {...stroke} />
          <circle cx="8" cy="18" r="1.2" fill={color} />
          <circle cx="16" cy="18" r="1.2" fill={color} />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" {...stroke} />
          <path d="m14.5 9.5-2 5-5 2 2-5 5-2Z" {...stroke} />
        </svg>
      );
    case "box":
      return (
        <svg {...common}>
          <path d="M4 8 12 4l8 4v8l-8 4-8-4V8Z" {...stroke} />
          <path d="M12 12v8M4 8l8 4 8-4" {...stroke} />
        </svg>
      );
    case "wrench":
      return (
        <svg {...common}>
          <path d="M14.5 5.5a3.5 3.5 0 0 0-4.9 4.9L4 16v4h4l5.6-5.6a3.5 3.5 0 0 0 4.9-4.9L16 12l-2.5-2.5 1-4Z" {...stroke} />
        </svg>
      );
    case "monitor":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="12" rx="2" {...stroke} />
          <path d="M8 20h8M12 16v4" {...stroke} />
        </svg>
      );
    case "scissors":
      return (
        <svg {...common}>
          <circle cx="6" cy="7" r="2.5" {...stroke} />
          <circle cx="6" cy="17" r="2.5" {...stroke} />
          <path d="M8.2 8.5 20 18M8.2 15.5 20 6" {...stroke} />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M5 5h11a3 3 0 0 1 3 3v11H8a3 3 0 0 0-3 3V5Z" {...stroke} />
          <path d="M5 19a3 3 0 0 1 3-3h11" {...stroke} />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" {...stroke} />
          <path d="M3 19a6 6 0 0 1 12 0" {...stroke} />
          <circle cx="17" cy="9" r="2.5" {...stroke} />
          <path d="M16 19a4.5 4.5 0 0 1 5 0" {...stroke} />
        </svg>
      );
    case "hand":
      return (
        <svg {...common}>
          <path d="M8 11V6.5a1.5 1.5 0 0 1 3 0V11" {...stroke} />
          <path d="M11 10.5V5.5a1.5 1.5 0 0 1 3 0V11" {...stroke} />
          <path d="M14 10V7a1.5 1.5 0 0 1 3 0v7a5 5 0 0 1-5 5H9a4 4 0 0 1-4-4v-4.5a1.5 1.5 0 0 1 3 0V11" {...stroke} />
        </svg>
      );
    case "paw":
      return (
        <svg {...common}>
          <circle cx="7.5" cy="8" r="1.8" {...stroke} />
          <circle cx="12" cy="6.5" r="1.8" {...stroke} />
          <circle cx="16.5" cy="8" r="1.8" {...stroke} />
          <path d="M8 14c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5c0 2.2-1.5 4-4 4s-4-1.8-4-4Z" {...stroke} />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" {...stroke} />
          <circle cx="12" cy="12" r="3" {...stroke} />
        </svg>
      );
  }
}
