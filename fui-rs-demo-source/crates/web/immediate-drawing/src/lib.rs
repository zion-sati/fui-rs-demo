#![cfg(target_family = "wasm")]

use fui::prelude::*;
use fui_rs_demo_immediate_drawing::ImmediateDrawingPage;

fn create_page() -> ImmediateDrawingPage {
    Application::caption("FUI-RS Demo - Immediate Drawing");
    ImmediateDrawingPage::new()
}

fui::fui_app!(ImmediateDrawingPage, create_page);
