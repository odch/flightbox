import PropTypes from 'prop-types'
import FieldSet from '../wizards/FieldSet'
import { useTranslation } from 'react-i18next';
import {Field, Form} from 'react-final-form'
import {renderInputField, renderPhoneField} from '../wizards/renderField'
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
  const { t } = useTranslation();

  const handleSubmit = (values) => {
    props.saveProfile(values)
  }

  return (
    <Form onSubmit={handleSubmit} initialValues={props.profile}>
      {({handleSubmit, dirty, form}) => (
        <StyledForm onSubmit={handleSubmit}>
          <StyledSectionTitle>{t('profile.defaultValues')}</StyledSectionTitle>
          <div>{t('profile.defaultValuesDesc')}</div>
          <StyledSection>
            <StyledSectionTitle>{t('profile.pilot')}</StyledSectionTitle>
            <FieldSet gutter={false}>
              {__CONF__.memberManagement === true && (
                <Field
                  name="memberNr"
                  type="text"
                  label={t('profile.memberNr')}
                  component={renderInputField}
                />
              )}
            </FieldSet>
            <FieldSet gutter={false}>
              <Field
                name="lastname"
                type="text"
                label={t('profile.lastname')}
                component={renderInputField}
              />
              <Field
                name="firstname"
                type="text"
                label={t('profile.firstname')}
                component={renderInputField}
              />
            </FieldSet>
            <FieldSet gutter={false}>
              <Field
                name="email"
                type="email"
                label={t('profile.email')}
                component={renderInputField}
              />
              <Field
                name="phone"
                label={t('profile.phone')}
                component={renderPhoneField}
              />
            </FieldSet>
            <Button
              type="submit"
              label={t('profile.save')}
              icon="save"
              disabled={!dirty || props.saving}
              loading={props.saving}
              primary/>
          </StyledSection>
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
