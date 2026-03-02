import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { withTranslation } from 'react-i18next';
import MaterialIcon from '../MaterialIcon';
import MovementDetails from './MovementDetails';
import Action from './Action';
import {ACTION_LABELS} from './labels';

const Wrapper = styled.div`
  padding: 1em;
`;

const Label = styled.div`
  font-size: 1.2em;
  margin-bottom: 1em;
  color: ${props => props.theme.colors.main}
`;

const StyledDetails = styled(MovementDetails)`
  opacity: 0.6;
`;

const ActionsContainer = styled.div`
  margin-top: 2em;
`;

const ActionContainer = styled.div`
  margin-top: 0.8em;
  font-size: 1.2em;
`;

class AssociatedMovement extends React.PureComponent {

  constructor(props) {
    super(props);
    this.handleCreateMovement = this.handleCreateMovement.bind(this);
  }

  componentWillMount() {
    const {associatedMovement, associatedMovementData, loadMovement} = this.props
    if (
      associatedMovement &&
      ['departure', 'arrival'].includes(associatedMovement.type) &&
      associatedMovementData === undefined
    ) {
      loadMovement(associatedMovement.key, associatedMovement.type);
    }
  }

  componentDidUpdate() {
    const {associatedMovement, associatedMovementData, loadMovement} = this.props
    if (
      associatedMovement &&
      ['departure', 'arrival'].includes(associatedMovement.type) &&
      associatedMovementData === undefined
    ) {
      loadMovement(associatedMovement.key, associatedMovement.type);
    }
  }

  render() {
    const {movementType, associatedMovementData, t} = this.props;

    let label;
    let text;

    if (movementType === 'departure') {
      label = t('movement.associated.arrivalLabel');
      text = associatedMovementData
        ? t('movement.associated.arrivalFound')
        : associatedMovementData === null
          ? t('movement.associated.arrivalNotFound')
          : null;
    } else {
      label = t('movement.associated.departureLabel');
      text = associatedMovementData
        ? t('movement.associated.departureFound')
        : associatedMovementData === null
          ? t('movement.associated.departureNotFound')
          : null;
    }

    return (
      <Wrapper>
        <div>
          <Label>{label}</Label>
          {text && <div>{text}</div>}
          {associatedMovementData
            ? <StyledDetails data={associatedMovementData} isHomeBase={this.props.isHomeBase} isAdmin={this.props.isAdmin}/>
            : associatedMovementData === undefined
              ? <MaterialIcon icon="sync" rotate="left"/>
              : (
                <ActionsContainer>
                  <ActionContainer>
                    <Action
                      label={ACTION_LABELS[movementType].label}
                      icon={ACTION_LABELS[movementType].icon}
                      onClick={this.handleCreateMovement}
                    />
                  </ActionContainer>
                </ActionsContainer>
              )}
        </div>
      </Wrapper>
    )
  }

  handleCreateMovement() {
    this.props.createMovementFromMovement(this.props.movementType, this.props.movementKey);
  }
}

AssociatedMovement.propTypes = {
  movementType: PropTypes.oneOf(['departure', 'arrival']),
  movementKey: PropTypes.string.isRequired,
  isHomeBase: PropTypes.bool.isRequired,
  associatedMovement: PropTypes.shape({
    key: PropTypes.string,
    type: PropTypes.oneOf(['departure', 'arrival', 'none']),
  }),
  loading: PropTypes.bool.isRequired,
  createMovementFromMovement: PropTypes.func.isRequired
};

export default withTranslation()(AssociatedMovement);
