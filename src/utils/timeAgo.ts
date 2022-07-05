const timeAgo = (timeDifference: number): string => {
  if (timeDifference < 0) {
    return 'just now';
  } else {
    const seconds = Math.round(timeDifference) / 1000;
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(seconds / (60 * 60));
    const days = Math.round(seconds / (60 * 60 * 24));
    const months = Math.round(seconds / (60 * 60 * 24 * 30));
    const years = Math.round(seconds / (60 * 60 * 24 * 30 * 356.25));
    if (years > 0) {
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    } else if (months > 0) {
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else if (days > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'just now';
    }
  }
};
export default timeAgo;
