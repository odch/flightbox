import PropTypes from 'prop-types';
import React from 'react';
import {Field, Form} from 'react-final-form';
import validate from '../validate';
import {renderInputField, renderUserDropdown} from '../renderField';
import FieldSet from '../FieldSet';
import WizardNavigation from '../../WizardNavigation';

const PilotPage = (props) => {
  const { previousPage, onSubmit, isGuest, hiddenFields, formValues } = props;
  return (
    <Form
      initialValues={formValues}
      onSubmit={onSubmit}
      validate={validate(null, ['memberNr', 'lastname', 'firstname', 'email', 'phone'], hiddenFields)}
    >
      {({handleSubmit, form}) => (
        <form onSubmit={handleSubmit} className="PilotPage">
          <FieldSet>
            {__CONF__.memberManagement === true &&!isGuest && (
              <Field name="memberNr">
                {({ input, meta }) =>
                  renderUserDropdown({
                    input: {
                      ...input,
                      onChange: (user) => {
                        input.onChange(user);
                        if (user) {
                          form.change('memberNr', user.memberNr)
                          form.change('firstname', user.firstname);
                          form.change('lastname', user.lastname);
                          form.change('email', user.email);
                          form.change('phone', user.phone);
                        }
                      },
                    },
                    meta,
                    label: "Mitgliedernummer",
                    readOnly: props.readOnly,
                  })
                }
              </Field>
            )}
          </FieldSet>
          <FieldSet>
            <Field
              name="lastname"
              type="text"
              label="Nachname"
              component={renderInputField}
              readOnly={props.readOnly}
            />
            <Field
              name="firstname"
              type="text"
              label="Vorname"
              component={renderInputField}
              readOnly={props.readOnly}
            />
          </FieldSet>
          <FieldSet>
            <Field
              name="email"
              type="email"
              label="E-Mail"
              component={renderInputField}
              readOnly={props.readOnly}
              masked={__CONF__.maskContactInformation === true && !props.isAdmin}
            />
            <Field
              name="phone"
              type="tel"
              label="Telefon"
              component={renderInputField}
              readOnly={props.readOnly}
              masked={__CONF__.maskContactInformation === true && !props.isAdmin}
            />
          </FieldSet>
          <WizardNavigation previousStep={() => previousPage(form.getState().values)} cancel={props.cancel}/>
        </form>
      )}
      </Form>
  );
};

PilotPage.propTypes = {
  previousPage: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  isAdmin: PropTypes.bool.isRequired,
  isGuest: PropTypes.bool.isRequired,
  formValues: PropTypes.object.isRequired,
};

export default PilotPage;
