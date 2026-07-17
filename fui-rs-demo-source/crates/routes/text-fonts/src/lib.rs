mod custom_font_section;
mod generated;
mod model;
mod rich_text_section;
mod view;

use fui::prelude::*;
use std::rc::Rc;
use view::TextFontsState;

#[derive(Clone)]
struct TextFontsPage {
    root: SelectionArea,
    _state: Rc<TextFontsState>,
}

fui_component!(TextFontsPage => root);

impl TextFontsPage {
    fn new() -> Self {
        let state = TextFontsState::new();
        Self {
            root: state.root.clone(),
            _state: state,
        }
    }
}

fui_app!(TextFontsPage, TextFontsPage::new);
