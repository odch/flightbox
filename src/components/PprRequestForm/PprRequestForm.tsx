import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Field, Form } from 'react-final-form';
import styled from 'styled-components';
import H1 from '../H1';
import Button from '../Button';
import ModalDialog from '../ModalDialog';
import MaterialIcon from '../MaterialIcon';
import FieldSet from '../wizards/FieldSet';
import { CancelButton, NextButton } from '../WizardNavigation/WizardNavigation';
import { Chip, FavouritesBar, StarIcon } from '../wizards/QuickPickBar';
import {
  renderAircraftCategoryDropdown,
  renderAircraftDropdown,
  renderDateField,
  renderInputField,
  renderPhoneField,
  renderSingleSelect,
  renderTextArea,
  renderTimeField,
} from '../wizards/renderField';
import { getEnabledFlightTypes } from '../../util/flightTypes';
import type { Aircraft } from '../../modules/profile/migration';
import validate from './validate';

// The page has the same padding as the message and profile pages, so the
// fields, section titles, shortcuts and buttons all start at its edge
// (FieldSet without gutter, as in the profile form).
const SectionTitle = styled.h2`
  font-size: 1.2em;
  color: #333;
  margin: 0.5em 0 1em;
`;

const QuickPicks = styled(FavouritesBar)`
  margin: 0 0 1.5em;
`;

const Actions = styled.div`
  padding: 10px 0;
  overflow: hidden;
`;

const DialogContent = styled.div`
  text-align: center;
`;

const DialogHeading = styled.div`
  font-size: 1.5em;
  margin-bottom: 1em;
`;

const DialogMessage = styled.div`
  margin-bottom: 1em;
`;

const DialogButton = styled(Button)`
  float: right;
`;

// Like the help texts of the settings forms. The field container enlarges
// its direct children, so this needs the higher specificity of &&.
const CategoryFirst = styled.p`
  && {
    font-size: 0.9em;
  }
  color: #666;
  margin: 0.5em 0 0;
`;

// The flight types the arrival can later be recorded with: those of the
// aerodrome that fit the aircraft category, as in the arrival wizard
const getFlightTypeItems = (aircraftCategory?: string | null) =>
  aircraftCategory ? getEnabledFlightTypes(aircraftCategory) : [];

// A chosen flight type that doesn't fit the new category is cleared
const changeCategory = (form: any, aircraftCategory?: string | null) => {
  form.change('aircraftCategory', aircraftCategory || undefined);
  const { flightType } = form.getState().values;
  if (flightType && !getFlightTypeItems(aircraftCategory).some(item => item.value === flightType)) {
    form.change('flightType', undefined);
  }
};

const parseMtow = (input: unknown) => {
  if (typeof input === 'number') {
    return input;
  }
  if (typeof input === 'string' && /^\d+$/.test(input)) {
    return parseInt(input, 10);
  }
  return null;
};

// The aircraft dropdown and the profile shortcuts fill in type, MTOW and
// category, as in the movement wizards and the profile
const applyAircraft = (
  form: any,
  aircraft: { key: string; type?: string | null; mtow?: number | null; category?: string | null }
) => {
  form.change('immatriculation', aircraft.key);
  form.change('aircraftType', aircraft.type ?? undefined);
  form.change('mtow', aircraft.mtow ?? undefined);
  changeCategory(form, aircraft.category);
};

interface PprRequestFormProps {
  initialValues: Record<string, any>;
  profileAircrafts?: Aircraft[];
  submitting: boolean;
  submitted: boolean;
  commitFailed: boolean;
  initPprForm: () => void;
  resetPprForm: () => void;
  onSubmit: (values: Record<string, any>) => void;
  confirmPprSubmitSuccess: () => void;
}

