/**
 * Blend two textures
 */

let ShaderConcat = {

  uniforms: {
    "tDiffuse1": { value: null },
    "tDiffuse2": { value: null },
  },

  vertexShader:
    `
    varying vec2 vUv;
    void main() {
    	vUv = uv;
    	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
    `,

  fragmentShader:
    `
    uniform sampler2D tDiffuse1;
    uniform sampler2D tDiffuse2;

    varying vec2 vUv;

    void main() {
      if(vUv.y<0.5){
        gl_FragColor = texture2D( tDiffuse1, vec2(vUv.x,vUv.y*2.0));         
      }else{
        gl_FragColor = texture2D( tDiffuse2, vec2(vUv.x,(vUv.y-0.5)*2.0));         
      }
    }
    `
};

export { ShaderConcat };
