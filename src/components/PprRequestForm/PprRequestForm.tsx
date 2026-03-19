import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Field, Form } from 'react-final-form';
import styled from 'styled-components';
import H1 from '../H1';
import Button from '../Button';
import ModalDialog from '../ModalDialog';
import objectToArray from '../../util/objectToArray';
import validate from './validate';
import { renderInputField, renderTextArea, renderSelectField } from './renderField';

const Section = styled.div`
  margin-bottom: 2em;
`;

const SectionTitle = styled.h2`
  font-size: 1.2em;
  margin-bottom: 1em;
  color: #333;
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

// Arrays in __CONF__ are compiled to index-keyed objects (packinize in
// projects/index.js), so they are read through objectToArray.
const getEnabledFlightTypes = (): string[] => objectToArray(__CONF__.enabledFlightTypes || {});

const PprRequestForm = (props: any) => {
  const { t } = useTranslation();
  const { initPprForm, resetPprForm } = props;

  useEffect(() => {
    initPprForm();
    return () => resetPprForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The saga sends the request and props.submitting reports its progress.
  // Returning nothing keeps final-form from taking the dispatched action for
  // submit errors.
  const handleFormSubmit = values => {
    props.onSubmit(values);
  };

  return (
    <Form validate={validate} onSubmit={handleFormSubmit} initialValues={props.initialValues} keepDirtyOnReinitialize>
      {({ handleSubmit }) => (
        <form onSubmit={handleSubmit}>
          <H1>{t('ppr.newRequest')}</H1>

          <Section>
            <SectionTitle>{t('movement.details.pilot')}</SectionTitle>
            <Field
              name="firstname"
              type="text"
              component={renderInputField}
              label={t('movement.details.firstname')}
            />
            <Field
              name="lastname"
              type="text"
              component={renderInputField}
              label={t('movement.details.lastname')}
            />
            <Field
              name="phone"
              type="tel"
              component={renderInputField}
              label={t('movement.details.phone')}
            />
          </Section>

          <Section>
            <SectionTitle>{t('movement.details.aircraftData')}</SectionTitle>
            <Field
              name="immatriculation"
              type="text"
              component={renderInputField}
              label={t('movement.details.immatriculation')}
            />
            <Field
              name="aircraftType"
              type="text"
              component={renderInputField}
              label={t('movement.details.aircraftType')}
            />
            <Field
              name="mtow"
              type="number"
              component={renderInputField}
              label={t('movement.details.mtow')}
            />
          </Section>

          <Section>
            <SectionTitle>{t('movement.details.flight')}</SectionTitle>
            <Field
              name="plannedDate"
              type="date"
              component={renderInputField}
              label={t('ppr.plannedDate')}
            />
            <Field
              name="plannedTime"
              type="time"
              component={renderInputField}
              label={t('ppr.plannedTime')}
            />
            <Field
              name="flightType"
              component={renderSelectField}
              label={t('movement.details.flightType')}
            >
              <option value="">{t('validate.flightType')}</option>
              {getEnabledFlightTypes().map(ft => (
                <option key={ft} value={ft}>{t(`flightTypes.${ft}`)}</option>
              ))}
            </Field>
            <Field
              name="remarks"
              component={renderTextArea}
              label={t('ppr.remarks')}
            />
          </Section>

          <Button
            type="submit"
            icon="send"
            label={t('ppr.submit')}
            primary
            disabled={props.submitting || props.submitted}
            loading={props.submitting}
            dataCy="ppr-submit"
          />

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
