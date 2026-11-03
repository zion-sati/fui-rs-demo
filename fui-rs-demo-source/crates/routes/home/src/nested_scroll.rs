use super::*;
/// The nested scroll panel, and how it fits the layout: in the compact layout the scroll box takes its panel's width.
pub(super) fn create_nested_scroll_panel() -> (FlexBox, impl Fn(bool)) {
    let scroll = demo_scroll_box("Nested ScrollBox");
    scroll
        .horizontal_scrollbar_visibility(ScrollBarVisibility::Always)
        .vertical_scrollbar_visibility(ScrollBarVisibility::Always)
        .scrollbar_gutter(8.0)
        .height(240.0, Unit::Pixel)
        .children(children![
            ui! {
                column()
                    .width(800.0, Unit::Pixel)
                    .padding(16.0, 16.0, 16.0, 16.0) {
                        demo_text("Nested Scroll Content - START", DemoTextStyle::Label),
                        vertical_spacer(72.0),
                        demo_text("Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966, when designers at Letraset and James Mosley, the librarian at St Bride Printing Library, took a 1914 Cicero translation and scrambled it to make dummy text for Letraset's Body Type sheets. It has survived not only many decades, but also the leap into electronic typesetting, remaining essentially unchanged.", DemoTextStyle::BodySecondary),
                        vertical_spacer(116.0),
                        demo_text("Nested Scroll Content - END", DemoTextStyle::Label),
                }
            }
        ]);
    let scroll_panel = ui! { panel() { scroll.clone() } };
    let panel = ui! {
        panel() {
            demo_text("Nested ScrollBox", DemoTextStyle::Heading3),
            vertical_spacer(PANEL_SECTION_GAP_PX),
            scroll_panel.clone(),
        }
    };
    let apply_layout = move |compact: bool| {
        if compact {
            scroll_panel
                .width(0.0, Unit::Auto)
                .align_self(AlignSelf::Stretch);
            scroll.fill_width();
        } else {
            scroll_panel
                .width(360.0, Unit::Pixel)
                .align_self(AlignSelf::Auto);
            scroll.width(300.0, Unit::Pixel);
        }
    };
    (panel, apply_layout)
}
