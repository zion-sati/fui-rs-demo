use super::shared::*;
use fui::prelude::*;
use std::cell::RefCell;
use std::rc::Rc;

const SPARK_LINE: u32 = rgb(0xff, 0xb4, 0x3c);

struct SparkState {
    history: [f32; 80],
    write_position: usize,
    length: usize,
}

pub(super) struct Sparkline {
    node: CustomDrawable,
    state: Rc<RefCell<SparkState>>,
}

impl Sparkline {
    pub(super) fn new(theme: &Theme) -> Self {
        let state = Rc::new(RefCell::new(SparkState {
            history: [0.0; 80],
            write_position: 0,
            length: 0,
        }));
        let title = create_plot_title("Sparkline", theme);
        let node = surface({
            let state = state.clone();
            let title = title.clone();
            move |ctx| {
                let size = 300.0;
                let pad = 14.0;
                ctx.draw_round_rect(0.0, 0.0, size, size, 12.0, 12.0, Paint::fill(CARD));
                draw_plot_title(ctx, &title);
                let state = state.borrow();
                if state.length < 2 {
                    return;
                }
                let step_x = (size - pad * 2.0) / (state.length - 1) as f32;
                for index in 1..state.length {
                    let previous = (state.write_position + 80 - state.length + index - 1) % 80;
                    let current = (state.write_position + 80 - state.length + index) % 80;
                    ctx.draw_line(
                        pad + step_x * (index - 1) as f32,
                        size - pad - state.history[previous] / 100.0 * (size - pad * 2.0),
                        pad + step_x * index as f32,
                        size - pad - state.history[current] / 100.0 * (size - pad * 2.0),
                        SPARK_LINE,
                        2.0,
                    );
                }
            }
        });
        wake_for_layout(&node, &title);
        Self { node, state }
    }

    pub(super) fn node(&self) -> &CustomDrawable {
        &self.node
    }

    pub(super) fn push(&self, value: f32) {
        let mut state = self.state.borrow_mut();
        let write_position = state.write_position;
        state.history[write_position] = value;
        state.write_position = (write_position + 1) % 80;
        state.length = (state.length + 1).min(80);
        drop(state);
        self.node.mark_dirty();
    }
}
