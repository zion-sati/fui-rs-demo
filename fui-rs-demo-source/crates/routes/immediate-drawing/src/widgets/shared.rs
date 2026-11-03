use fui::prelude::*;
use std::cell::Cell;

pub(super) const ACCENT: u32 = rgb(0x3a, 0x6c, 0xc5);
pub(super) const GRAY: u32 = rgb(0xc8, 0xc8, 0xc8);
pub(super) const NEEDLE: u32 = rgb(0xdc, 0x32, 0x32);
pub(super) const CARD: u32 = rgb(0x23, 0x23, 0x32);
/// The side length of a drawing surface on a wide screen.
pub(super) const SURFACE_SIZE_PX: f32 = 300.0;

thread_local! {
    // The side length every surface draws at; the gallery makes it smaller in the compact layout.
    static SURFACE_SIZE: Cell<f32> = const { Cell::new(SURFACE_SIZE_PX) };
}

pub(super) fn surface_size() -> f32 {
    SURFACE_SIZE.with(Cell::get)
}

/// Resizes the square surfaces; each draws at the new size from its next frame.
pub(super) fn resize_surfaces(nodes: &[&CustomDrawable], size: f32) {
    SURFACE_SIZE.with(|surface_size| surface_size.set(size));
    for node in nodes {
        node.width(size, Unit::Pixel).height(size, Unit::Pixel);
        node.mark_dirty();
    }
}

pub(super) fn create_plot_title(title: &str, theme: &Theme) -> TextLayout {
    let layout = TextLayout::text(title);
    layout
        .font_family(theme.fonts.body_family.clone())
        .font_size(13.0)
        .text_color(rgba(0xeb, 0xee, 0xf5, 0xd2))
        .width(180.0, Unit::Pixel)
        .height(24.0, Unit::Pixel);
    layout
}

pub(super) fn create_dynamic_label(
    color: u32,
    family: FontFamily,
    numeric_precision: Option<i32>,
) -> DynamicTextLayout {
    let layout = match numeric_precision {
        Some(precision) => {
            let layout = DynamicTextLayout::numeric();
            layout.precision(precision);
            layout
        }
        None => DynamicTextLayout::fixed_charset("0123456789.-, "),
    };
    layout
        .font_family(family)
        .font_size(12.0)
        .text_color(color)
        .width(72.0, Unit::Pixel)
        .height(20.0, Unit::Pixel);
    layout
}

pub(super) fn wake_for_layout(node: &CustomDrawable, layout: &TextLayout) {
    let invalidator = node.invalidator();
    layout.on_ready(move |_| invalidator.mark_dirty());
}

pub(super) fn wake_for_dynamic(node: &CustomDrawable, layout: &DynamicTextLayout) {
    let invalidator = node.invalidator();
    layout.on_ready(move |_| invalidator.mark_dirty());
}

pub(super) fn draw_plot_title(ctx: &DrawContext, title: &TextLayout) {
    if title.is_ready() {
        ctx.draw_text_layout(title, 16.0, 24.0);
    }
}

pub(super) fn draw_dynamic_label(ctx: &DrawContext, label: &DynamicTextLayout, x: f32, y: f32) {
    if !label.is_ready() {
        return;
    }
    let width = label.measure().width + 10.0;
    ctx.draw_round_rect(
        x,
        y,
        width,
        22.0,
        5.0,
        5.0,
        Paint::fill(rgba(0x08, 0x0a, 0x12, 0xe1)),
    );
    ctx.draw_dynamic_text_layout(label, x + 5.0, y + 4.0);
}

pub(super) fn surface(draw: impl Fn(&mut DrawContext) + 'static) -> CustomDrawable {
    let node = custom_drawable(draw);
    node.width(surface_size(), Unit::Pixel)
        .height(surface_size(), Unit::Pixel);
    node
}

pub(super) fn format_tenths(value: f32) -> String {
    let mut scaled = (value * 10.0).round() as i32;
    let sign = if scaled < 0 {
        scaled = -scaled;
        "-"
    } else {
        ""
    };
    format!("{sign}{}.{}", scaled / 10, scaled % 10)
}
