import React, {PropTypes} from 'react';
import styled from 'styled-components';
import MovementHeader from './MovementHeader';
import MovementDetails from './MovementDetails';
import Action from './Action';

const Wrapper = styled.div`
  background-color: #fbfbfb;
  box-shadow: 0 -1px 0 #e0e0e0, 0 0 2px rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.24);
  
  ${props => props.selected && `
    margin: 20px -10px 20px -10px;
    
    @media (max-width: 768px) {
      margin: 10px -3px 10px -3px;
    }
  `}
`;

const Footer = styled.div`
  background-color: #fff;
  text-align: right;
  padding-right: 0.7em;
  padding-bottom: 0.7em;
  font-size: 1.3em;
`;

class Movement extends React.PureComponent {

  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleActionClick = this.handleActionClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleEditClick = this.handleEditClick.bind(this);
  }

  render() {
    const props = this.props;

    return (
      <Wrapper selected={props.selected}>
        <MovementHeader
          onClick={this.handleClick}
          selected={props.selected}
          data={props.data}
          timeWithDate={props.timeWithDate}
          onAction={props.onAction}
          actionIcon={props.actionIcon}
          actionLabel={props.actionLabel}
          onDelete={props.onDelete}
          locked={props.locked}
        />
        {props.selected && (
          <div>
            <MovementDetails
              data={props.data}
              locked={props.locked}
            />
            {!props.locked && (
              <Footer>
                <Action
                  label="Bearbeiten"
                  icon="edit"
                  onClick={this.handleEditClick}
                />
              </Footer>
            )}
          </div>
        )}
      </Wrapper>
    );
  }

  handleClick() {
    const selected = this.props.selected ? null : this.props.data.key;
    this.props.onSelect(selected);
  }

  handleActionClick(e) {
    e.stopPropagation(); // prevent call of onClick handler
    this.props.onAction(this.props.data.key);
  }

  handleDeleteClick(e) {
    e.stopPropagation(); // prevent call of onClick handler
    this.props.onDelete(this.props.data);
  }

  handleEditClick() {
    this.props.onEdit(this.props.data.key);
  }
}

Movement.propTypes = {
  data: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  timeWithDate: PropTypes.bool,
  onAction: PropTypes.func.isRequired,
  actionIcon: PropTypes.string.isRequired,
  actionLabel: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
  locked: PropTypes.bool,
};

Movement.defaultProps = {
  timeWithDate: true,
};

export default Movement;
