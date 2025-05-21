// src/components/ui/avatar.tsx
import Image from 'next/image'

type AvatarProps = {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const sizeClass = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
  }

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

  if (src) {
    return (
      <div className={`relative rounded-full overflow-hidden ${sizeClass[size]}`}>
        <Image 
          src={src} 
          alt={name} 
          fill 
          className="object-cover"
        />
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-medium ${sizeClass[size]}`}>
      {initials}
    </div>
  )
}