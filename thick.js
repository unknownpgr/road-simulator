function createThickLine(points, thickness) {
  const EPSILON = 0.0001;
  const t = thickness / 2;
  const n = points.length;
  const R = Math.PI / 2;

  let segments = [], left = [], right = [];

  for (let i = 0; i < n - 1; i++)segments.push(points[i + 1].sub(points[i]));

  // Start points
  left.push(points[0].add(segments[0].rot(R).norm().mul(t)));
  right.push(points[0].add(segments[0].rot(-R).norm().mul(t)));

  // Middle points
  for (let i = 0; i < n - 2; i++) {
    const sint = segments[i].crs(segments[i + 1]) / (segments[i].len() * segments[i + 1].len()); // sin(theta); theta = angle between segment[i] and segment[i+1]
    if (Math.abs(sint) < EPSILON) {
      left.push(points[i + 1].add(segments[i].rot(R).norm().mul(t)));
      right.push(points[i + 1].add(segments[i].rot(-R).norm().mul(t)));
    } else {
      const unit = segments[i].norm().sub(segments[i + 1].norm());
      const d = unit.mul(t).div(sint); // d is 'right' side vector.0
      right.push(points[i + 1].add(d));
      left.push(points[i + 1].sub(d));
    }
  }

  // End points
  left.push(points[n - 1].add(segments[n - 2].rot(R).norm().mul(t)));
  right.push(points[n - 1].add(segments[n - 2].rot(-R).norm().mul(t)));

  return [left, right];
}