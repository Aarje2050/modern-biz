// src/components/ui/icon.tsx
import React from 'react';
import {
  Eye, Building, Search, Star, 
  MousePointer, MessageSquare, 
  Phone, Mail, Globe, Share2, 
  Image
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<any>> = {
  eye: Eye,
  building: Building,
  search: Search,
  star: Star,
  'mouse-pointer': MousePointer,
  'message-square': MessageSquare,
  phone: Phone,
  mail: Mail,
  website: Globe,
  share: Share2,
  image: Image,
};

interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className = '' }: IconProps) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  
  return <IconComponent className={className} />;
}