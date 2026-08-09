#![cfg(target_family = "wasm")]

use fui::prelude::*;
use fui_rs_demo_home::HomePage;

fn create_page() -> HomePage {
    Application::caption("FUI-RS Demo - Home");
    let services = fui_rs_demo_shared::app_services::create_web_app_services();
    HomePage::new(services.clock)
}

fui::fui_app!(HomePage, create_page);
