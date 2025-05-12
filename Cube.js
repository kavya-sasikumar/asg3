class Cube {
  constructor() {
    this.color = [1, 1, 1, 1];          
    this.textureNum = -2;               
    this.matrix = new Matrix4();        
  }

  render() {
    if (typeof u_whichTexture !== 'undefined') {
      gl.uniform1i(u_whichTexture, this.textureNum);
    }

    gl.uniform4f(u_FragColor, ...this.color);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    this.drawTopFace();
  }

  drawTopFace() {
    const verticesA = [0, 0, 0, 1, 0, 0, 1, 1, 0];
    const uvA = [0, 0, 1, 0, 1, 1];

    const verticesB = [0, 0, 0, 1, 1, 0, 0, 1, 0];
    const uvB = [0, 0, 1, 1, 0, 1];

    drawTriangle3DUV(verticesA, uvA);
    drawTriangle3DUV(verticesB, uvB);
  }

  renderfast() {
    this.render(); 
  }
}
