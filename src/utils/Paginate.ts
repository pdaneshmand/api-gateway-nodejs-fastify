import { FastifyRequest } from 'fastify';

export interface IPaginate {
  paginate: (req: FastifyRequest<{}>) => { skip: number; limit: number };
}

/**
 * Defines and implements a pagination model,
 *
 * Returns aggregation pipeline operator(s), for filtering and limiting the number of documents to retrieve.
 *
 * @export
 * @param {Request} req - incoming request object
 * @param {number} [pagesize] - number of documents per page, default to 20
 * @returns
 */
export function paginate(req: FastifyRequest<{}>) {
  /**
   *  Current page number, e.g. 1, 2, 3, 4, 5 ,6 etc.
   */
  const pageNumber = parseInt(req.query['pageindex']);
  const pageSize = parseInt(req.query['pagesize']);
  /**
   * Number of documents to retrieve per page
   *
   * Defaults to 20 if no value is passed as the second parameter
   */
  const count = pageSize || 20;
  const pageIndex = pageNumber || 0;
  /**
   * Number of documents to skip before fetching
   */
  const skips =
    pageIndex === 0 ? count * ((pageIndex + 1) - 1) : count * (pageIndex - 1);

  /**
   * MongoDB aggregation pipeline query
   *
   * Will return a skip and limit counter
   */
  const query = {
    skip: skips,
    limit: count,
  };

  // returns the number of documents to skips, and current page number
  return !pageNumber ? [{ $match: {} }] : query;
}
