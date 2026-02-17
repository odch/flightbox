import PropTypes from 'prop-types'
import FieldSet from '../wizards/FieldSet'
import {Field, Form} from 'react-final-form'
import {renderAircraftCategoryDropdown, renderAircraftDropdown, renderInputField} from '../wizards/renderField'
import React from 'react'
import Button from '../Button'
import styled from 'styled-components'

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1em;
`

const StyledSection = styled.div`
  padding: 1em;
  border: 1px solid #ddd;
  background-color: #fefefe;
  box-shadow: 0 -1px 0 rgba(0,0,0,.03), 0 0 2px rgba(0,0,0,.03), 0 2px 4px rgba(0,0,0,.06);
`

const StyledSectionTitle = styled.h1`
  font-weight: bold;
  font-size: 1.5em;
  margin-bottom: 1em;
`

function ProfileForm(props) {

  const handleSubmit = (values) => {
    props.saveProfile(values)
  }

  return (
    <Form onSubmit={handleSubmit} initialValues={props.profile}>
      {({handleSubmit, dirty, form}) => (
        <StyledForm onSubmit={handleSubmit}>
          <StyledSectionTitle>Standard-Eingabewerte</StyledSectionTitle>
          <div>Die Werte aus den folgenden Feldern werden automatisch vorausgefüllt, wenn Sie einen neuen Abflug oder eine
            neue Ankunft erfassen.
          </div>
          <StyledSection>
            <StyledSectionTitle>Pilot</StyledSectionTitle>
            <FieldSet gutter={false}>
              {__CONF__.memberManagement === true && (
                <Field
                  name="memberNr"
                  type="text"
                  label="Mitgliedernummer"
                  component={renderInputField}
                />
              )}
            </FieldSet>
            <FieldSet gutter={false}>
              <Field
                name="lastname"
                type="text"
                label="Nachname"
                component={renderInputField}
              />
              <Field
                name="firstname"
                type="text"
                label="Vorname"
                component={renderInputField}
              />
            </FieldSet>
            <FieldSet gutter={false}>
              <Field
                name="email"
                type="email"
                label="E-Mail"
                component={renderInputField}
              />
              <Field
                name="phone"
                type="tel"
                label="Telefon"
                component={renderInputField}
              />
            </FieldSet>
          </StyledSection>

          <StyledSection>
            <StyledSectionTitle>Flugzeug</StyledSectionTitle>
            <FieldSet gutter={false}>
              <Field name="immatriculation">
                {({input, meta}) =>
                  renderAircraftDropdown({
                    input: {
                      ...input,
                      onChange: aircraft => {
                        if (aircraft) {
                          input.onChange(aircraft.key);
                          form.change('aircraftType', aircraft.type);
                          form.change('mtow', aircraft.mtow);
                          form.change('aircraftCategory', aircraft.category);
                        } else {
                          input.onChange(null);
                        }
                      }
                    },
                    meta,
                    label: "Immatrikulation",
                    clearable: true,
                  })
                }
              </Field>
              <Field
                name="aircraftType"
                type="text"
                component={renderInputField}
                label="Typ"
              />
              <Field
                name="mtow"
                type="number"
                component={renderInputField}
                label="Maximales Abfluggewicht (in Kilogramm)"
                parse={input => {
                  if (typeof input === 'number') {
                    return input;
                  }
                  if (typeof input === 'string' && /^\d+$/.test(input)) {
                    return parseInt(input);
                  }
                  return null;
                }}
              />
              <Field
                name="aircraftCategory"
                component={renderAircraftCategoryDropdown}
                label="Kategorie"
                clearable
              />
            </FieldSet>
          </StyledSection>

          <div>
            <Button
              type="submit"
              label="Speichern"
              icon="save"
              disabled={!dirty || props.saving}
              loading={props.saving}
              primary/>
          </div>
        </StyledForm>
      )}
    </Form>
  )
}

ProfileForm.propTypes = {
  profile: PropTypes.object,
  saving: PropTypes.bool,
  saveProfile: PropTypes.func.isRequired
}

export default ProfileForm;
