import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { DepthToggle } from "../lib/depth";

const navLinks = [
  { label: "Learn", path: "/#how" },
  { label: "Models", path: "/models" },
  { label: "Try it", path: "/inference" },
];

export function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav aria-label="Main" className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 md:pt-6 px-3">
      <div className="bg-black/80 border border-white/10 rounded-full pl-5 pr-1.5 py-1.5 flex items-center gap-4 md:gap-7 shadow-2xl backdrop-blur-md">
        {navLinks.map((link) => {
          const isActive = pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "text-[11px] font-medium tracking-wide uppercase transition-colors duration-200 whitespace-nowrap",
                isActive ? "text-white" : "text-white/65 hover:text-white",
              )}
            >
              {link.label}
            </Link>
          );
        })}
        <DepthToggle />
      </div>
    </nav>
  );
}
