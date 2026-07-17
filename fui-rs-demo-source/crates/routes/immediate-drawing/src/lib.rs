mod generated;
mod widgets;

use fui::prelude::*;
use fui_rs_demo_shared::design_system::{
    create_nav_bar, demo_scroll_box, demo_text, panel, vertical_spacer, DemoTextStyle,
    HEADING_TO_BODY_GAP_PX, PAGE_SECTION_GAP_PX, TITLE_TO_SUPPORTING_GAP_PX,
};
use widgets::DrawingGallery;

#[derive(Clone)]
struct ImmediateDrawingPage {
    root: SelectionArea,
}

fui_component!(ImmediateDrawingPage => root);

impl ImmediateDrawingPage {
    fn new() -> Self {
        use_system_theme();
        let gallery = DrawingGallery::new();
        let gallery_panel = ui! {
            panel().fill_width() {
                demo_text("Live drawing surfaces", DemoTextStyle::Heading3),
                vertical_spacer(HEADING_TO_BODY_GAP_PX),
                demo_text(
                    "Watch the charts update, pull the dancing yarn, and drag across the paint surface.",
                    DemoTextStyle::BodySecondary,
                ),
                vertical_spacer(PAGE_SECTION_GAP_PX),
                gallery,
            }
        };
        let content_scroll = demo_scroll_box("immediate-drawing-content-scroll");
        content_scroll.fill_size().child(&gallery_panel);
        let main_panel = ui! {
            panel().fill_size() {
                demo_text("Immediate-mode drawing", DemoTextStyle::Heading2),
                vertical_spacer(TITLE_TO_SUPPORTING_GAP_PX),
                demo_text(
                    "Retained controls can host custom GPU-backed drawing without giving up layout, semantics, input, or theming.",
                    DemoTextStyle::BodySecondary,
                ),
                vertical_spacer(PAGE_SECTION_GAP_PX),
                content_scroll,
            }
        };
        let content = ui! {
            column()
                .min_width(800.0, Unit::Pixel)
                .min_height(600.0, Unit::Pixel)
                .fill_size()
                .padding(24.0, 24.0, 24.0, 24.0) {
                    create_nav_bar("Immediate Drawing - FUI-RS Demo", "immediate-drawing"),
                    vertical_spacer(PAGE_SECTION_GAP_PX),
                    main_panel,
                }
        };
        let main_scroll = demo_scroll_box("immediate-drawing-scroll");
        main_scroll.fill_size().child(&content);
        let root = ui! { selection_area().fill_size() { main_scroll } };
        root.bind_theme(|node, theme| {
            node.bg_color(theme.colors.background);
        });
        Self { root }
    }
}

fui_app!(ImmediateDrawingPage, ImmediateDrawingPage::new);
