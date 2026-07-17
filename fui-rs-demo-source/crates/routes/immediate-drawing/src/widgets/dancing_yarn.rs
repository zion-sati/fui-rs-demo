use super::shared::*;
use fui::prelude::*;
use std::cell::RefCell;
use std::f32::consts::PI;
use std::rc::Rc;

const YARN_A: u32 = rgba(0xff, 0x72, 0xa8, 0xe6);
const YARN_C: u32 = rgba(0xff, 0xd8, 0x6f, 0xe6);

struct YarnState {
    nx: f32,
    ny: f32,
    nz: f32,
    dx: f32,
    dy: f32,
    dz: f32,
    dragging: bool,
    pointer_x: f32,
    pointer_y: f32,
    pull: f32,
}

pub(super) struct DancingYarn {
    node: CustomDrawable,
    state: Rc<RefCell<YarnState>>,
}

impl DancingYarn {
    pub(super) fn new(theme: &Theme) -> Self {
        let state = Rc::new(RefCell::new(YarnState {
            nx: 0.0,
            ny: 2.7,
            nz: 5.1,
            dx: 1.0,
            dy: 1.0,
            dz: -1.0,
            dragging: false,
            pointer_x: 150.0,
            pointer_y: 150.0,
            pull: 0.0,
        }));
        let title = create_plot_title("Dancing yarn", theme);
        let node = surface({
            let state = state.clone();
            let title = title.clone();
            move |ctx| draw_yarn(ctx, &state.borrow(), &title)
        });
        node.semantic_role(SemanticRole::Image)
            .semantic_label("Dancing yarn interactive noise panel")
            .node_id("widget-yarn");
        let invalidator = node.invalidator();
        node.on_pointer_down({
            let state = state.clone();
            let invalidator = invalidator.clone();
            move |event| {
                event.capture_pointer();
                let mut state = state.borrow_mut();
                state.dragging = true;
                state.pointer_x = event.x;
                state.pointer_y = event.y;
                state.pull = 1.0;
                drop(state);
                invalidator.mark_dirty();
            }
        })
        .on_pointer_move({
            let state = state.clone();
            let invalidator = invalidator.clone();
            move |event| {
                let mut state = state.borrow_mut();
                if !state.dragging {
                    return;
                }
                state.pointer_x = event.x;
                state.pointer_y = event.y;
                state.pull = 1.0;
                drop(state);
                invalidator.mark_dirty();
            }
        })
        .on_pointer_up({
            let state = state.clone();
            let invalidator = invalidator.clone();
            move |event| {
                state.borrow_mut().dragging = false;
                event.release_pointer_capture();
                invalidator.mark_dirty();
            }
        })
        .on_pointer_cancel({
            let state = state.clone();
            let invalidator = invalidator.clone();
            move |event| {
                state.borrow_mut().dragging = false;
                event.release_pointer_capture();
                invalidator.mark_dirty();
            }
        });
        wake_for_layout(&node, &title);
        Self { node, state }
    }

    pub(super) fn node(&self) -> &CustomDrawable {
        &self.node
    }

    pub(super) fn tick(&self) {
        let mut state = self.state.borrow_mut();
        state.nx += 0.032 * state.dx;
        state.ny += 0.021 * state.dy;
        state.nz += 0.027 * state.dz;
        (state.nx, state.dx) = reflected(state.nx, state.dx);
        (state.ny, state.dy) = reflected(state.ny, state.dy);
        (state.nz, state.dz) = reflected(state.nz, state.dz);
        if !state.dragging && state.pull > 0.0 {
            state.pull *= 0.88;
            if state.pull < 0.02 {
                state.pull = 0.0;
            }
        }
        drop(state);
        self.node.mark_dirty();
    }
}

fn reflected(mut value: f32, mut direction: f32) -> (f32, f32) {
    if value > 9.0 {
        value = 9.0;
        direction = -1.0;
    }
    if value < 0.0 {
        value = 0.0;
        direction = 1.0;
    }
    (value, direction)
}

