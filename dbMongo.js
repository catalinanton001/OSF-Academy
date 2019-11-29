const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;

module.exports = {
	
  /* 
   * Mongo Utility: Connect to client */

  clientConnect: async () => (

    client = await (() => (new Promise((resolve, reject) => (

      MongoClient.connect('mongodb://your-connect-string', {
        replicaSet: 'repl-set-name'
      },
      (err, client) => {
        assert.equal(null, err);
        resolve(client);
      })
    )
  )))()),

  
  /* 
   * Mongo Utility: Close client */

  clientClose: async (client) => {
    client.close();
    return true;
  }
};