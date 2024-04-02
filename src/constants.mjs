/*
  Constants for the physics simulation.
*/

class Constants {
  // spring constant; more K, more attraction
  static K = .2

  // repulsion constant; more f0, more repulsion
  static f0 = 100.0

  // time step; more dt, faster simulation
  static dt = 0.02
  
  // damping constant; more D, more damping
  static D = 0.75 

  // minimum distance; to avoid division by zero
  static epsilon = 0.1

  // Barnes-Hut theta; more theta, less accuracy and more speed
  static theta = 0.5

  static innerDistance = 100.0
}

export {
  Constants as Constants
}