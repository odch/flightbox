import React from 'react';
import { withTranslation } from 'react-i18next';
import { Field, Form } from 'react-final-form';
import styled from 'styled-components';
import H1 from '../H1';
import Button from '../Button';
import ModalDialog from '../ModalDialog';
import validate from './validate';
import { renderInputField, renderTextArea, renderSelectField } from './renderField';

declare var __CONF__: any;

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

const enabledFlightTypes = __CONF__.enabledFlightTypes || [];

class PprRequestForm extends React.Component<any, any> {

  componentDidMount() {
    this.props.initPprForm();
  }

  componentWillUnmount() {
    this.props.resetPprForm();
  }

  render() {
    const { t } = this.props;
    return (
      <Form validate={validate} onSubmit={this.props.onSubmit} initialValues={this.props.initialValues} keepDirtyOnReinitialize>
        {({ handleSubmit, submitting }) => (
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
                {enabledFlightTypes.map(ft => (
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
              disabled={submitting || this.props.submitted}
              loading={submitting}
              dataCy="ppr-submit"
            />

            {this.props.submitted && (
              <ModalDialog content={
                <DialogContent>
                  <DialogHeading>{t('ppr.submitSuccess')}</DialogHeading>
                  <DialogButton
                    type="button"
                    icon="close"
                    label={t('common.close')}
                    onClick={this.props.confirmPprSubmitSuccess}
                    flat
                  />
                </DialogContent>
              }/>
            )}

            {this.props.commitFailed && (
              <ModalDialog content={
                <DialogContent>
                  <DialogHeading>{t('commitFailure.heading')}</DialogHeading>
                  <DialogMessage>{t('ppr.submitFailed')}</DialogMessage>
                  <DialogButton
                    type="button"
                    icon="close"
                    label={t('common.close')}
                    onClick={this.props.resetPprForm}
                    flat
                  />
                </DialogContent>
              }/>
            )}
          </form>
        )}
      </Form>
    );
  }
}

export default withTranslation()(PprRequestForm);
