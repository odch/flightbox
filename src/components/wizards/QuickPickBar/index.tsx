import styled from 'styled-components';

// Shared styling for the wizard "quick pick" chip bars (aircraft favourites,
// aerodrome favourites). Keep visual parity across both usages.

export const FavouritesBar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6em;
  padding: 0.4em 1em;
  margin: 0 1em 1em;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
`;

export const StarIcon = styled.span`
  color: #e8a735;
  display: flex;
  align-items: center;
  font-size: 1.1em;
`;

export const Chip = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4em;
  padding: 0.5em 0.9em;
  min-height: 44px;
  line-height: 1;
  border: 1px solid ${props => props.$active ? props.theme.colors.main : '#ddd'};
  border-radius: 3px;
  background-color: ${props => props.$active ? props.theme.colors.main : '#fff'};
  color: ${props => props.$active ? '#fff' : '#555'};
  font-family: inherit;
  font-size: 0.9em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${props => props.theme.colors.main};
    color: ${props => props.$active ? '#fff' : props.theme.colors.main};
  }
`;
