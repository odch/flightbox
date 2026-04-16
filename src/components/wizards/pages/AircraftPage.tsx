import React from 'react';
import {connect} from 'react-redux';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import {Field, Form} from 'react-final-form'
import validate from '../validate';
import {renderAircraftCategoryDropdown, renderAircraftDropdown, renderInputField} from '../renderField';
import FieldSet from '../FieldSet';
import WizardNavigation from '../../WizardNavigation';
import MaterialIcon from '../../MaterialIcon';
import {getAircraftOrigin, updateFeesTotal, updateGoAroundFees, updateLandingFees} from '../../../util/landingFees'
import type { Aircraft } from '../../../modules/profile/migration';

const FavouritesBar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6em;
  padding: 0.4em 1em;
  margin: 0 1em 1em;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
`;

const StarIcon = styled.span`
  color: #e8a735;
  display: flex;
  align-items: center;
  font-size: 1.1em;
`;

const Chip = styled.button<{ $active?: boolean }>`
  padding: 0.5em 0.9em;
  min-height: 44px;
  border: 1px solid ${props => props.$active ? props.theme.colors.main : '#ddd'};
  border-radius: 3px;
  background-color: ${props => props.$active ? props.theme.colors.main : '#fff'};
  color: ${props => props.$active ? '#fff' : '#555'};
  font-family: inherit;
  font-size: 0.9em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${props => props.theme.colors.main};
    color: ${props => props.$active ? '#fff' : props.theme.colors.main};
  }
