import PropTypes from 'prop-types';
import React from 'react';
import {Field, Form} from 'react-final-form';
import validate from '../../validate';
import {renderAerodromeDropdown, renderDateField, renderDurationField, renderTimeField,} from '../../renderField';
import FieldSet from '../../FieldSet';
import WizardNavigation from '../../../WizardNavigation';

const DepartureArrivalPage = (props) => {
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
              label="Datum"
              readOnly={readOnly}
            />
            <Field
              name="time"
              component={renderTimeField}
              parse={e => e.value}
              label="Startzeit (Lokalzeit)"
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
                  label: "Zielflugplatz",
                })
              }
            </Field>
            <Field
              name="duration"
              component={renderDurationField}
              parse={e => e.value}
              label="Flugdauer"
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
