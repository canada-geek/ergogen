const a = require("./assert");
const m = require("makerjs");

exports.deepcopy = (value) => {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
};

const deep = (exports.deep = (obj, key, val) => {
  const levels = key.split(".");
  const last = levels.pop();
  let step = obj;
  for (const level of levels) {
    step[level] = step[level] || {};
    step = step[level];
  }
  if (val === undefined) return step[last];
  step[last] = val;
  return obj;
});

exports.template = (str, vals = {}) => {
  const regex = /\{\{([^}]*)\}\}/g;
  let res = str;
  let shift = 0;
  for (const match of str.matchAll(regex)) {
    const replacement = (deep(vals, match[1]) || "") + "";
    res =
      res.substring(0, match.index + shift) +
      replacement +
      res.substring(match.index + shift + match[0].length);
    shift += replacement.length - match[0].length;
  }
  return res;
};

const point_to_xy = (exports.point_to_xy = (point) => {
  if (typeof point === "object") {
    return [point.x, point.y];
  } else {
    return point;
  }
});

const eq = (exports.eq = (a = [], b = []) => {
  a = point_to_xy(a);
  b = point_to_xy(b);
  return a[0] === b[0] && a[1] === b[1];
});

const line = (exports.line = (a, b) => {
  return new m.paths.Line(a, b);
});

const line_segment = (exports.line_segment = (a, b) => {
  a = point_to_xy(a);
  b = point_to_xy(b);
  return {
    paths: { line: line(a, b) },
  };
});

exports.circle = (p, r) => {
  return { paths: { circle: new m.paths.Circle(p, r) } };
};

exports.arc = (beg, mid, end) => {
  beg = point_to_xy(beg);
  mid = point_to_xy(mid);
  end = point_to_xy(end);
  return {
    paths: { arc: new m.paths.Arc(beg, mid, end) },
  };
};

exports.bezier = (points, accuracy) => {
  points = points.map((point) => point_to_xy(point));
  const res = {
    models: {
      curve: new m.models.BezierCurve(points, accuracy || 1),
    },
    paths: {},
  };
  return res;
};

exports.rect = (w, h, o = [0, 0]) => {
  const res = {
    top: line([0, h], [w, h]),
    right: line([w, h], [w, 0]),
    bottom: line([w, 0], [0, 0]),
    left: line([0, 0], [0, h]),
  };
  return m.model.move({ paths: res }, o);
};

exports.poly = (arr) => {
  let counter = 0;
  let prev = arr[arr.length - 1];
  const res = {
    paths: {},
  };
  for (const p of arr) {
    if (eq(prev, p)) continue;
    res.paths["p" + ++counter] = line(prev, p);
    prev = p;
  }
  return res;
};

exports.composite = (pieces) => {
  a.assert(Array.isArray(pieces));

  if (pieces.length === 0) {
    return {};
  }
  if (pieces.length === 1) {
    return pieces[0];
  }

  let model_count = 0;
  let path_count = 0;

  const res = { models: {}, paths: {} };

  for (const piece of pieces) {
    if ("models" in piece) {
      ++model_count;
      for (const [model_name, model] of Object.entries(piece.models)) {
        res.models[`m${model_count}.${model_name}`] = model;
      }
    }
    if ("paths" in piece) {
      ++path_count;
      for (const [path_name, path] of Object.entries(piece.paths)) {
        res.paths[`p${path_count}.${path_name}`] = path;
      }
    }
  }

  return res;
};

exports.bbox = (arr) => {
  let minx = Infinity;
  let miny = Infinity;
  let maxx = -Infinity;
  let maxy = -Infinity;
  for (const p of arr) {
    minx = Math.min(minx, p[0]);
    miny = Math.min(miny, p[1]);
    maxx = Math.max(maxx, p[0]);
    maxy = Math.max(maxy, p[1]);
  }
  return { low: [minx, miny], high: [maxx, maxy] };
};

const farPoint = (exports.farPoint = [1234.1234, 2143.56789]);

exports.union = exports.add = (a, b) => {
  return m.model.combine(a, b, false, true, false, true, {
    farPoint,
  });
};

exports.subtract = (a, b) => {
  return m.model.combine(a, b, false, true, true, false, {
    farPoint,
  });
};

exports.intersect = (a, b) => {
  return m.model.combine(a, b, true, false, true, false, {
    farPoint,
  });
};

exports.stack = (a, b) => {
  return {
    models: {
      a,
      b,
    },
  };
};

const semver = (exports.semver = (str, name = "") => {
  let main = str.split("-")[0];
  if (main.startsWith("v")) {
    main = main.substring(1);
  }
  while (main.split(".").length < 3) {
    main += ".0";
  }
  if (/^\d+\.\d+\.\d+$/.test(main)) {
    const parts = main.split(".").map((part) => parseInt(part, 10));
    return { major: parts[0], minor: parts[1], patch: parts[2] };
  } else throw new Error(`Invalid semver "${str}" at ${name}!`);
});

const satisfies = (exports.satisfies = (current, expected) => {
  if (current.major === undefined) current = semver(current);
  if (expected.major === undefined) expected = semver(expected);
  return (
    current.major === expected.major &&
    (current.minor > expected.minor ||
      (current.minor === expected.minor && current.patch >= expected.patch))
  );
});
