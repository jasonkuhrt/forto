/* eslint-disable */
import * as F from "ramda"
// import { Stream } from "most"
import * as FRP from "most"
import * as Dom from "../source/dom"
import * as Main from "../source/Main"
import * as H from "./Helpers"

FRP.Stream.prototype.collect = function(n) {
  return this.take(n).reduce((acc, x) => {
    acc.push(x)
    return acc
  }, [])
}

FRP.Stream.prototype.collectAll = function() {
  return this.reduce((acc, x) => {
    acc.push(x)
    return acc
  }, [])
}

window.Dom = Dom
window.FRP = FRP
window.F = F
window.H = H
