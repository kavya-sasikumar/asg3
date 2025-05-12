class Vector3 {
  constructor(elements) {
    this.elements = elements.slice();
  }

  set(v) {
    this.elements = v.elements.slice();
    return this;
  }

  copy() {
    return new Vector3(this.elements);
  }

  add(v) {
    for (let i = 0; i < 3; ++i) this.elements[i] += v.elements[i];
    return this;
  }

  sub(v) {
    for (let i = 0; i < 3; ++i) this.elements[i] -= v.elements[i];
    return this;
  }

  mul(s) {
    for (let i = 0; i < 3; ++i) this.elements[i] *= s;
    return this;
  }

  normalize() {
    let len = Math.hypot(...this.elements);
    if (len > 0) this.mul(1 / len);
    return this;
  }

  static cross(a, b) {
    const [ax, ay, az] = a.elements;
    const [bx, by, bz] = b.elements;
    return new Vector3([
      ay * bz - az * by,
      az * bx - ax * bz,
      ax * by - ay * bx
    ]);
  }
}
