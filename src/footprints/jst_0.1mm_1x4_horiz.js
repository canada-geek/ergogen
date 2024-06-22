const header = (p, has_vias) => {
    const ref = (kind, side, mirror) => `(fp_text ${kind} "${p.ref}" (at 0 ${has_vias ? -4.98 : -3.98}) (layer "${side}.SilkS") ${p.ref_hide} (effects (font (size 1 1) (thickness 0.15)) ${mirror}))`;
    return `
        (module "JST_SH_SM04B-SRSS-TB_1x04-1MP_P1.00mm_Horizontal" (layer F.Cu) (tedit 58D3FE32)
        (descr "JST SH series connector, SM04B-SRSS-TB (http://www.jst-mfg.com/product/pdf/eng/eSH.pdf), generated with kicad-footprint-generator")
        (tags "connector JST SH top entry")
        ${p.at /* parametric position */}
        ${ref("reference", "F", "")}
        ${p.reverse ? ref("user", "B", "(justify mirror)") : ""}
        (fp_text value "" (at 0 3.5) (layer "F.SilkS")(effects (font (size 0.6 0.6) (thickness 0.15))))
    `
};

const footer = p => `
    )
`;

const footprint = (p, side, has_vias) => {
    const names = has_vias ? ['', '', '', ''] : ['1', '2', '3', '4'];
    const pos = side === "F" ? "" : "-";
    const neg = side === "F" ? "-" : "";
    let via_interconnect = "";
    if (has_vias) {
        if (side === "F") {
            via_interconnect = `
                (fp_line (start -1.5 -2) (end -1.5 -4) (layer "${side}.Cu") (width 0.1))
                (fp_line (start -0.5 -2) (end -0.5 -4) (layer "${side}.Cu") (width 0.1))
                (fp_line (start  0.5 -2) (end  0.5 -4) (layer "${side}.Cu") (width 0.1))
                (fp_line (start  1.5 -2) (end  1.5 -4) (layer "${side}.Cu") (width 0.1))
            `;
        } else {
            via_interconnect = `
                (fp_line (start -1.5 -3.25) (end -1 -3) (layer "${side}.Cu") (width 0.1))
                (fp_line (start -1 -3) (end -1 -1) (layer "${side}.Cu") (width 0.1))
                (fp_line (start -1 -1) (end -0.5 -0.5) (layer "${side}.Cu") (width 0.1))
                (fp_line (start -0.5 -0.5) (end 1 -0.5) (layer "${side}.Cu") (width 0.1))
                (fp_line (start 1 -0.5) (end 1.5 -2) (layer "${side}.Cu") (width 0.1))

                (fp_line (start -0.5 -3.25) (end 0.5 -2) (layer "${side}.Cu") (width 0.1))

                (fp_line (start 0.5 -3.25) (end 1 -3) (layer "${side}.Cu") (width 0.1))
                (fp_line (start 1 -3) (end 1 -2) (layer "${side}.Cu") (width 0.1))
                (fp_line (start 1 -2) (end 0.5 -1) (layer "${side}.Cu") (width 0.1))
                (fp_line (start 0.5 -1) (end 0 -1) (layer "${side}.Cu") (width 0.1))
                (fp_line (start 0 -1) (end -0.5 -2) (layer "${side}.Cu") (width 0.1))

                (fp_line (start 1.5 -3.25) (end 2 -3) (layer "${side}.Cu") (width 0.1))
                (fp_line (start 2 -3) (end 2 -1) (layer "${side}.Cu") (width 0.1))
                (fp_line (start 2 -1) (end 1.5 -0.5) (layer "${side}.Cu") (width 0.1))
                (fp_line (start 1.5 -0.5) (end -0.5 -0.5) (layer "${side}.Cu") (width 0.1))
                (fp_line (start -0.5 -0.5) (end -1.5 -2) (layer "${side}.Cu") (width 0.1))
            `;
        }
    }
    return `
        (fp_line (start ${neg}2.06 -1.785) (end ${neg}2.06 -2.775) (layer "${side}.SilkS") (width 0.12))
        (fp_line (start ${neg}3.11 -1.785) (end ${neg}2.06 -1.785) (layer "${side}.SilkS") (width 0.12))
        (fp_line (start ${pos}3.11 -1.785) (end ${pos}2.06 -1.785) (layer "${side}.SilkS") (width 0.12))
        (fp_line (start ${neg}3.11 0.715) (end ${neg}3.11 -1.785) (layer "${side}.SilkS") (width 0.12))
        (fp_line (start ${neg}1.94 2.685) (end ${pos}1.94 2.685) (layer "${side}.SilkS") (width 0.12))
        (fp_line (start ${pos}3.11 0.715) (end ${pos}3.11 -1.785) (layer "${side}.SilkS") (width 0.12))
        (fp_line (start ${pos}3.9 3.28) (end ${pos}3.9 -3.28) (layer "${side}.CrtYd") (width 0.05))
        (fp_line (start ${pos}3.9 -3.28) (end ${neg}3.9 -3.28) (layer "${side}.CrtYd") (width 0.05))
        (fp_line (start ${neg}3.9 -3.28) (end ${neg}3.9 3.28) (layer "${side}.CrtYd") (width 0.05))
        (fp_line (start ${neg}3.9 3.28) (end ${pos}3.9 3.28) (layer "${side}.CrtYd") (width 0.05))
        (fp_line (start ${pos}3 4.575) (end ${pos}3 2.575) (layer "${side}.Fab") (width 0.1))
        (fp_line (start ${neg}3 -1.675) (end ${pos}3 -1.675) (layer "${side}.Fab") (width 0.1))
        (fp_line (start ${neg}3 2.575) (end ${pos}3 2.575) (layer "${side}.Fab") (width 0.1))
        (fp_line (start ${neg}2 -1.675) (end ${neg}1.5 -0.967893) (layer "${side}.Fab") (width 0.1))
        (fp_line (start ${neg}3 -1.675) (end ${neg}3 2.575) (layer "${side}.Fab") (width 0.1))
        (fp_line (start ${neg}3 2.575) (end ${neg}3 4.575) (layer "${side}.Fab") (width 0.1))
        (fp_line (start ${pos}3 -1.675) (end ${pos}3 2.575) (layer "${side}.Fab") (width 0.1))
        (fp_line (start ${neg}3 4.575) (end ${pos}3 4.575) (layer "${side}.Fab") (width 0.1))
        (fp_line (start ${neg}1.5 -0.967893) (end ${neg}1 -1.675) (layer "${side}.Fab") (width 0.1))
        (pad "${names[0]}" smd roundrect (at ${neg}1.5 -2) (locked) (size 0.6 1.55) (layers "${side}.Cu" "${side}.Paste" "${side}.Mask") (roundrect_rratio 0.25) ${p.P1})
        (pad "${names[1]}" smd roundrect (at ${neg}0.5 -2) (locked) (size 0.6 1.55) (layers "${side}.Cu" "${side}.Paste" "${side}.Mask") (roundrect_rratio 0.25) ${p.P2})
        (pad "${names[2]}" smd roundrect (at ${pos}0.5 -2) (locked) (size 0.6 1.55) (layers "${side}.Cu" "${side}.Paste" "${side}.Mask") (roundrect_rratio 0.25) ${p.P3})
        (pad "${names[3]}" smd roundrect (at ${pos}1.5 -2) (locked) (size 0.6 1.55) (layers "${side}.Cu" "${side}.Paste" "${side}.Mask") (roundrect_rratio 0.25) ${p.P4})
        (pad "MP" smd roundrect (at ${pos}2.8 1.875) (locked) (size 1.2 1.8) (layers "${side}.Cu" "${side}.Paste" "${side}.Mask") (roundrect_rratio 0.2083333333333333) ${p.MP})
        (pad "MP" smd roundrect (at ${neg}2.8 1.875) (locked) (size 1.2 1.8) (layers "${side}.Cu" "${side}.Paste" "${side}.Mask") (roundrect_rratio 0.2083333333333333) ${p.MP})
        ${via_interconnect}
    `;
};

