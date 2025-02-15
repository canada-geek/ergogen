const m = require("makerjs");
const u = require("./utils");
const a = require("./assert");
const o = require("./operation");
const Point = require("./point");
const prep = require("./prepare");
const anchor = require("./anchor").parse;
const filter = require("./filter").parse;

const binding = (base, bbox, point, units) => {
  let bind = a.trbl(point.meta.bind || 0, `${point.meta.name}.bind`)(units);
  // if it's a mirrored key, we swap the left and right bind values
  if (point.meta.mirrored) {
    bind = [bind[0], bind[3], bind[2], bind[1]];
  }

  const bt = Math.max(bbox.high[1], 0) + Math.max(bind[0], 0);
  const br = Math.max(bbox.high[0], 0) + Math.max(bind[1], 0);
  const bd = Math.min(bbox.low[1], 0) - Math.max(bind[2], 0);
  const bl = Math.min(bbox.low[0], 0) - Math.max(bind[3], 0);

  if (bind[0] || bind[1]) base = u.union(base, u.rect(br, bt));
  if (bind[1] || bind[2]) base = u.union(base, u.rect(br, -bd, [0, bd]));
  if (bind[2] || bind[3]) base = u.union(base, u.rect(-bl, -bd, [bl, bd]));
  if (bind[3] || bind[0]) base = u.union(base, u.rect(-bl, bt, [bl, 0]));

  return base;
};

const rectangle = (config, name, points, outlines, units) => {
  // prepare params
  a.unexpected(config, `${name}`, ["size", "corner", "bevel"]);
  const size = a.wh(config.size, `${name}.size`)(units);
  const rec_units = prep.extend(
    {
      sx: size[0],
      sy: size[1],
    },
    units
  );
  const corner = a.sane(
    config.corner || 0,
    `${name}.corner`,
    "number"
  )(rec_units);
  const bevel = a.sane(config.bevel || 0, `${name}.bevel`, "number")(rec_units);

  // return shape function and its units
  return [
    () => {
      const error = (dim, val) =>
        `Rectangle for "${name}" isn't ${dim} enough for its corner and bevel (${val} - 2 * ${corner} - 2 * ${bevel} <= 0)!`;
      const [w, h] = size;
      const mod = 2 * (corner + bevel);
      const cw = w - mod;
      a.assert(cw >= 0, error("wide", w));
      const ch = h - mod;
      a.assert(ch >= 0, error("tall", h));

      let rect = new m.models.Rectangle(cw, ch);
      if (bevel) {
        rect = u.poly([
          [-bevel, 0],
          [-bevel, ch],
          [0, ch + bevel],
          [cw, ch + bevel],
          [cw + bevel, ch],
          [cw + bevel, 0],
          [cw, -bevel],
          [0, -bevel],
        ]);
      }
      if (corner > 0) rect = m.model.outline(rect, corner, 0);
      rect = m.model.moveRelative(rect, [-cw / 2, -ch / 2]);
      const bbox = { high: [w / 2, h / 2], low: [-w / 2, -h / 2] };

      return [rect, bbox];
    },
    rec_units,
  ];
};

const circle = (config, name, points, outlines, units) => {
  // prepare params
  a.unexpected(config, `${name}`, ["radius"]);
  const radius = a.sane(config.radius, `${name}.radius`, "number")(units);
  const circ_units = prep.extend(
    {
      r: radius,
    },
    units
  );

  // return shape function and its units
  return [
    () => {
      let circle = u.circle([0, 0], radius);
      const bbox = { high: [radius, radius], low: [-radius, -radius] };
      return [circle, bbox];
    },
    circ_units,
  ];
};

const polygon = (config, name, points, outlines, units) => {
  // prepare params
  a.unexpected(config, `${name}`, ["points"]);
  const poly_points = a.sane(config.points, `${name}.points`, "array")();

  // return shape function and its units
  return [
    (point) => {
      const parsed_points = [];
      // the poly starts at [0, 0] as it will be positioned later
      // but we keep the point metadata for potential mirroring purposes
      let last_anchor = new Point(0, 0, 0, point.meta);
      let poly_index = -1;
      for (const poly_point of poly_points) {
        const poly_name = `${name}.points[${++poly_index}]`;
        last_anchor = anchor(poly_point, poly_name, points, last_anchor)(units);
        parsed_points.push(last_anchor.p);
      }
      let poly = u.poly(parsed_points);
      const bbox = u.bbox(parsed_points);
      return [poly, bbox];
    },
    units,
  ];
};

