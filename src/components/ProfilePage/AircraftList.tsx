import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Field, Form } from 'react-final-form';
import type { Aircraft } from '../../modules/profile/migration';
import { renderAircraftDropdown, renderAircraftCategoryDropdown, renderInputField } from '../wizards/renderField';
import FieldSet from '../wizards/FieldSet';
import Button from '../Button';
import MaterialIcon from '../MaterialIcon';

const Section = styled.div`
  padding: 1em;
  border: 1px solid #ddd;
  background-color: #fefefe;
  box-shadow: 0 -1px 0 rgba(0,0,0,.03), 0 0 2px rgba(0,0,0,.03), 0 2px 4px rgba(0,0,0,.06);
`;

const SectionTitle = styled.h1`
  font-weight: bold;
  font-size: 1.5em;
  margin-bottom: 1em;
`;

const AddForm = styled.div`
  margin-bottom: 1.5em;
  padding-bottom: 1.5em;
  border-bottom: 1px solid #eee;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5em;
`;

const Item = styled.div`
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75em 1em;
  cursor: pointer;

  &:hover {
    background-color: #fafafa;
  }
`;

const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1em;
  flex-wrap: wrap;
`;

const Registration = styled.span`
  font-weight: bold;
`;

const Detail = styled.span`
  color: #666;
  font-size: 0.9em;
`;

const ItemActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25em;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 4px;
  font-family: inherit;

  &:hover {
    color: ${props => props.theme.colors.danger};
  }
`;

const EditIcon = styled(IconButton)`
  &:hover {
    color: ${props => props.theme.colors.main};
  }
`;

const ItemBody = styled.div`
  padding: 1em;
  border-top: 1px solid #eee;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.5em;
  margin-top: 0.5em;
`;

const EmptyMessage = styled.div`
  color: #999;
  font-style: italic;
  padding: 0.5em 0;
`;

function aircraftFormFields(t: any, form: any) {
  return (
    <>
      <FieldSet gutter={false}>
        <Field name="immatriculation">
          {({ input, meta }) =>
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
              label: t('profile.immatriculation'),
              clearable: true,
            })
          }
        </Field>
        <Field
          name="aircraftType"
          type="text"
          component={renderInputField}
          label={t('profile.type')}
        />
      </FieldSet>
      <FieldSet gutter={false}>
        <Field
          name="mtow"
          type="number"
          component={renderInputField}
          label={t('profile.mtow')}
          parse={input => {
            if (typeof input === 'number') return input;
            if (typeof input === 'string' && /^\d+$/.test(input)) return parseInt(input);
            return null;
          }}
        />
        <Field
          name="aircraftCategory"
          component={renderAircraftCategoryDropdown}
          label={t('profile.category')}
          clearable
        />
      </FieldSet>
    </>
  );
}

interface AircraftListProps {
  aircrafts: Aircraft[];
  addAircraft: (aircraft: Aircraft) => void;
  updateAircraft: (index: number, aircraft: Aircraft) => void;
  removeAircraft: (index: number) => void;
}

const AircraftList: React.FC<AircraftListProps> = ({ aircrafts, addAircraft, updateAircraft, removeAircraft }) => {
  const { t } = useTranslation();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = (values: Record<string, any>, form: any) => {
    if (values.immatriculation) {
      addAircraft({
        immatriculation: values.immatriculation || null,
        aircraftType: values.aircraftType || null,
        mtow: values.mtow ?? null,
        aircraftCategory: values.aircraftCategory || null,
      });
      setTimeout(() => form.restart());
    }
  };

  const handleUpdate = (index: number) => (values: Record<string, any>) => {
    updateAircraft(index, {
      immatriculation: values.immatriculation || null,
      aircraftType: values.aircraftType || null,
      mtow: values.mtow ?? null,
      aircraftCategory: values.aircraftCategory || null,
    });
    setEditingIndex(null);
  };

  return (
    <Section>
      <SectionTitle>{t('profile.aircraft')}</SectionTitle>

      <AddForm>
        <Form onSubmit={handleAdd}>
          {({ handleSubmit, form }) => (
            <form onSubmit={handleSubmit}>
              {aircraftFormFields(t, form)}
              <Button
                label={t('profile.addAircraft')}
                icon="add"
                type="submit"
                primary
              />
            </form>
          )}
        </Form>
      </AddForm>

      <List>
        {aircrafts.length === 0 && (
          <EmptyMessage>{t('profile.noAircraft')}</EmptyMessage>
        )}
        {aircrafts.map((aircraft, index) => (
          <Item key={`${aircraft.immatriculation}-${index}`}>
            <ItemHeader onClick={() => setEditingIndex(editingIndex === index ? null : index)}>
              <ItemInfo>
                <Registration>{aircraft.immatriculation}</Registration>
                {aircraft.aircraftType && <Detail>{aircraft.aircraftType}</Detail>}
                {aircraft.mtow != null && <Detail>{aircraft.mtow} kg</Detail>}
                {aircraft.aircraftCategory && <Detail>{aircraft.aircraftCategory}</Detail>}
              </ItemInfo>
              <ItemActions>
                <EditIcon
                  onClick={e => { e.stopPropagation(); setEditingIndex(editingIndex === index ? null : index); }}
                  title={t('common.edit')}
                >
                  <MaterialIcon icon={editingIndex === index ? 'expand_less' : 'edit'}/>
                </EditIcon>
                <IconButton
                  onClick={e => { e.stopPropagation(); removeAircraft(index); }}
                  title={t('profile.removeAircraft')}
                >
                  <MaterialIcon icon="delete"/>
                </IconButton>
              </ItemActions>
            </ItemHeader>
            {editingIndex === index && (
              <ItemBody>
                <Form onSubmit={handleUpdate(index)} initialValues={aircraft}>
                  {({ handleSubmit, dirty, form }) => (
                    <form onSubmit={handleSubmit}>
                      {aircraftFormFields(t, form)}
                      <ButtonRow>
                        <Button
                          label={t('profile.save')}
                          icon="save"
                          type="submit"
                          disabled={!dirty}
                          primary
                        />
                      </ButtonRow>
                    </form>
                  )}
                </Form>
              </ItemBody>
            )}
          </Item>
        ))}
      </List>
    </Section>
  );
};

export default AircraftList;