const vias = p => `
    (pad 1 thru_hole circle (at -1.5 -4) (size 0.6 0.6) (drill 0.3) (layers *.Cu) (zone_connect 2) ${p.P1})
    (pad 2 thru_hole circle (at -0.5 -4) (size 0.6 0.6) (drill 0.3) (layers *.Cu) (zone_connect 2) ${p.P2})
    (pad 3 thru_hole circle (at  0.5 -4) (size 0.6 0.6) (drill 0.3) (layers *.Cu) (zone_connect 2) ${p.P3})
    (pad 4 thru_hole circle (at  1.5 -4) (size 0.6 0.6) (drill 0.3) (layers *.Cu) (zone_connect 2) ${p.P4})
`;

module.exports = {
    params: {
        designator: 'JST',
        side: 'F',
        reverse: false,
        P1: undefined,
        P2: undefined,
        P3: undefined,
        P4: undefined,
        MP: { type: 'net', value: 'GND' },
    },
    body: p => {
        if (p.reverse) {
            return `
                ${header(p, true /* has vias */)}
                ${footprint(p, "F", true /* has vias */)}
                ${footprint(p, "B", true /* has vias */)}
                ${vias(p)}
                ${footer(p)}
            `;
        } else {
            return `
                ${header(p, false /* does not have vias */)}
                ${footprint(p, p.side, false /* does not have vias */)}
                ${footer(p)}
            `;
        }
    }
}