import React from "react";

interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Loader: React.FC<LoaderProps> = ({ className = "", size = "md" }) => {
  const sizeClasses = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-4",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-brand-500 border-t-transparent ${sizeClasses[size]}`}
      ></div>
    </div>
  );
};
