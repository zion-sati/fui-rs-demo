use super::*;
pub(super) fn surface_color() -> u32 {
    if is_dark_mode() {
        rgb(0x11, 0x1c, 0x2c)
    } else {
        rgb(0xff, 0xff, 0xff)
    }
}

pub(super) fn alt_card_color(index: i32) -> u32 {
    if is_dark_mode() {
        if (index & 1) == 0 {
            rgb(0x0f, 0x1a, 0x28)
        } else {
            rgb(0x13, 0x21, 0x33)
        }
    } else if (index & 1) == 0 {
        rgb(0xff, 0xff, 0xff)
    } else {
        rgb(0xf8, 0xfa, 0xfc)
    }
}

pub(super) fn vertical_spacer(height: f32) -> FlexBox {
    let spacer = ui! {
        flex_box().fill_width().height(height, Unit::Pixel)
    };
    spacer
}

pub(super) struct ReorderRowView {
    pub(super) raw_index: i32,
    pub(super) marker: FlexBox,
    pub(super) grip_label: TextNode,
    pub(super) grip: FlexBox,
    pub(super) title_text: TextNode,
    pub(super) detail_text: TextNode,
    pub(super) card: FlexBox,
    pub(super) slot: FlexBox,
}

impl ReorderRowView {
    pub(super) fn bind_item(&self, item: &ReorderDemoItem) {
        self.title_text.text(item.label);
        self.detail_text.text(item.detail);
        self.grip
            .semantic_label(format!("Drag grip for {}", item.label));
        self.card
            .semantic_role(SemanticRole::StaticText)
            .semantic_label(format!(
                "Reorder item {}: {}",
                self.raw_index + 1,
                item.label
            ));
    }

    pub(super) fn apply_theme(
        &self,
        active_item_id: Option<&str>,
        raw_insertion_index: i32,
        item: &ReorderDemoItem,
        theme: &Theme,
    ) {
        let is_source = Some(item.id) == active_item_id;
        let marker_visible = raw_insertion_index == self.raw_index;
        self.marker
            .bg_color(theme.colors.accent)
            .opacity(if marker_visible { 1.0 } else { 0.0 });
        self.card
            .bg_color(if is_source {
                theme.colors.accent_hovered
            } else {
                alt_card_color(self.raw_index)
            })
            .border(
                1.0,
                if is_source {
                    theme.colors.accent
                } else {
                    theme.colors.border
                },
            );
        self.title_text.text_color(if is_source {
            theme.colors.surface
        } else {
            theme.colors.text_primary
        });
        self.detail_text.text_color(if is_source {
            theme.colors.surface
        } else {
            theme.colors.text_muted
        });
        self.grip
            .bg_color(if is_source {
                theme.colors.accent
            } else {
                surface_color()
            })
            .border(
                1.0,
                if is_source {
                    theme.colors.accent_pressed
                } else {
                    theme.colors.border
                },
            )
            .cursor(if is_source {
                CursorStyle::Grabbing
            } else {
                CursorStyle::Grab
            });
        self.grip_label
            .text_color(if is_source {
                theme.colors.surface
            } else {
                theme.colors.text_primary
            })
            .cursor(if is_source {
                CursorStyle::Grabbing
            } else {
                CursorStyle::Grab
            });
    }
}
