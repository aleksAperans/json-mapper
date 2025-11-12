import React from 'react';

interface JsonMapperIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const JsonMapperIcon: React.FC<JsonMapperIconProps> = ({ 
  size = 24, 
  color = "currentColor", 
  className = "" 
}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 32 32" 
    fill="none"
    className={className}
  >
    {/* Left curly brace */}
    <path 
      d="M10 10 Q7 10 7 13 L7 14 Q7 16 5 16 Q7 16 7 18 L7 19 Q7 22 10 22" 
      stroke={color} 
      strokeWidth="2" 
      fill="none" 
      strokeLinecap="round"
    />
    
    {/* Right curly brace */}
    <path 
      d="M22 10 Q25 10 25 13 L25 14 Q25 16 27 16 Q25 16 25 18 L25 19 Q25 22 22 22" 
      stroke={color} 
      strokeWidth="2" 
      fill="none" 
      strokeLinecap="round"
    />
    
    {/* Connection dots */}
    <circle cx="13" cy="12" r="1.5" fill={color} />
    <circle cx="16" cy="16" r="1.5" fill={color} />
    <circle cx="19" cy="20" r="1.5" fill={color} />
    
    {/* Connecting lines */}
    <path 
      d="M13 12 L16 16 L19 20" 
      stroke={color} 
      strokeWidth="1" 
      fill="none" 
      opacity="0.5"
    />
  </svg>
);

export default JsonMapperIcon;

// Usage examples:
// <JsonMapperIcon size={24} color="#0969da" />
// <JsonMapperIcon size={32} color="white" className="mr-2" />
// <JsonMapperIcon /> // Uses defaults: 24px size, currentColor