import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';
import ItemList from '../ItemList'
import Button from '../Button'
import DeleteDialog from './DeleteDialog'

const Wrapper = styled.div`
  margin-bottom: 1rem;
  border: 1px solid #eee;
`

const Header = styled.div`
  font-size: 1.3em;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem;
`;

const Name = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`

const Details = styled.div`
  padding: 1rem;
  font-size: 0.8em;
`

const ButtonContainer = styled.div`
  text-align: right
`

class InvoiceRecipient extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      newEmail: '',
      recipientDeleteDialogOpen: false
    }
  }

  componentDidUpdate(prevProps) {
    // Check if a new email was successfully added
    const prevEmails = prevProps.recipient.emails || []
    const currentEmails = this.props.recipient.emails || []
    if (prevEmails.length < currentEmails.length) {
      this.setState({newEmail: ''});
    }
  }

  render() {
    const {recipient, expanded, onRemove, onAddEmail, onRemoveEmail, onExpandedChange} = this.props

    const sortedEmails = [...(recipient.emails || [])].sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    )

    return (
      <>
        <Wrapper expanded={expanded}>
          <Header onClick={() => onExpandedChange(!expanded)}>
            <Name>
              <MaterialIcon icon={expanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}/>
              <div>{recipient.name}</div>
            </Name>
          </Header>
          {expanded && (
            <Details>
              <ItemList items={sortedEmails}
                        placeholder="Berechtigtes Login (E-Mail)"
                        newItem={this.state.newEmail}
                        newItemInputType="email"
                        changeNewItem={value => {
                          this.setState({
                            newEmail: value
                          })
                        }}
                        addItem={onAddEmail}
                        removeItem={onRemoveEmail}/>
              <ButtonContainer>
                <Button label="Löschen" icon="delete" danger onClick={() => {
                  this.setState({
                    recipientDeleteDialogOpen: true
                  })
                }}/>
              </ButtonContainer>
            </Details>
          )}
        </Wrapper>
        {this.state.recipientDeleteDialogOpen && (
          <DeleteDialog
            question={`Möchten Sie den Rechnungsempfänger "${recipient.name}" wirklich löschen?`}
            onConfirm={() => onRemove()}
            onCancel={() => {
              this.setState({
                recipientDeleteDialogOpen: false
              })
            }}/>
        )}
      </>
    )
  }
}

InvoiceRecipient.propTypes = {
  recipient: PropTypes.shape({
    name: PropTypes.string.isRequired,
    emails: PropTypes.arrayOf(PropTypes.string)
  }),
  onRemove: PropTypes.func,
  onAddEmail: PropTypes.func,
  onRemoveEmail: PropTypes.func,
  onExpandedChange: PropTypes.func,
};

export default InvoiceRecipient;
