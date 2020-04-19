import React, {Component} from 'react';
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Logo from '../Logo';
import Centered from '../Centered'
import MaterialIcon from '../MaterialIcon'
import {getLabel} from '../AerodromeStatusForm/StatusOptions'
import dates from '../../util/dates'
import newLineToBr from '../../util/newLineToBr'

const StyledLogo = styled(Logo)`
  width: 200px;
  float: left;
  
  @media(max-width: 700px) {
    float: none;
    text-align: center;
    display: block;
    margin-bottom: 2em;
    width: 50%;
  }
`;

const StyledContainer = styled.div`
  margin-left: 250px;
  
  @media(max-width: 700px) {
    margin-left: 0;
  }
`

const StyledCentered = styled(Centered)`
  max-width: 80%
`

const StyledStatusName = styled.h1`
  font-size: 2em;
  margin-bottom: 1em;
`

const StyledAuthor = styled.div`
  text-align: right;
  font-style: italic;
  margin-top: 2em;
`

class AerodromeStatusPage extends Component {

  componentDidMount() {
    this.props.watchCurrentAerodromeStatus()
  }

  render() {
    const {status} = this.props;

    if (status === undefined) {
      return <Centered><MaterialIcon icon="sync" rotate="left"/> Bitte warten ...</Centered>;
    }
    if (status === null) {
      return <Centered>Flugplatzstatus nicht verfügbar</Centered>
    }

    return (
      <StyledCentered>
        <StyledLogo/>
        <StyledContainer>
          <StyledStatusName>{getLabel(status.status)}</StyledStatusName>
          <div>{newLineToBr(status.details)}</div>
          <StyledAuthor>{dates.formatDateTime(status.timestamp)}, {status.by}</StyledAuthor>
        </StyledContainer>
      </StyledCentered>
    );
  }
}

AerodromeStatusPage.propTypes = {
  status: PropTypes.shape({
    status: PropTypes.string.isRequired,
    details: PropTypes.string.isRequired,
    by: PropTypes.string.isRequired
  }),
  watchCurrentAerodromeStatus: PropTypes.func.isRequired
};

export default AerodromeStatusPage;
