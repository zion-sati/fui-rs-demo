use super::shared::*;
use fui::prelude::*;
use std::cell::RefCell;
use std::rc::Rc;

const COLORS: [u32; 4] = [
    rgb(0x3a, 0x6c, 0xc5),
    rgb(0x3a, 0xc5, 0x6c),
    rgb(0xc5, 0x6c, 0x3a),
    rgb(0xff, 0xb4, 0x3c),
];
const LABEL_COLORS: [u32; 4] = [
    rgba(0xdc, 0xe8, 0xff, 0xe6),
    rgba(0xdc, 0xff, 0xe8, 0xe6),
    rgba(0xff, 0xe8, 0xdc, 0xe6),
    rgba(0xff, 0xee, 0xbe, 0xe6),
];

pub(super) struct ScatterPlot {
    node: CustomDrawable,
    points: Rc<RefCell<[(f32, f32); 4]>>,
    labels: [DynamicTextLayout; 4],
}

impl ScatterPlot {
    pub(super) fn new(theme: &Theme) -> Self {
        let points = Rc::new(RefCell::new([(0.0, 0.0); 4]));
        let title = create_plot_title("Scatter plot", theme);
        let labels = LABEL_COLORS
            .map(|color| create_dynamic_label(color, theme.fonts.mono_family.clone(), None));
        let node = surface({
            let points = points.clone();
            let title = title.clone();
            let labels = labels.clone();
            move |ctx| {
                let size = 300.0;
                ctx.draw_round_rect(0.0, 0.0, size, size, 12.0, 12.0, Paint::fill(CARD));
                draw_plot_title(ctx, &title);
                let points = points.borrow();
                for index in 0..4 {
                    let next = (index + 1) % 4;
                    ctx.draw_line(
                        points[index].0,
                        points[index].1,
                        points[next].0,
                        points[next].1,
                        rgba(0xff, 0xff, 0xff, 0x1e),
                        0.5,
                    );
                }
                for index in 0..4 {
                    let (x, y) = points[index];
                    ctx.draw_circle(x, y, 6.0, Paint::fill(COLORS[index]));
                    draw_dynamic_label(ctx, &labels[index], x + 8.0, y - 24.0);
                }
            }
        });
        wake_for_layout(&node, &title);
        for label in &labels {
            wake_for_dynamic(&node, label);
        }
        Self {
            node,
            points,
            labels,
        }
    }

    pub(super) fn node(&self) -> &CustomDrawable {
        &self.node
    }

    pub(super) fn push_values(&self, a: f32, b: f32, c: f32, d: f32) {
        let size = self.node.get_bounds()[2];
        let pad = 30.0;
        let scale = (size - pad * 2.0) / 2.0;
        let center = size / 2.0;
        *self.points.borrow_mut() = [
            (center + a * scale, center + b * scale),
            (center + c * scale, center + a * scale * 0.7),
            (center + b * scale, center + d * scale),
            (center + d * scale, center + c * scale * 0.7),
        ];
        let values = [(a, b), (c, a * 0.7), (b, d), (d, c * 0.7)];
        for (label, (x, y)) in self.labels.iter().zip(values) {
            label.set_text(format!("{},{}", format_tenths(x), format_tenths(y)));
        }
        self.node.mark_dirty();
    }
}
