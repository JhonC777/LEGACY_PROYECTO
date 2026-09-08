import { CosmicLife } from '@/components/entry/CosmicLife'
import { CosmicLightning } from '@/components/entry/CosmicLightning'

export function CosmicBackground() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div className="cosmic-layer cosmic-base" />
      <div className="cosmic-layer cosmic-nebula" />
      <div className="cosmic-layer cosmic-shelf" />
      <div className="cosmic-layer cosmic-violet-glow" />
      <div className="cosmic-layer cosmic-gold-glow" />
      <div className="cosmic-layer cosmic-side-light" />
      <div className="cosmic-layer cosmic-stars" />
      <CosmicLife />
      <div className="cosmic-layer cosmic-vignette" />
      <CosmicLightning />
    </div>
  )
}
