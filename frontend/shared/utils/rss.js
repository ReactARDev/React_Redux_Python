import { apiUrl, iframeApiKey } from '../../shared/config';
import request from 'reqwest';
import feed from 'feed';
function getDocs(callback){
  request({
    url: `${apiUrl}/docs`,
    method: 'GET',
    type: 'json',
    headers: {
      Authorization: iframeApiKey
    },
    error: error => {
      //TODO: better callback signatuer needed
      callback(JSON.parse(error.response));
    },
    success: response => {
      callback(response.documents);
    }
  });
}
export default class  RSS {
  constructor(){}
  getFeed(callback) {
      getDocs(docs =>{
        let rssFeed = new feed({
          title: 'Compliance.ai ',
          description: 'Compliance.ai feed!',
          id: 'http://compliance.ai',
          link: 'http://compliance.ai',
          copyright: 'All rights reserved 2018, Compliance.ai',
          generator: 'Complaince.ai',
          author: {
            name: 'Danielle Deibler',
            email: 'danielle@compliance.ai',
            link: 'http://compliance.ai'
          }
        });
        docs.forEach(doc => {
          let authors = [];
          let desc = doc.title;
          if (doc.full_text && doc.full_text.length <= 200 ){
            desc = doc.full_text;
          } else if (doc.full_text && doc.full_text.length > 200){
            desc = doc.full_text.substring(0,199);
          }
          doc.agencies.forEach(agency =>{
            let a = {'name': agency.name,
                     'email': agency.short_name + '@ompliance.ai',
                     'link': 'http"//compliance.ai/' + agency.short_name};
            authors.push(a);
          })
          rssFeed.addItem({
              title: doc.title,
              id: doc.id,
              link: doc.web_url,
              description: doc.category,
              content: desc,
              author: authors,
              contributor: authors,
              date: new Date(doc.publication_date),
            });
          });
        rssFeed.addCategory('Rule');
        rssFeed.addContributor({
          name: 'Danielle Deibler',
          email: 'danielle@compliance.ai',
          link: 'http://compliance.ai'
        });
        callback( rssFeed.rss2());
    });
  }
};
