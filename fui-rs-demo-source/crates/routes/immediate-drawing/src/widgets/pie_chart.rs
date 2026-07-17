use super::shared::*;
use fui::prelude::*;
use std::cell::RefCell;
use std::f32::consts::PI;
use std::rc::Rc;

const COLORS: [u32; 4] = [
    rgba(0x3a, 0x6c, 0xc5, 0xdc),
    rgba(0x3a, 0xc5, 0x6c, 0xdc),
    rgba(0xc5, 0x6c, 0x3a, 0xdc),
    rgba(0x9e, 0x3a, 0xc5, 0xdc),
];

pub(super) struct PieChart {
    node: CustomDrawable,
    values: Rc<RefCell<[f32; 4]>>,
}

impl PieChart {
    pub(super) fn new(theme: &Theme) -> Self {
        let values = Rc::new(RefCell::new([0.0; 4]));
        let title = create_plot_title("Pie chart", theme);
        let node = surface({
            let values = values.clone();
            let title = title.clone();
            move |ctx| {
                let size = 300.0;
                let center = size / 2.0;
                let radius = size * 0.4;
                ctx.draw_round_rect(0.0, 0.0, size, size, 12.0, 12.0, Paint::fill(CARD));
                draw_plot_title(ctx, &title);
                let values = values.borrow();
                let total: f32 = values.iter().sum();
                if total <= 0.0 {
                    return;
                }
                let mut start_angle = -90.0;
                for wedge in 0..4 {
                    let sweep = values[wedge] / total * 360.0;
                    if sweep < 1.0 {
                        start_angle += sweep;
                        continue;
                    }
                    let angle_step = sweep / 10.0;
                    for index in 0..10 {
                        let a0 = (start_angle + angle_step * index as f32) * PI / 180.0;
                        let a1 = (start_angle + angle_step * (index + 1) as f32) * PI / 180.0;
                        let x1 = center + radius * a0.cos();
                        let y1 = center + radius * a0.sin();
                        let x2 = center + radius * a1.cos();
                        let y2 = center + radius * a1.sin();
                        ctx.draw_line(center, center, x1, y1, COLORS[wedge], 1.0);
                        ctx.draw_line(center, center, x2, y2, COLORS[wedge], 1.0);
                        ctx.draw_line(x1, y1, x2, y2, COLORS[wedge], 1.0);
                    }
                    start_angle += sweep;
                }
                ctx.draw_circle(center, center, radius, Paint::stroke(GRAY, 1.0));
            }
        });
        wake_for_layout(&node, &title);
        Self { node, values }
    }

    pub(super) fn node(&self) -> &CustomDrawable {
        &self.node
    }

    pub(super) fn push_values(&self, a: f32, b: f32, c: f32, d: f32) {
        *self.values.borrow_mut() = [a, b, c, d];
        self.node.mark_dirty();
    }
}
