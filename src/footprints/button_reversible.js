const button = p => `
    ${'' /* outline */}
    (fp_line (start 2.75 1.25) (end 1.25 2.75) (layer ${p.side}.SilkS) (width 0.15))
    (fp_line (start 2.75 -1.25) (end 1.25 -2.75) (layer ${p.side}.SilkS) (width 0.15))
    (fp_line (start 2.75 -1.25) (end 2.75 1.25) (layer ${p.side}.SilkS) (width 0.15))
    (fp_line (start -1.25 2.75) (end 1.25 2.75) (layer ${p.side}.SilkS) (width 0.15))
    (fp_line (start -1.25 -2.75) (end 1.25 -2.75) (layer ${p.side}.SilkS) (width 0.15))
    (fp_line (start -2.75 1.25) (end -1.25 2.75) (layer ${p.side}.SilkS) (width 0.15))
    (fp_line (start -2.75 -1.25) (end -1.25 -2.75) (layer ${p.side}.SilkS) (width 0.15))
    (fp_line (start -2.75 -1.25) (end -2.75 1.25) (layer ${p.side}.SilkS) (width 0.15))

    ${'' /* wires to vias */}
    (fp_line (start -2.2 -1.3) (end 2.2 -1.3) (layer ${p.side}.Cu) (width 0.1))
    (fp_line (start -2.2 1.3) (end 2.2 1.3) (layer ${p.side}.Cu) (width 0.1))

    ${'' /* pins */}
    (pad "" smd rect (at -3.1 -1.85 ${p.r}) (size 1.8 1.1) (layers ${p.side}.Cu ${p.side}.Paste ${p.side}.Mask))
    (pad "" smd rect (at 3.1 -1.85 ${p.r}) (size 1.8 1.1) (layers ${p.side}.Cu ${p.side}.Paste ${p.side}.Mask))
    (pad "" smd rect (at -3.1 1.85 ${p.r}) (size 1.8 1.1) (layers ${p.side}.Cu ${p.side}.Paste ${p.side}.Mask))
    (pad "" smd rect (at 3.1 1.85 ${p.r}) (size 1.8 1.1) (layers ${p.side}.Cu ${p.side}.Paste ${p.side}.Mask))
`;

module.exports = {
    params: {
        designator: 'B', // for Button
        from: undefined,
        to: undefined
    },
    body: p => {
      const parts = [];
      parts.push(button({ side: "F", do_vias: true, ...p }));
      parts.push(button({ side: "B", do_vias: false, ...p }));
      return `
          (module E73:SW_TACT_ALPS_SKQGABE010 (layer F.Cu) (tstamp 5BF2CC94)

              (descr "Low-profile SMD Tactile Switch, https://www.e-switch.com/product-catalog/tact/product-lines/tl3342-series-low-profile-smt-tact-switch")
              (tags "SPST Tactile Switch")

              ${p.at /* parametric position */}
              ${'' /* footprint reference */}
              (fp_text reference "${p.ref}" (at 0 0) (layer F.SilkS) ${p.ref_hide} (effects (font (size 1.27 1.27) (thickness 0.15))))
              (fp_text value "" (at 0 0) (layer B.SilkS) hide (effects (font (size 1.27 1.27) (thickness 0.15))))

              ${'' /* button on front */}
              ${button({ side: "F", ...p })}

              (pad 1 thru_hole circle (at 0 -1.3) (size 0.6 0.6) (drill 0.3) (layers *.Cu) (zone_connect 2) ${p.from})
              (pad 2 thru_hole circle (at 0 1.3) (size 0.6 0.6) (drill 0.3) (layers *.Cu) (zone_connect 2) ${p.to})

              ${'' /* button on front */}
              ${button({ side: "B", ...p })}
          )
          `;
      return parts.join("\n");
    },
};
