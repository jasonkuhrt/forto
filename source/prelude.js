/* eslint-disable no-param-reassign */
import isEqual from "lodash.isequal";

const splitWith = (f, xs) => {
  const a = [],
    b = [];
  xs.forEach(x => (f(x) ? a : b).push(x));
  return [a, b];
};

const first = x => x[0];

const mapObject = (object, f) =>
  Object.keys(object).reduce((objectNew, key) => {
    objectNew[key] = f(object[key]);
    return objectNew;
  }, {});

const precision = (p, n) => Number(n.toFixed(p));

const isExists = x => x !== null && x !== undefined;

const defaultsTo = (x, o) => (isExists(o) ? o : x);

export {
  defaultsTo,
  first,
  mapObject,
  isEqual,
  isExists,
  splitWith,
  precision
};
