import * as Ori from "./Ori"
import * as F from "./Prelude"

enum Order {
  Before = "Before",
  After = "After",
}

type SettingsUnchecked = {
  zoneChangeThreshold?: number
  preferZoneUntilPercentWorse?: number
  isBounded?: boolean
  elligibleZones?: SidesShorthand[]
  preferredZones?: SidesShorthand[]
}

type Settings = {
  isBounded: boolean
  zoneChangeThreshold: null | number
  elligibleZones: null | Ori.Side[]
  preferredZones: null | Ori.Side[]
  preferZoneUntilPercentWorse: null | number
}

type SidesShorthand = Ori.Ori | Order | Ori.Side

const expandSideShorthand = (elligibleZones: SidesShorthand): Ori.Side[] => {
  switch (elligibleZones) {
    case Ori.Ori.Horizontal:
      return [Ori.Side.Left, Ori.Side.Right]
    case Ori.Ori.Vertical:
      return [Ori.Side.Top, Ori.Side.Bottom]
    case Order.Before:
      return [Ori.Side.Top, Ori.Side.Left]
    case Order.After:
      return [Ori.Side.Bottom, Ori.Side.Right]
    default:
      return [elligibleZones]
  }
}

const checkAndNormalize = (settings: SettingsUnchecked): Settings => {
  const isBounded = F.defaultsTo(true, settings.isBounded)
  const zoneChangeThreshold = settings.zoneChangeThreshold || null
  const preferZoneUntilPercentWorse = F.isExists(
    settings.preferZoneUntilPercentWorse,
  )
    ? settings.preferZoneUntilPercentWorse
    : null
  const elligibleZones = F.isExists(settings.elligibleZones)
    ? F.flatten(settings.elligibleZones.map(expandSideShorthand))
    : null
  const preferredZones = F.isExists(settings.preferredZones)
    ? F.flatten(settings.preferredZones.map(expandSideShorthand))
    : null
  if (elligibleZones && preferredZones) {
    const impossiblePreferredZones = F.omit(elligibleZones, preferredZones)
    if (impossiblePreferredZones.length) {
      console.warn(
        "Your preferred zones (%s) are impossible to use because you specified elligible zones that do not include them (%s)",
        preferredZones,
        elligibleZones,
      )
    }
  }

  return {
    isBounded,
    elligibleZones,
    preferredZones,
    zoneChangeThreshold,
    preferZoneUntilPercentWorse,
  }
}

export { checkAndNormalize, SettingsUnchecked, Settings }
