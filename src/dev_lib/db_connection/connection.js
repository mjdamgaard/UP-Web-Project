
import {
  DevFunction, ObjectObject, RuntimeError, getString,
} from "../../interpreting/ScriptInterpreter.js";
import {MainDBConnection} from "../../server/db_io/DBConnection.js";
import {ELEVATED_PRIVILEGES_FLAG} from "../query/src/flags.js";



export class Connection extends ObjectObject {
  constructor(node, env, connectionTime) {
    super("Connection");
    this.conn = undefined;
    this.connStartedAt = undefined;
    this.withdrawnConnGas = undefined;

    if (connectionTime) {
      this.start.fun({callerNode: node, execEnv: env}, [connectionTime])
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
      this.withdrawnConnGas = withdrawConnectionGas(
        callerNode, execEnv, connectionTime
      );

      // Start the connection, and set a timeout to end the connection and
      // throw an error if the connection was not ended in the meantime.
      let conn = this.conn = new MainDBConnection();
      this.connStartedAt = Date.now();
      setTimeout(() => {
        if (this.conn === conn) {
          this.conn.end();
          this.conn = this.connStartedAt = this.withdrawnConnGas = undefined;
          throw new RuntimeError(
            "Connection timed out",
            callerNode, execEnv
          );
        }
      }, this.withdrawnConnGas);

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
      depositBackConnectionGas(
        execEnv, this.withdrawnConnGas, this.connStartedAt
      );

      // Then end the connection and remove the associated properties from this
      // object.
      this.conn.end().catch(err => console.error(err));
      this.conn = this.connStartedAt = this.withdrawnConnGas = undefined;
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

      // Get the homeDirID, and add it as a prefix to the name.
      let homeDirID = execEnv.getFlag(ELEVATED_PRIVILEGES_FLAG);
      if (!homeDirID) throw new RuntimeError(
        "Cannot get a lock from this context",
        callerNode, execEnv
      );
      return await this.conn.getLock(homeDirID + "." + name, time);
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

      // Get the homeDirID, and add it as a prefix to the name.
      let homeDirID = execEnv.getFlag(ELEVATED_PRIVILEGES_FLAG);
      if (!homeDirID) throw new RuntimeError(
        "Cannot release a lock from this context",
        callerNode, execEnv
      );
      return await this.conn.releaseLock(homeDirID + "." + name);
    }
  );

}


function withdrawConnectionGas(node, env, connectionTime) {
  let {gas} = env.scriptVars;
  if ((gas.conn ?? 0) <= 20) throw new OutOfGasError(
    "Ran out of " + GAS_NAMES.conn + " gas",
    node, env
  );
  let ret = (gas.conn < connectionTime) ? gas.conn : connectionTime;
  gas.conn -= ret;
  return ret;
}

function depositBackConnectionGas(env, withdrawnGas, connStartedAt) {
  let {gas} = env.scriptVars;
  let timeSinceStarted = Date.now() - connStartedAt;
  let gasToDeposit = withdrawnGas - timeSinceStarted;
  if (gasToDeposit < 0) gasToDeposit = 0;
  gas.conn += gasToDeposit;
}



export const getConnection = new DevFunction(
  "getConnection", {typeArr: ["integer unsigned?"]},
  ({callerNode, execEnv}, [connectionTime]) => {
    return new Connection(callerNode, execEnv, connectionTime);
  }
);