fn draw_yarn(ctx: &DrawContext, state: &YarnState, title: &TextLayout) {
    let size = 300.0;
    let center_x = size / 2.0;
    let center_y = size / 2.0 + 8.0;
    let pointer_bias_y = (state.pointer_x / size - 0.5) * 1.7 * state.pull;
    let pointer_bias_z = (state.pointer_y / size - 0.5) * 1.7 * state.pull;
    ctx.draw_round_rect(0.0, 0.0, size, size, 12.0, 12.0, Paint::fill(CARD));
    draw_plot_title(ctx, title);
    ctx.save();
    ctx.clip_round_rect(0.0, 0.0, size, size, 12.0, 12.0, 12.0, 12.0);
    let pointer_alpha = (36.0 + 70.0 * state.pull).round() as u32;
    ctx.draw_circle(
        state.pointer_x,
        state.pointer_y,
        22.0 + 10.0 * state.pull,
        Paint::stroke(rgba(255, 255, 255, pointer_alpha), 1.0),
    );
    let mut previous = (0.0, 0.0);
    for index in 0..132 {
        let t = index as f32 / 131.0;
        let x_base = 28.0 + t * (size - 56.0);
        let centered = (t - 0.5) * 2.0;
        let envelope = 1.0 - centered * centered;
        let n0 = value_noise_3(
            t * 4.2 + state.nx,
            state.ny + pointer_bias_y,
            state.nz + pointer_bias_z,
        );
        let n1 = value_noise_3(
            t * 5.6 + state.nx + 6.0,
            state.ny + 3.0 + pointer_bias_y,
            state.nz + 1.4 + pointer_bias_z,
        );
        let n2 = value_noise_3(
            t * 7.3 + state.nx + 2.0,
            state.ny + 8.0 + pointer_bias_y,
            state.nz + 4.0 + pointer_bias_z,
        );
        let angle = (n0 * 2.0 - 1.0) * PI * 1.35;
        let radius = (24.0 + n1 * 46.0) * (0.35 + envelope * 0.95);
        let mut x = x_base + angle.cos() * radius * 0.72;
        let mut y = center_y + angle.sin() * radius + (n2 - 0.5) * 42.0;
        let pointer_dx = state.pointer_x - x;
        let pointer_dy = state.pointer_y - y;
        let distance = (pointer_dx * pointer_dx + pointer_dy * pointer_dy).sqrt();
        let mut influence = (1.0 - distance / 145.0).max(0.0);
        influence = influence * influence * state.pull;
        x += pointer_dx * influence * 0.62;
        y += pointer_dy * influence * 0.62;
        x += (t * 18.0 + state.nz).sin() * influence * 20.0;
        y += (t * 17.0 + state.ny).cos() * influence * 20.0;
        if index > 0 {
            ctx.draw_line(
                previous.0,
                previous.1,
                x,
                y,
                yarn_color(t + state.nx * 0.07),
                1.3 + n2 * 2.2 + influence * 1.4,
            );
        }
        if index % 19 == 0 {
            ctx.draw_circle(
                x,
                y,
                2.2 + n1 * 2.2,
                Paint::fill(if index % 38 == 0 { YARN_C } else { YARN_A }),
            );
        }
        previous = (x, y);
    }
    ctx.draw_circle(
        center_x,
        center_y,
        76.0,
        Paint::stroke(rgba(0xff, 0xff, 0xff, 0x16), 1.0),
    );
    ctx.restore();
}

fn fade_noise(t: f32) -> f32 {
    t * t * t * (t * (t * 6.0 - 15.0) + 10.0)
}

fn hash_3(x: i32, y: i32, z: i32) -> f32 {
    let mut hash = x
        .wrapping_mul(374_761_393)
        .wrapping_add(y.wrapping_mul(668_265_263))
        .wrapping_add(z.wrapping_mul(2_147_483_647));
    hash = (hash ^ (hash >> 13)).wrapping_mul(1_274_126_177);
    hash ^= hash >> 16;
    (hash & 0x7FFF_FFFF) as f32 / 2_147_483_647.0
}

fn value_noise_3(x: f32, y: f32, z: f32) -> f32 {
    let ix = x.floor() as i32;
    let iy = y.floor() as i32;
    let iz = z.floor() as i32;
    let ux = fade_noise(x - ix as f32);
    let uy = fade_noise(y - iy as f32);
    let uz = fade_noise(z - iz as f32);
    let x00 = lerp(hash_3(ix, iy, iz), hash_3(ix + 1, iy, iz), ux);
    let x10 = lerp(hash_3(ix, iy + 1, iz), hash_3(ix + 1, iy + 1, iz), ux);
    let x01 = lerp(hash_3(ix, iy, iz + 1), hash_3(ix + 1, iy, iz + 1), ux);
    let x11 = lerp(
        hash_3(ix, iy + 1, iz + 1),
        hash_3(ix + 1, iy + 1, iz + 1),
        ux,
    );
    lerp(lerp(x00, x10, uy), lerp(x01, x11, uy), uz)
}

fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}

fn yarn_color(t: f32) -> u32 {
    let warm = (0.5 + (t * PI * 2.0).sin() * 0.5).clamp(0.0, 1.0);
    let cool = 1.0 - warm;
    rgba(
        (116.0 * cool + 255.0 * warm).round() as u32,
        (222.0 * cool + 132.0 * warm).round() as u32,
        (255.0 * cool + 150.0 * warm).round() as u32,
        230,
    )
}
