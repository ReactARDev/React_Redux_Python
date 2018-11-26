import { fetchRecent, fetchRecentTopicsStats } from '../../app/utils/notifications';
import auth from './auth';
import ioClient from 'socket.io-client';

export function subscribeToNotifications(props, isAdmin = false, cb) {
  // connect to server and send jwt
  const socket = ioClient(process.env.JURISPECT_API_URL, {
    query: `token=${auth.getToken()}`
  });
  socket.on('notification', res => {
    if (isAdmin) {
      fetchRecentTopicsStats(props);
    } else {
      fetchRecent(props);
    }
  });
  if (!isAdmin) {
    socket.emit('join', props.current_user.user.id);
    socket.on('foldersNotification', res => {
      props.fetchCurrentUser();
    });
  }
}
