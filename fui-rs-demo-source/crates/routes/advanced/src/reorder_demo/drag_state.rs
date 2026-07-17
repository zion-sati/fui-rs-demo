use super::*;

impl ReorderDemoState {
    pub(super) fn begin_drag(&self, raw_index: i32) -> Option<DragDataObject> {
        let item = self.items.borrow().get(raw_index as usize).cloned()?;
        ui::clear_current_selection();
        self.active_drag_item_id
            .borrow_mut()
            .replace(String::from(item.id));
        let source_index = find_reorder_item_index(&self.items.borrow(), item.id);
        self.raw_insertion_index
            .set(if source_index >= 0 { source_index } else { -1 });
        self.preview_pointer_x.set(f32::NAN);
        self.preview_pointer_y.set(f32::NAN);
        if let Some(row) = self.rows.get(raw_index as usize) {
            let bounds = row.card.get_bounds();
            self.ghost_card_width.set(bounds[2]);
        }
        self.preview_effect.set(DragDropEffects::None);
        self.preview_insertion_slot.set(-1);
        self.drag_status_message
            .replace(format!("Reorder drag status: dragging {}", item.label));
        self.sync_all();
        Some(
            DragDataObject::new()
                .set_format(REORDER_DRAG_FORMAT, item.id)
                .set_text(item.label),
        )
    }

    pub(super) fn complete_drag(&self, item_id: &str, effect: DragDropEffects) {
        let item = self.find_item(Some(item_id));
        let item_label = item.as_ref().map(|item| item.label).unwrap_or("item");
        self.active_drag_item_id.borrow_mut().take();
        self.raw_insertion_index.set(-1);
        self.preview_pointer_x.set(f32::NAN);
        self.preview_pointer_y.set(f32::NAN);
        self.preview_effect.set(DragDropEffects::None);
        self.preview_insertion_slot.set(-1);
        self.stop_auto_scroll();
        if effect == DragDropEffects::Move {
            let new_index = find_reorder_item_index(&self.items.borrow(), item_id);
            self.drag_status_message.replace(format!(
                "Reorder drag status: moved {} to slot {}",
                item_label,
                new_index + 1
            ));
        } else {
            self.drag_status_message
                .replace(format!("Reorder drag status: cancelled {}", item_label));
        }
        self.sync_all();
    }

    pub(super) fn preview_insertion(
        &self,
        args: DragEventArgs,
        raw_insertion_index: i32,
    ) -> DropProposal {
        let Some(item_id) = args.session.data.get_format(REORDER_DRAG_FORMAT) else {
            self.stop_auto_scroll();
            return DropProposal::none();
        };
        if find_reorder_item_index(&self.items.borrow(), &item_id) < 0 {
            self.stop_auto_scroll();
            return DropProposal::none();
        }
        self.active_drag_item_id
            .borrow_mut()
            .replace(item_id.clone());
        self.raw_insertion_index.set(raw_insertion_index);
        let source_index = find_reorder_item_index(&self.items.borrow(), &item_id);
        let normalized_index = normalize_reorder_insertion_index(
            source_index,
            raw_insertion_index,
            self.items.borrow().len() as i32,
        );
        self.set_auto_scroll_delta(self.compute_pointer_auto_scroll_delta(args.y));
        self.preview_pointer_x.set(args.x);
        self.preview_pointer_y.set(args.y);
        self.preview_effect.set(DragDropEffects::Move);
        self.preview_insertion_slot.set(normalized_index);
        self.drag_status_message.replace(format!(
            "Reorder drag status: preview slot {}",
            normalized_index + 1
        ));
        self.sync_all();
        DropProposal::new(DragDropEffects::Move, true)
    }

    pub(super) fn handle_target_leave(&self, args: DragEventArgs) {
        if self.active_drag_item_id.borrow().is_none() {
            return;
        }
        self.preview_pointer_x.set(args.x);
        self.preview_pointer_y.set(args.y);
        let visible_range = self.read_visible_range();
        self.set_auto_scroll_delta(self.compute_pointer_auto_scroll_delta(args.y));
        if self.auto_scroll_delta_y.get() == 0.0 {
            self.raw_insertion_index.set(-1);
            self.preview_effect.set(DragDropEffects::None);
            self.preview_insertion_slot.set(-1);
            self.drag_status_message.replace(format!(
                "Reorder drag status: dragging {}",
                self.active_drag_label()
            ));
        } else {
            let direction = if self.auto_scroll_delta_y.get() < 0.0 {
                -1
            } else {
                1
            };
            self.raw_insertion_index
                .set(compute_reorder_edge_insertion_index(
                    direction,
                    self.items.borrow().len() as i32,
                    visible_range,
                ));
            let source_index = self
                .active_drag_item_id
                .borrow()
                .as_deref()
                .map(|item_id| find_reorder_item_index(&self.items.borrow(), item_id))
                .unwrap_or(-1);
            let raw = self.raw_insertion_index.get();
            self.preview_effect.set(DragDropEffects::Move);
            self.preview_insertion_slot
                .set(if raw < 0 || source_index < 0 {
                    -1
                } else {
                    normalize_reorder_insertion_index(
                        source_index,
                        raw,
                        self.items.borrow().len() as i32,
                    )
                });
            self.drag_status_message.replace(format!(
                "Reorder drag status: auto-scrolling {}",
                if direction < 0 { "up" } else { "down" }
            ));
        }
        self.sync_all();
    }

    pub(super) fn drop_at_preview(&self, args: DragEventArgs) {
        let Some(item_id) = args.session.data.get_format(REORDER_DRAG_FORMAT) else {
            return;
        };
        if self.raw_insertion_index.get() < 0 {
            return;
        }
        if move_reorder_item(
            &mut self.items.borrow_mut(),
            &item_id,
            self.raw_insertion_index.get(),
        ) {
            let items = self.items.borrow();
            for (index, row) in self.rows.iter().enumerate() {
                row.bind_item(&items[index]);
            }
        }
        self.sync_all();
    }

    pub(super) fn handle_end_drag_over(&self, args: DragEventArgs) -> DropProposal {
        self.preview_insertion(args, self.items.borrow().len() as i32)
    }

    pub(super) fn active_drag_label(&self) -> String {
        self.find_item(self.active_drag_item_id.borrow().as_deref())
            .map(|item| String::from(item.label))
            .unwrap_or_else(|| String::from("item"))
    }

    pub(super) fn find_item(&self, item_id: Option<&str>) -> Option<ReorderDemoItem> {
        let item_id = item_id?;
        let index = find_reorder_item_index(&self.items.borrow(), item_id);
        if index < 0 {
            None
        } else {
            Some(self.items.borrow()[index as usize].clone())
        }
    }
}