const PprRequestForm = (props: PprRequestFormProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { initPprForm, resetPprForm, profileAircrafts } = props;

  useEffect(() => {
    initPprForm();
    return () => resetPprForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The saga sends the request and props.submitting reports its progress.
  // Returning nothing keeps final-form from taking the dispatched action for
  // submit errors.
  const handleFormSubmit = (values: Record<string, any>) => {
    props.onSubmit(values);
  };

  // As in the movement wizards: shortcuts for pilots with several aircraft
  const showQuickPicks = !!profileAircrafts && profileAircrafts.length >= 2;

  return (
    <Form validate={validate} onSubmit={handleFormSubmit} initialValues={props.initialValues} keepDirtyOnReinitialize>
      {({ handleSubmit, form, values }) => (
        <form onSubmit={handleSubmit} className="PprRequestForm">
          <H1>{t('ppr.newRequest')}</H1>

          <SectionTitle>{t('movement.details.pilot')}</SectionTitle>
          <FieldSet gutter={false}>
            <Field
              name="lastname"
              type="text"
              component={renderInputField}
              label={t('movement.details.lastname')}
            />
            <Field
              name="firstname"
              type="text"
              component={renderInputField}
              label={t('movement.details.firstname')}
            />
            <Field
              name="phone"
              component={renderPhoneField}
              label={t('movement.details.phone')}
            />
          </FieldSet>

          <SectionTitle>{t('movement.details.aircraftData')}</SectionTitle>
          {showQuickPicks && (
            <QuickPicks>
              <StarIcon><MaterialIcon icon="star"/></StarIcon>
              {profileAircrafts!.map((aircraft, index) => (
                <Chip
                  key={`${aircraft.immatriculation}-${index}`}
                  type="button"
                  $active={values.immatriculation === aircraft.immatriculation}
                  onClick={() => applyAircraft(form, {
                    key: aircraft.immatriculation!,
                    type: aircraft.aircraftType,
                    mtow: aircraft.mtow,
                    category: aircraft.aircraftCategory,
                  })}
                >
                  {aircraft.immatriculation}
                </Chip>
              ))}
            </QuickPicks>
          )}
          <FieldSet gutter={false}>
            <Field name="immatriculation">
              {({ input, meta }) =>
                renderAircraftDropdown({
                  input: {
                    ...input,
                    onChange: (aircraft: any) => {
                      if (aircraft) {
                        applyAircraft(form, aircraft);
                      } else {
                        form.change('immatriculation', null);
                      }
                    },
                  },
                  meta,
                  label: t('movement.details.immatriculation'),
                })
              }
            </Field>
            <Field
              name="aircraftType"
              type="text"
              component={renderInputField}
              label={t('common.type')}
            />
            <Field name="mtow" parse={parseMtow}>
              {({ input, meta }) =>
                renderInputField({
                  input,
                  meta,
                  label: t('profile.mtow'),
                  type: 'number',
                })
              }
            </Field>
            <Field name="aircraftCategory">
              {({ input, meta }) =>
                renderAircraftCategoryDropdown({
                  input: {
                    ...input,
                    onChange: (aircraftCategory: string) => changeCategory(form, aircraftCategory),
                  },
                  meta,
                  label: t('movement.details.category'),
                })
              }
            </Field>
          </FieldSet>

          <SectionTitle>{t('movement.details.flight')}</SectionTitle>
          <FieldSet gutter={false}>
            <Field
              name="plannedDate"
              component={renderDateField}
              parse={(e: { value: string | null }) => e.value}
              label={t('ppr.plannedDate')}
            />
            <Field
              name="plannedTime"
              component={renderTimeField}
              parse={(e: { value: string | null }) => e.value}
              label={t('ppr.plannedTime')}
            />
            <Field
              name="flightType"
              component={renderSingleSelect}
              items={getFlightTypeItems(values.aircraftCategory)}
              orientation="vertical"
              label={t('movement.details.flightType')}
              hint={!values.aircraftCategory && (
                <CategoryFirst data-cy="flightType-categoryFirst">{t('ppr.chooseCategoryFirst')}</CategoryFirst>
              )}
            />
            <Field
              name="remarks"
              component={renderTextArea}
              label={t('ppr.remarks')}
            />
          </FieldSet>

          <Actions>
            <NextButton
              type="submit"
              icon="send"
              label={t('ppr.submit')}
              primary
              disabled={props.submitting || props.submitted}
              loading={props.submitting}
              dataCy="ppr-submit"
            />
            <CancelButton
              type="button"
              label={t('wizard.cancel')}
              onClick={() => navigate('/')}
            />
          </Actions>

          {props.submitted && (
            <ModalDialog content={
              <DialogContent>
                <DialogHeading>{t('ppr.submitSuccess')}</DialogHeading>
                <DialogButton
                  type="button"
                  icon="close"
                  label={t('common.close')}
                  onClick={props.confirmPprSubmitSuccess}
                  flat
                />
              </DialogContent>
            }/>
          )}

          {props.commitFailed && (
            <ModalDialog content={
              <DialogContent>
                <DialogHeading>{t('commitFailure.heading')}</DialogHeading>
                <DialogMessage>{t('ppr.submitFailed')}</DialogMessage>
                <DialogButton
                  type="button"
                  icon="close"
                  label={t('common.close')}
                  onClick={resetPprForm}
                  flat
                />
              </DialogContent>
            }/>
          )}
        </form>
      )}
    </Form>
  );
};

export default PprRequestForm;
