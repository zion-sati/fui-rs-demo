mod bitmap;
mod controls_images;
mod generated;
mod nested_scroll;
mod page;
mod virtual_list;

use fui::prelude::*;
use fui_rs_demo_shared::design_system::*;
use std::cell::{Cell, RefCell};
use std::rc::Rc;

const VIRTUAL_LIST_ITEMS: i32 = 100_000;
const VIRTUAL_LIST_ITEM_HEIGHT: f32 = 62.0;
const DEMO_BITMAP_SIZE: u32 = 512;

#[derive(Clone)]
struct HomePage {
    root: SelectionArea,
    _state: Rc<HomeState>,
}

fui_component!(HomePage => root);

struct HomeState {
    root: SelectionArea,
    dialog: Dialog,
    dropdown: Dropdown,
    dropdown_items: Vec<DropdownItem>,
    tri_state_checkbox: Checkbox,
    bi_state_checkbox: Checkbox,
    quality_radio_group: RadioGroup,
    horizontal_slider: Slider,
    vertical_slider: Slider,
    elapsed_text: TextNode,
    summary_text: TextNode,
    foundations_toggle_button: Button,
    foundations_scoped_button: Button,
    foundations_key_target_box: FlexBox,
    foundations_key_target_text: TextNode,
    foundations_status_text: TextNode,
    foundations_focus_text: TextNode,
    foundations_action_text: TextNode,
    foundations_scope_box: FlexBox,
    foundations_scope_enabled: Cell<bool>,
    foundations_scoped_focused: Cell<bool>,
    foundations_action_count: Cell<i32>,
    foundations_key_target_focused: Cell<bool>,
    foundations_last_key: RefCell<String>,
    start_tick: Cell<i32>,
    host_event_subscriptions: RefCell<Vec<HostEventSubscription>>,
    _bitmap: Bitmap,
}

impl HomeState {
    fn selection_summary(&self) -> String {
        let index = self.dropdown.selected_index();
        let dropdown_label = self
            .dropdown_items
            .get(index.max(0) as usize)
            .map(|item| item.label.as_str())
            .unwrap_or("none");
        let tri_state = match self.tri_state_checkbox.checked_state() {
            CheckState::Mixed => "mixed",
            CheckState::True => "checked",
            CheckState::False => "unchecked",
        };
        format!(
            "Selections: size={}, tri={}, bi={}, radio={}, horizontal={}, vertical={}",
            dropdown_label,
            tri_state,
            if self.bi_state_checkbox.is_checked() {
                "checked"
            } else {
                "unchecked"
            },
            self.quality_radio_group.selected_value(),
            self.horizontal_slider.current_value().round() as i32,
            self.vertical_slider.current_value().round() as i32,
        )
    }

    fn refresh_summary(&self) {
        self.summary_text.text(self.selection_summary());
    }

    fn show_dialog(&self) {
        self.dialog
            .content("Demo dialog form", self.selection_summary())
            .show();
    }

    fn set_elapsed_seconds(&self, tick: i32) {
        if self.start_tick.get() < 0 {
            self.start_tick.set(tick);
        }
        let elapsed = (tick - self.start_tick.get()).max(0);
        self.elapsed_text.text(format!(
            "Time since app started: {:02}:{:02}:{:02}",
            elapsed / 3600,
            (elapsed % 3600) / 60,
            elapsed % 60,
        ));
    }

    fn toggle_foundations_scope(&self) {
        let enabled = !self.foundations_scope_enabled.get();
        self.foundations_scope_enabled.set(enabled);
        if !enabled {
            self.foundations_scoped_focused.set(false);
        }
        self.refresh_foundations_state();
    }

    fn record_foundations_action(&self) {
        if self.foundations_scope_enabled.get() {
            self.foundations_action_count
                .set(self.foundations_action_count.get() + 1);
            self.refresh_foundations_state();
        }
    }

    fn refresh_foundations_state(&self) {
        let enabled = self.foundations_scope_enabled.get();
        self.foundations_status_text.text(if enabled {
            "Scoped parent: enabled"
        } else {
            "Scoped parent: disabled via parent container"
        });
        self.foundations_toggle_button.text(if enabled {
            "Disable scoped child"
        } else {
            "Enable scoped child"
        });
        self.foundations_scope_box.enabled(enabled);
        self.foundations_focus_text
            .text(if self.foundations_scoped_focused.get() {
                "Scoped child focus: focused"
            } else {
                "Scoped child focus: unfocused"
            });
        self.foundations_action_text.text(format!(
            "Scoped child activations {}",
            self.foundations_action_count.get()
        ));
    }

    fn refresh_key_target(&self) {
        let theme = current_theme();
        let focused = self.foundations_key_target_focused.get();
        self.foundations_key_target_box
            .bg_color(if focused {
                with_alpha(theme.colors.accent, 34)
            } else {
                theme.colors.surface
            })
            .border(
                1.0,
                if focused {
                    theme.colors.focus_ring
                } else {
                    theme.colors.border
                },
            );
        let key = self.foundations_last_key.borrow();
        self.foundations_key_target_text.text(format!(
            "Focus me, then press keys. Last key: {}",
            if key.is_empty() { "none" } else { key.as_str() }
        ));
    }
}

use bitmap::*;
use controls_images::*;
use nested_scroll::*;
use virtual_list::*;

fui_app!(HomePage, HomePage::new);
