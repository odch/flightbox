import React, {PropTypes} from 'react';
import styled from 'styled-components';

const Wrapper = styled.nav`
  padding: 1em;
`;

const List = styled.ol`
  list-style-type: none;
  display: flex;
  justify-content: space-between;
`;

const Item = styled.li`
  float: left;
  display: block;
`;

const A = styled.a`
  color: #000;
  text-decoration: none;
  cursor: pointer;
  
  ${props => props.noHandler && `cursor: default;`}
  ${props => props.active && `color: ${props.theme.colors.main};`}
`;


const arePreviousItemsValid = (items, index) => {
  for (let i = 0; i < index; i++) {
    if (items[i].valid === false) {
      return false;
    }
  }
  return true;
};

class WizardBreadcrumbs extends React.PureComponent {

  render() {
    const props = this.props;
    return (
      <Wrapper>
        <List>
          {props.items.map((item, index) => {
            const active = index === props.activeItem;
            const handler = arePreviousItemsValid(props.items, index) ? item.handler : undefined;
            return (
              <Item key={index}>
                <A onMouseDown={handler} tabIndex="-1" active={active} noHandler={!handler}>{item.label}</A>
              </Item>
            );
          })}
        </List>
      </Wrapper>
    );
  }
}

WizardBreadcrumbs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      handler: PropTypes.func,
      valid: PropTypes.bool,
    })
  ).isRequired,
  activeItem: PropTypes.number,
};

export default WizardBreadcrumbs;
