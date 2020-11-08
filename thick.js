function createThickLine(points, thickness) {

  let n = points.length;
  let R = Math.PI / 2;
  let segments = [], left = [], right = [];

  for (let i = 0; i < n - 1; i++)segments.push(points[i + 1].sub(points[i]));

  // Start points
  left.push(points[0].add(segments[0].rot(R).norm().mul(thickness)));
  right.push(points[0].add(segments[0].rot(-R).norm().mul(thickness)));

  // Middle points
  for (let i = 0; i < n - 2; i++) {
    let sint = segments[i].crs(segments[i + 1]) / (segments[i].len() * segments[i + 1].len()); // sin(theta); theta = angle between segment[i] and segment[i+1]
    let unit = segments[i].norm().sub(segments[i + 1].norm());
    let d = unit.mul(thickness).div(sint); // d is 'right' side vector.0
    right.push(points[i + 1].add(d));
    left.push(points[i + 1].sub(d));
  }

  // End points
  left.push(points[n - 1].add(segments[n - 2].rot(R).norm().mul(thickness)));
  right.push(points[n - 1].add(segments[n - 2].rot(-R).norm().mul(thickness)));

  return [left, right];
}