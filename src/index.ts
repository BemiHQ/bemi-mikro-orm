import { AsyncLocalStorage } from "node:async_hooks";
import { Request, Response, NextFunction } from "express";
import Knex from "knex";

const ASYNC_LOCAL_STORAGE = new AsyncLocalStorage();
const MAX_CONTEXT_SIZE = 1000000 // ~ 1MB

const injectContext = () => {
  const originalQuery = Knex.Client.prototype.query as any
  Knex.Client.prototype.query = function(conn: any, obj: any) {
    const writeOperationsRegex = /(INSERT|UPDATE|DELETE)\s/gi;
    const context = ASYNC_LOCAL_STORAGE.getStore();
    const sql = obj.constructor === Object && obj.sql;

    if (
      context && context.constructor === Object &&
      sql && writeOperationsRegex.test(sql)
    ) {
      const contextComment = `/*Bemi ${JSON.stringify(context)} Bemi*/`
      if (contextComment.length <= MAX_CONTEXT_SIZE) {
        obj.sql = `${sql} ${contextComment}`;
        if (process.env.BEMI_DEBUG) console.log(`>>[Bemi] ${obj.sql}`);
      }
    }
    return originalQuery.call(this, conn, obj);
  };
}

export const setContext = (
  callback: (req: Request) => any
) => {
  injectContext();

  return (req: Request, _res: Response, next: NextFunction) => {
    const config = callback(req);

    ASYNC_LOCAL_STORAGE.run(config, () => {
      next();
    });
  };
};
