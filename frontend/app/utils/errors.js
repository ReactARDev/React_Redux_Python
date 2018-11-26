import _ from 'lodash';

export function examine_error(error, component) {
  if (!_.isArray(error)) {
    error = [error];
  }
  const error_msgs = [];
  for (const err of error) {
    // duck type XMLHttpRequest
    if (_.hasIn(err, 'status')) {
      if (!err.status) {
        // status is 0 if connection times out
        return {
          text: 'A network error has occurred. Please check your connection and try again',
          retry: true
        };
      } else if (parseInt(err.status, 10) >= 400) {
        if (component === 'subscription') {
          const errorText = JSON.parse(err.response).errors;
          return {
            text: errorText
          };
        }
        //Handle folder and saved search error messages
        if (
          component === 'folders' ||
          component === 'post_saved_search' ||
          component === 'saved_searches' ||
          component === 'document_html' ||
          component === 'folder_share'
        ) {
          const e = JSON.parse(err.response);
          error_msgs.push(e.errors);
        } else {
          // either a request error or internal server error
          // auth errors cause the user to be redirected back to login
          return {
            text: 'An error has occurred. Please reload the page and try again'
          };
        }
      }
    } else {
      //if no status ask user to refresh application and return to dashboard to clear error
      return {
        text: 'An error has occurred. Please reload the page and try again'
      };
    }
  }

  if (error_msgs.length === 1) {
    return {
      text: error_msgs[0]
    };
  }

  return {
    text: error_msgs
  };
}
