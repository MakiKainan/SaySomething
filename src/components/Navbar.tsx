import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";

export function Navbar() {
  const location = useLocation();

  const handleScrollToAbout = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      const aboutSection = document.getElementById("about");
      aboutSection?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navLinks = [
    { label: "Our story", path: "/#about", onClick: handleScrollToAbout },
    { label: "Models", path: "/models" },
    { label: "Inference", path: "/inference" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6">
      <div className="bg-black border border-white/10 rounded-full px-8 py-2.5 flex items-center justify-center space-x-8 shadow-2xl backdrop-blur-md">
        {navLinks.map((link, idx) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={idx}
              to={link.path}
              onClick={link.onClick}
              className={cn(
                "text-[11px] font-medium tracking-wide uppercase transition-colors duration-200",
                isActive ? "text-white" : "text-white/50 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
