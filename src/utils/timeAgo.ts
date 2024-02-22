import i18n from 'i18next';

const timeAgo = (timeDifference: number, i18nInstance: typeof i18n): string => {
  if (timeDifference < 0) {
    return i18nInstance.t('just_now');
  } else {
    const seconds = Math.round(timeDifference) / 1000;
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(seconds / (60 * 60));
    const days = Math.round(seconds / (60 * 60 * 24));
    const months = Math.round(seconds / (60 * 60 * 24 * 30));
    const years = Math.round(seconds / (60 * 60 * 24 * 30 * 365.25));
    if (years > 0) {
      return `${years} ${
        years === 1 ? i18nInstance.t('year') : i18nInstance.t('years')
      } ${i18nInstance.t('ago')}`;
    } else if (months > 0) {
      return `${months} ${
        months === 1 ? i18nInstance.t('month') : i18nInstance.t('months')
      } ${i18nInstance.t('ago')}`;
    } else if (days > 0) {
      return `${days} ${
        days === 1 ? i18nInstance.t('day') : i18nInstance.t('days')
      } ${i18nInstance.t('ago')}`;
    } else if (hours > 0) {
      return `${hours} ${
        hours === 1 ? i18nInstance.t('hour') : i18nInstance.t('hours')
      } ${i18nInstance.t('ago')}`;
    } else if (minutes > 0) {
      return `${minutes} ${
        minutes === 1 ? i18nInstance.t('minute') : i18nInstance.t('minutes')
      } ${i18nInstance.t('ago')}`;
    } else {
      return i18nInstance.t('just_now');
    }
  }
};

export default timeAgo;
