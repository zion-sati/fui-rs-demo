use fui::prelude::*;
use fui_rs_demo_shared::design_system::{
    demo_button, demo_text, panel, section_panel, vertical_spacer, DemoButtonTone, DemoTextStyle,
};

const ROW_HEIGHT: f32 = 80.0;
const ROW_COUNT: i32 = 18;
const LOGICAL_TAIL: f32 = 240.0;

pub(crate) fn create_animation_section() -> FlexBox {
    let preview = ui! {
        flex_box()
            .fill_width()
            .height(128.0, Unit::Pixel)
            .padding(18.0, 18.0, 18.0, 18.0)
            .corner_radius(20.0)
            .transitions(Some(
                NodeTransitions::new()
                    .bg_color(AnimationTiming::with_easing(1000.0, Easings::cubic_out()))
                    .opacity(AnimationTiming::with_easing(500.0, Easings::cubic_out())),
            ))
    };
    let preview_title = demo_text("Calm transition target", DemoTextStyle::Heading3);
    let preview_body = demo_text(
        "Opacity and background transitions stay on the same retained node while the control layer keeps behavior ownership elsewhere.",
        DemoTextStyle::Body,
    );
    let preview_status = demo_text("Animation preview: calm", DemoTextStyle::BodySecondary);
    preview.children(children![column().fill_width().children(children![
        preview_title.clone(),
        vertical_spacer(8.0),
        preview_body.clone()
    ])]);
    preview.bind_theme(|surface, theme| {
        surface
            .bg_color(theme.colors.surface)
            .border(1.0, theme.colors.border);
    });

    let calm = demo_button("Set calm preview", DemoButtonTone::Secondary);
    calm.on_click({
        let preview = preview.clone();
        let preview_title = preview_title.clone();
        let preview_body = preview_body.clone();
        let preview_status = preview_status.clone();
        move |_| {
            let theme = current_theme();
            preview_title.text("Calm transition target");
            preview_body.text("Opacity and background transitions stay on the same retained node while the control layer keeps behavior ownership elsewhere.");
            preview_status.text("Animation preview: calm");
            preview.bg_color(theme.colors.surface).opacity(0.7);
        }
    });
    let emphasize = demo_button("Emphasize preview card", DemoButtonTone::Primary);
    emphasize.on_click({
        let preview = preview.clone();
        let preview_title = preview_title.clone();
        let preview_body = preview_body.clone();
        let preview_status = preview_status.clone();
        move |_| {
            let theme = current_theme();
            preview_title.text("Emphasized transition target");
            preview_body.text("The preview now transitions color and opacity together.");
            preview_status.text("Animation preview: emphasized");
            preview.bg_color(theme.colors.accent_hovered).opacity(1.0);
        }
    });

    let scroll_status = demo_text("ScrollBox idle", DemoTextStyle::BodySecondary);
    let scroll_content = column().fill_width().clone();
    for index in 0..ROW_COUNT {
        let detail = if index == ROW_COUNT - 1 {
            "The final target proves retained smooth scrolling can drive to the far end of the viewport."
        } else {
            "Retained content stays pooled and composable while the viewport animates independently."
        };
        let row = ui! {
            flex_box()
                .fill_width()
                .height(ROW_HEIGHT, Unit::Pixel)
                .padding(16.0, 12.0, 16.0, 12.0)
                .corner_radius(14.0)
                .semantic_label(format!("Animation sample row {}", index + 1)) {
                    column().fill_width() {
                        demo_text(format!("Animation sample row {}", index + 1), DemoTextStyle::Body),
                        vertical_spacer(4.0),
                        demo_text(detail, DemoTextStyle::BodySecondary),
                    },
            }
        };
        row.bind_theme(move |row, theme| {
            fui_rs_demo_shared::design_system::apply_row_background(row, index, &theme);
        });
        scroll_content.child(&row);
    }
    let scroller = fui_rs_demo_shared::design_system::demo_scroll_box("AdvancedAnimationScrollBox");
    scroller
        .fill_width()
        .height(280.0, Unit::Pixel)
        .scroll_enabled_x(false)
        .vertical_scrollbar_visibility(ScrollBarVisibility::Always)
        .horizontal_scrollbar_visibility(ScrollBarVisibility::Never)
        .scrollbar_gutter(8.0)
        .scroll_content_size(-1.0, ROW_HEIGHT * ROW_COUNT as f32 + LOGICAL_TAIL)
        .persist_scroll(false)
        .children(children![scroll_content]);
    let scroll_button = |label: &'static str, y: f32, status: &'static str| {
        let tone = if label == "Scroll to 14th sample" {
            DemoButtonTone::Primary
        } else {
            DemoButtonTone::Secondary
        };
        let control = demo_button(label, tone);
        control.on_click({
            let scroller = scroller.clone();
            let scroll_status = scroll_status.clone();
            move |_| {
                scroller.scroll_to_animated(
                    0.0,
                    y,
                    AnimationTiming::with_easing(300.0, Easings::cubic_out()),
                );
                scroll_status.text(status);
            }
        });
        control
    };

    let section = ui! {
        column().fill_width() {
            section_panel("Transitions") {
                preview,
                vertical_spacer(14.0),
                row().fill_width().align_items(AlignItems::Stretch) {
                    calm.width(170.0, Unit::Pixel).height(60.0, Unit::Pixel),
                    flex_box().width(12.0, Unit::Pixel),
                    emphasize.width(190.0, Unit::Pixel).height(60.0, Unit::Pixel),
                },
                vertical_spacer(14.0),
                preview_status,
            },
            vertical_spacer(18.0),
            section_panel("Scroll Surfaces") {
                panel() { scroller.width(700.0, Unit::Pixel) },
                vertical_spacer(14.0),
                row().fill_width().align_items(AlignItems::Stretch) {
                    scroll_button("Scroll to first sample", 0.0, "Scrolling to first sample...").width(180.0, Unit::Pixel).height(60.0, Unit::Pixel),
                    flex_box().width(12.0, Unit::Pixel),
                    scroll_button("Scroll to 8th sample", 7.0 * ROW_HEIGHT, "Scrolling to 8th sample...").width(190.0, Unit::Pixel).height(60.0, Unit::Pixel),
                    flex_box().width(12.0, Unit::Pixel),
                    scroll_button("Scroll to 14th sample", 13.0 * ROW_HEIGHT, "Scrolling to 14th sample...").width(180.0, Unit::Pixel).height(60.0, Unit::Pixel),
                },
                vertical_spacer(10.0),
                row().fill_width() {
                    scroll_button("Scroll to logical tail", ROW_HEIGHT * ROW_COUNT as f32 + LOGICAL_TAIL - 280.0, "Scrolling to logical tail...").width(170.0, Unit::Pixel).height(60.0, Unit::Pixel),
                },
                vertical_spacer(10.0),
                scroll_status,
                vertical_spacer(10.0),
                demo_text("Each card transitions independently. Use the scroll buttons to animate the viewport to different positions in the retained content, including the logical tail beyond the last card.", DemoTextStyle::BodySecondary),
        }}
    };
    section
}
