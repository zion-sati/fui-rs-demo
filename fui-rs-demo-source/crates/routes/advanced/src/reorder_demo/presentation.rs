use super::*;

impl ReorderDemoState {
    pub(super) fn sync_preview_ghost(&self) {
        let item = self.find_item(self.active_drag_item_id.borrow().as_deref());
        if item.is_none()
            || self.preview_pointer_x.get().is_nan()
            || self.preview_pointer_y.get().is_nan()
        {
            self.preview_ghost
                .visibility(Visibility::Hidden)
                .opacity(0.0);
            return;
        }
        let item = item.unwrap();
        self.preview_title_text.text(item.label);
        self.preview_detail_text.text(item.detail);
        if self.preview_effect.get() == DragDropEffects::Move
            && self.preview_insertion_slot.get() >= 0
        {
            self.preview_effect_text.text(format!(
                "Drop to move to slot {}",
                self.preview_insertion_slot.get() + 1
            ));
        } else {
            self.preview_effect_text
                .text("Release outside the list to cancel");
        }
        let card_width = if self.ghost_card_width.get() > 0.0 {
            self.ghost_card_width.get()
        } else {
            PREVIEW_WIDTH_PX
        };
        self.preview_ghost
            .width(card_width, Unit::Pixel)
            .semantic_label(format!("Reorder drag preview for {}", item.label));
        let section_bounds = self.root.get_bounds();
        let section_width = if section_bounds[2] > 0.0 {
            section_bounds[2]
        } else {
            viewport_width_signal()
                .value()
                .max(PREVIEW_WIDTH_PX + (PREVIEW_MARGIN_PX * 2.0))
        };
        let section_height = if section_bounds[3] > 0.0 {
            section_bounds[3]
        } else {
            viewport_height_signal()
                .value()
                .max(PREVIEW_HEIGHT_PX + (PREVIEW_MARGIN_PX * 2.0))
        };
        let pointer_local = self
            .root
            .absolute_to_local_position(self.preview_pointer_x.get(), self.preview_pointer_y.get());
        let max_x = PREVIEW_MARGIN_PX.max(section_width - card_width - PREVIEW_MARGIN_PX);
        let max_y = PREVIEW_MARGIN_PX.max(section_height - PREVIEW_HEIGHT_PX - PREVIEW_MARGIN_PX);
        let preview_x = (pointer_local[0] + PREVIEW_OFFSET_X_PX).clamp(PREVIEW_MARGIN_PX, max_x);
        let preview_y = (pointer_local[1] + PREVIEW_OFFSET_Y_PX).clamp(PREVIEW_MARGIN_PX, max_y);
        self.preview_ghost.position(preview_x, preview_y);
        self.preview_ghost
            .visibility(Visibility::Normal)
            .opacity(0.96);
    }

    pub(super) fn sync_all(&self) {
        let mut summary = String::from("Reorder order: ");
        for (index, item) in self.items.borrow().iter().enumerate() {
            if index > 0 {
                summary.push_str(" | ");
            }
            summary.push_str(item.label);
        }
        self.order_status_text.text(summary);
        self.drag_status_text
            .text(self.drag_status_message.borrow().clone());
        self.sync_viewport_status();
        self.sync_preview_ghost();
        self.apply_theme(current_theme());
    }

    pub(super) fn apply_theme(&self, theme: Theme) {
        for (index, row) in self.rows.iter().enumerate() {
            row.apply_theme(
                self.active_drag_item_id.borrow().as_deref(),
                self.raw_insertion_index.get(),
                &self.items.borrow()[index],
                &theme,
            );
        }
        self.end_marker.bg_color(theme.colors.accent).opacity(
            if self.raw_insertion_index.get() == self.items.borrow().len() as i32 {
                1.0
            } else {
                0.0
            },
        );
        self.end_drop_zone
            .bg_color(surface_color())
            .border(1.0, theme.colors.border);
        self.order_status_text.text_color(theme.colors.text_primary);
        self.drag_status_text.text_color(theme.colors.text_muted);
        self.viewport_status_text
            .text_color(theme.colors.text_muted);
        self.preview_ghost
            .bg_color(theme.colors.surface)
            .border(
                1.0,
                if self.preview_effect.get() == DragDropEffects::Move {
                    theme.colors.accent
                } else {
                    theme.colors.border
                },
            )
            .drop_shadow(theme.colors.panel_shadow, 0.0, 10.0, 24.0, 0.0);
        self.preview_title_text
            .text_color(theme.colors.text_primary);
        self.preview_detail_text.text_color(theme.colors.text_muted);
        self.preview_effect_text.text_color(
            if self.preview_effect.get() == DragDropEffects::Move {
                theme.colors.accent
            } else {
                theme.colors.text_primary
            },
        );
        self.scroll_box
            .border(1.0, theme.colors.border)
            .bg_color(surface_color());
        self.scroll_box
            .vertical_scrollbar()
            .track_color(theme.colors.scrollbar_track)
            .thumb_color(theme.colors.scrollbar_thumb);
    }
}
