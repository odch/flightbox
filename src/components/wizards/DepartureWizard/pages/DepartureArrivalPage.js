import PropTypes from 'prop-types';
import React from 'react';
import {Field, Form} from 'react-final-form';
import { useTranslation } from 'react-i18next';
import validate from '../../validate';
import {renderAerodromeDropdown, renderDateField, renderDurationField, renderTimeField,} from '../../renderField';
import FieldSet from '../../FieldSet';
import WizardNavigation from '../../../WizardNavigation';

const DepartureArrivalPage = (props) => {
  const { t } = useTranslation();
  const { readOnly, hiddenFields, formValues, previousPage, onSubmit } = props;
  return (
    <Form
      initialValues={formValues}
      validate={validate('departure', ['date', 'time', 'location', 'duration'], hiddenFields)}
      onSubmit={onSubmit}
    >
      {({handleSubmit, form}) => (
        <form onSubmit={handleSubmit} className="DepartureArrivalPage">
          <FieldSet>
            <Field
              name="date"
              component={renderDateField}
              parse={e => e.value}
              label={t('movement.details.date')}
              readOnly={readOnly}
            />
            <Field
              name="time"
              component={renderTimeField}
              parse={e => e.value}
              label={t('movement.details.departureTime')}
              readOnly={readOnly}
            />
            <Field
              name="location"
              readOnly={readOnly}
            >
              {({input, meta}) =>
                renderAerodromeDropdown({
                  input: {
                    ...input,
                    onChange: aerodrome => {
                      form.change('location', aerodrome ? aerodrome.key : null)
                    }
                  },
                  meta,
                  label: t('movement.details.destination'),
                })
              }
            </Field>
            <Field
              name="duration"
              component={renderDurationField}
              parse={e => e.value}
              label={t('wizard.duration')}
              readOnly={readOnly}
            />
          </FieldSet>
          <WizardNavigation previousStep={() => previousPage(form.getState().values)} cancel={props.cancel}/>
        </form>
      )}
    </Form>
  );
};

DepartureArrivalPage.propTypes = {
  previousPage: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  formValues: PropTypes.object.isRequired,
};

export default DepartureArrivalPage;
