use fui::prelude::*;
use fui_rs_demo_shared::design_system::{
    demo_button, demo_text, section_panel, vertical_spacer, DemoButtonTone, DemoTextStyle,
};
use std::cell::{Cell, RefCell};
use std::rc::Rc;

mod file_copy;
mod model;
mod state;

use model::*;
use state::*;

#[derive(Clone)]
pub(crate) struct ExternalDropDemoPanel {
    root: FlexBox,
    _state: Rc<ExternalDropDemoState>,
}

fui_component!(ExternalDropDemoPanel => root, owner: _state);

impl ExternalDropDemoPanel {
    pub(crate) fn new() -> Self {
        let root = ui! {
        section_panel("External file drop").fill_width()
            .semantic_label("External file drop card")
        };

        let drop_title_text = demo_text("Drop files here", DemoTextStyle::Heading3);
        let drop_body_text = demo_text(
            "The drop target receives a first-class BrowserFile handle, then the sample copies it through a Worker-read plus picker-write pipeline. Chunk payloads hop back with zero-copy transfer-list handoff.",
            DemoTextStyle::Body,
        );
        drop_body_text.text_limits(-1, 3);

        let drop_target = ui! {
            flex_box()
            .fill_width()
            .height(156.0, Unit::Pixel)
            .padding(18.0, 18.0, 18.0, 18.0)
            .corner_radius(20.0)
            .allow_external_drop(true)
            .semantic_role(SemanticRole::Form)
            .semantic_label("External file drop target")
            .child(&ui! {
                column()
                .fill_width()
                .child(&drop_title_text)
                .child(&vertical_spacer(8.0))
                .child(&drop_body_text)
            })
        };

        let status_text = ui! {
        demo_text("External drop status: idle", DemoTextStyle::Body).semantic_label("External drop status: idle")
        };
        let items_text = ui! {
        demo_text("External drop items: none", DemoTextStyle::Body).text_limits(-1, 4)
        };
        items_text.semantic_label("External drop items: none");
        let capability_text = ui! {
        demo_text("", DemoTextStyle::BodySecondary).text_limits(-1, 3)
        };
        let hint_text = demo_text(
            "Drop a file here, then choose Save dropped file copy. This demo keeps the save picker on the main thread, reads the dropped file in a dedicated Worker, and transfers each ArrayBuffer chunk back with a postMessage transfer list before writing it into the picked target file.",
            DemoTextStyle::Body,
        );
        hint_text.text_limits(-1, 6);
        let copy_button = ui! {
        demo_button("Export dropped file", DemoButtonTone::Secondary)
            .semantic_label("Save dropped file copy")
            .fill_width()
            .height(48.0, Unit::Pixel)
            .padding(14.0, 14.0, 14.0, 14.0)
            .corner_radius(16.0)
        };

        root.child(&drop_target)
            .child(&vertical_spacer(14.0))
            .child(&status_text)
            .child(&vertical_spacer(6.0))
            .child(&items_text)
            .child(&vertical_spacer(8.0))
            .child(&copy_button)
            .child(&vertical_spacer(8.0))
            .child(&capability_text)
            .child(&vertical_spacer(10.0))
            .child(&hint_text);

        let state = Rc::new(ExternalDropDemoState::new(ExternalDropDemoElements {
            drop_target: drop_target.clone(),
            drop_title_text,
            drop_body_text,
            status_text,
            items_text,
            capability_text,
            hint_text,
            copy_button: copy_button.clone(),
        }));
        state.sync_capabilities();
        state.sync_items();
        state.apply_theme(&current_theme());

        drop_target.on_external_drag_enter({
            let state = Rc::downgrade(&state);
            move |args| {
                state
                    .upgrade()
                    .map(|state| state.handle_external_drag(args))
                    .unwrap_or_else(DropProposal::none)
            }
        });
        drop_target.on_external_drag_over({
            let state = Rc::downgrade(&state);
            move |args| {
                state
                    .upgrade()
                    .map(|state| state.handle_external_drag(args))
                    .unwrap_or_else(DropProposal::none)
            }
        });
        drop_target.on_external_drag_leave({
            let state = Rc::downgrade(&state);
            move |args| {
                if let Some(state) = state.upgrade() {
                    state.handle_external_leave(args);
                }
            }
        });
        drop_target.on_external_drop({
            let state = Rc::downgrade(&state);
            move |args| {
                if let Some(state) = state.upgrade() {
                    state.handle_external_drop(args);
                }
            }
        });
        copy_button.on_click({
            let state = Rc::downgrade(&state);
            move |_event| {
                if let Some(state) = state.upgrade() {
                    state.start_dropped_file_copy();
                }
            }
        });

        root.bind_theme({
            let state = Rc::downgrade(&state);
            move |_root, theme| {
                if let Some(state) = state.upgrade() {
                    state.apply_theme(&theme);
                }
            }
        });

        Self {
            root,
            _state: state,
        }
    }
}
