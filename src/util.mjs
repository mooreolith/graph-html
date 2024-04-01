/*
  Global utility functions
*/

class Util {
  static #vertexId = 0
  static #edgeId = 0

  static vertexId() {
    return `vertex-${Util.#vertexId++}`
  }

  static edgeId(){
    return `edge-${Util.#edgeId++}`
  }

  static coalesce(...args) {
    const obj = {}
    for (const arg of args) {
      for(const key in arg){
        if(arg[key]){
          obj[key] = arg[key]
        }
      }
    }

    return obj
  }
}

export {
  Util as Util
}