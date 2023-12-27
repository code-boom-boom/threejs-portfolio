import * as THREE from 'three'
import Floor from './Floor'
import Sounds from './Sounds'

export default class World {
  constructor(_options) {
    // Options
    this.config = _options.config
    this.debug = _options.debug
    this.resources = _options.resources
    this.time = _options.time
    this.sizes = _options.sizes
    this.camera = _options.camera
    this.renderer = _options.renderer
    this.passes = _options.passes

    // Debug
    if (this.debug) {
      this.debugFolder = this.debug.addFolder('world')
      this.debugFolder.open()
    }

    // Set up
    this.container = new THREE.Object3D()
    this.container.matrixAutoUpdate = false

    this.setSounds()
    this.setFloor()
  }

  setSounds() {
    this.sounds = new Sounds({
      debug: this.debugFolder,
      time: this.time,
    })
  }

  setFloor() {
    this.floor = new Floor({
      debug: this.debug,
    })
    this.container.add(this.floor.container)
  }
}
