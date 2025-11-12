
import mysql from 'mysql2/promise';
import {Queue} from '../../misc/queues.js';


// The current implementation of this "connection pool" is actually not a
// connection pool, since we don't keep any connections alive after release,
// but end them immediately. But this might change in a future implementation.
// And in such future implementation, it should still be required that
// connections are guaranteed to have ended all ongoing transaction (rolling
// any such transaction back) and released all locks when releaseConnection()
// is called. (See e.g. the impl. of DBConnection in the previous commit before
// the commit that created this file for inspiration of how to do this.)



export class ConnectionPool {

  constructor(options) {
    this.options = options;
    this.requestResolveQueue = new Queue();
    this.connectionLimit = options.connectionLimit;
    this.curConnNum = 0; 
  }

  async getConnection() {
    if (this.curConnNum < this.connectionLimit) {
      this.curConnNum++;
      return await mysql.createConnection(this.options);
    }
    else {
      return await new Promise(resolve => {
        this.requestResolveQueue.enqueue(resolve);
      });
    }
  }

  async releaseConnection(conn) {
    await conn.end();
    this.curConnNum--;
    while (this.curConnNum < this.connectionLimit) {
      let resolve = this.requestResolveQueue.dequeue();
      if (!resolve) break;
      this.curConnNum++;
      let conn = await mysql.createConnection(this.options)
      resolve(conn);
    }
  }
}


export {ConnectionPool as default};
