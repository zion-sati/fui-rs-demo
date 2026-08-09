mod animation_section;
mod external_drop_demo;
mod fetch_section;
mod generated;
mod reorder_demo;
mod worker_section;

use animation_section::create_animation_section;
use external_drop_demo::ExternalDropDemoPanel;
use fetch_section::create_fetch_section;
use fui::prelude::*;
use fui_rs_demo_shared::design_system::{
    create_nav_bar, demo_scroll_box, demo_text as styled_text, panel, vertical_spacer,
    DemoTextStyle, PAGE_SECTION_GAP_PX,
};
use reorder_demo::ReorderDemoPanel;
use worker_section::create_worker_section;

#[derive(Clone)]
struct AdvancedPage {
    root: SelectionArea,
}

fui_component!(AdvancedPage => root);

impl AdvancedPage {
    fn new() -> Self {
        use_system_theme();
        let sections = ui! {
            column().fill_width() {
                create_animation_section(),
                vertical_spacer(PAGE_SECTION_GAP_PX),
                create_worker_section(),
                vertical_spacer(PAGE_SECTION_GAP_PX),
                create_fetch_section(),
                vertical_spacer(PAGE_SECTION_GAP_PX),
                ExternalDropDemoPanel::new(),
                vertical_spacer(PAGE_SECTION_GAP_PX),
                ReorderDemoPanel::new(),
                vertical_spacer(PAGE_SECTION_GAP_PX),
        }};
        let content_scroll = demo_scroll_box("AdvancedScrollBox");
        content_scroll
            .fill_size()
            .scroll_enabled_x(false)
            .child(&sections);
        let body = ui! {
            column()
                .min_width(800.0, Unit::Pixel)
                .min_height(600.0, Unit::Pixel)
                .fill_size()
                .padding(24.0, 24.0, 24.0, 24.0) {
                    create_nav_bar("Advanced - FUI-RS Demo", "advanced"),
                    vertical_spacer(16.0),
                    panel().fill_size() {
                        styled_text("Advanced", DemoTextStyle::Heading2),
                        vertical_spacer(8.0),
                        styled_text("Interop demos: animations, worker tasks, scroll surfaces, and browser integrations.", DemoTextStyle::Lead),
                        vertical_spacer(8.0),
                        styled_text("Each section exercises a cross-cutting runtime capability — use the controls and buttons to drive them live.", DemoTextStyle::BodySecondary),
                        vertical_spacer(16.0),
                        content_scroll,
        }}};
        let main_scroll = demo_scroll_box("mainScrollBox");
        main_scroll.fill_size().child(&body);
        Self {
            root: ui! {
                selection_area()
                    .fill_size()
                    .bind_theme(|root, theme| {
                        root.bg_color(theme.colors.background);
                    }) {
                        main_scroll
                }
            },
        }
    }
}

fui_app!(AdvancedPage, AdvancedPage::new);
