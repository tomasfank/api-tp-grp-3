import { Facebook, Github, Globe, Instagram, Linkedin, Twitter, type LucideIcon } from "lucide-react"

const ICONS: Record<string, LucideIcon> = {
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  github: Github,
}

export function SocialLinks({ socialMedia }: { socialMedia?: Record<string, string> }) {
  const entries = Object.entries(socialMedia ?? {}).filter(([, url]) => url)
  if (entries.length === 0) return null

  return (
    <div className="flex gap-4">
      {entries.map(([name, url]) => {
        const Icon = ICONS[name.toLowerCase()] ?? Globe
        return (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={name}
            className="w-9 h-9 border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <Icon className="w-4 h-4" />
          </a>
        )
      })}
    </div>
  )
}
