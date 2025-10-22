import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';

const Wrapper = styled.div`
  width: 250px;
  background-color: ${props => props.theme.colors.background};
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  box-shadow: 0 -1px 0 rgba(0,0,0,.03), 0 0 2px rgba(0,0,0,.03), 0 2px 4px rgba(0,0,0,.06);

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    flex-direction: row;
  }
`;

const Header = styled.div`
  padding: 1rem;
  background-color: #fefefe;
  border-bottom: 1px solid #ddd;

  @media (max-width: 768px) {
    display: none;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5em;
  font-weight: bold;
  color: ${props => props.theme.colors.main};
`;

const Menu = styled.nav`
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    padding: 0;
  }
`;

const MenuItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
  font-size: 1em;

  &:hover {
    background-color: rgba(0,0,0,.03);
  }

  ${props => props.active && `
    background-color: ${props.theme.colors.main};
    color: white;

    &:hover {
      background-color: ${props.theme.colors.main};
    }
  `}

  @media (max-width: 768px) {
    flex: 1 1 calc(50% - 0px);
    min-width: 0;
    padding: 0.75rem 0.5rem;
    text-align: center;
    flex-direction: column;
    justify-content: center;
    font-size: 0.9em;
  }
`;

const IconWrapper = styled.span`
  margin-right: 0.75rem;
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    margin-right: 0;
    margin-bottom: 0.25rem;
  }
`;

const Label = styled.span`
  font-weight: 400;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 0.8em;
  }
`;

const AdminNavigation = ({ activeTab, hiddenTabs, onTabChange }) => {
  const navigationItems = [
    { key: 'export', label: 'Export', icon: 'file_download' },
    { key: 'lock-movements', label: 'Bewegungen sperren', icon: 'lock' },
    { key: 'aerodrome-status', label: 'Flugplatz-Status', icon: 'traffic' },
    { key: 'messages', label: 'Nachrichten', icon: 'message' },
    { key: 'aircraft', label: 'Flugzeuge', icon: 'flight' },
    { key: 'invoice-recipients', label: 'Rechnungsempfänger', icon: 'receipt' },
    { key: 'guest-access', label: 'Gast-Login', icon: 'person_add' },
    { key: 'import', label: 'Import', icon: 'file_upload' },
  ].filter(item => !hiddenTabs.includes(item.key));

  return (
    <Wrapper>
      <Header>
        <Title>Administration</Title>
      </Header>
      <Menu>
        {navigationItems.map(item => (
          <MenuItem
            key={item.key}
            active={activeTab === item.key}
            onClick={() => onTabChange(item.key)}
          >
            <IconWrapper>
              <MaterialIcon icon={item.icon} />
            </IconWrapper>
            <Label>{item.label}</Label>
          </MenuItem>
        ))}
      </Menu>
    </Wrapper>
  );
};

AdminNavigation.propTypes = {
  activeTab: PropTypes.string.isRequired,
  hiddenTabs: PropTypes.arrayOf(PropTypes.string).isRequired,
  onTabChange: PropTypes.func.isRequired,
};

export default AdminNavigation;
