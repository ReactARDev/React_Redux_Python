import moment from 'moment';

// given a document, create a string containing the key dates
export function getKeyDates(document, dateFormat, short = false) {
  const rule = document.rule || {};

  let keyDates = '';

  if (rule.comments_close_on) {
    if (short) {
      keyDates += 'Comments close ';
    } else {
      keyDates += 'Comments should be received on or before ';
    }
    keyDates += moment(rule.comments_close_on).format(dateFormat);
    if (short) {
      keyDates += ' ';
    } else {
      keyDates += '. ';
    }
  }

  if (rule.effective_on) {
    keyDates += 'Effective ';
    keyDates += moment(rule.effective_on).format(dateFormat);
    if (!short) {
      keyDates += '. ';
    }
  }

  return keyDates;
}

export const today = moment.utc().format('MM/DD/YYYY');
export const sevenDaysAgo = moment
  .utc()
  .subtract(6, 'days')
  .format('MM/DD/YYYY');
export const threeMonthsAgo = moment
  .utc()
  .subtract(3, 'months')
  .add(1, 'days')
  .format('MM/DD/YYYY');
export const sixMonthsAgo = moment
  .utc()
  .subtract(6, 'months')
  .add(1, 'days')
  .format('MM/DD/YYYY');
export const yearAgo = moment
  .utc()
  .subtract(1, 'years')
  .add(1, 'days')
  .format('MM/DD/YYYY');
export const twoYearsAgo = moment
  .utc()
  .subtract(2, 'years')
  .add(1, 'days')
  .format('MM/DD/YYYY');
