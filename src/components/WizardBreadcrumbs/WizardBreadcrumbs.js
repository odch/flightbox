import React, {PropTypes} from 'react';
import styled from 'styled-components';

const Wrapper = styled.nav`
  padding: 1em;
`;

const List = styled.ol`
  list-style-type: none;
  display: flex;
  justify-content: space-between;
  margin-bottom: 1em;
`;

const Title = styled.div`
  line-height: 2em;
  color: ${props => props.theme.colors.main};
  font-weight: bold;
  font-size: 1.5em;
  margin-bottom: 1em;
  
  @media (min-width: 1000px) {
    float: left;
    margin-right: 3em;
  }
`;

const Item = styled.li`
  position: relative;
  float: left;
  display: block;
  text-align: center;
`;

const Number = styled.div`
  position: relative;
  display: inline-block;
  margin-bottom: 0.4em;
  width: 2em;
  line-height: 2em;
  border-radius: 50%;
  
  ${props => props.active
    ? `
      background-color: ${props.theme.colors.main};
      color: #fff;
    `
    :`
      background-color: ${props.theme.colors.background};
    `
  }
  
  &:before {
    content: '';
    position: absolute;
    top: .9em;
    left: -100em;
    width: 100em;
    height: .2em;
    
    ${props => props.first
      ? `
        background-color: #fff;
        z-index: -1;
      `
      : `
        background-color: ${props.theme.colors.background};
        z-index: -2;
      `
    }
  }
`;

const Text = styled.div`
  color: #000;
  text-decoration: none;

  ${props => props.active && `
    color: ${props.theme.colors.main};
    font-size: 1.3em;
  `}
  
  @media (max-width: 540px) {
    ${props => !props.active && `display: none;`}
  }
`;

class WizardBreadcrumbs extends React.PureComponent {

  render() {
    const props = this.props;
    return (
      <Wrapper>
        {props.title && <Title>{props.title}</Title>}
        <List>
          {props.items.map((item, index) => {
            const active = index === props.activeItem;
            return (
              <Item key={index}>
                <Number active={active} first={index === 0}>{index + 1}</Number>
                <Text active={active}>{item.label.replace(/ /g, '\u00a0')}</Text>
              </Item>
            );
          })}
        </List>
      </Wrapper>
    );
  }
}

WizardBreadcrumbs.propTypes = {
  title: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  activeItem: PropTypes.number,
};

export default WizardBreadcrumbs;
