import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Field, Form } from 'react-final-form';
import styled from 'styled-components';
import H1 from '../H1';
import Button from '../Button';
import ModalDialog from '../ModalDialog';
import MaterialIcon from '../MaterialIcon';
import PprAnswer from '../PprAnswer';
import PrivacyConsentText from '../PrivacyConsentText';
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
import { REGISTRATION_REGEX } from '../../util/aircrafts';
import type { Aircraft } from '../../modules/profile/migration';
import type { PprSubmitResult } from '../../modules/ppr/actions';
import validate, { validateWithoutLogin } from './validate';

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
// its direct children (the hint of the flight types is one), so this needs
// the higher specificity of &&.
const FieldHelp = styled.p`
  && {
    font-size: 0.9em;
  }
  color: #666;
  margin: 0.5em 0 0;
`;

// At the edge of the page, like the fields
const ConsentText = styled(PrivacyConsentText)`
  padding: 0;
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

// As the aircraft dropdown takes it
const normalizeRegistration = (value: string) => value.toUpperCase().replace(REGISTRATION_REGEX, '');

// The public status page of a request (route /ppr/status/:key/:token)
const statusPath = (key: string, token: string) =>
  `/ppr/status/${encodeURIComponent(key)}/${encodeURIComponent(token)}`;

interface PprRequestFormProps {
  initialValues: Record<string, any>;
  profileAircrafts?: Aircraft[];
  submitting: boolean;
  submitted: boolean;
  // The answer, when the request was answered right away
  result?: PprSubmitResult | null;
  commitFailed: boolean;
  // The server refused a request without login for too many requests
  rateLimited?: boolean;
  initPprForm: () => void;
  resetPprForm: () => void;
  onSubmit: (values: Record<string, any>) => void;
  // With login: closes the answer and goes to the start page
  confirmPprSubmitSuccess?: () => void;
  // A request without login: the pilot enters the address the receipt and
  // the answer go to, and the answer leads to the status page
  withoutLogin?: boolean;
  // Nobody is logged in: the aircraft list can't be read, and the pages
  // behind the login would show the login
  visitor?: boolean;
  privacyPolicyUrl?: string | null;
}

const PprRequestForm = (props: PprRequestFormProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { initPprForm, resetPprForm, profileAircrafts, withoutLogin, visitor } = props;
  // Visitors go back to the PPR intro, everybody else to the start page
  const homePath = visitor ? '/ppr/new' : '/';

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

  // Requests can be answered on submission: automatically, or rejected for a
  // closure. Without a login the address the emails went to is shown, so a
  // mistyped one is noticed, and the pilot learns when the email failed:
  // its link is the only way back to the request.
  const renderSubmitResult = (typedEmail?: string) => {
    const result = props.result;
    const email = result?.email ?? typedEmail;
    const emailFailed = result?.emailSent === false;
    if (result && (result.status === 'approved' || result.status === 'rejected')) {
      const approved = result.status === 'approved';
      return (
        <>
          <DialogHeading>{t(approved ? 'ppr.submitApproved' : 'ppr.submitRejected')}</DialogHeading>
          {result.reviewRemarks && (
            <PprAnswer status={result.status} remarks={result.reviewRemarks} dataCy="ppr-submit-remarks"/>
          )}
          {approved && <DialogMessage>{t('ppr.checkBeforeFlight')}</DialogMessage>}
          <DialogMessage>
            {withoutLogin
              ? t(emailFailed ? 'ppr.withoutLogin.answerFailed' : 'ppr.withoutLogin.answerSent', { email })
              : t('ppr.answerByEmail')}
          </DialogMessage>
        </>
      );
    }
    // Without its receipt the answer by email can't be promised either: the
    // status page shows it
    const receiptFailed = withoutLogin && emailFailed;
    return (
      <>
        <DialogHeading>{t('ppr.submitSuccess')}</DialogHeading>
        {!receiptFailed && <DialogMessage>{t('ppr.submitPending')}</DialogMessage>}
        {withoutLogin && (
          <>
            <DialogMessage>
              {t(receiptFailed ? 'ppr.withoutLogin.receiptFailed' : 'ppr.withoutLogin.receiptSent', { email })}
            </DialogMessage>
            {/* Only the status page can withdraw it once the dialog is closed */}
            <DialogMessage>{t('ppr.withoutLogin.wrongAddress')}</DialogMessage>
          </>
        )}
      </>
    );
  };

  // With a login the saga goes to the start page and resets the form.
  // Without one the buttons leave the form, which resets it on unmount.
  const renderSubmitResultButtons = () => {
    if (!withoutLogin) {
      return (
        <DialogButton
          type="button"
          icon="close"
          label={t('common.close')}
          onClick={props.confirmPprSubmitSuccess}
          flat
        />
      );
    }
    const key = props.result?.key;
    const token = props.result?.statusToken;
    return (
      <>
        {key && token && (
          <DialogButton
            type="button"
            icon="arrow_forward"
            label={t('ppr.withoutLogin.showStatus')}
            onClick={() => navigate(statusPath(key, token))}
            primary
            dataCy="ppr-show-status"
          />
        )}
        <DialogButton
          type="button"
          icon="close"
          label={t('common.close')}
          onClick={() => navigate(homePath)}
          flat
        />
      </>
    );
  };

  return (
    <Form
      validate={withoutLogin ? validateWithoutLogin : validate}
      onSubmit={handleFormSubmit}
      initialValues={props.initialValues}
      keepDirtyOnReinitialize
    >
      {({ handleSubmit, form, values }) => (
        <form onSubmit={handleSubmit} className="PprRequestForm">
          {/* The side header with the aerodrome's name is hidden on phones */}
          <H1>{withoutLogin ? t('ppr.requestFor', { aerodrome: __CONF__.aerodrome.name }) : t('ppr.newRequest')}</H1>

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
            {withoutLogin && (
              <Field name="email">
                {({ input, meta }) =>
                  renderInputField({
                    input,
                    meta,
                    label: t('movement.details.email'),
                    type: 'email',
                    footer: <FieldHelp>{t('ppr.withoutLogin.emailHelp')}</FieldHelp>,
                  })
                }
              </Field>
            )}
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
            {visitor ? (
              // The aircraft list needs a login
              <Field name="immatriculation" parse={normalizeRegistration}>
                {({ input, meta }) =>
                  renderInputField({ input, meta, label: t('movement.details.immatriculation') })
                }
              </Field>
            ) : (
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
            )}
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
                <FieldHelp data-cy="flightType-categoryFirst">{t('ppr.chooseCategoryFirst')}</FieldHelp>
              )}
            />
            <Field
              name="remarks"
              component={renderTextArea}
              label={t('ppr.remarks')}
            />
          </FieldSet>

          {withoutLogin && (
            <ConsentText privacyPolicyUrl={props.privacyPolicyUrl} i18nKey="ppr.withoutLogin.privacyConsent"/>
          )}

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
            {/* Not while it is sent: the pilot sees how it went */}
            <CancelButton
              type="button"
              label={t('wizard.cancel')}
              onClick={() => navigate(homePath)}
              disabled={props.submitting}
            />
          </Actions>

          {props.submitted && (
            <ModalDialog content={
              <DialogContent data-cy="ppr-submit-result">
                {renderSubmitResult(values.email)}
                {renderSubmitResultButtons()}
              </DialogContent>
            }/>
          )}

          {props.commitFailed && (
            <ModalDialog content={
              <DialogContent>
                <DialogHeading>{t('commitFailure.heading')}</DialogHeading>
                <DialogMessage>
                  {t(props.rateLimited ? 'ppr.withoutLogin.tooManyRequests' : 'ppr.submitFailed')}
                </DialogMessage>
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
