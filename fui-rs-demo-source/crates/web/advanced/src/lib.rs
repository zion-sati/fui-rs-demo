#![cfg(target_family = "wasm")]

use fui::prelude::*;
use fui_rs_demo_advanced::AdvancedPage;

fn create_page() -> AdvancedPage {
    Application::caption("FUI-RS Demo - Advanced");
    AdvancedPage::new()
}

fui::fui_app!(AdvancedPage, create_page);
