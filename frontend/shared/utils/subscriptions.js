import moment from 'moment';
export function latestSubscription(subscriptions) {
  // this assumes there is zero or one latest subscription
  return subscriptions.filter(subscription => subscription.latest)[0];
}

export function nextContributorTasksDate(subscriptions) {
  const latestSub = latestSubscription(subscriptions);
  if (latestSub.category === 'contributor') {
    const today = moment();
    let startDate = moment(latestSub.created_at);
    let nextStart = startDate.add(30, 'days');
    while (nextStart.isBefore(today)) {
      startDate = nextStart;
      nextStart = nextStart.add(30, 'days');
    }
    return startDate.format('l');
  }
  return '';
}
