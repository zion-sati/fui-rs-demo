mod animation_section;
mod external_drop_demo;
mod fetch_section;
mod reorder_demo;
mod worker_section;

use animation_section::create_animation_section;
use external_drop_demo::ExternalDropDemoPanel;
use fetch_section::create_fetch_section;
use fui::prelude::*;
use fui_rs_demo_shared::design_system::{
    create_route_chrome, demo_scroll_box, demo_text as styled_text, page_compact_layout, panel,
    vertical_spacer, CompactLayout, DemoTextStyle, PAGE_MIN_HEIGHT_PX, PAGE_SECTION_GAP_PX,
};
use reorder_demo::ReorderDemoPanel;
use worker_section::create_worker_section;

#[derive(Clone)]
pub struct AdvancedPage {
    root: SelectionArea,
    _layout: CompactLayout,
}

fui_component!(AdvancedPage => root);

impl AdvancedPage {
    pub fn new() -> Self {
        use_system_theme();
        let (worker_section, worker_layout) = create_worker_section();
        let sections = ui! {
            column().fill_width() {
                create_animation_section(),
                vertical_spacer(PAGE_SECTION_GAP_PX),
                worker_section,
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
        let chrome = create_route_chrome("Advanced - FUI-RS Demo", "advanced", 16.0);
        let body = ui! {
            column().fill_size() {
                    chrome.root(),
                    panel().fill_size() {
                        styled_text("Advanced", DemoTextStyle::Heading2),
                        vertical_spacer(8.0),
                        styled_text("Interop demos: animations, worker tasks, scroll surfaces, and browser integrations.", DemoTextStyle::Lead),
                        vertical_spacer(8.0),
                        styled_text("Each section exercises a cross-cutting runtime capability — use the controls and buttons to drive them live.", DemoTextStyle::BodySecondary),
                        vertical_spacer(16.0),
                        content_scroll,
        }}};
        // The content scroll box never scrolls sideways here, so the layout leaves it alone.
        let layout = page_compact_layout(&body, &chrome, None, PAGE_MIN_HEIGHT_PX, worker_layout);
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
            _layout: layout,
        }
    }

    pub fn root(&self) -> SelectionArea {
        self.root.clone()
    }
}

impl Default for AdvancedPage {
    fn default() -> Self {
        Self::new()
    }
}
