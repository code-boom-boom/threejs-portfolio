import Time from './utils/Time.js'
import Sizes from './utils/Sizes.js'
import * as dat from 'dat.gui'
import * as THREE from 'three'
import Camera from './Camera.js'
import Resources from './Resources.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import BlurPass from './passes/BlurPass.js'
import GlowsPass from './passes/GlowsPass.js'

export default class Application {
  constructor(canvas) {
    this.$canvas = canvas

    this.time = new Time()
    this.sizes = new Sizes()
    this.resources = new Resources()

    this.setConfig()
    this.setDebug()
    this.setRenderer()
    this.setCamera()
    this.setPasses()
    this.setWorld()
  }

  setConfig() {
    this.config = {}
    this.config.debug = window.location.hash === '#debug'
    this.config.cyberTruck = window.location.hash === '#cybertruck'
    this.config.touch = false

    // TODO: Add touch start event listener
  }

  setDebug() {
    if (this.config.debug) {
      this.debug = new dat.GUI({ width: 420 })
    }
  }

  setRenderer() {
    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.$canvas,
      alpha: true,
    })
    this.renderer.setClearColor(0x000000, 1)
    this.renderer.setPixelRatio(2)
    this.renderer.setSize(this.sizes.viewport.width, this.sizes.viewport.height)
    this.renderer.physicallyCorrectLights = true
    this.renderer.gammaFactor = 2.2
    this.renderer.gammaOutput = true
    this.renderer.autoClear = false

    this.sizes.on('resize', () => {
      this.renderer.setSize(this.sizes.viewport.width, this.sizes.viewport.height)
    })
  }

  setCamera() {
    this.camera = new Camera({
      time: this.time,
      sizes: this.sizes,
      renderer: this.renderer,
      debug: this.debug,
      config: this.config,
    })

    this.scene.add(this.camera.container)

    this.time.on('tick', () => {
      if (this.world && this.world.car) {
        this.camera.target.x = this.world.car.chassis.object.position.x
        this.camera.target.y = this.world.car.chassis.object.position.y
      }
    })
  }

  setPasses() {
    this.passes = {}

    if (this.debug) {
      this.passes.debugFolder = this.debug.addFolder('postprocess')
    }

    this.passes.composer = new EffectComposer(this.renderer)

    this.passes.renderPass = new RenderPass(this.scene, this.camera.instance)

    this.passes.horizontalBlurPass = new ShaderPass(BlurPass)
    this.passes.horizontalBlurPass.strength = this.config.touch ? 0 : 1
    this.passes.horizontalBlurPass.material.uniforms.uResolution.value = new THREE.Vector2(this.sizes.viewport.width, this.sizes.viewport.height)
    this.passes.horizontalBlurPass.material.uniforms.uStrength.value = new THREE.Vector2(this.passes.horizontalBlurPass.strength, 0)

    this.passes.verticalBlurPass = new ShaderPass(BlurPass)
    this.passes.verticalBlurPass.strength = this.config.touch ? 0 : 1
    this.passes.verticalBlurPass.material.uniforms.uResolution.value = new THREE.Vector2(this.sizes.viewport.width, this.sizes.viewport.height)
    this.passes.verticalBlurPass.material.uniforms.uStrength.value = new THREE.Vector2(0, this.passes.verticalBlurPass.strength)

    if (this.debug) {
      const folder = this.passes.debugFolder.addFolder('blur')
      folder.open()

      folder.add(this.passes.horizontalBlurPass.material.uniforms.uStrength.value, 'x').step(0.001).min(0).max(10)
      folder.add(this.passes.verticalBlurPass.material.uniforms.uStrength.value, 'y').step(0.001).min(0).max(10)
    }

    this.passes.glowsPass = new ShaderPass(GlowsPass)
    this.passes.glowsPass.color = '#ffcfe0'
    this.passes.glowsPass.material.uniforms.uPosition.value = new THREE.Vector2(0, 0.25)
    this.passes.glowsPass.material.uniforms.uRadius.value = 0.7
    this.passes.glowsPass.material.uniforms.uColor.value = new THREE.Color(this.passes.glowsPass.color)
    this.passes.glowsPass.material.uniforms.uAlpha.value = 0.55

    if (this.debug) {
      const folder = this.passes.debugFolder.addFolder('glows')
      folder.open()

      folder.add(this.passes.glowsPass.material.uniforms.uPosition.value, 'x').step(0.001).min(-1).max(2).name('positionX')
      folder.add(this.passes.glowsPass.material.uniforms.uPosition.value, 'y').step(0.001).min(-1).max(2).name('positionY')
      folder.add(this.passes.glowsPass.material.uniforms.uRadius, 'value').step(0.001).min(0).max(2).name('radius')
      folder.addColor(this.passes.glowsPass, 'color').name('color').onChange(() => {
        this.passes.glowsPass.material.uniforms.uColor.value = new THREE.Color(this.passes.glowsPass.color)
      })
      folder.add(this.passes.glowsPass.material.uniforms.uAlpha, 'value').step(0.001).min(0).max(1).name('alpha')
    }

    // Add passes
    this.passes.composer.addPass(this.passes.renderPass)
    this.passes.composer.addPass(this.passes.horizontalBlurPass)
    this.passes.composer.addPass(this.passes.verticalBlurPass)
    this.passes.composer.addPass(this.passes.glowsPass)

    // Time tick
    this.time.on('tick', () => {
      this.passes.horizontalBlurPass.enabled = this.passes.horizontalBlurPass.material.uniforms.uStrength.value.x > 0
      this.passes.verticalBlurPass.enabled = this.passes.verticalBlurPass.material.uniforms.uStrength.value.y > 0

      // Renderer
      this.passes.composer.render()
      // this.renderer.domElement.style.background = 'black'
      // this.renderer.render(this.scene, this.camera.instance)
    })

    // Resize event
    this.sizes.on('resize', () => {
      this.renderer.setSize(this.sizes.viewport.width, this.sizes.viewport.height)
      this.passes.composer.setSize(this.sizes.viewport.width, this.sizes.viewport.height)
      this.passes.horizontalBlurPass.material.uniforms.uResolution.value.x = this.sizes.viewport.width
      this.passes.horizontalBlurPass.material.uniforms.uResolution.value.y = this.sizes.viewport.height
      this.passes.verticalBlurPass.material.uniforms.uResolution.value.x = this.sizes.viewport.width
      this.passes.verticalBlurPass.material.uniforms.uResolution.value.y = this.sizes.viewport.height
    })
  }

  setWorld() {

  }
}