// Composite shape: pseudo-polygon where each segment can be line, arc or bezier curve
//
const lines = (start, segment_points, name) => {
  let last_point = start;
  const line_shapes = [];
  for (const curr_point of segment_points) {
    if (u.eq(last_point, curr_point)) continue;
    line_shapes.push(u.line_segment(last_point, curr_point));
    last_point = curr_point;
  }
  return u.composite(line_shapes);
};

const arc = (start, segment_points, name) => {
  segment_points = a.arrlen(segment_points, `${name}.points`, 2)();
  return u.arc(start, segment_points[0], segment_points[1]);
};

const bezier = (start, segment_points, name) => {
  segment_points = a.arrlen(segment_points, `${name}.points`, [2, 3])();
  const all_pts = [start, ...segment_points];
  return u.bezier(all_pts);
};

const composite_whats = {
  lines,
  arc,
  bezier,
};

const composite = (config, name, points, outlines, units) => {
  // prepare params
  a.unexpected(config, `${name}`, ["segments"]);

  // composite parts can be supplied as sub-objects or arrays
  let segments = config.segments;
  if (a.type(segments)() == "array") {
    segments = { ...segments };
  }
  segments = a.sane(segments, `${name}`, "object")();

  return [
    (point) => {
      const first_point = new Point(0, 0, 0, point.meta);
      let last_point = first_point;
      const all_points = [last_point];
      const subshapes = [];
      for (let [segment_name, segment] of Object.entries(segments)) {
        let segment_config = a.sane(config, `${segment_name}`, "object")();
        a.unexpected(segment, `${segment_name}`, ["what", "points"]);
        const what = a.in(segment.what, `${name}.what`, [
          "lines",
          "arc",
          "bezier",
        ]);
        const segment_points = a.sane(
          segment.points,
          `${segment_name}.points`,
          "array"
        )();

        let segment_last_point = last_point.clone();
        const parsed_points = [];
        let index = 0;
        for (const segment_point of segment_points) {
          segment_last_point = anchor(
            segment_point,
            `${name}.segment[${segment_name}].points[${++index}]`,
            points,
            segment_last_point
          )(units);
          parsed_points.push(segment_last_point);
          all_points.push(segment_last_point.p);
        }

        subshapes.push(composite_whats[what](last_point, parsed_points, name));
        last_point = parsed_points[parsed_points.length - 1];
      }

      if (!u.eq(first_point, last_point)) {
        subshapes.push(
          lines(last_point, [first_point], `${name}.shape_closure`)
        );
      }

      const composite_shape = u.composite(subshapes);
      const bbox = u.bbox(all_points);
      return [composite_shape, bbox];
    },
    units,
  ];
};

const outline = (config, name, points, outlines, units) => {
  // prepare params
  a.unexpected(config, `${name}`, ["name", "origin"]);
  a.assert(
    outlines[config.name],
    `Field "${name}.name" does not name an existing outline!`
  );
  const origin = anchor(config.origin || {}, `${name}.origin`, points)(units);

  // return shape function and its units
  return [
    () => {
      let o = u.deepcopy(outlines[config.name]);
      o = origin.unposition(o);
      const bbox = m.measure.modelExtents(o);
      return [o, bbox];
    },
    units,
  ];
};

const whats = {
  rectangle,
  circle,
  polygon,
  composite,
  outline,
};

const expand_shorthand = (config, name, units) => {
  if (a.type(config.expand)(units) == "string") {
    const prefix = config.expand.slice(0, -1);
    const suffix = config.expand.slice(-1);
    const valid_suffixes = [")", ">", "]"];
    a.assert(
      valid_suffixes.includes(suffix),
      `If field "${name}" is a string, ` +
        `it should end with one of [${valid_suffixes
          .map((s) => `'${s}'`)
          .join(", ")}]!`
    );
    config.expand = prefix;
    config.joints = config.joints || valid_suffixes.indexOf(suffix);
  }

  if (a.type(config.joints)(units) == "string") {
    if (config.joints == "round") config.joints = 0;
    if (config.joints == "pointy") config.joints = 1;
    if (config.joints == "beveled") config.joints = 2;
  }
};

