import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { saveLanguage } from '../../modules/profile/actions';

const Wrapper = styled.div`
  display: inline-flex;
  gap: 2px;
`;

const LangButton = styled.button<{ $active: boolean }>`
  padding: 2px 6px;
  border: 1px solid ${props => props.$active ? props.theme.colors.main : '#ccc'};
  border-radius: 3px;
  background-color: ${props => props.$active ? props.theme.colors.main : 'transparent'};
  color: ${props => props.$active ? '#fff' : '#666'};
  cursor: ${props => props.$active ? 'default' : 'pointer'};
  font-size: 0.8em;
  font-weight: ${props => props.$active ? 'bold' : 'normal'};
  line-height: 1.4;

  &:hover {
    ${props => !props.$active && 'border-color: ' + props.theme.colors.main + ';'}
  }
`;

const LANGUAGES = ['de', 'en'] as const;

function LanguageSwitch({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();

  const handleChange = (lang: string) => {
    i18n.changeLanguage(lang);
    dispatch(saveLanguage(lang));
  };

  return (
    <Wrapper className={className}>
      {LANGUAGES.map(lang => (
        <LangButton
          key={lang}
          $active={i18n.language === lang}
          onClick={() => handleChange(lang)}
          aria-label={lang === 'de' ? 'Deutsch' : 'English'}
        >
          {lang.toUpperCase()}
        </LangButton>
      ))}
    </Wrapper>
  );
}

export default LanguageSwitch;
