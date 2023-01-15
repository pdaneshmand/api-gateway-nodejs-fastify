import { FastifyInstance } from 'fastify';
import * as fp from 'fastify-plugin';
import { IStatusCodesInterface, statuscodes } from './Statuscodes';
import { IJWTToken, JWTToken } from './Token';
import { IResolveLocals, resolve } from './Resolvelocals';
import { IPaginate, paginate } from './Paginate';
import { compareObjects, IObjectdiff } from './Objectdiff';
import { ICsvparser, csvParse } from './Csvparser';
import { ISheetbuilder, buildSheet } from './Sheetbuilder';
import { ICompileTemplate, compileEjs } from './Template';
import { IUploader, uploader, extractFilepath } from './Uploader';
// tslint:disable-next-line: no-empty-interface
export interface IUtilities
  extends IStatusCodesInterface,
    IResolveLocals,
    IJWTToken,
    IPaginate,
    IObjectdiff,
    ICsvparser,
    ISheetbuilder,
    ICompileTemplate,
    IUploader {}

export default fp.default(
  (app: FastifyInstance, opts: {}, done: (err?: Error) => void) => {
    app.decorate('utils', {
      statuscodes,
      resolve,
      ...JWTToken,
      paginate,
      compareObjects,
      csvParse,
      buildSheet,
      compileEjs,
      uploader,
      extractFilepath,
    });
    // pass execution to the next middleware in fastify instance
    done();
  },
);
