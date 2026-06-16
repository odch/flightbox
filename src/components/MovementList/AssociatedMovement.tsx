import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import MaterialIcon from '../MaterialIcon';
import MovementDetails from './MovementDetails';
import Action from './Action';
import {ACTION_LABELS} from './labels';
import {FORBIDDEN_MOVEMENT} from '../../modules/movements/reducer';

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

const AssociatedMovement = React.memo((props: any) => {
  const { t } = useTranslation();
  const {
    movementType,
    movementKey,
    associatedMovement,
    associatedMovementData,
    loadMovement,
    createMovementFromMovement,
    isHomeBase,
    isAdmin,
  } = props;

  useEffect(() => {
    if (
      associatedMovement &&
      ['departure', 'arrival'].includes(associatedMovement.type) &&
      associatedMovementData === undefined
    ) {
      loadMovement(associatedMovement.key, associatedMovement.type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [associatedMovement, associatedMovementData]);

  const handleCreateMovement = () => {
    createMovementFromMovement(movementType, movementKey);
  };

  const forbidden = associatedMovementData === FORBIDDEN_MOVEMENT;
  const hasData = !!associatedMovementData && !forbidden;

  let label;
  let text;

  if (movementType === 'departure') {
    label = t('movement.associated.arrivalLabel');
    text = hasData
      ? t('movement.associated.arrivalFound')
      : forbidden
        ? t('movement.associated.arrivalNotAccessible')
        : associatedMovementData === null
          ? t('movement.associated.arrivalNotFound')
          : null;
  } else {
    label = t('movement.associated.departureLabel');
    text = hasData
      ? t('movement.associated.departureFound')
      : forbidden
        ? t('movement.associated.departureNotAccessible')
        : associatedMovementData === null
          ? t('movement.associated.departureNotFound')
          : null;
  }

  return (
    <Wrapper>
      <div>
        <Label>{label}</Label>
        {text && <div>{text}</div>}
        {hasData
          ? <StyledDetails data={associatedMovementData} isHomeBase={isHomeBase} isAdmin={isAdmin}/>
          : forbidden
            ? null
            : associatedMovementData === undefined
              ? <MaterialIcon icon="sync" rotate="left"/>
              : (
                <ActionsContainer>
                  <ActionContainer>
                    <Action
                      label={ACTION_LABELS[movementType].label}
                      icon={ACTION_LABELS[movementType].icon}
                      onClick={handleCreateMovement}
                    />
                  </ActionContainer>
                </ActionsContainer>
              )}
      </div>
    </Wrapper>
  );
});

(AssociatedMovement as any).displayName = 'AssociatedMovement';

(AssociatedMovement as any).propTypes = {
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

export default AssociatedMovement;
