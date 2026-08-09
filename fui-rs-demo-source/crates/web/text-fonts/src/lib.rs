#![cfg(target_family = "wasm")]

use fui::prelude::*;
use fui_rs_demo_text_fonts::TextFontsPage;

fn create_page() -> TextFontsPage {
    Application::caption("FUI-RS Demo - Text & Fonts");
    use_system_theme();
    TextFontsPage::new()
}

fui::fui_app!(TextFontsPage, create_page);
