import React from "react";

interface IconWrapperProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const IconWrapper: React.FC<IconWrapperProps> = ({ 
  children, 
  className = "",
  size = "md" 
}) => {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-14 h-14"
  };

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center bg-primary/10 rounded-lg ${className}`}>
      {children}
    </div>
  );
};