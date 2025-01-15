import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Select, Option } from './ui/select';

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-selector">
      <Select
        value={i18n.language}
        onChange={changeLanguage}
        aria-label={t('languageSelector.label')}
      >
        <Option value="en">{t('languageSelector.english')}</Option>
        <Option value="es">{t('languageSelector.spanish')}</Option>
        <Option value="fr">{t('languageSelector.french')}</Option>
        <Option value="de">{t('languageSelector.german')}</Option>
      </Select>
    </div>
  );
};

export default LanguageSelector;
