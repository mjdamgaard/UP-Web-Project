
import {
  DevFunction, RuntimeError, getString,
} from "../../interpreting/ScriptInterpreter.js";
import {MainDBConnection} from "../../server/db_io/DBConnection.js";



export class Connection extends ObjectObject {
  constructor(node, env, connectionTime) {
    super("Connection");
    this.conn = undefined;
    this.connStartedAt = undefined;

    if (connectionTime) {
      this.start.fun({callerNode: node, execEnv: env}, [])
    }

    Object.assign(this.members, {
      /* Methods */
      "start": this.start,
      "end": this.end,
      "isConnected": this.isConnected,
      "startTransaction": this.startTransaction,
      "commit": this.commit,
      "rollback": this.rollback,
      "getLock": this.getLock,
      "releaseLock": this.releaseLock,
    });
  }

  start = new DevFunction(
    "start", {typeArr: ["integer positive"]},
    ({callerNode, execEnv}, [connectionTime]) => {
      if (this.conn) throw new RuntimeError(
        "Connection is already started",
        callerNode, execEnv
      );

      // Withdraw as much connection (time) gas as possibly out of the desired
      // connectionTime.
      let withdrawnConnGas = withdrawConnectionGas(
        callerNode, execEnv, connectionTime
      );

      // Start the connection, and set a timeout to end the connection and
      // throw an error if the connection was not ended in the meantime.
      let conn = this.conn = new MainDBConnection();
      this.connStartedAt = Date.now();
      setTimeout(() => {
        if (this.conn === conn) {
          this.conn.end();
          this.conn = this.connStartedAt = undefined;
          throw new RuntimeError(
            "Connection timed out",
            callerNode, execEnv
          );
        }
      }, withdrawnConnGas);

      conn.isReadyPromise.catch(err => console.error(err));
    }
  );

  end = new DevFunction(
    "end", {}, ({callerNode, execEnv}, []) => {
      if (!this.conn) throw new RuntimeError(
        "Connection was already ended",
        callerNode, execEnv
      );

      // Deposit back the connection (time) gas that wasn't used.
      depositBackConnectionGas(execEnv, this.connStartedAt);

      // Then end the connection and remove the associated properties from this
      // object.
      this.conn.end().catch(err => console.error(err));
      this.conn = this.connStartedAt = undefined;
    }
  );

  isConnected = new DevFunction(
    "isConnected", {}, ({}, []) => {
      return this.conn ? true : false;
    }
  );

  startTransaction = new DevFunction(
    "startTransaction", {isAsync: true}, async ({callerNode, execEnv}, []) => {
      if (!this.conn) throw new RuntimeError(
        "Connection was not started before being used",
        callerNode, execEnv
      );
      return await this.conn.startTransaction();
    }
  );
  commit = new DevFunction(
    "commit", {isAsync: true}, async ({callerNode, execEnv}, []) => {
      if (!this.conn) throw new RuntimeError(
        "Connection was not started before being used",
        callerNode, execEnv
      );
      return await this.conn.commit();
    }
  );
  rollback = new DevFunction(
    "rollback", {isAsync: true}, async ({callerNode, execEnv}, []) => {
      if (!this.conn) throw new RuntimeError(
        "Connection was not started before being used",
        callerNode, execEnv
      );
      return await this.conn.rollback();
    }
  );

  getLock = new DevFunction(
    "getLock", {isAsync: true, typeArr: ["string", "integer unsigned"]},
    async ({callerNode, execEnv}, [name, time = 10]) => {
      if (time > 10) time = 10;
      if (!this.conn) throw new RuntimeError(
        "Connection was not started before being used",
        callerNode, execEnv
      );
      return await this.conn.getLock(name, time);
    }
  );
  releaseLock = new DevFunction(
    "releaseLock", {isAsync: true, typeArr: ["string"]},
    async ({callerNode, execEnv}, [name]) => {
      name = getString(name, callerNode, execEnv);
      if (!this.conn) throw new RuntimeError(
        "Connection was not started before being used",
        callerNode, execEnv
      );
      return await this.conn.releaseLock(name);
    }
  );

}


function withdrawConnectionGas(node, env, connectionTime) {
  // Withdraw conn gas, and throw if there is none (or not enough) to withdraw.
}

function depositBackConnectionGas(env, connStartedAt) {
  // Deposit back the connection (time) gas that wasn't used.
}



export const getConnection = new DevFunction(
  "getConnection", {typeArr: ["integer unsigned"]},
  ({callerNode, execEnv}, [connectionTime]) => {
    return new Connection(callerNode, execEnv, connectionTime);
  }
);
