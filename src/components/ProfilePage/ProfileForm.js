import FieldSet from '../wizards/FieldSet'
import {Field, reduxForm} from 'redux-form'
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

  const handleSubmit = (e) => {
    e.preventDefault();
    props.saveProfile()
  }

  return (
    <StyledForm onSubmit={handleSubmit}>
      <StyledSectionTitle>Standard-Eingabewerte</StyledSectionTitle>
      <div>Die Werte aus den folgenden Feldern werden automatisch vorausgefüllt, wenn Sie einen neuen Abflug oder eine
        neue Ankunft erfassen.</div>
      <StyledSection>
        <StyledSectionTitle>Pilot</StyledSectionTitle>
          <FieldSet gutter={false}>
            <Field
              name="memberNr"
              type="text"
              label="Mitgliedernummer"
              component={renderInputField}
              readOnly={props.readOnly}
            />
          </FieldSet>
        <FieldSet gutter={false}>
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
        <FieldSet gutter={false}>
            <Field
              name="email"
              type="email"
              label="E-Mail"
              component={renderInputField}
              readOnly={props.readOnly}
            />
            <Field
              name="phone"
              type="tel"
              label="Telefon"
              component={renderInputField}
              readOnly={props.readOnly}
            />
          </FieldSet>
      </StyledSection>

      <StyledSection>
        <StyledSectionTitle>Flugzeug</StyledSectionTitle>
        <FieldSet gutter={false}>
          <Field
            name="immatriculation"
            component={renderAircraftDropdown}
            label="Immatrikulation"
            readOnly={props.readOnly}
            clearable
            normalize={aircraft => {
              if (aircraft) {
                props.change('aircraftType', aircraft.type);
                props.change('mtow', aircraft.mtow);
                props.change('aircraftCategory', aircraft.category)

                return aircraft.key;
              }
              return null;
            }}
          />
          <Field
            name="aircraftType"
            type="text"
            component={renderInputField}
            label="Typ"
            readOnly={props.readOnly}
          />
          <Field
            name="mtow"
            type="number"
            component={renderInputField}
            label="Maximales Abfluggewicht (in Kilogramm)"
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
          />
          <Field
            name="aircraftCategory"
            component={renderAircraftCategoryDropdown}
            label="Kategorie"
            readOnly={props.readOnly}
            clearable
          />
        </FieldSet>
      </StyledSection>

      <div>
        <Button
          type="submit"
          label="Speichern"
          icon="save"
          disabled={props.disabled || !props.dirty || props.saving}
          loading={props.saving}
          primary/>
      </div>
    </StyledForm>
  )
}

export default reduxForm({
  form: 'profile',
})(ProfileForm);
