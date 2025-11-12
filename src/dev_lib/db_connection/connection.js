
import {
  DevFunction, ObjectObject, RuntimeError, getString, OutOfGasError,
  GAS_NAMES,
} from "../../interpreting/ScriptInterpreter.js";
import {MainDBConnection} from "../../server/db_io/DBConnection.js";
import {ELEVATED_PRIVILEGES_FLAG} from "../query/src/flags.js";




export const getConnection = new DevFunction(
  "getConnection",
  {isAsync: true, typeArr: ["integer unsigned?", "any?", "string?"]}, async (
    execVars, [connectionTime, startTransaction = true, lockName]
  ) => {
    let connection = new Connection();

    // If connectionTime is a positive integer, start the connection right away.
    if (connectionTime) {
      await connection.start.fun(execVars, [connectionTime, startTransaction]);

      // And if lockName is also defined, get a lock at the same time of that
      // name.
      if (lockName !== undefined) {
        await connection.getLock.fun(execVars, [lockName, connectionTime]);
      }
    }
    return connection;
  }
);




export class Connection extends ObjectObject {
  constructor() {
    super("Connection");
    this.conn = undefined;
    this.connStartedAt = undefined;
    this.withdrawnConnGas = undefined;

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
    "start", {isAsync: true, typeArr: ["integer positive", "any?"]}, async (
      {callerNode, execEnv, interpreter},
      [connectionTime, startTransaction = true]
    ) => {
      if (this.conn) throw new RuntimeError(
        "Connection is already started",
        callerNode, execEnv
      );

      // TODO: Consider removing this line, but do so only if it is made sure
      // that connection timeout errors don't cause the server to halt.
      if (connectionTime > 8) connectionTime = 8; 

      // Withdraw as much connection (time) gas as possibly out of the desired
      // connectionTime.
      let connectionGas = connectionTime * 1000;
      this.withdrawnConnGas = withdrawConnectionGas(
        callerNode, execEnv, connectionGas
      );

      // Start the connection, and set a timeout to end the connection and
      // throw an error if the connection was not ended in the meantime.
      let conn = this.conn = new MainDBConnection();
      this.connStartedAt = Date.now();
      setTimeout(() => {
        if (this.conn === conn) {
          conn.end();
          this.conn = this.connStartedAt = this.withdrawnConnGas = undefined;
          interpreter.handleUncaughtException(
            new RuntimeError(
              "Connection timed out",
              callerNode, execEnv
            ),
            execEnv
          );
        }
      }, this.withdrawnConnGas);

      // If startTransaction = true, start a transaction.
      await conn.isReadyPromise;
      if (startTransaction) {
        await conn.startTransaction();
      }
    }
  );

  end = new DevFunction(
    "end", {isAsync: true}, async ({callerNode, execEnv}, [commit = true]) => {
      if (!this.conn) throw new RuntimeError(
        "Connection was already ended",
        callerNode, execEnv
      );

      // Deposit back the connection (time) gas that wasn't used.
      depositBackConnectionGas(
        execEnv, this.withdrawnConnGas, this.connStartedAt
      );

      // Then remove the associated properties from this object.
      let conn = this.conn;
      this.conn = this.connStartedAt = this.withdrawnConnGas = undefined;

      // If commit is true, commit any current transaction, and if it is false
      // (and not just nullish), roll back any current transaction. 
      if (commit) {
        await conn.commit();
      }
      else if (commit === false) {
        await conn.rollback();
      }

      // Then end the connection and remove the associated properties from this
      // object.
      await conn.end();
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
      name = getString(name, execEnv);
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
  releaseAllLocks = new DevFunction(
    "releaseAllLocks", {isAsync: true},
    async ({callerNode, execEnv}, []) => {
      if (!this.conn) throw new RuntimeError(
        "Connection was not started before being used",
        callerNode, execEnv
      );

      return await this.conn.releaseAllLocks();
    }
  );

}


function withdrawConnectionGas(node, env, connectionGas) {
  let {gas} = env.scriptVars;
  if ((gas.conn ?? 0) <= 20) throw new OutOfGasError(
    "Ran out of " + GAS_NAMES.conn + " gas",
    node, env
  );
  let ret = (gas.conn < connectionGas) ? gas.conn : connectionGas;
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

