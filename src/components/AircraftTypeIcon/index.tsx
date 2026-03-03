import React from 'react'
import styled from 'styled-components'
import {icon as aircraftCategoryIcon} from '../../util/aircraftCategories'

import plane from './img/plane.png'
import jet from './img/jet.png'
import helicopter from './img/helicopter.png'
import glider from './img/glider.png'

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`

const StyledImg = styled.img`
    opacity: 0.4;
`

const ICON_MAP = {
  plane,
  jet,
  helicopter,
  glider,
}

const JET_MTOW = 2550

const getIconName = (aircraftCategory, mtow) => {
  let iconName = aircraftCategoryIcon(aircraftCategory)

  if ((!iconName || iconName === 'plane') && mtow > JET_MTOW) {
    iconName = 'jet'
  }

  if (!iconName) {
    iconName = 'plane'
  }

  return iconName
}

export default function AircraftTypeIcon({aircraftCategory, mtow}) {
  const iconName = getIconName(aircraftCategory, mtow)
  const iconSrc = ICON_MAP[iconName]
  return (
    <StyledWrapper>
      <StyledImg src={iconSrc} width={35}/>
    </StyledWrapper>
  )
}