exports.parse = (config, points, units) => {
  // output outlines will be collected here
  const outlines = {};

  // the config must be an actual object so that the exports have names
  config = a.sane(config, "outlines", "object")();
  for (let [outline_name, parts] of Object.entries(config)) {
    // placeholder for the current outline
    outlines[outline_name] = { models: {} };

    // each export can consist of multiple parts
    // either sub-objects or arrays are fine...
    if (a.type(parts)() == "array") {
      parts = { ...parts };
    }
    parts = a.sane(parts, `outlines.${outline_name}`, "object")();

    for (let [part_name, part] of Object.entries(parts)) {
      const name = `outlines.${outline_name}.${part_name}`;

      // string part-shortcuts are expanded first
      if (a.type(part)() == "string") {
        part = o.operation(part, { outline: Object.keys(outlines) });
      }

      // process keys that are common to all part declarations
      const operation =
        u[
          a.in(part.operation || "add", `${name}.operation`, [
            "add",
            "subtract",
            "intersect",
            "stack",
          ])
        ];
      const what = a.in(part.what || "outline", `${name}.what`, [
        "rectangle",
        "circle",
        "polygon",
        "composite",
        "outline",
      ]);
      const bound = !!part.bound;
      const asym = a.asym(part.asym || "source", `${name}.asym`);

      // `where` is delayed until we have all, potentially what-dependent units
      // default where is [0, 0], as per filter parsing
      const original_where = part.where; // need to save, so the delete's don't get rid of it below
      const where = (units) =>
        filter(original_where, `${name}.where`, points, units, asym);

      const original_adjust = part.adjust; // same as above
      const fillet = a.sane(
        part.fillet || 0,
        `${name}.fillet`,
        "number"
      )(units);
      expand_shorthand(part, `${name}.expand`, units);
      const expand = a.sane(
        part.expand || 0,
        `${name}.expand`,
        "number"
      )(units);
      const joints = a.in(
        a.sane(part.joints || 0, `${name}.joints`, "number")(units),
        `${name}.joints`,
        [0, 1, 2]
      );
      const scale = a.sane(part.scale || 1, `${name}.scale`, "number")(units);

      // these keys are then removed, so ops can check their own unexpected keys without interference
      delete part.operation;
      delete part.what;
      delete part.bound;
      delete part.asym;
      delete part.where;
      delete part.adjust;
      delete part.fillet;
      delete part.expand;
      delete part.joints;
      delete part.scale;

      // a prototype "shape" maker (and its units) are computed
      const [shape_maker, shape_units] = whats[what](
        part,
        name,
        points,
        outlines,
        units
      );
      const adjust = (start) =>
        anchor(
          original_adjust || {},
          `${name}.adjust`,
          points,
          start
        )(shape_units);

      // and then the shape is repeated for all where positions
      for (const w of where(shape_units)) {
        const point = adjust(w.clone());
        let [shape, bbox] = shape_maker(point); // point is passed for mirroring metadata only...
        if (bound) {
          shape = binding(shape, bbox, point, shape_units);
        }
        shape = point.position(shape); // ...actual positioning happens here
        outlines[outline_name] = operation(outlines[outline_name], shape);
      }

      if (scale !== 1) {
        outlines[outline_name] = m.model.scale(outlines[outline_name], scale);
      }

      if (expand) {
        outlines[outline_name] = m.model.outline(
          outlines[outline_name],
          Math.abs(expand),
          joints,
          expand < 0,
          { farPoint: u.farPoint }
        );
      }

      if (fillet) {
        for (const [index, chain] of m.model
          .findChains(outlines[outline_name])
          .entries()) {
          outlines[outline_name].models[`fillet_${part_name}_${index}`] =
            m.chain.fillet(chain, fillet);
        }
      }
    }

    // final adjustments
    m.model.originate(outlines[outline_name]);
    m.model.simplify(outlines[outline_name]);
  }

  return outlines;
};
