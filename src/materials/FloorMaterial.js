import * as THREE from 'three'

import shaderFragment from '../shaders/floor/fragment.glsl'
import shaderVertex from '../shaders/floor/vertex.glsl'

function FloorMaterial() {
  const uniforms = {
    tBackground: { value: null },
  }

  return new THREE.ShaderMaterial({
    wireframe: false,
    transparent: false,
    uniforms,
    vertexShader: shaderVertex,
    fragmentShader: shaderFragment,
  })
}

export default FloorMaterial
