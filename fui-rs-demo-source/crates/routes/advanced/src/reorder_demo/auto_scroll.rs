use super::*;

impl ReorderDemoState {
    pub(super) fn handle_auto_scroll_timer(owner: &Rc<RefCell<Self>>) {
        let (current_offset, delta_y, item_count, viewport_height) = {
            let state = owner.borrow();
            if state.active_drag_item_id.borrow().is_none()
                || state.auto_scroll_delta_y.get() == 0.0
            {
                drop(state);
                owner.borrow().stop_auto_scroll();
                return;
            }
            let item_count = state.items.borrow().len() as i32;
            (
                state.scroll_box.scroll_state().offset_y(),
                state.auto_scroll_delta_y.get(),
                item_count,
                state.read_viewport_height(),
            )
        };
        let next_offset = compute_next_reorder_auto_scroll_offset(
            current_offset,
            delta_y,
            item_count,
            viewport_height,
        );
        if next_offset == current_offset {
            owner.borrow().stop_auto_scroll();
            return;
        }
        let scroll_box = owner.borrow().scroll_box.clone();
        scroll_box.scroll_offset(0.0, next_offset);
        {
            let state = owner.borrow();
            let visible_range = state.read_visible_range();
            let direction = if delta_y < 0.0 { -1 } else { 1 };
            state
                .raw_insertion_index
                .set(compute_reorder_edge_insertion_index(
                    direction,
                    item_count,
                    visible_range,
                ));
            state.drag_status_message.replace(format!(
                "Reorder drag status: auto-scrolling {}",
                if direction < 0 { "up" } else { "down" }
            ));
            state.sync_all();
        }
        owner.borrow().arm_auto_scroll_timer();
    }

    pub(super) fn sync_viewport_status(&self) {
        let visible_range = self.read_visible_range();
        let first_visible = if visible_range.last_visible_index < 0 {
            0
        } else {
            visible_range.first_visible_index + 1
        };
        let last_visible = if visible_range.last_visible_index < 0 {
            0
        } else {
            visible_range.last_visible_index + 1
        };
        self.viewport_status_text.text(format!(
            "Reorder viewport status: offset {} | visible {}-{}",
            self.scroll_box.scroll_state().offset_y() as i32,
            first_visible,
            last_visible
        ));
    }

    pub(super) fn read_visible_range(&self) -> ReorderVisibleRange {
        compute_reorder_visible_range(
            self.items.borrow().len() as i32,
            self.scroll_box.scroll_state().offset_y(),
            self.read_viewport_height(),
        )
    }

    pub(super) fn read_viewport_height(&self) -> f32 {
        let current = self.scroll_box.scroll_state().viewport_height();
        if current > 0.0 {
            current
        } else {
            REORDER_VIEWPORT_HEIGHT_PX
        }
    }

    pub(super) fn set_auto_scroll_delta(&self, next_delta_y: f32) {
        let delta_difference = (self.auto_scroll_delta_y.get() - next_delta_y).abs();
        if delta_difference <= 0.05 {
            if next_delta_y == 0.0 {
                self.stop_auto_scroll();
                return;
            }
            if next_delta_y != 0.0 {
                self.arm_auto_scroll_timer();
            }
            return;
        }
        self.auto_scroll_delta_y.set(next_delta_y);
        if next_delta_y == 0.0 {
            self.stop_auto_scroll();
            return;
        }
        self.arm_auto_scroll_timer();
    }

    pub(super) fn compute_pointer_auto_scroll_delta(&self, pointer_y: f32) -> f32 {
        let bounds = self.scroll_box.viewport().get_bounds();
        compute_reorder_pointer_auto_scroll_delta(pointer_y, bounds[1], bounds[3])
    }

    pub(super) fn arm_auto_scroll_timer(&self) {
        if let Some(existing) = self.auto_scroll_timer.borrow_mut().take() {
            cancel_timeout(existing);
        }
        let weak = self.self_weak.borrow().clone();
        let handle = set_timeout(AUTOSCROLL_DELAY_MS, move || {
            if let Some(state) = weak.upgrade() {
                ReorderDemoState::handle_auto_scroll_timer(&state);
            }
        });
        self.auto_scroll_timer.borrow_mut().replace(handle);
    }

    pub(super) fn stop_auto_scroll(&self) {
        self.auto_scroll_delta_y.set(0.0);
        if let Some(handle) = self.auto_scroll_timer.borrow_mut().take() {
            cancel_timeout(handle);
        }
    }
}