`;

function applyAircraft(form: any, aircraft: { key: string; type?: string; mtow?: number; category?: string }, aircraftSettings: any) {
  form.change('immatriculation', aircraft.key);
  form.change('aircraftType', aircraft.type);
  form.change('mtow', aircraft.mtow);
  form.change('aircraftCategory', aircraft.category);

  if (form.getState().values['type'] === 'arrival') {
    const values = form.getState().values;
    const flightType = values.flightType;
    const landingCount = values.landingCount;
    const goAroundCount = values.goAroundCount;
    const aircraftOrigin = getAircraftOrigin(aircraft.key, aircraftSettings);

    const landingFeeTotal = updateLandingFees(form.change, aircraft.mtow, flightType, aircraftOrigin, aircraft.category, landingCount);
    const goAroundFeeTotal = updateGoAroundFees(form.change, aircraft.mtow, flightType, aircraftOrigin, aircraft.category, goAroundCount);

    updateFeesTotal(form.change, landingFeeTotal, goAroundFeeTotal, flightType, aircraftOrigin, aircraft.category);
  }
}

interface AircraftPageProps {
  onSubmit: (values: any) => void;
  cancel: () => void;
  readOnly?: boolean;
  formValues: Record<string, any>;
  aircraftSettings: any;
  hiddenFields?: string[];
  profileAircrafts?: Aircraft[];
}

const AircraftPage: React.FC<AircraftPageProps> = (props) => {
  const { t } = useTranslation();
  const {onSubmit, formValues, aircraftSettings, profileAircrafts} = props;

  const showQuickPicks = !props.readOnly && profileAircrafts && profileAircrafts.length >= 2;

  return (
    <Form
      initialValues={formValues}
      onSubmit={onSubmit}
      validate={validate(
        null,
        ['immatriculation', 'aircraftType', 'mtow', 'aircraftCategory'],
        props.hiddenFields
      )}
    >
      {({handleSubmit, form, values}) => (
        <form onSubmit={handleSubmit} className="AircraftPage">
          {showQuickPicks && (
            <FavouritesBar>
              <StarIcon><MaterialIcon icon="star"/></StarIcon>
              {profileAircrafts!.map((aircraft, index) => (
                <Chip
                  key={`${aircraft.immatriculation}-${index}`}
                  type="button"
                  $active={values.immatriculation === aircraft.immatriculation}
                  onClick={() => applyAircraft(form, {
                    key: aircraft.immatriculation!,
                    type: aircraft.aircraftType ?? undefined,
                    mtow: aircraft.mtow ?? undefined,
                    category: aircraft.aircraftCategory ?? undefined,
                  }, aircraftSettings)}
                >
                  {aircraft.immatriculation}
                </Chip>
              ))}
            </FavouritesBar>
          )}
          <FieldSet>
            <Field name="immatriculation">
              {({ input, meta }) =>
                renderAircraftDropdown({
                  input: {
                    ...input,
                    onChange: (aircraft) => {
                      if (aircraft) {
                        applyAircraft(form, aircraft, aircraftSettings);
                      } else {
                        form.change('immatriculation', null)
                      }
                    }
                  },
                  meta,
                  label: t('movement.details.immatriculation'),
                  readOnly: props.readOnly,
                })
              }
            </Field>
            <Field
              name="aircraftType"
              type="text"
              component={renderInputField}
              label={t('common.type')}
              readOnly={props.readOnly}
            />
            <Field
              name="mtow"
              type="number"
              label={t('profile.mtow')}
              readOnly={props.readOnly}
              parse={input => {
                if (typeof input === 'number') {
                  return input;
                }
                if (typeof input === 'string' && /^\d+$/.test(input)) {
                  return parseInt(input);
                }
                return null;
              }}
            >
              {({ input, meta }) =>
                renderInputField({
                  input: {
                    ...input,
                    onChange: (eventOrValue) => {
                      input.onChange(eventOrValue);

                      if (form.getState().values['type'] === 'arrival') {
                        const values = form.getState().values;
                        const mtow = values.mtow;
                        const aircraftCategory = values.aircraftCategory;
                        const flightType = values.flightType;
                        const landingCount = values.landingCount;
                        const goAroundCount = values.goAroundCount;
                        const aircraftOrigin = getAircraftOrigin(values.immatriculation, props.aircraftSettings);

                        const landingFeeTotal = updateLandingFees(form.change, mtow, flightType, aircraftOrigin, aircraftCategory, landingCount);
                        const goAroundFeeTotal = updateGoAroundFees(form.change, mtow, flightType, aircraftOrigin, aircraftCategory, goAroundCount);

                        updateFeesTotal(form.change, landingFeeTotal, goAroundFeeTotal, flightType, aircraftOrigin, aircraftCategory);
                      }
                    },
                  },
                  meta,
                  label: t('profile.mtow'),
                  type: "number",
                  readOnly: props.readOnly,
                })
              }
            </Field>
            <Field name="aircraftCategory">
              {({ input, meta }) => (
                renderAircraftCategoryDropdown({
                  input: {
                    ...input,
                    onChange: (aircraftCategory) => {
                      input.onChange(aircraftCategory);

                      if (form.getState().values['type'] === 'arrival') {
                        const values = form.getState().values;
                        const mtow = values.mtow;
                        const flightType = values.flightType;
                        const landingCount = values.landingCount;
                        const goAroundCount = values.goAroundCount;
                        const aircraftOrigin = getAircraftOrigin(values.immatriculation, props.aircraftSettings);

                        const landingFeeTotal = updateLandingFees(form.change, mtow, flightType, aircraftOrigin, aircraftCategory, landingCount);
                        const goAroundFeeTotal = updateGoAroundFees(form.change, mtow, flightType, aircraftOrigin, aircraftCategory, goAroundCount);

                        updateFeesTotal(form.change, landingFeeTotal, goAroundFeeTotal, flightType, aircraftOrigin, aircraftCategory);
                      }
                    },
                  },
                  meta,
                  label: t('movement.details.category'),
                  readOnly: props.readOnly,
                })
              )}
            </Field>
          </FieldSet>
          <WizardNavigation previousVisible={false} cancel={props.cancel}/>
        </form>
      )}
    </Form>
  );
};

const mapStateToProps = (state: any) => ({
  aircraftSettings: state.settings.aircrafts,
  profileAircrafts: (typeof __CONF__ === 'undefined' || __CONF__.profileEnabled !== false) ? state.profile.profile?.aircrafts : undefined,
});

export default connect(mapStateToProps)(AircraftPage);
