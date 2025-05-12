class Camera {
  constructor() {
    this.fov = 60;
    this.eye = new Vector3([0, 1, 5]);
    this.at = new Vector3([0, 1, 4]);
    this.up = new Vector3([0, 1, 0]);

    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.projectionMatrix.setPerspective(
      this.fov,
      canvas.width / canvas.height,
      0.1,
      1000
    );

    this.updateView();
  }

  updateView() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2]
    );
  }

  move(speed, directionVec) {
    const moveVec = directionVec.normalize().mul(speed);
    this.eye.add(moveVec);
    this.at.add(moveVec);
    this.updateView();
  }

  moveForward(speed) {
    const forward = new Vector3(this.at.elements).sub(this.eye);
    this.move(speed, forward);
  }

  moveBackward(speed) {
    const backward = new Vector3(this.eye.elements).sub(this.at);
    this.move(speed, backward);
  }

  moveLeft(speed) {
    const forward = new Vector3(this.at.elements).sub(this.eye).normalize();
    const left = Vector3.cross(this.up, forward);
    this.move(speed, left);
  }

  moveRight(speed) {
    const forward = new Vector3(this.at.elements).sub(this.eye).normalize();
    const right = Vector3.cross(forward, this.up);
    this.move(speed, right);
  }

  panLeft(angle) {
    this.rotateAroundUp(angle);
  }

  panRight(angle) {
    this.rotateAroundUp(-angle);
  }

  rotateAroundUp(angle) {
    const forward = new Vector3(this.at.elements).sub(this.eye);
    const rotation = new Matrix4().setRotate(angle, ...this.up.elements);
    const rotatedForward = rotation.multiplyVector3(forward);
    this.at = new Vector3(this.eye.elements).add(rotatedForward);
    this.updateView();
  }

  getGridCoordsInFront() {
    const forward = new Vector3(this.at.elements).sub(this.eye).normalize();
    const ahead = new Vector3(this.eye.elements).add(forward).add(new Vector3([16, 0, 16]));
    return [Math.floor(ahead.elements[0]), Math.floor(ahead.elements[2])];
  }
}
