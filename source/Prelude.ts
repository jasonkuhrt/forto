import isEqual from "lodash.isequal"

type Predicate<A> = (x: A) => boolean

/**
 * Partition a list based on a predicate.
 */
const splitWith = <A>(f: Predicate<A>, xs: A[]): [A[], A[]] => {
  const a: A[] = []
  const b: A[] = []
  for (const x of xs) {
    if (f(x)) {
      a.push(x)
    } else {
      b.push(x)
    }
  }
  return [a, b]
}

/**
 * Map over values of an object.
 */
const mapObject = <A extends Record<string, any>, B>(
  o: A,
  f: (a: A[keyof A]) => B,
): Record<keyof A, B> => {
  const keys: (keyof A)[] = Object.keys(o)
  return keys.reduce(
    (o2, key) => {
      o2[key] = f(o[key])
      return o2
    },
    {} as Record<keyof A, B>,
  )
}

/**
 * Try accessing the first item of an array.
 */
const head = <A>(x: A[]): undefined | A => x[0]

/**
 * Set the number of decimal places of a numebr.
 */
const precision = (p: number, n: number): number => Number(n.toFixed(p))

/**
 * Find the % difference between two numbers.
 */
const percentageDifference = (a: number, b: number): number => (a - b) / b

/**
 * Determin if something is either null or defined.
 */
const isExists = <A>(x: A): x is NonNullable<A> => x !== null && x !== undefined

/**
 * Use given default value if some value in practice does not exist.
 */
const defaultsTo = <A, B>(x: A, o: undefined | null | B) =>
  isExists(o) ? o : x

/**
 * Return the smaller of two numbers.
 */
const min = (x: number, o: number): number => {
  return x <= o ? x : o
}

/**
 * Return the larger of two numbers.
 */
const max = (x: number, o: number): number => {
  return x >= o ? x : o
}

/**
 * Omit values in a given list found in a given blacklist.
 */
const omit = <A>(blacklist: A[], values: A[]): A[] => {
  const valuesPassed = []
  for (const v of values) {
    if (blacklist.indexOf(v) === -1) {
      valuesPassed.push(v)
    }
  }
  return valuesPassed
}

/**
 * Return the first list member that passes predicate or else null.
 */
const find = <A>(f: (a: A) => boolean, xs: A[]): null | A => {
  for (const x of xs) {
    if (f(x)) return x
  }
  return null
}

/**
 * Extract the values of the given object into an array.
 */
const values = <O extends Record<string, any>>(o: O): O[keyof O][] => {
  const values = []

  for (const k in o) {
    if (o.hasOwnProperty(k)) {
      values.push(o[k])
    }
  }

  return values
}

export {
  defaultsTo,
  head,
  mapObject,
  isEqual,
  isExists,
  splitWith,
  precision,
  percentageDifference,
  min,
  max,
  omit,
  find,
  values,
}